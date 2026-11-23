// Hareket kütüphanesi: kas grubuna göre gruplu, aranabilir; dokununca animasyon penceresi açılır
import { EX, equipmentOf, EQUIPMENT } from "../data/exercises.js";
import { EXERCISE_INFO } from "../data/demos.js";
import { esc } from "./dom.js";
import { thumbSvg, bindDemoClicks } from "./demo.js";

const GROUPS = {
  squat: "Squat / Bacak", hinge: "Deadlift / Kalça", hpush: "Göğüs (yatay itiş)", hpull: "Sırt (yatay çekiş)",
  vpush: "Omuz (dikey itiş)", vpull: "Sırt (dikey çekiş)", lunge: "Tek bacak", legcurl: "Arka bacak",
  legext: "Ön bacak", calf: "Baldır", lateral: "Yan omuz", facepull: "Arka omuz", biceps: "Biseps",
  triceps: "Triseps", chestfly: "Göğüs izolasyon", core: "Core",
};
let html = null; // önizlemeler bir kez üretilir
let query = "";
let homeOnly = false;
const norm = (s) => s.toLocaleLowerCase("tr");
const EQ_SHORT = Object.fromEntries(EQUIPMENT.map(([k, l]) => [k, l.split(" /")[0]]));
const eqText = (name) => {
  const eq = equipmentOf(name);
  return eq.includes("gym") ? "Salon" : eq.length ? "Ev · " + eq.map((k) => EQ_SHORT[k]).join(" + ") : "Ev · ekipmansız";
};

function build() {
  return Object.entries(GROUPS).map(([k, title]) => `
    <section data-group="${k}">
      <div class="section-title">${title}</div>
      <div class="lib-grid">${EX[k].map((e) => `
        <button type="button" class="lib-item" data-demo="${esc(e.name)}" data-home="${equipmentOf(e.name).includes("gym") ? 0 : 1}" data-search="${esc(norm(e.name + " " + title + " " + (EXERCISE_INFO[e.name]?.m || "") + " " + eqText(e.name)))}">
          ${thumbSvg(e.name)}<span>${esc(e.name)}</span><small class="tiny muted" style="display:block;margin:2px 2px 0">${esc(eqText(e.name))}</small></button>`).join("")}</div>
    </section>`).join("");
}

function filter(root) {
  const q = norm(query.trim());
  root.querySelectorAll("[data-group]").forEach((g) => {
    let any = false;
    g.querySelectorAll(".lib-item").forEach((it) => {
      const hit = (!q || it.dataset.search.includes(q)) && (!homeOnly || it.dataset.home === "1");
      it.classList.toggle("hidden", !hit);
      any ||= hit;
    });
    g.classList.toggle("hidden", !any);
  });
}

export function render(main, ctx) {
  html ??= build();
  main.innerHTML = `<div class="tab">
    <button type="button" class="btn sm" style="margin-bottom:12px" data-back>‹ Programa dön</button>
    <input class="search" type="search" placeholder="Hareket veya kas ara (ör. squat, omuz, bant)" value="${esc(query)}" aria-label="Hareket ara" data-q>
    <div class="chips" style="margin-top:10px" role="group" aria-label="Yer filtresi">
      <input type="radio" name="where" id="w-all" value="0" ${homeOnly ? "" : "checked"}><label for="w-all">Tümü</label>
      <input type="radio" name="where" id="w-home" value="1" ${homeOnly ? "checked" : ""}><label for="w-home">Evde yapılabilir</label>
    </div>
    ${html}
  </div>`;
  const root = main.firstElementChild;
  bindDemoClicks(root);
  root.querySelector("[data-q]").addEventListener("input", (e) => { query = e.target.value; filter(root); });
  root.querySelector("[data-back]").addEventListener("click", () => ctx.go("program"));
  root.querySelectorAll('input[name="where"]').forEach((r) => r.addEventListener("change", () => { homeOnly = r.value === "1" && r.checked; filter(root); }));
  filter(root);
}
