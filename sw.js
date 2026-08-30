const CACHE = "shevegas-play-v1";
const SHELL = [
  "./",
  "index.html",
  "play.css",
  "play.js",
  "tree.json",
  "manifest.webmanifest",
  "art/splash.png",
  "art/splash-full.png",
  "clips/door-bite.m4a",
  "clips/sale-food.m4a",
  "clips/sale-move.m4a",
  "clips/sale-water.m4a",
  "clips/sale-nothing.m4a",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match("index.html"));
    })
  );
});
