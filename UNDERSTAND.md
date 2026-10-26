# RoastMe AI – Code ko samjho (Simple Hinglish Guide)

Ye file batati hai ki **poora project kaise kaam karta hai**: kaunsi file kya karti hai, data kahan se kahan jaata hai, ML kya kar raha hai, aur naya Camera Roast kaise chalta hai.
Har code snippet me comments hain taaki line-by-line samajh aaye.

> **Har code line pe Hinglish comment hai.** File ke upar batata hai ki file kya karti hai, aur har line ke aage (ya theek upar) uska matlab likha hai. JSX/markup ke andar comments `{/* ... */}` me hain, taaki screen pe text na dikhe. Sirf JSON files (package.json, app.json, dataset.json) me comment allowed nahi hote.

> Tip: Ise padhte waqt VS Code me saath-saath asli file khol ke rakho. File ka naam har section ke heading me diya hai.

---

## 1. Big Picture (ek nazar me)

Project ke 3 hisse hain:

| Folder | Kya hai | Technology |
|---|---|---|
| `backend/` | Server (dimaag). Roast banata hai, ML chalata hai, history save karta hai | Python, FastAPI, scikit-learn |
| `web/` | Website jo browser me chalti hai | React, Vite, Tailwind, Framer Motion |
| `mobile/` | Android app | React Native, Expo |

Website aur App dono **same backend** ko call karte hain. Matlab logic ek hi jagah hai, bas UI do hain.

```
 [Website]  ──┐
              ├──>  FastAPI Backend  ──> ML model (topic predict karta hai)
 [Android]  ──┘          │            ──> Comedy writer (NVIDIA → Gemini, ya templates)
                         └──────────> History (MongoDB ya memory)

 [Camera Roast]: face detection BROWSER ke andar hota hai (MediaPipe).
                 Backend ko sirf "signals" jaate hain (smile, distance...), PHOTO kabhi nahi.
```

---

## 2. Ek roast ka safar (Request ka poora flow)

Maan lo user ne website pe bio likha aur **"Roast Me"** dabaya. Ye hota hai:

1. **`web/src/pages/RoastGenerator.jsx`** form check karta hai (bio kam se kam 10 characters).
2. Ye `api.roast(form)` call karta hai (**`web/src/services/api.js`**).
3. `api.js` backend ko `POST http://localhost:8000/api/roast` bhejta hai (JSON me).
4. Backend me **`app/routes/features.py`** ka `roast()` function request leta hai.
5. **Pydantic** (`app/schemas/api.py`) check karta hai ki data sahi hai (length, type). Galat hua to turant error.
6. **`app/services/roast_service.py`**:
   - ML model se topic predict karwata hai (gaming / student life...).
   - AI on hai to NVIDIA (ya backup Gemini) se roast likhwata hai, warna local templates se.
   - "Heat rating" formula se score banata hai.
7. Result history me save hota hai (`history_store.py`).
8. JSON wapas website ko: `{ "ok": true, "data": { "roast": "...", "ml": {...} } }`
9. Website result card dikhati hai, Framer Motion animation ke saath.

Har response ka format same hota hai:
```json
// Success
{ "ok": true,  "data": { ... } }
// Error
{ "ok": false, "error": { "message": "Bio / routine: String should have at least 10 characters" } }
```

---

## 3. Backend (`backend/`)

### Folder map
```
backend/
├── app/
│   ├── main.py              # App ka entry point: CORS, rate limit, error format
│   ├── config.py            # .env se settings padhta hai
│   ├── routes/
│   │   ├── features.py      # /api/roast, /api/npc, /api/camera-roast...
│   │   └── history.py       # /api/history (list, delete, clear)
│   ├── schemas/api.py       # Pydantic: request ka shape + validation
│   ├── ml/classifier.py     # Trained model load + predict
│   └── services/
│       ├── roast_service.py         # Text roast banana
│       ├── roast_templates.py       # Hath se likhi comedy lines
│       ├── npc_service.py           # NPC quiz: AI ke naye sawal + scoring + roast
│       ├── camera_roast_service.py  # Camera Roast ki lines + score
│       ├── ai_provider.py           # NVIDIA + Gemini AI calls
│       └── history_store.py         # MongoDB ya memory me history
└── training/
    ├── generated_examples.json  # ~1100 NVIDIA ke likhe examples (model inse seekhta hai)
    ├── dataset.json         # 150 haath se likhe examples (sirf TEST, model inse nahi seekhta)
    ├── generate_examples.py # NVIDIA se naye examples likhwata hai
    └── train_model.py       # Model train + test karke .joblib file banata hai
```

### 3.1 `main.py` – Server ka darwaza

```python
@asynccontextmanager
async def lifespan(app):
    load_all_models()            # Server start hote hi ML models ek baar memory me load
    history_store.init_history() # MongoDB connect karo, nahi mila to memory use karo
    yield                        # Ab server requests lene ke liye ready hai

app = FastAPI(title="RoastMe AI API", lifespan=lifespan)

# Rate limit: ek IP ek minute me max 30 POST requests (spam rokne ke liye)
@app.middleware("http")
async def rate_limit(request, call_next):
    ...
    if len(window) >= config.RATE_LIMIT_PER_MINUTE:
        return _error(429, "Easy there! Too many roasts in a minute.")
    ...

# CORS: sirf allowed websites hi browser se API call kar sakti hain
app.add_middleware(CORSMiddleware, allow_origins=config.CORS_ORIGINS, ...)
```

Errors ko bhi ek jaisa banaya gaya hai (`_error()` function), taaki frontend ko hamesha `error.message` mil jaaye.

### 3.2 `schemas/api.py` – Validation (Pydantic)

```python
class RoastRequest(_Trimmed):            # _Trimmed: har string ke aage-peeche ke spaces hata deta hai
    nickname: Optional[str] = Field(default=None, max_length=30)
    bio: str = Field(min_length=10, max_length=600)   # zaroori field, 10-600 characters
    habits: Optional[str] = Field(default=None, max_length=400)
    intensity: Intensity = Intensity.savage          # sirf friendly / savage / extra_spicy allowed
    category: Category = Category.auto
    client_id: Optional[str] = Field(default=None, pattern=CLIENT_ID_PATTERN)  # anonymous id
```
Agar koi `bio: "hi"` bheje, to FastAPI khud 422 error de dega. Humein `if` likhne ki zaroorat nahi.

### 3.3 Machine Learning – asli ML kahan hai?

**Training (`training/train_model.py`)** – ek baar chalate ho:
```python
def build_pipeline():
    features = FeatureUnion([
        # Words aur 2-word combos ("one more", "deadline") ko numbers me badlo
        ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
        # Character pieces ("gam", "amin") – typos aur slang samajhne me help
        ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))),
    ])
    # Logistic Regression = har category ki probability nikalta hai
    return Pipeline([("features", features), ("classifier", LogisticRegression(C=16.0))])

pipeline.fit(generated_texts, generated_labels)            # NVIDIA ke likhe ~1100 examples se seekho
predictions = pipeline.predict(handwritten_texts)         # 150 haath se likhe (kabhi nahi dekhe) pe test
test_accuracy = accuracy_score(handwritten_labels, predictions)   # imaandaar accuracy
joblib.dump(bundle, "app/ml/models/roast_category.joblib")   # model file save
```

**TF-IDF simple bhasha me:** har sentence ko numbers ki list me badalta hai. Jo words kisi category me zyada aate hain (jaise "valorant", "lag" → gaming), unka weight zyada.

**Prediction (`app/ml/classifier.py`)**:
```python
def predict(self, text):
    probabilities = pipeline.predict_proba([text])[0]   # har category ka % chance
    top_label, top_probability = ranked[0]               # sabse zyada wala
    confident = top_probability >= self.min_confidence   # 40% se kam? to bharosa nahi
    return {
        "label": top_label if confident else self.fallback_label,  # kam bharosa → "general"
        "confidence": top_probability,
        "probabilities": {...},   # UI me bars isi se bante hain
    }
```

**Data kahan se aaya?** Pehle sirf 150 haath se likhe examples the (har topic ke 30) aur accuracy ~49% thi. Ab `generate_examples.py` NVIDIA Nemotron se 8 alag "personas" (Indian student, office worker, parent...) ke andaaz me ~1100 lines likhwata hai, ek hi tie-break rulebook ke saath (jaise: exam/class wali line hamesha student_life, chahe usme der karna ho). Duplicate aur test set se milti-julti lines hata di jaati hain.

**Imaandaar test:** model sirf generated data se seekhta hai, aur 150 haath se likhe examples pe test hota hai jo usne kabhi nahi dekhe. Result: **78.7%** (gaming 97%, student life 93%, general 80%, productivity 70%, procrastination 53%). Procrastination kamzor hai kyunki model words match karta hai, matlab nahi samajhta ("snooze" wali line general lagti hai). Isliye UI me confidence dikhate hain aur kam confidence pe "General" pe fallback karte hain.

Model **sirf topic batata hai**. Joke wo nahi likhta. Joke alag system likhta hai (next section).

### 3.4 Comedy writer – `roast_service.py` + `ai_provider.py`

```python
def create_roast(request):
    prediction = roast_classifier.predict(bio + habits)   # 1) ML se topic

    # User ne category chuni hai to wahi, warna ML wali
    category = request.category if user_picked else prediction["label"]

    roast_text = _ai_roast(name, request, category)      # 2) NVIDIA / Gemini try karo (agar .env me on hai)
    if roast_text is None:                                # AI off / fail → local templates
        roast_text = _template_roast(name, quote, category, intensity)

    return { "roast": roast_text, "heat_rating": heat_rating(...), "ml": prediction, ... }
```

- **Templates (`roast_templates.py`)**: Opener + user ki apni line ka quote + 2 category jokes + closer. Free hai, internet nahi chahiye.
- **AI (`ai_provider.py`)**: sirf do options: `nvidia` (`NVIDIA_API_KEY`) aur `gemini` (`GEMINI_API_KEY`). `AI_PROVIDER=nvidia,gemini` = pehle NVIDIA, fail ho to Gemini (details 3.4.1 me). Key na ho ya call fail ho (galat key, limit khatam, timeout) to `None` return → templates. App kabhi tootti nahi.
- **Gemini model:** `gemini-3.5-flash-lite` (~1 second). Testing me bade "flash" models 40-150 second le rahe the, isliye lite chuna. Badalna ho to `.env` me `GEMINI_MODEL`.

```python
# ai_provider.py (short version)
response = client.models.generate_content(
    model=config.GEMINI_MODEL,                 # gemini-3.5-flash-lite
    contents=user_content,                     # user ka bio / quiz jawab / camera signals
    config=types.GenerateContentConfig(
        system_instruction=system_prompt,      # comedy rules + safety rules
        max_output_tokens=max_tokens + 1024,
        temperature=1.0,                       # thoda creative
    ),
)
text = (response.text or "").strip()           # khaali aaya to None → templates
```
**Key kahan hai?** Sirf `backend/.env` me (ye file git me nahi jaati). Website/app ko key kabhi nahi milti, wo sirf backend ko call karte hain.
- **Safety rules**: AI ko bola gaya hai ki looks, religion, gender jaise topics pe joke nahi. Sirf habits pe.
- **Heat rating**: ML nahi hai! Simple formula: intensity ka base + roastable words ("tomorrow", "3am") ke points.

### 3.4.1 NVIDIA + Gemini (provider chain) + "Roast my look"

`.env` me `AI_PROVIDER=nvidia,gemini` = **pehle NVIDIA, fail ho to Gemini, dono fail to templates.**

```python
# ai_provider.py (short)
for provider in enabled_providers():          # jaise ["nvidia", "gemini"] (jinki key hai)
    if provider == "nvidia":
        text = _nvidia(system_prompt, user_content, max_tokens, image, timeout)  # NVIDIA HTTP API
    else:
        text = _gemini(system_prompt, user_content, max_tokens, image)           # Google SDK
    if text:
        return text, provider                  # kisne likha, wo bhi wapas
return None, None                              # sab fail → templates
```

- **NVIDIA** `https://integrate.api.nvidia.com/v1/chat/completions` pe jaata hai (`httpx`, OpenAI jaisa format).
- **Model:** `nvidia/nemotron-3.5-super-vl-120b-a12b` (photo bhi samajhta hai). Ye jawab se pehle "sochta" hai (10-20 second), isliye hum `chat_template_kwargs: {"enable_thinking": false}` bhejte hain → **1-2 second** me roast. Badalna ho to `.env` me `NVIDIA_MODEL` / `NVIDIA_VISION_MODEL`.
- **Free NVIDIA kabhi atakta hai ya `500` deta hai.** Isliye: har request ka limit 10 second (quiz ke liye 25), har model 2 try, phir backup model (text: Nemotron 3.5 Lightning, photo: Nemotron 3 Nano Omni). Sab milake max (limit + 10) second, phir Gemini. Sab fail to templates.

**"Roast my look" (camera):**
```
Switch ON → photo (bina filter, 768px JPEG, ~15-120 KB) + signals → /api/camera-roast
          → LOOK_RULES ke saath NVIDIA/Gemini photo dekhte hain → personal roast
Switch OFF → sirf signals (pehle jaisa)
```
- **Kis pe joke ho sakta hai:** hairstyle, kapde, chashma, expression, pose, room/background, lighting, chuna hua filter (yaani jo cheez banda chun sakta hai ya aaj badal sakta hai).
- **Kis pe kabhi nahi:** skin colour, race, body/weight, janam se mili chehre ki banawat, age, gender, disability, religion, self-harm.
- Bachcha lage to bahut halka roast. Photo **kahin save nahi** hoti (na server pe, na history me).
- Website: `services/photo.js` (`toJpegDataUrl`) photo chhoti karta hai. App: `expo-image-manipulator` se resize + base64.

### 3.5 Baaki features

| Feature | File | Kaise kaam karta hai |
|---|---|---|
| NPC Meter | `npc_service.py` | Neeche 3.6 dekho |
| Camera Roast | `camera_roast_service.py` | Section 5 dekho |
| History | `history_store.py` | `MONGODB_URI` hai to MongoDB, warna memory (server restart = sab gayab). Sirf result save hota hai, user ka bio nahi |

### 3.6 NPC Meter – AI ke naye sawal + jawabon pe roast

```
GET /api/npc/questions
  → 24 topics me se random 6 (jaise "gaming", "group chats", "cooking")
  → AI 6 sawal likhta hai, har option ke "npc" points (0 = main character, 3 = full NPC)
  → server points ke saath quiz memory me rakhta hai (quiz_id, 2 ghante)
  → client ko sirf quiz_id + sawal + options (points nahi = answer key chhupi)

POST /api/npc  { quiz_id, answers: [2, 0, 3, ...] }
  → points jodo → 0-100 NPC score → title ("Shopkeeper NPC" waghaira)
  → AI ko sawal + chune jawab → wo unhi jawabon ko quote karke roast likhta hai
```

- **AI ka JSON kabhi gadbad hota hai** (do options ke same points, ya 'single quotes'). `_parse_questions()` points ko 0-3 me dobara baant deta hai, `ast.literal_eval` se single quotes wala jawab bhi padh leta hai, aur bekaar sawal chhod deta hai. 3 se kam sahi sawal = poora AI quiz chhodo.
- **AI na chale** to `QUESTION_BANK` (16 sawal) me se random 6, options bhi shuffle. Roast ki jagah rank ki chhoti line.
- **Server restart** = memory ke quiz gayab → `POST /api/npc` `410` deta hai ("This quiz expired"). "New quiz" dabao.
- Quiz banana bhi AI call hai, isliye `GET /api/npc/questions` bhi rate limit me ginta hai.

---

## 4. Website (`web/`)

### Folder map
```
web/src/
├── main.jsx            # React ko <div id="root"> me chalu karta hai + Router
├── App.jsx             # Saare routes (pages) + page transition animation
├── index.css           # Tailwind + theme colors + .field style
├── constants.js        # Intensity / category list (ek jagah, sab pages use karte hain)
├── services/
│   ├── api.js          # Backend se baat karne wala EK hi jagah
│   ├── faceSignals.js  # Camera: face se smile/distance/tilt nikalna
│   ├── drawFilters.js  # Camera: canvas pe sunglasses, crown... draw karna
│   └── roastCard.js    # Camera: photo + roast ka shareable PNG banana
├── hooks/
│   ├── useApiAction.js # loading / success / error state ek line me
│   ├── useCopyShare.js # Copy + Share button logic
│   ├── useCamera.js    # Webcam on/off
│   └── useFaceTracker.js # MediaPipe model + har frame ka loop
├── components/         # Chhote reusable UI pieces (Button, Card, ScoreMeter...)
└── pages/              # Har screen ek file (Home, RoastGenerator, CameraRoast...)
```

### 4.1 `services/api.js` – backend se baat

```javascript
// .env se backend ka URL, na mile to localhost
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function request(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers: ..., body: JSON.stringify(body) });
  } catch {
    // Server band hai ya internet nahi → user ko samajh aane wala message
    throw new Error("Can't reach the RoastMe server. Check that the backend is running.");
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) throw new Error(payload?.error?.message);  // backend ka message aage
  return payload.data;   // pages ko sirf "data" milta hai
}
```
**Rule:** koi bhi page seedha `fetch` nahi karta. Sab `api.something()` use karte hain. URL badalna ho to sirf ek jagah badlo.

**`getClientId()`**: browser me ek random id (localStorage) banata hai. Isse server history group karta hai. Koi login ya personal data nahi.

### 4.2 `hooks/useApiAction.js` – loading/error ka jhanjhat khatam

```javascript
const roast = useApiAction(api.roast);   // page me bas itna

roast.run(formData);       // API call shuru
roast.status               // "idle" | "loading" | "success" | "error"
roast.data                 // result
roast.error                // error message
```
Isi se har page pe **empty → loading skeleton → result / error** states bante hain.

### 4.3 Animations (Framer Motion = `motion` package)

| Kahan | Kya animation |
|---|---|
| `App.jsx` | `AnimatePresence` + `PageTransition`: page badalne pe fade + slide |
| `Home.jsx` | Hero text ek-ek karke aata hai (`staggerChildren`), feature cards scroll pe reveal |
| `Navbar.jsx` | Active link ke neeche line slide karti hai (`layoutId="nav-active"`) |
| `ScoreMeter.jsx` | Circle 0 se score tak bharta hai + number count-up |
| `Modal.jsx` | Clear history popup spring ke saath scale hota hai |
| `CameraRoast.jsx` | 3-2-1 countdown, camera flash, filter picker ka sliding highlight |

```jsx
// App.jsx – ye line zaroori hai: jo user OS me "reduce motion" on kare, unke liye animation band
<MotionConfig reducedMotion="user">
```

---

## 5. 📸 Camera Roast – poora flow (naya feature)

**File:** `web/src/pages/CameraRoast.jsx` (+ hooks aur services jo neeche bataye hain)

### 5.1 Step by step

```
1. User "Turn On Camera" dabata hai
        ↓  useCamera.js → navigator.mediaDevices.getUserMedia()  (browser permission maangta hai)
2. Video stream chalu (hidden <video> element me)
        ↓  useFaceTracker.js → MediaPipe FaceLandmarker model load (~4 MB, sirf pehli baar)
3. Har frame (~30-60 baar per second):
        ├─ detectForVideo() → face ke 478 points + expressions (smile, jawOpen...)
        ├─ faceSignals.js   → simple signals: smiling? close? dark? tilted?
        └─ drawFilters.js   → canvas pe video + filter (sunglasses/crown...) + violet HUD box
4. User filter / color look / intensity chunta hai
5. "Roast My Face" → 3, 2, 1 countdown (Framer Motion) → flash ⚡
6. captureSnapshot(): HUD ke bina clean photo canvas pe
7. Sirf SIGNALS backend ko → POST /api/camera-roast
        { expression: "smiling", faces: 1, distance: "close", lighting: "dark", filter: "crown", ... }
8. Backend signals ke hisaab se roast + title + score bhejta hai
9. Result card + "Save roast card" (photo + roast wala PNG, phone pe share sheet)
```

### 5.2 Privacy – sabse important

- Face detection **browser ke andar** hoti hai (MediaPipe WebAssembly). Video kahin upload nahi hota.
- Backend ko sirf words jaate hain: `"smiling"`, `"close"`, `"dark"`. Photo **kabhi nahi**.
- Roast lines sirf **behaviour** pe hain (expression, distance, lighting, head tilt, filter choice). **Kisi ki shakal / looks pe koi joke nahi.**
- Page chhodte hi camera band (`useCamera` ka cleanup), taaki camera ki light na jalti rahe.

### 5.3 `hooks/useCamera.js`

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },  // front camera
  audio: false,                                                                  // mic nahi chahiye
});
video.srcObject = stream;   // stream ko <video> me daal do
await video.play();

// Band karna: har track stop karo, warna camera ON hi rahega
streamRef.current?.getTracks().forEach((track) => track.stop());
```
Errors ko friendly message me badla gaya hai: permission blocked, camera nahi mila, camera kisi aur app (Zoom) me busy.

### 5.4 `hooks/useFaceTracker.js` – dil ka loop

```javascript
// Model sirf ek baar load hota hai (promise cache)
FaceLandmarker.createFromOptions(files, {
  baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },  // GPU = fast
  runningMode: "VIDEO",          // live video ke liye mode
  numFaces: 3,                   // 3 log tak ek saath
  outputFaceBlendshapes: true,   // smile, jawOpen, browInnerUp jaise scores
});

const loop = (time) => {
  const result = landmarker.detectForVideo(video, time);   // is frame me face kahan hai
  const current = buildSignals(result, lighting);          // smile? close? tilt?
  drawFrame(ctx, video, result, { filter, grade, showHud: true, time, expression });
  if (time - lastSignalsAt > 250) setSignals(current);     // React state sirf har 250ms (warna lag)
  frameId = requestAnimationFrame(loop);                    // agla frame
};
```
**Smart trick:** filter `useRef` me rakha hai, isliye filter badalne pe loop restart nahi hota. Bas agle frame se naya filter dikhta hai.

### 5.5 `services/faceSignals.js` – face se "signals"

MediaPipe face pe **478 points** deta hai. Kuch fixed number yaad rakho:

```javascript
export const POINTS = {
  noseTip: 1, foreheadTop: 10, chin: 152,
  leftEyeOuter: 33, rightEyeOuter: 263,     // aankhon ke bahar wale kone
  leftCheek: 234, rightCheek: 454,          // gaal ke kinare (face ki width)
};
```

| Signal | Kaise nikalta hai |
|---|---|
| Expression | Blendshapes: aankh band > 0.6 → `eyes_closed`; jawOpen > 0.35 → `surprised`; smile > 0.45 → `smiling`; eyebrows > 0.5 → `eyebrows_raised`; warna `neutral` |
| Distance | Gaal se gaal ki width. Screen ke 45% se zyada = `close`, 18% se kam = `far` |
| Head tilt | Dono aankhon ki line ka angle. 12° se zyada = tedha |
| Looking away | Naak face ke center se kitna side me hai |
| Lighting | Video ko 32×24 pixel me chhota karke average brightness. <60 = dark, >200 = bright |

### 5.6 `services/drawFilters.js` – filters kaise bante hain

```javascript
export function drawFrame(ctx, video, result, { filter, grade, showHud, time, expression }) {
  // 1) Video ko mirror karke draw karo (selfie jaisa) + color grade (Noir/Retro/Thermal = CSS filter)
  ctx.filter = COLOR_GRADES[grade];
  ctx.translate(width, 0); ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);

  // 2) Har face pe filter + HUD
  faces.forEach((landmarks, index) => {
    const geometry = faceGeometry(landmarks, width, height);  // size, center, angle
    FILTER_DRAWERS[filter]?.(ctx, geometry, time);            // sunglasses / crown / ...
    if (showHud) drawHud(ctx, geometry, ...);                 // violet corner brackets + label
  });
}
```
- **Mirror:** video ulta dikhta hai (selfie), isliye har point ka `x` → `1 - x`.
- **Rotation:** `geometry.angle` se sunglasses/crown head ke saath tilt hote hain (`withRotation`).
- **Scale:** sab size face ki width/aankhon ki doori se nikalta hai, isliye camera ke paas jao to filter bhi bada.

| Filter | Kya draw hota hai |
|---|---|
| 🕶️ Deal With It | Do gradient lenses + shine + bridge, aankhon pe |
| 👑 Royal Delusion | Golden crown + jewels, forehead ke upar |
| 🤡 Clown Mode | Red 3D nose + gaalon pe lali |
| 😈 Lil Devil | Do curved red horns |
| 🤖 NPC Scanner | Upar-neeche chalti green scan line + "NPC #0427" label |
| 🔥 On Fire | Sir ke upar uchhalte 🔥 |

**Naya filter add karna ho?** `drawFilters.js` me function likho → `FILTER_DRAWERS` me add karo → `CameraRoast.jsx` ke `FILTERS` list me add karo → backend `schemas/api.py` ke `FaceFilter` enum me + `camera_roast_service.py` ke `FILTER_LINES` me joke.

### 5.7 Countdown aur capture (`CameraRoast.jsx`)

```javascript
// phase: "live" → "countdown" → "result"
useEffect(() => {
  if (phase !== "countdown") return;
  if (count === 0) { capture(); return; }               // 0 pe photo
  const timer = setTimeout(() => setCount((c) => c - 1), 800);  // har 0.8 sec me 3→2→1
  return () => clearTimeout(timer);
}, [phase, count]);

async function capture() {
  const { canvas, signals } = tracker.captureSnapshot();  // HUD ke bina clean photo
  if (!signals.faces) { setCaptureError("No face in frame..."); return; }  // face nahi to roast nahi
  setFlash(true);                                         // white flash animation
  roast.run({ expression: signals.expression, distance: signals.distance, ..., filter, intensity });
}
```
`roastCard.js` photo ke neeche title + roast text likh ke 1080px wide PNG banata hai. Phone pe Web Share se seedha Instagram/WhatsApp, desktop pe download.

---

## 6. Android App (`mobile/`)

```
mobile/
├── app/                  # Expo Router: har file = ek screen (tab)
│   ├── _layout.js        # Bottom tabs: Home, Roast, Camera, NPC, History
│   ├── index.js          # Home
│   ├── camera.js         # Camera tab (Expo Go guard + CameraRoastScreen)
│   ├── roast.js / npc.js / history.js
├── components/camera/    # CameraRoastScreen.js + FaceFilterLayer.js (SVG filters)
├── components/           # Button, Card, Field, ScoreRing (SVG), StatusViews...
├── services/api.js       # Website jaisa hi, bas AsyncStorage + 10.0.2.2 default
├── hooks/                # useApiAction, useReducedMotion
├── theme.js              # Saare colors/radius ek jagah
└── constants.js
```

- **Web vs App ka farak:** HTML (`div`) ki jagah `View`/`Text`, Tailwind ki jagah `StyleSheet`, Framer Motion ki jagah React Native ka **`Animated`** (`components/Motion.js` me `FadeIn` aur `PressableScale`).
- **Backend URL:** emulator ke liye `http://10.0.2.2:8000` (emulator ka "localhost" yahi hai). Phone ke liye PC ka LAN IP. `mobile/.env` me `EXPO_PUBLIC_API_URL`.
- **Camera tab (app)**: neeche section 6.1 dekho.

### 6.1 📸 App ka Camera Roast

Website pe MediaPipe browser me chalta hai. Phone pe uski jagah **Google ML Kit** use hota hai, jo phone ke andar hi chalta hai.

| Kaam | File | Library |
|---|---|---|
| Live camera + face detection | `components/camera/CameraRoastScreen.js` | `react-native-vision-camera` + `react-native-vision-camera-face-detector` (ML Kit) |
| Face → geometry + signals | `services/faceSignals.js` | – |
| Filters draw karna | `components/camera/FaceFilterLayer.js` | `react-native-svg` |
| Photo + filters ka screenshot share | `CameraRoastScreen.js` (`ResultView`) | `react-native-view-shot` + `expo-sharing` |
| Expo Go me crash se bachana | `app/camera.js` | `expo-constants` |

**Flow:**
```
1. Permission (useCameraPermission) → "Turn on camera"
2. <LiveCamera>: ML Kit har frame face dhoondhta hai → onFacesDetected(faces)
      autoMode = face ke coordinates seedha screen pixels me
3. toPlainFace(): native object → plain JS (aankh, naak, muh, smile %, roll, yaw)
4. UI har 100ms update: SVG me filter + violet HUD, upar chips (Smiling / Too close)
5. "Roast My Face" → 3-2-1 (Animated spring) → flash
6. photoOutput.capturePhotoToFile() → photo file
7. Photo pe DOBARA face detection (useImageFaceDetector)
      → filters photo ke apne pixels me lagte hain, isliye bilkul sahi jagah
8. Signals backend ko → /api/camera-roast (photo nahi!)
9. Result: photo + filter + look (Noir/Retro/Thermal) + roast + "Share photo"
```

**Important code (comments ke saath):**
```javascript
// Camera ko memo me rakha hai: faces ki state baar-baar badalti hai,
// par camera dobara render hua to preview reset ho jaata. Isliye props stable rakhe.
const LiveCamera = memo(function LiveCamera({ device, isActive, outputs, onFaces, onError }) {
  return (
    <FaceDetectingCamera
      device={device}            // front camera
      isActive={isActive}        // tab chhoda / app background = camera band
      outputs={outputs}          // photo lene wala output
      autoMode                   // coordinates → screen pixels
      runLandmarks               // aankh, naak, muh ke points
      runClassifications         // smile + aankh khuli ki probability
      onFacesDetected={onFaces}
    />
  );
});

// ML Kit "surprised" nahi deta, to muh kitna khula hai ye landmarks se nikalte hain
function mouthOpenRatio(face) {
  const cornerY = (face.mouthLeft.y + face.mouthRight.y) / 2;
  return (face.mouthBottom.y - cornerY) / face.bounds.height;   // > 0.12 = Shocked
}
```

**Website vs App signals:**

| Signal | Website (MediaPipe) | App (ML Kit) |
|---|---|---|
| Smile | blendshape `mouthSmile` | `smilingProbability` > 0.6 |
| Eyes closed | blendshape `eyeBlink` | eye open probability < 0.25 |
| Shocked | blendshape `jawOpen` | muh ke landmarks se ratio |
| Eyebrows raised | blendshape `browInnerUp` | ❌ (ML Kit nahi deta) |
| Head tilt | aankhon ki line ka angle | `rollAngle` > 12° |
| Looking away | naak vs face center | `yawAngle` > 22° |
| Lighting | video pixels ki brightness | ❌ (hamesha "normal") |

**Expo Go guard (`app/camera.js`):**
```javascript
const isExpoGo = Constants.executionEnvironment === "storeClient";
const nativeSupported = Platform.OS !== "web" && !isExpoGo;
// require() if ke andar: Expo Go me native camera module load hi nahi hota → crash nahi
const CameraRoastScreen = nativeSupported ? require("../components/camera/CameraRoastScreen").default : null;
```
Isliye Camera tab ke liye **development build** chahiye: `npm run build:android` (Android Studio ke saath) ya `eas build --profile development`.

---

## 7. "Ye change karna hai, kahan jaun?" (Quick lookup)

| Kaam | File |
|---|---|
| Naye roast jokes | `backend/app/services/roast_templates.py` |
| Camera roast jokes | `backend/app/services/camera_roast_service.py` |
| ML ko better banana | `python training/generate_examples.py` (naya data) → `python training/train_model.py` (test accuracy print hoti hai) |
| Confidence threshold (40%) | `backend/app/ml/classifier.py` (last lines) |
| Naya API endpoint | `routes/features.py` + `schemas/api.py` + `services/` me logic |
| Website colors / font | `web/src/index.css` (`@theme`) |
| Navbar links | `web/src/components/Navbar.jsx` (`LINKS`) |
| Naya page | `web/src/pages/` me file + `App.jsx` me `<Route>` |
| Face filter ka size/position | Website: `web/src/services/drawFilters.js`, App: `mobile/components/camera/FaceFilterLayer.js` |
| Smile/distance ki sensitivity | Website: `web/src/services/faceSignals.js`, App: `mobile/services/faceSignals.js` |
| App ke colors | `mobile/theme.js` |
| AI on/off ya provider badalna | `backend/.env` → `AI_PROVIDER=nvidia,gemini` / `nvidia` / `none` |
| Photo roast ke rules | `backend/app/services/camera_roast_service.py` → `LOOK_RULES` |
| NVIDIA model badalna | `backend/.env` → `NVIDIA_MODEL` / `NVIDIA_VISION_MODEL` |

---

## 8. Chhoti si Glossary

- **API / Endpoint:** Server ka ek URL jise app call karti hai (jaise `/api/roast`).
- **JSON:** Data bhejne ka format: `{ "key": "value" }`.
- **CORS:** Browser ka security rule. Backend batata hai ki kaunsi website use call kar sakti hai.
- **Pydantic:** Python library jo request ka data check karti hai.
- **TF-IDF:** Text ko numbers me badalne ka tareeka.
- **Logistic Regression:** Simple ML model jo har category ki probability deta hai.
- **Cross-validation:** Model ko us data pe test karna jo usne training me nahi dekha. Imaandaar accuracy.
- **joblib:** Trained model ko file me save/load karna.
- **Hook (React):** `use...` se shuru hone wala function jo state/logic reuse karta hai.
- **Landmarks:** Face ke 478 points (naak, aankh, thodi...).
- **Blendshapes:** Expression scores (0 se 1): kitna smile, kitna muh khula.
- **Canvas:** Browser ki drawing board, jis pe hum video + filters draw karte hain.
- **requestAnimationFrame:** Browser ko bolna "agla frame draw karne se pehle ye function chalao" (smooth animation loop).

---

## 9. Run karne ki yaad (short)

```bash
# Terminal 1 – Backend
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 – Website (Camera Roast: http://localhost:5173/camera)
cd web
npm run dev

# Terminal 3 – Android app
cd mobile
npx expo start              # Expo Go (Camera tab ko chhod ke sab)
npm run build:android       # development build (Camera tab ke saath, Android Studio chahiye)
```

Detailed setup aur deployment `README.md` me hai. Camera ko `localhost` ya `https` pe hi permission milti hai, plain `http://` IP address pe nahi.
