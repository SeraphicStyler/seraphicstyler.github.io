/* Inventory actual page references; coverage is not a claim of linguistic review. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context={window:{}};vm.createContext(context);
for(const name of ['translations','links-i18n','links-i18n-lp2'])vm.runInContext(read('js/'+name+'.js'),context);
const shared=context.window.SS_TRANSLATIONS, report={scope:'Root public HTML pages and explicit i18n keys; generated house records and unmarked prose require a separate content review.',pages:[]};
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
 const html=read(file),keys=[...new Set([...html.matchAll(/data-i18n(?:-ph|-al|-ti)?=["']([^"']+)/g)].map(m=>m[1]))];
 const page=html.match(/data-i18n-page=["']([^"']+)/)?.[1];let dictionaries={};
 if(page){
  const c={SS_I18N_ADD:(p,l,d)=>{if(p===page)dictionaries[l]=d;}};vm.createContext(c);
  for(const f of fs.readdirSync(path.join(root,'js/i18n')).filter(f=>f.startsWith(page+'.')))vm.runInContext(read('js/i18n/'+f),c);
 }else if(html.includes('js/i18n.js'))dictionaries=shared;
 const locales=Object.fromEntries(Object.entries(dictionaries).map(([lang,d])=>[lang,{missing:keys.filter(k=>!d[k])}]));
 report.pages.push({file,engine:page?'page':Object.keys(dictionaries).length?'shared':'none',marked_keys:keys.length,locales});
}
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/translation-audit.json'),JSON.stringify(report,null,2)+'\n');
let md='# Translation coverage audit\n\nGenerated from current files. Key coverage does not verify fluent wording, factual parity, or unmarked/dynamic copy. An English-only page is not a completed translation.\n\n| Page | Engine | Marked keys | Missing Vietnamese keys | Other locales: missing range |\n|---|---|---:|---:|---:|\n';
for(const p of report.pages){const counts=Object.values(p.locales).map(l=>l.missing.length);md+=`| ${p.file} | ${p.engine} | ${p.marked_keys} | ${p.locales.vi?.missing.length??'Not offered'} | ${counts.length?Math.min(...counts)+'–'+Math.max(...counts):'Not offered'} |\n`;}
md+='\n## Review sequence\n\n1. Complete Vietnamese for the homepage, estimate, gifts, and service boundaries against approved English.\n2. Update the same facts across the other offered languages; keep tier names and amounts stable.\n3. Translate the new directory workspace, assistant interface and answer content. House/source notes must retain provenance and can carry a separate translation.\n4. Add localization to English-only service, request and policy pages before describing the whole website as multilingual.\n5. Check native-speaker wording, plural forms, right-to-left layout, screen-reader labels, and text expansion on real mobile devices.\n\nThe full missing-key lists are in `translation-audit.json`. Do not fill them with English text to make coverage tests pass.\n';
fs.writeFileSync(path.join(root,'docs/translation-audit.md'),md);
console.log('Wrote docs/translation-audit.md and translation-audit.json for '+report.pages.length+' root pages.');
