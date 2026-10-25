import {Easing, interpolate, random} from 'remotion';

// انتقال "داخل" المقطع = في أول n فريم منه، و"خارج" = في آخر n فريم من المقطع السابق.
// القطع بينهما يبقى حاداً، لكن الحركة المتطابقة على الطرفين تجعله يبدو انتقالاً واحداً (كما في CapCut).
export type TransitionType = 'cut' | 'flash' | 'zoom' | 'whip' | 'spin' | 'glitch' | 'shake' | 'blackdip';

export type FxStyle = {transform: string; filter: string; opacity: number; blurX: number};

const NONE: FxStyle = {transform: '', filter: '', opacity: 1, blurX: 0};

export const TRANSITION_FRAMES: Record<TransitionType, number> = {
  cut: 0, flash: 5, zoom: 5, whip: 5, spin: 7, glitch: 5, shake: 8, blackdip: 4,
};

const easeOut = Easing.out(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);

/** f = الفريم المحلي داخل المقطع، len = طول المقطع، seed لتنويع العشوائية */
export const transitionFx = (
  f: number, len: number, inType: TransitionType, outType: TransitionType, seed: string,
): FxStyle => {
  const nIn = Math.min(TRANSITION_FRAMES[inType], Math.floor(len / 2));
  const nOut = Math.min(TRANSITION_FRAMES[outType], Math.floor(len / 2));

  if (nIn > 0 && f < nIn) {
    const p = interpolate(f, [0, nIn], [0, 1], {extrapolateRight: 'clamp', easing: easeOut}); // 0 ⇐ 1
    const q = 1 - p;
    switch (inType) {
      case 'flash': return {...NONE, filter: `brightness(${1 + 2.5 * q})`};
      case 'blackdip': return {...NONE, filter: `brightness(${p})`};
      case 'zoom': return {...NONE, transform: `scale(${1 + 0.6 * q})`, filter: `blur(${14 * q}px)`};
      case 'whip': return {...NONE, transform: `scale(${1 + 0.5 * q}) translateX(${(25 * q) / (1 + 0.5 * q)}%)`, blurX: 70 * q};
      case 'spin': return {...NONE, transform: `rotate(${-80 * q}deg) scale(${1 + 0.5 * q})`, filter: `blur(${10 * q}px)`};
      case 'shake': {
        const a = 60 * q;
        return {...NONE, transform: `translate(${(random(`${seed}x${f}`) - 0.5) * a}px, ${(random(`${seed}y${f}`) - 0.5) * a}px) scale(${1.05 + 0.08 * q})`};
      }
      case 'glitch': return glitch(f, seed, q);
    }
  }
  if (nOut > 0 && f >= len - nOut) {
    const p = interpolate(f, [len - nOut, len - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn}); // 0 ⇐ 1
    switch (outType) {
      case 'flash': return {...NONE, filter: `brightness(${1 + 1.5 * p})`};
      case 'blackdip': return {...NONE, filter: `brightness(${1 - p})`};
      case 'zoom': return {...NONE, transform: `scale(${1 + 0.6 * p})`, filter: `blur(${14 * p}px)`};
      case 'whip': return {...NONE, transform: `scale(${1 + 0.5 * p}) translateX(${(-25 * p) / (1 + 0.5 * p)}%)`, blurX: 70 * p};
      case 'spin': return {...NONE, transform: `rotate(${80 * p}deg) scale(${1 + 0.5 * p})`, filter: `blur(${10 * p}px)`};
      case 'glitch': return glitch(f, seed + 'o', p);
      default: return NONE;
    }
  }
  return NONE;
};

const glitch = (f: number, seed: string, k: number): FxStyle => {
  const r = (s: string) => random(`${seed}${s}${f}`) - 0.5;
  return {
    ...NONE,
    transform: `translate(${r('x') * 120 * k}px, ${r('y') * 30 * k}px) skewX(${r('s') * 14 * k}deg) scale(${1.12 + 0.08 * k})`,
    filter: `hue-rotate(${r('h') * 30 * k}deg) contrast(${1 + 0.35 * k}) saturate(${1 + 0.25 * k})`,
  };
};

/** حركة الكاميرا داخل المقطع (Ken Burns) — للقطات التمهيد الهادئة */
export type Move = 'none' | 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'drift-up';

export const moveTransform = (f: number, len: number, move: Move, amount = 0.12) => {
  const p = len > 1 ? f / (len - 1) : 0;
  switch (move) {
    case 'push-in': return `scale(${1 + amount * p})`;
    case 'pull-out': return `scale(${1 + amount * (1 - p)})`;
    case 'pan-left': return `scale(${1 + amount}) translateX(${(amount / 2) * 100 * (1 - 2 * p)}%)`;
    case 'pan-right': return `scale(${1 + amount}) translateX(${(amount / 2) * 100 * (2 * p - 1)}%)`;
    case 'drift-up': return `scale(${1 + amount}) translateY(${(amount / 2) * 100 * (1 - 2 * p)}%)`;
    default: return '';
  }
};

/** فلاتر لكل لقطة (تُضاف فوق الـ look العام) */
export const SEGMENT_FILTERS: Record<string, string> = {
  none: '',
  bw: 'grayscale(1) contrast(1.3)',
  muted: 'saturate(0.45) contrast(1.1) brightness(0.92)',
  cold: 'saturate(0.75) contrast(1.2) hue-rotate(-12deg)',
  warm: 'sepia(0.25) saturate(1.2) contrast(1.15)',
  red: 'sepia(0.6) saturate(4) hue-rotate(-35deg) contrast(1.3)',
  invert: 'invert(1)',
  bleach: 'saturate(0.35) contrast(1.5) brightness(1.05)',
  vivid: 'saturate(1.45) contrast(1.2)',
  dark: 'brightness(0.7) contrast(1.35)',
  lift: 'brightness(1.4) contrast(1.05) saturate(1.1)',
};
