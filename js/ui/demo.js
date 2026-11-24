// Hareket simülasyonu: küçük önizleme ve "Nasıl yapılır?" penceresi
import { DEMO } from "../core/anim.js";
import { getDemo } from "../data/demos.js";
import { videoOf } from "../data/videos.js";
import { esc, icon, openSheet } from "./dom.js";
import { bodyMap, exerciseLevels } from "./bodymap.js";

// Hareketin çalıştırdığı kaslar: ön/arka vücut haritası
const mapBlock = (name) => `<div class="bm-card">
  ${bodyMap(exerciseLevels(name), { label: esc(name) + ": çalışan kaslar" })}
  <div class="bm-legend"><span class="p">Ana kas</span><span class="s">Yardımcı kas</span></div></div>`;

export const VIEWBOX = "0 -40 240 225";

// Statik küçük resim: videosu varsa kapak görseli, yoksa uç noktadaki poz (çalışan kas vurgulu)
export function thumbSvg(name) {
  const v = videoOf(name);
  if (v) return `<img class="demo-img" src="${v.poster}" alt="" loading="lazy" decoding="async">`;
  const d = getDemo(name);
  if (!d) return "";
  const keys = DEMO.fullKeys(d.tpl);
  return `<svg class="demo" viewBox="${VIEWBOX}" aria-hidden="true">${DEMO.render(d.tpl, keys[keys.length - 1], d.props, d.hl)}</svg>`;
}

export function openDemo(name) {
  const d = getDemo(name);
  if (!d) return;
  const video = videoOf(name);
  if (video) return openVideo(name, d, video);
  const cycle = DEMO.cycleLength(d.tpl);
  const yt = ytLink(name);
  const sheet = openSheet(`
    <div class="between" style="align-items:flex-start">
      <div>
        <div class="eyebrow">Nasıl yapılır?</div>
        <div class="h2">${esc(name)}</div>
        <div class="small muted">${esc(d.muscles)}</div>
      </div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    <div class="stage">
      <div class="phase" data-phase></div>
      <div class="legend">Çalışan bölge</div>
      <svg class="demo" viewBox="${VIEWBOX}" role="img" aria-label="${esc(name)} hareket animasyonu" data-svg></svg>
    </div>
    <div class="controls">
      <div class="between">
        <div class="row" style="gap:6px">
          <button type="button" class="play" data-play aria-label="Durdur">${icon("pause")}</button>
          <div class="seg" role="group" aria-label="Oynatma hızı">
            <button type="button" data-speed="1" aria-pressed="true">1x</button>
            <button type="button" data-speed="0.5" aria-pressed="false">0,5x yavaş</button>
          </div>
        </div>
        <span class="tiny muted">Tempo ~${Math.round(cycle)} sn / tekrar</span>
      </div>
      <input type="range" min="0" max="1000" value="0" data-scrub aria-label="Hareketin anı">
    </div>
    ${mapBlock(name)}
    <ol class="cues">${d.cues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
    <a class="btn block" style="margin-top:14px" href="${yt}" target="_blank" rel="noopener">${icon("external")} YouTube'da video ara</a>
  `, { label: name + " nasıl yapılır", onClose: () => cancelAnimationFrame(raf) });

  const el = sheet.el;
  const svg = el.querySelector("[data-svg]");
  const phaseEl = el.querySelector("[data-phase]");
  const scrub = el.querySelector("[data-scrub]");
  const playBtn = el.querySelector("[data-play]");
  let playing = true, speed = 1, t = 0, last = performance.now(), raf = 0;

  const draw = () => {
    const s = DEMO.sample(d.tpl, t);
    svg.innerHTML = DEMO.render(d.tpl, s.pose, d.props, d.hl);
    phaseEl.textContent = d.phases[s.phase];
    phaseEl.className = "phase p" + s.phase;
    if (document.activeElement !== scrub) scrub.value = Math.round(s.ratio * 1000);
  };
  const loop = (now) => {
    if (playing) t += ((now - last) / 1000) * speed;
    last = now;
    draw();
    raf = requestAnimationFrame(loop);
  };
  const setPlaying = (p) => {
    playing = p;
    playBtn.innerHTML = icon(p ? "pause" : "play");
    playBtn.setAttribute("aria-label", p ? "Durdur" : "Oynat");
  };
  playBtn.addEventListener("click", () => setPlaying(!playing));
  el.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => {
    speed = +b.dataset.speed;
    el.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  scrub.addEventListener("input", () => {
    setPlaying(false);
    t = (scrub.value / 1000) * cycle;
    draw();
  });
  raf = requestAnimationFrame(loop);
}

const ytLink = (name) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " nasıl yapılır");

// Videosu olan hareket: aynı pencere düzeni, animasyon yerine döngü video
function openVideo(name, d, video) {
  const sheet = openSheet(`
    <div class="between" style="align-items:flex-start">
      <div>
        <div class="eyebrow">Nasıl yapılır?</div>
        <div class="h2">${esc(name)}</div>
        <div class="small muted">${esc(d.muscles)}</div>
      </div>
      <button type="button" class="close" data-close aria-label="Kapat">${icon("x")}</button>
    </div>
    <div class="stage video">
      <video src="${video.src}" poster="${video.poster}" autoplay muted loop playsinline preload="auto"
        aria-label="${esc(name)} hareket videosu" data-video></video>
    </div>
    <div class="controls">
      <div class="between">
        <div class="row" style="gap:6px">
          <button type="button" class="play" data-play aria-label="Durdur">${icon("pause")}</button>
          <div class="seg" role="group" aria-label="Oynatma hızı">
            <button type="button" data-speed="1" aria-pressed="true">1x</button>
            <button type="button" data-speed="0.5" aria-pressed="false">0,5x yavaş</button>
          </div>
        </div>
        <span class="tiny muted">Kırmızı: çalışan kaslar</span>
      </div>
      <input type="range" min="0" max="1000" value="0" data-scrub aria-label="Videonun anı">
    </div>
    ${mapBlock(name)}
    <ol class="cues">${d.cues.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
    <a class="btn block" style="margin-top:14px" href="${ytLink(name)}" target="_blank" rel="noopener">${icon("external")} YouTube'da video ara</a>
  `, { label: name + " nasıl yapılır", onClose: () => { v.pause(); v.removeAttribute("src"); v.load(); } });

  const el = sheet.el;
  const v = el.querySelector("[data-video]");
  const scrub = el.querySelector("[data-scrub]");
  const playBtn = el.querySelector("[data-play]");
  let speed = 1;
  const showPlaying = (p) => {
    playBtn.innerHTML = icon(p ? "pause" : "play");
    playBtn.setAttribute("aria-label", p ? "Durdur" : "Oynat");
  };
  v.addEventListener("play", () => showPlaying(true));
  v.addEventListener("pause", () => showPlaying(false));
  // Otomatik oynatma engellenirse (ör. pil tasarrufu) düğme "Oynat" gösterir
  v.play()?.catch(() => showPlaying(false));
  playBtn.addEventListener("click", () => (v.paused ? v.play() : v.pause()));
  el.querySelectorAll("[data-speed]").forEach((b) => b.addEventListener("click", () => {
    speed = +b.dataset.speed;
    v.playbackRate = speed;
    el.querySelectorAll("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }));
  v.addEventListener("timeupdate", () => {
    if (document.activeElement !== scrub && v.duration) scrub.value = Math.round((v.currentTime / v.duration) * 1000);
  });
  scrub.addEventListener("input", () => {
    v.pause();
    if (v.duration) v.currentTime = (scrub.value / 1000) * v.duration;
  });
}

// Kapsayıcıdaki tüm [data-demo] butonlarına tek dinleyici
export function bindDemoClicks(root) {
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-demo]");
    if (b) openDemo(b.dataset.demo);
  });
}
