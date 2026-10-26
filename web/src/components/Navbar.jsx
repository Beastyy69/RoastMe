// Upar wali navigation bar. Desktop pe links dikhte hain,
// chhoti screen pe hamburger menu khulta hai (animation ke saath).
import { useEffect, useState } from "react"; // React hooks
import { AnimatePresence, motion } from "motion/react"; // animation
import { History, Menu, X } from "lucide-react"; // icons: history, hamburger, cross
import { NavLink, useLocation } from "react-router"; // NavLink = active page jaanne wala link
import Logo from "./Logo"; // logo component
import { ButtonLink } from "./Button"; // button jaisa link

// Menu ke links (naya page add karo to yahan bhi daalo)
const LINKS = [ // { URL, dikhne wala naam }
  { to: "/", label: "Home" }, // home
  { to: "/roast", label: "Roast Generator" }, // text roast
  { to: "/camera", label: "Camera Roast" }, // camera roast
  { to: "/npc", label: "NPC Meter" }, // quiz
  { to: "/how-it-works", label: "How It Works" }, // samjhaane wala page
  { to: "/about", label: "About" }, // about
]; // list band

// Active page ka link white, baaki grey
const linkClass = ({ isActive }) => { // NavLink khud isActive batata hai
  const color = isActive ? "text-white" : "text-zinc-400 hover:text-zinc-100"; // active = white
  return `relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${color}`; // poori class string
}; // function band

// History icon button ki class (active ho to halka background)
const historyClass = ({ isActive }) => { // isActive = abhi history page pe hain?
  const color = isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"; // rang
  return `grid size-9 place-items-center rounded-lg transition-colors ${color}`; // class string
}; // function band

// Mobile menu ke links ki class
const mobileLinkClass = ({ isActive }) => { // active check
  const color = isActive ? "bg-white/[0.06] text-white" : "text-zinc-400 hover:text-white"; // rang
  return `rounded-xl px-3 py-3 text-[15px] font-medium ${color}`; // class string
}; // function band

export default function Navbar() { // component shuru
  const [open, setOpen] = useState(false); // mobile menu khula hai ya nahi
  const location = useLocation(); // abhi ka URL

  useEffect(() => { // URL badalne pe
    // Page badle to mobile menu band ho jaaye
    setOpen(false); // menu band
  }, [location.pathname]); // sirf path badalne pe

  return ( // JSX shuru: upar chipki hui header bar
    // sabse bahar wala element shuru
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink/75 backdrop-blur-xl">
      {/* andar ki row: logo left, links beech, buttons right */}
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* logo */}
        <Logo />

        {/* desktop links (badi screen pe hi dikhte hain) */}
        <div className="hidden items-center gap-1 xl:flex">
          {/* har link ke liye ek NavLink */}
          {LINKS.map((link) => (
            // end = sirf exact "/" pe Home active ho
            <NavLink key={link.to} to={link.to} end={link.to === "/"} className={linkClass}>
              {/* NavLink function child ko isActive deta hai */}
              {({ isActive }) => (
                // fragment = bina extra div ke do cheezein
                <>
                  {/* link ka naam */}
                  {link.label}
                  {/* layoutId: active link ke neeche ki line ek link se doosre pe slide karti hai */}
                  {isActive && (
                    // violet underline
                    <motion.span
                      layoutId="nav-active" // same id = Framer Motion line ko slide karta hai
                      className="absolute inset-x-3 -bottom-[13px] h-px bg-violet-400" // patli violet line
                      transition={{ type: "spring", stiffness: 400, damping: 35 }} // spring animation
                    // self-closing tag yahin band
                    />
                    // condition band
                  )}
                  {/* fragment band */}
                </>
                // function child band
              )}
              {/* NavLink band */}
            </NavLink>
            // map ka element band
          ))}
          {/* desktop links band */}
        </div>

        {/* right side ke buttons */}
        <div className="flex items-center gap-2">
          {/* history icon */}
          <NavLink
            to="/history" // history page
            aria-label="Roast history" // screen reader ke liye naam
            className={historyClass} // active styling
            // opening tag band
          >
            {/* clock wala icon */}
            <History className="size-4.5" />
            {/* NavLink band */}
          </NavLink>
          {/* "Roast Me" button (chhoti screen pe chhupa) */}
          <ButtonLink to="/roast" size="sm" className="hidden sm:inline-flex">
            {/* button text */}
            Roast Me
            {/* ButtonLink band */}
          </ButtonLink>
          {/* hamburger button (sirf chhoti screen) */}
          <button
            type="button" // form submit na kare
            onClick={() => setOpen((value) => !value)} // khula ↔ band
            className="grid size-9 place-items-center rounded-lg text-zinc-300 hover:bg-white/[0.06] xl:hidden" // style
            aria-label={open ? "Close menu" : "Open menu"} // screen reader text
            aria-expanded={open} // menu khula hai ya nahi
            // opening tag band
          >
            {/* khula ho to X icon, band ho to ☰ icon */}
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            {/* button band */}
          </button>
          {/* right buttons band */}
        </div>
        {/* nav band */}
      </nav>

      {/* mobile menu: khulne/band hone ka animation */}
      <AnimatePresence>
        {/* open true ho tabhi dikhao */}
        {open && (
          // neeche khulne wala panel
          <motion.div
            initial={{ opacity: 0, height: 0 }} // shuru me 0 height
            animate={{ opacity: 1, height: "auto" }} // khul ke poori height
            exit={{ opacity: 0, height: 0 }} // band hote waqt wapas 0
            transition={{ duration: 0.22, ease: "easeOut" }} // 0.22 sec
            className="overflow-hidden border-t border-white/[0.06] xl:hidden" // badi screen pe nahi
            // opening tag band
          >
            {/* links ki column */}
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
              {/* saare links + History */}
              {[...LINKS, { to: "/history", label: "History" }].map((link) => (
                // ek mobile link
                <NavLink
                  key={link.to} // React ke liye unique key
                  to={link.to} // URL
                  end={link.to === "/"} // Home exact match
                  className={mobileLinkClass} // active styling
                  // opening tag band
                >
                  {/* link ka naam */}
                  {link.label}
                  {/* NavLink band */}
                </NavLink>
                // map element band
              ))}
              {/* column band */}
            </div>
            {/* panel band */}
          </motion.div>
          // condition band
        )}
        {/* AnimatePresence band */}
      </AnimatePresence>
      {/* header band */}
    </header>
  ); // JSX band
} // component band
