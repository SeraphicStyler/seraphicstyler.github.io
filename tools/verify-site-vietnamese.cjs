'use strict';
const fs=require('node:fs'),path=require('node:path');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'tools/i18n/site-source.json'),'utf8'));
const language=process.env.SS_TEST_LANG||'vi';
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.SS_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage();await page.setViewport({width:1440,height:1000});
  const errors=[],report=[];page.on('pageerror',error=>errors.push(error.message));
  const pages=process.argv.includes('--all')?source.pages:['index.html','sourcingandstyling.html','about.html','service-request.html'];
  for(const file of pages){
   await page.goto((process.env.SS_PREVIEW||'http://127.0.0.1:8732')+'/'+file,{waitUntil:'domcontentloaded'});
   try{await page.waitForFunction(()=>!!window.SS_SITE_I18N,{timeout:10000});}
   catch{
    const url=new URL(page.url());const target=url.pathname.replace(/^\//,'')+'.html';
    if(url.origin===new URL(process.env.SS_PREVIEW||'http://127.0.0.1:8732').origin&&!path.extname(url.pathname)&&source.pages.includes(target)){
     await page.goto(url.origin+'/'+target,{waitUntil:'domcontentloaded'});
     await page.waitForFunction(()=>!!window.SS_SITE_I18N,{timeout:10000});
    }else throw Error(file+': translation runtime missing at '+page.url());
   }
   await page.evaluate(async language=>{await SS_SITE_I18N.ready;await SS_setLang(language);await SS_SITE_I18N.ready;},language);
   const result=await page.evaluate(source=>{
    const originals=new Set(source),missing=new Set();
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while(n=walker.nextNode()){
     if(n.parentElement.closest('script,style,code,pre,textarea,noscript,[translate="no"],.notranslate,#langSelect,.ss-lang-select,.ss-message-user'))continue;
     const s=n.data.replace(/\s+/g,' ').trim();
     if(originals.has(s)&&/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(s)&&!['Seraphic Styler','Custom Wardrobe','The Trace','Ho Chi Minh City','New York','Google Maps'].includes(s))missing.add(s);
    }
    return {language:document.documentElement.lang,outline:[...document.querySelectorAll('.ss-section-nav nav a')].map(el=>el.textContent),remainingEnglish:[...missing]};
   },source.strings);
   if(result.language!==language)throw Error(file+': wrong language');
   report.push({file,...result});
   if(process.argv.includes('--all')&&report.length%25===0)console.log('Audited '+report.length+'/'+pages.length+' pages');
  }
  const output=process.argv.find(a=>a.startsWith('--out='))?.slice(6);
  if(output){fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');for(const row of report)console.log(row.file+': '+row.remainingEnglish.length+' source-text candidates remain');}
  else console.log(JSON.stringify(report,null,2));
  if(errors.length)throw Error(errors.join('\n'));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
