"""AI se comedy text likhwana (optional).

Do providers support hain: NVIDIA NIM (Nemotron) aur Google Gemini.
.env me AI_PROVIDER=nvidia,gemini likho to pehle NVIDIA try hota hai, fail ho to Gemini.
Dono fail ho jaayein (key nahi, limit khatam, internet nahi) to None milta hai aur
baaki code local templates use kar leta hai. Matlab app kabhi tootegi nahi.

Photo (image) bhi bheji ja sakti hai: NVIDIA (Nemotron VL) aur Gemini dono photo dekh sakte hain.
"""

import base64  # photo bytes → base64 text
import logging  # warnings terminal me print karne ke liye
import time  # NVIDIA ka total time budget ginne ke liye

import httpx  # NVIDIA ko HTTP request bhejne ke liye

from app import config  # .env ki settings (providers, keys, models)

logger = logging.getLogger(__name__)  # is file ka logger

_clients = {}  # client ek hi baar banta hai, phir reuse hota hai

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"  # NVIDIA NIM API ka address

# Har AI ko ye rules milte hain: sirf habits pe joke, kisi ki pehchaan/looks pe nahi
SAFETY_RULES = (  # kai strings jud ke ek lamba rule ban jaata hai
    "Keep it playful and good-natured, like a comedy roast between friends. "  # dosto wala mazaak
    "Only joke about the habits, routines and choices the user described. "  # sirf aadaton pe
    "Never mention or joke about appearance, body, health conditions, race, ethnicity, "  # looks/body pe kabhi nahi
    "religion, gender, sexuality, disability, nationality or money troubles. "  # pehchaan pe kabhi nahi
    "No slurs, no profanity stronger than mild. Never mention self-harm, suicide or death, even as a figure of speech. "  # gaali / harm nahi
    "Reply with plain text only: no markdown, no lists, no emojis, no preamble."  # sirf saaf text
)  # SAFETY_RULES band

KEYS = {  # provider → uski key
    "nvidia": lambda: config.NVIDIA_API_KEY,  # NVIDIA key
    "gemini": lambda: config.GEMINI_API_KEY,  # Gemini key
}  # dict band


def enabled_providers():  # jin providers ki key .env me hai, wahi (order same)
    return [p for p in config.AI_PROVIDERS if p in KEYS and KEYS[p]()]  # key wale hi


def is_enabled():  # koi bhi AI chalu hai?
    """True jab kam se kam ek provider chuna gaya ho AUR uski key .env me ho."""
    return bool(enabled_providers())  # list khaali nahi


def provider_name():  # /health pe kya dikhe
    """/health pe dikhane ke liye, jaise 'nvidia → gemini'."""
    names = enabled_providers()  # chalu providers
    return " → ".join(names) if names else "local-templates"  # order ke saath


def generate(task_instructions, user_content, max_tokens=600, image=None, rules=SAFETY_RULES, timeout=10):  # main function
    """Providers ko order me try karo. (text, provider_ka_naam) ya (None, None) return karta hai.

    image = {"mime": "image/jpeg", "data": bytes} (optional).
    rules = safety rules (camera photo aur quiz ke apne rules hote hain).
    timeout = NVIDIA ki ek request ka max wait (lamba jawab, jaise quiz, ko zyada chahiye).
    """
    system_prompt = f"You are the comedy writer for RoastMe AI. {task_instructions} {rules}"  # role + kaam + rules
    for provider in enabled_providers():  # ek-ek karke try
        if provider == "nvidia":  # NVIDIA NIM
            text = _nvidia(system_prompt, user_content, max_tokens, image, timeout)  # NVIDIA se maango
        else:  # Google Gemini
            text = _gemini(system_prompt, user_content, max_tokens, image)  # Gemini se maango
        if text:  # jawab mil gaya
            return text, provider  # text + kisne likha
    return None, None  # kisi ne nahi likha → templates


# ---------------- NVIDIA NIM ----------------

def _nvidia(system_prompt, user_content, max_tokens, image, timeout):  # NVIDIA API call
    if "nvidia" not in _clients:  # client pehli baar?
        _clients["nvidia"] = httpx.Client(  # naya HTTP client
            base_url=NVIDIA_BASE_URL,  # https://integrate.api.nvidia.com/v1
            headers={"Authorization": f"Bearer {config.NVIDIA_API_KEY}"},  # key header me
        )  # client band
    client = _clients["nvidia"]  # client

    content = user_content  # sirf text
    if image:  # photo bhi hai?
        data_url = f"data:{image['mime']};base64,{base64.b64encode(image['data']).decode()}"  # photo ko URL me lapeto
        content = [  # photo + text dono
            {"type": "image_url", "image_url": {"url": data_url, "detail": "high"}},  # photo (achhi quality me dekho)
            {"type": "text", "text": user_content},  # text
        ]  # list band

    models = config.NVIDIA_VISION_MODELS if image else config.NVIDIA_MODELS  # photo hai to vision models
    # Free NVIDIA kabhi-kabhi atak jaata hai ya 500 deta hai: har model 2 try, phir backup model.
    # Par sab milake bas (timeout + 10) second, taaki user zyada der wait na kare.
    deadline = time.monotonic() + timeout + 10  # total budget (roast 20s, quiz 35s)
    for model in models:  # pehla model, fail ho to backup model
        for attempt in (1, 2):  # do try
            remaining = deadline - time.monotonic()  # kitna time bacha
            if remaining < 2:  # time khatam
                logger.warning("NVIDIA out of time, giving up")  # warning
                return None  # agla provider / templates
            response = _post_nvidia(client, model, system_prompt, content, max_tokens, min(timeout, remaining))  # ek try
            if response == "retry" and attempt == 1:  # timeout/5xx, ek try bacha hai
                logger.info("NVIDIA %s slow or busy, retrying", model)  # info
                continue  # dobara try
            break  # jawab mila ya pakka fail
        if isinstance(response, httpx.Response):  # jawab mil gaya
            choices = response.json().get("choices", [])  # jawab ki list
            text = (choices[0]["message"].get("content") or "").strip() if choices else ""  # pehla jawab
            if text:  # khaali nahi
                return text  # wapas
        logger.warning("NVIDIA model %s failed, trying backup", model)  # agla model
    return None  # saare NVIDIA models fail → agla provider


def _post_nvidia(client, model, system_prompt, content, max_tokens, timeout):  # ek HTTP request
    """httpx.Response, ya "retry" (timeout/5xx, dobara try ho sakta hai), ya None (pakka fail)."""
    try:  # network/limit fail ho sakte hain
        response = client.post(  # chat request
            "/chat/completions",  # NVIDIA ka chat endpoint (OpenAI jaisa)
            json={  # request body
                "model": model,  # model
                "messages": [  # baat-cheet
                    {"role": "system", "content": system_prompt},  # rules
                    {"role": "user", "content": content},  # user ki details (+ photo)
                ],  # messages band
                "max_tokens": max_tokens,  # jawab ki max lambai
                "temperature": 1.0,  # creative comedy
                # Nemotron pehle "sochta" hai (10-20 second). Roast ke liye sochna band → 1-2 second
                "chat_template_kwargs": {"enable_thinking": False},  # thinking off
            },  # body band
            timeout=min(config.AI_TIMEOUT_SECONDS, timeout),  # max wait (roast 10s, quiz 25s)
        )  # post band
        response.raise_for_status()  # 4xx/5xx ho to exception
    except httpx.HTTPStatusError as error:  # NVIDIA ne mana kiya
        if error.response.status_code >= 500:  # server ki galti, dobara try se theek ho sakta hai
            return "retry"  # dobara try karo
        reason = error.response.text[:160]  # NVIDIA ka message (key isme nahi hoti)
        logger.warning("NVIDIA error %s (%s)", error.response.status_code, reason)  # warning (galat key/model)
        return None  # pakka fail
    except httpx.TimeoutException:  # jawab time pe nahi aaya
        return "retry"  # dobara try karo
    except httpx.HTTPError:  # internet nahi / connection toota
        logger.warning("NVIDIA unreachable")  # warning
        return None  # pakka fail
    return response  # sab theek


# ---------------- Google Gemini ----------------

def _gemini(system_prompt, user_content, max_tokens, image=None):  # Gemini API call
    from google import genai  # Google ka official SDK (sirf zaroorat pe import)
    from google.genai import errors, types  # errors = exception classes, types = config objects

    if "gemini" not in _clients:  # client pehli baar ban raha hai?
        _clients["gemini"] = genai.Client(  # naya Gemini client
            api_key=config.GEMINI_API_KEY,  # .env wali key
            http_options=types.HttpOptions(timeout=int(config.AI_TIMEOUT_SECONDS * 1000)),  # milliseconds
        )  # Client band

    contents = user_content  # sirf text
    if image:  # photo bhi hai?
        contents = [types.Part.from_bytes(data=image["data"], mime_type=image["mime"]), user_content]  # photo + text

    try:  # network call fail ho sakti hai
        response = _clients["gemini"].models.generate_content(  # Gemini se text maango
            model=config.GEMINI_MODEL,  # kaunsa model (jaise gemini-3.5-flash-lite)
            contents=contents,  # user ki details (+ photo)
            config=types.GenerateContentConfig(  # extra settings
                system_instruction=system_prompt,  # role + rules
                # thinking tokens bhi isi limit me gine jaate hain, isliye thoda extra room
                max_output_tokens=max_tokens + 1024,  # jawab ki max lambai
                temperature=1.0,  # thoda creative, comedy ke liye accha
            ),  # config band
        )  # generate_content band
    except errors.ClientError as error:  # 4xx: galat key, limit khatam, galat model
        logger.warning("Gemini request rejected (%s)", error.code)  # warning
        return None  # templates
    except errors.ServerError as error:  # 5xx: Google ki taraf problem
        logger.warning("Gemini server error (%s)", error.code)  # warning
        return None  # templates
    except Exception:  # timeout / internet nahi
        logger.warning("Gemini unreachable")  # warning
        return None  # templates

    # Safety block ya khaali jawab pe .text None hota hai
    text = (response.text or "").strip()  # text nikalo, aage-peeche ke spaces hatao
    return text or None  # khaali hai to None
