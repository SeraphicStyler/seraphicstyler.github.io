/* Seraphic Styler — boutique buying-agent estimator (#btqEst on the home page).
   A planning figure, not a checkout: the fee ladder, three-stage payment flow and
   shipping anchors from the #boutique section, made interactive. Anchored to
   the two worked cards (24 × 2,800,000₫ → 15% tier; 60 × 3,700,000₫ → 12%
   tier) at the same ≈26,300₫/$ planning rate named in btq.exsub — keep BTQ
   below in step with the section markup if fees, bands or fx copy change.

   The temporary August flight window (homepage flight band +
   free-international-shipping.html) rides on top as a scenario layer — it
   never replaces the courier model, and its UI self-expires with the window,
   exactly like the flight band. */
(function () {
  'use strict';

  var out = document.getElementById('btqOut');
  var pEl = document.getElementById('btqPieces');
  var aEl = document.getElementById('btqAvg');
  var rEl = document.getElementById('btqRegion');
  var rushEl = document.getElementById('btqRush');
  var flEl = document.getElementById('btqFlight');
  var flWrap = document.getElementById('btqFlightWrap');
  var onEl = document.getElementById('btqOnward');
  var onWrap = document.getElementById('btqOnwardWrap');
  var pre1 = document.getElementById('btqPre1');
  var pre2 = document.getElementById('btqPre2');
  if (!out || !pEl || !aEl || !rEl) return;

  var C = window.CONFIG || {};

  /* Everything a future edit should need to touch lives here. */
  var BTQ = {
    /* Approximate display only — quotes are fixed in đồng; each payment's
       dollar figure is confirmed at that day's rate. 26,300 is the planning
       rate the worked cards in this section are converted at (btq.exsub). */
    planFxVndPerUsd: 26300,

    /* Planning weight, mirrored from the worked cards: 24 pieces ≈ 8.4kg,
       60 ≈ 21kg. An estimate, never a guaranteed packed weight. */
    kgPerPiece: 0.35,
    boxKg: 10,          /* over one standard box, split shipment — quoted after packing */

    minFeeUsd: 25,
    rushPct: 0.20,      /* replaces the tier, never adds to it */

    /* Two layers, and both have to be named or the total looks invented:
         · MFN / HTS apparel duty — roughly 16% woven to 32% knit
         · Section 301 forced-labour duty — 12.5% for Vietnam, additive
       The Section 301 layer took effect 24 July 2026, replacing the expired
       Section 122 surcharge, and for Vietnam it STACKS on MFN rather than
       capping to it (the cap applies only to the EU, Taiwan, Japan, Korea and
       Switzerland). Verified against USTR and law-firm guidance, August 2026.
       Annexes I and II carry product exclusions this does not check, so the
       label defers to the broker's classification, as it must. */
    duty: { mfnLow: 0.16, mfnHigh: 0.32, s301: 0.125, asOf: '24 Jul 2026' },

    /* Merchandise Processing Fee, FY2026: 0.3464% of the goods, floored at
       $33.58 and capped at $651.50 per entry. The floor is the whole point —
       it is charged per ENTRY, so five small parcels pay five floors. */
    mpf: { rate: 0.003464, minUsd: 33.58, maxUsd: 651.50 },

    /* The resale test. Boutique keystone runs about 2.2–2.5x on landed cost;
       2.3 is the midpoint used for the break-even line. Break-even units are
       ceil(pieces / markup) — which depends only on the markup, not on any of
       the cost figures above, so it stays true even if every estimate here is
       off. That is why it is the most trustworthy number the tool prints. */
    markup: { low: 2.2, mid: 2.3, high: 2.5 },

    /* Sanity bounds — a planning tool should not render nonsense. */
    maxPieces: 2000,
    maxAvgVnd: 500000000,

    /* The gate before any sourcing begins: nothing is scouted until this
       lands. Published price, so it displays without the ≈ — and credited in
       full against the first payment, so it never changes the totals. */
    scoutDepositVnd: 3900000,
    scoutDepositUsdText: '$150',

    /* The ladder — tier set by the whole buy, not per designer. The cap
       implements btq.tierline: "Your fee is never more than it would be at
       the next tier's opening." */
    tiers: [
      { openUsd: 0,     pct: 0.18 },
      { openUsd: 1500,  pct: 0.15 },
      { openUsd: 5000,  pct: 0.12 },
      { openUsd: 10000, pct: 0.10 },
      { openUsd: 20000, pct: 0.08 }
    ],

    /* The two worked cards, as one-tap starting points. */
    presets: {
      first:  { pieces: 24, avgVnd: 2800000, region: 'us' },
      repeat: { pieces: 60, avgVnd: 3700000, region: 'us' }
    },

    /* Shipping anchors — same bands as CONFIG.shipping in js/estimator.js
       (loaded first on this page); local fallback keeps this alive alone. */
    shipping: C.shipping || {
      asia:    { standard: [1800000, 5000000] },  oceania: { standard: [2800000, 7500000] },
      us:      { standard: [3800000, 10000000] }, eu:      { standard: [3600000, 9500000] },
      mena:    { standard: [3500000, 9300000] },  sca:     { standard: [3400000, 9200000] },
      latam:   { standard: [4500000, 11500000] }, africa:  { standard: [4600000, 12000000] }
    },

    /* Temporary flight-window override — the homepage band's offer, applied
       to a boutique buy as a scenario beside the courier case, never instead
       of it. Dates mirror the band and free-international-shipping.html;
       delete or update this block when the window changes. */
    flight: {
      ordersClose: new Date(2026, 7, 15, 23, 59, 59),  /* 15 August 2026 */
      bagsCloseText: 'the night of 16 August',
      flightText: '18 August',
      etaText: 'around 22–27 August',
      suitcaseKg: 20,      /* one checked bag — what realistically flies */
      usOnly: true,        /* the suitcase lands in Orange County */
      onward: [
        { id: 'pickup', label: 'Free pickup, central Orange County', short: 'OC pickup — free',            lowUsd: 0,  highUsd: 0 },
        { id: 'doorOC', label: 'Doorstep, Orange County — $20',      short: 'doorstep OC — $20',           lowUsd: 20, highUsd: 20 },
        { id: 'doorLA', label: 'Doorstep, greater LA — $40',         short: 'doorstep LA — $40',           lowUsd: 40, highUsd: 40 },
        { id: 'usps',   label: 'Onward inside the US, tracked (e.g. CA → NY) — ≈$25–75', short: 'onward US, tracked — ≈$25–75', lowUsd: 25, highUsd: 75 }
      ]
    }
  };

  var FX = BTQ.planFxVndPerUsd;

  function vnd(x) { return Math.round(x).toLocaleString('en-US') + '₫'; }
  function usd(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
  /* Ranges carry one symbol, exactly as the worked cards write them. */
  function vndR(a, b) { return Math.round(a).toLocaleString('en-US') + '–' + vnd(b); }
  function usdR(a, b) { return '$' + Math.round(a).toLocaleString('en-US') + '–' + Math.round(b).toLocaleString('en-US'); }
  function row(label, value, cls) {
    return '<div class="be-row' + (cls ? ' ' + cls : '') + '"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
  }

  /* The buying fee in đồng, with the tier label the section itself uses.
     Order of rules: rush replaces the tier; the next-tier's-opening cap
     honours btq.tierline; the $25 minimum floors the smallest top-ups. */
  function fee(totalVnd, totalUsd, rush) {
    var amount, label;
    if (rush) {
      amount = totalVnd * BTQ.rushPct;
      label = 'flat 20% — rush or atelier coordination, replaces the tier, agreed in writing first';
    } else {
      var ti = 0;
      for (var i = 0; i < BTQ.tiers.length; i++) if (totalUsd >= BTQ.tiers[i].openUsd) ti = i;
      var t = BTQ.tiers[ti], next = BTQ.tiers[ti + 1];
      amount = totalVnd * t.pct;
      label = Math.round(t.pct * 100) + '% tier, one written number';
      if (next) {
        var cap = next.openUsd * FX * next.pct;
        if (amount > cap) {
          amount = cap;
          label = Math.round(t.pct * 100) + '% tier, capped at the next tier’s opening — never more than ' + usd(next.openUsd * next.pct);
        }
      }
    }
    /* The $25 minimum floors every path, rush included — never zero, never a surprise. */
    var floor = BTQ.minFeeUsd * FX;
    if (amount < floor) { amount = floor; label = '$25 minimum fee — small top-ups simply floor here'; }
    return { amount: amount, label: label };
  }

  /* The money, as the three moments it actually moves. "Paid in two" plus a
     floating deposit row described the same total but hid the sequence, and the
     sequence is the thing a first-time client is anxious about: what do I pay,
     when, and what has happened by then.

     Stages 1 and 2 never change with the shipping route, so they live in the
     common block; stage 3 carries the freight and is drawn per scenario. */
  function stage12Rows(totalVnd, feeVnd) {
    var half = feeVnd / 2;
    var stage2 = Math.max(0, totalVnd + half - BTQ.scoutDepositVnd);
    var h = '';
    h += row('<b>1 · To begin</b> — the scouting deposit, before a single showroom is walked',
      vnd(BTQ.scoutDepositVnd) + ' · ' + BTQ.scoutDepositUsdText);
    h += row('<b>2 · Once the line sheet is with you</b> — the pieces at cost plus half the fee, ' +
      'less the deposit you have already paid',
      '≈' + usd(stage2 / FX));
    return h;
  }
  /* Stage 3 closes the buy: the rest of the fee and the freight, and not one
     đồng of it before photographs of every piece have been approved. */
  function stage3Row(feeVnd, shipLow, shipHigh) {
    var half = feeVnd / 2;
    var v = shipLow === shipHigh
      ? '≈' + usd((half + shipLow) / FX)
      : '≈' + usdR((half + shipLow) / FX, (half + shipHigh) / FX);
    return row('<b>3 · Once every piece is bought and photographed</b> — the other half of the fee ' +
      'plus exact shipping, after you approve the photographs. Then it ships.', v);
  }

  /* Duty, the true all-in, and the resale test — the three things a buyer works
     out on paper after reading "landed, before US duty", and therefore the three
     the tool should not make them work out on paper.

     Duty rides on the goods only, so it is identical whether the buy travels by
     courier or in a suitcase. shipLow/shipHigh are the freight for whichever
     scenario is being drawn, so the same function serves both columns. */
  function closingRows(totalVnd, feeVnd, shipLow, shipHigh, pieces) {
    var dutyLow = totalVnd * (BTQ.duty.mfnLow + BTQ.duty.s301);
    var dutyHigh = totalVnd * (BTQ.duty.mfnHigh + BTQ.duty.s301);
    var allLow = totalVnd + feeVnd + shipLow + dutyLow;
    var allHigh = totalVnd + feeVnd + shipHigh + dutyHigh;
    var perLow = allLow / FX / pieces, perHigh = allHigh / FX / pieces;

    /* Progressive disclosure: powerful for a serious buyer, noise for a skimmer.
       "Landed, before duty" stays always-visible above; the resale test sits
       behind a toggle. <details> so keyboard support comes free. */
    var h = '<details class="be-margin"><summary>See the margin math</summary><div class="be-margin-b">';
    var dLo = Math.round((BTQ.duty.mfnLow + BTQ.duty.s301) * 1000) / 10;
    var dHi = Math.round((BTQ.duty.mfnHigh + BTQ.duty.s301) * 1000) / 10;
    h += row('US duty — ' + dLo + '–' + dHi + '% of the goods: MFN ' +
      Math.round(BTQ.duty.mfnLow * 100) + '–' + Math.round(BTQ.duty.mfnHigh * 100) +
      '% plus the ' + (BTQ.duty.s301 * 100) + '% Section 301 in force since ' + BTQ.duty.asOf +
      '. Never on my fee or the freight, and your broker\'s classification is the number that counts.',
      vndR(dutyLow, dutyHigh) + ' · ≈' + usdR(dutyLow / FX, dutyHigh / FX));
    h += row('All-in per piece — duty included', '≈' + usdR(perLow, perHigh), 'bx-per');
    h += row('Retail at ' + BTQ.markup.low + '–' + BTQ.markup.high + '× — the keystone test',
      '≈' + usdR(perLow * BTQ.markup.low, perHigh * BTQ.markup.high));

    /* ceil(pieces / markup): independent of every cost figure above. */
    var be = Math.ceil(pieces / BTQ.markup.mid);
    h += row('Sold to break even — at ' + BTQ.markup.mid + '×',
      be + ' of ' + pieces + ' · ' + Math.round(be / pieces * 100) + '%');

    /* Three buckets, demarcated on purpose. Two are real money; the third is the
       one a consolidation pitch is most often misread as saving, so it is stated
       in the same list rather than buried in a footnote. */
    var mpfOne = Math.min(Math.max((totalVnd / FX) * BTQ.mpf.rate, BTQ.mpf.minUsd), BTQ.mpf.maxUsd);
    h += '<div class="be-stages-h">What consolidating saves — for every designer you would otherwise order from separately</div>';
    h += row('One fewer parcel — freight at this destination\'s band',
      '≈' + usdR(shipLow / FX, shipHigh / FX) + ' each');
    h += row('One fewer customs entry — the MPF floor is charged per entry, not per dollar',
      usd(BTQ.mpf.minUsd) + ' each');
    h += row('One fewer entry for your broker to file', 'at their per-entry rate');
    h += row('<b>Duty saves nothing.</b> It follows the goods, so it is identical whether the buy arrives as one parcel or six, by courier or in a suitcase.',
      '≈' + usdR(dutyLow / FX, dutyHigh / FX) + ' either way');
    h += '<p class="be-mpfnote">Your own consolidated entry: MPF ' + usd(mpfOne) +
      '. FY2026 rate 0.3464% of the goods, floored at ' + usd(BTQ.mpf.minUsd) + ' per entry.</p>';
    return h + '</div></details>';
  }

  /* The window is open while orders are; afterwards the whole scenario layer
     disappears, exactly as the homepage band expires. */
  function flightOpen() { return new Date() <= BTQ.flight.ordersClose; }

  function flightVisible() {
    return flightOpen() && (!BTQ.flight.usOnly || rEl.value === 'us');
  }

  function syncFlightUi() {
    if (!flWrap) return;
    var show = flightVisible();
    flWrap.style.display = show ? '' : 'none';
    if (!show && flEl) flEl.checked = false;
    if (onWrap) onWrap.style.display = (show && flEl && flEl.checked) ? '' : 'none';
  }

  function render() {
    syncFlightUi();
    var pieces = Math.min(parseInt(pEl.value, 10), BTQ.maxPieces);
    var avgVnd = Math.min(parseFloat(aEl.value), BTQ.maxAvgVnd);
    if (!(pieces > 0) || !(avgVnd > 0)) {
      out.innerHTML = '<p class="be-waiting">Enter a piece count and an average showroom price — the whole buy appears here, worked to the đồng.</p>';
      return;
    }

    var totalVnd = pieces * avgVnd;
    var totalUsd = totalVnd / FX;
    var f = fee(totalVnd, totalUsd, rushEl && rushEl.checked);
    var kg = pieces * BTQ.kgPerPiece;
    var kgTxt = (Math.round(kg * 10) / 10) + 'kg';
    var band = (BTQ.shipping[rEl.value] || BTQ.shipping.us).standard;
    var regionTxt = rEl.options[rEl.selectedIndex].text;

    /* Courier case — the permanent model. Over one standard box the split
       shipment is quoted in writing after packing, never guessed; the boxes
       here are planning arithmetic only, same as the repeat-buy card. */
    var boxes = Math.max(1, Math.ceil(kg / BTQ.boxKg));
    var shipLow = band[0] * boxes, shipHigh = band[1] * boxes;
    var shipLine = vndR(shipLow, shipHigh) + ' · ≈' + usdR(shipLow / FX, shipHigh / FX);
    var shipLabel = boxes > 1
      ? '≈' + kgTxt + ' — split shipment, quoted after packing; as ' + boxes + ' standard boxes for planning'
      : 'One parcel, ≈' + kgTxt + ', ' + regionTxt + ' band';

    /* Paid in two — the section's own rule: pieces at cost plus half the fee
       to begin; the other half plus exact shipping before dispatch. */
    var p1 = totalVnd + f.amount / 2;
    var p2 = f.amount / 2;

    var landLow = totalVnd + f.amount + shipLow;
    var landHigh = totalVnd + f.amount + shipHigh;

    var flightOn = flEl && flEl.checked && flightVisible();

    var html = '<dl class="bx-rows">';
    html += row('Pieces at cost — ' + pieces + ' × ≈' + vnd(avgVnd), vnd(totalVnd) + ' · ≈' + usd(totalUsd));
    html += row('Buying fee — ' + f.label, vnd(f.amount) + ' · ≈' + usd(f.amount / FX));
    html += '<div class="be-stages-h">What you pay, and when</div>';
    html += stage12Rows(totalVnd, f.amount);

    if (!flightOn) {
      html += stage3Row(f.amount, shipLow, shipHigh);
      html += row(shipLabel, shipLine);
      html += row('Landed, before US duty', '≈' + usdR(landLow / FX, landHigh / FX), 'bx-total');
      html += row('Per piece, landed', '≈' + usdR(landLow / FX / pieces, landHigh / FX / pieces), 'bx-per');
      html += closingRows(totalVnd, f.amount, shipLow, shipHigh, pieces);
      html += '</dl>';
    } else {
      html += '</dl>';

      var ow = BTQ.flight.onward[0];
      if (onEl) for (var j = 0; j < BTQ.flight.onward.length; j++) if (BTQ.flight.onward[j].id === onEl.value) ow = BTQ.flight.onward[j];
      var owLow = ow.lowUsd * FX, owHigh = ow.highUsd * FX;
      var flLow = totalVnd + f.amount + owLow;
      var flHigh = totalVnd + f.amount + owHigh;
      var savLow = Math.max(0, (shipLow - owHigh) / FX);
      var savHigh = Math.max(0, (shipHigh - owLow) / FX);
      var owTxt = ow.highUsd === 0 ? 'Free'
        : (ow.lowUsd === ow.highUsd ? usd(ow.lowUsd) : '≈' + usdR(ow.lowUsd, ow.highUsd));
      var flPer = ow.lowUsd === ow.highUsd
        ? '≈' + usd(flLow / FX / pieces)
        : '≈' + usdR(flLow / FX / pieces, flHigh / FX / pieces);
      var flLanded = ow.lowUsd === ow.highUsd
        ? '≈' + usd(flLow / FX)
        : '≈' + usdR(flLow / FX, flHigh / FX);

      html += '<div class="be-duo">';
      html += '<div class="dcol"><h4>By courier — the standard model</h4><dl class="bx-rows">'
        + stage3Row(f.amount, shipLow, shipHigh)
        + row(shipLabel, shipLine)
        + row('Landed, before US duty', '≈' + usdR(landLow / FX, landHigh / FX), 'bx-total')
        + row('Per piece, landed', '≈' + usdR(landLow / FX / pieces, landHigh / FX / pieces), 'bx-per')
        + closingRows(totalVnd, f.amount, shipLow, shipHigh, pieces)
        + '</dl></div>';
      html += '<div class="dcol flight"><h4>On the ' + BTQ.flight.flightText + ' flight — this window only</h4><dl class="bx-rows">'
        + row('International leg — in my suitcase, ' + BTQ.flight.flightText, '$0 — instead of ' + usdR(shipLow / FX, shipHigh / FX) + ' by courier')
        + row('From Orange County — ' + ow.short, owTxt)
        + stage3Row(f.amount, owLow, owHigh)
        + row('Landed, before US duty', flLanded, 'bx-total')
        + row('Per piece, landed', flPer, 'bx-per')
        /* Duty is on the goods, so it is identical in both columns — which is
           precisely the thing a free-freight offer can be misread as changing. */
        + closingRows(totalVnd, f.amount, owLow, owHigh, pieces)
        + '</dl></div>';
      html += '</div>';

      html += '<p class="btq-flightnote"><strong>Kept in your margin: ≈' + usdR(savLow, savHigh) + '.</strong> '
        + 'In-stock pieces only — made-to-order follows by courier at cost. Suitcases close ' + BTQ.flight.bagsCloseText
        + '; space is limited and goes in paid order. Landing ' + BTQ.flight.flightText + ', pieces reach you ' + BTQ.flight.etaText + '.'
        + (kg > BTQ.flight.suitcaseKg
          ? ' At ≈' + kgTxt + ' this buy is more than one suitcase — what fits flies free, and the balance follows by courier at cost, quoted in writing after packing.'
          : '')
        + '</p>';
    }

    html += '<div class="be-cta"><a class="btn btn-primary" target="_blank" rel="noopener" id="btqSend" href="#">Send your buy brief →</a></div>';
    out.innerHTML = html;

    /* The CTA carries the breakdown into the same brief form as both section
       CTAs — a distinct source tag tells the three apart. */
    var summary = 'Boutique buy — rough figures\n'
      + 'To start: scouting deposit ' + BTQ.scoutDepositUsdText + ' (' + vnd(BTQ.scoutDepositVnd) + '), credited in full\n'
      + 'Pieces at cost: ' + pieces + ' × ' + vnd(avgVnd) + ' = ' + vnd(totalVnd) + ' (≈' + usd(totalUsd) + ')\n'
      + 'Buying fee: ' + f.label + ' = ' + vnd(f.amount) + ' (≈' + usd(f.amount / FX) + ')\n'
      + 'Destination: ' + regionTxt + ' · ≈' + kgTxt + '\n'
      + 'Stage 1 — scouting deposit: ' + BTQ.scoutDepositUsdText + '\n'
      + 'Stage 2 — on the line sheet, pieces + half the fee less the deposit: ≈' + usd(Math.max(0, p1 - BTQ.scoutDepositVnd) / FX) + '\n'
      + 'Stage 3 — on photo approval, rest of the fee + exact shipping: ≈' + usd(p2 / FX) + ' + shipping\n'
      + (flightOn
        ? 'August flight window: international leg $0 (' + ow.short + ') — landed before duty ' + flLanded
        : 'Landed before US duty: ≈' + usdR(landLow / FX, landHigh / FX));
    var TALLY = (C.contact && C.contact.tally) || 'https://tally.so/r/gD10Kl';
    var about = 'I run a boutique — buying agent support';
    var send = document.getElementById('btqSend');
    send.setAttribute('href', TALLY + '?about=' + encodeURIComponent(about)
      + '&style=' + encodeURIComponent(summary) + '&source=home-boutique-estimator');
    send.addEventListener('click', function (e) {
      if (!window.Tally) return; /* href opens in a new tab as the fallback */
      e.preventDefault();
      window.Tally.openPopup('gD10Kl', { layout: 'modal', width: 700, hideTitle: true, autoClose: 4000,
        hiddenFields: { about: about, style: summary, source: 'home-boutique-estimator' } });
    });
  }

  function applyPreset(p, btn, other) {
    pEl.value = p.pieces; aEl.value = p.avgVnd; rEl.value = p.region;
    if (rushEl) rushEl.checked = false;
    btn.setAttribute('aria-pressed', 'true');
    if (other) other.setAttribute('aria-pressed', 'false');
    render();
  }
  if (pre1) pre1.addEventListener('click', function () { applyPreset(BTQ.presets.first, pre1, pre2); });
  if (pre2) pre2.addEventListener('click', function () { applyPreset(BTQ.presets.repeat, pre2, pre1); });

  function clearPressed() {
    if (pre1) pre1.setAttribute('aria-pressed', 'false');
    if (pre2) pre2.setAttribute('aria-pressed', 'false');
  }
  ['input', 'change'].forEach(function (ev) {
    pEl.addEventListener(ev, function () { clearPressed(); render(); });
    aEl.addEventListener(ev, function () { clearPressed(); render(); });
    rEl.addEventListener(ev, render);
    if (rushEl) rushEl.addEventListener(ev, render);
    if (flEl) flEl.addEventListener(ev, render);
    if (onEl) onEl.addEventListener(ev, render);
  });

  /* Default state: the most likely first order — the first-buy worked card,
     landing squarely in the 15% tier, so the tool opens already believable. */
  applyPreset(BTQ.presets.first, pre1, pre2);
})();
