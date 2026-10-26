// Design tokens: saari screens yahi colors, corner radius aur spacing use karti hain.
// Color badalna ho to sirf yahan badlo, poori app me badal jaayega.
export const colors = { // app ke saare rang
  background: "#0a0a0b", // screen ka background (lagbhag kaala)
  surface: "#111113", // card ka background
  surfaceRaised: "#17171a", // thoda upar wala card
  border: "rgba(255,255,255,0.08)", // patli halki border
  borderStrong: "rgba(255,255,255,0.16)", // thodi gehri border
  text: "#f4f4f5", // main text (halka white)
  textMuted: "#a1a1aa", // grey text
  textFaint: "#71717a", // aur halka grey text
  accent: "#8b5cf6", // violet (brand color)
  accentStrong: "#7c3aed", // gehra violet (buttons)
  accentSoft: "rgba(139,92,246,0.12)", // halka violet background
  accentText: "#c4b5fd", // halka violet text
  danger: "#f87171", // laal (error)
  dangerSoft: "rgba(239,68,68,0.10)", // halka laal background
  success: "#34d399", // hara (success)
  warning: "#fbbf24", // peela (warning)
}; // colors band

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 }; // kono ki golai: chhota, normal, bada, poora gol

// spacing(4) = 16 pixels (4 ka multiple)
export const spacing = (units) => units * 4; // units × 4 pixels
