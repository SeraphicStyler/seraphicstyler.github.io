/* Seraphic Styler — smart paste for the tray (fd-smartpaste.js)
   ----------------------------------------------------------------------
   Paste a product link, an Instagram link, or a block of copied text into
   the tray and this fills in the brand, the item name and the price.

   WHY THERE IS NO FETCH HERE. The obvious build is "fetch the page, read its
   JSON-LD/Open Graph, extract Product.name and offers.price". That cannot
   work on this site and it is not a matter of effort: seraphicstyler.com is
   static hosting with no server, and a browser cannot read a cross-origin
   retail page — the CORS policy of every shop blocks it. The only ways round
   it are a third-party CORS proxy (which would send every client's browsing
   through a stranger's server) or a worker of our own (a backend, a bill and
   an SSRF surface). Neither is worth it, because the two things a client
   actually needs filled — WHICH HOUSE and HOW MUCH — are already obtainable
   with no network at all:

     · WHICH HOUSE  — the directory already knows 259 of its 320 houses by
                      website or Instagram handle. A pasted URL is matched
                      against that, so "huelley.com/products/..." resolves to
                      Huelley, premium, D1 · Tân Định, instantly and offline.
     · WHAT IT IS   — retail URLs carry the product name in the slug
                      (/products/linen-midi-dress-black), which is free.
     · HOW MUCH     — clients paste the copied price along with the link far
                      more often than not; VND, "350k" and "1,2tr" all parse
                      through the tray's own parser.

   So this reads the URL and any pasted text, never the page. Zero network,
   zero cost, zero third parties, and nothing about a client's shopping ever
   leaves their browser. Every field it produces is a labelled suggestion the
   client can overwrite — a guess is shown as a guess, and a field it cannot
   fill is left empty rather than invented.

   Progressive enhancement: it drives the tray's existing paste inputs
   (.bk-c-link / .bk-c-store / .bk-c-price) by delegation, so fd-basket.js is
   untouched and the tray works exactly as before if this file is absent.
   Exposes window.SS_SMARTPASTE = { read } for tests.
   ---------------------------------------------------------------------- */
(function () {
  'use strict';
  if (window.SS_SMARTPASTE) return;
  var DIR = window.SS_DIRECTORY;
  if (!DIR) return;

  /* ---------- utils ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(k, en) { return window.SS_T ? window.SS_T(k, en) : en; }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '');
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0]; p[0] = i;
      for (j = 1; j <= b.length; j++) {
        var cur = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = p[j]; p[j] = cur;
      }
    }
    return p[b.length];
  }
  /* the tray owns money parsing; fall back only if the tray isn't loaded */
  function parsePrice(raw) {
    if (window.SS_BASKET && SS_BASKET.parsePrice) return SS_BASKET.parsePrice(raw);
    if (raw == null) return null;
    var s = String(raw).toLowerCase().replace(/vnd|[₫đ]/g, '').replace(/\s+/g, '');
    if (!s) return null;
    var mult = 1;
    if (/tr$/.test(s)) { mult = 1e6; s = s.slice(0, -2); }
    else if (/m$/.test(s)) { mult = 1e6; s = s.slice(0, -1); }
    else if (/k$/.test(s)) { mult = 1e3; s = s.slice(0, -1); }
    var n;
    if (mult > 1) n = parseFloat(s.replace(',', '.'));
    else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) n = parseInt(s.replace(/[.,]/g, ''), 10);
    else if (/^\d+([.,]\d+)?$/.test(s)) n = parseFloat(s.replace(',', '.'));
    else return null;
    if (isNaN(n) || n <= 0) return null;
    return Math.round(n * mult);
  }

  /* ---------- brand index, built from the directory itself ---------- */
  var HOSTS = {}, HANDLES = {}, NAMES = [], FIRST = {};
  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; }
  }
  /* "huelley.com" → "huelley"; "vincy.com.vn" → "vincy"; "global.jubinstudio.com" → "jubinstudio" */
  function hostBase(h) {
    var parts = String(h || '').split('.').filter(Boolean);
    var cut = parts.filter(function (p) { return ['com', 'vn', 'co', 'net', 'org', 'store', 'shop', 'io', 'me'].indexOf(p) < 0; });
    if (!cut.length) return '';
    return cut[cut.length - 1]; /* last meaningful label: drops "global." style prefixes */
  }
  DIR.forEach(function (b) {
    if (b.w) { var h = hostOf(b.w); if (h && !HOSTS[h]) HOSTS[h] = b; }
    if (b.h) { var k = String(b.h).toLowerCase(); if (!HANDLES[k]) HANDLES[k] = b; }
    var n = norm(b.n);
    if (n.length >= 4) NAMES.push({ b: b, n: n });
    /* A shop's domain is usually the first word of its name, not the whole thing:
       mael.vn is Mael Femme, not "maelfemme". Indexed per first word, but only
       usable where that word points at exactly one house — "huelley" and "résel"
       each name two sister labels, and picking the wrong one is worse than
       admitting we don't know. */
    var w0 = String(b.n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd').split(/[^a-z0-9]+/).filter(Boolean)[0];
    if (w0 && w0.length >= 4) (FIRST[w0] = FIRST[w0] || []).push(b);
  });

  /* Resolve a pasted URL to a house in the directory. Exact signals first
     (registered website, Instagram handle), then the domain name itself —
     "cocosin.vn" is Cocosin even where no website is recorded. */
  function resolveBrand(url) {
    var host = hostOf(url);
    if (!host) return null;
    if (HOSTS[host]) return { b: HOSTS[host], how: 'site', conf: 'high' };
    /* instagram.com/<handle> — but /p/ and /reel/ are posts, not accounts */
    if (/(^|\.)instagram\.com$/.test(host)) {
      var seg = '';
      try { seg = (new URL(url).pathname.split('/').filter(Boolean)[0] || '').toLowerCase(); } catch (e) {}
      if (seg && ['p', 'reel', 'reels', 'stories', 'explore', 'tv'].indexOf(seg) < 0 && HANDLES[seg]) {
        return { b: HANDLES[seg], how: 'ig', conf: 'high' };
      }
      return null; /* a post link tells us nothing about the house — say so, don't guess */
    }
    var base = norm(hostBase(host));
    if (base.length < 4) return null;
    var i;
    for (i = 0; i < NAMES.length; i++) if (NAMES[i].n === base) return { b: NAMES[i].b, how: 'domain', conf: 'high' };
    /* the domain is the house's first word, and that word is unambiguous */
    if (FIRST[base] && FIRST[base].length === 1) return { b: FIRST[base][0], how: 'domain', conf: 'medium' };
    /* the domain is a distinctive prefix of exactly one house */
    if (base.length >= 5) {
      var pre = NAMES.filter(function (r) { return r.n.indexOf(base) === 0; });
      if (pre.length === 1) return { b: pre[0].b, how: 'domain', conf: 'medium' };
    }
    for (i = 0; i < NAMES.length; i++) if (lev(base, NAMES[i].n) <= 1) return { b: NAMES[i].b, how: 'domain', conf: 'medium' };
    return null;
  }

  /* ---------- item name from the URL slug ---------- */
  var SKIP_SEG = ['products', 'product', 'p', 'dp', 'item', 'items', 'san-pham', 'sanpham', 'collections', 'collection', 'shop', 'store', 'vn', 'en'];
  function nameFromUrl(url) {
    var path = '';
    try { path = new URL(url).pathname; } catch (e) { return ''; }
    var segs = path.split('/').filter(Boolean).map(function (s) { return decodeURIComponent(s); });
    while (segs.length && SKIP_SEG.indexOf(segs[segs.length - 1].toLowerCase()) >= 0) segs.pop();
    if (!segs.length) return '';
    var last = segs[segs.length - 1]
      .replace(/\.(html?|php|aspx)$/i, '')
      .replace(/[-_]?\d{5,}$/, '')          /* trailing product ids */
      .replace(/[-_]p\d+$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!last || last.length < 3) return '';
    if (/^\d+$/.test(last)) return '';       /* a bare id is not a name */
    if (last.split(' ').length === 1 && last.length > 24) return ''; /* hash-looking */
    return last.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
  }

  /* ---------- price from pasted text ----------
     Vietnamese pages write 1.290.000₫ (dot thousands); Western ones $129.00.
     Take the currency-marked number, preferring the first VND figure. */
  function priceFromText(txt) {
    if (!txt) return null;
    var s = String(txt);
    var m = s.match(/(\d[\d.,\s]{2,})\s*(?:₫|đ\b|vnd\b)/i) ||
            s.match(/(?:₫|vnd)\s*(\d[\d.,\s]{2,})/i);
    if (m) { var v = parsePrice(m[1].replace(/\s/g, '')); if (v) return { vnd: v, conf: 'high' }; }
    m = s.match(/\b(\d+(?:[.,]\d+)?)\s*(k|tr|triệu|trieu)\b/i);
    if (m) { var v2 = parsePrice(m[1] + (/^tri/i.test(m[2]) ? 'tr' : m[2])); if (v2) return { vnd: v2, conf: 'medium' }; }
    /* a bare 6–9 digit grouped number on a Vietnamese page is almost always đồng */
    m = s.match(/\b(\d{1,3}(?:[.,]\d{3}){1,3})\b/);
    if (m) { var v3 = parsePrice(m[1]); if (v3 && v3 >= 10000) return { vnd: v3, conf: 'low' }; }
    return null;
  }
  /* A pasted blob usually starts with the product name; take the first line
     that reads like one rather than a price, a nav item or a legal notice. */
  function nameFromText(txt) {
    var lines = String(txt || '').split(/[\n\r]+/).map(function (l) { return l.trim(); }).filter(Boolean);
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      if (l.length < 3 || l.length > 90) continue;
      if (/^https?:/i.test(l)) continue;
      if (/₫|vnd|\$|^\d+$/i.test(l)) continue;
      if (/^(home|shop|menu|search|cart|login|sign in|add to cart|buy now|size|share)$/i.test(l)) continue;
      return l;
    }
    return '';
  }
  function brandFromText(txt) {
    var n = norm(txt);
    if (n.length < 4) return null;
    for (var i = 0; i < NAMES.length; i++) {
      if (NAMES[i].n.length >= 5 && n.indexOf(NAMES[i].n) >= 0) return { b: NAMES[i].b, how: 'text', conf: 'medium' };
    }
    return null;
  }

  /* ---------- the reader: URL or free text in, draft out ---------- */
  function read(raw) {
    var input = String(raw || '').trim();
    if (!input) return null;
    var urlMatch = input.match(/https?:\/\/[^\s<>"']+/i);
    var url = urlMatch ? urlMatch[0].replace(/[.,;)]+$/, '') : '';
    var rest = url ? input.replace(url, ' ') : input;
    var draft = { url: url, title: '', brand: null, brandLabel: '', priceVnd: null, fields: {}, source: url ? 'url' : 'text' };

    if (url) {
      var r = resolveBrand(url);
      if (r) { draft.brand = r.b; draft.brandLabel = r.b.n; draft.fields.brand = r.conf; draft.how = r.how; }
      else {
        var h = hostOf(url);
        if (h) { draft.brandLabel = h; draft.fields.brand = 'low'; draft.how = 'host'; }
      }
      var nm = nameFromUrl(url);
      if (nm) { draft.title = nm; draft.fields.title = 'medium'; }
    }
    if (rest && rest.trim().length > 2) {
      if (!draft.brand) {
        var bt = brandFromText(rest);
        if (bt) { draft.brand = bt.b; draft.brandLabel = bt.b.n; draft.fields.brand = bt.conf; draft.how = 'text'; }
      }
      /* A name copied off the page beats one reconstructed from the slug: the slug
         has been stripped of diacritics and casing, so "ao-dai-lua-theu-tay" loses
         to the "Áo Dài Lụa Thêu Tay" the client actually pasted. */
      var nt = nameFromText(rest);
      if (nt) { draft.title = nt; draft.fields.title = 'high'; }
      var p = priceFromText(rest);
      if (p) { draft.priceVnd = p.vnd; draft.fields.price = p.conf; }
    }
    /* A title on its own is just something typed — not worth a suggestion card.
       Only a resolved house, a link or a price makes this worth showing. */
    if (!draft.url && !draft.brand && draft.priceVnd == null) return null;
    if (!draft.brandLabel && !draft.title && draft.priceVnd == null) return null;
    return draft;
  }

  /* ---------- UI ---------- */
  var css =
    '.sp-note{margin:8px 0 0;padding:9px 11px;border:1px solid var(--line);border-radius:11px;' +
      'background:color-mix(in srgb,var(--mist) 55%,transparent);font-size:.76rem;line-height:1.5;color:var(--ink);}' +
    '.sp-note[hidden]{display:none;}' +
    '.sp-row{display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;}' +
    '.sp-row + .sp-row{margin-top:4px;}' +
    '.sp-k{font-size:.64rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-mute);min-width:52px;}' +
    '.sp-v{color:var(--ink);font-weight:600;}' +
    '.sp-meta{font-size:.7rem;color:var(--ink-mute);font-weight:400;}' +
    '.sp-badge{font-size:.58rem;text-transform:uppercase;letter-spacing:.06em;border-radius:999px;padding:2px 7px;}' +
    '.sp-badge.high{color:var(--ok);background:var(--ok-bg);}' +
    '.sp-badge.medium,.sp-badge.low{color:var(--warn);background:var(--warn-bg);}' +
    '.sp-hint{margin-top:6px;font-size:.68rem;color:var(--ink-mute);}';
  var styled = false;
  function ensureStyle() {
    if (styled) return;
    styled = true;
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function confBadge(level) {
    if (!level) return '';
    var lab = level === 'high' ? t('fd.sp.sure', 'confirmed') : t('fd.sp.check', 'check this');
    return '<span class="sp-badge ' + level + '">' + esc(lab) + '</span>';
  }

  function render(box, draft) {
    if (!draft) { box.hidden = true; box.innerHTML = ''; return; }
    var rows = [];
    if (draft.brandLabel) {
      var meta = '';
      if (draft.brand) {
        var b = draft.brand;
        meta = [b.tier && b.tier !== 'none' ? b.tier : '', b.area || ''].filter(Boolean).join(' · ');
      } else {
        meta = t('fd.sp.notInDir', 'not in the directory — added as typed');
      }
      rows.push('<div class="sp-row"><span class="sp-k">' + esc(t('fd.sp.house', 'House')) + '</span>' +
        '<span class="sp-v">' + esc(draft.brandLabel) + '</span>' +
        (meta ? '<span class="sp-meta">' + esc(meta) + '</span>' : '') +
        confBadge(draft.fields.brand) + '</div>');
    }
    if (draft.title) {
      rows.push('<div class="sp-row"><span class="sp-k">' + esc(t('fd.sp.item', 'Item')) + '</span>' +
        '<span class="sp-v">' + esc(draft.title) + '</span>' + confBadge(draft.fields.title) + '</div>');
    }
    if (draft.priceVnd) {
      rows.push('<div class="sp-row"><span class="sp-k">' + esc(t('fd.sp.price', 'Price')) + '</span>' +
        '<span class="sp-v">' + esc(Math.round(draft.priceVnd).toLocaleString('en-US') + '₫') + '</span>' +
        confBadge(draft.fields.price) + '</div>');
    }
    var hint = draft.priceVnd
      ? t('fd.sp.editable', 'Filled in below — edit anything that’s wrong before adding.')
      : t('fd.sp.needPrice', 'Filled in below. Paste the price too and I’ll read it — the page itself stays private, nothing is fetched.');
    box.innerHTML = rows.join('') + '<div class="sp-hint">' + esc(hint) + '</div>';
    box.hidden = false;
  }

  /* Fill the tray's own inputs; never overwrite something the client typed. */
  function applyTo(form, draft) {
    var store = form.querySelector('.bk-c-store'), price = form.querySelector('.bk-c-price');
    if (store && !store.value.trim() && draft.brandLabel) store.value = draft.brandLabel;
    if (price && !price.value.trim() && draft.priceVnd) price.value = String(draft.priceVnd);
  }

  function boxFor(form) {
    var wrap = form.closest('.tr-paste') || form.parentNode;
    var box = wrap.querySelector('.sp-note');
    if (!box) {
      ensureStyle();
      box = document.createElement('div');
      box.className = 'sp-note';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      box.hidden = true;
      wrap.appendChild(box);
    }
    return box;
  }

  function handleInput(el) {
    var form = el.closest('.bk-cform');
    if (!form) return;
    var draft = read(el.value);
    var box = boxFor(form);
    if (!draft) { render(box, null); return; }
    applyTo(form, draft);
    /* a pasted blob: keep only the link in the URL field, the rest is now parsed */
    if (draft.source === 'text' && draft.url && el.value.trim() !== draft.url) el.value = draft.url;
    else if (draft.source === 'url' && draft.url && el.value.trim() !== draft.url) el.value = draft.url;
    render(box, draft);
    /* no-op unless window.SS_PASTE_API is set to a deployed Worker */
    enrich(draft, function (better) { applyTo(form, better); render(box, better); });
  }

  /* Delegated: the tray panel is built lazily, so binding to the document
     means this works whenever the tray first opens, with no ordering rules. */
  var timer = null;
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('bk-c-link')) return;
    clearTimeout(timer);
    timer = setTimeout(function () { handleInput(el); }, 120);
  });
  document.addEventListener('paste', function (e) {
    var el = e.target;
    if (!el.classList || !el.classList.contains('bk-c-link')) return;
    setTimeout(function () { handleInput(el); }, 0); /* after the value lands */
  });
  /* adding clears the suggestion, so the next paste starts clean */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.bk-c-add') : null;
    if (!btn) return;
    var form = btn.closest('.bk-cform');
    if (form) setTimeout(function () { render(boxFor(form), null); }, 0);
  });

  /* ---------- optional enrichment ----------
     Everything above works offline and is the default. If the Worker in
     worker/ is deployed, set window.SS_PASTE_API to its origin and a pasted
     link will ALSO be sent there to read the retailer's own JSON-LD — which
     is the only way to get the product image, the exact name with diacritics,
     and a sale price. Local results are never discarded: the remote call only
     fills fields the client left blank, and any failure is silent, so the
     tray behaves exactly as it does today whenever the API is absent, over
     quota, or down. Nothing is sent anywhere until this is set. */
  function apiBase() {
    var v = window.SS_PASTE_API;
    return typeof v === 'string' && /^https:\/\//.test(v) ? v.replace(/\/+$/, '') : '';
  }
  function enrich(draft, done) {
    var base = apiBase();
    if (!base || !draft || !draft.url) return;
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    fetch(base + '/api/paste?url=' + encodeURIComponent(draft.url), {
      method: 'GET', mode: 'cors', credentials: 'omit', signal: ctl ? ctl.signal : undefined
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(timer);
        if (!d || !d.ok) return;
        var changed = false;
        /* the retailer's own name beats a slug reconstruction */
        if (d.title && (!draft.title || draft.fields.title !== 'high')) {
          draft.title = d.title; draft.fields.title = d.confidence === 'high' ? 'high' : 'medium'; changed = true;
        }
        if (d.price && draft.priceVnd == null && (!d.currency || d.currency === 'VND')) {
          draft.priceVnd = Math.round(d.price); draft.fields.price = d.confidence; changed = true;
        }
        if (d.image && !draft.image) { draft.image = d.image; changed = true; }
        /* a house already matched from the directory outranks a site's own og:site_name */
        if (!draft.brand && d.brand && !draft.brandLabel) {
          draft.brandLabel = d.brand; draft.fields.brand = 'medium'; changed = true;
        }
        if (changed && typeof done === 'function') done(draft);
      })
      .catch(function () { clearTimeout(timer); }); /* offline-first: failure is not an error */
  }

  window.SS_SMARTPASTE = { read: read, resolveBrand: resolveBrand, nameFromUrl: nameFromUrl, priceFromText: priceFromText, enrich: enrich };
})();
