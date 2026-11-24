// Ekran açık kalsın: antrenman seansı sürerken ekranın kararmasını engeller (Screen Wake Lock API).
// Tarayıcı, sekme arka plana geçince kilidi bırakır; sekme öne gelince yeniden istenir.
import { state } from "../state/store.js";
import { settings } from "../state/settings.js";

let lock = null;
export const wakeSupported = () => "wakeLock" in navigator;

export async function syncWakeLock() {
  const want = wakeSupported() && Boolean(state.active) && settings().keepAwake && document.visibilityState === "visible";
  try {
    if (want && !lock) {
      lock = await navigator.wakeLock.request("screen");
      lock.addEventListener("release", () => { lock = null; });
    } else if (!want && lock) {
      await lock.release();
      lock = null;
    }
  } catch { lock = null; } // pil tasarrufu vb. nedeniyle reddedilebilir; uygulama normal çalışmaya devam eder
}

document.addEventListener("visibilitychange", syncWakeLock);
