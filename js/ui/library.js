// Hareket kütüphanesi: kas grubuna göre gruplu, aranabilir; kas haritası, ekipman ve "evde" filtresi;
// her harekette kişisel en iyi kilo. Dokununca animasyon/video penceresi açılır.
import { EX, equipmentOf, EQUIPMENT, GEAR, gearOf, musclesOf, MUSCLES } from "../data/exercises.js";
import { EXERCISE_INFO } from "../data/demos.js";
import { state } from "../state/store.js";
import { esc, fmt } from "./dom.js";
import { thumbSvg, bindDemoClicks } from "./demo.js";
import { bodyMap, muscleLevels } from "./bodymap.js";

const GROUPS = {
  squat: "Squat / Bacak", hinge: "Deadlift / Kalça", hpush: "Göğüs (yatay itiş)", hpull: "Sırt (yatay çekiş)",
  vpush: "Omuz (dikey itiş)", vpull: "Sırt (dikey çekiş)", lunge: "Tek bacak", legcurl: "Arka bacak",
  legext: "Ön bacak", calf: "Baldır", lateral: "Yan omuz", facepull: "Arka omuz", biceps: "Biseps",
  triceps: "Triseps", chestfly: "Göğüs izolasyon", core: "Core",
};
const TOTAL = Object.values(EX).flat().length;
// Filtreler sekmeler arasında hatırlanır
const f = { query: "", homeOnly: false, gear: "", muscle: "" };
const thumbs = new Map(); // önizlemeler bir kez üretilir
const norm = (s) => s.toLocaleLowerCase("tr");
const EQ_SHORT = Object.fromEntries(EQUIPMENT.map(([k, l]) => [k, l.split(" /")[0]]));
const eqText = (name) => {
  const eq = equipmentOf(name);
  return eq.includes("gym") ? "Salon" : eq.length ? "Ev · " + eq.map((k) => EQ_SHORT[k]).join(" + ") : "Ev · ekipmansız";
};

// Geçmişteki en yüksek kilo (yalnızca ek ağırlıklı setler)
function bestKg() {
  const best = new Map();
  for (const h of state.history) for (const e of h.exercises) for (const s of e.sets) {
    if (s.kg > 0 && s.kg > (best.get(e.name) || 0)) best.set(e.name, s.kg);
  }
  return best;
}

function build() {
  const best = bestKg();
  return Object.entries(GROUPS).map(([k, title]) => `
    <section data-group="${k}">
      <div class="section-title">${title}</div>
      <div class="lib-grid">${EX[k].map((e) => {
        if (!thumbs.has(e.name)) thumbs.set(e.name, thumbSvg(e.name));
        const mus = musclesOf(e.name, k);
        const pr = best.get(e.name);
        return `
        <button type="button" class="lib-item" data-demo="${esc(e.name)}" data-home="${equipmentOf(e.name).includes("gym") ? 0 : 1}"
          data-gear="${gearOf(e.name)}" data-mus="${esc(Object.entries(mus).map(([m, w]) => m + ":" + w).join(" "))}"
          data-search="${esc(norm(e.name + " " + title + " " + (EXERCISE_INFO[e.name]?.m || "") + " " + eqText(e.name)))}">
          ${thumbs.get(e.name)}<span>${esc(e.name)}</span>
          <small class="tiny muted" style="display:block;margin:2px 2px 0">${esc(eqText(e.name))}</small>
          ${pr ? `<small class="lib-pr">En iyi: ${fmt(pr)} kg</small>` : ""}
          <small class="lib-role" data-role></small></button>`;
      }).join("")}</div>
    </section>`).join("");
}

// Seçili kas için harekete düşen pay: 1 ana, 0,5 yardımcı, 0 yok
const weightFor = (it, m) => {
  const hit = it.dataset.mus.split(" ").find((x) => x.startsWith(m + ":"));
  return hit ? Number(hit.split(":")[1]) : 0;
};

function filter(root) {
  const q = norm(f.query.trim());
  let count = 0;
  const sections = [...root.querySelectorAll("[data-group]")];
  sections.forEach((g) => {
    let any = false;
    g.dataset.primary = "0";
    g.querySelectorAll(".lib-item").forEach((it) => {
      const w = f.muscle ? weightFor(it, f.muscle) : 1;
      const hit = (!q || it.dataset.search.includes(q)) && (!f.homeOnly || it.dataset.home === "1") &&
        (!f.gear || it.dataset.gear === f.gear) && w > 0;
      it.classList.toggle("hidden", !hit);
      // Kas seçiliyken ana kası olan hareketler önce, rolü kartta yazar
      it.style.order = f.muscle && w < 1 ? 1 : 0;
      const role = it.querySelector("[data-role]");
      role.textContent = f.muscle ? (w >= 1 ? "Ana kas" : "Yardımcı kas") : "";
      role.className = "lib-role" + (f.muscle ? (w >= 1 ? " p" : " s") : "");
      if (hit) count++;
      if (hit && f.muscle && w >= 1) g.dataset.primary = "1";
      any ||= hit;
    });
    g.classList.toggle("hidden", !any);
  });
  // Kas seçiliyken ana kası içeren gruplar önce; seçim kalkınca özgün sıra
  const keys = Object.keys(GROUPS);
  const end = root.querySelector("[data-empty]");
  sections.sort((a, b) => (f.muscle ? b.dataset.primary - a.dataset.primary : 0) || keys.indexOf(a.dataset.group) - keys.indexOf(b.dataset.group))
    .forEach((s) => end.before(s));
  const filtered = q || f.homeOnly || f.gear || f.muscle;
  root.querySelector("[data-count]").textContent = filtered ? `${count} / ${TOTAL} hareket` : `${TOTAL} hareket`;
  root.querySelector("[data-empty]").classList.toggle("hidden", count > 0);
  root.querySelector("[data-clear]").classList.toggle("hidden", !filtered);
}

const mapHtml = () => bodyMap(muscleLevels(f.muscle), { label: "Kas seçimi haritası", pick: true });

export function render(main, ctx) {
  main.innerHTML = `<div class="tab">
    <button type="button" class="btn sm" style="margin-bottom:12px" data-back>‹ Programa dön</button>
    <div class="lib-search">
      <input class="search" type="search" placeholder="Hareket veya kas ara (ör. squat, omuz, bant)" value="${esc(f.query)}" aria-label="Hareket ara" data-q>
      <span class="lib-count" role="status" data-count></span>
    </div>
    <div class="bm-card lib-map">
      <div data-map>${mapHtml()}</div>
      <div class="between" style="margin-top:6px;gap:8px">
        <span class="tiny muted">Kasa dokun ya da seç</span>
        <select class="input sm" aria-label="Kas grubu" data-muscle-select>
          <option value="">Tüm kaslar</option>
          ${Object.entries(MUSCLES).map(([k, l]) => `<option value="${k}" ${f.muscle === k ? "selected" : ""}>${esc(l)}</option>`).join("")}
        </select>
      </div>
    </div>
    <div class="chips" style="margin-top:10px" role="group" aria-label="Ekipman filtresi">
      <input type="radio" name="gear" id="g-all" value="" ${f.gear ? "" : "checked"}><label for="g-all">Tüm ekipman</label>
      ${GEAR.map(([k, l]) => `<input type="radio" name="gear" id="g-${k}" value="${k}" ${f.gear === k ? "checked" : ""}><label for="g-${k}">${esc(l)}</label>`).join("")}
    </div>
    <div class="chips" style="margin-top:8px">
      <input type="checkbox" id="w-home" ${f.homeOnly ? "checked" : ""} data-home-only><label for="w-home">Evde yapılabilir</label>
      <button type="button" class="btn sm outline hidden" data-clear>Filtreleri temizle</button>
    </div>
    ${build()}
    <p class="small muted hidden" style="text-align:center;margin-top:20px" data-empty>Bu filtrelere uyan hareket yok.</p>
  </div>`;
  const root = main.firstElementChild;
  bindDemoClicks(root);
  const sel = root.querySelector("[data-muscle-select]");
  const setMuscle = (m) => {
    f.muscle = m;
    sel.value = m;
    root.querySelector("[data-map]").innerHTML = mapHtml();
    filter(root);
  };
  root.querySelector("[data-q]").addEventListener("input", (e) => { f.query = e.target.value; filter(root); });
  root.querySelector("[data-back]").addEventListener("click", () => ctx.go("program"));
  root.querySelector("[data-map]").addEventListener("click", (e) => {
    const p = e.target.closest("[data-muscle]");
    if (p) setMuscle(f.muscle === p.dataset.muscle ? "" : p.dataset.muscle);
  });
  sel.addEventListener("change", () => setMuscle(sel.value));
  root.querySelectorAll('input[name="gear"]').forEach((r) => r.addEventListener("change", () => { f.gear = r.value; filter(root); }));
  root.querySelector("[data-home-only]").addEventListener("change", (e) => { f.homeOnly = e.target.checked; filter(root); });
  root.querySelector("[data-clear]").addEventListener("click", () => {
    Object.assign(f, { query: "", homeOnly: false, gear: "", muscle: "" });
    render(main, ctx);
  });
  filter(root);
}
