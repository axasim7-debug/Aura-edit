# 07 — النصوص والخطوط (Text & Typography)

## 1. دور النص في الأورا
النص **عنصر ثانوي يدعم اللحظة** — لا يشرح. أنواعه:
| النوع | مثال | متى يظهر |
|------|------|------|
| **عدّاد الأورا** | `+1000 AURA` / `AURA +∞` / `AURA: 999999` | على الدروب أو على اللحظة |
| **عدّاد سلبي ساخر** | `−1000 AURA` | لحظة محرجة (كوميدي) قبل التحول |
| **اسم الشخصية** | `PATRICK BATEMAN` / `GOJO SATORU` | على الدروب أو في الـ Freeze |
| **اقتباس** | "I'm not in danger. I am the danger." | Build (بخط صغير) أو Outro |
| **عنوان/هوك** | "when he stopped holding back" / "POV:" | الثانية الأولى (أعلى الشاشة) |
| **Stats / Card** | تقييم بطاقة FIFA، Power level | رياضة/أنمي |
| **كلمات الأغنية** | sparingly | نادراً في الأورا |
| **علامة مائية للقناة** | @handle صغير | زاوية ثابتة، شفافية 40–60% |

## 2. الخطوط (Fonts)
### خطوط إنجليزية شائعة في إيديتات الأورا/الفونك
| الفئة | خطوط (معظمها مجاني / Google Fonts) | الإحساس |
|------|------|------|
| **Condensed Bold** (الأكثر) | **Bebas Neue**، **Anton**، **Oswald**، League Gothic، Impact | قوي، رياضي، عصري |
| **Blackletter / Gothic** | **UnifrakturMaguntia**، **Pirata One**، Grenze Gotisch، Old English Text | شرير، فونك، "dark" |
| **Serif سينمائي** | **Cinzel**، Playfair Display، Cormorant Garamond، Trajan | أسطوري، ملكي، أنيق |
| **Sans نظيف** | **Montserrat**، Inter، Helvetica Neue، Gotham | اقتباسات وأسماء صغيرة |
| **Japanese/Anime feel** | Noto Sans JP (للكانجي)، خطوط brush | أنمي |
| **Monospace / tech** | JetBrains Mono، Space Mono | VHS، stats، timecode |

**قاعدة الإقران**: خط "شخصية" (Blackletter/Serif) + خط نظيف (Montserrat/Inter) — لا أكثر من خطين.

### خطوط عربية (لإيديتات عربية)
| الخط | الإحساس |
|------|------|
| **Aref Ruqaa** | رقعة، تقليدي فخم |
| **Reem Kufi** / **Lalezar** | كوفي عريض قوي |
| **Amiri** | نسخ كلاسيكي أنيق (اقتباسات) |
| **Cairo** / **Tajawal** / **IBM Plex Sans Arabic** | حديث نظيف |
| **Rakkas** / **Marhey** | عرض قوي للعناوين |
> كلها على Google Fonts ⇐ تعمل مع `@remotion/google-fonts`.

## 3. أسلوب التصميم
- **حروف كبيرة (UPPERCASE)** مع **letter-spacing واسع** (0.1–0.3em) للأسماء ⇐ سينمائي.
- **الوزن**: Bold/Black للعدادات، Regular/Light للاقتباسات.
- **اللون**: أبيض نقي، أو لون المزاج (أحمر للشرير، ذهبي للبطل، أزرق جليدي للبارد).
- **Glow** خفيف خلف النص (text-shadow متعدد) + **Stroke** رفيع أسود للمقروئية.
- **الموضع**: وسط الشاشة للعدادات/الأسماء الكبيرة؛ أعلى (15–25%) للهوك؛ **تجنب أسفل 20% ويمين 15%** (واجهة المنصة).
- **الحجم**: الأسماء/العدادات 90–180px على عرض 1080؛ الاقتباسات 40–60px.

## 4. حركات النص (Text animations)
| الحركة | التنفيذ | المدة |
|------|------|------|
| **Slam / Punch in** | scale 2.5⇐1.0 + opacity 0⇐1 + shake | 4–8f على الضربة |
| **Pop** | scale 0.6⇐1.08⇐1.0 (spring) | 8–12f |
| **Flicker in** | opacity عشوائي 0/1 لـ 6–10 فريمات | 6–10f |
| **Typewriter** | حرف كل 1–2 فريم (أو كل cowbell!) | حسب الطول |
| **Counter roll** | رقم يعد من 0 ⇐ 1000 بسرعة ثم "∞" على الدروب | 15–30f |
| **Glitch** | RGB split + إزاحة أفقية عشوائية | 3–6f |
| **Tracking-out** | letter-spacing يتسع ببطء | طوال الظهور |
| **Blur reveal** | blur(20px)⇐0 + opacity | 8–12f |
| **Word-by-word on beats** | كل كلمة على ضربة | حسب الإيقاع |
| **Exit** | قطع حاد مع الضربة (غالباً)، أو flash | 0–3f |

### "+1000 AURA" — المواصفة القياسية
- الخط: Bebas Neue / Anton، 140px، أبيض، letter-spacing 0.08em.
- الظهور: على الدروب — scale 1.8⇐1.0 خلال 6 فريمات (spring damping 12)، مع shake الشاشة نفسها.
- التوهج: `text-shadow: 0 0 20px rgba(255,255,255,.8), 0 0 60px rgba(120,180,255,.6)`.
- بديل: الرقم يعد (0 ⇐ 1000) خلال البناء، والدروب يحوله إلى `∞`.
- يبقى 1–2 ثانية ثم يختفي قطعاً على ضربة.

## 5. النص خلف الشخص (Text behind subject)
الترتيب من الأسفل للأعلى:
```
1. الفيديو الكامل (الخلفية)
2. النص الكبير (مثلاً اسم الشخصية بعرض الشاشة)
3. الشخص فقط (الفيديو + ماسك alpha)   ← يغطي جزءاً من النص
4. المؤثرات العامة (grain، vignette، flash)
```
- **CapCut**: انسخ اللقطة على مسار أعلى ⇐ Remove background / Auto cutout ⇐ ضع النص بين المسارين.
- **AE**: Roto Brush 3 ⇐ Track Matte.
- **Remotion**: ماسك مسبق من SAM2 (فيديو alpha `.webm` VP9 أو `.mov` ProRes 4444، أو تسلسل PNG) ⇐ `<OffthreadVideo transparent>` فوق النص (انظر 10 و 11).

## 6. Captions للهوك (فوق الفيديو)
- جملة واحدة قصيرة، 4–8 كلمات، lowercase غالباً (أسلوب TikTok)، خط نظيف أبيض بخلفية خفيفة أو stroke.
- أمثلة: "he didn't even try" / "bro was built different" / "the calm before the storm" / "nobody: ... him:"
