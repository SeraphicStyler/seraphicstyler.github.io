/* Visual, motion, contrast, and mobile checks for the links atelier. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function luminance(rgb) {return rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
function contrast(a,b) {const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05);}
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'},{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.setViewport({width:1440,height:1000});
  await page.goto(origin+'/links.html',{waitUntil:'networkidle2'});
  assert(await page.$eval('#lp-guide',e=>e.classList.contains('ss-concierge-ready')),'links service guide initialized');
  assert.equal(await page.$$eval('#lp-guide [data-topic]',nodes=>nodes.filter(node=>node.getClientRects().length).length),3,'three initial guide choices');
  await page.click('#lp-guide [data-topic="photo"]');
  await page.waitForFunction(()=>document.querySelector('#lp-guide .ss-message-actions')?.textContent.includes('Identify this item'));
  assert(await page.$('#lp-guide a[href="service-request.html?service=trace"]'),'Trace route from photo answer');
  await page.click('#lp-guide [data-concierge-reset]');
  assert(await page.$eval('body',e=>e.classList.contains('lp-arrival-ready')));
  assert.equal(await page.$eval('.lp-brand-mark path',e=>e.getAttribute('pathLength')),'1');
  assert.equal(await page.$eval('.lp-brand .brand-seraphic',e=>getComputedStyle(e).animationName),'lp-wordmark-resolve');
  await pause(2200);
  assert.equal(await page.$eval('.lp-brand-mark path',e=>parseFloat(getComputedStyle(e).strokeDashoffset)),0);
  await page.screenshot({path:'/private/tmp/ss-links-polished-hero.png'});
  assert.equal(await page.$$eval('.lp-price-ledger tbody tr',els=>els.length),7);
  assert.equal(await page.$$eval('#lp-styling .lp-tier',els=>els.length),0,'no duplicate tier cards');
  assert.equal(await page.$$eval('.ss-definition dl>div',els=>els.length),8,'four facts per service');
  assert.equal(await page.$eval('.lp-stickybar',e=>getComputedStyle(e).display),'none','one persistent promise, no competing CTA');
  assert.equal(await page.$eval('.ss-trust-ribbon',e=>getComputedStyle(e).position),'fixed');
  await page.$eval('.lp-sample',e=>e.open=true);
  assert(await page.$('.ss-section-nav a[href="#lp-free"]'),'free tools navigation');
  for(const id of ['lp-proof','lp-sourcing','lp-styling','lp-gift']) {
   await page.$eval('#'+id,e=>e.scrollIntoView({behavior:'instant'})); await pause(1000);
   if(id==='lp-proof') assert.equal(await page.$eval('.ss-section-nav a[aria-current]',e=>e.hash),'#lp-proof','active trust section');
   await page.screenshot({path:'/private/tmp/ss-links-polished-'+id+'.png'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  const nightColors=await page.$$eval('#lp-proof .lp-pf-t,#lp-proof .lp-pf-d',els=>els.map(e=>getComputedStyle(e).color.match(/\d+/g).slice(0,3).map(Number)));
  // Conservative lightest point of the cobalt wash, including its lavender glow.
  nightColors.forEach(rgb=>assert(contrast(rgb,[61,73,122])>=4.5,'cobalt-panel text contrast'));
  assert(contrast([81,97,143],[239,234,248])>=4.5,'secondary text against lavender');
  assert(contrast([35,58,114],[238,243,251])>=4.5,'primary text against ice');
  for(const width of [390,320]) {
   await page.setViewport({width,height:900});await page.goto(origin+'/links.html',{waitUntil:'networkidle2'});await pause(2000);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'hero overflow '+width);
   assert.equal(await page.$$eval('#lp-guide [data-topic]',nodes=>nodes.filter(node=>node.getClientRects().length).length),3,'mobile guide choices '+width);
   assert(await page.$$eval('#lp-guide button,#lp-guide input',nodes=>nodes.filter(node=>node.getClientRects().length).every(node=>node.getBoundingClientRect().height>=44)),'mobile guide targets '+width);
   assert(await page.$eval('body',e=>!e.classList.contains('lp-arrival-ready')),'entrance only once per session');
   await page.screenshot({path:'/private/tmp/ss-links-polished-hero-'+width+'.png'});
   await page.$eval('#lp-proof',e=>e.scrollIntoView({behavior:'instant'}));await pause(1000);
   await page.screenshot({path:'/private/tmp/ss-links-polished-proof-'+width+'.png'});
   await page.$eval('#lp-styling',e=>e.scrollIntoView({behavior:'instant'}));await pause(1000);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'styling overflow '+width);
   await page.screenshot({path:'/private/tmp/ss-links-polished-styling-'+width+'.png'});
   await page.$eval('#lp-sourcing details',e=>e.open=true);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'expanded details overflow '+width);
  }
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  await page.$eval('#lp-proof',e=>e.scrollIntoView({behavior:'instant'}));await pause(1000);
  await page.screenshot({path:'/private/tmp/ss-links-polished-dark.png'});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.waitForFunction(()=>!document.body.classList.contains('lp-arrival-ready'));
  assert.equal(await page.$eval('.lp-brand .brand-seraphic',e=>getComputedStyle(e).animationName),'none');
  await page.evaluate(()=>document.documentElement.classList.add('hc'));
  assert.equal(await page.$eval('.lp-atmosphere',e=>getComputedStyle(e).display),'none');
  await page.click('.ss-guide-launch');assert(await page.$eval('.ss-guide',e=>e.open));
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.ss-guide').open);
  await page.setJavaScriptEnabled(false);
  await page.goto(origin+'/links.html',{waitUntil:'networkidle2'});
  assert.equal(await page.$$eval('.lp-price-ledger tbody tr',els=>els.length),7,'pricing available without JavaScript');
  assert(await page.$eval('#custom-wardrobe',e=>e.tagName==='DETAILS'),'native project disclosure');
  assert.deepEqual(errors,[]);
  console.log('PASS links: butterfly/wordmark entrance, section captures, text contrast, 320/390 layouts, expanded details, dark/high-contrast/reduced-motion, shared menu; no JavaScript errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
