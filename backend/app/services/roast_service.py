"""Text roast banata hai: ML topic chunta hai, phir AI ya local templates joke likhte hain."""

import random  # random jokes chunne ke liye
import re  # text ko sentences me todne ke liye

from app.ml.classifier import roast_classifier  # topic batane wala ML model
from app.services import ai_provider  # NVIDIA/Gemini se roast likhwane ke liye
from app.services.roast_templates import CATEGORY_LINES, CLOSERS, OPENERS, QUOTE_LINES  # hath se likhe jokes

# AI ko batane ke liye ki har intensity kitni teekhi ho
INTENSITY_GUIDE = {  # intensity → AI ke liye instruction
    "friendly": "Friendly: light teasing, warm, ends on an encouraging note.",  # halka mazaak
    "savage": "Savage: sharp and witty, confident punchlines, still clearly in fun.",  # teekha
    "extra_spicy": "Extra Spicy: maximum wit and bold punchlines, but never cruel or hateful.",  # sabse teekha
}  # dict band

# Heat rating ka base (intensity ke hisaab se)
BASE_HEAT = {"friendly": 35, "savage": 62, "extra_spicy": 82}  # base score

# Ye phrases mile to roast ka zyada masala milta hai. Sirf mazaak ka formula.
ROASTABLE_SIGNALS = [  # list shuru
    "always", "never", "tomorrow", "later", "last minute", "deadline", "3am", "4am",  # aalas wale words
    "one more", "snooze", "blame", "skip", "excuse", "procrastinat", "all night",  # bahane wale words
    "forgot", "lazy", "again", "every day", "binge", "scroll",  # aadat wale words
]  # list band


# User ki line ka pehla hissa nikalo (quote karke roast karne ke liye)
def _first_clause(text, limit=70):  # text = user ka bio/habits
    clause = re.split(r"[.!?;\n]", text, maxsplit=1)[0].strip()  # pehla sentence
    if len(clause) > limit:  # bahut lamba hai?
        clause = clause[:limit].rsplit(" ", 1)[0] + "..."  # 70 characters pe kaat ke "..."
    return clause  # quote karne layak chhota hissa


def heat_rating(text, intensity):  # mazaak wala score
    """Sirf mazaak ka score: intensity base deti hai, roast-layak phrases points jodte hain."""
    lowered = text.lower()  # chhote letters me
    signals = sum(1 for phrase in ROASTABLE_SIGNALS if phrase in lowered)  # kitne masala words mile
    return min(99, BASE_HEAT[intensity] + min(signals, 5) * 3)  # base + har word ke 3 (max 5 words), max 99


# AI na ho to: opener + quote + 2 category jokes + closer
def _template_roast(name, quote, category, intensity):  # templates se roast jodna
    lines = [  # roast ki lines
        random.choice(OPENERS[intensity]).format(name=name),  # opener me naam bharo
        random.choice(QUOTE_LINES[intensity]).format(quote=quote),  # quote line me user ki line bharo
        *random.sample(CATEGORY_LINES[category][intensity], 2),  # category ke 2 alag jokes
        random.choice(CLOSERS[intensity]),  # aakhri line
    ]  # list band
    return " ".join(lines)  # sab ek paragraph me


# AI ko instructions + user ki details bhejo
def _ai_roast(name, request, category):  # AI se roast
    instructions = (  # AI ke liye kaam
        "Write one personalised roast of 4 to 6 sentences, under 110 words, "  # lambai
        "that references specific details the user shared. "  # user ki details use kare
        f"Intensity: {INTENSITY_GUIDE[request.intensity.value]} "  # kitna teekha
        f"Lean into the theme '{category.replace('_', ' ')}'."  # kis topic pe zyada
    )  # instructions band
    user_content = (  # user ki details
        f"Nickname: {name}\n"  # naam
        f"Bio / routine: {request.bio}\n"  # bio
        f"Habits and excuses: {request.habits or 'not provided'}"  # habits (na ho to "not provided")
    )  # user_content band
    return ai_provider.generate(instructions, user_content)  # (text, provider) ya (None, None)


# Main function: ML → AI/templates → heat rating
def create_roast(request):  # route isko call karta hai
    text_for_model = f"{request.bio} {request.habits or ''}".strip()  # bio + habits ek text me
    # 1) ML se topic predict karo
    prediction = roast_classifier.predict(text_for_model)  # topic + probabilities

    # 2) User ne category chuni hai to wahi, "auto" hai to ML wali
    user_picked = request.category.value != "auto"  # user ne khud chuni?
    category = request.category.value if user_picked else prediction["label"]  # final category
    intensity = request.intensity.value  # friendly / savage / extra_spicy
    name = request.nickname or "friend"  # naam nahi diya to "friend"

    # 3) Pehle AI try karo, None aaye to templates
    roast_text, provider = _ai_roast(name, request, category)  # AI se roast + kisne likha
    source = "ai"  # maan lo AI ne likha
    if roast_text is None:  # AI se kuch nahi aaya
        quote = _first_clause(request.habits or request.bio)  # quote karne ke liye line
        roast_text = _template_roast(name, quote, category, intensity)  # templates se roast
        source = "template"  # source badlo

    return {  # result dict
        "roast": roast_text,  # roast ka text
        "nickname": request.nickname,  # naam (ho to)
        "intensity": intensity,  # chuni hui intensity
        "category": category,  # final topic
        "category_source": "user" if user_picked else "ml",  # topic kisne chuna
        "heat_rating": heat_rating(text_for_model, intensity),  # mazaak wala score
        "generator": {  # joke kisne likha
            "source": source,  # "ai" ya "template"
            "provider": provider if source == "ai" else "local-templates",  # kaunsa AI (nvidia / gemini)
        },  # generator band
        "ml": prediction,  # ML ki poori details (UI bars ke liye)
    }  # dict band
