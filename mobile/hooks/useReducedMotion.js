import { useEffect, useState } from "react"; // React hooks
import { AccessibilityInfo } from "react-native"; // phone ki accessibility settings

// True jab user ne phone settings me "Remove animations" on kiya ho. Tab hum animation band rakhte hain.
export function useReducedMotion() { // hook shuru
  const [reduced, setReduced] = useState(false); // default: animation chalu

  useEffect(() => { // ek baar setting padho + sunte raho
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {}); // abhi ki setting
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced); // setting badle to update
    return () => subscription.remove(); // screen hatne pe sunna band
  }, []); // sirf ek baar

  return reduced; // true = animation band rakho
} // hook band
