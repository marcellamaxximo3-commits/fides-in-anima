const CACHE = 'fides-20260925-4';
const ASSETS = ['./', './index.html', './style.css?v=20260925-4', './app.js?v=20260925-4', './leituras.json?v=20260925-4', './aquarelas.png', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('minuto-') || key.startsWith('fides-')) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    // Versioned assets are immutable for this release; navigation checks for updates.
    if (event.request.mode !== 'navigate' && cached) return cached;
    try {
      const response = await fetch(event.request, {cache: 'no-cache'});
      if (response.ok) event.waitUntil(cache.put(event.request, response.clone()));
      return response;
    } catch {
      return cached || (event.request.mode === 'navigate' ? await cache.match('./index.html') : null) || Response.error();
    }
  })());
});
