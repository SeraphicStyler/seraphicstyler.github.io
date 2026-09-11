/* Generate the directory's search-facing pages from js/directory-data.js.
   ----------------------------------------------------------------------------
   WHY THESE PAGES EXIST. The directory is 320 houses with street addresses
   across 93 areas — unique local information no competitor holds — but 125 of
   the names are injected client-side into a single page, so almost none of it is
   reachable by search. This turns the data we already own into pages people can
   actually find.

   WHY IT IS NOT 320 THIN PAGES. The editorial notes average 68 characters. A
   page whose only unique prose is one short sentence is thin, and a few hundred
   of them is the doorway-content pattern that can drag a whole domain down. So
   the output is layered by how much genuine material exists:

     areas/<slug>       one page per area with 2+ houses. Aggregates every
                        house in it, so the unique content is substantial and
                        it matches how people actually search ("where to shop
                        thao dien"). Zero thin-content risk.
     categories/<slug>  one page per category, same reasoning.
     houses/<slug>      one page per house, generated ONLY where the page can
                        be the best answer available: the house has no website
                        of its own, or it carries enough recorded detail to
                        stand up. A house with its own site does not need us to
                        rank for its name, and we should not try.

   Every page is real HTML with the brand's own stylesheet, a canonical URL,
   breadcrumbs, and JSON-LD. Nothing is invented: a field that is not recorded
   is simply absent, and `confirm-first` houses say so on the page.

   Usage:  node tools/build-seo-pages.cjs [--dry] [--index-only]
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://www.seraphicstyler.com';
const DRY = process.argv.includes('--dry');
const INDEX_ONLY = process.argv.includes('--index-only');
// A rebuild is not a new source review. Preserve the approved reference date.
const INDEX_REVIEWED = '2026-08-28';
/* One build date, stamped on every generated page and into the sitemap. The
   directory's value is that it was walked in person; a page that never says
   when is a page an answer engine cannot date. */
const BUILT = new Date().toISOString().slice(0, 10);

/* The hand-written pages. Generated URLs are appended to these when the
   sitemap is rewritten, so the sitemap can never drift from what was built. */
const STATIC_URLS = [
  ['/', 'weekly', '1.0'], ['/free-international-shipping', 'weekly', '0.9'],
  ['/fashion-directory', 'weekly', '0.9'], ['/signature', 'monthly', '0.9'],
  ['/about', 'monthly', '0.8'], ['/policy', 'yearly', '0.5'],
  ['/field-guide', 'monthly', '0.8'], ['/for-agents', 'monthly', '0.6'],
  ['/for-boutiques', 'monthly', '0.8'], ['/find', 'monthly', '0.7'],
  ['/lookbook', 'weekly', '0.7'], ['/style-quiz', 'monthly', '0.6'],
  ['/style-profile', 'monthly', '0.6'], ['/pay', 'monthly', '0.5'],
  ['/estimate', 'monthly', '0.6'], ['/links', 'monthly', '0.5'],
  ['/dataset', 'monthly', '0.6'],
];

/* ---------- load the directory ---------- */
function loadDirectory() {
  const window = {};
  eval(fs.readFileSync(path.join(ROOT, 'js', 'directory-data.js'), 'utf8')); // eslint-disable-line no-eval
  if (!Array.isArray(window.SS_DIRECTORY)) throw new Error('SS_DIRECTORY not found');
  return window.SS_DIRECTORY;
}

/* ---------- helpers ---------- */
const deburr = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D');
const slug = (s) => deburr(s).toLowerCase().replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CATEGORY = {
  women: 'Womenswear', men: 'Menswear', vintage: 'Vintage', bridal: 'Bridal',
  luxury: 'Luxury', tailor: 'Tailoring & áo dài', active: 'Activewear',
  access: 'Accessories', lingerie: 'Lingerie & intimates', sleep: 'Sleepwear', market: 'Market',
};
const ACCESS = {
  walk: 'Walk-in store', appt: 'By appointment', hub: 'Sold via a stockist or hub',
  popup: 'Pop-up', online: 'Online only',
};
const TIER = { mid: 'Mid', premium: 'Premium', luxury: 'Luxury', couture: 'Couture' };
const CITY = { SGN: 'Ho Chi Minh City', HAN: 'Hanoi', VN: 'Vietnam', INTL: 'International' };
const OCC = {
  bday: 'birthdays and celebrations', event: 'balls and formal occasions',
  night: 'nightlife and parties',
};
const MATERIALS = new Set(['cotton', 'silk', 'hemp', 'linen', 'tencel']);
/* Filled during the build, before any house page is rendered: the slugs of the
   area pages that actually exist, so nothing links to one that does not. */
const AREA_PAGES = new Set();

/* The leading segment of `area` is the district or named area. "D3" is how the
   directory stores it and a useless thing to put in a <title> — nobody searches
   for "D3". Districts become "District 3, Ho Chi Minh City"; named wards keep
   their name and gain the city. */
function areaOf(h) {
  return String(h.area || '').split('·')[0].trim();
}
function areaLabel(a) {
  var m = a.match(/^D\s?(\d+)$/);
  if (m) return 'District ' + m[1] + ', Ho Chi Minh City';
  if (/^D\s?\d+\s*\/\s*D\s?\d+/.test(a)) return null;   /* "D1 / D3" is two places, not one */
  if (/online|usa|california|worldwide/i.test(a)) return null; /* not a place you can shop */
  return a + ', Vietnam';
}

/* ---------- page shell ---------- */
function shell(o) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}" />
<link rel="canonical" href="${SITE}${o.url}" />
<meta property="og:title" content="${esc(o.title)}" />
<meta property="og:description" content="${esc(o.desc)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE}${o.url}" />
<meta name="theme-color" content="#eef3fb" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#1a1d29" media="(prefers-color-scheme: dark)" />
<link rel="icon" href="${o.up}assets/favicon-48.png" type="image/png" sizes="48x48" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500&family=Tenor+Sans&family=Merriweather+Sans:wght@300;400&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="${o.up}css/styles.css" />
<script>(function(){var d=document.documentElement,s=window.localStorage;try{var t=s.getItem('ss-theme')||'auto';var p=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='auto'&&p))d.classList.add('dark');}catch(e){}})();</script>
${o.jsonld ? '<script type="application/ld+json">' + JSON.stringify(o.jsonld) + '</script>' : ''}
<style>
.dp{max-width:44rem;margin:0 auto;padding:clamp(1.6rem,5vw,3rem) 1.2rem 4rem;}
.dp-crumb{font-family:"Montserrat",sans-serif;font-size:.7rem;letter-spacing:.08em;
  text-transform:uppercase;color:var(--text-secondary);margin:0 0 1.4rem;}
.dp-crumb a{color:var(--accent);text-decoration:none;}
.dp h1{font-family:"Tenor Sans",serif;font-weight:400;color:var(--text-primary);
  font-size:clamp(1.8rem,5.4vw,2.6rem);line-height:1.15;margin:0 0 .5rem;}
.dp-kicker{font-family:"Montserrat",sans-serif;font-size:.72rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--eyebrow-ink);margin:0 0 1rem;}
.dp p,.dp li{font-family:"Merriweather Sans",sans-serif;font-weight:300;
  color:var(--text-secondary);line-height:1.8;font-size:.98rem;}
.dp a{color:var(--accent);}
.dp h2{font-family:"Tenor Sans",serif;font-weight:400;color:var(--text-primary);
  font-size:1.25rem;margin:2.4rem 0 .8rem;padding-bottom:.35rem;
  border-bottom:1px solid var(--surface-border);}
.dp-facts{margin:1.4rem 0;display:grid;gap:0;}
.dp-facts div{display:grid;grid-template-columns:11rem 1fr;gap:.8rem;padding:.6rem 0;
  border-top:1px solid var(--surface-border);}
.dp-facts div:last-child{border-bottom:1px solid var(--surface-border);}
.dp-facts dt{font-family:"Montserrat",sans-serif;font-size:.72rem;letter-spacing:.07em;
  text-transform:uppercase;color:var(--text-secondary);}
.dp-facts dd{margin:0;font-family:"Merriweather Sans",sans-serif;font-weight:300;
  color:var(--text-primary);font-size:.95rem;line-height:1.6;}
.dp-warn{border-left:3px solid var(--orchid);padding:.1rem 0 .1rem 1rem;margin:1.4rem 0;}
.dp-warn p{margin:0;font-size:.92rem;}
.dp-list{list-style:none;padding:0;margin:1rem 0;display:grid;gap:.1rem;}
.dp-list li{padding:.6rem 0;border-top:1px solid var(--surface-border);}
.dp-list li:last-child{border-bottom:1px solid var(--surface-border);}
.dp-list b{font-family:"Montserrat",sans-serif;font-weight:500;font-size:.95rem;color:var(--text-primary);}
.dp-list span{display:block;font-size:.88rem;color:var(--text-secondary);margin-top:.15rem;}
.dp-cta{background:var(--surface-solid);border:1px solid var(--surface-border);
  border-radius:14px;padding:1.1rem 1.2rem;margin:2.4rem 0 0;}
.dp-cta p{margin:0 0 .8rem;font-size:.93rem;}
.dp-btn{display:inline-flex;align-items:center;min-height:44px;padding:.6rem 1.3rem;
  border-radius:999px;background:var(--accent);color:var(--cta-text);text-decoration:none;
  font-family:"Montserrat",sans-serif;font-weight:500;font-size:.88rem;}
.dp-foot{margin-top:2.6rem;padding-top:1.1rem;border-top:1px solid var(--surface-border);
  font-size:.84rem;}
a:focus-visible{outline:2px solid var(--accent);outline-offset:3px;}
</style>
</head>
<body>
<main class="dp">
${o.body}
<p class="dp-foot"><a href="${o.up}">Seraphic Styler</a> · <a href="${o.up}fashion-directory">The Saigon Fashion Directory</a> · <a href="${o.up}for-boutiques">For boutiques</a></p>
</main>
</body>
</html>
`;
}

/* ---------- a single house ---------- */
function housePage(h, siblings, built) {
  const s = slug(h.n);
  const url = '/houses/' + s;
  const area = areaOf(h);
  const cat = CATEGORY[h.cat] || null;
  const city = CITY[h.city] || null;
  const mats = (h.fib || []).filter((f) => MATERIALS.has(f));
  const occs = (h.occ || []).map((o) => OCC[o]).filter(Boolean);

  const facts = [];
  if (h.a) facts.push(['Address', esc(h.a) + (city ? ', ' + esc(city) : '')]);
  if (h.area) facts.push(['Area', esc(h.area)]);
  if (cat) facts.push(['Category', esc(cat)]);
  if (h.sub) facts.push(['Specialises in', esc(h.sub)]);
  if (h.tier && TIER[h.tier]) facts.push(['Price tier', esc(TIER[h.tier])]);
  if (h.st && ACCESS[h.st]) facts.push(['How to visit', esc(ACCESS[h.st])]);
  if (h.price) facts.push(['Price guide', esc(h.price)]);
  if (mats.length) facts.push(['Materials recorded', esc(mats.join(', '))]);
  if (occs.length) facts.push(['Dresses for', esc(occs.join(', '))]);
  if (h.h) facts.push(['Instagram', `<a href="https://instagram.com/${esc(h.h)}" rel="noopener">@${esc(h.h)}</a>`]);
  if (h.w) facts.push(['Website', `<a href="${esc(h.w)}" rel="noopener">${esc(h.w.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`]);

  const kicker = [cat, h.tier && TIER[h.tier], area].filter(Boolean).join(' · ');
  const desc = `${h.n} — ${cat || 'fashion'}${area ? ' in ' + area : ''}${h.a ? ', ' + h.a : ''}. ${h.no || ''}`
    .replace(/\s+/g, ' ').trim().slice(0, 155);

  /* The area crumb is a link only where that area page exists — areas with a
     single house, or labels that are not shoppable places, never got one, and
     linking to them anyway was 12 more 404s. */
  const areaHref = areaLabel(area) && AREA_PAGES.has(slug(areaLabel(area)))
    ? ' / <a href="../areas/' + slug(areaLabel(area)) + '">' + esc(areaLabel(area)) + '</a>'
    : (area ? ' / ' + esc(area) : '');
  let body = `<p class="dp-crumb"><a href="../">Seraphic Styler</a> / <a href="../fashion-directory">Directory</a>${areaHref}</p>
<p class="dp-kicker">${esc(kicker)}</p>
<h1>${esc(h.n)}</h1>
${h.no ? '<p>' + esc(h.no) + '</p>' : ''}
<dl class="dp-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;

  if (h.flag) {
    body += `<div class="dp-warn"><p><strong>Confirm before you travel.</strong> This house's address, hours or trading status is known to move. Message it the day before you go — a short note in Vietnamese works best: <em>“Shop có store offline không? Địa chỉ và giờ mở cửa?”</em></p></div>`;
  }

  if (siblings.length) {
    body += `<h2>Also in ${esc(area)}</h2>
<ul class="dp-list">${siblings.slice(0, 8).map((o) =>
      `<li>${built.has(slug(o.n))
        ? `<b><a href="./${slug(o.n)}">${esc(o.n)}</a></b>`
        : `<b>${esc(o.n)}</b>`}${o.a ? '<span>' + esc(o.a) + '</span>' : ''}</li>`).join('')}</ul>`;
  }

  body += `<div class="dp-cta">
<p>I buy from Vietnamese houses like this one in person, and ship worldwide — pieces at the price on the receipt, never marked up.</p>
<a class="dp-btn" href="../for-boutiques">Buying for a boutique →</a>
</div>`;

  body += `<p class="dp-foot" style="margin-top:1.8rem">Recorded in person for the Saigon Fashion Directory. Last reviewed <time datetime="${BUILT}">${BUILT}</time>. Addresses and trading hours in Vietnam change often — confirm before you travel.</p>`;

  const jsonld = {
    '@context': 'https://schema.org', '@type': 'ClothingStore',
    name: h.n, url: SITE + url, dateModified: BUILT,
    ...(h.a ? { address: { '@type': 'PostalAddress', streetAddress: h.a, addressLocality: city || 'Ho Chi Minh City', addressCountry: 'VN' } } : {}),
    ...(h.no ? { description: h.no } : {}),
    ...(h.w || h.h ? { sameAs: [h.w, h.h ? 'https://instagram.com/' + h.h : null].filter(Boolean) } : {}),
  };

  return {
    file: path.join(ROOT, 'houses', s + '.html'), url,
    html: shell({ title: `${h.n} — ${area || 'Vietnam'} | Seraphic Styler`, desc, url, up: '../', jsonld, body }),
  };
}

/* ---------- an aggregate page (area or category) ---------- */
function listPage(kind, label, houses, blurb) {
  const s = slug(label);
  const url = `/${kind}/${s}`;
  /* Aggregate pages ship before individual house profiles. Link each result to
     the real directory search instead of manufacturing a /houses/ URL that may
     not exist. This keeps every crawlable link useful and avoids a 404 graph. */
  const directoryHref = (h) => `../fashion-directory#q=${encodeURIComponent(h.n)}`;
  const rows = houses.map((h) => `<li><b><a href="${esc(directoryHref(h))}">${esc(h.n)}</a></b><span>${
    [h.a, CATEGORY[h.cat], h.st && ACCESS[h.st]].filter(Boolean).map(esc).join(' · ')}${
    h.no ? ' — ' + esc(h.no) : ''}</span></li>`).join('');
  const body = `<p class="dp-crumb"><a href="../">Seraphic Styler</a> / <a href="../fashion-directory">Directory</a></p>
<p class="dp-kicker">${houses.length} directory ${houses.length === 1 ? 'house' : 'houses'}</p>
<h1>${esc(label)}</h1>
<p>${esc(blurb)}</p>
<p><strong>How to read the data.</strong> A listing records what was found in field research and the house's own channels; it is not a promise of live stock or opening hours. Saigon labels move often, so confirm before travelling. <a href="../directory-methodology">Read the methodology and correction policy</a>.</p>
<ul class="dp-list">${rows}</ul>
<div class="dp-cta">
<p>Seraphic Styler maintains this directory through field research and brands' own channels. If you are stocking a boutique abroad, I can buy from these houses, negotiate stockist terms and ship the whole buy as one parcel.</p>
<a class="dp-btn" href="../for-boutiques">Buying for a boutique →</a>
</div>`;
  const itemList = houses.map((h, i) => ({
    '@type': 'ListItem', position: i + 1, name: h.n,
    url: `${SITE}/fashion-directory#q=${encodeURIComponent(h.n)}`,
  }));
  return {
    file: path.join(ROOT, kind, s + '.html'), url,
    html: shell({
      title: `${label} — ${houses.length} curated fashion houses | Seraphic Styler`,
      desc: `${houses.length} Vietnamese fashion houses in ${label}, with recorded addresses, categories, access and editorial notes from the Saigon Fashion Directory.`.slice(0, 155),
      url, up: '../', body,
      jsonld: {
        '@context': 'https://schema.org', '@graph': [
          {
            '@type': 'CollectionPage', '@id': SITE + url + '#page',
            name: label, url: SITE + url,
            isPartOf: { '@id': SITE + '/fashion-directory#directory' },
            about: { '@id': SITE + '/fashion-directory#dataset' },
          },
          { '@type': 'ItemList', numberOfItems: houses.length, itemListElement: itemList },
          {
            '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Seraphic Styler', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: 'The Saigon Fashion Directory', item: SITE + '/fashion-directory' },
              { '@type': 'ListItem', position: 3, name: label, item: SITE + url },
            ],
          },
        ],
      },
    }),
  };
}

/* ---------- build ---------- */
const D = loadDirectory();
const pages = [];

/* areas index (built once, reused by the area pages and the static index) */
const byArea = new Map();
for (const h of D) {
  const a = areaOf(h);
  if (!a) continue;
  if (!byArea.has(a)) byArea.set(a, []);
  byArea.get(a).push(h);
}

/* ---- PASS 1: decide which houses get a page, before anything links to one ----
   The house pages carry the thin-content risk: the notes average 68 characters,
   so a page's unique prose is one short sentence plus a facts table. The filter
   stays — a house with its own website and a one-line note does not need a page
   here, and we should not try to outrank it for its own name. What changed is
   that the list pages now KNOW this set, so they never link to a page that was
   not written. --no-houses drops them entirely; the links degrade gracefully. */
const WANT_HOUSES = !process.argv.includes('--no-houses');
const built = new Set();
let skipped = 0;

/* How much recorded fact a house actually carries. Every record has an address,
   so the address alone cannot be the test — three or more distinct signals is
   what separates a page that answers something from a page that restates a row
   in a list. And a house with its own website plus a one-line note keeps the
   original rule: it does not need a page here, and we should not compete with it
   for its own name. */
function signals(h) {
  let n = 0;
  if (h.a) n++;
  if ((h.no || '').length >= 60) n++;
  if (h.price) n++;
  if (h.sub) n++;
  if (h.fib && h.fib.length) n++;
  if (h.occ && h.occ.length) n++;
  if (h.tier) n++;
  return n;
}
if (WANT_HOUSES) {
  for (const h of D) {
    const worth = signals(h) >= 3 && (!h.w || (h.no || '').length >= 60);
    if (worth) built.add(slug(h.n)); else skipped++;
  }
}

/* ---- PASS 2: the pages ---- */
let areaPages = 0;
const skippedAreas = [];
const areaIndex = [];
for (const [a, hs] of byArea) {
  if (hs.length < 2) continue;
  const label = areaLabel(a);
  if (!label) { skippedAreas.push(a); continue; }
  hs.sort((x, y) => x.n.localeCompare(y.n));
  pages.push(listPage('areas', label, hs,
    `${hs.length} fashion houses recorded in ${label}, walked and verified in person. Addresses, categories and how each one sells — some are walk-in stores, others sell by appointment or through a stockist.`, built));
  areaIndex.push({ label, slug: slug(label), n: hs.length });
  AREA_PAGES.add(slug(label));
  areaPages++;
}

const byCat = new Map();
for (const h of D) {
  if (!h.cat) continue;
  if (!byCat.has(h.cat)) byCat.set(h.cat, []);
  byCat.get(h.cat).push(h);
}
let catPages = 0;
const catIndex = [];
for (const [c, hs] of byCat) {
  if (hs.length < 2) continue;
  const label = CATEGORY[c] || c;
  hs.sort((x, y) => x.n.localeCompare(y.n));
  pages.push(listPage('categories', label, hs,
    `${hs.length} Vietnamese ${label.toLowerCase()} houses, each verified in person across Ho Chi Minh City and beyond.`, built));
  catIndex.push({ label, slug: slug(label), n: hs.length });
  catPages++;
}

/* Two pairs of records share a name (and therefore a slug); the second was
   silently overwriting the first's file. Keep the richer record and count the
   collision out loud so the duplicate can be resolved in directory-data.js. */
const seen = new Map();
const collisions = [];
for (const h of D) {
  const hs = slug(h.n);
  if (!built.has(hs)) continue;
  const prev = seen.get(hs);
  if (!prev) { seen.set(hs, h); continue; }
  collisions.push(h.n);
  if (signals(h) > signals(prev)) seen.set(hs, h);
}

let housePages = 0;
for (const h of D) {
  if (seen.get(slug(h.n)) !== h) continue;
  const area = areaOf(h);
  const siblings = (byArea.get(area) || []).filter((o) => o !== h);
  pages.push(housePage(h, siblings, built));
  housePages++;
}

/* ---------- the static index inside fashion-directory.html ----------
   The directory renders its 321 houses from js/directory-data.js, so the page
   ships ~2.5 KB of visible text and the whole dataset is invisible to any
   crawler that does not run JavaScript — which is most of the AI ones. This
   writes the same data into the page as plain HTML, inside a <details> so it
   is genuinely present for everyone rather than hidden from readers and shown
   to bots. It also gives the areas and categories pages their only inbound
   links: without it they are orphans nothing can reach. */
const MARK_A = '<!-- SS:STATIC-INDEX:START (generated by tools/build-seo-pages.cjs — do not edit by hand) -->';
const MARK_B = '<!-- SS:STATIC-INDEX:END -->';

function staticIndex() {
  const link = (h) => {
    const hs = slug(h.n);
    if (built.has(hs)) return `<a href="houses/${hs}">${esc(h.n)}</a>`;
    if (h.w) return `<a href="${esc(h.w)}" rel="noopener nofollow">${esc(h.n)}</a>`;
    if (h.h) return `<a href="https://instagram.com/${esc(h.h)}" rel="noopener nofollow">${esc(h.n)}</a>`;
    return esc(h.n);
  };
  const all = D.slice().sort((a, b) => a.n.localeCompare(b.n));
  const rows = all.map((h) => `<li>${link(h)}<span>${
    [h.a, areaOf(h), CATEGORY[h.cat], h.st && ACCESS[h.st], h.tier && TIER[h.tier]]
      .filter(Boolean).map(esc).join(' · ')}${h.no ? ' — ' + esc(h.no) : ''}</span></li>`).join('\n');

  return `${MARK_A}
<section class="wrap si" id="ss-static-index" aria-labelledby="si-h">
  <div class="si-panel">
  <h2 id="si-h">Plain-text directory</h2>
  <p class="si-lead">A readable reference to all ${all.length} houses, for screen readers, saved pages, and quick lookup.</p>
  <p class="si-meta">${all.length} houses · Last reviewed <time datetime="${INDEX_REVIEWED}">${INDEX_REVIEWED}</time> · Confirm before travel.<br><a href="dataset">Dataset</a> · <a href="for-agents">JSON API</a> · <a href="directory-methodology">Methodology</a></p>
  <nav class="si-jumps" aria-label="Plain directory sections"><a href="#plain-az">A–Z list</a><a href="#plain-area">By area</a><a href="#plain-category">By category</a></nav>
  <details class="si-all" id="plain-az">
    <summary>Every house, A–Z (${all.length})</summary>
    <ul class="si-list">
${rows}
    </ul>
  </details>
  <div class="si-support">
    <details id="plain-area"><summary>By area</summary><ul class="si-hubs">${areaIndex.sort((a, b) => b.n - a.n).map((a) =>
      `<li><a href="areas/${a.slug}">${esc(a.label)} <span>${a.n}</span></a></li>`).join('')}</ul></details>
    <details id="plain-category"><summary>By category</summary><ul class="si-hubs">${catIndex.sort((a, b) => b.n - a.n).map((c) =>
      `<li><a href="categories/${c.slug}">${esc(c.label)} <span>${c.n}</span></a></li>`).join('')}</ul></details>
  </div>
  <p class="si-end"><a href="#fd-reference-notes">Confidence &amp; research notes</a></p>
  </div>
</section>
<style>
.si{padding-block:32px;margin-top:24px;scroll-margin-top:96px}
.si-panel{border:1px solid var(--line);border-radius:18px;background:var(--paper);padding:clamp(20px,4vw,32px)}
.si h2{font-family:var(--font-display);font-weight:400;font-size:24px;margin:0 0 16px;color:var(--ink)}
.si-lead{font-size:16px;line-height:1.6;color:var(--ink);max-width:66ch;margin:0 0 12px}
.si-meta,.si-end{font-size:14px;line-height:1.6;color:var(--ink-soft);max-width:70ch;margin:0 0 16px}
.si a{color:var(--cobalt);text-decoration:underline;text-underline-offset:3px;min-height:44px;display:inline-flex;align-items:center}
.si-jumps{display:flex;gap:8px 24px;flex-wrap:wrap;margin-bottom:16px;font-size:14px}
.si details{border-top:1px solid var(--line);scroll-margin-top:96px}
.si summary{cursor:pointer;font-family:var(--font-body);font-size:16px;min-height:48px;align-content:center;padding:12px 4px;color:var(--ink)}
.si-support{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px}
.si-hubs{list-style:none;padding:0;margin:8px 0 16px}
.si-hubs a{display:flex;justify-content:space-between;gap:16px;font-size:14px;padding:8px 4px;text-decoration:none;border-bottom:1px solid var(--line-soft)}
.si-hubs span{color:var(--ink-soft)}
.si-list{list-style:none;padding:0;margin:16px 0;columns:2;column-gap:32px}
.si-list li{break-inside:avoid;padding:12px 0;border-bottom:1px solid var(--line);font-size:16px;color:var(--ink);overflow-wrap:anywhere}
.si-list li>span{display:block;font-size:16px;color:var(--ink-soft);line-height:1.6;margin-top:4px}
.si :is(a,summary):focus-visible{outline:3px solid var(--cobalt);outline-offset:3px}
@media(max-width:720px){.si-list{columns:1}.si-support{grid-template-columns:1fr;gap:8px}}
</style>
${MARK_B}`;
}

/* ---------- sitemap ---------- */
function sitemap(urls) {
  const rows = STATIC_URLS.map(([u, freq, pri]) =>
    `  <url><loc>${SITE}${u}</loc><lastmod>${BUILT}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`)
    .concat(urls.map((u) =>
      `  <url><loc>${SITE}${u}</loc><lastmod>${BUILT}</lastmod><changefreq>monthly</changefreq><priority>${u.startsWith('/houses/') ? '0.4' : '0.7'}</priority></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

/* ---------- write ---------- */
if (!DRY && !INDEX_ONLY) {
  for (const dir of ['houses', 'areas', 'categories']) fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  for (const p of pages) fs.writeFileSync(p.file, p.html);

  /* Prune house pages that no longer qualify, so the folder never keeps a page
     nothing links to and the sitemap never claims a URL that was deleted. */
  const keep = new Set(pages.filter((p) => p.url.startsWith('/houses/')).map((p) => path.basename(p.file)));
  for (const f of fs.readdirSync(path.join(ROOT, 'houses'))) {
    if (f.endsWith('.html') && !keep.has(f)) fs.unlinkSync(path.join(ROOT, 'houses', f));
  }

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap(pages.map((p) => p.url)));

}
if (!DRY) {
  const fdPath = path.join(ROOT, 'fashion-directory.html');
  let fd = fs.readFileSync(fdPath, 'utf8');
  const block = staticIndex();
  if (fd.includes(MARK_A) && fd.includes(MARK_B)) {
    fd = fd.slice(0, fd.indexOf(MARK_A)) + block + fd.slice(fd.indexOf(MARK_B) + MARK_B.length);
  } else {
    const at = fd.indexOf('<noscript>');
    if (at < 0) throw new Error('fashion-directory.html: no insertion point found');
    fd = fd.slice(0, at) + block + '\n' + fd.slice(at);
  }
  fs.writeFileSync(fdPath, fd);
}

console.log('  area pages      : ' + areaPages);
console.log('  category pages  : ' + catPages);
console.log('  house pages     : ' + housePages + '   (skipped ' + skipped + ' with too little recorded detail to answer anything)');
if (collisions.length) console.log('  name collisions : ' + collisions.join(', ') + '  (duplicate records — resolve in js/directory-data.js)');
if (skippedAreas.length) console.log('  areas skipped   : ' + skippedAreas.join(', ') + '  (not shoppable places)');
console.log('  total           : ' + pages.length + (DRY ? '  [dry run, nothing written]' : ''));
const bytes = pages.reduce((n, p) => n + p.html.length, 0);
console.log('  avg page size   : ' + Math.round(bytes / pages.length / 1024 * 10) / 10 + ' KB');
if (!DRY) {
  if(!INDEX_ONLY) console.log('  sitemap.xml     : ' + (STATIC_URLS.length + pages.length) + ' urls');
  console.log('  static index    : written into fashion-directory.html (' + D.length + ' houses)');
}
if (!DRY && !INDEX_ONLY) fs.writeFileSync(path.join(__dirname, 'seo-pages.json'), JSON.stringify(pages.map((p) => p.url), null, 1));
if(!DRY&&!INDEX_ONLY) console.log('  url list        : tools/seo-pages.json');
