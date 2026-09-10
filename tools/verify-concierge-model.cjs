/* Simulated provider verifies the browser contract; no live AI request or deployment. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try {
  const page=await browser.newPage(),requests=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  let fail=false;
  page.on('request',r=>{
   if(r.url().includes('/js/concierge-config.js'))return r.respond({status:200,contentType:'application/javascript',body:"export const guideEndpoint='http://127.0.0.1:8731/api/guide';"});
   if(r.url().endsWith('/api/guide')){
    requests.push(JSON.parse(r.postData()));
    return r.respond({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'unavailable'}:{answer:'Linen can feel comfortable in warm weather. Would you like help planning a travel wardrobe?'})});
   }
   r.continue();
  });
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
  await page.setViewport({width:390,height:1000});
  await page.goto('http://127.0.0.1:8731/links#lp-guide',{waitUntil:'networkidle2'});
  assert((await page.$eval('.ss-concierge-label',e=>e.textContent)).includes('AI service guide'));
  await page.type('#lp-concierge-question','Is linen comfortable for a humid trip?');await page.click('.ss-concierge-inputrow button');
  await page.waitForFunction(()=>document.querySelector('[data-concierge-live]').textContent.includes('Linen'));
  assert.equal(requests.length,1);assert.deepEqual(requests[0].history,[]);
  await page.type('#lp-concierge-question','And for dinner?');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('.ss-concierge-inputrow button').disabled);
  await page.waitForFunction(()=>document.querySelector('.ss-message-user')?.textContent==='And for dinner?');assert.equal(requests[1].history.length,2);assert.equal(await page.$$eval('[data-exchange]',es=>es.length),1);
  await page.$eval('#lp-guide',e=>e.scrollIntoView({behavior:'instant'}));
  await page.screenshot({path:'/private/tmp/ss-guide-brand-light.png'});
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  await page.screenshot({path:'/private/tmp/ss-guide-brand-dark.png'});
  fail=true;
  await page.type('#lp-concierge-question','What is shipping like?');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-concierge-error]').textContent.includes('unavailable'));
  await page.waitForFunction(()=>!document.querySelector('.ss-concierge-inputrow button').disabled);
  assert((await page.$eval('[data-concierge-live]',e=>e.textContent)).includes('Tracked international'));
  await page.click('[data-concierge-reset]');assert.equal(await page.$$eval('[data-exchange]',es=>es.length),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  console.log('PASS simulated model transport, context, one answer, provider fallback, reset, light/dark mobile rendering. No real inference tested.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
