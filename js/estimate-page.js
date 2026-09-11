/* Presentation only; all fee and currency arithmetic remains in estimator.js. */
(() => {
 const root=document.documentElement;
 if(!document.querySelector('#lineItems .item-price'))return;
 root.classList.add('est-ready');
 let itemId=0;
 const labelItems=()=>document.querySelectorAll('#lineItems input:not([id])').forEach(input=>{
   input.id='estimate-field-'+(++itemId);
   const label=document.createElement('label');label.htmlFor=input.id;
   label.textContent=input.classList.contains('item-price')?'Store price · VND':'Product link · optional';
   input.before(label);
 });
 labelItems();new MutationObserver(labelItems).observe(document.getElementById('lineItems'),{childList:true});
 const toolbar=document.querySelector('.quiz-toolbar');
 const label=document.createElement('label');const title=document.createElement('span');title.textContent='Appearance ';label.append(title);
 const select=document.createElement('select');select.setAttribute('aria-label','Appearance');
 for(const [value,text] of [['light','Light'],['dark','Dark'],['mono','Monochrome']]){const o=new Option(text,value);select.add(o);}
 select.value=root.classList.contains('dark')?'dark':root.classList.contains('mono')?'mono':'light';
 select.addEventListener('change',()=>{if(root.classList.contains('est-embedded')&&parent!==window)parent.SS_THEME?.set(select.value);else window.SS_THEME?.set(select.value);});label.append(select);toolbar.prepend(label);
 const localize=()=>{
   const c=window.SS_ESTIMATE_COPY?.[document.documentElement.lang]||window.SS_ESTIMATE_COPY?.en;
   if(!c)return;
   document.title=window.SS_T('est.h2','Build a rough estimate')+' — Seraphic Styler';
   document.querySelector('#estLangSelect').setAttribute('aria-label',window.SS_T('a11y.language','Language'));
   document.querySelector('#estQuiz').setAttribute('aria-label',window.SS_T('est.h2','Build a rough estimate'));
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
   let lastHeight=0;
   const resize=()=>{const height=Math.ceil(document.body.getBoundingClientRect().height);if(Math.abs(height-lastHeight)>1){lastHeight=height;parent.postMessage({type:'ss-estimate-height',height},location.origin);}};
   new ResizeObserver(resize).observe(document.body);
   const sync=()=>{
     if(parent.SS_THEME&&window.SS_THEME)window.SS_THEME.set(parent.SS_THEME.mode,{persist:false,animate:false});
     for(const name of ['hc','rm','ts-lg','ts-xl'])root.classList.toggle(name,parent.document.documentElement.classList.contains(name));
     select.value=root.classList.contains('dark')?'dark':root.classList.contains('mono')?'mono':'light';
   };
   new MutationObserver(sync).observe(parent.document.documentElement,{attributes:true,attributeFilter:['class']});sync();
   const lang=()=>{const code=parent.document.documentElement.lang;if(window.SS_setLang&&code)window.SS_setLang(code);};
   parent.document.addEventListener('ss:lang',lang);lang();resize();
 }
})();
