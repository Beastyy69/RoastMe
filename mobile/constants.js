// Intensity, category ki lists aur input limits (backend se match).
// Website ke web/src/constants.js jaisi hi file.
export const INTENSITIES = [ // roast kitna teekha
  { value: "friendly", label: "Friendly", hint: "Light teasing", flames: 1 }, // halka, 1 flame
  { value: "savage", label: "Savage", hint: "Sharp and witty", flames: 2 }, // teekha, 2 flames
  { value: "extra_spicy", label: "Extra Spicy", hint: "No mercy", flames: 3 }, // sabse teekha, 3 flames
]; // list band

export const CATEGORIES = [ // roast ke topics
  { value: "auto", label: "Auto-detect" }, // ML khud chunega
  { value: "student_life", label: "Student Life" }, // padhai
  { value: "procrastination", label: "Procrastination" }, // kaam taalna
  { value: "gaming", label: "Gaming" }, // games
  { value: "productivity", label: "Productivity" }, // productivity apps
  { value: "general", label: "General" }, // baaki sab
]; // list band

export const LIMITS = { nickname: 30, bio: 600, habits: 400, bioMin: 10 }; // max/min characters

// "student_life" → "Student Life"
export function categoryLabel(value) { // backend naam → readable naam
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/_/g, " "); // list me dhoondo, na mile to _ hatao
} // function band

export function intensityLabel(value) { // "extra_spicy" → "Extra Spicy"
  return INTENSITIES.find((i) => i.value === value)?.label ?? value; // list me dhoondo
} // function band
