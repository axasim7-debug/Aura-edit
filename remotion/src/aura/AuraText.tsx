import React from 'react';
import {AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, FontKey} from './fonts';
import {Beat} from './types';
import {lastBeat} from './beat-utils';

export type TextKind =
  | 'slam' | 'pop' | 'counter' | 'flicker' | 'type'
  | 'letters' | 'rise' | 'typewriter' | 'glitch' | 'neon' | 'wave' | 'scatter';

export type TextExit = 'cut' | 'blur' | 'up' | 'flash';

export type AuraTextProps = {
  value: string;
  kind: TextKind;
  top?: string;
  font?: FontKey;
  size?: number;
  color?: string;
  glow?: string;
  spacing?: string;
  stroke?: string;          // لون الحد الخارجي (مثل CapCut)
  dur?: number;             // بالفريمات — لحساب الخروج
  exit?: TextExit;
  beats?: Beat[];           // نبض/اهتزاز مع الضربات
  absFrom?: number;         // فريم بداية النص على التايملاين (لمطابقة الضربات)
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const AuraText: React.FC<AuraTextProps> = ({
  value, kind, top = '40%', font = 'bebas', size = 150, color = 'white',
  glow = 'rgba(120,180,255,.55)', spacing = '0.08em', stroke, dur, exit = 'cut', beats, absFrom = 0,
}) => {
  const frame = useCurrentFrame(); // 0 = لحظة الظهور
  const {fps} = useVideoConfig();
  const chars = Array.from(value);

  // --- نبض الضربات (scale + اهتزاز صغير) ---
  let beatScale = 1, bx = 0, by = 0, beatGlow = 0;
  if (beats) {
    const lb = lastBeat(absFrom + frame, fps, beats, 2);
    if (lb && lb.age < 10 && frame > 4) {
      const k = Math.exp(-lb.age / 3) * (lb.beat.level >= 3 ? 1 : 0.5);
      beatScale = 1 + 0.1 * k;
      beatGlow = k;
      bx = (random(`bx${absFrom + frame}`) - 0.5) * 14 * k;
      by = (random(`by${absFrom + frame}`) - 0.5) * 14 * k;
    }
  }

  // --- الخروج ---
  let exitOpacity = 1, exitBlur = 0, exitY = 0, exitBright = 1;
  if (dur && exit !== 'cut') {
    const e = interpolate(frame, [dur - 6, dur - 1], [0, 1], clamp);
    if (exit === 'blur') { exitOpacity = 1 - e; exitBlur = 16 * e; }
    if (exit === 'up') { exitOpacity = 1 - e; exitY = -80 * e; }
    if (exit === 'flash') { exitBright = 1 + 3 * e; exitOpacity = 1 - e * e; }
  }

  // --- الحركة الكلية ---
  let scale = 1, opacity = 1, text = value, rgb = 0;
  if (kind === 'slam') {
    scale = interpolate(frame, [0, 5], [2.2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
    opacity = interpolate(frame, [0, 2], [0, 1], clamp);
  } else if (kind === 'pop') {
    scale = 0.6 + 0.4 * spring({frame, fps, config: {damping: 10, stiffness: 200}});
  } else if (kind === 'flicker') {
    opacity = frame < 10 ? (random(`fl-${frame}`) > 0.45 ? 1 : 0) : 1;
  } else if (kind === 'counter') {
    const n = Math.round(interpolate(frame, [0, 18], [0, 1000], clamp));
    text = value.replace('{n}', String(n));
  } else if (kind === 'type') {
    text = value.slice(0, Math.max(0, Math.floor(frame / 2)));
  } else if (kind === 'glitch') {
    rgb = frame < 8 ? 14 * (1 - frame / 8) + 6 * random(`g${frame}`) : beatGlow * 10;
    opacity = frame < 8 && random(`go${frame}`) < 0.25 ? 0.2 : 1;
  } else if (kind === 'neon') {
    opacity = frame < 12 ? (random(`n${frame}`) > 0.35 ? 1 : 0.15) : 1;
  }

  const glowPx = 1 + beatGlow * 1.5;
  const shadow = [
    stroke ? `0 0 2px ${stroke}, 0 0 2px ${stroke}` : '',
    `0 0 ${14 * glowPx}px rgba(255,255,255,.55)`,
    `0 0 ${50 * glowPx}px ${glow}`,
    kind === 'neon' ? `0 0 ${90 * glowPx}px ${glow}` : '',
    '0 4px 0 rgba(0,0,0,.55)',
  ].filter(Boolean).join(', ');

  const base: React.CSSProperties = {
    fontFamily: `'${FONTS[font].family}'`, fontWeight: FONTS[font].weight, fontStyle: FONTS[font].style, fontSize: size, color,
    letterSpacing: spacing, whiteSpace: 'nowrap', textShadow: shadow, display: 'inline-block',
    WebkitTextStroke: stroke ? `2px ${stroke}` : undefined,
  };

  const perLetter = kind === 'letters' || kind === 'rise' || kind === 'typewriter' || kind === 'wave' || kind === 'scatter';

  const content = perLetter ? (
    <div style={{...base, textShadow: undefined}}>
      {chars.map((ch, i) => {
        const t = frame - i * (kind === 'typewriter' ? 2 : 1.5);
        let s = 1, o = 1, y = 0, x = 0, b = 0, r = 0;
        if (kind === 'letters') {
          s = t < 0 ? 0 : spring({frame: t, fps, config: {damping: 9, stiffness: 260}});
          o = t < 0 ? 0 : 1;
        } else if (kind === 'rise') {
          const p = interpolate(t, [0, 7], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          o = p; y = 50 * (1 - p); b = 10 * (1 - p);
        } else if (kind === 'typewriter') {
          o = t < 0 ? 0 : 1;
        } else if (kind === 'wave') {
          const p = interpolate(t, [0, 6], [0, 1], clamp);
          o = p; y = Math.sin((frame + i * 4) / 5) * 10 + 30 * (1 - p);
        } else if (kind === 'scatter') {
          const p = interpolate(t, [0, 9], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.4))});
          x = (random(`sx${i}`) - 0.5) * 900 * (1 - p);
          y = (random(`sy${i}`) - 0.5) * 900 * (1 - p);
          r = (random(`sr${i}`) - 0.5) * 180 * (1 - p);
          o = interpolate(t, [0, 3], [0, 1], clamp);
        }
        return (
          <span key={i} style={{
            display: 'inline-block', opacity: o, textShadow: shadow,
            transform: `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`, filter: b ? `blur(${b}px)` : undefined,
          }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        );
      })}
      {kind === 'typewriter' && (
        <span style={{opacity: Math.floor(frame / 8) % 2 ? 0 : 1, textShadow: shadow}}>|</span>
      )}
    </div>
  ) : (
    <div style={{position: 'relative', ...base}}>
      {rgb > 0.5 && (
        <>
          <span style={{position: 'absolute', left: rgb, top: 0, color: 'rgba(255,0,60,.8)', textShadow: 'none', mixBlendMode: 'screen'}}>{text}</span>
          <span style={{position: 'absolute', left: -rgb, top: 0, color: 'rgba(0,220,255,.8)', textShadow: 'none', mixBlendMode: 'screen'}}>{text}</span>
        </>
      )}
      <span style={{position: 'relative'}}>{text}</span>
    </div>
  );

  return (
    <AbsoluteFill style={{alignItems: 'center', top, height: 'auto'}}>
      <div style={{
        opacity: opacity * exitOpacity,
        transform: `translate(${bx}px, ${by + exitY}px) scale(${scale * beatScale})`,
        filter: [exitBlur ? `blur(${exitBlur}px)` : '', exitBright !== 1 ? `brightness(${exitBright})` : ''].join(' ').trim() || undefined,
      }}>
        {content}
      </div>
    </AbsoluteFill>
  );
};
