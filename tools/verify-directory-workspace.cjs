const assert=require('node:assert/strict'),puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
(async()=>{const b=await puppeteer.launch({headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);const base='http://127.0.0.1:8731/fashion-directory';
for(const width of [320,390,768,1024,1440]){
 await p.setViewport({width,height:1000});await p.goto(base,{waitUntil:'networkidle2'});await p.waitForSelector('.fd-result-row');
 assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'search');assert.equal(await p.$$eval('.fd-result-row',es=>es.length),24);assert(await p.$eval('#browse',e=>e.hidden));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
 await p.screenshot({path:'/private/tmp/ss-workspace-search-'+width+'.png'});
 await p.type('#q','daniv.dear');await p.waitForFunction(()=>document.querySelectorAll('.fd-result-row').length===1);assert((await p.$eval('.fd-result-name',e=>e.textContent)).includes('Daniv Dear'));
 await p.click('.fd-result-name a');assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'record');assert((await p.$eval('#brand-record',e=>e.textContent)).includes('Per-house review date not recorded'));assert(!await p.$eval('#brand-record',e=>e.textContent.includes('CLOSED NOW')));await p.screenshot({path:'/private/tmp/ss-workspace-record-'+width+'.png'});
 await p.click('#brand-record [data-compare-house]');assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'compare');assert(await p.$eval('#fd-house-comparison',e=>e.textContent.includes('Daniv Dear')));
 await p.click('.fd-journey [data-workspace-view=search]');assert.equal(await p.$eval('#q',e=>e.value),'daniv.dear','filters survive view change');
 await p.click('#qclear');await p.waitForFunction(()=>document.querySelectorAll('.fd-result-row').length===24);
 if(width<=720){await p.click('.fd-mobile-filters');assert(await p.$eval('#sheet',e=>!e.hidden));assert(await p.$eval('#catchips',e=>!!e.closest('#sheet')));await p.select('#tiersel','mid');await p.click('#sheetdone');await p.waitForFunction(()=>document.querySelector('#sheet').hidden);}else await p.select('#tiersel','mid');
 assert(await p.$$eval('.fd-result-row',es=>es.every(e=>e.textContent.includes('mid'))));assert((await p.$eval('#activebar',e=>e.textContent)).length>0);
 await p.click('.fd-journey [data-workspace-view=explore]');assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'explore');assert(await p.$eval('#main',e=>!e.getClientRects().length));
 await p.click('.fd-journey [data-workspace-view=visit]');await p.waitForSelector('.fdmap-head .ssrp-open');assert(await p.$eval('#map',e=>!e.hidden));await p.click('#fdmap-districts [data-z=d3]');await p.click('.fdmap-results');assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'search');
 await p.click('#fd-guide-launcher');await p.type('#fd-guide-question','linen');await p.keyboard.press('Enter');assert(await p.$eval('#fd-guide-answer',e=>!e.hidden));await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'fd-guide-launcher');
 await p.click('.fd-journey [data-workspace-view=buy]');assert(await p.$eval('#piece-board',e=>!e.hidden));
}
await p.goto(base+'?view=record&brand=daniv-dear',{waitUntil:'networkidle2'});assert(await p.$eval('#brand-record',e=>e.textContent.includes('Daniv Dear')));await p.click('.fd-journey [data-workspace-view=explore]');await p.goBack();assert.equal(await p.evaluate(()=>document.body.dataset.directoryView),'record');
await p.goto(base,{waitUntil:'networkidle2'});await p.click('[data-format=rich]');assert(await p.$('.card .fd-open-record'));await p.click('[data-format=compact]');assert.equal(await p.$$eval('.fd-result-row',es=>es.length),24);
await p.click('.fd-context-disclosure>summary');await p.type('#fd-context-question','linen');await p.click('.fd-context-guide button');assert(await p.$eval('#fd-guide-answer',e=>!e.hidden));await p.keyboard.press('Escape');
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await p.screenshot({path:'/private/tmp/ss-workspace-dark.png'});
await p.click('.fd-reference-link');assert(await p.$eval('#ss-static-index',e=>!e.hidden));await p.click('#plain-az>summary');assert.equal(await p.$$eval('.si-list>li',es=>es.length),321);
await p.setJavaScriptEnabled(false);await p.goto(base,{waitUntil:'networkidle2'});assert(await p.$eval('#ss-static-index',e=>e.getClientRects().length>0));assert.equal(await p.$$eval('.si-list>li',es=>es.length),321);assert.deepEqual(errors,[]);
console.log('PASS workspace: five widths, compact pagination, search, records, compare, URL views/history, preserved filters, mobile sheet, map handoff, assistant, rich cards, dark mode, static fallback.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
