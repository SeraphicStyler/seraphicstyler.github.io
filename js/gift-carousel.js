/* Seraphic Styler — gift-tier coverflow.
   Progressive enhancement over the static .gift-grid-4: the four gift cards
   become a coverflow carousel (center card full-size, neighbours faded and
   peeking) with arrows, dots, arrow keys, swipe and click-to-center. The
   original card nodes are MOVED, never cloned or rewritten, so gift-quiz.js
   and compare.js (which hold live references matched via
   '.gift-grid-4 .gift-card' + data-usd) and the #giftCurrency rewriter keep
   working untouched. Runs at parse time, before main.js's DOMContentLoaded
   reveal cascade, so the grid's .reveal moves to the carousel shell and no
   swing transforms ever land on the cards. Movement is a plain CSS
   transition — the global reduced-motion rules (media query + html.rm) turn
   it into an instant jump on their own; nothing here waits on transitionend. */
(function () {
  'use strict';

  var grid = document.querySelector('.gift-grid-4');
  if (!grid) return;
  var cards = Array.prototype.filter.call(grid.children, function (el) {
    return el.classList.contains('gift-card');
  });
  if (cards.length !== 4) return; // leave the static grid as the fallback

  var L = {
    en: { prev: 'Previous tier', next: 'Next tier', show: 'Show {tier}', pos: '{tier}, {n} of 4' },
    vi: { prev: 'Gói trước', next: 'Gói sau', show: 'Xem {tier}', pos: '{tier}, {n} trên 4' }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }

  if (!document.getElementById('gcar-css')) {
    var css = document.createElement('style');
    css.id = 'gcar-css';
    css.textContent =
      '.gcar{position:relative;margin-top:0.5rem}' +
      '.gcar-viewport{overflow:hidden;position:relative;touch-action:pan-y}' +
      '.gift-grid-4.gcar-on{display:block;position:relative}' +
      '.gcar-on .gift-card{position:absolute;left:50%;top:18px;width:min(340px,78vw);margin:0;' +
        'transition:border-color 0.4s ease}' +
      '.gcar.gcar-ready .gcar-on .gift-card{transition:transform 0.45s cubic-bezier(0.33,1,0.68,1),opacity 0.45s ease,border-color 0.4s ease}' +
      '.gcar-on .gift-card:not(.gcar-active){cursor:pointer}' +
      '.gcar-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:20;width:44px;height:44px;' +
        'border-radius:50%;border:1px solid var(--surface-border);background:var(--surface);' +
        'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);color:var(--text-primary);' +
        'font-size:1.3rem;line-height:1;cursor:pointer;display:grid;place-items:center;' +
        'transition:border-color 0.2s ease,opacity 0.2s ease}' +
      '.gcar-arrow:hover{border-color:var(--text-primary)}' +
      '.gcar-arrow[disabled]{opacity:0.25;cursor:default;pointer-events:none}' +
      '.gcar-prev{left:clamp(0.1rem,1.5vw,1rem)}.gcar-next{right:clamp(0.1rem,1.5vw,1rem)}' +
      '.gcar-dots{display:flex;justify-content:center;gap:0.55rem;margin-top:1.1rem}' +
      '.gcar-dot{width:10px;height:10px;padding:0;border-radius:50%;border:none;cursor:pointer;' +
        'background:var(--surface-border);transition:background 0.25s ease,transform 0.25s ease}' +
      '.gcar-dot[aria-current="true"]{background:var(--accent);transform:scale(1.25)}';
    document.head.appendChild(css);
  }

  /* Build the shell where the grid stood, then move the grid inside it. */
  var shell = document.createElement('div');
  shell.className = 'gcar' + (grid.classList.contains('reveal') ? ' reveal' : '');
  shell.setAttribute('role', 'group');
  shell.setAttribute('aria-roledescription', 'carousel');
  shell.setAttribute('aria-label', 'Gift tiers');
  grid.classList.remove('reveal');
  grid.parentNode.insertBefore(shell, grid);

  var viewport = document.createElement('div');
  viewport.className = 'gcar-viewport';
  viewport.appendChild(grid);
  grid.classList.add('gcar-on');
  shell.appendChild(viewport);

  var prevBtn = document.createElement('button');
  prevBtn.type = 'button'; prevBtn.className = 'gcar-arrow gcar-prev'; prevBtn.textContent = '‹';
  var nextBtn = document.createElement('button');
  nextBtn.type = 'button'; nextBtn.className = 'gcar-arrow gcar-next'; nextBtn.textContent = '›';
  viewport.appendChild(prevBtn); viewport.appendChild(nextBtn);

  var dots = document.createElement('div');
  dots.className = 'gcar-dots';
  var dotBtns = cards.map(function (c, i) {
    var d = document.createElement('button');
    d.type = 'button'; d.className = 'gcar-dot';
    d.addEventListener('click', function () { goTo(i); });
    dots.appendChild(d);
    return d;
  });
  shell.appendChild(dots);

  var live = document.createElement('p');
  live.className = 'sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  shell.appendChild(live);

  function cardName(c) { var h = c.querySelector('h3'); return h ? h.textContent.trim() : ''; }
  function cardUsd(c) { var p = c.querySelector('.gift-price'); return p ? p.getAttribute('data-usd') : ''; }

  var active = Math.max(0, cards.indexOf(grid.querySelector('.gift-card.featured')));

  function relabel() {
    prevBtn.setAttribute('aria-label', t('prev'));
    nextBtn.setAttribute('aria-label', t('next'));
    dotBtns.forEach(function (d, i) {
      d.setAttribute('aria-label', t('show').replace('{tier}', cardName(cards[i]) + ' — $' + cardUsd(cards[i])));
    });
  }

  var FOCUSABLE = 'a,button,select,input,textarea,[tabindex]';
  function apply(announce) {
    var vw = viewport.clientWidth || 1;
    var cw = Math.min(340, vw * 0.78);
    /* Step between card centers: full separation on wide screens, an edge
       peek on small ones. */
    var step = vw >= 900 ? Math.min(cw * 1.08, vw * 0.30) : vw * 0.34;
    cards.forEach(function (card, i) {
      var off = i - active;
      var abs = Math.abs(off);
      card.style.transform = 'translateX(calc(-50% + ' + Math.round(off * step) + 'px)) scale(' + (1 - 0.12 * abs) + ')';
      card.style.opacity = abs === 0 ? '1' : abs === 1 ? '0.55' : '0.15';
      card.style.zIndex = String(10 - abs);
      card.classList.toggle('gcar-active', off === 0);
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (i + 1) + ' of 4');
      if (off === 0) {
        card.removeAttribute('aria-hidden');
        card.querySelectorAll(FOCUSABLE).forEach(function (el) { el.removeAttribute('tabindex'); });
      } else {
        if (!card.contains(document.activeElement)) card.setAttribute('aria-hidden', 'true');
        card.querySelectorAll(FOCUSABLE).forEach(function (el) { el.setAttribute('tabindex', '-1'); });
      }
    });
    prevBtn.disabled = active === 0;
    nextBtn.disabled = active === cards.length - 1;
    dotBtns.forEach(function (d, i) { d.setAttribute('aria-current', i === active ? 'true' : 'false'); });
    if (announce) {
      live.textContent = t('pos').replace('{tier}', cardName(cards[active])).replace('{n}', active + 1);
    }
  }

  function measure() {
    var h = 0;
    cards.forEach(function (c) { h = Math.max(h, c.offsetHeight); });
    if (h) viewport.style.height = (h + 26) + 'px'; // 18px tag headroom + breathing room
  }

  function goTo(i, silent) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    if (i === active) return;
    active = i;
    apply(!silent);
  }

  prevBtn.addEventListener('click', function () { goTo(active - 1); });
  nextBtn.addEventListener('click', function () { goTo(active + 1); });

  shell.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    var back = e.key === (document.documentElement.getAttribute('dir') === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
    goTo(active + (back ? -1 : 1));
    e.preventDefault();
  });

  /* A tap on a side card centers it instead of following its links;
     the centered card's links (Stripe, style profile) work as normal. */
  grid.addEventListener('click', function (e) {
    var card = e.target.closest ? e.target.closest('.gift-card') : null;
    if (!card || !grid.contains(card)) return;
    var i = cards.indexOf(card);
    if (i !== -1 && i !== active) {
      e.preventDefault();
      e.stopPropagation();
      goTo(i);
    }
  });

  /* Keyboard/tooling focus follows into a card → center it. Also centers the
     tier gift-quiz.js suggests via its "Read the tier ↑" card.focus(). */
  grid.addEventListener('focusin', function (e) {
    var card = e.target.closest ? e.target.closest('.gift-card') : null;
    if (card) { var i = cards.indexOf(card); if (i !== -1) goTo(i, true); }
  });

  /* Swipe — pointer events; touch-action:pan-y keeps vertical scroll native. */
  var px = 0, py = 0, tracking = false, swiped = false;
  viewport.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    px = e.clientX; py = e.clientY; tracking = true; swiped = false;
  });
  viewport.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - px, dy = e.clientY - py;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      goTo(active + (dx < 0 ? 1 : -1));
    }
  });
  viewport.addEventListener('pointercancel', function () { tracking = false; });
  viewport.addEventListener('click', function (e) {
    if (swiped) { swiped = false; e.preventDefault(); e.stopPropagation(); }
  }, true);

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { measure(); apply(false); });
    cards.forEach(function (c) { ro.observe(c); });
    ro.observe(viewport);
  } else {
    window.addEventListener('resize', function () { measure(); apply(false); });
  }

  /* Language switch: i18n.js rewrites card innerHTML in place — re-stamp
     tabindex on rebuilt links, re-measure heights, refresh labels. */
  document.addEventListener('ss:lang', function () { relabel(); measure(); apply(false); });

  relabel();
  measure();
  apply(false);
  requestAnimationFrame(function () { shell.classList.add('gcar-ready'); });
})();
