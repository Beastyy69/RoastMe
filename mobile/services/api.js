// Shared FastAPI backend se saari baat-cheet yahin. Screens seedha fetch() nahi karti.
import { Platform } from "react-native"; // android / ios / web pata karne ke liye
import AsyncStorage from "@react-native-async-storage/async-storage"; // phone ki chhoti storage

// Android emulator ke liye PC = 10.0.2.2. Asli phone ke liye PC ka LAN IP chahiye (.env.example dekho).
const DEFAULT_URL = Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000"; // default backend address
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL).replace(/\/+$/, ""); // .env wala URL, aakhir ka / hata ke

// Phone ki storage (AsyncStorage) me id is naam se save hoti hai
const CLIENT_ID_KEY = "roastme-client-id"; // storage key
let cachedClientId = null; // ek baar padh liya to yahan yaad

function randomId() { // nayi random id
  return "app-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12); // jaise "app-lx2k9-4f8a..."
} // function band

// Anonymous id: server isse tumhari history alag rakhta hai. Koi account ya personal data nahi.
export async function getClientId() { // id lao ya banao
  if (cachedClientId) return cachedClientId; // pehle se pata hai
  try { // storage fail ho sakti hai
    let id = await AsyncStorage.getItem(CLIENT_ID_KEY); // saved id padho
    if (!id) { // nahi mili?
      id = randomId(); // nayi banao
      await AsyncStorage.setItem(CLIENT_ID_KEY, id); // save karo
    } // if band
    cachedClientId = id; // yaad rakho
  } catch { // storage nahi chali
    cachedClientId = randomId(); // storage na chale to history sirf is session tak
  } // try/catch band
  return cachedClientId; // id wapas
} // function band

// Har call: fetch (30 sec timeout) → JSON → ok check → data
async function request(path, { method = "GET", body } = {}) { // path = "/api/roast" jaisa
  const controller = new AbortController(); // request beech me rokne ke liye
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 sec me jawab nahi to roko
  let response; // jawab yahan
  try { // network fail ho sakta hai
    response = await fetch(`${API_URL}${path}`, { // backend ko bhejo
      method, // GET / POST / DELETE
      headers: body ? { "Content-Type": "application/json" } : undefined, // JSON header
      body: body ? JSON.stringify(body) : undefined, // object → JSON text
      signal: controller.signal, // timeout ke liye
    }); // fetch band
  } catch { // server tak nahi pahunche
    throw new Error(`Can't reach the RoastMe server at ${API_URL}. Check your connection and the API URL.`); // simple error
  } finally { // dono case me
    clearTimeout(timeout); // timer band
  } // try band

  const payload = await response.json().catch(() => null); // JSON padho
  if (!response.ok || !payload?.ok) { // error aaya?
    throw new Error(payload?.error?.message || `Request failed with status ${response.status}.`); // backend ka message
  } // if band
  return payload.data; // sirf data
} // function band

async function withClientId(body) { // body me client_id jodo
  return { ...body, client_id: await getClientId() }; // body + id
} // function band

async function clientQuery() { // URL ke liye ?client_id=...
  return `client_id=${encodeURIComponent(await getClientId())}`; // safe URL text
} // function band

// Har feature ka ek function: api.roast(), api.cameraRoast(), ...
export const api = { // saare API functions
  health: () => request("/health"), // server status
  roast: async (form) => request("/api/roast", { method: "POST", body: await withClientId(form) }), // text roast
  // Sirf detected signals jaate hain, photo nahi
  cameraRoast: async (signals) => request("/api/camera-roast", { method: "POST", body: await withClientId(signals) }), // camera roast
  npcQuestions: () => request("/api/npc/questions"), // naya quiz (AI ke likhe sawal + quiz_id)
  npc: async (quizId, answers) => request("/api/npc", { method: "POST", body: await withClientId({ quiz_id: quizId, answers }) }), // NPC score + roast
  history: async () => request(`/api/history?${await clientQuery()}`), // history list
  deleteHistoryItem: async (id) => request(`/api/history/${id}?${await clientQuery()}`, { method: "DELETE" }), // ek delete
  clearHistory: async () => request(`/api/history?${await clientQuery()}`, { method: "DELETE" }), // sab delete
}; // api band
