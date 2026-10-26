// Expo Router layout: neeche ke 5 tabs (Home, Roast, Camera, NPC, History).
// app/ folder ki har file ek tab/screen hai.
import { StatusBar } from "expo-status-bar"; // upar ki status bar (time, battery)
import { Feather } from "@expo/vector-icons"; // icons
import { Tabs } from "expo-router/tabs"; // neeche ke tabs
import { colors } from "../theme"; // app ke rang

// Tab ka file naam, dikhne wala title aur Feather icon
const TABS = [ // 5 tabs
  { name: "index", title: "Home", icon: "home" }, // app/index.js
  { name: "roast", title: "Roast", icon: "zap" }, // app/roast.js
  { name: "camera", title: "Camera", icon: "camera" }, // app/camera.js
  { name: "npc", title: "NPC", icon: "user" }, // app/npc.js
  { name: "history", title: "History", icon: "clock" }, // app/history.js
]; // list band

export default function RootLayout() { // poori app ka layout
  return ( // JSX shuru
    // fragment (bina extra view ke do cheezein)
    <>
      {/* status bar ke icons white */}
      <StatusBar style="light" />
      {/* tab navigator */}
      <Tabs
        screenOptions={{ // saare tabs ki common settings
          headerShown: false, // upar ka default header nahi (hum apna title banate hain)
          sceneStyle: { backgroundColor: colors.background }, // screen ka background dark
          tabBarActiveTintColor: colors.accentText, // chuna hua tab violet
          tabBarInactiveTintColor: colors.textFaint, // baaki grey
          tabBarStyle: { // tab bar ka look
            backgroundColor: colors.surface, // dark background
            borderTopColor: colors.border, // upar patli line
          }, // tabBarStyle band
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" }, // tab ke naam ka font
        }} // screenOptions band
        // opening tag band
      >
        {/* har tab ki screen */}
        {TABS.map((tab) => (
          // ek tab
          <Tabs.Screen
            key={tab.name} // unique key
            name={tab.name} // kaunsi file
            options={{ // is tab ki settings
              title: tab.title, // neeche dikhne wala naam
              tabBarIcon: ({ color, size }) => <Feather name={tab.icon} size={size - 2} color={color} />, // icon (active pe violet)
            }} // options band
          // self-closing tag yahin band
          />
          // map band
        ))}
        {/* Tabs band */}
      </Tabs>
      {/* fragment band */}
    </>
  ); // JSX band
} // component band
