// Fotoğraftan yiyecek ekleme: fotoğraf → (izin) → yapay zekâ tahmini → düzenlenebilir kartlar → öğüne ekle.
// Kullanıcı onaylamadan hiçbir şey kaydedilmez; fotoğraf saklanmaz.
import { esc, fmt, icon, openSheet, ask } from "./dom.js";
import { aiConfig, saveAiConfig, AI_MODELS } from "../ai/key.js";
import { analyzeFood, prepareImage, scaleItem } from "../ai/food.js";
import { LEGAL_VERSION } from "../legal.js";

const CONF = { high: "", medium: "tahmini", low: "emin değil" };
const modelName = (id) => AI_MODELS.find(([m]) => m === id)?.[1] || id;

// Kullanıcı bir fotoğraf seçtiğinde çağrılır. onAdd(entries) seçilen kalemleri öğüne ekler.
export async function openPhotoFlow(file, { mealLabel, onAdd }) {
  let img;
  try { img = await prepareImage(file); } catch (e) { return void ask(e.message, { title: "Fotoğraf açılamadı", ok: "Tamam", cancel: "Kapat" }); }
  let items = [];
  let busy = false;

  const sheet = openSheet(`
    <div class="between">
      <div><div class="eyebrow">${esc(mealLabel)} · yapay zekâ</div><div class="h2">Fotoğraftan ekle</div></div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    <img class="ai-photo" src="${img.preview}" alt="Seçilen yemek fotoğrafı">
    <div data-stage></div>`, { label: "Fotoğraftan yiyecek ekle" });
  const el = sheet.el;
  const stage = el.querySelector("[data-stage]");

  const askView = (error = "") => {
    stage.innerHTML = `
      <div class="field" style="margin:12px 0 10px"><label class="label" for="ai-note">Not (isteğe bağlı)</label>
        <input class="input" id="ai-note" maxlength="300" placeholder="ör. zeytinyağlı, 2 dilim ekmek, yarısını yedim"></div>
      ${error ? `<p class="small" style="color:var(--red);margin:0 0 10px" role="alert">${esc(error)}</p>` : ""}
      <button type="button" class="btn primary block" data-run>${icon("bolt")} Kaloriyi tahmin et</button>
      <p class="tiny muted" style="margin:8px 0 0">Model: ${esc(modelName(aiConfig()?.model))}. Tahmindir; porsiyonu ve gramı kontrol et.</p>`;
  };

  const total = () => items.filter((x) => x.on).reduce((a, x) => a + x.kcal, 0);
  const resultView = (note) => {
    stage.innerHTML = `
      ${note ? `<p class="small muted" style="margin:12px 0 0">${esc(note)}</p>` : ""}
      <div class="ai-items">${items.map((it, i) => `
        <div class="ai-item ${it.on ? "" : "off"}" data-i="${i}">
          <label class="ai-check"><input type="checkbox" data-on ${it.on ? "checked" : ""} aria-label="${esc(it.name)} ekle"></label>
          <div class="ai-body">
            <input class="ai-name" data-name value="${esc(it.name)}" maxlength="80" aria-label="Yiyecek adı">
            <div class="ai-row">
              <label class="ai-grams"><input type="number" inputmode="numeric" min="1" max="3000" step="5" value="${it.grams}" data-grams aria-label="${esc(it.name)} gram"> g</label>
              ${CONF[it.confidence] ? `<span class="tag ${it.confidence === "low" ? "orange" : ""}">${CONF[it.confidence]}</span>` : ""}
            </div>
            <div class="tiny muted" data-macros>${macroText(it)}</div>
          </div>
          <b class="ai-kcal" data-kcal>${fmt(it.kcal, 0)}<small> kcal</small></b>
        </div>`).join("")}</div>
      <button type="button" class="btn primary block" style="margin-top:12px" data-add></button>
      <button type="button" class="btn block" style="margin-top:8px" data-retry>Tekrar tahmin et</button>`;
    paintTotal();
  };
  const macroText = (it) => `${esc(it.portion)} · P ${fmt(it.p, 0)} · K ${fmt(it.c, 0)} · Y ${fmt(it.f, 0)} g`;
  const paintTotal = () => {
    const n = items.filter((x) => x.on).length;
    const b = stage.querySelector("[data-add]");
    b.disabled = !n;
    b.textContent = n ? `${mealLabel} öğününe ekle · ${n} kalem · ${fmt(total(), 0)} kcal` : "Eklenecek kalem seç";
  };

  const run = async () => {
    if (busy) return;
    const cfg = aiConfig();
    if (!cfg) return askView("API anahtarı bulunamadı. Profil → Yapay zekâ kartından ekle.");
    const note = stage.querySelector("#ai-note")?.value || "";
    if (!(cfg.consent && cfg.consentVersion >= LEGAL_VERSION)) {
      const ok = await ask(`Fotoğraf ve notun, kalori tahmini için ABD'deki Anthropic PBC sunucularına (api.anthropic.com) senin API anahtarınla aktarılır. Bu yurt dışı aktarım KVKK m.9 kapsamında açık rızana dayanır; ABD'de Türkiye'deki koruma düzeyi garanti edilemez. Fotoğraf bu uygulamada saklanmaz; Anthropic'in saklama süresi kendi politikasına tabidir. Ücreti anahtarın sahibinin hesabına yazılır. Ayrıntılar: Profil → KVKK aydınlatma metni.`,
        { title: "Fotoğrafın ABD'ye aktarılmasına açık rıza veriyor musun?", ok: "Açık rıza veriyorum, gönder", cancel: "Vazgeç" });
      if (!ok) return;
      saveAiConfig({ consent: true, consentVersion: LEGAL_VERSION, consentAt: new Date().toISOString() });
    }
    busy = true;
    stage.innerHTML = `<div class="ai-wait" role="status"><span class="spin" aria-hidden="true"></span>Yapay zekâ fotoğrafı inceliyor… <span class="tiny muted">10–30 sn sürebilir</span></div>`;
    try {
      const res = await analyzeFood({ key: cfg.key, model: cfg.model, imageBase64: img.base64, note });
      items = res.items.map((x) => ({ ...x, on: true, base: x }));
      resultView(res.note);
    } catch (e) {
      askView(e.message || "Tahmin yapılamadı.");
      if (note) stage.querySelector("#ai-note").value = note;
    } finally { busy = false; }
  };

  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-run]") || e.target.closest("[data-retry]")) return void run();
    if (e.target.closest("[data-add]")) {
      const chosen = items.filter((x) => x.on);
      if (!chosen.length) return;
      onAdd(chosen.map((x) => ({
        name: x.name.trim() || "Yiyecek", portion: `${x.portion ? x.portion + " · " : ""}${x.grams} g`.slice(0, 40),
        qty: 1, kcal: x.kcal, p: x.p, c: x.c, f: x.f,
      })));
      sheet.close();
    }
  });
  el.addEventListener("input", (e) => {
    const row = e.target.closest("[data-i]");
    if (!row) return;
    const it = items[+row.dataset.i];
    if (e.target.matches("[data-name]")) it.name = e.target.value;
    if (e.target.matches("[data-grams]")) {
      const g = Number(e.target.value);
      if (g >= 1 && g <= 3000) {
        Object.assign(it, scaleItem(it.base, g), { name: it.name, on: it.on, base: it.base });
        row.querySelector("[data-kcal]").innerHTML = `${fmt(it.kcal, 0)}<small> kcal</small>`;
        row.querySelector("[data-macros]").innerHTML = macroText(it);
      }
    }
    if (e.target.matches("[data-on]")) { it.on = e.target.checked; row.classList.toggle("off", !it.on); }
    paintTotal();
  });
  askView();
}
