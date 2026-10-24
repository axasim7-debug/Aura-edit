// src/aura/velocity.ts
import {Easing, interpolate} from 'remotion';

export type Curve = 'none' | 'hero' | 'bullet' | 'flash-in' | 'flash-out';

/** سرعة اللقطة عند الفريم المحلي f (0..len-1). beatFrames محلية داخل المقطع. */
export const speedAt = (
  f: number, len: number, curve: Curve, slow: number, fast: number, beatFrames: number[], constant = 1
) => {
  const ease = Easing.inOut(Easing.cubic);
  switch (curve) {
    case 'none': return constant;
    case 'hero': {
      // بطيء قرب كل ضربة، سريع بعيداً عنها
      const ramp = 6;
      const d = beatFrames.length ? Math.min(...beatFrames.map((b) => Math.abs(f - b))) : len;
      return interpolate(d, [0, ramp], [slow, fast], {extrapolateRight: 'clamp', easing: ease});
    }
    case 'bullet': // سريع ⇐ بطيء جداً في المنتصف ⇐ سريع
      return interpolate(f, [0, len * 0.35, len * 0.65, len], [fast, slow, slow, fast], {easing: ease});
    case 'flash-in':
      return interpolate(f, [0, 6], [fast, 1], {extrapolateRight: 'clamp', easing: ease});
    case 'flash-out':
      return interpolate(f, [len - 6, len], [1, fast], {extrapolateLeft: 'clamp', easing: ease});
  }
};

/** جدول تراكمي: src[f] = عدد فريمات المصدر المستهلكة حتى الفريم f */
export const buildRemap = (len: number, speed: (f: number) => number) => {
  const src = new Float64Array(len + 1);
  for (let i = 0; i < len; i++) src[i + 1] = src[i] + speed(i);
  return src;
};
