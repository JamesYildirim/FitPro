// Program sekmesi: hedef/gün/deneyim seçimi, haftalık program, hareket değiştirme
import { state, save } from "../state/store.js";
import { replaceExercise } from "../core/program.js";
import { openSwap } from "./swap.js";
import { EX, EQUIPMENT } from "../data/exercises.js";
import { esc, fmt, fmtDate, icon, toast, DAY_MS, shortDay, todayName } from "./dom.js";
import { bindDemoClicks } from "./demo.js";
import { createProgram, profileChanges, sexLabel } from "./plan.js";
import { startSession } from "./workout.js";

const OPTIONS = {
  location: [["salon", "Spor salonu"], ["ev", "Ev"]],
  goal: [["kas", "Kas kütlesi"], ["guc", "Güç"], ["yag", "Yağ yakımı"], ["kondisyon", "Kondisyon"]],
  days: [["3", "3 gün"], ["4", "4 gün"], ["5", "5 gün"]],
  level: [["baslangic", "Başlangıç"], ["orta", "Orta / İleri"]],
};
const LABELS = { location: "Nerede çalışacaksın?", goal: "Hedef", days: "Haftada kaç gün", level: "Deneyim" };

const equipmentBox = (location, equipment) => `
  <div class="field ${location === "ev" ? "" : "hidden"}" data-eqbox>
    <span class="label">Evdeki ekipmanların</span>
    <div class="chips">${EQUIPMENT.map(([k, l]) => `<input type="checkbox" name="eq" id="eq-${k}" value="${k}" ${equipment.includes(k) ? "checked" : ""}><label for="eq-${k}">${l}</label>`).join("")}</div>
    <p class="tiny muted" style="margin:8px 0 0">Hiçbirini seçmezsen program yalnızca vücut ağırlığıyla kurulur.</p>
  </div>`;
let selectedDay = null; // programda seçili gün indeksi

const chips = (key, value) => `
  <div class="field"><span class="label">${LABELS[key]}</span><div class="chips">
    ${OPTIONS[key].map(([v, l]) => `<input type="radio" name="${key}" id="${key}-${v}" value="${v}" ${String(value) === v ? "checked" : ""}><label for="${key}-${v}">${l}</label>`).join("")}
  </div></div>`;

function profileCard() {
  const p = state.profile;
  if (!p) return `<div class="notice orange"><b>Önce profilini doldur.</b> Yaş, boy ve kilo bilgilerin programı ve beslenme hedefini belirler.
    <div style="margin-top:10px"><button type="button" class="btn sm primary" data-go="profile">Profile git</button></div></div>`;
  return `<div class="between notice" style="margin-bottom:14px">
    <div><b>${p.age} yaş · ${sexLabel(p.sex)}</b><div class="tiny muted">${p.height} cm · ${fmt(p.weight)} kg → hedef ${fmt(p.target)} kg</div></div>
    <button type="button" class="btn sm outline" data-go="profile">Düzenle</button></div>`;
}

function changeBanner() {
  const ch = profileChanges();
  if (!ch.length) return "";
  return `<div class="notice orange"><b>Profilin bu program oluşturulduktan sonra değişti</b>
    <ul>${ch.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    <div class="small">Program, beslenme hedefi ve yaşa göre ayarlar eski bilgilere göre.</div>
    <button type="button" class="btn primary block" style="margin-top:10px" data-act="regen">Programı yeni profile göre oluştur</button></div>`;
}

function lockInfo(p) {
  const week = Math.floor((Date.now() - p.createdAt) / (7 * DAY_MS)) + 1;
  return `<div class="notice small">📌 <b>${fmtDate(p.createdAt, { day: "numeric", month: "long" })}</b> tarihinde oluşturuldu (${week}. hafta).
    İlerlemeyi takip edebilmek için aynı programa <b>6–8 hafta</b> devam et; önerilen yenileme: <b>${fmtDate(p.createdAt + 42 * DAY_MS, { day: "numeric", month: "long" })}</b> sonrası.</div>`;
}

function dayView(p, i) {
  const d = p.week[i];
  if (d.rest) return `<div class="card"><div class="h3">${esc(d.day)}</div><div class="small muted" style="margin-top:4px">Dinlenme / aktif toparlanma: yürüyüş, hafif esneme, iyi uyku.</div></div>`;
  return `<div class="card">
    <div class="between" style="margin-bottom:8px">
      <div><div class="eyebrow">${esc(d.day)}${d.day === todayName() ? " · bugün" : ""}</div><div class="h2">${esc(d.title)}</div>
        <div class="tiny muted">${d.exercises.length} hareket${d.minutes ? ` · ~${d.minutes} dk` : ""}</div></div>
    </div>
    ${d.exercises.map((e, j) => `
      <div class="plan-ex">
        <div style="min-width:0">
          <button type="button" class="ex-name" data-demo="${esc(e.name)}">${esc(e.name)}</button>
          <div class="ex-sub">${esc(e.role)} · dinlenme ${esc(e.rest)}</div>
        </div>
        <div class="rx"><b>${e.sets} × ${esc(e.reps)}</b>
          <button type="button" class="swap" data-swap="${j}" aria-label="${esc(e.name)} yerine alternatif seç" ${e.alts.length < 2 ? "disabled" : ""}>${icon("swap")}</button></div>
      </div>`).join("")}
    <button type="button" class="btn primary block" style="margin-top:12px" data-act="start">${icon("play")} Bu antrenmanı başlat</button>
  </div>`;
}

export function render(main, ctx) {
  const p = state.program;
  const prefs = state.prefs;
  if (p && (selectedDay == null || !p.week[selectedDay])) {
    const t = p.week.findIndex((d) => d.day === todayName());
    selectedDay = t >= 0 && !p.week[t].rest ? t : p.week.findIndex((d) => !d.rest);
  }

  main.innerHTML = `<div class="tab">
    ${profileCard()}
    <button type="button" class="btn block" style="margin-bottom:14px" data-go="library">${icon("grid")} Hareket kütüphanesi (${Object.values(EX).flat().length} hareket)</button>
    <form class="card" data-form>
      <div class="eyebrow" style="margin-bottom:10px">Program oluşturucu</div>
      ${chips("location", prefs.location || "salon")}${equipmentBox(prefs.location || "salon", prefs.equipment || [])}
      ${chips("goal", prefs.goal)}${chips("days", prefs.days)}${chips("level", prefs.level)}
      <button type="submit" class="btn primary block" ${state.profile ? "" : "disabled"}>${icon("bolt")} ${p ? "Yeni program oluştur" : "Program oluştur"}</button>
    </form>
    ${p ? `
      ${changeBanner()}
      <div class="tags" style="margin-bottom:10px">
        <span class="tag lime">${esc(p.meta.goal)}</span>${p.meta.place ? `<span class="tag orange">${esc(p.meta.place)}</span>` : ""}<span class="tag">${esc(p.meta.split)}</span><span class="tag">${esc(p.meta.level)}</span>
      </div>
      ${lockInfo(p)}
      <div class="day-pills" role="tablist" aria-label="Günler">
        ${p.week.map((d, i) => `<button type="button" role="tab" data-day="${i}" class="${d.rest ? "" : "train"}" aria-selected="${i === selectedDay}" aria-label="${esc(d.day)}${d.rest ? " (dinlenme)" : ""}">${esc(shortDay(d.day))}<i></i></button>`).join("")}
      </div>
      ${dayView(p, selectedDay)}
      <button type="button" class="btn outline block" data-act="reroll">${icon("swap")} Farklı varyasyon üret</button>
      <div class="section-title">Notlar ve ilerleme kuralları</div>
      <div class="card"><ul class="cues">${(p.notes || []).map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
      <p class="tiny muted" style="text-align:center">Genel bilgilendirme amaçlıdır. Sağlık sorunun varsa başlamadan önce bir uzmana danış.</p>
    ` : ""}
  </div>`;

  const root = main.firstElementChild;
  bindDemoClicks(root);
  const form = root.querySelector("[data-form]");
  const readForm = () => ({
    ...Object.fromEntries(["location", "goal", "days", "level"].map((k) => [k, form.elements[k].value])),
    equipment: [...form.querySelectorAll('input[name="eq"]:checked')].map((i) => i.value),
  });
  // Ev seçilince ekipman kutucukları görünür
  form.addEventListener("change", (e) => {
    if (e.target.name === "location") form.querySelector("[data-eqbox]").classList.toggle("hidden", e.target.value !== "ev");
  });
  const create = async (prefs) => {
    if (await createProgram(prefs)) { selectedDay = null; toast("Program oluşturuldu ve kas hacmi dengelendi"); ctx.refresh(); }
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); create(readForm()); });
  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) return ctx.go(go.dataset.go);
    const day = e.target.closest("[data-day]");
    if (day) { selectedDay = +day.dataset.day; return ctx.refresh(); }
    const sw = e.target.closest("[data-swap]");
    if (sw) {
      const dayIndex = selectedDay, exIndex = +sw.dataset.swap;
      openSwap(p.week[dayIndex], exIndex, (name) => {
        if (replaceExercise(p, dayIndex, exIndex, name)) { save(); ctx.refresh(); toast("Hareket değiştirildi"); }
      });
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "regen") create(p.input);
    if (act === "reroll") create(p.input);
    if (act === "start") startSession(selectedDay).then((ok) => ok && ctx.go("workout"));
  });
}
