// How It Works page: ML aur comedy alag kaise hain, live model status (/health),
// aur model ki limitations imaandaari se.
import { useEffect } from "react"; // page khulne pe kaam chalane ke liye
import { motion } from "motion/react"; // animation
import { Brain, Gauge, PenLine, ShieldCheck } from "lucide-react"; // icons
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import Card from "../components/Card"; // card box
import { Spinner } from "../components/StatusViews"; // loader
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls

// System ke 4 hisse samjhane wale cards
const PARTS = [ // { icon, title, text }
  { // card 1
    icon: Brain, // dimaag icon
    title: "1. Topic classifier (real ML)", // title
    text: "A scikit-learn pipeline (TF-IDF word + character n-grams, then Logistic Regression) predicts whether your text is about student life, procrastination, gaming, productivity or general life. If the top probability is below 40%, we fall back to a neutral category instead of pretending to know.", // text
  }, // card 1 band
  { // card 2
    icon: PenLine, // pen icon
    title: "2. Comedy writer (separate)", // title
    text: "The roast itself is written either by an AI provider configured on the server or by hand-written local templates. The classifier never writes jokes, and the joke writer never makes predictions.", // text
  }, // card 2 band
  { // card 3
    icon: Gauge, // meter icon
    title: "3. Fun scores (formulas)", // title
    text: "Heat rating, camera roast score and NPC score are simple, transparent formulas for entertainment. They are not predictions and they don't measure anything real about you.", // text
  }, // card 3 band
  { // card 4
    icon: ShieldCheck, // shield icon
    title: "4. Guardrails", // title
    text: "Jokes target habits and choices only, never appearance or identity. Inputs are length-limited, requests are rate-limited, and history stores the result, not your original text.", // text
  }, // card 4 band
]; // list band

// Model ki kamiyan (honest disclosure)
const LIMITATIONS = [ // har kami ek line
  "The model learns from about 1,100 example lines written by an AI (NVIDIA Nemotron), not real user data.", // data AI ka likha hai
  "It is tested on 150 separate hand-written lines it never trained on, and gets about 79% right. Procrastination is its weakest topic (about half right).", // asli test ka number
  "Expect mistakes, especially for short or mixed-topic text.", // galtiyan hongi
  "The model only knows vocabulary. It doesn't understand you, your personality or how \"roastable\" you are.", // sirf words samajhta hai
]; // list band

export default function HowItWorks() { // component shuru
  const health = useApiAction(api.health); // /health call ki state
  const runHealth = health.run; // call chalane wala function

  useEffect(() => { // page khulte hi
    // Page khulte hi backend se model ki live info lao
    runHealth(); // /health call
  }, [runHealth]); // ek hi baar

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* page heading */}
      <PageHeader
        eyebrow="How It Works" // chhota label
        title="Honest comedy engineering" // title
        description="RoastMe AI keeps the machine learning and the comedy deliberately separate, so you always know which part did what." // description
      // self-closing tag yahin band
      />

      {/* 4 cards ka grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* har part ka card (scroll pe dikhne par animate) */}
        {PARTS.map(({ icon: Icon, title, text }, index) => (
          // animated wrapper
          <motion.div
            key={title} // unique key
            initial={{ opacity: 0, y: 14 }} // shuru me invisible
            whileInView={{ opacity: 1, y: 0 }} // screen pe aate hi dikhe
            viewport={{ once: true }} // sirf ek baar animate
            transition={{ delay: index * 0.06, duration: 0.45 }} // ek ke baad ek
            // opening tag band
          >
            {/* card */}
            <Card className="h-full p-6">
              {/* icon ka dabba */}
              <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                {/* icon */}
                <Icon className="size-5" />
                {/* dabba band */}
              </span>
              {/* title */}
              <h2 className="mt-5 font-semibold text-white">{title}</h2>
              {/* text */}
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
              {/* Card band */}
            </Card>
            {/* wrapper band */}
          </motion.div>
          // map band
        ))}
        {/* grid band */}
      </div>

      {/* neeche do cards: live status + limitations */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* live model status card */}
        <Card className="p-6">
          {/* heading */}
          <h2 className="font-semibold text-white">Live model status</h2>
          {/* chhoti line */}
          <p className="mt-1 text-sm text-zinc-500">Read from the backend's /health endpoint.</p>
          {/* status ka content */}
          <div className="mt-5">
            {/* loading ho raha hai */}
            {health.isLoading && (
              // loader + text
              <p className="flex items-center gap-2 text-sm text-zinc-400">
                {/* spinner + text */}
                <Spinner /> Checking the server...
                {/* p band */}
              </p>
              // condition band
            )}
            {/* error aaya to laal text */}
            {health.status === "error" && <p className="text-sm text-red-300">{health.error}</p>}
            {/* success: models ki list */}
            {health.status === "success" && (
              // list
              <ul className="space-y-3">
                {/* har model ki ek row */}
                {health.data.models.map((model) => (
                  // model row
                  <li key={model.name} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm">
                    {/* naam + Loaded/Not loaded */}
                    <div className="flex items-center justify-between">
                      {/* model ka naam */}
                      <span className="font-medium text-zinc-200">{model.name}</span>
                      {/* green ya amber status */}
                      <span className={model.loaded ? "text-emerald-400" : "text-amber-400"}>
                        {/* status text */}
                        {model.loaded ? "Loaded" : "Not loaded"}
                        {/* span band */}
                      </span>
                      {/* row band */}
                    </div>
                    {/* load hua to details */}
                    {model.loaded && (
                      // details line
                      <p className="mt-1.5 text-zinc-500">
                        {/* examples, labels, accuracy */}
                        {model.training_examples} training examples · {model.labels.length} labels · accuracy on {model.test_examples} unseen hand-written lines <span className="tabular-nums text-zinc-300">{Math.round(model.test_accuracy * 100)}%</span>
                        {/* p band */}
                      </p>
                      // condition band
                    )}
                    {/* li band */}
                  </li>
                  // map band
                ))}
                {/* comedy generator + history storage */}
                <li className="text-sm text-zinc-500">
                  {/* kaunsa AI aur history kahan */}
                  Comedy generator: <span className="text-zinc-300">{health.data.comedy_generator}</span> · History: <span className="text-zinc-300">{health.data.history_storage}</span>
                  {/* li band */}
                </li>
                {/* list band */}
              </ul>
              // condition band
            )}
            {/* content band */}
          </div>
          {/* Card band */}
        </Card>

        {/* limitations card */}
        <Card className="p-6">
          {/* heading */}
          <h2 className="font-semibold text-white">Known limitations</h2>
          {/* list */}
          <ul className="mt-4 space-y-3">
            {/* har kami */}
            {LIMITATIONS.map((item) => (
              // ek item
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                {/* violet dot */}
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet-400" />
                {/* text */}
                {item}
                {/* li band */}
              </li>
              // map band
            ))}
            {/* list band */}
          </ul>
          {/* Card band */}
        </Card>
        {/* do cards ka grid band */}
      </div>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band
