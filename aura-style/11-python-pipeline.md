# 11 — خط المعالجة المسبقة (Python + FFmpeg)

> كل ما هو ثقيل أو يحتاج ذكاء اصطناعي يُعمل **قبل** Remotion. الناتج: ملفات نظيفة + JSON.

## 0. التثبيت
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install librosa soundfile numpy
# اختياري:
pip install yt-dlp demucs mediapipe opencv-python
# FFmpeg من مدير الحزم (apt install ffmpeg / brew install ffmpeg)
```

## 1. قص الأغنية
```bash
# من 1:02.30 لمدة 12 ثانية، بدون إعادة ضغط مزعجة (wav للتحليل والدقة)
ffmpeg -ss 62.3 -t 12 -i song_full.mp3 -ac 2 -ar 48000 song.wav
# slowed (0.85x مع خفض pitch — مثل "slowed" الحقيقي)
ffmpeg -i song.wav -af "asetrate=48000*0.85,aresample=48000" song_slowed.wav
# sped up 1.2x مع رفع pitch
ffmpeg -i song.wav -af "asetrate=48000*1.2,aresample=48000" song_spedup.wav
# تسريع بدون تغيير pitch
ffmpeg -i song.wav -af "atempo=1.15" song_fast.wav
```

## 2. كشف الضربات ⇐ `beats.json`
السكربت: [`tools/analyze_audio.py`](../tools/analyze_audio.py)
```bash
python tools/analyze_audio.py song.wav -o public/data/beats.json
# أو مع تحديد الدروب يدوياً إن أخطأ الكشف:
python tools/analyze_audio.py song.wav -o beats.json --drop 3.42
# أو تحليل جزء من الأغنية الكاملة مباشرة:
python tools/analyze_audio.py song_full.mp3 --start 62.3 --end 74.3 -o beats.json
```
**كيف يعمل:**
1. **BPM** من `librosa.beat.beat_track` على غلاف الـ onsets الكامل.
2. **الكيكات/808** من onsets **النطاق المنخفض فقط** (`onset_strength(fmax=200)`) — لأن `beat_track` وحده كثيراً ما يقفل على الـ hi-hats بدل الكيك (اختُبر: على مسار اصطناعي 130BPM قفل على الـ offbeats).
3. **الدروب** = أكبر قفزة في طاقة البيس المستمرة (متوسط بار بعد − متوسط بار قبل)، ثم يُلصق بأقرب كيك حقيقي.
4. **المستويات**: 4 = الدروب، 3 = كيك/808 قوي، 2 = onset قوي (snare/clap/hat بارز)، 1 = onset خفيف (cowbell/hat).
5. `backtrack=True` يضع الضربة على بداية الـ transient (مناسب للقطع: القطع على الفريم أو قبله).
6. دقة الزمن: hop = 256 عيّنة ≈ 11.6ms (أقل من فريم واحد عند 60fps = 16.7ms).

> **تحقق دائماً بأذنك/عينك**: افتح `beats.json` في Remotion Studio مع مؤشر يومض على كل ضربة (debug overlay) قبل الرندر النهائي.
> أدوات أدق للحالات الصعبة: **madmom** (DBN beat tracker)، **Essentia**، **aubio**.

### تصنيف إضافي اختياري
- **Snare** مقابل **hat**: قارن طاقة 1–4kHz (snare) بـ >7kHz (hats) حول كل onset.
- **Cowbell**: نغمي ⇐ `librosa.yin`/`pyin` يعطي pitch ثابت ~ 500–900Hz.
- **Vocal chops**: فصل الصوت بـ Demucs ثم onsets على مسار الـ vocals.

## 3. تحضير اللقطات
### قص عمودي 9:16 حول الوجه
```bash
# المصدر 1920x1080 ⇐ قص عرض 608 (=1080*9/16) يبدأ عند x ⇐ تكبير لـ 1080x1920
ffmpeg -i in.mp4 -vf "crop=ih*9/16:ih:X:0,scale=1080:1920:flags=lanczos,setsar=1" -c:v libx264 -crf 14 -preset slow -an out.mp4
# حيث X = focus_x * iw - (ih*9/16)/2  (محصورة بين 0 و iw - ih*9/16)
```
- لإيجاد `focus_x` تلقائياً: MediaPipe Face Detection على عدة فريمات ⇐ المتوسط (أو تتبع ناعم لـ reframe متحرك يُصدَّر كـ JSON ويُطبَّق في Remotion بـ `transform: translateX`).

### توحيد fps + keyframes متقاربة (لسرعة الـ seeking في Remotion)
```bash
ffmpeg -i in.mp4 -r 30 -g 15 -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -an clip30.mp4
```

### الاستيفاء للسلو موشن (60/120fps)
```bash
# FFmpeg (بطيء، جودة مقبولة، بدون GPU)
ffmpeg -i clip.mp4 -vf "minterpolate=fps=120:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" -c:v libx264 -crf 14 clip120.mp4

# RIFE (أفضل بكثير، GPU/Vulkan) — rife-ncnn-vulkan
ffmpeg -i clip.mp4 frames/%06d.png
rife-ncnn-vulkan -i frames -o frames_x4 -n <عدد_الفريمات×4> -m rife-v4.6
ffmpeg -framerate 120 -i frames_x4/%08d.png -c:v libx264 -crf 14 -pix_fmt yuv420p clip120.mp4
```
- **أنمي**: أزل الفريمات المكررة أولاً (`mpdecimate`) ثم استوفِ، أو اترك التقطع إن كان جزءاً من الأسلوب.
- **ملاحظة Remotion**: لقطة 120fps في composition 30fps: بـ `playbackRate=0.25` تُعرض كل فريماتها ⇐ سلو موشن ناعم 4×.

### التدريج المسبق (LUT + sharpen + grain خفيف لمنع banding)
```bash
ffmpeg -i clip.mp4 -vf "lut3d=luts/cold_aura.cube,eq=contrast=1.12:saturation=0.85:brightness=-0.02,unsharp=5:5:0.5:5:5:0,noise=alls=4:allf=t" -c:v libx264 -crf 14 clip_cc.mp4
```

### رفع الدقة
- **Real-ESRGAN** (`realesrgan-ncnn-vulkan -i in.png -o out.png -n realesr-animevideov3` للأنمي) على الفريمات ثم إعادة التجميع، أو Topaz Video AI (تجاري).

### عكس لقطة (rewind)
```bash
ffmpeg -i clip.mp4 -vf reverse -an clip_rev.mp4
```

### Motion blur مسبق (بديل رخيص لـ CameraMotionBlur)
```bash
# دمج 3 فريمات متتالية (يفضل على نسخة 90/120fps ثم الإخراج 30fps)
ffmpeg -i clip120.mp4 -vf "tmix=frames=4:weights='1 1 1 1',fps=30" clip_mb.mp4
```

## 4. ماسك الشخص (للنص خلف الشخص / glow الهالة)
- **SAM 2** (Meta): نقرة/نقطة على الشخص في الفريم الأول ⇐ يتتبعه في كل الفيديو. يوجد تنفيذ في Transformers (`Sam2VideoModel`) ومساحات Hugging Face جاهزة (Apache-2.0).
- **RobustVideoMatting**: matting تلقائي للأشخاص (حواف شعر أفضل من الماسك الثنائي).
- **BiRefNet** للماسك الأولي + SAM 2 للتتبع (نهج هجين).
- التصدير كفيديو alpha لـ Remotion:
```bash
# من تسلسل PNG بقناة alpha (RGBA) ⇐ WebM VP9 مع alpha
ffmpeg -framerate 30 -i mask_rgba/%06d.png -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 4M person.webm
# أو ProRes 4444
ffmpeg -framerate 30 -i mask_rgba/%06d.png -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le person.mov
```
- لصنع RGBA من الفيديو + ماسك أبيض/أسود:
```bash
ffmpeg -i clip.mp4 -i mask.mp4 -filter_complex "[1:v]format=gray[m];[0:v][m]alphamerge,format=yuva420p" -c:v libvpx-vp9 -b:v 4M person.webm
```

## 5. تتبع الوجه/العين (لـ eye glow ونص يتبع الوجه)
- MediaPipe Face Mesh ⇐ لكل فريم: إحداثيات العينين (landmarks 33, 263 تقريباً لزوايا العينين، 468/473 للقزحية مع refine_landmarks).
- صدّر `track.json`: `[{"f":0,"le":[x,y],"re":[x,y]}, ...]` بإحداثيات نسبية ⇐ Remotion يرسم نقطة توهج (radial-gradient + blur) في الموضع، مع "light trail" عند حركة الرأس (ارسم المواضع السابقة بشفافية متناقصة).

## 6. فصل الحوار عن موسيقى الفيلم
```bash
demucs --two-stems=vocals scene_audio.wav   # ⇐ separated/htdemucs/scene_audio/vocals.wav
```

## 7. التنزيل
```bash
yt-dlp -f "bv*[height<=2160]+ba/b" --merge-output-format mp4 -o "raw/%(title)s.%(ext)s" "<URL>"
yt-dlp -x --audio-format wav "<SONG_URL>"   # الصوت فقط
```
> احترم حقوق النشر وشروط المنصات (انظر 12).

## 8. خط الأتمتة المقترح (سكربتات مستقبلية)
```
tools/
  analyze_audio.py   ✅ موجود — beats.json
  prepare_clips.py   ⏳ قص 9:16 حول الوجه + fps + LUT + interp
  make_masks.py      ⏳ SAM2 ⇐ webm alpha
  make_plan.py       ⏳ meta.json + beats.json ⇐ plan.json
  render.sh          ⏳ npx remotion render + loudnorm
```
