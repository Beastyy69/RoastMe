"""Saari settings yahan se aati hain: environment variables ya backend/.env file.

Secrets (API keys) KABHI code me mat likho, sirf .env me rakho.
"""

import os  # environment variables padhne ke liye
from pathlib import Path  # file path banane ke liye

from dotenv import load_dotenv  # .env file padhne wali library

# backend/.env ko seedha path se load karo, server kisi bhi folder se chale
load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # backend/.env load karo


def _list(value):  # comma wali string ko list banao
    """'a, b, c' jaisi string ko ['a', 'b', 'c'] list me badalta hai."""
    return [item.strip() for item in value.split(",") if item.strip()]  # todo, spaces hatao, khaali hatao


# Kaunsi websites browser se API call kar sakti hain (CORS)
CORS_ORIGINS = _list(  # allowed websites ki list
    os.getenv(  # .env se value (na ho to default)
        "CORS_ORIGINS",  # variable ka naam
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081",  # default: local website + Expo web
    )  # band
)  # band

# Comedy kaun likhega. Comma se kai providers: pehla fail ho to agla try hota hai.
# "nvidia" = NVIDIA NIM, "gemini" = Google Gemini, "none" = sirf local templates
AI_PROVIDERS = [p for p in _list(os.getenv("AI_PROVIDER", "none").lower()) if p != "none"]  # jaise ["nvidia", "gemini"]
AI_TIMEOUT_SECONDS = float(os.getenv("AI_TIMEOUT_SECONDS", "25"))  # AI ka max wait (seconds)

# NVIDIA NIM settings (key: https://build.nvidia.com)
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "").strip()  # NVIDIA ki secret key (nvapi-...)
# Comma se kai models: pehla fail ho (free server kabhi 500 deta hai) to agla.
# Nemotron 3.5 Super VL photo bhi samajhta hai, testing me 1-2 second me mazedaar jawab
NVIDIA_MODELS = _list(  # text roast ke models (order me)
    os.getenv("NVIDIA_MODEL", "").strip() or "nvidia/nemotron-3.5-super-vl-120b-a12b,nvidia/nemotron-3.5-lightning-30b-a3b"  # default: Super VL, phir tez Lightning
)  # band
NVIDIA_VISION_MODELS = _list(  # photo roast ke models (sirf photo samajhne wale)
    os.getenv("NVIDIA_VISION_MODEL", "").strip() or "nvidia/nemotron-3.5-super-vl-120b-a12b,nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"  # default: Super VL, phir Nano Omni
)  # band

# Google Gemini settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()  # Gemini ki secret key
# Flash-Lite ~1 second me jawab deta hai; bade "flash" models 40-150 second le rahe the
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite").strip()  # Gemini model ka naam

# Optional MongoDB. Na ho to history server ki memory me rehti hai (restart pe gayab).
MONGODB_URI = os.getenv("MONGODB_URI", "").strip()  # MongoDB ka address (khaali = memory)
MONGODB_DB = os.getenv("MONGODB_DB", "roastme").strip()  # database ka naam

# Ek IP ek minute me kitni POST requests bhej sakta hai (spam se bachne ke liye)
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))  # per minute max POST
