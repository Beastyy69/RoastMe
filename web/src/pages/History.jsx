// History page: is browser ke purane roasts, NPC aur camera results.
// Ek-ek delete kar sakte ho ya "Clear history" (confirm popup ke saath).
import { useCallback, useEffect, useState } from "react"; // React hooks
import { AnimatePresence, motion } from "motion/react"; // animation
import { Camera, Drama, Flame, History as HistoryIcon, Trash2 } from "lucide-react"; // icons
import { PageHeader, PageTransition } from "../components/PageLayout"; // page wrapper + heading
import { Button, ButtonLink } from "../components/Button"; // buttons
import Card from "../components/Card"; // card box
import Modal from "../components/Modal"; // confirm popup
import { EmptyState, ErrorNotice, LoadingCard } from "../components/StatusViews"; // states
import { api } from "../services/api"; // backend calls

// Har result type ka icon aur label
const KIND = { // kind → icon, naam, score ka naam
  roast: { icon: Flame, label: "Roast", scoreLabel: "Heat" }, // text roast
  npc: { icon: Drama, label: "NPC Meter", scoreLabel: "NPC score" }, // quiz
  camera: { icon: Camera, label: "Camera Roast", scoreLabel: "Roast score" }, // camera roast
}; // object band

// History kahan save hai, user ko batane ke liye
const STORAGE_NOTE = { // storage → message
  memory: "Stored in server memory for this session. It resets when the server restarts.", // memory
  mongodb: "Stored in the database, linked to an anonymous id in this browser.", // database
}; // object band

export default function History() { // page component
  const [state, setState] = useState({ status: "loading", items: [], storage: null, error: null }); // list ki state
  const [confirmOpen, setConfirmOpen] = useState(false); // "clear all" popup khula hai?
  const [actionError, setActionError] = useState(null); // delete me error

  // Server se history lao
  const load = useCallback(async () => { // load function
    setState((current) => ({ ...current, status: "loading", error: null })); // loading dikhao
    try { // call fail ho sakti hai
      const data = await api.history(); // backend se list
      setState({ status: "success", items: data.items, storage: data.storage, error: null }); // save
    } catch (error) { // error
      setState({ status: "error", items: [], storage: null, error: error.message }); // error dikhao
    } // try/catch band
  }, []); // kabhi naya nahi

  useEffect(() => { // page khulte hi
    load(); // history lao
  }, [load]); // ek baar

  // Ek entry delete; list se bhi turant hatao
  const removeItem = async (id) => { // id = entry ki id
    setActionError(null); // purana error hatao
    try { // delete fail ho sakta hai
      await api.deleteHistoryItem(id); // backend se delete
      setState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) })); // list se hatao
    } catch (error) { // error
      setActionError(error.message); // dikhao
    } // try/catch band
  }; // function band

  // Saari history delete (modal me confirm ke baad)
  const clearAll = async () => { // clear function
    setConfirmOpen(false); // popup band
    setActionError(null); // error hatao
    try { // fail ho sakta hai
      await api.clearHistory(); // backend se sab delete
      setState((current) => ({ ...current, items: [] })); // list khaali
    } catch (error) { // error
      setActionError(error.message); // dikhao
    } // try/catch band
  }; // function band

  return ( // JSX shuru
    // sabse bahar wala element shuru
    <PageTransition>
      {/* upar: heading left, "Clear history" right */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* heading + storage note */}
        <PageHeader eyebrow="History" title="Your recent roasts" description={STORAGE_NOTE[state.storage]} />
        {/* entries hain tabhi clear button */}
        {state.items.length > 0 && (
          // laal button (popup kholta hai)
          <Button variant="danger" size="sm" className="mb-10" onClick={() => setConfirmOpen(true)}>
            {/* icon + text */}
            <Trash2 className="size-4" /> Clear history
            {/* Button band */}
          </Button>
          // condition band
        )}
        {/* upar band */}
      </div>

      {/* list wala hissa */}
      <div className="space-y-4">
        {/* delete ka error */}
        {actionError && <ErrorNotice message={actionError} />}
        {/* loading */}
        {state.status === "loading" && <LoadingCard message="Fetching your history..." />}
        {/* load error + retry */}
        {state.status === "error" && <ErrorNotice message={state.error} onRetry={load} />}
        {/* kuch nahi hai */}
        {state.status === "success" && state.items.length === 0 && (
          // empty box
          <EmptyState icon={HistoryIcon} title="Nothing here yet">
            {/* text */}
            Your roasts, camera roasts and NPC results will show up here.
            {/* button ka wrapper */}
            <div className="mt-5">
              {/* roast page pe le jao */}
              <ButtonLink to="/roast" size="sm">
                {/* text */}
                Get roasted
                {/* ButtonLink band */}
              </ButtonLink>
              {/* wrapper band */}
            </div>
            {/* EmptyState band */}
          </EmptyState>
          // condition band
        )}

        {/* entries ka grid */}
        <ul className="grid gap-3 md:grid-cols-2">
          {/* entry hatne pe animation */}
          <AnimatePresence initial={false}>
            {/* har entry */}
            {state.items.map((item) => {
              const kind = KIND[item.kind] ?? KIND.roast; // type ki info (na mile to roast)
              const Icon = kind.icon; // us type ka icon
              return ( // card lautao
                // animated list item (layout = baaki items smoothly khiskte hain)
                <motion.li
                  key={item.id} // unique key
                  layout // position change animate
                  initial={{ opacity: 0, y: 10 }} // aate waqt neeche se
                  animate={{ opacity: 1, y: 0 }} // apni jagah
                  exit={{ opacity: 0, scale: 0.96 }} // delete pe chhota hoke gayab
                  transition={{ duration: 0.2 }} // jaldi
                  // opening tag band
                >
                  {/* card */}
                  <Card className="flex h-full flex-col p-5">
                    {/* upar: icon, title, delete */}
                    <div className="flex items-start gap-3">
                      {/* icon dabba */}
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-500/10 text-violet-300">
                        {/* icon */}
                        <Icon className="size-4" />
                        {/* dabba band */}
                      </span>
                      {/* title + date */}
                      <div className="min-w-0 flex-1">
                        {/* title */}
                        <p className="truncate text-sm font-medium text-white">{item.title}</p>
                        {/* type · date */}
                        <p className="text-xs text-zinc-500">
                          {/* jaise "Roast · 23/10/2026, 8:49 PM" */}
                          {kind.label} · {new Date(item.created_at).toLocaleString()}
                          {/* p band */}
                        </p>
                        {/* title wala hissa band */}
                      </div>
                      {/* delete button */}
                      <button
                        type="button" // submit na kare
                        onClick={() => removeItem(item.id)} // ye entry delete
                        className="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300" // style
                        aria-label={`Delete ${item.title}`} // screen reader naam
                        // opening tag band
                      >
                        {/* kooda-daan icon */}
                        <Trash2 className="size-4" />
                        {/* button band */}
                      </button>
                      {/* upar band */}
                    </div>
                    {/* roast/result ka text (max 4 lines) */}
                    <p className="mt-4 line-clamp-4 flex-1 text-sm leading-relaxed text-zinc-300">{item.text}</p>
                    {/* score */}
                    <p className="mt-4 text-xs text-zinc-500">
                      {/* jaise "Heat: 74/100" */}
                      {kind.scoreLabel}: <span className="tabular-nums text-zinc-300">{item.score}/100</span>
                      {/* p band */}
                    </p>
                    {/* Card band */}
                  </Card>
                  {/* li band */}
                </motion.li>
              ); // return band
              // map ka function band
            })}
            {/* AnimatePresence band */}
          </AnimatePresence>
          {/* grid band */}
        </ul>
        {/* list wala hissa band */}
      </div>

      {/* "Clear all?" confirm popup */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Clear all history?">
        {/* warning text */}
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {/* text */}
          This deletes every saved roast and result for this browser. It can't be undone.
          {/* p band */}
        </p>
        {/* do buttons */}
        <div className="mt-6 flex justify-end gap-2">
          {/* cancel */}
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
            {/* text */}
            Cancel
            {/* Button band */}
          </Button>
          {/* pakka delete */}
          <Button variant="danger" size="sm" onClick={clearAll}>
            {/* text */}
            Clear history
            {/* Button band */}
          </Button>
          {/* buttons band */}
        </div>
        {/* Modal band */}
      </Modal>
      {/* PageTransition band */}
    </PageTransition>
  ); // JSX band
} // component band
