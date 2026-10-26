// Loading (pulse skeleton), Error (laal box + Retry) aur Empty (dashed box) states.
import { useEffect, useRef } from "react"; // React hooks
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native"; // loader, animation, views
import { Feather } from "@expo/vector-icons"; // icons
import Button from "./Button"; // button
import { Card } from "./Layout"; // card
import { useReducedMotion } from "../hooks/useReducedMotion"; // animation setting
import { colors, radius } from "../theme"; // rang + golai

// Server kaam kar raha ho tab dhadakta hua skeleton. Koi nakli % progress nahi.
export function LoadingCard({ message }) { // message = "Roasting..." jaisa
  const pulse = useRef(new Animated.Value(0.4)).current; // opacity 0.4 ↔ 1
  const reduced = useReducedMotion(); // animation band?

  useEffect(() => { // pulse animation
    if (reduced) return; // band hai to nahi
    const loop = Animated.loop( // hamesha repeat
      Animated.sequence([ // ek ke baad ek
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }), // chamko
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }), // dheeme
      ]), // sequence band
    ); // loop band
    loop.start(); // shuru
    return () => loop.stop(); // screen hatne pe roko
  }, [pulse, reduced]); // dependencies

  return ( // JSX shuru
    // card
    <Card style={styles.gap}>
      {/* loader + message */}
      <View style={styles.loadingRow}>
        {/* ghoomta loader */}
        <ActivityIndicator color={colors.accent} />
        {/* message */}
        <Text style={styles.loadingText}>{message}</Text>
        {/* row band */}
      </View>
      {/* 4 dhadakti grey lines (alag lambai) */}
      {[0.92, 1, 0.8, 0.65].map((width, index) => (
        // ek line
        <Animated.View key={index} style={[styles.skeleton, { width: `${width * 100}%`, opacity: pulse }]} />
        // map band
      ))}
      {/* Card band */}
    </Card>
  ); // JSX band
} // component band

export function ErrorNotice({ message, onRetry }) { // laal error box
  return ( // JSX shuru
    // box (screen reader turant padhe)
    <View style={styles.error} accessibilityRole="alert">
      {/* icon + text */}
      <View style={styles.errorRow}>
        {/* error icon */}
        <Feather name="alert-circle" size={18} color={colors.danger} />
        {/* text wala hissa */}
        <View style={{ flex: 1 }}>
          {/* heading */}
          <Text style={styles.errorTitle}>Something went sideways</Text>
          {/* asli message */}
          <Text style={styles.errorText}>{message}</Text>
          {/* text band */}
        </View>
        {/* row band */}
      </View>
      {/* onRetry ho to Retry button */}
      {onRetry && <Button title="Retry" icon="refresh-cw" size="sm" variant="danger" onPress={onRetry} style={styles.retry} />}
      {/* box band */}
    </View>
  ); // JSX band
} // component band

export function EmptyState({ icon, title, message }) { // kuch data nahi tab
  return ( // JSX shuru
    // dashed box
    <View style={styles.empty}>
      {/* icon ka dabba */}
      <View style={styles.emptyIcon}>
        {/* icon */}
        <Feather name={icon} size={20} color={colors.accentText} />
        {/* dabba band */}
      </View>
      {/* title */}
      <Text style={styles.emptyTitle}>{title}</Text>
      {/* message */}
      <Text style={styles.emptyText}>{message}</Text>
      {/* box band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  gap: { gap: 12 }, // gap: items ke beech ki doori
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }, // loadingRow: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  loadingText: { color: colors.textMuted, fontSize: 14, flex: 1 }, // loadingText: text ka rang, text ka size, bachi hui jagah le lo
  skeleton: { height: 14, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)" }, // skeleton: unchai, kone gol, background ka rang
  error: { // error ka style
    borderRadius: radius.lg, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(239,68,68,0.25)", // border ka rang
    backgroundColor: "rgba(239,68,68,0.07)", // background ka rang
    padding: 16, // andar ki jagah (charon taraf)
    gap: 12, // items ke beech ki doori
  }, // error band
  errorRow: { flexDirection: "row", gap: 10 }, // errorRow: items ki direction (row = left-right), items ke beech ki doori
  errorTitle: { color: "#fecaca", fontWeight: "600", fontSize: 14 }, // errorTitle: text ka rang, text kitna bold, text ka size
  errorText: { color: "rgba(252,165,165,0.85)", fontSize: 14, marginTop: 3, lineHeight: 20 }, // errorText: text ka rang, text ka size, upar bahar ki jagah
  retry: { alignSelf: "flex-start" }, // retry: sirf is element ka alignment
  empty: { // empty ka style
    alignItems: "center", // cross-direction me alignment
    borderRadius: radius.lg, // kone gol
    borderWidth: 1, // border ki motai
    borderStyle: "dashed", // border ka style (dashed/solid)
    borderColor: "rgba(255,255,255,0.12)", // border ka rang
    paddingVertical: 36, // andar ki jagah upar-neeche
    paddingHorizontal: 20, // andar ki jagah left-right
  }, // empty band
  emptyIcon: { // emptyIcon ka style
    width: 46, // chaudai
    height: 46, // unchai
    borderRadius: 14, // kone gol
    backgroundColor: colors.accentSoft, // background ka rang
    alignItems: "center", // cross-direction me alignment
    justifyContent: "center", // main-direction me alignment
  }, // emptyIcon band
  emptyTitle: { color: colors.text, fontWeight: "600", fontSize: 15, marginTop: 14 }, // emptyTitle: text ka rang, text kitna bold, text ka size
  emptyText: { color: colors.textFaint, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 6 }, // emptyText: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
