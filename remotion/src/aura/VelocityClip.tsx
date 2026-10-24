// src/aura/VelocityClip.tsx
import React, {useMemo} from 'react';
import {OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {buildRemap, Curve, speedAt} from './velocity';

export const VelocityClip: React.FC<{
  src: string; len: number; srcStartFrame: number; curve: Curve;
  slow: number; fast: number; constant: number; beatFrames: number[]; style?: React.CSSProperties;
  transparent?: boolean; // true لفيديوهات الماسك (alpha)
}> = ({src, len, srcStartFrame, curve, slow, fast, constant, beatFrames, style, transparent}) => {
  const frame = useCurrentFrame(); // محلي داخل الـ Sequence الأب
  const speed = (f: number) => speedAt(f, len, curve, slow, fast, beatFrames, constant);
  const table = useMemo(() => buildRemap(len, speed), [len, curve, slow, fast, constant, beatFrames.join()]);
  const f = Math.min(Math.max(frame, 0), len - 1);
  return (
    <Sequence from={f} layout="none">
      <OffthreadVideo
        src={staticFile(src)}
        muted
        transparent={transparent}
        trimBefore={Math.round(srcStartFrame + table[f])}
        playbackRate={speed(f)}
        style={{width: '100%', height: '100%', objectFit: 'cover', ...style}}
      />
    </Sequence>
  );
};
