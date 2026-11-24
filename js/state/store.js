// Uygulama durumu: tek anahtar altında localStorage'da saklanır, JSON olarak yedeklenip geri yüklenebilir.
// Şema:
//   profile: { age, sex, height, weight, target }
//   prefs:   { goal, days, level }                       program formundaki son seçimler
//   program: generateProgram() çıktısı + createdAt, profileSnap
//   active:  devam eden antrenman seansı (yoksa null)
//   history: tamamlanan seanslar [{ id, date, title, minutes, exercises: [{ name, pool, role, baseReps, sets: [{ kg, reps }] }] }]
//   food:    { "YYYY-MM-DD": [{ id, meal, name, portion, qty, kcal, p, c, f }] }   değerler 1 porsiyon için, toplam = değer × qty
//   favorites: [{ name, portion, kcal, p, c, f }]
//   weights: [{ date: "YYYY-MM-DD", kg }]   tarihe göre artan
//   settings: antrenman ayarları (dinlenme süresi, ses, titreşim, ekran) — bkz. state/settings.js
//   legal:    { version, acceptedAt, transferConsentAt }  aydınlatma metni ve yurt dışı aktarım açık rızası kaydı

import { renameDeep } from "../data/renames.js";

const KEY = "antrenman.v2";
const VERSION = 2;
const empty = () => ({
  v: VERSION, profile: null, prefs: { goal: "kas", days: "4", level: "orta", location: "salon", equipment: [] }, program: null, active: null, history: [],
  food: {}, favorites: [], weights: [], settings: {}, legal: {},
});

// Yerel saatle "YYYY-MM-DD"
export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

function read(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

// v1 (eski sürüm) anahtarlarından tek seferlik aktarım
function migrateV1() {
  const s = empty();
  const profile = read("antrenman.profil");
  const program = read("antrenman.program");
  const prefs = read("antrenman.secim");
  if (profile && profile.age) s.profile = profile;
  if (program && Array.isArray(program.week) && program.volume) s.program = program; // hacim bilgisi olmayan çok eski programlar alınmaz
  if (prefs && prefs.goal) s.prefs = { ...s.prefs, goal: prefs.goal, days: String(prefs.days || 4), level: prefs.level || "orta" };
  return s;
}

function load() {
  const s = read(KEY);
  if (s && s.v === VERSION) return { ...empty(), ...s };
  return migrateV1();
}

// Eski Türkçe hareket/gün adlarını İngilizceye çevir (yemek, kilo ve profil verisine dokunulmaz)
function migrateNames(s) {
  return [renameDeep(s.program), renameDeep(s.active), renameDeep(s.history)].some(Boolean);
}

export const state = load();
if (migrateNames(state)) try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}

// Kayıt dinleyicileri (bulut eşitleme her yerel değişikliği buradan öğrenir)
const listeners = new Set();
export const onSave = (fn) => listeners.add(fn);

// silent: değişikliği "kullanıcı değişikliği" sayma (ör. buluttan gelen veriyi yazarken)
export function save({ silent = false } = {}) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { return false; }
  if (!silent) listeners.forEach((fn) => fn());
  return true;
}

// Profil, program ya da geçmiş varsa cihazda anlamlı veri var demektir
export const hasData = (s = state) => Boolean(s.profile || s.program || s.history?.length || s.weights?.length || Object.keys(s.food || {}).length);

// Eşitleme için gönderilecek veri (uygulama durumunun kopyası)
export const snapshot = () => JSON.parse(JSON.stringify(state));

// Buluttan gelen veriyi (ya da boş durumu) cihazdakinin yerine koy
export function replaceAll(data) {
  const next = empty();
  if (data && data.v === VERSION) for (const k of Object.keys(next)) if (k in data) next[k] = data[k];
  migrateNames(next);
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, next);
  save({ silent: true });
}

export function exportData() {
  return JSON.stringify({ app: "antrenman-programi", exportedAt: new Date().toISOString(), ...state }, null, 2);
}

// Yedek dosyasını doğrular ve mevcut verinin yerine koyar
export function importData(text) {
  let d;
  try { d = JSON.parse(text); } catch { throw new Error("Dosya okunamadı (geçerli bir JSON değil)."); }
  if (!d || d.app !== "antrenman-programi" || d.v !== VERSION) throw new Error("Bu dosya bu uygulamanın yedeği değil ya da sürümü uyumsuz.");
  if (!Array.isArray(d.history)) throw new Error("Yedekte antrenman geçmişi bulunamadı.");
  const next = empty();
  for (const k of Object.keys(next)) if (k in d) next[k] = d[k];
  migrateNames(next);
  Object.assign(state, next);
  save();
}

export function resetAll() {
  Object.assign(state, empty());
  save();
}
