/* Disclosure deep links and a stable, thumb-reachable next step. */
(() => {
  const body=document.body;
  if(!body.classList.contains('ss-links'))return;
  // Match the lookbook: muted, inline loops while visible. Native controls
  // remain available for pausing and for browsers that decline autoplay.
  const films=[...document.querySelectorAll('.lp-work-films video')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const visibleFilms=new Set();
  const quiet=()=>reduce.matches||document.documentElement.matches('.rm, .hc, .mono')||navigator.connection?.saveData;
  const pauseFilms=()=>films.forEach(video=>video.pause());
  const playVisible=()=>{
    if(document.hidden||quiet())return;
    visibleFilms.forEach(video=>{video.muted=true;video.play()?.catch(()=>{});});
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFilms();else playVisible();});
  addEventListener('pagehide',pauseFilms);
  addEventListener('pageshow',playVisible);
  reduce.addEventListener('change',()=>{if(quiet())pauseFilms();});
  new MutationObserver(()=>{if(quiet())pauseFilms();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  if('IntersectionObserver' in window){
    const filmObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      const video=entry.target;
      if(entry.isIntersecting&&entry.intersectionRatio>=.25){
        const entering=!visibleFilms.has(video);
        visibleFilms.add(video);
        if(entering&&!document.hidden&&!quiet()){video.muted=true;video.play()?.catch(()=>{});}
      }else{visibleFilms.delete(video);video.pause();}
    }),{threshold:[0,.25]});
    films.forEach(video=>filmObserver.observe(video));
  }
  const estimateFrame=document.querySelector('.lp-estimate-frame');
  addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==estimateFrame?.contentWindow)return;
    if(event.data?.type==='ss-estimate-height'&&Number.isFinite(event.data.height)&&event.data.height>0){
      estimateFrame.style.height=Math.min(20000,event.data.height+4)+'px';
    }
  });
  function revealHash(){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=document.getElementById(id);if(!target)return;
    let opened=false;
    for(let parent=target.parentElement;parent;parent=parent.parentElement){
      if(parent.tagName==='DETAILS'&&!parent.open){parent.open=true;opened=true;}
    }
    if(opened)requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
  }
  addEventListener('hashchange',revealHash);revealHash();
  const syncField=()=>body.classList.toggle('lp-field-active',!!document.activeElement?.matches('input,textarea,select'));
  document.addEventListener('focusin',syncField);
  document.addEventListener('focusout',()=>requestAnimationFrame(syncField));
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(([entry])=>body.classList.toggle('lp-hero-visible',entry.isIntersecting));
    observer.observe(document.querySelector('.lp-top'));
  }
})();
