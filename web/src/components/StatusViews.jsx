// Loading, error aur empty states ke chhote components (har page pe use).
import { motion } from "motion/react"; // animation
import { AlertCircle, RefreshCw } from "lucide-react"; // icons: error, retry
import Card from "./Card"; // card box
import { Button } from "./Button"; // button

// Ghoomta hua chhota loader
export function Spinner({ className = "size-4" }) { // className se size/color badlo
  return ( // JSX shuru: gol border jiska ek hissa transparent, aur wo ghoomta hai
    // sabse bahar wala element shuru
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} // spinner style
      aria-hidden="true" // screen reader ignore kare
    // self-closing tag yahin band
    />
  ); // JSX band
} // component band

// Laal error box + optional Retry button
export function ErrorNotice({ message, onRetry }) { // message = error text, onRetry = dobara try function
  return ( // JSX shuru: halke se aane wala laal box
    // sabse bahar wala element shuru
    <motion.div
      initial={{ opacity: 0, y: 6 }} // shuru me invisible, thoda neeche
      animate={{ opacity: 1, y: 0 }} // dikhe aur upar aaye
      role="alert" // screen reader turant padhe
      className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4" // laal style
      // opening tag band
    >
      {/* error icon */}
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-400" />
      {/* text wala hissa */}
      <div className="min-w-0 flex-1">
        {/* heading */}
        <p className="text-sm font-medium text-red-200">Something went sideways</p>
        {/* asli error message */}
        <p className="mt-1 text-sm text-red-300/80">{message}</p>
        {/* text band */}
      </div>
      {/* onRetry diya ho to Retry button */}
      {onRetry && (
        // retry button
        <Button variant="ghost" size="sm" onClick={onRetry} className="shrink-0 text-red-200">
          {/* icon + text */}
          <RefreshCw className="size-4" /> Retry
          {/* Button band */}
        </Button>
        // condition band
      )}
      {/* box band */}
    </motion.div>
  ); // JSX band
} // component band

// Server kaam kar raha ho tab skeleton dikhao. Koi nakli % progress nahi.
export function LoadingCard({ message }) { // message = "Roasting..." jaisa text
  return ( // JSX shuru: card jo loading bata raha hai
    // sabse bahar wala element shuru
    <Card className="p-6 sm:p-8" aria-busy="true">
      {/* spinner + message */}
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        {/* ghoomta loader */}
        <Spinner className="size-4 text-violet-400" />
        {/* message (screen reader ke liye status) */}
        <span role="status">{message}</span>
        {/* row band */}
      </div>
      {/* text jaisi chamakti grey lines */}
      <div className="mt-6 space-y-3">
        {/* line 1 */}
        <div className="skeleton h-4 w-11/12 rounded-md" />
        {/* line 2 */}
        <div className="skeleton h-4 w-full rounded-md" />
        {/* line 3 */}
        <div className="skeleton h-4 w-4/5 rounded-md" />
        {/* line 4 */}
        <div className="skeleton h-4 w-2/3 rounded-md" />
        {/* lines band */}
      </div>
      {/* score meter jaisa gol skeleton + do chhoti lines */}
      <div className="mt-8 flex items-center gap-4">
        {/* gol circle */}
        <div className="skeleton size-20 rounded-full" />
        {/* side ki lines */}
        <div className="flex-1 space-y-2">
          {/* chhoti line 1 */}
          <div className="skeleton h-3 w-1/3 rounded-md" />
          {/* chhoti line 2 */}
          <div className="skeleton h-3 w-1/2 rounded-md" />
          {/* side band */}
        </div>
        {/* row band */}
      </div>
      {/* Card band */}
    </Card>
  ); // JSX band
} // component band

// Kuch data nahi hai tab dikhne wala dashed box
export function EmptyState({ icon: Icon, title, children }) { // Icon = koi lucide icon
  return ( // JSX shuru: dashed border wala box
    // sabse bahar wala element shuru
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      {/* icon ka gol background */}
      <span className="grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
        {/* icon */}
        <Icon className="size-5.5" />
        {/* span band */}
      </span>
      {/* title */}
      <p className="mt-4 font-medium text-zinc-200">{title}</p>
      {/* chhota description (children) */}
      <div className="mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-500">{children}</div>
      {/* box band */}
    </div>
  ); // JSX band
} // component band
