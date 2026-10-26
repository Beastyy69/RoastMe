// Chhote animation helpers (React Native ka Animated API, native driver pe smooth chalta hai).
// Website pe Framer Motion hai; app me uski jagah ye.
import { useEffect, useRef } from "react"; // React hooks
import { Animated, Pressable } from "react-native"; // Animated = animation, Pressable = touch wala view
import { useReducedMotion } from "../hooks/useReducedMotion"; // "Remove animations" setting

// Screen pe aate hi halka fade + neeche se upar slide.
export function FadeIn({ delay = 0, distance = 14, style, children }) { // delay = kitni der baad, distance = kitna neeche se
  const progress = useRef(new Animated.Value(0)).current; // 0 → 1 jaane wala number
  const reduced = useReducedMotion(); // animation band hai?

  useEffect(() => { // mount pe animation chalao
    Animated.timing(progress, { // progress ko badlo
      toValue: 1, // 1 tak
      duration: reduced ? 0 : 420, // 0.42 sec (ya turant)
      delay: reduced ? 0 : delay, // thodi der baad
      useNativeDriver: true, // phone ke native thread pe (smooth)
    }).start(); // shuru
  }, [progress, delay, reduced]); // dependencies

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }); // 0→distance, 1→0
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>; // fade + slide wala view
} // component band

// Dabane pe halka sa andar jaane wala button (spring effect).
export function PressableScale({ style, children, disabled, ...props }) { // props = onPress waghaira
  const scale = useRef(new Animated.Value(1)).current; // size (1 = normal)
  const springTo = (toValue) => Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 6 }).start(); // spring se size badlo

  return ( // JSX shuru
    // touch pakadne wala view
    <Pressable
      onPressIn={() => springTo(0.96)} // ungli lagte hi thoda chhota
      onPressOut={() => springTo(1)} // ungli hatte hi normal
      disabled={disabled} // disabled ho to touch nahi
      accessibilityRole="button" // screen reader: button
      accessibilityState={{ disabled: Boolean(disabled) }} // screen reader: disabled hai?
      {...props} // baaki props (onPress...)
      // opening tag band
    >
      {/* size badalne wala andar ka view */}
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
      {/* Pressable band */}
    </Pressable>
  ); // JSX band
} // component band
