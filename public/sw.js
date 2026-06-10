/* Flowglass service worker — offline shell + installability. */
const CACHE = 'flowglass-v1';
const ASSETS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Network-first for navigations so fresh content wins; fall back to cache offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/'))));
    return;
  }
  // Cache-first for static assets.
  e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
