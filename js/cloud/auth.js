// Supabase Auth (e-posta + şifre). Kütüphane kullanılmaz; doğrudan REST uç noktaları çağrılır.
// Oturum localStorage "antrenman.auth" anahtarında tutulur; internet yokken de uygulama açılabilsin diye
// süresi dolmuş oturum silinmez, bağlantı gelince yenilenir.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config.js";

const KEY = "antrenman.auth";

// ---------- Oturum saklama ----------
export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function setSession(s) {
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch {}
}
const fromToken = (t, user) => ({
  access_token: t.access_token,
  refresh_token: t.refresh_token,
  expires_at: t.expires_at || Math.floor(Date.now() / 1000) + (+t.expires_in || 3600),
  user: { id: user.id, email: user.email },
});

// ---------- Hata mesajları ----------
const MESSAGES = {
  invalid_credentials: "E-posta veya şifre hatalı.",
  email_not_confirmed: "E-posta adresin henüz onaylanmamış. Gelen kutundaki onay bağlantısına tıkla.",
  user_already_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  email_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  weak_password: "Şifre çok zayıf. Daha uzun bir şifre seç.",
  same_password: "Yeni şifre eskisiyle aynı olamaz.",
  over_email_send_rate_limit: "Çok sık e-posta istendi. Birkaç dakika sonra tekrar dene.",
  over_request_rate_limit: "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.",
  email_address_invalid: "Geçerli bir e-posta adresi gir.",
  validation_failed: "E-posta veya şifre geçersiz.",
  signup_disabled: "Yeni hesap açma kapalı.",
  otp_expired: "Bağlantının süresi dolmuş. Yeniden iste.",
  session_not_found: "Oturumun sona ermiş. Yeniden giriş yap.",
  refresh_token_not_found: "Oturumun sona ermiş. Yeniden giriş yap.",
};
export class AuthError extends Error {
  constructor(message, { code = "", status = 0, network = false } = {}) {
    super(message);
    this.code = code; this.status = status; this.network = network;
  }
}

async function call(path, { method = "POST", body, token } = {}) {
  let res;
  try {
    res = await fetch(SUPABASE_URL + "/auth/v1" + path, {
      method,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AuthError("İnternet bağlantısı yok. Bağlantını kontrol edip tekrar dene.", { network: true });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.error_code || data.code || data.error || "";
    const msg = MESSAGES[code] || data.msg || data.error_description || data.message || "Bir hata oluştu. Tekrar dene.";
    throw new AuthError(msg, { code: String(code), status: res.status });
  }
  return data;
}

const redirectTo = () => encodeURIComponent(location.origin + location.pathname);

// ---------- İşlemler ----------
export async function signIn(email, password) {
  const t = await call("/token?grant_type=password", { body: { email, password } });
  const s = fromToken(t, t.user);
  setSession(s);
  return s;
}

// Onay e-postası açıksa oturum dönmez: { session: null } → kullanıcıya "e-postanı onayla" denir
// meta: hesabın kullanıcı bilgisine yazılır (ör. aydınlatma metni sürümü ve açık rıza zamanı — kayıt kanıtı)
export async function signUp(email, password, meta = {}) {
  const t = await call(`/signup?redirect_to=${redirectTo()}`, { body: { email, password, data: meta } });
  if (t.access_token) {
    const s = fromToken(t, t.user);
    setSession(s);
    return { session: s };
  }
  // Supabase, var olan bir e-posta için de (bilgi sızdırmamak adına) başarı döner; kimliği boş gelir
  if (t.identities && t.identities.length === 0) throw new AuthError(MESSAGES.user_already_exists, { code: "user_already_exists" });
  return { session: null };
}

export async function requestPasswordReset(email) {
  await call(`/recover?redirect_to=${redirectTo()}`, { body: { email } });
}

export async function updatePassword(password) {
  const s = await validSession();
  if (!s) throw new AuthError(MESSAGES.session_not_found);
  await call("/user", { method: "PUT", body: { password }, token: s.access_token });
}

export async function signOut() {
  const s = getSession();
  setSession(null);
  if (s) call("/logout", { token: s.access_token }).catch(() => {}); // sunucuda da kapat (başarısızsa önemli değil)
}

// Erişim anahtarı bitmek üzereyse yenile. İnternet yoksa eldeki oturumu döndürür (çevrimdışı çalışma).
// Yenileme anahtarı geçersizse oturum silinir ve null döner.
export async function validSession({ force = false } = {}) {
  const s = getSession();
  if (!s) return null;
  if (!force && s.expires_at - 60 > Date.now() / 1000) return s;
  try {
    const t = await call("/token?grant_type=refresh_token", { body: { refresh_token: s.refresh_token } });
    const next = fromToken(t, t.user || s.user);
    setSession(next);
    return next;
  } catch (e) {
    if (e.network || e.status >= 500 || e.status === 429) return s;
    setSession(null);
    return null;
  }
}

// E-postadaki bağlantıdan dönüşte adres çubuğundaki "#access_token=...&type=..." bilgisini okur.
// Döner: null | { type: "signup" | "recovery" | ..., session } | { error }
export async function consumeRedirect() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.has("access_token") && !h.has("error") && !h.has("error_code")) return null;
  history.replaceState(null, "", location.pathname + location.search); // anahtar adres çubuğunda kalmasın
  if (!h.has("access_token")) {
    const code = h.get("error_code") || h.get("error");
    return { error: MESSAGES[code] || h.get("error_description")?.replace(/\+/g, " ") || "Bağlantı geçersiz." };
  }
  const token = { access_token: h.get("access_token"), refresh_token: h.get("refresh_token"), expires_at: +h.get("expires_at") || 0, expires_in: h.get("expires_in") };
  try {
    const user = await call("/user", { method: "GET", token: token.access_token });
    const s = fromToken(token, user);
    setSession(s);
    return { type: h.get("type") || "", session: s };
  } catch (e) {
    return { error: e.message };
  }
}
