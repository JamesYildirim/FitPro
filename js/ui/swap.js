// Hareket değiştirme penceresi: ekipman türüne göre filtrelenen alternatif listesi.
// Son seçilen filtre state.prefs.swapGear içinde hatırlanır.
import { state, save } from "../state/store.js";
import { GEAR, GEAR_LABEL, gearOf } from "../data/exercises.js";
import { EXERCISE_INFO } from "../data/demos.js";
import { esc, icon, openSheet } from "./dom.js";
import { openDemo } from "./demo.js";

// day: program günü, exIndex: değişecek hareket. onPick(name) seçimde çağrılır.
export function openSwap(day, exIndex, onPick) {
  const ex = day.exercises[exIndex];
  const taken = new Set(day.exercises.map((e) => e.name));
  const alts = ex.alts.filter((n) => n !== ex.name);
  const counts = Object.fromEntries(GEAR.map(([g]) => [g, alts.filter((n) => gearOf(n) === g).length]));
  // Hatırlanan filtrede bu hareket için seçenek yoksa "Tümü"ne düş
  let gear = state.prefs.swapGear;
  if (!counts[gear]) gear = "all";

  const chip = (g, label, n) => `<button type="button" class="gear-chip" data-gear="${g}" aria-pressed="${g === gear}" ${n ? "" : "disabled"}>${esc(label)} <small>${n}</small></button>`;
  const sheet = openSheet(`
    <div class="between" style="align-items:flex-start">
      <div>
        <div class="eyebrow">Hareketi değiştir</div>
        <div class="h2">${esc(ex.name)}</div>
        <div class="small muted">Salonunda hangi ekipman varsa onu seç</div>
      </div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    <div class="gear-chips" role="group" aria-label="Ekipman türü">
      ${chip("all", "Tümü", alts.length)}${GEAR.map(([g, l]) => chip(g, l, counts[g])).join("")}
    </div>
    <div class="swap-list" data-list></div>
  `, { label: ex.name + " yerine hareket seç" });

  const el = sheet.el;
  const list = el.querySelector("[data-list]");
  const draw = () => {
    const shown = alts.filter((n) => gear === "all" || gearOf(n) === gear);
    list.innerHTML = shown.map((n) => {
      const busy = taken.has(n);
      return `<div class="swap-row">
        <button type="button" class="swap-pick" data-pick="${esc(n)}" ${busy ? "disabled" : ""}>
          <b>${esc(n)}</b>
          <span class="tiny muted">${esc(GEAR_LABEL[gearOf(n)])}${EXERCISE_INFO[n]?.m ? " · " + esc(EXERCISE_INFO[n].m) : ""}${busy ? " · bu günde zaten var" : ""}</span>
        </button>
        <button type="button" class="swap-info" data-info="${esc(n)}" aria-label="${esc(n)} önizle">${icon("play")}<span>Önizle</span></button>
      </div>`;
    }).join("") || `<p class="small muted">Bu ekipmanla uygun alternatif yok.</p>`;
  };
  draw();

  el.addEventListener("click", (e) => {
    const g = e.target.closest("[data-gear]");
    if (g && !g.disabled) {
      gear = g.dataset.gear;
      state.prefs.swapGear = gear;
      save();
      el.querySelectorAll("[data-gear]").forEach((b) => b.setAttribute("aria-pressed", String(b === g)));
      return draw();
    }
    const info = e.target.closest("[data-info]");
    if (info) return openDemo(info.dataset.info);
    const pick = e.target.closest("[data-pick]");
    if (pick && !pick.disabled) { sheet.close(); onPick(pick.dataset.pick); }
  });
}
