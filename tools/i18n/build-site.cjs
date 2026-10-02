/* Build static, same-origin text dictionaries for every public page.
   Machine translation runs only at build time; visitors never send text out.
   Usage: SS_PUPPETEER=/path/to/puppeteer-core node tools/i18n/build-site.cjs
   --collect inventories sources; --lang=vi builds just one language. */
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const norm = s => s.replace(/\s+/g, ' ').trim();
// Some widgets carry Vietnamese alternatives in the same source file. Those
// are not English inputs to an English-source translation build.
const vietnamese = /(?:^|\s)(?:của|và|được|một|những|bạn|không|mình|với|này|các|nên|đó|là|để|đồ|phí|trong|vòng|mặc|dùng|đoán|tự|thử|sinh|ngực|hông|kích|cỡ|thước|nhà|trên|xem|giờ|tình huống)(?=\s|[.,!?—]|$)/i;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const nonUI = new Set(JSON.parse(read('tools/i18n/site-non-ui.json')));
const skipSource = s => nonUI.has(s) || /^(?:icons|assets|css|js)\/.*\.(?:png|jpe?g|webp|svg|js|css)$/.test(s) || /^(?:openapi\.json|llms\.txt|saigon-fashion-directory\.(?:csv|json))$/.test(s);
const directoryContext = {window:{}}; vm.createContext(directoryContext);
vm.runInContext(read('js/directory-data.js'), directoryContext);
// The live catalog is authoritative for proper names. These exact labels are
// invariant, but short names must not become glossary matches inside prose.
const directoryNames = new Set(directoryContext.window.SS_DIRECTORY.map(shop=>shop.n));
const serviceNames = ['The Discovery','The Edit','The Capsule','The Atelier','The Signature','The Trace',
 'Discovery','Edit','Capsule','Atelier','Signature',
 'Custom Wardrobe','Custom Wardrobe+','The Custom Wardrobe','The Custom Wardrobe+',
 'The Single','The Carry-On','The Wardrobe','The Suitcase','The Angelic Aura'];
const platformNames=['Grab','Be','Shopee','Lazada','TikTok','TikTok Shop','Instagram','IG','Facebook','WhatsApp','Wise','Zelle','Stripe','PayPal','Payoneer','Google Maps','YouTube','Intertek','ARPANSA','UNIQLO'];
const bareURL=value=>/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]\S*)?$/i.test(value);
const contactIdentifier=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/^@[\w.]+$/.test(value);
const currencyCodes=new Set(Intl.supportedValuesOf('currency'));
const addressNames = new Set(directoryContext.window.SS_DIRECTORY.map(shop=>shop.a).filter(address=>
 typeof address==='string'&&/\d/.test(address)&&!/(?<![\p{L}])[a-z]{2,}(?![\p{L}])/u.test(address)&&!/[;—]/.test(address)));
for(const address of [...addressNames])for(const city of ['Ho Chi Minh City','Hanoi','Vietnam'])addressNames.add(address+', '+city);
const protectedNames = read('tools/i18n/brands.txt').split('\n').map(norm).filter(Boolean).concat([
 'Seraphic Styler','Seraphic','Styler','Hello Weekend','Saigon Flea','Urban Flea','Intertek Vietnam','Phú Nhuận','Thảo Điền','Thủ Đức','Bình Thạnh','Tân Bình','Tân Phú','Gò Vấp',
 'Chợ Lớn','Bến Thành','Bến Nghé','Tân Định','Đa Kao','Đồng Khởi','Nguyễn Huệ','Lê Lợi',
 'Lê Thánh Tôn','Hai Bà Trưng','Trần Quang Diệu','Võ Văn Tần','Lý Tự Trọng','Tôn Thất Thiệp','Saigon River','Union Square','Găng tay chống nắng'
]);
const namesPattern = new RegExp('(?<![\\p{L}\\p{N}])(?:'+protectedNames.sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![\\p{L}\\p{N}])','gu');
const context = {window:{}}; vm.createContext(context);
for (const f of ['translations','links-i18n','links-i18n-lp2','estimate-i18n']) vm.runInContext(read('js/'+f+'.js'),context);
const languages = context.window.SS_LANGS.filter(l=>l.code!=='en').map(l=>l.code);
const files=[];
function walk(dir='') {
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
    if(entry.name.startsWith('.'))continue;
    const file=path.posix.join(dir,entry.name);
    if(entry.isDirectory() && ['houses','areas','categories','dataset'].includes(file)) walk(file);
    else if(entry.isFile() && file.endsWith('.html') && !['admin.html','dataset/catalog-review.html'].includes(file)) files.push(file);
  }
}
walk();
async function collect() {
 const puppeteer=require(process.env.SS_PUPPETEER||'puppeteer');
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.SS_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try {
  const page=await browser.newPage();
  const sources={};
  const inventory=await page.evaluate((documents)=>{
   const result={strings:[],keys:{}}; const normalize=s=>s.replace(/\s+/g,' ').trim();
   for(const [file,html] of documents){
    const doc=new DOMParser().parseFromString(html,'text/html');
    const walker=doc.createTreeWalker(doc,NodeFilter.SHOW_TEXT);
    let n;while(n=walker.nextNode()){
     if(n.parentElement?.closest('script,style,code,pre,textarea,noscript,[translate="no"],.notranslate,select#langSelect,select.ss-lang-select'))continue;
     const s=normalize(n.data);if(s)result.strings.push(s);
    }
    for(const el of doc.querySelectorAll('*'))for(const attr of ['aria-label','title','placeholder','alt']){const s=normalize(el.getAttribute(attr)||'');if(s)result.strings.push(s);}
    for(const el of doc.querySelectorAll('[data-i18n]'))result.keys[el.dataset.i18n]=el.innerHTML;
    for(const [hook,attr] of [['data-i18n-ph','placeholder'],['data-i18n-al','aria-label'],['data-i18n-ti','title']])for(const el of doc.querySelectorAll('['+hook+']'))result.keys[el.getAttribute(hook)]=el.getAttribute(attr)||'';
   }
   return result;
  },files.map(f=>[f,read(f)]));
  // Capture dynamically rendered controls in the main service journeys.
  for(const f of ['index.html','sourcingandstyling.html','service-request.html','fashion-directory.html','find.html','estimate.html','lookbook.html','links.html','style-quiz.html','style-profile.html','redeem.html']){
   await page.goto('http://127.0.0.1:8732/'+f,{waitUntil:'domcontentloaded',timeout:60000});
   await page.evaluate(()=>{try{localStorage.setItem('ss-lang','en');window.SS_setLang?.('en');}catch{}});
   await new Promise(r=>setTimeout(r,500));
   inventory.strings.push(...await page.evaluate(()=>{
    const a=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
    while(n=w.nextNode())if(!n.parentElement.closest('script,style,code,pre,textarea,noscript,[translate="no"],.notranslate,select#langSelect,select.ss-lang-select'))a.push(n.data);
    return a;
   }));
  }
  // Literal UI messages also cover states reached after interacting with widgets.
  for(const file of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')&&!/i18n|translation|directory-data|store-coords|section-nav/.test(f))){
   const js=read('js/'+file);
   for(const m of js.matchAll(/(['"])((?:\\.|(?!\1)[^\\\n]){3,})\1/g)){
    let s=m[2];if(s.includes('${')||!/[a-zA-Z]{2,}\s+[a-zA-Z]{2,}/.test(s.replace(/\{\w+\}/g,'VALUE'))||/[<>;{}]|=>|querySelector|function\s*\(|^[.#]/.test(s.replace(/\{\w+\}/g,'')))continue;
    s=s.replace(/\\'/g,"'").replace(/\\"/g,'"').replace(/\\n/g,' ');inventory.strings.push(s);
   }
  }
  const brands=new Set(read('tools/i18n/brands.txt').split('\n').map(norm).filter(Boolean));
  for(const s of inventory.strings.map(norm))if(/[A-Za-z]{2}/.test(s)&&!skipSource(s)&&!vietnamese.test(s)&&!brands.has(s)&&!/^https?:|^[\w.+-]+@[\w.-]+\.[a-z]+$|^@[\w.]+$|^#[0-9a-f]{3,8}$/.test(s))sources[s]=true;
  const seeds={};
  for(const lang of languages){
   const dict=context.window.SS_TRANSLATIONS[lang]||{};
   const pairs=Object.entries(inventory.keys).filter(([key])=>dict[key]).map(([key,en])=>[en,dict[key]]);
   for(const name of ['fd','fg','delta','delta2']){
    const en=JSON.parse(read('tools/i18n/'+name+'.en.json'));
    const translated=name.startsWith('delta')
      ? JSON.parse(read('tools/i18n/'+name+'.all.json'))[lang]
      : fs.existsSync(path.join(__dirname,'out',lang,name+'.json')) ? JSON.parse(read('tools/i18n/out/'+lang+'/'+name+'.json')) : null;
    if(translated)for(const [key,value] of Object.entries(en))if(translated[key])pairs.push([value,translated[key]]);
   }
   const workspace=JSON.parse(read('tools/i18n/workspace.all.json'));
   if(workspace[lang])workspace.en.forEach((value,i)=>pairs.push([value,workspace[lang][i]]));
   seeds[lang]=await page.evaluate(pairs=>{
    const out={};const texts=html=>{const d=new DOMParser().parseFromString(html,'text/html');const w=d.createTreeWalker(d.body,NodeFilter.SHOW_TEXT);let n,a=[];while(n=w.nextNode())if(n.data.trim())a.push(n.data.replace(/\s+/g,' ').trim());return a;};
    for(const [en,tr] of pairs){const a=texts(en),b=texts(tr);if(a.length===b.length)a.forEach((s,i)=>{if(s!==b[i])out[s]=b[i];});}return out;
   },pairs);
  }
  fs.writeFileSync(path.join(__dirname,'site-source.json'),JSON.stringify({pages:files,strings:Object.keys(sources).sort(),seeds},null,2)+'\n');
  console.log('Collected '+Object.keys(sources).length+' unique strings across '+files.length+' public pages.');
 }finally{await browser.close();}
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let nextRequestAt=0,cooldownUntil=0;
async function pace(){
 const slot=Math.max(Date.now(),nextRequestAt,cooldownUntil);
 nextRequestAt=slot+Math.max(1500,Number(process.env.SS_TRANSLATE_DELAY_MS)||1500);
 if(slot>Date.now())await sleep(slot-Date.now());
 while(cooldownUntil>Date.now())await sleep(Math.min(5000,cooldownUntil-Date.now()));
}
async function translate(strings,lang,attempt=0){
 const markers=[];
 const protect=m=>{const token='ZXQ'+markers.length+'QXZ';markers.push(m);return token;};
 const protectedStrings=strings.map(s=>s.replace(namesPattern,protect).replace(/\{\w+\}|https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[a-z]+|Custom Wardrobe|\b(?:The|the) (?:Discovery|Edit|Capsule|Atelier|Signature|Trace)\b|\b(?:Discovery|Edit|Capsule|Atelier|Signature|Trace)(?=\s*(?:[·—–]|$))|\b(?:Grab|Shopee|Lazada|TikTok|Instagram|Facebook|WhatsApp|Wise|Zelle|Stripe|PayPal|Google Maps)\b|(?:US)?\$[\d,.]+(?:[–-][\d,.]+)?|[\d,.]+₫/g,protect));
 // Addresses/names/prices without prose need no translation at all. Sending
 // opaque placeholders alone can cause engines to rewrite those placeholders.
 const literal=protectedStrings.map(s=>!/[A-Za-z]/.test(s.replace(/ZXQ\d+QXZ/g,'')));
 if(literal.some(Boolean)){
   const active=strings.filter((_,i)=>!literal[i]);
   const translated=active.length?await translate(active,lang):[];let index=0;
   return strings.map((s,i)=>literal[i]?s:translated[index++]);
 }
 const query=protectedStrings.join('\n');
 const url=new URL('https://translate.googleapis.com/translate_a/single');
 for(const [k,v] of Object.entries({client:'gtx',sl:'en',tl:lang,dt:'t',q:query}))url.searchParams.set(k,v);
 try{
  await pace();
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok){
   const error=Error('HTTP '+response.status);error.status=response.status;
   if(response.status===429){
    const header=response.headers.get('retry-after');
    const requested=Number(header)*1000 || (Date.parse(header)-Date.now());
    error.retryAfter=Math.max(60000,requested||0,60000*2**Math.min(attempt,3));
   }
   throw error;
  }
  const data=await response.json();
  let translated=data[0].map(p=>p[0]||'').join('').trim().split(/\n/).map(s=>s.trim());
  if(translated.length!==strings.length)throw Error('Line count mismatch');
  translated=translated.map(s=>s.replace(/ZXQ\s*(\d+)\s*QXZ/gi,(_,i)=>markers[+i]??_));
  for(let i=0;i<strings.length;i++){
   const expected=protectedStrings[i].match(/ZXQ\d+QXZ/g)||[];
   if(expected.some(t=>!translated[i].includes(markers[+t.slice(3,-3)])))throw Error('Protected token mismatch');
  }
  return translated;
 }catch(error){
  if(error.status===429){
   if(attempt>=5)throw Error(lang+': translation service remains rate-limited; saved progress is safe.');
   cooldownUntil=Math.max(cooldownUntil,Date.now()+error.retryAfter);
   console.log(lang+': rate limited; backing off '+Math.ceil(error.retryAfter/1000)+' seconds.');
   return translate(strings,lang,attempt+1);
  }
  if(attempt<2){await sleep(500*(attempt+1));return translate(strings,lang,attempt+1);}
  if(error.status)throw Error(lang+': '+error.message);
  if(strings.length>1){const middle=Math.ceil(strings.length/2);return [...await translate(strings.slice(0,middle),lang),...await translate(strings.slice(middle),lang)];}
  // Rarely an engine still rewrites a placeholder inside a sentence. Translate
  // the surrounding prose separately, retaining every protected value exactly.
  if(markers.length){
    const parts=protectedStrings[0].split(/(ZXQ\d+QXZ)/);const translated=[];
    for(const part of parts){
      if(/^ZXQ\d+QXZ$/.test(part))translated.push(markers[+part.slice(3,-3)]);
      else if(/[A-Za-z]/.test(part))translated.push(part.match(/^\s*/)[0]+(await translate([part.trim()],lang))[0]+part.match(/\s*$/)[0]);
      else translated.push(part);
    }
    return [translated.join('')];
  }
  throw Error(lang+': '+strings[0]+': '+error.message);
 }
}
async function build(){
 const source=JSON.parse(read('tools/i18n/site-source.json'));
 const discovery=JSON.parse(read('tools/i18n/site-discovery.all.json'));
 const discoveryLabels=JSON.parse(read('tools/i18n/site-discovery-labels.all.json'));
 for(const key of Object.keys(discovery))discovery[key].push(...discoveryLabels[key]);
 // Explicit templates cover messages assembled only after directory actions.
 const extraKeys=discovery.keys.filter(key=>!source.strings.includes(key));
 if(extraKeys.length){source.strings.push(...extraKeys);source.strings.sort();fs.writeFileSync(path.join(__dirname,'site-source.json'),JSON.stringify(source,null,2)+'\n');}
 if(process.argv.includes('--clean-source')){
  const before=source.strings.length;source.strings=source.strings.filter(s=>!skipSource(s));
  fs.writeFileSync(path.join(__dirname,'site-source.json'),JSON.stringify(source,null,2)+'\n');
  console.log('Removed '+(before-source.strings.length)+' non-UI inventory artifacts; '+source.strings.length+' source entries remain.');return;
 }
 const only=process.argv.find(a=>a.startsWith('--lang='))?.split('=')[1];
 if(only&&!languages.includes(only))throw Error('Unsupported language: '+only);
 let cursor=0;
 const failures=[];
 const queue=(only?[only]:languages);
 async function worker(){while(cursor<queue.length){const lang=queue[cursor++];
  try{
  const target=path.join(root,'js/i18n/site.'+lang+'.json');
  const dict=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):{};
  // Earlier glossary rules treated action verbs like product-tier names.
  if(!process.argv.includes('--seed'))for(const key of Object.keys(dict))if(/^(?:Edit|Trace) [a-z]/.test(key)&&/\b(?:Edit|Trace)\b/.test(dict[key]))delete dict[key];
  Object.assign(dict,source.seeds[lang]);
  if(discovery[lang])discovery.keys.forEach((key,i)=>{dict[key]=discovery[lang][i];});
  const polish=path.join(__dirname,'site-polish.all.json');
  if(fs.existsSync(polish))Object.assign(dict,JSON.parse(fs.readFileSync(polish,'utf8'))[lang]||{});
  for(const file of fs.readdirSync(__dirname).filter(f=>f.startsWith('site.'+lang+'.')&&f.endsWith('.json')).sort()){
    Object.assign(dict,JSON.parse(fs.readFileSync(path.join(__dirname,file),'utf8')));
  }
  for(const name of protectedNames)if(source.strings.includes(name))dict[name]=name;
  for(const name of directoryNames)if(source.strings.includes(name))dict[name]=name;
  for(const name of serviceNames)if(source.strings.includes(name))dict[name]=name;
  for(const name of platformNames)if(source.strings.includes(name))dict[name]=name;
  for(const key of source.strings)if(bareURL(key)||contactIdentifier(key))dict[key]=key;
  for(const key of source.strings)if(currencyCodes.has(key)||(/^[A-Z]{3} [\p{Sc}]$/u.test(key)&&currencyCodes.has(key.slice(0,3))))dict[key]=key;
  const displayLocale=lang==='tl'?'fil':lang;
  if(Intl.DisplayNames.supportedLocalesOf([displayLocale]).length){
    const currencyNames=new Intl.DisplayNames([displayLocale],{type:'currency'});
    for(const key of source.strings)if(!dict[key]){
      const match=key.match(/^([A-Z]{3}) — .+$/);if(!match||!currencyCodes.has(match[1]))continue;
      const name=currencyNames.of(match[1]);if(name&&name!==match[1])dict[key]=match[1]+' — '+name;
    }
  }
  for(const address of addressNames)if(source.strings.includes(address))dict[address]=address;
  for(const shop of directoryContext.window.SS_DIRECTORY)if(dict[shop.a])for(const city of ['Ho Chi Minh City','Hanoi','Vietnam']){
    const key=shop.a+', '+city;
    if(source.strings.includes(key)&&!dict[key])dict[key]=dict[shop.a]+', '+(dict[city]||city);
  }
  for(const key of source.strings){
    const match=key.match(/^(.*?) — (.*?) \| Seraphic Styler$/);
    if(match&&directoryNames.has(match[1])&&(/^(?:D|Q)\d+$/.test(match[2])||protectedNames.includes(match[2])))dict[key]=key;
  }
  // Generated directory summaries join the same standalone fields. Reuse
  // complete translated fields, never word substitutions or English fallbacks.
  const literal=new Set([...protectedNames,...directoryNames,...serviceNames,...platformNames,...addressNames]);
  const numericTemplates=[];
  for(const [english,translated] of Object.entries(dict)){
    if(!/\{\w+\}/.test(english)||!english.replace(/\{\w+\}/g,'').trim()||typeof translated!=='string')continue;
    const names=[];let end=0,pattern='',ambiguous=false;
    for(const match of english.matchAll(/\{(\w+)\}/g)){
      if(names.length&&match.index===end)ambiguous=true;
      const previous=names.indexOf(match[1]);
      pattern+=english.slice(end,match.index).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+(previous<0?'((?:US)?[\\d.,%$₫–—+-]+)':'(?:\\'+(previous+1)+')');
      if(previous<0)names.push(match[1]);end=match.index+match[0].length;
    }
    if(ambiguous||!names.every(name=>translated.includes('{'+name+'}'))||[...translated.matchAll(/\{(\w+)\}/g)].some(match=>!names.includes(match[1])))continue;
    pattern+=english.slice(end).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    numericTemplates.push({pattern:new RegExp('^'+pattern+'$'),names,translated});
  }
  function composed(value,depth=0){
    if(typeof dict[value]==='string'&&dict[value].trim())return dict[value];
    if(bareURL(value)||contactIdentifier(value))return value;
    if(literal.has(value)||/^(?:D|Q)\d+$/.test(value)||/^[\d\s.,+–—%₫$()/-]+$/.test(value)||(/\d/.test(value)&&/^(?:(?:US|UK|EU|AU|VN|XS|XXL|XL|S|M|L|kg|lb|cm|mm|m²|px|rem)|[\d\s.,+–—≈%₫$()·/-])+$/.test(value)))return value;
    if(depth>3)return null;
    for(const separator of [' — ',' · ',' | ',' / ']){
      const parts=value.split(separator);
      if(parts.length>1){
        const translated=parts.map(part=>composed(part,depth+1));
        if(translated.every(part=>part!==null))return translated.join(separator);
      }
      for(let at=value.indexOf(separator);at>=0;at=value.indexOf(separator,at+separator.length)){
        const left=composed(value.slice(0,at),depth+1);if(left===null)continue;
        const right=composed(value.slice(at+separator.length),depth+1);
        if(right!==null)return left+separator+right;
      }
    }
    return null;
  }
  for(const key of source.strings)if(!dict[key]){
    const value=composed(key);if(value!==null){dict[key]=value;continue;}
    for(const template of numericTemplates){
      const match=template.pattern.exec(key);if(!match)continue;
      const vars=Object.fromEntries(template.names.map((name,i)=>[name,match[i+1]]));
      dict[key]=template.translated.replace(/\{(\w+)\}/g,(token,name)=>vars[name]??token);break;
    }
  }
  for(const key of Object.keys(dict))if(skipSource(key))delete dict[key];
  if(process.argv.includes('--seed')){fs.writeFileSync(target,JSON.stringify(dict)+'\n');continue;}
  const missing=source.strings.filter(s=>!dict[s]);let completed=0;
  const batches=[];let batch=[],size=0;
  for(const s of missing){if(size+s.length>3500&&batch.length){batches.push(batch);batch=[];size=0;}batch.push(s);size+=s.length+1;}if(batch.length)batches.push(batch);
  for(const group of batches){const values=await translate(group,lang);group.forEach((s,i)=>dict[s]=values[i]);completed+=group.length;fs.writeFileSync(target,JSON.stringify(dict)+'\n');if(completed%200<group.length)console.log(lang+': '+completed+'/'+missing.length);}
  fs.writeFileSync(target,JSON.stringify(dict)+'\n');
  console.log('COMPLETE '+lang+': '+source.strings.filter(s=>dict[s]).length+'/'+source.strings.length);
  }catch(error){failures.push(lang);console.error(error.message);}
 }}
 await Promise.all(Array.from({length:1},worker));
 if(failures.length)throw Error('Incomplete languages (resume the build): '+failures.join(', '));
}
(async()=>{if(process.argv.includes('--collect'))await collect();else await build();})().catch(e=>{console.error(e);process.exitCode=1;});
