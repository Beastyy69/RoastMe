"""NPC Meter quiz: har baar naye sawal, aur jawabon ke hisaab se roast.

1) GET /api/npc/questions → AI (NVIDIA/Gemini) 6 naye sawal likhta hai, random topics pe.
   AI na chale to neeche wale QUESTION_BANK se random 6 sawal (options bhi shuffle).
2) Har option ke "points" (0 = main character, 3 = full NPC) server pe hi rehte hain,
   client ko sirf quiz_id + sawal + options milte hain (answer key chhupi rehti hai).
3) POST /api/npc → points jod ke 0-100 NPC score, phir AI unhi jawabon pe roast likhta hai.
"""

import ast  # JSON jaisa par single quotes wala jawab padhne ke liye (safe, code nahi chalata)
import json  # AI ka JSON jawab padhne ke liye
import logging  # warnings terminal me
import random  # random topics / sawal / options ka order
import re  # AI jawab me se JSON dhundhne ke liye
import time  # quiz kab bana (purane quiz hatane ke liye)
import uuid  # har quiz ki unique id
from collections import OrderedDict  # order yaad rakhne wali dict (sabse purana pehle)

from app.services import ai_provider  # NVIDIA/Gemini

logger = logging.getLogger(__name__)  # is file ka logger

QUESTION_COUNT = 6  # ek quiz me kitne sawal
QUIZ_TTL_SECONDS = 2 * 60 * 60  # quiz 2 ghante tak valid
MAX_STORED_QUIZZES = 2000  # memory me max kitne quiz (zyada ho to purane hatao)

# AI ko har baar alag topics dete hain, taaki sawal repeat na hon
THEMES = [  # topics ki list
    "mornings and alarms", "phone and screen time", "food and ordering", "weekends",  # topics 1-4
    "group chats", "online shopping", "music taste", "travel plans", "college or work",  # topics 5-9
    "texting style", "movies and shows", "gym and fitness", "spending money", "gaming",  # topics 10-14
    "parties and plans", "cooking", "social media posting", "sleep schedule", "decision making",  # topics 15-19
    "hobbies", "small talk", "birthdays and gifts", "commuting", "cleaning your room",  # topics 20-24
]  # THEMES band

# AI ke liye quiz ke rules: sirf JSON, aur koi sensitive topic nahi
QUIZ_RULES = (  # kai strings jud ke ek lamba rule
    "Keep every question playful and light. Never ask about appearance, body, health, race, religion, "  # sensitive topics nahi
    "gender, sexuality, politics, money troubles, self-harm or death. "  # aur bhi sensitive topics nahi
    "Reply with ONLY valid JSON, no markdown fences, no extra text. "  # sirf JSON
    "Never put double quote characters inside the text; use single quotes there instead."  # JSON todne wale quotes nahi
)  # QUIZ_RULES band

# AI fail ho to yahan se random sawal. points: 0 = main character ... 3 = full NPC
QUESTION_BANK = [  # (sawal, [(option, points), ...])
    ("Your alarm goes off. What happens next?", [  # sawal 1
        ("Up instantly, already planning world domination", 0), ("Snooze twice, then get up like an adult", 1),  # options A, B
        ("Scroll the same three apps for 40 minutes", 3), ("I wake up whenever the plot requires it", 2)]),  # options C, D
    ("Someone asks \"How are you?\"", [  # sawal 2
        ("Actually tell them how I am", 0), ("\"Good, you?\" on autopilot", 3),  # options A, B
        ("\"Can't complain\" while complaining inside", 2), ("Start a 20-minute monologue", 1)]),  # options C, D
    ("At your usual restaurant you order...", [  # sawal 3
        ("Something new every time", 0), ("The exact same thing since 2019", 3),  # options A, B
        ("Whatever my friend orders", 2), ("I make the waiter pick", 1)]),  # options C, D
    ("Your ideal weekend is...", [  # sawal 4
        ("A spontaneous trip with zero planning", 0), ("Rewatching a show for the fifth time", 3),  # options A, B
        ("Whatever the group chat decides", 2), ("Working on a side project", 1)]),  # options C, D
    ("A heated debate starts in the group chat. You...", [  # sawal 5
        ("Jump in with a hot take", 0), ("React with a single emoji", 2),  # options A, B
        ("Agree with whoever spoke last", 3), ("Lurk silently and enjoy the chaos", 1)]),  # options C, D
    ("Which line do you say most often?", [  # sawal 6
        ("\"Let's try something different\"", 0), ("\"It is what it is\"", 3),  # options A, B
        ("\"Same\"", 2), ("\"Wait, hear me out\"", 1)]),  # options C, D
    ("How do you get to work or class?", [  # sawal 7
        ("Different route depending on my mood", 0), ("Same route, same seat, same playlist", 3),  # options A, B
        ("Follow the map app without thinking", 2), ("Whatever is fastest, I'm late", 1)]),  # options C, D
    ("Where do you see yourself in five years?", [  # sawal 8
        ("I have a plan and a backup plan", 0), ("Doing this exact same thing", 3),  # options A, B
        ("Wherever life spawns me", 2), ("Somewhere with better Wi-Fi", 1)]),  # options C, D
    ("Your phone's home screen is...", [  # sawal 9
        ("Custom widgets, carefully themed", 0), ("Never changed since I bought it", 3),  # options A, B
        ("Whatever the last update did", 2), ("Chaos, but I know where everything is", 1)]),  # options C, D
    ("A new song is trending everywhere. You...", [  # sawal 10
        ("Found it two months ago, already bored", 0), ("Add it to the same playlist as always", 2),  # options A, B
        ("Hum it all week without knowing the name", 3), ("Make a meme about it", 1)]),  # options C, D
    ("Your friends plan a trip. Your role is...", [  # sawal 11
        ("I planned the whole thing", 0), ("I send money and show up", 3),  # options A, B
        ("I reply \"I'm in\" and nothing else", 2), ("I find the weird hidden spots", 1)]),  # options C, D
    ("You get a random free afternoon. You...", [  # sawal 12
        ("Try that thing I've been putting off", 0), ("Nap, then wonder where the day went", 3),  # options A, B
        ("Text everyone \"what are you doing\"", 2), ("Rearrange my whole room", 1)]),  # options C, D
    ("How do you reply to a long message?", [  # sawal 13
        ("An equally long, thoughtful reply", 0), ("\"haha yeah\"", 3),  # options A, B
        ("A voice note while walking", 1), ("Seen. Reply in three days", 2)]),  # options C, D
    ("Your shopping cart right now contains...", [  # sawal 14
        ("Something I'll actually use tomorrow", 1), ("The same item, sitting there for months", 3),  # options A, B
        ("Whatever the ad showed me", 2), ("A weird gadget nobody understands", 0)]),  # options C, D
    ("At a party you are usually...", [  # sawal 15
        ("Starting the dance floor", 0), ("Standing near the snacks, nodding", 3),  # options A, B
        ("Talking to the one person I know", 2), ("Petting the host's dog", 1)]),  # options C, D
    ("When a game or app asks to update, you...", [  # sawal 16
        ("Read the patch notes like a scholar", 0), ("Press \"Remind me later\" forever", 2),  # options A, B
        ("Update without reading anything", 3), ("Wait to see if it breaks for others", 1)]),  # options C, D
]  # QUESTION_BANK band

# Score → title + chhoti description (bade threshold se check)
TIERS = [  # (minimum score, title, description)
    (80, "Background Villager", "You walk the same path, say the same line, and reset every morning. Developers forgot to give you a side quest."),  # 80+
    (60, "Shopkeeper NPC", "You have exactly three lines of dialogue and you deliver them perfectly. Reliable, predictable, weirdly comforting."),  # 60-79
    (40, "Side Quest Giver", "Some personality, a few surprising branches, and now and then you say something that makes people stop and listen."),  # 40-59
    (20, "Supporting Character", "You make your own choices most of the time. The writers clearly gave you a backstory and a couple of plot twists."),  # 20-39
    (0, "Main Character", "Unpredictable, opinionated, and allergic to routine. The story bends around you, sometimes to everyone's exhaustion."),  # 0-19
]  # TIERS band

_quizzes = OrderedDict()  # { quiz_id: {"questions": [...], "created": time} }


class QuizExpired(Exception):  # quiz_id nahi mila (purana ho gaya ya server restart hua)
    pass  # koi extra kaam nahi


# ---------------- 1) Naya quiz ----------------

def new_quiz():  # naya quiz banao (AI se, warna bank se)
    questions, provider = _ai_questions()  # AI se sawal maango
    source = "ai" if questions else "template"  # kisne banaye
    if not questions:  # AI fail
        questions = _bank_questions()  # bank se random sawal

    quiz_id = uuid.uuid4().hex  # 32 character ki random id
    _remember(quiz_id, questions)  # server pe yaad rakho (points ke saath)
    return {  # client ko jaane wala data
        "quiz_id": quiz_id,  # baad me answers ke saath wapas aayegi
        "questions": [  # points ke bina sawal
            {"id": f"{quiz_id[:8]}-{i}", "question": q["question"], "options": [o["text"] for o in q["options"]]}  # sirf text
            for i, q in enumerate(questions)  # har sawal ke liye
        ],  # list band
        "generator": {"source": source, "provider": provider or "local-templates"},  # kisne likha
    }  # dict band


def _ai_questions():  # AI se naye sawal (ya (None, None))
    themes = random.sample(THEMES, QUESTION_COUNT)  # har baar alag topics
    task = (  # AI ka kaam
        f"Write a fresh, funny 'Are you an NPC?' personality quiz with exactly {QUESTION_COUNT} questions, "  # kitne sawal
        "one per topic given by the user. Each question has exactly 4 short answer options (under 12 words each). "  # 4 options
        "Give every option an 'npc' score: 0 = chaotic main character energy, 3 = totally predictable background NPC. "  # points ka matlab
        "Use each score 0, 1, 2, 3 exactly once per question. Make the options funny and specific, not generic. "  # har score ek baar
        "Do not start a question with its topic name. "  # "Gym: ..." jaisa prefix nahi
        'JSON shape: {"questions": [{"question": "...", "options": [{"text": "...", "npc": 0}]}]}'  # JSON ka shape
    )  # task band
    content = f"Topics: {', '.join(themes)}. Random seed: {random.randint(1000, 9999)}."  # topics + seed (variety ke liye)
    text, provider = ai_provider.generate(task, content, max_tokens=1500, rules=QUIZ_RULES, timeout=25)  # AI call (6 sawal likhne me ~8-15 second)
    if not text:  # AI ne kuch nahi diya
        return None, None  # bank use hoga
    questions = _parse_questions(text)  # JSON check karo
    if len(questions) < QUESTION_COUNT // 2:  # aadhe se kam sahi sawal = bekaar jawab
        logger.warning("AI quiz unusable (%d good questions), using the question bank", len(questions))  # warning
        return None, None  # bank use hoga
    if len(questions) < QUESTION_COUNT:  # thode kam hain
        questions += _bank_questions()[: QUESTION_COUNT - len(questions)]  # baaki bank se bhar do
    return questions, provider  # sawal + kisne likhe


def _parse_questions(text):  # AI ka text → sahi sawalon ki list (kuch na mile to khaali list)
    match = re.search(r"\{.*\}", text, re.S)  # pehle { se aakhri } tak (``` fences ho to bhi)
    if not match:  # JSON hi nahi mila
        return []  # kuch nahi
    try:  # JSON toota ho sakta hai
        data = json.loads(match.group(0))  # asli JSON
    except ValueError:  # AI ne kahin 'single quotes' use kiye
        try:  # Python literal ki tarah padhne ki koshish
            data = ast.literal_eval(match.group(0))  # sirf data padhta hai, code nahi chalata
        except (ValueError, SyntaxError, MemoryError, RecursionError):  # ye bhi nahi chala
            return []  # kuch nahi
    raw = data.get("questions", []) if isinstance(data, dict) else []  # sawalon ki list

    questions = []  # saaf sawal yahan
    for item in raw if isinstance(raw, list) else []:  # har sawal (list na ho to kuch nahi)
        try:  # har sawal ka shape check
            question = str(item["question"]).strip()[:160]  # sawal (max 160 characters)
            options = [{"text": str(o["text"]).strip()[:100], "npc": float(o.get("npc", 0))} for o in item["options"]]  # options + AI ke points
        except (KeyError, TypeError, ValueError, AttributeError):  # koi field gayab / galat
            continue  # ye sawal chhodo, baaki dekho
        texts = {o["text"].lower() for o in options}  # duplicate check ke liye
        if len(question) < 5 or len(options) != 4 or len(texts) != 4 or "" in texts:  # 4 alag options chahiye
            continue  # ye sawal chhodo
        # AI kabhi do options ko same points de deta hai: unke order se 0, 1, 2, 3 dobara baant do
        ranked = sorted(range(4), key=lambda i: options[i]["npc"])  # kam NPC se zyada NPC
        for points, index in enumerate(ranked):  # 0, 1, 2, 3
            options[index] = {"text": options[index]["text"], "points": points}  # naye points
        random.shuffle(options)  # order random (AI aksar 0 pehle rakhta hai)
        questions.append({"question": question, "options": options})  # jodo
        if len(questions) == QUESTION_COUNT:  # 6 ho gaye
            break  # bas
    return questions  # sahi sawal


def _bank_questions():  # bank se random sawal
    picked = random.sample(QUESTION_BANK, QUESTION_COUNT)  # 16 me se 6
    questions = []  # list
    for question, options in picked:  # har chuna sawal
        shuffled = [{"text": text, "points": points} for text, points in options]  # dict bana do
        random.shuffle(shuffled)  # options ka order random
        questions.append({"question": question, "options": shuffled})  # jodo
    return questions  # wapas


def _remember(quiz_id, questions):  # quiz memory me rakho
    now = time.time()  # abhi ka time
    _quizzes[quiz_id] = {"questions": questions, "created": now}  # save
    while _quizzes:  # purane quiz saaf karo
        oldest_id, oldest = next(iter(_quizzes.items()))  # sabse purana
        if len(_quizzes) > MAX_STORED_QUIZZES or now - oldest["created"] > QUIZ_TTL_SECONDS:  # bahut zyada / purana
            _quizzes.pop(oldest_id)  # hatao
        else:  # baaki sab naye hain
            break  # ruk jao


# ---------------- 2) Score + roast ----------------

def score_quiz(request):  # request.quiz_id + request.answers
    quiz = _quizzes.get(request.quiz_id)  # server pe quiz dhundho
    if not quiz or time.time() - quiz["created"] > QUIZ_TTL_SECONDS:  # nahi mila / purana
        raise QuizExpired("This quiz expired. Load a new one to play again.")  # 410 jayega
    questions = quiz["questions"]  # sawal (points ke saath)
    if len(request.answers) != len(questions):  # saare jawab aaye?
        raise ValueError(f"Please answer all {len(questions)} questions.")  # 422

    points = 0  # total points
    picked = []  # (sawal, chuna jawab) roast ke liye
    for question, answer in zip(questions, request.answers):  # har sawal + jawab
        if not 0 <= answer < len(question["options"]):  # option number valid?
            raise ValueError("Invalid answer.")  # 422
        option = question["options"][answer]  # chuna option
        points += option["points"]  # points jodo
        picked.append((question["question"], option["text"]))  # yaad rakho

    score = round(points / (3 * len(questions)) * 100)  # 0-100
    title, description = next((t, d) for threshold, t, d in TIERS if score >= threshold)  # score se title
    roast, provider = _ai_roast(picked, score, title, request.nickname)  # AI roast
    return {  # result
        "nickname": request.nickname,  # naam (agar diya)
        "npc_score": score,  # 0-100
        "title": title,  # jaise "Shopkeeper NPC"
        "description": description,  # tier ki chhoti line
        "roast": roast or description,  # AI roast, warna tier ki line
        "generator": {"source": "ai" if roast else "template", "provider": provider or "local-templates"},  # kisne likha
    }  # dict band


def _ai_roast(picked, score, title, nickname):  # jawabon pe roast (ya (None, None))
    task = (  # AI ka kaam
        f"The user took an 'Are you an NPC?' quiz and scored {score}/100 on the NPC scale, rank '{title}'. "  # score + title
        "Roast them in 3 or 4 punchy sentences, under 90 words, based on their actual answers: "  # kitna lamba
        "quote or reference at least two specific answers and connect them into a funny picture of their life. "  # jawab use karo
        "High score = predictable background-character energy, low score = chaotic main-character energy. "  # score ka matlab
        "Savage but friendly."  # tone
    )  # task band
    lines = [f"Q: {q}\nA: {a}" for q, a in picked]  # har sawal-jawab
    name = f"Name: {nickname}\n" if nickname else ""  # naam ho to
    return ai_provider.generate(task, name + "\n".join(lines), max_tokens=400)  # (text, provider)
