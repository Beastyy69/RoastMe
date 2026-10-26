# RoastMe AI

A playful comedy app: a **React website** (`web/`) and a **native Android app** built with Expo (`mobile/`), both using one **FastAPI backend** (`backend/`) that includes a small, real **scikit-learn** classifier.

## Architecture

```
web (React + Vite + Tailwind + Motion) ─┐
                                        ├──> FastAPI backend ──> ML classifier (TF-IDF + Logistic Regression, joblib)
mobile (Expo + React Native)  ──────────┘           │          Comedy writer (NVIDIA → Gemini, or local templates)
                                                    └────────> History (MongoDB if configured, otherwise in memory)
```

The ML part and the comedy part are separate. The classifier only predicts a **topic** (student life, procrastination, gaming, productivity, general). It returns its probability, and if that probability is under 40% the API falls back to a neutral category. The jokes come from an AI provider (NVIDIA Nemotron first, Gemini as backup), or from hand-written templates when no AI is available. Heat rating and NPC score are simple formulas for fun, and the UI labels them that way.

**NPC Meter** (`/npc`, plus the NPC tab). Every quiz is new: the AI writes 6 questions on 6 random topics, each with 4 answers that carry hidden NPC points (0 = main character, 3 = background NPC). The points stay on the server under a `quiz_id`, so the answer key never reaches the browser. When you finish, the server adds up the points into a 0–100 NPC score and the AI writes a roast that quotes your actual answers. If the AI is down, 6 questions are picked at random from a built-in bank of 16 and the roast falls back to a short line for your rank. Writing a quiz takes about 5–15 seconds.

**Camera Roast** (website at `/camera`, plus a Camera tab in the Android app). With the **Roast my look** switch on (the default), one small JPEG of the frame, without filters, goes to the backend and on to NVIDIA Nemotron, or Gemini as a fallback. They roast visible choices (hair, outfit, room, pose, expression) under strict rules: nothing about skin, race, body, facial features, age, gender, disability or religion, and the photo is never stored. With the switch off, only face signals are sent. MediaPipe Face Landmarker runs in the browser and adds live AR filters (sunglasses, crown, clown nose, devil horns, NPC scanner, flames) plus colour grades. Only detected signals such as expression, distance and lighting go to `POST /api/camera-roast`. The image itself never leaves the device. The face model (~4 MB) loads from Google's CDN on first use, so the page needs internet, and the camera only works on `localhost` or `https`.

In the Android app, the Camera tab uses VisionCamera with the Google ML Kit face detector, which runs on the phone. It has the same six filters, drawn with react-native-svg, and photo looks are applied with SVG colour matrices. These are native modules, so **the Camera tab needs a development build** (see below). In Expo Go it shows a message instead of crashing, and every other tab still works.

New to the code? Read [UNDERSTAND.md](UNDERSTAND.md) for a simple Hinglish walkthrough of every part.

## Prerequisites (Windows)

- Python 3.10+ (tested with 3.14), Node.js 20+ (tested with 24), Git, VS Code
- For Android: the **Expo Go** app on your phone, or Android Studio with an emulator

## 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python training/train_model.py
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/health. Both models should show `"loaded": true`. Interactive API docs are at http://localhost:8000/docs.

Endpoints: `GET /`, `GET /health`, `POST /api/roast`, `POST /api/camera-roast`, `GET /api/npc/questions` (new AI quiz + `quiz_id`), `POST /api/npc` (`quiz_id` + answers), `POST /api/predict-category`, `GET|DELETE /api/history?client_id=…`, `DELETE /api/history/{id}?client_id=…`.

## 2. Website

```bash
cd web
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. `VITE_API_URL` in `web/.env` points at the backend.

## 3. Android app (Expo)

```bash
cd mobile
npm install
copy .env.example .env
npx expo start
```

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` before starting:
- Android emulator: `http://10.0.2.2:8000`
- Physical phone (same Wi-Fi): `http://<your-PC-LAN-IP>:8000` (find the IP with `ipconfig`). Start the backend with `uvicorn app.main:app --host 0.0.0.0 --port 8000` and allow Python through Windows Firewall.

Then press `a` for the emulator, or scan the QR code with Expo Go.

**Camera tab (development build).** Expo Go can't load the native camera and ML Kit modules. Build the app once:
- Locally: install Android Studio (SDK + an emulator, or a USB phone with USB debugging), then run `npm run build:android` (`expo run:android`) inside `mobile/`.
- Or in the cloud: `eas build -p android --profile development`. Install the APK, then `npx expo start --dev-client`.

After that, JavaScript changes hot-reload as usual. You only need to rebuild when you add native packages.

## Testing the connection

1. `curl http://localhost:8000/health`
2. On the website, generate a roast. The result card shows the ML prediction and says "Comedy text written by local templates".
3. On the How It Works page, the live model status comes from `/health`.
4. In the app, generate a roast, then open the History tab.

## Configuration (`backend/.env`)

| Variable | Purpose |
|---|---|
| `CORS_ORIGINS` | Comma-separated website origins allowed to call the API |
| `AI_PROVIDER` | `none` (free local templates, the default), or a comma list tried in order, e.g. `nvidia,gemini`. Options: `nvidia`, `gemini` |
| `NVIDIA_API_KEY` / `NVIDIA_MODEL` / `NVIDIA_VISION_MODEL` | For `nvidia` (NVIDIA NIM, key from https://build.nvidia.com). The default `nvidia/nemotron-3.5-super-vl-120b-a12b` reads photos too and replied in 1 to 2 seconds in testing, with its thinking step turned off. Both settings take a comma list of models tried in order; by default a backup model (Nemotron 3.5 Lightning for text, Nemotron 3 Nano Omni for photos) covers the free endpoint's occasional 500 errors and stalls. Free-tier limits change, so check NVIDIA's current terms |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | For `gemini`. Get a key at https://aistudio.google.com/apikey. The default `gemini-3.5-flash-lite` replied in about 1 second in testing; full Flash models took 40 to 150 seconds. Free-tier limits change, so check Google's current pricing |
| `MONGODB_URI` / `MONGODB_DB` | Optional MongoDB Atlas history. Empty = in-memory history (lost on restart) |
| `RATE_LIMIT_PER_MINUTE` | AI requests (POSTs and new quizzes) per IP per minute |

API keys stay on the server and are never sent to the website or app. If every AI provider fails (bad key, limits, timeout), the app silently falls back to local templates and the built-in question bank. `GEMINI_API_KEY` can also come from a normal environment variable, which wins over an empty value in `.env`.

## ML details and limitations

- **Training data:** `backend/training/generated_examples.json`, 1,134 lines written by NVIDIA Nemotron with `training/generate_examples.py` (8 writer personas per topic, one shared set of tie-break rules). It is AI-written, **not** real user data.
- **Test data:** `backend/training/dataset.json`, 150 hand-written lines (30 per topic). The model never trains on them. Generated lines too similar to them were removed, so the test can't leak.
- **Accuracy on that test set: 78.7%** (chance is 20%). By topic: gaming 97%, student life 93%, general 80%, productivity 70%, procrastination 53%. The earlier model, trained on the 150 hand-written lines alone, scored about 49% in cross-validation.
- Procrastination is the weak spot: lines like "I set ten alarms and snooze all of them" get mistaken for general life, because the model matches words, not meaning.
- It only predicts the roast **topic**. It does not write jokes, does not understand personality and cannot measure how "roastable" anyone is.
- To change the data: run `python training/generate_examples.py` (needs `NVIDIA_API_KEY`), then `python training/train_model.py`. The training script prints the test accuracy every time.

## Deployment

**Backend (e.g. Render, Railway, Fly.io).** These need an account. Free tiers change and may sleep or be removed, so check the current pricing.
- Root directory: `backend`
- Build command: `pip install -r requirements.txt && python training/train_model.py`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set the environment variables in the host's dashboard, and set `CORS_ORIGINS` to your Vercel URL.

**Website on Vercel** (account required): import the repo, set Root Directory to `web`, and set `VITE_API_URL=https://your-backend-url`. `web/vercel.json` already handles SPA routing.

**MongoDB Atlas (optional):** create a cluster and a database user, allow your host's IPs, then set `MONGODB_URI`.

**Android APK with EAS** (Expo account required; build quotas apply):
```bash
cd mobile
npm install -g eas-cli
eas login
eas build:configure
```
In `eas.json`, add a profile with `"android": { "buildType": "apk" }` and `"env": { "EXPO_PUBLIC_API_URL": "https://your-backend-url" }`. Then run `eas build -p android --profile <name>`, download the APK from the link, and install it on your phone (allow "install unknown apps"). Release builds block plain `http://`, so use your HTTPS backend URL.

**Secrets:** never commit `.env` files. Only `VITE_*` / `EXPO_PUBLIC_*` values reach clients, so never put keys in them.

## Troubleshooting

- **"Can't reach the RoastMe server"**: is the backend running? Is the API URL correct? Phones can't use `localhost`.
- **CORS error in the browser**: add the site's origin to `CORS_ORIGINS` and restart the backend.
- **Model not loaded / version warning**: run `python training/train_model.py` again with the same scikit-learn version.
- **`npm install` ERESOLVE in mobile**: use `npx expo install <pkg>` so the versions match Expo SDK 58.
- **PowerShell won't activate the venv**: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
