// Profil hesaplamaları: yaş grubu, BMI, Mifflin-St Jeor ile kalori/protein, makro dağılımı, yakılan kalori
export function ageGroup(age) {
  if (age < 30) return "18-29";
  if (age < 40) return "30-39";
  if (age < 50) return "40-49";
  if (age < 60) return "50-59";
  return "60+";
}

export function bmiInfo(kg, cm) {
  const v = kg / (cm / 100) ** 2;
  const cat = v < 18.5 ? "Zayıf" : v < 25 ? "Normal" : v < 30 ? "Fazla kilolu" : "Obez";
  return { value: Math.round(v * 10) / 10, cat };
}

// Mifflin-St Jeor ile tahmini enerji ihtiyacı ve hedefe göre kalori/protein önerisi
export function nutritionPlan(p, goal, days) {
  const r10 = (x) => Math.round(x / 10) * 10;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "erkek" ? 5 : -161);
  const factor = { 3: 1.45, 4: 1.55, 5: 1.65 }[days] || 1.5; // haftalık antrenman sayısına göre aktivite katsayısı
  const tdee = bmr * factor;
  const diff = Math.round((p.target - p.weight) * 10) / 10;
  let mode = "koru", kcal = tdee, rate = 0;
  if (diff < -0.5) { mode = "ver"; kcal = Math.max(tdee - 500, bmr * 1.1); rate = 0.5; }
  else if (diff > 0.5) { mode = "al"; kcal = tdee + 300; rate = 0.25; }
  const bmi = bmiInfo(p.weight, p.height);
  const protBase = bmi.value >= 30 ? p.target : p.weight; // yüksek BMI'da hedef kiloya göre
  return {
    bmr: r10(bmr), tdee: r10(tdee), kcal: r10(kcal), mode, diff, rate,
    weeks: rate ? Math.ceil(Math.abs(diff) / rate) : 0,
    protein: [Math.round(1.6 * protBase), Math.round(2.2 * protBase)],
    bmi, targetBmi: bmiInfo(p.target, p.height),
  };
}

// Günlük makro hedefleri (gram):
//   protein ~2 g/kg (1,6–2,2 aralığında; yüksek BMI'da hedef kiloya göre) — kas koruma/kazanımı için
//   yağ kalorinin ~%27'si, en az 0,6 g/kg — hormon sağlığı için alt sınır
//   karbonhidrat: kalan kalori
export function macroTargets(p, plan) {
  const base = plan.bmi.value >= 30 ? p.target : p.weight;
  const protein = Math.min(plan.protein[1], Math.max(plan.protein[0], Math.round(2 * base)));
  const fat = Math.max(Math.round(0.6 * p.weight), Math.round((plan.kcal * 0.27) / 9));
  const carbs = Math.max(0, Math.round((plan.kcal - protein * 4 - fat * 9) / 4));
  return { kcal: plan.kcal, protein, fat, carbs };
}

// Ağırlık antrenmanında yakılan tahmini kalori: MET × kg × saat (direnç antrenmanı ~5 MET; Ainsworth Compendium)
export const burnedKcal = (minutes, weightKg, met = 5) => Math.round((met * weightKg * minutes) / 60);

// Makrolardan kalori (protein/karbonhidrat 4, yağ 9 kcal/g)
export const kcalFromMacros = (p, c, f) => Math.round((p || 0) * 4 + (c || 0) * 4 + (f || 0) * 9);
