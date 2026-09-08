/* ============================================================
   Service Worker — Frequenz-App
   Strategien (aus js/sw-config.js):
   - font:  network-first, Cache-Fallback (Google Fonts)
   - shell: stale-while-revalidate (sofort aus Cache, im Hintergrund frisch)
   ============================================================ */
importScripts("js/sw-config.js");

const CACHE = SW_CACHE.NAME;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SW_CACHE.precache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  const strategy = SW_CACHE.strategyFor(url);
  if (strategy === "bypass") return;                       // Browser entscheidet

  if (strategy === "font") {
    // Network-first: frische Fonts, offline die letzten geladenen
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // shell: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const refresh = fetch(event.request)
        .then(resp => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(event.request, copy));
          }
          return resp;
        })
        .catch(() => cached || caches.match(SW_CACHE.offlineUrl));
      return cached || refresh;
    })
  );
});
