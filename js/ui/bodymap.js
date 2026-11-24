// Kas haritası: vücudun önden ve arkadan çizimi üzerinde kas gruplarını renklendirir.
// Renk sınıfları: "p" ana kas, "s" yardımcı kas, "lo" / "ok" / "hi" haftalık hacim durumu.
import { BODY } from "../data/body-paths.js";
import { musclesOf, EX } from "../data/exercises.js";
import { EXERCISE_INFO } from "../data/demos.js";

// Uygulamanın kas grupları → çizimdeki bölgeler (görünüme göre)
const PARTS = {
  gogus: { front: ["chest"] },
  sirt: { back: ["upper-back"] },
  omuz: { front: ["deltoids"] },
  arkaOmuz: { back: ["deltoids"] },
  onBacak: { front: ["quadriceps"] },
  arkaBacak: { back: ["hamstring"] },
  kalca: { back: ["gluteal"] },
  biseps: { front: ["biceps"] },
  triseps: { back: ["triceps"] },
  baldir: { front: ["calves"], back: ["calves"] },
  core: { front: ["abs", "obliques"] },
};
// Açıklama metnindeki ek yardımcı bölgeler
const EXTRA = [
  [/trapez|üst sırt/, { front: ["trapezius"], back: ["trapezius"] }],
  [/\bbel\b/, { back: ["lower-back"] }],
  [/ön kol|kavrama/, { front: ["forearm"], back: ["forearm"] }],
  [/kalça fleksör/, { front: ["hip-flexors"] }],
  [/oblik|yan core/, { front: ["obliques"] }],
];
// Kas olmayan bölgeler: siluet olarak çizilir, hiç renk almaz
const INERT = new Set(["head", "hair", "neck", "hands", "feet", "knees", "ankles"]);

const POOL_OF = Object.fromEntries(Object.entries(EX).flatMap(([pool, list]) => list.map((e) => [e.name, pool])));

// Bir hareket için bölge → renk sınıfı
export function exerciseLevels(name) {
  const mus = musclesOf(name, POOL_OF[name]);
  const out = { front: {}, back: {} };
  const put = (map, cls) => {
    for (const [view, parts] of Object.entries(map)) for (const p of parts) if (out[view][p] !== "p") out[view][p] = cls;
  };
  for (const [k, w] of Object.entries(mus)) if (PARTS[k]) put(PARTS[k], w >= 1 ? "p" : "s");
  const info = (EXERCISE_INFO[name]?.m || "").toLowerCase();
  for (const [re, map] of EXTRA) if (re.test(info)) put(map, "s");
  return out;
}

// Haftalık hacim satırlarından ({key, sets, min, max}) bölge → durum sınıfı
export function volumeLevels(rows) {
  const out = { front: {}, back: {} };
  for (const r of rows) {
    const cls = r.sets < r.min - 0.5 ? "lo" : r.sets > r.max + 2 ? "hi" : "ok";
    for (const [view, parts] of Object.entries(PARTS[r.key] || {})) for (const p of parts) out[view][p] = cls;
  }
  return out;
}

// Çizimdeki bölge → uygulamanın kas grubu (dokunarak seçim için)
const KEY_OF = { front: {}, back: {} };
for (const [key, map] of Object.entries(PARTS)) for (const [v, parts] of Object.entries(map)) for (const p of parts) KEY_OF[v][p] ??= key;

// Tek kas grubu seçiliyken renk sınıfları (seçim haritası)
export function muscleLevels(key) {
  const out = { front: {}, back: {} };
  for (const [v, parts] of Object.entries(PARTS[key] || {})) for (const p of parts) out[v][p] = "p";
  return out;
}

function view(name, levels, label, pick) {
  const v = BODY[name];
  const paths = Object.entries(v.p).map(([part, ds]) => {
    const key = pick && KEY_OF[name][part];
    const cls = (INERT.has(part) ? "inert" : levels[part] || "") + (key ? " tap" : "");
    return ds.map((d) => `<path class="${cls}" d="${d}"${key ? ` data-muscle="${key}"` : ""}/>`).join("");
  }).join("");
  return `<figure class="bm-view"><svg viewBox="${v.vb}" aria-hidden="true">${paths}</svg><figcaption>${label}</figcaption></figure>`;
}

// Ön + arka görünüm yan yana. pick: kas bölgelerine data-muscle eklenir (dokununca seçim)
export function bodyMap(levels, { label = "Kas haritası", pick = false } = {}) {
  return `<div class="bodymap${pick ? " pick" : ""}" role="img" aria-label="${label}">${view("front", levels.front, "Ön", pick)}${view("back", levels.back, "Arka", pick)}</div>`;
}
