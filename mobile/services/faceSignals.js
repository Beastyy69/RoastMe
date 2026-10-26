// ML Kit (Google ka on-device face model) ke result ko simple data me badalna.
// 1) toPlainFace: native object se plain JS object (taaki baad me safely use ho)
// 2) faceGeometry: filters draw karne ke liye aankh, naak, size, angle
// 3) buildSignals: backend ko jaane wale signals (smiling, close, tilted...)

export function toPlainFace(face) { // face = ML Kit ka native object
  const l = face.landmarks ?? {}; // aankh/naak/muh ke points
  const pick = (point) => (point ? { x: point.x, y: point.y } : null); // point copy (na ho to null)
  return { // plain object
    bounds: { x: face.bounds.x, y: face.bounds.y, width: face.bounds.width, height: face.bounds.height }, // face ka dabba
    leftEye: pick(l.LEFT_EYE), // ek aankh
    rightEye: pick(l.RIGHT_EYE), // doosri aankh
    nose: pick(l.NOSE_BASE), // naak ka neeche wala hissa
    mouthLeft: pick(l.MOUTH_LEFT), // muh ka left kona
    mouthRight: pick(l.MOUTH_RIGHT), // muh ka right kona
    mouthBottom: pick(l.MOUTH_BOTTOM), // neeche ka hoth
    smiling: face.smilingProbability ?? 0, // smile ki probability (0-1)
    leftEyeOpen: face.leftEyeOpenProbability ?? 1, // aankh khuli hone ki probability
    rightEyeOpen: face.rightEyeOpenProbability ?? 1, // doosri aankh
    roll: face.rollAngle ?? 0, // sir kitna tedha (degrees)
    yaw: face.yawAngle ?? 0, // sir kitna left/right ghooma (degrees)
    frameWidth: face.frameWidth, // image/frame ki width
    frameHeight: face.frameHeight, // image/frame ki height
  }; // object band
} // function band

/** Filters ke liye face ka size, center aur angle. Landmark na mile to bounds se andaza. */
export function faceGeometry(face) { // plain face se geometry
  const { x, y, width, height } = face.bounds; // dabba
  let a = face.leftEye ?? { x: x + width * 0.3, y: y + height * 0.42 }; // aankh 1 (na mile to andaza)
  let b = face.rightEye ?? { x: x + width * 0.7, y: y + height * 0.42 }; // aankh 2 (na mile to andaza)
  // mirror ki wajah se left/right ulte ho sakte hain, isliye screen pe jo left hai wo pehle
  if (a.x > b.x) [a, b] = [b, a]; // swap

  const angle = Math.atan2(b.y - a.y, b.x - a.x); // radians
  return { // geometry object
    leftEye: a, // screen pe left aankh
    rightEye: b, // screen pe right aankh
    eyeCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, // aankhon ka beech
    eyeDistance: Math.hypot(b.x - a.x, b.y - a.y), // aankhon ki doori
    nose: face.nose ?? { x: x + width / 2, y: y + height * 0.6 }, // naak (na mile to andaza)
    forehead: { x: x + width / 2, y: y + height * 0.08 }, // maatha (dabbe ke upar)
    faceWidth: width, // face ki chaudai
    faceHeight: height, // face ki lambai
    angle, // tedhapan (radians)
    angleDeg: (angle * 180) / Math.PI, // tedhapan (degrees, SVG ke liye)
    box: { x, y, w: width, h: height }, // HUD ke liye dabba
  }; // object band
} // function band

// ML Kit "surprised" nahi batata, to muh kitna khula hai ye landmarks se nikalte hain
function mouthOpenRatio(face) { // 0 = band, zyada = khula
  if (!face.mouthLeft || !face.mouthRight || !face.mouthBottom) return 0; // points nahi to 0
  const cornerY = (face.mouthLeft.y + face.mouthRight.y) / 2; // muh ke kono ki height
  return (face.mouthBottom.y - cornerY) / face.bounds.height; // neeche ka hoth kitna neeche (face ke hisaab se)
} // function band

export function detectExpression(face) { // face se expression
  const eyesOpen = (face.leftEyeOpen + face.rightEyeOpen) / 2; // dono aankhon ka average
  if (eyesOpen < 0.25) return "eyes_closed"; // aankhein band
  if (mouthOpenRatio(face) > 0.12) return "surprised"; // muh khula = shocked
  if (face.smiling > 0.6) return "smiling"; // muskura raha
  return "neutral"; // normal
} // function band

/** previewWidth = camera view ki width (distance nikalne ke liye). */
export function buildSignals(faces, previewWidth) { // saare faces + screen width
  if (!faces.length) return { faces: 0 }; // koi face nahi
  // sabse bada face = main person
  const main = [...faces].sort((p, q) => q.bounds.width - p.bounds.width)[0]; // sabse chauda face
  const widthRatio = previewWidth ? main.bounds.width / previewWidth : 0.4; // screen ka kitna hissa

  return { // signals object
    faces: faces.length, // kitne chehre
    expression: detectExpression(main), // expression
    distance: widthRatio > 0.62 ? "close" : widthRatio < 0.25 ? "far" : "normal", // paas / door / theek
    lighting: "normal", // ML Kit brightness nahi deta; website pe ye video pixels se nikalta hai
    head_tilted: Math.abs(main.roll) > 12, // 12° se zyada = tedha
    looking_away: Math.abs(main.yaw) > 22, // 22° se zyada ghooma = side dekh raha
  }; // object band
} // function band
