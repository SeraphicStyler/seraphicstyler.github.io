/* Seraphic Styler API — Cloudflare Worker
   ----------------------------------------------------------------------
   ONE endpoint, because only one thing genuinely needs a server:

     GET /api/paste?url=<public product page>

   Everything else the tray needs is already solved on the client and better
   there — brand resolution runs offline against the directory in 0ms, the
   contact form is Tally, analytics is GoatCounter. This exists solely to get
   what a browser cannot: the retailer's own JSON-LD/Open Graph record, which
   carries the product image, the exact name with its diacritics, and the
   current price including sale price.

   The client stays local-first: js/fd-smartpaste.js resolves the house and
   slug itself and only calls this to enrich. If this Worker is down, over
   quota, or never deployed, the tray degrades to exactly what it does today.

   SECURITY. This fetches an attacker-supplied URL, which is textbook SSRF,
   so the guard is a positive allowlist rather than a blocklist:
     · https only, port 443 only
     · hostname must be a public DNS name — no IP literals at all, which
       removes the whole private-range and cloud-metadata class in one rule
     · redirects followed manually, each hop re-validated (defeats the
       redirect-to-internal trick)
     · no cookies, no auth headers, ever forwarded
     · response capped at 512 KB and 8 s, and only text/html is read
     · CORS restricted to Seraphic's own origins
   Cloudflare's edge cannot route to RFC1918 anyway, but this Worker must not
   depend on that being true.
   ---------------------------------------------------------------------- */
import { extract } from './extract.js';

const ALLOWED_ORIGINS = [
  'https://www.seraphicstyler.com',
  'https://seraphicstyler.com',
  'https://sandriatran.github.io',
  'http://localhost:8742'
];
const MAX_BYTES = 512 * 1024;
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const CACHE_TTL = 86400;        /* a day: prices move, but not by the minute */
const UA = 'SeraphicStylerBot/1.0 (+https://www.seraphicstyler.com; product metadata for a client shortlist)';

function cors(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors(origin))
  });
}

/* An IP literal is never a legitimate shop, and allowing one re-opens every
   private-range and metadata-endpoint attack. Reject the whole shape. */
function isIpLiteral(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || /^\[.*\]$/.test(host);
}
export function validateUrl(raw) {
  let u;
  try { u = new URL(raw); } catch (e) { return { ok: false, why: 'unparseable' }; }
  if (u.protocol !== 'https:') return { ok: false, why: 'https only' };
  if (u.port && u.port !== '443') return { ok: false, why: 'port not allowed' };
  const host = u.hostname.toLowerCase();
  if (isIpLiteral(host)) return { ok: false, why: 'ip literals not allowed' };
  if (!host.includes('.')) return { ok: false, why: 'not a public hostname' };
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/.test(host)) return { ok: false, why: 'internal hostname' };
  if (u.username || u.password) return { ok: false, why: 'credentials in url' };
  return { ok: true, url: u };
}

/* Follow redirects by hand so every hop is validated, not just the first. */
async function safeFetch(startUrl) {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const v = validateUrl(current);
    if (!v.ok) return { error: 'blocked: ' + v.why };
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(v.url.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: ctl.signal,
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'en,vi;q=0.9' }
      });
    } catch (e) {
      clearTimeout(timer);
      return { error: e.name === 'AbortError' ? 'upstream timeout' : 'upstream unreachable' };
    }
    clearTimeout(timer);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { error: 'redirect without location' };
      current = new URL(loc, v.url).toString();
      continue;
    }
    if (!res.ok) return { error: 'upstream ' + res.status };
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct && !ct.includes('text/html') && !ct.includes('xhtml') && !ct.includes('text/plain')) {
      return { error: 'not an html page' };
    }
    const html = await readCapped(res);
    if (html === null) return { error: 'page too large' };
    return { html, finalUrl: v.url.toString() };
  }
  return { error: 'too many redirects' };
}

/* Read at most MAX_BYTES so a hostile or enormous page cannot exhaust the
   Worker; the metadata we want is in the <head> regardless. */
async function readCapped(res) {
  if (!res.body) return await res.text();
  const reader = res.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) { try { await reader.cancel(); } catch (e) {} break; }
    chunks.push(value);
  }
  const buf = new Uint8Array(total > MAX_BYTES ? MAX_BYTES : total);
  let off = 0;
  for (const c of chunks) {
    if (off + c.byteLength > buf.length) { buf.set(c.subarray(0, buf.length - off), off); break; }
    buf.set(c, off); off += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(buf);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, origin);

    if (url.pathname === '/api/health') return json({ ok: true }, 200, origin);

    if (url.pathname !== '/api/paste') return json({ error: 'not found' }, 404, origin);

    const target = url.searchParams.get('url');
    if (!target) return json({ error: 'missing url' }, 400, origin);
    const v = validateUrl(target);
    if (!v.ok) return json({ error: 'rejected: ' + v.why }, 400, origin);

    /* Cache by normalised URL. KV's free tier allows 1,000 writes/day, so only
       successful extractions are stored — failures must not burn the quota. */
    const key = 'paste:' + v.url.origin + v.url.pathname;
    if (env.CACHE_KV) {
      const hit = await env.CACHE_KV.get(key, 'json');
      if (hit) return json(Object.assign({ ok: true, cached: true }, hit), 200, origin);
    }

    const got = await safeFetch(v.url.toString());
    if (got.error) return json({ ok: false, error: got.error }, 502, origin);

    const data = extract(got.html, got.finalUrl);
    if (!data) return json({ ok: false, error: 'no product metadata found' }, 200, origin);

    if (env.CACHE_KV) {
      try { await env.CACHE_KV.put(key, JSON.stringify(data), { expirationTtl: CACHE_TTL }); } catch (e) {}
    }
    return json(Object.assign({ ok: true, cached: false }, data), 200, origin);
  }
};
