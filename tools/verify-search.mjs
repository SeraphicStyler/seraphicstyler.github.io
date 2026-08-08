/* ============================================================================
   tools/verify-search.mjs — offline checks for the directory search.
   Loads the shipped artifacts (directory-data.js, fd-search.js) and asserts the
   queries a client actually types reach the houses they mean: unaccented
   Vietnamese, district phrasings, taxonomy words, word order. Also prints the
   before/after count for each, where "before" is the old plain-substring
   match, so a regression is visible as a number and not just a red line.
   Run:  node tools/verify-search.mjs
   ========================================================================== */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');

globalThis.window = {};
require(ROOT + '/js/directory-data.js');
require(ROOT + '/js/fd-search.js');
const B = globalThis.window.SS_DIRECTORY, S = globalThis.window.SS_SEARCH;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } };

S.index(B);

/* The behaviour that shipped before this module: lowercase the same five
   fields, substring-match the whole query. Kept here as the baseline. */
function oldHits(q) {
  const f = q.trim().toLowerCase();
  return B.filter(b => (b.n + ' ' + (b.h || '') + ' ' + (b.a || '') + ' ' + (b.no || '') + ' ' + b.area)
    .toLowerCase().includes(f));
}
function hits(q) {
  const t = S.parse(q);
  if (!t.length) return B.slice();
  return B.filter(b => S.test(b._sk, t));
}
function ranked(q) {
  const t = S.parse(q);
  return hits(q).slice().sort((a, b) => S.score(b, t) - S.score(a, t));
}

console.log('\nDirectory: ' + B.length + ' houses\n');

/* — 1. The reported bug: unaccented Vietnamese finds nothing — */
console.log('Unaccented Vietnamese (was: 0 results)');
const VN = [
  ['ao dai', 15], ['phu nhuan', 18], ['thao dien', 12], ['vo van tan', 5],
  ['tran quang dieu', 12], ['ben thanh', 15], ['dong khoi', 5], ['ao cuoi', 1]
];
for (const [q, min] of VN) {
  const before = oldHits(q).length, after = hits(q).length;
  ok(after >= min, `"${q}" — ${before} → ${after} (expected ≥ ${min})`);
}

/* — 2. Districts, however they get written — */
console.log('\nDistricts');
const d3 = hits('d3').length, d1 = hits('d1').length;
for (const q of ['district 3', 'District 3', 'quan 3', 'quận 3', 'q3', 'q.3', 'd3', 'dist 3']) {
  const before = oldHits(q).length;
  ok(hits(q).length === d3, `"${q}" — ${before} → ${hits(q).length} (= d3's ${d3})`);
}
for (const q of ['district 1', 'quan 1', 'q1', 'd1']) {
  ok(hits(q).length === d1, `"${q}" → ${hits(q).length} (= d1's ${d1})`);
}
ok(d3 >= 30, `d3 covers area + address forms — ${d3} houses`);
ok(hits('q10').length >= 3, `"q10" → ${hits('q10').length} (Q10 is not a zone on the map, still findable)`);
/* A ward is not a district. Nothing may be pulled in by "P.5". */
ok(!hits('district 5').some(b => /P\.5/.test(b.a || '') && !/D5|Q\.?5/.test((b.area || '') + (b.a || ''))),
  'ward numbers (P.5) are never read as districts');

/* — 3. Taxonomy the data only stores as codes — */
console.log('\nTaxonomy words');
const tax = [
  ['wedding', 'bridal'], ['bridal', 'bridal'], ['menswear', 'men'], ['activewear', 'active'],
  ['sleepwear', 'sleep'], ['vintage', 'vintage'], ['jewelry', 'access'], ['markets', 'market']
];
for (const [q, cat] of tax) {
  const h = hits(q), inCat = h.filter(b => b.cat === cat).length;
  const all = B.filter(b => b.cat === cat).length;
  ok(inCat === all, `"${q}" reaches all ${all} cat:${cat} houses (${oldHits(q).length} → ${h.length})`);
}
ok(hits('linen').length >= B.filter(b => (b.fib || []).includes('linen')).length,
  `"linen" reaches every fib:linen house (${oldHits('linen').length} → ${hits('linen').length})`);
ok(hits('birthday').length >= B.filter(b => (b.occ || []).includes('bday')).length,
  `"birthday" reaches every occ:bday house (${oldHits('birthday').length} → ${hits('birthday').length})`);
ok(hits('couture').length >= B.filter(b => b.tier === 'couture').length, '"couture" reaches every couture tier');

/* — 4. Word order and filler no longer matter — */
console.log('\nPhrasing');
ok(hits('resel studio').length === hits('studio resel').length && hits('resel studio').length > 0,
  `word order is irrelevant — "resel studio" = "studio resel" = ${hits('resel studio').length}`);
/* Two words from different fields — a name and its street — which no single
   substring can span. This is the shape the old search could not do at all. */
ok(oldHits('moulin dieu').length === 0 && hits('moulin dieu').length === 1,
  `"moulin dieu" (name + street) — ${oldHits('moulin dieu').length} → ${hits('moulin dieu').length}`);
ok(hits('shops in district 3').length === d3, `"shops in district 3" → ${hits('shops in district 3').length} (filler dropped)`);
const lnTd = hits('linen thao dien').length;
ok(lnTd > 0 && lnTd < hits('linen').length && lnTd < hits('thao dien').length,
  `terms AND together — "linen thao dien" → ${lnTd} (of ${hits('linen').length} linen, ${hits('thao dien').length} in Thảo Điền)`);
/* AND also means an honest zero. There is no linen-tagged house in D3, and the
   search must say so rather than fall back to a looser match. */
ok(hits('linen district 3').length === 0, '"linen district 3" → 0, because the directory has none');

/* — 5. Ranking: the house you named comes first — */
console.log('\nRanking');
for (const q of ['resel', 'cocosin', 'huelley', 'mangata']) {
  const top = ranked(q)[0];
  ok(top && S.fold(top.n).includes(S.fold(q)), `"${q}" ranks a name match first — ${top ? top.n : '(none)'}`);
}

/* — 6. Nothing that used to work may stop working — */
console.log('\nNo regressions on the old behaviour');
let kept = 0, lost = [];
for (const b of B) {
  for (const q of [b.n, b.h].filter(Boolean)) {
    const o = oldHits(q).length, n = hits(q).length;
    if (o > 0 && n === 0) lost.push(q + ' (' + o + ' → 0)'); else if (o > 0) kept++;
  }
}
ok(lost.length === 0, `every name/handle that matched before still matches (${kept} checked)` +
  (lost.length ? '\n      lost: ' + lost.slice(0, 10).join(', ') : ''));

/* Accented spellings must keep working for anyone with a VN keyboard. */
const accented = ['áo dài', 'Phú Nhuận', 'Thảo Điền', 'Trần Quang Diệu'];
for (const q of accented) ok(hits(q).length > 0, `accented "${q}" still works — ${hits(q).length}`);

/* — 7. The index is invisible to anything that serialises a record — */
console.log('\nHygiene');
ok(!Object.keys(B[0]).includes('_sk'), '_sk is non-enumerable (tray/route JSON is unchanged)');
ok(JSON.stringify(B[0]).indexOf('_sk') < 0, '_sk never lands in JSON.stringify');
ok(S.parse('').length === 0 && S.parse('   ').length === 0, 'an empty query parses to no terms');
ok(hits('').length === B.length, 'an empty query shows all ' + B.length);
ok(S.parse('!!! ???').length === 0, 'punctuation-only parses to no terms');
const t0 = process.hrtime.bigint();
for (let i = 0; i < 200; i++) hits('linen district 3');
const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 200;
ok(ms < 5, `a full 300-house query costs ${ms.toFixed(2)} ms (budget 5)`);

console.log('\n' + (fail ? '✗ ' + fail + ' failed, ' : '') + pass + ' passed\n');
process.exit(fail ? 1 : 0);
