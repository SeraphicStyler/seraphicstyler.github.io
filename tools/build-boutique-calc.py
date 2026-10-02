#!/usr/bin/env python3
"""Builds boutique-calculator.html — the standalone boutique calculator.

The live calculator is the shared component in js/pricing.js (also embedded
in the boutiques view of /prices and, compact, in the site menu); this page
ships a static worked example inside the mount point for readers without
JavaScript. Figures come from js/pricing.js via tools/pricing_data.py.
Prefill a link for a client:  boutique-calculator?budget=3000&pieces=30(&rush=1)
Run from anywhere:  python3 tools/build-boutique-calc.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pricing_data import DATA, ROOT, usd0, pct, boutique_trio_html, calc_fallback_html, good_to_know_html, page_head, brand_header

OUT = os.environ.get('SS_CALC_OUT') or os.path.join(ROOT, 'boutique-calculator.html')

body = f'''<body id="top" class="bc-page">
  <div class="grain" aria-hidden="true"></div>
  {brand_header()}
  <main class="lg">
    <div class="lg-hero">
      <span class="lg-eyebrow">For boutiques</span>
      <h1 class="lg-h1">Your buy, <em>worked out</em></h1>
      <p class="lg-lead">Enter your budget and roughly how many pieces you want. You’ll see my fees, when each is due, and your total — in US dollars.</p>
    </div>
    <div class="bc-wrap">
      {boutique_trio_html()}
      <div class="bcalc-mount" id="bcalc-page">{calc_fallback_html()}</div>
      <section class="lg-glance bc-fine" aria-labelledby="fine-h">
        <h2 id="fine-h">Good to know</h2>
        {good_to_know_html()}
        <p class="lg-fine">More detail: <a href="prices?for=boutiques">boutique prices</a> · <a href="for-boutiques">how a buying round works</a> · <a href="for-boutiques#btqEst">the full estimator, with duty and margin</a></p>
      </section>
    </div>
  </main>
  <footer class="lg-foot">
    <a href="prices?for=boutiques">Prices</a><a href="for-boutiques">For boutiques</a><a href="terms">Terms</a><a href="privacy">Privacy</a><a href="./">Home</a>
  </footer>
  <script>SS_PRICING.initCalculatorPage();</script>
</body>
</html>
'''

desc = (f'Work out a boutique buy with Seraphic Styler in seconds: a {usd0(DATA["boutique"]["scoutUsd"])} scouting fee, then '
        f'{pct(DATA["boutique"]["pct"])} of the pieces, with when each payment is due and your total.')
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(page_head('boutique-calculator', 'Boutique Calculator', desc) + body)
print('wrote', os.path.relpath(OUT, ROOT))
