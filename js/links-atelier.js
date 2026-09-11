/* Brand arrival and one-time section reveals; content is visible without motion or JS. */
(() => {
  'use strict';
  const page = document.querySelector('.ss-links .lp');
  if (!page) return;
  const root = document.documentElement, body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const quiet = () => reduce.matches || root.matches('.rm, .hc, .mono');
  const atmosphere = document.createElement('div'); atmosphere.className='lp-atmosphere'; atmosphere.setAttribute('aria-hidden','true'); body.prepend(atmosphere);
  const hero = page.querySelector('.lp-top');
  const stars = document.createElement('div'); stars.className='lp-hero-stars'; stars.setAttribute('aria-hidden','true'); stars.innerHTML='<span>✦</span><span>✦</span>'; hero.append(stars);
  hero.querySelectorAll('.lp-brand-mark path').forEach(path => path.setAttribute('pathLength','1'));
  page.querySelectorAll('.lp-sec-h,.lp-group-h').forEach((heading,index) => heading.dataset.chapter=String(index+1).padStart(2,'0'));
  let arrived = false;
  try { arrived = sessionStorage.getItem('ss-links-arrived') === '1'; } catch (_) {}
  if (!quiet() && !location.hash && !arrived) {
    body.classList.add('lp-arrival-ready');
    try { sessionStorage.setItem('ss-links-arrived','1'); } catch (_) {}
  }
  const animations = new Set();
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(({target,isIntersecting}) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        if (quiet() || typeof target.animate !== 'function') return;
        const animation = target.animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:600,easing:'cubic-bezier(.22,1,.36,1)',delay:0});
        animations.add(animation); animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
      });
    },{threshold:.06,rootMargin:'0px 0px -24px 0px'});
    page.querySelectorAll('.lp-sample').forEach((element,index) => {
      element.dataset.flowDelay=String((index%3)*70); observer.observe(element);
    });
    const heroObserver = new IntersectionObserver(([entry]) => body.classList.toggle('lp-hero-paused',!entry.isIntersecting),{threshold:0});
    heroObserver.observe(hero);
  }
  function syncMotion() {
    if (!quiet()) return;
    body.classList.remove('lp-arrival-ready');
    animations.forEach(animation=>animation.cancel()); animations.clear();
  }
  reduce.addEventListener('change',syncMotion);
  new MutationObserver(syncMotion).observe(root,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',() => {
    body.classList.toggle('lp-ambient-paused',document.hidden);
    if (document.hidden) body.classList.add('lp-hero-paused');
    else { const r=hero.getBoundingClientRect(); body.classList.toggle('lp-hero-paused',r.bottom<0||r.top>innerHeight); }
  });
})();
