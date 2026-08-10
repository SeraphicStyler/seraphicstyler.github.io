/* Seraphic Styler — Style Quiz
   ----------------------------------------------------------------------
   A brand-grounded style quiz. Answers map onto eight style archetypes;
   the result is a *blend* (not a single box) plus a curated board of real
   houses from the directory (js/directory-data.js) that match — filterable
   into the sourcing funnel.

   No build step: pure vanilla, mounts into #sqRoot, reads window.SS_DIRECTORY.
   The brand→archetype tagging is derived here (tagBrand) from each house's
   category, tier, fibre and free-text note, so nothing in directory-data.js
   has to change. Refine by hand later via ARCH_OVERRIDE if you want tighter
   matches for specific houses.
   ====================================================================== */
(function () {
  'use strict';

  /* ---- Style archetypes ---------------------------------------------- */
  var ARCH = {
    minimal: {
      name: 'Minimalist', adj: 'Minimalist', accent: '#8a94a6',
      tag: 'Clean lines, quiet colour, considered cuts.',
      desc: 'You trust a great cut over a loud print. Your wardrobe is edited and tonal — fewer pieces, worn on repeat, always looking intentional.',
      look: ['A neutral base — black, cream, grey, navy', 'Clean silhouettes, minimal hardware', 'Investment fabric over embellishment'],
      skip: 'Busy prints and fast-trend pieces you tire of in a month.'
    },
    romantic: {
      name: 'Romantic', adj: 'Romantic', accent: '#c9b6e8',
      tag: 'Soft, feminine, a little dreamy.',
      desc: 'You dress for how it makes you feel — soft fabrics, pretty details, a touch of nostalgia. Bows, lace, florals and gentle colour are your love language.',
      look: ['Soft tones and florals', 'Lace, ruffles, bows, delicate knits', 'Flowy, feminine silhouettes'],
      skip: 'Stiff, severe tailoring that fights your softness.'
    },
    street: {
      name: 'Street & Playful', adj: 'Street', accent: '#2e54ad',
      tag: 'Bold, casual, quietly rebellious.',
      desc: 'You like an outfit with attitude — relaxed, current, a little unexpected. Comfort and self-expression beat "proper" every time.',
      look: ['Relaxed and oversized fits', 'Graphics, denim, statement layers', 'One piece that breaks the rules'],
      skip: 'Fussy, delicate pieces that can’t keep up with you.'
    },
    elegant: {
      name: 'Elegant', adj: 'Elegant', accent: '#233a72',
      tag: 'Polished, refined, occasion-ready.',
      desc: 'You dress to feel put-together and quietly luxurious — clean drape, considered detail, pieces that carry a room. You’d rather be overdressed than under.',
      look: ['Refined drape and tailoring', 'Evening and occasion pieces', 'Considered detail — never fussy'],
      skip: 'Throwaway trend pieces that read cheap up close.'
    },
    vintage: {
      name: 'Vintage & Curated', adj: 'Vintage', accent: '#9a8fb0',
      tag: 'Nostalgic, one-of-a-kind, story-rich.',
      desc: 'You’d rather own the piece no one else has. You mix eras, hunt for character, and love a wardrobe that feels collected — not bought all at once.',
      look: ['Archival and secondhand finds', 'Faded, earthy, lived-in tones', 'Character over newness'],
      skip: 'Mass-produced pieces with no story behind them.'
    },
    heritage: {
      name: 'Heritage & Tailored', adj: 'Heritage', accent: '#a9748a',
      tag: 'Craft, tradition, made just for you.',
      desc: 'You value the hand behind the garment — áo dài, fine tailoring, embroidery, made-to-measure. Pieces with craft and meaning, cut for your body.',
      look: ['Áo dài and made-to-measure', 'Embroidery, craft, fine finishing', 'Tradition worn a modern way'],
      skip: 'Disposable pieces with no craft in them.'
    },
    sporty: {
      name: 'Sport & Active', adj: 'Sporty', accent: '#5a8fa8',
      tag: 'Easy, modern, always on the move.',
      desc: 'Your style moves with you — clean activewear and function-first pieces that still look sharp from studio to street.',
      look: ['Technical, breathable fabrics', 'Clean, modern athleisure', 'Function that still looks good'],
      skip: 'High-maintenance pieces that can’t keep up.'
    },
    contemporary: {
      name: 'Contemporary', adj: 'Contemporary', accent: '#6b78c4',
      tag: 'Current, design-forward, versatile.',
      desc: 'You follow what’s now — design-forward local labels, versatile pieces, an eye that’s always a little ahead. You like range more than a single "type".',
      look: ['Design-forward local labels', 'Versatile, mix-and-match pieces', 'A current, considered edge'],
      skip: 'Anything too safe — or too costume-y.'
    }
  };
  /* Priority order for tie-breaks (most specific first, broad bucket last). */
  var ORDER = ['minimal', 'romantic', 'elegant', 'street', 'vintage', 'heritage', 'sporty', 'contemporary'];

  /* Hand overrides for houses whose note doesn't reveal their style. key = brand name. */
  var ARCH_OVERRIDE = {
    'LSOUL': ['minimal'], 'Routine': ['minimal', 'contemporary'],
    'Huelley Rose': ['romantic'], 'Josephine': ['romantic', 'elegant'],
    'Môi Điên': ['heritage', 'vintage']
  };

  /* ---- Brand → archetype tagging ------------------------------------- */
  function tagBrand(b) {
    if (ARCH_OVERRIDE[b.n]) return ARCH_OVERRIDE[b.n].slice();
    var t = {}, add = function (a) { t[a] = 1; };
    var s = ((b.no || '') + ' ' + (b.n || '')).toLowerCase();
    var cat = b.cat, tier = b.tier, fib = b.fib || [];
    var has = function (re) { return re.test(s); };
    if (has(/minimal|timeless|slow fashion|essential|clean|quiet|understated|monochrom|basic/)) add('minimal');
    if (has(/romantic|feminine|coquette|soft|lace|floral|flower|muse|delicate|bow|ribbon|dreamy|angelic|tender|sweet|heaven|desire|temptation/)) add('romantic');
    if (has(/street|playful|urban|edgy|grunge|y2k|bold|graphic|cool|rebel|hype/)) add('street');
    if (has(/elegant|luxur|couture|evening|gown|bridal|occasion|refined|glamour|sophisticat/)) add('elegant');
    if (has(/vintage|retro|archive|thrift|second.?hand|preloved/) || fib.indexOf('circular') > -1) add('vintage');
    if (has(/áo dài|ao dai|tailor|bespoke|made.to.measure|embroider|heritage|traditional|craft/)) add('heritage');
    if (cat === 'active' || has(/active|sport|swim|performance|athleisure|yoga|gym/)) add('sporty');
    if (cat === 'tailor') add('heritage');
    if (cat === 'luxury' || tier === 'luxury' || tier === 'couture') add('elegant');
    if (cat === 'sleep' || cat === 'lingerie') add('romantic');
    var out = Object.keys(t);
    return out.length ? out : ['contemporary'];
  }

  /* ---- Questions (weights map onto archetypes) ----------------------- */
  var Q = [
    { q: 'Which words pull you in?', o: [
      { t: 'Clean, quiet, undone', w: { minimal: 2 } },
      { t: 'Soft, pretty, dreamy', w: { romantic: 2 } },
      { t: 'Cool, bold, a little rebellious', w: { street: 2 } },
      { t: 'Polished, refined, elegant', w: { elegant: 2 } },
      { t: 'Nostalgic, one-of-a-kind', w: { vintage: 2 } }
    ] },
    { q: 'Your ideal silhouette?', o: [
      { t: 'Structured & tailored', w: { minimal: 1, elegant: 1 } },
      { t: 'Soft & flowy', w: { romantic: 2 } },
      { t: 'Relaxed & oversized', w: { street: 2 } },
      { t: 'Body-skimming & refined', w: { elegant: 2 } },
      { t: 'Honestly — depends on my mood', w: { contemporary: 2 } }
    ] },
    { q: 'Your colour instinct?', o: [
      { t: 'Neutrals — black, cream, grey', w: { minimal: 2 } },
      { t: 'Pastels & soft tones', w: { romantic: 2 } },
      { t: 'High-contrast & statement', w: { street: 1, elegant: 1 } },
      { t: 'Earthy & faded', w: { vintage: 2 } },
      { t: 'Whatever’s current this season', w: { contemporary: 2 } }
    ] },
    { q: 'Most of your outfits are for…', o: [
      { t: 'Everyday & work', w: { minimal: 1, contemporary: 1 } },
      { t: 'Cafés, dates, city days', w: { romantic: 1, contemporary: 1 } },
      { t: 'Nights out & events', w: { street: 1, elegant: 1 } },
      { t: 'Occasions & dressing up', w: { elegant: 2 } },
      { t: 'Studio, gym, on the move', w: { sporty: 2 } }
    ] },
    { q: 'Fabric you reach for?', o: [
      { t: 'Crisp cotton, wool, structure', w: { minimal: 2 } },
      { t: 'Silk, chiffon, lace, soft knits', w: { romantic: 2 } },
      { t: 'Denim, jersey, easy cottons', w: { street: 2 } },
      { t: 'Fine, luxe, drapey', w: { elegant: 2 } },
      { t: 'Technical, stretch, breathable', w: { sporty: 2 } }
    ] },
    { q: 'Detail level?', o: [
      { t: 'Barely any — let the cut speak', w: { minimal: 2 } },
      { t: 'Ruffles, bows, florals, lace', w: { romantic: 2 } },
      { t: 'Graphics, hardware, attitude', w: { street: 2 } },
      { t: 'Embroidery, beading, craft', w: { heritage: 2 } },
      { t: 'A characterful vintage piece', w: { vintage: 2 } }
    ] },
    { q: 'Your dream wardrobe adds…', o: [
      { t: 'Perfect staples I’ll wear forever', w: { minimal: 2 } },
      { t: 'Pieces that make me feel soft & pretty', w: { romantic: 2 } },
      { t: 'Statement pieces no one else has', w: { street: 1, vintage: 1 } },
      { t: 'One showstopper for the occasion', w: { elegant: 2 } },
      { t: 'A made-for-me piece (áo dài, tailored)', w: { heritage: 2 } }
    ] },
    { q: 'Comfortable spend per piece?', budget: true, o: [
      { t: 'Mid — smart everyday', tier: ['mid'] },
      { t: 'Premium — worth investing', tier: ['premium'] },
      { t: 'Luxury — treat pieces', tier: ['luxury', 'couture'] },
      { t: 'A mix, depending on the piece', tier: null }
    ] }
  ];

  /* ---- State + helpers ----------------------------------------------- */
  var root, idx = 0, scores = {}, tierPref = null;
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function tierLabel(t) { return ({ mid: 'Mid', premium: 'Premium', luxury: 'Luxury', couture: 'Couture' })[t] || ''; }
  function brandLink(b) { return b.w ? b.w : (b.h ? 'https://instagram.com/' + b.h : ''); }
  /* CTA opens the Tally inquiry as a modal pop-up, pre-tagged with the style
     blend + matched houses so each lead arrives with context. Falls back to a
     new tab if the embed script hasn't loaded. */
  function openSourcing(r) {
    var houses = (r.houses || matchBrands(r.top, tierPref)).map(function (b) { return b.n; }).slice(0, 12).join(', ');
    var fields = { source: 'style-quiz', style: r.blend, houses: houses };
    if (window.Tally && window.Tally.openPopup) window.Tally.openPopup('gD10Kl', { layout: 'modal', width: 700, hideTitle: true, hiddenFields: fields });
    else window.open('https://tally.so/r/gD10Kl', '_blank', 'noopener');
  }

  /* ---- Matching: pick houses for the board --------------------------- */
  function matchBrands(top, tiers) {
    var D = window.SS_DIRECTORY || [];
    var scored = D.map(function (b) {
      var tags = tagBrand(b), sc = 0;
      top.forEach(function (a, i) { if (tags.indexOf(a) > -1) sc += (top.length - i); });
      if (sc <= 0) return null;
      if (tiers && tiers.indexOf(b.tier) > -1) sc += 0.6;
      if (b.st === 'walk' || b.st === 'appt') sc += 0.2;
      if (b.flag) sc -= 0.6;
      /* accessories & markets only surface on a strong style match */
      if ((b.cat === 'access' || b.cat === 'market') && sc < 1.8) return null;
      return { b: b, sc: sc };
    }).filter(Boolean);
    scored.sort(function (a, b) { return b.sc - a.sc; });
    return scored.slice(0, 12).map(function (x) { return x.b; });
  }

  /* ---- Compute the style blend --------------------------------------- */
  function computeBlend(sc) {
    sc = sc || scores;
    var ranked = ORDER.slice().filter(function (a) { return (sc[a] || 0) > 0; })
      .sort(function (a, b) { return (sc[b] - sc[a]) || (ORDER.indexOf(a) - ORDER.indexOf(b)); });
    if (!ranked.length) ranked = ['contemporary'];
    var total = ranked.reduce(function (s, a) { return s + sc[a]; }, 0) || 1;
    var spectrum = ranked.slice(0, 4).map(function (a) { return { a: a, pct: Math.round(sc[a] / total * 100) }; });
    var primary = ranked[0], secondary = ranked[1], tertiary = ranked[2];
    var blend = (secondary && sc[secondary] >= sc[primary] * 0.6)
      ? ARCH[secondary].adj + ' ' + ARCH[primary].name
      : ARCH[primary].name;
    var top = [primary, secondary, tertiary].filter(function (a) { return a && (sc[a] || 0) > 0; });
    return { primary: primary, secondary: secondary, blend: blend, spectrum: spectrum, top: top };
  }

  /* ---- Render: one question ------------------------------------------ */
  function renderQuestion() {
    var step = Q[idx], pct = Math.round(idx / Q.length * 100);
    var opts = step.o.map(function (o, i) {
      return '<button class="sq-opt" type="button" data-opt="' + i + '">' + esc(o.t) + '</button>';
    }).join('');
    root.innerHTML =
      '<div class="sq-card">' +
        '<div class="sq-progress"><span class="sq-bar"><i style="width:' + pct + '%"></i></span>' +
          '<span class="sq-count">' + (idx + 1) + ' / ' + Q.length + '</span></div>' +
        '<p class="sq-q">' + esc(step.q) + '</p>' +
        '<div class="sq-opts">' + opts + '</div>' +
        (idx > 0 ? '<button class="sq-back" type="button" data-back>← Back</button>' : '') +
      '</div>';
    root.querySelectorAll('.sq-opt').forEach(function (el) {
      el.addEventListener('click', function () { choose(step, +el.getAttribute('data-opt')); });
    });
    var back = root.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () { idx = Math.max(0, idx - 1); undo(idx); renderQuestion(); });
    root.querySelector('.sq-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* answers are stacked so Back can pop them */
  var stack = [];
  function choose(step, i) {
    var o = step.o[i];
    if (step.budget) { tierPref = o.tier; stack[idx] = { budget: true }; }
    else { var applied = o.w || {}; Object.keys(applied).forEach(function (a) { scores[a] = (scores[a] || 0) + applied[a]; }); stack[idx] = { w: applied }; }
    idx++;
    if (idx >= Q.length) renderResult(); else renderQuestion();
  }
  function undo(to) {
    var s = stack[to];
    if (s && s.w) Object.keys(s.w).forEach(function (a) { scores[a] -= s.w[a]; });
    if (s && s.budget) tierPref = null;
    stack[to] = null;
  }

  /* ---- Render: result + curated board -------------------------------- */
  function renderResult(pre) {
    var r = pre || computeBlend();
    var P = ARCH[r.primary], accent = P.accent;
    var bars = r.spectrum.map(function (s) {
      return '<div class="sq-spec-row"><span class="sq-spec-lab">' + esc(ARCH[s.a].name) + '</span>' +
        '<span class="sq-spec-track"><i style="width:' + s.pct + '%;background:' + ARCH[s.a].accent + '"></i></span>' +
        '<span class="sq-spec-pct">' + s.pct + '%</span></div>';
    }).join('');
    var secondary = r.secondary ? (' Your ' + ARCH[r.secondary].adj.toLowerCase() + ' side shows up in the details.') : '';
    var look = P.look.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('');

    var houses = matchBrands(r.top, tierPref);
    r.houses = houses;
    var board = houses.length ? houses.map(function (b) {
      var link = brandLink(b), tl = tierLabel(b.tier);
      var go = b.w ? 'Visit site →' : (b.h ? 'View on Instagram →' : '');
      var inner =
        '<div class="sq-brand-top"><span class="sq-brand-name">' + esc(b.n) + '</span>' +
          (tl ? '<span class="sq-tier">' + tl + '</span>' : '') + '</div>' +
        '<div class="sq-brand-area">' + esc(b.area || '') + '</div>' +
        (b.no ? '<div class="sq-brand-note">' + esc(b.no.length > 96 ? b.no.slice(0, 94) + '…' : b.no) + '</div>' : '') +
        (go ? '<span class="sq-brand-go">' + go + '</span>' : '');
      return link
        ? '<a class="sq-brand" href="' + esc(link) + '" target="_blank" rel="noopener">' + inner + '</a>'
        : '<div class="sq-brand">' + inner + '</div>';
    }).join('') : '<p class="sq-muted">Tell me your favourites and I’ll build the board by hand.</p>';

    root.innerHTML =
      '<div class="sq-result" style="--sq-accent:' + accent + '">' +
        '<p class="sq-eyebrow">Your style is</p>' +
        '<h2 class="sq-blend">' + esc(r.blend) + '</h2>' +
        '<p class="sq-tag">' + esc(P.tag) + '</p>' +
        '<p class="sq-desc">' + esc(P.desc) + esc(secondary) + '</p>' +
        '<div class="sq-spectrum"><p class="sq-spec-h">Most people are a blend — here’s yours</p>' + bars + '</div>' +
        '<div class="sq-cues"><div><h4>Look for</h4><ul>' + look + '</ul></div>' +
          '<div><h4>Maybe skip</h4><p>' + esc(P.skip) + '</p></div></div>' +
        '<div class="sq-board-head"><h3>Your houses in Saigon</h3>' +
          '<p class="sq-muted">' + houses.length + ' verified ' + (houses.length === 1 ? 'house' : 'houses') + ' matched to your style' +
          (tierPref ? ' and budget' : '') + '. Tap any to see their pieces.</p></div>' +
        '<div class="sq-board">' + board + '</div>' +
        '<div class="sq-cta">' +
          '<button class="btn btn-primary btn-lg" type="button" id="sqSource">Have me source your ' + esc(r.blend) + ' edit →</button>' +
          '<div class="sq-cta-row">' +
            '<button class="sq-back" type="button" id="sqShare">Copy my result</button>' +
            '<button class="sq-back" type="button" id="sqRetake">Retake the quiz</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    var share = root.querySelector('#sqShare');
    if (share) share.addEventListener('click', function () {
      var url = location.origin + location.pathname + '#style=' + r.top.join('.');
      var txt = 'My Seraphic Styler result: ' + r.blend + ' — ' + url;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { share.textContent = 'Copied ✓'; }).catch(function () {});
    });
    var retake = root.querySelector('#sqRetake');
    if (retake) retake.addEventListener('click', reset);
    var src = root.querySelector('#sqSource');
    if (src) src.addEventListener('click', function () { openSourcing(r); });
    root.querySelector('.sq-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function reset() {
    idx = 0; scores = {}; tierPref = null; stack = [];
    if (location.hash) history.replaceState(null, '', location.pathname);
    renderQuestion();
  }

  /* Deep-link: #style=romantic.minimal renders that result directly. */
  function fromHash() {
    var m = /#style=([a-z.]+)/.exec(location.hash || '');
    if (!m) return false;
    var top = m[1].split('.').filter(function (a) { return ARCH[a]; });
    if (!top.length) return false;
    var spectrum = top.slice(0, 4).map(function (a, i) { return { a: a, pct: Math.max(10, 45 - i * 12) }; });
    renderResult({ primary: top[0], secondary: top[1], blend: (top[1] && ARCH[top[1]] ? ARCH[top[1]].adj + ' ' + ARCH[top[0]].name : ARCH[top[0]].name), spectrum: spectrum, top: top });
    return true;
  }

  /* Headless/reusable API — pure scoring without the DOM (also handy for a
     homepage teaser). Pass an array of chosen option indices, one per question. */
  window.SS_QUIZ = {
    ARCH: ARCH, ORDER: ORDER, questions: Q, tagBrand: tagBrand, matchBrands: matchBrands,
    score: function (indices) {
      var sc = {}, tp = null;
      Q.forEach(function (step, i) {
        var o = step.o[indices[i]]; if (!o) return;
        if (step.budget) tp = o.tier;
        else Object.keys(o.w || {}).forEach(function (a) { sc[a] = (sc[a] || 0) + o.w[a]; });
      });
      var b = computeBlend(sc); b.tierPref = tp; b.houses = matchBrands(b.top, tp);
      return b;
    }
  };

  function init() {
    root = document.getElementById('sqRoot');
    if (!root) return;
    if (!fromHash()) renderQuestion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
