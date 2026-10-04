/* Presentation only; all fee and currency arithmetic remains in estimator.js. */
(() => {
 const root=document.documentElement;
 if(!document.querySelector('#lineItems .item-price'))return;
 root.classList.add('est-ready');
 const quickTotal=document.getElementById('estQuickTotal');
 if(quickTotal){const total=document.getElementById('rTotal'),converted=document.getElementById('rUsd');/* Dollars (or the chosen currency) first; the đồng total when no rate is available. */const syncTotal=()=>{const c=converted&&converted.textContent.trim();quickTotal.textContent=c&&c!=='—'&&!/unavailable/i.test(c)?c:total.textContent;};new MutationObserver(syncTotal).observe(converted,{childList:true,subtree:true,characterData:true});new MutationObserver(syncTotal).observe(total,{childList:true,subtree:true,characterData:true});syncTotal();}
 let itemId=0;
 const labelItems=()=>document.querySelectorAll('#lineItems input:not([id])').forEach(input=>{
   input.id='estimate-field-'+(++itemId);
   const label=document.createElement('label');label.htmlFor=input.id;
   label.textContent=input.classList.contains('item-price')?'Store price · VND':'Product link · optional';
   input.before(label);
 });
 labelItems();new MutationObserver(labelItems).observe(document.getElementById('lineItems'),{childList:true});
 const wrapAmounts=()=>{document.querySelectorAll('.result-row .v').forEach(v=>{
   const T=window.SS_T||((k,e)=>e),id=v.id,text=v.textContent;
   if(id==='rShip'){const note=text===T('est.ship.later','Added with your pieces')||text===T('est.customquote','Custom quote');v.classList.toggle('est-note',note);if(note)return;}
   if(v.querySelector('.est-amount,.est-amount-note'))return;
   const suffix={rCard:T('est.card.plusship',' (+ card fee on shipping at invoice)'),rTotal:T('est.plusship',' + shipping'),rUsd:T('est.customhaul',' + shipping (custom quote, 10kg+)')}[id];
   let body=text,note=null;
   if(suffix&&text.endsWith(suffix)){body=text.slice(0,-suffix.length);note=suffix;}
   const bounds=[];let m;const re=/ [–·+] /g;
   while((m=re.exec(body)))bounds.push(m.index);
   if(!bounds.length&&!note)return;
   const chunks=[];let prev=0;
   for(const i of bounds){chunks.push(body.slice(prev,i));prev=i+1;}
   chunks.push(body.slice(prev));
   v.textContent='';
   chunks.forEach((chunk,idx)=>{
     if(idx)v.appendChild(document.createTextNode(' '));
     const span=document.createElement('span');span.className='est-amount';span.textContent=chunk;v.appendChild(span);
   });
   if(note){v.appendChild(document.createElement('wbr'));const span=document.createElement('span');span.className='est-amount-note';span.textContent=note;v.appendChild(span);}
 });};
 const receipt=document.querySelector('.est-receipt');
 wrapAmounts();if(receipt)new MutationObserver(wrapAmounts).observe(receipt,{childList:true,subtree:true,characterData:true});
 const toolbar=document.querySelector('.quiz-toolbar');
 const label=document.createElement('label');const title=document.createElement('span');title.textContent='Appearance ';label.append(title);
 const select=document.createElement('select');select.setAttribute('aria-label','Appearance');
 for(const [value,text] of [['light','Light'],['dark','Dark'],['mono','Monochrome']]){const o=new Option(text,value);select.add(o);}
 select.value=root.classList.contains('dark')?'dark':root.classList.contains('mono')?'mono':'light';
 select.addEventListener('change',()=>{if(root.classList.contains('est-embedded')&&parent!==window)parent.SS_THEME?.set(select.value);else window.SS_THEME?.set(select.value);});label.append(select);toolbar.prepend(label);
 const localize=()=>{
   const c=window.SS_ESTIMATE_COPY?.[document.documentElement.lang]||window.SS_ESTIMATE_COPY?.en;
   if(!c)return;
   document.title=window.SS_T('est.h2','Get your price')+' — Seraphic Styler';
   document.querySelector('#estLangSelect').setAttribute('aria-label',window.SS_T('a11y.language','Language'));
   document.querySelector('#estQuiz').setAttribute('aria-label',window.SS_T('est.h2','Get your price'));
   title.textContent=c.appearance+' ';select.setAttribute('aria-label',c.appearance);
   for(const option of select.options)option.textContent=c[option.value];
   document.querySelectorAll('#lineItems input').forEach(input=>{
     const isPrice=input.classList.contains('item-price');
     const text=isPrice?c.price:c.link+' · '+c.optional;
     const fieldLabel=document.querySelector('label[for="'+input.id+'"]');if(fieldLabel)fieldLabel.textContent=text;
     input.setAttribute('aria-label',text);input.placeholder=isPrice?'850000':c.link;
   });
   document.querySelectorAll('.remove-item').forEach(button=>button.setAttribute('aria-label',c.remove));
   document.querySelector('#estCurrency').setAttribute('aria-label',window.SS_T('est.usd','Currency'));
 };
 document.addEventListener('ss:lang',localize);
 new MutationObserver(localize).observe(document.getElementById('lineItems'),{childList:true});localize();
 if(root.classList.contains('est-embedded')&&parent!==window){
   const content=document.querySelector('.est-page');
   let lastHeight=0;
   // Measure intrinsic content, never the iframe viewport (body min-height:100vh).
   const resize=()=>{const height=Math.ceil(content.getBoundingClientRect().height);if(height>0&&height!==lastHeight){lastHeight=height;parent.postMessage({type:'ss-estimate-height',height},location.origin);}};
   new ResizeObserver(resize).observe(content);
   const sync=()=>{
     if(parent.SS_THEME&&window.SS_THEME&&parent.SS_THEME.mode!==window.SS_THEME.mode)window.SS_THEME.set(parent.SS_THEME.mode,{persist:false,animate:false});
     for(const name of ['hc','rm','ts-lg','ts-xl'])root.classList.toggle(name,parent.document.documentElement.classList.contains(name));
     select.value=root.classList.contains('dark')?'dark':root.classList.contains('mono')?'mono':'light';
   };
   new MutationObserver(sync).observe(parent.document.documentElement,{attributes:true,attributeFilter:['class']});sync();
   const lang=()=>{const code=parent.document.documentElement.lang;if(window.SS_setLang&&code)window.SS_setLang(code,false);};
   parent.document.addEventListener('ss:lang',lang);lang();resize();
 }
})();
