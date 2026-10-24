# 06 — الألوان: CC (Color Correction) والتدريج (Grading)

> في مجتمع الإيديت، **"CC"** يعني تدريج الألوان الكامل للإيديت (وليس فقط تصحيحه). الـ CC الجيد يوحّد لقطات من مصادر مختلفة ويخلق "المزاج".

## 1. مبادئ لون الأورا
1. **ظلال عميقة (Crushed blacks)** — الأسود أسود حقاً.
2. **تباين عالٍ** — فصل واضح بين الضوء والظل.
3. **تشبع محكوم** — إما منخفض (بارد/سينمائي) أو لون واحد مسيطر.
4. **Skin tones** لا تتحول لبرتقالي/رمادي ميت (إلا في B&W).
5. **شحذ خفيف** (sharpen) — يعطي "4K feel"، لا تبالغ (هالات وضجيج).
6. **التوحيد**: كل اللقطات يجب أن تبدو من نفس "العالم".

## 2. ترتيب العمليات
1. **Correction** (تصحيح): exposure، white balance، توحيد اللقطات.
2. **Grade** (التدريج): contrast، curves، HSL، color wheels / LUT.
3. **Effects**: vignette، grain، glow، sharpen.
4. **Dynamic**: تغيّر اللون مع الإيقاع (B&W⇐color على الدروب، flash...).

## 3. وصفات جاهزة (Presets)
> القيم بنظام CapCut (−100..+100) تقريبية — **نقطة بداية فقط**، تختلف حسب المصدر.

### أ) "Cold Aura" (بارد / تيل) — الأكثر استخداماً
| الإعداد | القيمة |
|------|------|
| Contrast | +20 إلى +30 |
| Saturation | −15 إلى −25 |
| Temperature | −10 إلى −20 (بارد) |
| Tint | −5 (أخضر خفيف) |
| Highlights | −20 إلى −35 |
| Shadows | −15 إلى −25 (أعمق) |
| Brightness | −5 إلى −10 |
| Sharpen | +10 إلى +20 |
| Vignette | +15 إلى +30 |
| HSL | Orange: sat −10 ؛ Blue/Aqua: sat +10، luminance −10 |
| Grain | 5–10 |

### ب) "Villain Red"
- B&W كامل إلا **Red** (HSL: كل الألوان sat −100 إلا Red/Magenta)، أو تيل-أحمر.
- Contrast +35، Shadows −30، Highlights −15، Vignette +35، Grain +12.
- Flash أحمر (overlay #ff0000 screen) على الضربات.

### ج) "Noir B&W"
- Saturation −100، Contrast +35–45، Shadows −25، Highlights +5، Sharpen +20، Grain +15، Vignette +30.
- يُستخدم غالباً للـ Build ثم **اللون يعود على الدروب**.

### د) "Golden Hero" (دافئ ملحمي)
- Temperature +15، Contrast +20، Saturation +5، Highlights −15، Shadows −10، Orange sat +10، Glow على الإضاءات.

### هـ) "Night Neon / Literally me" (Drive / Blade Runner)
- Teal & Magenta: Shadows tint ⇐ teal، Highlights tint ⇐ pink/orange.
- Contrast +15، Saturation +10 (فقط Magenta/Blue)، Grain +15، Glow +.

### و) "Teal & Orange" سينمائي
- Shadows ⇐ teal (color wheel نحو 180–200°)، Highlights ⇐ orange (30–40°)، Midtones محايد، Contrast +20.

### ز) "Bleach bypass / Gritty"
- Saturation −40، Contrast +40، Sharpen +25، Highlights −10، Grain +20 — للمقاتلين/الحروب.

## 4. CapCut — أين الإعدادات
- **Adjust** (الجوال) / **Adjustment** (الكمبيوتر): Brightness، Contrast، Saturation، Exposure، Sharpen، Highlights، Shadows، Temperature، Hue، Fade، Vignette، Grain، **HSL**، **Curves**، **Color wheels** (desktop).
- **Filters**: قاعدة سريعة (اخفض intensity لـ 50–70% غالباً أطبع).
- **Adjustment layer** (طبقة تعديل على المسار العلوي): طبّق CC واحد على كل الإيديت — **هكذا يفعل المحترفون للتوحيد**، ثم تصحيح فردي للقطات الشاذة.
- **LUTs**: CapCut desktop يدعم استيراد `.cube`.

## 5. After Effects / Premiere / DaVinci
- **Lumetri Color** (AE/Pr): Basic ⇐ Creative (LUT) ⇐ Curves (S-curve) ⇐ Color Wheels ⇐ HSL Secondary ⇐ Vignette.
- **DaVinci Resolve**: الأقوى للتدريج (nodes، qualifiers، power windows) — مجاني.
- **S-curve**: ارفع الثلث العلوي قليلاً واخفض الثلث السفلي ⇐ تباين جميل بدون قص التفاصيل.
- **Deep Glow + Sharpen + Grain** كطبقات نهائية.

## 6. التدريج في Remotion
ثلاث طرق (من الأسرع للأدق):
1. **CSS filters** (مباشر، سريع، محدود):
   ```css
   filter: contrast(1.25) saturate(0.8) brightness(0.95) hue-rotate(-5deg);
   ```
   B&W: `grayscale(1) contrast(1.35)`. يمكن تحريكها بـ `interpolate` على الدروب.
2. **SVG `feColorMatrix` / `feComponentTransfer`** (أدق: tint للظلال، curves تقريبية، selective color محدود).
3. **LUT مسبق عبر FFmpeg** (الأدق والأسرع في الرندر — **الموصى به للتدريج الأساسي**):
   ```bash
   ffmpeg -i clip.mp4 -vf "lut3d=cold_aura.cube,eq=contrast=1.15:saturation=0.85,unsharp=5:5:0.6" -c:v libx264 -crf 14 clip_graded.mp4
   ```
   ثم Remotion يضيف الطبقة الديناميكية فقط (B&W⇐color، flash، vignette، grain).

### وصفة Cold Aura بـ CSS (تقريب)
```ts
const coldAura = 'contrast(1.25) saturate(0.8) brightness(0.94)';
// + طبقة tint زرقاء فوق الفيديو (CSS filters لا تعطي tint بارد مباشرة):
// <AbsoluteFill style={{background:'#0a3a4a', mixBlendMode:'soft-light', opacity:0.35}}/>
```

### Selective red (Villain) بـ SVG
لا يمكن بدقة بـ CSS؛ الأفضل: LUT مسبق، أو shader WebGL. تقريب: نسخة B&W + نسخة ملونة مقنّعة بماسك اللون الأحمر (يُحسب مسبقاً بـ FFmpeg `colorhold`):
```bash
ffmpeg -i clip.mp4 -vf "colorhold=color=0xB01010:similarity=0.25:blend=0.1" out_red_only.mp4
```

## 7. أخطاء شائعة
- تشبع زائد ⇐ يبدو "رخيصاً".
- قص الأسود بالكامل ⇐ تختفي تفاصيل الوجه/الشعر الداكن.
- Sharpen مبالغ ⇐ هالات بيضاء حول الحواف وتضخيم ضجيج الضغط.
- عدم التوحيد ⇐ لقطة دافئة بجانب لقطة باردة بلا سبب.
- نسيان أن المنصات تضغط الفيديو ⇐ الظلال العميقة جداً تتحول لـ "banding" (أضف grain خفيف لمنعه).
