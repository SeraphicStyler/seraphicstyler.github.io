/* Disclosure deep links and a stable, thumb-reachable next step. */
(() => {
  const body=document.body;
  if(!body.classList.contains('ss-links'))return;
  // Match the lookbook: muted, inline loops while visible. Native controls
  // remain available for pausing and for browsers that decline autoplay.
  const films=[...document.querySelectorAll('.lp-work-films video')];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const visibleFilms=new Set(), userPaused=new WeakSet();
  const quiet=()=>reduce.matches||document.documentElement.matches('.rm, .hc, .mono')||navigator.connection?.saveData;
  const pauseFilms=()=>films.forEach(video=>video.pause());
  const playVisible=()=>{
    if(document.hidden||quiet()||document.documentElement.classList.contains('ss-menu-open')){pauseFilms();return;}
    // Bound concurrent decoding on phones; all other posters remain usable.
    let playing=0;
    films.forEach(video=>{
      if(visibleFilms.has(video)&&!userPaused.has(video)&&playing<2){
        playing++;video.muted=true;video.play()?.catch(()=>{});
      }else video.pause();
    });
  };
  films.forEach(video=>{
    video.muted=true;video.defaultMuted=true;video.playsInline=true;
    const button=document.createElement('button');button.type='button';button.className='lp-film-toggle';
    const update=()=>{button.textContent=video.paused?'Play':'Pause';button.setAttribute('aria-label',(video.paused?'Play ':'Pause ')+video.getAttribute('aria-label'));};
    button.addEventListener('click',()=>{
      if(video.paused){
        userPaused.delete(video);
        films.filter(other=>other!==video).forEach(other=>other.pause());
        video.play()?.catch(()=>{video.controls=true;update();});
      }else{userPaused.add(video);video.pause();}
    });
    video.addEventListener('play',update);video.addEventListener('pause',update);update();
    const fallback=document.createElement('a');fallback.href=video.currentSrc||video.src;fallback.textContent='Open video';fallback.className='lp-film-fallback';fallback.hidden=true;
    video.addEventListener('error',()=>{fallback.hidden=false;button.hidden=true;});
    video.parentElement.append(button,fallback);video.parentElement.classList.add('film-enhanced');video.controls=false;
  });
  document.addEventListener('visibilitychange',playVisible);
  addEventListener('pagehide',pauseFilms);addEventListener('pageshow',playVisible);
  reduce.addEventListener('change',playVisible);
  new MutationObserver(playVisible).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  if('IntersectionObserver' in window){
    const filmObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting&&entry.intersectionRatio>=.25)visibleFilms.add(entry.target);else visibleFilms.delete(entry.target);});
      playVisible();
    },{threshold:[0,.25]});
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
