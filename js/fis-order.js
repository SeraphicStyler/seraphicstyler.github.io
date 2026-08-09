/* Seraphic Styler — the order hand-off on the shipping page (fis-order.js)
   ----------------------------------------------------------------------
   The page already does the hard part: a client picks a size, a delivery
   method and a budget, and watches a real total assemble. Then, at the
   single moment of highest intent, it asked them to COPY a block of text,
   leave the site, open Instagram, and paste it into a DM. Three apps and a
   context switch stand between wanting the thing and asking for it, and
   whoever drops out in the middle leaves no trace — there is nothing to
   follow up, and no way to know it happened.

   This adds the missing step: one button that carries the order the client
   just built straight into the inquiry form the rest of the site already
   uses, prefilled. The DM and email links stay exactly where they are for
   anyone who prefers them — this is an additional door, not a replacement.

   It also fixes what happens after the flight. This page is indexed, in the
   sitemap, and carries Open Graph tags, so it keeps earning visitors long
   after 15 August — and on 16 August every one of them meets "orders
   closed, DM me", which captures nothing. Past the cut-off the same button
   becomes a next-flight waitlist, so late traffic is still worth something.

   No backend: it posts to the Tally form the other ten pages use, so the
   record and the notification arrive the same way they always have. Dates
   and form id come from window.FIS_FLIGHT, set once in the page.

   Values are read from the RENDERED summary, never recomputed — the tier
   table lives in the page's own script, and a second copy here would be a
   pricing bug waiting to happen. If the summary changes, this follows.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  var F = window.FIS_FLIGHT;
  var summary = document.getElementById('sumTotal');
  if (!F || !summary) return; /* not this page */

  var FORM = 'https://tally.so/r/' + (F.form || 'gD10Kl');
  var $ = function (id) { return document.getElementById(id); };
  function txt(id) { var el = $(id); return el ? (el.textContent || '').trim() : ''; }

  /* ---------- where are we in the flight's life? ---------- */
  function endOf(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59); }
  var now = new Date();
  var open = now <= endOf(F.close);                 /* still taking orders   */
  var inFlight = !open && now <= endOf(F.land);     /* closed, not yet landed */

  /* ---------- the order the client just built ---------- */
  function orderText() {
    var lines = ['From seraphicstyler.com/free-international-shipping'];
    var tier = txt('sumTierLbl').replace(/ — my entire fee$/, '');
    if (tier) lines.push('Size: ' + tier + ' (' + txt('sumFee') + ')');
    var ship = txt('sumShipLbl');
    if (ship) lines.push('Receive: ' + ship + ' — ' + txt('sumShip'));
    var b = $('fisBudget'), budget = b ? parseFloat(b.value) : NaN;
    lines.push(!isNaN(budget) && budget > 0
      ? 'Piece budget: about $' + Math.round(budget).toLocaleString('en-US')
      : 'Piece budget: still deciding');
    lines.push(txt('sumTotalLbl') + ': ' + txt('sumTotal'));
    lines.push('');
    lines.push(open
      ? 'Flight: ' + fmt(F.land) + '. What I am dreaming of:'
      : 'I missed the ' + fmt(F.land) + ' flight — please keep me for the next one. What I am dreaming of:');
    return lines.join('\n');
  }
  function fmt(iso) {
    var p = String(iso).split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  }
  function tierName() { return txt('sumTierLbl').replace(/ — my entire fee$/, ''); }

  function formUrl() {
    var q = 'source=free-international-shipping'
      + '&about=' + encodeURIComponent(orderText())
      + '&tier=' + encodeURIComponent(tierName())
      + '&flight=' + encodeURIComponent(open ? F.land : 'next');
    return FORM + '?' + q;
  }

  /* ---------- the button ---------- */
  var copyBtn = $('fisCopyBtn');
  if (copyBtn && copyBtn.parentNode) {
    var send = document.createElement('a');
    send.className = copyBtn.className.replace(/\bbtn-ghost\b|\bghost\b/g, '').trim() || 'btn';
    send.classList.add('btn', 'btn-primary', 'fis-send');
    send.target = '_blank';
    send.rel = 'noopener';
    send.textContent = open ? 'Send this order →' : 'Save my place on the next flight →';
    send.href = formUrl();
    /* rebuilt on click, so it always carries the CURRENT picker state rather
       than whatever was selected when the page loaded */
    send.addEventListener('click', function () { send.href = formUrl(); });
    copyBtn.parentNode.insertBefore(send, copyBtn);
    /* the copy button is now the quieter second option, not the only one */
    copyBtn.classList.remove('btn-primary');
    if (!/ghost/.test(copyBtn.className)) copyBtn.classList.add('btn-ghost');
    if (open) copyBtn.textContent = 'Or copy it for a DM';
  }

  /* ---------- past the cut-off, stop pretending the flight is open ---------- */
  if (!open) {
    var bar = $('fisBar');
    if (bar) {
      var barCta = bar.querySelector('a.btn');
      if (barCta) {
        barCta.textContent = 'Join the next flight';
        barCta.href = formUrl();
        barCta.target = '_blank';
        barCta.rel = 'noopener';
      }
      /* the page's own countdown writes "DM me" here; the bar now offers a form,
         so the label has to agree with the button beside it */
      var title = $('fisBarTitle');
      if (title) title.textContent = inFlight ? 'This flight is packed' : 'Next flight';
      var sub = $('fisBarSub');
      if (sub) sub.textContent = inFlight ? 'Go first on the next one' : 'Free shipping · one flight at a time';
    }
    /* the closing section still says "DM the piece you've been staring at",
       which reads as an open invitation on a closed flight */
    var cta = $('cta');
    if (cta) {
      var lead = cta.querySelector('p');
      if (lead) {
        lead.textContent = inFlight
          ? 'This suitcase is packed and flying ' + fmt(F.land) + '. Leave your piece and your size and you go first on the next flight — same flat prices, same free shipping.'
          : 'That flight has landed. Leave the piece you have been staring at and you go first on the next one — same flat prices, same free shipping.';
      }
      var primary = cta.querySelector('a.btn-primary, a.btn');
      if (primary) {
        primary.textContent = 'Save my place →';
        primary.href = formUrl();
        primary.target = '_blank';
        primary.rel = 'noopener';
      }
    }
  }
})();
