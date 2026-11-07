#!/usr/bin/env python3
"""Builds the price pages from js/pricing.js (via tools/pricing_data.py):

  · prices.html — two views behind a "For individuals | For boutiques" switch:
    individuals (Buy a piece, The Trace, Styling with gift cards folded in,
    Group orders) and boutiques (fee trio, research rate, live calculator);
  · the homepage price modules — the same four individual services as
    clickable modules, written into index.html between the @price-modules
    markers. Edit the data or this file, never the generated block.

Each service is defined once (modules() below) and drawn in both places with
one anatomy: kicker → name → price → 3–5 points → worked example → actions.
Individuals see dollars first with đồng in brackets; boutiques see dollars.
Run from anywhere:  python3 tools/build-prices.py"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pricing_data import (DATA, FX, ROOT, usd, usd0, vnd, pct, from_vnd, from_usd, money, h_vnd, h_usd,
                          item_fee_vnd, tier, styling_href, styling_table_html, boutique_trio_html, calc_fallback_html,
                          good_to_know_html, page_head, brand_header, data_hash)

OUT = os.environ.get('SS_PRICES_OUT') or os.path.join(ROOT, 'prices.html')
HOME = os.environ.get('SS_HOME_OUT') or os.path.join(ROOT, 'index.html')
SR = 'service-request.html?service='
# Shown before js/visitor-currency.js runs (or without JS). The script swaps in the visitor's currency
# and hides the đồng brackets: public pages show one currency (her decision, 7 Nov 2026).
CURRENCY_NOTE = ('Prices are in US dollars. A ~ means the figure is converted from the shop’s own price; '
                 'your quote fixes the exact amount.')
MTM = DATA.get('madeToMeasure') or {}


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


def steps(*items):
    return '<ol class="pr-steps">' + ''.join(f'<li>{i}</li>' for i in items) + '</ol>'


def modules(idp='', home=False):
    """The four individual services. idp prefixes every id (the homepage uses
    'pm-' so nothing collides with its own sections); home switches links to
    in-page targets where the homepage has them."""
    s, g, tr = DATA['sourcing'], DATA['group'], DATA['trace']
    out = []

    # Buy a piece
    item = s['example']['itemVnd']
    fee = item_fee_vnd(item)
    order = s['orderFeeVnd']
    transfer = (item + fee + order) * s['transferPct']
    buy_total = item + fee + order + transfer
    out.append(dict(
        id='buy', who='You have a link with a price, ready-made', title='Sourcing', price=h_vnd(s['minFeeVnd']), price_sub='per item, most items', card='A link with a price', unit='/ piece',
        steps='' if home else steps('<b>Get your price.</b> Type the shop price and paste the link.',
                                    '<b>Send it to me.</b> I confirm stock, size and the exact total.',
                                    '<b>You approve.</b> I buy it, check it in person and send you photos.',
                                    '<b>It ships.</b> Tracked, worldwide.'),
        body=bul('<strong>Ready-made, as listed.</strong> In stock, in a size the shop already makes, from a page with the price on it. <strong>Custom sizes, made-to-measure and extended back-and-forth with the house are <a href="#' + idp + 'trace">The Trace</a>.</strong>',
                 '<strong>The item</strong> at the shop’s own price. I never add a markup.',
                 f'<strong>My fee: {h_vnd(s["minFeeVnd"])} per item</strong>, or {pct(s["rate"])} of the price when that is more ({pct(s["highRate"])} on items over {h_vnd(s["highFromVnd"])}).',
                 f'<strong>{h_vnd(order)} per order</strong> for packing and coordination. {["No", "One", "Two", "Three"][s["shopsIncluded"]]} shops are included; each extra shop is {h_vnd(s["extraShopVnd"])}.',
                 f'<strong>{pct(s["transferPct"])} currency transfer</strong> on the order, which covers sending your money to the shop in đồng.',
                 '<strong>Shipping</strong> at the courier’s actual cost, quoted before it ships.')
             + example(f'one {usd(item / FX)} dress',
                       [('Dress', h_vnd(item)), ('My fee', h_vnd(fee)), ('Order fee', h_vnd(order)), (f'Currency transfer, {pct(s["transferPct"])}', h_vnd(transfer))],
                       ('You pay', h_vnd(buy_total) + ' + shipping')),
        cta=btn('estimate', 'Get your price →')))

    # The Trace
    rows = [('The Trace, paid when you send the screenshot', h_usd(tr['usd'])),
            (f'Later, that dress, from <a href="#{idp}buy">Sourcing</a>', h_vnd(buy_total))]
    if tr['credited']:
        rows.append(('Less The Trace you already paid', money(usd0(-tr['usd']), '~' + vnd(-tr['usd'] * FX))))
    total = (('You pay for the dress', h_vnd(buy_total - tr['usd'] * FX) + ' + shipping') if tr['credited']
             else ('In all, the hunt and the dress', h_vnd(buy_total + tr['usd'] * FX) + ' + shipping'))
    out.append(dict(
        id='trace', who='A photo, a post, or a custom size', title='The Trace', price=h_usd(tr['usd']), price_sub='per item', card='A photo, a post, or a custom size', unit='/ piece',
        steps='',
        body=(f'<div class="tr-lead"><p class="tr-kicker">A personal concierge for one piece</p>'
              f'<p class="tr-intro">You already know the piece, but it can’t go through the estimator: no link, no price, or it has to be made to your measurements. I talk with you and with the house, back and forth, until it’s settled.</p>'
              f'<ul class="tr-chips"><li>Paid before I start</li><li>Answer within {tr["replyHours"]} hours</li><li>Custom sizes welcome</li></ul></div>'
              '<div class="tr-sort" role="group" aria-label="Is it a Trace?">'
              '<div class="tr-yes"><p class="tr-sort-h">It’s a Trace</p><ul>'
              '<li>A photo, a screenshot or an Instagram post</li><li>A shop that says “DM for price”</li>'
              f'<li>A custom size or made-to-measure (+{h_usd(MTM.get("usdPerGarment", 25))} a garment, final sale)</li></ul></div>'
              f'<div class="tr-no"><p class="tr-sort-h">It’s not</p><ul>'
              f'<li>A link with the price, in a size they stock → <a href="#{idp}buy">Sourcing</a></li>'
              f'<li>“Something like this,” or alternatives → <a href="#{idp}styling">Styling</a></li></ul></div></div>'
              f'<h3 class="tr-h">What your {usd0(tr["usd"])} covers</h3><ol class="tr-grid">'
              + ''.join(f'<li><span class="tr-n">{i:02d}</span><strong>{t}</strong><span>{d}</span></li>' for i, (t, d) in enumerate([
                  ('Finding the original', 'Matching the cut, collar and fabric across Instagram, TikTok and Facebook, and telling the designer’s piece from a copy.'),
                  ('Asking the shop properly', 'One complete message in Vietnamese: price, sizes, colours, fabric, lead time.'),
                  ('Following up until they answer', 'Shops reply in pieces, hours or days apart. I keep the thread going.'),
                  ('Real measurements', 'Bust, waist, hips and length from the shop, checked against yours. Vietnamese sizing runs small.'),
                  ('Custom sizes', 'Whether they will make it to your measurements, and every question in between.'),
                  ('Your price in dollars', 'The đồng price turned into a full total: fee, transfer and shipping.'),
                  ('A written answer', f'Within {tr["replyHours"]} hours: the shop, the price and the measurements, or why it can’t be bought and the closest piece that can.')], 1))
              + '</ol>'
              + '<p class="tr-note">' + (f'<strong>If you then order it, the {usd0(tr["usd"])} comes off your order.</strong>' if tr['credited']
                                      else '<strong>It pays for the conversation, so it stays paid whether or not you buy.</strong> If you buy, buying it is the usual sourcing fee.')
              + ' No piece credit: that belongs to Styling.</p>')
             + example('a photo, then the same dress', rows, total),
        cta=btn(DATA['stripe']['trace'].replace('&', '&amp;'), 'Start The Trace →')))

    # Styling, with gift cards folded in
    ex = DATA['stylingExample']
    cap = tier(ex['tier'])
    extra = max(0, ex['piecesUsd'] - cap['creditUsd'])
    out.append(dict(
        id='styling', who='You want me to choose', title='Styling', price='from ' + h_usd(DATA['styling'][0]['totalUsd']), price_sub='a fee, plus money for your clothes', card='Choose for me, credit included', unit='',
        steps='' if home else steps('<b>Pick a tier.</b> One focused need or a whole wardrobe.',
                                    '<b>I choose.</b> Pieces at the shop’s price, within your clothing credit.',
                                    '<b>You approve.</b> Nothing is bought without your yes.',
                                    '<b>It ships.</b> Tracked, worldwide.'),
        body=bul('<strong>All-inclusive, and longer-term.</strong> Sourcing and tracing are included in every tier, plus my eye. Styling is the only service with piece credit.',
                 'Every tier has two parts: <strong>my styling fee</strong>, and <strong>money that is spent on your clothes</strong> at the shop’s price.',
                 'If you love pieces that cost more, I ask before spending any more.',
                 'Styling is charged in US dollars. Shipping is added separately.')
             + f'<div class="pr-table-wrap" role="region" aria-label="Styling tiers" tabindex="0">'
             + styling_table_html(lambda t: styling_href(t, home)) + '</div>'
             + f'<aside class="pr-gift" id="{idp}gift" aria-label="Gift cards"><p><strong>Giving it?</strong> Any tier as a gift card — same prices, never expire.</p>'
               f'<a href="{"#gift" if home else "index.html#gift"}">Choose a gift →</a></aside>'
             + example(cap['name'],
                       [('My styling fee', h_usd(cap['feeUsd'])), ('Spent on your clothes', h_usd(cap['creditUsd'])),
                        (f'Your pieces come to {usd(ex["piecesUsd"])}, so you approve an extra', h_usd(extra))],
                       ('You pay', h_usd(cap['feeUsd'] + cap['creditUsd'] + extra) + ' + shipping')),
        cta=btn('#lane-styling' if home else 'index.html#lane-styling', 'Book styling →')))

    # Group orders
    ge = g['example']
    pieces_usd = ge['pieces'] * ge['eachUsd']
    out.append(dict(
        id='group', who='Weddings, sororities, events, friends', title='Group orders', price=pct(g['pct']), price_sub=f'of the order, from {from_usd(g["fromUsd"])}', card=f'Weddings and events, from {usd0(g["fromUsd"])}', unit='of the order',
        steps='' if home else steps('<b>Send the list.</b> Pieces, sizes, and the date you need them.',
                                    f'<b>I quote.</b> {pct(g["pct"])} of the order, confirmed in writing.',
                                    '<b>You approve.</b> I buy, check every piece, send you photos.',
                                    '<b>One parcel ships.</b> Tracked, worldwide.'),
        body=bul(f'<strong>Orders of {h_usd(g["fromUsd"])} or more:</strong> my fee is {pct(g["pct"])} of the order, or {pct(g["rushPct"])} if pieces are made to measure or rushed.',
                 f'Orders under {h_usd(g["fromUsd"])} are priced like <a href="#{idp}buy">sourcing</a>, item by item.',
                 f'On orders under {h_usd(g["minDistinctUnderUsd"])}, every different piece costs at least {h_vnd(s["minFeeVnd"])} in fee. Multiples of the same piece don’t count.',
                 'Shipping is at cost, in one parcel.')
             + example(f'{ge["label"]} at {usd(ge["eachUsd"])}',
                       [('Dresses', h_usd(pieces_usd)), (f'My fee, {pct(g["pct"])}', h_usd(pieces_usd * g['pct']))],
                       ('You pay', h_usd(pieces_usd * (1 + g['pct'])) + ' + shipping')),
        cta=btn(SR + 'bulk', 'Ask for a group quote →') + (btn('#bulkEst', 'Estimate a group order →', alt=True) if home else '')))
    return out


def always_html():
    s = DATA['sourcing']
    return bul(
        '<strong>Nothing is bought without your yes.</strong> You see the photo, price and size first.',
        '<strong>Your price is confirmed in writing</strong> before you pay. That written quote is what you pay.',
        '<strong>Shipping</strong> is the courier’s actual cost on the day it ships, including the fuel and peak-season surcharges couriers add (high this autumn). It’s quoted before you pay for it. <strong>Import duties and taxes</strong> in your country are yours.',
        f'<strong>Paying:</strong> bank transfer, Zelle and Wise have no card fee. A card adds about {DATA["card"]["pct"]} + {usd(DATA["card"]["fixedUsd"])}, which is the processor’s fee, shown before you pay. Orders for pieces also carry the {pct(s["transferPct"])} currency transfer. <a href="pay">How payment works</a>.',
        '<strong>If a piece sells out</strong>, see <a href="policy">returns &amp; credit</a>.')


# ---- /prices ----------------------------------------------------------------------
def section(m):
    return f'''
      <section class="pr-sec" id="{m["id"]}" aria-labelledby="{m["id"]}-h">
        <p class="pr-who">{m["who"]}</p>
        <h2 id="{m["id"]}-h">{m["title"]}</h2>
        <div class="pr-price"><b>{m["price"]}</b><span>{m["price_sub"]}</span></div>
        {m.get("steps", "")}
        {m["body"]}
        <div class="pr-cta">{m["cta"]}</div>
      </section>'''


def build_prices():
    b = DATA['boutique']
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
        <a href="#buy">Sourcing</a><a href="#trace">The Trace</a><a href="#styling">Styling</a><a href="#group">Group orders</a><a href="?for=boutiques" data-aud-go="boutique">Boutiques →</a>
      </nav>
    </div>
    <div class="pr-view" id="view-individuals" role="tabpanel" aria-labelledby="tab-individuals">
      <p class="pr-cross pr-cross--top">Buying for a store? <a href="?for=boutiques" data-aud-go="boutique">Boutique pricing →</a></p>
      <p class="pr-curnote"><span data-vc-note>{CURRENCY_NOTE}</span> <span data-vc-chip></span></p>
      {"".join(section(m) for m in modules())}
      <section class="lg-glance pr-always" aria-labelledby="always-h">
        <h2 id="always-h">True for every service</h2>
        {always_html()}
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
  <script src="js/visitor-currency.js?v=2026-11-07a" defer></script>
</body>
</html>
'''
    desc = ('Every Seraphic Styler price in one place: sourcing, The Trace, styling, gift cards and group orders '
            'in US dollars with đồng, and boutique buying in dollars with a live calculator.')
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(page_head('prices', 'Prices', desc) + body)
    print('wrote', os.path.relpath(OUT, ROOT))


# ---- Homepage price modules -------------------------------------------------------
START = '<!-- @price-modules:start'
END = '<!-- @price-modules:end -->'


def home_block():
    ms = modules('pm-', home=True)
    cards = ''.join(
        f'<button type="button" class="pm-card" role="tab" id="pm-tab-{m["id"]}" aria-controls="pm-{m["id"]}" '
        f'aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}">'
        f'<span class="pm-name">{m["title"]}</span>'
        f'<span class="pm-price">{m["price"]}<small class="pm-unit">{m.get("unit", "")}</small></span>'
        f'<span class="pm-sub">{m.get("card", m["who"])}</span>'
        f'<span class="pm-more" aria-hidden="true">→</span></button>'
        for i, m in enumerate(ms))
    panels = ''.join(
        f'\n      <div class="pm-panel" id="pm-{m["id"]}" role="tabpanel" aria-labelledby="pm-tab-{m["id"]}" tabindex="-1">'
        f'<h3 class="pm-panel-h">{m["title"]}</h3>{m["body"]}<div class="pr-cta">{m["cta"]}</div></div>'
        for m in ms)
    return f'''{START} — generated by tools/build-prices.py from js/pricing.js (data {data_hash()}); edit those, not this block -->
  <section id="prices" class="pm" aria-labelledby="pm-title" data-price-modules>
    <div class="wrap">
      <div class="section-head center reveal">
        <span class="eyebrow">Prices</span>
        <h2 id="pm-title">Every price, plainly</h2>
        <p class="lead narrow">Tap one to see exactly how it adds up.</p>
      </div>
      <div class="pm-cards" role="tablist" aria-label="Services and prices">{cards}</div>{panels}
      <p class="pm-note"><span data-vc-note>{CURRENCY_NOTE}</span> <span data-vc-chip></span></p>
      <p class="pm-foot">Buying for a store? <a href="#boutique">Boutique pricing ↓</a><span aria-hidden="true"> · </span>Shipping, payment &amp; returns: <a href="#details">the details ↓</a></p>
    </div>
  </section>
  {END}'''


def build_home():
    html = open(HOME, encoding='utf-8').read()
    i, j = html.find(START), html.find(END)
    if i < 0 or j < 0:
        raise SystemExit(f'{os.path.relpath(HOME, ROOT)}: add the @price-modules markers where the modules belong')
    html = html[:i] + home_block() + html[j + len(END):]
    with open(HOME, 'w', encoding='utf-8') as f:
        f.write(html)
    print('wrote', os.path.relpath(HOME, ROOT), '(price modules)')


build_prices()
build_home()
