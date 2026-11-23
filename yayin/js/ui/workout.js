// Antrenman sekmesi: seansı başlat, set set kilo/tekrar kaydet, dinlenme sayacı, seansı bitir → geçmiş
import { state, save } from "../state/store.js";
import { suggest, setsText, isTimed, isBodyweight, isBand } from "../core/progression.js";
import { esc, fmt, fmtDate, icon, toast, vibrate, todayName, DAY_MS, ask } from "./dom.js";
import { bindDemoClicks } from "./demo.js";
import { nextTrainingDay } from "./plan.js";
import { startRest } from "./timer.js";

// Programdaki bir günü aktif seansa çevirir; öneri motorunun kilo/tekrarlarıyla doldurur
// Promise<boolean>: seans başlatıldı mı
export async function startSession(dayIndex) {
  const day = state.program?.week[dayIndex];
  if (!day || day.rest) return false;
  if (state.active && state.active.exercises.some((e) => e.log.some((s) => s.done))) {
    const ok = await ask(`Devam eden "${state.active.title}" seansında kaydedilmiş setler var. Yeni seans başlarsa bu setler silinir.`,
      { title: "Yeni seans başlatılsın mı?", ok: "Sil ve başlat", cancel: "Mevcut seansa dön", danger: true });
    if (!ok) return false;
  }
  state.active = {
    dayIndex, title: `${day.day} · ${day.title}`, startedAt: Date.now(),
    exercises: day.exercises.map((e) => {
      const sg = suggest(state.history, { name: e.name, pool: e.pool, role: e.role, baseReps: e.baseReps || e.reps });
      return {
        name: e.name, pool: e.pool, role: e.role, baseReps: e.baseReps || e.reps, reps: e.reps, rest: e.rest, restS: e.restS || 90,
        sugg: { kind: sg.kind, text: sg.text, last: sg.last ? { date: sg.last.date, sets: sg.last.sets } : null },
        log: Array.from({ length: e.sets }, () => ({ kg: sg.kg ?? "", reps: sg.reps ?? "", done: false })),
      };
    }),
  };
  save();
  return true;
}

function totals(a) {
  let sets = 0, done = 0, volume = 0;
  for (const e of a.exercises) for (const s of e.log) {
    sets++;
    if (s.done) { done++; volume += (Number(s.kg) || 0) * (Number(s.reps) || 0); }
  }
  return { sets, done, volume, pct: sets ? Math.round((done / sets) * 100) : 0 };
}

// Promise<entry | null | false>: kaydedilen seans · null: kayıtsız kapatıldı · false: vazgeçildi
async function finishSession() {
  const a = state.active;
  const exercises = a.exercises.map((e) => ({
    name: e.name, pool: e.pool, role: e.role, baseReps: e.baseReps,
    sets: e.log.filter((s) => s.done && Number(s.reps) > 0).map((s) => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) })),
  })).filter((e) => e.sets.length);
  if (!exercises.length) {
    const ok = await ask("Hiç set onaylanmadı (✓). Seans kaydedilmeden kapatılsın mı?", { title: "Kaydedilecek set yok", ok: "Kapat", cancel: "Seansa dön" });
    if (!ok) return false;
    state.active = null; save(); return null;
  }
  const entry = {
    id: Date.now().toString(36), date: new Date().toISOString(), title: a.title,
    minutes: Math.max(1, Math.round((Date.now() - a.startedAt) / 60000)), exercises,
  };
  state.history.unshift(entry);
  state.active = null;
  save();
  return entry;
}

const sessionVolume = (h) => h.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.kg * s.reps, 0), 0);
const sessionSets = (h) => h.exercises.reduce((a, e) => a + e.sets.length, 0);

function lastSessionCard() {
  const h = state.history[0];
  if (!h) return "";
  return `<div class="card">
    <div class="eyebrow">Son antrenman</div>
    <div class="between"><div class="h3">${esc(h.title)}</div><span class="tiny muted">${fmtDate(h.date, { day: "numeric", month: "long" })}</span></div>
    <div class="stats three" style="margin-top:10px">
      <div class="stat"><b>${sessionSets(h)}</b><span>set</span></div>
      <div class="stat"><b>${fmt(sessionVolume(h), 0)}</b><span>kg toplam</span></div>
      <div class="stat"><b>${h.minutes}</b><span>dakika</span></div>
    </div></div>`;
}

function idleView() {
  if (!state.program) {
    return `<div class="card empty"><div class="logo">${icon("calendar")}</div>
      <div class="h3" style="color:var(--text)">Henüz programın yok</div>
      <p class="small">Profilini doldurup hedefine göre haftalık program oluştur.</p>
      <button type="button" class="btn primary" data-go="${state.profile ? "program" : "profile"}">${state.profile ? "Program oluştur" : "Profili doldur"}</button></div>`;
  }
  const next = nextTrainingDay();
  const week = state.program.week;
  const weekAgo = Date.now() - 7 * DAY_MS;
  const thisWeek = state.history.filter((h) => new Date(h.date).getTime() > weekAgo).length;
  const planned = week.filter((d) => !d.rest).length;
  const isToday = next && next.offset === 0;
  return `
    <div class="card">
      <div class="eyebrow">${isToday ? "Bugün · " + todayName() : "Bugün dinlenme günü"}</div>
      ${next ? `<div class="h2">${esc(next.day.title)}</div>
        <div class="small muted">${isToday ? "" : `Sıradaki antrenman: ${next.day.day} · `}${next.day.exercises.length} hareket · ~${next.day.minutes || "?"} dk</div>
        <button type="button" class="btn primary block" style="margin-top:14px" data-start="${next.index}">${icon("play")} ${isToday ? "Antrenmanı başlat" : "Yine de şimdi başlat"}</button>` : ""}
      <div style="margin-top:14px"><div class="between tiny muted"><span>Son 7 gün</span><span>${thisWeek} / ${planned} seans</span></div>
        <div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, (thisWeek / planned) * 100)}%"></i></div></div>
    </div>
    ${lastSessionCard()}
    <div class="section-title">Başka bir gün seç</div>
    <div class="card tight">${week.map((d, i) => d.rest ? "" : `
      <button type="button" class="between btn block" style="margin-top:${i ? 8 : 0}px;justify-content:space-between" data-start="${i}">
        <span>${esc(d.day)} · ${esc(d.title)}</span><span class="tiny muted">${d.exercises.length} hareket</span></button>`).join("")}
    </div>`;
}

function exerciseCard(e, i) {
  const timed = isTimed(e.reps);
  const bw = isBodyweight(e.name);
  const last = e.sugg.last ? `Son: ${setsText(e.sugg.last.sets)} (${fmtDate(e.sugg.last.date)})` : "İlk kez yapıyorsun";
  return `<div class="card" data-ex="${i}">
    <div class="ex-head">
      <div class="meta">
        <span class="tag">${esc(e.role)}</span>
        <button type="button" class="ex-name" style="margin-top:4px" data-demo="${esc(e.name)}">${esc(e.name)}</button>
        <div class="ex-sub">Hedef ${e.log.length} × ${esc(e.reps)} · dinlenme ${esc(e.rest)}</div>
      </div>
    </div>
    <div class="suggest ${e.sugg.kind}"><div class="tiny muted">${esc(last)}</div>${esc(e.sugg.text)}</div>
    <div class="set-head"><span>SET</span><span>${isBand(e.name) ? "BANT KG" : bw ? "EK KG" : "KG"}</span><span>${timed ? "SÜRE (SN)" : "TEKRAR"}</span><span></span></div>
    ${e.log.map((s, j) => `
      <div class="set-row ${s.done ? "done" : ""}">
        <span class="n">${j + 1}</span>
        <input type="number" inputmode="decimal" step="0.5" min="0" value="${esc(s.kg)}" placeholder="${bw ? "0" : "kg"}" data-k="kg" data-s="${j}" aria-label="${j + 1}. set kilo">
        <input type="number" inputmode="numeric" min="0" value="${esc(s.reps)}" placeholder="${timed ? "sn" : "tekrar"}" data-k="reps" data-s="${j}" aria-label="${j + 1}. set ${timed ? "süre" : "tekrar"}">
        <button type="button" class="check" data-done="${j}" aria-label="${j + 1}. seti ${s.done ? "geri al" : "tamamla"}" aria-pressed="${s.done}">${icon("check")}</button>
      </div>`).join("")}
    <button type="button" class="btn sm block" style="margin-top:8px" data-add>${icon("plus")} Set ekle</button>
  </div>`;
}

function activeView() {
  const a = state.active;
  const t = totals(a);
  const started = new Date(a.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `
    <div class="card">
      <div class="between">
        <div><div class="eyebrow">Aktif seans · ${started}</div><div class="h2">${esc(a.title)}</div></div>
        <div style="text-align:right"><div class="h2" style="color:var(--lime)">%${t.pct}</div>
          <div class="tiny muted">${t.done}/${t.sets} set · ${fmt(t.volume, 0)} kg</div></div>
      </div>
      <div class="bar" style="margin-top:12px"><i style="width:${t.pct}%"></i></div>
    </div>
    ${a.exercises.map(exerciseCard).join("")}
    <button type="button" class="btn primary block" data-finish>${icon("flag")} Antrenmanı bitir ve kaydet</button>
    <button type="button" class="btn danger block" style="margin-top:10px" data-cancel>Seansı iptal et</button>`;
}

export function render(main, ctx) {
  main.innerHTML = `<div class="tab">${state.active ? activeView() : idleView()}</div>`;
  const root = main.firstElementChild;
  bindDemoClicks(root);

  // Yazarken yeniden çizmeden kaydet (odak kaybolmasın)
  root.addEventListener("input", (e) => {
    const inp = e.target.closest("input[data-k]");
    if (!inp) return;
    const ex = state.active.exercises[+inp.closest("[data-ex]").dataset.ex];
    ex.log[+inp.dataset.s][inp.dataset.k] = inp.value === "" ? "" : Number(inp.value);
    save();
  });

  root.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) return ctx.go(go.dataset.go);
    const st = e.target.closest("[data-start]");
    if (st) { startSession(+st.dataset.start).then((ok) => ok && ctx.refresh()); return; }

    const card = e.target.closest("[data-ex]");
    const doneBtn = e.target.closest("[data-done]");
    if (doneBtn && card) {
      const ex = state.active.exercises[+card.dataset.ex];
      const s = ex.log[+doneBtn.dataset.done];
      if (!s.done && !(Number(s.reps) > 0)) { toast("Önce yaptığın tekrar sayısını gir"); card.querySelector(`input[data-k="reps"][data-s="${doneBtn.dataset.done}"]`)?.focus(); return; }
      s.done = !s.done;
      vibrate(s.done ? 40 : 15);
      save();
      if (s.done) {
        const all = state.active.exercises.every((x) => x.log.every((y) => y.done));
        if (all) toast("Tüm setler tamam! Antrenmanı bitirip kaydedebilirsin.");
        else { startRest(ex.restS); toast(`Set kaydedildi · ${ex.restS} sn dinlenme`); }
      }
      return ctx.refresh();
    }
    if (e.target.closest("[data-add]") && card) {
      const ex = state.active.exercises[+card.dataset.ex];
      const lastSet = ex.log[ex.log.length - 1] || { kg: "", reps: "" };
      ex.log.push({ kg: lastSet.kg, reps: lastSet.reps, done: false });
      save();
      return ctx.refresh();
    }
    if (e.target.closest("[data-finish]")) {
      (async () => {
        const t = totals(state.active);
        if (t.done > 0 && t.done < t.sets) {
          const ok = await ask(`${t.sets - t.done} set onaylanmadı. Yalnızca onayladığın (✓) ${t.done} set kaydedilecek.`,
            { title: "Antrenman bitirilsin mi?", ok: "Bitir ve kaydet", cancel: "Seansa dön" });
          if (!ok) return;
        }
        const entry = await finishSession();
        if (entry === false) return;
        if (entry) toast(`Kaydedildi: ${sessionSets(entry)} set · ${fmt(sessionVolume(entry), 0)} kg`);
        ctx.go("workout");
      })();
      return;
    }
    if (e.target.closest("[data-cancel]")) {
      ask("Bu seans ve girdiğin tüm setler silinecek. Antrenman geçmişine kaydedilmez.", { title: "Seans iptal edilsin mi?", ok: "Seansı sil", cancel: "Seansa dön", danger: true })
        .then((ok) => { if (ok) { state.active = null; save(); toast("Seans iptal edildi"); ctx.go("workout"); } });
    }
  });
}
