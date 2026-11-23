// Bulut eşitleme: cihazdaki veri her zaman localStorage'da durur (internetsiz çalışır);
// her değişiklikten ~2 sn sonra, uygulama açılınca, öne gelince ve internet gelince bulutla eşitlenir.
// Bulutta her kullanıcının verisi user_data tablosunda tek satırdır (bkz. supabase/schema.sql).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";
import { state, onSave, hasData, snapshot, replaceAll } from "../state/store.js";
import { validSession, signOut } from "./auth.js";
import { decide } from "./decide.js";
import { esc, fmtDate, openSheet, ask } from "../ui/dom.js";

const META_KEY = "antrenman.sync";
const PUSH_DELAY = 2000;

// ---------- Eşitleme bilgisi ----------
function readMeta() {
  try { return { userId: null, dirty: false, syncedAt: null, ...JSON.parse(localStorage.getItem(META_KEY) || "{}") }; }
  catch { return { userId: null, dirty: false, syncedAt: null }; }
}
function writeMeta(m) {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch {}
}

// ---------- Durum (Profil sekmesinde gösterilir) ----------
// state: "ok" | "syncing" | "pending" | "offline" | "error"
let status = { state: "pending", at: 0, error: "" };
const statusListeners = new Set();
export const getStatus = () => ({ ...status, dirty: readMeta().dirty });
export const onStatus = (fn) => { statusListeners.add(fn); return () => statusListeners.delete(fn); };
function setStatus(next) {
  status = { ...status, ...next };
  statusListeners.forEach((fn) => fn(getStatus()));
}

// ---------- Supabase veri API'si ----------
class SyncError extends Error {}
async function rest(session, method, path, body, extraHeaders = {}) {
  const send = (s) => fetch(SUPABASE_URL + "/rest/v1" + path, {
    method,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + s.access_token, "Content-Type": "application/json", ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  let res = await send(session);
  if (res.status === 401) { // erişim anahtarı süresi dolmuş olabilir: bir kez yenileyip tekrar dene
    const s = await validSession({ force: true });
    if (!s) throw new SyncError("signedout");
    res = await send(s);
  }
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new SyncError(d.message || `Sunucu hatası (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
const fetchRow = async (s) => (await rest(s, "GET", `/user_data?user_id=eq.${s.user.id}&select=data,updated_at`))[0] || null;
const pushRow = async (s, data) => (await rest(s, "POST", "/user_data?on_conflict=user_id", { user_id: s.user.id, data },
  { Prefer: "resolution=merge-duplicates,return=representation" }))[0];

// ---------- Çakışma sorusu ----------
const summary = (d) => {
  if (!d) return "Veri yok";
  const h = d.history || [];
  const last = h.length ? Math.max(...h.map((x) => x.date || 0)) : 0;
  return `${h.length} antrenman kaydı${last ? ` · son: ${fmtDate(last, { day: "numeric", month: "long" })}` : ""}${d.program ? " · program var" : ""}`;
};
// Arka plana dokunmak / Esc → null (karar verilmedi, değişiklik yapılmaz)
function chooseSide(cloudData) {
  return new Promise((resolve) => {
    let picked = null;
    const s = openSheet(`
      <div class="h2" style="margin-bottom:6px">Hangi veriler kalsın?</div>
      <p class="small" style="color:var(--text-2);margin:0 0 14px">Hem bu cihazda hem de hesabında farklı veriler var. Seçmediğin taraf silinir.</p>
      <button type="button" class="choice" data-pick="cloud"><b>Hesabımdakini kullan</b><span class="tiny muted">${esc(summary(cloudData))}</span></button>
      <button type="button" class="choice" data-pick="local"><b>Bu cihazdakini kullan</b><span class="tiny muted">${esc(summary(state))}</span></button>
      <button type="button" class="btn block" style="margin-top:6px" data-close>Sonra karar ver</button>
    `, { label: "Hangi veriler kalsın?", onClose: () => resolve(picked) });
    s.el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pick]");
      if (b) { picked = b.dataset.pick; s.close(); }
    });
  });
}

// ---------- Eşitleme ----------
let running = null, again = false, pushTimer = 0, seq = 0;
let onReplaced = () => {}, onSignedOut = () => {};

export function syncNow() {
  if (running) { again = true; return running; }
  running = (async () => {
    try { await doSync(); }
    finally {
      running = null;
      if (again) { again = false; syncNow(); }
    }
  })();
  return running;
}

async function doSync() {
  if (!navigator.onLine) return setStatus({ state: "offline" });
  const s = await validSession();
  if (!s) { setStatus({ state: "error", error: "Oturum sona erdi" }); return onSignedOut(); }
  setStatus({ state: "syncing", error: "" });
  try {
    const cloud = await fetchRow(s);
    const meta = readMeta();
    let action = decide({ meta, userId: s.user.id, localHasData: hasData(), cloud });
    if (action === "ask") {
      const pick = await chooseSide(cloud.data);
      if (!pick) return setStatus({ state: "pending" });
      action = pick === "cloud" ? "pull" : "push";
    }
    if (action === "pull" || action === "reset") {
      replaceAll(action === "pull" ? cloud.data : null);
      writeMeta({ userId: s.user.id, dirty: false, syncedAt: cloud?.updated_at || null });
      onReplaced();
    } else if (action === "push") {
      const mySeq = seq;
      const row = await pushRow(s, snapshot());
      const changedMeanwhile = seq !== mySeq;
      writeMeta({ userId: s.user.id, dirty: changedMeanwhile, syncedAt: row.updated_at });
      if (changedMeanwhile) schedulePush();
    } else {
      writeMeta({ ...meta, userId: s.user.id });
    }
    setStatus({ state: "ok", at: Date.now() });
  } catch (e) {
    if (e.message === "signedout") { setStatus({ state: "error", error: "Oturum sona erdi" }); return onSignedOut(); }
    setStatus({ state: navigator.onLine ? "error" : "offline", error: navigator.onLine ? e.message : "" });
  }
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(syncNow, PUSH_DELAY);
}

// Uygulama açılışında bir kez çağrılır
export function initSync(opts) {
  onReplaced = opts.onReplaced || onReplaced;
  onSignedOut = opts.onSignedOut || onSignedOut;
  onSave(() => {
    seq++;
    writeMeta({ ...readMeta(), dirty: true });
    setStatus({ state: navigator.onLine ? "pending" : "offline" });
    schedulePush();
  });
  addEventListener("online", syncNow);
  addEventListener("offline", () => setStatus({ state: "offline" }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - status.at > 30000) syncNow();
  });
  return syncNow();
}

// Çıkış: önce bekleyen değişiklikleri gönder; gönderilemezse kullanıcıya sor. Sonra cihazdaki veriyi temizle.
export async function logout() {
  if (readMeta().dirty) await syncNow();
  if (readMeta().dirty) {
    const ok = await ask("Bu cihazdaki son değişiklikler henüz hesabına gönderilemedi (internet yok ya da sunucuya ulaşılamadı). Şimdi çıkış yaparsan bu değişiklikler kaybolur.",
      { title: "Yine de çıkış yapılsın mı?", ok: "Çıkış yap", danger: true });
    if (!ok) return false;
  }
  clearTimeout(pushTimer);
  await signOut();
  try { localStorage.removeItem(META_KEY); } catch {}
  replaceAll(null);
  return true;
}
