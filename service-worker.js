/* Seraphic Styler — offline support for the fashion directory + route planner.
   Network-first for pages (so edits show immediately), cache-first for static
   assets. Lets you browse the directory and your saved route on the street with
   no signal. Bump CACHE to invalidate. */
const CACHE = 'ss-fd-v8'; /* bumped: legible form fields (visible borders, ink labels, hint out of the placeholder) */
const CORE = [
  './fashion-directory',
  './field-guide',
  './js/directory-data.js',
  './js/route-solver.js',
  './js/store-coords.js',
  './js/route-panel.js',
  './js/discover-brand.js',
  './js/i18n-page.js',
  './assets/butterfly-side.svg',
  './manifest.webmanifest'
];
/* Language bundles (js/i18n/<page>.<lang>.js) are deliberately NOT precached:
   there are 38 of them and a reader wants one. The cache-first fetch handler
   below stores whichever one they actually choose, so it works offline after. */

self.addEventListener('install', function (e) {
  // resilient precache — one missing URL must not fail the whole install
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // leave cross-origin (fonts, map tiles) alone

  const isPage = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isPage) {
    // network-first: fresh when online, cached page when offline
    e.respondWith(fetch(req).then(function (r) {
      const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); });
      return r;
    }).catch(function () {
      return caches.match(req).then(function (m) { return m || caches.match('./fashion-directory'); });
    }));
  } else {
    // cache-first for static assets (JS, svg, icons)
    e.respondWith(caches.match(req).then(function (m) {
      return m || fetch(req).then(function (r) {
        const cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); });
        return r;
      });
    }));
  }
});
