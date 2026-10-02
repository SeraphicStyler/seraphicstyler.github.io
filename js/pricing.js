/* Seraphic Styler — every price, in one place.
   ------------------------------------------------------------------------
   The single source of truth for the prices clients see.
     · Read at runtime by the site menu (js/service-guide.js), the individual
       estimator (js/estimator.js, js/estimate-i18n.js), the boutique
       estimator (js/boutique-estimator.js) and the boutique calculator below.
     · /prices and /boutique-calculator are generated from it. After any edit:
         python3 tools/build-prices.py && python3 tools/build-boutique-calc.py
     · tools/verify-pricing.cjs fails when a page drifts from it.
   Everything between the @pricing-data markers must stay strict JSON (double
   quotes, no comments, no trailing commas): the Python builders parse it.

   Currency policy. Individuals: dollars first, đồng in brackets. A "~" marks
   the converted figure: sourcing fees are set in đồng ("~$14 (350,000₫)"),
   styling and The Trace are charged in dollars ("$235 (~5,875,000₫)").
   Boutiques: US dollars only. Đồng are shown at fx.vndPerUsd.

   Load this file before the scripts that read it. On load it only waits for
   the page, then wires up any price modules ([data-price-modules]). */
(function () {
  'use strict';

  var DATA = /*@pricing-data*/{
    "fx": { "vndPerUsd": 25000 },
    "sourcing": {
      "minFeeVnd": 350000,
      "rate": 0.08,
      "highRate": 0.07,
      "highFromVnd": 5000000,
      "orderFeeVnd": 250000,
      "shopsIncluded": 2,
      "extraShopVnd": 150000,
      "rareVnd": 200000,
      "transferPct": 0.03,
      "example": { "itemVnd": 1500000 }
    },
    "trace": { "usd": 25, "credited": true, "replyHours": 48 },
    "styling": [
      { "id": "edit", "name": "The Edit", "totalUsd": 235, "feeUsd": 135, "creditUsd": 100, "what": "3–4 pieces, one focused need" },
      { "id": "capsule", "name": "The Capsule", "totalUsd": 460, "feeUsd": 270, "creditUsd": 190, "what": "6–8 pieces that work together, with a lookbook" },
      { "id": "atelier", "name": "The Atelier", "totalUsd": 600, "feeUsd": 310, "creditUsd": 290, "what": "Consultation plus a shopping session, in Saigon or on live video" },
      { "id": "signature", "name": "The Signature", "totalUsd": 790, "feeUsd": 310, "creditUsd": 480, "what": "Designer pieces and 60 days of support" },
      { "id": "custom-wardrobe", "name": "Custom Wardrobe", "totalUsd": 1500, "feeUsd": 800, "creditUsd": 700, "from": true, "what": "15–20 pieces for several occasions" },
      { "id": "custom-wardrobe-plus", "name": "Custom Wardrobe+", "totalUsd": 2000, "feeUsd": 1100, "creditUsd": null, "from": true, "feeFrom": true, "what": "21–30+ pieces, made-to-measure, quoted for you" }
    ],
    "stylingExample": { "tier": "capsule", "piecesUsd": 250 },
    "group": {
      "fromUsd": 1000,
      "pct": 0.15,
      "rushPct": 0.20,
      "minDistinctUnderUsd": 3000,
      "example": { "label": "8 bridesmaid dresses", "pieces": 8, "eachUsd": 250 }
    },
    "boutique": {
      "scoutUsd": 250,
      "scoutHours": "three to four",
      "pct": 0.15,
      "rushPct": 0.20,
      "perPieceUsd": 14,
      "perBuyUsd": 25,
      "researchUsdPerHour": 45,
      "researchMinHours": 2,
      "defaults": { "budget": 3000, "pieces": 30 }
    },
    "card": { "pct": "5.4%", "fixedUsd": 0.30 },
    "stripe": {
      "trace": "https://buy.stripe.com/00w5kE3nx5RdbIA9rQaAw0a",
      "edit": "https://buy.stripe.com/dRmfZi0bl5RdaEweMaaAw0g",
      "capsule": "https://buy.stripe.com/14A3cwgaj1AX3c40VkaAw0h",
      "atelier": "https://buy.stripe.com/aFaaEYgajbbxdQIdI6aAw0i",
      "signature": "https://buy.stripe.com/bJebJ27DNbbxaEw33saAw0f",
      "scout": "https://buy.stripe.com/aFafZi2jtdjF9AsavUaAw0e"
    },
    "bespokeForm": "https://tally.so/r/gD10Kl?about=I%2520want%2520help%2520sourcing%2520or%2520buying%2520specific%2520items&source=links-sticky&utm_source=ig&utm_medium=social&utm_content=link_in_bio"
  }/*@end*/;

  var FX = DATA.fx.vndPerUsd;

  /* ---- Formatting -------------------------------------------------- */
  function group(n) { return Math.round(Math.abs(n)).toLocaleString('en-US'); }
  function sign(n) { return n < 0 ? '−' : ''; }
  /* Dollars: whole amounts without cents, otherwise two decimals. */
  function usd(n) {
    var c = Math.round(Math.abs(n) * 100) / 100;
    var body = c % 1 ? c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : group(c);
    return sign(n) + '$' + body;
  }
  /* Boutique figures are whole dollars throughout. */
  function usd0(n) { return sign(n) + '$' + group(n); }
  function vnd(n) { return sign(n) + group(n) + '₫'; }
  function pct(p) { return Math.round(p * 100) + '%'; }
  /* Individuals — text, dollars first: "~$14 (350,000₫)" for a đồng fee, "$235 (~5,875,000₫)" for a dollar charge. */
  function fromVnd(v) { return '~' + usd(v / FX) + ' (' + vnd(v) + ')'; }
  function fromUsd(u) { return usd(u) + ' (~' + vnd(u * FX) + ')'; }
  /* The same, as HTML: tabular figures, the bracket a step quieter. */
  function money(primary, alt) {
    return '<span class="money">' + primary + (alt ? ' <span class="money-alt">(' + alt + ')</span>' : '') + '</span>';
  }
  function hVnd(v) { return money('~' + usd(v / FX), vnd(v)); }
  function hUsd(u) { return money(usd(u), '~' + vnd(u * FX)); }
  function hUsdOnly(u) { return money(usd0(u)); }

  /* ---- Rules ------------------------------------------------------- */
  /* Per-item sourcing fee in đồng — same rule as js/estimator.js itemFee(). */
  function itemFeeVnd(priceVnd) {
    var s = DATA.sourcing;
    if (!(priceVnd > 0)) return 0;
    return Math.max(s.minFeeVnd, priceVnd * (priceVnd <= s.highFromVnd ? s.rate : s.highRate));
  }
  /* Where a styling tier is booked: the homepage tier cards (each has its own
     checkout), or, for the custom wardrobes, the bespoke form. */
  function stylingHref(t, home) {
    return t.from ? DATA.bespokeForm : (home ? '#lane-styling' : 'index.html#lane-styling');
  }
  function tier(id) {
    for (var i = 0; i < DATA.styling.length; i++) if (DATA.styling[i].id === id) return DATA.styling[i];
    return null;
  }
  /* A boutique buy: the scouting fee, then the buying fee (15%, or 20% rush),
     floored at $14 a piece and $25 a buy. Paid in three moments. */
  function boutiqueQuote(budget, pieces, rush) {
    var b = DATA.boutique;
    var B = Math.max(0, parseFloat(budget) || 0), P = Math.max(0, parseInt(pieces, 10) || 0);
    var rate = rush ? b.rushPct : b.pct, fee = B * rate, rule = 'pct';
    if (P * b.perPieceUsd > fee) { fee = P * b.perPieceUsd; rule = 'perPiece'; }
    if (B > 0 && fee < b.perBuyUsd) { fee = b.perBuyUsd; rule = 'perBuy'; }
    if (!(B > 0)) { fee = 0; rule = 'none'; }
    return { budget: B, pieces: P, rush: !!rush, rate: rate, fee: fee, rule: rule, scout: b.scoutUsd,
      half: fee / 2, stage2: B + fee / 2, stage3: fee / 2, total: B + b.scoutUsd + fee };
  }

  /* ---- Audience: "For individuals | For boutiques" --------------------
     A per-viewer convenience shared by the menu and /prices. Precedence:
     ?for= deep link, then a boutique page or boutique figures in the URL,
     then the stored choice, then individuals. Works without storage. */
  var KEY = 'ss-audience', LEGACY = 'ss-menu-audience';
  function norm(v) {
    v = String(v || '').toLowerCase();
    return /^boutiques?$/.test(v) ? 'boutique' : /^individuals?$/.test(v) ? 'individual' : null;
  }
  function stored() {
    try { return norm(localStorage.getItem(KEY)) || norm(localStorage.getItem(LEGACY)); } catch (e) { return null; }
  }
  function setAudience(a, quiet) {
    a = norm(a); if (!a) return null;
    try { localStorage.setItem(KEY, a); localStorage.setItem(LEGACY, a); } catch (e) {}
    if (!quiet) window.dispatchEvent(new CustomEvent('ss:audience', { detail: { audience: a } }));
    return a;
  }
  function initialAudience() {
    var q = new URLSearchParams(location.search), asked = norm(q.get('for'));
    if (asked) return setAudience(asked, true);
    if (/boutique/.test(location.pathname) || q.has('budget') || q.has('pieces') || /^#boutiques?$/.test(location.hash)) return setAudience('boutique', true);
    return stored() || 'individual';
  }
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && norm(e.newValue)) window.dispatchEvent(new CustomEvent('ss:audience', { detail: { audience: norm(e.newValue) } }));
  });

  /* ---- Shared markup ------------------------------------------------ */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* The styling table — the same columns on /prices and in the menu.
     tools/pricing_data.py renders the identical table for /prices. */
  function stylingTableHtml(hrefFor) {
    var rows = DATA.styling.map(function (t) {
      var from = t.from ? 'from ' : '';
      var name = hrefFor ? '<a href="' + esc(hrefFor(t)) + '">' + esc(t.name) + '</a>' : esc(t.name);
      return '<tr><th scope="row">' + name + '</th>' +
        '<td class="num" data-l="You pay">' + from + hUsd(t.totalUsd) + '</td>' +
        '<td class="num" data-l="My styling fee">' + (t.feeFrom ? 'from ' : '') + hUsd(t.feeUsd) + '</td>' +
        '<td class="num" data-l="Spent on your clothes">' + (t.creditUsd == null ? 'agreed together' : hUsd(t.creditUsd)) + '</td>' +
        '<td data-l="What you get">' + esc(t.what) + '</td></tr>';
    }).join('');
    return '<table class="price-table"><caption class="sr-only">Styling tiers</caption><thead><tr>' +
      '<th scope="col">Tier</th><th scope="col" class="num">You pay</th><th scope="col" class="num">My styling fee</th>' +
      '<th scope="col" class="num">Spent on your clothes</th><th scope="col">What you get</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }
  /* One line per fact, for compact surfaces such as the menu. */
  function sourcingFacts() {
    var s = DATA.sourcing, from8 = s.minFeeVnd / s.rate;
    return [
      'My fee: ' + hVnd(s.minFeeVnd) + ' per item. Items over ' + hVnd(from8) + ' are ' + pct(s.rate) + ' of the price instead, and items over ' + hVnd(s.highFromVnd) + ' are ' + pct(s.highRate) + '.',
      hVnd(s.orderFeeVnd) + ' per order for packing and coordination, ' + s.shopsIncluded + ' shops included; each extra shop is ' + hVnd(s.extraShopVnd) + '.',
      pct(s.transferPct) + ' currency transfer on the order. Shipping at the courier’s actual cost.',
      'The Trace: ' + hUsd(DATA.trace.usd) + ' per item' + (DATA.trace.credited ? ', taken off your order if you buy it.' : '.')
    ];
  }
  /* The boutique trio — parallel on every surface. */
  function boutiqueTrio() {
    var b = DATA.boutique;
    return [
      { big: usd0(b.scoutUsd), label: 'scouting fee', detail: 'once per round, paid up front to start' },
      { big: pct(b.pct), label: 'buying fee', detail: 'on the pieces you choose (' + pct(b.rushPct) + ' for rush or made-to-measure)' },
      { big: '$0', label: 'markup', detail: 'you pay the designer’s price' }
    ];
  }
  function boutiqueTrioHtml() {
    return '<ul class="fee-trio">' + boutiqueTrio().map(function (f) {
      return '<li><b class="money">' + f.big + '</b><span>' + f.label + '</span><small>' + f.detail + '</small></li>';
    }).join('') + '</ul>';
  }

  /* ---- The boutique calculator -------------------------------------
     One component for /boutique-calculator, the boutiques view of /prices
     and the menu (compact). Pages ship a static fallback inside the mount
     point (generated by the builders); this replaces it with the live one.
     opts: { compact, params (read ?budget/&pieces/&rush), shareBase } */
  function calcHtml(o) {
    var b = DATA.boutique;
    return '<form class="bcalc' + (o.compact ? ' bcalc--compact' : '') + '" novalidate>' +
      '<div class="bcalc-in">' +
        '<label>Budget for pieces (USD)<input type="number" data-bc="budget" min="0" step="50" inputmode="decimal" value="' + b.defaults.budget + '">' +
          (o.compact ? '' : '<small>What the pieces themselves cost</small>') + '</label>' +
        '<label>Number of pieces<input type="number" data-bc="pieces" min="1" step="1" inputmode="numeric" value="' + b.defaults.pieces + '" placeholder="Roughly is fine, e.g. 10 styles × 3"></label>' +
        '<label class="bcalc-rush"><input type="checkbox" data-bc="rush"> Rush timeline or made-to-measure pieces (' + pct(b.rushPct) + ' instead of ' + pct(b.pct) + ')</label>' +
      '</div>' +
      '<div class="bcalc-out" aria-live="polite">' +
        '<h3 class="bcalc-h">Your buy</h3>' +
        '<table class="bcalc-buy"><tbody>' +
          '<tr><th scope="row">Pieces, at the designer’s price</th><td class="num" data-out="pieces"></td></tr>' +
          '<tr><th scope="row">Scouting fee</th><td class="num" data-out="scout"></td></tr>' +
          '<tr><th scope="row" data-out="feeLabel"></th><td class="num" data-out="fee"></td></tr>' +
        '</tbody><tfoot><tr><th scope="row">Total</th><td class="num" data-out="total"></td></tr></tfoot></table>' +
        '<p class="bcalc-note" data-out="note" hidden></p>' +
        '<h3 class="bcalc-h">When you pay</h3>' +
        '<table class="pay-sched"><thead><tr><th scope="col">When</th><th scope="col">You pay</th><th scope="col" class="num">Amount</th></tr></thead><tbody>' +
          '<tr><th scope="row">To start</th><td>Scouting fee</td><td class="num" data-out="s1"></td></tr>' +
          '<tr><th scope="row">Once you’ve chosen your pieces</th><td data-out="s2math"></td><td class="num" data-out="s2"></td></tr>' +
          '<tr><th scope="row">Once every piece is photographed and approved</th><td data-out="s3math"></td><td class="num" data-out="s3"></td></tr>' +
        '</tbody></table>' +
      '</div>' +
      (o.compact
        ? '<p class="bcalc-cta"><a class="bcalc-link" data-out="fullLink" href="boutique-calculator">Open the full calculator ↗</a></p>'
        : '<div class="bcalc-cta"><a class="bcalc-btn" href="' + DATA.stripe.scout + '?client_reference_id=' + esc(o.ref || 'calculator') + '" target="_blank" rel="noopener">Pay the ' + usd0(b.scoutUsd) + ' scouting fee →</a>' +
          '<button type="button" class="bcalc-btn alt" data-out="share">Copy a link to these numbers</button>' +
          '<input class="bcalc-shareurl" data-out="shareUrl" type="text" readonly hidden aria-label="Link to these numbers"></div>') +
    '</form>';
  }
  function mountBoutiqueCalc(root, o) {
    if (!root) return null;
    o = o || {};
    root.innerHTML = calcHtml(o);
    var form = root.querySelector('form');
    var input = function (k) { return form.querySelector('[data-bc="' + k + '"]'); };
    var out = function (k) { return form.querySelector('[data-out="' + k + '"]'); };
    if (o.params !== false) {
      var q = new URLSearchParams(location.search);
      if (q.get('budget') !== null && q.get('budget') !== '') input('budget').value = q.get('budget');
      if (q.get('pieces') !== null && q.get('pieces') !== '') input('pieces').value = q.get('pieces');
      if (q.get('rush') === '1') input('rush').checked = true;
    }
    function query() {
      return 'budget=' + encodeURIComponent(input('budget').value) + '&pieces=' + encodeURIComponent(input('pieces').value) + (input('rush').checked ? '&rush=1' : '');
    }
    function update() {
      var x = boutiqueQuote(input('budget').value, input('pieces').value, input('rush').checked);
      var b = DATA.boutique, note = '';
      if (x.rule === 'perPiece') note = 'The ' + usd0(b.perPieceUsd) + '-per-piece minimum applies here: ' + x.pieces + ' × ' + usd0(b.perPieceUsd) + ' = ' + usd0(x.fee) + ', more than ' + pct(x.rate) + ' of ' + usd0(x.budget) + '.';
      if (x.rule === 'perBuy') note = 'The ' + usd0(b.perBuyUsd) + ' minimum buying fee applies here.';
      out('pieces').innerHTML = hUsdOnly(x.budget);
      out('scout').innerHTML = hUsdOnly(x.scout);
      out('feeLabel').textContent = x.rule === 'perPiece' || x.rule === 'perBuy' ? 'Buying fee, minimum' : 'Buying fee, ' + pct(x.rate);
      out('fee').innerHTML = hUsdOnly(x.fee);
      out('total').innerHTML = hUsdOnly(x.total) + ' + shipping';
      out('note').textContent = note; out('note').hidden = !note;
      out('s1').innerHTML = hUsdOnly(x.scout);
      out('s2math').innerHTML = 'Pieces ' + hUsdOnly(x.budget) + ' + half the buying fee ' + hUsdOnly(x.half);
      out('s2').innerHTML = hUsdOnly(x.stage2);
      out('s3math').innerHTML = 'The other half of the buying fee ' + hUsdOnly(x.half) + ' + shipping at cost';
      out('s3').innerHTML = hUsdOnly(x.stage3) + ' + shipping';
      if (out('fullLink')) out('fullLink').setAttribute('href', (o.fullBase || 'boutique-calculator') + '?' + query());
      if (o.onChange) o.onChange(x, query());
    }
    ['budget', 'pieces', 'rush'].forEach(function (k) {
      input(k).addEventListener('input', update); input(k).addEventListener('change', update);
    });
    var share = out('share');
    if (share) share.addEventListener('click', function () {
      var base = o.shareBase || location.pathname.replace(/\.html$/, '');
      var url = location.origin + base + '?' + (o.shareFor ? 'for=boutiques&' : '') + query();
      var field = out('shareUrl');
      function shown() { field.value = url; field.hidden = false; field.focus(); field.select(); }
      function copied() { share.textContent = 'Link copied'; setTimeout(function () { share.textContent = 'Copy a link to these numbers'; }, 2200); }
      try { navigator.clipboard.writeText(url).then(copied, shown); } catch (e) { shown(); }
    });
    update();
    return { update: update, form: form };
  }

  /* ---- Segmented control with tab semantics (/prices) --------------- */
  function tabs(list, onSelect) {
    var items = [].slice.call(list.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      items.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab.dataset.aud);
    }
    items.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? items[(i + 1) % items.length]
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? items[(i - 1 + items.length) % items.length]
          : e.key === 'Home' ? items[0] : e.key === 'End' ? items[items.length - 1] : null;
        if (to) { e.preventDefault(); select(to, true); }
      });
    });
    return function (aud) { items.forEach(function (t) { var on = t.dataset.aud === aud; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; }); };
  }

  /* ---- /prices page ------------------------------------------------- */
  function initPricesPage() {
    var root = document.documentElement, list = document.querySelector('.aud-switch[role="tablist"]');
    var panels = { individual: document.getElementById('view-individuals'), boutique: document.getElementById('view-boutiques') };
    var nav = document.querySelector('.pr-secnav');
    if (!list || !panels.individual || !panels.boutique) return;
    root.classList.add('pr-js');
    mountBoutiqueCalc(document.getElementById('prices-calc'), { ref: 'prices-page', shareBase: location.pathname.replace(/\.html$/, ''), shareFor: true, fullBase: 'boutique-calculator' });
    var current = null;
    function show(aud, opts) {
      aud = norm(aud) || 'individual';
      panels.individual.hidden = aud !== 'individual';
      panels.boutique.hidden = aud !== 'boutique';
      if (nav) nav.hidden = aud !== 'individual';
      document.body.dataset.audience = aud;
      mark(aud);
      if (current !== aud && opts && opts.scroll) document.querySelector('.pr-bar').scrollIntoView({ block: 'start', behavior: 'instant' });
      current = aud;
    }
    var mark = tabs(list, function (aud) { setAudience(aud); show(aud); });
    /* Links that jump between the views: "Buying for a store?" and the nav's Boutiques item. */
    document.addEventListener('click', function (e) {
      var go = e.target.closest('[data-aud-go]');
      if (!go) return;
      e.preventDefault(); setAudience(go.dataset.audGo); show(go.dataset.audGo, { scroll: true });
      var tab = list.querySelector('[data-aud="' + norm(go.dataset.audGo) + '"]'); if (tab) tab.focus({ preventScroll: true });
    });
    window.addEventListener('ss:audience', function (e) { show(e.detail.audience); });
    var first = initialAudience();
    /* Old anchors keep working: #boutique opens the boutiques view; the
       former gift section now lives inside Styling. */
    show(first);
    if (first === 'individual' && location.hash) {
      var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView({ block: 'start' });
    }
    /* Scrollspy: the section nav marks where you are. */
    if (nav && 'IntersectionObserver' in window) {
      var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
      var seen = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
        var best = null;
        links.forEach(function (a) { var id = a.hash.slice(1); if (seen[id] > 0 && (best === null || seen[id] > seen[best])) best = id; });
        if (best) links.forEach(function (a) { if (a.hash.slice(1) === best) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] });
      links.forEach(function (a) { var s = document.getElementById(a.hash.slice(1)); if (s) io.observe(s); });
    }
  }

  /* ---- Price modules (homepage #prices) -------------------------------
     Cards are tabs; one panel shows at a time. Without JavaScript every
     panel stays visible under the cards. Links to a panel (#pm-group) open
     its card, including from the dividers above. */
  function initModules(root) {
    var cards = [].slice.call(root.querySelectorAll('.pm-cards [role="tab"]'));
    if (!cards.length) return;
    var panel = function (t) { return document.getElementById(t.getAttribute('aria-controls')); };
    function select(t, focus) {
      cards.forEach(function (c) {
        var on = c === t;
        c.setAttribute('aria-selected', String(on)); c.tabIndex = on ? 0 : -1; panel(c).hidden = !on;
      });
      if (focus) t.focus();
    }
    function cardFor(id) { return cards.filter(function (c) { return c.getAttribute('aria-controls') === id; })[0] || null; }
    cards.forEach(function (c, i) {
      c.addEventListener('click', function () {
        select(c, false);
        /* On a phone the panel sits below all four cards: bring it into view. */
        if (matchMedia('(max-width: 700px)').matches) panel(c).scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
      c.addEventListener('keydown', function (e) {
        var to = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? cards[(i + 1) % cards.length]
          : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? cards[(i - 1 + cards.length) % cards.length]
          : e.key === 'Home' ? cards[0] : e.key === 'End' ? cards[cards.length - 1] : null;
        if (to) { e.preventDefault(); select(to, true); }
      });
    });
    /* Capture phase: open the card before any smooth-scroll handler looks for the target. */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#pm-"]');
      var t = a && cardFor(a.hash.slice(1));
      if (t) select(t, false);
    }, true);
    window.addEventListener('hashchange', function () { var t = cardFor(location.hash.slice(1)); if (t) select(t, false); });
    root.classList.add('pm-js');
    select(cardFor(location.hash.slice(1)) || cards[0], false);
  }
  function initAllModules() { [].forEach.call(document.querySelectorAll('[data-price-modules]'), initModules); }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAllModules);
    else initAllModules();
  }

  /* ---- /boutique-calculator page ------------------------------------ */
  function initCalculatorPage() {
    setAudience('boutique', true);
    mountBoutiqueCalc(document.getElementById('bcalc-page'), { ref: 'boutique-calculator', shareBase: location.pathname.replace(/\.html$/, '') });
  }

  window.SS_PRICING = {
    data: DATA,
    fmt: { usd: usd, usd0: usd0, vnd: vnd, pct: pct, fromVnd: fromVnd, fromUsd: fromUsd, hVnd: hVnd, hUsd: hUsd, hUsdOnly: hUsdOnly },
    itemFeeVnd: itemFeeVnd,
    tier: tier,
    stylingHref: stylingHref,
    boutiqueQuote: boutiqueQuote,
    audience: { initial: initialAudience, set: setAudience, stored: stored, norm: norm },
    html: { stylingTable: stylingTableHtml, sourcingFacts: sourcingFacts, boutiqueTrio: boutiqueTrioHtml },
    boutiqueTrio: boutiqueTrio,
    mountBoutiqueCalc: mountBoutiqueCalc,
    initPricesPage: initPricesPage,
    initModules: initModules,
    initCalculatorPage: initCalculatorPage
  };
})();
