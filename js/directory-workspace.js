/* Search-first views over the existing directory, tray, and planner. No network. */
(() => {
 'use strict';
 const engine=window.SS_FD,core=window.SS_CATALOG_CORE,rows=window.SS_DIRECTORY;
 if(!engine?.refresh||!core||!rows)return;
 const catalog=core.create(rows,window.SS_COORDS,window.SS_SEARCH);window.SS_CATALOG=catalog;
 const wording={'Find Vietnamese fashion by name, fabric, occasion, or district.':'fd.ws.intro','Directory observations, not live stock. Confirm current hours before a visit.':'fd.ws.observations','Search':'fd.ws.search','Explore':'fd.ws.explore','Compare':'fd.ws.compare','Plan a visit':'fd.ws.visit','Piece board':'fd.ws.board','Filters':'fd.ws.filters','Compact list':'fd.ws.compact','Rich cards':'fd.ws.rich','Previous':'fd.ws.previous','Next':'fd.ws.next','Save':'fd.ws.save','Materials':'fd.ws.materials','Not recorded':'fd.ws.unknown','Why?':'fd.ws.why','Saved':'fd.savedlab','Area':'fd.loclabel','Tier':'fd.tierlabel','Walk-in':'fd.dyn.st.walk','Appointment':'fd.dyn.st.appt','Online':'fd.dyn.st.online','Womenswear':'fd.cat.women','Menswear & streetwear':'fd.cat.men','Accessories':'fd.cat.access','Markets':'fd.cat.market','mid':'fd.tiersel.mid','premium':'fd.tiersel.premium','luxury':'fd.tiersel.luxury','couture':'fd.tiersel.couture'};
 const $=s=>document.querySelector(s),node=(tag,text,cls)=>{const n=document.createElement(tag);if(text){const key=wording[text];const translated=key?window.SS_T(key,undefined):undefined;n.textContent=translated??text;if(key){n.dataset.i18n=key;if(!translated&&window.SS_LANG?.()!=='en')n.lang='en';}}if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=node('button',text);b.type='button';b.addEventListener('click',fn);return b;};
 const link=(text,href)=>{const a=node('a',text);a.href=href;return a;};
 const labels={walk_in:'Walk-in',appointment:'Appointment',online_only:'Online',hub:'Multi-brand hub',pop_up:'Pop-up',unknown:'Confirm access'};
 const category={women:'Womenswear',men:'Menswear',tailor:'Áo dài & tailoring',bridal:'Bridal',luxury:'Luxury & couture',access:'Accessories',vintage:'Vintage',active:'Activewear',sleep:'Loungewear',market:'Markets',lingerie:'Lingerie'};
 const sections={search:$('.fd-results-zone'),explore:$('#browse'),visit:$('#map'),compare:$('#house-compare'),buy:$('#piece-board'),reference:$('#ss-static-index')};
 const mast=$('.masthead'),nav=$('.fd-journey');let view='search',format='compact',page=1,lastKey='',visibleRows=[],opener=null;
 const record=node('section','','fd-record wrap');record.id='brand-record';record.tabIndex=-1;nav.after(record);sections.record=record;
 const routes={search:'Search',explore:'Explore',compare:'Compare',visit:'Plan a visit',buy:'Piece board'};
 nav.replaceChildren();Object.entries(routes).forEach(([key,label])=>{const a=link(label,'?view='+key);a.dataset.workspaceView=key;nav.append(a);});nav.setAttribute('aria-label','Directory workspaces');const saved=button('Saved',()=>window.SS_TRAY.open(saved));saved.className='fd-nav-saved';nav.append(saved);
 const subtitle=$('.masthead .lede');subtitle.textContent='Find Vietnamese fashion by name, fabric, occasion, or district.';subtitle.dataset.i18n='fd.ws.intro';subtitle.removeAttribute('lang');
 const siteMenu=node('details','','fd-site-menu');siteMenu.append(node('summary','Menu'),$('.secnav'));siteMenu.querySelector('summary').dataset.i18n='ui.menu';$('.fd-topbar').append(siteMenu);
 siteMenu.addEventListener('keydown',e=>{if(e.key==='Escape'&&siteMenu.open){e.preventDefault();siteMenu.open=false;siteMenu.querySelector('summary').focus();}});document.addEventListener('pointerdown',e=>{if(!siteMenu.contains(e.target))siteMenu.open=false;});
 // Appearance controls share state and motion with the homepage; language keeps its existing selector.
 const appearance=node('details','','fd-appearance');
 const appearanceSummary=node('summary','Appearance');const preferences=node('div','','fd-appearance-panel');
 const appearanceLabel=node('p','Appearance');appearanceLabel.dataset.i18n='a11y.theme';preferences.append(appearanceLabel);
 const choices=node('div','','fd-theme-choices');choices.setAttribute('role','group');choices.setAttribute('aria-label','Color theme');
 ['auto','light','dark','mono'].forEach(mode=>{const b=button({auto:'Auto',light:'Light',dark:'Dark',mono:'Mono'}[mode],()=>{});b.dataset.themeChoice=mode;b.dataset.i18n='theme.'+mode;b.setAttribute('aria-pressed',String(window.SS_THEME.mode===mode));choices.append(b);});preferences.append(choices);
 [['Reduce motion','rm','ss-motion'],['High contrast','hc','ss-contrast']].forEach(([label,cls,key])=>{
  const b=button(label,()=>{const on=!document.documentElement.classList.contains(cls);document.documentElement.classList.toggle(cls,on);b.setAttribute('aria-pressed',String(on));try{localStorage.setItem(key,on?'1':'0');}catch(_) {}});
  b.dataset.i18n=cls==='rm'?'a11y.motion':'a11y.contrast';b.setAttribute('aria-pressed',String(document.documentElement.classList.contains(cls)));preferences.append(b);
 });
 appearance.append(appearanceSummary,preferences);$('.fd-tools').append(appearance);$('#theme')?.remove();
 function syncAppearance(){appearanceSummary.textContent=window.SS_T('theme.'+window.SS_THEME.effective(),{light:'Light',dark:'Dark',mono:'Mono'}[window.SS_THEME.effective()]);appearanceSummary.setAttribute('aria-label',window.SS_T('a11y.theme','Appearance')+': '+appearanceSummary.textContent);}
 syncAppearance();document.addEventListener('ss:themechange',syncAppearance);
 appearance.addEventListener('toggle',()=>{if(appearance.open)siteMenu.open=false;});siteMenu.addEventListener('toggle',()=>{if(siteMenu.open)appearance.open=false;});
 // The same quick controls as the atelier, without a second preference store.
 const rail=node('div','','fd-quick-settings');
 const themeQuick=button('',()=>window.SS_THEME.cycle());themeQuick.id='fd-theme-quick';
 themeQuick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M12 3.8a8.2 8.2 0 0 1 0 16.4Z" fill="currentColor" stroke="none"/></svg>';
 const langQuick=button('VN',()=>window.SS_setLang(document.documentElement.lang==='vi'?'en':'vi'));langQuick.id='fd-language-quick';
 const settingsQuick=button('',()=>{
  if(appearance.open){closePreferences(true);return;}
  window.SS_DIRECTORY_GUIDE?.close();siteMenu.open=false;
  appearance.classList.add('fd-floating-preferences');appearance.open=true;
  settingsQuick.setAttribute('aria-expanded','true');preferences.querySelector('button').focus({preventScroll:true});
 });settingsQuick.id='fd-settings-quick';settingsQuick.setAttribute('aria-expanded','false');
 preferences.id='fd-preferences';settingsQuick.setAttribute('aria-controls',preferences.id);
 settingsQuick.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h9M19.5 8H20"/><circle cx="16" cy="8" r="2.3"/><path d="M4 16h3.5M12.5 16H20"/><circle cx="10" cy="16" r="2.3"/></svg>';
 rail.append(themeQuick,langQuick,settingsQuick);document.body.append(rail);
 function closePreferences(restore){const floating=appearance.classList.contains('fd-floating-preferences');appearance.open=false;appearance.classList.remove('fd-floating-preferences');settingsQuick.setAttribute('aria-expanded','false');if(restore)(floating?settingsQuick:appearanceSummary).focus({preventScroll:true});}
 function syncQuickSettings(){
  const label=window.SS_T('a11y.theme','Appearance');const modes=['light','dark','mono'],current=window.SS_THEME.effective(),next=modes[(modes.indexOf(current)+1)%3];
  themeQuick.setAttribute('aria-label',label+': '+window.SS_T('theme.'+current,current)+' → '+window.SS_T('theme.'+next,next));themeQuick.title=themeQuick.getAttribute('aria-label');
  const vietnamese=document.documentElement.lang==='vi';langQuick.textContent=vietnamese?'EN':'VN';langQuick.setAttribute('aria-label',vietnamese?'Switch to English':'Chuyển sang tiếng Việt');langQuick.lang=vietnamese?'en':'vi';langQuick.title=vietnamese?'English':'Tiếng Việt';
  settingsQuick.setAttribute('aria-label',label+' · '+window.SS_T('a11y.motion','Reduce motion')+' · '+window.SS_T('a11y.contrast','High contrast'));settingsQuick.title=label;
  choices.setAttribute('aria-label',label);syncAppearance();
 }
 syncQuickSettings();document.addEventListener('ss:lang',syncQuickSettings);document.addEventListener('ss:themechange',syncQuickSettings);
 appearance.addEventListener('toggle',()=>{settingsQuick.setAttribute('aria-expanded',String(appearance.open&&appearance.classList.contains('fd-floating-preferences')));if(!appearance.open)appearance.classList.remove('fd-floating-preferences');});
 appearance.addEventListener('keydown',e=>{if(e.key==='Escape'&&appearance.open){e.preventDefault();closePreferences(true);}});
 document.addEventListener('pointerdown',e=>{if(!appearance.contains(e.target)&&!settingsQuick.contains(e.target))closePreferences(false);});
 // Keyboard users leaving this non-modal disclosure can continue browsing normally.
 document.addEventListener('focusin',e=>{if(appearance.open&&!appearance.contains(e.target)&&!settingsQuick.contains(e.target))closePreferences(false);});
 // One search field and one set of filters retain existing listeners and mobile sheet behavior.
 const top=node('div','','fd-search-top');sections.search.prepend(top);top.append($('.searchrow'));
 const tools=node('div','','fd-workspace-tools');tools.append(button('Filters',()=>engine.openFilters()));tools.firstChild.className='fd-mobile-filters';
 const formats=node('div','','fd-formats');formats.setAttribute('role','group');formats.setAttribute('aria-label','Result format');
 ['compact','rich'].forEach(value=>{const b=button(value==='compact'?'Compact list':'Rich cards',()=>{format=value;page=1;engine.refresh();});b.dataset.format=value;formats.append(b);});tools.append(formats);top.append(tools,$('#activebar'));
 const help=node('form','','fd-context-guide');const l=node('label','Need help narrowing it down?');l.htmlFor='fd-context-question';const input=node('input');input.id='fd-context-question';input.maxLength=400;input.placeholder='Try “linen in District 3”';input.autocomplete='off';const send=node('button','Find a direction');send.type='submit';help.append(l,input,send);help.addEventListener('submit',e=>{e.preventDefault();if(input.value.trim()){window.SS_DIRECTORY_GUIDE?.ask(input.value.trim());input.value='';}});const helpDetails=node('details','','fd-context-disclosure');helpDetails.append(node('summary','Need help choosing? Ask the directory.'),help);top.append(helpDetails);
 // Keep the category facet in the existing mobile bottom sheet, not a second form.
 const catField=$('#catchips').closest('fieldset'),controls=$('.controls .wrap'),mobile=matchMedia('(max-width:720px)');
 function moveCategories(){if(mobile.matches)$('#sheetbody').prepend(catField);else controls.prepend(catField);}mobile.addEventListener('change',moveCategories);moveCategories();
 const exploreTools=node('div','','fd-explore-tools');exploreTools.append(link('Browse district clusters','?view=visit'),link('Signature houses','#sig=1'),link('Linen houses','#fib=linen'),link('Silk houses','#fib=silk'));$('#browse .wrap').append(exploreTools);
 const editorial=node('div','','fd-explore-clusters');editorial.innerHTML=engine.streets();$('#browse .wrap').append(editorial);
 function href(v,id){const u=new URL(location.href);if(u.hash&&!u.hash.includes('='))u.hash='';u.searchParams.set('view',v);if(id)u.searchParams.set('brand',id);else u.searchParams.delete('brand');return u.pathname+u.search+u.hash;}
 function show(v){
  view=Object.hasOwn(sections,v)?v:'search';Object.entries(sections).forEach(([k,s])=>{s.hidden=k!==view;if(k===view&&k!=='search')s.setAttribute('role','main');else s.removeAttribute('role');});
  document.body.dataset.directoryView=view;nav.querySelectorAll('a').forEach(a=>{if(a.dataset.workspaceView===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  // References remain a separate, reachable document surface rather than another result stream.
  $('#fd-reference-notes').hidden=view!=='reference';
  if(view==='visit')window.__fdMapOpen?.(true);
 }
 function go(v,id,write=true,focus=true){
  if(write)history.pushState(null,'',href(v,id));show(v);window.SS_DIRECTORY_GUIDE?.close();
  if(v==='record')renderRecord(id);else if(v==='search')engine.refresh();
  if(focus){const target=sections[view];target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({behavior:'instant',block:'start'});}
 }
 function restore(){const p=new URLSearchParams(location.search);go(p.get('view')||'search',p.get('brand'),false,false);if(!p.has('view')||hashViews[location.hash.slice(1)]||/^(#plain-|#ss-static-index|#fd-reference-notes)/.test(location.hash))revealHash();if(location.hash==='#fd-guide')window.SS_DIRECTORY_GUIDE?.open();}
 const hashViews={'q':'search','browse':'explore','map':'visit','house-compare':'compare','piece-board':'buy','fd-piece-compare':'buy','main':'search','filters':'search'};
 function adopt(v){show(v);const u=new URL(location.href);u.searchParams.set('view',v);u.searchParams.delete('brand');history.replaceState(null,'',u.pathname+u.search+u.hash);}
 function revealHash(){const hash=location.hash.slice(1);if(hashViews[hash])adopt(hashViews[hash]);else if(/^(q|cat|city|tier|fib|occ|zone|walk|saved|sig|sort)=/.test(hash))adopt('search');else if(/^(plain-|ss-static-index|fd-reference-notes)/.test(hash)){adopt('reference');}}
 document.addEventListener('click',e=>{
  const a=e.target.closest('a');if(a){const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname===location.pathname){if(u.searchParams.has('view')&&!a.getAttribute('href').startsWith('#')){e.preventDefault();go(u.searchParams.get('view'),u.searchParams.get('brand'));return;}if(u.hash){const id=u.hash.slice(1);if(hashViews[id])adopt(hashViews[id]);if(id==='filters'&&mobile.matches){e.preventDefault();engine.openFilters();return;}if(id.startsWith('plain-')||id==='ss-static-index'||id==='fd-reference-notes'){adopt('reference');}}}}
  const action=e.target.closest('.tabbar [data-act]')?.dataset.act;if(action){if(['search','all','sheet'].includes(action))adopt('search');if(action==='map')adopt('visit');if(action==='compare')adopt('compare');if(action==='board')adopt('buy');}
 },true);
 addEventListener('popstate',restore);addEventListener('hashchange',revealHash);
 // Programmatic comparison, guide matches, and board actions also reveal their target surface.
 window.SS_WORKSPACE={show:v=>go(v,null,true,false),reveal:id=>{if(hashViews[id])go(hashViews[id],null,true,false);},go};
 function facts(items){const dl=node('dl','','fd-record-facts');items.forEach(([k,v])=>{const pair=node('div');pair.append(node('dt',k),node('dd',v||'Not recorded'));dl.append(pair);});return dl;}
 function recordLink(b){const a=link(b.display_name+(b.subtitle?' · '+b.subtitle:''),href('record',b.id));a.addEventListener('click',()=>opener=a);return a;}
 function recordActions(b){const actions=node('div','','fd-record-actions'),legacy=rows[b.legacy_index],key=legacy.h||legacy.n;
  const save=button(window.SS_TRAY.isSaved(key)?'Saved':'Save',()=>{const saved=window.SS_TRAY.isSaved(key);if(saved)window.SS_TRAY.removeSaved(key);else window.SS_TRAY.addSaved(key);save.textContent=window.SS_T(saved?'fd.ws.save':'fd.savedlab',saved?'Save':'Saved');save.dataset.i18n=saved?'fd.ws.save':'fd.savedlab';save.setAttribute('aria-pressed',String(!saved));});save.setAttribute('aria-pressed',String(window.SS_TRAY.isSaved(key)));save.setAttribute('aria-label','Save '+b.display_name);actions.append(save);
  const compare=node('button','Compare');compare.type='button';compare.dataset.compareHouse=b.legacy_index;compare.setAttribute('aria-pressed','false');actions.append(compare);return actions;
 }
 function renderRecord(id){const b=catalog.get(id);record.replaceChildren();record.append(link('← Back to search',href('search')));
  if(!b){record.append(node('h2','This house record could not be found.'),node('p','Search by brand name to find its current directory entry.'));return;}
  const head=node('header');head.append(node('p',category[b.category_primary]||b.category_primary,'eyebrow'),node('h2',b.display_name));if(b.subtitle)head.append(node('p',b.subtitle));head.append(recordActions(b));record.append(head);
  record.append(facts([['Shopping mode',labels[b.visit_mode]],['Area recorded',b.area_note],['Price tier',b.tier],['Price observation',b.price_note],['Current opening status','Not confirmed — contact the house'],['Review evidence',b.last_reviewed_at||'Per-house review date not recorded']]));
  const locations=node('section');locations.append(node('h3','Locations & visiting'));
  if(!b.locations.length)locations.append(node('p',b.visit_mode==='online_only'?'Online listing. No public visiting location recorded.':'A visit-ready street address has not been established.'));
  b.locations.forEach(l=>{const s=node('article');s.append(node('h4',l.address_normalized||'Address note to confirm'),node('p',l.address_raw),node('p','Hours and current trading status need confirmation.'));if(l.lat!==null)s.append(node('p',l.geo_precision==='district'?'Map position is a district estimate.':'Street-level map position recorded; entrance not verified.'));const map=link('Check location on maps ↗','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.display_name+' '+l.address_raw+' '+(l.city==='SGN'?'Ho Chi Minh City':'Vietnam')));map.target='_blank';map.rel='noopener noreferrer';s.append(map);locations.append(s);});if(b.unresolved_location_note)locations.append(node('p','Additional location note: '+b.unresolved_location_note));record.append(locations);
  const channels=node('section');channels.append(node('h3','Official channels'));b.channels.forEach(c=>{const a=link(c.type==='instagram'?'Instagram · @'+c.handle:new URL(c.url).hostname,c.url);a.target='_blank';a.rel='noopener noreferrer';channels.append(a);});if(!b.channels.length)channels.append(node('p','No channel recorded.'));channels.append(node('p','Payment methods and international delivery must be confirmed with the seller.'));record.append(channels);
  record.append(facts([['Materials recorded',b.materials.join(', ')],['Occasions recorded',b.occasions.map(o=>({bday:'Celebrations',event:'Formal occasions',night:'Evening & parties'})[o]||o).join(', ')],['Garment fit and sizes','Confirm for the individual piece']]));
  const notes=node('section');notes.append(node('h3','Editorial notes'),node('p',b.editorial_notes||'No editorial note recorded.'));record.append(notes);
  const evidence=node('details');evidence.append(node('summary','Sources & verification history'),node('p','This record was imported from the existing directory. A source capture date and individual verification history are not recorded; the import does not verify the house.'));if(b.verification.reason)evidence.append(node('p','Confirmation note: '+b.verification.reason));b.sources.forEach(s=>evidence.append(link(s.url,s.url)));record.append(evidence);
  const next=node('section');next.append(node('h3','From a house to a piece'),node('p','Have an identified item and seller? Request purchase assistance. Want pieces selected around your taste? Choose styling.'),link('Request an exact piece','service-request.html?service=sourcing'),link('Ask for styling','service-request.html?service=styling'));record.append(next);
 }
 function renderResults(shown){
  const host=$('#main'),q=$('#q').value,key=JSON.stringify(engine.state());
  const counts=engine.facetCounts();for(const [id,values] of Object.entries(counts)){document.querySelectorAll('#'+id+' '+(id==='catchips'?'button':'option')).forEach(n=>{const v=n.dataset.v||n.value;n.textContent=n.textContent.replace(/ · \d+$/,'')+' · '+values[v];});}if(key!==lastKey){page=1;lastKey=key;}
  formats.querySelectorAll('[data-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.format===format)));
  document.body.dataset.resultFormat=format;
  visibleRows=engine.sort(shown);if(format==='rich')return false;
  host.replaceChildren();const title=node('h2',window.SS_TF('fd.ws.count','{n} houses',{n:shown.length}));title.className='fd-results-title';host.append(title,node('p','Directory observations, not live stock. Confirm current hours before a visit.','fd-results-note'));
  const max=Math.max(1,Math.ceil(visibleRows.length/24));page=Math.min(page,max);
  if(!shown.length){host.append(node('p','No houses match these filters. Remove a filter or clear the search to try again.'),button('Clear all filters',()=>engine.reset()));return true;}
  const list=node('div','','fd-record-list');list.setAttribute('role','list');
  visibleRows.slice((page-1)*24,page*24).forEach(r=>{const b=catalog.fromLegacy(r),row=node('article','','fd-result-row');row.setAttribute('role','listitem');const name=node('div','','fd-result-name');const h=node('h3');h.append(recordLink(b));name.append(h,node('p',category[b.category_primary]||b.category_primary));if(q)name.append(node('p','Matched '+catalog.ranking(b,q).matched_on.join(', '),'fd-match-reason'));row.append(name);
   row.append(facts([['Visit',labels[b.visit_mode]],['Area',b.area_note],['Tier',b.tier],['Materials',b.materials.join(', ')]]));
   const state=node('div','','fd-result-status');if(b.verification.issues.includes('confirm_first'))state.append(node('span','Recorded caution'));else state.hidden=true;if(b.verification.reason){const d=node('details');d.append(node('summary','Why?'),node('p',b.verification.reason),node('p','Review date not recorded.'));state.append(d);}row.append(state,recordActions(b));list.append(row);});host.append(list);
  const paging=node('nav','','fd-pagination');paging.setAttribute('aria-label','Result pages');const prev=button('Previous',()=>{page--;engine.refresh();host.focus({preventScroll:true});host.scrollIntoView({behavior:'instant'});}),next=button('Next',()=>{page++;engine.refresh();host.focus({preventScroll:true});host.scrollIntoView({behavior:'instant'});});prev.disabled=page===1;next.disabled=page===max;paging.append(prev,node('span',window.SS_TF('fd.ws.page','Page {page} of {total}',{page,total:max})),next);host.append(paging);return true;
 }
 window.SS_WORKSPACE_RENDER=renderResults;
 // Rich cards retain their editorial detail, with a canonical record destination.
 new MutationObserver(()=>{if(format!=='rich')return;$('#main').querySelectorAll('article[data-house-index]').forEach(card=>{if(card.querySelector('.fd-open-record'))return;const b=catalog.fromLegacy(rows[+card.dataset.houseIndex]);const a=recordLink(b);a.textContent='Open house record';a.className='fd-open-record';card.append(a);});}).observe($('#main'),{childList:true,subtree:true});
 const language=node('p','Some detailed guidance and source notes are in English.','fd-workspace-language');$('footer .wrap').prepend(language);const ref=link('Plain-text directory & research notes','#ss-static-index');ref.className='fd-reference-link';$('footer .wrap').prepend(ref);
 document.addEventListener('ss:lang',()=>{if(view==='record')renderRecord(new URLSearchParams(location.search).get('brand'));if(view==='search')engine.refresh();});
 document.body.classList.add('fd-workspace');restore();engine.refresh();
})();
