# 10 — تنفيذ أسلوب الأورا بـ Remotion (كامل)

> **الجواب المختصر: نعم، يمكن تنفيذ الأسلوب 100% بـ Remotion.** القطع الدقيق بالفريم، Velocity، Shake، Flash، Zoom، RGB split، Glow، Grain، Vignette، Letterbox، B&W⇐Color، النصوص المتحركة، النص خلف الشخص، SFX والـ ducking — كلها ممكنة.
> **الاستراتيجية الصحيحة**: المعالجة الثقيلة (كشف الضربات، الاستيفاء، LUT، الفصل، القص العمودي) **مسبقاً** بـ Python/FFmpeg ([11](11-python-pipeline.md))، وRemotion **يركّب ويحرك** فقط ⇐ رندر سريع وثابت.

> ✅ **مُختبر**: كل الكود أدناه نجح في `tsc --strict` ورُندر فعلياً على Remotion **4.0.538** (فيديو 6 ثوانٍ 1080×1920 بلقطات اختبار + `beats.json` من `tools/analyze_audio.py`): B&W + letterbox قبل الدروب ⇐ flash أبيض على فريم الدروب بالضبط ⇐ انفتاح الأشرطة + عودة اللون + عدّاد "+1000 AURA" + RGB split + نص slam.

## 0. الترخيص (مهم)
- Remotion **مجاني** للأفراد، والشركات الربحية حتى **3 موظفين**، والمنظمات غير الربحية.
- الشركات 4+ أشخاص تحتاج **Company License** (حسب الاستخدام). راجع `LICENSE.md` الحالي قبل الاستخدام التجاري — قد يتغير في Remotion 5.0.

## 1. البنية العامة
```
                ┌────────────── Python (11) ──────────────┐
song.mp3 ──► beats.json (bpm, beats[t, level], drop)       │
clips/*  ──► clips مقصوصة 9:16 + مستوفاة 60fps + LUT       │
         ──► masks/*.webm (alpha)                           │
         ──► plan.json (EDL: أي لقطة على أي ضربة + مؤثرات)  │
                └───────────────────────────────────────────┘
                                   │ props
                                   ▼
             Remotion <AuraEdit plan={...} beats={...}/>
                                   │
                   npx remotion render ⇐ out.mp4 (1080×1920)
```

## 2. الإعداد
```bash
npx create-video@latest aura-remotion   # اختر Blank / Hello World (TypeScript)
cd aura-remotion
npx remotion add @remotion/noise @remotion/motion-blur @remotion/google-fonts @remotion/media-utils @remotion/transitions
```
ضع الملفات في `public/` (تُستدعى بـ `staticFile()`):
```
public/
  song.mp3
  clips/*.mp4
  masks/*.webm
  sfx/whoosh.wav, impact.wav
  data/beats.json, plan.json
```

## 3. صيغ البيانات (Types)
```ts
// src/aura/types.ts
export type BeatLevel = 0 | 1 | 2 | 3 | 4; // 4=drop, 3=downbeat, 2=snare, 1=hat/cowbell, 0=gap

export type Beat = { t: number; level: BeatLevel }; // t بالثواني (في ملف الأغنية بعد القص)

export type BeatsFile = {
  bpm: number;
  duration: number;   // ثواني
  drop: number;       // ثانية الدروب
  beats: Beat[];
};

export type Segment = {
  clip: string;            // "clips/bateman_07_smirk.mp4"
  start: number;           // بداية المقطع على التايملاين (ثواني) — عادة = ضربة
  end: number;             // نهايته (ضربة تالية)
  srcStart: number;        // من أين في اللقطة المصدر (ثواني)
  velocity?: 'none' | 'hero' | 'bullet' | 'flash-in' | 'flash-out';
  slow?: number;           // أدنى سرعة (افتراضي 0.3)
  fast?: number;           // أعلى سرعة (افتراضي 3)
  speed?: number;          // سرعة ثابتة إن velocity = none (افتراضي 1)
  mono?: boolean;          // أبيض وأسود
  mask?: string;           // "masks/bateman_07.webm" للنص-خلف-الشخص
  text?: { value: string; kind: 'slam' | 'pop' | 'counter' | 'flicker'; behind?: boolean };
};

export type Plan = {
  fps: number;             // 30 أو 60
  width: number;           // 1080
  height: number;          // 1920
  song: string;            // "song.mp3"
  look: 'cold' | 'villain' | 'noir' | 'golden' | 'neon' | 'none';
  segments: Segment[];
  sfx?: { file: string; t: number; volume?: number }[];
  watermark?: string;
};
```

## 4. أدوات الإيقاع (Envelopes) — قلب النظام
كل مؤثر = **غلاف (envelope)** ينطلق عند ضربة ويتلاشى.
```ts
// src/aura/beat-utils.ts
import {Beat} from './types';

export const toFrame = (t: number, fps: number) => Math.round(t * fps);

/** آخر ضربة (بمستوى ≥ minLevel) حدثت عند أو قبل frame */
export const lastBeat = (frame: number, fps: number, beats: Beat[], minLevel = 0) => {
  let lo = 0, hi = beats.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (toFrame(beats[mid].t, fps) <= frame) { ans = mid; lo = mid + 1; } else hi = mid - 1;
  }
  for (let i = ans; i >= 0; i--) {
    if (beats[i].level >= minLevel) {
      return {beat: beats[i], index: i, age: frame - toFrame(beats[i].t, fps)};
    }
  }
  return null;
};

/** نبضة تتلاشى أُسّياً: 1 عند الضربة ⇐ 0 */
export const impulse = (age: number, decayFrames: number) =>
  age < 0 ? 0 : Math.exp(-age / (decayFrames / 3));

/** نبضة خطية تنتهي تماماً بعد n فريم */
export const pulse = (age: number, n: number) => (age < 0 || age >= n ? 0 : 1 - age / n);

/** مجموع نبضات كل الضربات القريبة (لتراكب الضربات المتتالية) */
export const envelope = (
  frame: number, fps: number, beats: Beat[],
  opts: {minLevel?: number; decay: number; weight?: (lvl: number) => number}
) => {
  const {minLevel = 0, decay, weight = () => 1} = opts;
  let v = 0;
  for (const b of beats) {
    if (b.level < minLevel) continue;
    const age = frame - toFrame(b.t, fps);
    if (age < 0) break;
    if (age > decay * 2) continue;
    v += weight(b.level) * impulse(age, decay);
  }
  return Math.min(v, 1.5);
};
```

## 5. Velocity (منحنى السرعة) — Time remapping
Remotion يقيّم كل فريم مستقلاً، لذا **لا تحرك `playbackRate` مباشرة**. الحل الموثق: **اجمع السرعة لكل الفريمات السابقة** للحصول على موضع المصدر، ثم ابدأ الفيديو من هناك (`trimBefore`) مع `playbackRate` الحالي، داخل `<Sequence from={frame}>`. (لا يعمل حالياً مع `<Video>` من `@remotion/media` — استخدم `<OffthreadVideo>`).

```ts
// src/aura/velocity.ts
import {Easing, interpolate} from 'remotion';

export type Curve = 'none' | 'hero' | 'bullet' | 'flash-in' | 'flash-out';

/** سرعة اللقطة عند الفريم المحلي f (0..len-1). beatFrames محلية داخل المقطع. */
export const speedAt = (
  f: number, len: number, curve: Curve, slow: number, fast: number, beatFrames: number[], constant = 1
) => {
  const ease = Easing.inOut(Easing.cubic);
  switch (curve) {
    case 'none': return constant;
    case 'hero': {
      // بطيء قرب كل ضربة، سريع بعيداً عنها
      const ramp = 6;
      const d = beatFrames.length ? Math.min(...beatFrames.map((b) => Math.abs(f - b))) : len;
      return interpolate(d, [0, ramp], [slow, fast], {extrapolateRight: 'clamp', easing: ease});
    }
    case 'bullet': // سريع ⇐ بطيء جداً في المنتصف ⇐ سريع
      return interpolate(f, [0, len * 0.35, len * 0.65, len], [fast, slow, slow, fast], {easing: ease});
    case 'flash-in':
      return interpolate(f, [0, 6], [fast, 1], {extrapolateRight: 'clamp', easing: ease});
    case 'flash-out':
      return interpolate(f, [len - 6, len], [1, fast], {extrapolateLeft: 'clamp', easing: ease});
  }
};

/** جدول تراكمي: src[f] = عدد فريمات المصدر المستهلكة حتى الفريم f */
export const buildRemap = (len: number, speed: (f: number) => number) => {
  const src = new Float64Array(len + 1);
  for (let i = 0; i < len; i++) src[i + 1] = src[i] + speed(i);
  return src;
};
```
```tsx
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
```
> **ملاحظات**:
> - تأكد أن `srcStartFrame + table[len]` لا يتجاوز طول اللقطة المصدر. إن تجاوز: قلّل `fast` أو ابدأ أبكر.
> - `playbackRate` بين 0.0625 و 16 فقط.
> - للسلو موشن الناعم (0.2–0.3x) استخدم نسخة **مستوفاة 60/120fps** من اللقطة (RIFE، انظر 11)، وإلا ستتقطع.
> - العكس (reverse) غير مدعوم ⇐ اعكس مسبقاً بـ FFmpeg.
> - البديل: `<Freeze frame={...}>` يوقف الفيديو على فريم محسوب (مفيد للتجميد freeze-frame).

## 6. Shake
```tsx
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
```

## 7. Zoom punch
```tsx
// src/aura/ZoomPunch.tsx
import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {Beat} from './types';
import {lastBeat} from './beat-utils';

export const ZoomPunch: React.FC<{beats: Beat[]; children: React.ReactNode; creepUntil?: number}> = ({
  beats, children, creepUntil,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lb = lastBeat(frame, fps, beats, 3);
  let scale = 1;
  if (lb && lb.age < 30) {
    const peak = lb.beat.level === 4 ? 0.25 : 0.12;
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
```

## 8. Flash (أبيض / تعريض / انعكاس)
```tsx
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
```

## 9. RGB split (Chromatic aberration) بـ SVG filter
```tsx
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
```

## 10. Grain + Vignette + Letterbox
```tsx
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
```

## 11. الألوان (Look) + B&W ⇐ Color على الدروب
```ts
// src/aura/looks.ts
export const LOOKS = {
  cold:    {filter: 'contrast(1.25) saturate(0.8) brightness(0.94)', tint: '#0a3a4a', tintOpacity: 0.35},
  villain: {filter: 'contrast(1.35) saturate(0.6) brightness(0.9)',  tint: '#5a0000', tintOpacity: 0.3},
  noir:    {filter: 'grayscale(1) contrast(1.4) brightness(0.95)',  tint: null, tintOpacity: 0},
  golden:  {filter: 'contrast(1.2) saturate(1.05) sepia(0.15)',     tint: '#4a2a00', tintOpacity: 0.25},
  neon:    {filter: 'contrast(1.15) saturate(1.15)',                tint: '#2a0a4a', tintOpacity: 0.3},
  none:    {filter: '', tint: null, tintOpacity: 0},
} as const;
```
> التدريج الأساسي الأدق: **LUT مسبق بـ FFmpeg** (انظر 06/11). الـ filters هنا للطبقة الديناميكية.

## 12. النصوص
```tsx
// src/aura/AuraText.tsx
import React from 'react';
import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/BebasNeue';

// حمّل وزناً ومجموعة واحدة فقط — تحميل كل التنويعات يسبب timeout في الرندر
const {fontFamily} = loadFont('normal', {weights: ['400'], subsets: ['latin']});

export const AuraText: React.FC<{value: string; kind: 'slam' | 'pop' | 'counter' | 'flicker'; top?: string}> = ({
  value, kind, top = '40%',
}) => {
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
    // "+1000 AURA": يعد الرقم خلال 18 فريم
    const n = Math.round(interpolate(frame, [0, 18], [0, 1000], {extrapolateRight: 'clamp'}));
    text = value.replace('{n}', String(n));
  }

  return (
    <AbsoluteFill style={{alignItems: 'center', top, height: 'auto'}}>
      <div
        style={{
          fontFamily, fontSize: 150, color: 'white', letterSpacing: '0.08em', opacity,
          transform: `scale(${scale})`, whiteSpace: 'nowrap',
          textShadow: '0 0 18px rgba(255,255,255,.75), 0 0 60px rgba(120,180,255,.55), 0 4px 0 rgba(0,0,0,.6)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
```
> للعربية: `import {loadFont} from '@remotion/google-fonts/ArefRuqaa'` (أو Lalezar / ReemKufi / Cairo) وأضف `direction: 'rtl'`.

## 13. النص خلف الشخص
```tsx
// داخل المقطع: الخلفية ⇐ النص ⇐ الشخص (ماسك alpha) ⇐ المؤثرات
<AbsoluteFill>
  <VelocityClip {...clipProps} />
  <AuraText value="BATEMAN" kind="slam" top="30%" />
  <VelocityClip {...clipProps} src={seg.mask!} transparent /* فيديو alpha للشخص فقط */ />
</AbsoluteFill>
```
- الماسك يجب أن يكون **فيديو بقناة alpha** (WebM VP9 مع alpha، أو ProRes 4444)، بنفس التوقيت تماماً مثل اللقطة، ويُعامل بنفس الـ velocity (نفس props) ⇐ يبقى متطابقاً.
- `transparent` على `<OffthreadVideo>` يقرأ الـ alpha (أبطأ لأنه يستخرج PNG) — لذلك يُمرَّر فقط لفيديو الماسك.

## 14. التجميع: `AuraEdit`
```tsx
// src/aura/AuraEdit.tsx
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {BeatsFile, Plan} from './types';
import {toFrame} from './beat-utils';
import {VelocityClip} from './VelocityClip';
import {Shake} from './Shake';
import {ZoomPunch} from './ZoomPunch';
import {WhiteFlash, flashFilter} from './Flash';
import {RgbSplit} from './RgbSplit';
import {Grain, Vignette, Letterbox} from './Overlays';
import {AuraText} from './AuraText';
import {LOOKS} from './looks';

export const AuraEdit: React.FC<{plan: Plan; beats: BeatsFile}> = ({plan, beats}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dropF = toFrame(beats.drop, fps);
  const look = LOOKS[plan.look];
  const preDrop = frame < dropF;

  // قبل الدروب: أبيض وأسود + مظلم. بعده: الـ look الكامل.
  const dyn = preDrop ? 'grayscale(1) contrast(1.3) brightness(0.85)' : look.filter;
  const videoFilter = `${dyn} ${flashFilter(frame, fps, beats.beats)}`.trim();

  return (
    <AbsoluteFill style={{background: 'black'}}>
      <Shake beats={beats.beats}>
        <ZoomPunch beats={beats.beats} creepUntil={dropF}>
          <RgbSplit beats={beats.beats} id="rgb">
            <AbsoluteFill style={{filter: videoFilter}}>
              {plan.segments.map((seg, i) => {
                const from = toFrame(seg.start, fps);
                const len = toFrame(seg.end, fps) - from;
                if (len <= 0) return null; // Sequence يرفض مدة ≤ 0
                const beatFrames = beats.beats
                  .filter((b) => b.t >= seg.start && b.t < seg.end && b.level >= 2)
                  .map((b) => toFrame(b.t, fps) - from);
                const clipProps = {
                  src: seg.clip, len, srcStartFrame: toFrame(seg.srcStart, fps),
                  curve: seg.velocity ?? 'none', slow: seg.slow ?? 0.3, fast: seg.fast ?? 3,
                  constant: seg.speed ?? 1, beatFrames,
                };
                return (
                  <Sequence key={i} from={from} durationInFrames={len}>
                    <VelocityClip {...clipProps} style={seg.mono ? {filter: 'grayscale(1)'} : undefined} />
                    {seg.text?.behind && seg.mask && (
                      <>
                        <AuraText value={seg.text.value} kind={seg.text.kind} top="28%" />
                        <VelocityClip {...clipProps} src={seg.mask} transparent />
                      </>
                    )}
                  </Sequence>
                );
              })}
            </AbsoluteFill>
            {look.tint && !preDrop && (
              <AbsoluteFill style={{background: look.tint, mixBlendMode: 'soft-light', opacity: look.tintOpacity}} />
            )}
          </RgbSplit>
        </ZoomPunch>
      </Shake>

      {/* النصوص غير المحجوبة — فوق الاهتزاز أو داخله حسب الذوق */}
      {plan.segments.map((seg, i) =>
        seg.text && !seg.text.behind && toFrame(seg.end - seg.start, fps) > 0 ? (
          <Sequence key={`t${i}`} from={toFrame(seg.start, fps)} durationInFrames={toFrame(seg.end - seg.start, fps)}>
            <AuraText value={seg.text.value} kind={seg.text.kind} />
          </Sequence>
        ) : null
      )}

      <Letterbox openAt={dropF} />
      <Vignette strength={preDrop ? 0.8 : 0.55} />
      <Grain opacity={0.09} />
      <WhiteFlash beats={beats.beats} minLevel={4} />

      <Audio src={staticFile(plan.song)} />
      {plan.sfx?.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, toFrame(s.t, fps))}>
          <Audio src={staticFile(s.file)} volume={s.volume ?? 0.5} />
        </Sequence>
      ))}

      {plan.watermark && (
        <div style={{position: 'absolute', top: 120, left: 60, color: 'white', opacity: 0.5, fontSize: 34}}>
          {plan.watermark}
        </div>
      )}
    </AbsoluteFill>
  );
};
```
> إن كان إصدار Remotion الحديث يعلّم `<Audio>` كـ deprecated، استخدم `Html5Audio` أو `<Audio>` من `@remotion/media`.

## 15. تسجيل الـ Composition (المدة من البيانات)
```tsx
// src/Root.tsx
import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {AuraEdit} from './aura/AuraEdit';
import {BeatsFile, Plan} from './aura/types';

type Props = {plan: Plan; beats: BeatsFile};

// يقرأ public/data/plan.json و beats.json إن لم تُمرَّر عبر --props، ويضبط المدة منهما
const calculateMetadata: CalculateMetadataFunction<Props> = async ({props}) => {
  const plan: Plan = props.plan ?? (await (await fetch(staticFile('data/plan.json'))).json());
  const beats: BeatsFile = props.beats ?? (await (await fetch(staticFile('data/beats.json'))).json());
  return {
    props: {plan, beats},
    fps: plan.fps,
    width: plan.width,
    height: plan.height,
    durationInFrames: Math.ceil(beats.duration * plan.fps),
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="AuraEdit"
    component={AuraEdit}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={300}
    defaultProps={{plan: null as unknown as Plan, beats: null as unknown as BeatsFile}}
    calculateMetadata={calculateMetadata}
  />
);
```

## 16. الرندر
```bash
# معاينة
npx remotion studio

# رندر نهائي (H.264 بجودة عالية)
npx remotion render AuraEdit out/edit.mp4 --codec=h264 --crf=16 --audio-bitrate=320k

# بخطة مختلفة
npx remotion render AuraEdit out/gojo.mp4 --props=./public/data/gojo-props.json
```
- `--crf` أقل = جودة أعلى (14–18 ممتاز للرفع؛ المنصة ستعيد الضغط).
- `--concurrency` لزيادة سرعة الرندر حسب الأنوية.
- لـ 60fps: `plan.fps = 60` (الرندر أبطأ ×2، والسلو موشن يحتاج مصدر 120fps لنفس النعومة).
- بعد الرندر: `loudnorm` للصوت (انظر 08) إن لزم.

## 17. Motion blur (اختياري — مكلف)
```tsx
import {CameraMotionBlur} from '@remotion/motion-blur';
<CameraMotionBlur shutterAngle={180} samples={8}>
  <Shake beats={beats.beats}>...</Shake>
</CameraMotionBlur>
```
- يرندر عدة نسخ لكل فريم ⇐ أبطأ بـ ×samples. قد يغيّر الألوان/الشفافية قليلاً.
- بديل أرخص: طبّق motion blur مسبقاً على اللقطات السريعة بـ FFmpeg (`tmix`) أو اعتمد على الـ shake المعتدل. `<HtmlInCanvasMotionBlur>` هو الخيار الأحدث الموصى به في الوثائق (يحتاج تفعيل HTML-in-canvas في Chrome للمعاينة).

## 18. الانتقالات (عند الحاجة)
القطع الحاد افتراضي. للانتقالات استخدم `@remotion/transitions`:
```tsx
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={40}><ClipA/></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: 5})} />
  <TransitionSeries.Sequence durationInFrames={40}><ClipB/></TransitionSeries.Sequence>
</TransitionSeries>
```
- **Zoom-blur transition**: نهاية A: scale 1⇐1.6 + blur 0⇐12px خلال 4f؛ بداية B: scale 1.6⇐1 + blur 12⇐0 خلال 4f + whoosh.
- **Whip pan**: translateX + directional blur (`feGaussianBlur stdDeviation="40 0"`).

## 19. أداء الرندر — نصائح
- اقصص اللقطات مسبقاً لتقارب ما يُستخدم فعلاً (ملفات صغيرة ⇐ decode أسرع).
- اجعل اللقطات بنفس fps الـ composition (أو 2×) و H.264 بـ keyframes متقاربة (`-g 30`) لسرعة الـ seeking.
- LUT/sharpen/upscale **مسبقاً** وليس بـ CSS ثقيل.
- `transparent` فقط لفيديوهات الماسك.
- كل `filter: url(#svg)` على طبقة فيديو كاملة يكلّف — فعّله فقط في نوافذ الضربات (كما في `RgbSplit` حين d≈0).

## 20. خارطة الأتمتة الكاملة (المرحلة التالية)
1. `analyze_audio.py song.mp3` ⇐ `beats.json` (11).
2. `prepare_clips.py` ⇐ قص 9:16 حول الوجه، LUT، 60/120fps، masks.
3. `make_plan.py` ⇐ يختار لقطة لكل جزء حسب `meta.json` (role/energy/tags) والضربات: أقوى لقطة `role=drop` على `beats.drop`، لقطات build قبلها، لقطات peak بطاقة متصاعدة، وإن لم يجد: استخدام نفس اللقطة بسرعات مختلفة.
4. `npx remotion render` ⇐ `out.mp4`.
5. (اختياري) نماذج متعددة: نفس الخطة بـ looks مختلفة / أغانٍ مختلفة لاختبار A/B.

> Remotion يوفّر أيضاً "Remotion Skills" لوكلاء الذكاء الاصطناعي — مفيدة لتوليد مكونات جديدة بسرعة.
