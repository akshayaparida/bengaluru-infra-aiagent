self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('infra-agent-v1').then((cache) => cache.addAll([
      '/',
      '/favicon.ico',
      '/manifest.json'
    ]))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first for dynamic requests; cache-first for precached assets
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && ['/', '/favicon.ico', '/manifest.json'].includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});