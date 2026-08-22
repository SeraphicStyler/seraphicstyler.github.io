/* Seraphic Styler — grounded basket estimator
   ----------------------------------------------------------------------
   An ESTIMATE tool, not a checkout. Final quote is confirmed by DM.
   Model: per-item service fee + flat base fee (+ optional complexity)
          + shipping range, with live VND->USD.
   Everything you might change is in CONFIG below.
   ====================================================================== */

var CONFIG = {
  /* Per-ITEM service fee tiers (VND). Includes domestic VN shipping. */
  fee: {
    minFee: 350000,                             // every item pays at least 350,000₫ (raised 4 Aug 2026)
    midThreshold: 5000000,  midRate: 0.08,      // item ≤ 5M -> 8%
    highRate: 0.07                              // > 5M -> 7%
  },
  baseFee: 250000,        // flat per-order coordination, rides & packing fee (raised 4 Aug 2026)
  complexFee: 200000,     // optional surcharge for rare/rush sourcing
  stops: { included: 2, perExtra: 150000 }, // first two boutiques included; +150,000₫ per additional store
  greenDiscount: 0.10,    // modest discount on the SERVICE FEE for green/eco shopping (0.10 = 10% off fees)

  /* Optional styling-service add-ons (VND) — the SAME prices as the gift tiers
     ($49 / $149 / $349 = 1,225,000 / 3,725,000 / 8,725,000₫), and like the gifts
     each includes a piece CREDIT ($34 / $104 / $239 = 850,000 / 2,600,000 /
     5,975,000₫) applied against the itemized pieces in the estimate (capped at
     the items subtotal, never negative; with no items yet, it applies once
     pieces are added). The remainder is my
     styling TIME. Keep prices, credits and the gift-card split lines in step. */
  styling: {
    discovery: { vnd: 1225000, credit: 850000,  label: 'The Discovery' },
    edit:      { vnd: 3725000, credit: 2600000, label: 'The Edit' },
    capsule:   { vnd: 6225000, credit: 4350000, label: 'The Capsule' },
    atelier:   { vnd: 8725000, credit: 5975000, label: 'The Atelier' }
  },

  /* The one FX dial. `spread` is the margin held back from the live mid-market
     rate — it covers what it actually costs to move money into Vietnam plus the
     2–7 days between quoting and payment landing. REAL Wise USD→VND costs:
     $3.97 on $125 = 3.18% (July 2026 receipt, bank-funded) and Wise's own
     comparison API, 14 Aug 2026: $8.55/$125 = 6.8% · $10.56/$500 = 2.1% ·
     $13.26/$1,000 = 1.3% · $18.62/$2,000 = 0.9%. Shape: a FIXED fee ($3–8
     depending on funding method) + ~0.5% variable — never budget the
     "from 0.24%" headline, and never send small. The effective margin is
     spread PLUS the maxVndPerUsd cap below: at mid 26,034 the charged 25,000
     rate holds back ~4% total — enough for BATCHED transfers ($500+, ~1–2%
     cost), not solo per-order sends. Ops rule + ledger:
     ~/Desktop/Seraphic Styler Internal/wise-payout-playbook.md.
     WATCH RULE: if mid-market falls below ~25,600₫/$, the margin thins to
     ~2% and stops covering the batch cost comfortably — re-peg maxVndPerUsd
     down per the FX-peg policy (USD-anchored ₫ figures move down). Raised to
     2.5% on 7 Aug 2026; the page discloses it as "transfer costs included".
     `step` floors the result to a calm figure (26,148 → 25,450) so the printed
     rate IS the charged rate. Flooring never rounds toward the client.
     `fallbackVndPerUsd` is only used if both live feeds fail — keep it near
     the real market so an offline estimate is not wildly off.
     `maxVndPerUsd` is the upper bound on the printed rate, so an estimate and
     a published price always agree. Scaled by the client's currency, so EUR
     and KRW quotes are bounded in the same proportion. */
  fx: { fallbackVndPerUsd: 26150, spread: 0.025, step: 50, maxVndPerUsd: 25000 },

  /* Card (Stripe) processing pass-through: charged = (amount + fixedUsd*fx) / (1 - rate).
     Bank transfer / Wise / Zelle carry no fee.

     Stripe stacks its surcharges, and I cannot tell from an estimate whose card is
     domestic, so every card estimate is priced at the INTERNATIONAL rate — the
     ceiling, never short. If the real card turns out to be domestic, the payment
     link costs less than this line, never more. Stripe's published rates (Aug 2026):
       base 2.9% + $0.30  ·  +1.5% international card  ·  +1% currency conversion
     manualEntry (+0.5%) applies only to cards typed in by hand — payment links and
     Checkout are never manually entered, so it stays 0. Set it if that ever changes. */
  card: { rate: 0.029, intl: 0.015, fx: 0.01, manualEntry: 0, fixedUsd: 0.30 },

  /* Explicit currency-transfer allowance (her call; raised 1.5% → 3% on
     15 Aug 2026): 3% of the payable amount before shipping, its own line on
     every estimate. Sized for the REAL operating model — Ba often needs the
     money within ~30 minutes, so sends are solo and instant-funded (debit
     card, the expensive Wise tier ≈ $8 fixed + 0.5%). Peg (~4%) + this line
     (3%) ≈ 7% total covers a solo instant send down to ~$125; batching is
     pure upside, never required. At cost, never marked up; applies to all
     payment methods (cash-out to ₫ happens regardless of how the client pays). */
  fxFee: 0.03,

  /* Payment is taken in two parts, so the card fee lands on each part separately
     (Stripe charges its fixed $0.30 per charge, not per order):
       deposit  — pieces + service fees + base (+ styling, complexity, less credits)
       balance  — exact shipping, once the parcel is packed and weighed */
  splitPayment: true,

  /* Shipping estimate ranges in VND [economy low, express high].
     Two estimable classes: light (0.5-3kg) & standard (3-10kg). Anchored to a REAL
     shipment (Jul 2026): 0.5-1 kg international parcel = 1,950,000₫ — courier rates
     for clothes are genuinely expensive, so lows are honest floors, not teasers.
     heavy (10-20kg) & haul (20kg+) are custom-quoted after consolidation, so they
     show "custom quote" not a number. */
  shipping: {
    asia:    { light: [900000, 2200000],  standard: [1800000, 5000000] },   // East & SE Asia
    oceania: { light: [1500000, 3300000], standard: [2800000, 7500000] },   // Australia & New Zealand
    us:      { light: [1900000, 4500000], standard: [3800000, 10000000] },  // US & Canada
    eu:      { light: [1800000, 4300000], standard: [3600000, 9500000] },   // Europe & UK
    mena:    { light: [1800000, 4300000], standard: [3500000, 9300000] },   // Middle East & North Africa
    sca:     { light: [1700000, 4100000], standard: [3400000, 9200000] },   // South & Central Asia
    latam:   { light: [2200000, 5100000], standard: [4500000, 11500000] },  // Latin America
    africa:  { light: [2300000, 5300000], standard: [4600000, 12000000] }   // Africa
  },
  customWeights: ['heavy', 'haul'],

  contact: {
    instagram: 'https://instagram.com/seraphicstyler',
    tiktok: 'https://tiktok.com/@seraphicstyler',
    email: 'seraphicstyler@gmail.com',
    tally: 'https://tally.so/r/gD10Kl', // inquiry form — estimates prefill the "Your estimate" question
    whatsapp: '' // your WhatsApp number, digits only incl. country code, e.g. '84901234567' (84 = Vietnam). Leave '' to hide WhatsApp.
  }
};

/* The rate the site both SHOWS and CHARGES, from a raw market rate in VND per
   one unit of the client's currency. Live mid-market, less the transfer margin,
   floored to a readable step — so a client who multiplies by the printed rate
   lands on our exact figure instead of one a few hundred đồng away. Global on
   purpose: links.html, the tray and the redeem page all quote from this.
   `unitsPerUsd` (1 for USD, 0.92 for EUR, …) scales the CONFIG.fx.maxVndPerUsd
   ceiling into the client's currency; omit it and the cap is read as USD. */
function SS_allInRate(vndPerUnit, unitsPerUsd) {
  var v = vndPerUnit * (1 - CONFIG.fx.spread);
  /* Bounded so an estimate never exceeds the published rate. */
  var cap = CONFIG.fx.maxVndPerUsd;
  if (cap) { cap = cap / (unitsPerUsd || 1); if (v > cap) v = cap; }
  /* Coarse steps on big numbers, finer on small ones, so 25,450₫/USD and
     18.89₫/KRW are both legible and both exact. */
  var step = v >= 20000 ? (CONFIG.fx.step || 50)
           : v >= 2000  ? 10
           : v >= 200   ? 1
           : v >= 20    ? 0.1 : 0.01;
  return Math.floor(v / step) * step;
}
/* Printed form of a rate — decimals only where the number needs them. */
function SS_fmtRate(v) {
  return v.toLocaleString('en-US', { maximumFractionDigits: v >= 200 ? 0 : 2 });
}

/* ---------------------------------------------------------------------- */
(function () {
  'use strict';
  var fxRate = CONFIG.fx.fallbackVndPerUsd;
  var allRates = null; // full USD-based rate table from the API
  var fxLive = false, fxWhen = '';
  var API = 'https://api.seraphicstyler.com';
  var preview = null;   // set when the page was opened from a 24h preview link: inputs + the quoted rate
  // approximate USD-based rates for offline fallback (only used if the API can't load)
  var FALLBACK_RATES = { USD:1, EUR:0.92, GBP:0.79, AUD:1.5, CAD:1.36, SGD:1.34, JPY:155, KRW:1350, CNY:7.2, THB:36, AED:3.67, INR:83 };

  var el = {};
  ['lineItems','addItem','region','region2','compareDest','compareWrap','destCompare','weight','stops','complex','green','styling','payMethod','estCurrency','rSubtotal','rFee','rFeeNote','rBase','rStopsRow','rStops',
   'rStyleRow','rStyle','rStyleNote','rCreditRow','rCredit','rLeftoverRow','rLeftover','rLeftoverUsd','rComplexRow','rComplex','rGreenRow','rGreen','rFxRow','rFx','rCardRow','rCard','rShip','rShipNote','rDepositRow','rDeposit','rDepositCur','rBalanceRow','rBalance','rBalanceCur','rDepositCard','rDepositCardV','tipDepCard','rDepositTot','rDepositTotV','rBalanceCard','rBalanceCardV','tipBalCard','rBalanceTot','rBalanceTotV','previewLink','previewMsg','previewNote','shareCard','shareRow','shareUrl','shareCopy','rTotal','rUsd','fxStatus','sendBasket','copiedMsg','estEmptyMsg']
    .forEach(function (id) { el[id] = document.getElementById(id); });
  if (!el.lineItems) return; // not on a page with the estimator

  function curCode() { return (el.estCurrency && el.estCurrency.value) || 'USD'; }
  function t(key, en) { return window.SS_T ? window.SS_T(key, en) : en; }
  function tf(key, en, vars) { return window.SS_TF ? window.SS_TF(key, en, vars) : en; }
  function fmtVnd(n) { return Math.round(n).toLocaleString('en-US') + '₫'; }
  function fmtCur(n) {
    var c = curCode();
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, maximumFractionDigits: (c === 'JPY' || c === 'KRW' ? 0 : 2) }).format(n); }
    catch (e) { return '$' + n.toFixed(2); }
  }
  function rateFor(c) { return (allRates && allRates[c] != null) ? allRates[c] : (FALLBACK_RATES[c] != null ? FALLBACK_RATES[c] : 1); }
  /* One rate, used for every figure on the page and printed in the status line
     verbatim. Showing a different number than the totals used is what made the
     old estimate read as confusing — clients compared the two and worried. */
  function chargeRate(c) { return SS_allInRate(fxRate / rateFor(c), rateFor(c)); }
  function toCur(vnd) { return vnd / chargeRate(curCode()); }
  function updateFxStatus() {
    if (!el.fxStatus) return;
    var c = curCode();
    if (preview) {
      el.fxStatus.textContent = t('est.fx.preview', 'Rate as quoted') + ' · 1 ' + c + ' ≈ ' + SS_fmtRate(chargeRate(c)) + '₫ · ' + (preview.fx.when || String(preview.createdAt || '').slice(0, 10));
      return;
    }
    var line = ' · 1 ' + c + ' ≈ ' + SS_fmtRate(chargeRate(c)) + '₫ · ';
    el.fxStatus.textContent = fxLive
      ? t('est.fx.live2', "Today's rate") + line + t('est.fx.incl', 'refreshed daily')
      : t('est.fx.offline2', 'Offline estimate') + line + t('est.fx.confirm', 'exact rate confirmed in your written quote');
  }

  /* Same forgiving VND parser as the redeem page and directory tray:
     "850k" / "2m" / "1tr" / "1.500.000" / bare "850" (→ 850,000₫) all read correctly. */
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

  function itemFee(p) {
    var f = CONFIG.fee;
    if (p <= 0) return 0;
    var pct = p <= f.midThreshold ? p * f.midRate : p * f.highRate;
    return Math.max(f.minFee, pct);
  }

  /* Total percentage Stripe takes off a card charge, at the international ceiling. */
  function cardRate() {
    var cc = CONFIG.card;
    return cc.rate + (cc.intl || 0) + (cc.fx || 0) + (cc.manualEntry || 0);
  }
  function cardRatePct() { return (cardRate() * 100).toFixed(1).replace(/\.0$/, '') + '%'; }

  /* Exact Stripe pass-through: what must be added so the charged amount nets amountVnd. */
  function cardFee(amountVnd) {
    var cc = CONFIG.card;
    if (!cc || !(amountVnd > 0)) return 0;
    return (amountVnd + cc.fixedUsd * fxRate) / (1 - cardRate()) - amountVnd;
  }

  function readItems() {
    var vals = [];
    el.lineItems.querySelectorAll('.item-price').forEach(function (i) {
      vals.push(parseVnd(i.value));
    });
    return vals;
  }
  function readLinks() {
    var out = [];
    el.lineItems.querySelectorAll('.item-link').forEach(function (i) { out.push((i.value || '').trim()); });
    return out;
  }

  function addItem(value, link) {
    var row = document.createElement('div');
    row.className = 'line-item';
    row.innerHTML =
      '<div class="li-fields">' +
        '<input class="item-price" type="text" inputmode="numeric" placeholder="e.g. 850,000 or 850k" aria-label="Item price in VND" aria-describedby="estItemsNote">' +
        '<input class="item-link" type="url" placeholder="URL / link (optional)" aria-label="Item link (optional)">' +
      '</div>' +
      '<button class="remove-item" type="button" aria-label="Remove item">✕</button>';
    var pIn = row.querySelector('.item-price'); pIn.value = value || '';
    var lIn = row.querySelector('.item-link'); lIn.value = link || '';
    pIn.addEventListener('input', function () {
      var raw = pIn.value.trim();
      pIn.setAttribute('aria-invalid', (raw !== '' && !(parseVnd(raw) > 0)) ? 'true' : 'false');
      recalc();
    });
    lIn.addEventListener('input', save);
    row.querySelector('.remove-item').addEventListener('click', function () {
      row.remove(); if (!el.lineItems.children.length) addItem(''); recalc();
    });
    el.lineItems.appendChild(row);
  }

  function save() {
    if (preview) return;   // a preview is the client's view of my numbers — never overwrite their own basket with it
    try {
      localStorage.setItem('ss-basket', JSON.stringify({
        items: readItems(), links: readLinks(), region: el.region.value, weight: el.weight.value, stops: el.stops ? el.stops.value : '', complex: el.complex.checked, green: !!(el.green && el.green.checked), styling: (el.styling && el.styling.value) || 'none', pay: (el.payMethod && el.payMethod.value) || 'bank', cur: curCode(),
        compare: !!(el.compareDest && el.compareDest.checked), region2: (el.region2 && el.region2.value) || ''
      }));
    } catch (e) {}
  }

  /* --- Destination comparison helpers -------------------------------------
     A client can often receive to more than one country (a dress that could go
     to the UK or to China). Shipping is the biggest variable in the estimate,
     so let them see both routes side by side instead of toggling back and
     forth. Everything except shipping (and the card fee that rides on it) is
     identical between destinations, so only shipping is recomputed. */
  function shipRange(regionVal, weightVal) {
    if (CONFIG.customWeights.indexOf(weightVal) !== -1) return null; // custom quote
    var zone = CONFIG.shipping[regionVal] || CONFIG.shipping.us;
    return zone[weightVal] || zone.light;
  }
  function totalsFor(nonShip, ship, card) {
    if (!ship) return null;
    var lo = nonShip + ship[0] + (card ? cardFee(nonShip + ship[0]) : 0);
    var hi = nonShip + ship[1] + (card ? cardFee(nonShip + ship[1]) : 0);
    return { ship: ship, lo: lo, hi: hi };
  }
  function regionLabel(v) {
    var o = el.region && el.region.querySelector('option[value="' + v + '"]');
    return o ? o.textContent : v;
  }
  /* A sensible second region when the two selects collide — the routes clients
     most often weigh against each other, in order. */
  function firstOtherRegion(v) {
    var pref = ['eu', 'us', 'asia', 'oceania', 'sca', 'mena', 'latam', 'africa'];
    for (var i = 0; i < pref.length; i++) if (pref[i] !== v && CONFIG.shipping[pref[i]]) return pref[i];
    return v;
  }
  function compareOn() {
    return !!(el.compareDest && el.compareDest.checked && el.region2 && el.region2.value &&
              el.region2.value !== el.region.value);
  }

  function compute() {
    var items = readItems();
    var subtotal = items.reduce(function (a, b) { return a + b; }, 0);
    var fees = items.reduce(function (a, b) { return a + itemFee(b); }, 0);
    var base = subtotal > 0 ? CONFIG.baseFee : 0;
    var complex = el.complex.checked ? CONFIG.complexFee : 0;
    var stopsN = el.stops ? (parseInt(el.stops.value, 10) || 0) : 0;
    var stopsFee = subtotal > 0 ? Math.max(0, stopsN - CONFIG.stops.included) * CONFIG.stops.perExtra : 0;
    var green = (el.green && el.green.checked) ? fees * CONFIG.greenDiscount : 0; // modest service-fee discount
    var styleCfg = (el.styling && CONFIG.styling[el.styling.value]) || null;
    var styling = styleCfg ? styleCfg.vnd : 0;
    var credit = styleCfg ? Math.min(styleCfg.credit || 0, subtotal) : 0; // piece credit, capped at items
    var creditLeft = (styleCfg && nItems > 0) ? Math.max(0, (styleCfg.credit || 0) - credit) : 0; // unused credit — carries to a future order
    var custom = CONFIG.customWeights.indexOf(el.weight.value) !== -1;
    var ship = shipRange(el.region.value, el.weight.value);
    var nItems = items.filter(function (v) { return v > 0; }).length;
    var card = !!(el.payMethod && el.payMethod.value === 'card');
    return { items: items, subtotal: subtotal, fees: fees, base: base, complex: complex, stopsFee: stopsFee, green: green, styling: styling, credit: credit, creditLeft: creditLeft, styleCfg: styleCfg, ship: ship, custom: custom, nItems: nItems, card: card };
  }

  /* Split an estimate into the two payments it is actually taken in.
     deposit = everything I can price today (pieces + fees, less credits)
     balance = shipping, which is only exact once the parcel is packed & weighed.
     Each is its own Stripe charge, so each carries its own processing fee. */
  function splitOf(nonShip, ship, card) {
    var depFee = card ? cardFee(nonShip) : 0;
    var balFeeLo = card ? cardFee(ship[0]) : 0;
    var balFeeHi = card ? cardFee(ship[1]) : 0;
    return {
      deposit: nonShip + depFee, depositFee: depFee,
      balLo: ship[0] + balFeeLo, balHi: ship[1] + balFeeHi,
      feeLo: depFee + balFeeLo, feeHi: depFee + balFeeHi,
      lo: nonShip + depFee + ship[0] + balFeeLo,
      hi: nonShip + depFee + ship[1] + balFeeHi
    };
  }
  /* The written maths behind one card charge, for the ⓘ beside the fee line.
     net = what must arrive; gross = what the card is charged; fee = the difference. */
  function cardMath(netVnd, feeVnd) {
    var cc = CONFIG.card, pct = cardRatePct();
    var fixed = cc.fixedUsd * fxRate, gross = netVnd + feeVnd;
    var parts = '<ul><li>' + esc(t('est.card.m1', '2.9% + $0.30 — Stripe\'s standard card rate')) + '</li>' +
      '<li>' + esc(t('est.card.m2', '+1.5% if the card is international')) + '</li>' +
      '<li>' + esc(t('est.card.m3', '+1% when currency conversion is required')) + '</li></ul>';
    var line = '(' + fmtCur(toCur(netVnd)) + ' + ' + fmtCur(toCur(fixed)) + ') ÷ (1 − ' + pct + ') = ' + fmtCur(toCur(gross));
    return '<b>' + esc(t('est.card.mh', 'Assumed at the full rate: ' + pct + ' + $0.30 of the amount charged')) + '</b>' + parts +
      esc(t('est.card.m4', 'The percentage comes off what the card is charged, so the charge is sized to net the amount due:')) +
      '<span class="m">' + line + '</span>' +
      '<span class="m">' + fmtCur(toCur(gross)) + ' − ' + fmtCur(toCur(netVnd)) + ' = ' + fmtCur(toCur(feeVnd)) + '</span>' +
      esc(t('est.card.m5', 'A ceiling, not a surprise — a domestic card costs less than this.'));
  }
  function showSplit(s) {
    if (!el.rDepositRow) return;
    el.rDepositRow.style.display = '';
    el.rBalanceRow.style.display = '';
    var depNet = s.deposit - s.depositFee;
    var balFeeLo = s.feeLo - s.depositFee, balFeeHi = s.feeHi - s.depositFee;
    var balNetLo = s.balLo - balFeeLo, balNetHi = s.balHi - balFeeHi;
    el.rDeposit.textContent = fmtVnd(depNet);
    el.rDepositCur.textContent = '≈ ' + fmtCur(toCur(depNet));
    el.rBalance.textContent = fmtVnd(balNetLo) + ' – ' + fmtVnd(balNetHi);
    el.rBalanceCur.textContent = '≈ ' + fmtCur(toCur(balNetLo)) + ' – ' + fmtCur(toCur(balNetHi));
    var card = s.depositFee > 0;
    ['rDepositCard','rDepositTot','rBalanceCard','rBalanceTot'].forEach(function (id) { if (el[id]) el[id].style.display = card ? '' : 'none'; });
    if (!card || !el.rDepositCardV) return;
    el.rDepositCardV.textContent = '≈ ' + fmtCur(toCur(s.depositFee));
    el.rDepositTotV.textContent = '≈ ' + fmtCur(toCur(s.deposit));
    if (el.tipDepCard) el.tipDepCard.innerHTML = cardMath(depNet, s.depositFee);
    el.rBalanceCardV.textContent = '≈ ' + fmtCur(toCur(balFeeLo)) + ' – ' + fmtCur(toCur(balFeeHi));
    el.rBalanceTotV.textContent = '≈ ' + fmtCur(toCur(s.balLo)) + ' – ' + fmtCur(toCur(s.balHi));
    if (el.tipBalCard) el.tipBalCard.innerHTML = cardMath(balNetLo, balFeeLo) +
      '<span class="m">' + esc(t('est.card.m6', 'Upper end of the shipping range:')) + ' ' + fmtCur(toCur(balNetHi)) + ' → ' + esc(t('est.card.m7', 'fee')) + ' ' + fmtCur(toCur(balFeeHi)) + '</span>';
  }
  function hideSplit() {
    if (!el.rDepositRow) return;
    el.rDepositRow.style.display = 'none';
    el.rBalanceRow.style.display = 'none';
    ['rDepositCard','rDepositTot','rBalanceCard','rBalanceTot'].forEach(function (id) { if (el[id]) el[id].style.display = 'none'; });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /* Side-by-side destination panel. Hidden unless the visitor has ticked
     "compare" AND picked a second, different region. */
  function renderCompare(c, nonShip) {
    if (!el.destCompare) return;
    var box = el.destCompare;
    if (!compareOn() || (c.nItems === 0 && c.styling === 0)) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;

    var head = '<p class="dc-h">' + esc(t('est.cmp.h', 'Comparing two destinations')) + '</p>';

    // Nothing shippable to compare yet (styling-only basket, or a custom-quote weight)
    if (c.nItems === 0 && c.styling > 0) {
      box.innerHTML = head + '<p class="dc-note">' +
        esc(t('est.cmp.nopieces', 'Shipping is added once your pieces are sourced — add an item to compare the two routes.')) + '</p>';
      return;
    }
    if (c.custom) {
      // interpolate here rather than via tf(), so the sentence still reads correctly
      // on a page where the i18n engine hasn't loaded
      var msg = t('est.cmp.custom', 'Parcels over 10 kg are custom-quoted, so I price both routes by hand — send the estimate and I will quote {a} and {b} together.')
        .replace('{a}', regionLabel(el.region.value)).replace('{b}', regionLabel(el.region2.value));
      box.innerHTML = head + '<p class="dc-note">' + esc(msg) + '</p>';
      return;
    }

    var opts = [el.region.value, el.region2.value].map(function (v) {
      return { v: v, name: regionLabel(v), t: totalsFor(nonShip, shipRange(v, el.weight.value), c.card) };
    });
    var bestLo = Math.min(opts[0].t.lo, opts[1].t.lo);

    var cards = opts.map(function (o) {
      var best = o.t.lo === bestLo;
      return '<div class="dc-card' + (best ? ' is-best' : '') + '">' +
        (best ? '<span class="dc-badge">' + esc(t('est.cmp.lower', 'Lower estimate')) + '</span>' : '') +
        '<p class="dc-name">' + esc(o.name) + '</p>' +
        '<p class="dc-line"><span>' + esc(t('est.shiplbl', 'Est. shipping')) + '</span><span>' + fmtVnd(o.t.ship[0]) + ' – ' + fmtVnd(o.t.ship[1]) + '</span></p>' +
        '<p class="dc-total">' + fmtVnd(o.t.lo) + ' – ' + fmtVnd(o.t.hi) + '</p>' +
        '<p class="dc-cur">≈ ' + esc(fmtCur(toCur(o.t.lo))) + ' – ' + esc(fmtCur(toCur(o.t.hi))) + '</p>' +
        '<button class="dc-use" type="button" data-use-region="' + esc(o.v) + '">' +
          esc(t('est.cmp.use', 'Ship here')) + '</button>' +
      '</div>';
    }).join('');

    var gapLo = Math.abs(opts[0].t.lo - opts[1].t.lo);
    var cheaper = opts[0].t.lo === bestLo ? opts[0].name : opts[1].name;
    var diff = gapLo > 0
      ? esc(cheaper) + ' ' + esc(t('est.cmp.cheaperby', 'is cheaper by about')) + ' ' + fmtVnd(gapLo) + ' (≈ ' + esc(fmtCur(toCur(gapLo))) + ')'
      : esc(t('est.cmp.even', 'Both routes estimate the same — pick whichever is easier to receive.'));

    box.innerHTML = head +
      '<p class="dc-sub">' + esc(t('est.cmp.sub', 'Same pieces, same fees — only shipping changes. Pick either one, or send both and I will confirm the real courier price for each.')) + '</p>' +
      '<div class="dc-grid">' + cards + '</div>' +
      '<p class="dc-diff">' + diff + '</p>' +
      '<p class="dc-note">' + esc(t('est.cmp.duty', 'Import duty and customs in the destination country are not included and differ by country — a cheaper route can still cost more after duty. I flag this before you pay.')) + '</p>';
  }

  function recalc() {
    var c = compute();
    el.rSubtotal.textContent = fmtVnd(c.subtotal);
    el.rFee.textContent = fmtVnd(c.fees);
    el.rFeeNote.textContent = c.nItems ? tf('est.itemcount', '(' + c.nItems + (c.nItems === 1 ? ' item' : ' items') + ')', { n: c.nItems }) : '';
    el.rBase.textContent = fmtVnd(c.base);
    if (c.complex > 0) { el.rComplexRow.style.display = ''; el.rComplex.textContent = fmtVnd(c.complex); }
    else { el.rComplexRow.style.display = 'none'; }
    if (el.rStopsRow) {
      if (c.stopsFee > 0) { el.rStopsRow.style.display = ''; el.rStops.textContent = '+' + fmtVnd(c.stopsFee); }
      else { el.rStopsRow.style.display = 'none'; }
    }
    if (el.rGreenRow) {
      if (c.green > 0) { el.rGreenRow.style.display = ''; el.rGreen.textContent = '−' + fmtVnd(c.green); }
      else { el.rGreenRow.style.display = 'none'; }
    }
    if (el.rStyleRow) {
      if (c.styling > 0) {
        el.rStyleRow.style.display = ''; el.rStyle.textContent = fmtVnd(c.styling);
        if (el.rStyleNote) el.rStyleNote.textContent = c.styleCfg ? c.styleCfg.label : '';
      } else { el.rStyleRow.style.display = 'none'; if (el.rStyleNote) el.rStyleNote.textContent = ''; }
    }
    if (el.rCreditRow) {
      if (c.credit > 0) { el.rCreditRow.style.display = ''; el.rCredit.textContent = '−' + fmtVnd(c.credit); }
      else { el.rCreditRow.style.display = 'none'; }
    }
    /* Unused tier credit is never lost — it stays on the gift for a future
       order. Informational only: it is not part of this order's total. */
    if (el.rLeftoverRow) {
      if (c.creditLeft > 0) {
        el.rLeftoverRow.style.display = '';
        el.rLeftover.textContent = fmtVnd(c.creditLeft);
        if (el.rLeftoverUsd) el.rLeftoverUsd.textContent = '≈ ' + fmtCur(toCur(c.creditLeft));
      } else { el.rLeftoverRow.style.display = 'none'; }
    }
    var nonShip = c.subtotal + c.fees + c.base + c.complex + c.stopsFee - c.green + c.styling - c.credit;
    /* Currency-transfer allowance rides on the payable amount, so it flows
       into the deposit, the card fee and every total below automatically. */
    var fxAllow = Math.round(nonShip * (CONFIG.fxFee || 0));
    nonShip += fxAllow;
    if (el.rFxRow) {
      if (fxAllow > 0) { el.rFxRow.style.display = ''; el.rFx.textContent = fmtVnd(fxAllow); }
      else { el.rFxRow.style.display = 'none'; }
    }
    renderCompare(c, nonShip);
    // When two destinations are in play, name the one this card is priced for.
    if (el.rShipNote) el.rShipNote.textContent = compareOn() ? '(' + regionLabel(el.region.value) + ')' : '';
    if (c.nItems === 0 && c.styling === 0) {
      // Nothing entered yet — an honest empty state, not a shipping band pretending to be a total.
      if (el.rCardRow) el.rCardRow.style.display = 'none';
      el.rShip.textContent = '—';
      el.rTotal.textContent = '—';
      el.rUsd.textContent = '—';
      if (el.estEmptyMsg) el.estEmptyMsg.style.display = '';
      hideSplit();
      updateFxStatus(); save(); return;
    }
    if (el.estEmptyMsg) el.estEmptyMsg.style.display = 'none';
    if (c.nItems === 0 && c.styling > 0) {
      // A styling service (consultation / edit) with no pieces sourced yet — nothing to ship.
      var cfS = c.card ? cardFee(nonShip) : 0;
      if (el.rCardRow) {
        if (cfS > 0) { el.rCardRow.style.display = ''; el.rCard.textContent = fmtVnd(cfS); }
        else { el.rCardRow.style.display = 'none'; }
      }
      el.rShip.textContent = t('est.ship.later', 'Added with your pieces');
      el.rTotal.textContent = fmtVnd(nonShip + cfS);
      el.rUsd.textContent = '≈ ' + fmtCur(toCur(nonShip + cfS));
      hideSplit();                       // styling only — one payment, nothing to ship
      updateFxStatus(); save(); return;
    }
    if (c.custom) {
      var cf = c.card ? cardFee(nonShip) : 0;
      if (el.rCardRow) {
        if (cf > 0) { el.rCardRow.style.display = ''; el.rCard.textContent = fmtVnd(cf) + t('est.card.plusship', ' (+ card fee on shipping at invoice)'); }
        else { el.rCardRow.style.display = 'none'; }
      }
      el.rShip.textContent = t('est.customquote', 'Custom quote');
      el.rTotal.textContent = fmtVnd(nonShip + cf) + t('est.plusship', ' + shipping');
      el.rUsd.textContent = '≈ ' + fmtCur(toCur(nonShip + cf)) + t('est.customhaul', ' + shipping (custom quote, 10kg+)');
      hideSplit();                       // shipping is hand-quoted, so no balance figure yet
    } else {
      // Two charges, so the card fee is calculated on each part separately.
      var s = splitOf(nonShip, c.ship, c.card);
      if (el.rCardRow) {
        if (s.feeLo > 0) { el.rCardRow.style.display = ''; el.rCard.textContent = fmtVnd(s.feeLo) + ' – ' + fmtVnd(s.feeHi); }
        else { el.rCardRow.style.display = 'none'; }
      }
      el.rShip.textContent = fmtVnd(c.ship[0]) + ' – ' + fmtVnd(c.ship[1]);
      el.rTotal.textContent = fmtVnd(s.lo) + ' – ' + fmtVnd(s.hi);
      el.rUsd.textContent = '≈ ' + fmtCur(toCur(s.lo)) + ' – ' + fmtCur(toCur(s.hi));
      showSplit(s);
    }
    updateFxStatus();
    save();
  }

  function summary() {
    var c = compute();
    var nonShip = c.subtotal + c.fees + c.base + c.complex + c.stopsFee - c.green + c.styling - c.credit;
    var fxAllow = Math.round(nonShip * (CONFIG.fxFee || 0));
    nonShip += fxAllow;
    var region = el.region.options[el.region.selectedIndex].text;
    var links = readLinks();
    var lines = ['Hi! Here is my Seraphic Styler basket estimate:', ''];
    var n = 0;
    c.items.forEach(function (v, idx) {
      if (v > 0) { n++; lines.push('• Item ' + n + ': ' + fmtVnd(v) + (links[idx] ? ' — ' + links[idx] : '')); }
    });
    lines.push('',
      'Items subtotal: ' + fmtVnd(c.subtotal),
      'Service fees (per item): ' + fmtVnd(c.fees),
      'Base fee: ' + fmtVnd(c.base));
    if (c.styling > 0) lines.push('Styling service (' + (c.styleCfg ? c.styleCfg.label : '') + '): ' + fmtVnd(c.styling));
    if (c.credit > 0) lines.push('Piece credit applied (included in the tier): −' + fmtVnd(c.credit));
    if (c.creditLeft > 0) lines.push('Gift credit left over — saved for a future order: ' + fmtVnd(c.creditLeft));
    else if (c.styling > 0 && c.nItems === 0) lines.push('(Tier includes a ' + fmtVnd(c.styleCfg.credit) + ' piece credit — applied once pieces are added)');
    if (c.stopsFee > 0) lines.push('Additional stops (beyond 2 boutiques): +' + fmtVnd(c.stopsFee));
    if (c.complex > 0) lines.push('Complex sourcing: ' + fmtVnd(c.complex));
    if (c.green > 0) lines.push('Green shopping discount: −' + fmtVnd(c.green) + ' (sustainable brand)');
    if (fxAllow > 0) lines.push('Currency transfer allowance (3%, at cost): ' + fmtVnd(fxAllow));
    lines.push('Ship to: ' + region + ' (' + el.weight.value + ')');
    lines.push('Payment: ' + (c.card ? 'Card via Stripe (processing fee below)' : 'Bank transfer / Wise / Zelle (no card fee)'));
    if (c.nItems === 0 && c.styling > 0) {
      var cfS = c.card ? cardFee(nonShip) : 0;
      if (cfS > 0) lines.push('Card processing (Stripe ' + cardRatePct() + ' + $0.30 intl rate, at cost): ' + fmtVnd(cfS));
      lines.push('Shipping: added once your pieces are sourced',
        'ESTIMATED TOTAL (styling only): ' + fmtVnd(nonShip + cfS) + ' (≈ ' + fmtCur(toCur(nonShip + cfS)) + ')');
    } else if (c.custom) {
      var cf = c.card ? cardFee(nonShip) : 0;
      if (cf > 0) lines.push('Card processing (Stripe ' + cardRatePct() + ' + $0.30 intl rate, at cost): ' + fmtVnd(cf) + ' + card fee on shipping at invoice');
      lines.push('Est. before shipping: ' + fmtVnd(nonShip + cf) + ' (≈ ' + fmtCur(toCur(nonShip + cf)) + ')',
        'Shipping: CUSTOM QUOTE — heavy haul (10kg+), to confirm after packing plan');
    } else {
      var sp = splitOf(nonShip, c.ship, c.card);
      if (sp.feeLo > 0) lines.push('Card processing (Stripe ' + cardRatePct() + ' + $0.30 intl rate, at cost, both charges): ' + fmtVnd(sp.feeLo) + ' – ' + fmtVnd(sp.feeHi));
      lines.push('Est. shipping: ' + fmtVnd(c.ship[0]) + ' – ' + fmtVnd(c.ship[1]),
        'ESTIMATED TOTAL: ' + fmtVnd(sp.lo) + ' – ' + fmtVnd(sp.hi),
        '≈ ' + fmtCur(toCur(sp.lo)) + ' – ' + fmtCur(toCur(sp.hi)),
        '',
        'Split into the two payments:',
        '• Deposit to start (pieces + fees): ' + fmtVnd(sp.deposit) + ' (≈ ' + fmtCur(toCur(sp.deposit)) + ')',
        '• Balance before dispatch (shipping): ' + fmtVnd(sp.balLo) + ' – ' + fmtVnd(sp.balHi) + ' (≈ ' + fmtCur(toCur(sp.balLo)) + ' – ' + fmtCur(toCur(sp.balHi)) + ')');
    }
    if (compareOn()) {
      lines.push('', 'COMPARING TWO DESTINATIONS — please quote both:');
      if (c.custom) {
        lines.push('• ' + regionLabel(el.region.value) + ' — custom quote (10kg+)',
          '• ' + regionLabel(el.region2.value) + ' — custom quote (10kg+)');
      } else if (c.nItems === 0) {
        lines.push('• ' + regionLabel(el.region.value), '• ' + regionLabel(el.region2.value),
          '(shipping added once pieces are sourced)');
      } else {
        [el.region.value, el.region2.value].forEach(function (v) {
          var tt = totalsFor(nonShip, shipRange(v, el.weight.value), c.card);
          lines.push('• ' + regionLabel(v) + ': shipping ' + fmtVnd(tt.ship[0]) + ' – ' + fmtVnd(tt.ship[1]) +
            ' → total ' + fmtVnd(tt.lo) + ' – ' + fmtVnd(tt.hi) + ' (≈ ' + fmtCur(toCur(tt.lo)) + ' – ' + fmtCur(toCur(tt.hi)) + ')');
        });
      }
      lines.push('(I have not decided which destination yet — duty not included.)');
    }
    lines.push('', 'Please confirm my final quote — thank you! 🎀');
    return lines.join('\n');
  }

  function estimateParam(text) {
    if (text.length < 5000) return text; // keep well under browser URL limits for huge baskets
    return '(full estimate copied to clipboard — paste here)\n\n' + text.split('\n').slice(-6).join('\n');
  }

  function tallyUrl(text) {
    return CONFIG.contact.tally + '?about=' + encodeURIComponent("I'm confirming an estimate or paste-in result") +
      '&estimate=' + encodeURIComponent(estimateParam(text)) + '&source=home-estimator';
  }

  function send() {
    var c0 = compute();
    if (c0.nItems === 0 && c0.styling === 0) {
      if (el.copiedMsg) {
        el.copiedMsg.textContent = t('est.empty.send', 'Nothing to send yet — add an item price, or choose a styling tier.');
        el.copiedMsg.style.display = 'block';
      }
      return;
    }
    var text = summary();
    var enc = encodeURIComponent(text);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
    var form = tallyUrl(text);
    var parts = ['<a href="' + form + '" target="_blank" rel="noopener">the form</a>'];
    if (CONFIG.contact.whatsapp) parts.push('<a href="https://wa.me/' + CONFIG.contact.whatsapp + '?text=' + enc + '" target="_blank" rel="noopener">WhatsApp</a>');
    parts.push('<a href="' + CONFIG.contact.instagram + '" target="_blank" rel="noopener">Instagram</a>');
    if (el.copiedMsg) {
      el.copiedMsg.innerHTML = '✓ Estimate copied &amp; opened pre-filled in ' + parts.join(' · ') +
        '. <span style="opacity:.75">Instagram can\'t pre-fill messages — just paste (it\'s already copied).</span>';
      el.copiedMsg.style.display = 'block';
    }
    // the form is the system of record: it always arrives (mailto/DM often don't)
    if (window.Tally) {
      window.Tally.openPopup('gD10Kl', { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000, hiddenFields: {
        about: "I'm confirming an estimate or paste-in result", estimate: estimateParam(text), source: 'home-estimator'
      } });
    } else {
      window.open(form, '_blank', 'noopener');
    }
  }

  /* Live rate, two independent sources + a 6h sessionStorage cache shared with
     the links page ('ss-fx'), so every page shows the SAME number and a
     one-provider outage never silently drops quotes to the static fallback. */
  function applyFx(d) {
    if (d && d.rates && d.rates.VND) {
      fxRate = d.rates.VND; allRates = d.rates; fxLive = true; fxWhen = d.when || '';
      return true;
    }
    return false;
  }
  /* ---- 24-hour preview links ----
     snapshot() is exactly what the form holds plus the rate the numbers were
     quoted at; restore() puts it back and pins that rate, so the client sees
     the figures I saw, not tomorrow's. The Worker stores it for 24h and then
     deletes it (api.seraphicstyler.com/v1/estimate-link). */
  function snapshot() {
    var prices = readItems(), links = readLinks(), items = [], lk = [];
    prices.forEach(function (v, i) { if (v > 0) { items.push(Math.round(v)); lk.push(links[i] || ''); } });
    var c = curCode();
    return {
      items: items, links: lk, region: el.region.value, region2: (el.region2 && el.region2.value) || '',
      compare: !!(el.compareDest && el.compareDest.checked), weight: el.weight.value, stops: el.stops ? el.stops.value : '',
      complex: !!el.complex.checked, green: !!(el.green && el.green.checked), styling: el.styling ? el.styling.value : '',
      pay: (el.payMethod && el.payMethod.value) || 'bank', cur: c,
      fx: { vndPerUsd: fxRate, rate: rateFor(c), when: fxWhen, live: fxLive }
    };
  }
  function restore(d) {
    el.lineItems.innerHTML = '';
    (d.items || []).forEach(function (v, i) { addItem(String(v), (d.links && d.links[i]) || ''); });
    if (!el.lineItems.children.length) addItem('');
    if (d.region) el.region.value = d.region;
    if (d.weight) el.weight.value = d.weight;
    if (el.stops && d.stops) el.stops.value = d.stops;
    el.complex.checked = !!d.complex;
    if (el.green) el.green.checked = !!d.green;
    if (el.styling && d.styling) el.styling.value = d.styling;
    if (el.payMethod && d.pay) el.payMethod.value = d.pay;
    if (el.estCurrency && d.cur) el.estCurrency.value = d.cur;
    if (el.region2 && d.region2) el.region2.value = d.region2;
    if (el.compareDest) { el.compareDest.checked = !!d.compare; if (el.compareWrap) el.compareWrap.hidden = !d.compare; }
    if (d.fx && d.fx.vndPerUsd) {
      fxRate = d.fx.vndPerUsd; fxWhen = d.fx.when || ''; fxLive = true;
      allRates = { USD: 1, VND: d.fx.vndPerUsd }; allRates[d.cur || 'USD'] = d.fx.rate || 1;
    }
  }
  function fmtWhen(iso) {
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
  }
  function loadPreview(id) {
    if (el.previewNote) { el.previewNote.style.display = 'block'; el.previewNote.textContent = t('est.preview.loading', 'Loading your preview…'); }
    fetch(API + '/v1/estimate-link/' + encodeURIComponent(id))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.estimate) throw new Error('gone');
        preview = j.estimate; restore(preview); recalc();
        if (el.previewNote) el.previewNote.textContent = t('est.preview.note', 'A preview prepared for you by Seraphic Styler — the exact inputs and the rate quoted. It expires ') + fmtWhen(preview.expiresAt) + '.';
      })
      .catch(function () {
        if (el.previewNote) el.previewNote.textContent = t('est.preview.gone', 'This preview link has expired — links live 24 hours. Ask for a fresh one, or build your own estimate below.');
        loadFx(); recalc();
      });
  }
  var lastLink = '';
  function copyLastLink() {
    if (!lastLink || !el.shareCopy) return;
    var done = function () { el.shareCopy.textContent = t('est.share.copied', 'Copied'); el.shareCopy.classList.add('is-done'); };
    if (navigator.clipboard) navigator.clipboard.writeText(lastLink).then(done, done); else done();
  }
  function makePreviewLink() {
    var snap = snapshot();
    if (!el.previewMsg) return;
    if (!snap.items.length && (!snap.styling || snap.styling === 'none')) {
      el.previewMsg.style.display = 'block';
      el.previewMsg.textContent = t('est.preview.empty', 'Nothing to share yet — add an item price, or choose a styling tier.');
      return;
    }
    el.previewMsg.style.display = 'block';
    el.previewMsg.textContent = t('est.preview.making', 'Creating the link…');
    fetch(API + '/v1/estimate-link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(snap) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.url) throw new Error((j && j.error && j.error.message) || 'failed');
        lastLink = j.url;
        if (navigator.clipboard) navigator.clipboard.writeText(j.url).catch(function () {});
        if (el.shareRow && el.shareUrl) {
          el.shareUrl.innerHTML = esc(j.url.replace(/e=[a-z2-9]+$/, 'e=')) + '<b>' + esc(j.id) + '</b>';
          el.shareRow.hidden = false;
          if (el.shareCard) el.shareCard.classList.add('is-made');
          if (el.shareCopy) { el.shareCopy.textContent = t('est.share.copied', 'Copied'); el.shareCopy.classList.add('is-done'); }
        }
        el.previewMsg.textContent = t('est.preview.until', 'Opens with these exact inputs and rate until ') + fmtWhen(j.expiresAt) + '.';
      })
      .catch(function (e) {
        el.previewMsg.textContent = t('est.preview.fail', 'Could not create the link — ') + (e && e.message ? e.message : '') + ' ' + t('est.preview.retry', 'Try again in a moment.');
      });
  }

  function storeFx(d) { try { sessionStorage.setItem('ss-fx', JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
  function loadFx() {
    el.fxStatus.textContent = t('est.fx.loading', 'Loading live rate…');
    try {
      var c = JSON.parse(sessionStorage.getItem('ss-fx') || 'null');
      if (c && c.t && (Date.now() - c.t) < 216e5 && applyFx(c.d)) { recalc(); return; }
    } catch (e) {}
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var pack = { rates: d && d.rates, when: d && d.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : '' };
        if (!applyFx(pack)) throw new Error('no VND');
        storeFx(pack); recalc();
      })
      .catch(function () {
        fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json')
          .then(function (r) { return r.json(); })
          .then(function (d) {
            var src = d && d.usd; if (!src) throw new Error('no data');
            var rates = {}; for (var k in src) rates[k.toUpperCase()] = src[k];
            var pack = { rates: rates, when: d.date || '' };
            if (!applyFx(pack)) throw new Error('no VND');
            storeFx(pack); recalc();
          })
          .catch(function () {
            fxRate = CONFIG.fx.fallbackVndPerUsd; allRates = null; fxLive = false;
            recalc();
          });
      });
  }

  el.addItem.addEventListener('click', function () { addItem(''); recalc(); });
  el.region.addEventListener('change', function () {
    // Never let both selects sit on the same region — the comparison would be a no-op.
    if (el.region2 && el.region2.value === el.region.value) el.region2.value = firstOtherRegion(el.region.value);
    recalc();
  });
  if (el.region2) el.region2.addEventListener('change', recalc);
  if (el.compareDest) el.compareDest.addEventListener('change', function () {
    if (el.compareWrap) el.compareWrap.hidden = !el.compareDest.checked;
    if (el.compareDest.checked && el.region2 && el.region2.value === el.region.value) {
      el.region2.value = firstOtherRegion(el.region.value);
    }
    recalc();
  });
  // "Ship here" inside the comparison promotes that region to the primary one,
  // and demotes the previous primary into the compare slot (so nothing is lost).
  if (el.destCompare) el.destCompare.addEventListener('click', function (e) {
    var b = e.target.closest('[data-use-region]');
    if (!b) return;
    var pick = b.getAttribute('data-use-region');
    if (pick === el.region.value) { el.compareDest.checked = false; if (el.compareWrap) el.compareWrap.hidden = true; }
    else { el.region2.value = el.region.value; el.region.value = pick; }
    recalc();
  });
  el.weight.addEventListener('change', recalc);
  if (el.stops) el.stops.addEventListener('change', recalc);
  el.complex.addEventListener('change', recalc);
  if (el.green) el.green.addEventListener('change', recalc);
  if (el.styling) el.styling.addEventListener('change', recalc);
  if (el.payMethod) el.payMethod.addEventListener('change', recalc);
  if (el.estCurrency) el.estCurrency.addEventListener('change', recalc);
  el.sendBasket.addEventListener('click', send);
  if (el.previewLink) el.previewLink.addEventListener('click', makePreviewLink);
  if (el.shareCopy) el.shareCopy.addEventListener('click', copyLastLink);
  document.addEventListener('ss:lang', recalc);  // re-render computed strings (item count, custom-quote) in the new language

  var previewId = null;
  try { previewId = new URLSearchParams(location.search).get('e'); } catch (e) {}
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('ss-basket')); } catch (e) {}
  if (previewId && /^[a-z2-9]{7}$/.test(previewId)) {
    addItem('');
    loadPreview(previewId);
  } else if (saved && saved.items && saved.items.length) {
    saved.items.forEach(function (v, i) { addItem(v || '', (saved.links && saved.links[i]) || ''); });
    if (saved.region) el.region.value = saved.region;
    if (saved.weight) el.weight.value = saved.weight;
    if (saved.stops && el.stops) el.stops.value = saved.stops; // absent (old baskets) → default 1–2 included
    if (saved.complex) el.complex.checked = true;
    if (saved.green && el.green) el.green.checked = true;
    if (saved.styling && el.styling) el.styling.value = saved.styling; // absent (old baskets) → default 'none'
    if (saved.pay && el.payMethod) el.payMethod.value = saved.pay; // absent (old baskets, tray handoff) → default 'bank'
    if (saved.cur && el.estCurrency) el.estCurrency.value = saved.cur;
    if (saved.region2 && el.region2) el.region2.value = saved.region2;
    if (saved.compare && el.compareDest) {                    // absent (older baskets) → comparison off
      el.compareDest.checked = true;
      if (el.compareWrap) el.compareWrap.hidden = false;
      if (el.region2 && el.region2.value === el.region.value) el.region2.value = firstOtherRegion(el.region.value);
    }
  } else { addItem(''); }
  if (!(previewId && /^[a-z2-9]{7}$/.test(previewId))) loadFx();
  recalc();
})();
