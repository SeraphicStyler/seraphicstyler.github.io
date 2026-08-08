/* Extraction + SSRF guard tests. No network, no Cloudflare account needed:
   run with `node worker/test/extract.test.js` before ever deploying. */
import { extract, parseJsonLd, parseOpenGraph, parseBasicHtml, normalisePrice } from '../src/extract.js';
import { validateUrl } from '../src/index.js';

let pass = 0, fail = 0;
const check = (n, c, x) => { console.log((c ? 'PASS' : 'FAIL'), n, x === undefined ? '' : x); c ? pass++ : fail++; };

/* ---- price normalisation, the field a wrong answer costs money on ---- */
{
  const cases = [
    ['1.290.000', 1290000],   // VN dot-thousands
    ['1,290,000', 1290000],   // US comma-thousands
    ['1.290.000,50', 1290000.5],
    ['1,290,000.50', 1290000.5],
    ['129.00', 129],
    ['129,00', 129],
    [1290000, 1290000],
    ['', undefined],
    ['abc', undefined],
    [0, undefined]
  ];
  let ok = 0;
  cases.forEach(([raw, want]) => {
    const got = normalisePrice(raw);
    if (got === want) ok++; else console.log('   miss:', JSON.stringify(raw), '→', got, 'want', want);
  });
  check('price separators disambiguated correctly', ok === cases.length, `${ok}/${cases.length}`);
}

/* ---- JSON-LD, the Shopify shape ---- */
{
  const html = `<html><head><script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Product","name":"Áo Dài Lụa Thêu Tay",
   "image":["/img/aodai.jpg"],"brand":{"@type":"Brand","name":"Cocosin"},
   "offers":{"@type":"Offer","price":"1890000","priceCurrency":"VND","availability":"https://schema.org/InStock"}}
  </script></head><body></body></html>`;
  const d = parseJsonLd(html, 'https://cocosin.vn/products/ao-dai');
  check('JSON-LD name with diacritics preserved', d.title === 'Áo Dài Lụa Thêu Tay', d.title);
  check('JSON-LD brand object unwrapped', d.brand === 'Cocosin', d.brand);
  check('JSON-LD price + currency', d.price === 1890000 && d.currency === 'VND', `${d.price} ${d.currency}`);
  check('relative image made absolute', d.image === 'https://cocosin.vn/img/aodai.jpg', d.image);
  check('availability normalised', d.availability === 'InStock', d.availability);
}

/* ---- JSON-LD inside @graph, and AggregateOffer ---- */
{
  const html = `<script type="application/ld+json">
  {"@graph":[{"@type":"WebPage"},{"@type":"Product","name":"Linen Midi Dress",
   "offers":{"@type":"AggregateOffer","lowPrice":"890000","priceCurrency":"VND"}}]}
  </script>`;
  const d = parseJsonLd(html, 'https://x.vn/p/1');
  check('@graph traversed', d && d.title === 'Linen Midi Dress', d && d.title);
  check('AggregateOffer uses lowPrice', d && d.price === 890000, d && d.price);
}

/* ---- a malformed block must not kill a good one ---- */
{
  const html = `<script type="application/ld+json">{ this is not json </script>
  <script type="application/ld+json">{"@type":"Product","name":"Silk Slip"}</script>`;
  const d = parseJsonLd(html, 'https://x.vn/p/1');
  check('one broken JSON-LD block does not break the rest', d && d.title === 'Silk Slip', d && d.title);
}

/* ---- Open Graph fallback ---- */
{
  const html = `<meta property="og:title" content="Ilona Jumpsuit">
  <meta property="og:image" content="https://mael.vn/i/1.jpg">
  <meta property="og:site_name" content="Mael">
  <meta property="product:price:amount" content="1650000">
  <meta property="product:price:currency" content="VND">`;
  const d = parseOpenGraph(html, 'https://mael.vn/product/ilona');
  check('Open Graph title/brand/price', d.title === 'Ilona Jumpsuit' && d.brand === 'Mael' && d.price === 1650000,
    `${d.title} | ${d.brand} | ${d.price}`);
}

/* ---- bare HTML last resort ---- */
{
  const html = `<title>Váy Lanh Trắng | Cuddle</title><body><span>1.450.000₫</span></body>`;
  const d = parseBasicHtml(html, 'https://cuddle.vn/p/1');
  check('title shop-suffix stripped', d.title === 'Váy Lanh Trắng', d.title);
  check('VND read from page body', d.price === 1450000 && d.currency === 'VND', `${d.price} ${d.currency}`);
}

/* ---- combine: JSON-LD wins, gaps filled from OG ---- */
{
  const html = `<meta property="og:image" content="https://x.vn/og.jpg">
  <script type="application/ld+json">{"@type":"Product","name":"Real Name","offers":{"price":"500000","priceCurrency":"VND"}}</script>`;
  const d = extract(html, 'https://x.vn/p/1');
  check('JSON-LD wins on conflicts', d.title === 'Real Name', d.title);
  check('gap filled from Open Graph', d.image === 'https://x.vn/og.jpg', d.image);
  check('confidence high when price came from JSON-LD', d.confidence === 'high', d.confidence);
  check('extraction source reported', d.extractionSource === 'jsonld', d.extractionSource);
}
{
  const d = extract('<title>Something</title>', 'https://x.vn/p/1');
  check('confidence low when only a title was found', d.confidence === 'low', d.confidence);
  check('no price invented', d.price === undefined, d.price);
}
{
  check('a page with nothing usable returns null', extract('<html><body>hi</body></html>', 'https://x.vn/') === null);
}

/* ---- SSRF guard: the reason this endpoint needs care at all ---- */
{
  const blocked = [
    'http://example.com/p',                       // not https
    'https://169.254.169.254/latest/meta-data/',  // cloud metadata by IP
    'https://127.0.0.1/admin',
    'https://10.0.0.5/internal',
    'https://192.168.1.1/',
    'https://[::1]/',
    'https://localhost/',
    'https://intranet/',
    'https://example.com:8080/p',                 // non-443 port
    'https://user:pw@example.com/p',              // embedded credentials
    'file:///etc/passwd',
    'javascript:alert(1)',
    'not a url at all'
  ];
  let ok = 0;
  blocked.forEach(u => { const r = validateUrl(u); if (!r.ok) ok++; else console.log('   LET THROUGH:', u); });
  check('SSRF vectors all rejected', ok === blocked.length, `${ok}/${blocked.length}`);

  const allowed = ['https://cocosin.vn/products/x', 'https://www.mael.vn/product/ilona-jumpsuit/', 'https://shop.example.co.uk/p/1?v=2'];
  let ok2 = 0;
  allowed.forEach(u => { const r = validateUrl(u); if (r.ok) ok2++; else console.log('   BLOCKED WRONGLY:', u, r.why); });
  check('real shop URLs allowed', ok2 === allowed.length, `${ok2}/${allowed.length}`);
}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
