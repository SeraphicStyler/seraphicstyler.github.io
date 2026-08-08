# Seraphic API — the small backend

One endpoint, `GET /api/paste?url=…`, which reads a public product page and
returns `{title, brand, price, currency, image}`. It exists because that is the
**only** thing the site genuinely cannot do in the browser: a shop's CORS policy
blocks a cross-origin read, so the retailer's own Open Graph / JSON-LD record —
the product image, the exact name, the current price — is unreachable from a
static page.

Everything else stays where it is, because it is already solved and solved
better:

| Proposed endpoint | Why it isn't here |
|---|---|
| `/api/brand-resolve` | `js/fd-smartpaste.js` already resolves 257/300 houses offline, in 0 ms, with nothing leaving the browser. A network round-trip would be slower and *less* private. |
| `/api/contact` | Ten pages already post to Tally (form `gD10Kl`). |
| `/api/events` | GoatCounter is already wired. |
| Admin curation KV | `js/directory-data.js` is the git-tracked single source of truth. A KV copy is a second source that can silently drift from it. |

## Local development — no Cloudflare account needed

```bash
cd worker
npm install
npm test                    # 21 extraction + SSRF checks, no network
npx wrangler dev --local    # serves http://127.0.0.1:8788
```

Verify:

```bash
curl 'http://127.0.0.1:8788/api/health'
curl 'http://127.0.0.1:8788/api/paste?url=https%3A%2F%2Fhuelley.com%2Fproducts%2Famie-top'
```

## Deploying (needs the Cloudflare login)

```bash
npx wrangler login                            # opens a browser — you must run this
npx wrangler deploy                           # publishes to *.workers.dev
```

Optional, in this order, only once the above works:

```bash
npx wrangler kv namespace create CACHE_KV     # then uncomment [[kv_namespaces]] in wrangler.toml
```

For a custom domain, uncomment the `[[routes]]` block in `wrangler.toml`. DNS
for `seraphicstyler.com` is already on Cloudflare, so `api.seraphicstyler.com`
needs no nameserver change.

## Turning it on in the site

The front end ignores this Worker until it is told about it. Add one line to
`fashion-directory.html`, after `js/fd-smartpaste.js`:

```html
<script>window.SS_PASTE_API = "https://api.seraphicstyler.com";</script>
```

Until that line exists, `fd-smartpaste.js` makes no network calls at all and the
tray behaves exactly as it does today. After it exists, a pasted link is still
resolved locally first; the Worker only fills fields the local pass left blank,
and any failure — down, over quota, slow — is swallowed silently.

## What it actually gets you

Measured against real shops in the directory:

| Shop | Structured data | Result |
|---|---|---|
| huelley.com (Shopify) | Product JSON-LD + OG | title, brand, **price 2,000,000₫**, image |
| liniss.com (Shopify) | OG only | title, brand, **price 600,000₫**, image |
| mael.vn (WooCommerce) | none | title only |

So: Shopify houses give a full row including price and image; smaller custom or
WooCommerce sites give a name and nothing more. That is the honest ceiling, and
it is why the local resolver stays the default rather than the fallback.

## Limits and safety

* **Free tier** — 100k Worker requests/day; KV 100k reads and **1,000 writes**
  per day. Only successful extractions are cached, so failures cannot burn the
  write quota. KV is optional; without it the Worker just refetches.
* **SSRF** — this fetches a user-supplied URL, so the guard is an allowlist:
  https only, port 443 only, no IP literals at all (which removes the private
  range and cloud-metadata classes outright), no embedded credentials, manual
  redirect following with every hop re-validated, no cookies or auth forwarded,
  512 KB and 8 s caps, `text/html` only. Covered by tests in
  `test/extract.test.js`.
* **CORS** — restricted to Seraphic's own origins in `src/index.js`.
* Do not point this at private, checkout, order or account URLs. It is for
  public product pages.
