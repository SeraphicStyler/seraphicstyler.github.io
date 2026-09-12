/* Sky stars — the falling-star layer for the home page's sky journey.
   Meteors spawn on a slow cadence and answer scrolling: while the user scrolls
   the sky wakes (brighter, busier), deepest past the halfway mark. Spawned
   elements animate once and are removed. Honours reduced-motion, high-contrast,
   mono theme, save-data, and hidden tabs. */
(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('ss-home')) return;
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    || root.classList.contains('rm') || root.classList.contains('hc') || root.classList.contains('mono');
  if (reduce) return;
  if (navigator.connection && navigator.connection.saveData) return;

  var layer = document.createElement('div');
  layer.className = 'sky-stars';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  var MAX = 3;                 // concurrent meteors
  var alive = 0;
  var lastSpawn = 0;
  var scrollTimer = null;

  function depth() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  /* Deeper sky = brighter layer; the last stretch is fully awake. */
  function paint() {
    var d = depth();
    var base = root.classList.contains('dark') ? 0.6 : 0.7 + 0.3 * Math.min(1, Math.max(0, (d - 0.1) / 0.65));
    layer.style.opacity = layer.classList.contains('shimmer') ? Math.min(1, base * 1.3) : base.toFixed(3);
  }

  function spawn() {
    if (document.hidden || alive >= MAX) return;
    if (performance.now() - lastSpawn < 1400) return;
    lastSpawn = performance.now();

    var m = document.createElement('div');
    m.className = 'meteor';
    var x = 6 + Math.random() * 78;                       // vw
    var y = Math.random() * 55;                           // vh
    var ang = (28 + Math.random() * 16) * (Math.random() < 0.28 ? -1 : 1); // degrees
    var len = 120 + Math.random() * 140;                   // px
    var rad = ang * Math.PI / 180;
    var dist = len * (2.4 + Math.random() * 1.4);
    var dark = root.classList.contains('dark');

    m.style.setProperty('--x', x.toFixed(2) + 'vw');
    m.style.setProperty('--y', y.toFixed(2) + 'vh');
    m.style.setProperty('--ang', ang.toFixed(1) + 'deg');
    m.style.setProperty('--len', len.toFixed(0) + 'px');
    m.style.setProperty('--dx', (Math.cos(rad) * dist).toFixed(0) + 'px');
    m.style.setProperty('--dy', (Math.sin(rad) * dist).toFixed(0) + 'px');
    m.style.setProperty('--t', (0.9 + Math.random() * 0.7).toFixed(2) + 's');
    if (dark) m.style.opacity = '.75';
    m.innerHTML = '<i class="m-tail"></i><i class="m-head"></i>';
    layer.appendChild(m);
    alive++;
    m.addEventListener('animationend', function () { m.remove(); alive--; }, { once: true });
    requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('go'); }); });
  }

  /* Idle cadence: a meteor every few seconds. While scrolling: far more likely. */
  function loop() {
    spawn();
    var d = depth();
    var wait = 3600 + Math.random() * 4200 - d * 1200;    // deeper = slightly busier
    setTimeout(loop, Math.max(1800, wait));
  }
  setTimeout(loop, 1800);

  var ticking = false;
  window.addEventListener('scroll', function () {
    layer.classList.add('shimmer');
    paint();
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () { layer.classList.remove('shimmer'); paint(); }, 650);
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      if (Math.random() < 0.55) spawn();                  // scroll wakes the sky
    });
  }, { passive: true });

  window.addEventListener('resize', paint, { passive: true });
  paint();
})();
