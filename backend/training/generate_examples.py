"""Topic classifier ke liye training examples NVIDIA Nemotron se likhwata hai.

backend folder se chalao (backend/.env me NVIDIA_API_KEY chahiye):
    python training/generate_examples.py
Phir model train karo:
    python training/train_model.py

Har topic ke liye 8 alag "personas" (student, office worker, parent...) ke andaaz me
30-30 lines maangte hain, ek hi tie-break rulebook ke saath (taaki overlap wale case
hamesha same label paayein). Phir duplicate aur test set (dataset.json) se milti-julti
lines hata dete hain, taaki test imaandaar rahe. Result: generated_examples.json
"""

import concurrent.futures as cf  # kai requests ek saath bhejne ke liye
import json  # JSON padhna/likhna
import re  # AI jawab me se JSON list dhundhna aur words nikalna
import sys  # backend folder ko import path me jodna
import time  # retry se pehle thoda rukna
from pathlib import Path  # file paths

import httpx  # NVIDIA ko HTTP request

BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/ folder
sys.path.insert(0, str(BACKEND_DIR))  # taaki "from app import config" chale
from app import config  # noqa: E402  (.env se NVIDIA key)

OUTPUT_PATH = BACKEND_DIR / "training" / "generated_examples.json"  # yahan save hoga
TEST_PATH = BACKEND_DIR / "training" / "dataset.json"  # 150 haath se likhe (test set)
MODEL = "nvidia/nemotron-3.5-super-vl-120b-a12b"  # likhne wala model

# Ek hi rulebook: jo line do topics me fit ho, uska label yahi rules tay karte hain
RULES = (  # kai strings jud ke ek rulebook
    "Five topics. When a line could fit two, these tie-break rules decide:\n"  # intro
    "- student_life: anything about school, college or university: classes, lectures, exams, assignments, homework, "  # padhai ka matlab
    "professors, hostel, notes, grades, thesis. School wins even if the line is about delaying or cramming.\n"  # school sabse upar
    "- gaming: video games and gaming culture: ranked, ping, lag, consoles, PC builds, streaming gameplay, Discord squads, "  # games ka matlab
    "gacha, speedruns, game characters. Gaming wins over everything except school.\n"  # gaming doosre number pe
    "- procrastination: delaying or avoiding tasks that are NOT school or games: chores, emails, bills, appointments, "  # kaam taalna
    "work tasks, 'tomorrow', snoozing, starting Monday, doing anything except the real task.\n"  # examples
    "- productivity: obsession with being productive: apps, planners, to-do systems, routines, life hacks, optimising "  # productivity ka matlab
    "workflow, hustle culture, meetings, tracking habits and scores. Includes ironic over-optimisers who never actually work.\n"  # ironic wale bhi
    "- general: everyday life with none of the above: food, pets, friends, family, music, movies, travel, hobbies, "  # baaki sab
    "shopping, quirks, social awkwardness."  # aur bhi
)  # rulebook band

DESCRIBE = {  # label → AI ko topic ka matlab
    "student_life": "student life (school, college, exams, classes, assignments)",  # padhai
    "gaming": "gaming (video games and gaming culture)",  # games
    "procrastination": "procrastination about NON-school, NON-gaming tasks",  # kaam taalna
    "productivity": "productivity obsession (apps, planners, routines, optimising)",  # productivity
    "general": "general everyday life that is clearly NOT about school, games, procrastination or productivity",  # baaki sab
}  # dict band

PERSONAS = [  # alag-alag log, taaki lines ka andaaz alag ho
    "a 19-year-old engineering student in India who mixes in a little Hinglish",  # persona 1
    "a 30-year-old office worker in the US",  # persona 2
    "a teenager who texts in lowercase with slang",  # persona 3
    "a 24-year-old who just started their first job",  # persona 4
    "a 40-year-old parent with two kids",  # persona 5
    "a remote freelancer who works from cafes",  # persona 6
    "a university student in the UK living in halls",  # persona 7
    "someone writing a short, slightly self-roasting dating-app bio",  # persona 8
]  # list band


def ask(label, persona, count=30):  # ek topic + ek persona ke liye lines maango
    prompt = (  # AI ka kaam
        f"{RULES}\n\nWrite {count} different one-line self-descriptions, as {persona} would write them in a 'roast me' app, "  # kitni lines, kiske andaaz me
        f"that ALL clearly belong to the topic: {DESCRIBE[label]}. "  # kaunsa topic
        "Each line is first person, 5 to 25 words, a real habit or confession, funny or honest. "  # line kaisi ho
        "Vary the wording a lot: do not repeat the same keywords or sentence pattern. Mix short and long lines. "  # variety
        "Avoid anything about appearance, health conditions, religion, politics or sexuality. "  # sensitive topics nahi
        'Reply with ONLY a JSON array of strings, e.g. ["line one", "line two"].'  # sirf JSON list
    )  # prompt band
    for _ in range(3):  # free NVIDIA kabhi fail hota hai: 3 try
        try:  # network/JSON fail ho sakta hai
            response = httpx.post(  # chat request
                "https://integrate.api.nvidia.com/v1/chat/completions",  # NVIDIA endpoint
                headers={"Authorization": f"Bearer {config.NVIDIA_API_KEY}"},  # key
                timeout=90,  # lamba jawab hai, 90 second tak ruko
                json={  # body
                    "model": MODEL,  # model
                    "messages": [{"role": "user", "content": prompt}],  # prompt
                    "max_tokens": 2500,  # 30 lines ke liye kaafi
                    "temperature": 1.0,  # variety ke liye creative
                    "chat_template_kwargs": {"enable_thinking": False},  # thinking off = tez
                },  # body band
            )  # post band
            response.raise_for_status()  # 4xx/5xx = exception
            text = response.json()["choices"][0]["message"]["content"] or ""  # AI ka jawab
            match = re.search(r"\[.*\]", text, re.S)  # JSON list dhundho
            lines = json.loads(match.group(0)) if match else []  # list padho
            lines = [str(line).strip() for line in lines if isinstance(line, str)]  # sirf text lines
            if lines:  # kuch mila
                return label, lines  # wapas
        except (httpx.HTTPError, ValueError, KeyError, IndexError):  # fail → dobara
            time.sleep(2)  # thoda ruko
    print(f"  gave up: {label} / {persona[:40]}")  # 3 baar fail
    return label, []  # khaali


def _words(text):  # sentence → words ka set (milte-julte check ke liye)
    return set(re.findall(r"[a-z0-9']+", text.lower()))  # chhote letters me words


def _similar(a, b):  # do word-sets kitne milte hain (0-1)
    return len(a & b) / max(1, len(a | b))  # common / total


def clean(rows, test_rows):  # duplicate + test se milti lines hatao
    test_sets = [_words(row["text"]) for row in test_rows]  # test ke word-sets
    kept, seen = [], []  # rakhi hui lines, unke word-sets
    for row in rows:  # har generated line
        words = _words(row["text"])  # iske words
        if not 4 <= len(row["text"].split()) <= 40:  # bahut chhoti / lambi
            continue  # chhodo
        if any(_similar(words, test) >= 0.5 for test in test_sets):  # test line jaisi (leak ho jaata)
            continue  # chhodo
        if any(_similar(words, other) >= 0.7 for other in seen):  # pehle wali jaisi (duplicate)
            continue  # chhodo
        seen.append(words)  # yaad rakho
        kept.append(row)  # rakho
    return kept  # saaf lines


def main():  # script ka main kaam
    jobs = [(label, persona) for label in DESCRIBE for persona in PERSONAS]  # 5 topics × 8 personas = 40 requests
    rows = []  # saari lines
    with cf.ThreadPoolExecutor(4) as pool:  # 4 requests ek saath
        for label, lines in pool.map(lambda job: ask(*job), jobs):  # har jawab
            rows += [{"label": label, "text": line} for line in lines]  # jodo
            print(f"{label:16} +{len(lines)}")  # progress
    test_rows = json.loads(TEST_PATH.read_text(encoding="utf-8"))["roast_categories"]  # test set
    kept = clean(rows, test_rows)  # saaf karo
    output = {  # file ka data
        "_about": "Training data for the roast-topic classifier, written by NVIDIA Nemotron with training/generate_examples.py. "  # kya hai
        "AI-written, NOT collected from real users. Near-duplicates and lines too similar to the test set (dataset.json) were removed.",  # aur
        "examples": kept,  # saaf lines
    }  # dict band
    OUTPUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")  # save
    print(f"{len(rows)} generated, {len(kept)} kept → {OUTPUT_PATH.relative_to(BACKEND_DIR)}")  # result


if __name__ == "__main__":  # seedha chalaya ho
    main()  # shuru
