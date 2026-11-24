// Claude API istemcisi (tarayıcıdan, kullanıcının kendi anahtarıyla).
// Resmi TypeScript SDK'sı bu projede kullanılamıyor: derleme aracı yok ve SDK'nın ES modülleri Node'a özel
// paketleri (@opentelemetry/api, node:* modülleri) içe aktarıyor. Bu yüzden Messages API'ye doğrudan HTTP
// ile gidilir; başlıklar SDK'nın tarayıcı modunun gönderdikleriyle aynıdır (dangerouslyAllowBrowser).
const API = "https://api.anthropic.com/v1";
const VERSION = "2026-10-21";

export class AiError extends Error {
  constructor(message, kind) { super(message); this.kind = kind; }
}

function headers(key, beta) {
  const h = {
    "x-api-key": key,
    "anthropic-version": VERSION,
    "content-type": "application/json",
    "anthropic-dangerous-direct-browser-access": "true",
  };
  if (beta) h["anthropic-beta"] = beta;
  return h;
}

// HTTP hatasını kullanıcıya anlaşılır bir mesaja çevirir
export function errorFor(status, message = "") {
  if (status === 401) return new AiError("API anahtarı geçersiz. Profil → Yapay zekâ kartından kontrol et.", "auth");
  if (status === 403) return new AiError("Bu API anahtarının bu işleme izni yok.", "auth");
  if (status === 404) return new AiError("Seçili model bu hesapta kullanılamıyor. Profil'den başka bir model seç.", "model");
  if (status === 413) return new AiError("Fotoğraf çok büyük. Daha küçük bir fotoğraf dene.", "size");
  if (status === 429) return new AiError("Çok sık istek gönderildi ya da hesabın harcama sınırına ulaştı. Biraz bekleyip tekrar dene.", "rate");
  if (status === 400 && /credit|balance|billing/i.test(message)) return new AiError("Anthropic hesabında yeterli kredi yok. console.anthropic.com → Billing'den kredi ekle.", "billing");
  if (status === 400) return new AiError("İstek reddedildi: " + (message || "geçersiz istek"), "request");
  if (status >= 500) return new AiError("Anthropic şu an yoğun ya da ulaşılamıyor. Birazdan tekrar dene.", "server");
  return new AiError(`Beklenmeyen hata (${status}).`, "unknown");
}

async function request(path, key, init, beta) {
  let res;
  try {
    res = await fetch(API + path, { ...init, headers: headers(key, beta) });
  } catch {
    throw new AiError("İnternet bağlantısı yok ya da Anthropic'e ulaşılamadı.", "network");
  }
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json())?.error?.message || ""; } catch {}
    throw errorFor(res.status, msg);
  }
  return res.json();
}

// Anahtarı token harcamadan doğrular (Models API)
export const testKey = (key) => request("/models?limit=1", key, { method: "GET" });

// Messages API. Opus modellerinde, güvenlik sınıflandırıcısı reddederse istek sunucu tarafında
// otomatik olarak uygun bir modelle yeniden çalıştırılır (server-side fallback).
export async function createMessage(key, body) {
  const opus = body.model.startsWith("claude-opus");
  const payload = opus ? { ...body, fallbacks: "default" } : body;
  const msg = await request("/messages", key, { method: "POST", body: JSON.stringify(payload) },
    opus ? "server-side-fallback-2026-07-01" : null);
  if (msg.stop_reason === "refusal") throw new AiError("Yapay zekâ bu fotoğrafı değerlendirmedi. Başka bir fotoğraf dene.", "refusal");
  if (msg.stop_reason === "max_tokens") throw new AiError("Cevap yarım kaldı. Tekrar dene.", "truncated");
  return msg;
}

// Cevaptaki metin blokları (düşünme ve diğer bloklar atlanır)
export const textOf = (msg) => (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
