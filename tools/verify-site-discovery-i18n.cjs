/* Real dictionaries: interpolated messages, language restoration and comparison actions. */
'use strict';
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const copy=require('./i18n/site-discovery.all.json');
const vars={name:'Fancì Club',amount:'1,234,567',date:'2026-09-12'};
const fill=s=>s.replace(/\{(\w+)\}/g,(_,key)=>vars[key]);
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.SS_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.SS_PREVIEW||'http://127.0.0.1:8732')+'/fashion-directory.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await SS_SITE_I18N.ready;await SS_setLang('en');});
  const originals=copy.keys.map(fill);
  await page.evaluate(strings=>{const host=document.createElement('section');host.id='discovery-i18n-test';strings.forEach(text=>{const p=document.createElement('p');p.textContent=text;host.append(p);});document.body.append(host);},originals);
  for(const locale of Object.keys(copy).filter(key=>key!=='keys')){
   await page.evaluate(async locale=>{await SS_setLang(locale);await SS_SITE_I18N.ready;await SS_SITE_I18N.refresh();},locale);
   const actual=await page.$$eval('#discovery-i18n-test p',nodes=>nodes.map(n=>n.textContent));
   assert.deepEqual(actual,copy[locale].map(fill),locale+' dynamic templates');
   await page.evaluate(()=>SS_setLang('en'));
   assert.deepEqual(await page.$$eval('#discovery-i18n-test p',nodes=>nodes.map(n=>n.textContent)),originals,locale+' English restoration');
   console.log('PASS directory dynamic templates '+locale);
  }
  await page.evaluate(async()=>{await SS_setLang('vi');document.querySelector('[data-compare-house]').click();await SS_SITE_I18N.refresh();});
  const saved=await page.evaluate(async()=>{
   const button=document.querySelector('.fd-house-mobile-comparison .fd-board-tools button');
   const name=document.querySelector('.fd-house-mobile-comparison h3').textContent;
   button.click();await SS_SITE_I18N.refresh();return {name,status:document.getElementById('fd-discovery-status').textContent};
  });
  assert.equal(saved.status,copy.vi[0].replace('{name}',saved.name));
  await page.evaluate(async()=>{
   // This delegated action is exposed by some directory views, not every card.
   const b=document.createElement('button');b.dataset.similarHouse=document.querySelector('[data-compare-house]').dataset.compareHouse;
   document.body.append(b);b.click();b.remove();await SS_SITE_I18N.refresh();
  });
  const untranslated=await page.$$eval('.fd-related dd,.fd-related dt',nodes=>nodes.map(n=>n.textContent).filter(s=>/^both |^same |^(Focus|Fabric|Occasion|Price tier)$/.test(s)));
  assert.deepEqual(untranslated,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS Vietnamese comparison actions');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
