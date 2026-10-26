// Label wala input / textarea. Saath me character counter aur error message.
// multiline = true doge to textarea ban jaata hai.
export default function Field({ id, label, hint, error, value, maxLength, multiline = false, rows = 4, ...props }) { // saare props
  const Control = multiline ? "textarea" : "input"; // kaunsa HTML element banana hai
  // Screen reader ke liye hint/error ko input se jodna (accessibility)
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined; // jaise "bio-hint"

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <div className="space-y-2">
      {/* upar ki line: label left me, counter right me */}
      <div className="flex items-baseline justify-between gap-3">
        {/* label (click karne pe input pe focus) */}
        <label htmlFor={id} className="text-sm font-medium text-zinc-200">
          {/* label ka text */}
          {label}
          {/* label band */}
        </label>
        {/* maxLength diya hai to counter dikhao */}
        {maxLength && (
          // 90% se zyada bhar gaya to counter peela
          <span className={`text-xs tabular-nums ${value.length > maxLength * 0.9 ? "text-amber-400" : "text-zinc-600"}`}>
            {/* jaise 45/600 */}
            {value.length}/{maxLength}
            {/* counter band */}
          </span>
          // condition band
        )}
        {/* upar ki line band */}
      </div>
      {/* asli input ya textarea */}
      <Control
        id={id} // label se jodne ke liye id
        value={value} // abhi ka text
        maxLength={maxLength} // isse zyada type nahi hoga
        rows={multiline ? rows : undefined} // textarea ki lines
        aria-invalid={Boolean(error)} // error hai to screen reader ko batao
        aria-describedby={describedBy} // hint/error ka link
        className={`field ${multiline ? "resize-none leading-relaxed" : ""} ${error ? "border-red-400/50" : ""}`} // style + error pe laal border
        {...props} // baaki props (placeholder, onChange...)
      // self-closing tag yahin band
      />
      {/* error nahi hai aur hint hai to hint dikhao */}
      {hint && !error && (
        // grey chhota hint text
        <p id={`${id}-hint`} className="text-xs text-zinc-500">
          {/* hint ka text */}
          {hint}
          {/* p band */}
        </p>
        // condition band
      )}
      {/* error hai to laal message */}
      {error && (
        // laal chhota error text
        <p id={`${id}-error`} className="text-xs text-red-400">
          {/* error ka text */}
          {error}
          {/* p band */}
        </p>
        // condition band
      )}
      {/* wrapper band */}
    </div>
  ); // JSX band
} // component band
