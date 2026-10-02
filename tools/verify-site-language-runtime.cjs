/* Runtime regression using fixture dictionaries; this does not check coverage. */
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const assert = require('node:assert/strict');
const base = process.env.SS_PREVIEW || 'http://127.0.0.1:8732';
(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.SS_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    for (const path of ['/', '/fashion-directory.html', '/categories/accessories.html']) {
      const page = await browser.newPage();
      const errors = [];
      const urls = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.setRequestInterception(true);
      page.on('request', async req => {
        const match = req.url().match(/\/js\/i18n\/site\.(\w+)\.json/);
        if (!match) { await req.continue(); return; }
        urls.push(req.url());
        if (match[1] === 'ar') await new Promise(r => setTimeout(r, 100));
        const data = match[1] === 'vi' ? { 'Compare': 'So sánh', 'In comparison': 'Đang so sánh', 'Fixture Hello': 'Xin chào fixture', 'Fixture Missing': 'Thiếu fixture', 'About': 'Giới thiệu', 'Found {n} items': 'Tìm thấy {n} món' } : match[1] === 'km' ? { 'Fixture Hello': 'សួស្តី fixture', 'Fixture Missing': 'ខ្វះ fixture' } : { 'Fixture Hello': 'مرحبا fixture' };
        await req.respond({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      });
      await page.goto(base + path, { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(async (allLocales) => {
        await SS_SITE_I18N.ready;
        await SS_setLang('en');
        const node = document.createElement('section');
        node.innerHTML = '<button title="Fixture Hello">  Fixture Hello \n</button><p data-i18n="fixture.missing">Fixture Missing</p><pre>Fixture Hello</pre><input value="Fixture Hello" placeholder="Fixture Hello"><span translate="no">Fixture Hello</span>';
        document.body.append(node);
        node.querySelector('input').value = 'User typed value';
        const button = node.querySelector('button'); const text = button.firstChild;
        let clicks = 0; button.addEventListener('click', () => clicks++);
        const selected = document.querySelector('#langSelect,.ss-lang-select');
        const count = selected.options.length;
        selected.value = 'vi'; selected.dispatchEvent(new Event('change', { bubbles: true }));
        await SS_SITE_I18N.ready;
        const vi = [text.nodeValue, button.title, node.querySelector('p').textContent, node.querySelector('p').lang];
        button.click();
        const added = document.createElement('div'); added.textContent = 'Fixture Hello'; node.append(added);
        await new Promise(r => setTimeout(r, 10));
        const dynamic = added.textContent;
        const countNode = document.createElement('p'); countNode.textContent = 'Found 3 items'; node.append(countNode);
        await new Promise(r => setTimeout(r, 10));
        const countBefore = countNode.textContent;
        countNode.textContent = 'Found 4 items';
        await SS_SITE_I18N.refresh(node);
        const countAfter = countNode.textContent;
        const formatted = SS_TF('fixture.count', 'Found {n} items', { n: 8 });
        const marked = document.createElement('p'); marked.dataset.i18n = 'nav.about'; marked.textContent = 'About'; node.append(marked);
        await new Promise(r => setTimeout(r, 10));
        await SS_SITE_I18N.refresh(node);
        const dynamicKeyed = marked.textContent;
        await SS_setLang('en');
        const dynamicEnglish = marked.textContent;
        const countEnglish = countNode.textContent;
        await SS_setLang('km');
        if (!selected.getAttribute('aria-label') || selected.getAttribute('aria-label') === 'Language') throw new Error('Selector accessible name not localized');
        const km = [SS_LANG(), document.documentElement.lang, selected.value, localStorage.getItem('ss-lang'), button.textContent];
        await Promise.all([SS_setLang('ar'), SS_setLang('km')]);
        await new Promise(r => setTimeout(r, 150));
        const race = [SS_LANG(), button.textContent];
        const localeChecks = [];
        if (allLocales) for (const option of Array.from(selected.options)) {
          selected.value = option.value;
          selected.dispatchEvent(new Event('change', { bubbles: true }));
          await SS_SITE_I18N.ready;
          localeChecks.push([option.value, SS_LANG(), document.documentElement.lang, document.documentElement.dir, selected.value]);
        }
        await SS_setLang('en');
        return { count, vi, km, dynamic, dynamicKeyed, dynamicEnglish, countBefore, countAfter, formatted, countEnglish, race, localeChecks, clicks, sameNode: button.firstChild === text, english: button.textContent, skips: [node.querySelector('pre').textContent, node.querySelector('input').value, node.querySelector('[translate]').textContent], generated: !!document.querySelector('[data-ss-site-language]'), generatedPosition: document.querySelector('[data-ss-site-language]') && getComputedStyle(document.querySelector('[data-ss-site-language]')).position };
      }, path === '/');
      if (path === '/') assert.equal(result.localeChecks.length, 21);
      for (const [code, current, root, dir, selected] of result.localeChecks) assert.deepEqual([current, root, dir, selected], [code, code, /^(ar|fa)$/.test(code) ? 'rtl' : 'ltr', code]);
      assert.equal(result.count, path === '/fashion-directory.html' ? 22 : 21);
      assert.equal(result.vi[0], '  Xin chào fixture \n');
      assert.equal(result.vi[1], 'Xin chào fixture');
      assert.equal(result.vi[2], 'Thiếu fixture');
      assert.notEqual(result.vi[3], 'en');
      assert.deepEqual(result.km.slice(0, 4), ['km', 'km', 'km', 'km']);
      assert.equal(result.km[4], '  សួស្តី fixture \n');
      assert.deepEqual(result.race, ['km', '  សួស្តី fixture \n']);
      assert.equal(result.dynamic, 'Xin chào fixture');
      assert.equal(result.dynamicKeyed, 'Giới thiệu');
      assert.equal(result.dynamicEnglish, 'About');
      assert.deepEqual([result.countBefore,result.countAfter,result.formatted,result.countEnglish], ['Tìm thấy 3 món','Tìm thấy 4 món','Tìm thấy 8 món','Found 4 items']);
      assert.equal(result.clicks, 1); assert.equal(result.sameNode, true);
      assert.equal(result.english, '  Fixture Hello \n');
      assert.deepEqual(result.skips, ['Fixture Hello', 'User typed value', 'Fixture Hello']);
      if (result.generated) assert.equal(result.generatedPosition, 'fixed');
      assert(urls.every(url => url.startsWith(base + '/js/i18n/')));
      assert.deepEqual(errors, []);
      const tamazight = await page.evaluate(async () => {
        localStorage.setItem('ss-lang', 'zgh');
        await SS_setLang('zgh');
        return [document.documentElement.lang, localStorage.getItem('ss-lang')];
      });
      assert.deepEqual(tamazight, [path === '/fashion-directory.html' ? 'zgh' : 'en', 'zgh']);
      await page.evaluate(() => SS_setLang('km'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      const persisted = await page.evaluate(async () => {
        await SS_SITE_I18N.ready;
        return [SS_LANG(), document.documentElement.lang, localStorage.getItem('ss-lang'), document.querySelector('#langSelect,.ss-lang-select').value];
      });
      assert.deepEqual(persisted, ['km', 'km', 'km', 'km']);
      console.log('PASS Chrome ' + path + ' ' + JSON.stringify({ generated: result.generated, requests: urls.length }));
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exitCode = 1; });
