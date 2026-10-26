// Webcam chalu/band karne ka hook (browser ka getUserMedia).
// Camera Roast page isko use karta hai.
import { useCallback, useEffect, useRef, useState } from "react"; // React hooks

// Camera ke common errors ko simple message me badalte hain
function friendlyCameraError(error) { // error = browser ka error object
  if (!navigator.mediaDevices?.getUserMedia) { // browser camera support hi nahi karta
    return "Camera needs a secure page (https or localhost) and a modern browser."; // https chahiye
  } // if band
  if (error?.name === "NotAllowedError") { // user ne permission mana kar di
    return "Camera permission was blocked. Allow it from the address bar's camera icon, then try again."; // allow karne ka tareeka
  } // if band
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") { // camera mila hi nahi
    return "No camera found on this device."; // camera nahi hai
  } // if band
  if (error?.name === "NotReadableError") { // camera kisi aur app me busy
    return "Your camera is busy in another app (Zoom, Meet...). Close it and try again."; // doosri app band karo
  } // if band
  return "Couldn't start the camera. Please try again."; // koi aur problem
} // function band

/**
 * Webcam on/off karne ka hook.
 * videoRef ko <video> element pe lagao, start() se camera chalu, stop() se band.
 */
export function useCamera() { // hook shuru
  const videoRef = useRef(null); // <video> element ka reference
  const streamRef = useRef(null); // camera stream (band karne ke liye yaad rakhte hain)
  const [status, setStatus] = useState("off"); // off | starting | on | error
  const [error, setError] = useState(null); // error message (ho to)

  const stop = useCallback(() => { // camera band karne wala function
    // har track band karna zaroori hai, warna camera ki light jalti rehti hai
    streamRef.current?.getTracks().forEach((track) => track.stop()); // har video track roko
    streamRef.current = null; // stream bhool jao
    if (videoRef.current) videoRef.current.srcObject = null; // video se stream hatao
    setStatus("off"); // status band
  }, []); // kabhi naya nahi banta

  const start = useCallback(async () => { // camera chalu karne wala function
    setStatus("starting"); // "starting..." dikhao
    setError(null); // purana error hatao
    try { // permission/camera fail ho sakta hai
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported"); // support check
      const stream = await navigator.mediaDevices.getUserMedia({ // browser se camera maango (permission popup)
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, // front camera, HD
        audio: false, // mic nahi chahiye
      }); // getUserMedia band
      streamRef.current = stream; // stream yaad rakho
      const video = videoRef.current; // <video> element
      video.srcObject = stream; // video me camera stream lagao
      await video.play(); // video chalu karo
      setStatus("on"); // camera on
    } catch (err) { // kuch galat hua
      setError(friendlyCameraError(err)); // simple message banao
      setStatus("error"); // error status
    } // try/catch band
  }, []); // kabhi naya nahi banta

  // page chhodte waqt camera automatically band
  useEffect(() => stop, [stop]); // cleanup me stop() chalega

  return { videoRef, status, error, start, stop }; // page ko ye sab do
} // hook band
