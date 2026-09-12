/* ================================================================
   Service worker compatibile con index.html definitivo

   Caratteristiche:
   - cache separata per questa versione dell'app;
   - fallback offline per index.html, manifest e libreria Excel;
   - aggiornamento controllato tramite nuovo CACHE_NAME;
   - nessuna modifica o cancellazione del localStorage dell'app.
   ================================================================ */

const CACHE_NAME = "giappone-index2-final-1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  const isAppShellRequest =
    requestUrl.pathname.endsWith("/index.html") ||
    requestUrl.pathname.endsWith("/manifest.json") ||
    requestUrl.pathname.endsWith("/sw.js") ||
    requestUrl.hostname === "cdn.jsdelivr.net";

  if (!isAppShellRequest) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || !networkResponse.ok) {
          return networkResponse;
        }

        const responseCopy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseCopy).catch(() => {});
        });

        return networkResponse;
      });
    })
  );
});
