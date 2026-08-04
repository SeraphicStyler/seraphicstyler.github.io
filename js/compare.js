/* Seraphic Styler — the landscape, honestly.
   An interactive answer to "is this expensive?": pick a tier and see what the
   same money buys at every comparable US service — styling boxes, advice-only
   stylists, department stores, sourcers, rentals. Renders into #giftLandscape
   (the static $149 table there is the no-JS fallback); reads tier names and
   prices from the gift cards in the DOM (matched by data-usd, like
   gift-quiz.js) so prices can never drift.
   Competitor figures verified Aug 2026 — source doc + citations:
   ~/seraphic-styling-competitor-landscape-aug2026.md. If a competitor number
   changes, it changes HERE and in that doc, nowhere else.
   EN-only for now (the site's other languages fall back to English chrome —
   same call as the estimator's newer strings); add a `vi` object to L to
   translate, the lang observer already re-renders. */
(function () {
  'use strict';

  var L = {
    en: {
      heading: 'What {tier}’s {price} buys elsewhere',
      pick: 'Compare at',
      keeps: 'keeps',
      live: 'Now comparing {tier}, {price}.',
      mineSub: 'styled personally, in Sài Gòn',
      mineWhat: [
        'A style intake, then one piece — found in person, photographed for approval, and sent. $34 of the price is the piece itself, at cost.',
        'A consultation, then three to five pieces from Sài Gòn’s independent designers — $104 of the price is the clothes, at cost, never marked up.',
        'A full style profile, eight to twelve coordinated pieces to a $174 credit at cost, and a lookbook to wear them together.',
        'The full experience — sourcing and a two-hour try-on in Sài Gòn, or live video from abroad — with a $239 piece credit at cost.'
      ],
      mineKeep: ['1 piece', '3–5 pieces', '8–12 pieces', 'a $239 credit'],
      foot: 'Competitor pricing verified August 2026: Stitch Fix $20 styling fee · DailyLook $40 · Wishi $60–130 sessions · MiKADO $850/hr · Reformation at Nordstrom $148–278 · sourcing fees $200–350 per item · Nuuly $98/month. All prices USD.',
      honest: 'And honestly: if a fitting room this week matters more — easy returns, an exchange by Friday — a US service will suit them better. This is for the person who’d rather own something no one else at the party has.',
      kicker: 'Gift cards make them shop. This shops for them.'
    }
  };
  function lang() { var l = document.documentElement.getAttribute('lang') || 'en'; return L[l] ? l : 'en'; }
  function t(k) { return L[lang()][k]; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* One row per comparable service; what[i] = what the tier price at index i
     (Discovery/Edit/Capsule/Atelier) actually buys there. Figures Aug 2026. */
  var ROWS = [
    { name: 'Stitch Fix', sub: 'algorithm + remote stylist',
      what: [
        'The $20 styling fee, credited — then not quite one mall-brand item at the ~$60 average.',
        'The $20 fee plus about two mall-brand items, billed at full US retail.',
        'The fee plus about four items, at full retail.',
        'The fee plus five or six items, at full retail.'
      ],
      keep: ['~0–1', '~2', '~4', '~5–6'] },
    { name: 'DailyLook', sub: 'remote human stylist',
      what: [
        'The $40 styling fee — and $9 toward a first premium item ($75–150 each).',
        'The $40 fee plus about one premium item, at retail.',
        'The fee plus one to two items, at retail.',
        'The fee plus about two items, at retail.'
      ],
      keep: ['0', '~1', '~2', '~2–3'] },
    { name: 'Wishi', sub: 'virtual styling app',
      what: [
        'Most of one Mini session ($60) — two style boards, no garments.',
        'One Major session ($130) — five boards with shopping links; the garments are a separate retail bill.',
        'A Major and a Mini session — still no garments.',
        'Two Major sessions — the advice only, always.'
      ],
      keep: ['0', '0', '0', '0'] },
    { name: 'MiKADO', sub: 'LA stylist, in person',
      what: [
        'About 3 minutes of an $850-an-hour strategy session.',
        'About 10 minutes of an $850-an-hour strategy session.',
        'About 17 minutes of the same hour.',
        'About 24 minutes of the same hour.'
      ],
      keep: ['0', '0', '0', '0'] },
    { name: 'Nordstrom', sub: 'free in-store styling',
      what: [
        'A third of one Reformation dress ($148–278 typical) — the styling advice is genuinely free.',
        'One entry-price Reformation dress; the advice is free.',
        'One mid-range Reformation dress; the advice is free.',
        'One dress and change — or two on sale.'
      ],
      keep: ['0', '~1', '~1', '1–2'] },
    { name: 'Gab Waller', sub: 'fashion sourcer — procurement only',
      what: [
        'Well under the $200–350 finder’s fee for sourcing a single sold-out piece.',
        'Still under the finder’s fee for one piece — no styling, ever.',
        'The finder’s fee for one piece — the piece itself billed separately.',
        'One finder’s fee with change — the piece still billed separately.'
      ],
      keep: ['0', '0', '0', '0'] },
    { name: 'Nuuly', sub: 'rental subscription',
      what: [
        'About two weeks of rentals — six pieces at a time, all returned.',
        'About six weeks of rentals — all returned.',
        'About two and a half months of rentals — all returned.',
        'About three and a half months of rentals — all returned.'
      ],
      keep: ['0', '0', '0', '0'] }
  ];

  var mount = document.getElementById('giftLandscape');
  if (!mount) return;

  /* Tiers from the DOM, ordered by price — matched by data-usd, never by
     i18n key or card position (the gift.* keys are historically shuffled). */
  var tiers = [];
  document.querySelectorAll('.gift-grid-4 .gift-card').forEach(function (card) {
    var price = card.querySelector('.gift-price');
    var h = card.querySelector('h3');
    if (!price || !h) return;
    tiers.push({ usd: parseFloat(price.getAttribute('data-usd')) || 0, nameEl: h });
  });
  tiers.sort(function (a, b) { return a.usd - b.usd; });
  if (tiers.length !== 4) return; // leave the static fallback in place

  var sel = 1; // The Edit — the tier the landscape table was written around

  function tierName(i) { return tiers[i].nameEl.textContent.trim(); }
  function tierPrice(i) { return '$' + Math.round(tiers[i].usd); }
  function fill(s, i) { return s.replace('{tier}', tierName(i)).replace('{price}', tierPrice(i)); }

  function row(name, sub, what, keep, mine) {
    return '<li class="gl-row' + (mine ? ' gl-mine' : '') + '">' +
      '<span class="gl-svc">' + esc(name) + '<span class="gl-sub">' + esc(sub) + '</span></span>' +
      '<p class="gl-what">' + esc(what) + '</p>' +
      '<span class="gl-keep">' + esc(t('keeps')) + ' ' + esc(keep) + '</span>' +
      '</li>';
  }

  function render() {
    mount.innerHTML =
      '<div class="gl-seg-wrap"><span class="gl-seg-label" id="glPickLabel">' + esc(t('pick')) + '</span>' +
      '<div class="vn-seg" role="group" aria-labelledby="glPickLabel">' +
      tiers.map(function (tr, i) {
        return '<button type="button" data-gl="' + i + '" aria-pressed="' + (i === sel) + '" aria-label="' + esc(tierName(i)) + ', ' + esc(tierPrice(i)) + '">' + esc(tierPrice(i)) + '</button>';
      }).join('') +
      '</div></div>' +
      '<p class="gl-head">' + esc(fill(t('heading'), sel)) + '</p>' +
      '<ul class="gl-rows">' +
      row(tierName(sel), t('mineSub'), t('mineWhat')[sel], t('mineKeep')[sel], true) +
      ROWS.map(function (r) { return row(r.name, r.sub, r.what[sel], r.keep[sel], false); }).join('') +
      '</ul>' +
      '<div class="gl-foot">' +
      '<p class="small muted">' + esc(t('foot')) + '</p>' +
      '<p class="small muted">' + esc(t('honest')) + '</p>' +
      '<p class="gl-kicker">' + esc(t('kicker')) + '</p>' +
      '</div>' +
      '<p class="sr-only" role="status" aria-live="polite" data-gl-say></p>';
  }

  mount.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-gl]');
    if (!btn) return;
    sel = parseInt(btn.getAttribute('data-gl'), 10);
    var say = fill(t('live'), sel);
    render();
    var s = mount.querySelector('[data-gl-say]');
    if (s) s.textContent = say;
  });

  /* #compare deep link — unfold the details and bring it into view. */
  function openOnHash() {
    if (location.hash !== '#compare') return;
    var box = document.getElementById('compare');
    if (!box) return;
    var d = box.querySelector('details');
    if (d) d.open = true;
    box.scrollIntoView({ behavior: document.documentElement.classList.contains('rm') ? 'auto' : 'smooth', block: 'start' });
  }
  window.addEventListener('hashchange', openOnHash);

  new MutationObserver(function () { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
  openOnHash();
})();
