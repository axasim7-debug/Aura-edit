// src/aura/RgbSplit.tsx
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Beat} from './types';
import {lastBeat, pulse} from './beat-utils';

export const RgbSplit: React.FC<{beats: Beat[]; id: string; base?: number; children: React.ReactNode}> = ({
  beats, id, base = 2, children,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lb = lastBeat(frame, fps, beats, 2);
  const d = base + (lb ? 18 * pulse(lb.age, 5) : 0);
  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx={d} dy={0} result="r2" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
          <feOffset in="b" dx={-d} dy={0} result="b2" />
          <feBlend in="r2" in2="g" mode="screen" result="rg" />
          <feBlend in="rg" in2="b2" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: d > 0.5 ? `url(#${id})` : undefined}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
