/* The hero's light for surfaces outside the hero: the shared menu and the fashion directory.
   Builds an orb, a drift of bokeh and a silver orbit (styled in css/beacon.css), aims the orb at
   the words it belongs to, and lets light follow the hand. Decorative only: aria-hidden, no clicks. */
(() => {
  'use strict';
  if (window.SS_BEACON) return;
  const doc = document;
  //            x%  y%   px   tone    blur  alpha   dx   dy   secs  delay
  const DRIFT = {
    menu: [
      [11, 22,  58, 'white',  1.1, .42,   20, -28,  31,  -4],
      [40, 13,  34, 'rose',   1.0, .44,  -14,  24,  27, -11],
      [37, 82,  46, 'ice',    1.2, .40,   22, -20,  35,  -7],
      [ 7, 74,  30, 'peach',  1.0, .46,   16, -32,  29, -15],
      [22, 46, 150, 'lav',    4.5, .20,   32,  26,  46,  -9],
      [62,  5,  92, 'lav',    3.0, .30,  -24,  30,  38, -13],
      [97, 44, 124, 'ice',    3.5, .32,  -32, -24,  44,  -2],
      [80, 96, 156, 'lav',    5.0, .28,   28, -30,  52, -24],
      [90, 16,  42, 'rose',   1.1, .46,  -18,  22,  33,  -6],
      [44, 30,  26, 'white',  0.8, .55,   12,  20,  26, -18],
      [ 4, 44,  70, 'ice',    2.0, .40,   22, -18,  39, -12],
      [ 9, 90,  96, 'rose',   3.0, .34,   26, -22,  43,  -5]
    ],
    head: [
      [ 7, 36,  84, 'lav',    2.5, .46,   26,  20,  41,  -5],
      [86, 24, 110, 'ice',    3.5, .44,  -30,  24,  47,  -3],
      [93, 60,  46, 'rose',   1.2, .46,  -16, -26,  35, -19],
      [14, 74,  40, 'rose',   1.0, .50,   16, -18,  31, -12],
      [29, 20,  30, 'white',  0.9, .60,   18,  20,  27,  -8],
      [72, 66,  36, 'white',  1.0, .50,  -20, -14,  29, -14],
      [58, 13,  24, 'peach',  0.8, .56,   14,  14,  25,  -6]
    ],
    bio: [
      [ 6, 30,  90, 'lav',    2.5, .46,   26,  20,  41,  -5],
      [94, 22, 120, 'ice',    3.5, .44,  -30,  24,  47,  -3],
      [90, 78,  46, 'rose',   1.2, .46,  -16, -26,  35, -19],
      [10, 82,  40, 'rose',   1.0, .50,   16, -18,  31, -12],
      [24, 12,  30, 'white',  0.9, .60,   18,  20,  27,  -8],
      [78, 52,  30, 'peach',  0.8, .56,  -14,  14,  25,  -6]
    ],
    page: [
      [ 4, 28, 180, 'lav',    6.0, .34,   34,  40,  58, -10],
      [96, 18, 130, 'ice',    4.5, .42,  -30,  36,  49, -24],
      [ 2, 78, 110, 'rose',   4.0, .30,   26, -34,  53,  -4],
      [98, 72, 200, 'lav',    7.0, .30,  -36, -30,  63, -31],
      [50, 96, 150, 'ice',    6.0, .26,   40, -24,  57, -17],
      [93, 46,  48, 'white',  1.4, .70,  -18,  30,  37,  -8]
    ]
  };
  const disc = ([x, y, d, c, b, o, dx, dy, t, dl]) =>
    `<i style="--x:${x}%;--y:${y}%;--d:${d}px;--c:var(--sb-${c});--b:${b}px;--o:${o};--dx:${dx}px;--dy:${dy}px;--t:${t}s;--dl:${dl}s"></i>`;

  function scene(kind) {
    const el = doc.createElement('div');
    el.className = 'ss-beacon'; el.dataset.kind = kind; el.setAttribute('aria-hidden', 'true');
    const orb = kind === 'page' ? '' : '<div class="sb-orb"><i class="sb-clouds"></i><i class="sb-film-glow"></i><i class="sb-film"></i></div>';
    const grain = kind === 'page' ? '' : '<i class="sb-grain"></i>';
    el.innerHTML = orb + `<div class="sb-bokeh">${DRIFT[kind].map(disc).join('')}</div>` + grain;
    return el;
  }

  let orbits = 0;
  function orbit() {
    const id = 'sb-silver-' + (++orbits), svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sb-orbit'); svg.setAttribute('viewBox', '0 0 1000 420'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="#c6d0e6"/><stop offset=".4" stop-color="#f7dcf0"/><stop offset=".58" stop-color="#fff"/><stop offset=".74" stop-color="#b6e4ee"/><stop offset="1" stop-color="#d4cff2"/></linearGradient></defs>` +
      `<ellipse class="sb-orbit-line" stroke="url(#${id})" cx="500" cy="210" rx="492" ry="200" pathLength="1000"/><ellipse class="sb-orbit-glint" cx="500" cy="210" rx="492" ry="200" pathLength="1000"/>`;
    return svg;
  }

  /* Centres the orb on the words inside `frame`. Offsets ignore the opening scale, so it never jumps. */
  function aim(el, target, frame) {
    if (!target.offsetParent) return;
    let x = target.offsetWidth / 2, y = target.offsetHeight / 2;
    for (let n = target; n && n !== frame; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    el.style.setProperty('--ox', Math.round(x) + 'px');
    el.style.setProperty('--oy', Math.round(y - frame.scrollTop) + 'px');
    el._sb = { x: x, y: y - frame.scrollTop, w: target.offsetWidth, h: target.offsetHeight };
  }

  /* Light follows the hand: a soft pool under the card, and optionally a halo that travels between cards. */
  function light(host, items, withHalo) {
    let halo = null;
    if (withHalo) {
      halo = doc.createElement('i'); halo.className = 'sb-halo'; halo.setAttribute('aria-hidden', 'true');
      host.prepend(halo);
    }
    const reach = item => {
      if (!halo) return;
      const a = host.getBoundingClientRect(), b = item.getBoundingClientRect();
      halo.style.setProperty('--y', Math.round(b.top - a.top - 16) + 'px');
      halo.style.setProperty('--h', Math.round(b.height + 32) + 'px');
      halo.classList.add('on');
    };
    const rest = () => { if (halo) halo.classList.remove('on'); };
    host.addEventListener('pointerover', e => { const it = e.target.closest(items); if (it) reach(it); });
    host.addEventListener('pointerleave', rest);
    host.addEventListener('focusin', e => { const it = e.target.closest(items); if (it && e.target.matches(':focus-visible')) reach(it); });
    host.addEventListener('focusout', rest);
    host.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const it = e.target.closest(items); if (!it) return;
      const r = it.getBoundingClientRect();
      it.style.setProperty('--mx', Math.round(e.clientX - r.left) + 'px');
      it.style.setProperty('--my', Math.round(e.clientY - r.top) + 'px');
    }, { passive: true });
  }


  /* ---- The hero's butterflies (same wings as js/celestial.js), flying inside the orb's blue ---- */
  const rand = (a, b) => a + Math.random() * (b - a);
  const flyDraw = (ctx, size, fore, hind, yaw) => { SkyWings.pool(ctx, 0, 0, size * .85, '150,172,255', .22); SkyWings.Wings.draw(ctx, size, fore, hind, yaw, 'dark'); };
  /* `active()` says whether the scene is on screen; `tight` is how much of the aimed block the words really fill. */
  function flutter(el, opts) {
    const orb = el.querySelector('.sb-orb'); if (!orb) return;
    const cv = doc.createElement('canvas'); cv.className = 'sb-flies';
    (el.querySelector('.sb-grain') || el.lastChild).before(cv);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const root = doc.documentElement, mq = matchMedia('(prefers-reduced-motion: reduce)');
    const still = () => mq.matches || root.classList.contains('rm');
    const plain = () => root.classList.contains('mono') || root.classList.contains('hc');
    let W = 0, H = 0, DPR = 1, flies = [], on = false, last = 0, geo = null;
    function measure() {
      const a = el._sb; if (!a || !el.clientWidth) return false;
      const pool = getComputedStyle(orb, '::before'), r = orb.offsetWidth / 2;
      const rx = parseFloat(pool.width) / 2 || r * 1.24, ry = parseFloat(pool.height) / 2 || r * 1.24;
      geo = { x: a.x, y: a.y, rx, ry, tw: a.w * opts.tight / 2 + 12, th: a.h / 2 + 6 };
      if (W !== el.clientWidth || H !== el.clientHeight) {
        W = el.clientWidth; H = el.clientHeight; DPR = Math.min(devicePixelRatio || 1, 2.5);
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      }
      return true;
    }
    function seed() {
      const small = W < 761, n = small ? Math.min(3, opts.count) : opts.count;
      flies = [];
      for (let i = 0; i < n; i++) {
        const a = rand(0, 6.283), e = rand(.42, .74), size = small ? rand(26, 36) : i < 2 ? rand(46, 60) : rand(30, 42);
        flies.push({ ex: Math.cos(a) * e, ey: Math.sin(a) * e, a: 0, size, ph: rand(0, 7), v: rand(5, 10), w: rand(1.7, 2.8), yaw: rand(.18, .5) * (Math.random() < .5 ? -1 : 1), hd: 0 });
      }
    }
    function draw(t, dt) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      if (plain() || !geo) return;
      const calm = still();
      flies.forEach(b => {
        let x = geo.x + b.ex * geo.rx, y = geo.y + b.ey * geo.ry;
        if (!calm && dt) {
          const vx = Math.sin(t * .31 + b.ph) * b.v * 1.1 + Math.cos(t * .13 + b.ph * 2) * b.v * .6, vy = -b.v * (.55 + .45 * Math.sin(t * .23 + b.ph * 1.7));
          x += vx * dt; y += vy * dt; b.hd += (Math.atan2(vx, -vy) * .65 - b.hd) * Math.min(1, dt * 1.3);
          b.ex = (x - geo.x) / geo.rx; b.ey = (y - geo.y) / geo.ry;
          if (Math.hypot(b.ex, b.ey) > .84) { const a = rand(.25, 2.9); b.ex = Math.cos(a) * .8; b.ey = Math.sin(a) * .8; b.a = 0; x = geo.x + b.ex * geo.rx; y = geo.y + b.ey * geo.ry; }   // leaves the blue, returns from below
        }
        const behind = Math.abs(x - geo.x) < geo.tw && Math.abs(y - geo.y) < geo.th;   // they dim behind the words
        const want = (behind ? .1 : 1) * Math.max(0, Math.min(1, (.8 - Math.hypot(b.ex, b.ey)) / .2));
        b.a += (want - b.a) * (calm ? 1 : Math.min(1, dt * 2.4));
        if (b.a <= .01) return;
        const glide = .6 + .4 * Math.sin(t * .37 + b.ph * 3), ph = t * b.w + b.ph;
        ctx.globalAlpha = b.a; ctx.save(); ctx.translate(x, y + Math.cos(ph) * b.size * .04); ctx.rotate(b.hd);
        flyDraw(ctx, b.size, .24 + glide * (.5 + .5 * Math.sin(ph)), .24 + .9 * glide * (.5 + .5 * Math.sin(ph - .45)), b.yaw * Math.sin(t * .19 + b.ph)); ctx.restore();
      });
      ctx.globalAlpha = 1;
    }
    function frame(now) {
      if (!on) return;
      draw(now / 1000, Math.min(.05, (now - last) / 1000)); last = now;
      if (!doc.hidden && !still() && opts.active()) requestAnimationFrame(frame); else on = false;
    }
    function wake() {
      const w0 = W; if (!measure()) return;
      if (!flies.length || w0 !== W) seed();
      if (still()) { draw(20, 0); return; }
      if (!on && !doc.hidden && opts.active()) { on = true; last = performance.now(); requestAnimationFrame(frame); }
    }
    doc.addEventListener('visibilitychange', wake);
    new MutationObserver(wake).observe(root, { attributes: true, attributeFilter: ['class'] });
    return wake;
  }

  window.SS_BEACON = { scene, orbit, aim, light, flutter };

  /* The fashion directory mounts itself: the light runs from the top of the page and dissolves into the wash. */
  const top = doc.querySelector('.fd-topbar'), mast = doc.querySelector('.masthead');
  if (!top || !mast) return;
  const sky = doc.createElement('div'), head = scene('head');
  sky.className = 'fd-sky';
  top.before(sky);
  sky.append(head, top, mast);
  doc.body.prepend(scene('page'));
  doc.body.classList.add('fd-beacon');
    const words = mast.querySelector('.wrap');
  words.prepend(orbit());
  let seen = true, fly = null;
  const place = () => { aim(head, words, sky); head.style.setProperty('--sb-text-h', words.offsetHeight + 'px'); if (fly) fly(); };
  fly = flutter(head, { count: 7, tight: .86, active: () => seen });
  new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && fly) fly(); }).observe(sky);
  place();
  new ResizeObserver(place).observe(sky);
  doc.addEventListener('ss:lang', place);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(place);
  light(doc.body, '.ff-tile, #main article.card', false);
})();
