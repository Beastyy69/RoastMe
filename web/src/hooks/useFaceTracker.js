// Camera Roast ka dil: MediaPipe face model load karta hai aur har frame pe
// face detect karke canvas pe video + filter draw karta hai.
import { useEffect, useRef, useState } from "react"; // React hooks
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"; // Google MediaPipe face model
import { buildSignals, measureLighting } from "../services/faceSignals"; // face se signals nikalna
import { drawFrame } from "../services/drawFilters"; // canvas pe filters draw karna

// Model ki files internet se aati hain (pehli baar ~4 MB, phir browser cache karta hai).
// WASM ka version wahi hona chahiye jo package.json me hai.
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm"; // MediaPipe ka engine
const MODEL_URL = // face model file ka address
  import.meta.env.VITE_FACE_MODEL_URL || // .env me diya ho to wo
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"; // warna Google ka default

// Model ek hi baar load ho, chahe page kitni baar khule
let landmarkerPromise = null; // loading ka promise yahan yaad rehta hai
function loadLandmarker() { // model lao (pehli baar download, baad me wahi)
  if (!landmarkerPromise) { // abhi tak load shuru nahi hua?
    landmarkerPromise = FilesetResolver.forVisionTasks(WASM_URL) // pehle engine (WASM) lao
      .then((files) => // engine aa gaya to
        FaceLandmarker.createFromOptions(files, { // face model banao
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" }, // GPU = fast
          runningMode: "VIDEO", // live video mode
          numFaces: 3, // max 3 chehre
          outputFaceBlendshapes: true, // smile, jawOpen jaise expression scores
        }), // createFromOptions band
      ) // then band
      .catch((error) => { // load fail hua
        landmarkerPromise = null; // agli baar dobara try kar sake
        throw error; // error aage bhejo
      }); // catch band
  } // if band
  return landmarkerPromise; // promise wapas
} // function band

/**
 * Har frame pe: face detect karo -> canvas pe video + filter draw karo.
 * Signals (smile, distance...) har 250ms pe React state me update hote hain,
 * har frame pe nahi, warna page slow ho jaata.
 */
export function useFaceTracker({ videoRef, canvasRef, active, filter, grade }) { // hook shuru
  const [modelStatus, setModelStatus] = useState("idle"); // idle | loading | ready | error
  const [signals, setSignals] = useState({ faces: 0 }); // UI chips ke liye signals

  // filter/grade refs me rakhte hain taaki loop restart na ho jab user filter badle
  const optionsRef = useRef({ filter, grade }); // ref banao
  optionsRef.current = { filter, grade }; // har render pe latest value
  const latestRef = useRef({ result: null, signals: { faces: 0 } }); // last frame ka result (photo ke liye)

  useEffect(() => { // active hone pe loop chalao
    if (!active) return; // camera band hai to kuch mat karo
    let cancelled = false; // effect band hua ya nahi
    let frameId = null; // requestAnimationFrame ki id
    let lastSignalsAt = 0; // signals last kab update hue
    let lastLightingAt = 0; // lighting last kab naapi
    let lighting = "normal"; // abhi ki lighting

    setModelStatus("loading"); // "Loading face scanner..." dikhao
    loadLandmarker() // model lao
      .then((landmarker) => { // model ready
        if (cancelled) return; // beech me page chhod diya to ruk jao
        setModelStatus("ready"); // ready

        const loop = (time) => { // har frame chalne wala function
          const video = videoRef.current; // <video> element
          const canvas = canvasRef.current; // <canvas> element
          if (video?.readyState >= 2 && canvas) { // video me frame aa gaya hai?
            // canvas ka size video ke barabar rakho
            if (canvas.width !== video.videoWidth) { // size alag hai?
              canvas.width = video.videoWidth; // width barabar
              canvas.height = video.videoHeight; // height barabar
            } // if band

            const result = landmarker.detectForVideo(video, time); // is frame me face(s) dhoondo

            if (time - lastLightingAt > 1000) { // har 1 second me ek baar
              lighting = measureLighting(video); // lighting naapo
              lastLightingAt = time; // time yaad rakho
            } // if band
            const current = buildSignals(result, lighting); // smile, distance waghaira
            latestRef.current = { result, signals: current }; // photo ke liye save

            drawFrame(canvas.getContext("2d"), video, result, { // canvas pe video + filter
              ...optionsRef.current, // chuna hua filter + color look
              showHud: true, // violet scanner box dikhao
              time, // animation ke liye time
              expression: current.expression, // label pe expression
            }); // drawFrame band

            if (time - lastSignalsAt > 250) { // har 250ms
              setSignals(current); // UI chips update
              lastSignalsAt = time; // time yaad rakho
            } // if band
          } // if band
          frameId = requestAnimationFrame(loop); // agla frame
        }; // loop band
        frameId = requestAnimationFrame(loop); // pehla frame shuru
      }) // then band
      .catch(() => { // model load nahi hua
        if (!cancelled) setModelStatus("error"); // error dikhao
      }); // catch band

    return () => { // cleanup: effect band hone pe
      cancelled = true; // aage ka kaam roko
      if (frameId) cancelAnimationFrame(frameId); // loop roko
    }; // cleanup band
  }, [active, videoRef, canvasRef]); // inme badlav pe dobara chalao

  /** Photo lene ke liye: HUD ke bina frame draw karke image bana do. */
  const captureSnapshot = () => { // "Roast My Face" countdown ke baad
    const video = videoRef.current; // video element
    const { result, signals: current } = latestRef.current; // last frame ka face data
    const makeCanvas = (options) => { // ek naya canvas pe frame draw karne wala helper
      const canvas = document.createElement("canvas"); // naya invisible canvas
      canvas.width = video.videoWidth; // video jitni width
      canvas.height = video.videoHeight; // video jitni height
      drawFrame(canvas.getContext("2d"), video, result, { ...options, showHud: false, time: performance.now() }); // HUD ke bina draw
      return canvas; // canvas wapas
    }; // helper band
    const canvas = makeCanvas(optionsRef.current); // filter + look wali photo (dikhane + poster ke liye)
    const clean = makeCanvas({ filter: "none", grade: "natural" }); // bina filter wali photo (AI ko chehra saaf dikhe)
    return { canvas, clean, signals: current }; // dono photos + signals wapas
  }; // function band

  return { modelStatus, signals, captureSnapshot }; // page ko ye sab do
} // hook band
