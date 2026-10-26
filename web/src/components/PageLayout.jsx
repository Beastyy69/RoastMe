import { motion } from "motion/react"; // Framer Motion (animation library)

// Har page ka wrapper: same width + aane/jaane ka halka animation.
// PageHeader = page ka upar wala title section.
export function PageTransition({ children }) { // children = page ka content
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <motion.main
      initial={{ opacity: 0, y: 12 }} // shuru me invisible aur thoda neeche
      animate={{ opacity: 1, y: 0 }} // phir dikhe aur apni jagah aaye
      exit={{ opacity: 0, y: -8 }} // jaate waqt fade + thoda upar
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} // 0.3 sec, smooth curve
      className="mx-auto w-full max-w-6xl px-4 sm:px-6" // center me, max width, side padding
      // opening tag band
    >
      {/* page ka asli content */}
      {children}
      {/* main tag band */}
    </motion.main>
  ); // JSX band
} // component band

export function PageHeader({ eyebrow, title, description }) { // chhota label, bada title, description
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <div className="max-w-2xl pt-12 pb-10 sm:pt-16">
      {/* eyebrow diya ho to chhota violet label */}
      {eyebrow && <p className="text-sm font-medium text-violet-400">{eyebrow}</p>}
      {/* page ka bada heading */}
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      {/* description diya ho to grey paragraph */}
      {description && <p className="mt-3 text-base leading-relaxed text-zinc-400">{description}</p>}
      {/* div band */}
    </div>
  ); // JSX band
} // component band
