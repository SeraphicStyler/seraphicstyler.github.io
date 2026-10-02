/* Current English policy/price copy must win over obsolete keyed translations. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const root = path.resolve(__dirname, '..');
const base = process.env.SS_PREVIEW || 'http://127.0.0.1:8732';
(async () => {
  const browser = await puppeteer.launch({headless: true, executablePath: process.env.SS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try {
    const page = await browser.newPage();
    await page.goto(base + '/index.html', {waitUntil: 'domcontentloaded'});
    await page.evaluate(async () => { await SS_SITE_I18N.ready; await SS_setLang('en'); });
    const keys = ['pol.1b', 'pol.2b', 'est.pay.card', 'hero.assure']; // pol.1b replaces step.5b: How it works is now three tracks
    const english = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, document.querySelector('[data-i18n="' + key + '"]').textContent.trim().replace(/\s+/g, ' ')])), keys);
    for (const locale of (process.env.SS_TEST_LANGS || 'vi,es,fr').split(',')) {
      const dict = JSON.parse(fs.readFileSync(path.join(root, 'js/i18n/site.' + locale + '.json'), 'utf8'));
      await page.evaluate(async locale => { await SS_setLang(locale); await SS_SITE_I18N.ready; }, locale);
      await page.evaluate(() => SS_SITE_I18N.refresh());
      const actual = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, document.querySelector('[data-i18n="' + key + '"]').textContent.trim().replace(/\s+/g, ' ')])), keys);
      for (const key of keys) assert.equal(actual[key], dict[english[key]], locale + ' current source: ' + key);
      const comparable=text=>locale==='tr'?text.replace(/%(\d+(?:\.\d+)?)/g,'$1%'):text;
      for (const key of keys) assert(!comparable(actual[key]).includes('50%'), locale + ' obsolete deposit ratio: ' + key);
      for (const number of ['105%', '115%', '48']) assert(comparable(actual['pol.2b']).includes(number), locale + ' current refund terms: ' + number);
      await page.evaluate(() => SS_setLang('en'));
      const restored = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, document.querySelector('[data-i18n="' + key + '"]').textContent.trim().replace(/\s+/g, ' ')])), keys);
      assert.deepEqual(restored, english);
      console.log('PASS current policy and price copy ' + locale);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
