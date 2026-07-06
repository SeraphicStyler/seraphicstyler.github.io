/* Seraphic Styler — aura butterflies
   ----------------------------------------------------------------------
   Soft pastel butterflies that drift BEHIND the page content (a calm
   background layer) with a slow wing-flap and a faint glow — gossamer,
   not literal. They sit at z-index -1, so the frosted content panels blur
   and soften them wherever text is — keeping reading effortless. They stay
   visible in the hero and the gaps between sections. Self-contained:
   injects its own styles and a fixed, click-through layer. Honours
   reduced-motion (the site's ⚙ toggle and the OS setting).

   Pleasant by design: rounded wings, soft lavender→blush gradient, no
   hard outline or insect body, and a calm per-wing flap (not a squash).

   Tweak COUNT / GLINTS below. Remove by deleting the <script> tag.
   ====================================================================== */
(function () {
  'use strict';

  var COUNT = 3;     // butterflies on screen (behind content — keep low & calm)
  var GLINTS = 5;    // faint trailing motes

  var root = document.documentElement;
  var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    || root.classList.contains('rm');
  if (reduce) return;

  var css =
    '.aura-bf-layer{position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden}' +
    'html.rm .aura-bf-layer,html.hc .aura-bf-layer{display:none}' +
    '.aura-bf{position:absolute;top:0;left:0;will-change:transform;animation:bf-cross linear infinite}' +
    '.aura-bf.rev{animation-name:bf-cross-rev}' +
    '.bf-sway{will-change:transform;animation:bf-sway ease-in-out infinite alternate}' +
    '.bf-face{display:block}' +
    '.bf-wings{display:block;' +
      'filter:drop-shadow(0 0 3px rgba(255,255,255,.4)) drop-shadow(0 0 9px rgba(205,184,230,.35))}' +
    '.bf-wing{transform-box:fill-box;will-change:transform;animation:bf-flap var(--flap,2.3s) ease-in-out var(--flapd,0s) infinite}' +
    '.bf-wing-r{transform-origin:left center}' +
    '.bf-wing-l{transform-origin:right center}' +
    '.bf-glint{position:absolute;border-radius:50%;will-change:transform,opacity;' +
      'background:radial-gradient(circle,#fff 0%,rgba(241,188,211,.45) 45%,rgba(205,184,230,0) 72%);' +
      'animation:bf-twinkle ease-in-out infinite}' +
    '@keyframes bf-cross{from{transform:translateX(-14vw)}to{transform:translateX(116vw)}}' +
    '@keyframes bf-cross-rev{from{transform:translateX(116vw)}to{transform:translateX(-14vw)}}' +
    '@keyframes bf-sway{from{transform:translateY(-11px) rotate(-5deg)}to{transform:translateY(11px) rotate(5deg)}}' +
    '@keyframes bf-flap{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.72)}}' +
    '@keyframes bf-twinkle{0%,100%{opacity:.08;transform:scale(.6)}50%{opacity:.45;transform:scale(1.05)}}' +
    '@media (prefers-reduced-motion: reduce){.aura-bf-layer{display:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var layer = document.createElement('div');
  layer.className = 'aura-bf-layer';
  layer.setAttribute('aria-hidden', 'true');
  // shared soft gradient (pale lavender → blush → lavender)
  layer.innerHTML =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
    '<linearGradient id="bf-grad" x1="28" y1="8" x2="28" y2="44" gradientUnits="userSpaceOnUse">' +
    '<stop offset="0" stop-color="#e3d4f2"/><stop offset="0.5" stop-color="#f3c4d6"/>' +
    '<stop offset="1" stop-color="#cdb8e6"/></linearGradient></defs></svg>';

  function rnd(a, b) { return a + Math.random() * (b - a); }

  // two soft, rounded, symmetric wing pairs + a faint luminous centre. No outline, no body/antennae.
  var WING =
    '<g class="bf-wing bf-wing-r" fill="url(#bf-grad)" fill-opacity="0.78">' +
      '<path d="M28 20 C34 10 46 7 52 11 C56 18 49 25 36 25 C31 25 28 23 28 22 Z"/>' +
      '<path d="M28 26 C34 27 43 31 46 38 C48 44 39 45 33 40 C29 37 28 31 28 28 Z"/>' +
    '</g>' +
    '<g class="bf-wing bf-wing-l" fill="url(#bf-grad)" fill-opacity="0.78">' +
      '<path d="M28 20 C22 10 10 7 4 11 C0 18 7 25 20 25 C25 25 28 23 28 22 Z"/>' +
      '<path d="M28 26 C22 27 13 31 10 38 C8 44 17 45 23 40 C27 37 28 31 28 28 Z"/>' +
    '</g>' +
    '<ellipse cx="28" cy="25" rx="2.4" ry="6.5" fill="#ffffff" fill-opacity="0.5"/>';

  function makeButterfly() {
    var rev = Math.random() < 0.5;
    var size = rnd(24, 44);
    var w = document.createElement('div');
    w.className = 'aura-bf' + (rev ? ' rev' : '');
    w.style.top = rnd(6, 80).toFixed(1) + 'vh';
    w.style.opacity = rnd(0.22, 0.4).toFixed(2);
    w.style.animationDuration = rnd(28, 50).toFixed(1) + 's';
    w.style.animationDelay = (-rnd(0, 50)).toFixed(1) + 's';

    var sway = document.createElement('div');
    sway.className = 'bf-sway';
    sway.style.animationDuration = rnd(6, 10).toFixed(1) + 's';
    sway.style.animationDelay = (-rnd(0, 6)).toFixed(1) + 's';

    var face = document.createElement('div');
    face.className = 'bf-face';
    if (rev) face.style.transform = 'scaleX(-1)';
    face.innerHTML = '<svg class="bf-wings" width="' + size.toFixed(0) + '" viewBox="0 0 56 48" ' +
      'xmlns="http://www.w3.org/2000/svg">' + WING + '</svg>';

    // calm, slow flap shared by both wings (CSS vars inherit to the wing groups)
    var svg = face.querySelector('.bf-wings');
    svg.style.setProperty('--flap', rnd(1.9, 2.9).toFixed(2) + 's');
    svg.style.setProperty('--flapd', (-rnd(0, 2)).toFixed(2) + 's');

    sway.appendChild(face);
    w.appendChild(sway);
    return w;
  }

  function makeGlint() {
    var g = document.createElement('span');
    g.className = 'bf-glint';
    var s = rnd(3, 6).toFixed(1);
    g.style.width = s + 'px';
    g.style.height = s + 'px';
    g.style.left = rnd(2, 98).toFixed(1) + 'vw';
    g.style.top = rnd(4, 92).toFixed(1) + 'vh';
    g.style.animationDuration = rnd(2.6, 5.5).toFixed(1) + 's';
    g.style.animationDelay = (-rnd(0, 5)).toFixed(1) + 's';
    return g;
  }

  function build() {
    var i;
    for (i = 0; i < GLINTS; i++) layer.appendChild(makeGlint());
    for (i = 0; i < COUNT; i++) layer.appendChild(makeButterfly());
    document.body.appendChild(layer);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
