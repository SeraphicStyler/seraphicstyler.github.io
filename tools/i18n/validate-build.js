/* Validate every translated bundle against the English source, then compile
   the survivors into js/i18n/<page>.<lang>.js for the site.

   Checks per key:
     - key set identical to English (no missing, no extra)
     - {placeholder} multiset identical
     - inline HTML tag sequence identical (names + attributes)
     - value non-empty, and not silently identical to English for prose strings
     - no stray markdown fence / smart-quote corruption of href attrs
*/
const fs = require('fs');
const path = require('path');
const S = __dirname;   /* sources live beside this script */
const REPO = path.resolve(__dirname, '..', '..');
const OUT = path.join(REPO, 'js', 'i18n');
const LANGS = ['vi','zh','es','ar','fr','pt','ru','ja','de','ko','hi','id','th','it','tr','tl','pl','nl','fa','zgh'];
const PAGES = ['fd','fg'];

const EN = { fd: JSON.parse(fs.readFileSync(S + '/fd.en.json', 'utf8')),
             fg: JSON.parse(fs.readFileSync(S + '/fg.en.json', 'utf8')) };

const ph  = s => [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join('|');
/* tag signature: names + the attributes that must survive verbatim */
const tags = s => [...String(s).matchAll(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g)]
  .map(m => m[1] + m[2].toLowerCase() + (m[3].match(/href="[^"]*"/) || [''])[0]
                       + (m[3].match(/class="[^"]*"/) || [''])[0]).join('|');

const report = [];
let hardFail = 0;
const good = {};   // lang -> Set(pages that validated)

for (const lang of LANGS) {
  good[lang] = new Set();
  for (const page of PAGES) {
    const f = `${S}/out/${lang}/${page}.json`;
    if (!fs.existsSync(f)) { report.push(`MISSING  ${lang}/${page}.json`); hardFail++; continue; }
    let d;
    try { d = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { report.push(`BADJSON  ${lang}/${page}: ${e.message}`); hardFail++; continue; }

    const en = EN[page];
    const enK = Object.keys(en), dK = Object.keys(d);
    const missing = enK.filter(k => !(k in d));
    const extra   = dK.filter(k => !(k in en));
    const empty   = enK.filter(k => k in d && !String(d[k]).trim());
    const phBad   = enK.filter(k => k in d && ph(en[k]) !== ph(d[k]));
    const tagBad  = enK.filter(k => k in d && tags(en[k]) !== tags(d[k]));
    const fence   = enK.filter(k => k in d && /^```|```$/.test(String(d[k])));
    /* prose (>6 words) that came back byte-identical to English = probably skipped */
    const untouched = enK.filter(k => k in d &&
        String(en[k]).replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length > 6 &&
        d[k] === en[k]);

    const errs = [];
    if (missing.length) errs.push(`missing ${missing.length} (${missing.slice(0,3)})`);
    if (extra.length)   errs.push(`extra ${extra.length} (${extra.slice(0,3)})`);
    if (empty.length)   errs.push(`empty ${empty.length} (${empty.slice(0,3)})`);
    if (phBad.length)   errs.push(`placeholder ${phBad.length} (${phBad.slice(0,3)})`);
    if (tagBad.length)  errs.push(`html ${tagBad.length} (${tagBad.slice(0,3)})`);
    if (fence.length)   errs.push(`fence ${fence.length}`);

    if (errs.length) { report.push(`FAIL     ${lang}/${page}: ${errs.join(' | ')}`); hardFail++; }
    else {
      good[lang].add(page);
      report.push(`ok       ${lang}/${page}  ${dK.length} keys` +
        (untouched.length ? `  (note: ${untouched.length} prose strings identical to EN)` : ''));
    }
  }
}

/* Per-page availability: a language is offered on the page it is complete on, and
   nowhere else. A preference the other page can't honour renders English there
   without being overwritten (see js/i18n-page.js). */
const SHIPPED = {};
for (const page of PAGES) SHIPPED[page] = LANGS.filter(l => good[l].has(page));
const anyShipped = [...new Set(PAGES.flatMap(p => SHIPPED[p]))];

console.log(report.filter(r => !r.startsWith('MISSING')).join('\n'));
console.log(`\nmissing files: ${report.filter(r => r.startsWith('MISSING')).length}`);
for (const page of PAGES)
  console.log(`shipped on ${page}:`, SHIPPED[page].length ? SHIPPED[page].join(' ') : '(none)');

if (process.argv[2] === '--build') {
  /* Deltas: strings that live in JS widgets rather than the page markup, translated
     separately so the main bundles stay stable.
       delta.all.json  — 14 screen-reader labels
       delta2.all.json — route planner (fd.rp.*) + discover card (db.*)
     `db.*` is page-agnostic: the discover card appears on both pages, so it goes in both. */
  const loadDelta = (name, warn) => {
    if (fs.existsSync(`${S}/${name}`)) return JSON.parse(fs.readFileSync(`${S}/${name}`, 'utf8'));
    console.log(`\nWARNING: ${name} missing — ${warn} will fall back to English`);
    return {};
  };
  const delta  = loadDelta('delta.all.json',  'ARIA labels');
  const delta2 = loadDelta('delta2.all.json', 'route planner + discover card');
  const forPage = (obj, lang, page) => Object.entries(obj[lang] || {})
    .filter(([k]) => k.startsWith(page + '.') || k.startsWith('db.'));

  fs.mkdirSync(OUT, { recursive: true });
  let total = 0;
  for (const page of PAGES) for (const lang of SHIPPED[page]) {
    const d = JSON.parse(fs.readFileSync(`${S}/out/${lang}/${page}.json`, 'utf8'));
    /* fold in this page's widget strings */
    for (const [k, v] of forPage(delta,  lang, page)) d[k] = v;
    for (const [k, v] of forPage(delta2, lang, page)) d[k] = v;
    /* the field guide's language-selector labels are the same words as the directory's */
    if (page === 'fg' && fs.existsSync(`${S}/out/${lang}/fd.json`)) {
      const fd = JSON.parse(fs.readFileSync(`${S}/out/${lang}/fd.json`, 'utf8'));
      if (fd['fd.langlabel']) d['fg.langlabel'] = fd['fd.langlabel'];
      if (fd['fd.langtitle']) d['fg.langtitle'] = fd['fd.langtitle'];
    }
    const body = `/* Seraphic Styler — ${page} strings, ${lang}. Generated; edit the source bundle, not this file. */\n`
      + `SS_I18N_ADD(${JSON.stringify(page)},${JSON.stringify(lang)},${JSON.stringify(d)});\n`;
    const dest = `${OUT}/${page}.${lang}.js`;
    fs.writeFileSync(dest, body);
    total += Buffer.byteLength(body);
  }
  /* The manifest is the single source of truth for what each selector may offer. */
  fs.writeFileSync(`${OUT}/manifest.js`,
    `/* Generated by tools/i18n/validate-build.js — do not edit.\n` +
    `   Languages with a validated bundle, per page. The selector shows only these. */\n` +
    `window.SS_I18N_AVAILABLE=${JSON.stringify(SHIPPED)};\n`);

  /* Stale bundles from a previous build must not linger and re-offer a language. */
  for (const f of fs.readdirSync(OUT)) {
    const m = f.match(/^(fd|fg)\.([a-z]{2})\.js$/);
    if (m && !SHIPPED[m[1]].includes(m[2])) { fs.unlinkSync(`${OUT}/${f}`); console.log('pruned stale bundle', f); }
  }

  if (!anyShipped.length) {
    console.log('\nbuilt manifest only — no language validated, so both selectors hide');
    console.log('themselves and the pages serve English. Nothing misleading ships.');
  } else {
    const sizes = [];
    for (const page of PAGES) for (const l of SHIPPED[page]) sizes.push(fs.statSync(`${OUT}/${page}.${l}.js`).size);
    const n = PAGES.reduce((a, p) => a + SHIPPED[p].length, 0);
    console.log(`\nbuilt ${n} bundle(s) into js/i18n/ — ${(total/1024).toFixed(0)}KB total`);
    console.log(`each reader downloads one: ${(Math.min(...sizes)/1024).toFixed(1)}–${(Math.max(...sizes)/1024).toFixed(1)}KB (vs 597KB translations.js before)`);
  }
}
process.exit(0);
