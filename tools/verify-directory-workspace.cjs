/* The directory workspace, end to end. 16 Nov 2026: the landing is the logo wall (every house, no paging);
   a house opens in the quick look; searching switches to detail cards; other workspaces sit under Tools.
   Needs the local preview: node tools/serve.mjs 8731   (or SS_PREVIEW=http://127.0.0.1:<port>) */
const assert=require('node:assert/strict'),puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
(async()=>{const b=await puppeteer.launch({headless:true});try{const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);const base=origin+'/fashion-directory';
const view=()=>p.evaluate(()=>document.body.dataset.directoryView),mode=()=>p.evaluate(()=>document.body.dataset.houseView);
const total=321,tiles=()=>p.$$eval('.fw-tile',es=>es.length),quickOpen=()=>p.$eval('#fd-quick',e=>e.open),quickName=()=>p.$eval('#fq-name',e=>e.textContent);
const tools=async width=>{await p.click(width<=720?'.tabbar [data-act=tools]':'.fw-tools');assert(await p.$eval('#fd-toolbox',e=>e.open),'tools open');};
for(const width of [320,390,768,1024,1440]){
 await p.setViewport({width,height:1000});await p.goto(base,{waitUntil:'networkidle2'});await p.waitForSelector('.fw-tile');
 // The landing: one wall with every house, grouped by category, under a shelf of eight.
 assert.equal(await view(),'search');assert.equal(await mode(),'wall');assert.equal(await tiles(),total,'every house is on the wall');assert.equal(await p.$$eval('.fw-sec',es=>es.length),11);
 assert.equal(await p.$$eval('.fs-tile',es=>es.filter(e=>e.getClientRects().length).length),8,'shelf shows eight houses');
 assert(await p.$eval('#browse',e=>e.hidden));assert(await p.$eval('.fd-journey',e=>!e.getClientRects().length),'workspace tabs stay under Tools on the landing');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
 const perRow=await p.$$eval('#wall-women .fw-tile',es=>{const y=es[0].getBoundingClientRect().top;return es.filter(e=>Math.abs(e.getBoundingClientRect().top-y)<2).length;});
 assert(width<=720?perRow===3:perRow>=5,'tiles per row at '+width+': '+perRow);
 await p.screenshot({path:'/private/tmp/ss-workspace-search-'+width+'.png'});
 // Quick look: opens on a tile, steps with the arrow keys, closes back onto the wall.
 await p.click('.fw-tile');assert(await quickOpen());const first=await quickName();assert.equal(first,await p.evaluate(()=>SS_DIRECTORY[+document.querySelector('.fw-tile').dataset.house].n));
 assert(await p.$eval('#fd-quick',e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}),'quick look fits '+width);
 assert(await p.$('#fd-quick .fq-step .ff-go'),'the one next step lives in the quick look');assert(!await p.$('#main .ff-go'),'no service line on the wall tiles');
 await p.screenshot({path:'/private/tmp/ss-workspace-quick-'+width+'.png'});
 await p.keyboard.press('ArrowRight');assert.notEqual(await quickName(),first);await p.keyboard.press('Escape');assert(!await quickOpen());assert(await p.evaluate(()=>document.activeElement.classList.contains('fw-tile')),'focus returns to the wall');
 // Search switches to detail cards; the record and comparison are still one step away.
 await p.type('#q','daniv.dear');await p.waitForFunction(()=>document.querySelectorAll('.fw-card').length===1);assert.equal(await mode(),'details');assert((await p.$eval('#main .fw-card-name',e=>e.textContent)).includes('Daniv Dear'));assert(await p.$eval('#fd-featured',e=>e.hidden),'shelf steps aside while searching');
 await p.click('.fw-card-open');assert((await quickName()).includes('Daniv Dear'));await p.click('.fq-record');assert(!await quickOpen());assert.equal(await view(),'record');assert((await p.$eval('#brand-record',e=>e.textContent)).includes('Per-house review date not recorded'));assert(!await p.$eval('#brand-record',e=>e.textContent.includes('CLOSED NOW')));await p.screenshot({path:'/private/tmp/ss-workspace-record-'+width+'.png'});
 await p.click('#brand-record [data-compare-house]');assert.equal(await view(),'compare');assert(await p.$eval('#fd-house-comparison',e=>e.textContent.includes('Daniv Dear')));
 await p.click('.fd-journey [data-workspace-view=search]');assert.equal(await p.$eval('#q',e=>e.value),'daniv.dear','filters survive view change');
 await p.click('#qclear');await p.waitForFunction(n=>document.querySelectorAll('.fw-tile').length===n,{},total);
 // Filters: one panel at every width; categories stay in their own row.
 assert(await p.$eval('#catchips',e=>!!e.closest('.fd-catbar')&&!e.closest('#sheet')));
 await p.click(width<=720?'.tabbar [data-act=sheet]':'.fw-filters');assert(await p.$eval('#sheet',e=>!e.hidden));assert(await p.$eval('#tiersel',e=>!!e.closest('#sheet')));await p.select('#tiersel','mid');await p.click('#sheetdone');await p.waitForFunction(()=>document.querySelector('#sheet').hidden);
 assert(await p.$$eval('.fw-tile',es=>es.length>0&&es.every(e=>SS_DIRECTORY[+e.dataset.house].tier==='mid')));assert((await p.$eval('#activebar',e=>e.textContent)).length>0);
 await p.click('#catchips [data-v=bridal]');assert(await p.$$eval('.fw-tile',es=>es.length>0&&es.every(e=>SS_DIRECTORY[+e.dataset.house].cat==='bridal')));assert.equal(await p.$$eval('.fw-sec',es=>es.length),1);
 // Tools: the other workspaces, under one button.
 await tools(width);assert.equal(await p.$$eval('#fd-toolbox .ft-list li',es=>es.length),7);await p.click('#fd-toolbox a[href="?view=explore"]');assert(!await p.$eval('#fd-toolbox',e=>e.open));assert.equal(await view(),'explore');assert(await p.$eval('#main',e=>!e.getClientRects().length));
 await p.click('.fd-journey [data-workspace-view=visit]');await p.waitForSelector('.fdmap-head .ssrp-open');assert(await p.$eval('#map',e=>!e.hidden));await p.click('#fdmap-districts [data-z=d3]');await p.click('.fdmap-results');assert.equal(await view(),'search');
 await p.click('#fd-guide-launcher');await p.type('#fd-guide-question','linen');await p.keyboard.press('Enter');assert(await p.$eval('#fd-guide-answer',e=>!e.hidden));await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'fd-guide-launcher');
 await tools(width);await p.click('#fd-toolbox a[href="?view=buy"]');assert(await p.$eval('#piece-board',e=>!e.hidden));
}
await p.goto(base+'?view=record&brand=daniv-dear',{waitUntil:'networkidle2'});assert(await p.$eval('#brand-record',e=>e.textContent.includes('Daniv Dear')));await p.click('.fd-journey [data-workspace-view=explore]');await p.goBack();assert.equal(await view(),'record');
// Details by hand: 24 cards, then more on request; the choice holds until switched back.
await p.goto(base,{waitUntil:'networkidle2'});await p.waitForSelector('.fw-tile');await p.click('.fw-view [data-view=details]');assert.equal(await p.$$eval('.fw-card',es=>es.length),24);assert(await p.$('.fw-card .fw-heart'));
await p.click('.fw-more');assert.equal(await p.$$eval('.fw-card',es=>es.length),48);await p.click('.fw-view [data-view=wall]');assert.equal(await tiles(),total);
// Saving: the heart in the quick look marks the tile and feeds the Saved filter.
await p.click('.fw-tile');const savedName=await quickName();await p.click('.fq-heart');assert.equal(await p.$eval('.fq-heart',e=>e.getAttribute('aria-pressed')),'true');await p.keyboard.press('Escape');
assert.equal(await p.$$eval('.fw-tile[data-saved]',es=>es.length),1);await p.click('#savedbtn');await p.waitForFunction(()=>document.querySelectorAll('.fw-tile').length===1);assert.equal(await p.$eval('.fw-name',e=>e.textContent),savedName);
await p.click('.fw-tile');await p.click('.fq-heart');await p.keyboard.press('Escape');await p.click('#savedbtn');await p.waitForFunction(n=>document.querySelectorAll('.fw-tile').length===n,{},total);assert.equal(await p.$$eval('.fw-tile[data-saved]',es=>es.length),0);
// The shelf: another occasion, and its arrows stay inside the eight.
await p.click('#ff-tab-evening');await p.click('#ff-panel-evening .fs-tile');assert((await p.$eval('.fq-pos',e=>e.textContent)).endsWith('/ 8'));await p.keyboard.press('Escape');
// Ask the directory from Tools.
await tools(1440);await p.click('#fd-toolbox [data-tool=ask]');await p.type('#fd-guide-question','linen');await p.keyboard.press('Enter');assert(await p.$eval('#fd-guide-answer',e=>!e.hidden));await p.keyboard.press('Escape');
await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));await p.screenshot({path:'/private/tmp/ss-workspace-dark.png'});
await p.click('.fd-reference-link');assert(await p.$eval('#ss-static-index',e=>!e.hidden));await p.click('#plain-az>summary');assert.equal(await p.$$eval('.si-list>li',es=>es.length),total);
await p.setJavaScriptEnabled(false);await p.goto(base,{waitUntil:'networkidle2'});assert(await p.$eval('#ss-static-index',e=>e.getClientRects().length>0));assert.equal(await p.$$eval('.si-list>li',es=>es.length),total);assert.deepEqual(errors,[]);
console.log('PASS workspace: five widths, logo wall (every house), shelf, quick look, search → detail cards, records, compare, URL views/history, preserved filters, filter panel, Tools, map handoff, assistant, saving, dark mode, static fallback.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
