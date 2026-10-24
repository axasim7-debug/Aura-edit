# 05 — مكتبة المؤثرات (Effects Library)

> لكل مؤثر: **ما هو ⇐ متى ⇐ القيم ⇐ CapCut ⇐ After Effects ⇐ Remotion** (كود Remotion الكامل في [10-remotion.md](10-remotion.md)).
> القيم بالفريمات مفترضة على **30fps** (ضاعفها لـ 60fps).

---
## 1. Velocity (منحنى السرعة / Speed ramp)
- **ما هو**: تغيير سرعة اللقطة داخلها — سريع بين الضربات، بطيء عند اللحظة.
- **متى**: أساس الأورا؛ خصوصاً لقطات الحركة (التفاتة، مشي، ضربة).
- **القيم**: سريع 2.5–5x، بطيء 0.15–0.4x، انتقال 3–6 فريمات، ease in/out.
- **CapCut**: Speed ⇐ Curve ⇐ (Hero / Bullet / Montage / Flash in / Flash out) أو Custom ⇐ اسحب النقاط. أو Style ⇐ Velocity presets (Flash, Blur Shake, Fade Blur, Retro Zoom, Rainbow) — **تلغي أي velocity سابق**.
- **AE**: Time Remapping + Graph editor (speed graph) + Twixtor للنعومة + Pixel Motion Blur / RSMB.
- **Remotion**: time remapping بجمع السرعة التراكمي (`remapSpeed`) أو `<Freeze>` على فريم محسوب (انظر 10).

## 2. Shake (اهتزاز الكاميرا)
- **أنواعه**:
  - **Impact shake**: ضربة واحدة قوية تتلاشى (decay) — الأكثر شيوعاً.
  - **Twitch shake**: قفزات عشوائية حادة 1–2 فريم مع blur/RGB.
  - **Rhythmic shake**: اهتزاز مستمر يتبع البيس (wiggle).
  - **Rotation shake**: دوران ±1–4 درجة.
- **القيم (impact)**: إزاحة 15–40px (على 1080 عرض)، دوران 0.5–3°، تلاشي خلال 6–12 فريم، تردد ~ 12–20Hz. مع **zoom 1.05–1.1** لتجنب ظهور الحواف.
- **متى**: L3/L4 فقط (downbeats والدروب).
- **CapCut**: Effects ⇐ Video effects ⇐ Basic ⇐ Shake / "Shake 2" / Camera shake؛ أو keyframes يدوية للموضع؛ أو preset XML من Alight Motion.
- **AE**: S_Shake (Sapphire)، أو Transform + wiggle expression:
  ```js
  // AE expression على Position — impact shake يتلاشى
  freq = 18; amp = 30; decay = 6;
  t = time - inPoint;
  value + [wiggle(freq, amp*Math.exp(-decay*t))[0]-value[0], wiggle(freq, amp*Math.exp(-decay*t))[1]-value[1]];
  ```
- **Remotion**: `noise2D` من `@remotion/noise` × غلاف تلاشي `exp(-k·t)` بعد كل ضربة.

## 3. Flash
- **أنواعه**:
  - **White flash**: طبقة بيضاء opacity 1⇐0 خلال 2–5 فريمات.
  - **Exposure flash**: رفع brightness/exposure للصورة نفسها (أجمل من الأبيض المسطح).
  - **Negative/Invert flash**: انعكاس الألوان 1–2 فريم (عدواني، شائع في الفونك).
  - **Color flash**: أحمر/أزرق بـ blend mode (screen/overlay).
  - **Black flash/Dip**: إطار أسود 1–2 فريم قبل الضربة (يجعل الضربة أقوى).
  - **Strobe/Flicker**: تبديل سريع on/off على hat rolls.
- **القيم**: 2–4 فريمات للعادي، 6–8 فريمات للدروب؛ opacity بداية 0.7–1.0.
- **CapCut**: Effects ⇐ Lens/Light ⇐ Flash، أو طبقة overlay بيضاء + blend mode + fade، أو Adjust ⇐ Brightness keyframes.
- **AE**: Solid أبيض + opacity keyframes، أو Exposure effect، أو Invert.
- **Remotion**: `AbsoluteFill` بيضاء مع `interpolate`، أو CSS `filter: brightness()` / `invert()`.

## 4. Zoom
- **Zoom punch (in)**: scale 1.0⇐1.15–1.3 فوراً على الضربة ثم يعود عبر spring (8–12 فريم). أو العكس: يبدأ مكبراً 1.25 ويرتد لـ 1.0 (**الأشهر للدروب**).
- **Crash zoom**: زوم سريع جداً للداخل مع motion blur (للتحولات).
- **Creeping zoom**: 1.0⇐1.08 بطيء طوال الـ Build (توتر).
- **Zoom transition**: zoom in على نهاية لقطة + zoom out من بداية التالية + blur ⇐ انتقال سلس.
- **Remotion**: `spring()` بـ `damping` 10–15، `stiffness` 150–250، `mass` 0.5.

## 5. Motion Blur
- **ضروري** لكل حركة سريعة (zoom/shake/velocity/pan) — بدونه تبدو الإيديت "رخيصة".
- **CapCut**: Effects ⇐ "Motion blur" أو Adjust ⇐ Motion blur (desktop).
- **AE**: RSMB (ReelSmart Motion Blur) / Pixel Motion Blur / CC Force Motion Blur / تفعيل motion blur للطبقة.
- **Remotion**: `<CameraMotionBlur shutterAngle={180} samples={8-10}>` من `@remotion/motion-blur` (مكلف في الرندر)، أو directional blur تقريبي بـ SVG `feGaussianBlur` باتجاه واحد (stdDeviation="x 0").

## 6. Glow / Bloom / Deep Glow
- **ما هو**: توهج حول المناطق المضيئة (العيون، الأضواء، الأسلحة).
- **القيم**: threshold عالٍ (فقط الإضاءات)، radius 20–80px، intensity 0.3–0.8. **Glow نابض على الضربات** (يرتفع ثم يهدأ).
- **CapCut**: Effects ⇐ "Glow" / "Soft glow" / "Lightning".
- **AE**: Deep Glow (plugin شهير)، أو Glow الافتراضي، أو S_Glow.
- **Remotion**: طبقة مكررة مع `filter: brightness(1.5) contrast(2) blur(20px)` و `mix-blend-mode: screen` (مكلف: decode مزدوج ⇐ الأفضل تمرير لنفس الفيديو عبر SVG filter أو تطبيقه مسبقاً).

## 7. RGB Split / Chromatic Aberration
- **ما هو**: فصل قنوات الأحمر/الأخضر/الأزرق بإزاحة صغيرة.
- **القيم**: إزاحة 4–20px، 2–6 فريمات على snare، أو ثابتة 2–3px كـ "texture".
- **CapCut**: Effects ⇐ "RGB split" / "Chromatic" / "Glitch".
- **AE**: Channel Shift / Shift Channels + Transform، أو plugins (Quick Chromatic Aberration – مجاني).
- **Remotion**: SVG filter: `feColorMatrix` (عزل كل قناة) + `feOffset` + `feBlend mode="screen"`.

## 8. Twitch
- **ما هو**: تشكيلة سريعة جداً 2–4 فريمات: (shake عشوائي + RGB split + scale jump + blur + exposure) معاً.
- **متى**: hat rolls، الانتقالات العدوانية، الأنمي.
- **AE**: plugin "Twitch" (Video Copilot) أو يدوي بـ expressions.
- **Remotion**: `random(seed+frame)` يحدد إزاحة/scale/RGB لكل فريم داخل نافذة الضربة.

## 9. Stutter / Frame repeat / Freeze
- **Stutter**: كرر مقطع 2–4 فريمات مرتين-ثلاث (مثل الخدش scratch) على hat rolls.
- **Freeze frame**: تجميد على اللحظة (الابتسامة/النظرة) 0.3–1.5 ثانية — غالباً مع: zoom بطيء + B&W أو desaturate + نص + vignette.
- **Reverse**: لقطة تعود للخلف ثم تتقدم (rewind) — CapCut يدعمها؛ في Remotion: عكس مسبق بـ FFmpeg (`-vf reverse`) لأن `playbackRate` السالب غير مدعوم.

## 10. Flicker / Strobe
- تذبذب الإضاءة (brightness 0.6–1.2) عشوائي أو على الإيقاع.
- **⚠️ تحذير**: الوميض السريع جداً (>3 مرات/ثانية لمساحات كبيرة) قد يؤذي المصابين بالصرع الضوئي. استخدمه بقدر.

## 11. Grain / Noise / VHS / Film
- **Grain**: حبيبات خفيفة (opacity 0.05–0.15) — تخفي عيوب الضغط وتعطي سينمائية.
- **VHS**: scanlines، تشوه أفقي، تشبع ألوان، timecode — للإيديتات "النوستالجية".
- **Film burns / light leaks / dust**: overlays بـ blend mode screen.
- **Remotion**: SVG `feTurbulence` مع `seed={frame}`، أو فيديو overlay grain حقيقي بـ `mix-blend-mode: overlay`.

## 12. Vignette
- تعتيم الأطراف — يوجه العين للوسط. ثابت خفيف (0.3–0.5)، ويشتد في الـ Build/Freeze.
- **Remotion**: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)`.

## 13. Letterbox
- أشرطة سوداء سينمائية؛ يمكن أن "تنفتح" عند الدروب (من 2.39:1 إلى ملء الشاشة) خلال 6–10 فريمات.

## 14. Light rays / Lens flare / Lightning / Aura energy
- **Light rays**: أشعة من مصدر ضوء (CC Light Rays / Optical Flares / Saber).
- **Aura energy**: هالة متوهجة حول الشخص (للأنمي): ماسك للشخص ⇐ edge glow + displacement متحرك + لون (أزرق/بنفسجي/أحمر).
- **Lightning / Electricity**: overlays برق على الضربات.
- **Eye glow**: تتبع العين + نقطة توهج + خط ضوئي (light trail) عند حركة الرأس — **علامة مميزة للأورا**.

## 15. Color transitions (انظر 06)
- **B&W ⇐ Color على الدروب** (الأقوى والأبسط).
- **Selective color**: كل شيء B&W إلا الأحمر.
- **Invert على الضربة**.

## 16. Transitions (الانتقالات)
في الأورا **القطع الحاد هو الافتراضي**. الانتقالات المستخدمة:
| الانتقال | المدة | متى |
|------|------|------|
| Hard cut | 0 | 90% من القطعات |
| Flash cut | 2–4f | على الضربات القوية |
| Zoom in/out blur | 4–8f | بين لقطتين متشابهتين في الحركة |
| Whip pan | 4–6f | الدروب، تغيير مكان |
| Spin / rotate | 6–8f | أنمي، هايب |
| Black dip | 1–3f | قبل الدروب |
| Shake transition | 4–8f | ضربة قوية |
| Glitch | 3–6f | sci-fi، twitch |
| Match cut | 0 | شكل/حركة متطابقة بين لقطتين — **احترافي جداً** |
| Mask/wipe through object | 6–12f | عبور جسم أمام الكاميرا |

## 17. 3D Camera / Parallax / Tracking
- **Parallax 3D** من صورة ثابتة (فصل foreground/background + حركة كاميرا) — للقطات المجمدة.
- **Camera tracking**: نص أو مؤثر يلتصق بمكان في المشهد.
- **Face/eye tracking**: لربط glow أو نص بحركة الوجه (MediaPipe مسبقاً ⇐ JSON ⇐ Remotion).

## 18. Text behind subject (النص خلف الشخص)
- النص الكبير يظهر **خلف** الشخصية ⇐ يحتاج ماسك (rotoscoping): CapCut "Remove background"/Auto cutout، AE Roto Brush، أو SAM2 مسبقاً (انظر 07 و 11).

---
## خريطة سريعة: الضربة ⇐ المؤثر
| الضربة | الحزمة الافتراضية |
|------|------|
| L4 Drop | cut + white/exposure flash 6f + zoom 1.25⇐1.0 + impact shake 12f + B&W⇐color + text-in |
| L3 Downbeat | cut + zoom punch 1.12 + shake 8f + motion blur |
| L2 Snare | cut أو flash 3f أو RGB split 4f |
| L1 Cowbell/hat | velocity bump أو flicker أو stutter أو scale 1.03 |
| L0 Gap | freeze + desaturate + mute + vignette ↑ |
