/* Seraphic Styler — aura orbs
   ----------------------------------------------------------------------
   Iridescent, soft-focus orbs that drift, breathe (pull / expand) and
   slowly contort in the page background — airy, whimsical weight. Self-
   contained: injects a fixed layer BEHIND content (z-index:-1), so text
   stays perfectly readable. Honours reduced-motion.

   Only transforms animate (compositor-friendly); the heavy blur and the
   organic blob shape are static, so it stays smooth.

   Tweak COUNT / INTENSITY below. Remove by deleting the <script> tag.
   ====================================================================== */
(function () {
  'use strict';

  var COUNT = 6;          // number of orbs
  var INTENSITY = 0.35;   // 0–1 peak opacity of an orb

  var root = document.documentElement;
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    || root.classList.contains('rm');
  if (reduce) return;

  // Ethereal-Lavender tokens only: lavender + blush, fading through airy ice /
  // blush-wash, with one cobalt for structure. No off-palette hues.
  var PAIRS = [
    ['#cdb8e6', '#f1bcd3'],  // lavender → blush
    ['#f1bcd3', '#cdb8e6'],  // blush → lavender
    ['#cdb8e6', '#eef3fb'],  // lavender → ice
    ['#f1bcd3', '#f7e6ee'],  // blush → blush-wash
    ['#cdb8e6', '#2e54ad'],  // lavender → luminous cobalt
    ['#f1bcd3', '#eef3fb'],  // blush → ice
    ['#cdb8e6', '#f7e6ee']   // lavender → blush-wash
  ];

  var css =
    '.aura-orbs{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}' +
    'html.rm .aura-orbs,html.hc .aura-orbs{display:none}' +
    '.aura-orb{position:absolute;will-change:transform;animation:orb-life ease-in-out infinite}' +
    '@keyframes orb-life{' +
      '0%{transform:translate(0,0) scale(1) rotate(0deg)}' +
      '25%{transform:translate(3vw,-2.5vh) scale(1.1) rotate(10deg)}' +
      '50%{transform:translate(-2.5vw,3vh) scale(.92) rotate(-7deg)}' +
      '75%{transform:translate(2.5vw,2vh) scale(1.06) rotate(8deg)}' +
      '100%{transform:translate(0,0) scale(1) rotate(0deg)}}' +
    '@media (prefers-reduced-motion: reduce){.aura-orbs{display:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function blob() { // organic asymmetric border-radius (held static; rotation makes it "contort")
    function p() { return Math.round(rnd(35, 65)); }
    return p() + '% ' + p() + '% ' + p() + '% ' + p() + '% / ' + p() + '% ' + p() + '% ' + p() + '% ' + p() + '%';
  }

  var layer = document.createElement('div');
  layer.className = 'aura-orbs';
  layer.setAttribute('aria-hidden', 'true');

  function makeOrb() {
    var o = document.createElement('div');
    o.className = 'aura-orb';
    var size = rnd(30, 58);                 // vw
    var pair = pick(PAIRS);
    o.style.width = size + 'vw';
    o.style.height = size + 'vw';
    o.style.left = rnd(-12, 88) + 'vw';
    o.style.top = rnd(-12, 82) + 'vh';
    o.style.borderRadius = blob();
    o.style.opacity = (rnd(0.32, 1) * INTENSITY).toFixed(2);
    o.style.filter = 'blur(' + rnd(48, 88).toFixed(0) + 'px)';
    o.style.background = 'radial-gradient(circle at 42% 38%, ' + pair[0] + ' 0%, ' + pair[1] + ' 42%, rgba(205,184,230,0) 72%)';
    o.style.animationDuration = rnd(50, 90).toFixed(1) + 's';
    o.style.animationDelay = (-rnd(0, 40)).toFixed(1) + 's';
    if (Math.random() < 0.5) o.style.animationDirection = 'alternate';
    return o;
  }

  function build() {
    for (var i = 0; i < COUNT; i++) layer.appendChild(makeOrb());
    document.body.appendChild(layer);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
