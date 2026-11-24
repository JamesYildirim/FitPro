// Aydınlatma metni penceresi ve yurt dışı aktarım açık rızası.
import { state, save } from "../state/store.js";
import { LEGAL_VERSION, TRANSFER_CONSENT, privacyHtml } from "../legal.js";
import { icon, openSheet } from "./dom.js";

const PENDING = "fitpro.consent"; // kayıt sırasında verilen rıza; ilk girişte hesaba yazılır

export function openPrivacy() {
  openSheet(`
    <div class="between"><div class="h2">Aydınlatma metni</div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button></div>
    <div class="legal">${privacyHtml()}</div>
    <button type="button" class="btn block" style="margin-top:12px" data-close>Kapat</button>`, { label: "KVKK aydınlatma metni" });
}

// Kayıt ekranında verilen rızayı (hesap henüz yokken) cihazda beklet
export function rememberSignupConsent() {
  try { localStorage.setItem(PENDING, JSON.stringify({ version: LEGAL_VERSION, at: new Date().toISOString() })); } catch {}
}

const accepted = () => state.legal?.version >= LEGAL_VERSION && Boolean(state.legal?.transferConsentAt);

function record(at) {
  state.legal = { version: LEGAL_VERSION, acceptedAt: at, transferConsentAt: at };
  save();
}

// Girişten sonra: güncel metin onaylanmamışsa tek seferlik onay ister.
// Promise<"yes" | "no" | "dismiss">: yes → devam, no → reddetti (çıkış yapılmalı), dismiss → pencere karar verilmeden kapandı
export function ensureConsent() {
  if (accepted()) return Promise.resolve("yes");
  let pending = null;
  try { pending = JSON.parse(localStorage.getItem(PENDING) || "null"); } catch {}
  if (pending?.version >= LEGAL_VERSION) {
    record(pending.at);
    try { localStorage.removeItem(PENDING); } catch {}
    return Promise.resolve("yes");
  }
  return new Promise((resolve) => {
    let done = false;
    const sheet = openSheet(`
      <div class="h2">Gizlilik bilgilendirmesi</div>
      <p class="small" style="color:var(--text-2)">${state.legal?.version ? "Aydınlatma metni güncellendi." : "FitPro'yu kullanmaya devam etmeden önce verilerinin nasıl işlendiğini oku."} Uygulama kendi sunucusu olmadan, yurt dışındaki hizmet sağlayıcılar (Supabase — Japonya, GitHub — ABD) üzerinden çalışır.</p>
      <button type="button" class="link-btn" data-read style="margin:0 0 12px;padding:0">Aydınlatma metnini oku</button>
      <label class="consent-row"><input type="checkbox" data-agree><span class="small">${TRANSFER_CONSENT}</span></label>
      <button type="button" class="btn primary block" style="margin-top:14px" data-ok disabled>Onaylıyorum, devam et</button>
      <button type="button" class="btn block" style="margin-top:8px" data-no>Onaylamıyorum, çıkış yap</button>`,
      { label: "Gizlilik bilgilendirmesi", onClose: () => { if (!done) resolve("dismiss"); } });
    const el = sheet.el;
    const agree = el.querySelector("[data-agree]");
    agree.addEventListener("change", () => { el.querySelector("[data-ok]").disabled = !agree.checked; });
    el.querySelector("[data-read]").addEventListener("click", openPrivacy);
    el.querySelector("[data-ok]").addEventListener("click", () => {
      done = true; record(new Date().toISOString()); sheet.close(); resolve("yes");
    });
    el.querySelector("[data-no]").addEventListener("click", () => { done = true; sheet.close(); resolve("no"); });
  });
}
