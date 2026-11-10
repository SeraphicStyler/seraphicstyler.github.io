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
   assert.notEqual(await page.$eval('#rUsd',node=>node.textContent.trim()),'—');
   await page.evaluate(()=>{window.__handoff=null;window.Tally={openPopup:(...args)=>window.__handoff=args};window.open=(...args)=>window.__handoff=args;});
   await page.click('#sendBasket');
   assert.equal(await page.evaluate(()=>!!window.__handoff),false,'asks for the missing link once first');
   assert(await page.$eval('.item-note',node=>!node.hidden));
   await page.click('#sendBasket');
   assert(await page.evaluate(()=>!!window.__handoff),'request handoff; no real submission');
  }
  await page.evaluate(()=>localStorage.setItem('ss-basket',JSON.stringify({items:[500000],styling:'edit'})));
  await page.reload({waitUntil:'networkidle2'});
  assert.equal(await page.$eval('#rLeftover',node=>node.textContent),'2,000,000₫');
  // Foolproofing (9 Nov 2026): a price is never guessed, and the three figures always add up.
  await page.evaluate(()=>localStorage.removeItem('ss-basket'));
  await page.emulateTimezone('Europe/Paris');
  await page.reload({waitUntil:'networkidle2'});
  await page.waitForSelector('.est-ready');
  assert.equal(await page.$eval('#region',node=>node.value),'eu','region starts from the time zone');
  await page.evaluate(()=>{const s=document.getElementById('estCurrency');s.value='USD';s.dispatchEvent(new Event('change',{bubbles:true}));});
  assert(await page.$eval('#estAnswer',node=>node.hidden),'nothing typed, no empty receipt');
  const type=value=>page.$eval('.item-price',(node,value)=>{node.value=value;node.dispatchEvent(new Event('input',{bubbles:true}));},value);
  const typed=async value=>{await type(value);return Number(await page.$eval('#rSubtotal',node=>node.dataset.vnd));};
  await type('850');
  assert.equal(await page.$$eval('.item-ask button',buttons=>buttons.length),2,'a bare 850 asks which one');
  assert(await page.$eval('#estAnswer',node=>node.hidden),'no total until it is settled');
  await page.click('.item-ask button');
  assert.equal(await page.$eval('#rSubtotal',node=>node.dataset.vnd),'850000');
  for(const form of ['$100','100 USD','US$100','100$','100.00 usd']){const vnd=await typed(form);assert(vnd>2.3e6&&vnd<2.7e6,form+' reads as dollars: '+vnd);}
  for(const [form,vnd] of [['2,450,000',2450000],['2.450.000',2450000],['2450000',2450000],['2 450 000',2450000],['2.45tr',2450000],['2tr45',2450000],['850k',850000],['1.5m',1500000],['850.000đ',850000],['850000 vnd',850000]])assert.equal(await typed(form),vnd,form);
  await type('hello');
  assert.match(await page.$eval('.item-usd',node=>node.textContent),/read/i,'unreadable input says so');
  await type('2,450,000');
  const money=id=>page.$eval('#'+id,node=>node.textContent.match(/\d[\d,]*/g).map(part=>Number(part.replace(/,/g,''))));
  const [deposit,balance,total]=[await money('rDeposit'),await money('rBalance'),await money('rUsd')];
  assert.equal(deposit[0]+balance[0],total[0],'low end adds up');assert.equal(deposit[0]+balance[1],total[1],'high end adds up');
  await page.$$eval('#addItem',([button])=>{for(let i=0;i<6;i++)button.click();});
  await page.$$eval('.item-price',inputs=>inputs.forEach(input=>{input.value='1000000';input.dispatchEvent(new Event('input',{bubbles:true}));}));
  assert.equal(await page.$eval('#weight',node=>node.value),'standard','seven pieces is not a light parcel');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS malformed/legacy saved baskets, valid selections, visible total, request handoff, unused credit, typed-price reading, figures that add up');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
