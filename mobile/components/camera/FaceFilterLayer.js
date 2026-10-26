// Face filters ko SVG shapes se draw karta hai (website wale canvas filters ka mobile version).
// Ek hi component do jagah use hota hai:
//   - live camera ke upar (screen coordinates)
//   - photo ke upar (photo ke coordinates, viewBox ke andar)

import { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg"; // SVG shapes
import { faceGeometry } from "../../services/faceSignals"; // face se size/angle

export const FILTERS = [ // filter list (camera screen ka picker isse banta hai)
  { value: "none", label: "Clean", emoji: "✨" }, // koi filter nahi
  { value: "sunglasses", label: "Deal With It", emoji: "🕶️" }, // chashma
  { value: "crown", label: "Royal Delusion", emoji: "👑" }, // taj
  { value: "clown", label: "Clown Mode", emoji: "🤡" }, // clown naak
  { value: "devil", label: "Lil Devil", emoji: "😈" }, // seeng
  { value: "npc", label: "NPC Scanner", emoji: "🤖" }, // scanner
  { value: "flames", label: "On Fire", emoji: "🔥" }, // aag
]; // list band

const EXPRESSION_LABELS = { // HUD label ke words
  smiling: "Smiling", // muskura raha
  neutral: "Neutral", // normal
  surprised: "Shocked", // muh khula
  eyes_closed: "Buffering", // aankhein band
}; // object band

// Gradients ek baar define, sab filters inko id se use karte hain
export function FilterGradients() { // <Svg> ke andar sabse pehle lagao
  return ( // JSX shuru
    // definitions
    <Defs>
      {/* chashme ke lens: upar halka, neeche dark */}
      <LinearGradient id="lens" x1="0" y1="0" x2="0" y2="1">
        {/* upar */}
        <Stop offset="0" stopColor="#1f1b2e" />
        {/* neeche */}
        <Stop offset="1" stopColor="#05040a" />
        {/* lens band */}
      </LinearGradient>
      {/* taj ka sona */}
      <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
        {/* halka sona */}
        <Stop offset="0" stopColor="#fde68a" />
        {/* gehra sona */}
        <Stop offset="1" stopColor="#d97706" />
        {/* gold band */}
      </LinearGradient>
      {/* seengon ka laal */}
      <LinearGradient id="horn" x1="0" y1="0" x2="0" y2="1">
        {/* nok pe halka */}
        <Stop offset="0" stopColor="#fb7185" />
        {/* neeche gehra */}
        <Stop offset="1" stopColor="#be123c" />
        {/* horn band */}
      </LinearGradient>
      {/* clown naak (3D gend jaisi) */}
      <RadialGradient id="nose" cx="40%" cy="35%" r="65%">
        {/* chamak */}
        <Stop offset="0" stopColor="#fca5a5" />
        {/* kinare gehra laal */}
        <Stop offset="1" stopColor="#dc2626" />
        {/* nose band */}
      </RadialGradient>
      {/* NPC scan line (green fade) */}
      <LinearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
        {/* upar transparent */}
        <Stop offset="0" stopColor="#34d399" stopOpacity="0" />
        {/* neeche green */}
        <Stop offset="1" stopColor="#34d399" stopOpacity="0.55" />
        {/* scan band */}
      </LinearGradient>
      {/* Defs band */}
    </Defs>
  ); // JSX band
} // component band

// Face ke angle ke hisaab se ghuma ke draw karo (center point ke around)
function Rotated({ g, center, children }) { // g = geometry
  return <G transform={`translate(${center.x} ${center.y}) rotate(${g.angleDeg})`}>{children}</G>; // center pe le jao + ghumao
} // component band

// "Upar" ki direction me kisi point ko shift karna (face tedha ho to bhi sahi jagah)
function lifted(point, g, distance) { // point ko distance jitna "upar"
  return { x: point.x + Math.sin(g.angle) * distance, y: point.y - Math.cos(g.angle) * distance }; // tedhe sir ka upar
} // function band

function Sunglasses({ g }) { // 🕶️ chashma
  const lensW = g.eyeDistance * 0.95; // lens ki width
  const lensH = lensW * 0.62; // lens ki height
  const gap = g.eyeDistance * 0.5; // center se lens tak (aankh ki position)
  return ( // JSX shuru
    // aankhon ke beech, sir ke angle pe
    <Rotated g={g} center={g.eyeCenter}>
      {/* left (-1) aur right (+1) lens */}
      {[-1, 1].map((side) => (
        // ek lens ka group
        <G key={side}>
          {/* lens */}
          <Rect
            x={side * gap - lensW / 2} // left/right position
            y={-lensH / 2} // beech me
            width={lensW} // width
            height={lensH} // height
            rx={lensH * 0.35} // gol kone
            fill="url(#lens)" // gradient
            stroke="#0b0b0f" // frame
            strokeWidth={lensW * 0.07} // frame ki motai
          // self-closing tag yahin band
          />
          {/* chamak ki patli patti */}
          <Rect x={side * gap - lensW * 0.35} y={-lensH * 0.35} width={lensW * 0.3} height={lensH * 0.16} rx={3} fill="rgba(255,255,255,0.18)" />
          {/* lens group band */}
        </G>
        // map band
      ))}
      {/* naak ke upar bridge */}
      <Rect x={-gap * 0.25} y={-lensH * 0.3} width={gap * 0.5} height={lensH * 0.14} fill="#0b0b0f" />
      {/* Rotated band */}
    </Rotated>
  ); // JSX band
} // component band

function Crown({ g }) { // 👑 taj
  const w = g.faceWidth * 0.72; // width
  const h = w * 0.5; // height
  const center = lifted(g.forehead, g, h * 0.55); // maathe ke upar
  const d = `M ${-w / 2} ${h / 2} L ${-w / 2} ${-h / 4} L ${-w / 4} ${h / 8} L 0 ${-h / 2} L ${w / 4} ${h / 8} L ${w / 2} ${-h / 4} L ${w / 2} ${h / 2} Z`; // taj ka shape (3 noke)
  return ( // JSX shuru
    // sir ke angle pe
    <Rotated g={g} center={center}>
      {/* taj */}
      <Path d={d} fill="url(#gold)" stroke="rgba(120,53,15,0.6)" strokeWidth={2} />
      {/* 3 heere */}
      {[[-w / 4, "#a78bfa"], [0, "#f43f5e"], [w / 4, "#a78bfa"]].map(([x, color]) => (
        // ek heera
        <Circle key={x} cx={x} cy={h / 4} r={w * 0.045} fill={color} />
        // map band
      ))}
      {/* Rotated band */}
    </Rotated>
  ); // JSX band
} // component band

function Clown({ g }) { // 🤡 clown
  const r = g.eyeDistance * 0.32; // naak ka radius
  return ( // JSX shuru
    // group
    <G>
      {/* dono gaalon pe gulabi lali */}
      {[g.leftEye, g.rightEye].map((eye, i) => (
        // ek gaal
        <Ellipse key={i} cx={eye.x} cy={eye.y + g.eyeDistance * 0.6} rx={r * 1.1} ry={r * 0.75} fill="rgba(244,63,94,0.28)" />
        // map band
      ))}
      {/* laal naak */}
      <Circle cx={g.nose.x} cy={g.nose.y - r * 0.3} r={r} fill="url(#nose)" />
      {/* group band */}
    </G>
  ); // JSX band
} // component band

function DevilHorns({ g }) { // 😈 seeng
  const size = g.faceWidth * 0.3; // seeng ka size
  const base = lifted(g.forehead, g, g.faceHeight * 0.02); // maathe ke thoda upar
  const horn = (side) => { // ek seeng ka path banao
    const x = side * g.faceWidth * 0.28; // center se kitna side
    return `M ${x - size * 0.35} 0 Q ${x + side * size * 0.1} ${-size * 0.6} ${x + side * size * 0.45} ${-size * 1.15} Q ${x + side * size * 0.15} ${-size * 0.35} ${x + size * 0.35} 0 Z`; // curved seeng
  }; // function band
  return ( // JSX shuru
    // sir ke angle pe
    <Rotated g={g} center={base}>
      {/* left seeng */}
      <Path d={horn(-1)} fill="url(#horn)" />
      {/* right seeng */}
      <Path d={horn(1)} fill="url(#horn)" />
      {/* Rotated band */}
    </Rotated>
  ); // JSX band
} // component band

function NpcScanner({ g, progress }) { // 🤖 scanner
  const { x, y, w, h } = g.box; // face ka dabba
  const scanY = y + progress * h; // scan line ki height
  return ( // JSX shuru
    // group
    <G>
      {/* green scan patti */}
      <Rect x={x} y={scanY - 20} width={w} height={22} fill="url(#scan)" />
      {/* upar green label */}
      <Label text="NPC #0427 · 3 dialogue lines" x={x - 10} y={y - 44} color="#34d399" scale={g.labelScale} />
      {/* group band */}
    </G>
  ); // JSX band
} // component band

function Flames({ g, progress }) { // 🔥 aag
  const size = g.faceWidth * 0.24; // emoji size
  return ( // JSX shuru
    // group
    <G>
      {/* 5 emoji */}
      {[0, 1, 2, 3, 4].map((i) => {
        const bounce = Math.sin(progress * Math.PI * 4 + i) * size * 0.12; // upar-neeche uchhalna
        return ( // emoji lautao
          // sir ke upar emoji (left se right)
          <SvgText key={i} x={g.forehead.x + (i - 2) * size * 0.8} y={g.forehead.y - g.faceHeight * 0.02 + bounce} fontSize={size} textAnchor="middle">
            {/* aag emoji */}
            🔥
            {/* SvgText band */}
          </SvgText>
        ); // return band
        // map function band
      })}
      {/* group band */}
    </G>
  ); // JSX band
} // component band

// Violet corner brackets (professional "scanner" jaisa look)
function Hud({ g, expression }) { // HUD
  const { x, y, w, h } = g.box; // face ka dabba
  const pad = 10; // face se bahar
  const len = Math.min(w, h) * 0.18; // corner line ki lambai
  const corners = [ // 4 kone (x, y, x-direction, y-direction)
    [x - pad, y - pad, 1, 1], // upar left
    [x + w + pad, y - pad, -1, 1], // upar right
    [x - pad, y + h + pad, 1, -1], // neeche left
    [x + w + pad, y + h + pad, -1, -1], // neeche right
  ]; // list band
  return ( // JSX shuru
    // group
    <G>
      {/* har kona */}
      {corners.map(([cx, cy, dx, dy], i) => (
        // L-shape line
        <Path
          key={i} // key
          d={`M ${cx} ${cy + dy * len} L ${cx} ${cy} L ${cx + dx * len} ${cy}`} // khadi + leti line
          stroke="rgba(167,139,250,0.95)" // violet
          strokeWidth={3} // motai
          strokeLinecap="round" // gol sire
          fill="none" // andar khaali
        // self-closing tag yahin band
        />
        // map band
      ))}
      {/* face ke neeche expression label */}
      {expression && <Label text={EXPRESSION_LABELS[expression]} x={x - pad} y={y + h + pad + 8} color="#c4b5fd" scale={g.labelScale} />}
      {/* group band */}
    </G>
  ); // JSX band
} // component band

function Label({ text, x, y, color, scale = 1 }) { // dark pill me text
  const fontSize = 13 * scale; // font size (photo pe bada)
  const width = text.length * fontSize * 0.58 + 18 * scale; // andaaze se width
  return ( // JSX shuru
    // group
    <G>
      {/* dark pill */}
      <Rect x={x} y={y} width={width} height={24 * scale} rx={12 * scale} fill="rgba(10,10,11,0.75)" />
      {/* text */}
      <SvgText x={x + 9 * scale} y={y + 16.5 * scale} fill={color} fontSize={fontSize} fontWeight="600" fontFamily="sans-serif">
        {/* label ka text */}
        {text}
        {/* SvgText band */}
      </SvgText>
      {/* group band */}
    </G>
  ); // JSX band
} // component band

const DRAWERS = { sunglasses: Sunglasses, crown: Crown, clown: Clown, devil: DevilHorns, npc: NpcScanner, flames: Flames }; // filter naam → component

/**
 * faces: toPlainFace() wale objects
 * progress: 0..1 (NPC scan line aur flames ke bounce ke liye)
 * labelScale: photo bada ho to labels bhi bade (photo pixels me draw hota hai)
 */
export default function FaceFilterLayer({ faces, filter, showHud = false, expression, progress = 0.5, labelScale = 1 }) { // main component
  const Drawer = DRAWERS[filter]; // chuna hua filter component ("none" = undefined)
  return ( // JSX shuru
    // sab faces ka group
    <G>
      {/* har face */}
      {faces.map((face, index) => {
        const g = { ...faceGeometry(face), labelScale }; // geometry + label size
        return ( // face group lautao
          // ek face ka group
          <G key={index}>
            {/* filter */}
            {Drawer && <Drawer g={g} progress={progress} />}
            {/* HUD (sirf live) */}
            {showHud && <Hud g={g} expression={index === 0 ? expression : null} />}
            {/* face group band */}
          </G>
        ); // return band
        // map function band
      })}
      {/* group band */}
    </G>
  ); // JSX band
} // component band
