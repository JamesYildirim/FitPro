// Profil sekmesi: kişisel bilgiler, BMI özeti, veri yedekleme / geri yükleme / sıfırlama
import { state, save, exportData, importData, resetAll } from "../state/store.js";
import { bmiInfo, ageGroup } from "../core/nutrition.js";
import { esc, fmt, icon, toast, ask, openSheet } from "./dom.js";
import { createProgram, profileChanges } from "./plan.js";
import { pickerHtml, initPickers } from "./wheel.js";
import { cloudConfigured } from "../config.js";
import { getSession, updatePassword } from "../cloud/auth.js";
import { getStatus, onStatus, syncNow, logout, deleteAccount } from "../cloud/sync.js";
import { settings, clampRest, mmss, REST_STEP } from "../state/settings.js";
import { syncWakeLock, wakeSupported } from "./wake.js";
import { aiConfig, saveAiConfig, clearAiConfig, maskKey, looksLikeKey, AI_MODELS } from "../ai/key.js";
import { testKey } from "../ai/claude.js";
import { openPrivacy } from "./privacy.js";

// Yapay zekâ: kullanıcının kendi Anthropic API anahtarı (yalnızca bu cihazda saklanır)
function aiCard() {
  const c = aiConfig();
  const models = `<select class="input" data-ai-model aria-label="Yapay zekâ modeli">
    ${AI_MODELS.map(([id, name, hint]) => `<option value="${id}" ${(c?.model || AI_MODELS[0][0]) === id ? "selected" : ""}>${esc(name)} — ${esc(hint)}</option>`).join("")}</select>`;
  return `<div class="section-title">Yapay zekâ</div>
  <div class="card" data-ai>
    <p class="small muted" style="margin-top:0">Yemeğinin fotoğrafını çekip kalori ve makrolarını tahmin ettirmek için kendi Anthropic API anahtarını gir. Ücreti anahtarın sahibinin Anthropic hesabına yazılır.</p>
    ${c ? `
      <div class="between" style="gap:10px"><div><b class="small">Anahtar kayıtlı</b><span class="tiny muted" style="display:block">${esc(maskKey(c.key))} · yalnızca bu cihazda</span></div>
        <button type="button" class="btn sm danger" data-ai-del>Sil</button></div>
      <div class="field" style="margin:12px 0 0"><span class="label">Model</span>${models}</div>`
    : `
      <form data-ai-form novalidate>
        <div class="field" style="margin-bottom:10px"><label class="label" for="ai-key">API anahtarı</label>
          <input class="input" id="ai-key" name="key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"></div>
        <div class="field" style="margin-bottom:10px"><span class="label">Model</span>${models}</div>
        <p class="small hidden" style="color:var(--red);margin:0 0 10px" data-ai-err></p>
        <button type="submit" class="btn primary block" data-ai-save>Anahtarı dene ve kaydet</button>
      </form>
      <ol class="tiny muted" style="margin:12px 0 0;padding-left:18px">
        <li>console.anthropic.com adresinde hesap aç, <b>Billing</b>'den kredi ekle.</li>
        <li><b>API Keys</b> → <b>Create Key</b> ile anahtar oluştur, buraya yapıştır.</li>
        <li>Güvenlik için anahtara <b>aylık harcama sınırı</b> koy (Limits).</li>
      </ol>`}
    <p class="tiny muted" style="margin:12px 0 0">Anahtar hesabınla eşitlenmez, yedek dosyasına girmez; çıkış yapınca bu cihazdan silinir. Fotoğraflar uygulamada saklanmaz.</p>
  </div>`;
}

function bindAi(root, ctx) {
  const card = root.querySelector("[data-ai]");
  card.querySelector("[data-ai-model]")?.addEventListener("change", (e) => {
    if (aiConfig()) { saveAiConfig({ model: e.target.value }); toast("Model değiştirildi"); }
  });
  card.querySelector("[data-ai-del]")?.addEventListener("click", () => {
    ask("API anahtarı bu cihazdan silinir. Fotoğraftan kalori özelliği, anahtarı yeniden girene kadar kapanır.", { title: "Anahtar silinsin mi?", ok: "Sil", danger: true })
      .then((ok) => { if (ok) { clearAiConfig(); toast("Anahtar silindi"); ctx.refresh(); } });
  });
  const form = card.querySelector("[data-ai-form]");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = form.elements.key.value.trim();
    const model = card.querySelector("[data-ai-model]").value;
    const err = card.querySelector("[data-ai-err]");
    const btn = card.querySelector("[data-ai-save]");
    const show = (m) => { err.textContent = m; err.classList.toggle("hidden", !m); };
    if (!looksLikeKey(key)) return show("Bu bir Anthropic API anahtarına benzemiyor (sk-ant- ile başlamalı).");
    show("");
    btn.disabled = true; btn.textContent = "Deneniyor…";
    try {
      await testKey(key);
      saveAiConfig({ key, model });
      toast("Anahtar doğrulandı ve kaydedildi");
      ctx.refresh();
    } catch (ex) {
      show(ex.message || "Anahtar doğrulanamadı.");
      btn.disabled = false; btn.textContent = "Anahtarı dene ve kaydet";
    }
  });
}

let message = "";

const sw = (key, on, disabled = false) =>
  `<label class="switch"><input type="checkbox" data-set="${key}" ${on ? "checked" : ""} ${disabled ? "disabled" : ""}><span></span></label>`;

// Antrenman ayarları: dinlenme süresi, ses, titreşim, ekran
function workoutSettingsCard() {
  const s = settings();
  const custom = Object.keys(s.restByEx).length;
  const mode = (v, l) => `<button type="button" data-rest-mode="${v}" aria-pressed="${s.restMode === v}">${l}</button>`;
  const modeHelp = {
    program: "Ana hareketlerde uzun, izolasyonda kısa: süreler programındaki hedefe göre gelir.",
    fixed: "Tüm hareketlerde aynı süre kullanılır.",
    off: "Set onaylayınca sayaç kendiliğinden başlamaz; istersen üstteki saat simgesinden açarsın.",
  }[s.restMode];
  return `<div class="section-title">Antrenman ayarları</div>
  <div class="card" data-wsettings>
    <div class="label" style="margin-bottom:8px">Setler arası dinlenme</div>
    <div class="seg" role="group" aria-label="Dinlenme süresi">${mode("program", "Programa göre")}${mode("fixed", "Sabit süre")}${mode("off", "Kapalı")}</div>
    <p class="tiny muted" style="margin:8px 0 0">${modeHelp}</p>
    ${s.restMode === "fixed" ? `<div class="stepper" style="margin-top:12px">
      <button type="button" data-fixed="-${REST_STEP}" aria-label="${REST_STEP} saniye azalt">−${REST_STEP}</button>
      <b aria-live="polite">${mmss(s.restFixed)}</b>
      <button type="button" data-fixed="${REST_STEP}" aria-label="${REST_STEP} saniye artır">+${REST_STEP}</button></div>` : ""}
    ${custom ? `<div class="between" style="margin-top:12px;gap:10px"><span class="tiny muted">${custom} harekete özel süre var (antrenmanda hareketin süresine dokunarak değiştirilir).</span>
      <button type="button" class="btn sm" data-clear-rest>Sıfırla</button></div>` : `<p class="tiny muted" style="margin:10px 0 0">Antrenman sırasında bir hareketin dinlenme süresine dokunarak o harekete özel süre verebilirsin.</p>`}
    <div style="margin-top:12px">
      <div class="setting-row"><div><b class="small">Ses</b><span class="tiny muted">Dinlenme bitince kısa bir bip</span></div>${sw("sound", s.sound)}</div>
      <div class="setting-row"><div><b class="small">Titreşim</b><span class="tiny muted">Dinlenme bitince ve set onaylanınca${"vibrate" in navigator ? "" : " (bu cihaz desteklemiyor, iPhone'da çalışmaz)"}</span></div>${sw("vibrate", s.vibrate)}</div>
      <div class="setting-row"><div><b class="small">Ekran açık kalsın</b><span class="tiny muted">${wakeSupported() ? "Antrenman sürerken telefon kilitlenmez" : "Bu tarayıcı desteklemiyor"}</span></div>${sw("keepAwake", s.keepAwake && wakeSupported(), !wakeSupported())}</div>
    </div>
  </div>`;
}

function bindWorkoutSettings(root, ctx) {
  const card = root.querySelector("[data-wsettings]");
  const s = settings();
  card.addEventListener("click", (e) => {
    const m = e.target.closest("[data-rest-mode]");
    if (m) { s.restMode = m.dataset.restMode; save(); return ctx.refresh(); }
    const f = e.target.closest("[data-fixed]");
    if (f) { s.restFixed = clampRest(s.restFixed + +f.dataset.fixed); save(); return ctx.refresh(); }
    if (e.target.closest("[data-clear-rest]")) {
      ask("Harekete özel verdiğin tüm dinlenme süreleri silinir; hareketler yukarıdaki ayarı kullanır.", { title: "Özel süreler sıfırlansın mı?", ok: "Sıfırla" })
        .then((ok) => { if (ok) { s.restByEx = {}; save(); toast("Özel süreler sıfırlandı"); ctx.refresh(); } });
    }
  });
  card.addEventListener("change", (e) => {
    const inp = e.target.closest("[data-set]");
    if (!inp) return;
    s[inp.dataset.set] = inp.checked;
    save();
    if (inp.dataset.set === "keepAwake") syncWakeLock();
  });
}
let unwatch = null; // eşitleme durumu dinleyicisi (sekme yeniden çizilince kaldırılır)

function statusText(s) {
  const time = s.at ? new Date(s.at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
  if (s.state === "syncing") return ["", "Eşitleniyor…"];
  if (s.state === "offline") return ["orange", s.dirty ? "İnternet yok. Değişikliklerin bu cihazda kayıtlı; bağlantı gelince hesabına gönderilecek." : "İnternet yok. Bağlantı gelince eşitlenecek."];
  if (s.state === "error") return ["red", `Eşitlenemedi: ${s.error}`];
  if (s.dirty || s.state === "pending") return ["", "Değişiklikler gönderilecek…"];
  return ["lime", time ? `Hesabınla eşit · son eşitleme ${time}` : "Hesabınla eşit"];
}

function accountCard() {
  const s = getSession();
  if (!cloudConfigured() || !s) return "";
  return `<div class="section-title">Hesap</div>
    <div class="card">
      <div class="between"><div style="min-width:0"><div class="tiny muted">Giriş yapılan hesap</div><b class="ellipsis">${esc(s.user.email)}</b></div>
        <button type="button" class="btn sm" data-sync>Şimdi eşitle</button></div>
      <p class="small" style="margin:10px 0 12px" data-status></p>
      <div class="grid2">
        <button type="button" class="btn" data-passwd>Şifre değiştir</button>
        <button type="button" class="btn danger" data-logout>Çıkış yap</button>
      </div>
      <button type="button" class="link-btn danger-link" style="margin-top:12px" data-delete-account>Hesabımı kalıcı olarak sil</button>
    </div>`;
}

// Hesap silme: geri alınamaz; yanlışlıkla silinmesin diye e-posta adresinin yazılması istenir
function openDeleteAccount(ctx) {
  const email = getSession()?.user.email || "";
  const sheet = openSheet(`
    <div class="between"><div class="h2" style="color:var(--red)">Hesabımı sil</div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button></div>
    <p class="small" style="color:var(--text-2)">Bu işlem <b>geri alınamaz</b>. Silinecekler:</p>
    <ul class="small" style="color:var(--text-2);margin:0 0 10px;padding-left:18px">
      <li>hesabın ve e-posta adresin,</li>
      <li>bulutta saklanan tüm verilerin (profil, program, antrenman geçmişi, yemek ve kilo kayıtları, ayarlar),</li>
      <li>bu cihazdaki kopya ve kayıtlıysa yapay zekâ API anahtarın.</li>
    </ul>
    <p class="tiny muted">Diğer cihazlarındaki kopyalar o cihazlar açıldığında hesaba bağlanamaz; oradan da çıkış yapabilirsin. Verilerini saklamak istersen önce yedek indir.</p>
    <button type="button" class="btn block" data-del-export>${icon("download")} Önce yedeği indir</button>
    <label class="field" style="margin:14px 0 10px"><span class="label">Onaylamak için e-posta adresini yaz</span>
      <input class="input" type="email" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(email)}" data-del-email></label>
    <p class="small hidden" style="color:var(--red);margin:0 0 10px" role="alert" data-del-err></p>
    <button type="button" class="btn danger block" data-del-go disabled>${icon("trash")} Hesabımı kalıcı olarak sil</button>`,
    { label: "Hesabı sil" });
  const el = sheet.el;
  const input = el.querySelector("[data-del-email]");
  const go = el.querySelector("[data-del-go]");
  input.addEventListener("input", () => { go.disabled = input.value.trim().toLowerCase() !== email.toLowerCase(); });
  el.querySelector("[data-del-export]").addEventListener("click", downloadBackup);
  go.addEventListener("click", async () => {
    const err = el.querySelector("[data-del-err]");
    err.classList.add("hidden");
    go.disabled = true; go.textContent = "Siliniyor…";
    try {
      await deleteAccount();
      sheet.close();
      toast("Hesabın ve tüm verilerin silindi");
      setTimeout(() => ctx.signedOut(), 1200);
    } catch (e) {
      err.textContent = e.message || "Hesap silinemedi. Tekrar dene.";
      err.classList.remove("hidden");
      go.disabled = false; go.innerHTML = `${icon("trash")} Hesabımı kalıcı olarak sil`;
    }
  });
}

function downloadBackup() {
  const blob = new Blob([exportData()], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `antrenman-yedek-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function paintStatus(root) {
  const el = root.querySelector("[data-status]");
  if (!el) return;
  const [kind, text] = statusText(getStatus());
  el.textContent = text;
  el.style.color = kind ? `var(--${kind})` : "var(--muted)";
}

function changePassword() {
  const sheet = openSheet(`
    <div class="between" style="align-items:flex-start"><div class="h2">Şifre değiştir</div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button></div>
    <form data-pw novalidate style="margin-top:12px">
      <label class="field"><span class="label">Yeni şifre</span><input class="input" type="password" name="p1" autocomplete="new-password" minlength="8" required></label>
      <label class="field"><span class="label">Yeni şifre (tekrar)</span><input class="input" type="password" name="p2" autocomplete="new-password" required></label>
      <p class="small hidden" style="color:var(--red);margin:0 0 10px" data-err role="alert"></p>
      <button type="submit" class="btn primary block">Kaydet</button>
    </form>`, { label: "Şifre değiştir" });
  const form = sheet.el.querySelector("[data-pw]");
  form.elements.p1.focus();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = form.querySelector("[data-err]");
    const p1 = form.elements.p1.value, p2 = form.elements.p2.value;
    const msg = p1.length < 8 ? "Şifre en az 8 karakter olmalı." : p1 !== p2 ? "Şifreler aynı değil." : "";
    err.textContent = msg; err.classList.toggle("hidden", !msg);
    if (msg) return;
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    try { await updatePassword(p1); sheet.close(); toast("Şifren güncellendi"); }
    catch (ex) { err.textContent = ex.message; err.classList.remove("hidden"); btn.disabled = false; }
  });
}

function statsCard() {
  const p = state.profile;
  if (!p) return "";
  const b = bmiInfo(p.weight, p.height), tb = bmiInfo(p.target, p.height);
  const diff = Math.round((p.target - p.weight) * 10) / 10;
  const changed = profileChanges().length > 0;
  return `
    ${message ? `<div class="notice lime">${esc(message)}</div>` : ""}
    ${changed ? `<div class="notice orange"><b>Programın eski profil bilgilerine göre oluşturulmuştu.</b>
      <button type="button" class="btn primary block" style="margin-top:10px" data-regen>Programı yeni profile göre oluştur</button></div>` : ""}
    <div class="card"><div class="stats">
      <div class="stat"><b>${fmt(b.value)}</b><span>BMI · ${b.cat}</span></div>
      <div class="stat"><b>${fmt(tb.value)}</b><span>Hedef kiloda BMI · ${tb.cat}</span></div>
      <div class="stat"><b>${diff > 0 ? "+" : ""}${fmt(diff)} kg</b><span>Hedefe fark</span></div>
      <div class="stat"><b>${ageGroup(p.age).replace("-", "–")}</b><span>Program yaş grubu</span></div>
    </div><p class="tiny muted">BMI kas kütlesini hesaba katmaz; kaslı kişilerde yüksek çıkabilir.</p></div>`;
}

export function render(main, ctx) {
  const p = state.profile || {};
  // Profil yoksa çarklar ortalama değerlerden başlar
  const weight = p.weight ?? 75;
  main.innerHTML = `<div class="tab">
    <form class="card" data-form novalidate>
      <div class="eyebrow" style="margin-bottom:10px">Kişisel bilgiler</div>
      <div class="field"><span class="label">Cinsiyet</span><div class="chips">
        <input type="radio" name="sex" id="sex-e" value="erkek" ${p.sex === "erkek" ? "checked" : ""}><label for="sex-e">Erkek</label>
        <input type="radio" name="sex" id="sex-k" value="kadin" ${p.sex === "kadin" ? "checked" : ""}><label for="sex-k">Kadın</label>
      </div></div>
      <div class="grid2">
        ${pickerHtml({ name: "age", label: "Yaş", min: 18, max: 90, value: p.age ?? 30, unit: "yaş" })}
        ${pickerHtml({ name: "height", label: "Boy", min: 130, max: 220, value: p.height ?? 175, unit: "cm" })}
      </div>
      <div class="grid2">
        ${pickerHtml({ name: "weight", label: "Mevcut kilo", min: 35, max: 250, value: weight, unit: "kg", decimal: true })}
        ${pickerHtml({ name: "target", label: "Hedef kilo", min: 35, max: 250, value: p.target ?? weight, unit: "kg", decimal: true })}
      </div>
      <p class="tiny muted" style="margin:-4px 0 12px">Bir alana dokun, açılan çarkı kaydır ya da bir sayıya dokunarak seç.</p>
      <p class="small hidden" style="color:var(--red);margin:0 0 10px" data-err></p>
      <button type="submit" class="btn primary block">Profili kaydet</button>
    </form>
    ${statsCard()}
    ${workoutSettingsCard()}
    ${aiCard()}
    ${accountCard()}
    <div class="section-title">Verilerin</div>
    <div class="card">
      <p class="small muted" style="margin-top:0">${getSession() && cloudConfigured()
        ? "Verilerin hesabında saklanır. İstersen ayrıca bir yedek dosyası da indirebilirsin."
        : "Tüm veriler yalnızca bu cihazda saklanır. Telefon değiştirirken veya tarayıcı verisini temizlemeden önce yedek al."}</p>
      <div class="grid2">
        <button type="button" class="btn" data-export>${icon("download")} Yedeği indir</button>
        <button type="button" class="btn" data-import>${icon("upload")} Yedeği yükle</button>
      </div>
      <input type="file" accept="application/json,.json" class="hidden" data-file>
      <button type="button" class="btn danger block" style="margin-top:10px" data-reset>${icon("trash")} Tüm verileri sil</button>
      <button type="button" class="btn block" style="margin-top:10px" data-privacy>KVKK aydınlatma metni</button>
      ${state.legal?.transferConsentAt ? `<p class="tiny muted" style="margin:8px 0 0">Yurt dışı aktarım açık rızan: ${esc(new Date(state.legal.transferConsentAt).toLocaleDateString("tr-TR"))} (metin sürümü ${esc(state.legal.version)}).</p>` : ""}
    </div>
  </div>`;

  const root = main.firstElementChild;
  initPickers(root);
  bindWorkoutSettings(root, ctx);
  bindAi(root, ctx);
  unwatch?.();
  unwatch = onStatus(() => (root.isConnected ? paintStatus(root) : (unwatch?.(), (unwatch = null))));
  paintStatus(root);
  const form = root.querySelector("[data-form]");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const err = root.querySelector("[data-err]");
    const fd = new FormData(form);
    const next = { age: +fd.get("age"), sex: fd.get("sex"), height: +fd.get("height"), weight: +fd.get("weight"), target: +fd.get("target") };
    // Çarklar yalnızca geçerli aralıkta değer üretir; kontrol edilecek tek şey cinsiyet seçimi
    const msg = !next.sex ? "Lütfen cinsiyet seç" : "";
    err.textContent = msg;
    err.classList.toggle("hidden", !msg);
    if (msg) { form.querySelector('input[name="sex"]').focus(); return; }
    const first = !state.profile;
    state.profile = next;
    save();
    message = first ? "Profil kaydedildi. Şimdi Program sekmesinden programını oluştur." : "Profil kaydedildi.";
    if (first && !state.program) return ctx.go("program");
    ctx.refresh();
  });

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-privacy]")) return openPrivacy();
    if (e.target.closest("[data-sync]")) return void syncNow();
    if (e.target.closest("[data-passwd]")) return changePassword();
    if (e.target.closest("[data-logout]")) {
      ask("Bu cihazdaki veriler temizlenecek; hesabındaki veriler yerinde kalır. Tekrar giriş yapınca geri gelir.", { title: "Çıkış yapılsın mı?", ok: "Çıkış yap" })
        .then(async (ok) => { if (ok && (await logout())) ctx.signedOut(); });
      return;
    }
    if (e.target.closest("[data-regen]")) {
      createProgram(state.program.input).then((ok) => { if (ok) { message = ""; toast("Program yeni profile göre oluşturuldu"); ctx.go("program"); } });
      return;
    }
    if (e.target.closest("[data-export]")) return downloadBackup();
    if (e.target.closest("[data-delete-account]")) return openDeleteAccount(ctx);
    if (e.target.closest("[data-import]")) return root.querySelector("[data-file]").click();
    if (e.target.closest("[data-reset]")) {
      ask(`Profil, program ve tüm antrenman geçmişi ${getSession() && cloudConfigured() ? "bu cihazdan ve hesabından " : ""}silinecek. Bu işlem geri alınamaz; istersen önce yedeği indir.`, { title: "Tüm veriler silinsin mi?", ok: "Hepsini sil", danger: true })
        .then((ok) => { if (ok) { resetAll(); message = ""; toast("Tüm veriler silindi"); ctx.go("profile"); } });
    }
  });
  root.querySelector("[data-file]").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // aynı dosya tekrar seçilebilsin
    if (!file) return;
    const ok = await ask("Bu cihazdaki mevcut profil, program ve geçmiş, yedektekilerle değiştirilecek.", { title: "Yedek yüklensin mi?", ok: "Yükle" });
    if (!ok) return;
    try { importData(await file.text()); message = "Yedek geri yüklendi."; ctx.refresh(); }
    catch (err) { toast(err.message); }
  });
}
