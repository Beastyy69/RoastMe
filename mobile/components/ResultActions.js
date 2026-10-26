import { useEffect, useRef, useState } from "react"; // React hooks
import { Share, StyleSheet, Text, View } from "react-native"; // Share = phone ki share sheet
import * as Clipboard from "expo-clipboard"; // copy karne ke liye
import Button from "./Button"; // button
import { colors } from "../theme"; // rang

// Har result ke neeche: Copy (expo-clipboard), Share (phone ki share sheet), Try again.
export default function ResultActions({ text, shareTitle, onRetry, retryLabel = "Another one" }) { // props
  const [feedback, setFeedback] = useState(""); // chhota message ("Copied")
  const timer = useRef(null); // message hatane ka timer

  useEffect(() => () => clearTimeout(timer.current), []); // screen hatne pe timer band

  const flash = (message) => { // message thodi der dikhao
    setFeedback(message); // dikhao
    clearTimeout(timer.current); // purana timer cancel
    timer.current = setTimeout(() => setFeedback(""), 2200); // 2.2 sec baad hatao
  }; // function band

  const copy = async () => { // Copy button
    try { // fail ho sakta hai
      await Clipboard.setStringAsync(text); // clipboard me daalo
      flash("Copied to clipboard"); // message
    } catch { // nahi hua
      flash("Couldn't copy right now"); // error message
    } // try/catch band
  }; // function band

  const share = async () => { // Share button
    try { // fail ho sakta hai
      await Share.share({ title: shareTitle, message: text }); // WhatsApp/Instagram wali share sheet
    } catch { // nahi hua
      flash("Sharing isn't available on this device"); // error message
    } // try/catch band
  }; // function band

  return ( // JSX shuru
    // wrapper
    <View style={styles.wrap}>
      {/* buttons ki row */}
      <View style={styles.row}>
        {/* Copy */}
        <Button title="Copy" icon="copy" size="sm" variant="secondary" onPress={copy} />
        {/* Share */}
        <Button title="Share" icon="share-2" size="sm" variant="secondary" onPress={share} />
        {/* onRetry diya ho to "Another one" */}
        {onRetry && <Button title={retryLabel} icon="refresh-cw" size="sm" variant="ghost" onPress={onRetry} />}
        {/* row band */}
      </View>
      {/* chhota status message (screen reader bhi padhe) */}
      <Text style={styles.feedback} accessibilityLiveRegion="polite">
        {/* message text */}
        {feedback}
        {/* Text band */}
      </Text>
      {/* wrapper band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  wrap: { gap: 6 }, // wrap: items ke beech ki doori
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, // row: items ki direction (row = left-right), jagah kam ho to agli line me, items ke beech ki doori
  feedback: { color: colors.textFaint, fontSize: 12, minHeight: 16 }, // feedback: text ka rang, text ka size, kam se kam unchai
}); // styles band
