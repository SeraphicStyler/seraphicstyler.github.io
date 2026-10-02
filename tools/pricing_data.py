"""Shared helpers for the pages generated from js/pricing.js.

js/pricing.js holds every price as strict JSON between its @pricing-data
markers. This module reads that block and mirrors the JavaScript formatting
(fmt.*, html.stylingTable) exactly, so a page generated here and the same
figures rendered by the menu at runtime are character-for-character equal.
tools/verify-pricing.cjs checks that they are.

SS_PRICING_SRC may point at another copy of pricing.js (used by the tests)."""
import json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('SS_PRICING_SRC') or os.path.join(ROOT, 'js', 'pricing.js')


def load():
    src = open(SRC, encoding='utf-8').read()
    m = re.search(r'/\*@pricing-data\*/(.*?)/\*@end\*/', src, re.S)
    if not m:
        raise SystemExit('pricing data markers not found in ' + SRC)
    return json.loads(m.group(1))


DATA = load()
FX = DATA['fx']['vndPerUsd']


# ---- Formatting: mirrors fmt.* in js/pricing.js ----------------------------
def _round(x):            # JavaScript Math.round for the non-negative values used here
    return int(math.floor(x + 0.5))


def group(n):
    return f'{_round(abs(n)):,}'


def sign(n):
    return '−' if n < 0 else ''


def usd(n):
    c = math.floor(abs(n) * 100 + 0.5) / 100
    body = f'{c:,.2f}' if c != int(c) else f'{int(c):,}'
    return sign(n) + '$' + body


def usd0(n):
    return sign(n) + '$' + group(n)


def vnd(n):
    return sign(n) + group(n) + '₫'


def pct(p):
    return f'{_round(p * 100)}%'


def from_vnd(v):
    return f'{vnd(v)} (~{usd(v / FX)})'


def from_usd(u):
    return f'{vnd(u * FX)} ({usd(u)})'


def money(primary, alt=None):
    return '<span class="money">' + primary + (f' <span class="money-alt">({alt})</span>' if alt else '') + '</span>'


def h_vnd(v):
    return money(vnd(v), '~' + usd(v / FX))


def h_usd(u):
    return money(vnd(u * FX), usd(u))


def h_usd_only(u):
    return money(usd0(u))


def esc(s):
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


# ---- Rules: mirror js/pricing.js -------------------------------------------
def item_fee_vnd(price):
    s = DATA['sourcing']
    if not price > 0:
        return 0
    return max(s['minFeeVnd'], price * (s['rate'] if price <= s['highFromVnd'] else s['highRate']))


def tier(tid):
    return next(t for t in DATA['styling'] if t['id'] == tid)


def boutique_quote(budget, pieces, rush=False):
    b = DATA['boutique']
    B, P = max(0, budget), max(0, int(pieces))
    rate = b['rushPct'] if rush else b['pct']
    fee, rule = B * rate, 'pct'
    if P * b['perPieceUsd'] > fee:
        fee, rule = P * b['perPieceUsd'], 'perPiece'
    if B > 0 and fee < b['perBuyUsd']:
        fee, rule = b['perBuyUsd'], 'perBuy'
    if not B > 0:
        fee, rule = 0, 'none'
    return dict(budget=B, pieces=P, rush=rush, rate=rate, fee=fee, rule=rule, scout=b['scoutUsd'],
                half=fee / 2, stage2=B + fee / 2, stage3=fee / 2, total=B + b['scoutUsd'] + fee)


# ---- Shared markup: mirrors html.* in js/pricing.js --------------------------
def styling_table_html(href_for=None):
    rows = []
    for t in DATA['styling']:
        frm = 'from ' if t.get('from') else ''
        name = f'<a href="{esc(href_for(t))}">{esc(t["name"])}</a>' if href_for else esc(t['name'])
        credit = 'agreed together' if t.get('creditUsd') is None else h_usd(t['creditUsd'])
        rows.append('<tr><th scope="row">' + name + '</th>'
                    + '<td class="num" data-l="You pay">' + frm + h_usd(t['totalUsd']) + '</td>'
                    + '<td class="num" data-l="My styling fee">' + ('from ' if t.get('feeFrom') else '') + h_usd(t['feeUsd']) + '</td>'
                    + '<td class="num" data-l="Spent on your clothes">' + credit + '</td>'
                    + '<td data-l="What you get">' + esc(t['what']) + '</td></tr>')
    return ('<table class="price-table"><caption class="sr-only">Styling tiers</caption><thead><tr>'
            '<th scope="col">Tier</th><th scope="col" class="num">You pay</th><th scope="col" class="num">My styling fee</th>'
            '<th scope="col" class="num">Spent on your clothes</th><th scope="col">What you get</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table>')


def boutique_trio():
    b = DATA['boutique']
    return [
        dict(big=usd0(b['scoutUsd']), label='scouting fee', detail='once per round, paid up front to start'),
        dict(big=pct(b['pct']), label='buying fee', detail=f'on the pieces you choose ({pct(b["rushPct"])} for rush or made-to-measure)'),
        dict(big='$0', label='markup', detail='you pay the designer’s price'),
    ]


def boutique_trio_html():
    return '<ul class="fee-trio">' + ''.join(
        f'<li><b class="money">{f["big"]}</b><span>{f["label"]}</span><small>{f["detail"]}</small></li>' for f in boutique_trio()) + '</ul>'


def calc_fallback_html():
    """What the boutique calculator shows before (or without) JavaScript: the
    default buy, worked out. js/pricing.js replaces it with the live calculator."""
    b = DATA['boutique']
    x = boutique_quote(b['defaults']['budget'], b['defaults']['pieces'])
    m = h_usd_only
    return ('<div class="bcalc bcalc--static">'
            f'<p class="bcalc-static-h">A {usd0(x["budget"])} buy of about {x["pieces"]} pieces, worked out:</p>'
            '<h3 class="bcalc-h">Your buy</h3><table class="bcalc-buy"><tbody>'
            f'<tr><th scope="row">Pieces, at the designer’s price</th><td class="num">{m(x["budget"])}</td></tr>'
            f'<tr><th scope="row">Scouting fee</th><td class="num">{m(x["scout"])}</td></tr>'
            f'<tr><th scope="row">Buying fee, {pct(x["rate"])}</th><td class="num">{m(x["fee"])}</td></tr>'
            f'</tbody><tfoot><tr><th scope="row">Total</th><td class="num">{m(x["total"])} + shipping</td></tr></tfoot></table>'
            '<h3 class="bcalc-h">When you pay</h3><table class="pay-sched"><thead><tr><th scope="col">When</th><th scope="col">You pay</th><th scope="col" class="num">Amount</th></tr></thead><tbody>'
            f'<tr><th scope="row">To start</th><td>Scouting fee</td><td class="num">{m(x["scout"])}</td></tr>'
            f'<tr><th scope="row">Once you’ve chosen your pieces</th><td>Pieces {m(x["budget"])} + half the buying fee {m(x["half"])}</td><td class="num">{m(x["stage2"])}</td></tr>'
            f'<tr><th scope="row">Once every piece is photographed and approved</th><td>The other half of the buying fee {m(x["half"])} + shipping at cost</td><td class="num">{m(x["stage3"])} + shipping</td></tr>'
            '</tbody></table><p class="bcalc-static-note">Turn on JavaScript to work out your own numbers.</p></div>')


def good_to_know_html():
    b = DATA['boutique']
    groups = [
        ('Shipping &amp; duties', ['Shipping is the courier’s actual cost on the day it ships, including any fuel or peak-season surcharges. It’s quoted before you pay it.',
                                   'Import duties and taxes in your country are yours.']),
        ('Minimums', [f'The buying fee is at least {usd0(b["perPieceUsd"])} per piece and {usd0(b["perBuyUsd"])} per buy, so very inexpensive pieces may cost a little more than {pct(b["pct"])}.']),
        ('What scouting covers', [f'{b["scoutHours"].capitalize()} hours of finding designers, and a line sheet of options with photos, prices and sizes.',
                                  'It isn’t deducted from your order, and the line sheet is yours even if you don’t buy.']),
        ('You’re in control', ['Nothing is bought without your yes. Your exact numbers come in a written quote first.']),
    ]
    out = ['<div class="gtk">']
    for h, items in groups:
        out.append(f'<div class="gtk-group"><h3>{h}</h3><ul class="lg-bul">' + ''.join(f'<li>{i}</li>' for i in items) + '</ul></div>')
    out.append('</div>')
    return ''.join(out)


def data_hash():
    """Fingerprint of the data a page was generated from (checked by the tests)."""
    import hashlib
    return hashlib.sha1(json.dumps(DATA, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:12]


# ---- Page skeleton shared with the legal pages ------------------------------
def page_head(slug, title, desc, extra_css=()):
    src = open(os.path.join(ROOT, 'policy.html'), encoding='utf-8').read()
    head = src.split('<script type="application/ld+json">')[0]
    head = re.sub(r'<title>.*?</title>', f'<title>{title} · Seraphic Styler</title>', head)
    head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, head)
    head = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title + ' — Seraphic Styler', head)
    head = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, head)
    head = head.replace('seraphicstyler.com/policy"', f'seraphicstyler.com/{slug}"')
    head += f'  <meta name="ss-pricing-data" content="{data_hash()}" />\n'
    for css in ('css/legal.css?v=2026-10-01', 'css/pricing.css?v=2026-10-02') + tuple(extra_css):
        head += f'  <link rel="stylesheet" href="{css}" />\n'
    head += '  <script src="js/pricing.js?v=2026-10-02"></script>\n'
    head += '  <script src="js/i18n-site.js?v=2026-09-12" defer></script>\n  <script src="js/geo-lang.js?v=2026-09-12" defer></script>\n</head>\n'
    return head


def brand_header():
    src = open(os.path.join(ROOT, 'policy.html'), encoding='utf-8').read()
    mark = re.search(r'<svg class="pc-mark".*?</svg>', src, re.S).group(0).replace('pc-mark', 'lg-mark')
    return ('<header class="lg lg-top">\n    ' + mark + '\n    <a class="brand-lockup" href="./" aria-label="Seraphic Styler home">'
            '<span class="brand-seraphic">Seraphic</span><span class="brand-styler">Styler</span></a>\n  </header>')
