// Backend (FastAPI) se saari baat-cheet yahin hoti hai. Pages kabhi seedha fetch() nahi karte.
// Backend ka URL badalna ho to sirf web/.env me VITE_API_URL badlo.

// URL ke aakhir ka / hata do, taaki //api jaisa na bane
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, ""); // backend ka address
const CLIENT_ID_KEY = "roastme-client-id"; // localStorage me id is naam se save hoti hai

// Anonymous id: isse server tumhari history alag rakhta hai, bina login ya personal data ke
export function getClientId() { // id lao ya nayi banao
  try { // private mode me localStorage band ho sakta hai
    let id = localStorage.getItem(CLIENT_ID_KEY); // pehle se saved id
    if (!id) { // id nahi hai?
      id = crypto.randomUUID(); // nayi random id banao
      localStorage.setItem(CLIENT_ID_KEY, id); // save karo, agli baar wahi milegi
    } // if band
    return id; // id wapas
  } catch { // storage nahi chala
    return null; // private mode me storage band ho to history skip ho jaati hai
  } // try/catch band
} // function band

// Har API call isi function se jaati hai: fetch → JSON → ok check → data
async function request(path, { method = "GET", body } = {}) { // path = "/api/roast" jaisa
  let response; // server ka jawab yahan aayega
  try { // network fail ho sakta hai
    response = await fetch(`${API_URL}${path}`, { // backend ko request bhejo
      method, // GET / POST / DELETE
      headers: body ? { "Content-Type": "application/json" } : undefined, // body hai to JSON header
      body: body ? JSON.stringify(body) : undefined, // object ko JSON text me badlo
    }); // fetch band
  } catch { // server tak pahunche hi nahi
    throw new Error("Can't reach the RoastMe server. Check that the backend is running."); // simple error
  } // try/catch band

  // Backend hamesha {ok, data} ya {ok:false, error} bhejta hai
  const payload = await response.json().catch(() => null); // JSON padho (na bane to null)
  if (!response.ok || !payload?.ok) { // error aaya?
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}.`); // backend ka message aage bhejo
  } // if band
  return payload.data; // sirf asli data wapas
} // function band

// Body me client_id jodna (history ke liye)
const withClientId = (body) => ({ ...body, client_id: getClientId() ?? undefined }); // body + id
const clientQuery = () => `client_id=${encodeURIComponent(getClientId() ?? "")}`; // URL ke liye ?client_id=...

// Har feature ka ek function: api.roast(), api.cameraRoast(), ...
export const api = { // saare API functions ka object
  health: () => request("/health"), // server/model status
  roast: (form) => request("/api/roast", { method: "POST", body: withClientId(form) }), // text roast
  // Sirf detected signals jaate hain, photo nahi
  cameraRoast: (signals) => request("/api/camera-roast", { method: "POST", body: withClientId(signals) }), // camera roast
  npcQuestions: () => request("/api/npc/questions"), // naya quiz (AI ke likhe sawal + quiz_id)
  npc: (quizId, answers) => // kaunsa quiz + har sawal ka chuna option
    request("/api/npc", { method: "POST", body: withClientId({ quiz_id: quizId, answers }) }), // NPC score + roast
  history: () => request(`/api/history?${clientQuery()}`), // history list
  deleteHistoryItem: (id) => request(`/api/history/${id}?${clientQuery()}`, { method: "DELETE" }), // ek entry delete
  clearHistory: () => request(`/api/history?${clientQuery()}`, { method: "DELETE" }), // saari history delete
}; // api object band
