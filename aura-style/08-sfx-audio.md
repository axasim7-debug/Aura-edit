# 08 — المؤثرات الصوتية (SFX) وخلط الصوت

> الـ SFX تجعل المؤثرات البصرية "محسوسة". المحترفون يضيفونها بخفة تحت الأغنية — لا فوقها.

## 1. مكتبة SFX الأساسية للأورا
| الصوت | الاستخدام | ملاحظة |
|------|------|------|
| **Whoosh** | zoom/whip pan/انتقال سريع | قصير (0.2–0.5s)، يبدأ قبل القطع بـ 2–4 فريمات |
| **Impact / Hit / Boom** | الدروب، text slam | تحت الـ kick، EQ لعدم تصادم البيس |
| **Bass drop / Sub drop** | قبل/على الدروب | يقوي الدروب إن كانت الأغنية ضعيفة |
| **Riser** | الـ Build (1–4 ثوانٍ قبل الدروب) | يرتفع ثم يُقطع على الدروب |
| **Reverse cymbal / Reverse reverb** | قبل الدروب مباشرة | 0.5–1.5s |
| **Braam** | لقطة سينمائية ثقيلة | Inception-style |
| **Camera shutter / Click** | freeze frame | جاف وقصير |
| **Glitch / Static** | RGB/twitch | 2–6 فريمات |
| **Heartbeat** | توتر في الـ Build | تحت الصمت |
| **Sword shing / Metal slice** | أنمي/سلاح/نظرة حادة | على النظرة! |
| **Wind / Ambience** | Freeze، لقطة واسعة | خفيف جداً |
| **Tape stop** | النهاية / توقف مفاجئ | الصوت يتباطأ ويتوقف |
| **Record scratch** | stutter / مفاجأة كوميدية | |
| **Vine boom / Meme SFX** | الإيديتات الساخرة فقط | لا تستخدمه في الأورا الجادة |
| **Dialogue line** | سطر من المصدر | **أقوى SFX على الإطلاق** |

## 2. الحوار (Dialogue)
- اقتطع سطراً قصيراً (1–4 ثوانٍ) من الفيلم/المسلسل — قبل الدروب غالباً.
- **Ducking**: اخفض الموسيقى −8 إلى −14dB أثناء الحوار ثم ارفعها على الدروب.
- **Isolation**: لفصل الحوار عن موسيقى الفيلم: أدوات Stem separation (مثل Demucs مفتوح المصدر، أو "Vocal isolation" في CapCut).
- أضف reverb خفيف للحوار ليجلس في الأجواء.

## 3. تقنية "الصمت قبل الدروب" (The Gap)
```
...build build build | [صمت 0.15–0.5s + freeze + ربما نفَس/سطر حوار] | DROP!
```
- اقطع الموسيقى (أو اخفضها لـ −30dB) لنصف ضربة إلى ضربة قبل الدروب.
- البصري: تجميد/أسود/تعتيم.
- نتيجة: الدروب يضرب أقوى بكثير.
- بديل: **low-pass filter** يتصاعد في الـ Build (الأغنية "مكتومة" تحت الماء) ثم يُفتح على الدروب.

## 4. خلط الصوت (Mixing)
| العنصر | المستوى التقريبي |
|------|------|
| الأغنية | المرجع (ذروة حوالي −1 dBTP بعد limiter) |
| SFX impact | −6 إلى −12dB تحت الأغنية |
| Whoosh | −10 إلى −16dB |
| Dialogue | واضح فوق الموسيقى المخفضة |
| الهدف النهائي | **حوالي −14 LUFS** (معيار تقريبي للمنصات)، True peak ≤ −1dB |

- المنصات تطبّع (normalize) الصوت — لا فائدة من الصوت المرتفع جداً، فقط تشويه.
- لا تضع SFX على **كل** قطع — فقط اللحظات المهمة (الدروب، الزوم الكبير، الـ freeze).

## 5. FFmpeg لخلط/تطبيع الصوت النهائي
```bash
# تطبيع لـ -14 LUFS
ffmpeg -i edit.mp4 -c:v copy -af "loudnorm=I=-14:TP=-1:LRA=11" -c:a aac -b:a 192k edit_norm.mp4

# low-pass متصاعد (filter sweep) على أول 3 ثوانٍ ثم فتح
ffmpeg -i song.wav -af "lowpass=f=600:enable='lt(t,3)'" song_lp.wav
```

## 6. في Remotion
- `<Audio src={staticFile('song.mp3')} />` للأغنية (أو `Html5Audio` / `@remotion/media` حسب الإصدار).
- SFX: `<Sequence from={beatFrame - 3}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.4}/></Sequence>`.
- Ducking: `volume` قيمة محسوبة لكل فريم عبر `useCurrentFrame()` + `interpolate` (انظر 10).
- الصمت قبل الدروب: الأسهل تحضيره مسبقاً في ملف الصوت (FFmpeg)، أو `volume` → 0 لنافذة الـ gap.
