const CACHE_NAME = 'dstoma-v4';

// Deliberately does NOT add a 'fetch' listener. v3 intercepted every request
// (including the /api/* calls the app's initial load depends on) and Safari
// has known bugs where SW-intercepted fetches can hang forever without
// resolving or rejecting — that caused the app to get stuck on the loading
// screen on macOS Safari. Chrome/Android only need a registered SW (any SW,
// fetch handler or not) to consider the site installable, so this satisfies
// that without touching the network path at all.
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
