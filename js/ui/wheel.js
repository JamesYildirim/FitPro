// Telefon tarzı çark seçici: textbox görünümlü bir alana dokununca altında açılır,
// yukarı-aşağı kaydırılır, bir değere dokununca seçilir ve kapanır.
// (Ondalıklı alanda tam sayıya dokunmak ondalık sütuna geçirir; ondalığa dokununca kapanır.)
// Dışarı dokunmak, Esc veya Enter de kapatır.
// Kullanım:
//   html  += pickerHtml({ name: "age", label: "Yaş", min: 18, max: 90, value: 34, unit: "yaş" })
//   html  += pickerHtml({ name: "weight", label: "Kilo", min: 35, max: 250, value: 82.5, unit: "kg", decimal: true })
//   (DOM'a eklendikten sonra) initPickers(root)
// Değer, formla birlikte gönderilen gizli <input name="..."> içinde tutulur.
import { esc, vibrate } from "./dom.js";

const H = 36; // satır yüksekliği (px) — CSS'teki .picker-item ile aynı olmalı (5 satır görünür)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function columnHtml(key, min, max, value, labelId) {
  let items = "";
  for (let v = min; v <= max; v++) items += `<div class="picker-item" data-v="${v}">${v}</div>`;
  return `<div class="picker-col" data-col="${key}" data-min="${min}" data-max="${max}" data-value="${value}"
    tabindex="0" role="spinbutton" aria-labelledby="${labelId}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}">${items}</div>`;
}

export function pickerHtml({ name, label, min, max, value, unit = "", decimal = false }) {
  const v = clamp(Number.isFinite(+value) ? +value : min, min, max);
  const ip = Math.floor(v + 1e-9);
  const dp = decimal ? clamp(Math.round((v - ip) * 10), 0, 9) : 0;
  const id = `pk-${name}`;
  return `<div class="field picker-field">
    <span class="label" id="${id}">${esc(label)}</span>
    <button type="button" class="input picker-trigger" aria-haspopup="true" aria-expanded="false" aria-labelledby="${id} ${id}-v">
      <span id="${id}-v"><b class="picker-val">${display(ip, dp, decimal)}</b>${unit ? ` <span class="picker-trigger-unit">${esc(unit)}</span>` : ""}</span>
      <span class="picker-chev" aria-hidden="true">▾</span>
    </button>
    <div class="picker-pop" hidden>
      <div class="picker ${decimal ? "dec" : ""}" data-picker="${esc(name)}" data-decimal="${decimal ? 1 : 0}">
        <div class="picker-band" aria-hidden="true"></div>
        ${columnHtml("i", min, max, ip, id)}
        ${decimal ? `<span class="picker-sep" aria-hidden="true">,</span>${columnHtml("d", 0, 9, dp, id)}` : ""}
        ${unit ? `<span class="picker-unit" aria-hidden="true">${esc(unit)}</span>` : ""}
        <input type="hidden" name="${esc(name)}" value="${decimal ? (ip + dp / 10).toFixed(1) : ip}">
      </div>
    </div>
  </div>`;
}

const display = (i, d, decimal) => (decimal ? `${i},${d}` : String(i));

// --- Açma / kapama ---
let openField = null;

function closePicker(field = openField, refocus = false) {
  if (!field) return;
  field.querySelector(".picker-pop").hidden = true;
  const trig = field.querySelector(".picker-trigger");
  trig.setAttribute("aria-expanded", "false");
  if (refocus) trig.focus();
  if (openField === field) openField = null;
}

function openPicker(field) {
  if (openField && openField !== field) closePicker(openField);
  const pop = field.querySelector(".picker-pop");
  pop.hidden = false;
  field.querySelector(".picker-trigger").setAttribute("aria-expanded", "true");
  openField = field;
  // Gizliyken scrollTop ayarlanamaz; görünür olunca seçili değere konumla
  field.querySelectorAll(".picker-col").forEach((col) => {
    col.scrollTop = (+col.dataset.value - +col.dataset.min) * H;
    paint(col);
  });
  field.querySelector(".picker-col").focus({ preventScroll: true });
  pop.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

// Dışarı dokununca kapat (tek sefer kaydedilir)
document.addEventListener("pointerdown", (e) => {
  if (openField && !openField.contains(e.target)) closePicker(openField);
}, true);

// Ortaya uzaklığa göre satırları soldur/küçült (yalnızca görünen aralık)
function paint(col) {
  const center = col.scrollTop / H;
  const items = col.children;
  const from = Math.max(0, Math.floor(center) - 4), to = Math.min(items.length - 1, Math.ceil(center) + 4);
  for (let i = from; i <= to; i++) {
    const d = Math.min(3, Math.abs(i - center));
    items[i].style.opacity = String(Math.max(0.18, 1 - d * 0.3));
    items[i].style.transform = `scale(${1 - d * 0.07})`;
    items[i].classList.toggle("on", d < 0.5);
  }
}

function setupColumn(col, picker) {
  const min = +col.dataset.min, max = +col.dataset.max;
  const indexOf = () => clamp(Math.round(col.scrollTop / H), 0, max - min);
  let raf = 0, timer = 0, lastIdx = +col.dataset.value - min;
  let target = null; // yumuşak kaydırma sürerken gidilen satır (art arda tuş basışları kaybolmasın)
  let closeAfter = false; // dokunarak seçimden sonra kapat
  const field = picker.closest(".picker-field");
  const decimal = picker.dataset.decimal === "1";

  const commit = () => {
    target = null;
    const idx = indexOf();
    const v = min + idx;
    col.dataset.value = v;
    col.setAttribute("aria-valuenow", v);
    const cols = picker.querySelectorAll(".picker-col");
    const i = +cols[0].dataset.value, d = cols[1] ? +cols[1].dataset.value : 0;
    const input = picker.querySelector('input[type="hidden"]');
    input.value = decimal ? (i + d / 10).toFixed(1) : String(i);
    if (field) field.querySelector(".picker-val").textContent = display(i, d, decimal);
    picker.dispatchEvent(new CustomEvent("picker-change", { bubbles: true, detail: { name: input.name, value: +input.value } }));
    if (closeAfter) { closeAfter = false; closePicker(field, true); }
  };
  const goTo = (idx, smooth = true) => {
    target = clamp(idx, 0, max - min);
    col.scrollTo({ top: target * H, behavior: smooth ? "smooth" : "auto" });
  };
  const current = () => target ?? indexOf();

  col.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      paint(col);
      const idx = indexOf();
      if (idx !== lastIdx) { lastIdx = idx; vibrate(4); } // her değerde hafif "tık"
    });
    clearTimeout(timer);
    timer = setTimeout(commit, 120);
  }, { passive: true });

  // Bir değere dokununca ona kaydır ve seç
  col.addEventListener("click", (e) => {
    const it = e.target.closest(".picker-item");
    if (!it || col.dataset.dragged) return;
    const idx = +it.dataset.v - min;
    const isWhole = decimal && col.dataset.col === "i";
    if (isWhole) {
      // Ondalıklı alanda tam sayı seçilince ondalık sütuna geç
      picker.querySelector('.picker-col[data-col="d"]').focus({ preventScroll: true });
    } else {
      closeAfter = true;
    }
    if (idx === indexOf() && col.scrollTop === idx * H) commit(); // zaten ortada: kaydırma olmayacak
    else goTo(idx);
  });

  // Klavye: ok tuşları ±1, Page Up/Down ±10, Home/End, Enter/Esc kapatır
  col.addEventListener("keydown", (e) => {
    const step = { ArrowUp: -1, ArrowDown: 1, PageUp: -10, PageDown: 10 }[e.key];
    if ((e.key === "Enter" || e.key === "Escape") && field) { e.preventDefault(); closePicker(field, true); }
    else if (step) { e.preventDefault(); goTo(current() + step); }
    else if (e.key === "Home") { e.preventDefault(); goTo(0); }
    else if (e.key === "End") { e.preventDefault(); goTo(max - min); }
  });

  // Masaüstünde fareyle sürükleme (dokunmatikte tarayıcının kendi kaydırması kullanılır)
  col.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const startY = e.clientY, startTop = col.scrollTop;
    delete col.dataset.dragged;
    col.style.scrollSnapType = "none";
    const move = (ev) => {
      if (Math.abs(ev.clientY - startY) > 3) col.dataset.dragged = "1";
      col.scrollTop = startTop - (ev.clientY - startY);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      col.style.scrollSnapType = "";
      goTo(indexOf());
      setTimeout(() => delete col.dataset.dragged, 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });

  // Başlangıç konumu (yumuşak kaydırma olmadan)
  col.scrollTop = (+col.dataset.value - min) * H;
  paint(col);
}

export function initPickers(root) {
  root.querySelectorAll("[data-picker]").forEach((picker) => {
    if (picker.dataset.ready) return;
    picker.dataset.ready = "1";
    picker.querySelectorAll(".picker-col").forEach((col) => setupColumn(col, picker));
    const field = picker.closest(".picker-field");
    if (field) field.querySelector(".picker-trigger").addEventListener("click", () => {
      if (openField === field) closePicker(field); else openPicker(field);
    });
  });
}
