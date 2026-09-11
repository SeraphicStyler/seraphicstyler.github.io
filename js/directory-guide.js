/* Local, evidence-led discovery. Uses the directory's existing filter engine.
   Questions and conversational state stay in memory. Saved houses use the existing tray. */
(() => {
  'use strict';
  const guide=document.getElementById('fd-guide'), engine=window.SS_VOICE, houses=window.SS_DIRECTORY;
  if(!guide||!engine?.query||!Array.isArray(houses))return;
  const form=guide.querySelector('form'),input=guide.querySelector('#fd-guide-question'),answer=guide.querySelector('#fd-guide-answer');
  const status=guide.querySelector('#fd-guide-status'),reset=guide.querySelector('#fd-guide-reset');
  const live=document.createElement('p');live.className='vh';live.setAttribute('aria-live','polite');live.setAttribute('aria-atomic','true');guide.append(live);
  let intent={},current=[],questions=[],composing=false;
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
  const button=(text,fn)=>{const el=node('button',text);el.type='button';el.addEventListener('click',fn);return el;};
  function link(text,url){
    const el=node('a',text);const parsed=new URL(url,location.href);
    if(!['https:','http:'].includes(parsed.protocol))return node('span',text);
    el.href=parsed.href;if(parsed.origin!==location.origin){el.target='_blank';el.rel='noopener noreferrer';}return el;
  }
  const categories={women:'Womenswear',men:'Menswear',tailor:'Áo dài & tailoring',bridal:'Bridal',luxury:'Luxury & couture',access:'Accessories',vintage:'Vintage & preloved',active:'Activewear',sleep:'Sleep & loungewear',market:'Markets',lingerie:'Lingerie'};
  const access={walk:'Walk-in store',appt:'By appointment',online:'Online',hub:'Multi-brand hub',popup:'Pop-up; confirm dates'};
  function intro(question,text){
    if(guide.querySelector('.fd-guide-suggestions').contains(document.activeElement))input.focus({preventScroll:true});
    guide.classList.add('fd-guide-has-answer');
    answer.replaceChildren(node('h3',question),node('p',text));answer.hidden=false;reset.hidden=false;
  }
  function actions(items){const row=node('div','','fd-guide-links');items.forEach(([text,url])=>row.append(link(text,url)));answer.append(row);}
  function followups(items){const row=node('div','','fd-guide-followups');items.forEach(([label,q])=>row.append(button(label,()=>ask(q))));answer.append(row);}
  function recordCard(house,index){
    const item=node('li','','fd-guide-match');item.append(node('h4',`${index+1}. ${house.n}`));
    const facts=node('dl');
    for(const [label,value] of [['Focus',categories[house.cat]||house.cat],['Area',house.area],['Price tier',house.tier&&house.tier!=='none'?house.tier+' · editorial guide':'Not recorded'],['Access',access[house.st]],['Materials',(house.fib||[]).join?.(', ')||house.fib]]){
      if(value){facts.append(node('dt',label),node('dd',value));}
    }
    item.append(node('p',[categories[house.cat]||house.cat,house.area,(house.fib||[]).join(', ')].filter(Boolean).join(' · ')));
    const detail=node('details');detail.append(node('summary','Recorded details'),facts);
    if(house.no)detail.append(node('p',house.no));item.append(detail);
    if(house.flag)item.append(node('p','This record is marked for confirmation. Check the current address and trading details first.'));
    const row=node('div','','fd-guide-links');
    row.append(link('Directory record',`#q=${encodeURIComponent(house.n)}`));
    if(house.w)row.append(link('Visit website ↗',house.w));
    if(house.h&&!house.w)row.append(link('View Instagram ↗',`https://instagram.com/${house.h}`));
    if(window.SS_TRAY){
      const id=house.h||house.n,save=button(window.SS_TRAY.isSaved(id)?'Saved to your tray':'Save this house',()=>{
        window.SS_TRAY.addSaved(id);save.textContent='Saved to your tray';save.setAttribute('aria-pressed','true');status.textContent=house.n+' saved to your browser’s tray.';
      });save.setAttribute('aria-pressed',String(window.SS_TRAY.isSaved(id)));row.append(save);
    }
    item.append(row);return item;
  }
  function showRecords(list,comparison=false){
    current=list.slice(0,comparison?3:4);
    const results=node('ol','','fd-guide-matches');current.forEach((h,i)=>results.append(recordCard(h,i)));answer.append(results);
    answer.append(node('p','These are recorded house details, not a garment catalogue. Materials and price tiers describe the label; confirm the fabric, size, current price, and availability of each piece.'));
    actions([['How these records are researched','directory-methodology']]);
    const row=node('div','','fd-guide-links');
    row.append(button('Copy discovery brief',copyBrief));
    if(!comparison)row.append(button('Show matches in directory',()=>{setExpanded(false,false);window.SS_WORKSPACE?.show('search');engine.apply(intent);const main=document.getElementById('main');main.focus({preventScroll:true});main.scrollIntoView({behavior:'instant'});}));
    row.append(link('Discuss my shortlist','service-request.html?service=styling'));answer.append(row);
    if(!comparison)followups([['Only District 3','Only in D3'],['Compare these houses','Compare these houses']]);
  }
  async function copyBrief(){
    const text=['My directory discovery',...questions.slice(-3).map(q=>'• '+q),'Houses to discuss:',...current.map(h=>h.n+' — '+new URL('#q='+encodeURIComponent(h.n),location.origin+'/fashion-directory').href),'I would like help choosing pieces. Garments, sizing, availability, and budget still need confirmation.'].join('\n');
    try{await navigator.clipboard.writeText(text);status.textContent='Brief copied. Open “Discuss my shortlist” and paste it into your request.';}
    catch{
      let fallback=answer.querySelector('[data-copy-fallback]');
      if(!fallback){fallback=node('textarea');fallback.dataset.copyFallback='';fallback.readOnly=true;fallback.setAttribute('aria-label','Discovery brief to copy');answer.append(fallback);}
      fallback.value=text;fallback.focus();fallback.select();status.textContent='Select and copy this brief, then paste it into your request.';
    }
  }
  function ask(raw){
    setExpanded(true);
    const q=String(raw).trim().slice(0,400);if(!q){status.textContent='Describe a fabric, a house, or an occasion to begin.';input.focus();return;}
    const text=norm(q);questions.push(q);questions=questions.slice(-4);input.value='';status.textContent='';live.textContent='';
    let announcement='';
    const named=houses.filter(h=>(' '+text+' ').includes(' '+norm(h.n)+' ')).sort((a,b)=>b.n.length-a.n.length);
    if(/\b(live|in stock|available now|availability|size \d|buy now|sold out)\b/.test(text)){
      intro(q,'I can help you explore the labels, but these records do not show live stock or size availability. Send the exact garment link and seller for a purchase request. If you want alternatives selected, choose styling.');
      actions([['Request an exact piece','service-request.html?service=sourcing'],['Ask for alternatives','service-request.html?service=styling']]);
    }else if(/\b(actual garments|actual clothes|specific clothes|product link|instagram post|shopee|catalogue|catalog|shop the pieces)\b/.test(text)||/^https?:\/\//i.test(q)){
      intro(q,'Start with a house’s website or Instagram, then save the product link or post for the piece you like. Your tray can hold references while details are checked. A product preview is a snapshot, not proof of current stock. Unknown source? The Trace investigates one particular item for US$25; a match is not guaranteed.');
      const row=node('div','','fd-guide-links');row.append(button('Open my product tray',()=>{setExpanded(false,false);window.SS_TRAY?.open();}));answer.append(row);
      actions([['Buy an identified piece','service-request.html?service=sourcing'],['Identify an unknown piece','service-request.html?service=trace']]);
    }else if(/\b(shipping|ship|delivery|deliver|international)\b/.test(text)){
      intro(q,'Some directory notes mention a house’s own shipping, but destination, cost, and timing still need confirmation. Seraphic can coordinate tracked international delivery within the agreed service. Share your country and the pieces you have in mind for a specific request.');
      actions([['Shipping information','free-international-shipping.html'],['Ask about my destination','service-request.html?service=unsure']]);
    }else if(/\b(price|prices|cost|budget|under|below|usd|vnd|dollars)\b|\$/.test(text)&&!(/\b(mid|premium|luxury|couture)\b/.test(text))){
      intro(q,'The directory records broad price tiers, not current prices for individual garments. I can narrow your search by tier; an exact budget needs the specific item and current store price. Styling bookings start at US$49, combining a styling fee and clothing credit; shipping is separate.');
      followups([['Explore mid-range labels','Show me mid range womenswear'],['Explore premium labels','Show me premium womenswear']]);actions([['Compare service fees','sourcingandstyling#prices']]);
    }else if(/\b(compare|difference between)\b/.test(text)){
      const compare=named.length>=2?named.slice(0,3):/\b(these|them)\b/.test(text)?current.slice(0,3):[];
      if(compare.length>=2){intro(q,'Compare the recorded focus, location, materials, and access below. These notes can help you choose which channels to explore; they do not establish which house has a particular garment today.');showRecords(compare,true);}
      else{intro(q,'Name two houses to compare, or discover a few labels first and choose “Compare these houses.”');followups([['Huelley & Huelley Rose','Compare Huelley and Huelley Rose'],['Discover linen houses','Show me houses with linen']]);}
    }else if(/\b(d1|district 1)\b/.test(text)&&/\b(thao dien|thu duc)\b/.test(text)){
      intro(q,'Start in District 1 or Thảo Điền? Choose one area and I’ll keep the rest of your direction. You can explore the other next.');
      const withoutAreas=q.replace(/district\s*1|\bd1\b|thảo điền|thao dien|thủ đức|thu duc/gi,' ');
      followups([['District 1',withoutAreas+' in D1'],['Thảo Điền',withoutAreas+' in Thao Dien']]);
    }else if(/\b(under|below|less than) (luxury|couture)\b/.test(text)){
      intro(q,'Would you like mid-range or premium houses? These are broad directory price tiers; the exact garment price still needs checking.');
      const base=q.replace(/(under|below|less than) (luxury|couture)( pricing)?/gi,'');
      followups([['Mid-range',base+' mid range'],['Premium',base+' premium']]);
    }else if(/\b(not|except|exclude|without|no)\b/.test(text)&&! /\b(no silk|without silk)\b/.test(text)){
      intro(q,'To avoid filtering out the wrong labels, tell me what you would like to include—such as linen, tailoring, or District 3. For a more specific material or fit requirement, send a personal brief.');actions([['Discuss my requirements','service-request.html?service=styling']]);
    }else{
      const searchText=q.replace(/(under|below|less than) premium( pricing)?/gi,'mid range');
      const result=engine.query(named.length?named[0].n:searchText,intent);
      if(result.recognized){
        intent=result.intent;
        if(!result.houses.length){intro(q,'No records match all of those details together. That means the directory has no recorded match, not that the garment or house does not exist. Start a new discovery to broaden the search, or ask for a personal selection.');current=[];actions([['Ask for a personal selection','service-request.html?service=styling']]);}
        else{
          intro(q,`${result.houses.length} recorded ${result.houses.length===1?'house matches':'houses match'}. ${Math.min(4,result.houses.length)} to explore below; refine your direction at any time.`);
          const labels=node('p','Your direction: '+result.labels.map(l=>l.label).join(' · '));answer.append(labels);showRecords(result.houses);
          announcement=`${result.houses.length} matching houses. ${current.map(h=>h.n).join(', ')}. Directory records and source links are available below.`;
        }
      }else{
        intro(q,'I can explore the recorded labels by fabric, category, price tier, and area, or compare named houses. I do not have enough recorded detail to answer that question confidently. For an outfit idea or a specific garment, a personal request is the next step.');
        followups([['Explore linen','Show me houses with linen'],['Explore tailoring','Show me áo dài tailors']]);actions([['Send a personal request','service-request.html?service=unsure']]);
      }
    }
    // The answer is a single replaceable view, not a growing transcript.
    guide.querySelector(".fd-guide-content").scrollTop=0;
    live.textContent=announcement||answer.querySelector('p')?.textContent||'Answer ready.';
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(!composing)ask(input.value);});
  input.addEventListener('compositionstart',()=>composing=true);input.addEventListener('compositionend',()=>composing=false);
  input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing&&!composing){event.preventDefault();ask(input.value);}});
  guide.querySelectorAll('[data-fd-ask]').forEach(el=>el.addEventListener('click',()=>ask(el.dataset.fdAsk)));
  reset.addEventListener('click',()=>{intent={};current=[];questions=[];live.textContent='';guide.classList.remove('fd-guide-has-answer');answer.replaceChildren();answer.hidden=true;reset.hidden=true;status.textContent='A new discovery. Your saved houses are still in the tray.';input.value='';input.focus();});
  guide.querySelector('#fd-guide-voice').addEventListener('click',()=>{setExpanded(false,false);engine.open();});
  const head=guide.querySelector('#fd-guide-head'),content=guide.querySelector('#fd-guide-content');
  const launcher=node('button','Ask','fd-guide-launcher');launcher.id='fd-guide-launcher';launcher.type='button';
  launcher.setAttribute('aria-label','Open directory assistant');launcher.setAttribute('aria-controls','fd-guide');launcher.setAttribute('aria-expanded','false');
  let closingTimer=0,frame=0,opened=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const noMotion=()=>reduced.matches||document.documentElement.classList.contains('rm');
  function finishClose(){if(!opened){guide.hidden=true;guide.classList.remove('fd-guide-closing');}}
  function setExpanded(open,restore=true){
    clearTimeout(closingTimer);cancelAnimationFrame(frame);opened=open;
    launcher.setAttribute('aria-expanded',String(open));
    if(open){
      guide.hidden=false;guide.inert=false;head.hidden=false;content.hidden=false;
      guide.classList.remove('fd-guide-closing');
      if(noMotion())guide.classList.add('fd-guide-open');
      else frame=requestAnimationFrame(()=>{guide.getBoundingClientRect();if(opened)guide.classList.add('fd-guide-open');});
    }else{
      guide.classList.remove('fd-guide-open');guide.classList.add('fd-guide-closing');guide.inert=true;
      if(restore)launcher.focus({preventScroll:true});
      if(noMotion())finishClose();else closingTimer=setTimeout(finishClose,180);
    }
    viewport();
  }
  function openGuide(){setExpanded(true);input.focus({preventScroll:true});}
  launcher.addEventListener('click',()=>opened?setExpanded(false):openGuide());
  guide.querySelector('#fd-guide-minimize').addEventListener('click',()=>setExpanded(false));
  guide.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setExpanded(false);return;}
    if(e.key!=='Tab'||!opened)return;
    const focusable=[...guide.querySelectorAll('button,a[href],input,textarea,summary,[tabindex="0"]')].filter(n=>!n.disabled&&n.getClientRects().length&&!n.closest('[hidden]'));
    const first=focusable[0],last=focusable.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  });
  guide.addEventListener('click',e=>{if(e.target.closest('a[href]'))setExpanded(false,false);});
  document.addEventListener('pointerdown',e=>{if(opened&&!guide.contains(e.target)&&!launcher.contains(e.target))setExpanded(false,false);});
  function openAnchor(){if(location.hash==='#fd-guide')openGuide();}
  document.addEventListener('click',e=>{if(e.target.closest('a[href="#fd-guide"]')){e.preventDefault();openGuide();}});
  addEventListener('hashchange',openAnchor);
  reduced.addEventListener('change',()=>{if(noMotion()){clearTimeout(closingTimer);cancelAnimationFrame(frame);if(opened)guide.classList.add('fd-guide-open');else finishClose();}});
  new MutationObserver(()=>{if(noMotion()&&!opened){clearTimeout(closingTimer);finishClose();}}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  function viewport(){
    const v=window.visualViewport;if(!v)return;
    const keyboard=innerHeight-v.height>140 && (document.activeElement===input||guide.contains(document.activeElement));
    guide.classList.toggle('fd-keyboard-open',keyboard);
    guide.style.setProperty('--fd-keyboard',keyboard?Math.max(0,innerHeight-v.height-v.offsetTop)+'px':'0px');
    guide.style.setProperty('--fd-visible-height',Math.max(120,v.height-24)+'px');
  }
  window.visualViewport?.addEventListener('resize',viewport);window.visualViewport?.addEventListener('scroll',viewport);
  function placeRoute(){const route=document.querySelector('.ssrp-open');if(!route)return false;document.querySelector('.fdmap-head').append(route);return true;}
  if(!placeRoute()){const observer=new MutationObserver(()=>{if(document.querySelector('.ssrp-open')){observer.disconnect();placeRoute();}});observer.observe(document.body,{childList:true});}
  const theme=document.getElementById('theme');
  if(theme)document.querySelector('.fd-board-tools').append(theme);
  document.body.append(launcher,guide);
  guide.setAttribute('role','dialog');guide.setAttribute('aria-modal','false');
  input.removeAttribute('aria-expanded');input.placeholder='Try a fabric, district, or house';
  guide.querySelector('[data-fd-interactive]').hidden=false;guide.classList.add('fd-guide-ready');
  guide.hidden=true;guide.inert=true;head.hidden=false;content.hidden=false;openAnchor();viewport();
  window.SS_DIRECTORY_GUIDE={ask,open:openGuide,close:()=>setExpanded(false,false)};
})();
