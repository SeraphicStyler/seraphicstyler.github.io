/* Browser checks: no external submission, checkout, or payment. */
const assert = require('node:assert/strict');
const puppeteer = require(process.env.SS_PUPPETEER || 'puppeteer');
const origin = process.env.SS_PREVIEW || 'http://127.0.0.1:8731';
(async () => {
 const browser = await puppeteer.launch({headless:true});
 try {
  const page = await browser.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for (const width of [1440,390,320]) {
   await page.setViewport({width,height:900});
   await page.goto(origin+'/sourcingandstyling.html',{waitUntil:'networkidle2'});
   assert.equal(await page.title(),'Sourcing & Styling: Services & Prices · Seraphic Styler');
   assert.equal(await page.$$eval('.ss-styling-ledger tbody tr',els=>els.length),7);
   await page.$eval('details',e=>e.open=true);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'comparison overflow '+width);
   await page.screenshot({path:'/private/tmp/sourcing-styling-'+width+'.png',fullPage:true});
  }
  for (const service of ['sourcing','trace','styling','gift','bulk','unsure']) {
   await page.goto(origin+'/service-request.html?service='+service+'&tier=custom-wardrobe',{waitUntil:'networkidle2'});
   if(service==='sourcing') await page.select('#item-source','link');
   assert(await page.$eval(`[data-fields="${service}"]`,e=>!e.disabled&&!e.hidden));
   await page.evaluate(()=>{
    for(const e of document.querySelectorAll('input[required]:not(:disabled), textarea[required]:not(:disabled), select[required]:not(:disabled)')) {
     if(['checkbox','radio'].includes(e.type)||e.id==='confirmed-service')continue;
     if(e.tagName==='SELECT'){if(!e.value)e.selectedIndex=1;}
     else e.value=e.type==='date'?'2026-12-01':'Test client brief';
    }
   });
   await page.click('button[type="submit"]');
   assert(await page.$eval('#request-review',e=>e.hidden));
   await page.click('[name="Service terms understood"]');
   await page.click('button[type="submit"]');
   assert(await page.$eval('#request-review',e=>!e.hidden),'review '+service);
   const summary=await page.$eval('#request-summary',e=>e.value);
   assert(summary.includes('Service: '+service));assert(summary.includes('may be redirected to the appropriate service'));
   assert(!(await page.$eval('#continue-request',e=>e.href)).includes('Test'));
   await page.click('#edit-request');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'intake overflow '+service);
   console.log('PASS '+service+': single consent, review, private handoff, mobile');
  }
  await page.goto(origin+'/service-request.html?service=sourcing');
  await page.select('#item-source','unknown');
  assert.equal(await page.$eval('[name="service"]:checked',e=>e.value),'trace');
  await page.select('#trace-count','6+ — styling quote required');
  assert.equal(await page.$eval('[name="service"]:checked',e=>e.value),'styling');
  await page.click('[name="service"][value="sourcing"]');
  await page.select('#item-source','inspiration');
  assert.equal(await page.$eval('[name="service"]:checked',e=>e.value),'styling');
  assert.equal(await page.$$eval('.ss-consent input',els=>els.length),1);
  assert.deepEqual(errors,[]);
  console.log('PASS unknown source, non-Vietnamese inspiration, 6+ research routing, single consent; no JavaScript errors');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
