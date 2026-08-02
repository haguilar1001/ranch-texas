// Service worker mínimo para el escáner offline.
// Estrategia: network-first, con caché de respaldo (para servir el shell sin conexión).
const CACHE = "ranch-texas-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // los POST (sync) siempre van a la red
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/escaneo"))),
  );
});
