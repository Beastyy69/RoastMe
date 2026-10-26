// Popup (dialog) jo spring animation ke saath khulta hai.
// Esc dabao ya bahar click karo to band. History ka "Clear all" isse confirm karta hai.
import { useEffect } from "react"; // React hook
import { AnimatePresence, motion } from "motion/react"; // animation

export default function Modal({ open, onClose, title, children }) { // open = dikhana hai?, onClose = band karna
  useEffect(() => { // modal khulne pe keyboard sunna
    if (!open) return; // band hai to kuch nahi
    // Esc key se band
    const onKey = (event) => event.key === "Escape" && onClose(); // Esc dabaya to band
    window.addEventListener("keydown", onKey); // keyboard sunna shuru
    return () => window.removeEventListener("keydown", onKey); // band hone pe sunna band
  }, [open, onClose]); // dependencies

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <AnimatePresence>
      {/* open ho tabhi dikhao */}
      {open && (
        // peeche ka dark parda (click = band)
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" // poori screen, blur
          initial={{ opacity: 0 }} // shuru me invisible
          animate={{ opacity: 1 }} // fade in
          exit={{ opacity: 0 }} // fade out
          onClick={onClose} // bahar click = band
          // opening tag band
        >
          {/* asli dialog box */}
          <motion.div
            role="dialog" // screen reader: ye dialog hai
            aria-modal="true" // peeche ka page abhi use nahi ho sakta
            aria-labelledby="modal-title" // title ka id
            initial={{ opacity: 0, scale: 0.96, y: 10 }} // chhota aur neeche se
            animate={{ opacity: 1, scale: 1, y: 0 }} // poora size
            exit={{ opacity: 0, scale: 0.97, y: 6 }} // jaate waqt thoda chhota
            transition={{ type: "spring", stiffness: 380, damping: 30 }} // spring effect
            onClick={(event) => event.stopPropagation()} // andar click karne se modal band na ho
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface-2 p-6 shadow-2xl" // box style
            // opening tag band
          >
            {/* title */}
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {/* title text */}
              {title}
              {/* h2 band */}
            </h2>
            {/* modal ka content (text + buttons) */}
            {children}
            {/* dialog band */}
          </motion.div>
          {/* parda band */}
        </motion.div>
        // condition band
      )}
      {/* AnimatePresence band */}
    </AnimatePresence>
  ); // JSX band
} // component band
