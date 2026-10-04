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
    await page.evaluate(() => {
      const section = document.createElement('section');
      section.style.cssText = 'max-width:640px;width:100%;margin:0 auto';
      const iframe = document.createElement('iframe');
      iframe.id = 'test-estimate-frame'; iframe.title = 'Estimator resize test'; iframe.style.cssText = 'display:block;width:100%;border:0';
      window.addEventListener('message', event => {
        if (event.origin === location.origin && event.source === iframe.contentWindow && event.data?.type === 'ss-estimate-height') iframe.style.height = event.data.height + 'px';
      });
      iframe.src = '/estimate?embed=links'; section.append(iframe);
      const reading = document.createElement('p'); reading.id = 'test-estimate-reading'; reading.textContent = 'Reading position after the estimator'; section.append(reading);
      document.querySelector('#main').append(section);
    });
    const frame = await page.waitForFrame(f => /\/estimate\?embed=links$/.test(f.url()));
    await frame.waitForSelector('.est-ready');
    await frame.evaluate(() => document.fonts.ready);
    await frame.$eval('.item-price', node => { node.value = '1500000'; node.dispatchEvent(new Event('input', { bubbles: true })); });
    const height = () => page.$eval('#test-estimate-frame', node => node.getBoundingClientRect().height);
    for (const width of [320, 375, 390, 768, 1440]) {
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
    await page.$eval('#test-estimate-reading', node => node.scrollIntoView({ behavior: 'instant' }));
    await pause(400);
    const scroll = await page.evaluate(() => scrollY);
    await pause(2000);
    assert(Math.abs(await page.evaluate(() => scrollY) - scroll) <= 1, 'reading position remains stable');
    await page.evaluate(() => SS_setLang('ar'));
    await frame.waitForFunction(() => document.documentElement.lang === 'ar');
    await pause(600);
    const arabicHeight = await height();
    await pause(1600);
    assert(Math.abs(await height() - arabicHeight) <= 1, 'stable after language change');
    assert.deepEqual(errors, []);
    console.log('PASS isolated iframe fixture: stable height, expand/shrink, reading position, five widths, RTL; no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
