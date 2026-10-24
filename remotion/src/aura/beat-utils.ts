// src/aura/beat-utils.ts
import {Beat} from './types';

export const toFrame = (t: number, fps: number) => Math.round(t * fps);

/** آخر ضربة (بمستوى ≥ minLevel) حدثت عند أو قبل frame */
export const lastBeat = (frame: number, fps: number, beats: Beat[], minLevel = 0) => {
  let lo = 0, hi = beats.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (toFrame(beats[mid].t, fps) <= frame) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  for (let i = ans; i >= 0; i--) {
    if (beats[i].level >= minLevel) {
      return {beat: beats[i], index: i, age: frame - toFrame(beats[i].t, fps)};
    }
  }
  return null;
};

/** نبضة تتلاشى أُسّياً: 1 عند الضربة ⇐ 0 */
export const impulse = (age: number, decayFrames: number) =>
  age < 0 ? 0 : Math.exp(-age / (decayFrames / 3));

/** نبضة خطية تنتهي تماماً بعد n فريم */
export const pulse = (age: number, n: number) => (age < 0 || age >= n ? 0 : 1 - age / n);

/** مجموع نبضات كل الضربات القريبة (لتراكب الضربات المتتالية) */
export const envelope = (
  frame: number, fps: number, beats: Beat[],
  opts: {minLevel?: number; decay: number; weight?: (lvl: number) => number}
) => {
  const {minLevel = 0, decay, weight = () => 1} = opts;
  let v = 0;
  for (const b of beats) {
    if (b.level < minLevel) continue;
    const age = frame - toFrame(b.t, fps);
    if (age < 0) break;
    if (age > decay * 2) continue;
    v += weight(b.level) * impulse(age, decay);
  }
  return Math.min(v, 1.5);
};
