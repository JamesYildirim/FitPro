// Eski (Türkçe/karışık) hareket ve gün adları → İngilizce karşılıkları.
// Kayıtlı veride (program, devam eden seans, geçmiş) eski adlar kalmışsa store.js açılışta bunları çevirir.
export const RENAMES = {
  // hareketler
  "Vücut Ağırlığı Squat": "Bodyweight Squat",
  "Hack Squat (Makine)": "Hack Squat",
  "Konvansiyonel Deadlift": "Conventional Deadlift",
  "Tek Bacak Glute Bridge": "Single-Leg Glute Bridge",
  "Tek Bacak RDL": "Single-Leg RDL",
  "Şınav (Push-up)": "Push-up",
  "Diz Üstü Şınav": "Knee Push-up",
  "Decline Şınav (ayaklar yüksekte)": "Decline Push-up",
  "Diamond Şınav": "Diamond Push-up",
  "Makine Chest Press": "Machine Chest Press",
  "Dips (Paralel Bar)": "Parallel Bar Dips",
  "Sandalye Dips": "Chair Dips",
  "Tek Kol Dumbbell Row": "Single-Arm Dumbbell Row",
  "Inverted Row (Vücut Ağırlığı)": "Inverted Row",
  "Oturarak Dumbbell Shoulder Press": "Seated Dumbbell Shoulder Press",
  "Ayakta Dumbbell Shoulder Press": "Standing Dumbbell Shoulder Press",
  "Barfiks (Pull-up)": "Pull-up",
  "Ağırlıklı Barfiks": "Weighted Pull-up",
  "Negatif Barfiks": "Negative Pull-up",
  "Assisted Pull-up (Makine)": "Assisted Pull-up (Machine)",
  "Nordic Curl (destekli)": "Assisted Nordic Curl",
  "Sliding Leg Curl (havlu ile)": "Sliding Leg Curl (Towel)",
  "Sissy Squat (destekli)": "Assisted Sissy Squat",
  "Calf Raise (Ayakta)": "Standing Calf Raise",
  "Oturarak Calf Raise": "Seated Calf Raise",
  "Tek Bacak Calf Raise": "Single-Leg Calf Raise",
  "Makine Lateral Raise": "Machine Lateral Raise",
  "Tek Kol Cable Pushdown": "Single-Arm Cable Pushdown",
  // gün başlıkları
  "Üst Vücut A": "Upper Body A",
  "Üst Vücut B": "Upper Body B",
  "Alt Vücut A": "Lower Body A",
  "Alt Vücut B": "Lower Body B",
  "Üst Vücut": "Upper Body",
  "Alt Vücut + Core": "Lower Body + Core",
  "Push (İtiş)": "Push",
  "Pull (Çekiş)": "Pull",
  "Legs (Bacak)": "Legs",
};

// Nesnedeki tüm string değerlerde eski adı yenisiyle değiştirir (yerinde). Değişiklik olduysa true.
export function renameDeep(obj) {
  let changed = false;
  const walk = (o) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string" && RENAMES[v]) { o[k] = RENAMES[v]; changed = true; }
      else if (v && typeof v === "object") walk(v);
    }
  };
  walk(obj);
  return changed;
}
