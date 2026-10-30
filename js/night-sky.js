/* Night sky — the dark theme's canvas starfield, drawn to real sky physics and
   kept quiet: fine stars, a slow twinkle, the Milky Way as a faint haze.
   · Star counts follow the magnitude law (≈3× more stars per fainter magnitude),
     so the sky is mostly faint dust with a few bright anchors.
   · Colour is blackbody temperature (M-red 3,300 K → B-blue 22,000 K); faint
     stars read white because night vision can't see colour (Purkinje shift).
   · Scintillation and extinction grow with airmass: stars near the bottom
     (low on the horizon) twinkle a little more, dim and redden. Planets never twinkle.
   · The sky turns at the true sidereal rate (15°/hour) about an off-screen pole:
     invisible frame to frame, noticeable after a few minutes.
   · Scrolling is the observer moving: near stars glide slightly more than far
     ones (parallax); the Milky Way, kiloparsecs away, does not shift at all.
   · A meteor every one to two minutes: a thin streak under a second long,
     pointing away from its radiant, tinted by the metals it burns.
   Dark theme only; off under mono and high contrast; static under reduced motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqForced = window.matchMedia('(forced-colors: active)');

  /* ---- Tuning ---- */
  var DENSITY = 1 / 6500;        /* stars per CSS px² of viewport */
  var MAX_STARS = 300;
  var M_BRIGHT = -0.6, M_FAINT = 6.5;  /* naked-eye magnitude range */
  var PARALLAX = 0.14;           /* scroll shift of the nearest stars */
  var SIDEREAL = 2 * Math.PI / 86164;  /* rad/s */
  var EXTINCTION = 0.2;          /* mag per airmass (V band, a clear site) */
  var TWINKLE = 0.035;           /* scintillation depth at the zenith */
  var BAND_ALPHA = 0.38;         /* Milky Way: a haze, not a photograph */
  var METEOR_FIRST = [20, 45], METEOR_GAP = [60, 120];  /* seconds */

  var canvas, ctx, band = null, sprites = {};
  var stars = [], planet = null, meteor = null, nextMeteor = null;
  var W = 1, H = 1, M = 40, dpr = 1, pole = { x: 0, y: 0 };
  var t0 = 0, raf = null;

  function active() {
    return root.classList.contains('dark') && !root.classList.contains('mono')
      && !root.classList.contains('hc') && !mqForced.matches;
  }
  function still() { return mqMotion.matches || root.classList.contains('rm'); }
  function between(r) { return r[0] + Math.random() * (r[1] - r[0]); }

  /* Blackbody colour (Helland's fit to the CIE curve), K → [r,g,b]. */
  function kelvin(T) {
    var t = T / 100, r, g, b;
    r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
    b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
    return [r, g, b].map(function (v) { return Math.max(0, Math.min(255, v)); });
  }
  /* Spectral mix of the naked-eye sky: K giants and A/B stars are over-represented
     because they are luminous enough to see from far away. */
  var CLASSES = [[3300, .07], [4300, .22], [5200, .15], [5900, .13], [7000, .14], [8800, .15], [12000, .10], [22000, .04]];
  function sampleT() {
    var u = Math.random(), acc = 0;
    for (var i = 0; i < CLASSES.length; i++) { acc += CLASSES[i][1]; if (u <= acc) return CLASSES[i][0]; }
    return 5900;
  }
  /* N(<m) ∝ 10^(0.48 m): invert the cumulative count. */
  function sampleMag() {
    var k = 0.48, a = Math.pow(10, k * M_BRIGHT), b = Math.pow(10, k * M_FAINT);
    return Math.log(a + Math.random() * (b - a)) / Math.LN10 / k;
  }
  function gauss() { return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); }

  /* Band geometry: a line through C at angle A (the galactic equator on screen). */
  function bandFrame() {
    var a = -24 * Math.PI / 180;
    return { cx: W * 0.56, cy: H * 0.42, ux: Math.cos(a), uy: Math.sin(a), nx: -Math.sin(a), ny: Math.cos(a), s: Math.hypot(W, H) };
  }

  function makeStar(f, inBand) {
    var m = sampleMag(), x, y;
    if (inBand) {
      var u = (Math.random() - 0.5) * f.s * 1.6, v = gauss() * f.s * 0.06;
      x = f.cx + f.ux * u + f.nx * v; y = f.cy + f.uy * u + f.ny * v;
    } else {
      x = -M + Math.random() * (W + 2 * M); y = -M + Math.random() * (H + 2 * M);
    }
    var flux = Math.pow(10, -0.4 * (m - M_FAINT));          /* 1 = faintest visible */
    var bright = Math.min(1, Math.max(0, (M_FAINT + 0.3 - m) / 7));
    var T = sampleT(), c = kelvin(T);
    var sat = 0.1 + 0.6 * Math.pow(bright, 1.4);            /* colour only shows on bright stars */
    var night = [218, 228, 255];                             /* faint light reads cool-white */
    c = c.map(function (v, i) { return night[i] + (v - night[i]) * sat; });
    var dx = x - pole.x, dy = y - pole.y;
    return {
      r: Math.hypot(dx, dy), th: Math.atan2(dy, dx), c: c, T: T,
      size: 0.45 + 0.55 * Math.pow(bright, 1.8),
      glow: bright > 0.75 ? Math.pow(flux, 0.2) : 0,
      /* nearer on average when brighter; band stars sit with the far Milky Way */
      depth: inBand ? 0.04 : Math.min(1, 0.12 + 0.55 * Math.random() * Math.random() + 0.35 * bright),
      base: Math.min(1, 0.3 + 0.65 * Math.pow(bright, 0.9)),
      f1: 2 * Math.PI * (0.15 + Math.random() * 0.3), f2: 2 * Math.PI * (0.35 + Math.random() * 0.55),
      p1: Math.random() * 6.283, p2: Math.random() * 6.283
    };
  }

  /* One soft glow sprite per temperature, tinted once instead of every frame. */
  function sprite(T, c) {
    if (sprites[T]) return sprites[T];
    var s = document.createElement('canvas'), n = 64; s.width = s.height = n;
    var g = s.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    var rgb = c.map(Math.round).join(',');
    gr.addColorStop(0, 'rgba(' + rgb + ',0.4)');
    gr.addColorStop(0.2, 'rgba(' + rgb + ',0.1)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return (sprites[T] = s);
  }

  /* The Milky Way, painted once per resize into an oversized offscreen canvas
     (room for an hour of sky rotation before it is rebuilt). */
  function paintBand(f) {
    var c = document.createElement('canvas'), bw = W * 2, bh = H * 2;
    c.width = bw; c.height = bh;
    var g = c.getContext('2d'), ox = W / 2, oy = H / 2, i, u, v, r, gr;
    function at(u, v) { return [ox + f.cx + f.ux * u + f.nx * v, oy + f.cy + f.uy * u + f.ny * v]; }
    /* unresolved starlight: blue-white disc, warm toward the bulge */
    for (i = 0; i < 260; i++) {
      u = (Math.random() - 0.5) * f.s * 2; v = gauss() * f.s * 0.07;
      var p = at(u, v), core = Math.exp(-Math.pow((u - f.s * 0.18) / (f.s * 0.28), 2));
      r = f.s * (0.05 + Math.random() * 0.07) * (1 + core * 0.6);
      var col = core > 0.35 ? '255,226,196' : '196,206,255';
      gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
      gr.addColorStop(0, 'rgba(' + col + ',' + (0.022 + core * 0.03).toFixed(3) + ')');
      gr.addColorStop(1, 'rgba(' + col + ',0)');
      g.fillStyle = gr; g.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
    }
    /* star clouds: thousands of points too faint to resolve one by one */
    for (i = 0; i < Math.min(3200, (W * H) / 340); i++) {
      u = (Math.random() - 0.5) * f.s * 2; v = gauss() * f.s * 0.055;
      var q = at(u, v);
      g.fillStyle = 'rgba(225,230,255,' + (0.04 + Math.random() * 0.16).toFixed(3) + ')';
      g.fillRect(q[0], q[1], 0.7, 0.7);
    }
    /* emission nebulae — ionised hydrogen glows at 656 nm, a rose-magenta */
    for (i = 0; i < 5; i++) {
      var n = at((Math.random() - 0.35) * f.s * 1.1, gauss() * f.s * 0.03);
      r = f.s * (0.018 + Math.random() * 0.03);
      gr = g.createRadialGradient(n[0], n[1], 0, n[0], n[1], r);
      gr.addColorStop(0, 'rgba(236,128,178,0.09)'); gr.addColorStop(0.5, 'rgba(201,143,196,0.04)'); gr.addColorStop(1, 'rgba(201,143,196,0)');
      g.fillStyle = gr; g.fillRect(n[0] - r, n[1] - r, 2 * r, 2 * r);
    }
    /* the dark rift: foreground dust absorbing the light behind it */
    g.globalCompositeOperation = 'destination-out';
    for (i = 0; i < 140; i++) {
      u = (i / 140 - 0.2) * f.s * 1.3;
      v = f.s * (0.012 + 0.014 * Math.sin(u / f.s * 9) + gauss() * 0.006);
      var d = at(u, v); r = f.s * (0.012 + Math.random() * 0.022);
      gr = g.createRadialGradient(d[0], d[1], 0, d[0], d[1], r);
      gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(d[0] - r, d[1] - r, 2 * r, 2 * r);
    }
    g.globalCompositeOperation = 'source-over';
    return c;
  }

  function build() {
    W = window.innerWidth; H = window.innerHeight; M = 40;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pole = { x: W * 0.3, y: -H * 1.9 };    /* celestial pole, well above the page */
    var f = bandFrame(), n = Math.min(MAX_STARS, Math.round(W * H * DENSITY)), i;
    stars = []; sprites = {};
    for (i = 0; i < n; i++) stars.push(makeStar(f, Math.random() < 0.3));
    var px = W * 0.78, py = H * 0.2;
    planet = { r: Math.hypot(px - pole.x, py - pole.y), th: Math.atan2(py - pole.y, px - pole.x), c: [255, 238, 214], depth: 1 };
    band = paintBand(f);
    t0 = performance.now();
  }

  function wrap(v, lo, span) { return ((v - lo) % span + span) % span + lo; }

  /* A meteor enters the upper sky and runs away from its radiant, off-screen above.
     Magnesium burns blue-green, sodium yellow-orange; most read nearly white. */
  function spawnMeteor(time) {
    var rx = Math.random() * W, ry = -H * (0.4 + Math.random() * 0.5);
    var sx = W * (0.1 + Math.random() * 0.8), sy = H * (0.06 + Math.random() * 0.45);
    var dx = sx - rx, dy = sy - ry, d = Math.hypot(dx, dy);
    meteor = {
      x: sx, y: sy, ux: dx / d, uy: dy / d, start: time,
      len: Math.hypot(W, H) * (0.1 + Math.random() * 0.1),
      dur: 380 + Math.random() * 420,
      rgb: Math.random() < 0.6 ? '228,255,240' : '255,238,214'
    };
  }
  function drawMeteor(time) {
    if (nextMeteor === null) nextMeteor = time + between(METEOR_FIRST) * 1000;
    if (!meteor && time >= nextMeteor) { spawnMeteor(time); nextMeteor = time + between(METEOR_GAP) * 1000; }
    if (!meteor) return;
    var p = (time - meteor.start) / meteor.dur;
    if (p >= 1) { meteor = null; return; }
    var b = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 0.8);  /* flares, then burns out */
    var hx = meteor.x + meteor.ux * meteor.len * p, hy = meteor.y + meteor.uy * meteor.len * p;
    var tl = meteor.len * Math.min(p, 0.35);
    var tx = hx - meteor.ux * tl, ty = hy - meteor.uy * tl;
    var gr = ctx.createLinearGradient(tx, ty, hx, hy);
    gr.addColorStop(0, 'rgba(' + meteor.rgb + ',0)');
    gr.addColorStop(1, 'rgba(' + meteor.rgb + ',' + (0.75 * b).toFixed(3) + ')');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * b).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(hx, hy, 0.9, 0, 6.283); ctx.fill();
  }

  function draw(time, frozen) {
    ctx.clearRect(0, 0, W, H);
    var phi = frozen ? 0 : (time - t0) / 1000 * SIDEREAL;
    if (phi > 0.24) { build(); phi = 0; }
    var scroll = frozen ? 0 : window.scrollY, sec = time / 1000;

    /* Milky Way: turns with the sky, ignores scroll */
    ctx.save();
    ctx.translate(pole.x, pole.y); ctx.rotate(phi); ctx.translate(-pole.x, -pole.y);
    ctx.globalAlpha = BAND_ALPHA;
    ctx.drawImage(band, -W / 2, -H / 2, W * 2, H * 2);
    ctx.restore();

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i], th = s.th + phi;
      var x = wrap(pole.x + s.r * Math.cos(th), -M, W + 2 * M);
      var y = wrap(pole.y + s.r * Math.sin(th) - scroll * s.depth * PARALLAX, -M, H + 2 * M);
      if (x < -8 || x > W + 8 || y < -8 || y > H + 8) continue;

      /* altitude: ~80° at the top of the screen, ~12° at the bottom */
      var alt = (80 - 68 * Math.max(0, Math.min(1, y / H))) * Math.PI / 180;
      var X = 1 / (Math.sin(alt) + 0.025 * Math.exp(-11 * Math.sin(alt)));  /* airmass */
      var ext = Math.pow(10, -0.4 * EXTINCTION * (X - 1));
      var sc = frozen ? 0 : Math.min(0.3, TWINKLE * Math.pow(X, 1.5)) * (0.6 * Math.sin(sec * s.f1 + s.p1) + 0.4 * Math.sin(sec * s.f2 + s.p2));
      var a = Math.max(0, s.base * ext * (1 + sc));
      var red = Math.min(1, (X - 1) * 0.05);                 /* blue light is scattered out first */
      var rgb = Math.round(s.c[0]) + ',' + Math.round(s.c[1] * (1 - red * 0.6)) + ',' + Math.round(s.c[2] * (1 - red * 1.4));

      if (s.glow) {
        var gsz = s.size * 5 * s.glow;
        ctx.globalAlpha = Math.min(1, a * 0.8);
        ctx.drawImage(sprite(s.T, s.c), x - gsz, y - gsz, gsz * 2, gsz * 2);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(x, y, s.size, 0, 6.283); ctx.fill();
    }

    /* the planet: a disc, not a point, so the atmosphere can't make it twinkle */
    var pth = planet.th + phi;
    var px = wrap(pole.x + planet.r * Math.cos(pth), -M, W + 2 * M);
    var py = wrap(pole.y + planet.r * Math.sin(pth) - scroll * planet.depth * PARALLAX, -M, H + 2 * M);
    ctx.globalAlpha = 0.35; ctx.drawImage(sprite('planet', planet.c), px - 11, py - 11, 22, 22); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,240,220,0.9)';
    ctx.beginPath(); ctx.arc(px, py, 1.4, 0, 6.283); ctx.fill();

    if (!frozen) drawMeteor(time);
  }

  function frame(time) {
    raf = null;
    if (document.hidden || !active()) return;
    draw(time, false);
    raf = requestAnimationFrame(frame);
  }

  /* Class changes on <html> are frequent; only a change in what the sky shows restarts it. */
  var wasOn = null, wasStill = null;
  function sync() { if (active() !== wasOn || still() !== wasStill) restart(); }

  function restart() {
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    var on = active();
    wasOn = on; wasStill = still();
    canvas.hidden = !on;
    if (root.classList.contains('ss-sky') !== on) root.classList.toggle('ss-sky', on);
    if (!on) return;
    if (!band) build();
    meteor = null; nextMeteor = null;   /* no meteor saved up while the tab was away */
    if (still()) draw(0, true);
    else if (!document.hidden) raf = requestAnimationFrame(frame);
  }

  function init() {
    canvas = document.createElement('canvas');
    canvas.className = 'night-sky';
    canvas.setAttribute('aria-hidden', 'true');
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    document.body.insertBefore(canvas, document.body.firstChild);
    window.addEventListener('resize', function () { if (active()) { build(); if (still()) draw(0, true); } else band = null; }, { passive: true });
    document.addEventListener('visibilitychange', restart);
    document.addEventListener('ss:themechange', sync);
    [mqMotion, mqForced].forEach(function (mq) { mq.addEventListener('change', sync); });
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    restart();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
