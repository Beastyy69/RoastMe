// Roast Generator page: form (nickname, bio, habits, intensity, category)
// → backend /api/roast → result card (roast, heat meter, ML insight, copy/share).
import { useState } from "react"; // form state ke liye
import { AnimatePresence, motion } from "motion/react"; // animation
import { Flame } from "lucide-react"; // aag icon
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import { Button } from "../components/Button"; // button
import Card from "../components/Card"; // card box
import Field from "../components/Field"; // input/textarea
import ScoreMeter from "../components/ScoreMeter"; // gol score meter
import MlInsight from "../components/MlInsight"; // ML prediction box
import ResultActions from "../components/ResultActions"; // copy/share buttons
import { EmptyState, ErrorNotice, LoadingCard, Spinner } from "../components/StatusViews"; // states
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls
import { CATEGORIES, INTENSITIES, LIMITS, categoryLabel, intensityLabel } from "../constants"; // lists + limits

// Form ki shuruaati values
const INITIAL_FORM = { nickname: "", bio: "", habits: "", intensity: "savage", category: "auto" }; // default form

// Server ko bhejne se pehle browser me hi check (bio kam se kam 10 characters)
function validate(form) { // form check karo
  const errors = {}; // galtiyan yahan
  if (form.bio.trim().length < LIMITS.bioMin) { // bio bahut chhota?
    errors.bio = `Give us at least ${LIMITS.bioMin} characters to work with.`; // error message
  } // if band
  return errors; // khaali = sab theek
} // function band

// Intensity button ki class (chuna hua = violet)
function intensityClass(active) { // active = ye option chuna hai?
  const color = active ? "border-violet-400/50 bg-violet-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"; // rang
  return `relative rounded-xl border px-3 py-3 text-left transition-colors ${color}`; // poori class
} // function band

// Category chip ki class (chuna hua = violet)
function chipClass(active) { // active = ye chip chuni hai?
  const color = active ? "border-violet-400/50 bg-violet-500/15 text-violet-200" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"; // rang
  return `rounded-full border px-3.5 py-1.5 text-sm transition-colors ${color}`; // poori class
} // function band

export default function RoastGenerator() { // page component
  const [form, setForm] = useState(INITIAL_FORM); // form ka data
  const [errors, setErrors] = useState({}); // form ki galtiyan
  // roast.status se decide hota hai: empty / loading / error / result
  const roast = useApiAction(api.roast); // /api/roast ki state

  // Kisi bhi field ko update karne wala common function
  const update = (key) => (event) => { // key = "bio" jaisa, event = typing
    setForm((current) => ({ ...current, [key]: event.target.value })); // sirf wahi field badlo
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined })); // typing pe error hatao
  }; // function band

  // Roast Me dabane pe: validate → API call
  const submit = (event) => { // form submit
    event?.preventDefault(); // page reload mat karo
    const found = validate(form); // check karo
    setErrors(found); // galtiyan dikhao
    if (Object.keys(found).length) return; // galti hai to ruk jao
    roast.run({ // backend ko bhejo
      nickname: form.nickname.trim() || undefined, // khaali ho to mat bhejo
      bio: form.bio.trim(), // bio (spaces hata ke)
      habits: form.habits.trim() || undefined, // khaali ho to mat bhejo
      intensity: form.intensity, // friendly/savage/extra_spicy
      category: form.category, // auto ya chuni hui
    }); // run band
  }; // function band

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* page heading */}
      <PageHeader
        eyebrow="Roast Generator" // chhota label
        title="Serve us your routine" // title
        description="The more specific you are, the more personal the roast. We only keep the finished roast in your history, not what you type here." // description
      // self-closing tag yahin band
      />

      {/* do columns: form left, result right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        {/* form (Card ko <form> bana diya) */}
        <Card as="form" onSubmit={submit} noValidate className="space-y-6 p-6 sm:p-8">
          {/* nickname */}
          <Field
            id="nickname" // id
            label="Nickname (optional)" // label
            placeholder="What should we call you?" // placeholder
            value={form.nickname} // abhi ki value
            maxLength={LIMITS.nickname} // max 30
            onChange={update("nickname")} // typing pe update
            autoComplete="off" // browser suggestions band
          // self-closing tag yahin band
          />
          {/* bio (zaroori) */}
          <Field
            id="bio" // id
            label="Bio or daily routine" // label
            placeholder="e.g. Computer science student. I wake up at noon, skip the 9am lecture and game until 3am." // example
            multiline // textarea
            rows={4} // 4 lines
            value={form.bio} // abhi ki value
            maxLength={LIMITS.bio} // max 600
            onChange={update("bio")} // typing pe update
            error={errors.bio} // error message (ho to)
          // self-closing tag yahin band
          />
          {/* habits (optional) */}
          <Field
            id="habits" // id
            label="Habits & favourite excuses (optional)" // label
            placeholder="e.g. I always say I'll start tomorrow. I blame Wi-Fi for everything." // example
            multiline // textarea
            rows={3} // 3 lines
            value={form.habits} // abhi ki value
            maxLength={LIMITS.habits} // max 400
            onChange={update("habits")} // typing pe update
          // self-closing tag yahin band
          />

          {/* intensity chunne wala group */}
          <fieldset>
            {/* group ka naam */}
            <legend className="text-sm font-medium text-zinc-200">Roast intensity</legend>
            {/* 3 buttons ek row me */}
            <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup">
              {/* har intensity ka button */}
              {INTENSITIES.map((option) => {
                const active = form.intensity === option.value; // ye chuna hai?
                return ( // button lautao
                  // animated button
                  <motion.button
                    key={option.value} // unique key
                    type="button" // form submit na kare
                    role="radio" // screen reader: radio option
                    aria-checked={active} // chuna hai ya nahi
                    whileTap={{ scale: 0.97 }} // dabane pe halka chhota
                    onClick={() => setForm((current) => ({ ...current, intensity: option.value }))} // chuno
                    className={intensityClass(active)} // style
                    // opening tag band
                  >
                    {/* flames (1, 2 ya 3) */}
                    <span className="flex gap-0.5" aria-hidden="true">
                      {/* jitne flames utne icons */}
                      {Array.from({ length: option.flames }).map((_, i) => (
                        // ek flame icon
                        <Flame key={i} className={`size-3.5 ${active ? "text-violet-300" : "text-zinc-600"}`} />
                        // map band
                      ))}
                      {/* flames band */}
                    </span>
                    {/* naam */}
                    <span className="mt-2 block text-sm font-medium text-white">{option.label}</span>
                    {/* chhota hint (mobile pe chhupa) */}
                    <span className="hidden text-xs text-zinc-500 sm:block">{option.hint}</span>
                    {/* button band */}
                  </motion.button>
                ); // return band
                // map function band
              })}
              {/* row band */}
            </div>
            {/* fieldset band */}
          </fieldset>

          {/* category chunne wala group */}
          <fieldset>
            {/* group ka naam */}
            <legend className="text-sm font-medium text-zinc-200">Category</legend>
            {/* chips */}
            <div className="mt-2 flex flex-wrap gap-2">
              {/* har category ki chip */}
              {CATEGORIES.map((option) => {
                const active = form.category === option.value; // ye chuni hai?
                return ( // chip lautao
                  // chip button
                  <button
                    key={option.value} // unique key
                    type="button" // submit na kare
                    aria-pressed={active} // dabi hui hai ya nahi
                    onClick={() => setForm((current) => ({ ...current, category: option.value }))} // chuno
                    className={chipClass(active)} // style
                    // opening tag band
                  >
                    {/* chip ka naam */}
                    {option.label}
                    {/* button band */}
                  </button>
                ); // return band
                // map function band
              })}
              {/* chips band */}
            </div>
            {/* chhota note */}
            <p className="mt-2 text-xs text-zinc-500">Auto-detect lets the ML classifier pick the topic from your text.</p>
            {/* fieldset band */}
          </fieldset>

          {/* submit button (loading me disabled) */}
          <Button type="submit" size="lg" className="w-full" disabled={roast.isLoading}>
            {/* loading me spinner, warna flame */}
            {roast.isLoading ? <Spinner /> : <Flame className="size-4.5" />}
            {/* loading me "Roasting...", warna "Roast Me" */}
            {roast.isLoading ? "Roasting..." : "Roast Me"}
            {/* Button band */}
          </Button>
          {/* form band */}
        </Card>

        {/* right side: result area (badi screen pe chipka rehta hai) */}
        <div className="lg:sticky lg:top-24" aria-live="polite">
          {/* ek state jaaye phir doosri aaye */}
          <AnimatePresence mode="wait">
            {/* abhi kuch nahi kiya: empty state */}
            {roast.status === "idle" && (
              // fade wrapper
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* dashed empty box */}
                <EmptyState icon={Flame} title="Your roast will appear here">
                  {/* tip text */}
                  Fill in your routine and hit <span className="text-zinc-300">Roast Me</span>. Tip: mention a habit you're a little proud of. That's usually the best material.
                  {/* EmptyState band */}
                </EmptyState>
                {/* wrapper band */}
              </motion.div>
              // condition band
            )}
            {/* loading state */}
            {roast.status === "loading" && (
              // fade wrapper
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* skeleton card */}
                <LoadingCard message="Reading your habits and sharpening the punchlines..." />
                {/* wrapper band */}
              </motion.div>
              // condition band
            )}
            {/* error state */}
            {roast.status === "error" && (
              // fade wrapper
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* laal error box + retry */}
                <ErrorNotice message={roast.error} onRetry={submit} />
                {/* wrapper band */}
              </motion.div>
              // condition band
            )}
            {/* success: result card */}
            {roast.status === "success" && <RoastResult key="result" result={roast.data} onRetry={submit} />}
            {/* AnimatePresence band */}
          </AnimatePresence>
          {/* result area band */}
        </div>
        {/* columns band */}
      </div>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band

// Result card: spring animation ke saath aata hai
function RoastResult({ result, onRetry }) { // result = backend ka data
  return ( // JSX shuru
    // spring se aane wala wrapper
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }} // neeche, thoda chhota
      animate={{ opacity: 1, y: 0, scale: 1 }} // apni jagah, poora size
      exit={{ opacity: 0, y: -8 }} // jaate waqt upar fade
      transition={{ type: "spring", stiffness: 260, damping: 26 }} // spring effect
      // opening tag band
    >
      {/* card */}
      <Card className="overflow-hidden">
        {/* upar ki row: kiska roast + pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] px-6 py-4">
          {/* "Arq's roast" ya "Your roast" */}
          <span className="text-sm font-medium text-white">
            {/* naam diya to naam wala text */}
            {result.nickname ? `${result.nickname}'s roast` : "Your roast"}
            {/* span band */}
          </span>
          {/* intensity pill */}
          <span className="ml-auto rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
            {/* "Savage" jaisa */}
            {intensityLabel(result.intensity)}
            {/* pill band */}
          </span>
          {/* category pill */}
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400">
            {/* category ka naam */}
            {categoryLabel(result.category)}
            {/* user ne chuni ya ML ne */}
            {result.category_source === "user" ? " · your pick" : " · auto"}
            {/* pill band */}
          </span>
          {/* row band */}
        </div>

        {/* card ka main content */}
        <div className="space-y-6 p-6">
          {/* roast ka text */}
          <p className="text-lg leading-relaxed text-zinc-100">{result.roast}</p>
          {/* heat meter */}
          <ScoreMeter
            value={result.heat_rating} // score
            label="Heat rating" // naam
            caption="A playful formula based on intensity and how much roastable material you gave us. Not an ML prediction." // note
          // self-closing tag yahin band
          />
          {/* ML ne kya predict kiya */}
          <MlInsight ml={result.ml} generator={result.generator} fallbackLabel="General" />
          {/* copy / share / another */}
          <ResultActions text={result.roast} shareTitle="My RoastMe AI roast" onRetry={onRetry} />
          {/* content band */}
        </div>
        {/* Card band */}
      </Card>
      {/* wrapper band */}
    </motion.div>
  ); // JSX band
} // component band
