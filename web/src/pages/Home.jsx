// Landing page: hero heading, animated example roast, features aur 3 steps.
// Framer Motion se text ek-ek karke aata hai (stagger).
import { motion } from "motion/react"; // animation
import { ArrowRight, Brain, Camera, Drama, Flame, History, Sparkles } from "lucide-react"; // icons
import { Link } from "react-router"; // page link
import { PageTransition } from "../components/PageLayout"; // page wrapper
import { ButtonLink } from "../components/Button"; // button jaisa link
import Card from "../components/Card"; // card box
import ExampleRoastCard from "../components/ExampleRoastCard"; // animated example card

// Feature cards (icon, title, text, kis page pe jaana hai)
const FEATURES = [ // 4 features
  { // feature 1
    icon: Flame, // aag icon
    title: "Roast Generator", // naam
    text: "Share your routine and habits. Pick Friendly, Savage or Extra Spicy and get a personalised roast.", // description
    to: "/roast", // kahan jaana hai
  }, // feature 1 band
  { // feature 2
    icon: Camera, // camera icon
    title: "Camera Roast", // naam
    text: "Turn on your camera, try silly face filters and get roasted for your on-camera energy.", // description
    to: "/camera", // kahan jaana hai
  }, // feature 2 band
  { // feature 3
    icon: Drama, // drama mask icon
    title: "NPC Meter", // naam
    text: "Six fresh AI-written questions every time, then a roast built from your own answers.", // description
    to: "/npc", // kahan jaana hai
  }, // feature 3 band
  { // feature 4
    icon: History, // history icon
    title: "Roast History", // naam
    text: "Revisit your best burns, delete the ones that hit too close to home.", // description
    to: "/history", // kahan jaana hai
  }, // feature 4 band
]; // list band

// "Kaise kaam karta hai" ke 3 steps
const STEPS = [ // { title, text }
  { title: "Tell us your habits", text: "A sentence or two about your routine is plenty." }, // step 1
  { title: "A real classifier reads it", text: "scikit-learn predicts the topic and shows its confidence." }, // step 2
  { title: "Get roasted", text: "Comedy is written to match the topic and intensity you chose." }, // step 3
]; // list band

// Animation presets: neeche se fade hote hue upar aana
const fadeUp = { // variants object
  hidden: { opacity: 0, y: 18 }, // chhupa hua: invisible, neeche
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }, // dikhta hua: apni jagah
}; // object band

// Andar ke elements ko 0.08 sec ke gap se ek-ek karke animate karo
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }; // parent variants

export default function Home() { // component shuru
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* Hero: bada heading + CTA buttons + example card */}
      <section className="grid items-center gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pt-28">
        {/* left side: text jo ek-ek karke aata hai */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          {/* chhota badge */}
          <motion.div variants={fadeUp}>
            {/* rounded pill */}
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
              {/* chamak icon */}
              <Sparkles className="size-3.5 text-violet-400" />
              {/* badge text */}
              Comedy, with a real ML classifier under the hood
              {/* pill band */}
            </span>
            {/* badge wrapper band */}
          </motion.div>
          {/* bada heading */}
          <motion.h1
            variants={fadeUp} // fade-up animation
            className="mt-6 text-[2.6rem] leading-[1.05] font-semibold tracking-[-0.035em] text-white sm:text-6xl lg:text-[4.25rem]" // bada bold text
            // opening tag band
          >
            {/* pehla hissa white (aage ek space) */}
            Your Life. Your Choices.{" "}
            {/* "Our Roast." gradient rang me */}
            <span className="bg-gradient-to-r from-violet-300 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {/* gradient text */}
              Our Roast.
              {/* span band */}
            </span>
            {/* h1 band */}
          </motion.h1>
          {/* subtitle */}
          <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            {/* subtitle text */}
            Describe your routine, your habits and your favourite excuses. RoastMe AI turns them into a witty, personalised roast you'll want to screenshot.
            {/* p band */}
          </motion.p>
          {/* do buttons */}
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-3">
            {/* main CTA */}
            <ButtonLink to="/roast" size="lg">
              {/* text + arrow */}
              Roast Me Now <ArrowRight className="size-4.5" />
              {/* ButtonLink band */}
            </ButtonLink>
            {/* doosra button */}
            <ButtonLink to="/how-it-works" size="lg" variant="secondary">
              {/* text */}
              How it works
              {/* ButtonLink band */}
            </ButtonLink>
            {/* buttons band */}
          </motion.div>
          {/* chhoti line neeche */}
          <motion.p variants={fadeUp} className="mt-6 text-xs text-zinc-600">
            {/* text */}
            Free to use · No sign-up · Playful, never hateful
            {/* p band */}
          </motion.p>
          {/* left side band */}
        </motion.div>

        {/* right side: animated example roast */}
        <ExampleRoastCard />
        {/* hero band */}
      </section>

      {/* Features: scroll karke dikhne pe cards ek-ek karke aate hain */}
      <section className="py-12">
        {/* section heading */}
        <div className="max-w-xl">
          {/* chhota label */}
          <p className="text-sm font-medium text-violet-400">Features</p>
          {/* heading */}
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {/* heading text */}
            Five ways to get humbled
            {/* h2 band */}
          </h2>
          {/* heading band */}
        </div>
        {/* cards ka grid (scroll pe animate) */}
        <motion.div
          variants={stagger} // bachche ek-ek karke
          initial="hidden" // shuru me chhupe
          whileInView="show" // screen pe aate hi dikhao
          viewport={{ once: true, margin: "-80px" }} // ek baar, thoda andar aane pe
          className="mt-10 grid gap-4 sm:grid-cols-2" // grid layout (2 x 2)
          // opening tag band
        >
          {/* har feature ka card */}
          {FEATURES.map(({ icon: Icon, title, text, to }) => (
            // hover pe upar uthne wala wrapper
            <motion.div key={title} variants={fadeUp} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
              {/* poora card clickable link */}
              <Link to={to} className="block h-full">
                {/* card */}
                <Card className="group h-full p-6 transition-colors hover:border-violet-400/30">
                  {/* icon ka dabba */}
                  <span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300 transition-colors group-hover:bg-violet-500/20">
                    {/* icon */}
                    <Icon className="size-5" />
                    {/* dabba band */}
                  </span>
                  {/* title */}
                  <h3 className="mt-5 font-semibold text-white">{title}</h3>
                  {/* description */}
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{text}</p>
                  {/* "Try it →" */}
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-300 opacity-80 transition-opacity group-hover:opacity-100">
                    {/* text + arrow (hover pe arrow khiskta hai) */}
                    Try it <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    {/* span band */}
                  </span>
                  {/* Card band */}
                </Card>
                {/* Link band */}
              </Link>
              {/* wrapper band */}
            </motion.div>
            // map band
          ))}
          {/* grid band */}
        </motion.div>
        {/* features band */}
      </section>

      {/* Steps: 01, 02, 03 */}
      <section className="py-12">
        {/* steps ka card */}
        <Card className="grid gap-8 p-8 sm:p-10 md:grid-cols-3">
          {/* har step */}
          {STEPS.map((step, index) => (
            // scroll pe aane wala step
            <motion.div
              key={step.title} // unique key
              initial={{ opacity: 0, y: 14 }} // shuru me chhupa
              whileInView={{ opacity: 1, y: 0 }} // dikhne pe aaye
              viewport={{ once: true }} // ek baar
              transition={{ delay: index * 0.1, duration: 0.5 }} // ek ke baad ek
              // opening tag band
            >
              {/* 01 / 02 / 03 */}
              <span className="text-sm font-semibold tabular-nums text-violet-400">0{index + 1}</span>
              {/* step title */}
              <h3 className="mt-2 font-semibold text-white">{step.title}</h3>
              {/* step text */}
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.text}</p>
              {/* step band */}
            </motion.div>
            // map band
          ))}
          {/* Card band */}
        </Card>
        {/* How it works ka link */}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-zinc-500">
          {/* brain icon */}
          <Brain className="size-4 text-violet-400" />
          {/* text (aage ek space) */}
          Curious about the model?{" "}
          {/* link */}
          <Link to="/how-it-works" className="text-violet-300 hover:text-violet-200">
            {/* link text */}
            Read how it works
            {/* Link band */}
          </Link>
          {/* p band */}
        </p>
        {/* steps section band */}
      </section>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band
