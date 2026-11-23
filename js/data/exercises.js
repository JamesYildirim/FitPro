// Hareket havuzları, ekipman gereksinimleri ve kas eşlemeleri (saf veri)
// Etiketler:
//   safe: 50+ yaş / başlangıç için uygun   adv: yalnızca deneyimli için
//   bb:   ağır yüklenmeye uygun barbell/ana kaldırış (güç hedefinde öncelikli)
//   met:  dumbbell/kettlebell/vücut ağırlığı, devre tipi çalışmaya uygun (yağ yakımı/kondisyonda öncelikli)
//   acc:  yardımcı hareket, günün ana hareketi olarak seçilmez
//   cond: kondisyon odaklı, kas/güç programında ağır slotu doldurmaz

export const EX = {
  squat: [
    { name: "Barbell Back Squat", adv: true, bb: true },
    { name: "Front Squat", adv: true, bb: true },
    { name: "Safety Bar Squat", bb: true, safe: true },
    { name: "Goblet Squat", safe: true, met: true },
    { name: "Leg Press", safe: true },
    { name: "Hack Squat", safe: true },
    { name: "Dumbbell Squat", safe: true, met: true },
    { name: "Bodyweight Squat", safe: true, met: true },
    { name: "Jump Squat", met: true, cond: true },
  ],
  hinge: [
    { name: "Conventional Deadlift", adv: true, bb: true },
    { name: "Trap Bar Deadlift", safe: true, bb: true },
    { name: "Romanian Deadlift (RDL)", safe: true, bb: true },
    { name: "Dumbbell RDL", safe: true, met: true },
    { name: "Hip Thrust", safe: true },
    { name: "Kettlebell Swing", met: true, acc: true, cond: true },
    { name: "Good Morning", adv: true, acc: true },
    { name: "Back Extension (45°)", safe: true, acc: true },
    { name: "Glute Bridge", safe: true, met: true },
    { name: "Single-Leg Glute Bridge", met: true },
    { name: "Single-Leg RDL", met: true },
  ],
  hpush: [
    { name: "Bench Press (Barbell)", bb: true },
    { name: "Close-Grip Bench Press", bb: true },
    { name: "Incline Bench Press (Barbell)", bb: true },
    { name: "Dumbbell Bench Press", safe: true, met: true },
    { name: "Incline Dumbbell Press", safe: true, met: true },
    { name: "Push-up", safe: true, met: true },
    { name: "Machine Chest Press", safe: true },
    { name: "Parallel Bar Dips", adv: true },
    { name: "Knee Push-up", safe: true, met: true },
    { name: "Dumbbell Floor Press", safe: true, met: true },
    { name: "Band Chest Press", safe: true, met: true },
    { name: "Decline Push-up", met: true },
  ],
  hpull: [
    { name: "Barbell Row", adv: true, bb: true },
    { name: "Pendlay Row", adv: true, bb: true },
    { name: "T-Bar Row", bb: true },
    { name: "Seated Cable Row", safe: true },
    { name: "Single-Arm Dumbbell Row", safe: true, met: true },
    { name: "Chest-Supported Row", safe: true },
    { name: "Inverted Row", safe: true, met: true },
    { name: "Dumbbell Bent-Over Row", met: true },
    { name: "Band Row", safe: true, met: true },
    { name: "Prone Y-T Raise", safe: true, met: true },
  ],
  vpush: [
    { name: "Overhead Press (Barbell)", adv: true, bb: true },
    { name: "Push Press", adv: true, bb: true },
    { name: "Seated Dumbbell Shoulder Press", safe: true, met: true },
    { name: "Standing Dumbbell Shoulder Press", met: true },
    { name: "Landmine Press", safe: true },
    { name: "Arnold Press", safe: true, met: true },
    { name: "Pike Push-up", met: true },
    { name: "Band Overhead Press", safe: true, met: true },
  ],
  vpull: [
    { name: "Pull-up", adv: true, bb: true },
    { name: "Weighted Pull-up", adv: true, bb: true },
    { name: "Chin-up", adv: true, met: true },
    { name: "Lat Pulldown", safe: true },
    { name: "Neutral-Grip Lat Pulldown", safe: true },
    { name: "Assisted Pull-up (Machine)", safe: true },
    { name: "Negative Pull-up", safe: true, met: true },
    { name: "Band Lat Pulldown", safe: true, met: true },
  ],
  lunge: [
    { name: "Bulgarian Split Squat", met: true },
    { name: "Walking Lunge", met: true },
    { name: "Step-up", safe: true, met: true },
    { name: "Reverse Lunge", safe: true, met: true },
    { name: "Barbell Split Squat", bb: true },
  ],
  legcurl: [
    { name: "Lying Leg Curl", safe: true, iso: true },
    { name: "Seated Leg Curl", safe: true, iso: true },
    { name: "Assisted Nordic Curl", iso: true },
    { name: "Sliding Leg Curl (Towel)", safe: true, iso: true },
  ],
  legext: [{ name: "Leg Extension", safe: true, iso: true }, { name: "Assisted Sissy Squat", iso: true }],
  calf: [
    { name: "Standing Calf Raise", safe: true, iso: true }, { name: "Seated Calf Raise", safe: true, iso: true },
    { name: "Leg Press Calf Raise", safe: true, iso: true }, { name: "Single-Leg Calf Raise", safe: true, iso: true },
  ],
  lateral: [
    { name: "Lateral Raise (Dumbbell)", safe: true, iso: true }, { name: "Cable Lateral Raise", safe: true, iso: true },
    { name: "Machine Lateral Raise", safe: true, iso: true }, { name: "Band Lateral Raise", safe: true, iso: true },
  ],
  facepull: [
    { name: "Face Pull", safe: true, iso: true }, { name: "Reverse Fly", safe: true, iso: true },
    { name: "Band Pull-Apart", safe: true, iso: true }, { name: "Band Face Pull", safe: true, iso: true },
  ],
  biceps: [
    { name: "Dumbbell Biceps Curl", safe: true, iso: true }, { name: "Hammer Curl", safe: true, iso: true },
    { name: "EZ-Bar Curl", safe: true, iso: true }, { name: "Incline Dumbbell Curl", safe: true, iso: true },
    { name: "Cable Curl", safe: true, iso: true }, { name: "Band Curl", safe: true, iso: true },
  ],
  triceps: [
    { name: "Triceps Pushdown", safe: true, iso: true }, { name: "Overhead Triceps Extension", safe: true, iso: true },
    { name: "Skull Crusher (EZ-Bar)", iso: true }, { name: "Single-Arm Cable Pushdown", safe: true, iso: true },
    { name: "Chair Dips", iso: true }, { name: "Diamond Push-up", iso: true }, { name: "Band Pushdown", safe: true, iso: true },
  ],
  chestfly: [
    { name: "Cable Fly", safe: true, iso: true }, { name: "Pec Deck", safe: true, iso: true },
    { name: "Dumbbell Fly", safe: true, iso: true }, { name: "Band Fly", safe: true, iso: true },
  ],
  core: [
    { name: "Plank", safe: true, iso: true, core: true },
    { name: "Dead Bug", safe: true, iso: true, core: true },
    { name: "Pallof Press", safe: true, iso: true, core: true },
    { name: "Hanging Knee Raise", iso: true, core: true },
    { name: "Side Plank", safe: true, iso: true, core: true },
    { name: "Cable Crunch", safe: true, iso: true, core: true },
    { name: "Ab Wheel Rollout", adv: true, iso: true, core: true },
    { name: "Farmer's Walk", safe: true, iso: true, core: true },
    { name: "Lying Leg Raise", safe: true, iso: true, core: true },
  ],
};

// ---------- Ekipman ----------
// Evde seçilebilen ekipmanlar. "gym" yalnızca salonda bulunan barbell/makine/kablo demektir.
export const EQUIPMENT = [
  ["db", "Dumbbell / kettlebell"],
  ["band", "Direnç bandı"],
  ["bar", "Barfiks barı"],
  ["bench", "Bank / sağlam sandalye"],
];
// Hareketin gerektirdiği ekipman. Boş liste: yalnızca vücut ağırlığı. Listede olmayan hareketler salon ("gym") gerektirir.
const EQ = {
  // vücut ağırlığı
  "Bodyweight Squat": [], "Jump Squat": [], "Glute Bridge": [], "Single-Leg Glute Bridge": [], "Single-Leg RDL": [],
  "Push-up": [], "Knee Push-up": [], "Prone Y-T Raise": [], "Pike Push-up": [], "Walking Lunge": [], "Reverse Lunge": [],
  "Sliding Leg Curl (Towel)": [], "Assisted Nordic Curl": [], "Assisted Sissy Squat": [], "Standing Calf Raise": [],
  "Single-Leg Calf Raise": [], "Diamond Push-up": [], "Plank": [], "Dead Bug": [], "Side Plank": [], "Lying Leg Raise": [],
  // dumbbell / kettlebell
  "Goblet Squat": ["db"], "Dumbbell Squat": ["db"], "Dumbbell RDL": ["db"], "Kettlebell Swing": ["db"], "Dumbbell Floor Press": ["db"],
  "Dumbbell Bent-Over Row": ["db"], "Single-Arm Dumbbell Row": ["db"], "Seated Dumbbell Shoulder Press": ["db"],
  "Standing Dumbbell Shoulder Press": ["db"], "Arnold Press": ["db"], "Lateral Raise (Dumbbell)": ["db"], "Reverse Fly": ["db"],
  "Dumbbell Biceps Curl": ["db"], "Hammer Curl": ["db"], "Overhead Triceps Extension": ["db"], "Farmer's Walk": ["db"],
  // dumbbell + bank
  "Dumbbell Bench Press": ["db", "bench"], "Incline Dumbbell Press": ["db", "bench"], "Dumbbell Fly": ["db", "bench"],
  "Incline Dumbbell Curl": ["db", "bench"],
  // bank / sandalye
  "Hip Thrust": ["bench"], "Bulgarian Split Squat": ["bench"], "Step-up": ["bench"], "Decline Push-up": ["bench"],
  "Chair Dips": ["bench"],
  // direnç bandı
  "Band Chest Press": ["band"], "Band Row": ["band"], "Band Overhead Press": ["band"], "Band Lat Pulldown": ["band"],
  "Band Lateral Raise": ["band"], "Band Face Pull": ["band"], "Band Pull-Apart": ["band"], "Band Curl": ["band"],
  "Band Pushdown": ["band"], "Band Fly": ["band"], "Pallof Press": ["band"],
  // barfiks barı
  "Pull-up": ["bar"], "Chin-up": ["bar"], "Negative Pull-up": ["bar"], "Hanging Knee Raise": ["bar"],
};
export const equipmentOf = (name) => EQ[name] ?? ["gym"];
// env: { location: "salon" | "ev", equipment: ["db", ...] }
export const isAvailable = (name, env) =>
  !env || env.location !== "ev" || equipmentOf(name).every((e) => e !== "gym" && env.equipment.includes(e));
export const isBandExercise = (name) => equipmentOf(name).includes("band");
// Kilosu "ek ağırlık" olan hareketler: vücut ağırlığı veya yalnızca bar/bank gerektirenler
export const isBodyweightExercise = (name) => equipmentOf(name).every((e) => e === "bar" || e === "bench");

// ---------- Ekipman türü (hareket değiştirirken filtre için) ----------
// Her hareketin tek bir ana ekipman türü vardır.
export const GEAR = [
  ["cable", "Kablo"], ["machine", "Makine"], ["db", "Dambıl"], ["barbell", "Barbell"], ["bw", "Vücut ağırlığı"], ["band", "Bant"],
];
export const GEAR_LABEL = Object.fromEntries(GEAR);
// Salon ("gym") hareketlerinin türü; burada olmayan salon hareketi "machine" sayılır
const GYM_GEAR = {
  barbell: ["Barbell Back Squat", "Front Squat", "Safety Bar Squat", "Conventional Deadlift", "Trap Bar Deadlift",
    "Romanian Deadlift (RDL)", "Good Morning", "Bench Press (Barbell)", "Close-Grip Bench Press", "Incline Bench Press (Barbell)",
    "Barbell Row", "Pendlay Row", "T-Bar Row", "Overhead Press (Barbell)", "Push Press", "Landmine Press", "Barbell Split Squat",
    "EZ-Bar Curl", "Skull Crusher (EZ-Bar)"],
  cable: ["Seated Cable Row", "Lat Pulldown", "Neutral-Grip Lat Pulldown", "Cable Lateral Raise", "Face Pull", "Cable Curl",
    "Triceps Pushdown", "Single-Arm Cable Pushdown", "Cable Fly", "Cable Crunch"],
  bw: ["Parallel Bar Dips", "Inverted Row", "Weighted Pull-up", "Ab Wheel Rollout"],
};
const GYM_GEAR_OF = Object.fromEntries(Object.entries(GYM_GEAR).flatMap(([g, names]) => names.map((n) => [n, g])));
export function gearOf(name) {
  const eq = equipmentOf(name);
  if (eq.includes("band")) return "band";
  if (eq.includes("db")) return "db";
  if (eq.includes("gym")) return GYM_GEAR_OF[name] || "machine";
  return "bw";
}

// ---------- Haftalık hacim (kas grubu başına set) ----------
// Bir set, ana kası için 1, yardımcı kası için 0,5 set sayılır (yaygın kullanılan sayım yöntemi).
export const MUSCLES = {
  gogus: "Göğüs", sirt: "Sırt", omuz: "Omuz (ön/yan)", arkaOmuz: "Arka omuz",
  onBacak: "Ön bacak", arkaBacak: "Arka bacak", kalca: "Kalça",
  biseps: "Biseps", triseps: "Triseps", baldir: "Baldır", core: "Core",
};
export const POOL_MUSCLES = {
  squat: { onBacak: 1, kalca: 0.5 }, hinge: { arkaBacak: 1, kalca: 1 },
  hpush: { gogus: 1, triseps: 0.5 }, hpull: { sirt: 1, biseps: 0.5, arkaOmuz: 0.5 },
  vpush: { omuz: 1, triseps: 0.5 }, vpull: { sirt: 1, biseps: 0.5 },
  lunge: { onBacak: 1, kalca: 1 }, legcurl: { arkaBacak: 1 }, legext: { onBacak: 1 },
  calf: { baldir: 1 }, lateral: { omuz: 1 }, facepull: { arkaOmuz: 1 },
  biceps: { biseps: 1 }, triceps: { triseps: 1 }, chestfly: { gogus: 1 }, core: { core: 1 },
};
export const EX_MUSCLES = { // havuz varsayılanından farklı olanlar
  "Hip Thrust": { kalca: 1, arkaBacak: 0.5 },
  "Glute Bridge": { kalca: 1, arkaBacak: 0.5 },
  "Single-Leg Glute Bridge": { kalca: 1, arkaBacak: 0.5 },
  "Back Extension (45°)": { arkaBacak: 0.5, kalca: 1 },
  "Parallel Bar Dips": { gogus: 1, triseps: 1 },
  "Close-Grip Bench Press": { gogus: 0.5, triseps: 1 },
  "Chin-up": { sirt: 1, biseps: 1 },
  "Prone Y-T Raise": { arkaOmuz: 1, sirt: 0.5 },
  "Diamond Push-up": { triseps: 1, gogus: 0.5 },
  "Chair Dips": { triseps: 1, gogus: 0.5 },
  "Jump Squat": { onBacak: 1, kalca: 0.5 },
};
export const musclesOf = (name, pool) => EX_MUSCLES[name] || POOL_MUSCLES[pool] || {};

// Süreyle/mesafeyle yapılan core hareketleri
export function timedReps(name) {
  if (/Plank/.test(name)) return "30–45 sn";
  if (/Farmer/.test(name)) return "30–40 m";
  return null;
}
