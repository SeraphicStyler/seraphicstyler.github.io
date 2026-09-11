/* Disclosure deep links and a stable, thumb-reachable next step. */
(() => {
  const body=document.body;
  if(!body.classList.contains('ss-links'))return;
  // Native players work without enhancement; only one clip plays at a time.
  const films=[...document.querySelectorAll('.lp-work-films video')];
  const pauseFilms=()=>films.forEach(video=>video.pause());
  films.forEach(video=>video.addEventListener('play',()=>films.forEach(other=>{if(other!==video)other.pause();})));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFilms();});
  addEventListener('pagehide',pauseFilms);
  if('IntersectionObserver' in window){
    const filmObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}));
    films.forEach(video=>filmObserver.observe(video));
  }
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
