/* Catalog adapter: legacy observations are imported, never promoted to verification. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SS_CATALOG_CORE=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim();
 const slug=s=>fold(s).replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 const modes={walk:'walk_in',appt:'appointment',hub:'hub',online:'online_only',popup:'pop_up'};
 const safeUrl=s=>{try{const u=new URL(s);return /^https?:$/.test(u.protocol)?u.href:null;}catch{return null;}};
 function districts(s){const t=fold(s),out=[...t.matchAll(/\b(?:district|[dq])\.?\s*(\d{1,2})\b/g)].map(m=>'d'+m[1]);for(const [q,k]of [['thao dien','td'],['phu nhuan','pn'],['tan binh','tb'],['tan phu','tp'],['binh thanh','bt'],['go vap','gv']])if(t.includes(q))out.push(k);return [...new Set(out)];}
 function create(records,coords={},search=null){
  const used=new Set(),byLegacy=new Map();
  const brands=records.map((r,index)=>{
   let id=slug(r.n+(r.sub?' '+r.sub:'')),base=id,n=2;while(used.has(id))id=base+'-'+n++;used.add(id);
   const channelList=[];if(safeUrl(r.w))channelList.push({id:id+'-web',brand_id:id,type:'website',url:safeUrl(r.w),handle:null,ships_international:null});
   if(r.h)channelList.push({id:id+'-ig',brand_id:id,type:'instagram',url:'https://instagram.com/'+encodeURIComponent(r.h),handle:r.h,ships_international:null});
   const issues=[];if(r.flag)issues.push('confirm_first');if(/stale|outdated|older lists/i.test(r.no||''))issues.push('historical_note');
   const raw=r.a||'',parts=raw.split(/\s+\+\s+/),locationRows=[];
   if(r.st!=='online'&&raw){
    parts.forEach((part,i)=>{if(!/\d/.test(part)||/https?:|\.com|\.vn|locator|more|nationwide/i.test(part)){issues.push('unresolved_location');return;}
     const multi=parts.length>1||districts(r.area).length>1;
     const c=!multi?coords[r.n]:null;
     locationRows.push({id:id+'-location-'+(i+1),brand_id:id,label:null,address_raw:part,address_normalized:null,district_groups:districts(part).length?districts(part):multi?[]:districts(r.area),area_note:r.area||null,city:r.city||null,country:'VN',lat:c?.lat??null,lng:c?.lng??null,geo_precision:c?(c.approx?'district':'street'):'unknown',visit_mode:modes[r.st]||'unknown',status:'uncertain',hours:[],timezone:'Asia/Ho_Chi_Minh',last_verified_at:null});
    });
   }
   if(locationRows.length)issues.push('address_normalization_needed');
   const b={id,slug:id,legacy_index:index,display_name:r.n,subtitle:r.sub||null,normalized_name:fold(r.n),aliases:r.h?[r.h]:[],category_primary:r.cat,tier:r.tier==='none'?null:r.tier,signature_flag:!!r.sig,materials:r.fib||[],occasions:r.occ||[],visit_mode:modes[r.st]||'unknown',district_groups:districts(r.area+' '+raw),area_note:r.area||null,city:r.city||null,status:'uncertain',last_reviewed_at:null,price_note:r.price||null,price_band_min_vnd:null,price_band_max_vnd:null,editorial_notes:r.no||null,unresolved_location_note:r.st!=='online'&&(!locationRows.length||parts.length!==locationRows.length)?raw:null,locations:locationRows,channels:channelList,verification:{level:'unverified',checked_at:null,issues:[...new Set(issues)],reason:r.flag?(r.no||'Legacy record requests confirmation.'):null},sources:channelList.map(c=>({url:c.url,type:c.type,captured_at:null})),verification_events:[{id:id+'-import',method:'legacy_import',checked_at:null,level:'unverified',notes:'Imported from directory-data.js; import is not a source check.'}]};
   byLegacy.set(r,b);return b;
  });
  const byId=new Map(brands.map(b=>[b.id,b]));
  function identity(b,q){const v=fold(q).replace(/^@/,'').replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'');if(v===b.normalized_name)return {score:1200,matched_on:['brand name']};if(b.aliases.some(a=>fold(a)===v))return {score:1000,matched_on:['handle']};if(b.channels.some(c=>fold(c.url).replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/\/$/,'')===v))return {score:1000,matched_on:['channel']};return null;}
  function closeName(b,q){const v=fold(q);if(v.length<5||/[^a-z ]/.test(v)||v.split(' ').length>3)return false;
   const distanceOne=(a,z)=>{if(Math.abs(a.length-z.length)>1)return false;if(a===z)return false;let i=0;while(a[i]===z[i]&&i<Math.min(a.length,z.length))i++;return a.slice(i+1)===z.slice(i+1)||a.slice(i+1)===z.slice(i)||a.slice(i)===z.slice(i+1)||(a[i]===z[i+1]&&a[i+1]===z[i]&&a.slice(i+2)===z.slice(i+2));};
   return distanceOne(v,b.normalized_name)||(!v.includes(' ')&&b.normalized_name.split(' ').some(w=>w.length>=5&&distanceOne(v,w)));
  }
  function ranking(b,q){const exact=identity(b,q);if(exact)return exact;if(closeName(b,q))return {score:30,matched_on:['similar brand name']};const r=records[b.legacy_index],terms=search?.parse(q)||[],text=fold(q),reasons=[];if(text&&b.normalized_name.includes(text))reasons.push('brand name');if(b.materials.some(x=>text.includes(fold(x))))reasons.push('material');if(b.district_groups.some(x=>districts(q).includes(x)))reasons.push('district');if(!reasons.length&&q)reasons.push('directory text');return {score:(search?search.score(r,terms):0)+(b.signature_flag?5:0)-(b.verification.issues.includes('confirm_first')?10:0),matched_on:reasons};}
  function matches(b,q){if(!q)return true;if(identity(b,q))return true;if(search){const terms=search.parse(q);return !terms.length||search.test(records[b.legacy_index]._sk||search.keyOf(records[b.legacy_index]),terms)||(!terms.some(t=>t.some(a=>a.startsWith('~')))&&closeName(b,q));}const tokens=fold(q).split(/\s+/);return tokens.every(t=>fold([b.display_name,...b.aliases,b.area_note,b.editorial_notes,...b.materials,...b.occasions].join(' ')).includes(t));}
  const dimensions={category:b=>[b.category_primary],district:b=>b.district_groups,tier:b=>[b.tier],material:b=>b.materials,occasion:b=>b.occasions,visit_mode:b=>[b.visit_mode],verification:b=>[b.verification.level]};
  function query(params={}){const q=String(params.q||'').slice(0,400),page=Math.max(1,Math.floor(+params.page)||1),pageSize=Math.max(1,Math.min(100,Math.floor(+params.page_size)||24));
   const accepts=(b,except)=>Object.entries(dimensions).every(([k,get])=>k===except||!params[k]||String(params[k]).split(',').some(v=>get(b).includes(v)))&&(!params.open_now||params.open_now==='false');
   const lexical=brands.filter(b=>matches(b,q)),results=lexical.filter(b=>accepts(b));
   results.sort((a,b)=>params.sort==='az'?a.display_name.localeCompare(b.display_name):ranking(b,q).score-ranking(a,q).score||a.legacy_index-b.legacy_index);
   const facets={};for(const [k,get] of Object.entries(dimensions)){const count=new Map();lexical.filter(b=>accepts(b,k)).forEach(b=>get(b).filter(Boolean).forEach(v=>count.set(v,(count.get(v)||0)+1)));facets[k]=[...count].map(([value,count])=>({value,count}));}
   return {meta:{query:q,page,page_size:pageSize,total_results:results.length,open_now_supported:false},facets,results:results.slice((page-1)*pageSize,page*pageSize).map(b=>({...b,ranking:ranking(b,q)}))};
  }
  function quality(){const locations=brands.flatMap(b=>b.locations),aliases=new Map();brands.forEach(b=>b.aliases.forEach(a=>{const k=fold(a);aliases.set(k,[...(aliases.get(k)||[]),b.id]);}));return {brands:brands.length,locations:locations.length,exact_geocodes:0,street_geocodes:locations.filter(l=>l.geo_precision==='street').length,structured_hours:locations.filter(l=>l.hours.length).length,verified_last_90_days:0,unresolved_flags:brands.filter(b=>b.verification.issues.length).length,missing_geocode:locations.filter(l=>l.lat===null).length,missing_district:locations.filter(l=>!l.district_groups.length).length,alias_collisions:[...aliases].filter(([,ids])=>ids.length>1).map(([alias,brand_ids])=>({alias,brand_ids})),review_queue:brands.filter(b=>b.verification.issues.length).map(b=>({id:b.id,issues:b.verification.issues,reason:b.verification.reason}))};}
  return {brands,get:id=>byId.get(id)||null,fromLegacy:r=>byLegacy.get(r),matches,ranking,query,quality};
 }
 return {create,fold,slug,districts};
});
