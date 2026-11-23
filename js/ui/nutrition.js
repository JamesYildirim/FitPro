// Beslenme sekmesi: günlük kalori/makro paneli, öğün kayıtları, hızlı ekleme, kilo takibi
import { state, save, dayKey } from "../state/store.js";
import { burnedKcal, kcalFromMacros } from "../core/nutrition.js";
import { esc, fmt, fmtDate, icon, toast, openSheet, DAY_MS } from "./dom.js";
import { dailyTargets, profileChanges } from "./plan.js";
import { pickerHtml, initPickers } from "./wheel.js";

const MEALS = [["kahvalti", "Kahvaltı"], ["ogle", "Öğle"], ["aksam", "Akşam"], ["ara", "Ara öğün"]];
const mealLabel = (k) => MEALS.find(([m]) => m === k)?.[1] || k;
let viewDay = dayKey();

const shiftDay = (key, n) => dayKey(new Date(new Date(key + "T12:00:00").getTime() + n * DAY_MS));
const entriesOf = (key) => state.food[key] || [];
const sum = (list) => list.reduce((a, e) => ({
  kcal: a.kcal + e.kcal * e.qty, p: a.p + e.p * e.qty, c: a.c + e.c * e.qty, f: a.f + e.f * e.qty,
}), { kcal: 0, p: 0, c: 0, f: 0 });
const r = (x) => Math.round(x);

// Antrenman geçmişinden o gün yakılan tahmini kalori
function burnedOn(key) {
  const kg = state.profile?.weight || 75;
  return state.history.filter((h) => dayKey(h.date) === key).reduce((a, h) => a + burnedKcal(h.minutes, kg), 0);
}

function ring(eaten, target) {
  const C = 2 * Math.PI * 52, ratio = target ? Math.min(1, eaten / target) : 0, over = eaten > target;
  const left = r(target - eaten);
  return `<div class="ring" style="width:170px;height:170px;margin:4px auto">
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="9"/>
      <circle cx="60" cy="60" r="52" fill="none" stroke-width="9" stroke-linecap="round" stroke="${over ? "var(--orange)" : "var(--lime)"}"
        stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - ratio)).toFixed(1)}"/>
    </svg>
    <div class="val"><b style="font-size:32px">${fmt(Math.abs(left), 0)}</b><span>${over ? "kcal fazla" : "kcal kaldı"}</span></div>
  </div>`;
}

function macroBar(label, eaten, target) {
  const pct = target ? Math.min(100, (eaten / target) * 100) : 0;
  return `<div>
    <div class="between tiny"><b>${label}</b><span class="muted">${fmt(r(eaten), 0)} / ${target} g</span></div>
    <div class="bar" style="margin-top:4px"><i style="width:${pct}%;${eaten > target * 1.1 ? "background:var(--orange)" : ""}"></i></div>
  </div>`;
}

function summaryCard(t, tot, burned) {
  return `<div class="card">
    <div class="row" style="justify-content:space-between;align-items:center">
      <div style="text-align:center;flex:1"><b style="font-size:18px">${fmt(r(tot.kcal), 0)}</b><div class="tiny muted">yenen</div></div>
      ${ring(tot.kcal, t.kcal)}
      <div style="text-align:center;flex:1"><b style="font-size:18px">${fmt(burned, 0)}</b><div class="tiny muted">antrenman*</div></div>
    </div>
    <div class="stack" style="margin-top:12px">
      ${macroBar("Protein", tot.p, t.protein)}${macroBar("Karbonhidrat", tot.c, t.carbs)}${macroBar("Yağ", tot.f, t.fat)}
    </div>
    <p class="tiny muted" style="margin:12px 0 0">Günlük hedef ${fmt(t.kcal, 0)} kcal (koruma ~${fmt(t.plan.tdee, 0)} kcal). *Antrenmanda yakılan kalori bilgi amaçlıdır: hedefe aktivite zaten dahil olduğu için ayrıca eklenmez.</p>
  </div>`;
}

function mealCard(key, list) {
  const tot = sum(list);
  const yesterday = entriesOf(shiftDay(viewDay, -1)).filter((e) => e.meal === key);
  return `<div class="card tight" data-meal="${key}">
    <div class="between">
      <div><b>${mealLabel(key)}</b> <span class="tiny muted">${list.length ? `${fmt(r(tot.kcal), 0)} kcal` : ""}</span></div>
      <button type="button" class="btn sm outline" data-add="${key}" aria-label="${mealLabel(key)} öğününe yiyecek ekle">${icon("plus")} Ekle</button>
    </div>
    ${list.map((e) => `
      <button type="button" class="food-row" data-edit="${esc(e.id)}">
        <span class="food-main"><b>${esc(e.name)}</b><span class="tiny muted">${e.portion ? esc(e.portion) + " · " : ""}${e.qty !== 1 ? `${fmt(e.qty)} porsiyon · ` : ""}P ${fmt(r(e.p * e.qty), 0)} · K ${fmt(r(e.c * e.qty), 0)} · Y ${fmt(r(e.f * e.qty), 0)} g</span></span>
        <span class="food-kcal">${fmt(r(e.kcal * e.qty), 0)}<small> kcal</small></span>
      </button>`).join("")}
    ${!list.length && yesterday.length ? `<button type="button" class="btn sm block" style="margin-top:8px" data-copy="${key}">${icon("swap")} Dünkü gibi (${fmt(r(sum(yesterday).kcal), 0)} kcal)</button>` : ""}
  </div>`;
}

// Kilo grafiği: son 30 tartım, tek seri çizgi (gösterge yok, başlık seriyi adlandırır)
function weightChart(ws) {
  if (ws.length < 2) return `<p class="tiny muted" style="margin:8px 0 0">Grafik için en az 2 tartım gerekiyor. En doğru sonuç için her sabah aynı koşullarda tartıl.</p>`;
  const pts = ws.slice(-30), W = 320, H = 110, pad = { l: 30, r: 8, t: 10, b: 18 };
  const vals = pts.map((w) => w.kg), lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  const x = (i) => pad.l + (W - pad.l - pad.r) * (pts.length === 1 ? 0.5 : i / (pts.length - 1));
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo || 1));
  const d = pts.map((w, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(w.kg).toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" style="height:110px;margin-top:8px" role="img" aria-label="Kilo grafiği, son ${pts.length} tartım">
    ${[lo, hi].map((v) => `<line class="gl" x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${pad.l - 5}" y="${y(v) + 3}" text-anchor="end">${v}</text>`).join("")}
    <path d="${d}" fill="none" stroke="var(--lime)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${x(pts.length - 1)}" cy="${y(last.kg)}" r="4" fill="var(--lime)" stroke="var(--card)" stroke-width="2"/>
    <text x="${pad.l}" y="${H - 4}">${fmtDate(pts[0].date + "T12:00:00")}</text>
    <text x="${W - pad.r}" y="${H - 4}" text-anchor="end">${fmtDate(last.date + "T12:00:00")}</text>
  </svg>`;
}

function weightCard() {
  const ws = state.weights;
  const last = ws[ws.length - 1];
  const weekAgo = [...ws].reverse().find((w) => w.date <= shiftDay(dayKey(), -7));
  const change = last && weekAgo ? Math.round((last.kg - weekAgo.kg) * 10) / 10 : null;
  const avg7 = (() => {
    const recent = ws.filter((w) => w.date > shiftDay(dayKey(), -7));
    return recent.length ? recent.reduce((a, w) => a + w.kg, 0) / recent.length : null;
  })();
  return `<div class="card">
    <div class="between"><b>Kilo takibi</b>${state.profile ? `<span class="tiny muted">hedef ${fmt(state.profile.target)} kg</span>` : ""}</div>
    <form style="margin-top:10px" data-weight>
      ${pickerHtml({ name: "kg", label: last && last.date === dayKey() ? "Bugünkü kilo (kaydedildi)" : "Bugünkü kilo", min: 35, max: 250,
        value: last?.kg ?? state.profile?.weight ?? 75, unit: "kg", decimal: true })}
      <button type="submit" class="btn primary block" style="margin-top:-4px">Kiloyu kaydet</button>
    </form>
    ${last ? `<div class="stats three" style="margin-top:10px">
      <div class="stat"><b>${fmt(last.kg)}</b><span>son (${fmtDate(last.date + "T12:00:00")})</span></div>
      <div class="stat"><b>${avg7 != null ? fmt(Math.round(avg7 * 10) / 10) : "—"}</b><span>7 gün ort.</span></div>
      <div class="stat"><b>${change != null ? (change > 0 ? "+" : "") + fmt(change) : "—"}</b><span>1 haftada</span></div>
    </div>` : ""}
    ${weightChart(ws)}
  </div>`;
}

// Hızlı ekleme listesi: favoriler + son eklenenler (tekil)
function quickItems() {
  const seen = new Set(state.favorites.map((f) => f.name.toLocaleLowerCase("tr")));
  const recent = [];
  for (const key of Object.keys(state.food).sort().reverse()) {
    for (const e of [...state.food[key]].reverse()) {
      const k = e.name.toLocaleLowerCase("tr");
      if (seen.has(k)) continue;
      seen.add(k);
      recent.push({ name: e.name, portion: e.portion, kcal: e.kcal, p: e.p, c: e.c, f: e.f });
      if (recent.length >= 12) return { fav: state.favorites, recent };
    }
  }
  return { fav: state.favorites, recent };
}

function openFoodSheet(ctx, meal, existing = null) {
  const { fav, recent } = quickItems();
  const item = (f, i, kind) => `<button type="button" class="food-row" data-quick="${kind}:${i}">
      <span class="food-main"><b>${esc(f.name)}</b><span class="tiny muted">${f.portion ? esc(f.portion) + " · " : ""}P ${fmt(f.p, 0)} · K ${fmt(f.c, 0)} · Y ${fmt(f.f, 0)} g</span></span>
      <span class="food-kcal">${fmt(f.kcal, 0)}<small> kcal</small></span></button>`;
  const e = existing || { name: "", portion: "", qty: 1, kcal: "", p: "", c: "", f: "" };
  const isFav = existing && state.favorites.some((f) => f.name === existing.name);
  const num = (name, label, val, attrs = "") => `<div class="field" style="margin-bottom:10px"><label class="label" for="f-${name}">${label}</label>
    <input class="input" id="f-${name}" name="${name}" type="number" inputmode="decimal" min="0" step="0.1" value="${val === "" ? "" : esc(val)}" ${attrs}></div>`;

  const sheet = openSheet(`
    <div class="between">
      <div><div class="eyebrow">${mealLabel(existing ? existing.meal : meal)}</div><div class="h2">${existing ? "Kaydı düzenle" : "Yiyecek ekle"}</div></div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    ${!existing && (fav.length || recent.length) ? `
      ${fav.length ? `<div class="section-title" style="margin-top:14px">Favoriler</div>${fav.map((f, i) => item(f, i, "fav")).join("")}` : ""}
      ${recent.length ? `<div class="section-title" style="margin-top:14px">Son eklenenler</div>${recent.map((f, i) => item(f, i, "recent")).join("")}` : ""}
      <div class="section-title" style="margin-top:16px">Yeni yiyecek</div>` : `<div style="height:12px"></div>`}
    <form data-food novalidate>
      <div class="field" style="margin-bottom:10px"><label class="label" for="f-name">Yiyecek adı</label>
        <input class="input" id="f-name" name="name" required maxlength="80" value="${esc(e.name)}" placeholder="ör. Tavuklu pilav"></div>
      <div class="grid2">
        <div class="field" style="margin-bottom:10px"><label class="label" for="f-portion">Porsiyon</label>
          <input class="input" id="f-portion" name="portion" maxlength="40" value="${esc(e.portion)}" placeholder="ör. 1 tabak / 150 g"></div>
        ${num("qty", "Porsiyon sayısı", e.qty, 'step="0.5" min="0.5"')}
      </div>
      <p class="tiny muted" style="margin:0 0 8px">Aşağıdaki değerler <b>1 porsiyon</b> içindir. Kaloriyi boş bırakırsan makrolardan hesaplanır.</p>
      <div class="grid2">${num("kcal", "Kalori (kcal)", e.kcal)}${num("p", "Protein (g)", e.p)}${num("c", "Karbonhidrat (g)", e.c)}${num("f", "Yağ (g)", e.f)}</div>
      <label class="row small" style="margin:4px 0 12px;gap:8px"><input type="checkbox" name="fav" ${isFav ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--lime)"> Favorilere ekle</label>
      <p class="small hidden" style="color:var(--red);margin:0 0 10px" data-err></p>
      <div class="${existing ? "grid2" : ""}">
        ${existing ? `<button type="button" class="btn danger" data-del>${icon("trash")} Sil</button>` : ""}
        <button type="submit" class="btn primary ${existing ? "" : "block"}">${existing ? "Kaydet" : "Ekle"}</button>
      </div>
    </form>`, { label: "Yiyecek ekle" });

  const el = sheet.el, form = el.querySelector("[data-food]");
  const addEntry = (data) => {
    (state.food[viewDay] ||= []).push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), meal, ...data });
  };
  el.addEventListener("click", (ev) => {
    const q = ev.target.closest("[data-quick]");
    if (q) {
      const [kind, i] = q.dataset.quick.split(":");
      const f = (kind === "fav" ? fav : recent)[+i];
      addEntry({ name: f.name, portion: f.portion || "", qty: 1, kcal: f.kcal, p: f.p, c: f.c, f: f.f });
      save(); sheet.close(); toast(`${f.name} eklendi`); ctx.refresh();
    }
    if (ev.target.closest("[data-del]")) {
      state.food[viewDay] = entriesOf(viewDay).filter((x) => x.id !== existing.id);
      save(); sheet.close(); toast("Kayıt silindi"); ctx.refresh();
    }
  });
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(form), n = (k) => (fd.get(k) === "" ? null : Math.max(0, Number(fd.get(k))));
    const name = String(fd.get("name")).trim();
    const p = n("p") ?? 0, c = n("c") ?? 0, f = n("f") ?? 0;
    const kcal = n("kcal") ?? kcalFromMacros(p, c, f);
    const qty = n("qty") || 1;
    const err = el.querySelector("[data-err]");
    const msg = !name ? "Yiyecek adını yaz." : !(kcal > 0) ? "Kalori ya da en az bir makro değeri gir." : "";
    err.textContent = msg; err.classList.toggle("hidden", !msg);
    if (msg) return;
    const data = { name, portion: String(fd.get("portion")).trim(), qty, kcal: Math.round(kcal), p, c, f };
    if (existing) Object.assign(existing, data); else addEntry(data);
    // Favori listesi: ada göre tekil
    const favIdx = state.favorites.findIndex((x) => x.name.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"));
    const favData = { name, portion: data.portion, kcal: data.kcal, p, c, f };
    if (fd.get("fav")) { if (favIdx >= 0) state.favorites[favIdx] = favData; else state.favorites.push(favData); }
    else if (favIdx >= 0 && existing) state.favorites.splice(favIdx, 1);
    save(); sheet.close(); toast(existing ? "Kayıt güncellendi" : `${name} eklendi`); ctx.refresh();
  });
  if (!existing && !fav.length && !recent.length) el.querySelector("#f-name").focus();
}

export function render(main, ctx) {
  if (!state.profile) {
    main.innerHTML = `<div class="tab"><div class="card empty"><div class="logo">${icon("user")}</div>
      <div class="h3" style="color:var(--text)">Önce profilini doldur</div>
      <p class="small">Kalori ve makro hedeflerin yaş, boy, kilo ve hedefine göre hesaplanır.</p>
      <button type="button" class="btn primary" data-go="profile">Profile git</button></div></div>`;
    main.querySelector("[data-go]").addEventListener("click", () => ctx.go("profile"));
    return;
  }
  const today = dayKey();
  if (viewDay > today) viewDay = today;
  const t = dailyTargets();
  const list = entriesOf(viewDay);
  const tot = sum(list);
  const label = viewDay === today ? "Bugün" : viewDay === shiftDay(today, -1) ? "Dün" : fmtDate(viewDay + "T12:00:00", { weekday: "long", day: "numeric", month: "long" });

  main.innerHTML = `<div class="tab">
    <div class="between" style="margin-bottom:12px">
      <button type="button" class="icon-btn" data-day="-1" aria-label="Önceki gün">‹</button>
      <div style="text-align:center"><b>${label}</b><div class="tiny muted">${fmtDate(viewDay + "T12:00:00", { day: "numeric", month: "long", year: "numeric" })}</div></div>
      <button type="button" class="icon-btn" data-day="1" aria-label="Sonraki gün" ${viewDay === today ? "disabled style=\"opacity:.35\"" : ""}>›</button>
    </div>
    ${summaryCard(t, tot, burnedOn(viewDay))}
    ${MEALS.map(([k]) => mealCard(k, list.filter((e) => e.meal === k))).join("")}
    <div class="section-title">Kilo</div>
    ${weightCard()}
  </div>`;

  const root = main.firstElementChild;
  initPickers(root);
  root.addEventListener("click", (e) => {
    const d = e.target.closest("[data-day]");
    if (d && !d.disabled) { viewDay = shiftDay(viewDay, +d.dataset.day); return ctx.refresh(); }
    const add = e.target.closest("[data-add]");
    if (add) return openFoodSheet(ctx, add.dataset.add);
    const ed = e.target.closest("[data-edit]");
    if (ed) return openFoodSheet(ctx, null, entriesOf(viewDay).find((x) => x.id === ed.dataset.edit));
    const cp = e.target.closest("[data-copy]");
    if (cp) {
      const meal = cp.dataset.copy;
      const items = entriesOf(shiftDay(viewDay, -1)).filter((x) => x.meal === meal);
      (state.food[viewDay] ||= []).push(...items.map((x) => ({ ...x, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6) })));
      save(); toast(`${mealLabel(meal)}: dünkü ${items.length} kayıt eklendi`); ctx.refresh();
    }
  });
  root.querySelector("[data-weight]").addEventListener("submit", (e) => {
    e.preventDefault();
    const kg = Number(new FormData(e.target).get("kg"));
    if (!(kg >= 35 && kg <= 250)) return toast("Geçerli bir kilo gir (35–250 kg)");
    const key = dayKey();
    state.weights = state.weights.filter((w) => w.date !== key).concat({ date: key, kg: Math.round(kg * 10) / 10 }).sort((a, b) => (a.date < b.date ? -1 : 1));
    const wasStale = profileChanges().length > 0;
    state.profile.weight = Math.round(kg * 10) / 10; // kalori/makro hedefleri güncel kiloya göre hesaplanır
    save();
    toast(!wasStale && profileChanges().length ? "Kaydedildi · kilon 2 kg'dan fazla değişti, programı güncellemen önerilir" : "Kilo kaydedildi");
    ctx.refresh();
  });
}
