// Dinlenme sayacı: bitiş zamanına göre çalışır (ekran kilitlense de doğru kalır), üst barda küçük gösterge
import { icon, openSheet, toast, vibrate } from "./dom.js";

const t = { total: 90, endAt: 0, pausedLeft: 90, running: false };
let tick = 0;
let sheet = null;

const left = () => (t.running ? Math.max(0, Math.ceil((t.endAt - Date.now()) / 1000)) : t.pausedLeft);
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880; g.gain.value = 0.08;
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch {}
}

function update() {
  const s = left();
  const pill = document.getElementById("timer-pill");
  if (pill) {
    pill.classList.toggle("hidden", !t.running);
    pill.innerHTML = `${icon("clock")}<span>${mmss(s)}</span>`;
  }
  if (sheet) {
    const el = sheet.el;
    el.querySelector("[data-val]").textContent = mmss(s);
    el.querySelector("[data-status]").textContent = t.running ? "Dinleniyorsun" : s === 0 ? "Süre doldu" : "Hazır";
    const c = 326.7;
    el.querySelector("[data-prog]").style.strokeDashoffset = String(c * (1 - s / t.total));
    el.querySelector("[data-toggle]").innerHTML = t.running ? `${icon("pause")} Duraklat` : `${icon("play")} Başlat`;
  }
  if (t.running && s === 0) {
    t.running = false;
    t.pausedLeft = 0;
    clearInterval(tick);
    vibrate([200, 100, 200]);
    beep();
    toast("Dinlenme bitti — sıradaki sete geç!");
    update();
  }
}

export function startRest(seconds) {
  t.total = seconds;
  t.endAt = Date.now() + seconds * 1000;
  t.running = true;
  clearInterval(tick);
  tick = setInterval(update, 250);
  update();
}

function toggle() {
  if (t.running) { t.pausedLeft = left(); t.running = false; clearInterval(tick); update(); return; }
  const s = t.pausedLeft || t.total;
  t.endAt = Date.now() + s * 1000;
  t.running = true;
  clearInterval(tick);
  tick = setInterval(update, 250);
  update();
}

function reset(seconds = t.total) {
  t.total = seconds;
  t.pausedLeft = seconds;
  t.running = false;
  clearInterval(tick);
  update();
}

export function openTimer() {
  sheet = openSheet(`
    <div class="between">
      <div><div class="h2">Dinlenme sayacı</div><div class="small muted">Set arası toparlanma</div></div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    <div class="ring">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
        <circle class="prog" data-prog cx="60" cy="60" r="52" fill="none" stroke-width="8" stroke-linecap="round" stroke-dasharray="326.7"/>
      </svg>
      <div class="val"><b data-val>00:00</b><span data-status></span></div>
    </div>
    <div class="presets">
      ${[60, 90, 120, 180].map((s) => `<button type="button" data-preset="${s}">${s < 120 ? s + " sn" : s / 60 + " dk"}</button>`).join("")}
    </div>
    <div class="row">
      <button type="button" class="btn primary" style="flex:1" data-toggle></button>
      <button type="button" class="btn" data-reset>Sıfırla</button>
    </div>
  `, { label: "Dinlenme sayacı", onClose: () => { sheet = null; } });
  sheet.el.querySelector("[data-toggle]").addEventListener("click", toggle);
  sheet.el.querySelector("[data-reset]").addEventListener("click", () => reset());
  sheet.el.querySelectorAll("[data-preset]").forEach((b) => b.addEventListener("click", () => reset(+b.dataset.preset)));
  update();
}

export function initTimer() {
  document.getElementById("timer-btn").innerHTML = icon("clock");
  document.getElementById("timer-btn").addEventListener("click", openTimer);
  document.getElementById("timer-pill").addEventListener("click", openTimer);
  update();
}
