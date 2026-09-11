/* Regression: an embedded calculator must not grow with its own viewport. */
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/links.html', { waitUntil: 'networkidle2' });
    await page.$eval('#lp-estimator', node => node.scrollIntoView({ behavior: 'instant' }));
    const frame = await (await page.$('.lp-estimate-frame')).contentFrame();
    await frame.waitForSelector('.est-ready');
    await frame.evaluate(() => document.fonts.ready);
    const height = () => page.$eval('.lp-estimate-frame', node => node.getBoundingClientRect().height);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 900 });
      await pause(600);
      const before = await height();
      await pause(1600);
      assert(Math.abs(await height() - before) <= 1, 'stable iframe at ' + width);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'page fits');
      assert(await frame.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'frame fits');
      await frame.$eval('.est-options', node => { node.open = true; });
      await pause(300);
      assert(await height() > before, 'expands for options');
      await frame.$eval('.est-options', node => { node.open = false; });
      await pause(300);
      assert(Math.abs(await height() - before) <= 1, 'shrinks after options close');
    }
    await page.$eval('#lp-browse', node => node.scrollIntoView({ behavior: 'instant' }));
    await pause(400);
    const scroll = await page.evaluate(() => scrollY);
    await pause(2000);
    assert(Math.abs(await page.evaluate(() => scrollY) - scroll) <= 1, 'reading position remains stable');
    await page.evaluate(() => SS_setLang('ar'));
    await pause(600);
    const arabicHeight = await height();
    await pause(1600);
    assert(Math.abs(await height() - arabicHeight) <= 1, 'stable after language change');
    assert.deepEqual(errors, []);
    console.log('PASS stable iframe height, expand/shrink, reading position, four widths, RTL; no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
