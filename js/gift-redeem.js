/* Seraphic Styler — gift redemption calculator (gift-redeem.js)
   ----------------------------------------------------------------------
   Recipient-facing. Someone was gifted a tier; they've picked a few
   pieces; this shows — plainly — what redeeming actually costs them:

        pieces (at cost)  −  their gift credit  +  shipping to them.

   Everything else (styling, sourcing, packing) is already paid by the
   gift, so it's shown as "included," never as a number they owe. The aim
   is education: make the money visible so an overseas recipient trusts it.

   Reads its numbers straight from window.CONFIG (the estimator's own
   config) so tier credits and shipping can never drift out of step with
   the rest of the site. Self-injecting in the fd-basket / route-panel
   mold: own DOM, own <style>, themed off the page's CSS variables.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_GIFT_REDEEM) return;

  var host = document.getElementById('gift');
  if (!host) return;                                  // only on the page with the gift section
  var wrap = host.querySelector('.wrap') || host;

  /* ---------- config (with safe fallbacks if the estimator isn't present) ---------- */
  var C = window.CONFIG || {};
  var STYLING = C.styling || {
    discovery: { vnd: 1300000, credit: 900000,  label: 'The Discovery' },
    edit:      { vnd: 3900000, credit: 2700000, label: 'The Edit' },
    capsule:   { vnd: 6500000, credit: 4600000, label: 'The Capsule' },
    atelier:   { vnd: 9200000, credit: 6300000, label: 'The Atelier' }
  };
  var SHIP = C.shipping || {
    asia:    { light: [900000, 2200000],  standard: [1800000, 5000000] },
    oceania: { light: [1500000, 3300000], standard: [2800000, 7500000] },
    us:      { light: [1900000, 4500000], standard: [3800000, 10000000] },
    eu:      { light: [1800000, 4300000], standard: [3600000, 9500000] },
    mena:    { light: [1800000, 4300000], standard: [3500000, 9300000] },
    sca:     { light: [1700000, 4100000], standard: [3400000, 9200000] },
    latam:   { light: [2200000, 5100000], standard: [4500000, 11500000] },
    africa:  { light: [2300000, 5300000], standard: [4600000, 12000000] }
  };
  var CUSTOM_W = C.customWeights || ['heavy', 'haul'];
  var FX = C.fx || { fallbackVndPerUsd: 26150, spread: 0.025, step: 50 };
  var TALLY = (C.contact && C.contact.tally) || 'https://tally.so/r/gD10Kl';

  var REGION_LABELS = {
    asia: 'East & Southeast Asia', oceania: 'Australia & New Zealand', us: 'United States & Canada',
    eu: 'Europe & UK', mena: 'Middle East & North Africa', sca: 'South & Central Asia',
    latam: 'Latin America', africa: 'Africa'
  };
  var WEIGHT_LABELS = {
    light: 'Light — 0.5–3 kg', standard: 'Standard — 3–10 kg',
    heavy: 'Heavy — 10–20 kg (quoted)', haul: 'Large — 20 kg+ (quoted)'
  };
  var CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'KRW', 'CNY', 'THB', 'AED', 'INR', 'VND'];
  var FALLBACK_RATES = { USD: 1, EUR: 0.92, GBP: 0.79, AUD: 1.5, CAD: 1.36, SGD: 1.34, JPY: 155, KRW: 1350, CNY: 7.2, THB: 36, AED: 3.67, INR: 83 };
  /* tier order for the dropdown — only tiers that actually exist in config */
  var TIER_ORDER = ['discovery', 'edit', 'capsule', 'atelier'].filter(function (k) { return STYLING[k]; });

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(key, en) { return window.SS_T ? window.SS_T(key, en) : en; }
  function fmtVnd(n) { return Math.round(n).toLocaleString('en-US') + '₫'; }
  function parseVnd(raw) {
    if (raw == null) return 0;
    var s = String(raw).toLowerCase().replace(/vnd|[₫đ]/g, '').replace(/\s+/g, '');
    if (!s) return 0;
    var mult = 1;
    if (/tr$/.test(s)) { mult = 1e6; s = s.slice(0, -2); }
    else if (/m$/.test(s)) { mult = 1e6; s = s.slice(0, -1); }
    else if (/k$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }
    var n;
    if (mult > 1) n = parseFloat(s.replace(',', '.'));
    else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) n = parseInt(s.replace(/[.,]/g, ''), 10);
    else if (/^\d+([.,]\d+)?$/.test(s)) n = parseFloat(s.replace(',', '.'));
    else return 0;
    if (isNaN(n) || n <= 0) return 0;
    var v = n * mult;
    if (mult === 1 && v <= 9999) v = v * 1000;        // bare "350" reads as thousands, like the tray
    return Math.round(v);
  }

  /* ---------- FX ---------- */
  var fxRate = FX.fallbackVndPerUsd, allRates = null, fxLive = false;
  function rateFor(c) { return (allRates && allRates[c] != null) ? allRates[c] : (FALLBACK_RATES[c] != null ? FALLBACK_RATES[c] : 1); }
  /* Same floored charge rate as the estimator, so a recipient redeeming a gift
     sees the figure the written quote will use. */
  function toCur(vnd, cur) {
    if (window.SS_allInRate) return vnd / window.SS_allInRate(fxRate / rateFor(cur));
    return (vnd / (fxRate * (1 - (FX.spread || 0.025)))) * rateFor(cur);
  }
  function fmtCur(n, cur) {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: (cur === 'JPY' || cur === 'KRW' || cur === 'VND' ? 0 : 2) }).format(n); }
    catch (e) { return '$' + n.toFixed(2); }
  }
  function loadFx() {
    try {
      fetch('https://open.er-api.com/v6/latest/USD')
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.rates && d.rates.VND) { fxRate = d.rates.VND; allRates = d.rates; fxLive = true; recalc(); } })
        .catch(function () {});
    } catch (e) {}
  }

  /* ---------- styles ---------- */
  var css =
    '#giftRedeem{max-width:44rem;margin:2.5rem auto 0;border:1px solid var(--surface-border);border-radius:var(--card-radius);' +
      'background:var(--surface-soft);padding:1.6rem 1.5rem;text-align:left;}' +
    '#giftRedeem .gr-h{font-family:var(--font-display);font-size:1.25rem;color:var(--text-primary);margin:0 0 .3rem;}' +
    '#giftRedeem .gr-sub{font-size:.85rem;color:var(--text-secondary);line-height:1.6;margin:0 0 1.1rem;}' +
    '#giftRedeem .gr-controls{display:grid;grid-template-columns:1fr 1fr;gap:.7rem .8rem;margin-bottom:1rem;}' +
    '#giftRedeem .gr-field{display:flex;flex-direction:column;gap:.28rem;min-width:0;}' +
    '#giftRedeem .gr-field.gr-wide{grid-column:1 / -1;}' +
    '#giftRedeem label{font-family:var(--font-accent);font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent-deep);}' +
    '#giftRedeem select,#giftRedeem input{font:inherit;font-size:.9rem;color:var(--text-primary);background:var(--surface);' +
      'border:1px solid var(--surface-border);border-radius:calc(var(--card-radius) * .5);padding:.5rem .6rem;width:100%;min-width:0;}' +
    '#giftRedeem select:focus,#giftRedeem input:focus{outline:2px solid color-mix(in srgb,var(--accent) 45%,transparent);outline-offset:1px;}' +
    '#giftRedeem .gr-piece{display:flex;gap:.5rem;align-items:center;margin-bottom:.45rem;}' +
    '#giftRedeem .gr-piece input{flex:1;}' +
    '#giftRedeem .gr-rm{flex:none;font:inherit;background:none;border:0;cursor:pointer;color:var(--text-secondary);padding:.3rem .5rem;border-radius:50%;font-size:1rem;line-height:1;}' +
    '#giftRedeem .gr-rm:hover{color:var(--accent);}' +
    '#giftRedeem .gr-add{font:inherit;font-size:.82rem;background:none;border:1px dashed var(--surface-border);border-radius:999px;' +
      'padding:.4rem .9rem;cursor:pointer;color:var(--accent);margin-top:.15rem;}' +
    '#giftRedeem .gr-add:hover{border-color:var(--accent);border-style:solid;}' +
    '#giftRedeem .gr-result{margin-top:1.2rem;border-top:1px solid var(--surface-border);padding-top:.9rem;display:flex;flex-direction:column;gap:.45rem;}' +
    '#giftRedeem .gr-row{display:flex;justify-content:space-between;gap:1rem;font-size:.88rem;color:var(--text-primary);}' +
    '#giftRedeem .gr-row span:first-child{color:var(--text-secondary);}' +
    '#giftRedeem .gr-row .v{font-variant-numeric:tabular-nums;text-align:right;}' +
    '#giftRedeem .gr-credit .v,#giftRedeem .gr-incl .v{color:var(--accent);}' +
    '#giftRedeem .gr-row.gr-total{border-top:1px solid var(--surface-border);padding-top:.55rem;margin-top:.2rem;font-weight:600;font-size:1rem;}' +
    '#giftRedeem .gr-usd{font-size:.78rem;color:var(--text-secondary);}' +
    '#giftRedeem .gr-note{font-size:.8rem;color:var(--text-secondary);line-height:1.55;margin:.7rem 0 0;}' +
    '#giftRedeem .gr-cta{margin-top:1.15rem;display:inline-block;}' +
    '@media(max-width:560px){#giftRedeem .gr-controls{grid-template-columns:1fr;}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------- DOM ---------- */
  function opt(v, label, sel) { return '<option value="' + esc(v) + '"' + (sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  var tierOpts = TIER_ORDER.map(function (k) {
    return opt(k, (STYLING[k].label || k) + ' — ' + fmtVnd(STYLING[k].credit || 0) + ' ' + t('gr.creditword', 'credit'), k === 'edit');
  }).join('') + opt('custom', t('gr.other', 'Other amount…'), false);
  var regionOpts = Object.keys(SHIP).map(function (k) { return opt(k, REGION_LABELS[k] || k, k === 'us'); }).join('');
  var weightOpts = ['light', 'standard', 'heavy', 'haul'].map(function (k) { return opt(k, WEIGHT_LABELS[k], k === 'light'); }).join('');
  var curOpts = CURRENCIES.map(function (k) { return opt(k, k, k === 'USD'); }).join('');

  var box = document.createElement('div');
  box.id = 'giftRedeem';
  box.innerHTML =
    '<h3 class="gr-h">' + esc(t('gr.h', 'Redeeming a gift? See exactly what you’d pay')) + '</h3>' +
    '<p class="gr-sub">' + esc(t('gr.sub', 'Your gift already covers the styling, sourcing and packing. To redeem, you only add the pieces beyond your credit — at their real store price — and shipping to you. Try it with the pieces you have in mind.')) + '</p>' +
    '<div class="gr-controls">' +
      '<div class="gr-field"><label for="grTier">' + esc(t('gr.tier', 'Your gift')) + '</label><select id="grTier">' + tierOpts + '</select></div>' +
      '<div class="gr-field" id="grCustomWrap" style="display:none"><label for="grCustom">' + esc(t('gr.custom', 'Your credit (₫)')) + '</label><input id="grCustom" type="text" inputmode="numeric" placeholder="e.g. 2,000,000 or 2m"></div>' +
      '<div class="gr-field"><label for="grRegion">' + esc(t('gr.region', 'Ship to')) + '</label><select id="grRegion">' + regionOpts + '</select></div>' +
      '<div class="gr-field"><label for="grWeight">' + esc(t('gr.weight', 'Parcel size')) + '</label><select id="grWeight">' + weightOpts + '</select></div>' +
      '<div class="gr-field"><label for="grCur">' + esc(t('gr.cur', 'Show in')) + '</label><select id="grCur">' + curOpts + '</select></div>' +
    '</div>' +
    '<div class="gr-field gr-wide"><label>' + esc(t('gr.pieces', 'The pieces you’ve chosen (real store price)')) + '</label><div id="grItems"></div>' +
      '<button type="button" class="gr-add" id="grAdd">' + esc(t('gr.add', '+ Add a piece')) + '</button></div>' +
    '<div class="gr-result">' +
      '<div class="gr-row"><span>' + esc(t('gr.rPieces', 'Pieces (at cost)')) + '</span><span class="v" id="grPieces">0₫</span></div>' +
      '<div class="gr-row gr-credit"><span>' + esc(t('gr.rCredit', 'Your gift credit')) + '</span><span class="v" id="grCredit">0₫</span></div>' +
      '<div class="gr-row gr-incl"><span>' + esc(t('gr.rStyling', 'Styling, sourcing & packing')) + '</span><span class="v">' + esc(t('gr.included', 'included ✓')) + '</span></div>' +
      '<div class="gr-row"><span>' + esc(t('gr.rShip', 'Shipping to you')) + '</span><span class="v" id="grShip">—</span></div>' +
      '<div class="gr-row gr-total"><span>' + esc(t('gr.rTotal', 'You’d pay to redeem')) + '</span><span class="v" id="grTotal">—</span></div>' +
      '<div class="gr-row gr-usd"><span id="grFx"></span><span class="v" id="grUsd"></span></div>' +
      '<p class="gr-note" id="grNote"></p>' +
    '</div>' +
    '<a class="btn btn-primary gr-cta" id="grCta" href="links">' + esc(t('gr.cta', 'Redeem this gift →')) + '</a>';

  var support = wrap.querySelector('.gift-support');
  if (support && support.parentNode === wrap) wrap.insertBefore(box, support.nextSibling);
  else wrap.appendChild(box);

  /* ---------- wiring ---------- */
  var grTier = box.querySelector('#grTier'), grCustomWrap = box.querySelector('#grCustomWrap'),
      grCustom = box.querySelector('#grCustom'), grRegion = box.querySelector('#grRegion'),
      grWeight = box.querySelector('#grWeight'), grCur = box.querySelector('#grCur'),
      grItems = box.querySelector('#grItems'), grAdd = box.querySelector('#grAdd'),
      grPieces = box.querySelector('#grPieces'), grCredit = box.querySelector('#grCredit'),
      grShip = box.querySelector('#grShip'), grTotal = box.querySelector('#grTotal'),
      grFx = box.querySelector('#grFx'), grUsd = box.querySelector('#grUsd'),
      grNote = box.querySelector('#grNote'), grCta = box.querySelector('#grCta');

  function addPiece(val) {
    var row = document.createElement('div');
    row.className = 'gr-piece';
    row.innerHTML = '<input type="text" inputmode="numeric" class="gr-price" placeholder="' + esc(t('gr.price', 'e.g. 850,000 or 850k')) + '" value="' + esc(val || '') + '">' +
      '<button type="button" class="gr-rm" aria-label="' + esc(t('gr.remove', 'Remove')) + '">✕</button>';
    row.querySelector('.gr-price').addEventListener('input', recalc);
    row.querySelector('.gr-rm').addEventListener('click', function () {
      row.remove(); if (!grItems.children.length) addPiece(''); recalc();
    });
    grItems.appendChild(row);
  }

  function piecesTotal() {
    var sum = 0;
    grItems.querySelectorAll('.gr-price').forEach(function (i) { sum += parseVnd(i.value); });
    return sum;
  }
  function creditFor() {
    if (grTier.value === 'custom') return parseVnd(grCustom.value);
    var s = STYLING[grTier.value]; return s ? (s.credit || 0) : 0;
  }

  function recalc() {
    grCustomWrap.style.display = grTier.value === 'custom' ? '' : 'none';
    var cur = grCur.value, region = grRegion.value, weight = grWeight.value;
    var pieces = piecesTotal(), credit = creditFor();
    var applied = Math.min(credit, pieces), balance = pieces - applied, leftover = Math.max(0, credit - pieces);
    var isCustomW = CUSTOM_W.indexOf(weight) !== -1;
    var zone = SHIP[region] || SHIP.us;
    var ship = isCustomW ? null : (zone[weight] || zone.light);

    grPieces.textContent = fmtVnd(pieces);
    grCredit.textContent = applied > 0 ? '−' + fmtVnd(applied) : '0₫';

    if (isCustomW) {
      grShip.textContent = t('gr.customquote', 'Custom quote (10kg+)');
      grTotal.textContent = fmtVnd(balance) + t('gr.plusship', ' + shipping');
      grUsd.textContent = '≈ ' + fmtCur(toCur(balance, cur), cur) + t('gr.plusship', ' + shipping');
    } else {
      grShip.textContent = fmtVnd(ship[0]) + ' – ' + fmtVnd(ship[1]);
      var lo = balance + ship[0], hi = balance + ship[1];
      grTotal.textContent = fmtVnd(lo) + ' – ' + fmtVnd(hi);
      grUsd.textContent = '≈ ' + fmtCur(toCur(lo, cur), cur) + ' – ' + fmtCur(toCur(hi, cur), cur);
    }
    grFx.textContent = cur === 'VND' ? '' : ((fxLive ? t('gr.live', 'Live rate') : t('gr.offline', 'Estimate')) + ', ' + cur);

    if (pieces === 0) grNote.textContent = t('gr.note0', 'Add the pieces you’re considering above to see your redemption total.');
    else if (leftover > 0) grNote.textContent = window.SS_TF ? window.SS_TF('gr.noteLeft', 'You’re fully covered — {x} of credit remains. Use it now, or save it for a future order. You’d pay shipping only.', { x: fmtVnd(leftover) }) : ('You’re fully covered — ' + fmtVnd(leftover) + ' of credit remains. Use it now, or save it for a future order. You’d pay shipping only.');
    else if (balance > 0) grNote.textContent = window.SS_TF ? window.SS_TF('gr.noteBal', 'Your {c} credit is applied in full; the {b} beyond it is at cost, plus shipping.', { c: fmtVnd(credit), b: fmtVnd(balance) }) : ('Your ' + fmtVnd(credit) + ' credit is applied in full; the ' + fmtVnd(balance) + ' beyond it is at cost, plus shipping.');
    else grNote.textContent = t('gr.noteExact', 'Your credit covers the pieces exactly. You’d pay shipping only.');

    var label = grTier.value === 'custom' ? 'A custom amount' : ((STYLING[grTier.value] && STYLING[grTier.value].label) || grTier.value);
    var brief = 'Redeeming ' + label + '. Pieces ' + fmtVnd(pieces) + ', credit ' + fmtVnd(applied) + ', to ' + (REGION_LABELS[region] || region) + '.';
    grCta.setAttribute('data-brief', brief);  // CTA now routes to the /links contact hub; this rides along to the clipboard on click
  }

  grTier.addEventListener('change', recalc);
  grCustom.addEventListener('input', recalc);
  grRegion.addEventListener('change', recalc);
  grWeight.addEventListener('change', recalc);
  grCur.addEventListener('change', recalc);
  grAdd.addEventListener('click', function () { addPiece(''); recalc(); });
  document.addEventListener('ss:lang', recalc);
  grCta.addEventListener('click', function () {
    var b = grCta.getAttribute('data-brief') || '';
    if (b && navigator.clipboard) navigator.clipboard.writeText(b).catch(function () {});
  });

  addPiece('');
  recalc();
  loadFx();

  window.SS_GIFT_REDEEM = { recalc: recalc };
})();
