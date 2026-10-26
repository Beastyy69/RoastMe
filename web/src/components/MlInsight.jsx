import { motion } from "motion/react"; // bars ka animation
import { Brain, PenLine } from "lucide-react"; // icons: dimaag (ML), pen (likhna)

// "student_life" → "student life"
const pretty = (label) => label.replace(/_/g, " "); // underscore ko space banao

// ML model ne kya predict kiya (topic + confidence bars) wahi dikhata hai.
// Saath me ye bhi batata hai ki joke ML ne nahi, templates/AI ne likha.
export default function MlInsight({ ml, generator, fallbackLabel }) { // ml = backend ka ML result
  if (!ml) return null; // ML data nahi to kuch mat dikhao
  // Top 3 categories hi bars me dikhate hain
  const topThree = Object.entries(ml.probabilities ?? {}).slice(0, 3); // [[label, prob], ...]

  return ( // JSX shuru: halka border wala box
    // sabse bahar wala element shuru
    <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      {/* heading: brain icon + model ka naam */}
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {/* icon aur heading text */}
        <Brain className="size-3.5 text-violet-400" /> ML classifier · TF-IDF + Logistic Regression
        {/* heading band */}
      </div>

      {/* model load nahi hua to ek message, warna prediction */}
      {!ml.model_available ? (
        // model missing message
        <p className="text-sm text-zinc-400">The model isn't loaded on the server, so the default category was used.</p>
        // else part
      ) : (
        // fragment: prediction line + bars
        <>
          {/* prediction ka sentence */}
          <p className="text-sm text-zinc-300">
            {/* "Predicted topic X with Y% model probability." */}
            Predicted topic <span className="font-medium capitalize text-white">{pretty(ml.model_label)}</span> with <span className="tabular-nums text-white">{Math.floor(ml.confidence * 100)}%</span> model probability.
            {/* 40% se kam bharosa ho to peela note */}
            {!ml.confident && (
              // fallback wala note
              <span className="text-amber-300/90"> That's under the 40% threshold, so it fell back to "{fallbackLabel}".</span>
              // condition band
            )}
            {/* p band */}
          </p>
          {/* top 3 categories ke bars */}
          <ul className="space-y-1.5">
            {/* har category ki ek row */}
            {topThree.map(([label, probability], index) => (
              // row: naam | bar | %
              <li key={label} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-xs">
                {/* category ka naam */}
                <span className="truncate capitalize text-zinc-400">{pretty(label)}</span>
                {/* bar ka grey track */}
                <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  {/* violet bar jo 0 se % tak badhta hai */}
                  <motion.span
                    className="block h-full rounded-full bg-violet-500/80" // violet bhara hissa
                    initial={{ width: 0 }} // shuru me khaali
                    animate={{ width: `${probability * 100}%` }} // probability jitna bharo
                    transition={{ duration: 0.7, delay: 0.1 * index, ease: "easeOut" }} // ek ke baad ek
                  // self-closing tag yahin band
                  />
                  {/* track band */}
                </span>
                {/* % number */}
                <span className="text-right tabular-nums text-zinc-500">{Math.floor(probability * 100)}%</span>
                {/* row band */}
              </li>
              // map element band
            ))}
            {/* list band */}
          </ul>
          {/* fragment band */}
        </>
        // ternary band
      )}

      {/* joke kisne likha (AI ya templates) */}
      {generator && (
        // neeche ki chhoti line
        <p className="flex items-center gap-2 border-t border-white/[0.06] pt-3 text-xs text-zinc-500">
          {/* pen icon */}
          <PenLine className="size-3.5" />
          {/* "Comedy text written by ..., not by the classifier." */}
          Comedy text written by {generator.source === "ai" ? "the configured AI provider" : "local templates"}, not by the classifier.
          {/* p band */}
        </p>
        // condition band
      )}
      {/* box band */}
    </div>
  ); // JSX band
} // component band
