// RoastMe AI ka logo (flame icon + naam). Click karne pe Home page.
import { Flame } from "lucide-react"; // flame (aag) icon
import { Link } from "react-router"; // page badalne wala link

export default function Logo({ onClick }) { // onClick = mobile menu band karne ke liye (optional)
  return ( // JSX shuru: poora logo ek link hai jo "/" pe jaata hai
    // sabse bahar wala element shuru
    <Link to="/" onClick={onClick} className="group flex items-center gap-2.5" aria-label="RoastMe AI home">
      {/* violet gradient wala chhota square, hover pe halka ghoomta hai */}
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 shadow-[0_4px_20px_-4px_rgb(139_92_246/0.7)] transition-transform group-hover:-rotate-6">
        {/* square ke andar white flame icon */}
        <Flame className="size-4.5 text-white" strokeWidth={2.4} />
        {/* square band */}
      </span>
      {/* app ka naam */}
      <span className="text-[17px] font-semibold tracking-tight text-white">
        {/* "RoastMe" white, "AI" violet */}
        RoastMe <span className="text-violet-400">AI</span>
        {/* naam band */}
      </span>
      {/* link band */}
    </Link>
  ); // JSX band
} // component band
