// Fotoğraftan yiyecek ve kalori tahmini.
// Model sabit bir JSON şablonuyla cevap verir (structured outputs); cevap burada ayrıca denetlenir.
// Denetimden geçmeyen cevap hatalar belirtilerek BİR kez yeniden istenir; ikinci kez de geçmezse hata gösterilir.
// Hiçbir şey kendiliğinden kaydedilmez: sonuçlar kullanıcıya düzenlenebilir kartlar olarak sunulur.
import { createMessage, textOf, AiError } from "./claude.js";

const ITEM = {
  type: "object",
  properties: {
    name: { type: "string", description: "Yiyeceğin Türkçe adı, kısa (ör. 'Izgara tavuk göğsü')" },
    portion: { type: "string", description: "Görünen miktarın kısa tarifi (ör. '1 tabak', '2 dilim')" },
    grams: { type: "number", description: "Fotoğraftaki miktarın tahmini ağırlığı, gram" },
    kcal: { type: "number", description: "Bu miktarın toplam kalorisi" },
    protein_g: { type: "number" },
    carbs_g: { type: "number" },
    fat_g: { type: "number" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["name", "portion", "grams", "kcal", "protein_g", "carbs_g", "fat_g", "confidence"],
  additionalProperties: false,
};

export const FOOD_SCHEMA = {
  type: "object",
  properties: {
    is_food: { type: "boolean", description: "Fotoğrafta yenecek bir şey var mı" },
    items: { type: "array", items: ITEM },
    note: { type: "string", description: "Varsayımlar ve uyarılar, Türkçe, en fazla 2 kısa cümle" },
  },
  required: ["is_food", "items", "note"],
  additionalProperties: false,
};

export const SYSTEM = `Sen bir beslenme uzmanısın. Kullanıcının fotoğrafını çektiği yemeğin kalori ve makrolarını tahmin ediyorsun.
- Fotoğraftaki her ayrı yiyeceği ayrı bir kalem olarak yaz (ör. pilav, tavuk, salata ayrı). Aynı yiyeceğin parçalarını tek kalemde topla.
- Değerler fotoğrafta GÖRÜNEN miktarın tamamı içindir, 100 g için değil. Gramı tabak, çatal ve el gibi nesnelerin boyutundan tahmin et.
- Pişirme yağını ve sosları hesaba kat; yağlı göründüğü halde emin olamıyorsan bunu notta belirt.
- Kalori ile makrolar tutarlı olmalı: kcal ≈ protein×4 + karbonhidrat×4 + yağ×9.
- Kullanıcının notu varsa (ör. "yağsız", "2 dilim ekmek") ona öncelik ver.
- Emin olmadığın kalemlerde confidence "low" yaz. Fotoğrafta yiyecek yoksa is_food=false ve boş liste döndür.
- Ad ve notları Türkçe yaz.`;

const r1 = (x) => Math.round(x * 10) / 10;
export const macroKcal = (p, c, f) => p * 4 + c * 4 + f * 9;

// Saf denetim: { items, errors } — items normalize edilmiş (yuvarlanmış) kalemlerdir
export function validateFood(out) {
  const errors = [];
  if (!out || typeof out !== "object" || !Array.isArray(out.items)) return { items: [], errors: ["Cevap beklenen şablonda değil."] };
  if (out.is_food === false) return { items: [], errors: [], notFood: true, note: String(out.note || "") };
  if (!out.items.length) errors.push("Hiç yiyecek kalemi yok.");
  if (out.items.length > 15) errors.push("Çok fazla kalem var (en fazla 15).");
  const items = out.items.slice(0, 15).map((it, i) => {
    const tag = `${i + 1}. kalem (${it?.name || "adsız"})`;
    const name = String(it?.name || "").trim().slice(0, 80);
    const n = (k) => Number(it?.[k]);
    const [grams, kcal, p, c, f] = ["grams", "kcal", "protein_g", "carbs_g", "fat_g"].map(n);
    if (!name) errors.push(`${tag}: ad boş.`);
    if (!(grams > 0 && grams <= 3000)) errors.push(`${tag}: gram 1–3000 arasında olmalı.`);
    if (!(kcal >= 0 && kcal <= 5000)) errors.push(`${tag}: kalori 0–5000 arasında olmalı.`);
    for (const [k, v] of [["protein", p], ["karbonhidrat", c], ["yağ", f]]) if (!(v >= 0 && v <= 500)) errors.push(`${tag}: ${k} 0–500 g arasında olmalı.`);
    if (p + c + f > grams * 1.05) errors.push(`${tag}: makroların toplamı (${r1(p + c + f)} g) yiyeceğin ağırlığını (${grams} g) aşıyor.`);
    const est = macroKcal(p, c, f);
    if (Math.max(kcal, est) > 40 && Math.abs(kcal - est) / Math.max(kcal, est) > 0.25) {
      errors.push(`${tag}: kalori (${Math.round(kcal)}) makrolarla tutarsız (makrolardan ${Math.round(est)} kcal çıkıyor).`);
    }
    return {
      name, portion: String(it?.portion || "").trim().slice(0, 40), grams: Math.round(grams),
      kcal: Math.round(kcal), p: r1(p), c: r1(c), f: r1(f),
      confidence: ["high", "medium", "low"].includes(it?.confidence) ? it.confidence : "low",
    };
  });
  return { items, errors, note: String(out.note || "").slice(0, 300) };
}

// Kullanıcı gramı değiştirince değerleri orantılı ölçekler
export function scaleItem(item, grams) {
  const k = item.grams > 0 ? grams / item.grams : 1;
  return { ...item, grams: Math.round(grams), kcal: Math.round(item.kcal * k), p: r1(item.p * k), c: r1(item.c * k), f: r1(item.f * k) };
}

function parseJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function userContent(imageBase64, note, hint) {
  const parts = [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } }];
  let text = "Bu fotoğraftaki yiyeceklerin kalori ve makrolarını tahmin et.";
  if (note) text += `\nKullanıcının notu: ${note}`;
  if (hint) text += `\nÖnceki denemende şu sorunlar vardı, bu sefer düzelt:\n- ${hint.join("\n- ")}`;
  parts.push({ type: "text", text });
  return parts;
}

// Fotoğrafı analiz eder → { items, note } ; hata durumunda AiError
export async function analyzeFood({ key, model, imageBase64, note = "" }) {
  let hint = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const msg = await createMessage(key, {
      model,
      max_tokens: 16000,
      system: SYSTEM,
      output_config: { effort: "medium", format: { type: "json_schema", schema: FOOD_SCHEMA } },
      messages: [{ role: "user", content: userContent(imageBase64, note.trim().slice(0, 300), hint) }],
    });
    const out = parseJson(textOf(msg));
    const v = validateFood(out);
    if (v.notFood) throw new AiError("Fotoğrafta yiyecek bulunamadı." + (v.note ? " " + v.note : ""), "notfood");
    if (!v.errors.length) return { items: v.items, note: v.note };
    hint = v.errors.slice(0, 8);
  }
  throw new AiError("Yapay zekâ tutarlı bir sonuç veremedi. Fotoğrafı daha yakından ya da daha iyi ışıkta çekip tekrar dene.", "invalid");
}

// Fotoğrafı en uzun kenarı 1024 px olacak şekilde küçültür → JPEG base64 (önekiz)
export async function prepareImage(file, maxSide = 1024) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new AiError("Fotoğraf açılamadı. JPEG ya da PNG bir fotoğraf seç.", "image"));
      im.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    return { base64: dataUrl.slice(dataUrl.indexOf(",") + 1), preview: dataUrl };
  } finally {
    URL.revokeObjectURL(url);
  }
}
