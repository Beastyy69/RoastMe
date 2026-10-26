// Camera Roast (Android/iOS native). Website wale feature jaisa hi:
// live face detection → filters → 3-2-1 → photo → roast.
// Face detection Google ML Kit se phone ke andar hoti hai.
// "Roast my look" on ho to ek chhoti photo AI (NVIDIA / Gemini) ko jaati hai, kahin save nahi hoti.

import { memo, useCallback, useEffect, useRef, useState } from "react"; // React hooks + memo
import { Animated, AppState, Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native"; // RN parts
import Svg, { FeColorMatrix, Filter, Image as SvgImage } from "react-native-svg"; // SVG: photo + color filter
import { useCameraDevice, useCameraPermission, usePhotoOutput } from "react-native-vision-camera"; // camera hooks
import { Camera as FaceDetectingCamera, useImageFaceDetector } from "react-native-vision-camera-face-detector"; // ML Kit face detection
import { captureRef } from "react-native-view-shot"; // view ka screenshot (share ke liye)
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"; // photo chhoti karke base64 banana
import * as Sharing from "expo-sharing"; // share sheet
import { useIsFocused } from "expo-router"; // tab abhi khula hai?
import { Feather } from "@expo/vector-icons"; // icons
import { Card, Pill, Screen } from "../Layout"; // layout
import { FadeIn, PressableScale } from "../Motion"; // animations
import Button from "../Button"; // button
import ScoreRing from "../ScoreRing"; // gol meter
import ResultActions from "../ResultActions"; // copy/share text
import { ErrorNotice, LoadingCard } from "../StatusViews"; // states
import FaceFilterLayer, { FILTERS, FilterGradients } from "./FaceFilterLayer"; // SVG filters
import { buildSignals, toPlainFace } from "../../services/faceSignals"; // face → signals
import { useApiAction } from "../../hooks/useApiAction"; // API state hook
import { api } from "../../services/api"; // backend calls
import { INTENSITIES } from "../../constants"; // intensity list
import { colors, radius } from "../../theme"; // rang + golai

// Photo ka color look. Live preview pe sirf halka tint dikhta hai, asli effect photo pe lagta hai.
const LOOKS = [ // { value, label, live tint }
  { value: "natural", label: "Natural", tint: null }, // normal
  { value: "noir", label: "Noir", tint: "rgba(15,15,25,0.32)" }, // dark tint
  { value: "retro", label: "Retro", tint: "rgba(255,170,90,0.18)" }, // orange tint
  { value: "thermal", label: "Thermal", tint: "rgba(220,40,120,0.22)" }, // gulabi tint
]; // list band

const PROVIDER_NAMES = { nvidia: "NVIDIA Nemotron", gemini: "Gemini" }; // backend naam → dikhne wala naam

const SIGNAL_TEXT = { // chips ke words
  expression: { smiling: "Smiling", neutral: "Neutral", surprised: "Shocked", eyes_closed: "Eyes closed" }, // expression
  distance: { close: "Too close", normal: "Good distance", far: "Far away" }, // doori
}; // object band

// Options component ke bahar, taaki har render pe naya detector na bane
const IMAGE_DETECTOR_OPTIONS = { performanceMode: "fast", runLandmarks: true, runClassifications: true }; // photo detector settings

/**
 * Camera ko memo me wrap kiya hai: face state har 100ms update hoti hai,
 * par camera ko dobara render nahi hona chahiye (warna preview reset hota hai).
 */
const LiveCamera = memo(function LiveCamera({ device, isActive, outputs, onFaces, onError }) { // memo = props same to re-render nahi
  return ( // JSX shuru
    // face detect karne wala camera
    <FaceDetectingCamera
      style={StyleSheet.absoluteFill} // poora box bharo
      device={device} // front camera
      isActive={isActive} // chalu/band
      outputs={outputs} // photo lene wala output
      resizeMode="cover" // box bharo (kinare kat sakte hain)
      autoMode // face coordinates ko seedha screen (preview) coordinates me convert karta hai
      cameraFacing="front" // selfie camera
      performanceMode="fast" // tez detection
      runLandmarks // aankh, naak, muh ke points
      runClassifications // smile aur aankh khuli hone ki probability
      onFacesDetected={onFaces} // har frame ke faces
      onError={onError} // camera error
    // self-closing tag yahin band
    />
  ); // JSX band
}); // memo band

export default function CameraRoastScreen() { // asli camera screen
  const device = useCameraDevice("front"); // front camera dhoondo
  const permission = useCameraPermission(); // camera permission state
  const photoOutput = usePhotoOutput({ quality: 0.9 }); // photo lene wala output
  const outputsRef = useRef(null); // outputs array (stable rakhna hai)
  if (!outputsRef.current) outputsRef.current = [photoOutput]; // pehli baar banao
  const imageDetector = useImageFaceDetector(IMAGE_DETECTOR_OPTIONS); // photo pe face detection

  const isFocused = useIsFocused(); // tab khula hai?
  const [appActive, setAppActive] = useState(AppState.currentState === "active"); // app foreground me?
  const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 }); // camera box ka size
  const [faces, setFaces] = useState([]); // UI ke liye faces (throttled)
  const latestFaces = useRef([]); // har frame ke latest faces
  const lastUpdate = useRef(0); // UI last kab update hua

  const [filter, setFilter] = useState("sunglasses"); // chuna filter
  const [look, setLook] = useState("natural"); // chuna look
  const [intensity, setIntensity] = useState("savage"); // chuni intensity
  const [roastLook, setRoastLook] = useState(true); // "Roast my look": photo AI ko bhejni hai?
  const [phase, setPhase] = useState("live"); // live | countdown | processing (photo ban rahi) | result
  const [count, setCount] = useState(3); // countdown number
  const [shot, setShot] = useState(null); // { uri, width, height, faces }
  const [cameraError, setCameraError] = useState(null); // error message
  const roast = useApiAction(api.cameraRoast); // /api/camera-roast state

  const countScale = useRef(new Animated.Value(0)).current; // countdown number ka pop
  const flash = useRef(new Animated.Value(0)).current; // white flash ki opacity

  // App background me gayi to camera band (battery + privacy)
  useEffect(() => { // app state sunna
    const subscription = AppState.addEventListener("change", (state) => setAppActive(state === "active")); // foreground/background
    return () => subscription.remove(); // cleanup
  }, []); // ek baar

  const cameraOn = isFocused && appActive && permission.hasPermission && phase !== "result"; // camera kab chale

  // Native face detector har frame bulata hai; hum UI sirf ~10 baar/second update karte hain
  const handleFaces = useCallback((detected) => { // detected = ML Kit faces
    const plain = detected.map(toPlainFace); // plain objects
    latestFaces.current = plain; // hamesha latest yaad
    const now = Date.now(); // abhi ka time
    if (now - lastUpdate.current > 100) { // 100ms ho gaye?
      lastUpdate.current = now; // time yaad
      setFaces(plain); // UI update
    } // if band
  }, []); // stable function

  const handleCameraError = useCallback((error) => setCameraError(error?.message ?? "Camera error"), []); // camera error dikhao

  const signals = buildSignals(faces, previewSize.width); // smile, distance...
  const hasFace = signals.faces > 0; // face mila?

  // 3 -> 2 -> 1 countdown, har number "pop" animation ke saath
  useEffect(() => { // phase/count badle
    if (phase !== "countdown") return; // countdown nahi
    if (count === 0) { // 0 pe
      capture(); // photo lo
      return; // bas
    } // if band
    countScale.setValue(0); // pop shuru se
    Animated.spring(countScale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start(); // spring pop
    const timer = setTimeout(() => setCount((c) => c - 1), 800); // 0.8 sec baad agla
    return () => clearTimeout(timer); // cleanup
    // capture() har render pe naya banta hai; dependency me daalne ki zaroorat nahi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]); // dependencies

  const startCountdown = () => { // "Roast My Face"
    setCameraError(null); // error hatao
    setCount(3); // 3 se
    setPhase("countdown"); // countdown shuru
  }; // function band

  async function capture() { // photo lo
    const captureSignals = buildSignals(latestFaces.current, previewSize.width); // is pal ke signals
    if (!captureSignals.faces) { // face nahi tha
      setCameraError("No face in frame at the last second. Try again."); // error
      setPhase("live"); // wapas live
      return; // ruk jao
    } // if band
    setPhase("processing"); // "Developing..."
    let photo; // AI ke liye photo (look mode me)
    // safed flash (camera click jaisa)
    flash.setValue(0.9); // lagbhag white
    Animated.timing(flash, { toValue: 0, duration: 350, useNativeDriver: true }).start(); // fade out

    try { // photo fail ho sakti hai
      const file = await photoOutput.capturePhotoToFile({ enableShutterSound: true }, {}); // photo file me save
      // native path ko file:// URI banao
      const uri = file.filePath.startsWith("file://") ? file.filePath : `file://${file.filePath}`; // URI
      // Photo pe dobara face detect karo, taaki filters photo pe bilkul sahi jagah lagein
      const detected = await imageDetector.detectFaces(uri); // photo me faces
      const photoFaces = detected.map(toPlainFace); // plain objects
      const size = await new Promise((resolve) => // photo ka size nikalo
        Image.getSize(uri, (width, height) => resolve({ width, height }), () => resolve(null)), // mila to size, warna null
      ); // promise band
      const width = photoFaces[0]?.frameWidth ?? size?.width ?? 1080; // photo width
      const height = photoFaces[0]?.frameHeight ?? size?.height ?? 1440; // photo height
      setShot({ uri, width, height, faces: photoFaces }); // save
      setPhase("result"); // result screen
      if (roastLook) { // look mode on hai to AI ke liye chhoti photo banao
        const context = ImageManipulator.manipulate(uri); // photo kholo
        context.resize({ width: 768 }); // 768px chaudi (height apne aap)
        const small = await (await context.renderAsync()).saveAsync({ base64: true, compress: 0.8, format: SaveFormat.JPEG }); // JPEG + base64
        photo = `data:image/jpeg;base64,${small.base64}`; // backend wala format
      } // if band
    } catch (error) { // fail
      setCameraError(`Couldn't take the photo: ${error?.message ?? "unknown error"}`); // error
      setPhase("live"); // wapas live
      return; // ruk jao
    } // try/catch band

    // Signals (+ look mode me photo) backend ko jaate hain
    roast.run({ // backend call
      expression: captureSignals.expression, // expression
      faces: Math.min(captureSignals.faces, 5), // kitne chehre
      distance: captureSignals.distance, // doori
      lighting: captureSignals.lighting, // roshni
      head_tilted: captureSignals.head_tilted, // sir tedha?
      looking_away: captureSignals.looking_away, // side dekh raha?
      filter, // filter
      intensity, // intensity
      photo, // look mode ho to photo, warna undefined
    }); // run band
  } // function band

  const retake = () => { // Retake
    roast.reset(); // result hatao
    setShot(null); // photo hatao
    setPhase("live"); // live
  }; // function band

  // ---------- Permission nahi mili / camera nahi mila wali screens ----------
  if (!permission.hasPermission) { // permission nahi hai
    const blocked = permission.status === "denied" || permission.status === "restricted"; // pakka mana kar diya?
    const message = blocked ? "Turn on camera permission for RoastMe AI in your phone settings." : "We need the camera to find your face and add filters. A photo is only sent to the AI when Roast my look is on."; // samjhaane wala text
    return ( // permission screen
      // heading wali screen
      <Screen eyebrow="Camera Roast" title="Show your face. Lose your dignity." description="Face detection runs on your phone. Your photo is never saved.">
        {/* beech ka card */}
        <Card style={styles.center}>
          {/* camera icon dabba */}
          <View style={styles.bigIcon}>
            {/* icon */}
            <Feather name="camera" size={26} color={colors.accentText} />
            {/* dabba band */}
          </View>
          {/* title */}
          <Text style={styles.centerTitle}>{blocked ? "Camera access is off" : "Ready for your close-up?"}</Text>
          {/* message */}
          <Text style={styles.centerText}>{message}</Text>
          {/* button: settings kholo ya permission maango */}
          <Button
            title={blocked ? "Open settings" : "Turn on camera"} // text
            icon={blocked ? "settings" : "camera"} // icon
            onPress={blocked ? () => Linking.openSettings() : permission.requestPermission} // kya kare
          // self-closing tag yahin band
          />
          {/* Card band */}
        </Card>
        {/* Screen band */}
      </Screen>
    ); // return band
  } // if band

  if (!device) { // front camera hi nahi
    return ( // error screen
      // screen
      <Screen eyebrow="Camera Roast" title="No front camera found">
        {/* error */}
        <ErrorNotice message="This device doesn't seem to have a front camera." />
        {/* Screen band */}
      </Screen>
    ); // return band
  } // if band

  const activeLook = LOOKS.find((l) => l.value === look); // chuna hua look
  const liveProgress = (Date.now() % 1600) / 1600; // NPC scan line aur flames ki halki movement

  return ( // main JSX
    // heading wali screen
    <Screen eyebrow="Camera Roast" title="Show your face. Lose your dignity." description="Pick a filter, pull a face, and let the scanner judge you.">
      {/* ---------- Camera wala box ---------- */}
      {phase !== "result" && (
        // camera box (size naap ke previewSize me)
        <View style={styles.stage} onLayout={(e) => setPreviewSize(e.nativeEvent.layout)}>
          {/* live camera */}
          <LiveCamera device={device} isActive={cameraOn} outputs={outputsRef.current} onFaces={handleFaces} onError={handleCameraError} />
          {/* look ka halka tint */}
          {activeLook.tint && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: activeLook.tint }]} />}

          {/* Live filters + violet HUD (screen ke pixels me) */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* gradients */}
            <FilterGradients />
            {/* filters + HUD */}
            <FaceFilterLayer faces={faces} filter={filter} showHud expression={signals.expression} progress={liveProgress} />
            {/* Svg band */}
          </Svg>

          {/* upar chips */}
          <View style={styles.chips} pointerEvents="none">
            {/* face mila? */}
            <Chip warn={!hasFace} icon="crosshair" text={hasFace ? `${signals.faces} face${signals.faces > 1 ? "s" : ""} locked` : "Searching for a face..."} />
            {/* expression */}
            {hasFace && <Chip text={SIGNAL_TEXT.expression[signals.expression]} />}
            {/* doori */}
            {hasFace && <Chip text={SIGNAL_TEXT.distance[signals.distance]} />}
            {/* chips band */}
          </View>

          {/* countdown number */}
          {phase === "countdown" && count > 0 && (
            // beech me
            <View style={styles.countWrap} pointerEvents="none">
              {/* bada number jo pop hota hai */}
              <Animated.Text
                style={[ // styles
                  styles.count, // bada white text
                  { opacity: countScale, transform: [{ scale: countScale.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) }] }, // bade se normal
                ]} // style band
                // opening tag band
              >
                {/* number */}
                {count}
                {/* Animated.Text band */}
              </Animated.Text>
              {/* beech band */}
            </View>
            // condition band
          )}
          {/* photo process ho rahi */}
          {phase === "processing" && (
            // beech me
            <View style={styles.countWrap} pointerEvents="none">
              {/* text */}
              <Text style={styles.processing}>Developing your roast...</Text>
              {/* beech band */}
            </View>
            // condition band
          )}
          {/* white flash */}
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#fff", opacity: flash }]} />
          {/* camera box band */}
        </View>
        // condition band
      )}

      {/* camera error */}
      {cameraError && <View style={styles.gap}><ErrorNotice message={cameraError} /></View>}

      {/* result nahi to controls, warna result */}
      {phase !== "result" ? (
        // controls (fade in)
        <FadeIn style={styles.controls}>
          {/* filters ki side-scroll row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {/* har filter */}
            {FILTERS.map((option) => {
              const active = filter === option.value; // chuna hai?
              return ( // option lautao
                // filter button
                <PressableScale
                  key={option.value} // key
                  onPress={() => setFilter(option.value)} // chuno
                  accessibilityRole="radio" // radio
                  accessibilityState={{ checked: active }} // chuna hai?
                  accessibilityLabel={option.label} // naam
                  style={[styles.filter, active && styles.filterActive]} // style
                  // opening tag band
                >
                  {/* emoji */}
                  <Text style={styles.filterEmoji}>{option.emoji}</Text>
                  {/* naam */}
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{option.label}</Text>
                  {/* button band */}
                </PressableScale>
              ); // return band
              // map function band
            })}
            {/* ScrollView band */}
          </ScrollView>

          {/* looks */}
          <View style={styles.row}>
            {/* har look */}
            {LOOKS.map((option) => (
              // look chip
              <PressableScale
                key={option.value} // key
                onPress={() => setLook(option.value)} // chuno
                accessibilityLabel={`${option.label} look`} // naam
                style={[styles.chipButton, look === option.value && styles.chipButtonActive]} // style
                // opening tag band
              >
                {/* naam */}
                <Text style={[styles.chipButtonText, look === option.value && styles.chipButtonTextActive]}>{option.label}</Text>
                {/* chip band */}
              </PressableScale>
              // map band
            ))}
            {/* row band */}
          </View>

          {/* intensity */}
          <View style={styles.row}>
            {/* har intensity */}
            {INTENSITIES.map((option) => (
              // intensity button
              <PressableScale
                key={option.value} // key
                onPress={() => setIntensity(option.value)} // chuno
                accessibilityLabel={option.label} // naam
                style={[styles.intensity, intensity === option.value && styles.intensityActive]} // style
                // opening tag band
              >
                {/* naam */}
                <Text style={styles.intensityText}>{option.label}</Text>
                {/* button band */}
              </PressableScale>
              // map band
            ))}
            {/* row band */}
          </View>

          {/* "Roast my look" switch */}
          <LookToggle value={roastLook} onChange={setRoastLook} />

          {/* main button */}
          <Button
            title={phase === "countdown" ? "Hold still..." : "Roast My Face"} // text
            icon="zap" // icon
            onPress={startCountdown} // countdown shuru
            disabled={!hasFace || phase !== "live"} // face nahi to band
            loading={phase === "processing"} // processing me spinner
          // self-closing tag yahin band
          />
          {/* face nahi hai to hint */}
          {!hasFace && <Text style={styles.hint}>Get your face in the frame to unlock the roast.</Text>}
          {/* controls band */}
        </FadeIn>
        // warna
      ) : (
        // result view
        <ResultView shot={shot} filter={filter} look={look} roast={roast} onRetake={retake} />
        // ternary band
      )}
      {/* Screen band */}
    </Screen>
  ); // JSX band
} // component band

// ---------- Result: photo + filters + roast ----------
// Look (Noir/Retro/Thermal) SVG color matrix se photo pe lagta hai

const LOOK_FILTERS = { // look → SVG color matrix
  noir: <FeColorMatrix type="saturate" values="0" />, // rang hatao = black & white
  retro: <FeColorMatrix type="matrix" values="0.393 0.769 0.189 0 0 0.349 0.686 0.168 0 0 0.272 0.534 0.131 0 0 0 0 0 1 0" />, // sepia matrix
  thermal: <FeColorMatrix type="matrix" values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0" />, // rang ulta (invert)
}; // object band

function ResultView({ shot, filter, look, roast, onRetake }) { // photo + roast dikhana
  const photoRef = useRef(null); // photo wale view ka reference (screenshot ke liye)
  const [note, setNote] = useState(""); // chhota message

  // Photo + filters wale view ka screenshot leke share sheet kholo
  const shareCard = async () => { // "Share photo"
    try { // fail ho sakta hai
      const uri = await captureRef(photoRef, { format: "png", quality: 1 }); // view ka PNG
      if (await Sharing.isAvailableAsync()) { // share ho sakta hai?
        await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your roast" }); // share sheet
      } else { // nahi
        setNote("Sharing isn't available on this device."); // message
      } // if/else band
    } catch { // error
      setNote("Couldn't create the image. Try again."); // message
    } // try/catch band
  }; // function band

  return ( // JSX shuru
    // wrapper
    <View style={styles.gap}>
      {/* photo card (fade in) */}
      <FadeIn>
        {/* screenshot hone wala view (collapsable=false zaroori) */}
        <View ref={photoRef} collapsable={false} style={styles.photoCard}>
          {/* photo ke pixels wala SVG */}
          <Svg width="100%" style={{ aspectRatio: shot.width / shot.height }} viewBox={`0 0 ${shot.width} ${shot.height}`}>
            {/* gradients */}
            <FilterGradients />
            {/* chuna look ho to color filter */}
            {LOOK_FILTERS[look] && <Filter id="look">{LOOK_FILTERS[look]}</Filter>}
            {/* photo */}
            <SvgImage
              href={{ uri: shot.uri }} // photo file
              width={shot.width} // width
              height={shot.height} // height
              preserveAspectRatio="xMidYMid slice" // poora bharo
              filter={LOOK_FILTERS[look] ? "url(#look)" : undefined} // look lagao
            // self-closing tag yahin band
            />
            {/* photo pe filters (photo ke detect hue faces pe) */}
            <FaceFilterLayer faces={shot.faces} filter={filter} labelScale={shot.width / 360} />
            {/* Svg band */}
          </Svg>
          {/* roast aa gaya to photo ke neeche caption */}
          {roast.status === "success" && (
            // caption
            <View style={styles.photoCaption}>
              {/* score */}
              <Text style={styles.captionScore}>ROAST SCORE {roast.data.roast_score}/100</Text>
              {/* title */}
              <Text style={styles.captionTitle}>{roast.data.title}</Text>
              {/* branding */}
              <Text style={styles.captionBrand}>RoastMe AI · for entertainment only</Text>
              {/* caption band */}
            </View>
            // condition band
          )}
          {/* photo card band */}
        </View>
        {/* FadeIn band */}
      </FadeIn>

      {/* roast aa raha */}
      {roast.status === "loading" && <LoadingCard message="Analyzing your camera presence..." />}
      {/* roast error */}
      {roast.status === "error" && <ErrorNotice message={roast.error} onRetry={onRetake} />}
      {/* roast card */}
      {roast.status === "success" && (
        // fade in (thoda late)
        <FadeIn delay={120}>
          {/* card */}
          <Card style={styles.resultCard}>
            {/* pill */}
            <Pill label="Camera verdict" />
            {/* title */}
            <Text style={styles.resultTitle}>{roast.data.title}</Text>
            {/* roast */}
            <Text style={styles.resultText}>{roast.data.roast}</Text>
            {/* score ring */}
            <ScoreRing value={roast.data.roast_score} label="Roast score" caption="A playful formula from what the scanner saw. Entertainment only." />
            {/* scanner ne kya dekha */}
            <View style={styles.signalsBox}>
              {/* heading */}
              <Text style={styles.signalsTitle}>WHAT THE SCANNER SAW</Text>
              {/* signals */}
              <Text style={styles.signalsText}>{roast.data.signals_used}</Text>
              {/* ML vs jokes note */}
              <Text style={styles.signalsText}>
                {/* text */}
                Face detection: Google ML Kit, on your phone. Roast by {PROVIDER_NAMES[roast.data.generator.provider] ?? "local templates"}{roast.data.used_photo ? ", which also looked at your photo (not saved)." : ", using only the signals."}
                {/* Text band */}
              </Text>
              {/* box band */}
            </View>
            {/* share + retake */}
            <View style={styles.row}>
              {/* photo share */}
              <Button title="Share photo" icon="image" size="sm" onPress={shareCard} />
              {/* retake */}
              <Button title="Retake" icon="rotate-ccw" size="sm" variant="secondary" onPress={onRetake} />
              {/* row band */}
            </View>
            {/* message ho to */}
            {note ? <Text style={styles.hint}>{note}</Text> : null}
            {/* copy/share text */}
            <ResultActions text={roast.data.roast} shareTitle="My RoastMe AI camera roast" />
            {/* Card band */}
          </Card>
          {/* FadeIn band */}
        </FadeIn>
        // condition band
      )}
      {/* wrapper band */}
    </View>
  ); // JSX band
} // component band

// "Roast my look" on/off switch (knob spring se khiskta hai)
function LookToggle({ value, onChange }) { // value = on/off
  const knob = useRef(new Animated.Value(value ? 1 : 0)).current; // 0 = left, 1 = right
  useEffect(() => { // value badle to knob khiskao
    Animated.spring(knob, { toValue: value ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start(); // spring
  }, [knob, value]); // dependencies
  const translateX = knob.interpolate({ inputRange: [0, 1], outputRange: [2, 18] }); // knob ki position (pixels)
  return ( // JSX shuru
    // poori row dabne layak
    <PressableScale
      onPress={() => onChange(!value)} // ulta karo
      accessibilityRole="switch" // screen reader: switch
      accessibilityState={{ checked: value }} // on hai?
      accessibilityLabel="Roast my look" // naam
      style={[styles.lookRow, value && styles.lookRowOn]} // on = violet
      // opening tag band
    >
      {/* switch ka track */}
      <View style={[styles.track, value && styles.trackOn]}>
        {/* white knob */}
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
        {/* track band */}
      </View>
      {/* text */}
      <View style={styles.lookText}>
        {/* heading */}
        <Text style={styles.lookTitle}>Roast my look 🔥</Text>
        {/* explanation */}
        <Text style={styles.lookHint}>Sends one photo to the AI (NVIDIA Nemotron, or Gemini as backup) for a next-level roast of your hair, outfit, room and pose. Not saved.</Text>
        {/* text band */}
      </View>
      {/* row band */}
    </PressableScale>
  ); // JSX band
} // component band

function Chip({ text, icon, warn = false }) { // camera ke upar chhota chip
  return ( // JSX shuru
    // chip box (warn = peela)
    <View style={[styles.chip, warn && styles.chipWarn]}>
      {/* icon (ho to) */}
      {icon && <Feather name={icon} size={11} color={warn ? "#fde68a" : "#ede9fe"} />}
      {/* text */}
      <Text style={[styles.chipText, warn && { color: "#fde68a" }]}>{text}</Text>
      {/* chip band */}
    </View>
  ); // JSX band
} // component band

const styles = StyleSheet.create({ // is file ki saari styles
  lookRow: { // "Roast my look" row ka style
    flexDirection: "row", // switch left, text right
    gap: 12, // beech ki doori
    alignItems: "flex-start", // upar se align
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // halki border
    backgroundColor: "rgba(255,255,255,0.02)", // halka background
    padding: 12, // andar ki jagah
  }, // lookRow band
  lookRowOn: { borderColor: "rgba(167,139,250,0.45)", backgroundColor: colors.accentSoft }, // on hone pe violet
  track: { width: 38, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", marginTop: 2 }, // switch ka track (grey)
  trackOn: { backgroundColor: colors.accent }, // on = violet track
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" }, // gol white knob
  lookText: { flex: 1, gap: 2 }, // text wala hissa
  lookTitle: { color: colors.text, fontSize: 14, fontWeight: "600" }, // heading
  lookHint: { color: colors.textMuted, fontSize: 12, lineHeight: 17 }, // chhoti explanation
  stage: { // stage ka style
    aspectRatio: 3 / 4, // width:height ka ratio
    borderRadius: radius.lg, // kone gol
    overflow: "hidden", // bahar nikla hissa chhupao
    backgroundColor: "#000", // background ka rang
    borderWidth: 1, // border ki motai
    borderColor: colors.border, // border ka rang
  }, // stage band
  chips: { position: "absolute", top: 10, left: 10, right: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }, // chips: position type, upar se doori, left se doori
  chip: { // chip ka style
    flexDirection: "row", // items ki direction (row = left-right)
    alignItems: "center", // cross-direction me alignment
    gap: 5, // items ke beech ki doori
    paddingHorizontal: 9, // andar ki jagah left-right
    paddingVertical: 4, // andar ki jagah upar-neeche
    borderRadius: radius.pill, // kone gol
    backgroundColor: "rgba(0,0,0,0.55)", // background ka rang
    borderWidth: 1, // border ki motai
    borderColor: "rgba(167,139,250,0.35)", // border ka rang
  }, // chip band
  chipWarn: { borderColor: "rgba(251,191,36,0.35)" }, // chipWarn: border ka rang
  chipText: { color: "#ede9fe", fontSize: 11.5, fontWeight: "600" }, // chipText: text ka rang, text ka size, text kitna bold
  countWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" }, // countWrap: poore parent ko dhak lo, cross-direction me alignment, main-direction me alignment
  count: { // count ka style
    color: "#fff", // text ka rang
    fontSize: 120, // text ka size
    fontWeight: "800", // text kitna bold
    textShadowColor: "rgba(139,92,246,0.9)", // text ki chamak ka rang
    textShadowRadius: 30, // text ki chamak kitni faile
  }, // count band
  processing: { // processing ka style
    color: "#fff", // text ka rang
    fontSize: 15, // text ka size
    fontWeight: "600", // text kitna bold
    backgroundColor: "rgba(0,0,0,0.55)", // background ka rang
    paddingHorizontal: 14, // andar ki jagah left-right
    paddingVertical: 8, // andar ki jagah upar-neeche
    borderRadius: radius.pill, // kone gol
    overflow: "hidden", // bahar nikla hissa chhupao
  }, // processing band
  controls: { gap: 14, marginTop: 16 }, // controls: items ke beech ki doori, upar bahar ki jagah
  filterRow: { gap: 8, paddingVertical: 2 }, // filterRow: items ke beech ki doori, andar ki jagah upar-neeche
  filter: { // filter ka style
    alignItems: "center", // cross-direction me alignment
    gap: 4, // items ke beech ki doori
    paddingHorizontal: 12, // andar ki jagah left-right
    paddingVertical: 10, // andar ki jagah upar-neeche
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "transparent", // border ka rang
    minWidth: 82, // kam se kam chaudai
  }, // filter band
  filterActive: { borderColor: "rgba(167,139,250,0.55)", backgroundColor: "rgba(139,92,246,0.15)" }, // filterActive: border ka rang, background ka rang
  filterEmoji: { fontSize: 24 }, // filterEmoji: text ka size
  filterLabel: { color: colors.textMuted, fontSize: 11.5, fontWeight: "500" }, // filterLabel: text ka rang, text ka size, text kitna bold
  filterLabelActive: { color: "#ede9fe" }, // filterLabelActive: text ka rang
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, // row: items ki direction (row = left-right), jagah kam ho to agli line me, items ke beech ki doori
  chipButton: { borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", paddingHorizontal: 14, paddingVertical: 7 }, // chipButton: kone gol, border ki motai, border ka rang
  chipButtonActive: { borderColor: "rgba(167,139,250,0.55)", backgroundColor: "rgba(139,92,246,0.15)" }, // chipButtonActive: border ka rang, background ka rang
  chipButtonText: { color: colors.textMuted, fontSize: 13 }, // chipButtonText: text ka rang, text ka size
  chipButtonTextActive: { color: "#ddd6fe" }, // chipButtonTextActive: text ka rang
  intensity: { // intensity ka style
    flex: 1, // bachi hui jagah le lo
    alignItems: "center", // cross-direction me alignment
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.10)", // border ka rang
    paddingVertical: 11, // andar ki jagah upar-neeche
  }, // intensity band
  intensityActive: { borderColor: "rgba(167,139,250,0.55)", backgroundColor: colors.accentSoft }, // intensityActive: border ka rang, background ka rang
  intensityText: { color: colors.text, fontSize: 13.5, fontWeight: "600" }, // intensityText: text ka rang, text ka size, text kitna bold
  hint: { color: colors.textFaint, fontSize: 12, textAlign: "center" }, // hint: text ka rang, text ka size, text ka alignment
  gap: { gap: 14, marginTop: 14 }, // gap: items ke beech ki doori, upar bahar ki jagah
  center: { alignItems: "center", gap: 12, paddingVertical: 32 }, // center: cross-direction me alignment, items ke beech ki doori, andar ki jagah upar-neeche
  bigIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" }, // bigIcon: chaudai, unchai, kone gol
  centerTitle: { color: colors.text, fontSize: 18, fontWeight: "700" }, // centerTitle: text ka rang, text ka size, text kitna bold
  centerText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 6 }, // centerText: text ka rang, text ka size, lines ke beech ki unchai
  photoCard: { borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }, // photoCard: kone gol, bahar nikla hissa chhupao, background ka rang
  photoCaption: { padding: 16, gap: 4 }, // photoCaption: andar ki jagah (charon taraf), items ke beech ki doori
  captionScore: { color: colors.accentText, fontSize: 12, fontWeight: "700", letterSpacing: 0.6 }, // captionScore: text ka rang, text ka size, text kitna bold
  captionTitle: { color: colors.text, fontSize: 22, fontWeight: "800" }, // captionTitle: text ka rang, text ka size, text kitna bold
  captionBrand: { color: colors.textFaint, fontSize: 11, marginTop: 4 }, // captionBrand: text ka rang, text ka size, upar bahar ki jagah
  resultCard: { gap: 16 }, // resultCard: items ke beech ki doori
  resultTitle: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.4 }, // resultTitle: text ka rang, text ka size, text kitna bold
  resultText: { color: colors.textMuted, fontSize: 15.5, lineHeight: 23 }, // resultText: text ka rang, text ka size, lines ke beech ki unchai
  signalsBox: { // signalsBox ka style
    borderRadius: radius.md, // kone gol
    borderWidth: 1, // border ki motai
    borderColor: "rgba(255,255,255,0.06)", // border ka rang
    backgroundColor: "rgba(255,255,255,0.02)", // background ka rang
    padding: 12, // andar ki jagah (charon taraf)
    gap: 6, // items ke beech ki doori
  }, // signalsBox band
  signalsTitle: { color: colors.textMuted, fontSize: 10.5, fontWeight: "700", letterSpacing: 0.6 }, // signalsTitle: text ka rang, text ka size, text kitna bold
  signalsText: { color: colors.textFaint, fontSize: 12.5, lineHeight: 18 }, // signalsText: text ka rang, text ka size, lines ke beech ki unchai
}); // styles band
