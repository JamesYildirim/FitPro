// Analiz sekmesi: seans hacmi grafiği, hareket bazında güç ilerlemesi, haftalık set dağılımı, beslenme, geçmiş
import { state, save, dayKey } from "../state/store.js";
import { dailyTargets } from "./plan.js";
import { e1rm, performances, setsText } from "../core/progression.js";
import { esc, fmt, fmtDate, icon, toast, DAY_MS, ask } from "./dom.js";
import { bodyMap, volumeLevels } from "./bodymap.js";

const vol = (h) => h.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.kg * s.reps, 0), 0);
const setCount = (h) => h.exercises.reduce((a, e) => a + e.sets.length, 0);

function summary() {
  const now = Date.now();
  const last7 = state.history.filter((h) => now - new Date(h.date).getTime() < 7 * DAY_MS);
  const last28 = state.history.filter((h) => now - new Date(h.date).getTime() < 28 * DAY_MS);
  return `<div class="stats three">
    <div class="stat"><b>${state.history.length}</b><span>toplam seans</span></div>
    <div class="stat"><b>${last7.length}</b><span>son 7 gün</span></div>
    <div class="stat"><b>${fmt(last28.reduce((a, h) => a + vol(h), 0) / 1000, 1)} t</b><span>son 28 gün hacim</span></div>
  </div>`;
}

// Son 12 seansın toplam hacmi (kg × tekrar). Tek seri: gösterge yok, başlık seriyi adlandırır.
function volumeChart() {
  const hs = state.history.slice(0, 12).reverse();
  if (hs.length < 2) return `<p class="small muted">Grafik için en az 2 seans kaydı gerekiyor.</p>`;
  const W = 320, H = 150, pad = { l: 34, r: 6, t: 18, b: 22 };
  const max = Math.max(...hs.map(vol)) || 1;
  const nice = Math.ceil(max / 1000) * 1000 || 1000;
  const bw = (W - pad.l - pad.r) / hs.length;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / nice);
  const grid = [0, 0.5, 1].map((f) => `<line class="gl" x1="${pad.l}" x2="${W - pad.r}" y1="${y(nice * f)}" y2="${y(nice * f)}"/>
    <text x="${pad.l - 6}" y="${y(nice * f) + 3}" text-anchor="end">${fmt(nice * f / 1000, 1)}t</text>`).join("");
  const bars = hs.map((h, i) => {
    const v = vol(h), x = pad.l + i * bw + 2, w = Math.max(4, bw - 4), top = y(v), base = y(0), r = Math.min(4, w / 2, base - top);
    // Üst uçları 4px yuvarlatılmış, tabana oturan çubuk
    const d = `M${x},${base}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${base}Z`;
    const label = `${fmtDate(h.date)}: ${fmt(v, 0)} kg · ${setCount(h)} set`;
    return `<g class="bar-g" data-tip="${esc(label)}" tabindex="0" role="img" aria-label="${esc(label)}">
      <rect x="${pad.l + i * bw}" y="${pad.t}" width="${bw}" height="${H - pad.t - pad.b}" fill="transparent"/>
      <path class="bx ${i === hs.length - 1 ? "" : "dim"}" d="${d}"/></g>`;
  }).join("");
  const xl = [0, hs.length - 1].map((i) => `<text x="${pad.l + i * bw + bw / 2}" y="${H - 6}" text-anchor="middle">${fmtDate(hs[i].date)}</text>`).join("");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" data-chart>${grid}${bars}${xl}</svg>
    <div class="tiny muted" data-tipout style="min-height:18px;margin-top:4px">Değeri görmek için bir çubuğa dokun.</div>`;
}

// En çok yapılan hareketlerde tahmini 1RM değişimi (ilk kayıt → son kayıt)
function strength() {
  const counts = new Map();
  for (const h of state.history) for (const e of h.exercises) if (e.sets.some((s) => s.kg > 0)) counts.set(e.name, (counts.get(e.name) || 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!top.length) return `<p class="small muted">Ağırlıklı setler kaydettikçe burada hareket bazında güç ilerlemen görünecek.</p>`;
  return top.map(([name, n]) => {
    const perf = performances(state.history, name);
    const best = (p) => Math.max(...p.sets.map((s) => e1rm(s.kg, s.reps)));
    const bestSet = (p) => p.sets.reduce((a, s) => (e1rm(s.kg, s.reps) > e1rm(a.kg, a.reps) ? s : a));
    const now = best(perf[0]), first = best(perf[perf.length - 1]);
    const diff = Math.round((now - first) * 2) / 2;
    const bs = bestSet(perf[0]);
    const totalVol = perf.reduce((a, p) => a + p.sets.reduce((b, s) => b + s.kg * s.reps, 0), 0);
    // Tek seansta karşılaştırma yok: "İlk kayıt"; sonrasında ilk seansa göre değişim
    const change = perf.length < 2 ? `<span class="tag">İlk kayıt</span>`
      : `<span class="tag ${diff > 0 ? "lime" : diff < 0 ? "orange" : ""}">${diff > 0 ? "▲ +" : diff < 0 ? "▼ " : ""}${fmt(diff)} kg</span>`;
    return `<div class="hist">
      <div class="between" style="align-items:flex-start">
        <div style="min-width:0"><b class="small">${esc(name)}</b>
          <div class="tiny muted">En iyi set: ${fmt(bs.kg)} kg × ${bs.reps} · ${n} seans · toplam ${fmt(totalVol, 0)} kg</div></div>
        <div style="text-align:right;flex:none"><b>${fmt(now)} kg</b><div class="tiny muted">tahmini 1RM</div></div>
      </div>
      <div class="row" style="margin-top:6px">${change}<span class="tiny muted">${perf.length < 2 ? "Bir sonraki seanstan itibaren ilerleme gösterilir" : `ilk seanstan (${fmt(first)} kg) bu yana`}</span></div>
    </div>`;
  }).join("") + `<p class="tiny muted" style="margin-bottom:0">Tahmini 1RM: bir setteki kilo ve tekrardan hesaplanan, tek tekrarda kaldırabileceğin tahmini en yüksek ağırlık (Epley formülü). Farklı tekrar sayılarıyla yapılan seansları karşılaştırmayı sağlar.</p>`;
}

function volumeBars() {
  const rows = state.program?.volume;
  if (!rows) return `<p class="small muted">Program oluşturduğunda kas grubu başına haftalık set dağılımı burada görünür.</p>`;
  const scale = Math.max(...rows.map((r) => Math.max(r.max, r.sets))) || 1;
  const pct = (x) => (x / scale * 100).toFixed(1) + "%";
  const map = `<div class="bm-card" style="margin:0 0 12px">${bodyMap(volumeLevels(rows), { label: "Haftalık set dağılımı kas haritası" })}
    <div class="bm-legend"><span class="lo">Hedefin altında</span><span class="ok">Hedef aralığında</span><span class="hi">Hedefin üstünde</span></div></div>`;
  return map + rows.map((r) => {
    const cls = r.sets < r.min - 0.5 ? "low" : r.sets > r.max + 2 ? "high" : "";
    const state_ = cls === "low" ? "hedefin altında" : cls === "high" ? "hedefin üstünde" : "hedef aralığında";
    return `<div class="vrow" aria-label="${esc(r.label)}: ${fmt(r.sets)} set, ${state_}">
      <span>${esc(r.label)}</span>
      <div class="vbar" aria-hidden="true"><div class="vband" style="left:${pct(r.min)};width:${pct(r.max - r.min)}"></div><div class="vfill ${cls}" style="width:${pct(r.sets)}"></div></div>
      <span class="vnum">${fmt(r.sets)} <small>/ ${r.min}–${r.max}</small></span></div>`;
  }).join("") + `<p class="tiny muted">Gri bant hedef aralığı. Ana kas 1 set, yardımcı kas ½ set sayılır (kas grubu başına haftada ~10–20 zorlu set önerisi, hedef ve seviyene göre ölçeklendi).</p>`;
}

function nutrition() {
  const t = dailyTargets();
  if (!t) return `<p class="small muted">Profilini doldurunca kalori ve makro hedeflerin burada görünür.</p>`;
  const n = t.plan;
  const goal = n.mode === "ver" ? `${fmt(Math.abs(n.diff))} kg ver` : n.mode === "al" ? `${fmt(n.diff)} kg al` : "Kiloyu koru";
  // Son 7 günde kayıt girilen günlerin ortalaması
  const days = [];
  for (let i = 0; i < 7; i++) {
    const list = state.food[dayKey(new Date(Date.now() - i * DAY_MS))] || [];
    if (list.length) days.push(list.reduce((a, e) => ({ kcal: a.kcal + e.kcal * e.qty, p: a.p + e.p * e.qty }), { kcal: 0, p: 0 }));
  }
  const avg = days.length ? { kcal: days.reduce((a, d) => a + d.kcal, 0) / days.length, p: days.reduce((a, d) => a + d.p, 0) / days.length } : null;
  return `<div class="stats">
      <div class="stat"><b>${fmt(t.kcal, 0)}</b><span>kcal / gün hedef</span></div>
      <div class="stat"><b>${goal}</b><span>${n.mode === "koru" ? "hedef" : `~${n.weeks} hafta · haftada ~${fmt(n.rate)} kg`}</span></div>
      <div class="stat"><b>${t.protein} / ${t.carbs} / ${t.fat}</b><span>protein / karb. / yağ (g)</span></div>
      <div class="stat"><b>${fmt(n.bmi.value)}</b><span>BMI · ${n.bmi.cat}</span></div>
    </div>
    ${avg ? `<div class="notice small" style="margin:10px 0 0">Son 7 günde kayıt girdiğin ${days.length} günün ortalaması: <b>${fmt(Math.round(avg.kcal), 0)} kcal</b>, <b>${fmt(Math.round(avg.p), 0)} g protein</b>
      (hedefin %${Math.round((avg.kcal / t.kcal) * 100)}'i).</div>` : ""}
    <p class="tiny muted">Koruma kalorin ~${fmt(n.tdee, 0)} kcal (Mifflin-St Jeor tahmini), güncel kilona göre hesaplandı. 2–3 haftalık kilo değişimine bakıp ±100–200 kcal ayarla.</p>`;
}

function historyList() {
  if (!state.history.length) return `<p class="small muted">Tamamladığın antrenmanlar burada listelenir.</p>`;
  return state.history.slice(0, 30).map((h) => `<div class="hist">
    <div class="between"><b class="small">${esc(h.title)}</b>
      <button type="button" class="swap" style="margin:0" data-del="${esc(h.id)}" aria-label="${esc(h.title)} kaydını sil">${icon("trash")}</button></div>
    <div class="tiny muted">${fmtDate(h.date, { weekday: "short", day: "numeric", month: "long" })} · ${setCount(h)} set · ${fmt(vol(h), 0)} kg · ${h.minutes} dk</div>
    <div class="tiny" style="margin-top:4px;color:var(--text-2)">${h.exercises.map((e) => `${esc(e.name)}: ${esc(setsText(e.sets))}`).join("<br>")}</div>
  </div>`).join("");
}

export function render(main, ctx) {
  main.innerHTML = `<div class="tab">
    <div class="card">${summary()}</div>
    <div class="card"><div class="h3">Seans başına toplam hacim</div><div class="tiny muted" style="margin-bottom:8px">Son 12 seans · kg × tekrar</div>${volumeChart()}</div>
    <div class="card"><div class="h3" style="margin-bottom:6px">Güç ilerlemesi</div>${strength()}</div>
    <div class="card"><div class="h3" style="margin-bottom:10px">Haftalık set dağılımı (program)</div>${volumeBars()}</div>
    <div class="card"><div class="h3" style="margin-bottom:10px">Beslenme hedefi</div>${nutrition()}</div>
    <div class="card"><div class="h3" style="margin-bottom:6px">Antrenman geçmişi</div>${historyList()}</div>
  </div>`;
  const root = main.firstElementChild;
  const out = root.querySelector("[data-tipout]");
  const showTip = (e) => { const g = e.target.closest?.("[data-tip]"); if (g && out) out.textContent = g.dataset.tip; };
  root.querySelector("[data-chart]")?.addEventListener("pointerover", showTip);
  root.querySelector("[data-chart]")?.addEventListener("focusin", showTip);
  root.addEventListener("click", (e) => {
    showTip(e);
    const del = e.target.closest("[data-del]");
    if (del) {
      ask("Bu antrenman kaydı kalıcı olarak silinecek. Ağırlık önerileri de bu kayda dayanıyorsa değişir.", { title: "Kayıt silinsin mi?", ok: "Sil", danger: true })
        .then((ok) => {
          if (!ok) return;
          state.history = state.history.filter((h) => h.id !== del.dataset.del);
          save();
          toast("Kayıt silindi");
          ctx.refresh();
        });
    }
  });
}
