// Videosu olan hareketler: hareket adı → media/ klasöründeki dosya adı (uzantısız).
// Her ad için media/<ad>.mp4 (480×480, sessiz, döngü) ve media/<ad>.jpg (kapak) bulunmalı.
// Listede olmayan hareketlerde çubuk figür animasyonu gösterilir.
export const VIDEOS = {
  "Barbell Back Squat": "barbell-back-squat",
  "Front Squat": "front-squat",
  "Safety Bar Squat": "safety-bar-squat",
};

export function videoOf(name) {
  const f = VIDEOS[name];
  return f ? { src: `media/${f}.mp4`, poster: `media/${f}.jpg` } : null;
}
