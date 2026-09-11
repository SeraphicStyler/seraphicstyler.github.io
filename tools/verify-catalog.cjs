const assert=require('node:assert/strict'),{createServer,load}=require('./catalog-api.cjs');
(async()=>{const c=load();assert.equal(c.brands.length,321);assert.equal(new Set(c.brands.map(b=>b.id)).size,321);
for(const b of c.brands){assert.equal(b.last_reviewed_at,null);assert.equal(b.verification.checked_at,null);assert.equal(b.verification.level,'unverified');assert.equal(b.price_band_min_vnd,null);for(const l of b.locations){assert.equal(l.address_normalized,null);assert.equal(l.hours.length,0);assert.equal(l.last_verified_at,null);}}
assert.equal(c.query({q:'Daniv Dear'}).results[0].id,'daniv-dear');assert(c.query({q:'resle'}).results.some(b=>b.id==='resel-studio'));assert(!c.query({q:'linen'}).results.some(b=>b.ranking.matched_on.includes('similar brand name')));assert.equal(c.query({q:'@daniv.dear'}).results[0].id,'daniv-dear');assert(c.query({q:'https://liniss.com/'}).results[0].display_name==='Liniss');
assert(c.query({material:'linen',page_size:100}).results.every(b=>b.materials.includes('linen')));assert(c.query({district:'d3',page_size:100}).results.every(b=>b.district_groups.includes('d3')));
const facets=c.query({tier:'mid'}).facets.tier;assert(facets.some(f=>f.value==='premium'&&f.count>0),'facet alternatives not suppressed');assert.equal(c.quality().structured_hours,0);assert(c.quality().alias_collisions.length>=3);
const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));try{const base='http://127.0.0.1:'+server.address().port;
for(const [path,status]of [['/api/v1/brands?q=daniv.dear',200],['/api/v1/brands/daniv-dear',200],['/api/v1/brands/daniv-dear/compare-fields',200],['/api/v1/facets',200],['/api/v1/quality',200],['/api/v1/districts/summary?city=SGN',200],['/api/v1/brands?open_now=true',422],['/api/v1/brands?page=-1',400],['/api/v1/brands/missing',404]])assert.equal((await fetch(base+path)).status,status,path);
const post=(path,body)=>fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
assert.equal((await post('/api/v1/compare',{brand_ids:['daniv-dear','resel-studio']})).status,200);
assert.equal((await post('/api/v1/compare',{brand_ids:['missing']})).status,404);
const plan=await(await post('/api/v1/routes/plan',{brand_ids:['daniv-dear','routine-u-space'],mode:'walk'})).json();assert(plan.excluded.some(b=>b.brand_id==='routine-u-space'));assert.equal(plan.route.stops[0].brand_id,'daniv-dear');
assert.equal((await post('/api/v1/routes/plan',{brand_ids:['daniv-dear'],constraints:{only_open_now:true}})).status,422);
console.log('PASS catalog: 321 stable records, no invented review/price/hours, exact name/handle/domain ranking, facets, evidence gaps, API statuses, comparison and conservative route exclusions.');
}finally{await new Promise(resolve=>server.close(resolve));}})().catch(e=>{console.error(e);process.exitCode=1;});
