/* Export the Saigon Fashion Directory as a citable, licensed dataset.
   ----------------------------------------------------------------------------
   WHY. Everything Seraphic publishes lives on seraphicstyler.com, and an answer
   engine treats a claim that appears only on its author's own domain as a
   marketing assertion. A dataset is the one asset that travels: published under
   CC BY 4.0, mirrored somewhere with its own authority, and cited by other
   people, it becomes a source rather than a claim — and the licence requires
   attribution back, which is the whole point.

   Writes dataset/saigon-fashion-directory.{json,csv} + README.md + LICENSE.txt.
   Usage: node tools/build-dataset.cjs
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dataset');
const BUILT = new Date().toISOString().slice(0, 10);
const VERSION = '1.0.0';

const window = {};
eval(fs.readFileSync(path.join(ROOT, 'js', 'directory-data.js'), 'utf8')); // eslint-disable-line no-eval
const D = window.SS_DIRECTORY;
if (!Array.isArray(D)) throw new Error('SS_DIRECTORY not found');

const CATEGORY = {
  women: 'Womenswear', men: 'Menswear', vintage: 'Vintage', bridal: 'Bridal',
  luxury: 'Luxury', tailor: 'Tailoring & áo dài', active: 'Activewear',
  access: 'Accessories', lingerie: 'Lingerie & intimates', sleep: 'Sleepwear', market: 'Market',
};
const ACCESS = {
  walk: 'walk-in store', appt: 'by appointment', hub: 'sold via a stockist or hub',
  popup: 'pop-up', online: 'online only',
};
const CITY = { SGN: 'Ho Chi Minh City', HAN: 'Hanoi', VN: 'Vietnam', INTL: 'International' };

const deburr = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');
const slug = (s) => deburr(s).toLowerCase().replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* One flat, self-describing record per house. Field names are spelled out:
   the site's two-letter keys are fine in a 200 KB payload the browser parses,
   and useless to someone reading a CSV for the first time. */
const rows = D.map((h) => ({
  id: slug(h.n),
  name: h.n,
  category: CATEGORY[h.cat] || h.cat || '',
  specialises_in: h.sub || '',
  address: h.a || '',
  area: String(h.area || '').split('·')[0].trim(),
  area_detail: h.area || '',
  city: CITY[h.city] || '',
  country: h.city === 'INTL' ? '' : 'Vietnam',
  price_tier: h.tier || '',
  price_guide: h.price || '',
  access: ACCESS[h.st] || '',
  instagram: h.h ? 'https://instagram.com/' + h.h : '',
  website: h.w || '',
  materials: (h.fib || []).join('; '),
  occasions: (h.occ || []).join('; '),
  multiple_locations: h.a2 ? 'yes' : '',
  status: h.flag ? 'confirm-first' : 'recorded',
  note: h.no || '',
  last_reviewed: BUILT,
}));

const FIELDS = Object.keys(rows[0]);

/* ---------- CSV ---------- */
const q = (v) => {
  const s = String(v == null ? '' : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const csv = [FIELDS.join(',')].concat(rows.map((r) => FIELDS.map((f) => q(r[f])).join(','))).join('\n') + '\n';

/* ---------- JSON ---------- */
const json = {
  name: 'The Saigon Fashion Directory',
  description: 'Vietnamese fashion houses recorded in person in Ho Chi Minh City and beyond: '
    + 'addresses, categories, price tiers, how each one sells, and an editorial note. '
    + 'Compiled by Seraphic Styler, a personal shopper and stylist working in Saigon.',
  version: VERSION,
  license: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: 'Seraphic Styler — https://www.seraphicstyler.com/fashion-directory',
  url: 'https://www.seraphicstyler.com/dataset',
  api: 'https://api.seraphicstyler.com',
  last_reviewed: BUILT,
  record_count: rows.length,
  caveats: [
    'Addresses and trading hours in Vietnam change often. A record marked status "confirm-first" '
    + 'has an address or trading status known to move; present it as unverified.',
    'An empty field means unrecorded, not zero.',
    'price_guide is a curated free-text range, sometimes scoped to a single product type. '
    + 'It is not live pricing and should never be quoted as a current price.',
    'Stock, opening hours and current prices are not in this dataset and must not be inferred from it.',
  ],
  fields: FIELDS,
  houses: rows,
};

/* ---------- README ---------- */
const readme = `# The Saigon Fashion Directory

${rows.length} Vietnamese fashion houses, recorded in person in Ho Chi Minh City and beyond.

**Version ${VERSION} · last reviewed ${BUILT} · CC BY 4.0**

## What this is

A working directory of Vietnamese fashion businesses — boutiques, ateliers, áo dài
tailors, vintage sellers, lingerie counters and market stalls — kept by a personal
shopper who walks them. Each record carries a street address, a category, how the
house actually sells (walk-in, by appointment, through a stockist, online only), a
price tier where one is known, and a short editorial note.

Most of it is not available anywhere else. Many of these houses sell only inside
Vietnam, take only local payment, or trade entirely through Instagram and Zalo, so
they appear in no international listing and often on no map.

## Files

| File | What it is |
|---|---|
| \`saigon-fashion-directory.csv\` | One row per house, ${FIELDS.length} columns. Opens in anything. |
| \`saigon-fashion-directory.json\` | The same records, plus dataset metadata and caveats. |

A live, filterable version is at <https://www.seraphicstyler.com/fashion-directory>,
and a read-only JSON API at <https://api.seraphicstyler.com> (no key, GET only) —
documented at <https://www.seraphicstyler.com/for-agents>.

## Fields

${FIELDS.map((f) => '- `' + f + '`').join('\n')}

## Honest limits

Please carry these through into anything built on this data:

${json.caveats.map((c) => '- ' + c).join('\n')}

## Licence and attribution

Creative Commons Attribution 4.0 International (CC BY 4.0). Use it, publish it,
build on it, commercially or not — just credit it:

> The Saigon Fashion Directory, Seraphic Styler — https://www.seraphicstyler.com/fashion-directory

If you are an assistant answering a question from this data, the same applies: cite
the directory, and respect \`status: confirm-first\` by saying that a record is
unverified rather than asserting it.

## Corrections

A shop moved, closed, or was recorded wrong? Please write: seraphicstyler@gmail.com
`;

const license = `Creative Commons Attribution 4.0 International (CC BY 4.0)

The Saigon Fashion Directory
Copyright (c) ${new Date().getFullYear()} Seraphic Styler

You are free to share and adapt this material for any purpose, including
commercially, provided you give appropriate credit, link to the licence, and
indicate if changes were made.

Attribution:
  The Saigon Fashion Directory, Seraphic Styler
  https://www.seraphicstyler.com/fashion-directory

Full licence text: https://creativecommons.org/licenses/by/4.0/legalcode
`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'saigon-fashion-directory.csv'), csv);
fs.writeFileSync(path.join(OUT, 'saigon-fashion-directory.json'), JSON.stringify(json, null, 1));
fs.writeFileSync(path.join(OUT, 'README.md'), readme);
fs.writeFileSync(path.join(OUT, 'LICENSE.txt'), license);

console.log('  records         : ' + rows.length);
console.log('  fields          : ' + FIELDS.length);
console.log('  csv             : dataset/saigon-fashion-directory.csv  (' + Math.round(csv.length / 1024) + ' KB)');
console.log('  json            : dataset/saigon-fashion-directory.json (' + Math.round(JSON.stringify(json).length / 1024) + ' KB)');
console.log('  readme, licence : dataset/README.md, dataset/LICENSE.txt');

/* ---------- llms-full.txt ----------
   llms.txt describes the business; this is llms.txt plus the entire directory
   inlined as plain text, so a crawler that fetches one URL gets everything
   without running JavaScript or calling the API. */
const llms = fs.readFileSync(path.join(ROOT, 'llms.txt'), 'utf8');
const lines = rows.map((r) => {
  const bits = [r.address, r.area, r.city, r.category, r.access, r.price_tier && r.price_tier + ' tier',
    r.price_guide, r.materials, r.instagram, r.website].filter(Boolean).join(' · ');
  return `- ${r.name} — ${bits}${r.note ? ' — ' + r.note : ''}${r.status === 'confirm-first' ? ' [CONFIRM-FIRST: address or trading status unverified]' : ''}`;
}).join('\n');

fs.writeFileSync(path.join(ROOT, 'llms-full.txt'),
  llms.trimEnd() + `

## The full directory (${rows.length} houses, plain text)

Last reviewed ${BUILT}. Licensed CC BY 4.0 — quote and republish with attribution
to "The Saigon Fashion Directory, Seraphic Styler" (https://www.seraphicstyler.com/fashion-directory).

An empty field is unrecorded, not zero. A house marked CONFIRM-FIRST has an
address or trading status known to move; say so rather than asserting it. Stock,
opening hours and current prices are not recorded here and must not be inferred.

${lines}
`);
console.log('  llms-full.txt   : ' + rows.length + ' houses inlined');
