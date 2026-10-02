/* Prices stay single-sourced and in agreement across every surface.
   No payment, inquiry or external request is made.
     SS_PUPPETEER=/path/to/puppeteer node tools/verify-pricing.cjs
   Needs the local preview (node tools/serve.mjs 8731) and python3.

   1. Static: /prices and /boutique-calculator were generated from the
      current js/pricing.js; the menu holds no hard-coded tier prices; the
      estimators' fallback literals and the homepage cards match the data.
   2. Change a fee: regenerating from an edited copy of the data moves the
      figures on /prices and the calculator page, and the menu and calculators
      follow the edited data at runtime.
   3. Browser: the menu, /prices and /boutique-calculator render the same
      tier table and the same boutique quote; the audience switch persists
      across pages and respects deep links; ?budget/&pieces prefill both the
      embedded and the standalone calculator; no overflow at 320–1440. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function loadPricing(src) {
  const sandbox = { window: {}, location: { search: '', pathname: '/', hash: '', origin: 'http://x' }, URLSearchParams, CustomEvent: class {} };
  sandbox.window.addEventListener = () => {}; sandbox.addEventListener = () => {};
  vm.runInNewContext(src.replace(/window\.addEventListener/g, 'addEventListener'), sandbox);
  return sandbox.window.SS_PRICING;
}
const strip = html => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

(async () => {
  /* ---- 1. Static agreement ------------------------------------------------ */
  const src = read('js/pricing.js');
  const P = loadPricing(src), D = P.data, F = P.fmt;
  const hash = execFileSync('python3', ['-c', 'import sys; sys.path.insert(0, "tools"); import pricing_data; print(pricing_data.data_hash())'], { cwd: root }).toString().trim();
  for (const page of ['prices.html', 'boutique-calculator.html'])
    assert(read(page).includes(`<meta name="ss-pricing-data" content="${hash}"`), page + ' is stale: run python3 tools/build-prices.py && python3 tools/build-boutique-calc.py');
  const prices = read('prices.html');
  // The same table, character for character, as the menu draws at runtime.
  const tableJs = P.html.stylingTable(t => `service-request.html?service=styling&tier=${t.id}`);
  assert(prices.includes(tableJs), '/prices styling table differs from js/pricing.js html.stylingTable()');
  for (const t of D.styling) assert(prices.includes(F.hUsd(t.totalUsd)), 'tier missing on /prices: ' + t.name);
  assert(!/\bBooking\b/.test(strip(prices)), '"Booking" column survives on /prices');
  const guide = read('js/service-guide.js');
  for (const t of D.styling) assert(!guide.includes(F.usd0(t.totalUsd) + "'") && !guide.includes("'" + F.usd0(t.totalUsd)), 'hard-coded tier price in js/service-guide.js: ' + t.name);
  assert(!/'\$\d/.test(guide), 'hard-coded dollar figure in js/service-guide.js');
  // Estimator fallbacks equal the data (they are overridden at runtime, but must not drift).
  const est = read('js/estimator.js');
  for (const t of D.styling.filter(t => ['edit', 'capsule', 'atelier'].includes(t.id)))
    assert(new RegExp(t.id + ':\\s*\\{ vnd: ' + t.totalUsd * D.fx.vndPerUsd + ',\\s*credit: ' + t.creditUsd * D.fx.vndPerUsd).test(est), 'js/estimator.js fallback for ' + t.id);
  assert(est.includes('minFee: ' + D.sourcing.minFeeVnd) && est.includes('baseFee: ' + D.sourcing.orderFeeVnd), 'js/estimator.js fee fallback');
  const btq = read('js/boutique-estimator.js');
  assert(btq.includes('scoutFeeVnd: ' + D.boutique.scoutUsd * D.fx.vndPerUsd) && btq.includes('perPieceMinUsd: ' + D.boutique.perPieceUsd) && btq.includes('pct: ' + D.boutique.pct), 'js/boutique-estimator.js fallback');
  // Homepage cards and their checkout links.
  const index = read('index.html');
  for (const t of D.styling.slice(0, 4)) {
    assert(index.includes(`${t.name.replace(/^The /, 'The ')} — ${F.usd0(t.totalUsd)}`), 'homepage card price: ' + t.name);
    assert(index.includes(D.stripe[t.id]), 'homepage checkout link: ' + t.name);
  }
  assert(index.includes(D.stripe.trace) && index.includes(D.stripe.scout), 'homepage Trace / scouting links');
  // The internal fee calculator keeps its own defaults; they must match the data.
  const feeCalc = read('fee-calc.html').match(/var DEFAULTS = \{([^}]*)\}/)[1];
  assert(feeCalc.includes('xfer: ' + (D.sourcing.transferPct * 100).toFixed(1)) && feeCalc.includes('fx: ' + D.fx.vndPerUsd) && feeCalc.includes('fixed: ' + D.card.fixedUsd.toFixed(2)), 'fee-calc.html defaults differ from js/pricing.js');
  console.log('PASS static: pages generated from current data, one table, no hard-coded menu prices, estimator fallbacks, homepage cards and Stripe links');

  /* ---- 2. Change one fee ---------------------------------------------------- */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-pricing-'));
  const edited = src.replace('"feeUsd": 135', '"feeUsd": 136').replace('"totalUsd": 235', '"totalUsd": 236').replace('"scoutUsd": 250', '"scoutUsd": 260');
  assert.notEqual(edited, src);
  fs.writeFileSync(path.join(tmp, 'pricing.js'), edited);
  const env = { ...process.env, SS_PRICING_SRC: path.join(tmp, 'pricing.js'), SS_PRICES_OUT: path.join(tmp, 'prices.html'), SS_CALC_OUT: path.join(tmp, 'calc.html') };
  execFileSync('python3', ['tools/build-prices.py'], { cwd: root, env }); execFileSync('python3', ['tools/build-boutique-calc.py'], { cwd: root, env });
  const p2 = fs.readFileSync(path.join(tmp, 'prices.html'), 'utf8'), c2 = fs.readFileSync(path.join(tmp, 'calc.html'), 'utf8');
  const E = loadPricing(edited);
  assert(p2.includes(E.html.stylingTable(t => `service-request.html?service=styling&tier=${t.id}`)) && p2.includes(E.fmt.hUsd(136)) && p2.includes(E.fmt.hUsd(236)), 'edited Edit fee reaches /prices');
  assert(c2.includes('$260') && !c2.includes('$250'), 'edited scouting fee reaches /boutique-calculator');
  console.log('PASS change one fee: /prices and /boutique-calculator regenerate with the edited figures');

  /* ---- 3. Browser ----------------------------------------------------------- */
  const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const go = async (u, w = 1280) => { await page.setViewport({ width: w, height: 900 }); await page.goto(origin + u, { waitUntil: 'networkidle2' }); };
    const clear = () => page.evaluate(() => { localStorage.removeItem('ss-audience'); localStorage.removeItem('ss-menu-audience'); });
    const view = () => page.evaluate(() => document.body.dataset.audience);
    const calcTotal = sel => page.$eval(sel + ' [data-out="total"]', e => e.textContent.trim());
    const q = P.boutiqueQuote(2000, 20, false);

    // The menu, /prices and /boutique-calculator agree.
    await go('/index.html'); await clear(); await go('/index.html');
    await page.click('.ss-guide-launch'); await page.waitForFunction(() => document.querySelector('.ss-guide').open);
    await page.click('[data-view="prices"]');
    const menuTable = await page.$eval('[data-prices] .price-table', e => e.outerHTML);
    await go('/prices');
    const pageTable = await page.$eval('#styling .price-table', e => e.outerHTML);
    const norm = h => h.replace(/ href="[^"]*"/g, '');
    assert.equal(norm(menuTable), norm(pageTable), 'menu and /prices tier tables differ');
    assert.equal(await view(), 'individual');
    assert(await page.$eval('.pr-secnav', e => !e.hidden));
    await go('/prices?for=boutiques&budget=2000&pieces=20');
    assert.equal(await view(), 'boutique', '?for=boutiques opens the boutiques view');
    assert(await page.$eval('.pr-secnav', e => e.hidden), 'section nav hidden in the boutiques view');
    assert.equal(await page.$eval('#prices-calc [data-bc="budget"]', e => e.value), '2000', 'embedded calculator prefills budget');
    assert.equal(await calcTotal('#prices-calc'), F.usd0(q.total) + ' + shipping');
    assert.equal(await page.$eval('#prices-calc [data-out="s2math"]', e => e.textContent), `Pieces ${F.usd0(2000)} + half the buying fee ${F.usd0(q.half)}`, 'payment row shows its math');
    await go('/boutique-calculator?budget=2000&pieces=20');
    assert.equal(await calcTotal('#bcalc-page'), F.usd0(q.total) + ' + shipping', 'standalone calculator agrees');
    assert.equal(await page.$eval('#bcalc-page [data-bc="pieces"]', e => e.placeholder), 'Roughly is fine, e.g. 10 styles × 3');

    // Persistence across pages, deep links, the cross-link and keyboard.
    await go('/prices'); assert.equal(await view(), 'boutique', 'boutique view persisted from the calculator page');
    await go('/index.html'); await page.click('.ss-guide-launch'); await page.waitForFunction(() => document.querySelector('.ss-guide').open);
    assert.equal(await page.$eval('.ss-audience [data-aud="boutique"]', e => e.getAttribute('aria-pressed')), 'true', 'menu follows the stored choice');
    assert.equal(await page.$eval('[data-bcalc-menu] [data-out="total"]', e => e.textContent.trim()), F.usd0(P.boutiqueQuote(D.boutique.defaults.budget, D.boutique.defaults.pieces).total) + ' + shipping');
    await page.click('.ss-audience [data-aud="individual"]');
    await go('/prices'); assert.equal(await view(), 'individual', 'menu choice persists to /prices');
    await page.click('.pr-cross--top a'); assert.equal(await view(), 'boutique', 'cross-link opens boutique pricing');
    await page.focus('#tab-boutiques'); await page.keyboard.press('ArrowLeft');
    assert.equal(await view(), 'individual', 'arrow keys switch views');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-individuals');
    assert.equal(await page.$eval('#tab-individuals', e => e.getAttribute('aria-selected')), 'true');
    await go('/prices?for=individuals'); assert.equal(await view(), 'individual');
    await go('/prices#boutique'); assert.equal(await view(), 'boutique', 'old #boutique anchor opens the boutiques view');
    await go('/prices?for=individuals#gift'); assert(await page.$('#styling #gift'), 'gift callout lives inside Styling');

    // Scrollspy marks the section in view.
    await go('/prices?for=individuals');
    await page.$eval('#styling', e => e.scrollIntoView({ block: 'start' }));
    await page.waitForFunction(() => document.querySelector('.pr-secnav a[aria-current]')?.hash === '#styling', { timeout: 3000 });

    // Change a fee at runtime: the menu and both calculators follow the data.
    await page.setRequestInterception(true);
    const editedSrc = src.replace('"feeUsd": 135', '"feeUsd": 136').replace('"scoutUsd": 250', '"scoutUsd": 260');
    const swap = r => r.url().includes('/js/pricing.js') ? r.respond({ status: 200, contentType: 'application/javascript', body: editedSrc }) : r.continue();
    page.on('request', swap);
    await go('/index.html'); await clear(); await go('/index.html');
    await page.click('.ss-guide-launch'); await page.waitForFunction(() => document.querySelector('.ss-guide').open); await page.click('[data-view="prices"]');
    assert((await page.$eval('[data-prices] .price-table', e => e.textContent)).includes('$136'), 'menu follows an edited fee');
    await go('/boutique-calculator?budget=3000&pieces=30');
    assert.equal(await calcTotal('#bcalc-page'), '$3,710 + shipping', 'calculator follows an edited scouting fee');
    page.off('request', swap); await page.setRequestInterception(false);

    // Responsive: no overflow in either view.
    for (const w of [320, 390, 768, 1440]) for (const u of ['/prices?for=individuals', '/prices?for=boutiques', '/boutique-calculator']) {
      await go(u, w); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'overflow ' + u + ' at ' + w);
    }
    await clear();
    assert.deepEqual(errors, []);
    console.log('PASS browser: menu = /prices = calculator, persistence, deep links, prefill, cross-link, keyboard, scrollspy, runtime data, 320–1440');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
