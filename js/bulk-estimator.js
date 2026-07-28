/* Seraphic Styler — rough bulk-order estimator (#bulkEst on the home page).
   A planning figure, not a checkout: the volume taper from the #bulk rate
   table, the base fee and shipping bands from js/estimator.js CONFIG (loaded
   first on this page; local fallbacks keep it alive if that ever changes).
   Keep the taper here in step with the rate table markup. */
(function () {
  'use strict';

  var out = document.getElementById('beOut');
  var vEl = document.getElementById('beValue');
  var pEl = document.getElementById('bePieces');
  var rEl = document.getElementById('beRegion');
  var repEl = document.getElementById('beRepeats');
  if (!out || !vEl || !pEl || !rEl) return;

  var C = window.CONFIG || {};
  var FX = (C.fx && C.fx.fallbackVndPerUsd) || 26300;
  var BASE = C.baseFee || 100000;
  var MIN = (C.fee && C.fee.minFee) || 250000;
  var MID = (C.fee && C.fee.midThreshold) || 5000000;
  var SHIP = C.shipping || {
    asia:    { standard: [1800000, 5000000] },  oceania: { standard: [2800000, 7500000] },
    us:      { standard: [3800000, 10000000] }, eu:      { standard: [3600000, 9500000] },
    mena:    { standard: [3500000, 9300000] },  sca:     { standard: [3400000, 9200000] },
    latam:   { standard: [4500000, 11500000] }, africa:  { standard: [4600000, 12000000] }
  };
  var KG_PER_PIECE = 0.35;

  function vnd(x) { return Math.round(x).toLocaleString('en-US') + '₫'; }
  function usd(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
  function row(label, value, cls) {
    return '<div class="be-row' + (cls ? ' ' + cls : '') + '"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
  }

  /* The taper. Under $1,000 the standard per-item model applies (8%, 7% above
     5M₫, 250k₫ minimum). From $1,000 the percentage falls with size; the
     per-piece minimum stays only for distinct pieces under $3,000 — repeats
     of one piece waive it, exactly as the table says. */
  function fee(totalVnd, totalUsd, pieces, repeats) {
    if (totalUsd < 1000) {
      var avg = totalVnd / pieces;
      var rate = avg > MID ? 0.07 : 0.08;
      return { amount: pieces * Math.max(avg * rate, MIN),
               label: 'Standard rate — ' + Math.round(rate * 100) + '% per piece, ' + vnd(MIN) + ' minimum' };
    }
    var pct = totalUsd >= 10000 ? 0.035 : totalUsd >= 6000 ? 0.04 : totalUsd >= 3000 ? 0.05 : 0.06;
    var amount = totalVnd * pct;
    var label = (pct * 100).toFixed(pct === 0.035 ? 1 : 0) + '% tier';
    if (totalUsd < 3000 && !repeats) {
      var floor = pieces * MIN;
      if (floor > amount) { amount = floor; label += ' — per-piece minimum applies to distinct pieces'; }
      else label += ', minimum cleared';
    } else {
      label += ', minimum waived';
    }
    if (totalUsd >= 10000) label += ' · quoted in writing first';
    return { amount: amount, label: label };
  }

  function render() {
    var totalUsd = parseFloat(vEl.value);
    var pieces = parseInt(pEl.value, 10);
    if (!(totalUsd > 0) || !(pieces > 0)) {
      out.innerHTML = '<p class="be-waiting">Enter a value and a piece count — the breakdown appears here.</p>';
      return;
    }
    var totalVnd = totalUsd * FX;
    var f = fee(totalVnd, totalUsd, pieces, repEl.checked);
    var kg = pieces * KG_PER_PIECE;
    var band = (SHIP[rEl.value] || SHIP.us).standard;

    var shipLine, shipLow, shipHigh, custom = kg > 10;
    if (custom) {
      var boxes = Math.ceil(kg / 10);
      shipLow = band[0] * boxes; shipHigh = band[1] * boxes;
      shipLine = 'Quoted after packing — as ' + boxes + ' standard boxes for planning: ' +
        vnd(shipLow) + '–' + vnd(shipHigh) + ' · ≈' + usd(shipLow / FX) + '–' + usd(shipHigh / FX);
    } else {
      shipLow = band[0]; shipHigh = band[1];
      shipLine = vnd(shipLow) + '–' + vnd(shipHigh) + ' · ≈' + usd(shipLow / FX) + '–' + usd(shipHigh / FX);
    }

    var low = totalVnd + f.amount + BASE + shipLow;
    var high = totalVnd + f.amount + BASE + shipHigh;
    /* paid in two: pieces + half the fee + base to begin; the other half of
       the fee + exact shipping before dispatch — the section's own rule */
    var p1 = totalVnd + f.amount / 2 + BASE;
    var p2 = f.amount / 2;
    var html = '<dl class="bx-rows">';
    html += row('Pieces at cost', vnd(totalVnd) + ' · ' + usd(totalUsd));
    html += row('Service fee — ' + f.label, vnd(f.amount) + ' · ≈' + usd(f.amount / FX));
    html += row('Base fee', vnd(BASE));
    html += row('One shipment, ≈' + (Math.round(kg * 10) / 10) + 'kg' + (custom ? '' : ', ' + rEl.options[rEl.selectedIndex].text + ' band'), shipLine);
    html += row('Paid in two', '≈' + usd(p1 / FX) + ' to begin · ≈' + usd(p2 / FX) + ' + exact shipping before dispatch');
    html += row('Landed, before customs', '≈' + usd(low / FX) + '–' + usd(high / FX), 'bx-total');
    html += row('Per piece, landed', '≈' + usd(low / FX / pieces) + '–' + usd(high / FX / pieces), 'bx-per');
    html += '</dl>';
    html += '<div class="be-cta"><a class="btn btn-primary" target="_blank" rel="noopener" id="beSend" href="#">Send me this list →</a></div>';
    out.innerHTML = html;

    /* the CTA carries the breakdown into the same inquiry form as everything else */
    var summary = 'Group/bulk order — rough figures\n' +
      'Pieces at cost: ' + usd(totalUsd) + ' (' + pieces + ' pieces' + (repEl.checked ? ', mostly repeats' : '') + ')\n' +
      'Service fee: ' + f.label + ' ≈ ' + usd(f.amount / FX) + '\n' +
      'Destination: ' + rEl.options[rEl.selectedIndex].text + ' · ≈' + (Math.round(kg * 10) / 10) + 'kg\n' +
      'Paid in two: ≈' + usd(p1 / FX) + ' to begin, ≈' + usd(p2 / FX) + ' + shipping before dispatch\n' +
      'Landed before customs: ≈' + usd(low / FX) + '–' + usd(high / FX);
    var TALLY = (C.contact && C.contact.tally) || 'https://tally.so/r/gD10Kl';
    var send = document.getElementById('beSend');
    send.setAttribute('href', TALLY + '?about=' + encodeURIComponent('A group or bulk order') +
      '&style=' + encodeURIComponent(summary) + '&source=home-bulk-estimator');
    send.addEventListener('click', function (e) {
      if (!window.Tally) return; /* href opens in a new tab as the fallback */
      e.preventDefault();
      window.Tally.openPopup('gD10Kl', { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000,
        hiddenFields: { about: 'A group or bulk order', style: summary, source: 'home-bulk-estimator' } });
    });
  }

  ['input', 'change'].forEach(function (ev) {
    vEl.addEventListener(ev, render); pEl.addEventListener(ev, render);
    rEl.addEventListener(ev, render); repEl.addEventListener(ev, render);
  });
})();
