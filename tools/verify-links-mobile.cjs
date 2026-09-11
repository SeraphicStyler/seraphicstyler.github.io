const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
(async()=>{const browser=await puppeteer.launch({headless:true});try{
 const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
 for(const width of [320,375,390,768,1440]){
  await p.setViewport({width,height:960});await p.goto(origin+'/links',{waitUntil:'networkidle2'});
  assert.equal(await p.$$eval('h1',es=>es.length),1);
  assert.equal(await p.$$eval('.lp-hero-cta a',es=>es.length),1);
  assert.equal(await p.$$eval('.ss-section-nav nav a',es=>es.length),5);
  assert.equal(await p.$eval('.lp-guide-disclosure',e=>e.open),false);
  assert(await p.evaluate(()=>document.querySelector('.lp-services').compareDocumentPosition(document.querySelector('#lp-guide'))&Node.DOCUMENT_POSITION_FOLLOWING));
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
  if(width<761){
   assert.equal(await p.$eval('.lp-mobile-actions',e=>getComputedStyle(e).visibility),'hidden');
   await p.$eval('#lp-styling',e=>e.scrollIntoView({behavior:'instant'}));
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.lp-mobile-actions')).visibility==='visible');
   assert.equal(await p.$eval('.lp-featured-tiers',e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),1);
   assert(await p.$$eval('.lp-mobile-actions a',es=>es.every(e=>e.getBoundingClientRect().height>=44)));
   assert(await p.evaluate(()=>document.querySelector('#a11yBtn').getBoundingClientRect().bottom<document.querySelector('.lp-mobile-actions').getBoundingClientRect().top),'settings button clear of action bar');
   await p.screenshot({path:'/private/tmp/ss-mobile-pricing-'+width+'.png'});
  }
  await p.$eval('.lp-guide-disclosure>summary',e=>e.click());
  await p.focus('#lp-concierge-question');
  if(width<761)assert.equal(await p.$eval('.lp-mobile-actions',e=>getComputedStyle(e).visibility),'hidden','keyboard/input obstruction');
 }
 await p.setViewport({width:375,height:960});await p.goto(origin+'/links#lp-guide',{waitUntil:'networkidle2'});
 assert(await p.$eval('.lp-guide-disclosure',e=>e.open),'direct guide anchor opens parent');
 await p.setJavaScriptEnabled(false);await p.goto(origin+'/links',{waitUntil:'networkidle2'});
 assert.equal(await p.$$eval('.ss-service-choices a',es=>es.length),3);
 await p.click('.lp-guide-disclosure>summary');assert(await p.$eval('.ss-concierge-static',e=>getComputedStyle(e).display!=='none'));
 assert.deepEqual(errors,[]);console.log('PASS mobile journey: 5 widths, five-section nav, one hero CTA, optional guide/deep links, stacked pricing, keyboard-safe action bar, no-JS.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
