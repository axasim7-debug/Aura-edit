# 09 — الأدوات وخطوات العمل (CapCut / After Effects / Alight Motion)

## 1. مقارنة الأدوات
| الأداة | المنصة | القوة | الضعف | الاستخدام |
|------|------|------|------|------|
| **CapCut** | جوال + كمبيوتر + ويب | سريع، velocity curves، presets، Auto beats، remove bg، templates | تحكم محدود، بعض الميزات مدفوعة/إقليمية | **الأكثر شيوعاً** |
| **After Effects** | كمبيوتر | تحكم كامل، plugins (Twixtor، Deep Glow، Sapphire S_Shake، RSMB، Optical Flares، Saber) | منحنى تعلم، مدفوع | المحترفون / أنمي |
| **Alight Motion** | جوال | keyframes متقدمة، presets XML تُشارك (shakes) | واجهة معقدة | محررو الجوال المتقدمون |
| **Premiere Pro / DaVinci** | كمبيوتر | مونتاج + ألوان (DaVinci الأقوى ألواناً ومجاني) | أقل في المؤثرات السريعة | تقطيع + CC |
| **Remotion** | كود (React) | **أتمتة كاملة، قوالب قابلة لإعادة الاستخدام، دقة فريم** | يحتاج برمجة، رندر أبطأ للمؤثرات الثقيلة | هذا المشروع |

## 2. سير العمل في CapCut (خطوة بخطوة)
1. **مشروع جديد** ⇐ أضف الأغنية أولاً. اضبط المشروع 9:16، 1080p، **60fps** إن أمكن.
2. **علّم الضربات**: اضغط على الأغنية ⇐ **Beats** ⇐ Auto generate (ثم صحّح يدوياً) أو أضف beat يدوياً على كل ضربة مهمة (شغّل واضغط).
3. **أضف اللقطات** على المسار الرئيسي، قص كل لقطة لتبدأ/تنتهي على علامة beat.
4. **Velocity**: اختر اللقطة ⇐ Speed ⇐ Curve ⇐ Custom/Hero ⇐ حرك نقطة البطء لتقع على الضربة. فعّل **Smooth slow-mo** إن توفر.
5. **Zoom/Shake**: keyframes للـ scale (1.0 ⇐ 1.2 ⇐ 1.0) على الضربة، أو Effects ⇐ Shake.
6. **Flash**: Effects ⇐ Flash على الضربة (اقصر مدته لـ 2–4 فريمات)، أو overlay أبيض.
7. **Motion blur**: Effects ⇐ Motion blur على اللقطات السريعة.
8. **CC**: أضف **Adjustment layer** على كامل المدة ⇐ Adjust (انظر وصفات 06). فلتر B&W على الـ Build.
9. **Text**: Text ⇐ اختر الخط ⇐ animation in (Pop/Zoom) ⇐ ضعه على الدروب.
10. **SFX**: Audio ⇐ Sound effects (whoosh/impact).
11. **Export**: 1080p، 60fps (أو 30)، bitrate "Higher"/Recommended، بلا watermark.

### Velocity في CapCut — تفصيل
- **Hero**: الأفضل للنظرة. اضبط النقطة المنخفضة على الضربة.
- **Custom**: النقاط الأعلى = أسرع. اصنع: [3x] ⇐ [0.3x عند الضربة] ⇐ [3x].
- Style ⇐ Velocity presets جاهزة (Flash, Blur Shake, Fade Blur, Retro Zoom, Rainbow) — تُلغي التعديل اليدوي.

## 3. سير العمل في After Effects (المحترفون)
1. **Comp** 1080×1920، 60fps (أو 29.97/30).
2. أضف الأغنية ⇐ اضغط **`*`** (numpad) أثناء التشغيل لإضافة **markers** على الضربات (أو سكربت beat marker مثل "Beat Marker" / Sound Keys).
3. أضف اللقطات، **Precompose** كل لقطة.
4. **Time remapping**: Ctrl+Alt+T ⇐ keyframes ⇐ Graph editor (speed graph) ⇐ easy ease متطرف. أو **Twixtor** للسلو موشن الناعم.
5. **Adjustment layer للحركات**: Transform (scale/position) مع expressions shake، أو **S_Shake** (Sapphire)، أو **Twitch** (Video Copilot).
6. **Motion blur**: RSMB أو Pixel Motion Blur على adjustment layer.
7. **Flash**: Solid أبيض بـ opacity keyframes، أو **Exposure** effect.
8. **Glow**: **Deep Glow**.
9. **CC**: Lumetri / Curves / Hue-Sat / Colorama (selective).
10. **Overlays**: grain، light leaks (blend mode Screen/Add).
11. **Render**: Media Encoder ⇐ H.264، VBR 2-pass، 12–20Mbps.

### Expressions مفيدة في AE
```js
// Zoom punch على كل marker (طبقة Adjustment، خاصية Scale)
amp = 20; freq = 3; decay = 7;
n = 0;
if (thisComp.marker.numKeys > 0) {
  n = thisComp.marker.nearestKey(time).index;
  if (thisComp.marker.key(n).time > time) n--;
}
if (n > 0) {
  t = time - thisComp.marker.key(n).time;
  s = 100 + amp * Math.cos(freq * t * 2 * Math.PI) / Math.exp(decay * t);
  [s, s];
} else value;
```
```js
// Flash على كل marker (Opacity لـ solid أبيض)
n = 0;
if (thisComp.marker.numKeys > 0) {
  n = thisComp.marker.nearestKey(time).index;
  if (thisComp.marker.key(n).time > time) n--;
}
if (n > 0) { t = time - thisComp.marker.key(n).time; linear(t, 0, 0.12, 90, 0); } else 0;
```

## 4. Alight Motion
- يستخدمه المحررون لـ **shake presets** جاهزة (تُشارك كروابط/XML)، velocity عبر keyframes ومنحنيات easing، وتأثيرات مثل Shake، Wave warp، Glow، Chromatic.
- سير العمل: نفس منطق CapCut لكن بـ keyframes يدوية أدق.

## 5. أدوات مساعدة
| الغرض | الأداة |
|------|------|
| تنزيل | yt-dlp |
| قص/تحويل/LUT/صوت | FFmpeg |
| استيفاء فريمات | RIFE (rife-ncnn-vulkan)، Flowframes، Topaz Video AI، Twixtor |
| رفع الدقة | Topaz Video AI، Real-ESRGAN، waifu2x/Anime4K (أنمي) |
| فصل الشخص | SAM 2، RobustVideoMatting، CapCut Auto cutout، AE Roto Brush |
| فصل الصوت | Demucs، UVR (Ultimate Vocal Remover) |
| كشف الضربات | librosa، aubio، madmom، Essentia |
| تتبع الوجه | MediaPipe Face Mesh |
| BPM | Tap tempo، librosa |
