"""Camera Roast ka logic.

Do mode hain:
1) Signals mode: browser/phone sirf chhote "signals" bhejta hai (expression, distance, lighting...).
2) Look mode ("Roast my look" on): photo bhi aati hai, aur NVIDIA/Gemini photo dekh ke
   aur bhi personal roast likhte hain (hairstyle, outfit, room, pose...).
   Photo server pe kahin save nahi hoti, sirf AI ko dikhai jaati hai.

Dono mode me jokes un cheezon pe hain jo banda chun sakta hai ya aaj badal sakta hai,
kabhi skin colour, body, chehre ki banawat ya pehchaan pe nahi.
"""

import base64  # photo ka text → bytes
import random  # random joke chunne ke liye

from app.services import ai_provider  # NVIDIA/Gemini se roast likhwane ke liye

# Har expression ke liye 2-3 jokes (random ek chuna jaata hai)
EXPRESSION_LINES = {  # dict shuru
    "smiling": [  # muskura raha hai
        "Smiling this hard at a roast app? Bold. Delusional, but bold.",  # smile joke 1
        "That smile says \"I'm fine\" in the same tone as a burning building.",  # smile joke 2
        "You're grinning like you just found out the assignment deadline got extended. It didn't.",  # smile joke 3
    ],  # smiling band
    "neutral": [  # koi expression nahi
        "That expression has the emotional range of a loading spinner.",  # neutral joke 1
        "Zero reaction. You're giving NPC waiting for the player to press E.",  # neutral joke 2
        "Your poker face is so strong the camera asked if you're still there.",  # neutral joke 3
    ],  # neutral band
    "surprised": [  # muh khula / shocked
        "Mouth open like the Wi-Fi just dropped in the final round.",  # shocked joke 1
        "You look like you just checked your screen time report.",  # shocked joke 2
        "That face is pure \"wait, the exam is TODAY?\" energy.",  # shocked joke 3
    ],  # surprised band
    "eyebrows_raised": [  # bhauhein upar
        "Eyebrows raised like you're judging me. Sir, I'm the roaster here.",  # eyebrow joke 1
        "Those eyebrows are doing more work than you did all week.",  # eyebrow joke 2
    ],  # eyebrows band
    "eyes_closed": [  # aankhein band
        "Eyes closed on camera. Even your face is buffering.",  # eyes joke 1
        "You blinked at the exact wrong moment. Consistent with your life choices.",  # eyes joke 2
    ],  # eyes_closed band
}  # EXPRESSION_LINES band

# Camera se bahut paas / door
DISTANCE_LINES = {  # dict shuru
    "close": [  # bahut paas
        "You're so close to the lens I can practically see your search history.",  # close joke 1
        "Back up a little. The camera has personal space too.",  # close joke 2
    ],  # close band
    "far": [  # bahut door
        "You're sitting so far away it feels like a hostage video from across the room.",  # far joke 1
        "Social distancing from your own webcam. Iconic.",  # far joke 2
    ],  # far band
}  # DISTANCE_LINES band

# Andhera / bahut zyada roshni
LIGHTING_LINES = {  # dict shuru
    "dark": [  # andhera
        "This lighting is giving \"anonymous whistleblower interview\".",  # dark joke 1
        "It's so dark in there the camera is running on hope.",  # dark joke 2
    ],  # dark band
    "bright": [  # bahut roshni
        "So much light behind you, you look like you're about to deliver a prophecy.",  # bright joke
    ],  # bright band
}  # LIGHTING_LINES band

# Sir tedha
TILT_LINES = [  # list shuru
    "Head tilted like a confused golden retriever reading the terms and conditions.",  # tilt joke 1
    "That head tilt says \"I didn't understand the question but I'm committed\".",  # tilt joke 2
]  # list band

# Camera ki taraf nahi dekh raha
LOOKING_AWAY_LINES = [  # list shuru
    "Can't even make eye contact with a webcam. The avoidance is impressive.",  # away joke 1
    "Looking away from the camera like it owes you money.",  # away joke 2
]  # list band

# Frame me ek se zyada log
CROWD_LINES = [  # list shuru
    "Brought backup, I see. Smart move, a roast this strong needs witnesses.",  # crowd joke 1
    "Multiple faces detected. Group project energy: one of you is doing all the work.",  # crowd joke 2
]  # list band

# User ne jo face filter chuna, us pe ek line
FILTER_LINES = {  # filter naam → joke
    "sunglasses": "And the sunglasses? You're not a celebrity, you're avoiding eye contact with your responsibilities.",  # chashma
    "crown": "The crown filter is a choice. Royal delusion, officially confirmed.",  # taj
    "clown": "You picked the clown nose yourself. Honestly, saved me a joke.",  # clown naak
    "devil": "Devil horns? Babe, your most evil act is leaving people on read.",  # shaitan seeng
    "npc": "The NPC scanner agrees: dialogue options limited, side quests unavailable.",  # NPC scanner
    "flames": "Even the flames filter is trying to warm up your personality.",  # aag
}  # FILTER_LINES band

# Shuruaati line, intensity ke hisaab se
INTENSITY_OPENERS = {  # intensity → opener lines
    "friendly": ["Okay, camera check complete.", "Scan complete. Gentle notes incoming."],  # halka
    "savage": ["The camera has seen enough.", "Face scan complete. The results are... concerning."],  # teekha
    "extra_spicy": ["The camera wanted to look away, but it's contractually obligated.", "Scan complete. Your webcam has filed for a transfer."],  # sabse teekha
}  # dict band

# Score ke hisaab se title (upar se neeche check hota hai)
TITLES = [  # (minimum score, title)
    (80, "Certified Webcam Disaster"),  # 80+
    (60, "Main Character (Low Budget)"),  # 60-79
    (40, "Video Call Survivor"),  # 40-59
    (0, "Suspiciously Wholesome"),  # 0-39
]  # list band

# Intensity ka base score; signals isme points jodte hain
BASE_SCORE = {"friendly": 30, "savage": 55, "extra_spicy": 72}  # base score dict


# Jo signals mile unke hisaab se joke lines chuno
def _pick_lines(request):  # request me saare signals
    lines = [random.choice(EXPRESSION_LINES[request.expression.value])]  # expression ka ek joke hamesha
    if request.faces > 1:  # ek se zyada log?
        lines.append(random.choice(CROWD_LINES))  # crowd joke jodo
    if request.distance.value in DISTANCE_LINES:  # close ya far?
        lines.append(random.choice(DISTANCE_LINES[request.distance.value]))  # distance joke jodo
    if request.lighting.value in LIGHTING_LINES:  # dark ya bright?
        lines.append(random.choice(LIGHTING_LINES[request.lighting.value]))  # lighting joke jodo
    if request.looking_away:  # camera se nazar hata rakhi hai?
        lines.append(random.choice(LOOKING_AWAY_LINES))  # away joke jodo
    elif request.head_tilted:  # warna sir tedha hai?
        lines.append(random.choice(TILT_LINES))  # tilt joke jodo
    return lines[:4]  # max 4 lines, taaki roast chhota aur punchy rahe


def roast_score(request):  # signals se score nikalo
    """Sirf mazaak ka formula: har roast-layak signal thode points jodta hai."""
    bonus = 0  # extra points shuru me 0
    bonus += 6 if request.expression.value != "smiling" else 2  # smile nahi = zyada masala
    bonus += 5 if request.distance.value != "normal" else 0  # bahut paas/door = +5
    bonus += 5 if request.lighting.value != "normal" else 0  # kharab lighting = +5
    bonus += 4 if request.head_tilted else 0  # sir tedha = +4
    bonus += 5 if request.looking_away else 0  # nazar hatayi = +5
    bonus += 4 if request.faces > 1 else 0  # group = +4
    return min(99, BASE_SCORE[request.intensity.value] + bonus)  # base + bonus, max 99


# Signals ko ek readable line me: "expression: smiling, lighting: dark, ..."
def _describe_signals(request):  # AI aur UI dono ke liye
    parts = [f"expression: {request.expression.value.replace('_', ' ')}"]  # expression hamesha
    parts.append(f"distance from camera: {request.distance.value}")  # distance jodo
    parts.append(f"lighting: {request.lighting.value}")  # lighting jodo
    if request.faces > 1:  # group hai?
        parts.append(f"{request.faces} people in frame")  # kitne log
    if request.head_tilted:  # sir tedha?
        parts.append("head tilted")  # jodo
    if request.looking_away:  # nazar hati hui?
        parts.append("looking away from the camera")  # jodo
    if request.filter.value != "none":  # koi filter chuna?
        parts.append(f"chose the '{request.filter.value}' face filter")  # filter ka naam
    return ", ".join(parts)  # comma se jodke ek string


# Photo wale roast ke rules: mazedaar aur personal, par sirf "chuni hui" cheezon pe
LOOK_RULES = (  # kai strings jud ke ek lamba rule
    "This is a consensual self-roast: the person in the photo asked to be roasted. "  # khud ne maanga hai
    "Roast what you can SEE that they chose or could change today: hairstyle and hair-day energy, outfit, "  # baal, kapde
    "glasses and accessories, facial expression, pose, camera angle, the room and background, the mess, "  # expression, room
    "the lighting and the face filter they picked. Mention concrete visible details so it feels personal. "  # specific bano
    "Never comment on or joke about skin colour, race or ethnicity, body weight, size or shape, facial features "  # body/chehre pe nahi
    "they were born with, age, gender, disability, visible health conditions, or religious items and clothing. "  # pehchaan pe nahi
    "If the person looks like a child or teenager, keep it extremely gentle and wholesome. "  # bachche ho to bahut halka
    "If no face is clearly visible, roast their photo-taking skills instead. "  # face na dikhe to photo pe
    "No slurs, no sexual content, no profanity stronger than mild. "  # gaali/sexual nahi
    "Never mention self-harm, suicide or death, not even as a figure of speech. "  # self-harm ka zikr bilkul nahi
    "Reply with plain text only: no markdown, no lists, no emojis, no preamble."  # sirf saaf text
)  # LOOK_RULES band


def _decode_photo(photo):  # "data:image/jpeg;base64,..." → bytes
    if not photo:  # photo nahi aayi
        return None  # kuch nahi
    try:  # galat base64 ho sakta hai
        raw = base64.b64decode(photo.split(",", 1)[1], validate=True)  # comma ke baad wala hissa decode
    except (ValueError, IndexError):  # decode nahi hua
        return None  # photo ignore karo
    return {"mime": "image/jpeg", "data": raw}  # AI ko dene layak


# Main function: pehle photo ke saath AI, phir bina photo AI, phir templates
def create_camera_roast(request):  # route isko call karta hai
    intensity = request.intensity.value  # friendly / savage / extra_spicy
    signals = _describe_signals(request)  # scanner ne kya dekha
    image = _decode_photo(request.photo)  # photo (ho to)
    roast_text, provider, used_photo = None, None, False  # abhi kuch nahi

    if image:  # "Roast my look" on hai
        roast_text, provider = ai_provider.generate(  # photo dekh ke roast
            "Write a 4 to 6 sentence roast, under 120 words, of the person in this webcam photo. "  # kaam
            "Be sharp, specific and genuinely funny, like a stand-up comic at a roast battle. "  # style
            f"Intensity: {intensity.replace('_', ' ')}.",  # kitna teekha
            f"Face scanner signals (use them too): {signals}",  # signals bhi do
            max_tokens=500,  # jawab ki max lambai
            image=image,  # photo
            rules=LOOK_RULES,  # photo wale rules
        )  # generate band
        used_photo = roast_text is not None  # photo wala roast mila?

    if roast_text is None:  # photo nahi thi ya photo wala fail hua
        roast_text, provider = ai_provider.generate(  # sirf signals se roast
            "Write a 3 to 5 sentence webcam roast, under 90 words, based ONLY on the detected signals "  # instruction 1
            "(expression, pose, distance, lighting, filter). Do not describe or guess the person's looks. "  # instruction 2 (safety)
            f"Intensity: {intensity.replace('_', ' ')}.",  # instruction 3 (intensity)
            f"Detected signals: {signals}",  # AI ko signals ki line
            max_tokens=400,  # jawab ki max lambai
        )  # generate band

    source = "ai"  # maan lo AI ne likha
    # AI off hai ya fail hua → local template lines jodo
    if roast_text is None:  # AI se kuch nahi aaya
        lines = [random.choice(INTENSITY_OPENERS[intensity]), *_pick_lines(request)]  # opener + signal jokes
        if request.filter.value in FILTER_LINES:  # filter chuna tha?
            lines.append(FILTER_LINES[request.filter.value])  # filter joke bhi jodo
        roast_text = " ".join(lines)  # sab lines ek paragraph me
        source = "template"  # source badlo

    score = min(roast_score(request) + (5 if used_photo else 0), 99)  # photo wala roast thoda zyada garam (max 99)
    title = next(text for threshold, text in TITLES if score >= threshold)  # score se title
    return {  # result dict
        "roast": roast_text,  # roast ka text
        "title": title,  # jaise "Certified Webcam Disaster"
        "roast_score": score,  # 0-99
        "intensity": intensity,  # user ki chuni intensity
        "signals_used": signals,  # UI pe "scanner ne kya dekha"
        "used_photo": used_photo,  # AI ne photo dekhi?
        "generator": {"source": source, "provider": provider or "local-templates"},  # kisne likha
    }  # dict band
