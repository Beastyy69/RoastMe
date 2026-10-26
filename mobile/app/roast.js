// Roast tab: form (nickname, bio, habits, intensity, category) → /api/roast → result card.
import { useState } from "react"; // form state
import { Keyboard, Pressable, StyleSheet, Text, View } from "react-native"; // keyboard band karna, touch, text, box
import { Feather } from "@expo/vector-icons"; // icons
import { Card, Pill, Screen } from "../components/Layout"; // layout pieces
import { FadeIn, PressableScale } from "../components/Motion"; // animations
import Button from "../components/Button"; // button
import Field from "../components/Field"; // input
import ScoreRing from "../components/ScoreRing"; // gol score
import MlInsight from "../components/MlInsight"; // ML box
import ResultActions from "../components/ResultActions"; // copy/share
import { EmptyState, ErrorNotice, LoadingCard } from "../components/StatusViews"; // states
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls
import { CATEGORIES, INTENSITIES, LIMITS, categoryLabel, intensityLabel } from "../constants"; // lists + limits
import { colors, radius } from "../theme"; // rang + golai

export default function RoastScreen() { // Roast tab
  const [nickname, setNickname] = useState(""); // naam
  const [bio, setBio] = useState(""); // bio
  const [habits, setHabits] = useState(""); // habits
  const [intensity, setIntensity] = useState("savage"); // chuni intensity
  const [category, setCategory] = useState("auto"); // chuni category
  const [bioError, setBioError] = useState(null); // bio ka error
  const roast = useApiAction(api.roast); // /api/roast ki state

  // Keyboard band → bio check → API call
  const submit = () => { // Roast Me button
    Keyboard.dismiss(); // keyboard neeche
    if (bio.trim().length < LIMITS.bioMin) { // bio chhota?
      setBioError(`Give us at least ${LIMITS.bioMin} characters to work with.`); // error
      return; // ruk jao
    } // if band
    roast.run({ // backend ko bhejo
      nickname: nickname.trim() || undefined, // khaali ho to mat bhejo
      bio: bio.trim(), // bio
      habits: habits.trim() || undefined, // khaali ho to mat bhejo
      intensity, // intensity
      category, // category
    }); // run band
  }; // function band

  return ( // JSX shuru
    // heading wali screen
    <Screen
      eyebrow="Roast Generator" // label
      title="Serve us your routine" // title
      description="The more specific you are, the more personal the roast." // description
      // opening tag band
    >
      {/* form card */}
      <Card style={styles.form}>
        {/* nickname */}
        <Field label="Nickname (optional)" placeholder="What should we call you?" value={nickname} onChangeText={setNickname} maxLength={LIMITS.nickname} />
        {/* bio */}
        <Field
          label="Bio or daily routine" // label
          placeholder="e.g. CS student. I wake up at noon and game until 3am." // example
          value={bio} // value
          onChangeText={(text) => { // typing pe
            setBio(text); // update
            setBioError(null); // error hatao
          }} // onChangeText band
          maxLength={LIMITS.bio} // max 600
          multiline // kai lines
          error={bioError} // error
        // self-closing tag yahin band
        />
        {/* habits */}
        <Field
          label="Habits & excuses (optional)" // label
          placeholder="e.g. I always say I'll start tomorrow." // example
          value={habits} // value
          onChangeText={setHabits} // update
          maxLength={LIMITS.habits} // max 400
          multiline // kai lines
        // self-closing tag yahin band
        />

        {/* intensity group */}
        <View style={styles.group}>
          {/* label */}
          <Text style={styles.groupLabel}>Roast intensity</Text>
          {/* 3 options ki row */}
          <View style={styles.intensityRow} accessibilityRole="radiogroup">
            {/* har intensity */}
            {INTENSITIES.map((option) => {
              const active = intensity === option.value; // chuna hai?
              return ( // option lautao
                // dabne wala option
                <PressableScale
                  key={option.value} // key
                  onPress={() => setIntensity(option.value)} // chuno
                  accessibilityRole="radio" // radio option
                  accessibilityState={{ checked: active }} // chuna hai?
                  accessibilityLabel={option.label} // naam
                  style={[styles.intensity, active && styles.intensityActive]} // style
                  // opening tag band
                >
                  {/* bijli icons (1-3) */}
                  <View style={styles.flames}>
                    {/* jitne flames utne icons */}
                    {Array.from({ length: option.flames }).map((_, i) => (
                      // ek icon
                      <Feather key={i} name="zap" size={12} color={active ? colors.accentText : colors.textFaint} />
                      // map band
                    ))}
                    {/* icons band */}
                  </View>
                  {/* naam */}
                  <Text style={styles.intensityLabel}>{option.label}</Text>
                  {/* hint */}
                  <Text style={styles.intensityHint}>{option.hint}</Text>
                  {/* option band */}
                </PressableScale>
              ); // return band
              // map function band
            })}
            {/* row band */}
          </View>
          {/* group band */}
        </View>

        {/* category group */}
        <View style={styles.group}>
          {/* label */}
          <Text style={styles.groupLabel}>Category</Text>
          {/* chips */}
          <View style={styles.chips}>
            {/* har category */}
            {CATEGORIES.map((option) => {
              const active = category === option.value; // chuni hai?
              return ( // chip lautao
                // chip
                <Pressable
                  key={option.value} // key
                  onPress={() => setCategory(option.value)} // chuno
                  accessibilityRole="button" // button
                  accessibilityState={{ selected: active }} // chuni hai?
                  style={[styles.chip, active && styles.chipActive]} // style
                  // opening tag band
                >
                  {/* chip ka naam */}
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                  {/* chip band */}
                </Pressable>
              ); // return band
              // map function band
            })}
            {/* chips band */}
          </View>
          {/* hint */}
          <Text style={styles.hint}>Auto-detect lets the ML classifier pick the topic.</Text>
          {/* group band */}
        </View>

        {/* submit button */}
        <Button title={roast.isLoading ? "Roasting..." : "Roast Me"} icon="zap" loading={roast.isLoading} onPress={submit} />
        {/* form band */}
      </Card>

      {/* result area */}
      <View style={styles.result}>
        {/* abhi kuch nahi */}
        {roast.status === "idle" && (
          // empty box
          <EmptyState icon="zap" title="Your roast will appear here" message="Tip: mention a habit you're a little proud of." />
          // condition band
        )}
        {/* loading */}
        {roast.status === "loading" && <LoadingCard message="Reading your habits and sharpening the punchlines..." />}
        {/* error */}
        {roast.status === "error" && <ErrorNotice message={roast.error} onRetry={submit} />}
        {/* result */}
        {roast.status === "success" && <RoastResult result={roast.data} onRetry={submit} />}
        {/* result area band */}
      </View>
      {/* Screen band */}
    </Screen>
  ); // JSX band
} // component band

// Roast ka result card (FadeIn animation)
function RoastResult({ result, onRetry }) { // result = backend data
  return ( // JSX shuru
    // fade in
    <FadeIn>
      {/* card */}
      <Card style={styles.resultCard}>
        {/* upar: title + pills */}
        <View style={styles.resultHeader}>
          {/* kiska roast */}
          <Text style={styles.resultTitle}>{result.nickname ? `${result.nickname}'s roast` : "Your roast"}</Text>
          {/* pills */}
          <View style={styles.pills}>
            {/* intensity */}
            <Pill label={intensityLabel(result.intensity)} />
            {/* category + kisne chuni */}
            <Pill tone="muted" label={`${categoryLabel(result.category)} · ${result.category_source === "user" ? "your pick" : "auto"}`} />
            {/* pills band */}
          </View>
          {/* header band */}
        </View>
        {/* roast text (select/copy ho sakta hai) */}
        <Text style={styles.roastText} selectable>
          {/* roast */}
          {result.roast}
          {/* Text band */}
        </Text>
        {/* heat ring */}
        <ScoreRing
          value={result.heat_rating} // score
          label="Heat rating" // naam
          caption="A playful formula from intensity and roastable details. Not an ML prediction." // note
        // self-closing tag yahin band
        />
        {/* ML prediction */}
        <MlInsight ml={result.ml} generator={result.generator} fallbackLabel="General" />
        {/* copy/share/another */}
        <ResultActions text={result.roast} shareTitle="My RoastMe AI roast" onRetry={onRetry} />
        {/* Card band */}
      </Card>
      {/* FadeIn band */}
    </FadeIn>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  form: { gap: 20 }, // form: items ke beech ki doori
  group: { gap: 10 }, // group: items ke beech ki doori
  groupLabel: { color: colors.text, fontSize: 14, fontWeight: "600" }, // groupLabel: text ka rang, text ka size, text kitna bold
  intensityRow: { flexDirection: "row", gap: 8 }, // intensityRow: items ki direction (row = left-right), items ke beech ki doori
  intensity: { // intensity ka style
    flex: 1, // bachi hui jagah le lo
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // border ka rang
    backgroundColor: "rgba(255,255,255,0.02)", // background ka rang
    padding: 12, // andar ki jagah (charon taraf)
    minHeight: 84, // kam se kam unchai
  }, // intensity band
  intensityActive: { borderColor: "rgba(167,139,250,0.55)", backgroundColor: colors.accentSoft }, // intensityActive: border ka rang, background ka rang
  flames: { flexDirection: "row", gap: 2 }, // flames: items ki direction (row = left-right), items ke beech ki doori
  intensityLabel: { color: colors.text, fontWeight: "600", fontSize: 14, marginTop: 8 }, // intensityLabel: text ka rang, text kitna bold, text ka size
  intensityHint: { color: colors.textFaint, fontSize: 11, marginTop: 2 }, // intensityHint: text ka rang, text ka size, upar bahar ki jagah
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, // chips: items ki direction (row = left-right), jagah kam ho to agli line me, items ke beech ki doori
  chip: { // chip ka style
    borderRadius: radius.pill, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // border ka rang
    paddingHorizontal: 14, // andar ki jagah left-right
    paddingVertical: 8, // andar ki jagah upar-neeche
  }, // chip band
  chipActive: { borderColor: "rgba(167,139,250,0.55)", backgroundColor: "rgba(139,92,246,0.15)" }, // chipActive: border ka rang, background ka rang
  chipText: { color: colors.textMuted, fontSize: 13.5 }, // chipText: text ka rang, text ka size
  chipTextActive: { color: "#ddd6fe" }, // chipTextActive: text ka rang
  hint: { color: colors.textFaint, fontSize: 12 }, // hint: text ka rang, text ka size
  result: { marginTop: 20 }, // result: upar bahar ki jagah
  resultCard: { gap: 18 }, // resultCard: items ke beech ki doori
  resultHeader: { gap: 10 }, // resultHeader: items ke beech ki doori
  resultTitle: { color: colors.text, fontWeight: "600", fontSize: 15 }, // resultTitle: text ka rang, text kitna bold, text ka size
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, // pills: items ki direction (row = left-right), jagah kam ho to agli line me, items ke beech ki doori
  roastText: { color: colors.text, fontSize: 17, lineHeight: 26 }, // roastText: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
