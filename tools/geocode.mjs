/* ============================================================================
   tools/geocode.mjs — ONE-TIME build tool (not shipped to the browser).
   Geocodes the Saigon walk-in boutiques in js/directory-data.js to street-level
   lat/lng via OpenStreetMap Nominatim, and writes js/store-coords.js.

   Nominatim lacks house-number precision for most HCMC streets, so we query at
   STREET level (street + ward/district + city) — the right resolution for route
   ordering (a shop sits within ~100–300 m of its street). Stores that still miss
   fall back to their district centroid, tagged approx:"district".

   Run:  node tools/geocode.mjs         (≈3–5 min; polite 1.15 s/req throttle)
   ProTip: re-runnable; overwrites js/store-coords.js.
   ========================================================================== */
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = '/Users/s/Desktop/SeraphicStyler.github.io';
const SS = require(ROOT + '/js/route-solver.js');
globalThis.window = {};
require(ROOT + '/js/directory-data.js');
const B = globalThis.window.SS_DIRECTORY;

const UA = { headers: { 'User-Agent': 'seraphicstyler-geocode/1.0 (greglai12345@gmail.com)' } };
const BOX = [10.68, 10.90, 106.60, 106.85]; // HCMC bounding box [minLat,maxLat,minLng,maxLng]
const inBox = (la, lo) => la >= BOX[0] && la <= BOX[1] && lo >= BOX[2] && lo <= BOX[3];
const strip = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// District centroids (fallback + wrong-city sanity gate)
const CENTROID = {
  'District 1': { lat: 10.775, lng: 106.700 }, 'District 3': { lat: 10.782, lng: 106.686 },
  'Phú Nhuận': { lat: 10.797, lng: 106.678 }, 'Bình Thạnh': { lat: 10.803, lng: 106.703 },
  'Thảo Điền': { lat: 10.803, lng: 106.740 }, 'District 5': { lat: 10.755, lng: 106.667 },
  'Gò Vấp': { lat: 10.838, lng: 106.667 }, 'Tân Bình': { lat: 10.800, lng: 106.653 },
  'Tân Phú': { lat: 10.790, lng: 106.628 }, 'District 7': { lat: 10.735, lng: 106.720 },
  'District 10': { lat: 10.773, lng: 106.667 }, 'District 6': { lat: 10.746, lng: 106.635 },
  'Ho Chi Minh City': { lat: 10.776, lng: 106.700 }
};

function streetOf(addr) {
  let a = (addr || '').split(/\s*[+·]\s*/)[0].trim();
  for (let i = 0; i < 3; i++) a = a.replace(/^(Rm\.?\s*\S+,?\s*|\d+F,?\s*|Lầu\s*\d+,?\s*|Tầng\s*\d+,?\s*|Số\s+)/i, '');
  a = a.replace(/^\d+[A-Za-z]?(\/\d+[A-Za-z]?)?\s+/, '');   // leading house number 214 / 149/19 / 523A
  a = a.replace(/^\d+\S*,\s*/, '');
  return a.trim();
}
function districtOf(area) {
  const a = area || '';
  if (/Thảo Điền|Thủ Đức/.test(a)) return 'Thảo Điền';
  if (/Phú Nhuận/.test(a)) return 'Phú Nhuận';
  if (/Tân Phú/.test(a)) return 'Tân Phú';
  if (/Tân Bình/.test(a)) return 'Tân Bình';
  if (/Gò Vấp/.test(a)) return 'Gò Vấp';
  if (/Bình Thạnh/.test(a)) return 'Bình Thạnh';
  if (/Q5|Chợ Lớn|Chợ Quán/.test(a)) return 'District 5';
  if (/D6/.test(a)) return 'District 6';
  if (/D7/.test(a)) return 'District 7';
  if (/D10|Q10/.test(a)) return 'District 10';
  if (/D3|Bàn Cờ|Nhiêu Lộc|Võ Thị Sáu|Xuân Hòa/.test(a)) return 'District 3';
  if (/D1|Đồng Khởi|Bến Thành|Bến Nghé|Tân Định|Đa Kao|Sài Gòn ward|Ký Con|Đông Du/.test(a)) return 'District 1';
  return 'Ho Chi Minh City';
}
function wardTail(area) { const p = (area || '').split('·')[1]; if (!p) return null; const w = p.trim(); return /^P\.?\s*\d+$/i.test(w) ? null : w; }
function hoursOf(note) { const h = SS.parseHours(note || ''); return h ? (note.match(/(\d{1,2})[:h](\d{2})\s*[–\-—]\s*(\d{1,2})[:h](\d{2})/)[0]).replace(/h/, ':') : undefined; }

async function geo(q) {
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&q=' + encodeURIComponent(q);
  try { const r = await fetch(url, UA); const j = await r.json(); return j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null; }
  catch (e) { console.error('  net error:', e.message); return null; }
}

async function main() {
  const walk = B.filter(b => b.city === 'SGN' && b.st === 'walk' && b.a);
  console.log(`Geocoding ${walk.length} Saigon walk-in stores…\n`);
  const out = {};
  let street = 0, fallback = 0, withHours = 0;
  const notes = [];

  for (const b of walk) {
    const s = streetOf(b.a), dist = districtOf(b.area), ward = wardTail(b.area);
    const ctr = CENTROID[dist] || CENTROID['Ho Chi Minh City'];
    const queries = [];
    if (ward) queries.push(`${s}, ${ward}, Ho Chi Minh City`);
    queries.push(`${s}, ${dist}, Ho Chi Minh City`);
    queries.push(`${s}, Ho Chi Minh City`);
    queries.push(`Đường ${s}, ${dist}, Ho Chi Minh City`);
    queries.push(strip(`${s}, ${dist}, Ho Chi Minh City`));

    let hit = null;
    for (const q of queries) {
      const r = await geo(q);
      await sleep(1150);
      if (r && inBox(r.lat, r.lng) && SS.haversine(r, ctr) <= 5.0) { hit = r; break; }
    }
    const hours = hoursOf(b.no);
    if (hit) { out[b.n] = { lat: +hit.lat.toFixed(5), lng: +hit.lng.toFixed(5) }; street++; }
    else { out[b.n] = { lat: ctr.lat, lng: ctr.lng, approx: 'district' }; fallback++; notes.push(`${b.n} → ${dist} centroid`); }
    if (hours) { out[b.n].hours = hours; withHours++; }
    process.stdout.write(hit ? '.' : '✗');
  }
  console.log('\n');

  // deterministic, name-sorted output for clean diffs
  const keys = Object.keys(out).sort((a, b) => a.localeCompare(b));
  const today = new Date().toISOString().slice(0, 10);
  let js = `/* ============ STORE COORDINATES — built by tools/geocode.mjs ============
   Street-level lat/lng for the Saigon walk-in boutiques, keyed by directory name.
   Source: OpenStreetMap Nominatim. approx:"district" = fell back to district
   centroid (no street match). DO NOT hand-edit coords — re-run the tool instead.
   Built ${today} · ${street} street-level · ${fallback} district-level · ${keys.length} total */
window.SS_COORDS = {\n`;
  for (const k of keys) {
    const c = out[k];
    const parts = [`lat:${c.lat}`, `lng:${c.lng}`];
    if (c.approx) parts.push(`approx:${JSON.stringify(c.approx)}`);
    if (c.hours) parts.push(`hours:${JSON.stringify(c.hours)}`);
    js += `  ${JSON.stringify(k)}: {${parts.join(', ')}},\n`;
  }
  js += `  _meta: {built:${JSON.stringify(today)}, src:"nominatim", n:${keys.length}, streetLevel:${street}, districtLevel:${fallback}, box:[${BOX.join(',')}]}\n};\n`;
  js += `if (typeof module !== 'undefined' && module.exports) module.exports = window.SS_COORDS;\n`;
  fs.writeFileSync(ROOT + '/js/store-coords.js', js);

  console.log(`✔ wrote js/store-coords.js`);
  console.log(`  ${street} street-level · ${fallback} district-centroid fallback · ${withHours} with opening hours`);
  if (notes.length) console.log('  fallbacks:\n   ' + notes.join('\n   '));
}
main();
