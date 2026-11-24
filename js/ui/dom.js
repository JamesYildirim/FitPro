// Ortak arayüz yardımcıları: kaçış, biçimlendirme, ikonlar, bildirim, alt pencere

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmt = (x, digits = 1) => Number(x).toLocaleString("tr-TR", { maximumFractionDigits: digits });
export const fmtDate = (d, opts = { day: "numeric", month: "short" }) => new Date(d).toLocaleDateString("tr-TR", opts);
export const DAY_MS = 864e5;

// Basit çizgi ikonlar (24×24)
const ICONS = {
  dumbbell: '<path d="M6 7v10M18 7v10M3 9.5v5M21 9.5v5M6 12h12"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M8 2.5v4M16 2.5v4M3 10h18"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  chart: '<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
  pause: '<path d="M8.5 5v14M15.5 5v14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  swap: '<path d="M20 10a8 8 0 0 0-14.5-3.5L4 8"/><path d="M4 3.5V8h4.5"/><path d="M4 14a8 8 0 0 0 14.5 3.5L20 16"/><path d="M20 20.5V16h-4.5"/>',
  bolt: '<path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11"/>',
  download: '<path d="M12 3.5v11M7 10l5 5 5-5M4 20.5h16"/>',
  upload: '<path d="M12 20.5v-11M7 14l5-5 5 5M4 3.5h16"/>',
  flag: '<path d="M5 21V4M5 4h11.5l-2.5 4 2.5 4H5"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  apple: '<path d="M12 7.5c-1.5-1.3-3.6-1.6-5.2-.6C4.6 8.3 4.3 11.6 5.6 14.8 6.9 18 9 20.5 10.6 20.5c.6 0 1-.4 1.4-.4s.8.4 1.4.4c1.6 0 3.7-2.5 5-5.7 1.3-3.2 1-6.5-1.2-7.9-1.6-1-3.7-.7-5.2.6z"/><path d="M12 7.5c0-2 1-3.7 3-4.5"/>',
};
export const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg>`;

let toastTimer = null;
export function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

// Tarayıcılar titreşime yalnızca kullanıcı sayfaya dokunduktan sonra izin verir; öncesinde deneyip konsolu kirletme
export const vibrate = (ms) => {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate?.(ms);
  } catch {}
};

// Alttan açılan pencere. Escape, arka plana dokunma ve kapat butonu ile kapanır.
export function openSheet(innerHtml, { label = "", onClose } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "sheet";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  if (label) wrap.setAttribute("aria-label", label);
  wrap.innerHTML = `<div class="sheet-panel"><div class="grabber"></div>${innerHtml}</div>`;
  const prevFocus = document.activeElement;
  const close = () => {
    if (!wrap.isConnected) return;
    wrap.remove();
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
    onClose?.();
    prevFocus?.focus?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  wrap.addEventListener("click", (e) => {
    if (e.target === wrap || e.target.closest("[data-close]")) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";
  wrap.querySelector("[data-close]")?.focus();
  return { el: wrap, close };
}

// Uygulama içi onay penceresi. Tarayıcının confirm() penceresi bazı ortamlarda (gömülü önizleme,
// bazı kurulu PWA'lar) hiç gösterilmeden "hayır" döner; bu yüzden kullanılmaz.
// Promise<boolean> döner: "evet" → true, vazgeç / arka plana dokunma / Escape → false
export function ask(message, { title = "Emin misin?", ok = "Evet", cancel = "Vazgeç", danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const s = openSheet(`
      <div class="h2" style="margin-bottom:8px">${esc(title)}</div>
      <p class="small" style="color:var(--text-2);margin:0 0 16px;white-space:pre-line">${esc(message)}</p>
      <div class="grid2">
        <button type="button" class="btn" data-close>${esc(cancel)}</button>
        <button type="button" class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(ok)}</button>
      </div>`, { label: title, onClose: () => { if (!answered) resolve(false); } });
    s.el.querySelector("[data-ok]").addEventListener("click", () => { answered = true; resolve(true); s.close(); });
  });
}

// Programdaki gün adı ↔ JS gün numarası (0 = Pazar)
export const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
export const todayName = () => DAY_NAMES[new Date().getDay()];
export const shortDay = (d) => ({ Pazartesi: "Pzt", Salı: "Sal", Çarşamba: "Çar", Perşembe: "Per", Cuma: "Cum", Cumartesi: "Cmt", Pazar: "Paz" }[d] || d);
