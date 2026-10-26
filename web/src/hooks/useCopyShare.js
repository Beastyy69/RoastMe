import { useCallback, useEffect, useRef, useState } from "react"; // React hooks

// Copy aur Share button ka logic.
// Phone pe native share sheet (Web Share API); desktop pe share na ho to text copy kar dete hain.
export function useCopyShare() { // hook shuru
  const [feedback, setFeedback] = useState(null); // "copied" | "shared" | "error" | null (thodi der baad apne aap hat jaata hai)
  const timer = useRef(null); // message hatane wala timer

  useEffect(() => () => clearTimeout(timer.current), []); // component hatne pe timer band

  // Message 2.2 second dikhao phir hata do
  const flash = useCallback((value) => { // value = kaunsa message
    setFeedback(value); // message dikhao
    clearTimeout(timer.current); // purana timer cancel
    timer.current = setTimeout(() => setFeedback(null), 2200); // 2.2 sec baad hatao
  }, []); // kabhi naya nahi banta

  const copy = useCallback( // clipboard me copy karne wala function
    async (text) => { // text = kya copy karna hai
      try { // clipboard permission fail ho sakti hai
        await navigator.clipboard.writeText(text); // clipboard me likho
        flash("copied"); // "Copied" dikhao
      } catch { // copy nahi hua
        flash("error"); // error message
      } // try/catch band
    }, // async function band
    [flash], // flash pe depend
  ); // useCallback band

  const share = useCallback( // share karne wala function
    async ({ title, text }) => { // title + text share karna hai
      if (navigator.share) { // browser native share support karta hai? (zyada tar phone)
        try { // user cancel kar sakta hai
          await navigator.share({ title, text, url: window.location.origin }); // share sheet kholo
          flash("shared"); // "Shared!" dikhao
        } catch (error) { // share nahi hua
          // User ne share sheet khud band ki (AbortError) to error mat dikhao
          if (error.name !== "AbortError") flash("error"); // asli error ho tabhi message
        } // try/catch band
        return; // kaam khatam
      } // if band
      await copy(`${text}\n\n${window.location.origin}`); // share nahi to text + link copy karo
    }, // async function band
    [copy, flash], // in dono pe depend
  ); // useCallback band

  const canNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share); // button ka label decide karne ke liye

  return { copy, share, feedback, canNativeShare }; // component ko ye sab do
} // hook band
