// Neeche wala footer: logo, chhota disclaimer aur page links.
import { Link } from "react-router"; // page link
import Logo from "./Logo"; // logo

// Footer ke link groups
const GROUPS = [ // do columns
  { // pehla column
    title: "Product", // heading
    links: [ // links
      { to: "/roast", label: "Roast Generator" }, // text roast
      { to: "/camera", label: "Camera Roast" }, // camera roast
      { to: "/npc", label: "NPC Meter" }, // quiz
      { to: "/history", label: "History" }, // history
    ], // links band
  }, // pehla column band
  { // doosra column
    title: "Learn", // heading
    links: [ // links
      { to: "/how-it-works", label: "How It Works" }, // samjhaane wala page
      { to: "/about", label: "About" }, // about
    ], // links band
  }, // doosra column band
]; // list band

export default function Footer() { // component shuru
  return ( // JSX shuru: upar patli border wala footer
    // sabse bahar wala element shuru
    <footer className="mt-24 border-t border-white/[0.06]">
      {/* 3 columns ka grid (mobile pe ek ke neeche ek) */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        {/* pehla column: logo + disclaimer */}
        <div className="max-w-sm space-y-3">
          {/* logo */}
          <Logo />
          {/* chhota disclaimer */}
          <p className="text-sm leading-relaxed text-zinc-500">
            {/* disclaimer ka text */}
            Playful roasts for entertainment only. Scores are fun formulas and a small classifier, not a judgement of who you are.
            {/* p band */}
          </p>
          {/* pehla column band */}
        </div>
        {/* baaki columns GROUPS se */}
        {GROUPS.map((group) => (
          // ek column
          <div key={group.title}>
            {/* column heading */}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{group.title}</h3>
            {/* links ki list */}
            <ul className="mt-4 space-y-2.5">
              {/* har link */}
              {group.links.map((link) => (
                // ek list item
                <li key={link.to}>
                  {/* link */}
                  <Link to={link.to} className="text-sm text-zinc-400 transition-colors hover:text-white">
                    {/* link ka naam */}
                    {link.label}
                    {/* Link band */}
                  </Link>
                  {/* li band */}
                </li>
                // map element band
              ))}
              {/* ul band */}
            </ul>
            {/* column band */}
          </div>
          // map element band
        ))}
        {/* grid band */}
      </div>
      {/* sabse neeche copyright line */}
      <div className="border-t border-white/[0.06]">
        {/* copyright text */}
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-600 sm:px-6">
          {/* saal apne aap aata hai */}
          © {new Date().getFullYear()} RoastMe AI. Built with React, FastAPI and scikit-learn.
          {/* p band */}
        </p>
        {/* copyright div band */}
      </div>
      {/* footer band */}
    </footer>
  ); // JSX band
} // component band
