/* Check translated primary journeys at desktop and mobile widths. */
'use strict';
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const assert=require('node:assert/strict');
const base=process.env.SS_PREVIEW||'http://127.0.0.1:8732';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.SS_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const file of ['index.html','sourcingandstyling.html','service-request.html','about.html','categories/accessories.html','fashion-directory.html']){
   await page.goto(base+'/'+file,{waitUntil:'domcontentloaded'});
   await page.evaluate(async()=>{await SS_SITE_I18N.ready;});
   for(const width of [390,1440]){
    await page.setViewport({width,height:1000});
    for(const lang of ['en',...(process.env.SS_TEST_LANGS||'vi,es,fr,ar,de,km').split(',')]){
     await page.evaluate(async lang=>{await SS_setLang(lang);await SS_SITE_I18N.ready;},lang);
     const measured=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,dir:document.documentElement.dir,lang:document.documentElement.lang}));
     assert.equal(measured.lang,lang,file+' language');
     assert.equal(measured.dir,/^(ar|fa)$/.test(lang)?'rtl':'ltr',file+' direction');
     assert(measured.scrollWidth<=measured.width+1,JSON.stringify({file,requested:lang,...measured}));
    }
   }
   console.log('PASS translated layout '+file+' at 390 and 1440px');
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
