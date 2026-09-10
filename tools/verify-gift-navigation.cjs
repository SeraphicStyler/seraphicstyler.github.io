/* Local visual and interaction checks; no purchases or inquiry submissions. */
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
(async () => {
  const browser = await puppeteer.launch({headless:true});
  try {
    const page = await browser.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'reduce'}]);
    for(const route of ['index.html','links.html','sourcingandstyling']) {
      await page.setViewport({width:1440,height:1000});
      await page.goto(origin+'/'+route,{waitUntil:'networkidle2'});
      await page.waitForSelector('.ss-section-nav');
      assert(await page.$eval('.ss-section-nav',e=>e.open));
      const target=route==='index.html'?'gift':route==='links.html'?'lp-styling':'prices';
      await page.click('.ss-section-nav a[href="#'+target+'"]');
      await page.waitForFunction(id=>document.querySelector('.ss-section-nav a[aria-current]').hash==='#'+id,{timeout:5000},target).catch(async e=>{
        console.log(await page.evaluate(()=>({scrollY,active:document.querySelector('.ss-section-nav a[aria-current]')?.hash,positions:[...document.querySelectorAll('.ss-section-nav nav a')].map(a=>[a.hash,document.getElementById(a.hash.slice(1)).getBoundingClientRect().top])})));
        await page.screenshot({path:'/private/tmp/ss-nav-debug.png'}); throw e;
      });
      assert.equal(await page.evaluate(()=>document.activeElement.id),target);
      await page.screenshot({path:'/private/tmp/ss-updated-'+route.replace(/\W/g,'-')+'-desktop.png'});
      if(route==='index.html') {
        assert.equal(await page.$$eval('.ss-gift-custom',els=>els.length),2);
        for(const [amount,fee] of [[1100,475],[1500,750]]) {
          assert(await page.$eval('.ss-gift-custom .gift-price[data-usd="'+amount+'"]',e=>e.textContent.includes('From')));
          assert(await page.$('.ss-gift-custom [data-gift-usd="'+fee+'"]'));
        }
        await page.select('#giftCurrency','EUR');
        await page.waitForFunction(()=>document.querySelector('.ss-gift-custom .gift-amt').textContent.includes('€'));
        assert(await page.$eval('[data-gift-usd="475"]',e=>e.textContent.includes('€')));
        assert(await page.$eval('#giftCurrencyNote',e=>e.textContent.includes('Approximate EUR')));
        await page.select('#giftCurrency','USD');
        await page.click('.ss-gift-menu');
        assert(await page.$eval('.ss-guide',e=>e.open));
        assert(await page.$eval('[data-prices]',e=>!e.hidden&&e.textContent.includes('$1,500')));
        await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ss-guide').open);
        assert(await page.$eval('.ss-gift-menu',e=>e===document.activeElement));
        await page.$eval('#gift-custom-wardrobe',e=>e.scrollIntoView({behavior:'instant'}));
        await page.screenshot({path:'/private/tmp/ss-custom-gifts-desktop.png'});
      }
      for(const width of [1024,390,320]) {
        await page.setViewport({width,height:900});
        await page.$eval('.ss-section-nav',e=>e.open=false);
        await page.click('.ss-section-nav>summary');
        assert(await page.$eval('.ss-section-nav',e=>e.open));
        await page.click('.ss-section-nav a[href="#'+target+'"]');
        assert(await page.$eval('.ss-section-nav',e=>!e.open));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow '+width);
        await page.screenshot({path:'/private/tmp/ss-updated-'+route.replace(/\W/g,'-')+'-'+width+'.png'});
      }
      await page.click('.ss-guide-launch');
      assert.deepEqual(await page.$$eval('.ss-guide a[href^="#"]',els=>els.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)),[]);
      await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ss-guide').open);
      console.log('PASS '+route+': section navigation, active state, focus, mobile outline, menu destinations, responsive width');
    }
    for(const tier of ['custom-wardrobe','custom-wardrobe-plus']) {
      await page.goto(origin+'/service-request.html?service=gift&tier='+tier,{waitUntil:'networkidle2'});
      assert.equal(await page.$eval('[name="service"]:checked',e=>e.value),'gift');
      assert.equal(await page.$eval('#gift-request-tier',e=>e.value),tier);
      assert(await page.$eval('[data-fields="gift"]',e=>!e.disabled&&!e.hidden));
    }
    assert.deepEqual(errors,[]);
    console.log('PASS gift currency display, full menu from gifting, both gift-tier intake selections; no JavaScript errors');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
