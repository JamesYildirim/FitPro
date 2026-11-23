// Progressive overload motoru: geçmiş seanslara bakarak bir sonraki seans için ağırlık/tekrar önerir.
// Yöntem: çift progresyon — tüm setlerde tekrar aralığının üstüne ulaşınca ağırlık artar, aralığın altından yeniden başlanır.

import { isBodyweightExercise, isBandExercise } from "../data/exercises.js";

const LOWER_POOLS = new Set(["squat", "hinge", "lunge"]);
// Salonda olup ekipman listesinde "gym" görünen ama vücut ağırlığıyla yapılanlar
const GYM_BODYWEIGHT = /Inverted Row|Dips|Ab Wheel|Back Extension|Assisted Pull-up/;
const DUMBBELL = /Dumbbell|Goblet|Kettlebell|Arnold|Lateral Raise \(Dumbbell\)|Hammer|Farmer/;

// "Kilo" alanı ek ağırlık anlamına gelen hareketler (vücut ağırlığı ve bant)
export const isBodyweight = (name) => isBodyweightExercise(name) || isBandExercise(name) || GYM_BODYWEIGHT.test(name);
export const isBand = isBandExercise;
export const isTimed = (reps) => /sn|m$/.test(String(reps));

// "8–12" → [8, 12]; "6" → [6, 6]; süreli hareketler → null
export function parseRange(reps) {
  if (isTimed(reps)) return null;
  const m = String(reps).match(/(\d+)\s*[–-]\s*(\d+)/);
  if (m) return [+m[1], +m[2]];
  const n = parseInt(reps, 10);
  return Number.isFinite(n) ? [n, n] : null;
}

// Bir sonraki ağırlık artışı (kg): alt vücut bileşikleri büyük, izolasyonlar küçük adımlarla
export function increment(name, pool, role) {
  if (DUMBBELL.test(name)) return 2;
  if (role === "İzolasyon" || role === "Core") return 1;
  return LOWER_POOLS.has(pool) ? 5 : 2.5;
}

const round05 = (x) => Math.round(x * 2) / 2;
// Tahmini 1 tekrar maksimum (Epley). 12 tekrarın üstünde güvenilirliği düşer.
export const e1rm = (kg, reps) => (kg > 0 && reps > 0 ? round05(kg * (1 + Math.min(reps, 12) / 30)) : 0);

// Bu hareketin geçmişteki seansları (en yeni önce)
export function performances(history, name) {
  const out = [];
  for (const h of history) {
    const ex = h.exercises.find((e) => e.name === name);
    if (ex && ex.sets.length) out.push({ date: h.date, sets: ex.sets });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

const fmtKg = (kg) => String(kg).replace(".", ",");
export const setsText = (sets) => sets.map((s) => (s.kg ? `${fmtKg(s.kg)}×${s.reps}` : `${s.reps}`)).join(", ");

// Öneri: { kg, reps, kind: "new" | "up" | "same" | "down" | "timed", text, last }
export function suggest(history, { name, pool, role, baseReps }) {
  const range = parseRange(baseReps);
  const bw = isBodyweight(name);
  const perf = performances(history, name);
  const last = perf[0] || null;

  if (!range) {
    return { kg: bw ? 0 : null, reps: null, kind: "timed", last, text: last ? "Süreyi geçen seferden biraz uzatmayı dene." : "Tekniği bozmadan hedef süreyi tamamla." };
  }
  const [lo, hi] = range;
  if (!last) {
    return {
      kg: bw ? 0 : null, reps: lo, kind: "new", last,
      text: bw ? `İlk seans: ${lo}–${hi} tekrar hedefle.` : `İlk seans: ${lo}–${hi} tekrarı tükenişe 1–2 tekrar kala bitirebileceğin kiloyu bul.`,
    };
  }

  const top = Math.max(...last.sets.map((s) => s.kg || 0));
  const atTop = last.sets.filter((s) => (s.kg || 0) === top);
  const inc = increment(name, pool, role);

  if (atTop.every((s) => s.reps >= hi)) {
    if (isBandExercise(name)) {
      return { kg: 0, reps: lo, kind: "up", last, text: `Tüm setlerde ${hi}+ tekrar yaptın → bir sonraki sertlikte banda geç ve ${lo} tekrardan başla (ya da bandı daha gergin tut).` };
    }
    if (bw && top === 0) {
      return { kg: 0, reps: hi, kind: "up", last, text: `Tüm setlerde ${hi}+ tekrar yaptın: daha zor bir varyasyona geç, tempoyu yavaşlat (3 sn indir) ya da sırt çantasıyla ek yük ekle.` };
    }
    return { kg: round05(top + inc), reps: lo, kind: "up", last, text: `Geçen sefer tüm setlerde ${hi} tekrara ulaştın → +${fmtKg(inc)} kg, ${lo} tekrardan başla.` };
  }

  // Son iki seansta aynı kiloda hiçbir set aralığın altına bile ulaşamadıysa: %10 geri çekil
  const prev = perf[1];
  const failed = (p) => p && p.sets.every((s) => s.reps < lo) && Math.max(...p.sets.map((s) => s.kg || 0)) === top;
  if (top > 0 && failed(last) && failed(prev)) {
    return { kg: round05(top * 0.9), reps: lo, kind: "down", last, text: `İki seanstır ${lo} tekrarın altında kaldın → kiloyu ~%10 azalt, tekniği toparla.` };
  }

  const best = Math.max(...atTop.map((s) => s.reps));
  const goalReps = Math.min(hi, Math.max(lo, best + 1));
  return { kg: top, reps: goalReps, kind: "same", last, text: `Aynı kilo: setlerde ${goalReps} tekrara çıkmaya çalış (hedef üst sınır ${hi}).` };
}
