# Aura-edit

مرجع شامل لأسلوب **Aura Edit** (إيديتات الأورا على أغاني الفونك / الفونك البرازيلي) — من الثقافة وراءه، إلى جلب اللقطات، المونتاج، المؤثرات، الألوان، الصوت، وحتى **تنفيذه برمجياً بـ Remotion** مع خط معالجة Python.

> الهدف: أن يكون هذا المرجع كافياً لإخراج إيديتات أورا قوية جداً، يدوياً (CapCut / After Effects) أو آلياً (Remotion).

## فهرس المرجع — `aura-style/`

| # | الملف | المحتوى |
|---|------|---------|
| 00 | [00-INDEX.md](aura-style/00-INDEX.md) | الخلاصة المركّزة للأسلوب في صفحة واحدة ("القواعد الذهبية") |
| 01 | [01-what-is-aura.md](aura-style/01-what-is-aura.md) | ما هو الأورا، أصله، سيكولوجيته، النيشات (أفلام، أنمي، كرة، ...) |
| 02 | [02-music-phonk.md](aura-style/02-music-phonk.md) | الفونك وأنواعه، BPM، بنية الأغنية، قوائم أغاني، كيف تختار وتقص الصوت |
| 03 | [03-clip-sourcing.md](aura-style/03-clip-sourcing.md) | من أين تُجلب اللقطات، الجودة، Scenepacks، Twixtor، اختيار "لحظة الأورا" |
| 04 | [04-edit-anatomy.md](aura-style/04-edit-anatomy.md) | تشريح الإيديت: البنية، الإيقاع، خريطة الضربات، قوالب زمنية |
| 05 | [05-effects-library.md](aura-style/05-effects-library.md) | مكتبة المؤثرات: Velocity، Shake، Flash، Zoom، Glow، RGB، ... مع القيم |
| 06 | [06-color-grading.md](aura-style/06-color-grading.md) | تصحيح وتدريج الألوان (CC) ووصفات جاهزة |
| 07 | [07-text-typography.md](aura-style/07-text-typography.md) | النصوص، الخطوط، "+1000 Aura"، النص خلف الشخص |
| 08 | [08-sfx-audio.md](aura-style/08-sfx-audio.md) | المؤثرات الصوتية وخلط الصوت |
| 09 | [09-tools-workflows.md](aura-style/09-tools-workflows.md) | خطوات العمل في CapCut و After Effects و Alight Motion |
| 10 | [10-remotion.md](aura-style/10-remotion.md) | **التنفيذ الكامل بـ Remotion**: البنية والكود لكل مؤثر |
| 11 | [11-python-pipeline.md](aura-style/11-python-pipeline.md) | كشف الضربات (librosa)، FFmpeg، الاستيفاء (RIFE)، الفصل (SAM2) |
| 12 | [12-export-publishing.md](aura-style/12-export-publishing.md) | إعدادات التصدير، النشر، حقوق النشر، الخوارزمية |
| 13 | [13-recipes.md](aura-style/13-recipes.md) | وصفات إيديت جاهزة بالفريم والضربة |
| 14 | [14-checklist.md](aura-style/14-checklist.md) | قائمة فحص الجودة والأخطاء الشائعة |
| 15 | [15-reference-channels.md](aura-style/15-reference-channels.md) | **دراسة القنوات المرجعية** (Jectro / Menzuration / StarEditz) — قالب "Story Aura Short" |
| 16 | [16-clip-sources.md](aura-style/16-clip-sources.md) | **مصادر اللقطات 4K** (Apex Clips، Filmey Box، Amazing Shots…) + كتالوج John Wick |
| — | [SOURCES.md](aura-style/SOURCES.md) | المصادر |

## المشروع البرمجي
| المسار | المحتوى |
|------|------|
| [`remotion/`](remotion/) | مشروع Remotion الفعلي (`npm run render`، `npx tsx scripts/check-plan.ts`) — **المرجع المحدَّث للكود** (أحدث من الأمثلة في 10-remotion.md) |
| [`tools/analyze_audio.py`](tools/analyze_audio.py) | كشف الضربات/الكيك/الدروب ⇐ beats.json |
| [`tools/prepare_clip.py`](tools/prepare_clip.py) | قص لقطة إلى 9:16 حول الوجه + استيفاء + شحذ (+ `--audio` لإبقاء الحوار) |
| [`tools/scan_movie.py`](tools/scan_movie.py) | تفريغ فيلم كامل: الترجمة، المشاهد بأزمنتها، صور لكل مشهد |
| [`tools/song_heatmap.py`](tools/song_heatmap.py) | قمة "Most replayed" لأي أغنية على يوتيوب |
| [`tools/storyboard_extract.py`](tools/storyboard_extract.py) / [`storyboard_timeline.py`](tools/storyboard_timeline.py) | دراسة فيديوهات المراجع عبر صور يوتيوب المصغرة |
| [`episodes/`](episodes/) | سجل كل حلقة: الأغنية، المشاهد، الخط الزمني، المراجعات |

## الحلقات
- [EP01 — Patrick Bateman × Ogryzek "AURA"](episodes/ep01-bateman-aura.md)
