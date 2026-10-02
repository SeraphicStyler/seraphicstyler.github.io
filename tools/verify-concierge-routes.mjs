#!/usr/bin/env node
/* Fail when a concierge "Recommended next step" links somewhere that does not exist.
   Resolves every action href the way the homepage would: '#id' is an index.html
   anchor, 'name'/'name#id' resolves to name.html in the repo root (a '.html'
   suffix or '?query' is handled), and anchor targets must carry a matching id. */
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { topics } from '../js/concierge-content.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = readFileSync(join(ROOT, 'index.html'), 'utf8');
const pageCache = { 'index.html': indexHtml };
const page = file => pageCache[file] || (pageCache[file] = existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), 'utf8') : null);

let failures = 0;
const fail = m => { failures++; console.log('  ✗ ' + m); };

for (const [topic, record] of Object.entries(topics)) {
  for (const [label, raw] of record.actions) {
    if (raw.includes('sourcingandstyling')) fail(`${topic}: "${label}" still points at sourcingandstyling`);
    const href = raw.split('?')[0];
    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (!indexHtml.includes(`id="${id}"`)) fail(`${topic}: "${label}" -> index.html has no id="${id}"`);
      continue;
    }
    const [name, anchor] = href.split('#');
    const file = name.endsWith('.html') ? name : name + '.html';
    const html = page(file);
    if (!html) { fail(`${topic}: "${label}" -> ${file} not found`); continue; }
    if (anchor && !html.includes(`id="${anchor}"`)) fail(`${topic}: "${label}" -> ${file} has no id="${anchor}"`);
  }
}

if (failures) { console.log(`\n${failures} concierge route(s) broken`); process.exit(1); }
const count = Object.values(topics).reduce((n, r) => n + r.actions.length, 0);
console.log(`PASS concierge routes: ${count} actions across ${Object.keys(topics).length} topics resolve to real pages and anchors, none via sourcingandstyling`);
