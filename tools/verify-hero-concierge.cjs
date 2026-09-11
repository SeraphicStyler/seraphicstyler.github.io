/* Local homepage checks only: no inquiry, payment, or external form submission. */
const assert=require('node:assert/strict');
const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
const origin=process.env.SS_PREVIEW||'http://127.0.0.1:8731';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-color-scheme',value:'light'}]);
  for(const width of [320,390,768,1024,1440]) {
   await page.setViewport({width,height:1000,deviceScaleFactor:1});
   await page.goto(origin+'/',{waitUntil:'networkidle2'});
   assert.equal(await page.$$eval('.ss-story-card',nodes=>nodes.length),6);
   assert(await page.$eval('.ss-concierge',node=>node.classList.contains('ss-concierge-ready')));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+width);
   const bad=await page.$$eval('.ss-story-card',nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.left<0||r.right>innerWidth||r.width<220}).map(node=>node.className));
   assert.deepEqual(bad,[],'scene card bounds '+width);
   const smallTargets=await page.$$eval('.ss-concierge button,.ss-concierge input,.ss-story-card a',nodes=>nodes.filter(node=>node.getClientRects().length&&Math.min(node.getBoundingClientRect().height,node.getBoundingClientRect().width)<44).map(node=>node.textContent.trim()||node.tagName));
   assert.deepEqual(smallTargets,[],'small targets '+width);
   await page.$eval('#service-story',node=>node.scrollIntoView({behavior:'instant'}));
   await page.screenshot({path:'/private/tmp/ss-service-story-'+width+'.png'});
  }
  await page.setViewport({width:1440,height:1000});await page.goto(origin+'/',{waitUntil:'networkidle2'});
  assert.equal(await page.$$eval('.ss-concierge [data-topic]',nodes=>nodes.filter(node=>node.getClientRects().length).length),3,'three initial suggestions');
  await page.click('[data-concierge-more-toggle]');
  assert.equal(await page.$eval('[data-concierge-more-toggle]',node=>node.getAttribute('aria-expanded')),'true');
  assert.equal(await page.$$eval('.ss-concierge [data-topic]',nodes=>nodes.filter(node=>node.getClientRects().length).length),9,'additional suggestions revealed');
  const asked=[];page.on('request',request=>{if(request.url().includes('I%20have%20a%20shop'))asked.push(request.url());});
  const cases=[
   ['I have a shop link for this dress.','Sourcing is purchase help','sourcing'],
   ['Can you identify this exact dress?','The Trace investigates','trace'],
   ['Find something with this feeling.','Styling is for selection','styling'],
   ['I have a photo.','Would you like that exact item','photo'],
   ['What is the difference between identifying an exact dress and styling?','Sourcing is for',''],
   ['I want similar pieces, not the exact dress.','Styling is for selection','styling'],
   ['Identify this exact dress, no alternatives.','The Trace investigates','trace'],
   ['I need outfits for a wedding.','Styling is for selection','styling'],
   ['How much is shipping to my country?','Tracked international delivery','shipping'],
   ['Is this item in stock?','Live availability needs','stock'],
   ['I want stock for my boutique.','Boutique buying supports','boutique'],
   ['I’m ordering matching outfits for a group.','Group buying is for','group'],
   ['I want a gift for twenty people.','For one recipient','groupgift'],
   ['Can you explain quantum physics?','This guide explains','']
  ];
  for(const [question,expected,scene] of cases){
   await page.type('#ss-concierge-question',question);await page.click('.ss-concierge-inputrow button');
   await page.waitForFunction(expected=>[...document.querySelectorAll('.ss-message-guide')].at(-1)?.textContent.includes(expected),{timeout:5000},expected);
   assert((await page.$eval('[data-concierge-live]',node=>node.textContent)).includes(expected));
   if(scene)assert(await page.$eval('.ss-story-card.is-discussed', (node,scene)=>node.dataset.sceneTopic.split(' ').includes(scene),scene));
  }
  assert.equal(asked.length,0,'visitor question transmitted');
  assert.equal(await page.$$eval('[data-exchange]',nodes=>nodes.length),1,'one active answer');
  const stored=await page.evaluate(()=>Object.keys(localStorage).map(key=>localStorage.getItem(key)).join(' ')+' '+Object.keys(sessionStorage).map(key=>sessionStorage.getItem(key)).join(' '));
  assert(!stored.includes('shop link for this dress'),'visitor question not persisted');
  await page.$eval('[data-concierge-reset]',node=>node.click());await page.waitForFunction(()=>document.querySelectorAll('[data-exchange]').length===0);
  await page.focus('#ss-concierge-question');await page.type('#ss-concierge-question','How does pricing work?');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-concierge-live]').textContent.includes('A sourcing quote separates'));
  assert.equal(await page.evaluate(()=>document.activeElement.id),'ss-concierge-question','input focus preserved while answering');
  await page.$eval('[data-concierge-reset]',node=>node.click());
  await page.focus('[data-topic="photo"]');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('[data-concierge-live]').textContent.includes('What would you like'));
  assert.equal(await page.$$eval('.ss-followup-choices button',nodes=>nodes.length),2,'photo route offers exact or similar');
  await page.$eval('[data-concierge-reset]',node=>node.click());
  await page.click('.ss-concierge-inputrow button');assert.equal(await page.$eval('[data-concierge-error]',node=>node.textContent),'Write a short question, or choose one above.');
  await page.click('[data-topic="photo"]');await page.click('.ss-followup-choices button');await page.waitForFunction(()=>document.querySelector('.ss-message-actions')?.textContent.includes('Start The Trace'));
  assert(await page.$('.ss-message-actions a[href="service-request.html?service=trace"]'));
  await page.$eval('[data-concierge-reset]',node=>node.click());
  await page.type('#ss-concierge-question','x'.repeat(400));assert.equal(await page.$eval('#ss-concierge-question',node=>node.value.length),300,'long input bounded');
  await page.$eval('#ss-concierge-question',node=>{node.value='';});await page.type('#ss-concierge-question','Sourcing or styling?');await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('[data-exchange]').length===1);
  await page.$eval('[data-concierge-reset]',node=>node.click());await pause(500);assert.equal(await page.$$eval('[data-exchange]',nodes=>nodes.length),0,'reset cancels stale response');
  await page.evaluate(()=>document.documentElement.classList.add('ts-xl'));
  assert.equal(await page.$eval('.ss-story-card',node=>getComputedStyle(node).position),'relative','enlarged text uses normal flow');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'enlarged text overflow');
  await page.evaluate(()=>document.documentElement.classList.add('dark','hc','rm'));
  assert.notEqual(await page.$eval('.ss-concierge',node=>getComputedStyle(node).backgroundColor),'rgba(0, 0, 0, 0)');
  assert.equal(await page.$eval('.ss-story-atmosphere',node=>getComputedStyle(node).display),'none');
  await page.screenshot({path:'/private/tmp/ss-concierge-desktop.png'});
  await page.setJavaScriptEnabled(false);await page.goto(origin+'/',{waitUntil:'networkidle2'});
  assert(await page.$eval('.ss-concierge-static',node=>getComputedStyle(node).display!=='none'));
  assert.equal(await page.$eval('[data-concierge-interactive]',node=>getComputedStyle(node).display),'none');
  assert.equal(await page.$$eval('.ss-story-card',nodes=>nodes.length),6);
  assert.deepEqual(errors,[]);
  console.log('PASS hero guide: 5 breakpoints, 14 intents, keyboard focus, privacy, reset, bounded history, scene linking, reduced motion, dark/high contrast, no-JS; no browser errors');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
