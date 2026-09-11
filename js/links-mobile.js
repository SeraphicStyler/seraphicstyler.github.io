/* Disclosure deep links and a stable, thumb-reachable next step. */
(() => {
  const body=document.body;
  if(!body.classList.contains('ss-links'))return;
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
