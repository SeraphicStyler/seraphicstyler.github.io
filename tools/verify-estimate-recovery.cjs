const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewport({width:390,height:844});
  await page.goto(origin+'/estimate.html',{waitUntil:'networkidle2'});
  for(const basket of [{items:'old-format'},{items:[2000000],region:'retired-region',weight:'retired-weight',styling:'retired-tier',pay:'old-method',cur:'OLD'},{items:[null,{},2000000],links:[null,5,'https://example.com/piece']}]){
   await page.evaluate(basket=>localStorage.setItem('ss-basket',JSON.stringify(basket)),basket);
   await page.reload({waitUntil:'networkidle2'});
   await page.waitForSelector('.est-ready');
   assert(await page.$$eval('#region,#weight,#styling,#payMethod,#estCurrency',selects=>selects.every(select=>select.selectedIndex>=0)));
   await page.$eval('.item-price',input=>{input.value='2000000';input.dispatchEvent(new Event('input',{bubbles:true}));});
   assert.equal(await page.$eval('#estQuickTotal',node=>node.textContent),await page.$eval('#rTotal',node=>node.textContent));
   await page.evaluate(()=>{window.__handoff=null;window.Tally={openPopup:(...args)=>window.__handoff=args};window.open=(...args)=>window.__handoff=args;});
   await page.click('#sendBasket');
   assert(await page.evaluate(()=>!!window.__handoff),'request handoff; no real submission');
  }
  await page.evaluate(()=>localStorage.setItem('ss-basket',JSON.stringify({items:[500000],styling:'discovery'})));
  await page.reload({waitUntil:'networkidle2'});
  assert.equal(await page.$eval('#rLeftover',node=>node.textContent),'350,000₫');
  await page.click('.est-quick-result a');
  assert.equal(await page.evaluate(()=>location.hash),'#estimate-total');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS malformed/legacy saved baskets, valid selections, visible running total, request handoff, unused credit');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
