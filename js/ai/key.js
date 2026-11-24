// Yapay zekâ ayarı (kullanıcının kendi Anthropic API anahtarı + model seçimi).
// Bilerek uygulama durumundan (state) AYRI tutulur: buluta eşitlenmez, yedek dosyasına girmez,
// yalnızca bu cihazda kalır. Çıkış yapınca silinir (cloud/sync.js → logout).
const KEY = "fitpro.ai";

export const AI_MODELS = [
  ["claude-opus-5-5", "Claude Opus 5.5", "en iyi · ~0,04 $/foto"],
  ["claude-haiku-5-5", "Claude Haiku 5.5", "en ucuz · ~0,001 $/foto"],
];
export const DEFAULT_MODEL = AI_MODELS[0][0];

// { key, model, consent } | null
export function aiConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null");
    return c && typeof c.key === "string" && c.key ? { model: DEFAULT_MODEL, consent: false, ...c } : null;
  } catch { return null; }
}

export function saveAiConfig(patch) {
  const next = { model: DEFAULT_MODEL, consent: false, ...(aiConfig() || {}), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearAiConfig() {
  try { localStorage.removeItem(KEY); } catch {}
}

export const hasAiKey = () => Boolean(aiConfig());

// Ekranda gösterilecek kısa hali: sk-ant-…1a2b
export const maskKey = (k) => (k.length > 12 ? `${k.slice(0, 7)}…${k.slice(-4)}` : "••••");

// Anthropic anahtarları "sk-ant-" ile başlar; açıkça başka bir şey yapıştırıldıysa erken uyar
export const looksLikeKey = (k) => /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k.trim());
