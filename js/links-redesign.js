/* Enhancement only: links, posters, prices, and disclosures remain usable without JavaScript. */
(() => {
  const page=document.querySelector('.links-redesign'); if(!page)return;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.classList.contains('rm');
  const videos=[...page.querySelectorAll('.lp-film video')], visible=new Set();
  const sync=()=>videos.forEach(v=>visible.has(v)&&!document.hidden&&!reduced()?v.play().catch(()=>{}):v.pause());
  videos.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='lp-film-toggle';const label=()=>{b.textContent=v.paused?'Play':'Pause';b.setAttribute('aria-label',(v.paused?'Play ':'Pause ')+v.getAttribute('aria-label'));};b.addEventListener('click',()=>v.paused?v.play().catch(()=>v.controls=true):v.pause());v.addEventListener('play',label);v.addEventListener('pause',label);label();v.parentElement.append(b);});
  if('IntersectionObserver'in window){const films=new IntersectionObserver(es=>{es.forEach(e=>e.intersectionRatio>=.6?visible.add(e.target):visible.delete(e.target));sync();},{threshold:[0,.6]});videos.forEach(v=>films.observe(v));const art=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting||reduced())return;e.target.classList.add(e.target.matches('[data-draw-once]')?'is-drawn':'is-hemmed');art.unobserve(e.target);}),{threshold:.55});page.querySelectorAll('[data-draw-once],[data-hem-once]').forEach(e=>art.observe(e));}
  document.addEventListener('visibilitychange',sync);matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',sync);
  const frame=page.querySelector('.lp-estimate-frame');addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame?.contentWindow&&e.data?.type==='ss-estimate-height'&&Number.isFinite(e.data.height))frame.style.height=Math.min(20000,e.data.height+4)+'px';});
})();
