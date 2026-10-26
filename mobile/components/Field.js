import { useState } from "react"; // focus state ke liye
import { StyleSheet, Text, TextInput, View } from "react-native"; // input, text, box
import { colors, radius } from "../theme"; // rang + golai

// Label wala text input + character counter + error message. Focus pe border violet.
export default function Field({ label, value, onChangeText, maxLength, error, hint, multiline = false, ...props }) { // props
  const [focused, setFocused] = useState(false); // input pe focus hai?

  return ( // JSX shuru
    // wrapper
    <View style={styles.wrap}>
      {/* label + counter ki row */}
      <View style={styles.labelRow}>
        {/* label */}
        <Text style={styles.label}>{label}</Text>
        {/* maxLength diya ho to counter */}
        {maxLength ? (
          // 90% se zyada bhara to peela
          <Text style={[styles.counter, value.length > maxLength * 0.9 && { color: colors.warning }]}>
            {/* jaise 45/600 */}
            {value.length}/{maxLength}
            {/* Text band */}
          </Text>
          // warna kuch nahi
        ) : null}
        {/* row band */}
      </View>
      {/* asli input box */}
      <TextInput
        value={value} // abhi ka text
        onChangeText={onChangeText} // typing pe
        maxLength={maxLength} // max characters
        multiline={multiline} // kai lines?
        textAlignVertical={multiline ? "top" : "center"} // Android pe text upar se shuru
        placeholderTextColor={colors.textFaint} // placeholder ka rang
        selectionColor={colors.accent} // cursor/selection violet
        onFocus={() => setFocused(true)} // focus aaya
        onBlur={() => setFocused(false)} // focus gaya
        accessibilityLabel={label} // screen reader naam
        style={[ // styles ki list
          styles.input, // basic
          multiline && styles.multiline, // badi height
          focused && styles.focused, // violet border
          error && styles.errorBorder, // laal border
        ]} // style band
        {...props} // baaki props (placeholder...)
      // self-closing tag yahin band
      />
      {/* error ho to laal text, warna hint (ho to) */}
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {/* wrapper band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  wrap: { gap: 8 }, // wrap: items ke beech ki doori
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }, // labelRow: items ki direction (row = left-right), main-direction me alignment, cross-direction me alignment
  label: { color: colors.text, fontSize: 14, fontWeight: "600" }, // label: text ka rang, text ka size, text kitna bold
  counter: { color: colors.textFaint, fontSize: 12, fontVariant: ["tabular-nums"] }, // counter: text ka rang, text ka size, numbers ek barabar chaude
  input: { // input ka style
    color: colors.text, // text ka rang
    fontSize: 15, // text ka size
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // border ka rang
    backgroundColor: "rgba(255,255,255,0.03)", // background ka rang
    borderRadius: radius.md, // kone gol
    paddingHorizontal: 14, // andar ki jagah left-right
    paddingVertical: 12, // andar ki jagah upar-neeche
    minHeight: 48, // kam se kam unchai
  }, // input band
  multiline: { minHeight: 104, lineHeight: 21 }, // multiline: kam se kam unchai, lines ke beech ki unchai
  focused: { borderColor: "rgba(167,139,250,0.6)", backgroundColor: "rgba(255,255,255,0.05)" }, // focused: border ka rang, background ka rang
  errorBorder: { borderColor: "rgba(248,113,113,0.6)" }, // errorBorder: border ka rang
  error: { color: colors.danger, fontSize: 12 }, // error: text ka rang, text ka size
  hint: { color: colors.textFaint, fontSize: 12 }, // hint: text ka rang, text ka size
}); // styles band
