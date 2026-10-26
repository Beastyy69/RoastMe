// Camera Roast page: camera on → live face detection + filters →
// 3-2-1 countdown → photo → /api/camera-roast (sirf signals) → roast card.
// Logic hooks (useCamera, useFaceTracker) aur services (drawFilters, roastCard) me hai.
import { useEffect, useRef, useState } from "react"; // React hooks
import { AnimatePresence, motion } from "motion/react"; // animation
import { Camera, CameraOff, Download, Lock, RotateCcw, ScanFace, Sparkles, Zap } from "lucide-react"; // icons
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import { Button } from "../components/Button"; // button
import Card from "../components/Card"; // card box
import ScoreMeter from "../components/ScoreMeter"; // gol meter
import ResultActions from "../components/ResultActions"; // copy/share
import { ErrorNotice, Spinner } from "../components/StatusViews"; // error box + loader
import { useCamera } from "../hooks/useCamera"; // webcam on/off
import { useFaceTracker } from "../hooks/useFaceTracker"; // face detection + drawing loop
import { useApiAction } from "../hooks/useApiAction"; // API state hook
import { api } from "../services/api"; // backend calls
import { canvasToBlob, createRoastCard } from "../services/roastCard"; // share wala poster
import { toJpegDataUrl } from "../services/photo"; // AI ke liye chhoti JPEG
import { INTENSITIES } from "../constants"; // friendly/savage/extra spicy

// Face filters (drawFilters.js me inki drawing hai)
const FILTERS = [ // { value, label, emoji }
  { value: "none", label: "Clean", emoji: "✨" }, // koi filter nahi
  { value: "sunglasses", label: "Deal With It", emoji: "🕶️" }, // chashma
  { value: "crown", label: "Royal Delusion", emoji: "👑" }, // taj
  { value: "clown", label: "Clown Mode", emoji: "🤡" }, // clown naak
  { value: "devil", label: "Lil Devil", emoji: "😈" }, // seeng
  { value: "npc", label: "NPC Scanner", emoji: "🤖" }, // scanner
  { value: "flames", label: "On Fire", emoji: "🔥" }, // aag
]; // list band

// Poori photo ka color look
const GRADES = [ // { value, label }
  { value: "natural", label: "Natural" }, // normal
  { value: "noir", label: "Noir" }, // black & white
  { value: "retro", label: "Retro" }, // purana
  { value: "thermal", label: "Thermal" }, // garmi camera
]; // list band

// Live chips pe dikhne wale readable words
const SIGNAL_TEXT = { // signal → text
  expression: { smiling: "Smiling", neutral: "Neutral", surprised: "Shocked", eyebrows_raised: "Judging", eyes_closed: "Eyes closed" }, // expression
  distance: { close: "Too close", normal: "Good distance", far: "Far away" }, // doori
  lighting: { dark: "Dark lighting", normal: "Good light", bright: "Very bright" }, // roshni
}; // object band

// Backend ke provider naam → dikhne wala naam
const PROVIDER_NAMES = { nvidia: "NVIDIA Nemotron", gemini: "Gemini" }; // naam map

// Chip/button ki class: chuna hua = violet
function choiceClass(active, base) { // base = shape wali classes
  const color = active ? "border-violet-400/50 bg-violet-500/15 text-violet-100" : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"; // rang
  return `${base} ${color}`; // poori class
} // function band

export default function CameraRoast() { // page component
  const camera = useCamera(); // webcam state + start/stop
  const canvasRef = useRef(null); // canvas element (yahan video + filter dikhta hai)
  const [filter, setFilter] = useState("sunglasses"); // chuna hua face filter
  const [grade, setGrade] = useState("natural"); // chuna hua color look
  const [intensity, setIntensity] = useState("savage"); // roast kitna teekha
  const [roastLook, setRoastLook] = useState(true); // "Roast my look": photo AI ko bhejni hai?
  // phase: live -> countdown -> result (roast aane ke baad)
  const [phase, setPhase] = useState("live"); // abhi kaunsa step
  const [count, setCount] = useState(3); // countdown number
  const [flash, setFlash] = useState(false); // white flash dikhana hai?
  const [snapshot, setSnapshot] = useState(null); // { url, canvas }
  const [captureError, setCaptureError] = useState(null); // photo ke waqt face nahi mila
  const roast = useApiAction(api.cameraRoast); // /api/camera-roast ki state

  // Camera on hai aur result screen pe nahi hain = live mode
  const isLive = camera.status === "on" && phase !== "result"; // live chal raha?
  const tracker = useFaceTracker({ videoRef: camera.videoRef, canvasRef, active: isLive, filter, grade }); // face loop
  const hasFace = tracker.signals.faces > 0; // koi face dikh raha?

  // Countdown: 3 -> 2 -> 1 -> photo
  useEffect(() => { // phase ya count badle to chalo
    if (phase !== "countdown") return; // countdown nahi chal raha
    if (count === 0) { // 0 pe pahunch gaye
      capture(); // photo lo
      return; // bas
    } // if band
    const timer = setTimeout(() => setCount((c) => c - 1), 800); // 0.8 sec baad ek kam
    return () => clearTimeout(timer); // cleanup
    // capture() har render pe naya banta hai; dependency me daalne ki zaroorat nahi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]); // dependencies

  // "Roast My Face" button → countdown shuru
  const startCountdown = () => { // button click
    setCaptureError(null); // purana error hatao
    setCount(3); // 3 se shuru
    setPhase("countdown"); // countdown phase
  }; // function band

  async function capture() { // photo lene wala function
    const { canvas, clean, signals } = tracker.captureSnapshot(); // filter wali photo, bina filter wali photo, signals
    if (!signals.faces) { // aakhri second pe face nahi tha
      setCaptureError("No face in frame at the last second. Step into the light and try again."); // error
      setPhase("live"); // wapas live
      return; // ruk jao
    } // if band
    // camera flash effect
    setFlash(true); // white flash on
    setTimeout(() => setFlash(false), 350); // 0.35 sec baad off
    setSnapshot({ url: canvas.toDataURL("image/jpeg", 0.92), canvas }); // photo save (dikhane + poster ke liye)
    setPhase("result"); // result phase

    roast.run({ // backend ko signals (+ look mode me photo) bhejo
      expression: signals.expression, // smiling / neutral / ...
      faces: Math.min(signals.faces, 5), // kitne chehre (max 5)
      distance: signals.distance, // close / normal / far
      lighting: signals.lighting, // dark / normal / bright
      head_tilted: signals.head_tilted, // sir tedha?
      looking_away: signals.looking_away, // side dekh raha?
      filter, // chuna hua filter
      intensity, // chuni hui intensity
      photo: roastLook ? toJpegDataUrl(clean) : undefined, // look mode on ho tabhi photo jaati hai
    }); // run band
  } // function band

  // Retake: result hatao, wapas live camera
  const retake = () => { // retake button
    roast.reset(); // result hatao
    setSnapshot(null); // photo hatao
    setPhase("live"); // live wapas
  }; // function band

  // Camera poori tarah band
  const turnOff = () => { // "Turn off" button
    retake(); // sab reset
    camera.stop(); // camera band
  }; // function band

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* page heading */}
      <PageHeader
        eyebrow="Camera Roast" // label
        title="Show your face. Lose your dignity." // title
        description="Turn on your camera, pick a filter and let the face scanner do its thing. Face detection runs in your browser. With “Roast my look” on, one photo is sent to the AI for a look-based roast and is never saved." // description
      // self-closing tag yahin band
      />

      {/* do columns: camera left, controls right */}
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        {/* ---------- Left: camera stage ---------- */}
        <div className="space-y-4">
          {/* camera wala card */}
          <Card className="relative overflow-hidden">
            {/* 4:3 ka black box */}
            <div className="relative aspect-[4/3] w-full bg-black">
              {/* Video sirf data ke liye hai; user ko canvas dikhta hai jisme filters bane hote hain */}
              <video ref={camera.videoRef} playsInline muted className="hidden" />
              {/* canvas: video + filters (live mode me hi dikhta) */}
              <canvas
                ref={canvasRef} // canvas ka reference
                className={`absolute inset-0 h-full w-full object-cover ${isLive ? "opacity-100" : "opacity-0"}`} // poora bharo
                aria-label="Live camera preview with face filter" // screen reader naam
              // self-closing tag yahin band
              />

              {/* photo le li to woh dikhao (halka zoom-out animation) */}
              {phase === "result" && snapshot && (
                // photo
                <motion.img
                  src={snapshot.url} // photo data
                  alt="Your captured photo with filter" // alt text
                  initial={{ scale: 1.04, opacity: 0 }} // thoda zoom, invisible
                  animate={{ scale: 1, opacity: 1 }} // normal
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // smooth
                  className="absolute inset-0 h-full w-full object-cover" // poora bharo
                // self-closing tag yahin band
                />
                // condition band
              )}

              {/* camera band hai to intro screen */}
              {camera.status !== "on" && <CameraIntro camera={camera} />}

              {/* face model download ho raha hai */}
              {camera.status === "on" && tracker.modelStatus === "loading" && (
                // overlay
                <Overlay>
                  {/* loader */}
                  <Spinner className="size-5 text-violet-300" />
                  {/* text */}
                  <p className="mt-3 text-sm text-zinc-300">Loading the face scanner...</p>
                  {/* chhota note */}
                  <p className="mt-1 text-xs text-zinc-500">First time takes a few seconds (about 4 MB).</p>
                  {/* Overlay band */}
                </Overlay>
                // condition band
              )}
              {/* model load nahi hua */}
              {tracker.modelStatus === "error" && (
                // overlay
                <Overlay>
                  {/* error text */}
                  <p className="text-sm text-red-300">Couldn't load the face scanner. Check your internet connection and reload.</p>
                  {/* Overlay band */}
                </Overlay>
                // condition band
              )}

              {/* Live status chips */}
              {isLive && tracker.modelStatus === "ready" && (
                // chips ki row (click-through)
                <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap gap-2">
                  {/* face mila ya nahi */}
                  <LiveChip active={hasFace}>
                    {/* scan icon */}
                    <ScanFace className="size-3.5" />
                    {/* "1 face locked" ya "Searching..." */}
                    {hasFace ? `${tracker.signals.faces} face${tracker.signals.faces > 1 ? "s" : ""} locked` : "Searching for a face..."}
                    {/* chip band */}
                  </LiveChip>
                  {/* face mila to baaki chips */}
                  {hasFace && (
                    // fragment
                    <>
                      {/* expression chip */}
                      <LiveChip>{SIGNAL_TEXT.expression[tracker.signals.expression]}</LiveChip>
                      {/* distance chip */}
                      <LiveChip>{SIGNAL_TEXT.distance[tracker.signals.distance]}</LiveChip>
                      {/* lighting chip */}
                      <LiveChip>{SIGNAL_TEXT.lighting[tracker.signals.lighting]}</LiveChip>
                      {/* fragment band */}
                    </>
                    // condition band
                  )}
                  {/* row band */}
                </div>
                // condition band
              )}

              {/* 3-2-1 countdown */}
              <AnimatePresence>
                {/* countdown chal raha ho tabhi */}
                {phase === "countdown" && count > 0 && (
                  // bada number jo bade se chhota hota hai
                  <motion.div
                    key={count} // har number nayi key = naya animation
                    initial={{ scale: 2.2, opacity: 0 }} // bahut bada, invisible
                    animate={{ scale: 1, opacity: 1 }} // normal
                    exit={{ scale: 0.6, opacity: 0 }} // chhota hoke gayab
                    transition={{ type: "spring", stiffness: 300, damping: 20 }} // spring
                    className="pointer-events-none absolute inset-0 grid place-items-center" // beech me
                    // opening tag band
                  >
                    {/* number (violet glow) */}
                    <span className="text-[8rem] font-bold text-white drop-shadow-[0_0_40px_rgba(139,92,246,0.8)]">{count}</span>
                    {/* number band */}
                  </motion.div>
                  // condition band
                )}
                {/* AnimatePresence band */}
              </AnimatePresence>

              {/* Camera flash */}
              <AnimatePresence>
                {/* flash true ho tabhi */}
                {flash && (
                  // white parda jo turant fade hota hai
                  <motion.div
                    initial={{ opacity: 0.9 }} // lagbhag poora white
                    animate={{ opacity: 0 }} // fade
                    exit={{ opacity: 0 }} // gayab
                    transition={{ duration: 0.35 }} // 0.35 sec
                    className="pointer-events-none absolute inset-0 bg-white" // poora white
                  // self-closing tag yahin band
                  />
                  // condition band
                )}
                {/* AnimatePresence band */}
              </AnimatePresence>
              {/* black box band */}
            </div>
            {/* Card band */}
          </Card>

          {/* photo ke waqt face nahi mila to error */}
          {captureError && <ErrorNotice message={captureError} />}

          {/* camera on hai to filters + looks */}
          {camera.status === "on" && phase !== "result" && (
            // halke se aane wala wrapper
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* filters ki list */}
              <FilterPicker value={filter} onChange={setFilter} />
              {/* color looks + turn off */}
              <div className="flex flex-wrap items-center gap-2">
                {/* har look ka chip */}
                {GRADES.map((option) => (
                  // look chip
                  <button
                    key={option.value} // key
                    type="button" // submit na kare
                    onClick={() => setGrade(option.value)} // look chuno
                    aria-pressed={grade === option.value} // chuna hai?
                    className={choiceClass(grade === option.value, "rounded-full border px-3.5 py-1.5 text-sm transition-colors")} // style
                    // opening tag band
                  >
                    {/* look ka naam */}
                    {option.label}
                    {/* button band */}
                  </button>
                  // map band
                ))}
                {/* camera band karne ka button */}
                <Button variant="ghost" size="sm" onClick={turnOff} className="ml-auto">
                  {/* icon + text */}
                  <CameraOff className="size-4" /> Turn off
                  {/* Button band */}
                </Button>
                {/* row band */}
              </div>
              {/* wrapper band */}
            </motion.div>
            // condition band
          )}
          {/* left column band */}
        </div>

        {/* ---------- Right: controls / result ---------- */}
        <div className="lg:sticky lg:top-24">
          {/* controls aur result ke beech animation */}
          <AnimatePresence mode="wait">
            {/* result nahi hai to controls, warna result panel */}
            {phase !== "result" ? (
              // controls (right se slide)
              <motion.div key="controls" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {/* controls card */}
                <Card className="space-y-6 p-6">
                  {/* intensity */}
                  <div>
                    {/* label */}
                    <p className="text-sm font-medium text-zinc-200">Roast intensity</p>
                    {/* 3 buttons */}
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {/* har intensity */}
                      {INTENSITIES.map((option) => (
                        // intensity button
                        <motion.button
                          key={option.value} // key
                          type="button" // submit na kare
                          whileTap={{ scale: 0.96 }} // dabane pe chhota
                          onClick={() => setIntensity(option.value)} // chuno
                          aria-pressed={intensity === option.value} // chuna hai?
                          className={choiceClass(intensity === option.value, "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors")} // style
                          // opening tag band
                        >
                          {/* naam */}
                          {option.label}
                          {/* button band */}
                        </motion.button>
                        // map band
                      ))}
                      {/* buttons band */}
                    </div>
                    {/* intensity band */}
                  </div>

                  {/* "Roast my look" switch */}
                  <LookToggle value={roastLook} onChange={setRoastLook} />

                  {/* tips */}
                  <ul className="space-y-2.5 text-sm text-zinc-400">
                    {/* tip 1 */}
                    <Tip>Pull a face: smile, look shocked, raise an eyebrow.</Tip>
                    {/* tip 2 */}
                    <Tip>Lean in, tilt your head, or look away. The scanner notices.</Tip>
                    {/* tip 3 */}
                    <Tip>Look mode roasts your hair, outfit, room and pose. Never your skin, body or who you are.</Tip>
                    {/* tips band */}
                  </ul>

                  {/* "Roast My Face" button (face mile tabhi active) */}
                  <Button
                    size="lg" // bada
                    className="w-full" // poori width
                    onClick={startCountdown} // countdown shuru
                    disabled={!isLive || !hasFace || phase === "countdown" || tracker.modelStatus !== "ready"} // kab disabled
                    // opening tag band
                  >
                    {/* bijli icon */}
                    <Zap className="size-4.5" />
                    {/* text */}
                    {phase === "countdown" ? "Hold still..." : "Roast My Face"}
                    {/* Button band */}
                  </Button>
                  {/* face nahi hai to hint */}
                  {isLive && tracker.modelStatus === "ready" && !hasFace && (
                    // hint text
                    <p className="-mt-3 text-center text-xs text-zinc-500">Get your face in the frame to unlock the roast.</p>
                    // condition band
                  )}
                  {/* controls card band */}
                </Card>
                {/* controls wrapper band */}
              </motion.div>
              // warna (result phase)
            ) : (
              // result wrapper
              <motion.div key="result" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                {/* result panel */}
                <ResultPanel roast={roast} snapshot={snapshot} onRetake={retake} />
                {/* wrapper band */}
              </motion.div>
              // ternary band
            )}
            {/* AnimatePresence band */}
          </AnimatePresence>
          {/* right column band */}
        </div>
        {/* columns band */}
      </div>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band

// ---------- Small pieces ----------

// Camera band ho tab dikhne wala intro (privacy note + Turn On button)
function CameraIntro({ camera }) { // camera = useCamera ka object
  return ( // JSX shuru
    // sabse bahar wala element shuru
    <Overlay>
      {/* dheere-dheere saans leta hua camera icon */}
      <motion.span
        animate={{ scale: [1, 1.08, 1] }} // bada-chhota-bada
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} // hamesha repeat
        className="grid size-16 place-items-center rounded-2xl bg-violet-500/15 text-violet-300" // style
        // opening tag band
      >
        {/* camera icon */}
        <Camera className="size-7" />
        {/* span band */}
      </motion.span>
      {/* heading */}
      <h2 className="mt-5 text-lg font-semibold text-white">Ready for your close-up?</h2>
      {/* privacy note */}
      <p className="mt-1.5 max-w-xs text-sm text-zinc-400">
        {/* taala icon */}
        <Lock className="mr-1 inline size-3.5" />
        {/* text */}
        Face detection runs on your device. A photo is only sent to the AI when "Roast my look" is on.
        {/* p band */}
      </p>
      {/* camera error ho to laal text */}
      {camera.error && <p className="mt-3 max-w-sm text-sm text-red-300">{camera.error}</p>}
      {/* Turn On button */}
      <Button className="mt-6" onClick={camera.start} disabled={camera.status === "starting"}>
        {/* starting me spinner, warna camera icon */}
        {camera.status === "starting" ? <Spinner /> : <Camera className="size-4.5" />}
        {/* text */}
        {camera.status === "starting" ? "Starting camera..." : camera.error ? "Try again" : "Turn On Camera"}
        {/* Button band */}
      </Button>
      {/* Overlay band */}
    </Overlay>
  ); // JSX band
} // component band

function Overlay({ children }) { // camera box ke upar poora parda
  return ( // JSX shuru
    // dark background + halki violet chamak
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(60%_60%_at_50%_40%,rgb(124_58_237/0.18),transparent),#0a0a0b] p-6 text-center">
      {/* andar ka content */}
      {children}
      {/* div band */}
    </div>
  ); // JSX band
} // component band

// Video ke upar chhota status chip
function LiveChip({ children, active = true }) { // active false = peela (face nahi)
  const color = active ? "border-violet-400/30 bg-black/55 text-violet-100" : "border-amber-400/30 bg-black/55 text-amber-200"; // rang
  return ( // JSX shuru
    // layout = size badle to smooth
    <motion.span
      layout // smooth resize
      initial={{ opacity: 0, y: -6 }} // upar se
      animate={{ opacity: 1, y: 0 }} // apni jagah
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-md ${color}`} // style
      // opening tag band
    >
      {/* chip ka content */}
      {children}
      {/* span band */}
    </motion.span>
  ); // JSX band
} // component band

// Filters ki horizontal list; chuna hua filter highlight (layoutId slide)
function FilterPicker({ value, onChange }) { // value = chuna hua, onChange = badalna
  return ( // JSX shuru
    // side scroll hone wali row
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Face filter">
      {/* har filter */}
      {FILTERS.map((option) => {
        const active = value === option.value; // ye chuna hai?
        return ( // button lautao
          // filter button
          <motion.button
            key={option.value} // key
            type="button" // submit na kare
            role="radio" // radio option
            aria-checked={active} // chuna hai?
            whileHover={{ y: -2 }} // hover pe upar
            whileTap={{ scale: 0.95 }} // dabane pe chhota
            onClick={() => onChange(option.value)} // chuno
            className="relative flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3.5 py-2.5" // style
            // opening tag band
          >
            {/* chuna hua ho to violet background (ek se doosre pe slide) */}
            {active && (
              // highlight
              <motion.span
                layoutId="filter-active" // same id = slide animation
                className="absolute inset-0 rounded-2xl border border-violet-400/50 bg-violet-500/15" // violet box
                transition={{ type: "spring", stiffness: 400, damping: 32 }} // spring
              // self-closing tag yahin band
              />
              // condition band
            )}
            {/* emoji */}
            <span className="relative text-2xl">{option.emoji}</span>
            {/* naam */}
            <span className={`relative text-xs font-medium ${active ? "text-violet-100" : "text-zinc-400"}`}>{option.label}</span>
            {/* button band */}
          </motion.button>
        ); // return band
        // map function band
      })}
      {/* row band */}
    </div>
  ); // JSX band
} // component band

// "Roast my look" on/off switch (animated knob)
function LookToggle({ value, onChange }) { // value = on/off, onChange = badalna
  return ( // JSX shuru
    // poori row ek button hai (switch role)
    <button
      type="button" // submit na kare
      role="switch" // screen reader: on/off switch
      aria-checked={value} // on hai?
      onClick={() => onChange(!value)} // ulta karo
      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${value ? "border-violet-400/40 bg-violet-500/10" : "border-white/10 bg-white/[0.02]"}`} // on = violet
      // opening tag band
    >
      {/* switch ka track */}
      <span className={`relative mt-0.5 flex h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-violet-500" : "bg-white/15"}`}>
        {/* gol knob jo spring se khiskta hai */}
        <motion.span
          layout // position badle to animate
          transition={{ type: "spring", stiffness: 500, damping: 32 }} // spring
          className={`absolute top-0.5 size-4 rounded-full bg-white ${value ? "right-0.5" : "left-0.5"}`} // on = right, off = left
        // self-closing tag yahin band
        />
        {/* track band */}
      </span>
      {/* text */}
      <span>
        {/* heading */}
        <span className="block text-sm font-medium text-white">Roast my look 🔥</span>
        {/* explanation */}
        <span className="mt-0.5 block text-xs leading-relaxed text-zinc-400">Sends one photo to the AI (NVIDIA Nemotron, or Gemini as backup) for a next-level roast of your hair, outfit, room and pose. The photo is not saved.</span>
        {/* text band */}
      </span>
      {/* button band */}
    </button>
  ); // JSX band
} // component band

function Tip({ children }) { // ek tip line
  return ( // JSX shuru
    // list item
    <li className="flex gap-2.5">
      {/* chamak icon */}
      <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-400" />
      {/* tip ka text */}
      {children}
      {/* li band */}
    </li>
  ); // JSX band
} // component band

// Photo lene ke baad wala panel: roast, score, save/share
function ResultPanel({ roast, snapshot, onRetake }) { // roast = API state, snapshot = photo
  const [downloadNote, setDownloadNote] = useState(""); // "saved" message

  if (roast.status === "loading" || roast.status === "idle") { // roast abhi aa raha hai
    return ( // loading card
      // sabse bahar wala element shuru
      <Card className="flex items-center gap-3 p-6 text-sm text-zinc-400">
        {/* spinner + text */}
        <Spinner className="size-4 text-violet-400" /> Analyzing your camera presence...
        {/* Card band */}
      </Card>
    ); // return band
  } // if band
  if (roast.status === "error") { // roast nahi aaya
    return ( // error + retake
      // sabse bahar wala element shuru
      <div className="space-y-3">
        {/* error box */}
        <ErrorNotice message={roast.error} />
        {/* retake button */}
        <Button variant="secondary" onClick={onRetake}>
          {/* icon + text */}
          <RotateCcw className="size-4" /> Retake
          {/* Button band */}
        </Button>
        {/* div band */}
      </div>
    ); // return band
  } // if band

  const result = roast.data; // backend ka result

  // Photo + roast ko ek poster image banake download karo
  const downloadCard = async () => { // "Save roast card" button
    const card = createRoastCard(snapshot.canvas, { title: result.title, roast: result.roast, score: result.roast_score }); // poster banao
    const blob = await canvasToBlob(card); // PNG data
    const file = new File([blob], "roastme-camera-roast.png", { type: "image/png" }); // file object
    // Phone pe share sheet khulti hai, desktop pe file download hoti hai
    if (navigator.canShare?.({ files: [file] })) { // file share ho sakti hai?
      try { // user cancel kar sakta hai
        await navigator.share({ files: [file], title: "My RoastMe AI camera roast" }); // share sheet
        return; // ho gaya
      } catch (error) { // share nahi hua
        if (error.name === "AbortError") return; // user ne cancel kiya
      } // try/catch band
    } // if band
    const url = URL.createObjectURL(blob); // file ka temporary link
    const link = document.createElement("a"); // invisible link
    link.href = url; // link me file
    link.download = file.name; // download ka naam
    link.click(); // download shuru
    URL.revokeObjectURL(url); // temporary link hatao
    setDownloadNote("Roast card saved to your downloads."); // message
  }; // function band

  return ( // JSX shuru
    // spring wala wrapper
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
      {/* card */}
      <Card className="space-y-6 p-6">
        {/* upar: pill + title + roast */}
        <div>
          {/* "Camera verdict" pill */}
          <span className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300">
            {/* text */}
            Camera verdict
            {/* pill band */}
          </span>
          {/* title */}
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{result.title}</h2>
          {/* roast */}
          <p className="mt-3 text-[17px] leading-relaxed text-zinc-200">{result.roast}</p>
          {/* upar band */}
        </div>
        {/* roast score meter */}
        <ScoreMeter
          value={result.roast_score} // score
          label="Roast score" // naam
          caption="A playful formula from what the scanner detected. Entertainment only." // note
        // self-closing tag yahin band
        />
        {/* scanner ne kya dekha */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs leading-relaxed text-zinc-500">
          {/* heading */}
          <p className="font-medium uppercase tracking-wider text-zinc-400">What the scanner saw</p>
          {/* signals ki line */}
          <p className="mt-1.5">{result.signals_used}</p>
          {/* ML vs jokes ka note */}
          <p className="mt-2">
            {/* text */}
            Face landmarks come from MediaPipe on your device. Roast written by {PROVIDER_NAMES[result.generator.provider] ?? "local templates"}{result.used_photo ? ", which also looked at your photo (not saved)." : ", using only those signals."}
            {/* p band */}
          </p>
          {/* box band */}
        </div>
        {/* save + retake */}
        <div className="flex flex-wrap gap-2">
          {/* poster save/share */}
          <Button size="sm" onClick={downloadCard}>
            {/* icon + text */}
            <Download className="size-4" /> Save roast card
            {/* Button band */}
          </Button>
          {/* retake */}
          <Button size="sm" variant="secondary" onClick={onRetake}>
            {/* icon + text */}
            <RotateCcw className="size-4" /> Retake
            {/* Button band */}
          </Button>
          {/* buttons band */}
        </div>
        {/* "saved" message */}
        {downloadNote && <p className="-mt-3 text-xs text-zinc-500">{downloadNote}</p>}
        {/* copy/share text */}
        <ResultActions text={result.roast} shareTitle="My RoastMe AI camera roast" />
        {/* Card band */}
      </Card>
      {/* wrapper band */}
    </motion.div>
  ); // JSX band
} // component band
