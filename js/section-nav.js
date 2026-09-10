/* A labeled page outline: persistent on desktop, collapsible on smaller screens. */
(() => {
  'use strict';
  const home = !!document.getElementById('hero');
  const links = !!document.querySelector('.lp');
  const paths = home ? [
    ['hero','Introduction'],['service-story','Service guide'],['about','About'],['services','Services'],['lane-sourcing','Sourcing'],
    ['lane-styling','Styling'],['custom-wardrobe','Custom Wardrobe'],['process','How it works'],
    ['directory','Directory'],['lookbook','Lookbook'],['gift','Gift styling'],['bulk','Group orders'],['boutique','Boutiques'],['contact','Contact']
  ] : links ? [
    ['main','Introduction'],['lp-guide','Service guide'],['service-comparison','Choose a service'],['lp-proof','Why trust us'],['lp-how','How it works'],['lp-sourcing','Sourcing'],
    ['lp-styling','Styling'],['custom-wardrobe','Custom Wardrobe'],['lp-gift','Gift styling'],['lp-browse','Explore'],['lp-free','Free style tools'],['lp-rules','Terms']
  ] : [
    ['service-overview','Overview'],['sourcing','Sourcing'],['trace','The Trace'],['styling','Styling'],
    ['prices','Styling prices'],['buying-fees','Buying fees'],['when-work-begins','When work begins'],['service-recommendation','Find your service']
  ];
  const sections = paths.map(([id,label]) => ({id,label,el:document.getElementById(id)})).filter(s => s.el);
  if (!sections.length) return;
  sections.sort((a,b) => a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  const outline = document.createElement('details'); outline.className = 'ss-section-nav';
  const summary = document.createElement('summary');
  summary.innerHTML = '<span class="ss-section-caption">On this page</span><span class="ss-section-current"></span><span class="ss-section-toggle" aria-hidden="true">⌄</span>';
  const nav = document.createElement('nav'); nav.setAttribute('aria-label','On this page');
  const currentLabel = summary.querySelector('.ss-section-current');
  const wide = matchMedia('(min-width:1280px)');
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.classList.contains('rm');
  sections.forEach(s => {
    const a = document.createElement('a'); a.href = '#' + s.id; a.textContent = s.label;
    a.addEventListener('click', e => {
      e.preventDefault();
      for (let p=s.el; p; p=p.parentElement) if(p.tagName === 'DETAILS') p.open=true;
      if (!wide.matches) outline.open = false;
      s.el.setAttribute('tabindex','-1'); s.el.focus({preventScroll:true});
      s.el.scrollIntoView({behavior:reduced() ? 'instant' : 'smooth',block:'start'});
      history.pushState(null,'','#' + s.id);
      setCurrent(s);
    });
    s.link = a; nav.append(a);
  });
  outline.append(summary,nav); document.body.append(outline); document.body.classList.add('ss-with-sections');
  const resize = () => { outline.open = wide.matches; };
  resize(); wide.addEventListener('change',resize);
  let active;
  function setCurrent(section) {
    if (active === section) return;
    active = section; currentLabel.textContent = section.label;
    sections.forEach(s => { if(s === section) s.link.setAttribute('aria-current','location'); else s.link.removeAttribute('aria-current'); });
  }
  function mark() {
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    let best = sections[0], bestTop = -Infinity;
    sections.forEach(s => {
      const top = s.el.getBoundingClientRect().top;
      const margin = parseFloat(getComputedStyle(s.el).scrollMarginTop) || 0;
      const line = Math.max(Math.min(innerHeight * .28,190),padding + margin + 8);
      if (top > line) return;
      if (top > bestTop + 2) { best=s; bestTop=top; }
      else if (Math.abs(top-bestTop)<=2 && active===s) best=s;
    });
    setCurrent(best);
  }
  let ticking=false;
  addEventListener('scroll',() => { if(ticking)return; ticking=true; requestAnimationFrame(() => {mark();ticking=false;}); },{passive:true});
  addEventListener('resize',mark,{passive:true});
  addEventListener('load',mark,{once:true}); mark();
  outline.addEventListener('keydown',e => { if(e.key==='Escape' && !wide.matches) {outline.open=false;summary.focus();} });
  document.addEventListener('click',e => {if(!wide.matches && outline.open && !outline.contains(e.target))outline.open=false;});
})();
