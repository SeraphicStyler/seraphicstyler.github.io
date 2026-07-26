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
    minFee: 250000,                             // every item pays at least 250,000₫
    midThreshold: 5000000,  midRate: 0.08,      // item ≤ 5M -> 8%
    highRate: 0.07                              // > 5M -> 7%
  },
  baseFee: 100000,        // flat per-order coordination & packing fee
  complexFee: 200000,     // optional surcharge for rare/complex sourcing
  greenDiscount: 0.10,    // modest discount on the SERVICE FEE for green/eco shopping (0.10 = 10% off fees)

  /* Optional styling-service add-ons (VND) — the SAME prices as the gift tiers
     ($49 / $149 / $349 ≈ 1.3M / 3.9M / 9.2M₫), and like the gifts each includes a
     piece CREDIT ($34 / $104 / $239 ≈ 900k / 2.7M / 6.3M₫) applied against the
     itemized pieces in the estimate (capped at the items subtotal, never negative;
     with no items yet, it applies once pieces are added). The remainder is my
     styling TIME. Keep prices, credits and the gift-card split lines in step. */
  styling: {
    discovery: { vnd: 1300000, credit: 900000,  label: 'The Discovery' },
    edit:      { vnd: 3900000, credit: 2700000, label: 'The Edit' },
    capsule:   { vnd: 6500000, credit: 4600000, label: 'The Capsule' },
    atelier:   { vnd: 9200000, credit: 6300000, label: 'The Atelier' }
  },

  fx: { fallbackVndPerUsd: 26300, spread: 0.015 },

  /* Card (Stripe) processing pass-through: charged = (total + fixedUsd*fx) / (1 - rate).
     Bank transfer / Wise / Zelle carry no fee. */
  card: { rate: 0.029, fixedUsd: 0.30 },

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

/* ---------------------------------------------------------------------- */
(function () {
  'use strict';
  var fxRate = CONFIG.fx.fallbackVndPerUsd;
  var allRates = null; // full USD-based rate table from the API
  var fxLive = false, fxWhen = '';
  // approximate USD-based rates for offline fallback (only used if the API can't load)
  var FALLBACK_RATES = { USD:1, EUR:0.92, GBP:0.79, AUD:1.5, CAD:1.36, SGD:1.34, JPY:155, KRW:1350, CNY:7.2, THB:36, AED:3.67, INR:83 };

  var el = {};
  ['lineItems','addItem','region','weight','complex','green','styling','payMethod','estCurrency','rSubtotal','rFee','rFeeNote','rBase',
   'rStyleRow','rStyle','rStyleNote','rCreditRow','rCredit','rComplexRow','rComplex','rGreenRow','rGreen','rCardRow','rCard','rShip','rTotal','rUsd','fxStatus','sendBasket','copiedMsg']
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
  function toCur(vnd) {
    var usd = vnd / (fxRate * (1 - CONFIG.fx.spread));
    return usd * rateFor(curCode());
  }
  function updateFxStatus() {
    if (!el.fxStatus) return;
    var c = curCode();
    var vndPerCur = fxRate / rateFor(c); // VND for 1 unit of the selected currency
    el.fxStatus.textContent = (fxLive ? 'Live rate' : 'Offline estimate') + ': 1 ' + c + ' ≈ ' +
      Math.round(vndPerCur).toLocaleString('en-US') + '₫' + (fxLive && fxWhen ? ' (as of ' + fxWhen + ', +1.5% buffer)' : ' (+1.5% buffer)');
  }

  function itemFee(p) {
    var f = CONFIG.fee;
    if (p <= 0) return 0;
    var pct = p <= f.midThreshold ? p * f.midRate : p * f.highRate;
    return Math.max(f.minFee, pct);
  }

  /* Exact Stripe pass-through: what must be added so the charged amount nets totalVnd. */
  function cardFee(totalVnd) {
    var cc = CONFIG.card;
    if (!cc || !(totalVnd > 0)) return 0;
    return (totalVnd + cc.fixedUsd * fxRate) / (1 - cc.rate) - totalVnd;
  }

  function readItems() {
    var vals = [];
    el.lineItems.querySelectorAll('.item-price').forEach(function (i) {
      var v = parseFloat((i.value || '').replace(/[^0-9.]/g, ''));
      vals.push(isNaN(v) ? 0 : v);
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
        '<input class="item-price" type="text" inputmode="numeric" placeholder="e.g. 850000" aria-label="Item price in VND" aria-describedby="estItemsNote">' +
        '<input class="item-link" type="url" placeholder="URL / link (optional)" aria-label="Item link (optional)">' +
      '</div>' +
      '<button class="remove-item" type="button" aria-label="Remove item">✕</button>';
    var pIn = row.querySelector('.item-price'); pIn.value = value || '';
    var lIn = row.querySelector('.item-link'); lIn.value = link || '';
    pIn.addEventListener('input', function () {
      var raw = pIn.value.trim();
      var n = parseFloat(raw.replace(/[^0-9.]/g, ''));
      pIn.setAttribute('aria-invalid', (raw !== '' && !(n > 0)) ? 'true' : 'false');
      recalc();
    });
    lIn.addEventListener('input', save);
    row.querySelector('.remove-item').addEventListener('click', function () {
      row.remove(); if (!el.lineItems.children.length) addItem(''); recalc();
    });
    el.lineItems.appendChild(row);
  }

  function save() {
    try {
      localStorage.setItem('ss-basket', JSON.stringify({
        items: readItems(), links: readLinks(), region: el.region.value, weight: el.weight.value, complex: el.complex.checked, green: !!(el.green && el.green.checked), styling: (el.styling && el.styling.value) || 'none', pay: (el.payMethod && el.payMethod.value) || 'bank', cur: curCode()
      }));
    } catch (e) {}
  }

  function compute() {
    var items = readItems();
    var subtotal = items.reduce(function (a, b) { return a + b; }, 0);
    var fees = items.reduce(function (a, b) { return a + itemFee(b); }, 0);
    var base = subtotal > 0 ? CONFIG.baseFee : 0;
    var complex = el.complex.checked ? CONFIG.complexFee : 0;
    var green = (el.green && el.green.checked) ? fees * CONFIG.greenDiscount : 0; // modest service-fee discount
    var styleCfg = (el.styling && CONFIG.styling[el.styling.value]) || null;
    var styling = styleCfg ? styleCfg.vnd : 0;
    var credit = styleCfg ? Math.min(styleCfg.credit || 0, subtotal) : 0; // piece credit, capped at items
    var custom = CONFIG.customWeights.indexOf(el.weight.value) !== -1;
    var zone = CONFIG.shipping[el.region.value] || CONFIG.shipping.us;
    var ship = custom ? null : (zone[el.weight.value] || zone.light);
    var nItems = items.filter(function (v) { return v > 0; }).length;
    var card = !!(el.payMethod && el.payMethod.value === 'card');
    return { items: items, subtotal: subtotal, fees: fees, base: base, complex: complex, green: green, styling: styling, credit: credit, styleCfg: styleCfg, ship: ship, custom: custom, nItems: nItems, card: card };
  }

  function recalc() {
    var c = compute();
    el.rSubtotal.textContent = fmtVnd(c.subtotal);
    el.rFee.textContent = fmtVnd(c.fees);
    el.rFeeNote.textContent = c.nItems ? tf('est.itemcount', '(' + c.nItems + (c.nItems === 1 ? ' item' : ' items') + ')', { n: c.nItems }) : '';
    el.rBase.textContent = fmtVnd(c.base);
    if (c.complex > 0) { el.rComplexRow.style.display = ''; el.rComplex.textContent = fmtVnd(c.complex); }
    else { el.rComplexRow.style.display = 'none'; }
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
    var nonShip = c.subtotal + c.fees + c.base + c.complex - c.green + c.styling - c.credit;
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
    } else {
      var cfLo = c.card ? cardFee(nonShip + c.ship[0]) : 0;
      var cfHi = c.card ? cardFee(nonShip + c.ship[1]) : 0;
      if (el.rCardRow) {
        if (cfLo > 0) { el.rCardRow.style.display = ''; el.rCard.textContent = fmtVnd(cfLo) + ' – ' + fmtVnd(cfHi); }
        else { el.rCardRow.style.display = 'none'; }
      }
      el.rShip.textContent = fmtVnd(c.ship[0]) + ' – ' + fmtVnd(c.ship[1]);
      el.rTotal.textContent = fmtVnd(nonShip + c.ship[0] + cfLo) + ' – ' + fmtVnd(nonShip + c.ship[1] + cfHi);
      el.rUsd.textContent = '≈ ' + fmtCur(toCur(nonShip + c.ship[0] + cfLo)) + ' – ' + fmtCur(toCur(nonShip + c.ship[1] + cfHi));
    }
    updateFxStatus();
    save();
  }

  function summary() {
    var c = compute();
    var nonShip = c.subtotal + c.fees + c.base + c.complex - c.green + c.styling - c.credit;
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
    else if (c.styling > 0 && c.nItems === 0) lines.push('(Tier includes a ' + fmtVnd(c.styleCfg.credit) + ' piece credit — applied once pieces are added)');
    if (c.complex > 0) lines.push('Complex sourcing: ' + fmtVnd(c.complex));
    if (c.green > 0) lines.push('Green shopping discount: −' + fmtVnd(c.green) + ' (sustainable brand)');
    lines.push('Ship to: ' + region + ' (' + el.weight.value + ')');
    lines.push('Payment: ' + (c.card ? 'Card via Stripe (processing fee below)' : 'Bank transfer / Wise / Zelle (fee-free)'));
    if (c.nItems === 0 && c.styling > 0) {
      var cfS = c.card ? cardFee(nonShip) : 0;
      if (cfS > 0) lines.push('Card processing (Stripe 2.9% + $0.30, at cost): ' + fmtVnd(cfS));
      lines.push('Shipping: added once your pieces are sourced',
        'ESTIMATED TOTAL (styling only): ' + fmtVnd(nonShip + cfS) + ' (≈ ' + fmtCur(toCur(nonShip + cfS)) + ')');
    } else if (c.custom) {
      var cf = c.card ? cardFee(nonShip) : 0;
      if (cf > 0) lines.push('Card processing (Stripe 2.9% + $0.30, at cost): ' + fmtVnd(cf) + ' + card fee on shipping at invoice');
      lines.push('Est. before shipping: ' + fmtVnd(nonShip + cf) + ' (≈ ' + fmtCur(toCur(nonShip + cf)) + ')',
        'Shipping: CUSTOM QUOTE — heavy haul (10kg+), to confirm after packing plan');
    } else {
      var cfLo = c.card ? cardFee(nonShip + c.ship[0]) : 0;
      var cfHi = c.card ? cardFee(nonShip + c.ship[1]) : 0;
      if (cfLo > 0) lines.push('Card processing (Stripe 2.9% + $0.30, at cost): ' + fmtVnd(cfLo) + ' – ' + fmtVnd(cfHi));
      lines.push('Est. shipping: ' + fmtVnd(c.ship[0]) + ' – ' + fmtVnd(c.ship[1]),
        'ESTIMATED TOTAL: ' + fmtVnd(nonShip + c.ship[0] + cfLo) + ' – ' + fmtVnd(nonShip + c.ship[1] + cfHi),
        '≈ ' + fmtCur(toCur(nonShip + c.ship[0] + cfLo)) + ' – ' + fmtCur(toCur(nonShip + c.ship[1] + cfHi)));
    }
    lines.push('', 'Please confirm my final quote — thank you! 🎀');
    return lines.join('\n');
  }

  function estimateParam(text) {
    if (text.length < 5000) return text; // keep well under browser URL limits for huge baskets
    return '(full estimate copied to clipboard — paste here)\n\n' + text.split('\n').slice(-6).join('\n');
  }

  function tallyUrl(text) {
    return CONFIG.contact.tally + '?about=' + encodeURIComponent('Confirming my estimate') +
      '&estimate=' + encodeURIComponent(estimateParam(text)) + '&source=home-estimator';
  }

  function send() {
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
        about: 'Confirming my estimate', estimate: estimateParam(text), source: 'home-estimator'
      } });
    } else {
      window.open(form, '_blank', 'noopener');
    }
  }

  function loadFx() {
    el.fxStatus.textContent = 'Loading live rate…';
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.rates && d.rates.VND) {
          fxRate = d.rates.VND; allRates = d.rates; fxLive = true;
          fxWhen = d.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : 'today';
        } else throw new Error('no VND');
        recalc();
      })
      .catch(function () {
        fxRate = CONFIG.fx.fallbackVndPerUsd; allRates = null; fxLive = false;
        recalc();
      });
  }

  el.addItem.addEventListener('click', function () { addItem(''); recalc(); });
  el.region.addEventListener('change', recalc);
  el.weight.addEventListener('change', recalc);
  el.complex.addEventListener('change', recalc);
  if (el.green) el.green.addEventListener('change', recalc);
  if (el.styling) el.styling.addEventListener('change', recalc);
  if (el.payMethod) el.payMethod.addEventListener('change', recalc);
  if (el.estCurrency) el.estCurrency.addEventListener('change', recalc);
  el.sendBasket.addEventListener('click', send);
  document.addEventListener('ss:lang', recalc);  // re-render computed strings (item count, custom-quote) in the new language

  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('ss-basket')); } catch (e) {}
  if (saved && saved.items && saved.items.length) {
    saved.items.forEach(function (v, i) { addItem(v || '', (saved.links && saved.links[i]) || ''); });
    if (saved.region) el.region.value = saved.region;
    if (saved.weight) el.weight.value = saved.weight;
    if (saved.complex) el.complex.checked = true;
    if (saved.green && el.green) el.green.checked = true;
    if (saved.styling && el.styling) el.styling.value = saved.styling; // absent (old baskets) → default 'none'
    if (saved.pay && el.payMethod) el.payMethod.value = saved.pay; // absent (old baskets, tray handoff) → default 'bank'
    if (saved.cur && el.estCurrency) el.estCurrency.value = saved.cur;
  } else { addItem(''); }
  loadFx();
  recalc();
})();
