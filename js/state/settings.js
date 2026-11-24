// Antrenman ayarları: state.settings içinde durur (bulutla eşitlenir, yedeğe girer).
//   restMode:  "program" (hareketin rolüne göre programdaki süre) | "fixed" (tek süre) | "off" (sayaç kendiliğinden başlamaz)
//   restFixed: sabit süre (sn)
//   restByEx:  { hareket adı: sn } — harekete özel süre, diğer ayarlardan önce gelir
//   sound, vibrate, keepAwake: aç/kapa
import { state } from "./store.js";

export const DEFAULTS = { restMode: "program", restFixed: 120, restByEx: {}, sound: true, vibrate: true, keepAwake: true };
export const REST_MIN = 15, REST_MAX = 600, REST_STEP = 15;

// Eksik alanları varsayılanla doldurur (eski kayıtlarda ayar yoktur)
export function settings() {
  const s = state.settings;
  if (!s || typeof s !== "object") return (state.settings = { ...DEFAULTS, restByEx: {} });
  for (const [k, v] of Object.entries(DEFAULTS)) if (!(k in s)) s[k] = typeof v === "object" ? { ...v } : v;
  return s;
}

export const clampRest = (sec) => Math.min(REST_MAX, Math.max(REST_MIN, Math.round(sec / REST_STEP) * REST_STEP));

// Saf hesap: bu hareket için dinlenme süresi (sn); 0 = sayaç kendiliğinden başlamaz
export function restSeconds(s, ex) {
  if (s.restMode === "off") return 0;
  const own = s.restByEx?.[ex.name];
  if (own) return own;
  return s.restMode === "fixed" ? s.restFixed : ex.restS || 90;
}

export const restFor = (ex) => restSeconds(settings(), ex);

// "2:30" biçimi
export const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
