import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, FontKey} from './fonts';

export type TextKind = 'slam' | 'pop' | 'counter' | 'flicker' | 'type';

export const AuraText: React.FC<{
  value: string;
  kind: TextKind;
  top?: string;
  font?: FontKey;
  size?: number;
  color?: string;
  glow?: string;
  spacing?: string;
}> = ({value, kind, top = '40%', font = 'bebas', size = 150, color = 'white', glow = 'rgba(120,180,255,.55)', spacing = '0.08em'}) => {
  const frame = useCurrentFrame(); // 0 = لحظة الظهور (داخل Sequence)
  const {fps} = useVideoConfig();
  let scale = 1, opacity = 1, text = value;

  if (kind === 'slam') {
    scale = interpolate(frame, [0, 5], [2.2, 1], {extrapolateRight: 'clamp'});
    opacity = interpolate(frame, [0, 2], [0, 1], {extrapolateRight: 'clamp'});
  } else if (kind === 'pop') {
    scale = 0.6 + 0.4 * spring({frame, fps, config: {damping: 10, stiffness: 200}});
  } else if (kind === 'flicker') {
    opacity = frame < 10 ? (random(`fl-${frame}`) > 0.45 ? 1 : 0) : 1;
  } else if (kind === 'counter') {
    // "+{n} AURA": يعد الرقم خلال 18 فريم
    const n = Math.round(interpolate(frame, [0, 18], [0, 1000], {extrapolateRight: 'clamp'}));
    text = value.replace('{n}', String(n));
  } else if (kind === 'type') {
    // حرف كل فريمين
    text = value.slice(0, Math.max(0, Math.floor(frame / 2)));
  }

  return (
    <AbsoluteFill style={{alignItems: 'center', top, height: 'auto'}}>
      <div
        style={{
          fontFamily: `'${FONTS[font].family}'`, fontWeight: FONTS[font].weight, fontSize: size, color,
          letterSpacing: spacing, opacity, transform: `scale(${scale})`, whiteSpace: 'nowrap',
          textShadow: `0 0 18px rgba(255,255,255,.6), 0 0 60px ${glow}, 0 4px 0 rgba(0,0,0,.6)`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
