/* The editorial guide keeps pricing visible and operational details usable. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(()=>localStorage.setItem('ss-theme','light'));
  for(const width of [320,390,768,1440]){
   await page.setViewport({width,height:900});
   await page.goto(origin+'/links.html',{waitUntil:'networkidle2'});
   await page.evaluate(()=>document.fonts.ready);await pause(1000);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page fits '+width);
   assert.equal(await page.$$eval('.lp-featured-tiers>.lp-tier-option',els=>els.filter(e=>e.getClientRects().length).length),3,'pricing visible');
   assert.equal(await page.$$eval('.lp-tier-option',els=>els.length),7);
   assert.equal(await page.$$eval('.lp-work-films video',els=>els.length),12);
   assert.equal(await page.$eval('.lp-top',e=>getComputedStyle(e,'::after').display),'none');
   assert.equal(await page.$eval('#all-styling-options',e=>e.open),false);
   const bad=await page.$$eval('main a[href^="#"]',els=>els.map(e=>e.hash).filter(h=>!document.getElementById(decodeURIComponent(h.slice(1)))));
   assert.deepEqual(bad,[],'all chapter destinations exist');
   const ids=await page.$$eval('[id]',els=>els.map(e=>e.id));assert.equal(new Set(ids).size,ids.length);
   const centered=await page.$eval('.lp-tag',e=>{const r=e.getBoundingClientRect(),p=e.closest('.lp-wrap').getBoundingClientRect();return Math.abs(r.left+r.width/2-p.left-p.width/2)<2;});
   assert(centered,'hero copy centered '+width);
   if(width===390){
    const nav=await page.$eval('.ss-section-nav',e=>({w:e.offsetWidth,h:e.offsetHeight}));assert(nav.w<=272&&nav.h<=50);
    await page.screenshot({path:'/private/tmp/links-editorial-hero.png'});
    await page.$eval('#lp-styling',e=>e.scrollIntoView({behavior:'instant'}));await pause(300);
    await page.screenshot({path:'/private/tmp/links-editorial-pricing.png'});
    await page.$eval('.lp-tier-breakdown>summary',e=>e.scrollIntoView({block:'center',behavior:'instant'}));await pause(500);
    await page.click('.lp-tier-breakdown>summary');
    assert(await page.$eval('.lp-tier-breakdown',e=>e.open));
    await page.click('#lp-guide-help>summary');await page.waitForSelector('#lp-guide.ss-concierge-ready');
    await page.click('#lp-guide [data-topic="styling"]');await page.click('#lp-guide .ss-followup-choices button');await page.waitForSelector('#lp-guide .ss-recommendation');
    await page.$eval('#lp-selected-work',e=>e.scrollIntoView({behavior:'instant'}));await pause(500);
    assert(await page.$$eval('.lp-work-films video',els=>els.filter(e=>!e.paused).length<=1));
    await page.screenshot({path:'/private/tmp/links-editorial-films.png'});
    await page.click('.ss-guide-launch');await page.click('[data-view="prices"]');
    assert(await page.$eval('.ss-guide',e=>e.scrollWidth<=e.clientWidth));await page.keyboard.press('Escape');await pause(300);
   }
  }
  for(const theme of ['dark','mono','light']){
   await page.evaluate(t=>SS_THEME.set(t,{animate:false}),theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await pause(200);
  assert(await page.$$eval('.lp-work-films video',els=>els.every(e=>e.paused)));
  await page.setJavaScriptEnabled(false);await page.goto(origin+'/links.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.$$eval('.lp-featured-tiers>.lp-tier-option',els=>els.filter(e=>e.getClientRects().length).length),3);
  await page.click('#all-styling-options>summary');assert(await page.$eval('#all-styling-options',e=>e.open));
  assert.deepEqual(errors,[]);
  console.log('PASS editorial links: visible pricing, 12 inline films, four widths, centered hero, chapter links, guide, menu, themes, reduced motion and no-JS pricing.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
