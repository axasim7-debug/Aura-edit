// src/aura/Shake.tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {Beat} from './types';
import {envelope} from './beat-utils';

export const Shake: React.FC<{beats: Beat[]; amp?: number; rot?: number; children: React.ReactNode}> = ({
  beats, amp = 34, rot = 2.2, children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = envelope(frame, fps, beats, {
    minLevel: 3, decay: 10, weight: (l) => (l === 4 ? 1.4 : 0.8),
  });
  const speed = 0.45; // تردد الاهتزاز
  const x = noise2D('x', frame * speed, 0) * amp * e;
  const y = noise2D('y', frame * speed, 0) * amp * e;
  const r = noise2D('r', frame * speed, 0) * rot * e;
  const s = 1.06 + 0.04 * e; // تكبير لإخفاء الحواف
  return (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`}}>
      {children}
    </AbsoluteFill>
  );
};
