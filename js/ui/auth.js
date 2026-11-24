// Giriş ekranı: giriş yap / hesap oluştur / şifremi unuttum / yeni şifre belirle.
// Ekran açıkken üst bar ve alt menü gizlenir (body.auth-mode).
import { signIn, signUp, requestPasswordReset, updatePassword } from "../cloud/auth.js";
import { esc, icon } from "./dom.js";
import { LEGAL_VERSION, TRANSFER_CONSENT } from "../legal.js";
import { openPrivacy, rememberSignupConsent } from "./privacy.js";

const MIN_PASSWORD = 8;
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const VIEWS = {
  login: { title: "Giriş yap", sub: "Verilerin hesabında saklanır; telefonda ve bilgisayarda aynı hesapla devam edersin.", btn: "Giriş yap" },
  signup: { title: "Hesap oluştur", sub: "E-posta adresin ve en az 8 karakterli bir şifreyle hesabını aç.", btn: "Hesap oluştur" },
  forgot: { title: "Şifremi unuttum", sub: "E-posta adresini yaz; şifreni yenilemen için bir bağlantı gönderelim.", btn: "Bağlantı gönder" },
  newpass: { title: "Yeni şifre belirle", sub: "Hesabın için yeni bir şifre seç.", btn: "Şifreyi kaydet" },
};

// opts: { view, notice, email, onDone(session|null) }  onDone giriş/şifre işlemi bitince çağrılır
export function showAuth(main, opts = {}) {
  document.body.classList.add("auth-mode");
  let view = opts.view || "login";
  let notice = opts.notice || null; // { kind: "lime" | "orange" | "red", text }
  let email = opts.email || "";

  const draw = () => {
    const v = VIEWS[view];
    const pw = view !== "forgot";
    const pw2 = view === "signup" || view === "newpass";
    main.innerHTML = `<div class="tab auth">
      <div class="auth-brand"><div class="logo">${icon("bolt")}</div><div><h1>FitPro</h1><p class="tiny muted">Kişisel antrenman ve beslenme takibi</p></div></div>
      ${view === "login" || view === "signup" ? `<div class="seg auth-seg" role="tablist" aria-label="Giriş veya kayıt">
        <button type="button" role="tab" data-view="login" aria-selected="${view === "login"}">Giriş yap</button>
        <button type="button" role="tab" data-view="signup" aria-selected="${view === "signup"}">Hesap oluştur</button>
      </div>` : ""}
      <form class="card" data-form novalidate>
        <div class="h2">${v.title}</div>
        <p class="small muted" style="margin:4px 0 14px">${v.sub}</p>
        ${notice ? `<div class="notice ${notice.kind}" role="status">${esc(notice.text)}</div>` : ""}
        ${view !== "newpass" ? `<label class="field"><span class="label">E-posta</span>
          <input class="input" type="email" name="email" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" value="${esc(email)}" required></label>` : ""}
        ${pw ? `<label class="field"><span class="label">${view === "newpass" ? "Yeni şifre" : "Şifre"}</span>
          <span class="pw-wrap"><input class="input" type="password" name="password" autocomplete="${view === "login" ? "current-password" : "new-password"}" ${pw2 ? `minlength="${MIN_PASSWORD}"` : ""} required>
          <button type="button" class="pw-toggle" data-toggle aria-label="Şifreyi göster">Göster</button></span></label>` : ""}
        ${pw2 ? `<label class="field"><span class="label">Şifre (tekrar)</span>
          <input class="input" type="password" name="password2" autocomplete="new-password" required></label>
          <p class="tiny muted" style="margin:-6px 0 12px">En az ${MIN_PASSWORD} karakter.</p>` : ""}
        ${view === "signup" ? `<p class="tiny muted" style="margin:0 0 10px">Hesap açmadan önce <button type="button" class="link-btn inline" data-privacy>aydınlatma metnini</button> oku.</p>
          <label class="consent-row" style="margin-bottom:12px"><input type="checkbox" name="transfer"><span class="tiny">${esc(TRANSFER_CONSENT)}</span></label>` : ""}
        <p class="small hidden" style="color:var(--red);margin:0 0 10px" data-err role="alert"></p>
        <button type="submit" class="btn primary block" data-submit>${v.btn}</button>
        ${view === "login" ? `<button type="button" class="link-btn" data-view="forgot">Şifremi unuttum</button>` : ""}
        ${view === "forgot" ? `<button type="button" class="link-btn" data-view="login">Girişe dön</button>` : ""}
      </form>
      <p class="tiny muted" style="text-align:center;margin-top:14px"><button type="button" class="link-btn inline" data-privacy>KVKK aydınlatma metni</button></p>
    </div>`;
    const first = [...main.querySelectorAll("input")].find((i) => !i.value) || main.querySelector("input");
    first?.focus({ preventScroll: true });
  };

  const go = (next, n = null) => { view = next; notice = n; draw(); };

  main.onclick = (e) => {
    if (e.target.closest("[data-privacy]")) return openPrivacy();
    const v = e.target.closest("[data-view]");
    if (v) { const f = main.querySelector("[name=email]"); if (f) email = f.value.trim(); return go(v.dataset.view); }
    const t = e.target.closest("[data-toggle]");
    if (t) {
      const input = t.previousElementSibling;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      t.textContent = show ? "Gizle" : "Göster";
      t.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster");
    }
  };

  main.onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const err = form.querySelector("[data-err]");
    const btn = form.querySelector("[data-submit]");
    const fail = (msg, field) => {
      err.textContent = msg; err.classList.remove("hidden");
      if (field) form.elements[field]?.focus();
    };
    err.classList.add("hidden");
    const fd = new FormData(form);
    email = String(fd.get("email") || email).trim();
    const password = String(fd.get("password") || "");
    if (view !== "newpass" && !emailOk(email)) return fail("Geçerli bir e-posta adresi gir.", "email");
    if (view !== "forgot" && !password) return fail("Şifreni gir.", "password");
    if ((view === "signup" || view === "newpass") && password.length < MIN_PASSWORD) return fail(`Şifre en az ${MIN_PASSWORD} karakter olmalı.`, "password");
    if ((view === "signup" || view === "newpass") && password !== fd.get("password2")) return fail("Şifreler aynı değil.", "password2");
    if (view === "signup" && !fd.get("transfer")) return fail("Hesap açmak için yurt dışı aktarıma açık rıza kutusunu işaretlemen gerekiyor; uygulama bu sunucular olmadan çalışamaz.", "transfer");

    const label = btn.textContent;
    btn.disabled = true; btn.textContent = "Lütfen bekle…";
    try {
      if (view === "login") return opts.onDone?.(await signIn(email, password));
      if (view === "signup") {
        const consentAt = new Date().toISOString();
        const { session } = await signUp(email, password, { privacy_version: LEGAL_VERSION, transfer_consent_at: consentAt });
        rememberSignupConsent();
        if (session) return opts.onDone?.(session);
        return go("login", { kind: "lime", text: `Hesabın oluşturuldu. ${email} adresine gelen onay bağlantısına tıkla, sonra burada giriş yap.` });
      }
      if (view === "forgot") {
        await requestPasswordReset(email);
        return go("login", { kind: "lime", text: `Bu e-postayla bir hesap varsa şifre yenileme bağlantısı gönderildi. Gelen kutunu (ve gereksiz klasörünü) kontrol et.` });
      }
      if (view === "newpass") {
        await updatePassword(password);
        return opts.onDone?.(null);
      }
    } catch (ex) {
      fail(ex.message);
    } finally {
      if (btn.isConnected) { btn.disabled = false; btn.textContent = label; }
    }
  };

  draw();
}

export function hideAuth(main) {
  document.body.classList.remove("auth-mode");
  main.onclick = null;
  main.onsubmit = null;
}
