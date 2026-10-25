// src/aura/ZoomPunch.tsx
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Beat} from './types';
import {lastBeat} from './beat-utils';

export const ZoomPunch: React.FC<{beats: Beat[]; children: React.ReactNode; creepUntil?: number; dropPeak?: number; beatPeak?: number}> = ({
  beats, children, creepUntil, dropPeak = 0.25, beatPeak = 0.12,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lb = lastBeat(frame, fps, beats, 3);
  let scale = 1;
  if (lb && lb.age < 30) {
    const peak = lb.beat.level === 4 ? dropPeak : beatPeak;
    // يبدأ مكبراً ويرتد إلى 1 بزنبرك
    const s = spring({frame: lb.age, fps, config: {damping: 13, stiffness: 220, mass: 0.6}});
    scale = 1 + peak * (1 - s);
  }
  // زوم زاحف أثناء البناء (قبل الدروب)
  if (creepUntil !== undefined && frame < creepUntil) {
    scale *= interpolate(frame, [0, creepUntil], [1, 1.08]);
  }
  return <AbsoluteFill style={{transform: `scale(${scale})`}}>{children}</AbsoluteFill>;
};
