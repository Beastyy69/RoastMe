// Saare pages (routes) yahan jude hain + page badalne ka animation.
// Navbar upar, Footer neeche, beech me current page.
import { Suspense, lazy, useEffect } from "react"; // lazy = baad me load, Suspense = tab tak loading
import { AnimatePresence, MotionConfig } from "motion/react"; // page transition + global motion settings
import { Route, Routes, useLocation } from "react-router"; // URL → page mapping
import Navbar from "./components/Navbar"; // upar ki bar
import Footer from "./components/Footer"; // neeche ka footer
import Home from "./pages/Home"; // "/" page
import RoastGenerator from "./pages/RoastGenerator"; // "/roast" page
import NpcMeter from "./pages/NpcMeter"; // "/npc" page
import History from "./pages/History"; // "/history" page
import HowItWorks from "./pages/HowItWorks"; // "/how-it-works" page
import About from "./pages/About"; // "/about" page
import NotFound from "./pages/NotFound"; // galat URL wala page
import { LoadingCard } from "./components/StatusViews"; // loading skeleton

// Camera page MediaPipe (bada library) use karta hai, isliye alag file me sirf zaroorat pe load hota hai
const CameraRoast = lazy(() => import("./pages/CameraRoast")); // "/camera" page (lazy)

export default function App() { // poori website ka main component
  // Current URL; isse AnimatePresence ko pata chalta hai ki page badla
  const location = useLocation(); // { pathname: "/roast", ... }

  useEffect(() => { // URL badalne pe chalo
    // Naya page khule to upar se shuru ho
    window.scrollTo(0, 0); // top pe scroll
  }, [location.pathname]); // sirf path badalne pe

  return ( // JSX shuru
    // reducedMotion="user": jinhone phone/PC me "kam animation" on kiya hai, unke liye movement band
    <MotionConfig reducedMotion="user">
      {/* poori page ka layout: upar navbar, beech content, neeche footer */}
      <div className="relative flex min-h-screen flex-col overflow-x-clip">
        {/* upar ki halki violet chamak (sirf decoration) */}
        <div
          aria-hidden="true" // screen reader ise ignore kare
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(60%_50%_at_50%_0%,rgb(124_58_237/0.18),transparent_70%)]" // radial gradient glow
        // self-closing tag yahin band
        />
        {/* navigation bar */}
        <Navbar />
        {/* beech ka hissa jo bachi jagah le leta hai */}
        <div className="flex-1">
          {/* mode="wait": purana page pehle jaata hai, phir naya aata hai */}
          <AnimatePresence mode="wait">
            {/* key badalne pe AnimatePresence ko pata chalta hai ki naya page hai */}
            <Routes location={location} key={location.pathname}>
              {/* Home page */}
              <Route path="/" element={<Home />} />
              {/* Roast Generator */}
              <Route path="/roast" element={<RoastGenerator />} />
              {/* Camera Roast (lazy load, tab tak loading card) */}
              <Route
                path="/camera" // URL
                element={ // kya dikhana hai
                  // camera file load hone tak LoadingCard dikhao
                  <Suspense fallback={<div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6"><LoadingCard message="Loading camera roast..." /></div>}>
                    {/* file load hone ke baad asli page */}
                    <CameraRoast />
                    {/* Suspense band */}
                  </Suspense>
                } // element band
              // self-closing tag yahin band
              />
              {/* NPC Meter */}
              <Route path="/npc" element={<NpcMeter />} />
              {/* History */}
              <Route path="/history" element={<History />} />
              {/* How It Works */}
              <Route path="/how-it-works" element={<HowItWorks />} />
              {/* About */}
              <Route path="/about" element={<About />} />
              {/* baaki koi bhi URL = 404 */}
              <Route path="*" element={<NotFound />} />
              {/* Routes band */}
            </Routes>
            {/* AnimatePresence band */}
          </AnimatePresence>
          {/* beech ka hissa band */}
        </div>
        {/* footer */}
        <Footer />
        {/* layout band */}
      </div>
      {/* MotionConfig band */}
    </MotionConfig>
  ); // JSX band
} // component band
