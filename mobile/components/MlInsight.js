import { StyleSheet, Text, View } from "react-native"; // text + box
import { Feather } from "@expo/vector-icons"; // icons
import { colors, radius } from "../theme"; // rang + golai

const pretty = (label) => label.replace(/_/g, " "); // "student_life" → "student life"

// ML model ne kya predict kiya (topic + % bars). Joke ML ne nahi, templates/AI ne likha ye bhi batata hai.
export default function MlInsight({ ml, generator, fallbackLabel }) { // ml = backend ka ML result
  if (!ml) return null; // data nahi to kuch mat dikhao
  const topThree = Object.entries(ml.probabilities ?? {}).slice(0, 3); // top 3 categories

  return ( // JSX shuru
    // box
    <View style={styles.box}>
      {/* heading row */}
      <View style={styles.headingRow}>
        {/* chip icon */}
        <Feather name="cpu" size={13} color={colors.accent} />
        {/* heading */}
        <Text style={styles.heading}>ML CLASSIFIER · TF-IDF + LOGISTIC REGRESSION</Text>
        {/* row band */}
      </View>

      {/* model nahi hai to message, warna prediction */}
      {!ml.model_available ? (
        // model missing
        <Text style={styles.body}>The model isn't loaded on the server, so the default category was used.</Text>
        // warna
      ) : (
        // fragment: sentence + bars
        <>
          {/* prediction ka sentence */}
          <Text style={styles.body}>
            {/* "Predicted topic X with Y% model probability." */}
            Predicted topic <Text style={styles.strong}>{pretty(ml.model_label)}</Text> with <Text style={styles.strong}>{Math.floor(ml.confidence * 100)}%</Text> model probability.
            {/* 40% se kam ho to peela note */}
            {!ml.confident && (
              // fallback note
              <Text style={styles.warn}> That's under the 40% threshold, so it fell back to "{fallbackLabel}".</Text>
              // condition band
            )}
            {/* Text band */}
          </Text>
          {/* har category ka bar */}
          {topThree.map(([label, probability]) => (
            // ek row
            <View key={label} style={styles.barRow}>
              {/* category naam */}
              <Text style={styles.barLabel} numberOfLines={1}>
                {/* naam */}
                {pretty(label)}
                {/* Text band */}
              </Text>
              {/* grey track */}
              <View style={styles.track}>
                {/* violet bhara hissa (probability jitna) */}
                <View style={[styles.fill, { width: `${probability * 100}%` }]} />
                {/* track band */}
              </View>
              {/* % */}
              <Text style={styles.barValue}>{Math.floor(probability * 100)}%</Text>
              {/* row band */}
            </View>
            // map band
          ))}
          {/* fragment band */}
        </>
        // ternary band
      )}

      {/* joke kisne likha */}
      {generator && (
        // neeche ki line
        <Text style={styles.footer}>
          {/* text */}
          Comedy text written by {generator.source === "ai" ? "the configured AI provider" : "local templates"}, not by the classifier.
          {/* Text band */}
        </Text>
        // condition band
      )}
      {/* box band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  box: { // box ka style
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.06)", // border ka rang
    backgroundColor: "rgba(255,255,255,0.02)", // background ka rang
    padding: 14, // andar ki jagah (charon taraf)
    gap: 10, // items ke beech ki doori
  }, // box band
  headingRow: { flexDirection: "row", alignItems: "center", gap: 6 }, // headingRow: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  heading: { color: colors.textFaint, fontSize: 10.5, fontWeight: "600", letterSpacing: 0.6 }, // heading: text ka rang, text ka size, text kitna bold
  body: { color: colors.textMuted, fontSize: 13.5, lineHeight: 20 }, // body: text ka rang, text ka size, lines ke beech ki unchai
  strong: { color: colors.text, fontWeight: "600", textTransform: "capitalize" }, // strong: text ka rang, text kitna bold, capital/small letters
  warn: { color: colors.warning }, // warn: text ka rang
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 }, // barRow: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  barLabel: { color: colors.textMuted, fontSize: 12, width: 104, textTransform: "capitalize" }, // barLabel: text ka rang, text ka size, chaudai
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }, // track: bachi hui jagah le lo, unchai, kone gol
  fill: { height: "100%", borderRadius: 3, backgroundColor: "rgba(139,92,246,0.85)" }, // fill: unchai, kone gol, background ka rang
  barValue: { color: colors.textFaint, fontSize: 12, width: 34, textAlign: "right" }, // barValue: text ka rang, text ka size, chaudai
  footer: { // footer ka style
    color: colors.textFaint, // text ka rang
    fontSize: 12, // text ka size
    borderTopWidth: 1, // upar border ki motai
    borderTopColor: "rgba(255,255,255,0.06)", // upar border ka rang
    paddingTop: 10, // andar ki jagah upar
  }, // footer band
}); // styles band
