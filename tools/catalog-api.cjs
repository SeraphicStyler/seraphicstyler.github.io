/* Optional local catalog API. No database, writes, credentials, or external requests. */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../js/directory-catalog.js'),route=require('../js/route-solver.js');
function load(){const c={window:{},URL};vm.createContext(c);for(const name of ['directory-data','fd-search','store-coords'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/'+name+'.js'),'utf8'),c);c.window.SS_SEARCH.index(c.window.SS_DIRECTORY);return core.create(c.window.SS_DIRECTORY,c.window.SS_COORDS,c.window.SS_SEARCH);}
function createServer(){const catalog=load();return http.createServer(async(req,res)=>{res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');const send=(code,body)=>{res.writeHead(code);res.end(JSON.stringify(body));};
 try{const u=new URL(req.url,'http://localhost'),params=Object.fromEntries(u.searchParams);if(req.headers.origin&&!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.origin))return send(403,{error:'Local preview origins only.'});
  if(params.open_now&&params.open_now!=='false')return send(422,{error:'Current opening status is not available: structured weekday hours are missing.'});
  if(req.method==='GET'){
   if(u.pathname==='/api/v1/brands'){for(const k of ['page','page_size'])if(params[k]&&(!/^\d+$/.test(params[k])||+params[k]<1))return send(400,{error:k+' must be a positive integer.'});return send(200,catalog.query(params));}
   if(u.pathname==='/api/v1/facets')return send(200,catalog.query(params).facets);
   if(u.pathname==='/api/v1/quality')return send(200,catalog.quality());
   if(u.pathname==='/api/v1/districts/summary'){const counts=new Map();catalog.brands.filter(b=>!params.city||b.city===params.city).forEach(b=>b.district_groups.forEach(code=>{const n=counts.get(code)||{code,brand_count:0,walk_in_count:0};n.brand_count++;if(b.visit_mode==='walk_in')n.walk_in_count++;counts.set(code,n);}));return send(200,{basis:'Recorded district associations; one brand may appear in multiple districts.',summary:[...counts.values()]});}
   const m=u.pathname.match(/^\/api\/v1\/brands\/([^/]+)(\/compare-fields)?$/);if(m){const b=catalog.get(decodeURIComponent(m[1]));return b?send(200,m[2]?{id:b.id,display_name:b.display_name,tier:b.tier,materials:b.materials,occasions:b.occasions,visit_mode:b.visit_mode,district_groups:b.district_groups,verification:b.verification}:b):send(404,{error:'Brand not found.'});}
  }
  if(req.method==='POST'&&['/api/v1/compare','/api/v1/routes/plan'].includes(u.pathname)){
   let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>8192)return send(413,{error:'Request too large.'});}let body;try{body=JSON.parse(raw);}catch{return send(400,{error:'Invalid JSON.'});}
   if(!body||typeof body!=='object'||Array.isArray(body))return send(400,{error:'Supply a JSON object.'});if(body.mode&&!['walk','car'].includes(body.mode))return send(400,{error:'Mode must be walk or car.'});const ids=body.brand_ids,max=u.pathname.endsWith('compare')?3:8;if(!Array.isArray(ids)||!ids.length||ids.length>max||ids.some(id=>typeof id!=='string'))return send(400,{error:'Supply between 1 and '+max+' brand_ids.'});const brands=[...new Set(ids)].map(id=>catalog.get(id));if(brands.some(b=>!b))return send(404,{error:'Unknown brand ID.'});
   if(u.pathname.endsWith('compare'))return send(200,{brands});
   if(body.constraints?.only_open_now)return send(422,{error:'Open-now routes require structured, confirmed opening hours.'});
   const stops=[],excluded=[];brands.forEach(b=>{const l=b.locations.find(l=>l.lat!==null&&l.geo_precision==='street'&&['walk_in','hub'].includes(l.visit_mode));if(l)stops.push({n:b.display_name,brand_id:b.id,location_id:l.id,address:l.address_raw,lat:l.lat,lng:l.lng});else excluded.push({brand_id:b.id,reason:'No unambiguous street-level walk-in location recorded.'});});
   return send(200,{basis:'Estimated route from recorded coordinates; not live traffic or confirmed opening hours. First supplied eligible brand is the starting stop.',route:route.solve(stops,{mode:body.mode==='walk'?'walk':'car'}),excluded});
  }
  return send(404,{error:'Endpoint not found.'});
 }catch(e){return send(500,{error:'Catalog request could not be completed.'});}
 });}
if(require.main===module){const port=Number(process.env.SS_CATALOG_PORT)||8732;createServer().listen(port,'127.0.0.1',()=>console.log('Local catalog API: http://127.0.0.1:'+port+'/api/v1/brands'));}
module.exports={createServer,load};
