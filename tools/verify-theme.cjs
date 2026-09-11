/* Run against the integrated local site; no inquiries or external writes. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
(async()=>{
 const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
 try {
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:390,height:844});
 await page.evaluateOnNewDocument(()=>{localStorage.setItem('ss-theme','light');localStorage.setItem('ss-motion','0');localStorage.setItem('ss-contrast','0');});
 for(const file of ['index.html','links.html','lookbook.html','sourcingandstyling.html','fashion-directory.html','field-guide.html','find.html']){
  await page.goto('http://127.0.0.1:8731/'+file,{waitUntil:'networkidle2'});
  await page.waitForFunction(()=>window.SS_THEME);
  await page.evaluate(()=>window.scrollTo(0,0));
  const before=await page.$eval('h1',e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
  await page.evaluate(()=>{SS_THEME.set('dark');SS_THEME.set('mono');SS_THEME.set('light');SS_THEME.set('dark');});
  await page.waitForFunction(()=>!document.documentElement.classList.contains('ss-theme-snapshot'));
  assert.equal(await page.evaluate(()=>SS_THEME.effective()),'dark',file);
  assert(await page.evaluate(()=>document.documentElement.classList.contains('dark')),file);
  assert.equal(await page.evaluate(()=>localStorage.getItem('ss-theme')),'dark',file);
  const after=await page.$eval('h1',e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}));
  assert.deepEqual(after,before,file+' must not move content');
  await page.evaluate(()=>SS_THEME.set('mono'));
  await page.waitForFunction(()=>!document.documentElement.classList.contains('ss-theme-snapshot'));
  assert(await page.evaluate(()=>document.documentElement.classList.contains('mono')),file);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluate(()=>SS_THEME.set('light'));
  assert(await page.evaluate(()=>SS_THEME.effective()==='light'&&!document.documentElement.classList.contains('ss-theme-snapshot')),file);
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);
  await page.evaluate(()=>{SS_THEME.set('dark');document.documentElement.classList.add('rm');});
  await new Promise(r=>setTimeout(r,150));
  assert(await page.evaluate(()=>document.documentElement.classList.contains('dark')&&!document.documentElement.classList.contains('ss-theme-snapshot')),file+' cancel on motion change');
  await page.evaluate(()=>{document.documentElement.classList.remove('rm');document.startViewTransition=undefined;SS_THEME.set('mono');});
  await new Promise(r=>setTimeout(r,350));
  assert(await page.evaluate(()=>document.documentElement.classList.contains('mono')&&!document.documentElement.classList.contains('ss-theme-fallback')),file+' fallback');
  console.log('PASS theme',file);
 }
 await page.goto('http://127.0.0.1:8731/fashion-directory?view=search',{waitUntil:'networkidle2'});
 for(const width of [320,390,768,1440]){
  await page.setViewport({width,height:900});
  await page.click('.fd-appearance>summary');
  await page.click('[data-theme-choice=dark]');
  await page.waitForFunction(()=>!document.documentElement.classList.contains('ss-theme-snapshot'));
  assert(await page.$eval('[data-theme-choice=dark]',e=>e.getAttribute('aria-pressed')==='true'));
  await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.closest('details')?.className),'fd-appearance');
  await page.click('.fd-site-menu>summary');
  const bounds=await page.$$eval('.fd-site-menu a',es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,right:r.right,h:r.height}}));
  assert(bounds.every(r=>r.x>=0&&r.right<=width&&r.h>=44),'menu fits '+width);
  await page.screenshot({path:'/private/tmp/ss-theme-menu-'+width+'.png'});
  await page.keyboard.press('Escape');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
 }
 await page.setViewport({width:390,height:844});await page.click('.fd-appearance>summary');
 await page.screenshot({path:'/private/tmp/ss-theme-preferences-mobile.png'});
 await page.click('[data-theme-choice=mono]');await page.keyboard.press('Escape');
 await new Promise(r=>setTimeout(r,400));await page.screenshot({path:'/private/tmp/ss-theme-mono-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS appearance controls, four widths, keyboard, menus, zero page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
