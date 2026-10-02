#!/usr/bin/env python3
"""Builds boutique-calculator.html — a simple, shareable USD calculator for
boutique buys: $250 scouting fee + 15% of the pieces (20% rush), at least $14
a piece and $25 a buy. Keep RULES in step with js/boutique-estimator.js and
tools/build-prices.py. Run from the site root: python3 tools/build-boutique-calc.py
Prefill a link for a client:  boutique-calculator?budget=3000&pieces=30"""
import re
src=open('policy.html').read()
head=src.split('<script type="application/ld+json">')[0]
mark=re.search(r'<svg class="pc-mark".*?</svg>',src,re.S).group(0).replace('pc-mark','lg-mark')
desc='Work out a boutique buy with Seraphic Styler in seconds: $250 scouting fee, then 15% of the pieces, with the three payments and the total.'
head=re.sub(r'<title>.*?</title>','<title>Boutique Calculator · Seraphic Styler</title>',head)
head=re.sub(r'(<meta name="description" content=")[^"]*',lambda m:m.group(1)+desc,head)
head=re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m.group(1)+'Boutique Calculator — Seraphic Styler',head)
head=re.sub(r'(<meta property="og:description" content=")[^"]*',lambda m:m.group(1)+desc,head)
head=head.replace('seraphicstyler.com/policy"','seraphicstyler.com/boutique-calculator"')
STRIPE='https://buy.stripe.com/aFafZi2jtdjF9AsavUaAw0e?client_reference_id=boutique-calculator'
page=head+'''  <link rel="stylesheet" href="css/legal.css?v=2026-10-01" />
  <style>
    .bc { max-width: 720px; margin: 0 auto; }
    .bc-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin: 0 0 1.6rem; }
    @media (max-width: 560px) { .bc-rules { grid-template-columns: 1fr; } }
    .bc-rule { border: 1px solid var(--surface-border); border-radius: 16px; background: var(--surface); padding: 1rem; text-align: center; }
    .bc-rule b { display: block; font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: 2.1rem; line-height: 1; color: var(--accent); }
    .bc-rule span { display: block; margin-top: 0.45rem; font-family: var(--font-body); font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary); }
    .bc-card { border: 1px solid var(--surface-border); border-radius: 20px; padding: clamp(1.2rem, 4vw, 1.8rem);
      background: linear-gradient(135deg, var(--accent-soft), transparent 60%), var(--surface); }
    .bc-in { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    @media (max-width: 560px) { .bc-in { grid-template-columns: 1fr; } }
    .bc-in label { display: flex; flex-direction: column; gap: 0.4rem; font-family: var(--font-brand); text-transform: uppercase;
      letter-spacing: 0.16em; font-size: 0.64rem; color: var(--eyebrow-ink); }
    .bc-in input[type=number] { font: 500 1.3rem/1.2 var(--font-body); color: var(--text-primary); background: var(--surface-solid);
      border: 1px solid var(--surface-border); border-radius: 12px; padding: 0.7rem 0.85rem; width: 100%; box-sizing: border-box; }
    .bc-in input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .bc-in small { text-transform: none; letter-spacing: 0; font-family: var(--font-body); font-size: 0.74rem; color: var(--text-secondary); }
    .bc-rush { grid-column: 1 / -1; flex-direction: row !important; align-items: center; gap: 0.6rem !important; text-transform: none !important;
      letter-spacing: 0 !important; font: 0.86rem var(--font-body) !important; color: var(--text-secondary) !important; }
    .bc-rush input { width: 18px; height: 18px; accent-color: var(--accent); }
    .bc-out { margin-top: 1.4rem; }
    .bc-out h2 { margin: 0 0 0.4rem; font-family: var(--font-brand); font-weight: 400; text-transform: uppercase; letter-spacing: 0.2em; font-size: 0.66rem; color: var(--eyebrow-ink); }
    .bc-out dl { margin: 0; }
    .bc-out dl > div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.55rem 0; border-top: 1px solid var(--surface-border);
      font-family: var(--font-body); font-size: 0.9rem; color: var(--text-secondary); }
    .bc-out dl > div:first-child { border-top: 0; }
    .bc-out dd { margin: 0; white-space: nowrap; color: var(--text-primary); font-weight: 500; font-variant-numeric: tabular-nums; }
    .bc-out .bc-tot { border-top: 2px solid var(--accent); margin-top: 0.3rem; padding-top: 0.8rem; }
    .bc-out .bc-tot dt, .bc-out .bc-tot dd { font-size: 1.1rem; color: var(--text-primary); font-weight: 600; }
    .bc-note { margin: 0.5rem 0 0; font-size: 0.78rem; color: var(--text-secondary); font-style: italic; line-height: 1.6; }
    .bc-stages { margin-top: 1.4rem; }
    .bc-cta { margin-top: 1.4rem; display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .bc-btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 1.3rem; border-radius: 999px; text-decoration: none;
      font-family: var(--font-accent); font-size: 0.8rem; color: #fff; background: var(--accent); border: 1px solid var(--accent); cursor: pointer; }
    html.dark .bc-btn { color: #1a1d29; }
    .bc-btn.alt { background: none; color: var(--accent); }
    .bc-fine { max-width: 720px; margin: 1.6rem auto 0; }
  </style>
  <script src="js/i18n-site.js?v=2026-09-12" defer></script>
  <script src="js/geo-lang.js?v=2026-09-12" defer></script>
</head>
<body id="top">
  <div class="grain" aria-hidden="true"></div>
  <header class="lg lg-top">
    '''+mark+'''
    <a class="brand-lockup" href="./" aria-label="Seraphic Styler home"><span class="brand-seraphic">Seraphic</span><span class="brand-styler">Styler</span></a>
  </header>
  <main class="lg">
    <div class="lg-hero">
      <span class="lg-eyebrow">For boutiques</span>
      <h1 class="lg-h1">Your buy, <em>worked out</em></h1>
      <p class="lg-lead">Type your budget for pieces and roughly how many. You’ll see my fees, when you pay each part, and your total, in US dollars.</p>
    </div>
    <div class="bc">
      <div class="bc-rules" aria-label="How boutique pricing works">
        <div class="bc-rule"><b>$250</b><span>Scouting fee, once per round. Paid to start.</span></div>
        <div class="bc-rule"><b>15%</b><span>Of the pieces you choose. 20% for rush or made-to-measure.</span></div>
        <div class="bc-rule"><b>$0</b><span>Markup on pieces. You pay the designer’s price.</span></div>
      </div>
      <form class="bc-card" id="bcForm" onsubmit="return false">
        <div class="bc-in">
          <label for="bcBudget">Budget for pieces (USD)<input type="number" id="bcBudget" min="0" step="50" inputmode="decimal" value="3000"><small>What the pieces themselves cost</small></label>
          <label for="bcPieces">Number of pieces<input type="number" id="bcPieces" min="1" step="1" inputmode="numeric" value="30"><small>Roughly is fine, e.g. 10 styles × 3</small></label>
          <label class="bc-rush" for="bcRush"><input type="checkbox" id="bcRush"> Rush timeline or made-to-measure pieces (20% instead of 15%)</label>
        </div>
        <div class="bc-out" aria-live="polite">
          <h2>Your buy</h2>
          <dl>
            <div><dt>Pieces, at the designer’s price</dt><dd id="oPieces">$3,000</dd></div>
            <div><dt>Scouting fee</dt><dd>$250</dd></div>
            <div><dt id="oFeeL">Buying fee, 15%</dt><dd id="oFee">$450</dd></div>
            <div class="bc-tot"><dt>Total</dt><dd id="oTot">$3,700 + shipping</dd></div>
          </dl>
          <p class="bc-note" id="oNote"></p>
          <div class="bc-stages">
            <h2>When you pay</h2>
            <dl>
              <div><dt>1 · To start: the scouting fee</dt><dd>$250</dd></div>
              <div><dt>2 · Once you’ve chosen your pieces: pieces + half the buying fee</dt><dd id="o2">$3,225</dd></div>
              <div><dt>3 · Once every piece is photographed and approved: the rest of the buying fee + shipping</dt><dd id="o3">$225 + shipping</dd></div>
            </dl>
          </div>
        </div>
        <div class="bc-cta">
          <a class="bc-btn" href="'''+STRIPE+'''" target="_blank" rel="noopener">Pay the $250 scouting fee →</a>
          <button type="button" class="bc-btn alt" id="bcShare">Copy a link to these numbers</button>
        </div>
      </form>
      <section class="lg-glance bc-fine" aria-labelledby="fine-h">
        <h2 id="fine-h">Good to know</h2>
        <ul class="lg-bul">
          <li><strong>Shipping</strong> is the courier’s actual cost on the day it ships, quoted before you pay it. <strong>Import duties</strong> in your country are yours.</li>
          <li><strong>Minimums:</strong> the buying fee is at least $14 per piece and $25 per buy, so very inexpensive pieces may cost a little more than 15%.</li>
          <li><strong>The scouting fee</strong> covers three to four hours of finding designers and a line sheet of options with photos, prices and sizes. It isn’t deducted from your order, and the line sheet is yours even if you don’t buy.</li>
          <li><strong>Nothing is bought without your yes.</strong> Your exact numbers come in a written quote first.</li>
        </ul>
        <p class="lg-fine">More detail: <a href="for-boutiques">for boutiques</a> · <a href="prices#boutique">all prices</a> · <a href="for-boutiques#btqEst">the full estimator with duty and margin math</a></p>
      </section>
    </div>
  </main>
  <footer class="lg-foot">
    <a href="prices">Prices</a><a href="for-boutiques">For boutiques</a><a href="terms">Terms</a><a href="privacy">Privacy</a><a href="./">Home</a>
  </footer>
  <script>
  (function () {
    var RULES = { scout: 250, pct: 0.15, rushPct: 0.20, perPiece: 14, perBuy: 25 };
    var b = document.getElementById('bcBudget'), n = document.getElementById('bcPieces'), r = document.getElementById('bcRush');
    var q = new URLSearchParams(location.search);
    if (q.get('budget')) b.value = q.get('budget');
    if (q.get('pieces')) n.value = q.get('pieces');
    if (q.get('rush') === '1') r.checked = true;
    function $(x) { return '$' + Math.round(x).toLocaleString('en-US'); }
    function set(id, v) { document.getElementById(id).textContent = v; }
    function calc() {
      var B = Math.max(0, parseFloat(b.value) || 0), P = Math.max(0, parseInt(n.value, 10) || 0);
      var pct = r.checked ? RULES.rushPct : RULES.pct;
      var fee = B * pct, note = '';
      if (P * RULES.perPiece > fee) { fee = P * RULES.perPiece; note = 'The $14-per-piece minimum applies here: ' + P + ' × $14 = ' + $(fee) + ', more than ' + Math.round(pct * 100) + '% of ' + $(B) + '.'; }
      if (B > 0 && fee < RULES.perBuy) { fee = RULES.perBuy; note = 'The $25 minimum buying fee applies here.'; }
      if (!(B > 0)) fee = 0;
      set('oPieces', $(B));
      set('oFeeL', note ? 'Buying fee, minimum' : 'Buying fee, ' + Math.round(pct * 100) + '%');
      set('oFee', $(fee));
      set('oTot', $(B + RULES.scout + fee) + ' + shipping');
      set('o2', $(B + fee / 2));
      set('o3', $(fee / 2) + ' + shipping');
      set('oNote', note);
    }
    [b, n, r].forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
    document.getElementById('bcShare').addEventListener('click', function () {
      var url = location.origin + location.pathname.replace(/\\.html$/, '') + '?budget=' + encodeURIComponent(b.value) + '&pieces=' + encodeURIComponent(n.value) + (r.checked ? '&rush=1' : '');
      var btn = this;
      function done() { btn.textContent = 'Link copied'; setTimeout(function () { btn.textContent = 'Copy a link to these numbers'; }, 2200); }
      try { navigator.clipboard.writeText(url).then(done, function () { prompt('Copy this link:', url); }); } catch (e) { prompt('Copy this link:', url); }
    });
    calc();
  })();
  </script>
</body>
</html>
'''
open('boutique-calculator.html','w').write(page); print('wrote boutique-calculator.html')
