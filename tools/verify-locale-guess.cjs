/* The estimator's starting currency and the language offer follow the visitor's
   time zone, with no permission prompt; a visitor's own choice and a shared
   link's currency win. Local only — the shared link is served from a stub.
     SS_PUPPETEER=/path/to/puppeteer node tools/verify-locale-guess.cjs */
'use strict';
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
const rates = { USD: 1, VND: 26000, BHD: 0.376, EUR: 0.9, GBP: 0.78 };
const shared = { items: [1500000], links: [''], region: 'mena', weight: 'light', stops: '2', pay: 'bank', cur: 'BHD',
  fx: { vndPerUsd: 26000, rate: 0.376, when: '2026-10-02', live: true }, createdAt: '2026-10-02T00:00:00Z', expiresAt: '2099-01-01T00:00:00Z' };
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    async function visit(tz, path, before) {
      const ctx = await browser.createBrowserContext(), page = await ctx.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.setRequestInterception(true);
      page.on('request', r => {
        const u = r.url();
        if (u.includes('open.er-api.com')) return r.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ result: 'success', rates, time_last_update_utc: '2026-10-02' }) });
        if (u.includes('/v1/estimate-link/')) return r.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ ok: true, estimate: shared }) });
        if (!u.startsWith(origin) && !u.startsWith('data:')) return r.abort();
        r.continue();
      });
      await page.emulateTimezone(tz);
      if (before) await page.evaluateOnNewDocument(before);
      await page.goto(origin + path, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.est-ready');
      await page.evaluate(() => { const i = document.querySelector('.item-price'); if (i && !i.value) { i.value = '1500000'; i.dispatchEvent(new Event('input', { bubbles: true })); } });
      await new Promise(r => setTimeout(r, 1900));
      const out = { cur: await page.$eval('#estCurrency', s => s.value), total: await page.$eval('#rUsd', e => e.textContent.trim()),
        card: await page.$eval('.geo-lang-card p', e => e.textContent).catch(() => null) };
      assert.deepEqual(errors, [], tz + ' ' + path);
      await ctx.close();
      return out;
    }
    let v = await visit('Asia/Bahrain', '/estimate');
    assert.equal(v.cur, 'BHD'); assert(/^≈ BHD\s.* · ≈ \$/.test(v.total), 'dinar first, then dollars: ' + v.total);
    assert.equal(v.card, 'View this site in العربية?', 'language is offered, not switched');
    v = await visit('Europe/London', '/estimate'); assert.equal(v.cur, 'GBP'); assert.equal(v.card, null, 'no offer for English');
    v = await visit('America/Los_Angeles', '/estimate'); assert.equal(v.cur, 'USD'); assert(!v.total.includes('·'), 'no second dollar figure in dollars');
    v = await visit('Asia/Ho_Chi_Minh', '/estimate'); assert.equal(v.cur, 'VND'); assert.equal(v.card, 'View this site in Tiếng Việt?');
    v = await visit('Asia/Bahrain', '/estimate', () => localStorage.setItem('ss-est-cur', 'EUR')); assert.equal(v.cur, 'EUR', "the visitor's own choice wins");
    v = await visit('Asia/Bahrain', '/estimate', () => localStorage.setItem('ss-lang', 'en')); assert.equal(v.card, null, 'a chosen language is never second-guessed');
    v = await visit('America/Los_Angeles', '/estimate?e=abcdefg'); assert.equal(v.cur, 'BHD', "a shared link keeps the currency it was made in");
    console.log('PASS time-zone currency (BHD, GBP, USD, VND), dollars alongside, language offered not switched, own choice and shared links win');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
