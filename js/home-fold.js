/* Homepage folds: the long versions of each section stay on the page, closed (css/home-fold.css).
   1. A link that points inside a closed fold opens it first, on tap and on arrival (seraphicstyler.com/#btqEst).
   2. Every fold gets a quiet "Close" line at its end that returns you to where it began.
   3. On smaller screens the page outline steps away while you read down and returns when you scroll up. */
(() => {
  'use strict';
  const reduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches || document.documentElement.classList.contains('rm');

  /* Go to a part that has just been opened. A fold takes a moment to unfold, so travel once it has begun,
     then check once more when it has finished and settle exactly on the part asked for. */
  function land(el) {
    const near = () => { const t = el.getBoundingClientRect().top; return t > -30 && t < innerHeight * .5; };
    setTimeout(() => el.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' }), 80);
    setTimeout(() => { if (!near()) el.scrollIntoView({ behavior: 'instant', block: 'start' }); }, 1500);
  }

  /* 1 · open whatever a link points into */
  function reveal(id, scroll) {
    if (!id) return false;
    let el;
    try { el = document.getElementById(decodeURIComponent(id)); } catch (_) { el = document.getElementById(id); }
    if (!el) return false;
    let opened = false;
    for (let p = el.tagName === 'DETAILS' ? el : el.parentElement; p; p = p.parentElement) {
      if (p.tagName === 'DETAILS' && !p.open) { p.open = true; opened = true; }
    }
    if (opened && scroll) land(el);
    return opened;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    reveal(a.getAttribute('href').slice(1), true);
  }, true);
  /* Arriving from outside (a link in a message, a redirect page): some browsers open the fold themselves
     but cannot yet tell where the part inside it will sit, so they stay at the top. Whoever opened it,
     if the part asked for lives in a fold, go to it. */
  function arrive() {
    const id = location.hash.slice(1);
    if (!id) return;
    reveal(id, false);
    let el; try { el = document.getElementById(decodeURIComponent(id)); } catch (_) { el = null; }
    if (el && el.closest('details.ss-fold')) land(el);
  }
  addEventListener('hashchange', arrive);
  if (location.hash.length > 1) {
    if (document.readyState === 'complete') arrive(); else addEventListener('load', arrive, { once: true });
  }

  /* 2 · a way out at the end of every fold */
  document.querySelectorAll('details.ss-fold').forEach(fold => {
    const body = fold.querySelector('.ss-fold-body');
    if (!body) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ss-fold-close'; b.textContent = 'Close';
    b.addEventListener('click', () => {
      const summary = fold.querySelector('summary');
      fold.open = false;
      summary.focus({ preventScroll: true });
      summary.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    body.append(b);
  });

  /* 3 · the outline pill steps aside while reading down */
  let last = scrollY, ticking = false, nav;
  addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      nav = nav || document.querySelector('.ss-section-nav');
      const y = scrollY;
      if (nav) {
        if (y > last + 8 && y > 400) nav.classList.add('ss-tucked');
        else if (y < last - 8 || y <= 400) nav.classList.remove('ss-tucked');
      }
      last = y;
    });
  }, { passive: true });
})();
