// History tab: is phone ke purane results. Neeche kheench ke refresh, ek-ek delete,
// aur "Clear history" (confirm alert ke saath).
import { useCallback, useState } from "react"; // React hooks
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"; // RN parts
import { SafeAreaView } from "react-native-safe-area-context"; // notch se bachav
import { useFocusEffect } from "expo-router"; // tab pe aate hi kuch chalana
import { Feather } from "@expo/vector-icons"; // icons
import { Card } from "../components/Layout"; // card
import { FadeIn } from "../components/Motion"; // fade animation
import Button from "../components/Button"; // button
import { EmptyState, ErrorNotice, LoadingCard } from "../components/StatusViews"; // states
import { api } from "../services/api"; // backend calls
import { colors, radius } from "../theme"; // rang + golai

const KIND = { // result type → icon, naam, score ka naam
  roast: { icon: "zap", label: "Roast", scoreLabel: "Heat" }, // text roast
  npc: { icon: "user", label: "NPC Meter", scoreLabel: "NPC score" }, // quiz
  camera: { icon: "camera", label: "Camera Roast", scoreLabel: "Roast score" }, // camera roast
}; // object band

const STORAGE_NOTE = { // storage → message
  memory: "Stored in server memory. It resets when the server restarts.", // memory
  mongodb: "Stored in the database, linked to an anonymous id on this device.", // database
}; // object band

export default function HistoryScreen() { // History tab
  const [state, setState] = useState({ status: "loading", items: [], storage: null, error: null }); // list state
  const [refreshing, setRefreshing] = useState(false); // pull-to-refresh chal raha?
  const [actionError, setActionError] = useState(null); // delete error

  const load = useCallback(async () => { // server se history lao
    try { // fail ho sakta hai
      const data = await api.history(); // list
      setState({ status: "success", items: data.items, storage: data.storage, error: null }); // save
    } catch (error) { // error
      setState({ status: "error", items: [], storage: null, error: error.message }); // error dikhao
    } // try/catch band
  }, []); // kabhi naya nahi

  // Tab pe aate hi dobara load, taaki naye roasts turant dikhein
  useFocusEffect( // focus pe chalao
    useCallback(() => { // function yaad rakho
      load(); // load karo
    }, [load]), // dependency
  ); // useFocusEffect band

  const refresh = async () => { // neeche kheenchne pe
    setRefreshing(true); // spinner dikhao
    await load(); // dobara lao
    setRefreshing(false); // spinner hatao
  }; // function band

  const removeItem = async (id) => { // ek entry delete
    setActionError(null); // purana error hatao
    try { // fail ho sakta hai
      await api.deleteHistoryItem(id); // server se delete
      setState((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) })); // list se hatao
    } catch (error) { // error
      setActionError(error.message); // dikhao
    } // try/catch band
  }; // function band

  const confirmClear = () => { // "Clear history" button
    Alert.alert("Clear all history?", "This deletes every saved result for this device. It can't be undone.", [ // phone ka confirm popup
      { text: "Cancel", style: "cancel" }, // cancel button
      { // clear button
        text: "Clear", // text
        style: "destructive", // laal (iOS)
        onPress: async () => { // dabane pe
          setActionError(null); // error hatao
          try { // fail ho sakta hai
            await api.clearHistory(); // sab delete
            setState((current) => ({ ...current, items: [] })); // list khaali
          } catch (error) { // error
            setActionError(error.message); // dikhao
          } // try/catch band
        }, // onPress band
      }, // clear button band
    ]); // alert band
  }; // function band

  return ( // JSX shuru
    // safe area
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* scroll + pull to refresh */}
      <ScrollView
        contentContainerStyle={styles.content} // andar ki padding
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />} // neeche kheench ke refresh
        // opening tag band
      >
        {/* label */}
        <Text style={styles.eyebrow}>History</Text>
        {/* title */}
        <Text style={styles.title}>Your recent roasts</Text>
        {/* storage note */}
        {state.storage && <Text style={styles.description}>{STORAGE_NOTE[state.storage]}</Text>}

        {/* entries hain tabhi clear button */}
        {state.items.length > 0 && (
          // laal button
          <Button title="Clear history" icon="trash-2" size="sm" variant="danger" onPress={confirmClear} style={styles.clear} />
          // condition band
        )}

        {/* list */}
        <View style={styles.list}>
          {/* delete error */}
          {actionError && <ErrorNotice message={actionError} />}
          {/* loading */}
          {state.status === "loading" && <LoadingCard message="Fetching your history..." />}
          {/* load error */}
          {state.status === "error" && <ErrorNotice message={state.error} onRetry={load} />}
          {/* khaali */}
          {state.status === "success" && state.items.length === 0 && (
            // empty box
            <EmptyState icon="clock" title="Nothing here yet" message="Your roasts, camera roasts and NPC results will show up here." />
            // condition band
          )}
          {/* har entry ka card */}
          {state.items.map((item, index) => {
            const kind = KIND[item.kind] ?? KIND.roast; // type info
            return ( // card lautao
              // fade in (pehle 6 thoda late-late)
              <FadeIn key={item.id} delay={Math.min(index, 6) * 50}>
                {/* card */}
                <Card style={styles.item}>
                  {/* upar: icon, title, delete */}
                  <View style={styles.itemHeader}>
                    {/* icon dabba */}
                    <View style={styles.itemIcon}>
                      {/* icon */}
                      <Feather name={kind.icon} size={15} color={colors.accentText} />
                      {/* dabba band */}
                    </View>
                    {/* title + date */}
                    <View style={{ flex: 1 }}>
                      {/* title (1 line) */}
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {/* title text */}
                        {item.title}
                        {/* Text band */}
                      </Text>
                      {/* type · date */}
                      <Text style={styles.itemMeta}>
                        {/* jaise "Roast · 23/10/2026" */}
                        {kind.label} · {new Date(item.created_at).toLocaleString()}
                        {/* Text band */}
                      </Text>
                      {/* title wala hissa band */}
                    </View>
                    {/* delete button */}
                    <Pressable
                      onPress={() => removeItem(item.id)} // delete
                      hitSlop={10} // aas-paas tap bhi chale
                      accessibilityRole="button" // button
                      accessibilityLabel={`Delete ${item.title}`} // naam
                      style={styles.delete} // style
                      // opening tag band
                    >
                      {/* kooda-daan icon */}
                      <Feather name="trash-2" size={16} color={colors.textFaint} />
                      {/* Pressable band */}
                    </Pressable>
                    {/* upar band */}
                  </View>
                  {/* result text (max 5 lines) */}
                  <Text style={styles.itemText} numberOfLines={5}>
                    {/* text */}
                    {item.text}
                    {/* Text band */}
                  </Text>
                  {/* score */}
                  <Text style={styles.itemMeta}>
                    {/* jaise "Heat: 74/100" */}
                    {kind.scoreLabel}: <Text style={{ color: colors.text }}>{item.score}/100</Text>
                    {/* Text band */}
                  </Text>
                  {/* Card band */}
                </Card>
                {/* FadeIn band */}
              </FadeIn>
            ); // return band
            // map function band
          })}
          {/* list band */}
        </View>
        {/* ScrollView band */}
      </ScrollView>
      {/* SafeAreaView band */}
    </SafeAreaView>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  safe: { flex: 1, backgroundColor: colors.background }, // safe: bachi hui jagah le lo, background ka rang
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }, // content: andar ki jagah left-right, andar ki jagah upar, andar ki jagah neeche
  eyebrow: { color: colors.accent, fontSize: 13, fontWeight: "600", marginBottom: 6 }, // eyebrow: text ka rang, text ka size, text kitna bold
  title: { color: colors.text, fontSize: 28, fontWeight: "700", letterSpacing: -0.6 }, // title: text ka rang, text ka size, text kitna bold
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 }, // description: text ka rang, text ka size, lines ke beech ki unchai
  clear: { alignSelf: "flex-start", marginTop: 16 }, // clear: sirf is element ka alignment, upar bahar ki jagah
  list: { gap: 12, marginTop: 22 }, // list: items ke beech ki doori, upar bahar ki jagah
  item: { gap: 12 }, // item: items ke beech ki doori
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 12 }, // itemHeader: items ki direction (row = left-right), cross-direction me alignment, items ke beech ki doori
  itemIcon: { // itemIcon ka style
    width: 34, // chaudai
    height: 34, // unchai
    borderRadius: radius.sm, // kone gol
    backgroundColor: colors.accentSoft, // background ka rang
    alignItems: "center", // cross-direction me alignment
    justifyContent: "center", // main-direction me alignment
  }, // itemIcon band
  itemTitle: { color: colors.text, fontWeight: "600", fontSize: 14.5 }, // itemTitle: text ka rang, text kitna bold, text ka size
  itemMeta: { color: colors.textFaint, fontSize: 12, marginTop: 2 }, // itemMeta: text ka rang, text ka size, upar bahar ki jagah
  itemText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 }, // itemText: text ka rang, text ka size, lines ke beech ki unchai
  delete: { padding: 6 }, // delete: andar ki jagah (charon taraf)
}); // styles band
