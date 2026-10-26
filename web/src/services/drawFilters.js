// Canvas pe face filters draw karne wale functions.
// Video mirror (selfie jaisa) dikhta hai, isliye har point ka x ulta (1 - x) karte hain.

import { POINTS } from "./faceSignals"; // face ke important point numbers

export const COLOR_GRADES = { // poori photo ka color look (CSS filter jaisa)
  natural: "none", // koi effect nahi
  noir: "grayscale(1) contrast(1.25) brightness(1.05)", // black & white film
  retro: "sepia(0.55) saturate(1.4) contrast(1.05) hue-rotate(-12deg)", // purani photo jaisa
  thermal: "invert(1) hue-rotate(180deg) saturate(3) contrast(1.2)", // garmi wala camera jaisa
}; // object band

const EXPRESSION_LABELS = { // HUD label pe dikhne wale words
  smiling: "Smiling", // muskura raha
  neutral: "Neutral", // normal
  surprised: "Shocked", // muh khula
  eyebrows_raised: "Judging", // bhauhein upar
  eyes_closed: "Buffering", // aankhein band
}; // object band

// Normalized point (0-1) ko canvas pixels me badlo (mirror ke saath)
function toPixel(point, width, height) { // point.x/y 0 se 1 ke beech
  return { x: (1 - point.x) * width, y: point.y * height }; // x ulta (mirror), pixel me
} // function band

// Face ka size, center aur rotation, taaki filters face ke saath ghoomein
function faceGeometry(landmarks, width, height) { // 478 points se zaroori naap
  const p = (index) => toPixel(landmarks[index], width, height); // chhota helper: point number → pixel
  const leftEye = p(POINTS.leftEyeOuter); // aankh 1
  const rightEye = p(POINTS.rightEyeOuter); // aankh 2
  const forehead = p(POINTS.foreheadTop); // maatha
  const chin = p(POINTS.chin); // thodi
  const leftCheek = p(POINTS.leftCheek); // gaal 1
  const rightCheek = p(POINTS.rightCheek); // gaal 2

  return { // saari geometry ek object me
    leftEye, // aankh 1 ki position
    rightEye, // aankh 2 ki position
    nose: p(POINTS.noseTip), // naak ki nok
    forehead, // maatha
    eyeCenter: { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 }, // dono aankhon ka beech
    eyeDistance: Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y), // aankhon ki doori (size ke liye)
    faceWidth: Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y), // face ki chaudai
    faceHeight: Math.hypot(chin.x - forehead.x, chin.y - forehead.y), // face ki lambai
    // mirror ki wajah se rightEye screen pe left me hota hai, isliye ulta subtract
    angle: Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x), // sir kitna tedha (radians)
    box: boundingBox(landmarks, width, height), // face ke charon taraf ka dabba
  }; // object band
} // function band

function boundingBox(landmarks, width, height) { // saare points ko gherne wala rectangle
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity; // shuruaati values
  for (const point of landmarks) { // har point
    const { x, y } = toPixel(point, width, height); // pixel me
    minX = Math.min(minX, x); // sabse left
    minY = Math.min(minY, y); // sabse upar
    maxX = Math.max(maxX, x); // sabse right
    maxY = Math.max(maxY, y); // sabse neeche
  } // loop band
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }; // x, y, width, height
} // function band

// Helper: kisi point pe jaake rotate karke draw karo, phir wapas normal
function withRotation(ctx, center, angle, draw) { // draw = asli drawing function
  ctx.save(); // abhi ki settings yaad rakho
  ctx.translate(center.x, center.y); // (0,0) ko center pe le jao
  ctx.rotate(angle); // face ke angle jitna ghumao
  draw(); // ab draw karo (center ke hisaab se)
  ctx.restore(); // settings wapas pehle jaisi
} // function band

function roundedRect(ctx, x, y, w, h, r) { // gol kono wala rectangle ka path
  ctx.beginPath(); // naya path
  ctx.roundRect(x, y, w, h, r); // rounded rectangle
} // function band

// ---------------- Individual filters ----------------

function drawSunglasses(ctx, g) { // 🕶️ Deal With It
  const lensW = g.eyeDistance * 0.62; // lens ki width
  const lensH = lensW * 0.62; // lens ki height
  withRotation(ctx, g.eyeCenter, g.angle, () => { // aankhon ke beech, sir ke angle pe
    const gradient = ctx.createLinearGradient(0, -lensH / 2, 0, lensH / 2); // upar se neeche gradient
    gradient.addColorStop(0, "#1f1b2e"); // upar halka dark
    gradient.addColorStop(1, "#05040a"); // neeche ekdum dark
    ctx.fillStyle = gradient; // lens ka rang
    ctx.strokeStyle = "#0b0b0f"; // frame ka rang
    ctx.lineWidth = lensW * 0.08; // frame ki motai
    for (const side of [-1, 1]) { // left lens (-1) aur right lens (+1)
      roundedRect(ctx, side * g.eyeDistance * 0.36 - lensW / 2, -lensH / 2, lensW, lensH, lensH * 0.35); // lens shape
      ctx.fill(); // lens bharo
      ctx.stroke(); // frame banao
      // halka sa shine, taaki glass real lage
      ctx.fillStyle = "rgba(255,255,255,0.18)"; // halka white
      roundedRect(ctx, side * g.eyeDistance * 0.36 - lensW * 0.35, -lensH * 0.35, lensW * 0.3, lensH * 0.16, 4); // chhoti chamak
      ctx.fill(); // chamak bharo
      ctx.fillStyle = gradient; // agle lens ke liye rang wapas
    } // loop band
    // beech ka bridge
    ctx.fillStyle = "#0b0b0f"; // dark
    ctx.fillRect(-g.eyeDistance * 0.08, -lensH * 0.3, g.eyeDistance * 0.16, lensH * 0.14); // naak ke upar ki patti
  }); // withRotation band
} // function band

function drawCrown(ctx, g) { // 👑 Royal Delusion
  const w = g.faceWidth * 0.75; // taj ki width
  const h = w * 0.5; // taj ki height
  // forehead (landmark 10) ke thik upar baithe, face ke angle ke hisaab se
  const lift = h * 0.45 + g.faceHeight * 0.03; // maathe se kitna upar
  const center = { x: g.forehead.x + Math.sin(g.angle) * lift, y: g.forehead.y - Math.cos(g.angle) * lift }; // tedhe sir ke hisaab se "upar"
  withRotation(ctx, center, g.angle, () => { // sir ke angle pe ghumao
    const gradient = ctx.createLinearGradient(0, -h / 2, 0, h / 2); // sone jaisa gradient
    gradient.addColorStop(0, "#fde68a"); // upar halka sona
    gradient.addColorStop(1, "#d97706"); // neeche gehra sona
    ctx.fillStyle = gradient; // rang lagao
    ctx.beginPath(); // taj ka shape shuru
    ctx.moveTo(-w / 2, h / 2); // neeche left
    ctx.lineTo(-w / 2, -h / 4); // left nok
    ctx.lineTo(-w / 4, h / 8); // beech ka gaddha
    ctx.lineTo(0, -h / 2); // beech ki unchi nok
    ctx.lineTo(w / 4, h / 8); // doosra gaddha
    ctx.lineTo(w / 2, -h / 4); // right nok
    ctx.lineTo(w / 2, h / 2); // neeche right
    ctx.closePath(); // shape band
    ctx.fill(); // bharo
    ctx.strokeStyle = "rgba(120,53,15,0.6)"; // brown border
    ctx.lineWidth = 2; // patli line
    ctx.stroke(); // border banao
    // jewels
    for (const [x, color] of [[-w / 4, "#a78bfa"], [0, "#f43f5e"], [w / 4, "#a78bfa"]]) { // 3 heere: violet, laal, violet
      ctx.fillStyle = color; // heere ka rang
      ctx.beginPath(); // naya circle
      ctx.arc(x, h / 4, w * 0.045, 0, Math.PI * 2); // gol heera
      ctx.fill(); // bharo
    } // loop band
  }); // withRotation band
} // function band

function drawClown(ctx, g) { // 🤡 Clown Mode
  const r = g.eyeDistance * 0.2; // naak ka radius
  const gradient = ctx.createRadialGradient(g.nose.x - r * 0.3, g.nose.y - r * 0.3, r * 0.1, g.nose.x, g.nose.y, r); // 3D gend jaisa
  gradient.addColorStop(0, "#fca5a5"); // beech me halka laal (chamak)
  gradient.addColorStop(1, "#dc2626"); // kinare gehra laal
  ctx.fillStyle = gradient; // rang lagao
  ctx.beginPath(); // naya circle
  ctx.arc(g.nose.x, g.nose.y, r, 0, Math.PI * 2); // naak pe gol
  ctx.fill(); // bharo
  // gaalon pe lali
  ctx.fillStyle = "rgba(244,63,94,0.28)"; // halka gulabi
  for (const eye of [g.leftEye, g.rightEye]) { // dono aankhon ke neeche
    ctx.beginPath(); // naya oval
    ctx.ellipse(eye.x, eye.y + g.eyeDistance * 0.45, r * 1.1, r * 0.75, 0, 0, Math.PI * 2); // gaal pe oval
    ctx.fill(); // bharo
  } // loop band
} // function band

function drawDevilHorns(ctx, g) { // 😈 Lil Devil
  const size = g.faceWidth * 0.3; // seeng ka size
  const lift = g.faceHeight * 0.06; // maathe se thoda upar
  const base = { x: g.forehead.x + Math.sin(g.angle) * lift, y: g.forehead.y - Math.cos(g.angle) * lift }; // seengon ka base
  withRotation(ctx, base, g.angle, () => { // sir ke angle pe
    const gradient = ctx.createLinearGradient(0, -size, 0, 0); // upar se neeche
    gradient.addColorStop(0, "#fb7185"); // nok pe halka laal
    gradient.addColorStop(1, "#be123c"); // neeche gehra laal
    ctx.fillStyle = gradient; // rang lagao
    for (const side of [-1, 1]) { // left aur right seeng
      const x = side * g.faceWidth * 0.28; // center se kitna side
      ctx.beginPath(); // naya shape
      ctx.moveTo(x - size * 0.35, 0); // base ka left
      ctx.quadraticCurveTo(x + side * size * 0.1, -size * 0.6, x + side * size * 0.45, -size * 1.15); // bahar ki curve, nok tak
      ctx.quadraticCurveTo(x + side * size * 0.15, -size * 0.35, x + size * 0.35, 0); // andar ki curve, base tak
      ctx.closePath(); // shape band
      ctx.fill(); // bharo
    } // loop band
  }); // withRotation band
} // function band

function drawNpcScanner(ctx, g, time) { // 🤖 NPC Scanner
  const { x, y, w, h } = g.box; // face ka dabba
  // upar-niche chalti hui scan line
  const progress = (Math.sin(time / 600) + 1) / 2; // 0 se 1 ke beech aage-peeche
  const scanY = y + progress * h; // line ki height position
  const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 2); // fade hoti green patti
  gradient.addColorStop(0, "rgba(52,211,153,0)"); // upar transparent
  gradient.addColorStop(1, "rgba(52,211,153,0.55)"); // neeche green
  ctx.fillStyle = gradient; // rang lagao
  ctx.fillRect(x, scanY - 20, w, 22); // patti banao
  label(ctx, "NPC #0427 · 3 dialogue lines", x - 14, y - 52, "#34d399"); // upar green label
} // function band

function drawFlames(ctx, g, time) { // 🔥 On Fire
  const count = 5; // 5 aag ke emoji
  const size = g.faceWidth * 0.26; // emoji ka size
  ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; // emoji wala font
  ctx.textAlign = "center"; // beech se align
  for (let i = 0; i < count; i++) { // har emoji
    const offset = (i - (count - 1) / 2) * size * 0.8; // left se right faila do
    const bounce = Math.sin(time / 180 + i) * size * 0.12; // upar-neeche uchhalna
    ctx.fillText("🔥", g.forehead.x + offset, g.forehead.y - g.faceHeight * 0.08 + bounce); // sir ke upar likho
  } // loop band
} // function band

// Har face ke around violet corner brackets + expression label (professional HUD look)
function drawHud(ctx, g, expressionText) { // scanner wala look
  const { x, y, w, h } = g.box; // face ka dabba
  const pad = 14; // face se thoda bahar
  const len = Math.min(w, h) * 0.18; // corner line ki lambai
  ctx.strokeStyle = "rgba(167,139,250,0.95)"; // violet
  ctx.lineWidth = 3; // motai
  ctx.lineCap = "round"; // gol sire
  const corners = [ // 4 kone: (x, y, x-direction, y-direction)
    [x - pad, y - pad, 1, 1], // upar left
    [x + w + pad, y - pad, -1, 1], // upar right
    [x - pad, y + h + pad, 1, -1], // neeche left
    [x + w + pad, y + h + pad, -1, -1], // neeche right
  ]; // list band
  for (const [cx, cy, dx, dy] of corners) { // har kona
    ctx.beginPath(); // naya path
    ctx.moveTo(cx, cy + dy * len); // khadi line ka sira
    ctx.lineTo(cx, cy); // kone tak
    ctx.lineTo(cx + dx * len, cy); // leti line
    ctx.stroke(); // banao
  } // loop band
  // label face ke neeche, taaki crown/horns jaise filters ko na chhupaye
  if (expressionText) label(ctx, expressionText, x - pad, y + h + pad + 8, "#c4b5fd"); // "Smiling" jaisa label
} // function band

function label(ctx, text, x, y, color) { // dark pill me text
  ctx.font = "600 15px Inter, system-ui, sans-serif"; // font
  ctx.textAlign = "left"; // left se likho
  const width = ctx.measureText(text).width + 20; // text ki width + padding
  ctx.fillStyle = "rgba(10,10,11,0.72)"; // halka transparent black
  roundedRect(ctx, x, y, width, 26, 13); // pill shape
  ctx.fill(); // bharo
  ctx.fillStyle = color; // text ka rang
  ctx.fillText(text, x + 10, y + 18); // text likho
} // function band

const FILTER_DRAWERS = { // filter naam → drawing function
  sunglasses: drawSunglasses, // chashma
  crown: drawCrown, // taj
  clown: drawClown, // clown
  devil: drawDevilHorns, // seeng
  npc: drawNpcScanner, // scanner
  flames: drawFlames, // aag
}; // object band

/**
 * Ek frame poora draw karo: video (color grade ke saath) + har face pe filter + HUD.
 * showHud=false snapshot ke liye use hota hai, taaki photo clean aaye.
 */
export function drawFrame(ctx, video, result, { filter, grade, showHud, time, expression }) { // main drawing function
  const { width, height } = ctx.canvas; // canvas ka size

  // 1) Video ko mirror karke draw karo (selfie view)
  ctx.save(); // settings yaad rakho
  ctx.filter = COLOR_GRADES[grade] ?? "none"; // color look lagao
  ctx.translate(width, 0); // right side pe jao
  ctx.scale(-1, 1); // ulta karo (mirror)
  ctx.drawImage(video, 0, 0, width, height); // video ka frame draw
  ctx.restore(); // settings wapas (filter + mirror hata)

  // 2) Har detected face pe filter + HUD
  const faces = result?.faceLandmarks ?? []; // saare faces
  faces.forEach((landmarks, index) => { // har face
    const geometry = faceGeometry(landmarks, width, height); // size/angle nikaalo
    FILTER_DRAWERS[filter]?.(ctx, geometry, time); // chuna hua filter draw (none ho to kuch nahi)
    if (showHud) { // live view hai?
      drawHud(ctx, geometry, index === 0 ? EXPRESSION_LABELS[expression] : null); // scanner box (label sirf pehle face pe)
    } // if band
  }); // forEach band
} // function band
