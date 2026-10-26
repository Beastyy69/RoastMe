// Layout pieces: Screen (scroll + safe area + header), Card aur Pill.
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native"; // RN building blocks
import { SafeAreaView } from "react-native-safe-area-context"; // notch/status bar se bachav
import { colors, radius } from "../theme"; // rang + golai

// Scroll hone wali screen: notch/status bar se bachav (safe area) + keyboard handling.
export function Screen({ eyebrow, title, description, children, scroll = true }) { // screen ka wrapper
  const header = ( // upar ka heading section
    // heading box
    <View style={styles.header}>
      {/* chhota violet label */}
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      {/* bada title */}
      {title && <Text style={styles.title}>{title}</Text>}
      {/* description */}
      {description && <Text style={styles.description}>{description}</Text>}
      {/* header band */}
    </View>
  ); // header band

  return ( // JSX shuru
    // safe area (upar notch ke neeche se shuru)
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* keyboard khulne pe content upar khiske (iOS) */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* scroll chahiye to ScrollView, warna normal View */}
        {scroll ? (
          // scroll hone wala content (keyboard khula ho tab bhi buttons tap ho)
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* heading */}
            {header}
            {/* screen ka content */}
            {children}
            {/* ScrollView band */}
          </ScrollView>
          // warna
        ) : (
          // bina scroll
          <View style={[styles.content, styles.flex]}>
            {/* heading */}
            {header}
            {/* content */}
            {children}
            {/* View band */}
          </View>
          // ternary band
        )}
        {/* KeyboardAvoidingView band */}
      </KeyboardAvoidingView>
      {/* SafeAreaView band */}
    </SafeAreaView>
  ); // JSX band
} // component band

// Rounded box, sab screens me same look
export function Card({ style, children }) { // style = extra style
  return <View style={[styles.card, style]}>{children}</View>; // card + content
} // component band

// Chhota rounded tag (jaise "Savage")
export function Pill({ label, tone = "accent" }) { // tone = accent (violet) ya muted (grey)
  return ( // JSX shuru
    // pill box
    <View style={[styles.pill, tone === "muted" && styles.pillMuted]}>
      {/* pill ka text */}
      <Text style={[styles.pillText, tone === "muted" && styles.pillTextMuted]}>{label}</Text>
      {/* pill band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  safe: { flex: 1, backgroundColor: colors.background }, // safe: bachi hui jagah le lo, background ka rang
  flex: { flex: 1 }, // flex: bachi hui jagah le lo
  content: { paddingHorizontal: 20, paddingBottom: 40 }, // content: andar ki jagah left-right, andar ki jagah neeche
  header: { paddingTop: 16, paddingBottom: 22 }, // header: andar ki jagah upar, andar ki jagah neeche
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: "600", marginBottom: 6 }, // eyebrow: text ka rang, text ka size, text kitna bold
  title: { color: colors.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.6 }, // title: text ka rang, text ka size, text kitna bold
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 }, // description: text ka rang, text ka size, lines ke beech ki unchai
  card: { // card ka style
    backgroundColor: colors.surface, // background ka rang
    borderRadius: radius.lg, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: colors.border, // border ka rang
    padding: 18, // andar ki jagah (charon taraf)
  }, // card band
  pill: { // pill ka style
    alignSelf: "flex-start", // sirf is element ka alignment
    borderRadius: radius.pill, // kone gol
    paddingHorizontal: 10, // andar ki jagah left-right
    paddingVertical: 4, // andar ki jagah upar-neeche
    backgroundColor: colors.accentSoft, // background ka rang
    borderWidth: 1, // border ki motai
    borderColor: "rgba(167,139,250,0.25)", // border ka rang
  }, // pill band
  pillMuted: { backgroundColor: "transparent", borderColor: colors.border }, // pillMuted: background ka rang, border ka rang
  pillText: { color: colors.accentText, fontSize: 12, fontWeight: "600" }, // pillText: text ka rang, text ka size, text kitna bold
  pillTextMuted: { color: colors.textMuted, fontWeight: "500" }, // pillTextMuted: text ka rang, text kitna bold
}); // styles band
