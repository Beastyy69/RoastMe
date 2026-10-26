// NPC tab: AI ke likhe naye sawal (backend se) → ek-ek karke answer → /api/npc se score, title + jawabon pe roast.
import { useEffect, useRef, useState } from "react"; // React hooks
import { Animated, StyleSheet, Text, View } from "react-native"; // animation + basics
import { Feather } from "@expo/vector-icons"; // icons
import { Card, Pill, Screen } from "../components/Layout"; // layout
import { FadeIn, PressableScale } from "../components/Motion"; // animations
import ScoreRing from "../components/ScoreRing"; // gol meter
import ResultActions from "../components/ResultActions"; // copy/share
import { ErrorNotice, LoadingCard } from "../components/StatusViews"; // states
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls
import { colors, radius } from "../theme"; // rang + golai

const PROVIDER_NAMES = { nvidia: "NVIDIA Nemotron", gemini: "Gemini" }; // backend naam → dikhne wala naam

export default function NpcScreen() { // NPC tab
  const questions = useApiAction(api.npcQuestions); // sawal wali call
  const scoring = useApiAction(api.npc); // score wali call
  const [answers, setAnswers] = useState([]); // ab tak ke jawab
  const progress = useRef(new Animated.Value(0)).current; // progress bar (0-1)

  const loadQuestions = questions.run; // sawal lane ka function
  useEffect(() => { // screen khulte hi
    loadQuestions(); // sawal lao
  }, [loadQuestions]); // ek baar

  const list = questions.data?.questions ?? []; // sawalon ki list
  const quizId = questions.data?.quiz_id; // is quiz ki id (score ke time wapas jaati hai)
  const step = answers.length; // abhi ka sawal number
  const current = list[step]; // abhi ka sawal

  useEffect(() => { // jawab badle to progress bar animate
    if (!list.length) return; // sawal nahi to kuch nahi
    Animated.timing(progress, { toValue: step / list.length, duration: 300, useNativeDriver: false }).start(); // bar badhao
  }, [progress, step, list.length]); // dependencies

  // Option chuna → answer jodo; aakhri sawal tha to score mangao
  const choose = (optionIndex) => { // 0-3
    if (answers.length >= list.length) return; // ho gaya to kuch nahi
    const next = [...answers, optionIndex]; // naya jawab jodo
    setAnswers(next); // save
    if (next.length === list.length) scoring.run(quizId, next); // aakhri tha → score + roast
  }; // function band

  const restart = () => { // naya quiz
    setAnswers([]); // jawab khaali
    scoring.reset(); // result hatao
    loadQuestions(); // AI se naye sawal
  }; // function band

  return ( // JSX shuru
    // heading wali screen
    <Screen eyebrow="NPC Meter" title="Are you the main character?" description="Six fresh AI-written questions every time, then a roast of your answers. Just a game.">
      {/* sawal aa rahe hain */}
      {questions.status === "loading" && <LoadingCard message="Writing fresh questions just for you..." />}
      {/* sawal nahi aaye */}
      {questions.status === "error" && <ErrorNotice message={questions.error} onRetry={loadQuestions} />}

      {/* quiz chal raha hai */}
      {questions.status === "success" && scoring.status === "idle" && current && (
        // quiz card
        <Card style={styles.quiz}>
          {/* sawal number + Back */}
          <View style={styles.metaRow}>
            {/* "Question 2 of 8" */}
            <Text style={styles.meta}>
              {/* text */}
              Question {step + 1} of {list.length}
              {/* Text band */}
            </Text>
            {/* pehle sawal ke baad Back */}
            {step > 0 && (
              // back button (aakhri jawab hatao)
              <PressableScale onPress={() => setAnswers((a) => a.slice(0, -1))} accessibilityLabel="Previous question">
                {/* arrow + text */}
                <View style={styles.back}>
                  {/* arrow */}
                  <Feather name="arrow-left" size={13} color={colors.textMuted} />
                  {/* text */}
                  <Text style={styles.meta}>Back</Text>
                  {/* back band */}
                </View>
                {/* PressableScale band */}
              </PressableScale>
              // condition band
            )}
            {/* row band */}
          </View>
          {/* progress track */}
          <View style={styles.track}>
            {/* violet bar (0% → 100%) */}
            <Animated.View
              style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} // width animate
            // self-closing tag yahin band
            />
            {/* track band */}
          </View>

          {/* key badalne pe naya sawal fade hoke aata hai */}
          <FadeIn key={current.id} distance={10}>
            {/* sawal */}
            <Text style={styles.question}>{current.question}</Text>
            {/* options */}
            <View style={styles.options}>
              {/* har option */}
              {current.options.map((option, index) => (
                // dabne wala option
                <PressableScale key={option} onPress={() => choose(index)} accessibilityLabel={option} style={styles.option}>
                  {/* A/B/C/D dabba */}
                  <View style={styles.letter}>
                    {/* 65 = "A" */}
                    <Text style={styles.letterText}>{String.fromCharCode(65 + index)}</Text>
                    {/* dabba band */}
                  </View>
                  {/* option text */}
                  <Text style={styles.optionText}>{option}</Text>
                  {/* option band */}
                </PressableScale>
                // map band
              ))}
              {/* options band */}
            </View>
            {/* FadeIn band */}
          </FadeIn>
          {/* Card band */}
        </Card>
        // condition band
      )}

      {/* score nikal raha hai */}
      {scoring.status === "loading" && <LoadingCard message="Reading your answers and writing your roast..." />}
      {/* score error */}
      {scoring.status === "error" && <ErrorNotice message={scoring.error} onRetry={() => scoring.run(quizId, answers)} />}
      {/* result */}
      {scoring.status === "success" && (
        // fade in
        <FadeIn>
          {/* result card */}
          <Card style={styles.resultCard}>
            {/* pill */}
            <Pill label="Your NPC result" />
            {/* title */}
            <Text style={styles.resultTitle}>{scoring.data.title}</Text>
            {/* AI ka roast (jawabon pe) */}
            <Text style={styles.resultText}>{scoring.data.roast}</Text>
            {/* kisne likha */}
            <Text style={styles.meta}>Roast by {PROVIDER_NAMES[scoring.data.generator?.provider] ?? "local templates"}, based on your answers.</Text>
            {/* NPC score ring */}
            <ScoreRing
              value={scoring.data.npc_score} // score
              label="NPC score" // naam
              caption="Entertainment only. Higher means more NPC. Not a psychological assessment." // note
            // self-closing tag yahin band
            />
            {/* copy/share/retake */}
            <ResultActions
              text={`I got "${scoring.data.title}" with an NPC score of ${scoring.data.npc_score}/100 on RoastMe AI. ${scoring.data.roast}`} // share text
              shareTitle="My NPC Meter result" // share title
              onRetry={restart} // retake
              retryLabel="New quiz" // button text
            // self-closing tag yahin band
            />
            {/* Card band */}
          </Card>
          {/* FadeIn band */}
        </FadeIn>
        // condition band
      )}
      {/* Screen band */}
    </Screen>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  quiz: { gap: 14 }, // quiz: items ke beech ki doori
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 24 }, // metaRow: items ki direction (row = left-right), main-direction me alignment, cross-direction me alignment
  meta: { color: colors.textFaint, fontSize: 12.5 }, // meta: text ka rang, text ka size
  back: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 }, // back: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  track: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }, // track: unchai, kone gol, background ka rang
  fill: { height: "100%", backgroundColor: colors.accent }, // fill: unchai, background ka rang
  question: { color: colors.text, fontSize: 21, fontWeight: "700", lineHeight: 28, marginTop: 10, marginBottom: 16 }, // question: text ka rang, text ka size, text kitna bold
  options: { gap: 10 }, // options: items ke beech ki doori
  option: { // option ka style
    flexDirection: "row", // items ki direction (row = left-right)
    alignItems: "center", // cross-direction me alignment
    gap: 12, // items ke beech ki doori
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // border ka rang
    backgroundColor: "rgba(255,255,255,0.02)", // background ka rang
    paddingHorizontal: 14, // andar ki jagah left-right
    paddingVertical: 14, // andar ki jagah upar-neeche
    minHeight: 56, // kam se kam unchai
  }, // option band
  letter: { // letter ka style
    width: 26, // chaudai
    height: 26, // unchai
    borderRadius: 7, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.12)", // border ka rang
    alignItems: "center", // cross-direction me alignment
    justifyContent: "center", // main-direction me alignment
  }, // letter band
  letterText: { color: colors.textFaint, fontSize: 12, fontWeight: "600" }, // letterText: text ka rang, text ka size, text kitna bold
  optionText: { color: colors.text, fontSize: 15, flex: 1, lineHeight: 21 }, // optionText: text ka rang, text ka size, bachi hui jagah le lo
  resultCard: { gap: 16 }, // resultCard: items ke beech ki doori
  resultTitle: { color: colors.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.6 }, // resultTitle: text ka rang, text ka size, text kitna bold
  resultText: { color: colors.text, fontSize: 16, lineHeight: 24 }, // resultText: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
