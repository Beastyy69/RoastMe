// Camera tab ka entry. Native camera wali screen sirf development build me load hoti hai.
import { Platform, StyleSheet, Text } from "react-native"; // platform check, styles, text
import Constants from "expo-constants"; // pata karna ki Expo Go me chal rahe hain ya nahi
import { Card, Screen } from "../components/Layout"; // screen + card
import { colors } from "../theme"; // rang

// Camera + ML Kit native code hai, jo Expo Go app me nahi hota.
// Isliye Expo Go (ya web) me ye module load hi nahi karte, warna poori app crash ho jaati.
const isExpoGo = Constants.executionEnvironment === "storeClient"; // "storeClient" = Expo Go app
const nativeSupported = Platform.OS !== "web" && !isExpoGo; // asli native build?
const CameraRoastScreen = nativeSupported ? require("../components/camera/CameraRoastScreen").default : null; // tabhi load karo

export default function CameraTab() { // Camera tab
  if (CameraRoastScreen) return <CameraRoastScreen />; // native build hai to asli camera screen

  return ( // warna samjhaane wali screen
    // screen + heading
    <Screen eyebrow="Camera Roast" title="Needs a development build" description="Live face detection uses native camera and ML Kit code that Expo Go doesn't include.">
      {/* steps ka card */}
      <Card style={styles.card}>
        {/* line 1 */}
        <Text style={styles.text}>Build the app once with the native modules, then this tab works:</Text>
        {/* command 1 */}
        <Text style={styles.code}>npx expo run:android</Text>
        {/* line 2 */}
        <Text style={styles.text}>or a cloud build:</Text>
        {/* command 2 */}
        <Text style={styles.code}>eas build -p android --profile development</Text>
        {/* line 3 */}
        <Text style={styles.text}>The rest of the app still works in Expo Go. On the website, Camera Roast runs in the browser.</Text>
        {/* Card band */}
      </Card>
      {/* Screen band */}
    </Screen>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  card: { gap: 10 }, // card: items ke beech ki doori
  text: { color: colors.textMuted, fontSize: 14, lineHeight: 21 }, // text: text ka rang, text ka size, lines ke beech ki unchai
  code: { // code ka style
    color: colors.accentText, // text ka rang
    fontFamily: "monospace", // font
    fontSize: 13, // text ka size
    backgroundColor: "rgba(255,255,255,0.04)", // background ka rang
    padding: 10, // andar ki jagah (charon taraf)
    borderRadius: 8, // kone gol
  }, // code band
}); // styles band
