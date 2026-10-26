// NPC Meter quiz: har baar AI (backend pe) naye sawal likhta hai, ek-ek karke dikhte hain,
// aakhri jawab ke baad /api/npc se score, title aur unhi jawabon pe roast milta hai.
import { useCallback, useEffect, useState } from "react"; // React hooks
import { motion } from "motion/react"; // animation
import { ArrowLeft, Drama } from "lucide-react"; // icons: peeche arrow, drama mask
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import Card from "../components/Card"; // card box
import ScoreMeter from "../components/ScoreMeter"; // gol meter
import ResultActions from "../components/ResultActions"; // copy/share
import { ErrorNotice, LoadingCard } from "../components/StatusViews"; // states
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls

const PROVIDER_NAMES = { nvidia: "NVIDIA Nemotron", gemini: "Gemini" }; // backend naam → dikhne wala naam

export default function NpcMeter() { // page component
  // Do API calls: sawal lana aur score nikalna
  const questions = useApiAction(api.npcQuestions); // sawal wali call
  const scoring = useApiAction(api.npc); // score wali call
  const [answers, setAnswers] = useState([]); // ab tak ke jawab (option numbers)

  const loadQuestions = questions.run; // sawal lane ka function
  useEffect(() => { // page khulte hi
    loadQuestions(); // sawal lao
  }, [loadQuestions]); // ek baar

  const list = questions.data?.questions ?? []; // sawalon ki list (abhi na aayi ho to khaali)
  const quizId = questions.data?.quiz_id; // is quiz ki id (score ke time wapas bhejte hain)
  // Jitne answers diye, utna aage (step 0 = pehla sawal)
  const step = answers.length; // abhi ka sawal number
  const current = list[step]; // abhi ka sawal

  // Option chuna → answer jodo; aakhri sawal tha to score mangao
  const choose = (optionIndex) => { // optionIndex = 0,1,2,3
    if (answers.length >= list.length) return; // saare ho gaye to kuch mat karo
    const next = [...answers, optionIndex]; // naya answer jodo
    setAnswers(next); // save
    if (next.length === list.length) scoring.run(quizId, next); // aakhri tha → score + roast mangao
  }; // function band

  const restart = useCallback(() => { // naya quiz (naye sawal)
    setAnswers([]); // jawab khaali
    scoring.reset(); // result hatao
    loadQuestions(); // AI se naye sawal lao
  }, [scoring, loadQuestions]); // dependencies

  const goBack = () => setAnswers((current) => current.slice(0, -1)); // aakhri jawab hatao = ek sawal peeche

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* page heading */}
      <PageHeader
        eyebrow="NPC Meter" // label
        title="Are you the main character?" // title
        description="Six fresh questions written by AI every time, then a roast built from your answers. It's a game, not a psychological assessment." // description
      // self-closing tag yahin band
      />

      {/* beech ki column */}
      <div className="mx-auto max-w-2xl">
        {/* sawal aa rahe hain */}
        {questions.status === "loading" && <LoadingCard message="Writing fresh questions just for you..." />}
        {/* sawal nahi aaye */}
        {questions.status === "error" && <ErrorNotice message={questions.error} onRetry={loadQuestions} />}

        {/* quiz chal raha hai (sawal hain, score abhi nahi) */}
        {questions.status === "success" && scoring.status === "idle" && current && (
          // quiz card
          <Card className="p-6 sm:p-8">
            {/* upar: "Question 2 of 8" + Back */}
            <div className="flex items-center justify-between text-xs text-zinc-500">
              {/* sawal number */}
              <span className="tabular-nums">
                {/* text */}
                Question {step + 1} of {list.length}
                {/* span band */}
              </span>
              {/* pehle sawal ke baad Back button */}
              {step > 0 && (
                // back button
                <button type="button" onClick={goBack} className="inline-flex items-center gap-1 hover:text-zinc-200">
                  {/* arrow + text */}
                  <ArrowLeft className="size-3.5" /> Back
                  {/* button band */}
                </button>
                // condition band
              )}
              {/* row band */}
            </div>
            {/* progress bar ka track */}
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]">
              {/* violet bar jo har jawab pe badhta hai */}
              <motion.div
                className="h-full rounded-full bg-violet-500" // violet bar
                animate={{ width: `${(step / list.length) * 100}%` }} // kitna quiz ho gaya
                transition={{ duration: 0.35, ease: "easeOut" }} // smooth
              // self-closing tag yahin band
              />
              {/* track band */}
            </div>

            {/* key badalne se har naya sawal slide hoke aata hai. Exit animation nahi, taaki purane options galti se click na hon */}
            <motion.div
              key={current.id} // har sawal ki alag key
              initial={{ opacity: 0, x: 24 }} // right se
              animate={{ opacity: 1, x: 0 }} // apni jagah
              transition={{ duration: 0.25, ease: "easeOut" }} // jaldi
              // opening tag band
            >
              {/* sawal */}
              <h2 className="mt-8 text-xl font-semibold tracking-tight text-white sm:text-2xl">{current.question}</h2>
              {/* options ki list */}
              <div className="mt-6 grid gap-2.5">
                {/* har option ek button */}
                {current.options.map((option, index) => (
                  // option button
                  <motion.button
                    key={option} // key
                    type="button" // submit na kare
                    whileHover={{ x: 3 }} // hover pe thoda right
                    whileTap={{ scale: 0.98 }} // dabane pe chhota
                    onClick={() => choose(index)} // chuno
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left text-[15px] text-zinc-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/[0.06]" // style
                    // opening tag band
                  >
                    {/* A / B / C / D wala chhota dabba */}
                    <span className="grid size-6 shrink-0 place-items-center rounded-md border border-white/10 text-xs text-zinc-500">
                      {/* 65 = "A" (index 0 → A, 1 → B...) */}
                      {String.fromCharCode(65 + index)}
                      {/* dabba band */}
                    </span>
                    {/* option ka text */}
                    {option}
                    {/* button band */}
                  </motion.button>
                  // map band
                ))}
                {/* options band */}
              </div>
              {/* sawal wrapper band */}
            </motion.div>
            {/* Card band */}
          </Card>
          // condition band
        )}

        {/* score nikal raha hai */}
        {scoring.status === "loading" && <LoadingCard message="Reading your answers and writing your roast..." />}
        {/* score me error */}
        {scoring.status === "error" && <ErrorNotice message={scoring.error} onRetry={() => scoring.run(quizId, answers)} />}
        {/* result card */}
        {scoring.status === "success" && <NpcResult result={scoring.data} onRestart={restart} />}
        {/* column band */}
      </div>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band

// Quiz ka result card
function NpcResult({ result, onRestart }) { // result = backend ka data
  const shareText = `I got "${result.title}" with an NPC score of ${result.npc_score}/100 on RoastMe AI. ${result.roast}`; // share text
  const writer = PROVIDER_NAMES[result.generator?.provider] ?? "local templates"; // roast kisne likha

  return ( // JSX shuru
    // spring se aane wala wrapper
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }} // neeche se, chhota
      animate={{ opacity: 1, y: 0, scale: 1 }} // apni jagah
      transition={{ type: "spring", stiffness: 260, damping: 26 }} // spring
      // opening tag band
    >
      {/* card */}
      <Card className="overflow-hidden">
        {/* upar violet glow wala hissa */}
        <div className="bg-[radial-gradient(80%_120%_at_0%_0%,rgb(124_58_237/0.22),transparent_60%)] p-6 sm:p-8">
          {/* "Your NPC result" pill */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
            {/* icon + text */}
            <Drama className="size-3.5" /> Your NPC result
            {/* pill band */}
          </span>
          {/* title jaise "Background Villager" */}
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">{result.title}</h2>
          {/* AI ka roast (jawabon pe) */}
          <p className="mt-3 text-lg leading-relaxed text-zinc-200">{result.roast}</p>
          {/* kisne likha */}
          <p className="mt-3 text-xs text-zinc-500">Roast by {writer}, based on your answers.</p>
          {/* upar band */}
        </div>
        {/* neeche: meter + buttons */}
        <div className="space-y-6 border-t border-white/[0.06] p-6 sm:p-8">
          {/* NPC score meter */}
          <ScoreMeter
            value={result.npc_score} // score
            label="NPC score" // naam
            caption="Entertainment only. Points from your answers, not a psychological assessment. Higher means more NPC." // note
          // self-closing tag yahin band
          />
          {/* copy / share / retake */}
          <ResultActions text={shareText} shareTitle="My NPC Meter result" onRetry={onRestart} retryLabel="New quiz" />
          {/* neeche band */}
        </div>
        {/* Card band */}
      </Card>
      {/* wrapper band */}
    </motion.div>
  ); // JSX band
} // component band
