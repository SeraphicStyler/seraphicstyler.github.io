/* Integrated local discovery checks. No product fetch, inquiry, or payment submission. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[],sent=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/Only in D3|Compare Huelley|with linen/.test(decodeURIComponent(r.url())+(r.postData()||'')))sent.push(r.url());});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
  for(const width of [320,375,768,1440]){
   await page.setViewport({width,height:960});await page.goto(origin+'/fashion-directory',{waitUntil:'networkidle2'});
   await page.waitForSelector('.fd-guide-ready');
   assert(await page.$eval('#fd-guide',e=>e.hidden),'panel closed at rest');
   await page.click('#fd-guide-launcher');
   await page.focus('#fd-guide-question');
   assert(await page.$eval('#fd-guide-launcher',e=>e.getAttribute('aria-expanded')==='true'));
   assert(await page.$eval('#fd-guide',e=>e.getBoundingClientRect().height<=innerHeight*.65),'bounded active dock');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'directory overflow '+width);
   assert(await page.$$eval('#fd-guide button',es=>es.filter(e=>e.getClientRects().length).every(e=>e.getBoundingClientRect().height>=44)),'touch targets '+width);
   await page.screenshot({path:'/private/tmp/ss-directory-guide-'+width+'.png'});
  }
  const ask=async q=>{await page.$eval('#fd-guide-question',(e,q)=>e.value=q,q);await page.focus('#fd-guide-question');await page.keyboard.press('Enter');};
  await ask('linen');
  assert(await page.$$eval('.fd-guide-match',es=>es.length>0));
  assert(await page.$$eval('.fd-guide-match dl',es=>es.every(e=>e.textContent.includes('linen'))));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'fd-guide-question','focus preserved');
  await page.keyboard.press('Escape');assert(await page.$eval('#fd-guide-launcher',e=>e.getAttribute('aria-expanded')==='false'));
  assert(await page.$eval('#fd-guide-answer',e=>e.textContent.includes('linen')),'minimize preserves answer');
  await page.click('#fd-guide-launcher');
  const hash=await page.evaluate(()=>location.hash);
  await page.evaluate(()=>location.hash='fd-guide');
  await page.waitForFunction(()=>location.hash==='#fd-guide');
  assert.equal(await page.$eval('#q',e=>e.value),'','narrative anchor does not become a search');
  await ask('Only in D3');
  assert((await page.$eval('#fd-guide-answer',e=>e.textContent)).includes('No records match'),'refinement combines constraints');
  assert.equal(await page.evaluate(()=>location.hash),'#fd-guide','questions do not mutate browsing URL');
  await page.click('#fd-guide-reset');
  await ask('Compare Huelley and Huelley Rose');
  assert.equal(await page.$$eval('.fd-guide-match',es=>es.length),2);
  await page.evaluate(()=>{navigator.clipboard.writeText=async text=>{window.testCopied=text;};});
  await page.$$eval('#fd-guide-answer button',es=>es.find(e=>e.textContent==='Copy discovery brief').click());
  await page.waitForFunction(()=>window.testCopied?.includes('Huelley Rose'));
  assert((await page.evaluate(()=>window.testCopied)).includes('availability, and budget still need confirmation'));
  await page.$$eval('#fd-guide-answer button',es=>es.find(e=>e.textContent==='Save this house').click());
  assert(await page.$eval('#fd-guide-status',e=>e.textContent.includes('saved')));
  await page.$eval('.fd-guide-content',e=>e.scrollTop=0);await page.screenshot({path:'/private/tmp/ss-directory-comparison.png'});
  await ask('Is this dress in stock?');assert(await page.$('#fd-guide-answer a[href*="service=sourcing"]'));
  await ask('How do I find actual garments?');assert(await page.$('#fd-guide-answer a[href*="service=trace"]'));
  await ask('What is quantum physics?');assert((await page.$eval('#fd-guide-answer',e=>e.textContent)).includes('not have enough recorded detail'));
  await ask('<img src=x onerror=alert(1)>');assert.equal(await page.$$eval('#fd-guide-answer img',es=>es.length),0);
  await ask('');assert((await page.$eval('#fd-guide-status',e=>e.textContent)).includes('Describe a fabric'));
  await page.click('#fd-guide-voice');assert(await page.$eval('.vc-panel',e=>!e.hidden));
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'fd-guide-launcher');
  await page.evaluate(()=>document.documentElement.style.zoom='2');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'200% zoom overflow');
  await page.evaluate(()=>document.documentElement.style.zoom='');
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
  await page.click('#fd-guide-launcher');await page.screenshot({path:'/private/tmp/ss-directory-guide-dark.png'});
  assert.equal(sent.length,0,'questions transmitted');
  const stored=await page.evaluate(()=>JSON.stringify({...localStorage,...sessionStorage}));assert(!stored.includes('Compare Huelley'),'chat persisted');
  await page.setJavaScriptEnabled(false);await page.reload({waitUntil:'networkidle2'});
  assert(await page.$eval('.fd-guide-static',e=>getComputedStyle(e).display!=='none'));
  assert(await page.$eval('[data-fd-interactive]',e=>e.hidden));
  assert.deepEqual(errors,[]);console.log('PASS directory: 4 widths, grounded results, contextual refinements, comparison, saved tray, copied brief, routing, keyboard/voice focus, dark/no-JS, no question transmission or storage.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
