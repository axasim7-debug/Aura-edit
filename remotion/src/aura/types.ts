// src/aura/types.ts
export type BeatLevel = 0 | 1 | 2 | 3 | 4; // 4=drop, 3=downbeat, 2=snare, 1=hat/cowbell, 0=gap

export type Beat = { t: number; level: BeatLevel }; // t بالثواني (في ملف الأغنية بعد القص)

export type BeatsFile = {
  bpm: number;
  duration: number;   // ثواني
  drop: number;       // ثانية الدروب
  beats: Beat[];
};

export type SegmentText = {
  value: string;
  kind: 'slam' | 'pop' | 'counter' | 'flicker' | 'type'
    | 'letters' | 'rise' | 'typewriter' | 'glitch' | 'neon' | 'wave' | 'scatter';
  behind?: boolean;        // خلف الشخص (يتطلب mask)
  font?: 'bebas' | 'anton' | 'cinzel' | 'montserrat';
  size?: number;
  color?: string;
  top?: string;            // "40%"
  at?: number;             // ظهور بعد بداية المقطع (ثواني)
  dur?: number;            // مدة الظهور (ثواني) — الافتراضي حتى نهاية المقطع
  stroke?: string;         // حد خارجي
  glow?: string;           // لون التوهج
  spacing?: string;        // letter-spacing
  exit?: 'cut' | 'blur' | 'up' | 'flash';
  beat?: boolean;          // ينبض ويهتز مع الضربات
};

/** نص مستقل عن المقاطع (يظهر عبر عدة لقطات) */
export type TimedText = SegmentText & { start: number };

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
  text?: SegmentText;
  transition?: 'cut' | 'flash' | 'zoom' | 'whip' | 'spin' | 'glitch' | 'shake' | 'blackdip'; // الدخول إلى هذا المقطع
  move?: 'none' | 'push-in' | 'pull-out' | 'pan-left' | 'pan-right' | 'drift-up';         // حركة كاميرا هادئة
  moveAmount?: number;     // افتراضي 0.12
  filter?: 'none' | 'bw' | 'muted' | 'cold' | 'warm' | 'red' | 'invert' | 'bleach' | 'vivid' | 'dark';
  focusY?: number;         // إزاحة عمودية للإطار (−0.2..0.2) إن احتاج الوجه
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
  letterbox?: number;      // سماكة الأشرطة قبل الدروب (نسبة من الارتفاع، 0 لإلغائها) — الافتراضي 0.1
  intro?: {
    look?: 'bw' | 'muted' | 'none';   // مظهر ما قبل الدروب (الافتراضي bw)
    fadeIn?: number;                   // ظهور من الأسود (ثواني)
  };
  texts?: TimedText[];
};
