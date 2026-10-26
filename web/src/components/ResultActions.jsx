import { Check, Copy, RefreshCw, Share2 } from "lucide-react"; // icons
import { useCopyShare } from "../hooks/useCopyShare"; // copy/share logic
import { Button } from "./Button"; // button

// Button dabane ke baad dikhne wala chhota message
const FEEDBACK_TEXT = { // feedback → text
  copied: "Copied to clipboard", // copy hua
  shared: "Shared!", // share hua
  error: "Couldn't access the clipboard", // kuch galat hua
}; // object band

// Har result card ke neeche: Copy / Share / Try again buttons.
export default function ResultActions({ text, shareTitle, onRetry, retryLabel = "Generate another" }) { // props
  const { copy, share, feedback, canNativeShare } = useCopyShare(); // hook se functions

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <div className="space-y-3">
      {/* buttons ki row */}
      <div className="flex flex-wrap gap-2">
        {/* Copy button */}
        <Button variant="secondary" size="sm" onClick={() => copy(text)}>
          {/* copy ho gaya to green tick, warna copy icon */}
          {feedback === "copied" ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
          {/* button text */}
          Copy
          {/* Button band */}
        </Button>
        {/* Share button */}
        <Button variant="secondary" size="sm" onClick={() => share({ title: shareTitle, text })}>
          {/* share icon */}
          <Share2 className="size-4" />
          {/* phone pe "Share", desktop pe "Copy share text" */}
          {canNativeShare ? "Share" : "Copy share text"}
          {/* Button band */}
        </Button>
        {/* onRetry diya ho to "Generate another" button */}
        {onRetry && (
          // retry button
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {/* refresh icon */}
            <RefreshCw className="size-4" />
            {/* button text */}
            {retryLabel}
            {/* Button band */}
          </Button>
          // condition band
        )}
        {/* row band */}
      </div>
      {/* chhota status message (screen reader bhi padhe) */}
      <p className="h-4 text-xs text-zinc-500" role="status" aria-live="polite">
        {/* feedback ho to text, warna khaali */}
        {feedback ? FEEDBACK_TEXT[feedback] : ""}
        {/* p band */}
      </p>
      {/* wrapper band */}
    </div>
  ); // JSX band
} // component band
