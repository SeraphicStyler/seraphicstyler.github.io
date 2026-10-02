import re
src=open('policy.html').read()
head=src.split('<script type="application/ld+json">')[0]
mark=re.search(r'<svg class="pc-mark".*?</svg>',src,re.S).group(0).replace('pc-mark','lg-mark')
desc='Every Seraphic Styler price in one place, in US dollars: buying a piece, The Trace, styling, gifts, group orders and boutique buying — with worked examples.'
head=re.sub(r'<title>.*?</title>','<title>Prices · Seraphic Styler</title>',head)
head=re.sub(r'(<meta name="description" content=")[^"]*',lambda m:m.group(1)+desc,head)
head=re.sub(r'(<meta property="og:title" content=")[^"]*',lambda m:m.group(1)+'Prices — Seraphic Styler',head)
head=re.sub(r'(<meta property="og:description" content=")[^"]*',lambda m:m.group(1)+desc,head)
head=head.replace('seraphicstyler.com/policy"','seraphicstyler.com/prices"')
SR='service-request.html?service='
def btn(href,label): return f'<a class="pr-btn" href="{href}">{label}</a>'
def ex(title,rows,total=None,note=None):
    r=''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a,b in rows)
    t=f'<div class="pr-tot"><dt>{total[0]}</dt><dd>{total[1]}</dd></div>' if total else ''
    n=f'<p class="pr-exn">{note}</p>' if note else ''
    return f'<div class="pr-ex"><p class="pr-exh">Example · {title}</p><dl>{r}{t}</dl>{n}</div>'
def bul(*x): return '<ul class="lg-bul">'+''.join(f'<li>{i}</li>' for i in x)+'</ul>'
def sec(id,num,who,title,price,price_sub,body,cta):
    return f'''
    <section class="pr-sec" id="{id}" aria-labelledby="{id}-h">
      <div class="pr-head">
        <span class="lg-num" aria-hidden="true">{num}</span>
        <div><p class="pr-who">{who}</p><h2 id="{id}-h">{title}</h2></div>
        <div class="pr-price"><b>{price}</b><span>{price_sub}</span></div>
      </div>
      <div class="pr-body">{body}</div>
      <div class="pr-cta">{cta}</div>
    </section>'''

choose=[('#buy','I know exactly what I want','I have a link or the shop’s name','Buy a piece'),
        ('#trace','I have a photo, but no link','Find out what it is and where to buy it','The Trace'),
        ('#styling','Choose pieces for me','Outfits, a capsule, a wardrobe','Styling'),
        ('#gift','It’s a gift','Give a styling experience','Gift styling'),
        ('#group','Buying with friends or a group','Weddings, sororities, events — $1,000+','Group orders'),
        ('#boutique','I own a store','Stock to resell','Boutiques')]
ch=''.join(f'<a class="pr-pick" href="{h}"><span class="pr-pick-q">{q}</span><span class="pr-pick-s">{s}</span><span class="pr-pick-a">{a} →</span></a>' for h,q,s,a in choose)

tiers=[('The Edit','$235','$135','$100','3–4 pieces, one focused need','edit'),
       ('The Capsule','$460','$270','$190','6–8 pieces that work together, with a lookbook','capsule'),
       ('The Atelier','$600','$310','$290','Consultation plus a shopping session, in Saigon or on live video','atelier'),
       ('The Signature','$790','$310','$480','Designer pieces and 60 days of support','signature'),
       ('Custom Wardrobe','from $1,500','$800','$700','15–20 pieces for several occasions','custom-wardrobe'),
       ('Custom Wardrobe+','from $2,000','from $1,100','agreed together','21–30+ pieces, made-to-measure, quoted for you','custom-wardrobe-plus')]
trows=''.join(f'<tr><th scope="row"><a href="{SR}styling&amp;tier={k}">{n}</a></th><td data-l="You pay"><b>{p}</b></td><td data-l="My styling fee">{f}</td><td data-l="Spent on your clothes">{c}</td><td data-l="What you get">{w}</td></tr>' for n,p,f,c,w,k in tiers)
ttable=f'<table class="lg-tbl pr-tbl"><thead><tr><th scope="col">Tier</th><th scope="col">You pay</th><th scope="col">My styling fee</th><th scope="col">Spent on your clothes</th><th scope="col">What you get</th></tr></thead><tbody>{trows}</tbody></table>'


sections=''.join([
 sec('buy',1,'You know exactly what you want','Buy a piece','$14','per item, most items',
   bul('<strong>The item</strong> at the shop’s own price. I never add a markup.',
       '<strong>My fee: $14 per item.</strong> Items over $175 are 8% of the price instead, and items over $200 are 7%.',
       '<strong>$10 per order</strong> for packing and coordination. Two shops are included; each extra shop is $6.',
       '<strong>Shipping</strong> at the courier’s actual cost, quoted before it ships.')+
   ex('one $60 dress',[('Dress','$60'),('My fee','$14'),('Order fee','$10')],('You pay','$84 + shipping')),
   btn(SR+'sourcing','Buy a piece →')),
 sec('trace',2,'You have a photo, but no link','The Trace','$25','per item',
   bul('I find out what the piece is and who sells it, and reply within 48 hours.',
       '<strong>If you then order it, the $25 comes off your order.</strong>',
       'If it can’t be found, I tell you why and what’s closest.'),
   btn(SR+'trace','Start The Trace →')),
 sec('styling',3,'You want me to choose','Styling','from $235','fee + money for your clothes',
   '<p class="pr-p">Every tier has two parts: <strong>my styling fee</strong>, and <strong>money that is spent on your clothes</strong> at the shop’s price. If you love pieces that cost more than that, I ask before spending a cent more.</p>'+ttable+
   ex('The Capsule',[('My styling fee','$270'),('Spent on your clothes','$190'),('Your pieces come to $250, so you approve an extra','$60')],('You pay','$520 + shipping')),
   btn(SR+'styling','Book styling →')),
 sec('gift',4,'For someone else','Gift styling','from $235','same tiers as styling',
   bul('Give any styling tier above as a gift card. Same prices, same money toward their clothes.',
       'Gift cards <strong>never expire</strong>, and keep the value they were bought at.'),
   btn('index.html#gift','Choose a gift →')),
 sec('group',5,'Weddings, sororities, events, friends','Group orders','15%','of the order, from $1,000',
   bul('<strong>Orders of $1,000 or more:</strong> my fee is 15% of the order, or 20% if pieces are made to measure or rushed.',
       'Orders under $1,000 are priced like <a href="#buy">buying a piece</a>, item by item.',
       'On orders under $3,000, every different piece costs at least $14 in fee. Multiples of the same piece don’t count.',
       'Shipping is at cost, in one parcel.')+
   ex('8 bridesmaid dresses at $250',[('Dresses','$2,000'),('My fee, 15%','$300')],('You pay','$2,300 + shipping')),
   btn(SR+'bulk','Ask for a group quote →')),
 sec('boutique',6,'You own a store and buy to resell','Boutiques','$250 + 15%','scouting, then 15% of the pieces',
   '<p class="pr-p">I scout Vietnamese designers for you, negotiate stockist prices, check every piece and ship it all in one parcel. Pieces are at the designer’s price, never marked up.</p>'+
   bul('<strong>Scouting fee: $250 per round.</strong> Three to four hours of finding designers and building you a line sheet of options. Paid before I start, and it’s mine to keep, like a styling fee. If you don’t buy, the line sheet is still yours.',
       '<strong>Buying fee: 15% of the pieces you choose</strong>, at every size. That’s the same rate as group orders. Rush or made-to-measure is 20% instead.',
       'Every buy pays at least <strong>$14 per piece</strong> and <strong>$25 in total</strong> in buying fee, the same minimum as buying a single piece.',
       'Research before you know what you want: <strong>$45 an hour</strong>, two-hour minimum, prepaid.')+
   ex('a $3,000 first buy',[('1 · Scouting fee, to start','$250'),('2 · Once you’ve chosen your pieces: pieces + half the buying fee','$3,225'),('3 · Once every piece is photographed and approved: the rest of the buying fee + shipping','$225 + shipping')],('Total','$3,700 + shipping'),'Buying fee: 15% of $3,000 = $450. Scouting fee: $250.'),
   btn('boutique-calculator','Calculate your buy →')+btn('for-boutiques','Full boutique details →')+btn('https://buy.stripe.com/aFafZi2jtdjF9AsavUaAw0e?client_reference_id=prices-page','Pay the $250 scouting fee →')),
])

always=bul('<strong>Nothing is bought without your yes.</strong> You see the photo, price and size first.',
 '<strong>Your price is confirmed in writing</strong> before you pay. That written quote is what you pay.',
 '<strong>Shipping</strong> is the courier’s actual cost on the day it ships, including the fuel and peak-season surcharges couriers add (high this autumn). It’s quoted before you pay for it. <strong>Import duties and taxes</strong> in your country are yours.',
 '<strong>Paying:</strong> bank transfer, Zelle and Wise are free. A card adds about 5.4% + $0.30, which is the processor’s fee, shown before you pay. <a href="pay">How payment works</a>.',
 '<strong>Prices are in US dollars.</strong> Shop prices in đồng are converted at 25,000₫ = $1.',
 '<strong>If a piece sells out</strong>, see <a href="policy">returns &amp; credit</a>.')

style='''  <style>
    .pr-picks { display:grid; gap:0.7rem; grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr)); max-width:900px; margin:0 auto clamp(2.6rem,7vh,3.6rem); }
    .pr-pick { display:flex; flex-direction:column; gap:0.25rem; padding:1rem 1.1rem; border:1px solid var(--surface-border); border-radius:16px; background:var(--surface); text-decoration:none; transition:border-color .2s, transform .2s; }
    .pr-pick:hover, .pr-pick:focus-visible { border-color:var(--accent); transform:translateY(-2px); }
    .pr-pick-q { font-family:'Cormorant Garamond',serif; font-size:1.15rem; color:var(--text-primary); line-height:1.25; }
    .pr-pick-s { font-family:var(--font-body); font-size:0.76rem; color:var(--text-secondary); }
    .pr-pick-a { margin-top:auto; padding-top:0.5rem; font-family:var(--font-accent); font-size:0.72rem; letter-spacing:0.06em; text-transform:uppercase; color:var(--accent); }
    .pr-wrap { max-width:820px; margin:0 auto; }
    .pr-sec { padding:clamp(2rem,6vh,3rem) 0; border-top:1px solid var(--surface-border); scroll-margin-top:1rem; overflow-wrap:anywhere; }
    .pr-head { display:grid; grid-template-columns:auto 1fr; gap:0.2rem 1rem; align-items:end; }
    .pr-who { margin:0 0 0.2rem; font-family:var(--font-brand); text-transform:uppercase; letter-spacing:0.2em; font-size:0.62rem; color:var(--eyebrow-ink); }
    .pr-head h2 { margin:0; font-family:'Cormorant Garamond',serif; font-weight:500; font-size:clamp(1.6rem,4.5vw,2rem); color:var(--text-primary); line-height:1.1; }
    .pr-price { grid-column:1/-1; display:flex; align-items:baseline; gap:0.6rem; flex-wrap:wrap; margin-top:0.8rem; padding:0.8rem 1rem; border-radius:14px; background:linear-gradient(135deg,var(--accent-soft),transparent 70%); border:1px solid var(--surface-border); }
    .pr-price b { font-family:'Cormorant Garamond',serif; font-weight:500; font-size:clamp(1.9rem,6vw,2.4rem); color:var(--accent); line-height:1; }
    .pr-price span { font-family:var(--font-body); font-size:0.82rem; color:var(--text-secondary); }
    @media (min-width:700px){ .pr-head { grid-template-columns:auto 1fr auto; } .pr-price { grid-column:auto; margin-top:0; flex-direction:column; align-items:flex-end; gap:0.2rem; text-align:right; } }
    .pr-body { margin-top:1rem; }
    .pr-p { margin:0.4rem 0 0.6rem; font-family:var(--font-body); font-size:0.9rem; line-height:1.75; color:var(--text-secondary); }
    .pr-p strong, .pr-ex strong { color:var(--text-primary); font-weight:500; }
    .pr-tbl td b { color:var(--text-primary); font-weight:600; }
    .pr-tbl th a { color:var(--text-primary); }
    .pr-narrow { max-width:420px; }
    .pr-ex { margin-top:1.2rem; padding:1rem 1.15rem; border-radius:14px; border:1px dashed color-mix(in srgb,var(--accent) 45%,transparent); background:var(--surface-soft); }
    .pr-exh { margin:0 0 0.5rem; font-family:var(--font-brand); text-transform:uppercase; letter-spacing:0.18em; font-size:0.62rem; color:var(--eyebrow-ink); }
    .pr-ex dl { margin:0; }
    .pr-ex dl > div { display:flex; justify-content:space-between; gap:1rem; padding:0.3rem 0; font-family:var(--font-body); font-size:0.86rem; color:var(--text-secondary); }
    .pr-ex dd { margin:0; white-space:nowrap; color:var(--text-primary); font-variant-numeric:tabular-nums; }
    .pr-ex .pr-tot { border-top:1px solid var(--surface-border); margin-top:0.3rem; padding-top:0.55rem; font-weight:600; }
    .pr-ex .pr-tot dt, .pr-ex .pr-tot dd { color:var(--text-primary); font-size:0.95rem; }
    .pr-exn { margin:0.5rem 0 0; font-size:0.76rem; color:var(--text-secondary); font-style:italic; }
    .pr-cta { margin-top:1.2rem; display:flex; flex-wrap:wrap; gap:0.6rem; }
    .pr-btn { display:inline-flex; align-items:center; min-height:46px; padding:0 1.3rem; border-radius:999px; text-decoration:none; font-family:var(--font-accent); font-size:0.8rem; letter-spacing:0.04em; color:#fff; background:var(--accent); }
    html.dark .pr-btn { color:#1a1d29; }
    .pr-btn + .pr-btn { background:none; color:var(--accent); border:1px solid var(--accent); }
    .pr-always { max-width:820px; margin:1rem auto 0; }
  </style>
'''
html=head+'  <link rel="stylesheet" href="css/legal.css?v=2026-10-01" />\n'+style+'''  <script src="js/i18n-site.js?v=2026-09-12" defer></script>
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
      <span class="lg-eyebrow">Prices</span>
      <h1 class="lg-h1">Every price, <em>plainly</em></h1>
      <p class="lg-lead">All in US dollars. Pick what you need below, and that’s the price, confirmed in writing before you pay.</p>
    </div>
    <nav class="pr-picks" aria-label="What do you need?">'''+ch+'''</nav>
    <div class="pr-wrap">'''+sections+'''
    </div>
    <section class="lg-glance pr-always" aria-labelledby="always-h">
      <h2 id="always-h">True for every service</h2>
      '''+always+'''
    </section>
    <section class="lg-close" aria-labelledby="close-h">
      <span class="lg-eyebrow">Still unsure?</span>
      <h2 id="close-h">Ask me. I’ll tell you the price.</h2>
      <p>Send what you’re looking for and I’ll reply with the exact cost before you pay anything.</p>
      <address><a href="mailto:seraphicstyler@gmail.com">seraphicstyler@gmail.com</a><br><a href="https://instagram.com/seraphicstyler" target="_blank" rel="noopener">DM @seraphicstyler</a></address>
    </section>
  </main>
  <footer class="lg-foot">
    <a href="prices" aria-current="page">Prices</a><a href="sourcingandstyling">Services</a><a href="pay">Payment</a><a href="policy">Returns &amp; Credit</a><a href="terms">Terms</a><a href="privacy">Privacy</a><a href="./">Home</a>
  </footer>
  <a class="lg-top-link" href="#top" aria-label="Back to top">↑</a>
</body>
</html>
'''
open('prices.html','w').write(html); print('ok')
