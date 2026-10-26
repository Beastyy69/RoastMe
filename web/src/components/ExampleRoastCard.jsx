import { useEffect, useState } from "react"; // React hooks
import { AnimatePresence, motion, useReducedMotion } from "motion/react"; // animation tools
import { Brain, Flame } from "lucide-react"; // icons
import Card from "./Card"; // card box

// Home page ka animated example card. Ye fixed examples hain (asli API result nahi), har 5 sec me badalte hain.
const EXAMPLES = [ // 3 sample roasts
  { // example 1
    name: "Alex", // naam
    intensity: "Savage", // kitna teekha
    topic: "Gaming", // topic
    text: "You blame lag so often your router is considering therapy. \"One more match\" is the longest lie in your vocabulary.", // roast
    heat: 74, // heat score
  }, // example 1 band
  { // example 2
    name: "Priya", // naam
    intensity: "Friendly", // halka
    topic: "Student Life", // topic
    text: "Your study plan is ambitious. Your study execution is fan fiction. Still, we love you. Finish one thing today.", // roast
    heat: 41, // heat score
  }, // example 2 band
  { // example 3
    name: "Sam", // naam
    intensity: "Extra Spicy", // sabse teekha
    topic: "Procrastination", // topic
    text: "Your motivation arrives like a delivery driver: two hours late, then leaves it at the wrong door.", // roast
    heat: 88, // heat score
  }, // example 3 band
]; // list band

export default function ExampleRoastCard() { // component shuru
  const [index, setIndex] = useState(0); // abhi kaunsa example dikh raha
  const reduceMotion = useReducedMotion(); // "kam animation" setting
  const example = EXAMPLES[index]; // abhi wala example

  useEffect(() => { // auto-rotate chalu karo
    if (reduceMotion) return; // animation band hai to rotate mat karo
    // Har 5.2 second me agla example (reduce-motion on ho to nahi)
    const timer = setInterval(() => setIndex((i) => (i + 1) % EXAMPLES.length), 5200); // 0→1→2→0...
    return () => clearInterval(timer); // component hatne pe timer band
  }, [reduceMotion]); // dependency

  return ( // JSX shuru: card neeche se halka tedha hoke aata hai
    // sabse bahar wala element shuru
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }} // shuru me invisible, neeche, thoda tedha
      animate={{ opacity: 1, y: 0, rotate: 0 }} // seedha apni jagah
      transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} // 0.25 sec baad, smooth
      className="relative" // glow ke liye
      // opening tag band
    >
      {/* card ke peeche violet glow */}
      <div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-violet-600/15 blur-3xl" />
      {/* asli card */}
      <Card className="overflow-hidden">
        {/* upar ki row: avatar + naam left, intensity right */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          {/* left side */}
          <div className="flex items-center gap-3">
            {/* gol violet avatar */}
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700">
              {/* flame icon */}
              <Flame className="size-4 text-white" />
              {/* avatar band */}
            </span>
            {/* naam wala text */}
            <div>
              {/* app naam */}
              <p className="text-sm font-medium text-white">RoastMe AI</p>
              {/* kiska example */}
              <p className="text-xs text-zinc-500">Example roast for {example.name}</p>
              {/* text band */}
            </div>
            {/* left band */}
          </div>
          {/* intensity pill */}
          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
            {/* "Savage" jaisa */}
            {example.intensity}
            {/* pill band */}
          </span>
          {/* upar ki row band */}
        </div>

        {/* roast ka text (badalne pe blur fade animation) */}
        <div className="min-h-[148px] px-5 py-6">
          {/* purana text jaaye phir naya aaye */}
          <AnimatePresence mode="wait">
            {/* key badalne pe naya paragraph animate hota hai */}
            <motion.p
              key={index} // har example ki alag key
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} // neeche se, blur
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} // saaf
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} // upar jaate hue blur
              transition={{ duration: 0.45 }} // 0.45 sec
              className="text-[17px] leading-relaxed text-zinc-100" // text style
              // opening tag band
            >
              {/* quotes ke andar roast */}
              “{example.text}”
              {/* paragraph band */}
            </motion.p>
            {/* AnimatePresence band */}
          </AnimatePresence>
          {/* text area band */}
        </div>

        {/* neeche: heat bar + topic */}
        <div className="space-y-3 border-t border-white/[0.06] px-5 py-4">
          {/* "Heat rating" aur number */}
          <div className="flex items-center justify-between text-xs">
            {/* label */}
            <span className="text-zinc-500">Heat rating</span>
            {/* number */}
            <span className="tabular-nums text-zinc-300">{example.heat}/100</span>
            {/* row band */}
          </div>
          {/* bar ka track */}
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            {/* violet bar jo heat jitna bharta hai */}
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600" // gradient bar
              animate={{ width: `${example.heat}%` }} // heat % jitni width
              transition={{ duration: 0.9, ease: "easeOut" }} // smooth
            // self-closing tag yahin band
            />
            {/* track band */}
          </div>
          {/* classifier ne kya topic bataya */}
          <p className="flex items-center gap-1.5 text-xs text-zinc-500">
            {/* brain icon + text */}
            <Brain className="size-3.5 text-violet-400" /> Topic detected by classifier: {example.topic}
            {/* p band */}
          </p>
          {/* neeche wala hissa band */}
        </div>
        {/* Card band */}
      </Card>

      {/* neeche 3 dots (kaunsa example chal raha hai) */}
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
        {/* har example ka ek dot */}
        {EXAMPLES.map((_, i) => (
          // active dot lamba aur violet
          <span key={i} className={`h-1 rounded-full transition-all ${i === index ? "w-6 bg-violet-400" : "w-1.5 bg-white/15"}`} />
          // map band
        ))}
        {/* dots band */}
      </div>
      {/* wrapper band */}
    </motion.div>
  ); // JSX band
} // component band
