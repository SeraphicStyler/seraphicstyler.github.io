/* Seraphic Styler — scroll sparkle
   ----------------------------------------------------------------------
   A field of twinkling glints fixed to the viewport (so it follows the
   user) that shimmers continuously and brightens while scrolling — like
   sun-glitter on water. Self-contained, click-through, reduced-motion
   aware. Soft white→cyan/blush specks with a few 4-point star flares.

   Tweak COUNT below. Remove by deleting the <script> tag.
   ====================================================================== */
(function () {
  'use strict';

  var COUNT = 24;

  var root = document.documentElement;
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    || root.classList.contains('rm');
  if (reduce) return;

  var css =
    '.aura-spk-layer{position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden;' +
      'opacity:.5;transition:opacity .55s ease}' +
    '.aura-spk-layer.shimmer{opacity:.8}' +
    'html.rm .aura-spk-layer,html.hc .aura-spk-layer{display:none}' +
    '.spk{position:absolute;will-change:transform,opacity;animation:spk-tw ease-in-out infinite;' +
      'background:radial-gradient(circle,#ffffff 0%,rgba(241,188,211,.5) 40%,rgba(205,184,230,0) 72%)}' +
    '.spk.star{background:' +
      'radial-gradient(ellipse 13% 50% at 50% 50%,#ffffff 0%,rgba(241,188,211,0) 66%),' +
      'radial-gradient(ellipse 50% 13% at 50% 50%,#ffffff 0%,rgba(205,184,230,0) 66%)}' +
    '@keyframes spk-tw{0%,100%{opacity:.1;transform:scale(.5)}50%{opacity:1;transform:scale(1.15)}}' +
    '@media (prefers-reduced-motion: reduce){.aura-spk-layer{display:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function rnd(a, b) { return a + Math.random() * (b - a); }

  var layer = document.createElement('div');
  layer.className = 'aura-spk-layer';
  layer.setAttribute('aria-hidden', 'true');
  var sparks = [];

  function place(s) {
    // mild bottom-weighting so it reads like glitter pooling low, like the reference
    s.style.left = rnd(1, 99).toFixed(1) + 'vw';
    s.style.top = (Math.pow(Math.random(), 0.8) * 98 + 1).toFixed(1) + 'vh';
  }

  function makeSpark() {
    var s = document.createElement('span');
    var star = Math.random() < 0.28;
    s.className = star ? 'spk star' : 'spk';
    var sz = star ? rnd(11, 22) : rnd(3, 7);
    s.style.width = sz.toFixed(1) + 'px';
    s.style.height = sz.toFixed(1) + 'px';
    place(s);
    s.style.animationDuration = rnd(1.3, 3.6).toFixed(2) + 's';
    s.style.animationDelay = (-rnd(0, 3.6)).toFixed(2) + 's';
    return s;
  }

  function build() {
    for (var i = 0; i < COUNT; i++) { var s = makeSpark(); sparks.push(s); layer.appendChild(s); }
    document.body.appendChild(layer);

    // shimmer + gently re-scatter a few specks while scrolling, so the field feels alive
    var t, n = 0;
    window.addEventListener('scroll', function () {
      layer.classList.add('shimmer');
      if ((n++ & 3) === 0) { // every 4th scroll tick, move a couple specks
        for (var k = 0; k < 3; k++) place(sparks[Math.floor(Math.random() * sparks.length)]);
      }
      clearTimeout(t);
      t = setTimeout(function () { layer.classList.remove('shimmer'); }, 520);
    }, { passive: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
