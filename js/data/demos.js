// Hareket animasyon şablonları, çalışan kaslar ve yapılış adımları (veri)

// ================= Şablonlar =================
const STAND = { hip: [118, 94], ank: [122, 176], torso: 180, ft: 90 };
const BBW = [{ t: "bb", p: "wr" }];
const DB2 = [{ t: "db", p: "wr" }, { t: "db", p: "wr2" }];
const BENCH = [{ t: "rect", x: 60, y: 137, w: 104, h: 7 }, { t: "rect", x: 70, y: 144, w: 6, h: 36 }, { t: "rect", x: 148, y: 144, w: 6, h: 36 }];
const SEAT = (x, y) => [{ t: "rect", x: x - 25, y: y + 4, w: 50, h: 7 }, { t: "rect", x: x - 3, y: y + 11, w: 6, h: 180 - y - 11 }];

export const TPL = {
  squat: {
    base: { ...STAND, ua: -40, fa: 160 }, props: [{ t: "bb", p: "sh", dx: -5, dy: -3 }],
    keys: [{}, { hip: [96, 138], torso: 140 }],
    cues: ["Ayaklar omuz genişliğinde, bar trapezin üstünde, karın sıkı.", "Kalçayı geriye ve aşağı gönder; dizler ayak uçları yönünde, uyluk yere paralel olana kadar in.", "Topuklardan iterek, göğüs dik şekilde yukarı kalk."],
  },
  squatDB: {
    base: { ...STAND, ua: 0, fa: 0 }, props: DB2,
    keys: [{}, { hip: [96, 138], torso: 150 }],
    cues: ["Dumbbell'lar yanlarda, kollar gergin, ayaklar omuz genişliğinde.", "Kalçayı geriye-aşağı gönder, sırt nötr kalsın.", "Topuklardan iterek kalk."],
  },
  hack: {
    base: { ...STAND, ua: -40, fa: 160 }, props: [{ t: "line", x1: 88, y1: 178, x2: 112, y2: 20, w: 6 }],
    keys: [{}, { hip: [100, 140], torso: 165 }],
    cues: ["Sırtını pede, omuzlarını yastıklara yerleştir; ayaklar platformun ortasında.", "Kontrollü şekilde uyluk paralel olana kadar in.", "Topuklardan iterek kalk, dizleri tam kilitleme."],
  },
  frontsquat: {
    base: { ...STAND, ua: 100, fa: -100 }, props: [{ t: "bb", p: "sh", dx: 9, dy: -3 }],
    keys: [{}, { hip: [100, 140], torso: 155 }],
    cues: ["Bar omuzların önünde, dirsekler yukarı ve ileri.", "Gövdeyi dik tutarak derin çömel.", "Dirsekleri düşürmeden yukarı it."],
  },
  goblet: {
    base: { ...STAND, ua: 20, fa: 160 }, props: [{ t: "db", p: "wr", r: 7 }],
    keys: [{}, { hip: [100, 140], torso: 152 }],
    cues: ["Dumbbell'ı göğsünün önünde dikey tut.", "Dirsekler dizlerin içinden geçecek kadar derin çömel.", "Göğüs dik, topuklardan iterek kalk."],
  },
  legpress: {
    base: { hip: [70, 140], torso: 235, ft: 215, ua: 20, fa: 50, kd: 1 },
    props: [{ t: "line", x1: 72, y1: 147, x2: 14, y2: 107, w: 7 }, { t: "rect", x: 50, y: 146, w: 50, h: 7 }, { t: "plate", p: "an", a: 125 }],
    keys: [{ ank: [135, 94] }, { ank: [107, 114] }],
    cues: ["Sırt ve kalça pede tam yaslı, ayaklar platformda omuz genişliğinde.", "Dizleri göğse doğru kontrollü bük (kalça pedden kalkmasın).", "Platformu it, dizleri tam kilitleme."],
  },
  deadlift: {
    base: { ...STAND, ua: -8, fa: -8 }, props: [{ t: "bb", p: "wr", r: 15 }],
    keys: [{ hip: [100, 130], torso: 120 }, { hip: [118, 94], torso: 180 }],
    cues: ["Bar ayak ortasının üstünde, kalça dizden yüksek, sırt düz.", "Bacaklarla zemini it, bar bacaklara yakın yükselsin.", "Üstte kalçayı kilitle; inerken kalçayı geriye göndererek bırak."],
  },
  trapbar: {
    base: { ...STAND, ua: -4, fa: -4 }, props: [{ t: "bb", p: "wr", r: 15 }],
    keys: [{ hip: [102, 128], torso: 128 }, { hip: [118, 94], torso: 180 }],
    cues: ["Trap barın ortasına gir, tutamakları kavra.", "Göğüs açık, sırt düz; zemini iterek kalk.", "Kontrollü şekilde yere bırak."],
  },
  rdl: {
    base: { ...STAND, ua: -12, fa: -12 }, props: [{ t: "bb", p: "wr" }],
    keys: [{}, { hip: [98, 104], torso: 112 }],
    cues: ["Dizler hafif bükülü ve sabit.", "Kalçayı geriye iterek, bar bacaklara yakın şekilde diz altına kadar in.", "Arka bacakta gerilmeyi hisset, kalçayı ileri iterek kalk."],
  },
  goodmorning: {
    base: { ...STAND, ua: 30, fa: 180, armRel: true }, props: [{ t: "bb", p: "sh", dx: -4, dy: -4 }],
    keys: [{}, { hip: [100, 100], torso: 100 }],
    cues: ["Bar sırtta (squat gibi), dizler hafif bükük.", "Sırt düz, kalçayı geriye göndererek öne eğil.", "Gövde yere yaklaşık paralel olunca kalçayı ileri iterek kalk."],
  },
  backext: {
    base: { anchor: "hip", at: [120, 100], th: -45, sh: -45, ft: 45, ua: 30, fa: 165, armRel: true },
    props: [{ t: "roller", p: "hip", dx: 7, dy: 6, r: 6 }, { t: "plate", p: "an", a: -45 }],
    keys: [{ torso: 135 }, { torso: 25 }],
    cues: ["Pedin üst kenarı kalça kemiğinin hemen altında olsun.", "Sırt düz, kalçadan bükülerek kontrollü in.", "Kalça ve sırt kaslarıyla vücut düz çizgi olana kadar kalk."],
  },
  hipthrust: {
    base: { anchor: "an", at: [160, 176], ft: 90 },
    props: [{ t: "rect", x: 18, y: 140, w: 52, h: 7 }, { t: "rect", x: 40, y: 147, w: 6, h: 33 }, { t: "bb", p: "hip", dy: -11 }],
    keys: [{ torso: 246, th: 120.4, sh: 11, ua: 66, fa: 66 }, { torso: 270, th: 90, sh: 0, ua: 90, fa: 90 }],
    cues: ["Kürek kemikleri bankta, bar kalça kıvrımında, ayaklar yerde.", "Topuklardan iterek kalçayı gövde-uyluk düz çizgi olana kadar kaldır.", "Üstte kalçayı 1 sn sık, kontrollü in."],
  },
  kbswing: {
    base: { ...STAND }, props: [{ t: "kb", p: "wr" }],
    keys: [{ hip: [100, 104], torso: 115, ua: -25, fa: -25 }, { hip: [118, 94], torso: 180, ua: 90, fa: 90 }],
    cues: ["Kettlebell'i bacak arasına geriye savur, kalça geride.", "Kalçayı patlayıcı şekilde ileri iterek kettlebell'i göğüs hizasına savur (kolla kaldırma).", "Geri gelirken tekrar kalçadan bükül."],
  },
  bench: {
    base: { hip: [150, 132], torso: 270, th: 80, sh: 0, ft: 90, ed: -1 }, props: [...BENCH, ...BBW],
    keys: [{ hand: [100, 76] }, { hand: [106, 121] }],
    cues: ["Gözler barın altında, kürek kemikleri sıkıştırılmış, ayaklar yerde.", "Barı kontrollü şekilde göğsün alt kısmına indir, dirsekler ~45°.", "Göğüsten güçlü şekilde yukarı it."],
  },
  incline: {
    base: { hip: [150, 140], torso: 235, th: 90, sh: 0, ft: 90, ed: -1 },
    props: [{ t: "line", x1: 153, y1: 147, x2: 96, y2: 107, w: 7 }, { t: "rect", x: 128, y: 146, w: 44, h: 6 }, { t: "rect", x: 140, y: 152, w: 6, h: 28 }, ...BBW],
    keys: [{ hand: [106, 52] }, { hand: [113, 99] }],
    cues: ["Bank 30–45° eğimde, kürek kemikleri sıkı.", "Ağırlığı üst göğse kontrollü indir.", "Omuzların üstüne doğru yukarı it."],
  },
  machinepress: {
    base: { hip: [100, 140], torso: 186, th: 90, sh: 0, ft: 90, ed: -1 },
    props: [{ t: "line", x1: 90, y1: 145, x2: 83, y2: 78, w: 6 }, ...SEAT(100, 140)],
    keys: [{ hand: [102, 107] }, { hand: [150, 93] }],
    cues: ["Tutamaklar göğüs ortası hizasında olacak şekilde koltuğu ayarla.", "Sırt pedde, tutamakları ileri it.", "Göğüste gerilme hissedene kadar kontrollü geri gel."],
  },
  dbfly: {
    base: { hip: [150, 132], torso: 270, th: 80, sh: 0, ft: 90, ed: 1 }, props: [...BENCH, { t: "db", p: "wr" }],
    keys: [{ hand: [98, 77] }, { hand: [100, 128] }],
    cues: ["Dumbbell'lar göğüs üstünde, dirsekler hafif bükük ve sabit.", "Kolları yanlara doğru geniş bir yay çizerek indir.", "Göğsü sıkarak aynı yaydan yukarı getir."],
  },
  fly: {
    view: "front", base: { hip: [120, 94], ed: 1 },
    props: [{ t: "cable", p: "wr", to: [228, -20] }, { t: "cable", p: "wr2", to: [12, -20] }],
    keys: [{ hand: [184, 30] }, { hand: [128, 72] }],
    cues: ["Makaralar omuz üstünde, bir adım öne çık, dirsekler hafif bükük.", "Kolları kucaklar gibi önde birleştir.", "Göğüste gerilme hissedene kadar kontrollü aç."],
  },
  pecdeck: {
    view: "front", base: { hip: [120, 110], ank: [128, 176], ed: 1 }, props: SEAT(120, 110),
    keys: [{ hand: [182, 50] }, { hand: [128, 60] }],
    cues: ["Koltuğu tutamaklar göğüs hizasında olacak şekilde ayarla.", "Kolları önde birleştir, göğsü sık.", "Kontrollü şekilde aç, omuzları öne düşürme."],
  },
  pushup: {
    base: { anchor: "wr", at: [178, 176] },
    keys: [{ torso: 115, th: 295, sh: 295, ua: 0, fa: 0, ft: 15 }, { torso: 98.4, th: 278.4, sh: 278.4, ua: -92, fa: 41, ft: 5 }],
    cues: ["Eller omuz genişliğinde, vücut baştan topuğa düz çizgi.", "Göğüs yere yaklaşana kadar in, dirsekler ~45°.", "Karın ve kalça sıkı şekilde yukarı it."],
  },
  dips: {
    base: { anchor: "wr", at: [130, 100], th: 12, sh: -100, ft: 0 },
    props: [{ t: "line", x1: 104, y1: 103, x2: 152, y2: 103, w: 5 }, { t: "line", x1: 148, y1: 103, x2: 148, y2: 180, w: 4 }],
    keys: [{ torso: 170, ua: 0, fa: 0 }, { torso: 150, ua: -66, fa: 44 }],
    cues: ["Kollar gergin, omuzlar aşağıda, gövde hafif öne eğik.", "Dirsekleri bükerek omuz dirsek hizasına gelene kadar in.", "Avuçlardan iterek yukarı çık."],
  },
  row: {
    base: { hip: [123, 104], ank: [140, 176], torso: 105, ft: 90, ed: -1 }, props: [{ t: "bb", p: "wr" }],
    keys: [{ hand: [171, 147] }, { hand: [156, 104] }],
    cues: ["Kalçadan öne eğil (gövde ~45° veya daha yatay), sırt düz.", "Barı göbek/alt göğüs hizasına çek, dirsekler geriye.", "Kürek kemiklerini sık, kontrollü indir."],
  },
  dbrow: {
    base: { hip: [118, 100], ank: [134, 176], torso: 100, ft: 90, ed: -1, hand2: [175, 150] },
    props: [{ t: "rect", x: 150, y: 150, w: 60, h: 6 }, { t: "rect", x: 200, y: 156, w: 6, h: 24 }, { t: "db", p: "wr" }],
    keys: [{ hand: [168, 146] }, { hand: [150, 102] }],
    cues: ["Bir el bankta destekte, sırt düz ve yere paralel.", "Dumbbell'ı kalçana doğru çek, dirsek gövdeye yakın.", "Kürek kemiğini sıkıp kontrollü indir."],
  },
  cablerow: {
    base: { hip: [80, 158], th: 82, sh: 95, ft: 180, ed: -1 },
    props: [{ t: "rect", x: 40, y: 162, w: 70, h: 18 }, { t: "plate", p: "an", a: 90 }, { t: "cable", p: "wr", to: [228, 150] }],
    keys: [{ torso: 160, hand: [152, 112] }, { torso: 182, hand: [100, 124] }],
    cues: ["Dik otur, dizler hafif bükük, öne uzanırken sırt düz kalsın.", "Tutamağı göbeğine çek, göğüs açık.", "Kürek kemiklerini sık, kontrollü uzat."],
  },
  chestrow: {
    base: { hip: [112.7, 96.6], th: 10, sh: 0, torso: 135, ft: 90, ed: -1 },
    props: [{ t: "line", x1: 128, y1: 108, x2: 168, y2: 68, w: 7 }, { t: "rect", x: 140, y: 100, w: 6, h: 80 }, ...DB2],
    keys: [{ hand: [150, 114] }, { hand: [128, 82] }],
    cues: ["Göğsünü eğimli banka yasla.", "Dumbbell'ları kalçaya doğru çek.", "Kürek kemiklerini sıkıp kontrollü indir; bel boşta çalışmaz."],
  },
  invrow: {
    base: { anchor: "wr", at: [150, 105], ft: 180 },
    props: [{ t: "line", x1: 126, y1: 103, x2: 178, y2: 103, w: 5 }, { t: "line", x1: 174, y1: 103, x2: 174, y2: 180, w: 4 }],
    keys: [{ torso: 95, th: 275, sh: 275, ua: 180, fa: 180 }, { torso: 109, th: 289, sh: 289, ua: 231, fa: 103 }],
    cues: ["Barın altına uzan, vücut düz çizgi, topuklar yerde.", "Göğsü bara doğru çek.", "Kontrollü şekilde kolları uzatarak in."],
  },
  facepull: {
    base: { ...STAND, ed: 1 }, props: [{ t: "cable", p: "wr", to: [228, 36] }],
    keys: [{ hand: [176, 46] }, { hand: [117, 20] }],
    cues: ["Makara yüz hizasında, ipi iki elle tut.", "İpi yüzüne doğru çekerken elleri ayır, dirsekler yukarıda.", "Arka omzu sık, kontrollü uzat."],
  },
  revfly: {
    view: "front", base: { hip: [120, 94], ed: 1 }, props: DB2,
    keys: [{ hand: [130, 96] }, { hand: [190, 46] }],
    cues: ["Kalçadan öne eğil, dirsekler hafif bükük.", "Kolları yanlara doğru omuz hizasına aç.", "Arka omuzları sıkıp kontrollü indir."],
  },
  bandpull: {
    view: "front", base: { hip: [120, 94], ed: 1 }, props: [{ t: "band" }],
    keys: [{ hand: [134, 44] }, { hand: [192, 42] }],
    cues: ["Lastiği omuz hizasında, kollar önde tut.", "Kolları yanlara açarak lastiği göğsüne doğru gergin şekilde aç.", "Kürek kemiklerini sık, kontrollü geri getir."],
  },
  ohp: {
    view: "front", base: { hip: [120, 94], ed: -1 }, props: [{ t: "bb" }],
    keys: [{ hand: [150, 30] }, { hand: [142, -18] }],
    cues: ["Bar köprücük kemiği hizasında, karın ve kalça sıkı.", "Barı başının üstüne dik bir çizgide it.", "Üstte kolları kilitle, kontrollü omuz hizasına indir."],
  },
  pushpress: {
    view: "front", base: { hip: [120, 94], ed: -1 }, props: [{ t: "bb" }], seg: 0.7,
    keys: [{ hand: [150, 30] }, { hip: [120, 104], hand: [150, 40] }, { hip: [120, 94], hand: [142, -18] }],
    cues: ["Bar omuzlarda, hafifçe diz bük (dip).", "Bacaklarla patlayıcı şekilde iterek barı yukarı fırlat.", "Kollarla itişi bitir, kontrollü indir."],
  },
  dbpress: {
    view: "front", base: { hip: [120, 94], ed: -1 }, props: DB2,
    keys: [{ hand: [152, 30] }, { hand: [142, -18] }],
    cues: ["Dumbbell'lar omuz hizasında, avuçlar öne.", "Başın üstüne doğru it.", "Kontrollü şekilde omuz hizasına indir."],
  },
  dbpressSeated: {
    view: "front", base: { hip: [120, 120], ank: [130, 176], ed: -1 }, props: [...SEAT(120, 120), ...DB2],
    keys: [{ hand: [152, 56] }, { hand: [142, 8] }],
    cues: ["Sırt dik bankta, dumbbell'lar omuz hizasında.", "Başın üstüne doğru it.", "Kontrollü şekilde omuz hizasına indir."],
  },
  landmine: {
    base: { hip: [112, 94], ank: [124, 176], ank2: [96, 176], torso: 170, ft: 90, ed: -1 }, props: [{ t: "pole", p: "wr", to: [14, 178] }],
    keys: [{ hand: [124, 46] }, { hand: [160, 8] }],
    cues: ["Barın ucunu omuz önünde tut, ayaklar hafif açık.", "Barı yukarı ve ileri doğru it.", "Kontrollü şekilde omuza geri getir."],
  },
  pulldown: {
    view: "front", base: { hip: [120, 122], ank: [130, 176], ed: -1 },
    props: [...SEAT(120, 122), { t: "bar", e: 12, to: [120, -40] }],
    keys: [{ hand: [168, 10] }, { hand: [158, 58] }],
    cues: ["Barı geniş kavra, dizler pedin altında.", "Göğsü yukarı tutarak barı üst göğse çek, dirsekler aşağı.", "Kontrollü şekilde kolları uzat."],
  },
  pulldownN: {
    view: "front", base: { hip: [120, 122], ank: [130, 176], ed: -1 },
    props: [...SEAT(120, 122), { t: "bar", e: 4, to: [120, -40] }],
    keys: [{ hand: [140, 8] }, { hand: [138, 58] }],
    cues: ["Nötr (avuçlar karşılıklı) tutamakla otur.", "Dirsekleri gövdeye yakın tutarak göğse çek.", "Kontrollü şekilde kolları uzat."],
  },
  pullup: {
    view: "front", base: { ed: -1, hand: [158, -30] },
    props: [{ t: "line", x1: 84, y1: -30, x2: 196, y2: -30, w: 5 }],
    keys: [{ hip: [120, 79], ank: [126, 158] }, { hip: [120, 42], ank: [126, 121] }],
    cues: ["Barı omuzlardan biraz geniş kavra, tam asılı başla.", "Göğsü bara doğru çekerek çeneyi barın üstüne çıkar.", "Kontrollü şekilde tam asılıya in."],
  },
  chinup: {
    view: "front", base: { ed: -1, hand: [140, -30] },
    props: [{ t: "line", x1: 84, y1: -30, x2: 196, y2: -30, w: 5 }],
    keys: [{ hip: [120, 80], ank: [126, 159] }, { hip: [120, 42], ank: [126, 121] }],
    cues: ["Barı omuz genişliğinde, avuçlar sana dönük kavra.", "Çeneyi barın üstüne çıkar.", "Kontrollü şekilde tam asılıya in."],
  },
  lunge: {
    base: { torso: 180, ank: [146, 176], ank2: [78, 170], ft: 90, ft2: 25, ua: 0, fa: 0 }, props: DB2,
    keys: [{ hip: [112, 102] }, { hip: [110, 134] }],
    cues: ["Büyük bir adım at, gövde dik.", "Arka diz yere yaklaşana kadar in, ön diz ayak bileği üstünde.", "Ön topuktan iterek kalk."],
  },
  bulgarian: {
    base: { torso: 178, ank: [146, 176], ank2: [70, 150], ft: 90, ft2: 270, ua: 0, fa: 0 },
    props: [{ t: "rect", x: 40, y: 153, w: 44, h: 7 }, { t: "rect", x: 58, y: 160, w: 6, h: 20 }, ...DB2],
    keys: [{ hip: [114, 100] }, { hip: [110, 132] }],
    cues: ["Arka ayak bankta, ön ayak yeterince önde.", "Arka diz yere yaklaşana kadar dikey in.", "Ön topuktan iterek kalk."],
  },
  splitsquat: {
    base: { torso: 180, ank: [146, 176], ank2: [78, 170], ft: 90, ft2: 25, ua: -40, fa: 160 }, props: [{ t: "bb", p: "sh", dx: -5, dy: -3 }],
    keys: [{ hip: [112, 102] }, { hip: [110, 134] }],
    cues: ["Bar sırtta, ayaklar öne-arkaya açık sabit duruş.", "Arka diz yere yaklaşana kadar dikey in.", "Ön topuktan iterek kalk."],
  },
  stepup: {
    base: { torso: 180, ank: [150, 132], ft: 90, ua: 0, fa: 0 },
    props: [{ t: "rect", x: 128, y: 137, w: 52, h: 43 }, ...DB2],
    keys: [{ hip: [122, 104], ank2: [100, 176] }, { hip: [146, 52], ank2: [160, 108] }],
    cues: ["Bir ayağını kutunun üstüne tam bas.", "Üstteki bacakla iterek kutuya çık (arka ayakla zıplama).", "Kontrollü şekilde aynı bacakla in."],
  },
  legcurl: {
    base: { hip: [130, 128], torso: 90, th: 270, ua: 150, fa: 100 },
    props: [{ t: "rect", x: 60, y: 133, w: 110, h: 7 }, { t: "rect", x: 150, y: 140, w: 6, h: 40 }, { t: "roller", p: "an", dx: -3, dy: -6 }],
    keys: [{ sh: 270, ft: 0 }, { sh: 172, ft: -90 }],
    cues: ["Yüzüstü uzan, rulo aşil tendonunun üstünde.", "Topukları kalçaya doğru çek.", "Kontrollü şekilde bacakları uzat."],
  },
  seatedcurl: {
    base: { hip: [100, 130], torso: 180, th: 90, ft: 90 },
    props: [...SEAT(100, 130), { t: "line", x1: 76, y1: 136, x2: 72, y2: 70, w: 6 }, { t: "roller", p: "an", dx: 0, dy: 6 }],
    keys: [{ sh: 85 }, { sh: -15 }],
    cues: ["Rulo baldırın arkasında, uyluk pedi sabitler.", "Topukları aşağı ve geriye doğru çek.", "Kontrollü şekilde uzat."],
  },
  nordic: {
    base: { anchor: "kn", at: [90, 176], sh: 270, ft: 0 },
    props: [{ t: "roller", p: "an", dy: -6 }],
    keys: [{ th: 0, torso: 180, ua: 50, fa: 50 }, { th: -60, torso: 120, ua: 80, fa: 80 }],
    cues: ["Dizler minderde, ayak bilekleri sabitlenmiş.", "Vücut düz çizgi, arka bacakla frenleyerek yavaşça öne düş.", "Ellerle yerden destek alıp başlangıca dön."],
  },
  legext: {
    base: { hip: [100, 130], torso: 180, th: 90, ua: 10, fa: 30 },
    props: [...SEAT(100, 130), { t: "line", x1: 76, y1: 136, x2: 72, y2: 70, w: 6 }, { t: "roller", p: "an", dx: 6 }],
    keys: [{ sh: 2, ft: 90 }, { sh: 88, ft: 180 }],
    cues: ["Diz ekseni makinenin ekseniyle hizalı, rulo ayak bileğinin önünde.", "Bacakları tamamen uzat, ön bacağı sık.", "Kontrollü şekilde indir."],
  },
  sissy: {
    base: { ...STAND, ua: 60, fa: 70 }, props: [{ t: "line", x1: 178, y1: 60, x2: 178, y2: 180, w: 4 }],
    keys: [{}, { hip: [138, 128], torso: 215 }],
    cues: ["Bir yerden tutunarak destek al.", "Dizleri öne iterek, gövde-uyluk düz çizgide geriye yaslan.", "Ön bacakla kendini yukarı çek."],
  },
  calf: {
    base: { anchor: "toe", at: [134, 176], torso: 180, th: 0, sh: 0, ua: 0, fa: 0 },
    props: [{ t: "rect", x: 118, y: 177, w: 34, h: 3 }],
    keys: [{ ft: 90 }, { ft: 38 }],
    cues: ["Parmak uçlarında dur, topuklar boşlukta.", "Topukları olabildiğince yükseğe kaldır, 1 sn tut.", "Topukları alta kadar indir, tam gerilme."],
  },
  seatedcalf: {
    base: { anchor: "toe", at: [155, 176], torso: 180, th: 90, sh: 0, ua: 10, fa: 60 },
    props: [{ t: "rect", x: 78, y: 141, w: 42, h: 8 }, { t: "roller", p: "kn", dy: -7, r: 6 }],
    keys: [{ ft: 90 }, { ft: 40 }],
    cues: ["Ped dizlerin üstünde, parmak uçları platformda.", "Topukları yükselt, 1 sn tut.", "Tam gerilene kadar indir."],
  },
  curl: {
    base: { ...STAND, ua: 3 }, props: [{ t: "db", p: "wr" }],
    keys: [{ fa: 3 }, { fa: 150 }],
    cues: ["Dirsekler gövdenin yanında sabit.", "Ağırlığı omza doğru kaldır, biseps'i sık.", "Kontrollü şekilde tam uzat; gövdeyle sallanma."],
  },
  inclinecurl: {
    base: { hip: [110, 140], torso: 205, th: 90, sh: 0, ft: 90, ua: -5 },
    props: [{ t: "line", x1: 114, y1: 146, x2: 86, y2: 86, w: 7 }, { t: "rect", x: 92, y: 146, w: 40, h: 6 }, { t: "db", p: "wr" }],
    keys: [{ fa: -5 }, { fa: 135 }],
    cues: ["45° bankta sırt yaslı, kollar aşağı sarkık.", "Dirseği oynatmadan ağırlığı kaldır.", "Tam gerilene kadar yavaş indir."],
  },
  pushdown: {
    base: { ...STAND, torso: 174, ua: 6 }, props: [{ t: "cable", p: "wr", to: [144, -36] }],
    keys: [{ fa: 150 }, { fa: 8 }],
    cues: ["Dirsekler gövdenin yanında sabit.", "Halatı/barı kollar tam uzanana kadar aşağı it.", "Kontrollü şekilde göğüs hizasına geri bırak."],
  },
  ohtri: {
    base: { ...STAND, ua: 185 }, props: [{ t: "db", p: "wr", r: 7 }],
    keys: [{ fa: 178 }, { fa: 322 }],
    cues: ["Dumbbell başın üstünde, dirsekler kulağa yakın.", "Ön kolu başın arkasına doğru indir.", "Dirsekleri oynatmadan yukarı uzat."],
  },
  skull: {
    base: { hip: [150, 132], torso: 270, th: 80, sh: 0, ft: 90, ua: 188 }, props: [...BENCH, { t: "bb", p: "wr", r: 10 }],
    keys: [{ fa: 182 }, { fa: 298 }],
    cues: ["Bankta uzan, bar göğsün üstünde, kollar dik.", "Dirsekleri sabit tutarak barı alnına doğru indir.", "Triseps ile yukarı uzat."],
  },
  lateral: {
    view: "front", base: { hip: [120, 94], ed: 1 }, props: DB2,
    keys: [{ hand: [142, 96] }, { hand: [192, 42] }],
    cues: ["Dumbbell'lar yanlarda, dirsekler hafif bükük.", "Kolları yana doğru omuz hizasına kaldır.", "Kontrollü şekilde indir; omuz silkmeden."],
  },
  cablelateral: {
    view: "front", base: { hip: [120, 94], ed: 1 }, props: [{ t: "cable", p: "wr", to: [92, 176] }],
    keys: [{ hand: [128, 96] }, { hand: [192, 42] }],
    cues: ["Makaranın yanında dur, kablo vücudunun önünden geçsin.", "Kolu yana doğru omuz hizasına kaldır.", "Kontrollü şekilde indir."],
  },
  plank: {
    base: { anchor: "el", at: [152, 176], ua: 0, fa: 90, ft: 10 }, seg: 1.6,
    keys: [{ torso: 102.6, th: 282.6, sh: 282.6 }, { torso: 101.6, th: 281.6, sh: 281.6 }],
    cues: ["Dirsekler omuzların altında, vücut baştan topuğa düz.", "Karın ve kalçayı sık, beli çökertme.", "Nefesi tutmadan pozisyonu koru."],
  },
  sideplank: {
    base: { anchor: "el", at: [152, 176], ua: 0, fa: 90, ft: 10 },
    keys: [{ torso: 104, th: 284, sh: 284 }, { torso: 96, th: 276, sh: 276 }],
    cues: ["Yan yat, dirsek omzun altında.", "Kalçayı kaldırarak vücudu düz çizgi yap.", "Kalçayı düşürmeden pozisyonu koru."],
  },
  deadbug: {
    base: { hip: [130, 168], torso: 270, ua: 180, fa: 180, ua2: 180, fa2: 180, th: 180, sh: 90, th2: 180, sh2: 90, ft: 180, ft2: 180 },
    props: [{ t: "rect", x: 40, y: 175, w: 160, h: 4 }],
    keys: [{}, { ua: 262, fa: 262, th2: 95, sh2: 95, ft2: 160 }],
    cues: ["Sırtüstü yat, kollar yukarı, dizler 90°.", "Bel yere yapışık; bir kolu ve karşı bacağı uzat.", "Geri getir, diğer tarafla tekrarla."],
  },
  pallof: {
    base: { ...STAND, ed: -1 }, props: [{ t: "cable", p: "wr", to: [12, 66] }],
    keys: [{ hand: [132, 60] }, { hand: [174, 54] }],
    cues: ["Makaranın yanında dur, tutamak göğsün önünde.", "Kolları öne uzat, gövdenin dönmesine izin verme.", "Kontrollü geri getir."],
  },
  hangknee: {
    base: { anchor: "wr", at: [120, -28], ua: 180, fa: 180, torso: 180, ft: 60 },
    props: [{ t: "line", x1: 84, y1: -30, x2: 170, y2: -30, w: 5 }],
    keys: [{ th: 0, sh: 0 }, { th: 100, sh: 5 }],
    cues: ["Bara asıl, omuzlar aktif.", "Dizleri göğse doğru çek, sallanma.", "Kontrollü şekilde indir."],
  },
  cablecrunch: {
    base: { anchor: "kn", at: [100, 176], th: 0, sh: 270, ft: 0, ua: 30, fa: 170, armRel: true },
    props: [{ t: "cable", p: "wr", to: [92, -34] }],
    keys: [{ torso: 180 }, { torso: 112 }],
    cues: ["Makaraya dönük diz çök, halatı başının yanında tut.", "Karnını sıkarak gövdeyi aşağı kıvır (kalça sabit).", "Kontrollü şekilde geri aç."],
  },
  abwheel: {
    base: { anchor: "kn", at: [40, 176], sh: 270, ft: 0 }, props: [{ t: "wheel", p: "wr" }],
    keys: [{ th: -10, torso: 115, ua: 0, fa: 0 }, { th: -70, torso: 95, ua: 77, fa: 77 }],
    cues: ["Dizler yerde, eller tekerlekte omuzların altında.", "Karın sıkı, beli çökertmeden tekerleği ileri yuvarla.", "Karınla çekerek geri gel."],
  },
  farmer: {
    base: { hip: [120, 98], torso: 180, ua: 0, fa: 0, ft: 90 }, props: DB2, seg: 0.6, hold: 0,
    keys: [{ th: 18, sh: 0, th2: -18, sh2: -12 }, { th: -18, sh: -12, th2: 18, sh2: 0 }],
    cues: ["Ağır dumbbell'ları yanlarda tut, omuzlar geride.", "Dik duruşla kısa ve kontrollü adımlarla yürü.", "Belirlenen mesafe/süre boyunca tutuşu bırakma."],
  },
};

// ================= Hareket → şablon, kaslar =================
export const EXERCISE_INFO = {
  "Barbell Back Squat": { t: "squat", m: "Ön bacak, kalça, arka bacak, core" },
  "Front Squat": { t: "frontsquat", m: "Ön bacak, kalça, üst sırt, core" },
  "Safety Bar Squat": { t: "squat", m: "Ön bacak, kalça, üst sırt" },
  "Goblet Squat": { t: "goblet", m: "Ön bacak, kalça, core" },
  "Leg Press": { t: "legpress", m: "Ön bacak, kalça" },
  "Hack Squat": { t: "hack", m: "Ön bacak, kalça" },
  "Dumbbell Squat": { t: "squatDB", m: "Ön bacak, kalça" },
  "Conventional Deadlift": { t: "deadlift", m: "Kalça, arka bacak, bel, sırt, kavrama" },
  "Trap Bar Deadlift": { t: "trapbar", m: "Kalça, ön ve arka bacak, sırt" },
  "Romanian Deadlift (RDL)": { t: "rdl", m: "Arka bacak, kalça, bel" },
  "Dumbbell RDL": { t: "rdl", props: DB2, m: "Arka bacak, kalça, bel" },
  "Hip Thrust": { t: "hipthrust", m: "Kalça (gluteus), arka bacak" },
  "Kettlebell Swing": { t: "kbswing", m: "Kalça, arka bacak, core, kondisyon" },
  "Good Morning": { t: "goodmorning", m: "Arka bacak, kalça, bel" },
  "Back Extension (45°)": { t: "backext", m: "Bel, kalça, arka bacak" },
  "Bench Press (Barbell)": { t: "bench", m: "Göğüs, ön omuz, triseps" },
  "Close-Grip Bench Press": { t: "bench", m: "Triseps, göğüs, ön omuz", c: ["Barı omuz genişliğinde (dar) kavra.", "Dirsekleri gövdeye yakın tutarak göğsün altına indir.", "Triseps ile yukarı it."] },
  "Incline Bench Press (Barbell)": { t: "incline", m: "Üst göğüs, ön omuz, triseps" },
  "Dumbbell Bench Press": { t: "bench", props: [...BENCH, { t: "db", p: "wr" }], m: "Göğüs, ön omuz, triseps" },
  "Incline Dumbbell Press": { t: "incline", props: [{ t: "line", x1: 153, y1: 147, x2: 96, y2: 107, w: 7 }, { t: "rect", x: 128, y: 146, w: 44, h: 6 }, { t: "rect", x: 140, y: 152, w: 6, h: 28 }, { t: "db", p: "wr" }], m: "Üst göğüs, ön omuz, triseps" },
  "Push-up": { t: "pushup", m: "Göğüs, ön omuz, triseps, core" },
  "Machine Chest Press": { t: "machinepress", m: "Göğüs, ön omuz, triseps" },
  "Parallel Bar Dips": { t: "dips", m: "Alt göğüs, triseps, ön omuz" },
  "Barbell Row": { t: "row", m: "Sırt (lat, orta sırt), arka omuz, biseps" },
  "Pendlay Row": { t: "row", m: "Orta sırt, lat, arka omuz", c: ["Gövde yere paralel, bar her tekrarda yerden başlar.", "Barı patlayıcı şekilde alt göğse çek.", "Barı yere geri bırak, sırt düz."] },
  "T-Bar Row": { t: "row", m: "Orta sırt, lat, biseps" },
  "Seated Cable Row": { t: "cablerow", m: "Orta sırt, lat, biseps" },
  "Single-Arm Dumbbell Row": { t: "dbrow", m: "Lat, orta sırt, biseps" },
  "Chest-Supported Row": { t: "chestrow", m: "Orta sırt, arka omuz, lat" },
  "Inverted Row": { t: "invrow", m: "Orta sırt, arka omuz, biseps, core" },
  "Overhead Press (Barbell)": { t: "ohp", m: "Omuz, triseps, üst göğüs, core" },
  "Push Press": { t: "pushpress", m: "Omuz, triseps, bacaklar (güç aktarımı)" },
  "Seated Dumbbell Shoulder Press": { t: "dbpressSeated", m: "Omuz, triseps" },
  "Standing Dumbbell Shoulder Press": { t: "dbpress", m: "Omuz, triseps, core" },
  "Landmine Press": { t: "landmine", m: "Ön omuz, üst göğüs, triseps" },
  "Arnold Press": { t: "dbpressSeated", m: "Ön ve yan omuz, triseps", c: ["Dumbbell'lar çenede, avuçlar sana dönük başla.", "İterken avuçları öne çevirerek başın üstüne kaldır.", "Aynı dönüşle başlangıca indir."] },
  "Pull-up": { t: "pullup", m: "Lat, orta sırt, biseps" },
  "Weighted Pull-up": { t: "pullup", m: "Lat, orta sırt, biseps", c: ["Kemerle ağırlık as, tam asılı başla.", "Göğsü bara doğru çekerek çeneyi barın üstüne çıkar.", "Kontrollü şekilde tam asılıya in."] },
  "Chin-up": { t: "chinup", m: "Lat, biseps, orta sırt" },
  "Lat Pulldown": { t: "pulldown", m: "Lat, orta sırt, biseps" },
  "Neutral-Grip Lat Pulldown": { t: "pulldownN", m: "Lat, orta sırt, biseps" },
  "Assisted Pull-up (Machine)": { t: "pullup", m: "Lat, orta sırt, biseps", c: ["Dizlerini destek pedine koy (ağırlık arttıkça yardım artar).", "Çeneyi barın üstüne çıkar.", "Kontrollü şekilde in."] },
  "Bulgarian Split Squat": { t: "bulgarian", m: "Ön bacak, kalça, denge" },
  "Walking Lunge": { t: "lunge", m: "Ön bacak, kalça, denge", c: ["Büyük bir adımla öne çık, gövde dik.", "Arka diz yere yaklaşana kadar in.", "Ön ayaktan iterek bir sonraki adımı at."] },
  "Step-up": { t: "stepup", m: "Ön bacak, kalça" },
  "Reverse Lunge": { t: "lunge", m: "Kalça, ön bacak", c: ["Dik dur, bir ayakla geriye büyük adım at.", "Arka diz yere yaklaşana kadar in.", "Ön topuktan iterek başlangıca dön."] },
  "Barbell Split Squat": { t: "splitsquat", m: "Ön bacak, kalça" },
  "Lying Leg Curl": { t: "legcurl", m: "Arka bacak (hamstring)" },
  "Seated Leg Curl": { t: "seatedcurl", m: "Arka bacak (hamstring)" },
  "Assisted Nordic Curl": { t: "nordic", m: "Arka bacak (eksantrik)" },
  "Leg Extension": { t: "legext", m: "Ön bacak (quadriceps)" },
  "Assisted Sissy Squat": { t: "sissy", m: "Ön bacak (quadriceps)" },
  "Standing Calf Raise": { t: "calf", m: "Baldır (gastrocnemius)" },
  "Seated Calf Raise": { t: "seatedcalf", m: "Baldır (soleus)" },
  "Leg Press Calf Raise": { t: "seatedcalf", m: "Baldır", c: ["Leg press'te sadece parmak uçların platformda.", "Dizler düz, platformu parmak uçlarıyla it.", "Tam gerilene kadar kontrollü geri bırak."] },
  "Lateral Raise (Dumbbell)": { t: "lateral", m: "Yan omuz" },
  "Cable Lateral Raise": { t: "cablelateral", m: "Yan omuz" },
  "Machine Lateral Raise": { t: "lateral", props: [], m: "Yan omuz", c: ["Koltuğu omuz ekseni makineyle hizalı olacak şekilde ayarla.", "Pedleri yana doğru omuz hizasına kaldır.", "Kontrollü şekilde indir."] },
  "Face Pull": { t: "facepull", m: "Arka omuz, üst sırt, rotator manşet" },
  "Reverse Fly": { t: "revfly", m: "Arka omuz, üst sırt" },
  "Band Pull-Apart": { t: "bandpull", m: "Arka omuz, üst sırt" },
  "Dumbbell Biceps Curl": { t: "curl", m: "Biseps" },
  "Hammer Curl": { t: "curl", m: "Biseps, brakialis, ön kol", c: ["Avuçlar birbirine dönük (çekiç tutuş).", "Dirsekleri sabit tutarak kaldır.", "Kontrollü şekilde indir."] },
  "EZ-Bar Curl": { t: "curl", props: [{ t: "bb", p: "wr", r: 11 }], m: "Biseps" },
  "Incline Dumbbell Curl": { t: "inclinecurl", m: "Biseps (uzun baş)" },
  "Cable Curl": { t: "curl", props: [{ t: "cable", p: "wr", to: [146, 178] }], m: "Biseps" },
  "Triceps Pushdown": { t: "pushdown", m: "Triseps" },
  "Overhead Triceps Extension": { t: "ohtri", m: "Triseps (uzun baş)" },
  "Skull Crusher (EZ-Bar)": { t: "skull", m: "Triseps" },
  "Single-Arm Cable Pushdown": { t: "pushdown", m: "Triseps" },
  "Cable Fly": { t: "fly", m: "Göğüs, ön omuz" },
  "Pec Deck": { t: "pecdeck", m: "Göğüs" },
  "Dumbbell Fly": { t: "dbfly", m: "Göğüs, ön omuz" },
  "Plank": { t: "plank", m: "Core (karın, bel), omuz" },
  "Dead Bug": { t: "deadbug", m: "Derin karın kasları, core stabilitesi" },
  "Pallof Press": { t: "pallof", m: "Core (anti-rotasyon), oblikler" },
  "Hanging Knee Raise": { t: "hangknee", m: "Alt karın, kalça fleksörleri, kavrama" },
  "Side Plank": { t: "sideplank", m: "Oblikler, yan core" },
  "Cable Crunch": { t: "cablecrunch", m: "Karın (rectus abdominis)" },
  "Ab Wheel Rollout": { t: "abwheel", m: "Karın, core, lat" },
  "Farmer's Walk": { t: "farmer", m: "Kavrama, trapez, core, kondisyon" },
};

// ================= Ev hareketleri: ek şablonlar =================
const MAT = { t: "rect", x: 10, y: 174, w: 220, h: 4 };
const bandTo = (p, to) => ({ t: "cable", p, to });
Object.assign(TPL, {
  airsquat: {
    base: { ...STAND, ua: 85, fa: 85 }, props: [],
    keys: [{}, { hip: [96, 138], torso: 145 }],
    cues: ["Ayaklar omuz genişliğinde, kollar dengeyi için önde.", "Kalçayı geriye-aşağı gönder, uyluk yere paralel olana kadar in.", "Topuklardan iterek kalk; zorlaşınca tempoyu yavaşlat (3 sn iniş)."],
  },
  jumpsquat: {
    base: { ...STAND, ua: 85, fa: 85 }, props: [],
    keys: [{ hip: [100, 136], torso: 150 }, { hip: [118, 88], ank: [122, 168], torso: 180, ua: -20, fa: -20, ft: 40 }],
    cues: ["Yarım squat pozisyonuna in.", "Patlayıcı şekilde sıçra, kollarını geriye savur.", "Dizler hafif bükük, yumuşak in ve hemen bir sonraki tekrara geç."],
  },
  bridge: {
    base: { ank: [150, 176], kd: 1, ua: 85, fa: 90, ft: 90 }, props: [MAT],
    keys: [{ hip: [96, 168], torso: 272 }, { hip: [100, 142], torso: 300 }],
    cues: ["Sırtüstü yat, dizler bükük, topuklar kalçaya yakın.", "Topuklardan iterek kalçayı omuz-diz düz çizgi olana kadar kaldır.", "Üstte kalçayı 1–2 sn sık, kontrollü in."],
  },
  slidecurl: {
    base: { kd: 1, ua: 85, fa: 90, ft: 180 }, props: [MAT, { t: "rect", x: 178, y: 172, w: 22, h: 3 }],
    keys: [{ hip: [96, 152], torso: 292, ank: [196, 174] }, { hip: [100, 142], torso: 300, ank: [150, 174] }],
    cues: ["Sırtüstü yat, topukların altına havlu koy (kaygan zeminde).", "Kalçayı kaldır ve topukları kalçana doğru çek.", "Kalça havada kalarak bacakları yavaşça uzat."],
  },
  floorpress: {
    base: { hip: [150, 168], torso: 270, th: 150, sh: 20, ft: 90, ed: -1 }, props: [MAT, { t: "db", p: "wr" }],
    keys: [{ hand: [100, 112] }, { hand: [104, 150] }],
    cues: ["Yerde sırtüstü yat, dizler bükük, dumbbell'lar göğüs üstünde.", "Üst kollar yere değene kadar kontrollü indir.", "Göğsünle yukarı it; zemin hareket açıklığını güvenli şekilde sınırlar."],
  },
  bandpress: {
    base: { ...STAND, ed: -1 }, props: [bandTo("wr", [14, 64])],
    keys: [{ hand: [126, 62] }, { hand: [174, 52] }],
    cues: ["Bandı arkanda göğüs hizasında sabitle (kapı/direk), bir adım öne çık.", "Elleri göğüsten öne doğru it, kolları uzat.", "Bant gerilimini koruyarak yavaşça geri gel."],
  },
  pike: {
    base: { anchor: "wr", at: [170, 176], ft: 20 },
    keys: [{ torso: 69, th: -25, sh: -25, ua: 20, fa: 20 }, { torso: 57, th: -36, sh: -36, ua: -30, fa: 50 }],
    cues: ["Kalçayı yukarı kaldırıp ters V pozisyonu al, eller omuz genişliğinde.", "Başını ellerin arasına doğru indir, dirsekler geriye.", "Omuzlarla iterek başlangıca dön. Kolaylaştırmak için dizleri bük."],
  },
  benchdips: {
    base: { anchor: "wr", at: [86, 128], ft: 90 },
    props: [{ t: "rect", x: 60, y: 131, w: 34, h: 6 }, { t: "rect", x: 62, y: 137, w: 5, h: 43 }, { t: "rect", x: 87, y: 137, w: 5, h: 43 }],
    keys: [{ torso: 180, ua: -8, fa: -8, th: 80, sh: 20 }, { torso: 175, ua: -75, fa: 15, th: 100, sh: 15 }],
    cues: ["Elleri arkandaki sağlam sandalyenin kenarına koy, bacaklar önde.", "Dirsekleri geriye bükerek omuz dirsek hizasına gelene kadar in.", "Avuçlardan iterek yukarı çık. Omuzda ağrı olursa hareket açıklığını kısalt."],
  },
  legraise: {
    base: { hip: [120, 168], torso: 270, ua: 85, fa: 90, ft: 180 }, props: [MAT],
    keys: [{ th: 92, sh: 92 }, { th: 175, sh: 175 }],
    cues: ["Sırtüstü yat, eller yanlarda, bel yere yapışık.", "Bacakları düz tutarak dik konuma kaldır.", "Bel kalkmadan yavaşça indir; zorlanırsan dizleri bük."],
  },
  proneY: {
    base: { hip: [100, 168], torso: 90, th: 270, sh: 270, ft: 0 }, props: [MAT],
    keys: [{ ua: 100, fa: 100 }, { ua: 125, fa: 125 }],
    cues: ["Yüzüstü uzan, kollar başın önünde Y şeklinde.", "Kürek kemiklerini sıkıp kolları yerden kaldır.", "1 sn tut, kontrollü indir. T şeklinde (kollar yana) de yapılabilir."],
  },
});

Object.assign(EXERCISE_INFO, {
  "Bodyweight Squat": { t: "airsquat", m: "Ön bacak, kalça" },
  "Jump Squat": { t: "jumpsquat", m: "Ön bacak, kalça, patlayıcı güç, kondisyon" },
  "Glute Bridge": { t: "bridge", m: "Kalça (gluteus), arka bacak" },
  "Single-Leg Glute Bridge": { t: "bridge", m: "Kalça, arka bacak, denge", c: ["Sırtüstü yat, bir bacak bükük, diğeri havada düz.", "Yerdeki topuktan iterek kalçayı kaldır, kalça düz kalsın.", "Üstte sık, yavaşça in; tüm tekrarları bitirip taraf değiştir."] },
  "Single-Leg RDL": { t: "rdl", props: [], m: "Arka bacak, kalça, denge", c: ["Tek ayak üstünde dur, destek bacağının dizi hafif bükük.", "Kalçadan öne eğilirken diğer bacak geriye uzansın, sırt düz.", "Arka bacakta gerilme hissedince kalçayı ileri iterek kalk."] },
  "Knee Push-up": { t: "pushup", m: "Göğüs, ön omuz, triseps", c: ["Dizler yerde, eller omuz genişliğinde, baştan dize düz çizgi.", "Göğüs yere yaklaşana kadar in, dirsekler ~45°.", "Yukarı it; 15+ tekrar yapabilince normal şınava geç."] },
  "Dumbbell Floor Press": { t: "floorpress", m: "Göğüs, triseps, ön omuz" },
  "Band Chest Press": { t: "bandpress", m: "Göğüs, ön omuz, triseps" },
  "Decline Push-up": { t: "pushup", m: "Üst göğüs, ön omuz, triseps", c: ["Ayakları sandalye/banka koy, eller yerde omuz genişliğinde.", "Vücut düz çizgi, göğsünü yere doğru indir.", "Yukarı it; ayaklar yükseldikçe zorlaşır."] },
  "Dumbbell Bent-Over Row": { t: "row", props: DB2, m: "Sırt, arka omuz, biseps" },
  "Band Row": { t: "cablerow", props: [{ t: "plate", p: "an", a: 90 }, bandTo("wr", [168, 160])], m: "Orta sırt, lat, biseps",
    c: ["Yerde otur, bandı ayak tabanlarından geçir.", "Dik otururken bandı göbeğine çek, dirsekler geriye.", "Kürek kemiklerini sık, kontrollü uzat."] },
  "Prone Y-T Raise": { t: "proneY", m: "Arka omuz, üst sırt (trapez alt/orta)" },
  "Pike Push-up": { t: "pike", m: "Omuz, triseps, üst göğüs" },
  "Band Overhead Press": { t: "dbpress", props: [bandTo("wr", [130, 178]), bandTo("wr2", [110, 178])], m: "Omuz, triseps",
    c: ["Bandın ortasına bas, uçlarını omuz hizasında tut.", "Başının üstüne doğru it.", "Bant gerilimini koruyarak omuz hizasına indir."] },
  "Negative Pull-up": { t: "pullup", m: "Lat, orta sırt, biseps",
    c: ["Sandalyeden destek alarak çeneyi barın üstüne çıkar.", "3–5 saniyede kontrollü şekilde tam asılıya in.", "Her tekrarda yeniden yukarı çık; tam barfikse hazırlar."] },
  "Band Lat Pulldown": { t: "pulldown", props: [...SEAT(120, 122), { t: "bar", e: 4, to: [120, -40] }], m: "Lat, orta sırt, biseps",
    c: ["Bandı yüksek bir noktaya (kapı üstü) sabitle, diz çök ya da otur.", "Göğsü yukarı tutarak elleri omuzlara doğru aşağı çek.", "Kontrollü şekilde kolları uzat."] },
  "Sliding Leg Curl (Towel)": { t: "slidecurl", m: "Arka bacak (hamstring), kalça" },
  "Single-Leg Calf Raise": { t: "calf", m: "Baldır", c: ["Tek ayak üstünde, parmak ucu basamakta, elle duvardan destek al.", "Topuğu olabildiğince yükselt, 1 sn tut.", "Topuğu alta kadar indir, tam gerilme."] },
  "Band Lateral Raise": { t: "cablelateral", props: [bandTo("wr", [128, 178])], m: "Yan omuz",
    c: ["Bandın bir ucuna bas, diğer ucu yanında.", "Kolu yana doğru omuz hizasına kaldır.", "Kontrollü şekilde indir."] },
  "Band Face Pull": { t: "facepull", props: [bandTo("wr", [228, 36])], m: "Arka omuz, üst sırt, rotator manşet",
    c: ["Bandı yüz hizasında sabitle, iki ucunu tut.", "Bandı yüzüne doğru çekerken elleri ayır, dirsekler yukarıda.", "Arka omzu sık, kontrollü uzat."] },
  "Band Curl": { t: "curl", props: [bandTo("wr", [124, 178])], m: "Biseps",
    c: ["Bandın ortasına bas, uçları avuçlar önde.", "Dirsekleri sabit tutarak omza doğru kaldır.", "Bant gerilimini koruyarak yavaşça indir."] },
  "Chair Dips": { t: "benchdips", m: "Triseps, ön omuz, alt göğüs" },
  "Diamond Push-up": { t: "pushup", m: "Triseps, iç göğüs",
    c: ["Elleri göğüs altında, başparmak ve işaret parmakları elmas şekli oluşturacak şekilde birleştir.", "Dirsekleri gövdeye yakın tutarak in.", "Triseps ile yukarı it; zorsa dizler yerde yap."] },
  "Band Pushdown": { t: "pushdown", props: [bandTo("wr", [144, -36])], m: "Triseps",
    c: ["Bandı yüksek bir noktaya sabitle.", "Dirsekler gövdenin yanında sabit, bandı aşağı it.", "Kontrollü şekilde geri bırak."] },
  "Band Fly": { t: "fly", m: "Göğüs, ön omuz", c: ["Bandı arkanda göğüs hizasında sabitle, uçlarını tut.", "Kolları kucaklar gibi önde birleştir.", "Göğüste gerilme hissedene kadar kontrollü aç."] },
  "Lying Leg Raise": { t: "legraise", m: "Alt karın, kalça fleksörleri" },
});

// ================= Tempo yönü, faz etiketleri, kas vurgusu =================
// "con": ilk hareket kaldırma/çekme (konsantrik) · "loop": eşit tempolu döngü · diğerleri "ecc" (önce indirme)
const CON_FIRST = ["deadlift", "trapbar", "hipthrust", "kbswing", "machinepress", "fly", "pecdeck", "row", "dbrow",
  "cablerow", "chestrow", "invrow", "facepull", "revfly", "bandpull", "ohp", "pushpress", "dbpress", "dbpressSeated",
  "landmine", "pulldown", "pulldownN", "pullup", "chinup", "stepup", "legcurl", "seatedcurl", "legext", "calf",
  "seatedcalf", "curl", "inclinecurl", "pushdown", "lateral", "cablelateral", "pallof", "hangknee", "cablecrunch",
  "bridge", "slidecurl", "bandpress", "legraise", "proneY"];
const LOOP = ["farmer", "plank", "sideplank"];
for (const [k, t] of Object.entries(TPL)) t.order = LOOP.includes(k) ? "loop" : CON_FIRST.includes(k) ? "con" : "ecc";

const PHASES = {
  ecc: ["İndir · ~2 sn kontrollü", "Altta kısa dur", "Kaldır / İt · güçlü"],
  con: ["Kaldır / Çek · güçlü", "Sık · ~1 sn", "İndir · ~2 sn kontrollü"],
  plank: ["Pozisyonu koru", "Nefes al-ver", "Pozisyonu koru"],
  farmer: ["Kısa adımlarla yürü", "Dik dur", "Kısa adımlarla yürü"],
  deadbug: ["Kol ve karşı bacağı uzat", "Bel yerde, tut", "Geri getir"],
  abwheel: ["İleri yuvarla · kontrollü", "Bel çökmeden dur", "Karınla geri çek"],
};
const PHASE_OF = { plank: "plank", sideplank: "plank", farmer: "farmer", deadbug: "deadbug", abwheel: "abwheel" };

// Çalışan kası taşıyan segmentler (animasyonda yeşil vurgulanır)
const HL = {
  thigh: ["squat", "squatDB", "hack", "frontsquat", "goblet", "legpress", "lunge", "bulgarian", "splitsquat", "stepup",
    "sissy", "legext", "legcurl", "seatedcurl", "nordic", "airsquat", "jumpsquat"],
  thighTorso: ["deadlift", "trapbar", "rdl", "goodmorning", "backext", "hipthrust", "kbswing", "bridge", "slidecurl"],
  torsoArm: ["bench", "incline", "machinepress", "dbfly", "fly", "pecdeck", "pushup", "dips", "row", "dbrow", "cablerow",
    "chestrow", "invrow", "pulldown", "pulldownN", "pullup", "chinup", "floorpress", "bandpress"],
  arm: ["facepull", "revfly", "bandpull", "lateral", "cablelateral", "ohp", "pushpress", "dbpress", "dbpressSeated",
    "landmine", "curl", "inclinecurl", "pushdown", "ohtri", "skull", "pike", "benchdips", "proneY"],
  shin: ["calf", "seatedcalf"],
  torso: ["plank", "sideplank", "deadbug", "pallof", "hangknee", "cablecrunch", "abwheel", "legraise"],
  grip: ["farmer"],
};
const HL_SEGS = { thigh: ["thigh"], thighTorso: ["thigh", "torso"], torsoArm: ["torso", "upperArm"], arm: ["upperArm"],
  shin: ["shin"], torso: ["torso"], grip: ["foreArm", "torso"] };
const hlOf = (k) => { for (const [g, list] of Object.entries(HL)) if (list.includes(k)) return HL_SEGS[g]; return []; };

export function getDemo(name) {
  const info = EXERCISE_INFO[name];
  if (!info) return null;
  const tpl = TPL[info.t];
  return {
    name, tpl, props: info.props || tpl.props || [], muscles: info.m, cues: info.c || tpl.cues,
    hl: hlOf(info.t), phases: PHASES[PHASE_OF[info.t] || tpl.order] || PHASES.ecc,
  };
}
