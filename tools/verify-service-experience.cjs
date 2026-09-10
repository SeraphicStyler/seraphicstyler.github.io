/* Local browser regression checks. No form submission or payment is performed.
   SS_PUPPETEER=/path/to/puppeteer node tools/verify-service-experience.cjs */
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
(async () => {
  const browser = await puppeteer.launch({headless:true});
  const pause = ms => new Promise(r => setTimeout(r,ms));
  try {
    const page = await browser.newPage(), errors = [];
    await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
    page.on('pageerror', e => errors.push(e.message));
    const closed = () => page.waitForFunction(() => !document.querySelector('.ss-guide').open);
    for (const route of ['index.html', 'links.html']) {
      await page.setViewport({width:1440,height:1000});
      await page.goto(origin + '/' + route, {waitUntil:'networkidle2'});
      await page.waitForSelector('.ss-guide-launch');
      await page.click('.ss-guide-launch');
      await page.waitForFunction(() => document.querySelector('.ss-guide').open);
      await pause(1300);
      assert(await page.$eval('.ss-guide-launch', e => e.getAttribute('aria-expanded') === 'true'));
      await page.screenshot({path:'/private/tmp/seraphic-' + route + '-menu-desktop.png'});
      // Native dialog keeps keyboard focus inside the active menu.
      for(let i=0;i<28;i++) { await page.keyboard.press('Tab'); assert(await page.$eval('.ss-guide',e=>e.contains(document.activeElement))); }
      await page.click('[data-view="prices"]');
      assert(await page.$eval('[data-prices]', e => !e.hidden && e.textContent.includes('$1,100') && e.textContent.includes('$475') && e.textContent.includes('$1,500')));
      await page.focus('#ss-guide-query'); await page.type('#ss-guide-query','15 pieces');
      assert(await page.$eval('.ss-guide-results',e=>e.textContent.includes('Custom Wardrobe')));
      await page.keyboard.press('ArrowDown'); assert(await page.$eval('.ss-guide-results',e=>e.contains(document.activeElement)));
      await page.keyboard.press('Enter'); await closed();
      assert.equal(await page.evaluate(()=>document.activeElement.id),'custom-wardrobe');
      await pause(1000); await page.screenshot({path:'/private/tmp/seraphic-' + route + '-wardrobe.png'});
      await page.keyboard.down('Control'); await page.keyboard.press('k'); await page.keyboard.up('Control');
      await page.focus('#ss-guide-query'); await page.type('#ss-guide-query','zzzzzzzzz');
      assert(await page.$eval('[data-empty]',e=>!e.hidden));
      await page.keyboard.press('Escape'); await closed();
      await page.click('.ss-guide-launch'); await page.keyboard.press('Escape'); await closed();
      assert(await page.$eval('.ss-guide-launch',e=>e===document.activeElement));
      // Letter shortcuts are opt-in and never hijack typing.
      await page.click('.ss-guide-launch'); await page.click('[data-shortcuts]');
      await page.keyboard.press('Escape'); await closed(); await page.evaluate(()=>document.activeElement.blur());
      await page.keyboard.press('m');
      assert(await page.$eval('[data-prices]',e=>!e.hidden));
      await page.keyboard.press('Escape'); await closed();
      await page.evaluate(()=>localStorage.removeItem('ss-letter-shortcuts'));
      const broken = await page.evaluate(()=>[...document.querySelectorAll('.ss-guide a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)); assert.deepEqual(broken,[]);
      // Required acknowledgement is enforced before an existing styling checkout.
      const booking = route === 'index.html' ? '#lane-styling + .grid a[href^="https://buy.stripe.com/"]' : '.lp-tier a[href^="https://buy.stripe.com/"]';
      await page.$eval(booking,e=>e.click());
      assert(await page.$eval('.ss-booking',e=>e.open));
      await page.click('.ss-booking button[value="continue"]');
      assert(await page.$eval('.ss-booking',e=>e.open));
      assert.equal(new URL(page.url()).pathname,'/' + route);
      await page.keyboard.press('Escape');
      for (const width of [390,320]) {
        await page.setViewport({width,height:844});
        await page.$eval('#service-comparison',e=>e.scrollIntoView({behavior:'instant'}));
        await pause(300);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow at '+width);
        await page.$eval('.ss-compare-details',e=>e.open=true);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'table overflow');
        if(width===390) await page.screenshot({path:'/private/tmp/seraphic-' + route + '-compare-mobile.png'});
        await page.click('.ss-guide-launch'); await pause(1300);
        assert(await page.$eval('.ss-guide',e=>e.scrollWidth<=e.clientWidth),'menu overflow');
        await page.screenshot({path:'/private/tmp/seraphic-' + route + '-menu-' + width + '.png'});
        await page.keyboard.press('Escape'); await closed();
      }
      console.log('PASS '+route+': navigation, search, prices, focus, shortcuts, booking acknowledgement, mobile 320/390');
    }
    await page.setViewport({width:390,height:844});
    for(const service of ['sourcing','styling','unsure']) {
      await page.goto(origin+'/service-request.html?service='+service+'&tier=custom-wardrobe',{waitUntil:'networkidle2'});
      assert(await page.$eval(`[data-fields="${service}"]`,e=>!e.hidden&&!e.disabled));
      assert(await page.$$eval('[data-fields]',els=>els.filter(e=>!e.disabled).length===1));
      if(service==='styling') assert.equal(await page.$eval('#request-tier',e=>e.value),'custom-wardrobe');
      if(service==='sourcing') await page.select('#item-source','link');
      await page.evaluate(()=>{ for(const e of document.querySelectorAll('textarea[required]:not(:disabled), input[required]:not(:disabled):not([type="radio"]):not([type="checkbox"]), select[required]:not(:disabled)')) {if(e.id==='confirmed-service') continue; if(e.tagName==='SELECT') {if(!e.value) e.selectedIndex=1;} else e.value='Test brief: 18 pieces, US$625, trip in November, size M, Australia';} });
      await page.select('#confirmed-service',service);
      await page.click('button[type="submit"]');
      assert(await page.$eval('#request-review',e=>e.hidden),'required acknowledgement');
      for(const name of ['Styling understood','Sourcing understood','Research understood','Scope understood']) await page.click(`[name="${name}"]`);
      await page.click('button[type="submit"]');
      assert(await page.$eval('#request-review',e=>!e.hidden));
      const summary=await page.$eval('#request-summary',e=>e.value);
      assert(summary.includes('Service: '+service));
      const dest=await page.$eval('#continue-request',e=>e.href); assert(dest.startsWith('https://tally.so/r/gD10Kl?'));assert(!dest.includes('Test%20brief'));
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.click('#copy-request'); await page.waitForFunction(()=>document.getElementById('copy-status').textContent.length>0);
      await page.click('#edit-request');assert(await page.$eval('#service-request-form',e=>!e.hidden));
      assert(await page.$eval('[name="Scope understood"]',e=>e.checked));
      console.log('PASS intake '+service+': conditional fields, validation, review, clipboard feedback, routing and edit');
    }
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.goto(origin+'/links.html',{waitUntil:'networkidle2'}); await page.click('.ss-guide-launch');
    assert.equal(await page.$eval('.ss-menu-brand',e=>getComputedStyle(e).animationName),'none');
    assert.equal(await page.$eval('.ss-guide',e=>getComputedStyle(e,'::backdrop').animationName),'none');
    await page.keyboard.press('Escape'); await closed();
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.click('.ss-guide-launch'); await page.screenshot({path:'/private/tmp/seraphic-menu-dark-mobile.png'});
    assert.equal(await page.$eval('.ss-guide',e=>getComputedStyle(e).color),await page.$eval('body',e=>getComputedStyle(e).color));
    assert.deepEqual(errors,[]);
    console.log('PASS reduced motion, dark theme; no JavaScript page errors');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
