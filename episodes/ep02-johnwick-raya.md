# الحلقة 02 — John Wick × Raya (Slowed) — أسلوب "Story Aura Short"

**الملف النهائي**: `remotion/out/ep02_johnwick_raya.mp4` (1080×1920، 30fps، 25.6s، −12.5 LUFS) — غير مرفوع على git.
**الغلاف**: `remotion/out/ep02_cover.jpg` (وجه ويك القريب + "YEAH.").
**الخطة**: `remotion/public/data/ep02/plan.json` + `beats.json`.

## المصادر
- **المشهد**: John Wick: Chapter 4 — Opening Scene، قناة Apex Clips (https://youtu.be/tjh7Cr7eQqY)، **4K HDR10 (3840×1600، AV1، صوت 5.1)** — نزّله المستخدم عبر خدمة تنزيل لأن يوتيوب يحجب بيئة السحابة.
- **الأغنية**: Raya (Slowed) — Zericxxn، المقطع 30.05s ⇐ 55.6s (الدخول عند 50.57s = أقوى ضربة بعد البناء؛ Most replayed يؤكد منطقة 41–50s).

## المعالجة
1. **HDR ⇐ SDR**: `tonemap=mobius` (أفضل من hable للأفلام المظلمة؛ الوجوه طبيعية) — أُضيف `--hdr` لـ `prepare_clip.py`.
2. **تفريغ المشهد**: `scan_movie.py --threshold 0.1` (المشهد مظلم ومتداخل؛ 0.3 وجد مشهدين فقط) ⇐ 37 لقطة.
3. **الحوار**: Whisper (small.en) بتوقيت الكلمات ⇐ الـ Bowery King يقرأ من "جحيم دانتي":
   "I am the way into the City of Woe" (19.1s)، "Abandon all hope, you who are about to enter here" (49.7s)، "As do I" (45.4s)، "You ready, John?" (83.2s)، "Yeah." (92.27s فعلياً).
4. **عزل الصوت**: القناة المركزية في 5.1 لم تكن نظيفة (فيها موسيقى/ضربات) ⇐ **Demucs htdemucs** لكل سطر ⇐ loudnorm −12 + EQ وضوح 3kHz.
5. **فحص القطعات داخل كل لقطة** (scene detect على كل ملف) ⇐ نقاط بداية آمنة.

## الخط الزمني
| الزمن | اللقطة | الصوت/النص |
|------|------|------|
| 0–3.6 | أفق نيويورك عند الغروب (push-in، fade-in) | "NEW YORK CITY" (typewriter) + "I am the way into the city of **WOE**." |
| 3.6–7.2 | الـ Bowery King يمشي في النفق (blackdip) | "Abandon all **HOPE**, you who are about to enter **HERE**." |
| 7.2–9.7 | القبضة الدامية على الخشبة | — |
| 9.7–12.7 | الملك في القاعة الذهبية (blackdip) | "As do **I**." |
| 12.7–14.5 | ويك يتدرب أمام النار | — |
| 14.5–17.4 | الملك يضحك على ضوء عود ثقاب | "You ready, **JOHN**?" |
| 17.4–20.53 | ويك يلتفت (لقطة متزامنة الشفاه) | **"YEAH."** ينتهي قبل الدروب مباشرة |
| **20.53 DROP** | ويك قريب جداً (flash) | |
| 22.04 | القبضة (whip، bleach) | |
| 22.98 | النار والتدريب (zoom، vivid) | |
| 23.56 | الملك بالأحمر (glitch، red) | |
| 24.49–25.55 | ويك (flash) | **BABA YAGA** (letters، توهج أحمر، ينبض) |

## المراجعة
- v1: لقطة الملك سوداء ⇐ القص كان على اليد/عود الثقاب لا الوجه (focus 0.68 ⇐ 0.55) + رفع gamma 1.35.
- v2: Whisper على الملف النهائي لم يلتقط "You ready, John?" و"Yeah." ⇐ الأغنية تغطيهما (هامش −2 dB).
- v3: ducking 0.32 ⇐ 0.14، الصوت loudnorm −15 ⇐ −12 + EQ ⇐ هوامش 6–14 dB، كل السطور مفهومة.

## النشر المقترح
- العنوان: `"ARE YOU READY?" | John Wick: Chapter 4 | Raya (slowed) #edit #shorts`
- الوصف: Music Used: Raya (slowed) — Zericxxn / Movie: John Wick: Chapter 4 (2023)
