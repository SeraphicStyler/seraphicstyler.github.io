/* ============================================================================
   tools/verify-route.mjs — offline end-to-end checks for the route optimizer.
   Loads the shipped artifacts (route-solver.js, store-coords.js, directory-data.js)
   and asserts: geocode coverage, cluster tightness, per-district sanity, that
   optimization beats the listed order and (n<=12) is provably optimal, and that
   costs land in a sane band.  Run:  node tools/verify-route.mjs
   ========================================================================== */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ROOT = '/Users/s/Desktop/SeraphicStyler.github.io';
const SS = require(ROOT + '/js/route-solver.js');
globalThis.window = {};
require(ROOT + '/js/directory-data.js');
require(ROOT + '/js/store-coords.js');
const B = globalThis.window.SS_DIRECTORY, CO = globalThis.window.SS_COORDS;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ FAIL: ' + m); } };

function zoneOf(b) {
  if (b.city !== 'SGN') return null; const a = b.area || '';
  if (/Thảo Điền|Thủ Đức/.test(a)) return 'td'; if (/Phú Nhuận/.test(a)) return 'pn';
  if (/Tân Phú/.test(a)) return 'tp'; if (/Tân Bình/.test(a)) return 'tb'; if (/Gò Vấp/.test(a)) return 'gv';
  if (/Bình Thạnh/.test(a)) return 'bt'; if (/Q5|Chợ Lớn|Chợ Quán/.test(a)) return 'q5';
  if (/D1|Đồng Khởi|Bến Thành|Bến Nghé|Tân Định|Đa Kao|Sài Gòn ward|Ký Con/.test(a)) return 'd1';
  if (/D3|Bàn Cờ|Nhiêu Lộc|Võ Thị Sáu/.test(a)) return 'd3'; return 'other';
}
const coord = n => CO[n];
const spread = pts => { let mx = 0; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) mx = Math.max(mx, SS.haversine(pts[i], pts[j])); return mx; };

console.log('\n— 1. Coverage —');
const m = CO._meta;
const walk = B.filter(b => b.city === 'SGN' && b.st === 'walk' && b.a);
const covered = walk.filter(b => coord(b.n)).length;
ok(covered === walk.length, `every walk-in store has a coord (${covered}/${walk.length})`);
ok(m.streetLevel >= 90, `street-level geocodes ${m.streetLevel}/${m.n} (≥90)`);
const withHours = Object.keys(CO).filter(k => k[0] !== '_' && CO[k].hours).length;
console.log(`  ${m.streetLevel} street-level · ${m.districtLevel} district-fallback · ${withHours} with hours`);

console.log('\n— 2. Cluster tightness —');
// Trần Quang Diệu / D3·P.14 design strip should form a tight cluster
const p14 = B.filter(b => /P\.14/.test(b.area || '') && coord(b.n)).map(b => coord(b.n));
ok(p14.length >= 3 && spread(p14) < 2.0, `D3·P.14 strip clustered (${p14.length} shops, spread ${spread(p14).toFixed(2)}km)`);
// three labels at 214 Hai Bà Trưng share one address → near-identical coords
const hbt = ['Huelley Rose', 'Huelley', 'Stress Mama'].map(coord).filter(Boolean);
ok(hbt.length >= 2 && spread(hbt) < 0.6, `214 Hai Bà Trưng co-tenants co-located (spread ${spread(hbt).toFixed(2)}km)`);

console.log('\n— 3. Per-district sanity (pins in plausible boxes) —');
const inBox = (c, la0, la1, lo0, lo1) => c && c.lat >= la0 && c.lat <= la1 && c.lng >= lo0 && c.lng <= lo1;
ok(inBox(coord('Wephobia'), 10.76, 10.79, 106.68, 106.71), 'Wephobia (D1 Bến Thành) in D1 box');
ok(inBox(coord('Kathy Atelier'), 10.77, 10.80, 106.67, 106.70), 'Kathy Atelier (D3) in D3 box');
ok(coord('Nosbyn Studio') && coord('Nosbyn Studio').lng > 106.72, 'Nosbyn Studio (Thảo Điền) sits east (lng>106.72)');

console.log('\n— 4. Optimization on a real D1+D3 shortlist —');
const pick = B.filter(b => (zoneOf(b) === 'd1' || zoneOf(b) === 'd3') && b.st === 'walk' && coord(b.n)).slice(0, 11);
const hub = { n: 'Chợ Bà Chiểu', lat: 10.8016, lng: 106.6967, isHub: true };
const stops = [hub].concat(pick.map(b => { const c = coord(b.n); return { n: b.n, area: b.area, lat: c.lat, lng: c.lng, hours: c.hours }; }));
const plan = SS.solve(stops, { mode: 'bike', startMin: 540, roundTrip: true, dwellMin: 25, originIsStop: false });
ok(plan.totalKm <= plan.improvedFrom.km, `optimized (${plan.totalKm}km) ≤ listed order (${plan.improvedFrom.km}km), −${plan.improvedFrom.pct}%`);
ok(/optimal|heldKarp/.test(plan.method) || stops.length > 13, `small shortlist solved to proven optimum (${plan.method})`);
ok(plan.order[0] === 0, 'start hub fixed at position 0');
ok(new Set(plan.order).size === stops.length, 'valid permutation (each stop once)');
console.log(`  ${stops.length} stops · ${plan.totalKm}km · ${plan.durationText} · finish ${plan.etaText} · ${plan.cost.vnd.toLocaleString('vi-VN')}₫ ($${plan.cost.usd}) · ${plan.method}`);

console.log('\n— 5. Cost band (multi-district day) —');
ok(plan.cost.vnd > 30000 && plan.cost.vnd < 1500000, `Grab fare estimate in sane band: ${plan.cost.vnd.toLocaleString('vi-VN')}₫`);
ok(plan.legs.length === stops.length, `round trip closes the loop (${plan.legs.length} legs for ${stops.length} stops)`);

console.log(`\n${fail === 0 ? '✅ ALL PASS' : '❌ ' + fail + ' FAILED'} — ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
