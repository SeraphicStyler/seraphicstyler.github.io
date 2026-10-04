'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
const out = process.env.SS_LOCALE_OUT || '';
const filter = process.env.SS_LOCALE_FILTER ? new RegExp(process.env.SS_LOCALE_FILTER) : null;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const rates = { USD: 1, VND: 26000, BHD: 0.376, EUR: 0.9, GBP: 0.78, JPY: 150 };
const shared = { items: [1500000], links: [''], region: 'mena', weight: 'light', stops: '2', pay: 'bank', cur: 'BHD', fx: { vndPerUsd: 26000, rate: 0.376, when: '2026-10-02', live: true }, createdAt: '2026-10-02T00:00:00Z', expiresAt: '2099-01-01T00:00:00Z' };
const locations = {
  Vietnam: { tz: 'Asia/Ho_Chi_Minh', currency: 'VND', suggestion: 'Tiếng Việt' },
  'Los-Angeles': { tz: 'America/Los_Angeles', currency: 'USD', suggestion: null },
  Bahrain: { tz: 'Asia/Bahrain', currency: 'BHD', suggestion: 'العربية' },
  London: { tz: 'Europe/London', currency: 'GBP', suggestion: null },
  Paris: { tz: 'Europe/Paris', currency: 'EUR', suggestion: 'Français' },
  Auckland: { tz: 'Pacific/Auckland', currency: 'USD', suggestion: null }
};
const jobs = [], records = [];
let browser;
function test(name, fn) { if (!filter || filter.test(name)) jobs.push({ name, fn }); }
async function visit(width = 1440, loc = locations.Vietnam, options = {}) {
  const context = await browser.createBrowserContext();
  if (options.permission && options.permission !== 'prompt') await context.overridePermissions(origin, options.permission === 'granted' ? ['geolocation'] : []);
  const page = await context.newPage();
  await page.setViewport({ width, height: width < 768 ? 844 : 1000, isMobile: width < 768, hasTouch: width < 768 });
  if (width < 768) await page.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36');
  await page.emulateTimezone(loc.tz);
  await page.setGeolocation({ latitude: options.country === 'BH' ? 26.2235 : options.country === 'US' ? 34.0522 : 10.7769, longitude: options.country === 'BH' ? 50.5876 : options.country === 'US' ? -118.2437 : 106.7009, accuracy: 50 });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.evaluateOnNewDocument(options => {
    window.__localeAudit = { get: 0, watch: 0, lookups: 0, aborted: false };
    if (navigator.geolocation) for (const [key, method] of [['get', 'getCurrentPosition'], ['watch', 'watchPosition']]) {
      const native = navigator.geolocation[method].bind(navigator.geolocation);
      navigator.geolocation[method] = function (...args) { window.__localeAudit[key]++; return native(...args); };
    }
    if (options.seed) for (const [key, value] of Object.entries(options.seed)) if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
    if (options.failure === 'timeout') {
      const nativeFetch = window.fetch;
      window.fetch = function (url, init) {
        if (!String(url).includes('reverse-geocode-client')) return nativeFetch.call(this, url, init);
        window.__localeAudit.lookups++;
        return new Promise((resolve, reject) => {
          const abort = () => { window.__localeAudit.aborted = true; reject(new DOMException('Aborted', 'AbortError')); };
          if (init?.signal?.aborted) abort(); else init?.signal?.addEventListener('abort', abort, { once: true });
        });
      };
    }
  }, options);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = request.url();
    if (url.includes('reverse-geocode-client')) {
      requests.push({ kind: 'country', url });
      const body = options.failure === 'empty' ? {} : { countryCode: options.country || 'VN' };
      return request.respond({ status: options.failure === 'http' ? 503 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
    }
    if (url.includes('/v1/estimate-link/')) return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, estimate: shared }) });
    if (url.includes('open.er-api.com') || url.includes('currency-api')) {
      if (options.fxFailure) return request.abort();
      return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ result: 'success', rates, time_last_update_utc: 'Fri, 02 Oct 2026 00:00:00 GMT' }) });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return request.abort();
    if (url.startsWith(origin + '/') || url.startsWith('data:') || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) return request.continue();
    request.abort();
  });
  return { context, page, errors, requests };
}
async function load(page, route = '/estimate') {
  await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.SS_setLang === 'function' && !!window.SS_SITE_I18N);
  await page.evaluate(() => SS_SITE_I18N.ready);
}
async function snapshot(frame) {
  return frame.evaluate(() => ({ url: location.href, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lang: document.documentElement.lang, dir: document.documentElement.dir, saved: localStorage.getItem('ss-lang'), choice: localStorage.getItem('ss-geo-lang'), currency: document.querySelector('#estCurrency')?.value || null, total: document.querySelector('#rUsd')?.textContent || null, card: document.querySelector('.geo-lang-card p')?.textContent || null, keep: document.querySelector('.geo-lang-card .geo-lang-no')?.textContent || null, toast: document.querySelector('.geo-lang-toast')?.textContent || null, location: window.__localeAudit, width: [document.documentElement.scrollWidth, innerWidth] }));
}
async function currencyInput(frame) {
  await frame.waitForSelector('.est-ready .item-price');
  await frame.$eval('.item-price', e => { e.value = '1500000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await frame.waitForFunction(() => document.querySelector('#rUsd').textContent !== '—');
  await pause(50);
}
async function menu(page) {
  await page.click('.ss-guide-launch');
  await page.waitForSelector('.ss-guide[open] .ss-door[data-door="sourcing"]', { visible: true });
  const destination = await page.$eval('.ss-door[data-door="sourcing"]', e => e.href);
  assert.equal(new URL(destination).origin, new URL(origin).origin);
  assert.match(new URL(destination).pathname, /\/estimate(?:\.html)?$/);
  await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.click('.ss-door[data-door="sourcing"]')]);
  await page.waitForSelector('.est-ready .item-price'); await page.evaluate(() => SS_SITE_I18N.ready);
  return page.mainFrame();
}
async function capture(s, r, frame = s.page.mainFrame()) {
  r.snapshots.push(await snapshot(frame));
  if (out) { const file = r.name.replace(/[^\w-]+/g, '_') + '.png'; await s.page.screenshot({ path: path.join(out, file) }); r.screenshots.push(file); }
}
async function withPage(r, width, loc, options, fn) {
  const s = await visit(width, loc, options);
  try { await fn(s); assert.deepEqual(s.errors, [], 'uncaught JavaScript errors'); }
  finally { r.errors.push(...s.errors); await s.context.close(); }
}
for (const width of [1440, 390, 320, 375]) {
  for (const route of ['/', '/estimate', '/links', '/fashion-directory', '/field-guide', '/categories/accessories', '/houses/lace-the-label']) test(`fresh-init-${route}-${width}`, async r => withPage(r, width, locations.Vietnam, {}, async s => {
    await load(s.page, route); await pause(1800); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a);
    assert.equal(a.saved, null, 'initialization is not an explicit choice'); assert.equal(a.lang, 'en'); assert.equal(a.location.get + a.location.watch, 0);
    await load(s.page, route === '/estimate' ? '/' : '/estimate'); await pause(1800); const b = await snapshot(s.page.mainFrame()); r.snapshots.push(b);
    assert.equal(b.saved, null); assert.equal(b.card, 'View this site in Tiếng Việt?', 'unanswered offer survives navigation');
  }));
  for (const loc of [locations.Vietnam, locations['Los-Angeles']]) for (const profile of ['fresh', 'returning']) for (const code of ['en', 'fr', 'vi']) test(`manual-choice-${loc === locations.Vietnam ? 'Vietnam' : 'Los-Angeles'}-${profile}-${code}-${width}`, async r => withPage(r, width, loc, profile === 'returning' ? { seed: { 'ss-lang': 'ar' } } : {}, async s => {
    await load(s.page); r.snapshots.push(await snapshot(s.page.mainFrame())); await s.page.select('#estLangSelect', code); await s.page.evaluate(() => SS_SITE_I18N.ready); await pause(1900);
    const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.lang, code); assert.equal(a.saved, code); assert.equal(a.card, null, 'manual choice cancels delayed offer');
    await s.page.emulateTimezone('Europe/London'); await s.page.reload({ waitUntil: 'domcontentloaded' }); await s.page.evaluate(() => SS_SITE_I18N.ready); assert.equal((await snapshot(s.page.mainFrame())).lang, code);
    await load(s.page, '/'); const frame = await menu(s.page); await frame.evaluate(() => SS_SITE_I18N.ready); const b = await snapshot(frame); r.snapshots.push(b); assert.equal(b.lang, code); assert.equal(b.saved, code);
  }));
  test(`manual-after-visible-offer-${width}`, async r => withPage(r, width, locations.Vietnam, {}, async s => {
    await load(s.page); await s.page.waitForSelector('.geo-lang-card'); await s.page.select('#estLangSelect', 'fr'); await s.page.evaluate(() => SS_SITE_I18N.ready); await pause(100);
    assert.equal((await snapshot(s.page.mainFrame())).card, null); await capture(s, r);
  }));
  test(`escape-before-delay-${width}`, async r => withPage(r, width, locations.Vietnam, {}, async s => {
    await load(s.page); await s.page.keyboard.press('Escape'); await pause(1900); assert.equal((await snapshot(s.page.mainFrame())).card, null);
  }));
  for (const [code, label] of [['en', 'English'], ['fr', 'French'], ['vi', 'Vietnamese']]) test(`keep-label-${code}-${width}`, async r => withPage(r, width, locations['Los-Angeles'], {}, async s => {
    await load(s.page); await s.page.evaluate(async code => { await SS_setLang(code); SS_GEO_LANG.offer('ar'); }, code);
    const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.keep, 'Keep ' + label); await s.page.click('.geo-lang-card .geo-lang-no'); assert.equal((await snapshot(s.page.mainFrame())).lang, code);
  }));
  test(`detect-English-${width}`, async r => withPage(r, width, locations.Vietnam, { permission: 'granted', country: 'US', seed: { 'ss-lang': 'vi' } }, async s => {
    await load(s.page, '/'); await s.page.click('#a11yBtn'); await pause(200); await s.page.click('.geo-lang-row button');
    await s.page.waitForFunction(() => document.documentElement.lang === 'en' && !!document.querySelector('.geo-lang-toast'), { timeout: 10000 });
    let a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.saved, 'en'); assert.match(a.toast, /Switched to English/);
    await s.page.click('.geo-lang-row button'); await s.page.waitForFunction(() => /already.*English/i.test(document.querySelector('.geo-lang-toast')?.textContent || ''), { timeout: 10000 });
    a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.lang, 'en'); assert.equal(a.location.get, 2); await capture(s, r);
  }));
  for (const failure of ['http', 'timeout', 'empty']) test(`detect-failure-${failure}-${width}`, async r => withPage(r, width, locations['Los-Angeles'], { permission: 'granted', country: 'VN', failure }, async s => {
    await load(s.page, '/'); await s.page.click('#a11yBtn'); await pause(200); await s.page.click('.geo-lang-row button');
    await s.page.waitForSelector('.geo-lang-toast', { timeout: 10000 }); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a);
    assert.equal(a.lang, 'en'); assert.equal(a.saved, null); assert.match(a.toast, /retry|try again/i); assert.match(a.toast, /pick|choose.*language/i); assert.equal(a.location.get, 1);
    if (failure === 'timeout') { assert.match(a.toast, /timed out|timeout/i); assert.equal(a.location.aborted, true); }
    if (failure === 'empty') assert.match(a.toast, /country/i);
    await capture(s, r);
  }));
  test(`detect-denied-${width}`, async r => withPage(r, width, locations['Los-Angeles'], { permission: 'denied' }, async s => {
    await load(s.page, '/'); await s.page.click('#a11yBtn'); await pause(200); await s.page.click('.geo-lang-row button'); await s.page.waitForSelector('.geo-lang-toast');
    const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.toast, 'Location unavailable — pick a language above.'); assert.equal(a.lang, 'en'); assert.equal(a.saved, null);
  }));
  for (const [country, code] of [['BH', 'ar'], ['VN', 'vi']]) test(`detect-overrides-timezone-${country}-${width}`, async r => withPage(r, width, locations.London, { permission: 'granted', country }, async s => {
    await load(s.page, '/'); const before = await snapshot(s.page.mainFrame()); assert.equal(before.location.get, 0); await s.page.click('#a11yBtn'); await pause(200); await s.page.click('.geo-lang-row button');
    await s.page.waitForFunction(code => document.documentElement.lang === code, {}, code); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.saved, code); assert.equal(a.dir, code === 'ar' ? 'rtl' : 'ltr'); assert(a.width[0] <= a.width[1] + 1);
    await s.page.click('.geo-lang-undo'); await s.page.evaluate(() => SS_SITE_I18N.ready); const b = await snapshot(s.page.mainFrame()); r.snapshots.push(b); assert.equal(b.lang, 'en'); assert.equal(b.saved, 'en');
  }));
  for (const action of ['accept', 'decline', 'undo']) test(`suggestion-${action}-${width}`, async r => withPage(r, width, locations.Bahrain, { permission: 'denied' }, async s => {
    await load(s.page); await s.page.waitForSelector('.geo-lang-card'); await s.page.click(action === 'decline' ? '.geo-lang-card .geo-lang-no' : '.geo-lang-yes');
    if (action === 'undo') { await s.page.waitForSelector('.geo-lang-undo'); await s.page.click('.geo-lang-undo'); }
    await s.page.evaluate(() => SS_SITE_I18N.ready); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.lang, action === 'accept' ? 'ar' : 'en'); assert.equal(a.location.get, 0);
    await s.page.reload({ waitUntil: 'domcontentloaded' }); await s.page.evaluate(() => SS_SITE_I18N.ready); await pause(1800); const b = await snapshot(s.page.mainFrame()); r.snapshots.push(b); assert.equal(b.card, null); assert.equal(b.lang, a.lang);
  }));
  test(`shared-and-saved-currency-${width}`, async r => withPage(r, width, locations['Los-Angeles'], { seed: { 'ss-est-cur': 'EUR' } }, async s => {
    await load(s.page, '/estimate?e=abcdefg'); await s.page.waitForFunction(() => document.querySelector('#estCurrency').value === 'BHD'); await currencyInput(s.page.mainFrame()); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a);
    assert.match(a.total, /^≈ BHD\s.* · ≈ \$/); assert.equal(await s.page.evaluate(() => localStorage.getItem('ss-est-cur')), 'EUR'); await load(s.page); assert.equal((await snapshot(s.page.mainFrame())).currency, 'EUR');
    await s.page.select('#estCurrency', 'GBP'); await load(s.page, '/'); const frame = await menu(s.page); assert.equal((await snapshot(frame)).currency, 'GBP');
  }));
  test(`fx-failure-disclosed-${width}`, async r => withPage(r, width, locations.Bahrain, { fxFailure: true }, async s => {
    await load(s.page); await currencyInput(s.page.mainFrame()); const a = await snapshot(s.page.mainFrame()); r.snapshots.push(a); assert.equal(a.currency, 'BHD'); assert.match(a.total, /unavailable/i); assert(!a.total.includes('NaN')); assert.match(await s.page.$eval('#estQuickTotal', e => e.textContent), /₫/);
  }));
}
for (const width of [1440, 390, 320, 375]) for (const [name, loc] of Object.entries(locations)) {
  const profiles = ['Vietnam', 'Los-Angeles'].includes(name) ? ['fresh', 'returning'] : ['fresh'];
  const permissions = ['Vietnam', 'Los-Angeles'].includes(name) ? ['prompt', 'denied', 'granted'] : ['prompt'];
  for (const profile of profiles) for (const permission of permissions) for (const surface of ['standalone', 'menu']) test(`automatic-${name}-${profile}-${permission}-${surface}-${width}`, async r => withPage(r, width, loc, { permission, seed: profile === 'returning' ? { 'ss-lang': 'en', 'ss-est-cur': 'EUR' } : undefined }, async s => {
    await load(s.page, surface === 'menu' ? '/' : '/estimate'); const frame = surface === 'menu' ? await menu(s.page) : s.page.mainFrame(); await currencyInput(frame); await pause(1800);
    const top = await snapshot(s.page.mainFrame()), est = await snapshot(frame); r.snapshots.push({ top, est });
    assert.equal(top.lang, 'en'); assert.equal(est.lang, 'en'); assert.equal(top.saved, profile === 'returning' ? 'en' : null); assert.equal(est.saved, top.saved);
    assert.equal(est.currency, profile === 'returning' ? 'EUR' : loc.currency); assert.equal(top.card, profile === 'fresh' && loc.suggestion ? `View this site in ${loc.suggestion}?` : null);
    assert.equal(top.location.get + top.location.watch + est.location.get + est.location.watch, 0); assert.equal(s.requests.length, 0);
    assert(top.width[0] <= top.width[1] + 1); assert(est.width[0] <= est.width[1] + 1); assert(!/unavailable|NaN/.test(est.total));
    if (est.currency === 'USD') assert(!est.total.includes('·')); else assert(est.total.includes(' · ≈ $'));
  }));
}
for (const width of [1440, 390]) test(`iframe-sync-without-implicit-persistence-${width}`, async r => withPage(r, width, locations.Vietnam, {}, async s => {
  await load(s.page, '/');
  await s.page.evaluate(() => {
    const iframe = document.createElement('iframe'); iframe.id = 'locale-test-frame'; iframe.style.cssText = 'display:block;width:100%;max-width:1040px;border:0;margin:0 auto';
    window.addEventListener('message', event => { if (event.origin === location.origin && event.source === iframe.contentWindow && event.data?.type === 'ss-estimate-height') iframe.style.height = event.data.height + 'px'; });
    iframe.src = '/estimate?embed=links'; document.body.append(iframe);
  });
  const frame = await s.page.waitForFrame(f => /\/estimate\?embed=links$/.test(f.url())); await frame.waitForSelector('.est-ready'); await frame.evaluate(() => SS_SITE_I18N.ready);
  let top = await snapshot(s.page.mainFrame()), child = await snapshot(frame); r.snapshots.push({ top, child }); assert.equal(top.saved, null); assert.equal(child.saved, null);
  await s.page.evaluate(() => SS_setLang('ar')); await frame.waitForFunction(() => document.documentElement.lang === 'ar'); top = await snapshot(s.page.mainFrame()); child = await snapshot(frame); r.snapshots.push({ top, child }); assert.equal(top.saved, 'ar'); assert.equal(child.saved, 'ar'); assert.equal(child.dir, 'rtl');
  await s.page.evaluate(() => SS_setLang('fr')); await frame.waitForFunction(() => document.documentElement.lang === 'fr'); child = await snapshot(frame); r.snapshots.push(child); assert.equal(child.saved, 'fr'); assert.equal(child.dir, 'ltr');
  assert(child.width[0] <= child.width[1] + 1);
}));
for (const width of [320, 375]) for (const code of ['en', 'vi', 'ar', 'fr']) test(`receipt-nowrap-${width}-${code}`, async r => withPage(r, width, locations.Vietnam, {}, async s => {
  await load(s.page); await s.page.select('#estLangSelect', code); await s.page.evaluate(() => SS_SITE_I18N.ready);
  for (const price of ['1500000', '50000000', '200000000']) {
    await s.page.$eval('.item-price', (e, price) => { e.value = price; e.dispatchEvent(new Event('input', { bubbles: true })); }, price); await pause(150);
    assert.equal(await s.page.$eval('#rSubtotal', e => e.textContent), Number(price).toLocaleString('en-US') + '₫');
    const geometry = await s.page.evaluate(() => {
      const failures = [];
      for (const value of document.querySelectorAll('.result-row .v')) {
        if (!value.getClientRects().length) continue;
        const row = value.closest('.result-row').getBoundingClientRect(), box = value.getBoundingClientRect();
        if (box.left < row.left - 1 || box.right > row.right + 1 || value.scrollWidth > value.clientWidth + 1) failures.push({ id: value.id, reason: 'amount outside receipt', box: [box.left, box.right], row: [row.left, row.right], widths: [value.scrollWidth, value.clientWidth] });
        const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          for (const match of node.textContent.matchAll(/[\p{N}][\p{N}.,٬٫\u00a0\u202f]*(?:[ \u00a0\u202f]*[₫đ])?/gu)) {
            const range = document.createRange(); range.setStart(node, match.index); range.setEnd(node, match.index + match[0].length);
            const tops = new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top)));
            if (tops.size > 1) failures.push({ id: value.id, amount: match[0], reason: 'mid-number line break', lines: [...tops] });
          }
        }
      }
      return { failures, width: [document.documentElement.scrollWidth, innerWidth], total: document.querySelector('#rTotal').textContent, converted: document.querySelector('#rUsd').textContent, fonts: Array.from(document.querySelectorAll('.result-row .v'), e => [e.id, parseFloat(getComputedStyle(e).fontSize)]) };
    });
    r.snapshots.push({ price, geometry }); assert.deepEqual(geometry.failures, [], 'nowrap amount geometry'); assert(geometry.width[0] <= geometry.width[1] + 1); assert(geometry.fonts.every(([, font]) => font >= 13 && font <= 16), 'small-screen amount font clamp including converted total');
  }
  await s.page.$eval('.est-options', e => { e.open = true; }); await s.page.select('#payMethod', 'card'); await s.page.select('#weight', 'heavy'); await pause(150);
  const custom = await s.page.evaluate(() => ({ width: [document.documentElement.scrollWidth, innerWidth], values: Array.from(document.querySelectorAll('.result-row .v'), e => { const row = e.closest('.result-row').getBoundingClientRect(), rect = e.getBoundingClientRect(); return { id: e.id, visible: !!e.getClientRects().length, text: e.textContent, fits: rect.left >= row.left - 1 && rect.right <= row.right + 1 && e.scrollWidth <= e.clientWidth + 1 }; }) }));
  r.snapshots.push({ custom }); assert(custom.width[0] <= custom.width[1] + 1, 'custom shipping has no horizontal overflow'); assert(custom.values.every(v => !v.visible || v.fits), 'custom shipping annotations fit without clipping');
  await s.page.$eval('#rTotal', e => e.scrollIntoView({ block: 'center', behavior: 'instant' })); await capture(s, r);
}));
(async () => {
  browser = await puppeteer.launch({ headless: true });
  let next = 0;
  try {
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++], r = { name: job.name, pass: false, snapshots: [], screenshots: [], errors: [] };
        try { await job.fn(r); r.pass = true; } catch (e) { r.failure = e.stack; }
        records.push(r); console.log(r.pass ? 'PASS' : 'FAIL', r.name, r.failure ? r.failure.split('\n').slice(0, 2).join(' ') : '');
        if (out) fs.writeFileSync(path.join(out, 'locale-results.json'), JSON.stringify({ origin, records }, null, 2));
      }
    }));
  } finally { await browser.close(); }
  console.log(`${records.filter(r => r.pass).length}/${records.length} locale scenarios passed`);
  if (records.some(r => !r.pass)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
