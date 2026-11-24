// Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır, ağ varsa güncel sürüm kullanılır.
// Dosya eklediğinde/değiştirdiğinde VERSION'ı artır.
const VERSION = "v3-13";
const CACHE = "antrenman-" + VERSION;
// Hareket videoları ayrı önbellekte durur: sürüm değişince silinmez, ilk izlenişte indirilir
const MEDIA = "antrenman-media";
const ASSETS = [
  "./", "index.html", "manifest.json", "icon.svg", "icon-192.png", "icon-512.png", "css/app.css",
  "js/app.js", "js/config.js", "js/state/store.js", "js/state/settings.js", "js/ui/wake.js",
  "js/cloud/auth.js", "js/cloud/sync.js", "js/cloud/decide.js", "js/ui/auth.js",
  "js/ai/key.js", "js/ai/claude.js", "js/ai/food.js", "js/ui/foodphoto.js", "js/legal.js", "js/ui/privacy.js",
  "js/core/program.js", "js/core/nutrition.js", "js/core/anim.js", "js/core/progression.js",
  "js/data/exercises.js", "js/data/demos.js", "js/data/renames.js", "js/data/videos.js", "js/data/body-paths.js", "js/ui/bodymap.js",
  "js/ui/dom.js", "js/ui/demo.js", "js/ui/timer.js", "js/ui/plan.js", "js/ui/wheel.js", "js/ui/swap.js",
  "js/ui/workout.js", "js/ui/nutrition.js", "js/ui/program.js", "js/ui/library.js", "js/ui/stats.js", "js/ui/profile.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Video/kapak: önce önbellek. Dosya bir kez bütün indirilir; tarayıcının parça (Range) istekleri
// önbellekteki kopyadan 206 yanıtıyla karşılanır (iPhone Safari videoyu parça parça ister).
async function media(req) {
  const key = req.url.split("#")[0];
  const cache = await caches.open(MEDIA);
  let res = await cache.match(key);
  if (!res) {
    const full = await fetch(key);
    if (full.status !== 200) return full;
    await cache.put(key, full.clone());
    res = full;
  }
  const range = req.headers.get("range");
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return res;
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  let start, end;
  if (m[1] === "") { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else { start = Number(m[1]); end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1); }
  if (start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "video/mp4",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

// Önce ağ, olmazsa önbellek
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.includes("/media/")) { e.respondWith(media(e.request)); return; }
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
