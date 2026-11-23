// Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır, ağ varsa güncel sürüm kullanılır.
// Dosya eklediğinde/değiştirdiğinde VERSION'ı artır.
const VERSION = "v3-5";
const CACHE = "antrenman-" + VERSION;
const ASSETS = [
  "./", "index.html", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "css/app.css",
  "js/app.js", "js/config.js", "js/state/store.js",
  "js/cloud/auth.js", "js/cloud/sync.js", "js/cloud/decide.js", "js/ui/auth.js",
  "js/core/program.js", "js/core/nutrition.js", "js/core/anim.js", "js/core/progression.js",
  "js/data/exercises.js", "js/data/demos.js", "js/data/renames.js",
  "js/ui/dom.js", "js/ui/demo.js", "js/ui/timer.js", "js/ui/plan.js", "js/ui/wheel.js", "js/ui/swap.js",
  "js/ui/workout.js", "js/ui/nutrition.js", "js/ui/program.js", "js/ui/library.js", "js/ui/stats.js", "js/ui/profile.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Önce ağ, olmazsa önbellek
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
