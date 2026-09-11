/* The links page stays short, with optional depth and clear service handoffs. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>localStorage.setItem('ss-theme','light'));
  for(const width of [320,390,768,1440]) {
   await page.setViewport({width,height:900});await page.goto(origin+'/links.html',{waitUntil:'domcontentloaded'});await page.evaluate(()=>document.fonts.ready);await pause(600);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page fits '+width);
   assert.equal(await page.$$eval('.lp-work-films video',nodes=>nodes.length),4);
   assert.equal(await page.$('iframe,.lp-atmosphere,.atelier-bokeh'),null);
   assert.equal(await page.$eval('.lp-top',e=>getComputedStyle(e,'::after').display),'none');
   assert(await page.$$eval('.lp-details>details',nodes=>nodes.every(n=>!n.open)),'details start closed');
   assert.equal(await page.$$eval('.lp-intents>a',nodes=>nodes.length),3,'three complete card links');
   const badHashes=await page.$$eval('main a[href^="#"]',nodes=>nodes.map(n=>n.hash).filter(h=>!document.getElementById(decodeURIComponent(h.slice(1)))));assert.deepEqual(badHashes,[]);
   if(width===390) {
    assert(await page.$eval('.lp-top',e=>e.getBoundingClientRect().bottom<=844),'hero decisions fit an iPhone viewport');
    await page.screenshot({path:'/private/tmp/links-short-hero.png'});
    const nav=await page.$eval('.ss-section-nav',e=>({w:e.offsetWidth,h:e.offsetHeight}));assert(nav.w<=272&&nav.h<=50);
    await page.click('.lp-top a[href="#lp-pricing"]');await pause(250);assert(await page.$eval('#lp-pricing',e=>e.open),'pricing CTA opens details');
    await page.goto(origin+'/links.html#lp-styling',{waitUntil:'domcontentloaded'});await pause(600);assert(await page.$eval('#lp-pricing',e=>e.open),'legacy styling deep link opens pricing');
    await page.click('#lp-guide-help>summary');await page.waitForSelector('#lp-guide.ss-concierge-ready');await page.click('#lp-guide [data-topic="styling"]');await page.click('#lp-guide .ss-followup-choices button');await page.waitForSelector('#lp-guide .ss-recommendation');
    await page.$eval('#lp-selected-work',e=>e.scrollIntoView({behavior:'instant'}));await pause(400);
    await page.click('[data-film-step="1"]');await pause(700);assert(await page.$eval('.lp-work-films',e=>e.scrollLeft>100),'next film advances carousel');
    assert(await page.$$eval('.lp-work-films video',vs=>vs.filter(v=>!v.paused).length<=1),'one mobile autoplay film');
    await page.screenshot({path:'/private/tmp/links-short-gallery.png'});
    await page.click('.ss-guide-launch');await page.click('[data-view="prices"]');assert(await page.$eval('.ss-guide',e=>e.scrollWidth<=e.clientWidth));await page.keyboard.press('Escape');await pause(400);
   }
  }
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await pause(200);assert(await page.$$eval('.lp-work-films video',vs=>vs.every(v=>v.paused)));
  await page.setJavaScriptEnabled(false);await page.goto(origin+'/links.html',{waitUntil:'domcontentloaded'});
  await page.click('#lp-pricing>summary');assert(await page.$eval('#lp-pricing',e=>e.open),'native pricing works without JS');
  assert.equal(await page.$eval('#lp-estimator a',e=>e.getAttribute('href')),'estimate.html');
  assert.deepEqual(errors,[]);console.log('PASS short links: responsive layouts, hidden detail, legacy anchors, guide, four-film carousel, reduced motion, menu, no-JS pricing.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
