/* Discovery → comparison → a visit or purchase brief. Existing records and tray only. */
(() => {
  'use strict';
  const houses=window.SS_DIRECTORY,tray=window.SS_TRAY,workspace=document.getElementById('fd-piece-workspace');
  if(!houses||!tray?.entries||!workspace)return;
  const $=id=>document.getElementById(id),status=$('fd-discovery-status');
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const btn=(text,fn)=>{const b=el('button',text);b.type='button';b.addEventListener('click',fn);return b;};
  const url=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}};
  function link(text,href){const a=el('a',text);a.href=href;if(/^https?:/.test(href)){a.target='_blank';a.rel='noopener noreferrer';}return a;}
  function focusSection(id){window.SS_WORKSPACE?.reveal(id);window.SS_DIRECTORY_GUIDE?.close();const n=$(id);n.scrollIntoView({behavior:'instant',block:'start'});n.tabIndex=-1;n.focus({preventScroll:true});}
  const normal=s=>String(s||'').trim().toLowerCase();
  const known=v=>v?String(v):'Not recorded';
  const access={walk:'Walk-in',appt:'Appointment',online:'Online',hub:'Multi-brand hub',popup:'Pop-up; confirm dates'};
  const category={women:'Womenswear',men:'Menswear',tailor:'Áo dài & tailoring',bridal:'Bridal',luxury:'Luxury & couture',access:'Accessories',vintage:'Vintage',active:'Activewear',sleep:'Loungewear',market:'Market',lingerie:'Lingerie'};
  const occasions={event:'Formal occasions',night:'Evening & parties',bday:'Celebrations'};
  let compared=[],pieceSelection=new Set();
  function facts(rows){const dl=el('dl');rows.forEach(([k,v])=>dl.append(el('dt',k),el('dd',known(v))));return dl;}
  function syncCompareButtons(){document.querySelectorAll('[data-compare-house]').forEach(b=>{const on=compared.includes(Number(b.dataset.compareHouse));b.setAttribute('aria-pressed',String(on));const label=on?'In comparison':'Compare';if(b.textContent!==label)b.textContent=label;});document.querySelectorAll('[data-compare-count]').forEach(n=>n.textContent=compared.length?'('+compared.length+')':'');}
  function houseComparison(){
    const host=$('fd-house-comparison');host.replaceChildren();
    if(!compared.length){host.append(el('p','Choose “Compare” on a house card, or start with your saved houses.'));host.append(btn('Compare saved houses',()=>{compared=houses.map((h,i)=>tray.isSaved(h.h||h.n)?i:-1).filter(i=>i>=0).slice(0,3);houseComparison();}));return;}
    const matrix=el('table','','fd-comparison-matrix'),caption=el('caption','Recorded house details, side by side');matrix.append(caption);const thead=el('thead'),hr=el('tr');hr.append(el('th','Compare'));compared.forEach(i=>{const th=el('th',houses[i].n);th.scope='col';hr.append(th);});thead.append(hr);matrix.append(thead);const tb=el('tbody');
    for(const [label,get]of [['Price tier',h=>h.tier==='none'?'Not recorded':h.tier],['Shopping',h=>access[h.st]],['Area',h=>h.area],['Materials',h=>(h.fib||[]).join(', ')],['Occasions',h=>(h.occ||[]).map(o=>occasions[o]||o).join(', ')],['Before visiting',h=>h.flag?'Confirmation requested in the notes':h.st==='appt'?'Arrange an appointment':'Confirm current hours'],['Fit & sizes',()=> 'Confirm for each garment']]){const tr=el('tr'),th=el('th',label);th.scope='row';tr.append(th);compared.forEach(i=>tr.append(el('td',known(get(houses[i])))));tb.append(tr);}const ar=el('tr'),ah=el('th','Shortlist');ah.scope='row';ar.append(ah);compared.forEach(index=>{const td=el('td');td.append(btn('Save',()=>{tray.addSaved(houses[index].h||houses[index].n);status.textContent=houses[index].n+' saved.';}),btn('Remove',()=>{compared=compared.filter(i=>i!==index);houseComparison();focusSection('house-compare');}));ar.append(td);});tb.append(ar);matrix.append(tb);host.append(matrix);
    const row=el('div','','fd-compare-grid');row.classList.add('fd-house-mobile-comparison');
    compared.forEach(index=>{
      const h=houses[index],card=el('article');card.append(el('h3',h.n));
      card.append(facts([['Focus',category[h.cat]||h.cat],['Price tier',h.tier==='none'?'Not recorded':h.tier],['Shopping',access[h.st]],['Area',h.area],['Materials',(h.fib||[]).join(', ')],['Occasions',(h.occ||[]).map(o=>occasions[o]||o).join(', ')],['Before visiting',h.flag?'Confirm address and trading details':h.st==='appt'?'Confirm an appointment':'Confirm current opening hours'],['Shipping',/worldwide|international shipping/i.test(h.no||'')?'Mentioned in house notes; confirm destination':'Not recorded; ask the seller'],['Route planning',window.SS_COORDS?.[h.n]?'Location recorded; confirm address':'Location needs confirmation'],['Fit & sizes','Confirm for each garment']]));
      if(h.no){const note=el('details');note.append(el('summary','House notes'),el('p',h.no));card.append(note);}
      const actions=el('div','','fd-board-tools');
      if(url(h.w))actions.append(link('Open website ↗',url(h.w)));else if(h.h)actions.append(link('Open Instagram ↗','https://instagram.com/'+encodeURIComponent(h.h)));
      actions.append(btn('Save house',()=>{tray.addSaved(h.h||h.n);status.textContent=h.n+' saved to your tray.';}));
      actions.append(btn('Remove from comparison',()=>{compared=compared.filter(i=>i!==index);houseComparison();$('fd-house-comparison').tabIndex=-1;$('fd-house-comparison').focus({preventScroll:true});}));card.append(actions);row.append(card);
    });
    host.append(row,el('p','Price tiers and materials describe the house, not every piece. Notes are directory observations; contact the seller for current sizing, shipping, and availability.'));
    host.append(btn('Copy this shortlist',async()=>{const text=['Houses I would like to explore',...compared.map(i=>houses[i].n+' — '+new URL('#q='+encodeURIComponent(houses[i].n),location.origin+'/fashion-directory').href),'Please help me choose pieces. Size, budget, garments and timing still need confirmation.'].join('\n');try{await navigator.clipboard.writeText(text);status.textContent='Shortlist copied. Paste it into your styling request.';}catch{const area=el('textarea');area.value=text;area.readOnly=true;area.setAttribute('aria-label','House shortlist to copy');host.append(area);area.focus();area.select();}}));
    host.append(link('Ask for a selection from these houses','service-request.html?service=styling'));syncCompareButtons();
  }
  function toggleHouse(index){
    if(!houses[index])return;
    if(compared.includes(index))compared=compared.filter(i=>i!==index);
    else if(compared.length<3)compared.push(index);
    else{focusSection('house-compare');return;}
    houseComparison();
    // An explicit comparison action opens the comparison workspace.
    focusSection('house-compare');
  }
  function similarHouse(index){
    const h=houses[index];if(!h)return;
    const ranked=houses.map((other,i)=>{
      const reasons=[];if(i===index)return {i,score:0,reasons};
      if(other.cat===h.cat)reasons.push('both listed as '+(category[h.cat]||h.cat));
      for(const f of h.fib||[])if((other.fib||[]).includes(f))reasons.push('both record '+f);
      for(const o of h.occ||[])if((other.occ||[]).includes(o))reasons.push('both tagged for '+(occasions[o]||o).toLowerCase());
      if(other.tier===h.tier&&h.tier!=='none')reasons.push('same '+h.tier+' price tier');
      return {i,reasons,score:reasons.length};
    }).filter(r=>r.score>=2).sort((a,b)=>b.score-a.score).slice(0,3);
    const host=$('fd-house-comparison');host.replaceChildren(el('h3','Other houses to explore after '+h.n),el('p','Shared directory attributes, rather than a claim that they sell the same garments.'));
    if(!ranked.length)host.append(el('p','There is not enough shared recorded detail for a useful match. Try a fabric or occasion in the directory guide.'));
    ranked.forEach(r=>{const item=el('article','','fd-related');item.append(el('h3',houses[r.i].n),el('p',r.reasons.join(' · ')),btn('Compare with '+h.n,()=>{compared=[index,r.i];houseComparison();}));host.append(item);});
    focusSection('house-compare');
  }
  document.addEventListener('click',e=>{const compare=e.target.closest('[data-compare-house]'),similar=e.target.closest('[data-similar-house]');if(compare)toggleHouse(Number(compare.dataset.compareHouse));if(similar)similarHouse(Number(similar.dataset.similarHouse));});
  document.querySelector('.tabbar')?.addEventListener('click',e=>{const action=e.target.closest('[data-act]')?.dataset.act;if(action==='compare')focusSection('house-compare');if(action==='board')focusSection('piece-board');});
  const resultGrid=document.getElementById('main');if(resultGrid)new MutationObserver(syncCompareButtons).observe(resultGrid,{childList:true,subtree:true});
  function pieces(){return tray.entries().filter(i=>url(i.link));}
  function filtered(){const occasion=$('fd-board-occasion').value;return pieces().filter(i=>!occasion||normal(i.discovery?.occasion)===occasion);}
  function price(i){return Number.isFinite(i.priceVnd)&&i.priceVnd>0?new Intl.NumberFormat('en-US').format(i.priceVnd)+' VND · saved reference':'Not recorded';}
  function pieceFacts(i){const d=i.discovery||{};return [['House / seller',i.brandName],['Saved price',price(i)],['Fabric',d.material],['Silhouette',d.silhouette],['Fit notes',d.fit],['Size / variant',d.size],['Observed date',d.observedAt],['Availability','Not confirmed']];}
  function annotations(item){
    const detail=el('details'),summary=el('summary','Add or edit what you know');detail.append(summary);
    const f=el('form','','fd-annotation-form');
    for(const [key,label] of [['occasion','Occasion / board'],['material','Fabric'],['silhouette','Silhouette'],['fit','Fit notes'],['size','Size / variant'],['observedAt','Date you checked the source'],['note','Other notes']]){
      const l=el('label',label),input=el('input');input.name=key;input.value=item.discovery?.[key]||'';input.maxLength=300;
      if(key==='observedAt'){input.type='date';input.max=new Date().toISOString().slice(0,10);}else input.placeholder='Leave blank if unknown';l.append(input);f.append(l);
    }
    const save=el('button','Save notes');save.type='submit';f.append(save,el('p','These are your reference notes, not an in-person verification by Seraphic.'));
    f.addEventListener('submit',e=>{e.preventDefault();tray.annotateReference(item.id,Object.fromEntries(new FormData(f)));renderBoard();status.textContent='Notes saved. Stock and fit still need confirmation.';$('fd-board-title').tabIndex=-1;$('fd-board-title').focus({preventScroll:true});});detail.append(f);return detail;
  }
  function similarPieces(item){
    const d=item.discovery||{},matches=pieces().filter(p=>p.id!==item.id).map(p=>({p,reasons:['material','silhouette','occasion'].filter(k=>normal(d[k])&&normal(d[k])===normal(p.discovery?.[k])).map(k=>k+': '+d[k])})).filter(r=>r.reasons.length).slice(0,3);
    const host=$('fd-piece-compare');host.hidden=false;host.replaceChildren(el('h3','More like '+(item.title||'this piece')),el('p','Matches use only attributes recorded on your saved pieces. House-level tags are not treated as garment facts.'));
    if(!matches.length)host.append(el('p','No shared garment details recorded yet. Add a fabric, silhouette, or occasion to two saved pieces to compare their direction.'));
    matches.forEach(({p,reasons})=>{const n=el('article');n.append(el('h4',p.title||p.brandName),el('p',reasons.join(' · ')),link('Open saved source ↗',url(p.link)));host.append(n);});focusSection('fd-piece-compare');
  }
  function comparePieces(){
    const selected=filtered().filter(p=>pieceSelection.has(p.id)),host=$('fd-piece-compare');host.hidden=!selected.length;host.replaceChildren();if(!selected.length)return;
    host.append(el('h3','Your pieces, compared'));const row=el('div','','fd-compare-grid');selected.forEach(p=>{const n=el('article');n.append(el('h4',p.title||p.brandName),facts(pieceFacts(p)),link('Open saved source ↗',url(p.link)));row.append(n);});host.append(row,el('p','Blank details mean unrecorded, not unsuitable. Confirm fabric composition, measurements, variant, current price, and stock before purchase.'));
  }
  function renderBoard(){
    const select=$('fd-board-occasion'),previous=select.value,options=new Map();pieces().forEach(p=>{const o=p.discovery?.occasion;if(o)options.set(normal(o),o);});
    select.replaceChildren(new Option('All saved pieces',''));options.forEach((label,key)=>select.add(new Option(label,key)));if(options.has(previous))select.value=previous;
    const list=$('fd-piece-list');list.replaceChildren();const records=filtered();
    pieceSelection=new Set([...pieceSelection].filter(id=>records.some(p=>p.id===id)));
    if(!records.length)list.append(el('p','No product links on this board yet. Explore a house’s own channel, then save the exact piece that interests you. Saved houses stay in your tray.','fd-board-empty'));
    records.forEach(p=>{
      const card=el('article','','fd-piece-card');card.append(el('h3',p.title||'Saved piece'),el('p',p.brandName||'Seller not recorded'));
      card.append(el('p','Saved price: '+price(p)),el('p',p.discovery?.observedAt?'Source observation: '+p.discovery.observedAt+' · confirm current details':'Reference only · no dated source check'),link('Open saved source ↗',url(p.link)));
      const l=el('label','','fd-compare-choice'),check=el('input');check.type='checkbox';check.checked=pieceSelection.has(p.id);check.addEventListener('change',()=>{if(check.checked&&pieceSelection.size>=3){check.checked=false;status.textContent='Compare up to three pieces. Uncheck one to add another.';return;}if(check.checked)pieceSelection.add(p.id);else pieceSelection.delete(p.id);comparePieces();});l.append(check,document.createTextNode('Compare this piece'));card.append(l,annotations(p));
      card.append(btn('More like this on my board',()=>similarPieces(p)));list.append(card);
    });
    comparePieces();$('fd-build-brief').disabled=!records.length;$('fd-piece-brief').hidden=true;
  }
  function buildBrief(){
    const data=filtered(),kind=$('fd-piece-intent').value,host=$('fd-piece-brief');if(!data.length)return;
    const intro={sourcing:'Please confirm availability for these exact pieces from the identified sellers. Please confirm the seller and selected variant first; this board does not establish that they are in stock.',trace:'Please quote identification research for these specific items. The Trace is US$25 per item under the current scope; an identification is not guaranteed.',styling:'Please quote selection or styling around these saved ideas. These are references, not an instruction to buy without approval.'}[kind];
    const lines=[intro,'Board: '+($('fd-board-occasion').selectedOptions[0]?.textContent||'All pieces'),...data.map((p,i)=>{const d=p.discovery||{};return '\n'+(i+1)+'. '+(p.title||'Saved piece')+' — '+p.brandName+'\n'+p.link+'\n'+pieceFacts(p).map(([k,v])=>k+': '+known(v)).join('\n')+(d.note?'\nNotes: '+d.note:'');}),'\nDestination: [add country]\nTiming: [add dates]\nPlease confirm scope, any service payment, and shipping before proceeding.'];
    host.replaceChildren();host.hidden=false;const area=el('textarea');area.value=lines.join('\n');area.readOnly=true;area.setAttribute('aria-label','Request brief to review and copy');host.append(area);
    host.append(btn('Copy request brief',async()=>{try{await navigator.clipboard.writeText(area.value);status.textContent='Copied. Continue to the request form and paste your brief.';}catch{area.focus();area.select();status.textContent='Select and copy your brief to continue.';}}));
    host.append(link('Continue to '+(kind==='trace'?'The Trace':kind)+' request','service-request.html?service='+kind));
  }
  $('fd-piece-form').addEventListener('submit',e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));if(!url(data.link)){status.textContent='Use a complete http or https source link.';return;}tray.addReference(data);e.target.reset();e.target.closest('details').open=false;renderBoard();status.textContent='Reference saved to your tray. No stock check has been made.';focusSection('piece-board');});
  $('fd-board-occasion').addEventListener('change',renderBoard);$('fd-piece-intent').addEventListener('change',()=>{$('fd-piece-brief').hidden=true;});$('fd-build-brief').addEventListener('click',buildBrief);
  $('fd-open-tray').addEventListener('click',()=>tray.open());$('fd-plan-route').addEventListener('click',()=>document.querySelector('.ssrp-open')?.click());
  document.addEventListener('ss:tray',()=>{renderBoard();syncCompareButtons();});
  function curated(){
    const today=new Date().toISOString().slice(0,10);
    const records=(window.SS_DIRECTORY_GARMENTS||[]).filter(r=>r.id&&r.title&&r.house&&url(r.sourceUrl)&&/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt)&&r.checkedAt<=today&&!Number.isNaN(Date.parse(r.checkedAt)));
    if(!records.length)return;
    const host=$('fd-curated-edit');host.hidden=false;host.append(el('h3','The garment edit'),el('p','Selected source observations, dated when checked. Confirm today’s price, variant, and availability.'));
    records.forEach(r=>{const card=el('article','','fd-piece-card');
      if(r.image&&!r.image.includes('..')&&/^\/?(?:assets|images)\/[\w/.-]+$/.test(r.image)&&['owned','licensed'].includes(r.imagePermission)){const image=el('img');image.src=r.image;image.alt=r.title;image.loading='lazy';card.append(image);}
      card.append(el('h4',r.title),el('p',r.house),el('p','Source checked '+r.checkedAt),link('Open source ↗',url(r.sourceUrl)));
      if(Number.isFinite(r.observedPriceVnd))card.append(el('p',r.observedPriceVnd.toLocaleString('en-US')+' VND observed'));
      if(r.note)card.append(el('p',r.note));
      card.append(btn('Save to my board',()=>{const id=tray.addReference({link:r.sourceUrl,title:r.title,brandName:r.house,priceVnd:r.observedPriceVnd});const values={observedAt:r.checkedAt};['material','silhouette','occasion','fit','size','note'].forEach(k=>{if(r[k])values[k]=r[k];});tray.annotateReference(id,values);status.textContent='Garment reference saved. Confirm current details with the source.';}));host.append(card);
    });
  }
  workspace.hidden=false;houseComparison();renderBoard();curated();
})();
