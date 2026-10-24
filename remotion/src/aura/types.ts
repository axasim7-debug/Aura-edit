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
  font?: 'bebas' | 'anton' | 'cinzel' | 'montserrat' | 'montserratXB' | 'poppinsXB';
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
  dialogue?: number;       // تشغيل صوت اللقطة (الحوار) بهذا المستوى 0..1 — يتطلب سرعة 1 ولقطة بصوت
};

/** سطر ترجمة (الأزمنة على التايملاين بالثواني) */
export type SubtitleLine = {
  start: number;
  end: number;
  text: string;
  colors?: Record<string, string>;  // كلمات ملونة: {"MARK": "#ff3b3b"} (بالحروف الكبيرة بلا علامات)
  color?: string;                   // لون آخر كلمة (اختصار)
  words?: number[];                 // بداية كل كلمة (ثوانٍ من بداية السطر) — من Whisper إن توفرت
  size?: number;
  top?: string;
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
  subtitles?: SubtitleLine[];
  subtitleStyle?: { font?: 'montserratXB' | 'poppinsXB' | 'bebas' | 'anton'; size?: number; top?: string };
  caption?: string;        // شريط علوي ثابت (أسلوب Menzuration)
  duck?: number;           // مستوى الأغنية أثناء الحوار (افتراضي 0.3)
  songVolume?: number;     // مستوى الأغنية العام (افتراضي 1)
  voices?: VoiceLine[];
  /** منحنى مستوى الأغنية [[ثانية، مستوى]...] — صعود تدريجي حتى الانفجار بدل الخفض والرفع مع كل جملة */
  songCurve?: [number, number][];    // سطور حوار معزولة (Demucs) توضع بحرية — تخفض الأغنية تلقائياً
};

/** ملف صوت حوار مستقل: يبدأ عند t، والكلام الفعلي بين t+from و t+to (للخفض) */
export type VoiceLine = { file: string; t: number; from?: number; to: number; volume?: number };
