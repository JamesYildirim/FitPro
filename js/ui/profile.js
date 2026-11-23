// Profil sekmesi: kişisel bilgiler, BMI özeti, veri yedekleme / geri yükleme / sıfırlama
import { state, save, exportData, importData, resetAll } from "../state/store.js";
import { bmiInfo, ageGroup } from "../core/nutrition.js";
import { esc, fmt, icon, toast, ask, openSheet } from "./dom.js";
import { createProgram, profileChanges } from "./plan.js";
import { pickerHtml, initPickers } from "./wheel.js";
import { cloudConfigured } from "../config.js";
import { getSession, updatePassword } from "../cloud/auth.js";
import { getStatus, onStatus, syncNow, logout } from "../cloud/sync.js";

let message = "";
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
    </div>`;
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
    </div>
  </div>`;

  const root = main.firstElementChild;
  initPickers(root);
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
    if (e.target.closest("[data-export]")) {
      const blob = new Blob([exportData()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `antrenman-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
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
