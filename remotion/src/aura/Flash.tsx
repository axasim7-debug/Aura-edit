// src/aura/Flash.tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Beat} from './types';
import {lastBeat, pulse} from './beat-utils';

/** طبقة بيضاء فوق كل شيء */
export const WhiteFlash: React.FC<{beats: Beat[]; minLevel?: number; color?: string}> = ({
  beats, minLevel = 3, color = 'white',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lb = lastBeat(frame, fps, beats, minLevel);
  if (!lb) return null;
  const n = lb.beat.level === 4 ? 8 : 4;
  const o = pulse(lb.age, n) * (lb.beat.level === 4 ? 1 : 0.6);
  return o > 0 ? <AbsoluteFill style={{background: color, opacity: o, mixBlendMode: 'screen'}} /> : null;
};

/** قيمة filter للتعريض/الانعكاس — تطبّق على طبقة الفيديو */
export const flashFilter = (frame: number, fps: number, beats: Beat[]) => {
  const lb = lastBeat(frame, fps, beats, 2);
  if (!lb) return '';
  if (lb.beat.level === 2 && lb.age < 2) return 'invert(1)';          // negative flash 2f على snare
  const b = 1 + 1.6 * pulse(lb.age, lb.beat.level >= 3 ? 5 : 3);       // exposure flash
  return b > 1 ? `brightness(${b})` : '';
};
