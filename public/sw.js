const CACHE_NAME = 'dstoma-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['/'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Network-first for everything, cache only as an offline fallback. The previous
// cache-first strategy for JS/CSS could serve an old build's assets to a returning
// visitor after a new deploy — confirmed in production as a fully unstyled page
// (raw serif HTML, no Tailwind) on a client's Mac, since the stale cached script/
// style no longer matched what the fresh index.html expected.
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
