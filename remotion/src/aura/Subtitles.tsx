import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS, FontKey} from './fonts';
import {SubtitleLine} from './types';
import {toFrame} from './beat-utils';

// ترجمة بأسلوب Jectro: كلمة-كلمة، UPPERCASE، خط عريض مائل، كلمات مفتاحية ملونة بتوهج.
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Line: React.FC<{line: SubtitleLine; len: number; font: FontKey; size: number; top: string}> = ({line, len, font, size, top}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = line.text.toUpperCase().split(/\s+/).filter(Boolean);
  // توقيت الكلمات: من Whisper إن وُجد، وإلا توزيع متساوٍ على أول 70% من مدة السطر (تقريب لسرعة الكلام)
  const at = (i: number) =>
    line.words?.[i] !== undefined ? toFrame(line.words[i], fps) : Math.round((i / Math.max(words.length, 1)) * len * 0.7);
  const exit = interpolate(f, [len - 4, len - 1], [1, 0], clamp);
  const fam = FONTS[font];

  return (
    <AbsoluteFill style={{top, height: 'auto', alignItems: 'center'}}>
      <div style={{
        width: '86%', textAlign: 'center', lineHeight: 1.15, opacity: exit,
        fontFamily: `'${fam.family}'`, fontWeight: fam.weight, fontStyle: fam.style, fontSize: size,
      }}>
        {words.map((w, i) => {
          const t = f - at(i);
          const p = interpolate(t, [0, 4], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          const key = w.replace(/[^A-Z0-9']/g, '');
          const color = line.colors?.[key] ?? (line.color && i === words.length - 1 ? line.color : undefined);
          const c = color ?? '#ffffff';
          return (
            <span key={i} style={{
              display: 'inline-block', marginRight: '0.28em', color: c, opacity: t < 0 ? 0 : p,
              transform: `translateY(${(1 - p) * 10}px) scale(${0.85 + 0.15 * p})`,
              filter: p < 1 ? `blur(${(1 - p) * 5}px)` : undefined,
              textShadow: color
                ? `0 0 10px ${c}, 0 0 28px ${c}, 0 2px 4px rgba(0,0,0,.9)`
                : '0 0 8px rgba(255,255,255,.45), 0 2px 4px rgba(0,0,0,.9)',
            }}>
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Subtitles: React.FC<{lines: SubtitleLine[]; font?: FontKey; size?: number; top?: string}> = ({
  lines, font = 'montserratXB', size = 50, top = '62%',
}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {lines.map((line, i) => {
        const from = toFrame(line.start, fps);
        const len = toFrame(line.end, fps) - from;
        return len > 0 ? (
          <Sequence key={i} from={from} durationInFrames={len}>
            <Line line={line} len={len} font={font} size={line.size ?? size} top={line.top ?? top} />
          </Sequence>
        ) : null;
      })}
    </>
  );
};

/** علامة القناة بأسلوب Jectro: في المنتصف تحت الوجه، أبيض عريض مائل متوهج */
export const Watermark: React.FC<{text: string; top?: string}> = ({text, top = '73%'}) => (
  <AbsoluteFill style={{top, height: 'auto', alignItems: 'center', pointerEvents: 'none'}}>
    <div style={{
      fontFamily: `'${FONTS.montserratXB.family}'`, fontWeight: 800, fontStyle: 'italic', fontSize: 30,
      letterSpacing: '0.06em', color: 'rgba(255,255,255,.88)',
      textShadow: '0 0 10px rgba(255,255,255,.7), 0 0 22px rgba(255,255,255,.35), 0 1px 3px rgba(0,0,0,.8)',
    }}>
      {text}
    </div>
  </AbsoluteFill>
);

/** الشريط العلوي بأسلوب Menzuration: صندوق أبيض ونص أسود طوال الفيديو */
export const CaptionBar: React.FC<{text: string; top?: number}> = ({text, top = 250}) => (
  <AbsoluteFill style={{alignItems: 'center'}}>
    <div style={{
      position: 'absolute', top, maxWidth: '88%', padding: '14px 26px', borderRadius: 14, background: 'white',
      color: 'black', textAlign: 'center', fontFamily: `'${FONTS.montserratXB.family}'`, fontWeight: 800,
      fontStyle: 'normal', fontSize: 44, lineHeight: 1.2, boxShadow: '0 6px 20px rgba(0,0,0,.35)',
    }}>
      {text}
    </div>
  </AbsoluteFill>
);
