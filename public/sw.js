const CACHE = "amanah-v2";

const PRE_CACHE = [
  "/",
  "/manifest.json",
  "/index.html",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// Network-first strategy for HTML, cache-first for assets
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip Supabase API calls — always network
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // For navigation requests (HTML) — network first, fallback to cache
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // For static assets — cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      });
      return cached || fetched;
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  clients.claim();
});
