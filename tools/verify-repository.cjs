/* Check local runtime dependencies after moving or removing source files. */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const skipped = new Set(['.git', 'node_modules', '.wrangler', 'social', 'docs']);
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skipped.has(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
const errors = [], all = files(root);
let assets = 0, scripts = 0;
function check(from, target) {
  if (!target || /^(?:[a-z]+:|\/\/|#)/i.test(target) || /[{}$]/.test(target)) return;
  const local = decodeURIComponent(target.split(/[?#]/)[0]);
  const resolved = path.resolve(local.startsWith('/') ? root : path.dirname(from), local.replace(/^\//, ''));
  assets++;
  if (!fs.existsSync(resolved)) errors.push(path.relative(root, from) + ': missing ' + target);
}
for (const file of all) {
  if (file.endsWith('.html')) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) check(file, match[1]);
    for (const match of text.matchAll(/<link\b[^>]*>/gi)) {
      if (/rel=["']stylesheet["']/i.test(match[0])) check(file, match[0].match(/href=["']([^"']+)["']/i)?.[1]);
    }
  }
  if (/\.(?:js|cjs|mjs)$/.test(file) && !file.includes(path.sep + 'vendor' + path.sep)) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    scripts++;
    if (result.status !== 0) errors.push(path.relative(root, file) + ': ' + result.stderr.trim());
  }
}
// Offline precache paths must also survive cleanup; extensionless paths resolve to HTML.
const worker = fs.readFileSync(path.join(root, 'service-worker.js'), 'utf8');
const core = worker.match(/const CORE = \[([\s\S]*?)\];/)[1];
for (const match of core.matchAll(/'([^']+)'/g)) {
  const target = match[1].split('?')[0];
  if (!fs.existsSync(path.join(root, target)) && !fs.existsSync(path.join(root, target + '.html'))) errors.push('service-worker.js: missing ' + target);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`PASS repository: ${assets} local asset references, ${scripts} scripts, offline precache paths.`);
