// Program oluşturma kuralları: 6–8 hafta sabitleme, profil değişikliği algılama
import { state, save } from "../state/store.js";
import { generateProgram } from "../core/program.js";
import { nutritionPlan, macroTargets } from "../core/nutrition.js";
import { DAY_MS, fmt, ask } from "./dom.js";

const SEX = { erkek: "Erkek", kadin: "Kadın" };
const FIELDS = [
  ["age", "Yaş", (v) => v],
  ["sex", "Cinsiyet", (v) => SEX[v]],
  ["height", "Boy", (v) => v + " cm"],
  ["weight", "Mevcut kilo", (v) => fmt(v) + " kg"],
  ["target", "Hedef kilo", (v) => fmt(v) + " kg"],
];
export const sexLabel = (s) => SEX[s] || s;

// Program oluşturulduğundan beri profilde değişen alanlar.
// Mevcut kilo günlük tartımla sık değiştiği için yalnızca 2 kg ve üzeri fark programı eskimiş sayar.
export function profileChanges() {
  const p = state.program, prof = state.profile;
  if (!p || !p.profileSnap || !prof) return [];
  const changed = ([k]) => (k === "weight" ? Math.abs(p.profileSnap[k] - prof[k]) >= 2 : p.profileSnap[k] !== prof[k]);
  return FIELDS.filter(changed).map(([k, label, f]) => `${label}: ${f(p.profileSnap[k])} → ${f(prof[k])}`);
}

// Güncel profile göre günlük kalori ve makro hedefi (program oluşturulduğundaki değil, bugünkü kiloya göre)
export function dailyTargets() {
  if (!state.profile) return null;
  const input = state.program?.input || state.prefs;
  const plan = nutritionPlan(state.profile, input.goal, Number(input.days));
  return { plan, ...macroTargets(state.profile, plan) };
}

// Mevcut programın yerine yenisini koymadan önce gerekirse onay ister
async function confirmReplace() {
  const p = state.program;
  if (!p || !p.createdAt || profileChanges().length) return true;
  const age = Date.now() - p.createdAt;
  if (age < DAY_MS || age >= 42 * DAY_MS) return true;
  const days = Math.floor(age / DAY_MS);
  return ask(`Mevcut programın ${days} gün önce oluşturuldu. Progressive overload için aynı hareketlerle 6–8 hafta devam etmen önerilir.`,
    { title: "Yeni program oluşturulsun mu?", ok: "Yine de oluştur", cancel: "Programa devam" });
}

// Promise<true>: program oluşturuldu
export async function createProgram(prefs = state.prefs) {
  if (!state.profile) return false;
  if (!(await confirmReplace())) return false;
  const program = generateProgram({ ...prefs, profile: state.profile });
  program.createdAt = Date.now();
  program.profileSnap = { ...state.profile };
  state.prefs = {
    goal: prefs.goal, days: String(prefs.days), level: prefs.level,
    location: prefs.location || "salon", equipment: prefs.equipment || [],
  };
  state.program = program;
  save();
  return true;
}

// Eski kayıtlarda eksik alanları tamamla
export function normalizeProgram() {
  const p = state.program;
  if (!p) return;
  let changed = false;
  if (!p.createdAt) { p.createdAt = Date.now(); changed = true; }
  if (!p.profileSnap && state.profile) { p.profileSnap = { ...state.profile }; changed = true; }
  if (changed) save();
}

// Bugünün (yoksa bir sonraki) antrenman günü
export function nextTrainingDay() {
  const week = state.program?.week;
  if (!week) return null;
  const names = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const today = new Date().getDay();
  for (let k = 0; k < 7; k++) {
    const name = names[(today + k) % 7];
    const idx = week.findIndex((d) => d.day === name);
    if (idx >= 0 && !week[idx].rest) return { index: idx, day: week[idx], offset: k };
  }
  return null;
}
