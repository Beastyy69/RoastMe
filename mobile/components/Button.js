// App ka Button: icon + text, loading spinner, variants (primary/secondary/ghost/danger).
// PressableScale ki wajah se dabane pe spring animation.
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"; // loader, styles, text, box
import { Feather } from "@expo/vector-icons"; // icons
import { PressableScale } from "./Motion"; // dabne wala animated pressable
import { colors, radius } from "../theme"; // rang + golai

// Har variant ka background aur text color
const VARIANTS = { // variant → { box style, text style }
  primary: { box: { backgroundColor: colors.accentStrong }, text: { color: "#fff" } }, // violet button, white text
  secondary: { // halka border wala
    box: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: colors.border }, // halka bg + border
    text: { color: colors.text }, // white text
  }, // secondary band
  ghost: { box: { backgroundColor: "transparent" }, text: { color: colors.textMuted } }, // bina background
  danger: { // laal (delete)
    box: { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)" }, // halka laal
    text: { color: "#fca5a5" }, // laal text
  }, // danger band
}; // VARIANTS band

export default function Button({ title, icon, onPress, variant = "primary", size = "md", loading = false, disabled, style }) { // props
  const look = VARIANTS[variant]; // chuna hua look
  const small = size === "sm"; // chhota button?
  const isDisabled = disabled || loading; // loading me bhi disabled

  return ( // JSX shuru
    // dabne wala button
    <PressableScale
      onPress={onPress} // tap pe kya ho
      disabled={isDisabled} // disabled?
      accessibilityLabel={title} // screen reader naam
      style={[styles.base, small ? styles.small : styles.large, look.box, isDisabled && styles.disabled, style]} // saari styles
      // opening tag band
    >
      {/* icon + text ek row me */}
      <View style={styles.row}>
        {/* loading ho to spinner, warna icon (agar diya ho) */}
        {loading ? (
          // ghoomta loader
          <ActivityIndicator size="small" color={look.text.color} />
          // warna
        ) : (
          // icon (diya ho tabhi)
          icon && <Feather name={icon} size={small ? 15 : 18} color={look.text.color} />
          // ternary band
        )}
        {/* button ka text */}
        <Text style={[styles.label, small && styles.labelSmall, look.text]}>{title}</Text>
        {/* row band */}
      </View>
      {/* PressableScale band */}
    </PressableScale>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  base: { borderRadius: radius.md, alignItems: "center", justifyContent: "center" }, // base: kone gol, cross-direction me alignment, main-direction me alignment
  large: { minHeight: 52, paddingHorizontal: 22 }, // large: kam se kam unchai, andar ki jagah left-right
  small: { minHeight: 40, paddingHorizontal: 14 }, // small: kam se kam unchai, andar ki jagah left-right
  row: { flexDirection: "row", alignItems: "center", gap: 8 }, // row: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  label: { fontSize: 16, fontWeight: "600" }, // label: text ka size, text kitna bold
  labelSmall: { fontSize: 14, fontWeight: "500" }, // labelSmall: text ka size, text kitna bold
  disabled: { opacity: 0.6 }, // disabled: kitna dikhe (0-1)
}); // styles band
