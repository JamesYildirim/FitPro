// Uygulama girişi: oturum kontrolü, sekme yönlendirme, üst bar, service worker
import { state } from "./state/store.js";
import { cloudConfigured } from "./config.js";
import { getSession, consumeRedirect } from "./cloud/auth.js";
import { initSync, logout } from "./cloud/sync.js";
import { ensureConsent } from "./ui/privacy.js";
import { icon, toast } from "./ui/dom.js";
import { showAuth, hideAuth } from "./ui/auth.js";
import { initTimer } from "./ui/timer.js";
import { normalizeProgram } from "./ui/plan.js";
import * as workout from "./ui/workout.js";
import * as nutrition from "./ui/nutrition.js";
import * as program from "./ui/program.js";
import * as library from "./ui/library.js";
import * as stats from "./ui/stats.js";
import * as profile from "./ui/profile.js";

const TABS = {
  workout: { mod: workout, icon: "dumbbell", subtitle: () => state.active ? state.active.title : "Bugünkü antrenman" },
  nutrition: { mod: nutrition, icon: "apple", subtitle: () => "Kalori, makro ve kilo takibi" },
  program: { mod: program, icon: "calendar", subtitle: () => "Haftalık program" },
  // Menüde yok; Program sekmesinden açılır, menüde "Program" seçili görünür
  library: { mod: library, icon: "grid", nav: "program", subtitle: () => "Hareket kütüphanesi" },
  stats: { mod: stats, icon: "chart", subtitle: () => "İlerleme ve analiz" },
  profile: { mod: profile, icon: "user", subtitle: () => "Profil ve veriler" },
};

let current = null;
let booted = false;
const main = document.getElementById("main");

const ctx = {
  go(tab, opts = {}) {
    current = tab;
    try { sessionStorage.setItem("tab", tab); } catch {}
    const navTab = TABS[tab].nav || tab;
    document.querySelectorAll(".nav button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === navTab)));
    ctx.refresh();
    if (!opts.keepScroll) window.scrollTo(0, 0);
  },
  refresh() {
    document.getElementById("subtitle").textContent = TABS[current].subtitle();
    TABS[current].mod.render(main, ctx);
  },
  // Çıkış yapınca / oturum düşünce giriş ekranına dön (sayfa yeniden yüklenerek temiz başlar)
  signedOut() { location.reload(); },
};

// İlk sekme: profil yoksa Profil, program yoksa Program, aksi halde Antrenman
function startTab() {
  let start = "workout";
  try { start = sessionStorage.getItem("tab") || start; } catch {}
  if (!state.profile) start = "profile";
  else if (!state.program && start === "workout") start = "program";
  return start in TABS ? start : "workout";
}

function boot() {
  hideAuth(main);
  if (!booted) {
    booted = true;
    document.getElementById("logo").innerHTML = icon("bolt");
    document.querySelectorAll(".nav button").forEach((b) => {
      b.insertAdjacentHTML("afterbegin", icon(TABS[b.dataset.tab].icon));
      b.addEventListener("click", () => ctx.go(b.dataset.tab));
    });
    for (const t of Object.values(TABS)) t.mod.init?.(main, ctx);
    initTimer();
  }
  normalizeProgram();
  ctx.go(startTab());
  if (cloudConfigured() && getSession()) requireConsent();
}

// Hesaplı kullanımda aydınlatma metni + yurt dışı aktarım açık rızası şart (KVKK m.9, m.10).
// Pencere karar verilmeden kapatılırsa yeniden açılır; reddedilirse çıkış yapılır.
async function requireConsent() {
  let answer;
  while ((answer = await ensureConsent()) === "dismiss");
  if (answer === "no" && (await logout())) ctx.signedOut();
  else if (answer === "no") requireConsent(); // çıkıştan vazgeçti: onay yeniden istenir
}

// Buluttan farklı veri gelince ekranı yenile
function onReplaced() {
  if (!booted) return;
  normalizeProgram();
  ctx.go(startTab(), { keepScroll: true });
  toast("Veriler hesabından güncellendi");
}

// Giriş başarılı: önce buluttaki veriyi çek (yeni cihazda boş açılmasın), sonra uygulamayı aç
async function afterLogin() {
  main.innerHTML = `<div class="tab"><div class="card" style="text-align:center"><div class="small muted">Verilerin yükleniyor…</div></div></div>`;
  await initSync({ onReplaced, onSignedOut: () => ctx.signedOut() });
  boot();
}

async function start() {
  if (!cloudConfigured()) return boot(); // bulut ayarlanmamış: yalnızca bu cihazda çalışır

  // E-postadaki onay / şifre yenileme bağlantısından dönüş
  const r = await consumeRedirect();
  if (r?.error) return showAuth(main, { notice: { kind: "red", text: r.error }, onDone: afterLogin });
  if (r?.type === "recovery") {
    return showAuth(main, { view: "newpass", onDone: () => { toast("Şifren güncellendi"); afterLogin(); } });
  }
  if (r?.session) { toast("E-posta adresin onaylandı"); return afterLogin(); }

  if (!getSession()) return showAuth(main, { onDone: afterLogin });
  // Oturum var: cihazdaki veriyle hemen aç, eşitleme arka planda (internet yoksa da çalışır)
  boot();
  initSync({ onReplaced, onSignedOut: () => ctx.signedOut() });
}

start();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
