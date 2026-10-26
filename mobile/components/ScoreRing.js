import { useEffect, useRef, useState } from "react"; // React hooks
import { Animated, Easing, StyleSheet, Text, View } from "react-native"; // animation + views
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg"; // SVG drawing
import { useReducedMotion } from "../hooks/useReducedMotion"; // "Remove animations" setting
import { colors } from "../theme"; // rang

// SVG Circle ko animate karne layak banao
const AnimatedCircle = Animated.createAnimatedComponent(Circle); // animated circle
const SIZE = 112; // ring ka size
const STROKE = 9; // ring ki motai
const RADIUS = (SIZE - STROKE) / 2; // radius
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ring ki poori lambai (2πr)

// Gol score ring (SVG) jo 0 se value tak bharti hai, saath me number count-up.
export default function ScoreRing({ value, label, caption }) { // value = score
  const progress = useRef(new Animated.Value(0)).current; // 0 → value
  const [display, setDisplay] = useState(0); // screen pe number
  const reduced = useReducedMotion(); // animation band?

  useEffect(() => { // value badle to animation
    const id = progress.addListener(({ value: current }) => setDisplay(Math.round(current))); // har step pe number update
    Animated.timing(progress, { // 0 se value tak
      toValue: value, // final score
      duration: reduced ? 0 : 1000, // 1 sec (ya turant)
      easing: Easing.out(Easing.cubic), // aakhir me dheema
      useNativeDriver: false, // SVG ke props native driver pe animate nahi hote
    }).start(); // shuru
    return () => progress.removeListener(id); // cleanup
  }, [progress, value, reduced]); // dependencies

  // Dash offset kam = circle zyada bhara hua
  const strokeDashoffset = progress.interpolate({ // progress → offset
    inputRange: [0, 100], // score 0-100
    outputRange: [CIRCUMFERENCE, 0], // poora khaali → poora bhara
  }); // interpolate band

  return ( // JSX shuru
    // ring + text ki row (screen reader ek label padhe)
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value} out of 100`}>
      {/* ring ka dabba */}
      <View style={{ width: SIZE, height: SIZE }}>
        {/* SVG, -90° ghuma ke upar se bharna shuru */}
        <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: "-90deg" }] }}>
          {/* gradient definitions */}
          <Defs>
            {/* halka violet → gehra violet */}
            <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
              {/* shuru ka rang */}
              <Stop offset="0" stopColor="#c4b5fd" />
              {/* aakhri rang */}
              <Stop offset="1" stopColor="#7c3aed" />
              {/* gradient band */}
            </LinearGradient>
            {/* Defs band */}
          </Defs>
          {/* grey background ring */}
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeWidth={STROKE} fill="none" />
          {/* violet ring jo bharti hai */}
          <AnimatedCircle
            cx={SIZE / 2} // center x
            cy={SIZE / 2} // center y
            r={RADIUS} // radius
            stroke="url(#ring)" // gradient rang
            strokeWidth={STROKE} // motai
            fill="none" // andar khaali
            strokeLinecap="round" // gol sire
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} // ek lamba dash
            strokeDashoffset={strokeDashoffset} // kitna chhupa (animate hota hai)
          // self-closing tag yahin band
          />
          {/* Svg band */}
        </Svg>
        {/* ring ke beech number */}
        <View style={styles.center}>
          {/* ginta hua number */}
          <Text style={styles.value}>{display}</Text>
          {/* center band */}
        </View>
        {/* ring dabba band */}
      </View>
      {/* right side text */}
      <View style={styles.text}>
        {/* label */}
        <Text style={styles.label}>{label}</Text>
        {/* caption ho to */}
        {caption && <Text style={styles.caption}>{caption}</Text>}
        {/* text band */}
      </View>
      {/* row band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  row: { flexDirection: "row", alignItems: "center", gap: 16 }, // row: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" }, // center: poore parent ko dhak lo, cross-direction me alignment, main-direction me alignment
  value: { color: colors.text, fontSize: 28, fontWeight: "700", fontVariant: ["tabular-nums"] }, // value: text ka rang, text ka size, text kitna bold
  text: { flex: 1 }, // text: bachi hui jagah le lo
  label: { color: colors.text, fontSize: 15, fontWeight: "600" }, // label: text ka rang, text ka size, text kitna bold
  caption: { color: colors.textFaint, fontSize: 12, lineHeight: 17, marginTop: 4 }, // caption: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
