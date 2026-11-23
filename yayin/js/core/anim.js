// Hareket simülasyonları: 2B çubuk figür, anahtar pozlar arasında animasyon.
// Açı sistemi: 0° = aşağı, 90° = ileri (sağ), 180° = yukarı, 270° = geri (sol). Figür sağa bakar.
// Poz alanları:
//   hip:[x,y]      kalça mutlak konumu (yoksa anchor/at ile bir noktaya sabitlenir)
//   torso          kalçadan omuza açı
//   ua/fa          üst kol / ön kol açısı   (ya da hand:[x,y] + ed: dirsek yönü ±1 → ters kinematik)
//   th/sh          uyluk / baldır açısı     (ya da ank:[x,y] + kd: diz yönü ±1)
//   ft             ayak açısı
//   "2" ekli alanlar (ua2, hand2, th2, ank2 ...) arka taraftaki uzuvlar
//   armRel         kol açıları gövdeye göre (bar sırtta iken)
//   view:'front'   önden görünüm (yana açılan hareketler için)

export const DEMO = (() => {
  const L = { torso: 55, neck: 8, headR: 9, ua: 30, fa: 28, th: 42, sh: 40, ft: 12 };
  const R = Math.PI / 180;
  const dir = (a) => [Math.sin(a * R), Math.cos(a * R)];
  const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];
  const ang = (v) => Math.atan2(v[0], v[1]) / R;
  const FLOOR = 180;

  function ik(o, t, l1, l2, bend) {
    const v = [t[0] - o[0], t[1] - o[1]];
    let d = Math.hypot(v[0], v[1]);
    const a0 = ang(v);
    d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d));
    const c = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
    const al = Math.acos(Math.max(-1, Math.min(1, c))) / R;
    const mid = add(o, dir(a0 + bend * al), l1);
    return [mid, add(o, dir(a0), d)];
  }

  // ---------- Yandan görünüm ----------
  function solveSide(p) {
    const t = p.torso ?? 180;
    const hip = p.hip ? [...p.hip] : [0, 0];
    const pts = { hip };
    pts.sh = add(hip, dir(t), L.torso);
    pts.head = add(pts.sh, dir(t + (p.hd || 0)), L.neck + L.headR);
    const rel = p.armRel ? t - 180 : 0;
    for (const s of ["", "2"]) {
      const own = s && (p.ua2 != null || p.hand2 != null);
      const hand = s ? (own ? p.hand2 : p.hand) : p.hand;
      if (hand) {
        const [e, w] = ik(pts.sh, hand, L.ua, L.fa, s && p.ed2 != null ? p.ed2 : (p.ed ?? -1));
        pts["el" + s] = e; pts["wr" + s] = w;
      } else {
        const ua = (own ? p.ua2 : p.ua) ?? 0, fa = (own ? p.fa2 : p.fa) ?? 0;
        pts["el" + s] = add(pts.sh, dir(ua + rel), L.ua);
        pts["wr" + s] = add(pts["el" + s], dir(fa + rel), L.fa);
      }
    }
    for (const s of ["", "2"]) {
      const own = s && (p.th2 != null || p.ank2 != null);
      const ank = s ? (own ? p.ank2 : p.ank) : p.ank;
      if (ank) {
        const [k, a] = ik(hip, ank, L.th, L.sh, (own ? p.kd2 : p.kd) ?? 1);
        pts["kn" + s] = k; pts["an" + s] = a;
      } else {
        const th = (own ? p.th2 : p.th) ?? 0, sh = (own ? p.sh2 : p.sh) ?? 0;
        pts["kn" + s] = add(hip, dir(th), L.th);
        pts["an" + s] = add(pts["kn" + s], dir(sh), L.sh);
      }
      const ft = (s && p.ft2 != null ? p.ft2 : p.ft) ?? 90;
      pts["toe" + s] = add(pts["an" + s], dir(ft), L.ft);
    }
    return anchor(pts, p);
  }

  // ---------- Önden görünüm ----------
  function solveFront(p) {
    const hip = p.hip ? [...p.hip] : [120, 94];
    const x = hip[0];
    const shc = [x, hip[1] - L.torso];
    const pts = { hip, shc, head: [x, shc[1] - (L.neck + L.headR)] };
    pts.sh = [x + 16, shc[1]]; pts.sh2 = [x - 16, shc[1]];
    pts.hp = [x + 9, hip[1]]; pts.hp2 = [x - 9, hip[1]];
    if (p.hand) {
      const [e, w] = ik(pts.sh, p.hand, L.ua, L.fa, p.ed ?? -1);
      pts.el = e; pts.wr = w;
    } else {
      pts.el = add(pts.sh, dir(p.ua ?? 5), L.ua);
      pts.wr = add(pts.el, dir(p.fa ?? 5), L.fa);
    }
    const ank = p.ank || [x + 10, FLOOR - 4];
    const d = Math.hypot(ank[0] - pts.hp[0], ank[1] - pts.hp[1]);
    pts.an = ank;
    pts.kn = [(pts.hp[0] + ank[0]) / 2 + Math.max(0, 82 - d) * 0.35, (pts.hp[1] + ank[1]) / 2];
    pts.toe = [ank[0] + 6, ank[1] + 2];
    const m = (q) => [2 * x - q[0], q[1]];
    pts.el2 = m(pts.el); pts.wr2 = m(pts.wr); pts.kn2 = m(pts.kn); pts.an2 = m(pts.an); pts.toe2 = m(pts.toe);
    return anchor(pts, p);
  }

  function anchor(pts, p) {
    if (!p.hip && p.anchor) {
      const a = pts[p.anchor];
      const off = [p.at[0] - a[0], p.at[1] - a[1]];
      for (const k in pts) pts[k] = add(pts[k], off);
    }
    return pts;
  }

  // ---------- Çizim ----------
  const ln = (a, b, w, cls = "fig", extra = "") =>
    `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke-width="${w}" class="${cls}" ${extra}/>`;
  const circ = (c, r, cls, extra = "") => `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r}" class="${cls}" ${extra}/>`;

  function drawProps(props, pts, front, layer) {
    let s = "";
    for (const pr of props || []) {
      const back = pr.t === "rect" || pr.t === "line" || pr.t === "poly";
      if ((layer === "back") !== back) continue;
      const at = pr.p ? add(pts[pr.p], [pr.dx || 0, pr.dy || 0]) : null;
      switch (pr.t) {
        case "rect": s += `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="2" class="prop"/>`; break;
        case "line": s += ln([pr.x1, pr.y1], [pr.x2, pr.y2], pr.w || 5, "propl"); break;
        case "bb":
          if (front) {
            const y = (pts.wr[1] + pts.wr2[1]) / 2;
            const xl = pts.wr2[0] - 34, xr = pts.wr[0] + 34;
            s += ln([xl, y], [xr, y], 3, "eq");
            s += `<rect x="${xl - 4}" y="${y - 14}" width="8" height="28" rx="2" class="eqf"/><rect x="${xr - 4}" y="${y - 14}" width="8" height="28" rx="2" class="eqf"/>`;
          } else {
            s += circ(at, pr.r || 14, "eqo") + circ(at, 3, "eqf");
          }
          break;
        case "db":
          s += front ? `<rect x="${(at[0] - 3).toFixed(1)}" y="${(at[1] - 8).toFixed(1)}" width="6" height="16" rx="2" class="eqf"/>` : circ(at, pr.r || 5.5, "eqf");
          break;
        case "kb": s += circ(add(at, [0, 8]), 7, "eqf") + ln(at, add(at, [0, 4]), 3, "eq"); break;
        case "wheel": s += circ(add(at, [0, 3]), 8, "eqo") + circ(add(at, [0, 3]), 2.5, "eqf"); break;
        case "cable":
          s += ln(at, pr.to, 1.5, "cab") + circ(pr.to, 4, "eqo");
          break;
        case "bar": {
          const e = pr.e || 10;
          const y = (pts.wr[1] + pts.wr2[1]) / 2;
          s += ln([pts.wr2[0] - e, y], [pts.wr[0] + e, y], 3, "eq");
          if (pr.to) s += ln([(pts.wr[0] + pts.wr2[0]) / 2, y], pr.to, 1.5, "cab") + circ(pr.to, 4, "eqo");
          break;
        }
        case "band": s += ln(pts.wr2, pts.wr, 2.5, "band"); break;
        case "roller": s += circ(at, pr.r || 5, "eqf"); break;
        case "pole": s += ln(at, pr.to, 3, "eq") + circ(at, pr.r || 11, "eqo"); break;
        case "plate": {
          const a = pr.a, c = add(pts.an, dir(a), 5), pd = dir(a + 90);
          s += ln(add(c, pd, -18), add(c, pd, 18), 4, "propl");
          break;
        }
      }
    }
    return s;
  }

  // hl: çalışan kası taşıyan segmentler ("torso", "upperArm", "foreArm", "thigh", "shin") vurgulu çizilir
  function render(tpl, pose, props, hl = []) {
    const front = tpl.view === "front";
    const P = front ? solveFront(pose) : solveSide(pose);
    const c = (seg) => (hl.includes(seg) ? "fig hl" : "fig");
    let s = ln([0, FLOOR], [240, FLOOR], 2, "floor");
    s += drawProps(props, P, front, "back");
    if (front) {
      s += ln(P.hp2, P.kn2, 5.5, c("thigh")) + ln(P.kn2, P.an2, 5.5, c("shin")) + ln(P.an2, P.toe2, 4.5);
      s += ln(P.hp, P.kn, 5.5, c("thigh")) + ln(P.kn, P.an, 5.5, c("shin")) + ln(P.an, P.toe, 4.5);
      s += ln(P.hp2, P.hp, 6) + ln(P.hip, P.shc, 7, c("torso")) + ln(P.sh2, P.sh, 6, c("torso"));
      s += ln(P.sh2, P.el2, 5.5, c("upperArm")) + ln(P.el2, P.wr2, 5, c("foreArm"));
      s += ln(P.sh, P.el, 5.5, c("upperArm")) + ln(P.el, P.wr, 5, c("foreArm"));
      s += circ(P.head, L.headR, "head");
    } else {
      const b = 'opacity=".38"';
      s += ln(P.hip, P.kn2, 5.5, c("thigh"), b) + ln(P.kn2, P.an2, 5.5, c("shin"), b) + ln(P.an2, P.toe2, 4.5, "fig", b);
      s += ln(P.sh, P.el2, 5.5, c("upperArm"), b) + ln(P.el2, P.wr2, 5, c("foreArm"), b);
      s += ln(P.hip, P.kn, 6, c("thigh")) + ln(P.kn, P.an, 5.5, c("shin")) + ln(P.an, P.toe, 4.5);
      s += ln(P.hip, P.sh, 7, c("torso"));
      s += circ(P.head, L.headR, "head");
      s += ln(P.sh, P.el, 5.5, c("upperArm")) + ln(P.el, P.wr, 5, c("foreArm"));
    }
    s += drawProps(props, P, front, "front");
    return s;
  }

  // ---------- Animasyon ----------
  function fullKeys(tpl) {
    const out = [];
    let cur = { ...(tpl.base || {}) };
    for (const k of tpl.keys) { cur = { ...cur, ...k }; out.push(cur); }
    return out;
  }
  function lerp(a, b, u) {
    const o = {};
    for (const k in b) {
      const x = a[k], y = b[k];
      if (typeof y === "number" && typeof x === "number") o[k] = x + (y - x) * u;
      else if (Array.isArray(y) && Array.isArray(x)) o[k] = y.map((v, i) => typeof v === "number" ? x[i] + (v - x[i]) * u : v);
      else o[k] = y;
    }
    for (const k in a) if (!(k in o)) o[k] = a[k];
    return o;
  }
  const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * u);

  // Gerçekçi tempo: eksantrik (indirme) ~2 sn, konsantrik (kaldırma) ~1,2 sn, uçlarda kısa bekleme.
  // tpl.order: "ecc" = önce indirilen hareket (squat, bench), "con" = önce kaldırılan (deadlift, row, curl),
  //            "loop" = eşit tempolu döngü (yürüyüş, plank)
  const ECC = 2.0, CON = 1.2;
  function timing(tpl) {
    const n = tpl.keys.length - 1;
    if (tpl.order === "loop" || !tpl.order) {
      const seg = tpl.seg || 1.0, hold = tpl.hold ?? 0.35;
      return { n, fwd: seg, back: seg, hold0: hold, hold1: hold };
    }
    const ecc = tpl.order === "ecc";
    return { n, fwd: ecc ? ECC : CON, back: ecc ? CON : ECC, hold0: 0.4, hold1: ecc ? 0.4 : 0.6 };
  }
  const cycleLength = (tpl) => { const t = timing(tpl); return t.hold0 + t.n * t.fwd + t.hold1 + t.n * t.back; };

  // time (sn) → { pose, phase (0: ileri, 1: uç noktada bekleme, 2: geri), ratio (döngüde 0–1) }
  function sample(tpl, time) {
    const keys = fullKeys(tpl);
    if (keys.length === 1) return { pose: keys[0], phase: 1, ratio: 0 };
    const { n, fwd, back, hold0, hold1 } = timing(tpl);
    const fwdDur = hold0 + n * fwd, total = fwdDur + hold1 + n * back;
    const t = ((time % total) + total) % total;
    const ratio = t / total;
    if (t < fwdDur) {
      if (t < hold0) return { pose: keys[0], phase: 0, ratio };
      const x = (t - hold0) / fwd, i = Math.min(n - 1, Math.floor(x));
      return { pose: lerp(keys[i], keys[i + 1], ease(x - i)), phase: 0, ratio };
    }
    const tb = t - fwdDur;
    if (tb < hold1) return { pose: keys[n], phase: 1, ratio };
    const x = (tb - hold1) / back, i = Math.min(n - 1, Math.floor(x));
    return { pose: lerp(keys[n - i], keys[n - i - 1], ease(x - i)), phase: 2, ratio };
  }
  const poseAt = (tpl, time) => sample(tpl, time).pose;

  return { render, sample, poseAt, cycleLength, fullKeys, L, FLOOR };
})();
