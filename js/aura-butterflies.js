/* Butterflies that land on the page's real edges and fan slowly so the detail can be seen.
   Wings come from js/wings.js. Decorative only: takes no clicks, stops when the tab is hidden, stays still for reduced motion. */
(function () {
  'use strict';
  var bio = !!document.querySelector('.bio');
  var root = document.documentElement;
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var still = function () { return motion.matches || root.classList.contains('rm') || !!(navigator.connection && navigator.connection.saveData); };
  var plain = function () { return root.classList.contains('hc') || matchMedia('(forced-colors: active)').matches; };
  var theme = function () { return root.classList.contains('mono') ? 'mono' : root.classList.contains('dark') ? 'dark' : 'light'; };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };

  var Sky = window.SkyWings;
  if (!Sky) return;

  /* ---- Where they can land ---- */
  var perches = [];
  function addPerch(selector, fx, cue) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) { perches.push({ el: el, fx: fx, by: null, cue: cue || null }); });
  }
  var phone = innerWidth < 761;
  if (bio) {
    /* on each row's hairline, out past the text; the row where the bunnies sit is left to them */
    var bunnyRow = document.querySelectorAll('.way')[phone ? 0 : 2];
    addPerch('.way', phone ? .93 : .88);
    perches = perches.filter(function (p) { return p.el !== bunnyRow; });
    addPerch('.bio-work .bio-films:not(.bio-archive *) .lp-film', .3);
  } else {
    addPerch('section:not(#hero) > .wrap', .07); addPerch('section:not(#hero) > .wrap', .93);
    addPerch('.sd-door', .84); addPerch('.opp-section', .92); addPerch('.opp-path', .88);
  }
  if (!perches.length) return;
  function spot(p) {
    var r = p.el.getBoundingClientRect();
    return { x: r.left + scrollX + r.width * p.fx, y: r.top + scrollY, ok: r.width > 0 };
  }

  var sizes = bio ? (phone ? [56, 42, 46, 38] : [76, 54, 62, 44, 50, 40]) : (phone ? [48, 38, 42] : [66, 48, 56, 42, 50]);
  var air = document.createElement('canvas');
  air.className = 'aura-bf-layer'; air.setAttribute('aria-hidden', 'true');
  air.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100lvh;z-index:5;pointer-events:none';
  document.body.append(air);
  var ctx = air.getContext('2d');
  if (!ctx) return;

  var W = 0, H = 0, DPR = 1, flies = [], painted = null, last = 0, raf = 0, startAt = performance.now() / 1000;
  function fit() {
    var w = root.clientWidth, h = air.clientHeight || innerHeight;
    if (w === W && h === H) return false;
    W = w; H = h; DPR = Math.min(window.devicePixelRatio || 1, 3);
    air.width = Math.round(W * DPR); air.height = Math.round(H * DPR);
    return true;
  }
  function paintAll() { painted = theme(); }
  function seat(b, p) { if (b.perch) b.perch.by = null; b.perch = p; p.by = b; }
  function inView(p) {
    var r = p.el.getBoundingClientRect();
    return r.width > 0 && r.top > 40 && r.top < H - 30;
  }
  function land(b) {
    b.state = 'rest'; b.rest = rand(16, 36); b.called = false; b.vx = b.vy = 0;
    var side = b.perch.fx > .5 ? -1 : 1;     // face in toward the page
    b.restYaw = side * rand(.42, .6); b.restRot = side * rand(.12, .3);
  }
  function fly(b, target, called) {
    seat(b, target); b.state = 'fly'; b.called = !!called; b.speed = rand(120, 170);
  }
  function freePerch(b) {
    var open = perches.filter(function (p) { return !p.by && p !== b.perch && spot(p).ok; });
    var near = open.filter(inView);
    var pool = near.length ? near : open;
    return pool.length ? pool[Math.random() * pool.length | 0] : null;
  }
  function depart(b) {
    var p = freePerch(b);
    if (p) fly(b, p); else b.rest = rand(6, 14);
  }
  /* on a long page, if nobody is on screen, one flies in from the side */
  var nextCheck = 4;
  function bringIn() {
    var shown = flies.filter(function (b) { var y = b.y - scrollY; return y > -40 && y < H + 40; }).length;
    if (shown >= (phone ? 1 : 2)) return;
    var open = perches.filter(function (p) { return !p.by && inView(p); }), b = flies.filter(function (f) { var y = f.y - scrollY; return !f.called && (y < -40 || y > H + 40); })[0];
    if (!open.length || !b) return;
    var left = Math.random() < .5;
    b.x = (left ? -60 : W + 60) + scrollX; b.y = scrollY + rand(.15, .7) * H; b.wait = 0; b.vx = b.vy = 0;
    fly(b, open[Math.random() * open.length | 0]);
  }
  function populate() {
    flies = sizes.map(function (size, i) {
      var p = perches[Math.floor((i + .5) * perches.length / sizes.length)];
      var b = { size: size, ph: rand(0, 7), beat: rand(5.2, 6.6), yaw: rand(.18, .46) * (Math.random() < .5 ? -1 : 1), flap: rand(0, 7), hd: 0, k: 1, vx: 0, vy: 0, wait: 0, x: 0, y: 0, perch: null, state: 'fly', rest: 0, restYaw: .5, restRot: 0, called: false, speed: 140 };
      seat(b, p);
      var s = spot(p);
      if (still() || !inView(p)) { b.x = s.x; b.y = s.y; b.k = 0; land(b); }
      else {   // those already on screen arrive from just past the edge, one after another
        var left = s.x < W / 2;
        b.x = left ? -60 : W + 60; b.y = s.y - rand(60, 170); b.wait = 1.3 + i * .7;
      }
      return b;
    });
    paintAll();
  }

  /* ---- Each frame ---- */
  function step(b, t, dt) {
    var s = spot(b.perch), lift = b.size * .19;
    if (b.state === 'rest') {
      b.x = s.x; b.y = s.y - lift;
      b.k += (0 - b.k) * Math.min(1, dt * 3.4);
      b.hd += (b.restRot - b.hd) * Math.min(1, dt * 3.4);
      b.rest -= dt;
      if (b.rest <= 0 && !b.called) depart(b);
      return;
    }
    if (b.wait > 0) { b.wait -= dt; return; }
    var dx = s.x - b.x, dy = s.y - lift - b.y, d = Math.hypot(dx, dy) || 1;
    var sp = Math.min(b.speed, 24 + d * 2.1), wob = Math.min(1, d / 90) * Math.sin(t * 2.3 + b.ph) * .78;
    var ax = dx / d - dy / d * wob, ay = dy / d + dx / d * wob, ease = Math.min(1, dt * 3.2);
    b.vx += (ax * sp - b.vx) * ease; b.vy += (ay * sp - b.vy) * ease;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.flap += dt * b.beat;
    b.k += (1 - b.k) * Math.min(1, dt * 4);
    b.hd += (Math.atan2(b.vx, -b.vy) * .7 - b.hd) * Math.min(1, dt * 3);
    if (d < 3.5) land(b);
  }
  function drawOne(b, t) {
    if (b.wait > 0) return;
    var y = b.y - scrollY, x = b.x - scrollX;
    if (y < -b.size || y > H + b.size || x < -b.size || x > W + b.size) return;
    var glide = .6 + .4 * Math.sin(t * .37 + b.ph * 3), f = b.flap;
    var flyF = .24 + glide * (.5 + .5 * Math.sin(f)), flyH = .24 + .9 * glide * (.5 + .5 * Math.sin(f - .45));
    var fan = t * .62 + b.ph, restF = .76 + .3 * Math.sin(fan), restH = .73 + .27 * Math.sin(fan - .5);
    var fore = lerp(restF, flyF, b.k), hind = lerp(restH, flyH, b.k), yaw = lerp(b.restYaw, b.yaw * Math.sin(t * .19 + b.ph), b.k);
    if (painted !== 'mono') Sky.pool(ctx, x, y, b.size * .85, painted === 'dark' ? '150,172,255' : '214,202,250', painted === 'dark' ? .22 : .3);
    ctx.save();
    ctx.translate(x, y + Math.cos(f) * b.size * .04 * b.k);
    ctx.rotate(b.hd);
    Sky.Wings.draw(ctx, b.size, fore, hind, yaw, painted);
    ctx.restore();
  }
  function frame(now) {
    raf = 0;
    if (document.hidden || plain()) return;
    var t = now / 1000 - startAt, dt = Math.min(.05, Math.max(0, t - last)); last = t;
    var quiet = still();
    if (!quiet && t > nextCheck) { nextCheck = t + 1.6; bringIn(); }
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    flies.forEach(function (b) {
      if (quiet) { var s = spot(b.perch); b.x = s.x; b.y = s.y - b.size * .19; b.k = 0; b.wait = 0; b.hd = b.restRot; }
      else step(b, t, dt);
      drawOne(b, quiet ? 0 : t);
    });
    if (!quiet) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && !document.hidden) raf = requestAnimationFrame(frame); }

  /* ---- Staying in step with the page ---- */
  function sync() {
    air.hidden = plain();
    if (plain()) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, air.width, air.height); return; }
    var resized = fit();
    if (resized || painted !== theme()) paintAll();
    wake();
  }
  fit(); populate(); sync();
  new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
  addEventListener('resize', sync);
  document.addEventListener('visibilitychange', wake);
  motion.addEventListener('change', sync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(wake);
  addEventListener('scroll', function () { if (still()) wake(); }, { passive: true });

  /* hover a row and the closest butterfly comes to it */
  function callTo(el) {
    if (still()) return;
    var p = perches.filter(function (q) { return q.el === el; })[0];
    if (!p || p.by) return;
    var s = spot(p), best = null, far = 1e9;
    flies.forEach(function (b) { if (b.wait > 0) return; var d = Math.hypot(b.x - s.x, b.y - s.y); if (d < far) { far = d; best = b; } });
    if (best) fly(best, p, true);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.way'), function (a) {
    a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') callTo(a); });
    a.addEventListener('focus', function () { callTo(a); });
  });
  /* come too close to one that is resting and it lifts off */
  function shy(x, y, reach) {
    if (still()) return;
    var px = x + scrollX, py = y + scrollY;
    flies.forEach(function (b) { if (b.state === 'rest' && !b.called && b.k < .1 && Math.hypot(b.x - px, b.y - py) < reach) depart(b); });
  }
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') shy(e.clientX, e.clientY, 52); }, { passive: true });
  addEventListener('pointerdown', function (e) { shy(e.clientX, e.clientY, 84); }, { passive: true });

  /* the footer: a rainbow by day, an aurora by night */
  var foot = document.getElementById('bioFootSky');
  if (foot && window.SkyScenes) {
    var footScene = window.SkyScenes.mount(foot, { kind: 'foot', theme: theme, still: still });
    document.addEventListener('ss:themechange', function () { footScene.refresh(); });
  }
})();
