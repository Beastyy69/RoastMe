// MediaPipe ke face result se simple "signals" nikalte hain (smile, distance, tilt...).
// Yahi signals backend ko jaate hain. Photo kabhi upload nahi hoti.

// MediaPipe face mesh ke kuch fixed landmark numbers (468 points me se)
export const POINTS = { // naam → point number
  noseTip: 1, // naak ki nok
  foreheadTop: 10, // maathe ka upar wala point
  chin: 152, // thodi
  leftEyeOuter: 33, // ek aankh ka bahar wala kona
  rightEyeOuter: 263, // doosri aankh ka bahar wala kona
  leftCheek: 234, // ek gaal ka kinara
  rightCheek: 454, // doosre gaal ka kinara
}; // object band

// Blendshapes = model ka andaza ki face ka koi hissa kitna move hua (0 se 1)
function blendshapeMap(blendshapes) { // list ko { naam: score } object me badlo
  const map = {}; // khaali object
  for (const item of blendshapes?.categories ?? []) map[item.categoryName] = item.score; // har item ka score daalo
  return map; // jaise { mouthSmileLeft: 0.8, jawOpen: 0.1, ... }
} // function band

// Expression decide karo. Order important hai: pehle strong signals check karte hain.
export function detectExpression(blendshapes) { // pehle face ke blendshapes
  const b = blendshapeMap(blendshapes); // aasaan object
  const smile = ((b.mouthSmileLeft ?? 0) + (b.mouthSmileRight ?? 0)) / 2; // dono taraf ki smile ka average
  const blink = ((b.eyeBlinkLeft ?? 0) + (b.eyeBlinkRight ?? 0)) / 2; // dono aankhon ka blink average

  if (blink > 0.6) return { expression: "eyes_closed", score: blink }; // aankhein band
  if ((b.jawOpen ?? 0) > 0.35) return { expression: "surprised", score: b.jawOpen }; // muh khula = shocked
  if (smile > 0.45) return { expression: "smiling", score: smile }; // muskura raha
  if ((b.browInnerUp ?? 0) > 0.5) return { expression: "eyebrows_raised", score: b.browInnerUp }; // bhauhein upar
  return { expression: "neutral", score: 1 - Math.max(smile, b.jawOpen ?? 0) }; // kuch nahi = neutral
} // function band

// Face kitni badi dikh rahi hai = camera se kitna door/paas
export function detectDistance(landmarks) { // face ke points
  const width = Math.abs(landmarks[POINTS.rightCheek].x - landmarks[POINTS.leftCheek].x); // gaal se gaal (0-1 me)
  if (width > 0.45) return "close"; // screen ka 45% se zyada = bahut paas
  if (width < 0.18) return "far"; // 18% se kam = bahut door
  return "normal"; // beech me = theek
} // function band

// Dono aankhon ki line kitni tedhi hai (degrees me)
export function headRollDegrees(landmarks) { // face ke points
  const a = landmarks[POINTS.leftEyeOuter]; // ek aankh
  const b = landmarks[POINTS.rightEyeOuter]; // doosri aankh
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI; // line ka angle, radians → degrees
} // function band

// Nose agar face ke center se kaafi side me hai to banda side dekh raha hai
export function isLookingAway(landmarks) { // face ke points
  const left = landmarks[POINTS.leftCheek]; // ek gaal
  const right = landmarks[POINTS.rightCheek]; // doosra gaal
  const middle = (left.x + right.x) / 2; // face ka center
  const width = Math.abs(right.x - left.x) || 1; // face ki width (0 se divide na ho)
  return Math.abs(landmarks[POINTS.noseTip].x - middle) / width > 0.18; // naak 18% se zyada side me = side dekh raha
} // function band

// Video ka chhota sa copy bana ke average brightness nikalte hain (0-255)
const sampler = typeof document !== "undefined" ? document.createElement("canvas") : null; // chhota hidden canvas
export function measureLighting(video) { // video element
  if (!sampler || !video.videoWidth) return "normal"; // video ready nahi
  sampler.width = 32; // bahut chhoti image (fast)
  sampler.height = 24; // 32×24 pixels
  const ctx = sampler.getContext("2d", { willReadFrequently: true }); // pixels padhne layak context
  ctx.drawImage(video, 0, 0, 32, 24); // video ka chhota copy
  const { data } = ctx.getImageData(0, 0, 32, 24); // saare pixels (R,G,B,A,...)
  let total = 0; // brightness ka total
  for (let i = 0; i < data.length; i += 4) total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; // har pixel ki brightness jodo
  const average = total / (data.length / 4); // average brightness
  if (average < 60) return "dark"; // andhera
  if (average > 200) return "bright"; // bahut roshni
  return "normal"; // theek
} // function band

// Sab signals ek object me. Pehla (sabse bada) face main maana jaata hai.
export function buildSignals(result, lighting) { // MediaPipe result + lighting
  const faces = result?.faceLandmarks ?? []; // saare faces ke points
  if (!faces.length) return { faces: 0 }; // koi face nahi

  const main = faces[0]; // pehla face
  const { expression, score } = detectExpression(result.faceBlendshapes?.[0]); // uska expression
  return { // signals object
    faces: faces.length, // kitne chehre
    expression, // smiling / neutral / ...
    expressionScore: score, // kitna pakka
    distance: detectDistance(main), // close / normal / far
    lighting, // dark / normal / bright
    head_tilted: Math.abs(headRollDegrees(main)) > 12, // 12° se zyada = tedha
    looking_away: isLookingAway(main), // side dekh raha?
  }; // object band
} // function band
