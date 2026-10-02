#!/usr/bin/env python3
"""Builds prices.html from js/pricing.js (via tools/pricing_data.py).

Two views behind a "For individuals | For boutiques" switch:
  · individuals — Buy a piece, The Trace, Styling (gift cards folded in),
    Group orders; đồng first with dollars in brackets;
  · boutiques — the fee trio, research rate and the live calculator; dollars.
Every section shares one anatomy: kicker → name → price → 3–5 points →
worked example. Run from anywhere:  python3 tools/build-prices.py"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pricing_data import (DATA, FX, ROOT, usd0, vnd, pct, from_vnd, from_usd, money, h_vnd, h_usd, esc,
                          item_fee_vnd, tier, styling_table_html, boutique_trio_html, calc_fallback_html,
                          good_to_know_html, page_head, brand_header)

OUT = os.environ.get('SS_PRICES_OUT') or os.path.join(ROOT, 'prices.html')
SR = 'service-request.html?service='


def bul(*items):
    return '<ul class="lg-bul pr-points">' + ''.join(f'<li>{i}</li>' for i in items) + '</ul>'


def btn(href, label, alt=False):
    return f'<a class="pr-btn{" alt" if alt else ""}" href="{href}">{label}</a>'


def example(title, rows, total, note=None):
    body = ''.join(f'<tr><th scope="row">{a}</th><td class="num">{b}</td></tr>' for a, b in rows)
    foot = f'<tfoot><tr><th scope="row">{total[0]}</th><td class="num">{total[1]}</td></tr></tfoot>'
    n = f'<p class="pr-exn">{note}</p>' if note else ''
    return (f'<figure class="pr-ex"><figcaption>Example · {title}</figcaption>'
            f'<table class="pr-ex-table"><tbody>{body}</tbody>{foot}</table>{n}</figure>')


def section(sid, who, title, price, price_sub, body, cta):
    return f'''
      <section class="pr-sec" id="{sid}" aria-labelledby="{sid}-h">
        <p class="pr-who">{who}</p>
        <h2 id="{sid}-h">{title}</h2>
        <div class="pr-price"><b>{price}</b><span>{price_sub}</span></div>
        {body}
        <div class="pr-cta">{cta}</div>
      </section>'''


s, b, g, tr = DATA['sourcing'], DATA['boutique'], DATA['group'], DATA['trace']

# 1 · Buy a piece -------------------------------------------------------------
item = s['example']['itemVnd']
fee = item_fee_vnd(item)
order = s['orderFeeVnd']
transfer = (item + fee + order) * s['transferPct']
buy_total = item + fee + order + transfer
buy = section('buy', 'You know exactly what you want', 'Buy a piece', h_vnd(s['minFeeVnd']), 'per item, most items',
    bul('<strong>The item</strong> at the shop’s own price. I never add a markup.',
        f'<strong>My fee: {h_vnd(s["minFeeVnd"])} per item.</strong> Items over {h_vnd(s["minFeeVnd"] / s["rate"])} are {pct(s["rate"])} of the price instead, and items over {h_vnd(s["highFromVnd"])} are {pct(s["highRate"])}.',
        f'<strong>{h_vnd(order)} per order</strong> for packing and coordination. {["No", "One", "Two", "Three"][s["shopsIncluded"]]} shops are included; each extra shop is {h_vnd(s["extraShopVnd"])}.',
        f'<strong>{pct(s["transferPct"])} currency transfer</strong> on the order, which covers sending your money to the shop in đồng.',
        '<strong>Shipping</strong> at the courier’s actual cost, quoted before it ships.')
    + example(f'one {from_vnd(item)} dress',
              [('Dress', h_vnd(item)), ('My fee', h_vnd(fee)), ('Order fee', h_vnd(order)), (f'Currency transfer, {pct(s["transferPct"])}', h_vnd(transfer))],
              ('You pay', h_vnd(buy_total) + ' + shipping')),
    btn(SR + 'sourcing', 'Buy a piece →') + btn('estimate', 'Estimate your order →', alt=True))

# 2 · The Trace ---------------------------------------------------------------
trace_rows = [('The Trace, paid when you send the photo', h_usd(tr['usd'])),
              ('Later, that dress, from <a href="#buy">Buy a piece</a>', h_vnd(buy_total))]
if tr['credited']:
    trace_rows.append(('Less The Trace you already paid', money(vnd(-tr['usd'] * FX), usd0(-tr['usd']))))
trace_due = buy_total - (tr['usd'] * FX if tr['credited'] else 0)
trace = section('trace', 'You have a photo, but no link', 'The Trace', h_usd(tr['usd']), 'per item',
    bul(f'I find out what the piece is and who sells it, and reply within {tr["replyHours"]} hours.',
        (f'<strong>If you then order it, the {h_usd(tr["usd"])} comes off your order.</strong>' if tr['credited']
         else 'It pays for the research, whether or not you order.'),
        'If it can’t be found, I tell you why and what’s closest.')
    + example('a photo, then the same dress', trace_rows, ('You pay for the dress', h_vnd(trace_due) + ' + shipping')),
    btn(SR + 'trace', 'Start The Trace →'))

# 3 · Styling (gift cards folded in) -----------------------------------------------
ex = DATA['stylingExample']
cap = tier(ex['tier'])
extra = max(0, ex['piecesUsd'] - cap['creditUsd'])
first = DATA['styling'][0]
styling = section('styling', 'You want me to choose', 'Styling', 'from ' + h_usd(first['totalUsd']), 'a fee, plus money for your clothes',
    bul('Every tier has two parts: <strong>my styling fee</strong>, and <strong>money that is spent on your clothes</strong> at the shop’s price.',
        'If you love pieces that cost more, I ask before spending any more.',
        'Styling is charged in US dollars. Shipping is added separately.')
    + '<div class="pr-table-wrap" role="region" aria-label="Styling tiers" tabindex="0">'
    + styling_table_html(lambda t: f'{SR}styling&tier={t["id"]}') + '</div>'
    + '<aside class="pr-gift" id="gift" aria-label="Gift cards"><p><strong>Giving it?</strong> Any tier as a gift card — same prices, never expire.</p>'
      '<a href="index.html#gift">Choose a gift →</a></aside>'
    + example(cap['name'],
              [('My styling fee', h_usd(cap['feeUsd'])), ('Spent on your clothes', h_usd(cap['creditUsd'])),
               (f'Your pieces come to {from_usd(ex["piecesUsd"])}, so you approve an extra', h_usd(extra))],
              ('You pay', h_usd(cap['feeUsd'] + cap['creditUsd'] + extra) + ' + shipping')),
    btn(SR + 'styling', 'Book styling →'))

# 4 · Group orders ---------------------------------------------------------------
ge = g['example']
pieces_usd = ge['pieces'] * ge['eachUsd']
group = section('group', 'Weddings, sororities, events, friends', 'Group orders', pct(g['pct']), f'of the order, from {from_usd(g["fromUsd"])}',
    bul(f'<strong>Orders of {h_usd(g["fromUsd"])} or more:</strong> my fee is {pct(g["pct"])} of the order, or {pct(g["rushPct"])} if pieces are made to measure or rushed.',
        f'Orders under {h_usd(g["fromUsd"])} are priced like <a href="#buy">buying a piece</a>, item by item.',
        f'On orders under {h_usd(g["minDistinctUnderUsd"])}, every different piece costs at least {h_vnd(s["minFeeVnd"])} in fee. Multiples of the same piece don’t count.',
        'Shipping is at cost, in one parcel.')
    + example(f'{ge["label"]} at {from_usd(ge["eachUsd"])}',
              [('Dresses', h_usd(pieces_usd)), (f'My fee, {pct(g["pct"])}', h_usd(pieces_usd * g['pct']))],
              ('You pay', h_usd(pieces_usd * (1 + g['pct'])) + ' + shipping')),
    btn(SR + 'bulk', 'Ask for a group quote →'))

always = bul(
    '<strong>Nothing is bought without your yes.</strong> You see the photo, price and size first.',
    '<strong>Your price is confirmed in writing</strong> before you pay. That written quote is what you pay.',
    '<strong>Shipping</strong> is the courier’s actual cost on the day it ships, including the fuel and peak-season surcharges couriers add (high this autumn). It’s quoted before you pay for it. <strong>Import duties and taxes</strong> in your country are yours.',
    f'<strong>Paying:</strong> bank transfer, Zelle and Wise have no card fee. A card adds about {DATA["card"]["pct"]} + {from_usd(DATA["card"]["fixedUsd"])}, which is the processor’s fee, shown before you pay. Orders for pieces also carry the {pct(s["transferPct"])} currency transfer. <a href="pay">How payment works</a>.',
    '<strong>If a piece sells out</strong>, see <a href="policy">returns &amp; credit</a>.')

boutiques = f'''
      <section class="pr-sec pr-btq" id="boutique" aria-labelledby="boutique-h">
        <p class="pr-who">You own a store and buy to resell</p>
        <h2 id="boutique-h">Boutique buying</h2>
        <p class="pr-p">I scout Vietnamese designers for you, negotiate stockist prices, check every piece and ship it all in one parcel. Every figure here is in US dollars.</p>
        {boutique_trio_html()}
        <p class="pr-research"><strong>Research before a brief:</strong> {usd0(b["researchUsdPerHour"])} an hour, {["", "one", "two", "three"][b["researchMinHours"]]}-hour minimum, prepaid — for market surveys or option-hunting before you know what you want.</p>
        <div class="bcalc-mount" id="prices-calc">{calc_fallback_html()}</div>
        {good_to_know_html()}
        <div class="pr-cta">{btn("for-boutiques", "How a buying round works →", alt=True)}{btn("boutique-calculator", "Open the calculator on its own page →", alt=True)}</div>
        <p class="pr-cross">Ordering for yourself or a group? <a href="?for=individuals" data-aud-go="individual">Individual pricing →</a></p>
      </section>'''

body = f'''<body id="top" class="pr-page">
  <div class="grain" aria-hidden="true"></div>
  {brand_header()}
  <main class="lg">
    <div class="lg-hero pr-hero">
      <span class="lg-eyebrow">Prices</span>
      <h1 class="lg-h1">Every price, <em>plainly</em></h1>
      <p class="lg-lead">Choose who you’re buying for. Every price is confirmed in writing before you pay.</p>
    </div>
    <div class="pr-bar">
      <div class="aud-switch" role="tablist" aria-label="Who are you buying for?">
        <button type="button" role="tab" id="tab-individuals" data-aud="individual" aria-selected="true" aria-controls="view-individuals" tabindex="0">For individuals</button>
        <button type="button" role="tab" id="tab-boutiques" data-aud="boutique" aria-selected="false" aria-controls="view-boutiques" tabindex="-1">For boutiques</button>
      </div>
      <nav class="pr-secnav" aria-label="Sections">
        <a href="#buy">Buy a piece</a><a href="#trace">The Trace</a><a href="#styling">Styling</a><a href="#group">Group orders</a><a href="?for=boutiques" data-aud-go="boutique">Boutiques →</a>
      </nav>
    </div>
    <div class="pr-view" id="view-individuals" role="tabpanel" aria-labelledby="tab-individuals">
      <p class="pr-cross pr-cross--top">Buying for a store? <a href="?for=boutiques" data-aud-go="boutique">Boutique pricing →</a></p>
      <p class="pr-curnote">Prices are in đồng with US dollars in brackets, at {vnd(FX)} = $1. A ~ marks a conversion; without it, the dollar figure is what’s charged.</p>
      {buy}
      {trace}
      {styling}
      {group}
      <section class="lg-glance pr-always" aria-labelledby="always-h">
        <h2 id="always-h">True for every service</h2>
        {always}
      </section>
    </div>
    <div class="pr-view" id="view-boutiques" role="tabpanel" aria-labelledby="tab-boutiques">{boutiques}
    </div>
    <section class="lg-close" aria-labelledby="close-h">
      <span class="lg-eyebrow">Still unsure?</span>
      <h2 id="close-h">Ask me. I’ll tell you the price.</h2>
      <p>Send what you’re looking for and I’ll reply with the exact cost before you pay anything.</p>
      <address><a href="mailto:seraphicstyler@gmail.com">seraphicstyler@gmail.com</a><br><a href="https://instagram.com/seraphicstyler" target="_blank" rel="noopener">DM @seraphicstyler</a></address>
    </section>
  </main>
  <footer class="lg-foot">
    <a href="prices" aria-current="page">Prices</a><a href="boutique-calculator">Boutique calculator</a><a href="sourcingandstyling">Services</a><a href="pay">Payment</a><a href="policy">Returns &amp; Credit</a><a href="terms">Terms</a><a href="privacy">Privacy</a><a href="./">Home</a>
  </footer>
  <a class="lg-top-link" href="#top" aria-label="Back to top">↑</a>
  <script>SS_PRICING.initPricesPage();</script>
</body>
</html>
'''

desc = ('Every Seraphic Styler price in one place: buying a piece, The Trace, styling, gift cards and group orders '
        'in đồng with dollars, and boutique buying in dollars with a live calculator.')
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(page_head('prices', 'Prices', desc) + body)
print('wrote', os.path.relpath(OUT, ROOT))
