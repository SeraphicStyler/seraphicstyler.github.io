/* Seraphic Styler — the unified tray (fd-basket.js)
   ----------------------------------------------------------------------
   One working surface for everything a client collects while browsing:
   every row has a state that graduates — 'saved' (a hearted house, just
   an idea) → 'shortlist' (a piece with a link and a typed price) →
   'ready' (priced and estimate-bound). Hearts and the bag feed the same
   tray; nothing asks the client to decide "save or basket?" up front.
   The tray tallies VND + USD over shortlist+ready, previews the service
   fee via the estimator's CONFIG, and runs the route solver over those
   stores to call the trip "a simple run" or "a proper hunt" — the hunt
   is what the per-store fee (first 2 included, +150,000₫ each after) and the +200,000₫ complex fee cover.
   Storage: localStorage 'fd-basket' {v:2, items:[{…, state}]}. v1 baskets
   migrate to state:'ready' (their estimate CTA was live and must stay so);
   pre-tray hearts in 'fd-saved' fold in as state:'saved' rows, and
   'fd-saved' is kept written as a mirror of the saved rows so the page's
   heart filter, saved=1 deep link and route-panel's seedSaved keep working.
   Self-injecting widget in the route-panel.js mold: own <style>, own DOM,
   themed entirely off the page's CSS variables (dark mode for free).
   Exposes window.SS_BASKET = { has, addOrOpen, addStructured, open, close,
   count } (unchanged contract) + window.SS_TRAY for the state model.
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
  var STATES = ['saved', 'shortlist', 'ready'];
  var items = load();
  function load() {
    var arr = [];
    try {
      var d = JSON.parse(localStorage.getItem(BK.LS) || 'null');
      if (d && Array.isArray(d.items)) {
        arr = d.items;
        if (d.v === 1) arr.forEach(function (it) { it.state = 'ready'; });   /* v1 baskets had a live estimate CTA — keep it live */
        else arr.forEach(function (it) { if (STATES.indexOf(it.state) < 0) it.state = 'shortlist'; });
      }
    } catch (e) {}
    /* hearts from before the tray existed (or set while this module wasn't loaded)
       fold in as saved-state rows — lossless, idempotent */
    try {
      (JSON.parse(localStorage.getItem('fd-saved') || '[]') || []).forEach(function (id) {
        if (!arr.some(function (it) { return it.brandId === id; })) {
          arr.push({ id: uid(), brandId: id, brandName: byId[id] ? byId[id].n : id, link: '', priceVnd: null, title: '', addedAt: Date.now(), state: 'saved' });
        }
      });
    } catch (e2) {}
    return arr;
  }
  function save() {
    try { localStorage.setItem(BK.LS, JSON.stringify({ v: 2, items: items })); } catch (e) {}
    /* mirror: the page's heart filter, saved=1 deep link and route-panel's
       seedSaved all read 'fd-saved' — keep it equal to the saved-state rows */
    try {
      var hearts = [];
      items.forEach(function (it) { if (it.state === 'saved' && it.brandId && hearts.indexOf(it.brandId) < 0) hearts.push(it.brandId); });
      localStorage.setItem('fd-saved', JSON.stringify(hearts));
    } catch (e3) {}
    try { document.dispatchEvent(new CustomEvent('ss:tray')); } catch (e4) {}
  }
  /* the "actionable" rows — everything the fees, trip and estimate care about */
  function active() { return items.filter(function (it) { return it.state !== 'saved'; }); }
  function readyItems() { return items.filter(function (it) { return it.state === 'ready'; }); }

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
    var pct = p <= f.midThreshold ? p * f.midRate : p * f.highRate;
    return Math.max(f.minFee, pct);
  }

  /* ---------- trip classification ---------- */
  var ZONELABEL = { d1: 'District 1', d3: 'District 3', pn: 'Phú Nhuận', bt: 'Bình Thạnh', td: 'Thảo Điền', q5: 'Q5 · Chợ Lớn', gv: 'Gò Vấp', tb: 'Tân Bình', tp: 'Tân Phú', other: 'Saigon' };
  function zoneOf(b) { return (window.SS_FD && window.SS_FD.zoneOf) ? window.SS_FD.zoneOf(b) : null; }

  var tripCache = { sig: null, plan: null };
  function classify() {
    /* saved-state rows are ideas, not stops — they must not trip the complex-sourcing fee */
    var seen = {}, brands = [], customs = {};
    active().forEach(function (it) {
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
    '.bk-ghead{display:flex;align-items:center;gap:9px;}' +
    '.bk-glogo{flex:none;width:34px;height:34px;border-radius:9px;object-fit:cover;background:#fff;border:1px solid var(--line);}' +
    '.bk-gi{display:grid;place-items:center;font-family:var(--font-display);font-size:1rem;color:var(--cobalt);background:var(--ice);}' +
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
    /* paste-a-link — always visible at the top of the tray, first-class ingestion */
    '.tr-paste{border:1px dashed var(--line);border-radius:14px;padding:10px 12px;background:var(--ice);}' +
    '.tr-plbl{margin:0 0 7px;font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-mute);}' +
    '.tr-paste .bk-cform{display:flex;flex-direction:column;gap:6px;}' +
    '.tr-paste .bk-crow{display:flex;gap:6px;}' +
    '.tr-paste .bk-crow input{flex:1;min-width:0;}' +
    '.tr-paste input{font:inherit;font-size:.83rem;border:1px solid var(--line);border-radius:9px;padding:6px 9px;background:var(--paper);color:var(--ink);}' +
    '.bk-c-add{font:inherit;font-size:.8rem;align-self:flex-start;border:1px solid var(--cobalt);color:var(--cobalt);background:none;border-radius:999px;padding:4px 14px;cursor:pointer;}' +
    /* tray state sections */
    '.tr-sec{display:flex;flex-direction:column;gap:8px;}' +
    '.tr-sec h3{margin:0 0 1px;font-family:var(--font-display);font-size:.92rem;color:var(--ink);letter-spacing:.03em;}' +
    '.tr-sec[data-state=ready] h3{color:var(--cobalt);}' +
    '.tr-n{color:var(--ink-mute);font-weight:400;font-size:.78rem;}' +
    '.tr-savedrow{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:12px;padding:7px 9px;background:var(--card-solid);}' +
    '.tr-savedrow .tr-sv-t{flex:1;min-width:0;display:flex;flex-direction:column;}' +
    '.tr-savedrow b{font-size:.86rem;color:var(--ink);overflow-wrap:break-word;}' +
    '.tr-savedrow i{font-style:normal;font-size:.68rem;color:var(--ink-mute);}' +
    '.tr-promote{font:inherit;font-size:.68rem;border:1px solid var(--cobalt);color:var(--cobalt);background:none;border-radius:999px;padding:3px 9px;cursor:pointer;white-space:nowrap;flex:none;}' +
    '.tr-promote:hover{background:var(--cobalt);color:#fff;}' +
    '[data-theme=dark] .tr-promote:hover{color:#161a26;}' +
    /* per-row stage pills: Saved | Shortlist | Ready */
    '.tr-seg{grid-column:1 / -1;display:flex;gap:4px;}' +
    '.tr-st{font:inherit;font-size:.64rem;letter-spacing:.02em;border:1px solid var(--line);background:none;color:var(--ink-mute);border-radius:999px;padding:3px 9px;cursor:pointer;}' +
    '.tr-st[aria-pressed=true]{background:var(--cobalt);border-color:var(--cobalt);color:#fff;}' +
    '[data-theme=dark] .tr-st[aria-pressed=true]{color:#161a26;}' +
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
    '.bk-foot .bk-est.off{opacity:.45;cursor:not-allowed;}' +
    '.bk-foot .bk-est.off:hover{background:var(--cobalt);}' +
    '.tr-esthint{grid-column:1 / -1;margin:0;font-size:.72rem;color:var(--ink-mute);text-align:center;}' +
    '.tr-esthint[hidden]{display:none;}' +
    '.bk-foot button{font:inherit;font-size:.8rem;border:1px solid var(--line);background:none;border-radius:999px;padding:7px 10px;cursor:pointer;color:var(--ink-soft);}' +
    '.bk-foot button:hover{color:var(--cobalt);border-color:var(--cobalt);}' +
    '.bk-foot button:disabled{opacity:.45;cursor:not-allowed;color:var(--ink-soft);border-color:var(--line);}' +
    '.bk-foot .bk-send{grid-column:1 / -1;border-color:var(--cobalt);color:var(--cobalt);font-weight:600;}' +
    '.bk-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:70;background:var(--ink);color:var(--paper);' +
      'font-size:.83rem;padding:9px 16px;border-radius:999px;box-shadow:var(--shadow);opacity:0;transition:opacity .25s;pointer-events:none;max-width:88vw;text-align:center;}' +
    '.bk-toast.show{opacity:1;}' +
    '.bk-toast.act{pointer-events:auto;}' +
    '.bk-undo{font:inherit;font-size:.78rem;font-weight:600;margin-left:10px;background:none;border:0;color:var(--lav);cursor:pointer;text-decoration:underline;}' +
    /* the added piece flies to the tray (skipped entirely under reduced motion) */
    '.bk-fly{position:fixed;z-index:400;pointer-events:none;border-radius:11px;' +
      'transition:transform .55s var(--ease),opacity .55s ease;will-change:transform,opacity;}' +
    '@keyframes bkPulse{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}' +
    '#basketcount.pulse,#tbtrayn.pulse{animation:bkPulse .5s var(--ease);display:inline-block;}' +
    '.bk-foot[hidden]{display:none!important;}' +
    /* display:flex on these beats the UA [hidden] rule — force-hide, like the footer */
    '.bk-trip[hidden],.bk-fees[hidden]{display:none!important;}' +
    '.bk-tab{display:none;}' +
    /* desktop ≥1100px: the basket is a persistent right sidebar, not a modal */
    '@media(min-width:1100px){' +
      '.bk-scrim{display:none!important;}' +
      '.bk-panel{width:340px;box-shadow:none;}' +
      'body.bk-dock{padding-right:340px;}' +
      '.bk-tab{display:block;position:fixed;right:0;top:42%;z-index:61;writing-mode:vertical-rl;font:inherit;font-size:.8rem;font-weight:600;letter-spacing:.06em;' +
        'background:var(--cobalt);color:#fff;border:0;border-radius:12px 0 0 12px;padding:16px 8px;cursor:pointer;box-shadow:var(--shadow);}' +
      '.bk-tab[hidden]{display:none;}' +
    '}' +
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
      '<div class="bk-head"><h2 id="bktitle">' + esc(t('fd.tr.title', 'Your tray')) + ' <span class="bk-n"></span></h2>' +
      '<button class="bk-close" aria-label="' + esc(t('fd.tr.close', 'Close tray')) + '">✕</button></div>' +
      '<div class="bk-body">' +
        '<div class="bk-empty" hidden>' + esc(t('fd.tr.empty', 'Nothing here yet — tap the heart to save a house for later, the bag to shortlist a piece, or paste a link below.')) + '</div>' +
        '<div class="tr-paste">' +
          '<p class="tr-plbl">' + esc(t('fd.tr.paste', 'Paste a link from anywhere')) + '</p>' +
          '<div class="bk-cform">' +
            '<input class="bk-c-link" type="url" placeholder="' + esc(t('fd.tr.cLink', 'https:// — product or Instagram link')) + '">' +
            '<div class="bk-crow">' +
              '<input class="bk-c-store" placeholder="' + esc(t('fd.bk.cStore', 'Store or brand')) + '">' +
              '<input class="bk-c-price" inputmode="numeric" placeholder="' + esc(t('fd.bk.cPrice', 'Price — 350k, 1.2m…')) + '">' +
            '</div>' +
            '<button class="bk-c-add" type="button">' + esc(t('fd.bk.cAdd', 'Add')) + '</button>' +
          '</div></div>' +
        '<div class="bk-groups"></div>' +
        '<div class="bk-trip" hidden></div>' +
        '<div class="bk-fees" hidden></div>' +
      '</div>' +
      '<div class="bk-foot">' +
        '<a class="bk-est" href="estimate">' + esc(t('fd.bk.est', 'Get the full estimate →')) + '</a>' +
        '<p class="tr-esthint" hidden>' + esc(t('fd.tr.readyHint', 'Mark at least one piece “Ready” to unlock the estimate.')) + '</p>' +
        '<button class="bk-send" type="button">' + esc(t('fd.bk.send', 'Send this list to Seraphic Styler')) + '</button>' +
        '<button class="bk-copy" type="button">' + esc(t('fd.bk.copy', 'Copy')) + '</button>' +
        '<button class="bk-clear" type="button">' + esc(t('fd.bk.clear', 'Clear')) + '</button>' +
      '</div>';
    bindPanel();
  }

  function groupItems(list) {
    var order = [], map = {};
    (list || items).forEach(function (it) {
      var key = it.brandId || '~' + it.brandName;
      if (!map[key]) { map[key] = { key: key, brandId: it.brandId, name: it.brandName, rows: [] }; order.push(map[key]); }
      map[key].rows.push(it);
    });
    return order;
  }

  function stateLabel(s) {
    return s === 'saved' ? t('fd.tr.saved', 'Saved')
      : s === 'ready' ? t('fd.tr.ready', 'Ready for estimate')
      : t('fd.tr.short', 'Shortlist');
  }
  /* the per-row stage control — how a piece graduates saved → shortlist → ready */
  function segCtl(it) {
    return '<div class="tr-seg" role="group" aria-label="' + esc(t('fd.tr.stage', 'Stage')) + '">' +
      STATES.map(function (s) {
        var lb = s === 'saved' ? t('fd.tr.segSaved', 'Saved') : s === 'ready' ? t('fd.tr.segReady', 'Ready') : t('fd.tr.segShort', 'Shortlist');
        return '<button type="button" class="tr-st" data-id="' + esc(it.id) + '" data-state="' + s + '" aria-pressed="' + String(it.state === s) + '">' + esc(lb) + '</button>';
      }).join('') + '</div>';
  }

  function renderGroups() {
    var wrap = panel.querySelector('.bk-groups');
    panel.querySelector('.bk-empty').hidden = items.length > 0;
    var iconMap = (typeof ICONS !== 'undefined' && ICONS) || {};
    function logoOf(name) {
      return iconMap[name]
        ? '<img class="bk-glogo" src="' + encodeURI(iconMap[name]) + '" alt="" width="34" height="34" loading="lazy">'
        : '<span class="bk-glogo bk-gi">' + esc((name || '?').charAt(0)) + '</span>';
    }
    var html = '';

    /* Saved — hearted houses: an idea, not yet a piece. One tap forward. */
    var savedRows = items.filter(function (it) { return it.state === 'saved'; });
    if (savedRows.length) {
      html += '<section class="tr-sec" data-state="saved"><h3>' + esc(t('fd.tr.saved', 'Saved')) + ' <span class="tr-n">(' + savedRows.length + ')</span></h3>' +
        savedRows.map(function (it) {
          var b = it.brandId && byId[it.brandId];
          var meta = b ? [b.tier && b.tier !== 'none' ? b.tier : null, b.area].filter(Boolean).join(' · ') : '';
          return '<div class="tr-savedrow" data-id="' + esc(it.id) + '">' + logoOf(it.brandName) +
            '<span class="tr-sv-t"><b>' + esc(it.brandName) + '</b>' + (meta ? '<i>' + esc(meta) + '</i>' : '') + '</span>' +
            '<button type="button" class="tr-promote" data-id="' + esc(it.id) + '">' + esc(t('fd.tr.toShort', '→ Shortlist')) + '</button>' +
            '<button type="button" class="bk-del" data-id="' + esc(it.id) + '" aria-label="' + esc(t('fd.bk.remove', 'Remove')) + '">✕</button></div>';
        }).join('') + '</section>';
    }

    /* Shortlist & Ready — full rows: link, typed price, stage pills */
    ['shortlist', 'ready'].forEach(function (state) {
      var list = items.filter(function (it) { return it.state === state; });
      if (!list.length) return;
      html += '<section class="tr-sec" data-state="' + state + '"><h3>' + esc(stateLabel(state)) + ' <span class="tr-n">(' + list.length + ')</span></h3>' +
        groupItems(list).map(function (g) {
          var head = g.brandId && byId[g.brandId]
            ? '<a href="#q=' + encodeURIComponent(g.name) + '">' + esc(g.name) + '</a>'
            : '<b>' + esc(g.name) + '</b>';
          return '<section class="bk-group" data-key="' + esc(g.key) + '">' +
            '<div class="bk-ghead">' + logoOf(g.name) + head +
              '<button class="bk-gadd" type="button" data-key="' + esc(g.key) + '">' + esc(t('fd.bk.addItem', '+ item')) + '</button>' +
              '<span class="bk-gsub"></span></div>' +
            g.rows.map(function (it) {
              return '<div class="bk-item" data-id="' + esc(it.id) + '">' +
                '<input class="bk-title" value="' + esc(it.title) + '" placeholder="' + esc(t('fd.bk.what', 'What is it? (optional)')) + '">' +
                '<input class="bk-link" type="url" value="' + esc(it.link) + '" placeholder="' + esc(t('fd.bk.link', 'Product link')) + '">' +
                '<div style="display:flex;gap:6px;align-items:center;grid-column:1 / -1;">' +
                  '<input class="bk-price" inputmode="numeric" value="' + (it.priceVnd ? esc(String(it.priceVnd)) : '') + '" placeholder="' + esc(t('fd.bk.price', 'Price — 350k, 1.2m, 1,200,000')) + '" style="flex:1">' +
                  '<button class="bk-del" type="button" aria-label="' + esc(t('fd.bk.remove', 'Remove')) + '" data-id="' + esc(it.id) + '">✕</button>' +
                '</div>' + segCtl(it) +
                '<span class="bk-parsed"></span>' +
              '</div>';
            }).join('') +
          '</section>';
        }).join('') + '</section>';
    });

    wrap.innerHTML = html;
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
    var act = active();
    var priced = act.filter(function (it) { return it.priceVnd > 0; });
    var unpriced = act.length - priced.length;
    var subtotal = priced.reduce(function (a, it) { return a + it.priceVnd; }, 0);

    /* per-store subtotals — walked off the DOM, since a brand can now sit in
       both the Shortlist and Ready sections with its own group in each */
    panel.querySelectorAll('.bk-group').forEach(function (gsec) {
      var el = gsec.querySelector('.bk-gsub'); if (!el) return;
      var s = 0;
      gsec.querySelectorAll('.bk-item').forEach(function (row) {
        var it = itemById(row.dataset.id); if (it && it.priceVnd > 0) s += it.priceVnd;
      });
      el.textContent = s ? fmtVnd(s) : '';
    });

    var v = classify();

    /* trip card */
    var trip = panel.querySelector('.bk-trip');
    var stores = v.phys.length + v.nonR;
    if (!act.length || stores === 0) { trip.hidden = true; }
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
          esc(t('fd.bk.huntWhy2', 'The first two boutiques are included; each additional store adds 150,000₫ for the extra travel — and hard-to-coordinate runs add the +200,000₫ complex fee. Both are in the preview below.')) + '</p>';
      } else {
        var zoneKeys = Object.keys(v.zones);
        var where = zoneKeys.length === 1 ? (ZONELABEL[zoneKeys[0]] || 'Saigon') : 'Saigon';
        html += '<h3>' + esc(t('fd.bk.simple', 'A simple run')) + '</h3>' +
          '<p>' + stores + ' ' + esc(t('fd.bk.stops', 'stop(s)')) + ' ' + esc(t('fd.bk.in', 'in')) + ' ' + esc(where) + '. ' +
          esc(t('fd.bk.simpleWhy2', 'This fits a standard sourcing trip — no extra-stop or complex-sourcing fees apply.')) + '</p>';
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
    if (!act.length) { fees.hidden = true; }
    else {
      fees.hidden = false;
      var C = cfg();
      var rows = '<div class="r"><span>' + esc(t('fd.bk.subtotal', 'Items subtotal')) + (unpriced ? ' <em>(' + unpriced + ' ' + esc(t('fd.bk.unpriced', 'unpriced')) + ')</em>' : '') + '</span><b>' + fmtVnd(subtotal) + '</b></div>';
      if (C && C.fee && subtotal > 0) {
        var svc = priced.reduce(function (a, it) { return a + itemFee(it.priceVnd); }, 0);
        var complexFee = v.complicated ? C.complexFee : 0;
        var stopsIncl = (C.stops && C.stops.included) || 2;
        var stopsFee = C.stops ? Math.max(0, v.phys.length - stopsIncl) * C.stops.perExtra : 0;
        var total = subtotal + svc + C.baseFee + stopsFee + complexFee;
        rows += '<div class="r"><span>' + esc(t('fd.bk.service', 'Service fee')) + '</span><b>' + fmtVnd(svc) + '</b></div>' +
          '<div class="r"><span>' + esc(t('fd.bk.base', 'Base fee')) + '</span><b>' + fmtVnd(C.baseFee) + '</b></div>' +
          (stopsFee ? '<div class="r"><span>' + esc(t('fd.bk.stopsFee', 'Additional stops')) + '</span><b>+' + fmtVnd(stopsFee) + ' <em style="font-weight:400">(' + v.phys.length + ' ' + esc(t('fd.bk.stores', 'stores')) + ', ' + esc(t('fd.bk.stopsIncl', 'first 2 included')) + ')</em></b></div>' : '') +
          '<div class="r"><span>' + esc(t('fd.bk.complex', 'Complex sourcing')) + '</span><b>' +
            (complexFee ? '+' + fmtVnd(complexFee) + ' <em style="font-weight:400">(' + esc(t('fd.bk.auto', 'auto')) + ': ' + esc(v.reasons.join(' / ')) + ')</em>'
                        : '0₫ — ' + esc(t('fd.bk.notNeeded', 'not needed for a simple run'))) + '</b></div>' +
          '<div class="r total"><span>' + esc(t('fd.bk.total', 'Total before shipping')) + '</span><b>' + fmtVnd(total) + '</b></div>' +
          '<div class="r usd"><span>' + (fxLive ? esc(t('fd.bk.live', 'Live rate')) : esc(t('fd.bk.offline', 'Offline estimate'))) + '</span><b>≈ ' + fmtUsd(toUsd(total)) + '</b></div>' +
          '<div class="r note">' + esc(t('fd.bk.cardnote2', 'Cards add Stripe\'s own ~5.4% + $0.30 — bank transfer, Wise & Zelle are fee-free.')) + '</div>';
      }
      rows += '<div class="r note">' + esc(t('fd.bk.honest', 'An estimate, not a quote — shipping and the final number live on the estimate page.')) + '</div>';
      fees.innerHTML = rows;
    }

    /* progressive footer: nothing at all when empty; estimate unlocks only once
       a piece is marked Ready; send/copy need at least one shortlist/ready row */
    var foot = panel.querySelector('.bk-foot');
    if (foot) {
      foot.hidden = !items.length;
      var nReady = readyItems().length;
      var est = foot.querySelector('.bk-est');
      if (est) {
        est.classList.toggle('off', !nReady);
        est.setAttribute('aria-disabled', String(!nReady));
      }
      var hint = foot.querySelector('.tr-esthint');
      if (hint) hint.hidden = nReady > 0;
      var sendable = act.length > 0;
      var sb = foot.querySelector('.bk-send'); if (sb) sb.disabled = !sendable;
      var cb = foot.querySelector('.bk-copy'); if (cb) cb.disabled = !sendable;
    }

    renderCounts();
  }

  /* counts + card-button sync — safe to run even before the panel ever opens.
     The badge counts the actionable rows (shortlist+ready); saved rows show as
     lit hearts on the cards and in the Saved section, not in the number. */
  function renderCounts() {
    var n = active().length;
    var bn = panel.querySelector('.bk-n'); if (bn) bn.textContent = n ? '(' + n + ')' : '';
    var uc = document.getElementById('basketcount'); if (uc) uc.textContent = n ? '(' + n + ')' : '';
    var tb = document.getElementById('tbtrayn'); if (tb) { tb.hidden = !n; tb.textContent = n; }
    if (typeof tab !== 'undefined' && !tab.hidden) tabLabel();
    syncCardButtons();
  }

  function pulseCounts() {
    ['basketcount', 'tbtrayn'].forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
    });
  }

  function syncCardButtons() {
    document.querySelectorAll('.card .bk').forEach(function (btn) {
      var on = has(btn.dataset.id);
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
    });
    document.querySelectorAll('.card .sv').forEach(function (btn) {
      var on = isSavedBrand(btn.dataset.id);
      btn.classList.toggle('on', on); btn.setAttribute('aria-pressed', String(on));
    });
  }

  function renderAll() { skeleton(); renderGroups(); renderTotals(); }

  /* ---------- summary text (shortlist+ready — saved rows are ideas, not asks) ---------- */
  function summaryText() {
    var lines = [t('fd.bk.sumHead', 'Seraphic Styler — basket sourcing request')], i = 1;
    groupItems(active()).forEach(function (g) {
      g.rows.forEach(function (it) {
        lines.push(i + '. ' + g.name + (it.title ? ' — ' + it.title : '') + (it.priceVnd ? ' — ' + fmtVnd(it.priceVnd) : ' — (no price yet)') + (httpUrl(it.link) ? ' — ' + it.link : ''));
        i++;
      });
    });
    var priced = active().filter(function (it) { return it.priceVnd > 0; });
    var subtotal = priced.reduce(function (a, it) { return a + it.priceVnd; }, 0);
    var v = classify(), C = cfg();
    lines.push('');
    lines.push(t('fd.bk.sumSub', 'Items subtotal: ') + fmtVnd(subtotal));
    if (C && C.fee && subtotal > 0) {
      var svc = priced.reduce(function (a, it) { return a + itemFee(it.priceVnd); }, 0);
      var cx = v.complicated ? C.complexFee : 0;
      var sf = C.stops ? Math.max(0, v.phys.length - ((C.stops && C.stops.included) || 2)) * C.stops.perExtra : 0;
      lines.push(t('fd.bk.sumFees', 'Service + base fee: ') + fmtVnd(svc + C.baseFee) + (sf ? ' · ' + t('fd.bk.sumStops', 'Additional stops: +') + fmtVnd(sf) : '') + (cx ? ' · ' + t('fd.bk.sumCx', 'Complex sourcing: +') + fmtVnd(cx) : ''));
      lines.push(t('fd.bk.sumTotal', 'Total before shipping: ') + fmtVnd(subtotal + svc + C.baseFee + sf + cx));
    }
    lines.push(t('fd.bk.sumTrip', 'Trip: ') + (v.complicated ? t('fd.bk.hunt', 'A proper hunt') + ' (' + v.reasons.join(', ') + ')' : t('fd.bk.simple', 'A simple run')));
    return lines.join('\n');
  }

  /* ---------- actions ---------- */
  /* the bag is lit when the brand has an actionable (shortlist/ready) row */
  function has(id) { return items.some(function (it) { return it.brandId === id && it.state !== 'saved'; }); }
  function isSavedBrand(id) { return items.some(function (it) { return it.brandId === id && it.state === 'saved'; }); }
  function count() { return active().length; }

  /* ---------- fly-to-tray: the added piece visibly lands where it went ---------- */
  function motionOff() {
    if (document.documentElement.classList.contains('rm')) return true;
    try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function cardSourceEl(id, sel) {
    var esc2 = (window.CSS && CSS.escape) ? CSS.escape(id) : id;
    var btn = document.querySelector('.card ' + sel + '[data-id="' + esc2 + '"]');
    var card = btn && btn.closest('.card');
    return (card && card.querySelector('.blogo')) || btn;
  }
  function flyTarget() {
    if (!panel.hidden && panel.classList.contains('open')) {
      var h = panel.querySelector('.bk-head'); if (h) return h;
    }
    var els = [document.getElementById('basketbtn'), document.getElementById('tbtray')];
    for (var i = 0; i < els.length; i++) if (els[i] && els[i].offsetParent) return els[i];
    return null;
  }
  function flyToTray(fromEl) {
    if (!fromEl || motionOff()) return;                      /* reduced motion: the badge pulse is the signal */
    var target = flyTarget(); if (!target) return;
    var a = fromEl.getBoundingClientRect(), z = target.getBoundingClientRect();
    if (!a.width || !z.width) return;
    var ghost = fromEl.cloneNode(true);
    ghost.className = 'bk-fly';
    ghost.style.cssText += ';left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px;margin:0;opacity:.95;';
    document.body.appendChild(ghost);
    var dx = (z.left + z.width / 2) - (a.left + a.width / 2);
    var dy = (z.top + z.height / 2) - (a.top + a.height / 2);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.18)';
        ghost.style.opacity = '.15';
      });
    });
    var gone = false;
    function rm() { if (!gone) { gone = true; ghost.remove(); } }
    ghost.addEventListener('transitionend', rm);
    setTimeout(rm, 800);
  }

  function addOrOpen(id) {
    if (!has(id)) {
      var b = byId[id];
      items.push({ id: uid(), brandId: id, brandName: b ? b.n : id, link: '', priceVnd: null, title: '', addedAt: Date.now(), state: 'shortlist' });
      save();
      if (!panel.hidden) { renderGroups(); }
      renderTotals(); renderCounts(); pulseCounts();
      flyToTray(cardSourceEl(id, '.bk'));
      showToast(t('fd.tr.added', 'Shortlisted — set the price in your tray'));
    } else {
      open(null, id);
    }
    return true; /* the bag stays lit; removal happens in the panel */
  }

  /* Structured add for the quick-add tray (fd-atelier.js): category + tier-median
     price land as a normal shortlist row, no blank form. Toast confirms; panel stays shut. */
  function addStructured(id, title, priceVnd) {
    var b = byId[id];
    items.push({ id: uid(), brandId: id, brandName: b ? b.n : id, link: '', priceVnd: priceVnd || null, title: title || '', addedAt: Date.now(), state: 'shortlist' });
    save();
    if (!panel.hidden) { renderGroups(); }
    renderTotals(); renderCounts(); pulseCounts();
    flyToTray(cardSourceEl(id, '.bk'));
    showToast(t('fd.tr.brief', 'Added to your shortlist ✓'));
    return true;
  }

  /* ---------- the saved state (hearts) + stage moves — the SS_TRAY surface ---------- */
  function addSaved(id) {
    if (isSavedBrand(id)) return true;
    var b = byId[id];
    items.push({ id: uid(), brandId: id, brandName: b ? b.n : id, link: '', priceVnd: null, title: '', addedAt: Date.now(), state: 'saved' });
    save();
    if (!panel.hidden) { renderGroups(); }
    renderTotals();
    flyToTray(cardSourceEl(id, '.sv'));
    return true;
  }
  function removeSaved(id) {
    if (!isSavedBrand(id)) return false;
    var prev = items.slice();
    items = items.filter(function (it) { return !(it.brandId === id && it.state === 'saved'); });
    save();
    if (!panel.hidden) { renderGroups(); }
    renderTotals();
    showToast(t('fd.tr.unsaved', 'Removed from saved'), function () {
      items = prev; save(); if (!panel.hidden) renderGroups(); renderTotals();
    });
    return true;
  }
  function setState(itemId, state) {
    var it = itemById(itemId); if (!it || STATES.indexOf(state) < 0 || it.state === state) return;
    it.state = state;
    save(); renderGroups(); renderTotals(); pulseCounts();
  }
  function countByState() {
    var c = { saved: 0, shortlist: 0, ready: 0 };
    items.forEach(function (it) { if (c[it.state] != null) c[it.state]++; });
    return c;
  }

  /* ---------- desktop dock (persistent sidebar) ---------- */
  var DESK = matchMedia('(min-width:1100px)');
  var tab = document.createElement('button');
  tab.className = 'bk-tab'; tab.type = 'button'; tab.hidden = true;
  document.body.appendChild(tab);
  tab.addEventListener('click', function () { open(tab); });
  function dockPref() { try { return localStorage.getItem('fd-basket-dock') !== '0'; } catch (e) { return true; } }
  function setDockPref(v) { try { localStorage.setItem('fd-basket-dock', v ? '1' : '0'); } catch (e) {} }
  function tabLabel() { tab.textContent = t('fd.tr.title', 'Your tray') + (active().length ? ' (' + active().length + ')' : ''); }

  var lastTrigger = null;
  function open(trigger, scrollToBrand) {
    lastTrigger = trigger || null;
    renderAll();
    panel.hidden = false;
    if (DESK.matches) {
      /* sidebar mode: no scrim, no focus trap — browsing continues beside it */
      setDockPref(true);
      panel.setAttribute('aria-modal', 'false');
      scrim.hidden = true; tab.hidden = true;
      requestAnimationFrame(function () { panel.classList.add('open'); document.body.classList.add('bk-dock'); });
    } else {
      panel.setAttribute('aria-modal', 'true');
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add('open'); panel.classList.add('open'); });
      var c = panel.querySelector('.bk-close'); if (c) c.focus({ preventScroll: true });
    }
    loadFx();
    if (scrollToBrand) {
      var g = panel.querySelector('.bk-group[data-key="' + CSS.escape(scrollToBrand) + '"]');
      if (g) g.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
  function close() {
    scrim.classList.remove('open'); panel.classList.remove('open');
    if (DESK.matches) { setDockPref(false); document.body.classList.remove('bk-dock'); tabLabel(); tab.hidden = false; }
    setTimeout(function () { scrim.hidden = true; panel.hidden = true; }, 330);
    if (lastTrigger && lastTrigger.focus) { try { lastTrigger.focus(); } catch (e) {} }
    lastTrigger = null;
  }
  DESK.addEventListener && DESK.addEventListener('change', function () {
    /* crossing the breakpoint: collapse everything to a sane state */
    scrim.classList.remove('open'); panel.classList.remove('open');
    scrim.hidden = true; panel.hidden = true;
    document.body.classList.remove('bk-dock');
    if (DESK.matches) { tabLabel(); tab.hidden = false; } else { tab.hidden = true; }
  });

  var toastTimer = null;
  function hideToast() {
    toast.classList.remove('show');
    setTimeout(function () { toast.hidden = true; }, 260);
  }
  /* with an undoFn the toast turns interactive and lingers long enough to hit */
  function showToast(msg, undoFn) {
    toast.textContent = msg;
    if (undoFn) {
      var u = document.createElement('button');
      u.type = 'button'; u.className = 'bk-undo';
      u.textContent = t('fd.tr.undo', 'Undo');
      u.addEventListener('click', function () { clearTimeout(toastTimer); hideToast(); undoFn(); });
      toast.appendChild(u);
    }
    toast.classList.toggle('act', !!undoFn);
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, undoFn ? 6000 : BK.TOAST_MS);
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
        var prevDel = items.slice();
        items = items.filter(function (it) { return it.id !== del.dataset.id; });
        save(); renderGroups(); renderTotals();
        showToast(t('fd.tr.removed', 'Removed'), function () {
          items = prevDel; save(); renderGroups(); renderTotals();
        });
        return;
      }
      var pro = e.target.closest('.tr-promote');
      if (pro) { setState(pro.dataset.id, 'shortlist'); return; }
      var seg = e.target.closest('.tr-st');
      if (seg) { setState(seg.dataset.id, seg.dataset.state); return; }
      var gadd = e.target.closest('.bk-gadd');
      if (gadd) {
        var sec = gadd.closest('.tr-sec');
        var gState = (sec && sec.dataset.state) || 'shortlist';   /* the new row joins the section it was added from */
        var g = groupItems(active()).filter(function (x) { return x.key === gadd.dataset.key; })[0];
        if (g) {
          items.push({ id: uid(), brandId: g.brandId, brandName: g.name, link: '', priceVnd: null, title: '', addedAt: Date.now(), state: gState });
          save(); renderGroups(); renderTotals();
          var ng = panel.querySelector('.tr-sec[data-state="' + gState + '"] .bk-group[data-key="' + CSS.escape(g.key) + '"] .bk-item:last-of-type .bk-title');
          if (ng) ng.focus();
        }
        return;
      }
      if (e.target.closest('.bk-c-add')) {
        var st = panel.querySelector('.bk-c-store'), ln = panel.querySelector('.bk-c-link'), pr = panel.querySelector('.bk-c-price');
        var name = (st.value || '').trim(), link = (ln.value || '').trim();
        if (!name && httpUrl(link)) {                       /* pasted a link, skipped the name → the hostname will do */
          try { name = new URL(link).hostname.replace(/^www\./, ''); } catch (e5) {}
        }
        if (!name) { st.focus(); return; }
        items.push({ id: uid(), brandId: null, brandName: name, link: link, priceVnd: parsePrice(pr.value), title: '', addedAt: Date.now(), state: 'shortlist' });
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
        var url = base + '?about=' + encodeURIComponent('I want help sourcing or buying specific items') + '&estimate=' + encodeURIComponent(text) + '&source=fd-basket';
        if (url.length > 1900) {
          var brief = items.length + ' items across ' + groupItems().length + ' stores — ' + t('fd.bk.sumTotalShort', 'details copied to clipboard, paste here.');
          url = base + '?about=' + encodeURIComponent('I want help sourcing or buying specific items') + '&estimate=' + encodeURIComponent(brief) + '&source=fd-basket';
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
          clearArmed = false;
          var prevAll = items.slice();
          items = []; save(); renderAll();
          showToast(t('fd.tr.cleared', 'Tray cleared'), function () {
            items = prevAll; save(); renderAll();
          });
        }
        return;
      }
      var est = e.target.closest('.bk-est');
      if (est) {
        if (est.classList.contains('off')) {                /* locked until something is Ready */
          e.preventDefault();
          showToast(t('fd.tr.readyHint', 'Mark at least one piece “Ready” to unlock the estimate.'));
          return;
        }
        /* hand the READY rows to the estimate page in its own ss-basket shape;
           the classifier's verdict arrives as the pre-ticked complex box */
        var v = classify(), prev = {}, rd = readyItems();
        try { prev = JSON.parse(localStorage.getItem('ss-basket')) || {}; } catch (e3) {}
        try {
          localStorage.setItem('ss-basket', JSON.stringify({
            items: rd.map(function (x) { return x.priceVnd || ''; }),
            links: rd.map(function (x) { return x.link || ''; }),
            region: prev.region || '', weight: prev.weight || '',
            complex: v.complicated, green: !!prev.green, cur: prev.cur || ''
          }));
        } catch (e4) {}
        /* navigation proceeds via the anchor's own href */
      }
    });
  }

  scrim.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || panel.hidden) return;
    if (document.querySelector('.cm-pop:not([hidden])')) return; /* Esc closes the open card menu first, not the tray */
    close();
  });

  /* mobile sheet: drag the handle (or header) down to dismiss */
  var swY = null;
  panel.addEventListener('touchstart', function (e) {
    if (DESK.matches) return;
    if (!e.target.closest('.bk-grab') && !e.target.closest('.bk-head')) return;
    swY = e.touches[0].clientY;
  }, { passive: true });
  panel.addEventListener('touchmove', function (e) {
    if (swY == null) return;
    var dy = e.touches[0].clientY - swY;
    if (dy > 0) { panel.style.transition = 'none'; panel.style.transform = 'translateY(' + dy + 'px)'; }
  }, { passive: true });
  panel.addEventListener('touchend', function (e) {
    if (swY == null) return;
    var dy = e.changedTouches[0].clientY - swY;
    panel.style.transition = ''; panel.style.transform = '';
    if (dy > 90) close();
    swY = null;
  });

  /* ---------- boot ---------- */
  var ub = document.getElementById('basketbtn');
  if (ub) ub.addEventListener('click', function () { open(ub); });

  function maybeAutoOpen() {
    if (/(^|[#&])basket(=|$|&)/.test(location.hash)) open();
  }
  window.addEventListener('hashchange', maybeAutoOpen);

  document.addEventListener('ss:lang', function () { if (!panel.hidden) renderAll(); else renderTotals(); });

  /* parsePrice is exported so the smart-paste module (js/fd-smartpaste.js) reads
     "1.290.000₫", "350k" and "1,2tr" exactly the way the tray's own inputs do —
     one money parser, never two that drift apart. */
  window.SS_BASKET = { has: has, addOrOpen: addOrOpen, addStructured: addStructured, open: open, close: close, count: count, parsePrice: parsePrice };
  window.SS_TRAY = {
    addSaved: addSaved, removeSaved: removeSaved, isSaved: isSavedBrand,
    setState: setState, countByState: countByState, open: open, close: close
  };

  save();              /* persist the v2 migration (and the fd-saved mirror) right away */
  renderCounts();      /* counts + card-bag sync on load (panel renders on open) */
  /* desktop: restore the docked sidebar (or its edge tab) on load */
  if (DESK.matches) { if (dockPref()) open(); else { tabLabel(); tab.hidden = false; } }
  maybeAutoOpen();
})();
