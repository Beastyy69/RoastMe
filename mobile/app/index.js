// Home tab: hero heading, rotating example roast, feature cards aur "How it works".
import { useEffect, useState } from "react"; // React hooks
import { StyleSheet, Text, View } from "react-native"; // RN basics
import { useRouter } from "expo-router"; // doosre tab pe jaane ke liye
import { Feather } from "@expo/vector-icons"; // icons
import { Card, Pill, Screen } from "../components/Layout"; // layout pieces
import { FadeIn, PressableScale } from "../components/Motion"; // animations
import Button from "../components/Button"; // button
import { colors, radius } from "../theme"; // rang + golai

// Fixed examples (asli API result nahi), har 5 second me badalte hain.
const EXAMPLES = [ // 3 examples
  { intensity: "Savage", topic: "Gaming", text: "You blame lag so often your router is considering therapy." }, // example 1
  { intensity: "Friendly", topic: "Student Life", text: "Your study plan is ambitious. Your study execution is fan fiction." }, // example 2
  { intensity: "Extra Spicy", topic: "Procrastination", text: "Even your alarm has given up and started snoozing itself." }, // example 3
]; // list band

// Feature cards: dabane pe us tab pe le jaate hain
const FEATURES = [ // 4 features
  { route: "/roast", icon: "zap", title: "Roast Generator", text: "Personalised roasts from your routine and habits." }, // roast tab
  { route: "/camera", icon: "camera", title: "Camera Roast", text: "Live face filters, then a roast for your camera energy." }, // camera tab
  { route: "/npc", icon: "user", title: "NPC Meter", text: "Fresh AI questions, then a roast of your answers." }, // npc tab
  { route: "/history", icon: "clock", title: "History", text: "Your best burns, saved for later." }, // history tab
]; // list band

export default function Home() { // Home screen
  const router = useRouter(); // navigation
  const [exampleIndex, setExampleIndex] = useState(0); // kaunsa example dikh raha
  const example = EXAMPLES[exampleIndex]; // abhi ka example

  useEffect(() => { // auto-rotate
    const timer = setInterval(() => setExampleIndex((i) => (i + 1) % EXAMPLES.length), 5000); // har 5 sec agla
    return () => clearInterval(timer); // screen hatne pe band
  }, []); // ek baar

  return ( // JSX shuru
    // scroll screen
    <Screen>
      {/* logo row (fade in) */}
      <FadeIn>
        {/* logo + naam */}
        <View style={styles.brandRow}>
          {/* violet square */}
          <View style={styles.logo}>
            {/* bijli icon */}
            <Feather name="zap" size={16} color="#fff" />
            {/* square band */}
          </View>
          {/* naam: "RoastMe" white + "AI" violet */}
          <Text style={styles.brand}>
            {/* naam ka text */}
            RoastMe <Text style={{ color: colors.accentText }}>AI</Text>
            {/* Text band */}
          </Text>
          {/* row band */}
        </View>
        {/* FadeIn band */}
      </FadeIn>

      {/* hero text (thodi der baad) */}
      <FadeIn delay={80}>
        {/* bada heading */}
        <Text style={styles.hero}>
          {/* "Our Roast." violet me */}
          Your Life. Your Choices. <Text style={styles.heroAccent}>Our Roast.</Text>
          {/* Text band */}
        </Text>
        {/* subtitle */}
        <Text style={styles.subtitle}>
          {/* subtitle text */}
          Describe your routine, habits and favourite excuses. Get a witty, personalised roast you'll want to share.
          {/* Text band */}
        </Text>
        {/* FadeIn band */}
      </FadeIn>

      {/* main button */}
      <FadeIn delay={160} style={styles.ctaWrap}>
        {/* Roast tab pe le jao */}
        <Button title="Roast Me Now" icon="arrow-right" onPress={() => router.push("/roast")} />
        {/* FadeIn band */}
      </FadeIn>

      {/* example card */}
      <FadeIn delay={240}>
        {/* card */}
        <Card style={styles.example}>
          {/* upar: label + intensity */}
          <View style={styles.exampleHeader}>
            {/* label */}
            <Text style={styles.exampleLabel}>Example roast</Text>
            {/* intensity pill */}
            <Pill label={example.intensity} />
            {/* row band */}
          </View>
          {/* key badalne pe naya text fade hoke aata hai */}
          <FadeIn key={exampleIndex} distance={6}>
            {/* roast text */}
            <Text style={styles.exampleText}>“{example.text}”</Text>
            {/* FadeIn band */}
          </FadeIn>
          {/* topic line */}
          <Text style={styles.exampleMeta}>Topic detected by classifier: {example.topic}</Text>
          {/* Card band */}
        </Card>
        {/* FadeIn band */}
      </FadeIn>

      {/* section heading */}
      <Text style={styles.sectionTitle}>Five ways to get humbled</Text>
      {/* 2-column grid */}
      <View style={styles.grid}>
        {/* har feature ka card (ek ke baad ek aate hain) */}
        {FEATURES.map((feature, index) => (
          // fade wrapper (har card thoda late)
          <FadeIn key={feature.route} delay={300 + index * 70} style={styles.gridItem}>
            {/* dabne wala card */}
            <PressableScale onPress={() => router.push(feature.route)} accessibilityLabel={feature.title}>
              {/* card */}
              <Card style={styles.featureCard}>
                {/* icon dabba */}
                <View style={styles.featureIcon}>
                  {/* icon */}
                  <Feather name={feature.icon} size={18} color={colors.accentText} />
                  {/* dabba band */}
                </View>
                {/* title */}
                <Text style={styles.featureTitle}>{feature.title}</Text>
                {/* text */}
                <Text style={styles.featureText}>{feature.text}</Text>
                {/* Card band */}
              </Card>
              {/* PressableScale band */}
            </PressableScale>
            {/* FadeIn band */}
          </FadeIn>
          // map band
        ))}
        {/* grid band */}
      </View>

      {/* How it works card */}
      <Card style={styles.about}>
        {/* heading */}
        <Text style={styles.aboutTitle}>How it works</Text>
        {/* samjhaane wala text */}
        <Text style={styles.aboutText}>
          {/* text */}
          A small scikit-learn classifier (TF-IDF + Logistic Regression) predicts the topic of your text and shows its confidence. The jokes are written separately by local templates or an optional AI provider. Scores are playful formulas for entertainment, not judgements of who you are.
          {/* Text band */}
        </Text>
        {/* Card band */}
      </Card>
      {/* Screen band */}
    </Screen>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 }, // brandRow: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  logo: { // logo ka style
    width: 32, // chaudai
    height: 32, // unchai
    borderRadius: 9, // kone gol
    backgroundColor: colors.accentStrong, // background ka rang
    alignItems: "center", // cross-direction me alignment
    justifyContent: "center", // main-direction me alignment
  }, // logo band
  brand: { color: colors.text, fontSize: 18, fontWeight: "700" }, // brand: text ka rang, text ka size, text kitna bold
  hero: { color: colors.text, fontSize: 40, lineHeight: 44, fontWeight: "800", letterSpacing: -1.2 }, // hero: text ka rang, text ka size, lines ke beech ki unchai
  heroAccent: { color: colors.accentText }, // heroAccent: text ka rang
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 16 }, // subtitle: text ka rang, text ka size, lines ke beech ki unchai
  ctaWrap: { marginTop: 26, marginBottom: 28 }, // ctaWrap: upar bahar ki jagah, neeche bahar ki jagah
  example: { gap: 12 }, // example: items ke beech ki doori
  exampleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, // exampleHeader: items ki direction (row = left-right), main-direction me alignment, cross-direction me alignment
  exampleLabel: { color: colors.textFaint, fontSize: 12, fontWeight: "600" }, // exampleLabel: text ka rang, text ka size, text kitna bold
  exampleText: { color: colors.text, fontSize: 17, lineHeight: 25, minHeight: 50 }, // exampleText: text ka rang, text ka size, lines ke beech ki unchai
  exampleMeta: { color: colors.textFaint, fontSize: 12 }, // exampleMeta: text ka rang, text ka size
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: 34, marginBottom: 14 }, // sectionTitle: text ka rang, text ka size, text kitna bold
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 }, // grid: items ki direction (row = left-right), jagah kam ho to agli line me, left-right bahar ki jagah
  gridItem: { width: "50%", padding: 5 }, // gridItem: chaudai, andar ki jagah (charon taraf)
  featureCard: { minHeight: 150, padding: 16 }, // featureCard: kam se kam unchai, andar ki jagah (charon taraf)
  featureIcon: { // featureIcon ka style
    width: 38, // chaudai
    height: 38, // unchai
    borderRadius: radius.sm, // kone gol
    backgroundColor: colors.accentSoft, // background ka rang
    alignItems: "center", // cross-direction me alignment
    justifyContent: "center", // main-direction me alignment
  }, // featureIcon band
  featureTitle: { color: colors.text, fontWeight: "600", fontSize: 15, marginTop: 14 }, // featureTitle: text ka rang, text kitna bold, text ka size
  featureText: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 }, // featureText: text ka rang, text ka size, lines ke beech ki unchai
  about: { marginTop: 20, gap: 8 }, // about: upar bahar ki jagah, items ke beech ki doori
  aboutTitle: { color: colors.text, fontSize: 16, fontWeight: "600" }, // aboutTitle: text ka rang, text ka size, text kitna bold
  aboutText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 }, // aboutText: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
