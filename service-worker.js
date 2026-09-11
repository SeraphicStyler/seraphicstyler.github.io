/* Offline directory support. Pages and code stay fresh; images are cached on use. */
const CACHE = 'ss-fd-v79';
const CORE = [
  './fashion-directory', './field-guide', './find', './manifest.webmanifest',
  './css/directory.css?v=2026-09-10', './css/field-guide.css?v=2026-09-10',
  './css/find.css?v=2026-09-10', './css/theme.css?v=2026-09-10',
  './css/directory-workspace.css?v=2026-09-10b', './css/directory-discovery.css?v=2026-09-09',
  './css/directory-guide.css?v=2026-09-09c',
  './js/theme.js?v=2026-09-10', './js/directory.js?v=2026-09-10',
  './js/directory-data.js', './js/directory-catalog.js', './js/directory-workspace.js?v=2026-09-10b',
  './js/directory-discovery.js', './js/directory-reference.js', './js/directory-garments.js',
  './js/directory-guide.js?v=2026-09-09c',
  './js/fd-search.js', './js/route-solver.js', './js/store-coords.js',
  './js/route-panel.js', './js/discover-brand.js', './js/i18n-page.js',
  './js/i18n-dom.js', './js/i18n/manifest.js', './js/find.js', './js/fd-basket.js',
  './js/fd-atelier.js', './js/fd-voice.js?v=2026-09-09',
  './js/fd-smartpaste.js', './js/estimator.js'
];
// Language bundles and photographs are cached only when requested.
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(
    CORE.map(url => cache.add(url))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('ss-fd-') && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const page = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  const fresh = page || /\.(?:js|css)$/.test(url.pathname);
  async function network() {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      await cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  }
  async function cached() {
    return await caches.match(request) || (page && await caches.match('./fashion-directory')) || Response.error();
  }
  event.respondWith(fresh
    ? network().catch(cached)
    : caches.match(request).then(hit => hit || network()).catch(() => Response.error()));
});
