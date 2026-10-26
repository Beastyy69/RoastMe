// Ek jagah rakhi lists: intensity, category, aur input ki length limits.
// Form aur result cards dono yahi use karte hain (backend ki limits se match).
export const INTENSITIES = [ // roast kitna teekha ho, uske 3 options
  { value: "friendly", label: "Friendly", hint: "Light teasing", flames: 1 }, // halka mazaak, 1 flame
  { value: "savage", label: "Savage", hint: "Sharp and witty", flames: 2 }, // teekha, 2 flames
  { value: "extra_spicy", label: "Extra Spicy", hint: "No mercy (still kind)", flames: 3 }, // sabse teekha, 3 flames
]; // list band

export const CATEGORIES = [ // roast ke topics
  { value: "auto", label: "Auto-detect" }, // ML model khud chunega
  { value: "student_life", label: "Student Life" }, // padhai wala
  { value: "procrastination", label: "Procrastination" }, // kaam taalna
  { value: "gaming", label: "Gaming" }, // games
  { value: "productivity", label: "Productivity" }, // productivity apps
  { value: "general", label: "General" }, // baaki sab
]; // list band

export const LIMITS = { nickname: 30, bio: 600, habits: 400, bioMin: 10 }; // max/min characters

// "student_life" → "Student Life" jaisa readable naam
export function categoryLabel(value) { // value = backend wala naam
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replace(/_/g, " "); // list me mila to label, warna _ hata do
} // function band

export function intensityLabel(value) { // "extra_spicy" → "Extra Spicy"
  return INTENSITIES.find((i) => i.value === value)?.label ?? value; // list me dhoondo, na mile to wahi value
} // function band
