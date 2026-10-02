/* Coverage for plain-text fallback dictionaries, including unmarked page copy.
   This checks source coverage, not linguistic quality or third-party iframes. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'tools/i18n/site-source.json'), 'utf8'));
let failures = 0;
const pages = source.pages.filter(file => !file.startsWith('.'));
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (html.includes('</head>') && !html.includes('js/i18n-site.js')) {
    console.error('Missing site language loader: ' + file);
    failures++;
  }
}
for (const lang of Object.keys(source.seeds)) {
  const file = path.join(root, 'js/i18n/site.' + lang + '.json');
  const dict = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const missing = source.strings.filter(s => typeof dict[s] !== 'string' || !dict[s].trim());
  const placeholders = s => [...new Set(s.match(/\{\w+\}/g) || [])].sort().join('|');
  const damaged = source.strings.filter(s => typeof dict[s] === 'string' && placeholders(s) !== placeholders(dict[s]));
  const leaked = source.strings.filter(s => typeof dict[s] === 'string' && /ZXQ\s*\d+\s*QXZ/i.test(dict[s]));
  console.log(`${lang}: ${source.strings.length - missing.length}/${source.strings.length} source strings; ${missing.length} missing; ${damaged.length} damaged placeholders; ${leaked.length} leaked tokens`);
  failures += missing.length + damaged.length + leaked.length;
  for(const suffix of ['ai','main']){
    const aiFile=path.join(root,'tools/i18n/site.'+lang+'.'+suffix+'.json');
    if(!fs.existsSync(aiFile))continue;
    const ai=JSON.parse(fs.readFileSync(aiFile,'utf8'));
    const changedPrices=Object.entries(ai).filter(([english,translated])=>{
      // Turkish convention puts % before the number/range; compare the value,
      // not the sign position. Currency amounts remain byte-for-byte checks.
      const comparable=lang==='tr'?translated.replace(/%(\d+(?:\.\d+)?(?:[–-]\d+(?:\.\d+)?)?)/g,'$1%'):translated;
      return (english.match(/(?:US)?\$\d(?:[\d,.]*\d)?|\d[\d,.]*₫|\d+(?:\.\d+)?%/g)||[]).some(token=>!comparable.includes(token));
    });
    if(changedPrices.length)console.error(lang+' ('+suffix+'): '+changedPrices.length+' entries changed a price or percentage token: '+changedPrices.map(([key])=>key).join('\n'));
    failures+=changedPrices.length;
  }
}
console.log(`${pages.length} public pages checked. Proper names are preserved; URLs and existing non-English copy are not sent for translation.`);
if (failures) process.exitCode = 1;
