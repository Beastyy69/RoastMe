// Reusable Button aur ButtonLink (link jo button jaisa dikhe).
// variant = primary / secondary / ghost / danger, size = sm / md / lg.
import { motion } from "motion/react"; // animation library
import { Link } from "react-router"; // page link

// React Router ke Link ko animation wala bana do
const MotionLink = motion.create(Link); // ab Link pe whileHover/whileTap chalenge

const VARIANTS = { // har style ki Tailwind classes
  primary: // main violet button
    "bg-violet-600 text-white shadow-[0_8px_30px_-8px_rgb(124_58_237/0.6)] hover:bg-violet-500 disabled:bg-violet-600/50", // violet + glow
  secondary: "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08] hover:border-white/20", // halka border wala
  ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]", // bina background
  danger: "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20", // laal (delete ke liye)
}; // object band

const SIZES = { // har size ki height, padding, text
  sm: "h-9 px-3.5 text-sm gap-1.5", // chhota
  md: "h-11 px-5 text-[15px] gap-2", // normal
  lg: "h-13 px-7 text-base gap-2.5", // bada
}; // object band

function classes(variant, size, className) { // saari classes jodke ek string
  return [ // list
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors", // basic layout
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30", // keyboard focus ring
    "disabled:cursor-not-allowed disabled:opacity-60", // disabled look
    VARIANTS[variant], // chuna hua style
    SIZES[size], // chuna hua size
    className, // bahar se aayi extra classes
  ].join(" "); // space se jodo
} // function band

// Hover pe halka upar, click pe halka dabna (Framer Motion)
const tap = { whileHover: { y: -1 }, whileTap: { scale: 0.97 } }; // animation props

export function Button({ variant = "primary", size = "md", className = "", children, ...props }) { // normal button
  return ( // JSX shuru: animated <button>
    // sabse bahar wala element shuru
    <motion.button {...tap} className={classes(variant, size, className)} {...props}>
      {/* button ke andar ka text/icon */}
      {children}
      {/* button band */}
    </motion.button>
  ); // JSX band
} // component band

export function ButtonLink({ to, variant = "primary", size = "md", className = "", children }) { // link jo button jaisa dikhe
  return ( // JSX shuru: animated link
    // sabse bahar wala element shuru
    <MotionLink to={to} {...tap} className={classes(variant, size, className)}>
      {/* link ke andar ka text/icon */}
      {children}
      {/* link band */}
    </MotionLink>
  ); // JSX band
} // component band
