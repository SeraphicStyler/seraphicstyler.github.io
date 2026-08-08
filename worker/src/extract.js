/* Seraphic Styler API — product metadata extraction (pure functions).
   ----------------------------------------------------------------------
   Given a page's HTML, pull out what a client needs in the tray: item name,
   brand, price, currency and image. Nothing here touches the network, so it
   is all directly testable with `node worker/test/extract.test.js`.

   Priority order, most trustworthy first:
     1. schema.org Product in JSON-LD  — the retailer's own machine-readable
        record; Shopify, WooCommerce and most fashion sites publish it.
     2. Open Graph / twitter: meta      — near-universal, but no structured
        price on many sites.
     3. Bare HTML heuristics            — <title> and a currency-shaped
        number, used only when the above are absent, and always returned as
        low confidence.

   Anything not found is left undefined. This never guesses a value into
   existence — the tray shows an empty field a client can fill far more
   safely than a confident wrong one. */

/* ---------- small helpers ---------- */
function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, function (m, code) {
      if (code[0] === '#') {
        var n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return isNaN(n) ? m : String.fromCodePoint(n);
      }
      var map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
      return map[code.toLowerCase()] !== undefined ? map[code.toLowerCase()] : m;
    })
    .replace(/\s+/g, ' ')
    .trim();
}
function clean(s, max) {
  var v = decodeEntities(s);
  if (!v) return undefined;
  if (max && v.length > max) v = v.slice(0, max - 1).replace(/\s\S*$/, '') + '…';
  return v || undefined;
}
/* Resolve against the page, then force https: several Shopify themes emit
   http:// or protocol-relative image URLs, which would be blocked as mixed
   content the moment the tray renders them on seraphicstyler.com. */
function absolutise(u, base) {
  if (!u) return undefined;
  try {
    var abs = new URL(u, base);
    if (abs.protocol === 'http:') abs.protocol = 'https:';
    return abs.toString();
  } catch (e) { return undefined; }
}
/* "Huelley Huelley" — some themes concatenate the shop name with itself in
   og:site_name. A name that is one word repeated is a template artefact. */
function dedupeName(s) {
  if (!s) return s;
  var parts = String(s).trim().split(/\s+/);
  if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) return parts[0];
  var half = parts.length / 2;
  if (parts.length % 2 === 0 && parts.slice(0, half).join(' ').toLowerCase() === parts.slice(half).join(' ').toLowerCase()) {
    return parts.slice(0, half).join(' ');
  }
  return s;
}

/* ---------- price ----------
   Vietnamese pages write 1.290.000₫ (dots as thousands); most Western ones
   1,290.00. Deciding which requires looking at the separator pattern, not at
   the locale of the reader. */
export function normalisePrice(raw) {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'number' && isFinite(raw) && raw > 0) return raw;
  var s = String(raw).trim().replace(/[^\d.,]/g, '');
  if (!s) return undefined;
  var hasDot = s.indexOf('.') >= 0, hasComma = s.indexOf(',') >= 0;
  var n;
  if (hasDot && hasComma) {
    /* whichever appears last is the decimal separator */
    n = s.lastIndexOf(',') > s.lastIndexOf('.')
      ? parseFloat(s.replace(/\./g, '').replace(',', '.'))
      : parseFloat(s.replace(/,/g, ''));
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(s)) {
    n = parseInt(s.replace(/[.,]/g, ''), 10);      /* 1.290.000 / 1,290,000 */
  } else {
    n = parseFloat(s.replace(',', '.'));
  }
  return isFinite(n) && n > 0 ? n : undefined;
}

/* ---------- 1. JSON-LD ---------- */
function collectNodes(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(function (n) { collectNodes(n, out); }); return; }
  out.push(node);
  if (node['@graph']) collectNodes(node['@graph'], out);
  ['mainEntity', 'itemListElement', 'hasVariant', 'isSimilarTo'].forEach(function (k) {
    if (node[k]) collectNodes(node[k], out);
  });
}
function typeOf(n) {
  var t = n['@type'];
  if (!t) return [];
  return (Array.isArray(t) ? t : [t]).map(function (x) { return String(x).toLowerCase(); });
}
function firstOffer(product) {
  var o = product.offers;
  if (!o) return null;
  var list = Array.isArray(o) ? o : [o];
  for (var i = 0; i < list.length; i++) {
    var n = list[i];
    if (!n || typeof n !== 'object') continue;
    if (typeOf(n).indexOf('aggregateoffer') >= 0) {
      return { price: n.lowPrice !== undefined ? n.lowPrice : n.price, priceCurrency: n.priceCurrency, availability: n.availability };
    }
    if (n.price !== undefined || n.priceSpecification) {
      var ps = n.priceSpecification && (Array.isArray(n.priceSpecification) ? n.priceSpecification[0] : n.priceSpecification);
      return {
        price: n.price !== undefined ? n.price : (ps && ps.price),
        priceCurrency: n.priceCurrency || (ps && ps.priceCurrency),
        availability: n.availability
      };
    }
  }
  return null;
}
function imageOf(v) {
  if (!v) return undefined;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return imageOf(v[0]);
  if (typeof v === 'object') return v.url || v.contentUrl;
  return undefined;
}
export function parseJsonLd(html, baseUrl) {
  var re = /<script[^>]+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  var nodes = [], m;
  while ((m = re.exec(html))) {
    var raw = m[1].trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
    try { collectNodes(JSON.parse(raw), nodes); } catch (e) { /* one bad block must not kill the rest */ }
  }
  var product = nodes.find(function (n) { return typeOf(n).indexOf('product') >= 0; });
  if (!product) return null;
  var offer = firstOffer(product) || {};
  var brand = product.brand;
  if (brand && typeof brand === 'object') brand = brand.name;
  var out = {
    title: clean(product.name, 140),
    brand: dedupeName(clean(brand, 80)),
    price: normalisePrice(offer.price),
    currency: offer.priceCurrency ? String(offer.priceCurrency).toUpperCase().slice(0, 3) : undefined,
    image: absolutise(imageOf(product.image), baseUrl),
    availability: offer.availability ? String(offer.availability).replace(/^https?:\/\/schema\.org\//i, '') : undefined,
    extractionSource: 'jsonld'
  };
  return out.title || out.price !== undefined ? out : null;
}

/* ---------- 2. Open Graph / meta ---------- */
function metaMap(html) {
  var out = {};
  var re = /<meta\b[^>]*>/gi, tag;
  while ((tag = re.exec(html))) {
    var s = tag[0];
    var key = (s.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1];
    var val = (s.match(/\bcontent\s*=\s*["']([^"']*)["']/i) || [])[1];
    if (key && val !== undefined && out[key.toLowerCase()] === undefined) out[key.toLowerCase()] = val;
  }
  return out;
}
export function parseOpenGraph(html, baseUrl) {
  var m = metaMap(html);
  var price = m['product:price:amount'] || m['og:price:amount'] || m['twitter:data1'] || m['price'];
  var out = {
    title: clean(m['og:title'] || m['twitter:title'], 140),
    brand: dedupeName(clean(m['og:site_name'] || m['product:brand'] || m['brand'], 80)),
    price: normalisePrice(price),
    currency: (m['product:price:currency'] || m['og:price:currency'] || '').toUpperCase().slice(0, 3) || undefined,
    image: absolutise(m['og:image'] || m['twitter:image'], baseUrl),
    availability: m['product:availability'] || m['og:availability'],
    extractionSource: 'opengraph'
  };
  return out.title || out.image || out.price !== undefined ? out : null;
}

/* ---------- 3. bare HTML, last resort ---------- */
export function parseBasicHtml(html, baseUrl) {
  var title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1], 140);
  if (title) title = title.split(/\s+[|–—]\s+/)[0].trim() || title; /* drop " | Shop Name" */
  var body = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
  var price, currency;
  var vnd = body.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:₫|đ\b|VND\b)/i) || body.match(/(?:₫|VND)\s*(\d{1,3}(?:[.,]\d{3})+)/i);
  if (vnd) { price = normalisePrice(vnd[1]); currency = 'VND'; }
  if (price === undefined) {
    var usd = body.match(/\$\s?(\d+(?:[.,]\d{2})?)/);
    if (usd) { price = normalisePrice(usd[1]); currency = 'USD'; }
  }
  var out = { title: title, price: price, currency: currency, extractionSource: 'html' };
  return out.title || out.price !== undefined ? out : null;
}

/* ---------- combine ---------- */
export function extract(html, baseUrl) {
  var jsonld = parseJsonLd(html, baseUrl);
  var og = parseOpenGraph(html, baseUrl);
  var basic = parseBasicHtml(html, baseUrl);
  var chosen = jsonld || og || basic;
  if (!chosen) return null;
  /* Fill gaps from the weaker sources without letting them overwrite. Absent
     keys must be dropped before merging: Object.assign copies an explicit
     `undefined` over a real value, which would let a JSON-LD block with no
     image erase the Open Graph one. */
  function defined(o) {
    var out = {};
    if (o) Object.keys(o).forEach(function (k) { if (o[k] !== undefined) out[k] = o[k]; });
    return out;
  }
  var merged = Object.assign({}, defined(basic), defined(og), defined(jsonld));
  merged.extractionSource = chosen.extractionSource;
  /* confidence reflects where the PRICE came from — that is the field a wrong
     answer actually costs a client money on */
  merged.confidence =
    jsonld && jsonld.price !== undefined ? 'high' :
    (jsonld || (og && og.price !== undefined)) ? 'medium' : 'low';
  merged.sourceUrl = baseUrl;
  return merged;
}
