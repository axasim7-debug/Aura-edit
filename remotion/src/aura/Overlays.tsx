// src/aura/Overlays.tsx
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.1}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 1000} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
  <AbsoluteFill
    style={{background: `radial-gradient(ellipse at 50% 42%, transparent 45%, rgba(0,0,0,${strength}) 100%)`}}
  />
);

/** أشرطة سينمائية تنفتح عند openAt (فريم) */
export const Letterbox: React.FC<{openAt: number; bar?: number}> = ({openAt, bar = 0.22}) => {
  const frame = useCurrentFrame();
  const h = interpolate(frame, [openAt - 1, openAt + 8], [bar, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (h <= 0) return null;
  const bs: React.CSSProperties = {position: 'absolute', left: 0, right: 0, height: `${h * 100}%`, background: 'black'};
  return (
    <AbsoluteFill>
      <div style={{...bs, top: 0}} />
      <div style={{...bs, bottom: 0}} />
    </AbsoluteFill>
  );
};
