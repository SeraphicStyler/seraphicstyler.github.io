/* Seraphic Styler — directory shopping basket (fd-basket.js)
   ----------------------------------------------------------------------
   Customers collect pieces while browsing the directory: each entry is a
   link + the store it comes from + a price they type themselves (prices
   aren't in the data and can't be scraped). The basket tallies VND + USD,
   previews the service fee using the estimator's own CONFIG, and runs the
   route solver over the basket's stores to call the trip "a simple run"
   or "a proper hunt" — the hunt is what the +200,000₫ complex-sourcing
   fee covers, so the verdict auto-applies it and says why.
   Self-injecting widget in the route-panel.js mold: own <style>, own DOM,
   themed entirely off the page's CSS variables (dark mode for free).
   Exposes window.SS_BASKET = { has, addOrOpen, open, close, count }.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_BASKET) return;

  var BK = {
    LS: 'fd-basket',                    /* 'ss-basket' belongs to the estimator page */
    TRIP: {                             /* simple-vs-complicated thresholds — tune freely */
      simpleMaxStores: 2,               /* more physical stores than this → complicated  */
      simpleMaxDistricts: 1,            /* more districts than this → complicated        */
      simpleMaxKm: 6,                   /* optimized route longer → complicated          */
      simpleMaxMin: 150,                /* door-to-done incl. browsing → complicated     */
      complexNonRouteable: 2,           /* ≥ this many online/appt/custom stores → complicated */
      dwellMin: 25, mode: 'bike', startMin: 540,
      origin: { n: 'Bến Thành Market', lat: 10.7723, lng: 106.6980 }
    },
    FARE_BAND: [0.85, 1.3],             /* Grab fares vary — show a range, not a quote */
    DEBOUNCE: 300, TOAST_MS: 2400
  };

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(key, en) { return window.SS_T ? window.SS_T(key, en) : en; }
  function fmtVnd(n) { return Math.round(n).toLocaleString('en-US') + '₫'; }
  function fmtUsd(v) { return v >= 20 ? '$' + Math.round(v).toLocaleString('en-US') : '$' + v.toFixed(2); }
  function bid(b) { return b.h || b.n; }
  function uid() { return 'bk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function httpUrl(u) { return /^https?:\/\//i.test(u || ''); }
  function debounce(fn, ms) { var h; return function () { clearTimeout(h); h = setTimeout(fn, ms); }; }

  var DIR = window.SS_DIRECTORY || [];
  var byId = {};
  DIR.forEach(function (b) { var k = bid(b); if (!(k in byId)) byId[k] = b; }); /* same-name twins keep the first door */

  /* ---------- state ---------- */
  var items = load();
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(BK.LS) || 'null');
      if (d && d.v === 1 && Array.isArray(d.items)) return d.items;
    } catch (e) {}
    return [];
  }
  function save() { try { localStorage.setItem(BK.LS, JSON.stringify({ v: 1, items: items })); } catch (e) {} }

  /* ---------- price parsing (VND-first, shorthand-friendly) ---------- */
  function parsePrice(raw) {
    if (raw == null) return null;
    var s = String(raw).toLowerCase().replace(/vnd|[₫đ]/g, '').replace(/\s+/g, '');
    if (!s) return null;
    var mult = 1;
    if (/tr$/.test(s)) { mult = 1e6; s = s.slice(0, -2); }          /* 1.2tr = 1,200,000 (triệu) */
    else if (/m$/.test(s)) { mult = 1e6; s = s.slice(0, -1); }      /* 1.2m                       */
    else if (/k$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }      /* 350k                       */
    var n;
    if (mult > 1) { n = parseFloat(s.replace(',', '.')); }          /* "1,2m" and "1.2m" both work */
    else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) { n = parseInt(s.replace(/[.,]/g, ''), 10); } /* 1,200,000 / 1.200.000 */
    else if (/^\d+([.,]\d+)?$/.test(s)) { n = parseFloat(s.replace(',', '.')); }
    else return null;
    if (isNaN(n) || n <= 0) return null;
    var v = n * mult;
    if (mult === 1 && v <= 9999) v = v * 1000;                      /* bare "350" reads as thousands — echoed to the user */
    return Math.round(v);
  }

  /* ---------- FX (estimator's approach; never the solver's stale 24500) ---------- */
  function cfg() { return window.CONFIG || null; }
  var fxRate = (cfg() && cfg().fx && cfg().fx.fallbackVndPerUsd) || 26300, fxLive = false, fxTried = false;
  function loadFx() {
    if (fxTried) return; fxTried = true;
    try {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.rates && d.rates.VND) { fxRate = d.rates.VND; fxLive = true; renderTotals(); } })
        .catch(function () {});
    } catch (e) {}
  }
  function toUsd(vnd) {
    var spread = (cfg() && cfg().fx && cfg().fx.spread) || 0.015;
    return vnd / (fxRate * (1 - spread));
  }

  /* ---------- fees (mirrors estimator.js itemFee, reads live CONFIG) ---------- */
  function itemFee(p) {
    var C = cfg(); if (!C || !C.fee || !(p > 0)) return 0;
    var f = C.fee;
    if (p < f.flatThreshold) return f.flatFee;
    if (p <= f.midThreshold) return p * f.midRate;
    return p * f.highRate;
  }

  /* ---------- trip classification ---------- */
  var ZONELABEL = { d1: 'District 1', d3: 'District 3', pn: 'Phú Nhuận', bt: 'Bình Thạnh', td: 'Thảo Điền', q5: 'Q5 · Chợ Lớn', gv: 'Gò Vấp', tb: 'Tân Bình', tp: 'Tân Phú', other: 'Saigon' };
  function zoneOf(b) { return (window.SS_FD && window.SS_FD.zoneOf) ? window.SS_FD.zoneOf(b) : null; }

  var tripCache = { sig: null, plan: null };
  function classify() {
    var seen = {}, brands = [], customs = {};
    items.forEach(function (it) {
      if (it.brandId) { if (!seen[it.brandId]) { seen[it.brandId] = 1; if (byId[it.brandId]) brands.push(byId[it.brandId]); } }
      else if (it.brandName) customs[it.brandName] = 1;
    });
    var CO = window.SS_COORDS || {};
    var phys = brands.filter(function (b) { return CO[b.n]; });
    var nonR = (brands.length - phys.length) + Object.keys(customs).length;
    var zones = {};
    phys.forEach(function (b) { var z = zoneOf(b); if (z) zones[z] = 1; });
    var districts = Object.keys(zones).length;

    var plan = null;
    if (phys.length >= 2 && window.SS_ROUTE) {
      var sig = phys.map(function (b) { return b.n; }).sort().join('|');
      if (tripCache.sig === sig) plan = tripCache.plan;
      else {
        try {
          var o = BK.TRIP.origin;
          var stops = [{ n: o.n, lat: o.lat, lng: o.lng, isHub: true }].concat(phys.map(function (b) {
            var c = CO[b.n]; return { n: b.n, area: b.area, lat: c.lat, lng: c.lng, hours: c.hours, approx: c.approx };
          }));
          plan = window.SS_ROUTE.solve(stops, { mode: BK.TRIP.mode, startMin: BK.TRIP.startMin, roundTrip: false, dwellMin: BK.TRIP.dwellMin, originIsStop: false });
        } catch (e) { plan = null; }
        tripCache = { sig: sig, plan: plan };
      }
    }

    var reasons = [];
    if (phys.length > BK.TRIP.simpleMaxStores) reasons.push(phys.length + ' ' + t('fd.bk.rStores', 'stores'));
    if (districts > BK.TRIP.simpleMaxDistricts) reasons.push(districts + ' ' + t('fd.bk.rDistricts', 'districts'));
    if (plan && plan.totalKm > BK.TRIP.simpleMaxKm) reasons.push('~' + Math.round(plan.totalKm) + ' km');
    if (plan && plan.totalMin > BK.TRIP.simpleMaxMin) reasons.push(plan.durationText);
    if (nonR >= BK.TRIP.complexNonRouteable) reasons.push(nonR + ' ' + t('fd.bk.rCoord', 'to coordinate'));
    if (plan && plan.window && plan.window.violations && plan.window.violations.length) reasons.push(t('fd.bk.rHours', 'opening-hours juggling'));

    return { complicated: reasons.length > 0, reasons: reasons, plan: plan, phys: phys, districts: districts, zones: zones, nonR: nonR, brands: brands };
  }

  /* ---------- style + skeleton ---------- */
  var css = '' +
    '.bk-scrim{position:fixed;inset:0;z-index:62;background:rgba(20,28,54,.44);backdrop-filter:blur(3px);opacity:0;transition:opacity .28s;}' +
    '.bk-scrim.open{opacity:1;}' +
    '.bk-panel{position:fixed;top:0;right:0;bottom:0;z-index:63;width:min(410px,94vw);display:flex;flex-direction:column;' +
      'background:var(--paper);border-left:1px solid var(--line);box-shadow:var(--shadow);transform:translateX(103%);transition:transform .32s var(--ease);}' +
    '.bk-panel.open{transform:none;}' +
    '.bk-head{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid var(--line);}' +
    '.bk-head h2{font-family:var(--font-display);font-size:1.15rem;color:var(--ink);margin:0;flex:1;}' +
    '.bk-n{color:var(--ink-mute);font-size:.9rem;font-weight:400;}' +
    '.bk-close{font:inherit;background:none;border:0;cursor:pointer;color:var(--ink-mute);font-size:1.05rem;padding:6px 9px;border-radius:50%;}' +
    '.bk-close:hover{color:var(--ink);background:var(--ice);}' +
    '.bk-grab{display:none;}' +
    '.bk-body{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:14px;}' +
    '.bk-empty{color:var(--ink-mute);font-size:.9rem;padding:18px 4px;line-height:1.55;}' +
    '.bk-group{border:1px solid var(--line);border-radius:14px;background:var(--card-solid);padding:10px 12px;display:flex;flex-direction:column;gap:8px;}' +
    '.bk-ghead{display:flex;align-items:baseline;gap:8px;}' +
    '.bk-ghead a,.bk-ghead b{font-size:.95rem;color:var(--ink);text-decoration:none;font-weight:600;flex:1;min-width:0;overflow-wrap:break-word;}' +
    '.bk-ghead a:hover{color:var(--cobalt);}' +
    '.bk-gadd{font:inherit;font-size:.72rem;background:none;border:1px solid var(--line);border-radius:999px;padding:2px 9px;cursor:pointer;color:var(--ink-soft);}' +
    '.bk-gadd:hover{color:var(--cobalt);border-color:var(--cobalt);}' +
    '.bk-gsub{font-size:.8rem;color:var(--ink-soft);white-space:nowrap;}' +
    '.bk-item{display:grid;grid-template-columns:1fr auto;gap:6px 8px;align-items:center;}' +
    '.bk-item input{font:inherit;font-size:.83rem;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:9px;padding:6px 9px;width:100%;min-width:0;}' +
    '.bk-item input:focus{outline:2px solid color-mix(in srgb,var(--cobalt) 40%,transparent);outline-offset:1px;}' +
    '.bk-item .bk-title,.bk-item .bk-link{grid-column:1 / -1;}' +
    '.bk-parsed{font-size:.72rem;color:var(--ink-mute);grid-column:1 / -1;min-height:1em;}' +
    '.bk-parsed.bad{color:var(--warn,#b4762a);}' +
    '.bk-del{font:inherit;background:none;border:0;cursor:pointer;color:var(--ink-mute);padding:5px 8px;border-radius:50%;}' +
    '.bk-del:hover{color:var(--orchid);}' +
    '.bk-custom summary{cursor:pointer;font-size:.85rem;color:var(--cobalt);}' +
    '.bk-custom .bk-cform{display:flex;flex-direction:column;gap:6px;margin-top:8px;}' +
    '.bk-custom input{font:inherit;font-size:.83rem;border:1px solid var(--line);border-radius:9px;padding:6px 9px;background:var(--paper);color:var(--ink);}' +
    '.bk-c-add{font:inherit;font-size:.8rem;align-self:flex-start;border:1px solid var(--cobalt);color:var(--cobalt);background:none;border-radius:999px;padding:4px 14px;cursor:pointer;}' +
    '.bk-trip{border:1px solid var(--line);border-radius:14px;padding:11px 13px;background:var(--ice);display:flex;flex-direction:column;gap:6px;}' +
    '.bk-trip h3{margin:0;font-size:.95rem;color:var(--ink);font-family:var(--font-display);}' +
    '.bk-trip.hunt h3{color:var(--cobalt);}' +
    '.bk-trip p{margin:0;font-size:.81rem;color:var(--ink-soft);line-height:1.5;}' +
    '.bk-stats{display:flex;flex-wrap:wrap;gap:5px 12px;font-size:.75rem;color:var(--ink-mute);}' +
    '.bk-plan{font:inherit;font-size:.82rem;background:none;border:0;color:var(--cobalt);cursor:pointer;padding:0;text-align:left;font-weight:600;}' +
    '.bk-plan:hover{text-decoration:underline;}' +
    '.bk-fees{display:flex;flex-direction:column;gap:4px;font-size:.84rem;color:var(--ink);}' +
    '.bk-fees .r{display:flex;justify-content:space-between;gap:10px;}' +
    '.bk-fees .r span:first-child{color:var(--ink-soft);}' +
    '.bk-fees .r.total{border-top:1px solid var(--line);padding-top:6px;margin-top:3px;font-weight:600;}' +
    '.bk-fees .r.usd,.bk-fees .r.note{font-size:.74rem;color:var(--ink-mute);font-weight:400;}' +
    '.bk-fees .r.note{display:block;}' +
    '.bk-foot{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px calc(14px + env(safe-area-inset-bottom));border-top:1px solid var(--line);}' +
    '.bk-foot .bk-est{grid-column:1 / -1;text-align:center;background:var(--cobalt);color:#fff;border-radius:999px;padding:10px 14px;text-decoration:none;font-size:.9rem;font-weight:600;}' +
    '.bk-foot .bk-est:hover{background:var(--accent-hover,#234193);}' +
    '.bk-foot button{font:inherit;font-size:.8rem;border:1px solid var(--line);background:none;border-radius:999px;padding:7px 10px;cursor:pointer;color:var(--ink-soft);}' +
    '.bk-foot button:hover{color:var(--cobalt);border-color:var(--cobalt);}' +
    '.bk-foot .bk-send{grid-column:1 / -1;border-color:var(--cobalt);color:var(--cobalt);font-weight:600;}' +
    '.bk-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:70;background:var(--ink);color:var(--paper);' +
      'font-size:.83rem;padding:9px 16px;border-radius:999px;box-shadow:var(--shadow);opacity:0;transition:opacity .25s;pointer-events:none;max-width:88vw;text-align:center;}' +
    '.bk-toast.show{opacity:1;}' +
    '@keyframes bkPulse{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}' +
    '#basketcount.pulse,#tbbasketn.pulse{animation:bkPulse .5s var(--ease);display:inline-block;}' +
    '@media(max-width:720px){' +
      '.bk-panel{top:auto;left:0;right:0;bottom:0;width:auto;max-height:82vh;border-left:0;border-top:1px solid var(--line);' +
        'border-radius:18px 18px 0 0;transform:translateY(103%);}' +
      '.bk-panel.open{transform:none;}' +
      '.bk-grab{display:grid;place-items:center;padding:7px 0 0;}' +
      '.bk-grab span{width:38px;height:4px;border-radius:99px;background:var(--line);display:block;}' +
      '.bk-toast{bottom:calc(var(--tabbar-h,58px) + 14px);}' +
    '}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var scrim = document.createElement('div'); scrim.className = 'bk-scrim'; scrim.hidden = true;
  var panel = document.createElement('aside');
  panel.className = 'bk-panel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'bktitle');
  var toast = document.createElement('div'); toast.className = 'bk-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); toast.hidden = true;
  document.body.appendChild(scrim); document.body.appendChild(panel); document.body.appendChild(toast);

  /* ---------- rendering ---------- */
  function skeleton() {
    panel.innerHTML =
      '<div class="bk-grab" aria-hidden="true"><span></span></div>' +
      '<div class="bk-head"><h2 id="bktitle">' + esc(t('fd.bk.title', 'Basket')) + ' <span class="bk-n"></span></h2>' +
      '<button class="bk-close" aria-label="' + esc(t('fd.bk.close', 'Close basket')) + '">✕</button></div>' +
      '<div class="bk-body">' +
        '<div class="bk-empty" hidden>' + esc(t('fd.bk.empty', 'Nothing in the basket yet — tap the bag on any house, or add a link from anywhere below.')) + '</div>' +
        '<div class="bk-groups"></div>' +
        '<details class="bk-custom"><summary>' + esc(t('fd.bk.custom', '+ Add from another store')) + '</summary>' +
          '<div class="bk-cform">' +
            '<input class="bk-c-store" placeholder="' + esc(t('fd.bk.cStore', 'Store or brand')) + '">' +
            '<input class="bk-c-link" type="url" placeholder="' + esc(t('fd.bk.cLink', 'Link (optional)')) + '">' +
            '<input class="bk-c-price" inputmode="numeric" placeholder="' + esc(t('fd.bk.cPrice', 'Price — 350k, 1.2m…')) + '">' +
            '<button class="bk-c-add" type="button">' + esc(t('fd.bk.cAdd', 'Add')) + '</button>' +
          '</div></details>' +
        '<div class="bk-trip" hidden></div>' +
        '<div class="bk-fees" hidden></div>' +
      '</div>' +
      '<div class="bk-foot">' +
        '<a class="bk-est" href="estimate">' + esc(t('fd.bk.est', 'Get the full estimate →')) + '</a>' +
        '<button class="bk-send" type="button">' + esc(t('fd.bk.send', 'Send this list to Seraphic Styler')) + '</button>' +
        '<button class="bk-copy" type="button">' + esc(t('fd.bk.copy', 'Copy')) + '</button>' +
        '<button class="bk-clear" type="button">' + esc(t('fd.bk.clear', 'Clear')) + '</button>' +
      '</div>';
    bindPanel();
  }

  function groupItems() {
    var order = [], map = {};
    items.forEach(function (it) {
      var key = it.brandId || '~' + it.brandName;
      if (!map[key]) { map[key] = { key: key, brandId: it.brandId, name: it.brandName, rows: [] }; order.push(map[key]); }
      map[key].rows.push(it);
    });
    return order;
  }

  function renderGroups() {
    var wrap = panel.querySelector('.bk-groups');
    var groups = groupItems();
    panel.querySelector('.bk-empty').hidden = items.length > 0;
    wrap.innerHTML = groups.map(function (g) {
      var head = g.brandId && byId[g.brandId]
        ? '<a href="#q=' + encodeURIComponent(g.name) + '">' + esc(g.name) + '</a>'
        : '<b>' + esc(g.name) + '</b>';
      return '<section class="bk-group" data-key="' + esc(g.key) + '">' +
        '<div class="bk-ghead">' + head +
          '<button class="bk-gadd" type="button" data-key="' + esc(g.key) + '">' + esc(t('fd.bk.addItem', '+ item')) + '</button>' +
          '<span class="bk-gsub" data-key="' + esc(g.key) + '"></span></div>' +
        g.rows.map(function (it) {
          return '<div class="bk-item" data-id="' + esc(it.id) + '">' +
            '<input class="bk-title" value="' + esc(it.title) + '" placeholder="' + esc(t('fd.bk.what', 'What is it? (optional)')) + '">' +
            '<input class="bk-link" type="url" value="' + esc(it.link) + '" placeholder="' + esc(t('fd.bk.link', 'Product link')) + '">' +
            '<div style="display:flex;gap:6px;align-items:center;grid-column:1 / -1;">' +
              '<input class="bk-price" inputmode="numeric" value="' + (it.priceVnd ? esc(String(it.priceVnd)) : '') + '" placeholder="' + esc(t('fd.bk.price', 'Price — 350k, 1.2m, 1,200,000')) + '" style="flex:1">' +
              '<button class="bk-del" type="button" aria-label="' + esc(t('fd.bk.remove', 'Remove')) + '" data-id="' + esc(it.id) + '">✕</button>' +
            '</div>' +
            '<span class="bk-parsed"></span>' +
          '</div>';
        }).join('') +
      '</section>';
    }).join('');
    /* seed the parsed echoes */
    wrap.querySelectorAll('.bk-item').forEach(function (row) { echoParsed(row, false); });
  }

  function echoParsed(row, changed) {
    var id = row.dataset.id, it = itemById(id); if (!it) return;
    var el = row.querySelector('.bk-parsed'), input = row.querySelector('.bk-price');
    var raw = input.value.trim();
    if (!raw) { el.textContent = ''; el.classList.remove('bad'); if (changed) it.priceVnd = null; return; }
    var v = parsePrice(raw);
    if (changed) it.priceVnd = v;
    if (v == null) { el.textContent = t('fd.bk.badPrice', "Couldn't read that price — it won't count toward the total."); el.classList.add('bad'); }
    else { el.textContent = '= ' + fmtVnd(v); el.classList.remove('bad'); }
  }

  function itemById(id) { for (var i = 0; i < items.length; i++) if (items[i].id === id) return items[i]; return null; }

  function renderTotals() {
    if (!panel.firstChild) return;
    var priced = items.filter(function (it) { return it.priceVnd > 0; });
    var unpriced = items.length - priced.length;
    var subtotal = priced.reduce(function (a, it) { return a + it.priceVnd; }, 0);

    /* per-store subtotals */
    groupItems().forEach(function (g) {
      var el = panel.querySelector('.bk-gsub[data-key="' + CSS.escape(g.key) + '"]');
      if (!el) return;
      var s = g.rows.reduce(function (a, it) { return a + (it.priceVnd || 0); }, 0);
      el.textContent = s ? fmtVnd(s) : '';
    });

    var v = classify();

    /* trip card */
    var trip = panel.querySelector('.bk-trip');
    var stores = v.phys.length + v.nonR;
    if (!items.length || stores === 0) { trip.hidden = true; }
    else {
      trip.hidden = false;
      trip.classList.toggle('hunt', v.complicated);
      var html = '';
      if (v.complicated) {
        var extra = v.nonR ? t('fd.bk.plusCoord', ', plus ') + v.nonR + t('fd.bk.coordTail', ' online or appointment-only house(s) to coordinate') : '';
        var span = v.plan ? t('fd.bk.about', ' — about ') + '~' + Math.round(v.plan.totalKm) + ' km' + t('fd.bk.and', ' and ') + v.plan.durationText + t('fd.bk.d2d', ' door-to-done') : '';
        html += '<h3>' + esc(t('fd.bk.hunt', 'A proper hunt')) + '</h3>' +
          '<p>' + v.phys.length + ' ' + esc(t('fd.bk.stores', 'stores')) + (v.districts ? ' ' + esc(t('fd.bk.across', 'across')) + ' ' + v.districts + ' ' + esc(t('fd.bk.districts', 'district(s)')) : '') +
          esc(span) + esc(extra) + '. ' +
          esc(t('fd.bk.huntWhy', 'Multi-store hunts across the city are exactly what the +200,000₫ complex-sourcing fee covers; it’s included in the preview below.')) + '</p>';
      } else {
        var zoneKeys = Object.keys(v.zones);
        var where = zoneKeys.length === 1 ? (ZONELABEL[zoneKeys[0]] || 'Saigon') : 'Saigon';
        html += '<h3>' + esc(t('fd.bk.simple', 'A simple run')) + '</h3>' +
          '<p>' + stores + ' ' + esc(t('fd.bk.stops', 'stop(s)')) + ' ' + esc(t('fd.bk.in', 'in')) + ' ' + esc(where) + '. ' +
          esc(t('fd.bk.simpleWhy', 'This fits a standard sourcing trip — the +200,000₫ complex-sourcing surcharge doesn’t apply.')) + '</p>';
      }
      if (v.plan) {
        html += '<div class="bk-stats"><span>' + v.phys.length + ' ' + esc(t('fd.bk.stops2', 'stops')) + '</span>' +
          '<span>' + v.districts + ' ' + esc(t('fd.bk.districts2', 'district(s)')) + '</span>' +
          '<span>~' + Math.round(v.plan.totalKm) + ' km</span><span>' + esc(v.plan.durationText) + '</span></div>';
        var lo = Math.round(v.plan.cost.vnd * BK.FARE_BAND[0] / 5000) * 5000;
        var hi = Math.round(v.plan.cost.vnd * BK.FARE_BAND[1] / 5000) * 5000;
        if (hi > 0) html += '<p>' + esc(t('fd.bk.fare', 'Getting around: roughly ')) + fmtVnd(lo) + '–' + fmtVnd(hi) + esc(t('fd.bk.fareTail', ' in Grab rides (varies with traffic and surge).')) + '</p>';
        html += '<button class="bk-plan" type="button">' + esc(t('fd.bk.planTrip', 'Plan this trip →')) + '</button>';
      } else if (v.phys.length === 1) {
        html += '<div class="bk-stats"><span>1 ' + esc(t('fd.bk.stop1', 'store to visit')) + '</span>' + (v.nonR ? '<span>' + v.nonR + ' ' + esc(t('fd.bk.online1', 'online/appointment')) + '</span>' : '') + '</div>';
      }
      trip.innerHTML = html;
      var pb = trip.querySelector('.bk-plan');
      if (pb) pb.addEventListener('click', function () {
        close();
        if (location.hash === '#route=basket') { try { window.dispatchEvent(new HashChangeEvent('hashchange')); } catch (e) { location.hash = '#route'; } }
        else location.hash = '#route=basket';
      });
    }

    /* fee rows */
    var fees = panel.querySelector('.bk-fees');
    if (!items.length) { fees.hidden = true; }
    else {
      fees.hidden = false;
      var C = cfg();
      var rows = '<div class="r"><span>' + esc(t('fd.bk.subtotal', 'Items subtotal')) + (unpriced ? ' <em>(' + unpriced + ' ' + esc(t('fd.bk.unpriced', 'unpriced')) + ')</em>' : '') + '</span><b>' + fmtVnd(subtotal) + '</b></div>';
      if (C && C.fee && subtotal > 0) {
        var svc = priced.reduce(function (a, it) { return a + itemFee(it.priceVnd); }, 0);
        var complexFee = v.complicated ? C.complexFee : 0;
        var total = subtotal + svc + C.baseFee + complexFee;
        rows += '<div class="r"><span>' + esc(t('fd.bk.service', 'Service fee')) + '</span><b>' + fmtVnd(svc) + '</b></div>' +
          '<div class="r"><span>' + esc(t('fd.bk.base', 'Base fee')) + '</span><b>' + fmtVnd(C.baseFee) + '</b></div>' +
          '<div class="r"><span>' + esc(t('fd.bk.complex', 'Complex sourcing')) + '</span><b>' +
            (complexFee ? '+' + fmtVnd(complexFee) + ' <em style="font-weight:400">(' + esc(t('fd.bk.auto', 'auto')) + ': ' + esc(v.reasons.join(' / ')) + ')</em>'
                        : '0₫ — ' + esc(t('fd.bk.notNeeded', 'not needed for a simple run'))) + '</b></div>' +
          '<div class="r total"><span>' + esc(t('fd.bk.total', 'Total before shipping')) + '</span><b>' + fmtVnd(total) + '</b></div>' +
          '<div class="r usd"><span>' + (fxLive ? esc(t('fd.bk.live', 'Live rate')) : esc(t('fd.bk.offline', 'Offline estimate'))) + '</span><b>≈ ' + fmtUsd(toUsd(total)) + '</b></div>';
      }
      rows += '<div class="r note">' + esc(t('fd.bk.honest', 'An estimate, not a quote — shipping and the final number live on the estimate page.')) + '</div>';
      fees.innerHTML = rows;
    }

    renderCounts();
  }

  /* counts + card-bag sync — safe to run even before the panel ever opens */
  function renderCounts() {
    var n = items.length;
    var bn = panel.querySelector('.bk-n'); if (bn) bn.textContent = n ? '(' + n + ')' : '';
    var uc = document.getElementById('basketcount'); if (uc) uc.textContent = n ? '(' + n + ')' : '';
    var tb = document.getElementById('tbbasketn'); if (tb) { tb.hidden = !n; tb.textContent = n; }
    syncCardButtons();
  }

  function pulseCounts() {
    ['basketcount', 'tbbasketn'].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    });
  }

  function syncCardButtons() {
    document.querySelectorAll('.card .bk').forEach(function (btn) {
      var on = has(btn.dataset.id);
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
    });
  }

  function renderAll() { skeleton(); renderGroups(); renderTotals(); }

  /* ---------- summary text ---------- */
  function summaryText() {
    var lines = [t('fd.bk.sumHead', 'Seraphic Styler — basket sourcing request')], i = 1;
    groupItems().forEach(function (g) {
      g.rows.forEach(function (it) {
        lines.push(i + '. ' + g.name + (it.title ? ' — ' + it.title : '') + (it.priceVnd ? ' — ' + fmtVnd(it.priceVnd) : ' — (no price yet)') + (httpUrl(it.link) ? ' — ' + it.link : ''));
        i++;
      });
    });
    var priced = items.filter(function (it) { return it.priceVnd > 0; });
    var subtotal = priced.reduce(function (a, it) { return a + it.priceVnd; }, 0);
    var v = classify(), C = cfg();
    lines.push('');
    lines.push(t('fd.bk.sumSub', 'Items subtotal: ') + fmtVnd(subtotal));
    if (C && C.fee && subtotal > 0) {
      var svc = priced.reduce(function (a, it) { return a + itemFee(it.priceVnd); }, 0);
      var cx = v.complicated ? C.complexFee : 0;
      lines.push(t('fd.bk.sumFees', 'Service + base fee: ') + fmtVnd(svc + C.baseFee) + (cx ? ' · ' + t('fd.bk.sumCx', 'Complex sourcing: +') + fmtVnd(cx) : ''));
      lines.push(t('fd.bk.sumTotal', 'Total before shipping: ') + fmtVnd(subtotal + svc + C.baseFee + cx));
    }
    lines.push(t('fd.bk.sumTrip', 'Trip: ') + (v.complicated ? t('fd.bk.hunt', 'A proper hunt') + ' (' + v.reasons.join(', ') + ')' : t('fd.bk.simple', 'A simple run')));
    return lines.join('\n');
  }

  /* ---------- actions ---------- */
  function has(id) { return items.some(function (it) { return it.brandId === id; }); }
  function count() { return items.length; }

  function addOrOpen(id) {
    if (!has(id)) {
      var b = byId[id];
      items.push({ id: uid(), brandId: id, brandName: b ? b.n : id, link: '', priceVnd: null, title: '', addedAt: Date.now() });
      save();
      if (!panel.hidden) { renderGroups(); }
      renderTotals(); renderCounts(); pulseCounts();
      showToast(t('fd.bk.added', 'Added — set the price in the basket'));
    } else {
      open(null, id);
    }
    return true; /* the bag stays lit; removal happens in the panel */
  }

  /* Structured add for the quick-add tray (fd-atelier.js): category + tier-median
     price land as a normal basket row, no blank form. Toast confirms; panel stays shut. */
  function addStructured(id, title, priceVnd) {
    var b = byId[id];
    items.push({ id: uid(), brandId: id, brandName: b ? b.n : id, link: '', priceVnd: priceVnd || null, title: title || '', addedAt: Date.now() });
    save();
    if (!panel.hidden) { renderGroups(); }
    renderTotals(); renderCounts(); pulseCounts();
    showToast(t('fd.bk.brief', 'Added to your brief ✓'));
    return true;
  }

  var lastTrigger = null;
  function open(trigger, scrollToBrand) {
    lastTrigger = trigger || null;
    renderAll();
    scrim.hidden = false; panel.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('open'); panel.classList.add('open'); });
    loadFx();
    var c = panel.querySelector('.bk-close'); if (c) c.focus({ preventScroll: true });
    if (scrollToBrand) {
      var g = panel.querySelector('.bk-group[data-key="' + CSS.escape(scrollToBrand) + '"]');
      if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
  function close() {
    scrim.classList.remove('open'); panel.classList.remove('open');
    setTimeout(function () { scrim.hidden = true; panel.hidden = true; }, 330);
    if (lastTrigger && lastTrigger.focus) { try { lastTrigger.focus(); } catch (e) {} }
    lastTrigger = null;
  }

  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg; toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.hidden = true; }, 260); }, BK.TOAST_MS);
  }

  /* ---------- panel events ---------- */
  var clearArmed = false;
  function bindPanel() {
    panel.querySelector('.bk-close').addEventListener('click', close);

    var saveSoon = debounce(function () { save(); renderTotals(); }, BK.DEBOUNCE);
    panel.addEventListener('input', function (e) {
      var row = e.target.closest('.bk-item'); if (!row) return;
      var it = itemById(row.dataset.id); if (!it) return;
      if (e.target.classList.contains('bk-title')) it.title = e.target.value.trim();
      if (e.target.classList.contains('bk-link')) it.link = e.target.value.trim();
      if (e.target.classList.contains('bk-price')) echoParsed(row, true);
      saveSoon();
    });

    panel.addEventListener('click', function (e) {
      var del = e.target.closest('.bk-del');
      if (del) {
        items = items.filter(function (it) { return it.id !== del.dataset.id; });
        save(); renderGroups(); renderTotals();
        return;
      }
      var gadd = e.target.closest('.bk-gadd');
      if (gadd) {
        var g = groupItems().filter(function (x) { return x.key === gadd.dataset.key; })[0];
        if (g) {
          items.push({ id: uid(), brandId: g.brandId, brandName: g.name, link: '', priceVnd: null, title: '', addedAt: Date.now() });
          save(); renderGroups(); renderTotals();
          var ng = panel.querySelector('.bk-group[data-key="' + CSS.escape(g.key) + '"] .bk-item:last-of-type .bk-title');
          if (ng) ng.focus();
        }
        return;
      }
      if (e.target.closest('.bk-c-add')) {
        var st = panel.querySelector('.bk-c-store'), ln = panel.querySelector('.bk-c-link'), pr = panel.querySelector('.bk-c-price');
        var name = (st.value || '').trim();
        if (!name) { st.focus(); return; }
        items.push({ id: uid(), brandId: null, brandName: name, link: (ln.value || '').trim(), priceVnd: parsePrice(pr.value), title: '', addedAt: Date.now() });
        st.value = ''; ln.value = ''; pr.value = '';
        save(); renderGroups(); renderTotals(); pulseCounts();
        return;
      }
      if (e.target.closest('.bk-copy')) {
        if (navigator.clipboard) navigator.clipboard.writeText(summaryText()).then(function () { showToast(t('fd.bk.copied', 'Copied — paste it anywhere')); });
        return;
      }
      if (e.target.closest('.bk-send')) {
        var text = summaryText();
        if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
        var C = cfg();
        var base = (C && C.contact && C.contact.tally) || 'https://tally.so/r/gD10Kl';
        var url = base + '?about=' + encodeURIComponent('Basket sourcing request') + '&estimate=' + encodeURIComponent(text) + '&source=fd-basket';
        if (url.length > 1900) {
          var brief = items.length + ' items across ' + groupItems().length + ' stores — ' + t('fd.bk.sumTotalShort', 'details copied to clipboard, paste here.');
          url = base + '?about=' + encodeURIComponent('Basket sourcing request') + '&estimate=' + encodeURIComponent(brief) + '&source=fd-basket';
        }
        window.open(url, '_blank', 'noopener');
        showToast(t('fd.bk.sent', 'Opening the request form — your list is also on the clipboard'));
        return;
      }
      var clr = e.target.closest('.bk-clear');
      if (clr) {
        if (!clearArmed) {
          clearArmed = true; clr.textContent = t('fd.bk.sure', 'Really clear ') + items.length + '?';
          setTimeout(function () { clearArmed = false; try { clr.textContent = t('fd.bk.clear', 'Clear'); } catch (e2) {} }, 3000);
        } else {
          clearArmed = false; items = []; save(); renderAll();
        }
        return;
      }
      var est = e.target.closest('.bk-est');
      if (est) {
        /* hand the basket to the estimate page in its own ss-basket shape;
           the classifier's verdict arrives as the pre-ticked complex box */
        var v = classify(), prev = {};
        try { prev = JSON.parse(localStorage.getItem('ss-basket')) || {}; } catch (e3) {}
        try {
          localStorage.setItem('ss-basket', JSON.stringify({
            items: items.map(function (x) { return x.priceVnd || ''; }),
            links: items.map(function (x) { return x.link || ''; }),
            region: prev.region || '', weight: prev.weight || '',
            complex: v.complicated, green: !!prev.green, cur: prev.cur || ''
          }));
        } catch (e4) {}
        /* navigation proceeds via the anchor's own href */
      }
    });
  }

  scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });

  /* ---------- boot ---------- */
  var ub = document.getElementById('basketbtn');
  if (ub) ub.addEventListener('click', function () { open(ub); });

  function maybeAutoOpen() {
    if (/(^|[#&])basket(=|$|&)/.test(location.hash)) open();
  }
  window.addEventListener('hashchange', maybeAutoOpen);

  document.addEventListener('ss:lang', function () { if (!panel.hidden) renderAll(); else renderTotals(); });

  window.SS_BASKET = { has: has, addOrOpen: addOrOpen, addStructured: addStructured, open: open, close: close, count: count };

  renderCounts();      /* counts + card-bag sync on load (panel renders on open) */
  maybeAutoOpen();
})();
