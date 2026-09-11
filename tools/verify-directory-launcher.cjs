const assert=require('node:assert/strict'),puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
(async()=>{const browser=await puppeteer.launch({headless:true});try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
 for(const width of [320,390,768,1440]){
  await page.setViewport({width,height:960});await page.goto(origin+'/fashion-directory',{waitUntil:'networkidle2'});await page.waitForSelector('#fd-guide-launcher');
  assert(await page.$eval('#fd-guide',e=>e.hidden));
  assert(await page.$eval('#fd-guide-launcher',e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.right<=innerWidth&&r.left>=0;}));
  await page.screenshot({path:'/private/tmp/ss-assistant-closed-'+width+'.png'});
  await page.click('#fd-guide-launcher');assert.equal(await page.evaluate(()=>document.activeElement.id),'fd-guide-question');
  assert.equal(await page.$eval('#fd-guide-launcher',e=>e.getAttribute('aria-expanded')),'true');
  const bounds=await page.$eval('#fd-guide',e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth;});assert(bounds,'panel fits '+width);
  await page.focus('#fd-guide-minimize');await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');assert(await page.evaluate(()=>document.activeElement.matches('#fd-guide-form button[type=submit]')),'shift-tab wraps');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'fd-guide-minimize','tab wraps');
  await page.screenshot({path:'/private/tmp/ss-assistant-open-'+width+'.png'});
  await page.keyboard.press('Escape');assert(await page.$eval('#fd-guide',e=>e.hidden));assert.equal(await page.evaluate(()=>document.activeElement.id),'fd-guide-launcher');
  await page.click('#fd-guide-launcher');await page.click('h1');assert(await page.$eval('#fd-guide',e=>e.hidden),'outside pointer dismisses utility');
  await page.evaluate(()=>SS_WORKSPACE.go('reference'));await page.$eval('#ss-static-index',e=>e.scrollIntoView({behavior:'instant'}));assert.equal(await page.$$eval('.si-list>li',es=>es.length),321);
  assert(await page.$$eval('.si details',es=>es.every(e=>!e.open)),'reference starts calm');
  assert.equal(await page.$eval('.si-meta time',e=>e.dateTime),'2026-08-28','formatting is not a new source review');
  await page.click('.si-jumps a[href="#plain-area"]');assert(await page.$eval('#plain-area',e=>e.open));
  await page.$eval('#plain-area',e=>e.open=false);await page.screenshot({path:'/private/tmp/ss-plain-reference-'+width+'.png'});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.goto(origin+'/fashion-directory#fd-guide',{waitUntil:'networkidle2'});assert.equal(await page.$eval('#fd-guide-launcher',e=>e.getAttribute('aria-expanded')),'true','deep link opens');
 await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await page.screenshot({path:'/private/tmp/ss-assistant-dark.png'});
 await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
 await page.click('#fd-guide-minimize');assert(await page.$eval('#fd-guide',e=>e.inert),'closing panel is not tabbable');await page.waitForFunction(()=>document.querySelector('#fd-guide').hidden);
 await page.click('#fd-guide-launcher');await page.click('#fd-guide-minimize');await page.click('#fd-guide-launcher');await new Promise(r=>setTimeout(r,220));assert(await page.$eval('#fd-guide',e=>!e.hidden&&!e.inert),'rapid reopening cancels close timer');
 await page.evaluate(()=>document.documentElement.classList.add('rm'));await page.keyboard.press('Escape');assert(await page.$eval('#fd-guide',e=>e.hidden),'manual reduced motion closes immediately');
 await page.setJavaScriptEnabled(false);await page.goto(origin+'/fashion-directory',{waitUntil:'networkidle2'});assert.equal(await page.$('#fd-guide-launcher'),null);assert(await page.$eval('.fd-guide-static',e=>e.getClientRects().length>0));
 await page.click('#plain-az>summary');assert(await page.$eval('#plain-az',e=>e.open));assert.equal(await page.$$eval('.si-list>li',es=>es.length),321);await page.click('#fd-reference-notes>summary');assert(await page.$eval('#fd-reference-notes',e=>e.open));
 assert.deepEqual(errors,[]);console.log('PASS launcher/reference: four widths, closed and open layouts, 44px launcher, focus cycle and restoration, Escape/outside dismissal, deep links, rapid toggles, motion preferences, dark mode, preserved review date and 321 static entries without JavaScript.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
