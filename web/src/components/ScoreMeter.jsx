import { useEffect, useState } from "react"; // React hooks
import { animate, motion, useReducedMotion } from "motion/react"; // animate = number ginna, motion = SVG animation

// Circle ka size aur moti line
const SIZE = 132; // poora size (pixels)
const STROKE = 10; // ring ki motai
const RADIUS = (SIZE - STROKE) / 2; // circle ka radius

// Gol score meter jo 0 se `value` (0-100) tak bharta hai, number bhi count-up hota hai.
export default function ScoreMeter({ value, label, caption }) { // value = score, label = naam, caption = chhota note
  const reduceMotion = useReducedMotion(); // user ne "kam animation" chuna hai?
  const [display, setDisplay] = useState(reduceMotion ? value : 0); // screen pe dikhne wala number

  useEffect(() => { // value badalne pe ginti chalao
    if (reduceMotion) { // animation band hai?
      setDisplay(value); // seedha final number
      return; // bas
    } // if band
    // Number 0 se value tak gino (Framer Motion ka animate)
    const controls = animate(0, value, { // 0 → value
      duration: 1.1, // 1.1 second
      ease: [0.22, 1, 0.36, 1], // smooth slow-down curve
      onUpdate: (latest) => setDisplay(Math.round(latest)), // har step pe number update
    }); // animate band
    return () => controls.stop(); // component hatne pe animation roko
  }, [value, reduceMotion]); // dependencies

  return ( // JSX shuru: ring left me, text right me
    // sabse bahar wala element shuru
    <div className="flex items-center gap-5">
      {/* ring ka dabba */}
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        {/* SVG ring, -90° ghumaya taaki upar se bharna shuru ho */}
        <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
          {/* gradient definitions */}
          <defs>
            {/* halka violet → gehra violet */}
            <linearGradient id="meter-gradient" x1="0" y1="0" x2="1" y2="1">
              {/* shuru ka rang */}
              <stop offset="0%" stopColor="#c4b5fd" />
              {/* aakhri rang */}
              <stop offset="100%" stopColor="#7c3aed" />
              {/* gradient band */}
            </linearGradient>
            {/* defs band */}
          </defs>
          {/* grey background ring */}
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={STROKE} />
          {/* violet ring jo score jitni bharti hai */}
          <motion.circle
            cx={SIZE / 2} // center x
            cy={SIZE / 2} // center y
            r={RADIUS} // radius
            fill="none" // andar khaali
            stroke="url(#meter-gradient)" // gradient wala rang
            strokeWidth={STROKE} // motai
            strokeLinecap="round" // gol sire
            initial={{ pathLength: reduceMotion ? value / 100 : 0 }} // shuru me khaali (ya seedha full)
            animate={{ pathLength: value / 100 }} // score jitna bharo
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} // number ke saath same speed
          // self-closing tag yahin band
          />
          {/* svg band */}
        </svg>
        {/* ring ke beech number */}
        <div className="absolute inset-0 grid place-items-center">
          {/* bada number (screen reader ke liye "X out of 100") */}
          <span className="text-3xl font-semibold tabular-nums tracking-tight text-white" aria-label={`${value} out of 100`}>
            {/* ginta hua number */}
            {display}
            {/* span band */}
          </span>
          {/* center band */}
        </div>
        {/* ring dabba band */}
      </div>
      {/* right side ka text */}
      <div className="min-w-0">
        {/* label (jaise "Heat rating") */}
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {/* caption ho to chhota grey note */}
        {caption && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{caption}</p>}
        {/* text band */}
      </div>
      {/* row band */}
    </div>
  ); // JSX band
} // component band
