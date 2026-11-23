// Antrenman programı üretici – saf mantık (UI'dan bağımsız)
import { EX, EQUIPMENT, MUSCLES, musclesOf, timedReps, isAvailable } from "../data/exercises.js";

// Ekipman yüzünden bir havuzda aday kalmazsa denenecek, aynı kası çalıştıran havuzlar
const SUBST = {
  vpull: ["hpull"], hpull: ["vpull", "facepull"], legcurl: ["hinge"], legext: ["lunge", "squat"], chestfly: ["hpush"],
  lateral: ["vpush"], facepull: ["hpull"], biceps: ["hpull", "vpull"], triceps: ["hpush"], squat: ["lunge"],
  hinge: ["legcurl"], vpush: ["hpush"], lunge: ["squat"], calf: [], core: [], hpush: [],
};
import { ageGroup, nutritionPlan } from "./nutrition.js";

export const SPLITS = {
  3: {
    label: "Full Body (3 gün)",
    days: ["Pazartesi", "Çarşamba", "Cuma"],
    sessions: [
      { title: "Full Body A", type: "full", slots: [["squat", 0], ["hpush", 0], ["hpull", 0], ["hinge", 0], ["lateral", 0], ["core", 0]] },
      { title: "Full Body B", type: "full", slots: [["hinge", 1], ["vpush", 0], ["vpull", 0], ["lunge", 0], ["biceps", 0], ["core", 1]] },
      { title: "Full Body C", type: "full", slots: [["squat", 1], ["hpush", 1], ["hpull", 1], ["hinge", 2], ["triceps", 0], ["calf", 0]] },
    ],
  },
  4: {
    label: "Upper / Lower (4 gün)",
    days: ["Pazartesi", "Salı", "Perşembe", "Cuma"],
    sessions: [
      { title: "Upper Body A", type: "upper", slots: [["hpush", 0], ["hpull", 0], ["vpush", 0], ["vpull", 0], ["lateral", 0], ["triceps", 0], ["biceps", 0]] },
      { title: "Lower Body A", type: "lower", slots: [["squat", 0], ["hinge", 0], ["lunge", 0], ["legcurl", 0], ["calf", 0], ["core", 0]] },
      { title: "Upper Body B", type: "upper", slots: [["vpush", 1], ["vpull", 1], ["hpush", 2], ["hpull", 1], ["facepull", 0], ["biceps", 1], ["triceps", 1]] },
      { title: "Lower Body B", type: "lower", slots: [["hinge", 1], ["squat", 2], ["lunge", 1], ["legext", 0], ["calf", 1], ["core", 2]] },
    ],
  },
  5: {
    label: "Push / Pull / Legs + Upper / Lower (5 gün)",
    days: ["Pazartesi", "Salı", "Çarşamba", "Cuma", "Cumartesi"],
    sessions: [
      { title: "Push", type: "push", slots: [["hpush", 0], ["vpush", 0], ["hpush", 2], ["lateral", 0], ["triceps", 0]] },
      { title: "Pull", type: "pull", slots: [["vpull", 0], ["hpull", 0], ["hpull", 1], ["facepull", 0], ["biceps", 0]] },
      { title: "Legs", type: "legs", slots: [["squat", 0], ["hinge", 0], ["lunge", 0], ["legcurl", 0], ["calf", 0]] },
      { title: "Upper Body", type: "upper", slots: [["hpush", 1], ["vpull", 1], ["vpush", 1], ["hpull", 3], ["chestfly", 0], ["biceps", 1], ["triceps", 1]] },
      { title: "Lower Body + Core", type: "lower", slots: [["hinge", 3], ["squat", 2], ["lunge", 2], ["legext", 0], ["calf", 1], ["core", 1]] },
    ],
  },
};

export const ALL_DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

// Evde 5 gün: Push/Pull/Legs yerine Upper/Lower + Full Body (sınırlı ekipmanda "Pull" günü boş kalmasın)
const HOME_SPLIT_5 = {
  label: "Upper / Lower + Full Body (5 gün)",
  days: ["Pazartesi", "Salı", "Çarşamba", "Cuma", "Cumartesi"],
  sessions: [SPLITS[4].sessions[0], SPLITS[4].sessions[1], SPLITS[3].sessions[1], SPLITS[4].sessions[2], SPLITS[4].sessions[3]],
};
// Gün tipine göre hareket eklenebilecek havuzlar (az hareketli günleri doldurmak için)
const REGION_POOLS = {
  upper: ["hpush", "hpull", "vpush", "vpull", "lateral", "facepull", "biceps", "triceps", "chestfly"],
  lower: ["squat", "hinge", "lunge", "legcurl", "legext", "calf"],
  push: ["hpush", "vpush", "lateral", "triceps", "chestfly"],
  pull: ["hpull", "vpull", "facepull", "biceps"],
  legs: ["squat", "hinge", "lunge", "legcurl", "legext", "calf"],
};
REGION_POOLS.full = [...REGION_POOLS.lower, ...REGION_POOLS.upper];
const MIN_EXERCISES = 4;

export const GOALS = {
  kas: {
    label: "Kas kütlesi (hipertrofi)",
    main: { sets: 4, reps: [6, 10], rest: "2–3 dk", restS: 150 },
    comp: { sets: 3, reps: [8, 12], rest: "90 sn–2 dk", restS: 105 },
    iso: { sets: 3, reps: [10, 15], rest: "60–90 sn", restS: 75 },
    rir: "1–2",
    finisher: null,
    progression:
      "Çift progresyon: Tekrar aralığının üst sınırına tüm setlerde ulaştığında ağırlığı artır (üst vücut +1–2,5 kg, alt vücut +2,5–5 kg) ve aralığın altından yeniden başla.",
  },
  guc: {
    label: "Güç (maksimal kuvvet)",
    main: { sets: 5, reps: [3, 5], rest: "3–5 dk", restS: 240 },
    comp: { sets: 3, reps: [6, 8], rest: "2–3 dk", restS: 150 },
    iso: { sets: 2, reps: [10, 12], rest: "60–90 sn", restS: 75 },
    rir: "2 (ana harekette tekniği bozma)",
    finisher: null,
    progression:
      "Lineer progresyon: Ana harekette tüm setler tamamlandıysa bir sonraki seansta ağırlığı artır (üst +2,5 kg, alt +5 kg). Arka arkaya 2 seans takılırsan ağırlığı %10 düşürüp yeniden tırman.",
  },
  yag: {
    label: "Yağ yakımı (kası koruyarak)",
    // Yağ kaybını kalori açığı belirler; antrenmanın görevi kası korumak → kas programına benzer yük ve dinlenme
    main: { sets: 3, reps: [6, 10], rest: "2–3 dk", restS: 150 },
    comp: { sets: 3, reps: [8, 12], rest: "90 sn–2 dk", restS: 105 },
    iso: { sets: 3, reps: [10, 15], rest: "60–90 sn", restS: 75 },
    rir: "1–2",
    finisher: "Bitiriş: 10–12 dk interval (ör. bisiklet 30 sn hızlı / 60 sn yavaş) veya 20–30 dk tempolu yürüyüş.",
    progression:
      "Kalori açığında kası korumanın anahtarı yükü korumak: Ağırlıkları düşürme, tekrar aralığının üstüne ulaştığında küçük artışlar yap. Haftalık adım sayısını kademeli artır (ör. 8.000 → 10.000).",
  },
  kondisyon: {
    label: "Genel kondisyon",
    main: { sets: 3, reps: [8, 12], rest: "90 sn", restS: 90 },
    comp: { sets: 3, reps: [10, 12], rest: "60–90 sn", restS: 75 },
    iso: { sets: 2, reps: [12, 15], rest: "45–60 sn", restS: 50 },
    rir: "2–3",
    finisher: "Kardiyo: 20 dk Zone 2 (konuşabileceğin tempoda) koşu bandı / bisiklet / kürek.",
    progression:
      "Önce tekrar, sonra ağırlık: Tüm setlerde üst tekrar sınırına ulaşınca ağırlığı biraz artır. Kardiyo süresini haftada ~%10 uzat.",
  },
};

export const AGES = {
  "18-29": { label: "18–29" },
  "30-39": { label: "30–39" },
  "40-49": { label: "40–49" },
  "50-59": { label: "50–59" },
  "60+": { label: "60+" },
};

// Seed'li rastgele sayı üreteci: aynı seed → aynı program (kaydedip geri yüklemek için)
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Kişinin yaşına/deneyimine uygun adaylar
// Ekipman zorunlu filtredir (evde olmayan ekipman asla seçilmez); yaş/deneyim filtresi aday kalmazsa gevşetilir.
function candidates(poolKey, { safeOnly, allowAdv, env }) {
  const pool = EX[poolKey].filter((e) => isAvailable(e.name, env));
  if (!pool.length) return [];
  const filtered = pool.filter((e) => (safeOnly ? e.safe : true) && (allowAdv ? true : !e.adv));
  return filtered.length ? filtered : pool;
}

// Hedefe göre ağırlık: güçte ana barbell kaldırışlar, yağ yakımı/kondisyonda devre dostu hareketler öne çıkar
function weightFor(ex, goal, isMainSlot) {
  let w = 1;
  if (isMainSlot && ex.acc) return 0; // yardımcı hareketler günün ana hareketi olamaz
  if (ex.cond && (goal === "kas" || goal === "guc")) return 0; // kondisyon odaklı hareket kas/güç programında ağır slotu doldurmaz
  if (goal === "guc" && !ex.iso) w *= ex.bb ? (isMainSlot ? 8 : 3) : 1;
  if ((goal === "yag" || goal === "kondisyon") && ex.met) w *= 3;
  if (goal === "kas" && !ex.iso && isMainSlot && ex.bb) w *= 2;
  return w;
}

function weightedPick(list, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return list[Math.floor(rng() * list.length)];
  let r = rng() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

// Süreyle/mesafeyle yapılan core hareketleri

function fmtReps([a, b]) {
  return a === b ? `${a}` : `${a}–${b}`;
}

// Kas hedefinde, orta seviyede haftalık [min, max] set (Schoenfeld 2017 doz-yanıt: ≥10 set/hafta)
const VOLUME_BASE = {
  gogus: [10, 18], sirt: [10, 20], omuz: [8, 16], arkaOmuz: [4, 12], onBacak: [10, 18], arkaBacak: [8, 16],
  kalca: [8, 18], biseps: [8, 14], triseps: [8, 14], baldir: [4, 10], core: [3, 9],
};
// Eksik kalan kas için eklenecek yardımcı hareket havuzu
const ACCESSORY = {
  gogus: "chestfly", sirt: "hpull", omuz: "lateral", arkaOmuz: "facepull", onBacak: "legext", arkaBacak: "legcurl",
  kalca: "hinge", biseps: "biceps", triseps: "triceps", baldir: "calf", core: "core",
};
const LOWER = new Set(["onBacak", "arkaBacak", "kalca", "baldir"]);
const DAY_REGION = { // hangi gün tipine hangi kas eklenebilir
  full: () => true, upper: (m) => !LOWER.has(m) || m === "core", lower: (m) => LOWER.has(m) || m === "core",
  push: (m) => ["gogus", "omuz", "triseps"].includes(m), pull: (m) => ["sirt", "biseps", "arkaOmuz"].includes(m),
  legs: (m) => LOWER.has(m),
};

export function computeVolume(sessions) {
  const v = Object.fromEntries(Object.keys(MUSCLES).map((k) => [k, 0]));
  for (const s of sessions) for (const e of s.exercises) for (const [m, w] of Object.entries(e.mus)) v[m] += e.sets * w;
  return v;
}

// location: "salon" | "ev"; equipment: evdeki ekipmanlar (["db", "band", "bar", "bench"] alt kümesi)
export function generateProgram({ age, goal, days, level, seed, profile, location = "salon", equipment = [] }) {
  const home = location === "ev";
  const env = { location: home ? "ev" : "salon", equipment: home ? [...equipment] : [] };
  if (profile) age = ageGroup(profile.age);
  if (seed == null) seed = Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);
  const g = GOALS[goal];
  const split = home && String(days) === "5" ? HOME_SPLIT_5 : SPLITS[days];
  const older = age === "50-59" || age === "60+";
  const senior = age === "60+";
  const beginner = level === "baslangic";

  const opts = {
    safeOnly: senior || (older && beginner),
    allowAdv: !beginner && !senior,
    env,
  };

  const adjust = (rx, isMain) => {
    let sets = rx.sets;
    let [lo, hi] = rx.reps;
    if (beginner) sets = Math.max(2, sets - 1);
    if (older && isMain && goal === "guc") sets = Math.max(2, sets - 1);
    if (senior) sets = Math.max(2, sets - 1);
    // Yaşa göre çok düşük tekrarlı ağır setleri sınırla
    const floor = senior ? 8 : older ? 5 : beginner ? 5 : 1;
    if (lo < floor) {
      const diff = floor - lo;
      lo = floor;
      hi = hi + diff;
    }
    return { sets, reps: fmtReps([lo, hi]), rest: rx.rest, restS: rx.restS };
  };

  const weekCount = new Map(); // hafta içinde kaç kez kullanıldı
  const pickFrom = (pool, dayNames, isMainSlot) => {
    const cands = candidates(pool, opts);
    const avail = cands.filter((e) => !dayNames.has(e.name)); // aynı günde tekrar yok
    const list = avail.length ? avail : cands;
    const weights = list.map((e) => weightFor(e, goal, isMainSlot) / (1 + 3 * (weekCount.get(e.name) || 0)));
    const ex = weightedPick(list, weights, rng);
    dayNames.add(ex.name);
    weekCount.set(ex.name, (weekCount.get(ex.name) || 0) + 1);
    return { ex, cands };
  };
  const makeEntry = (ex, pool, cands, kind) => {
    let rx, role;
    if (ex.iso) { rx = adjust({ ...g.iso, isIso: true }, false); role = ex.core ? "Core" : "İzolasyon"; }
    else if (kind === "main") { rx = adjust(g.main, true); role = "Ana bileşik"; }
    else { rx = adjust(g.comp, false); role = "Bileşik"; }
    const baseReps = rx.reps;
    return {
      name: ex.name, role, ...rx, pool, mus: musclesOf(ex.name, pool),
      reps: timedReps(ex.name) || baseReps, baseReps,
      alts: cands.map((e) => e.name), // "değiştir" butonu için alternatifler
    };
  };

  const sessions = split.sessions.map((s) => {
    let firstCompound = true;
    const dayNames = new Set();
    const exercises = s.slots.map(([slotPool]) => {
      // Ekipman yüzünden aday yoksa (ya da hepsi bu gün kullanıldıysa) aynı kası çalıştıran havuza geç; o da yoksa slotu atla
      const usable = (p) => candidates(p, opts).some((e) => !dayNames.has(e.name));
      const pool = [slotPool, ...(SUBST[slotPool] || [])].find(usable);
      if (!pool) return null;
      const isMainSlot = firstCompound && !EX[pool][0].iso;
      const { ex, cands } = pickFrom(pool, dayNames, isMainSlot);
      const kind = !ex.iso && firstCompound ? "main" : "other";
      if (!ex.iso) firstCompound = false;
      return makeEntry(ex, pool, cands, kind);
    }).filter(Boolean);
    // Ekipman kısıtı yüzünden gün çok kısa kaldıysa, o günün bölgesinden (en son core) kullanılmamış hareket ekle
    for (const pool of [...REGION_POOLS[s.type], "core"]) {
      if (exercises.length >= MIN_EXERCISES) break;
      if (exercises.some((e) => e.pool === pool) || !candidates(pool, opts).some((e) => !dayNames.has(e.name))) continue;
      const { ex, cands } = pickFrom(pool, dayNames, false);
      exercises.push(makeEntry(ex, pool, cands, !ex.iso && firstCompound ? "main" : "other"));
      if (!ex.iso) firstCompound = false;
    }
    return { title: s.title, type: s.type, exercises, dayNames };
  });

  // ---------- Haftalık hacmi hedef aralığa getir ----------
  const mult = { kas: 1, guc: 0.75, yag: 0.85, kondisyon: 0.6 }[goal] * (beginner ? 0.7 : 1) * (senior ? 0.85 : 1);
  // Alt sınır hedefe göre ölçeklenir; üst sınır (toparlanabilir hacim) daha az daralır
  const maxMult = Math.max(mult, 0.85);
  const targets = Object.fromEntries(Object.entries(VOLUME_BASE).map(([m, [a, b]]) => [m, [Math.round(a * mult), Math.round(b * maxMult)]]));
  const dayCap = Math.round(({ kas: 24, yag: 22, guc: 20, kondisyon: 16 }[goal]) * (beginner ? 0.75 : 1) * (senior ? 0.85 : 1));
  const setCap = beginner ? 3 : 4;
  const daySets = (s) => s.exercises.reduce((a, e) => a + e.sets, 0);

  for (let guard = 0; guard < 120; guard++) {
    const vol = computeVolume(sessions);
    // Önce büyük kas grupları (kollar çekiş/itişten dolaylı hacim de alır), sonra eksiği büyük olan
    const BIG = new Set(["gogus", "sirt", "onBacak", "arkaBacak", "kalca", "omuz"]);
    const deficits = Object.keys(targets).map((m) => [m, targets[m][0] - vol[m]]).filter(([, d]) => d >= 1)
      .sort((a, b) => (BIG.has(b[0]) - BIG.has(a[0])) || b[1] - a[1]);
    if (!deficits.length) break;
    let progressed = false;
    for (const [m, d] of deficits) {
      // 1) Bu kasın ana hareketlerinden birine set ekle (önce izolasyon, en az seti olan)
      const canGrow = (e) => e.mus[m] === 1 && e.sets < setCap && (e.role !== "Ana bileşik" || goal !== "guc");
      const rank = (a, b) => (a.e.role === "İzolasyon" ? 0 : 1) - (b.e.role === "İzolasyon" ? 0 : 1) || a.e.sets - b.e.sets;
      const options = sessions.flatMap((s) => s.exercises.filter(canGrow).map((e) => ({ e, s })));
      const free = options.filter((o) => daySets(o.s) < dayCap).sort(rank);
      if (free.length) {
        free[0].e.sets++;
        progressed = true;
        break;
      }
      // 1b) Gün doluysa: aynı gün, hedefinin rahatça üstünde olan bir kastan 1 set aktar
      let moved = false;
      for (const o of options.sort(rank)) {
        const donor = o.s.exercises.filter((e) => e !== o.e && e.sets > 2 && e.role !== "Ana bileşik" && !e.mus[m] &&
          Object.entries(e.mus).every(([mm, w]) => w < 1 || vol[mm] - 1 >= targets[mm][0] + 1))
          .sort((a, b) => b.sets - a.sets)[0];
        if (donor) { donor.sets--; o.e.sets++; moved = true; break; }
      }
      if (moved) { progressed = true; break; }
      // 2) Yeterli değilse uygun bir güne yardımcı hareket ekle
      if (d >= 1) {
        const pool = ACCESSORY[m];
        const need = 2;
        // Gün doluysa, aynı günde hedefinin üstündeki kaslardan boşaltılabilecek set sayısı
        const donorsOf = (s) => s.exercises.filter((e) => e.sets > 2 && e.role !== "Ana bileşik" && !e.mus[m] &&
          Object.entries(e.mus).every(([mm, w]) => w < 1 || vol[mm] - 1 >= targets[mm][0] + 1));
        const room = (s) => dayCap - daySets(s) + donorsOf(s).length;
        const hasCandidate = (s) => candidates(pool, opts).some((e) => !s.dayNames.has(e.name));
        const days = sessions.filter((s) => DAY_REGION[s.type](m) && s.exercises.length < 8 && room(s) >= need && !s.exercises.some((e) => e.pool === pool) && hasCandidate(s))
          .sort((a, b) => room(b) - room(a));
        if (days.length) {
          const s = days[0];
          for (const dn of donorsOf(s)) { if (daySets(s) + need <= dayCap) break; dn.sets--; }
          const { ex, cands } = pickFrom(pool, s.dayNames, false);
          const entry = makeEntry(ex, pool, cands, "other");
          entry.sets = Math.max(2, Math.min(entry.sets, Math.ceil(d)));
          // izolasyonlar sona, bileşikler izolasyonların önüne
          const at = entry.role === "İzolasyon" || entry.role === "Core" ? s.exercises.length : s.exercises.findIndex((e) => e.role === "İzolasyon" || e.role === "Core");
          s.exercises.splice(at < 0 ? s.exercises.length : at, 0, entry);
          progressed = true;
          break;
        }
      }
    }
    if (!progressed) break;
  }
  // Fazla hacmi kırp (önce izolasyon), en az 2 set kalsın
  for (let guard = 0; guard < 40; guard++) {
    const vol = computeVolume(sessions);
    const over = Object.keys(targets).find((m) => vol[m] > targets[m][1] + 0.5);
    if (!over) break;
    const cand = sessions.flatMap((s) => s.exercises).filter((e) => e.mus[over] === 1 && e.sets > 2 && e.role !== "Ana bileşik")
      .sort((a, b) => (a.role === "İzolasyon" ? 0 : 1) - (b.role === "İzolasyon" ? 0 : 1) || b.sets - a.sets)[0];
    if (!cand) break;
    cand.sets--;
  }
  const finalVol = computeVolume(sessions);
  const volume = Object.keys(MUSCLES).map((m) => ({
    key: m, label: MUSCLES[m], sets: Math.round(finalVol[m] * 2) / 2, min: targets[m][0], max: targets[m][1],
  }));
  for (const s of sessions) {
    delete s.dayNames;
    // Tahmini süre: ısınma 10 dk + her set için ~40 sn çalışma + dinlenme
    s.minutes = Math.round((10 + s.exercises.reduce((a, e) => a + e.sets * (40 + (e.restS || 90)), 0) / 60) / 5) * 5;
  }

  const week = ALL_DAYS.map((d) => {
    const idx = split.days.indexOf(d);
    return idx === -1 ? { day: d, rest: true } : { day: d, rest: false, ...sessions[idx] };
  });

  const notes = [];
  notes.push(`Efor: Her seti tükenişe ${g.rir} tekrar kala bitir (RIR).`);
  notes.push(g.progression);
  if (g.finisher) notes.push(g.finisher);
  const warm = older ? "10–15 dk" : "5–10 dk";
  notes.push(`Isınma: ${warm} hafif kardiyo + dinamik mobilite, ilk bileşik harekette 2–3 hafif ısınma seti.`);
  notes.push(`Deload: Her ${older ? 4 : 6}. haftada set sayısını yarıya indir, ağırlıkları ~%10 azalt.`);
  if (older) notes.push("Eklem dostu varyantlar seçildi. Ağrı (kas yorgunluğu değil, eklem ağrısı) olursa hareketi alternatifle değiştir.");
  if (beginner) notes.push("Başlangıç: İlk 2–3 hafta tekniği öğrenmeye odaklan; ağırlığı tekniği bozmadan artırabildiğin kadar artır.");
  if (home) {
    notes.push("Evde ilerleme: Ağırlık artıramadığında tekrarı artır, tempoyu yavaşlat (3 sn indir, 1 sn bekle) ya da daha zor varyasyona geç (ör. diz üstü şınav → şınav → decline şınav). Bantlarda bir sonraki sertliğe geç.");
    const low = volume.filter((r) => r.sets < r.min - 0.5).map((r) => r.label);
    if (!env.equipment.length) notes.push("Ekipmansız programda sırt ve arka bacak için seçenek sınırlı. Bir direnç bandı (ve mümkünse kapı tipi barfiks barı) en verimli ilk yatırımdır.");
    if (low.length) notes.push(`Mevcut ekipmanla şu kas gruplarında haftalık set hedefin altında kalıyor: ${low.join(", ")}. Ekipman ekledikçe program bunu dengeler.`);
  }
  let nutrition = null;
  if (profile) {
    nutrition = nutritionPlan(profile, goal, Number(days));
    const n = nutrition;
    if (n.mode === "ver" && goal === "kas")
      notes.push("Hedef kilon mevcut kilondan düşük: Kalori açığında kas kazanımı sınırlı olur. 'Yağ yakımı' hedefi bu dönem için daha uygun olabilir.");
    if (n.mode === "al" && goal === "yag")
      notes.push("Hedef kilon mevcut kilondan yüksek ama hedefin yağ yakımı: Kilo almak istiyorsan 'Kas kütlesi' hedefini seçmeyi düşün.");
    if (n.targetBmi.value < 18.5)
      notes.push(`Hedef kilon boyuna göre sağlıklı aralığın altında (BMI ${n.targetBmi.value}). Hedefini gözden geçirmeni öneririm.`);
    notes.push(`Dinlenme günlerinde yürüyüş ve hafif esneme önerilir. Uyku 7–9 saat, protein ${n.protein[0]}–${n.protein[1]} g/gün.`);
  } else {
    notes.push("Dinlenme günlerinde yürüyüş ve hafif esneme önerilir. Uyku 7–9 saat, protein ~1,6–2,2 g/kg.");
  }

  return {
    meta: {
      age: profile ? String(profile.age) : AGES[age].label,
      goal: g.label,
      split: split.label,
      level: beginner ? "Başlangıç" : "Orta / İleri",
      place: home
        ? "Ev · " + (env.equipment.length ? EQUIPMENT.filter(([k]) => env.equipment.includes(k)).map(([, l]) => l.split(" /")[0]).join(", ") : "ekipmansız")
        : "Spor salonu",
    },
    input: { goal, days: String(days), level, location: env.location, equipment: env.equipment },
    nutrition,
    volume,
    seed,
    week,
    notes,
  };
}

export function volumeTable(program) {
  const v = computeVolume(program.week.filter((d) => !d.rest));
  return program.volume.map((row) => ({ ...row, sets: Math.round(v[row.key] * 2) / 2 }));
}

// Bir hareketi seçilen alternatifle değiştir (aynı gündeki başka bir hareketle çakışamaz)
export function replaceExercise(program, dayIndex, exIndex, next) {
  const day = program.week[dayIndex];
  const ex = day.exercises[exIndex];
  if (!ex.alts.includes(next) || next === ex.name || day.exercises.some((e) => e.name === next)) return false;
  ex.name = next;
  ex.reps = timedReps(next) || ex.baseReps;
  if (ex.pool) {
    ex.mus = musclesOf(next, ex.pool);
    program.volume = volumeTable(program); // kas dağılımı değişebilir (ör. Hip Thrust)
  }
  return true;
}
