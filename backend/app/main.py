"""RoastMe AI ka main server file (FastAPI).

Yahan app banti hai, CORS + rate limit lagta hai, errors ek jaise format me aate hain,
aur saare routes jude hote hain. Chalane ke liye: uvicorn app.main:app --reload
"""

import logging  # terminal me messages (logs) print karne ke liye
import time  # time.monotonic() se seconds ginne ke liye (rate limit)
from collections import defaultdict, deque  # defaultdict = auto khaali value, deque = fast queue
from contextlib import asynccontextmanager  # server start/stop pe code chalane ke liye

from fastapi import FastAPI, Request  # FastAPI = web server framework, Request = aane wali request
from fastapi.exceptions import RequestValidationError  # jab request ka data galat ho
from fastapi.middleware.cors import CORSMiddleware  # browser ko cross-site calls ki permission
from fastapi.responses import JSONResponse  # apna khud ka JSON response banane ke liye
from starlette.exceptions import HTTPException  # 404, 422 jaise HTTP errors

from app import config  # .env wali settings
from app.ml.classifier import load_all_models, roast_classifier  # ML model
from app.routes import features, history  # API routes ki files
from app.services import ai_provider, history_store  # AI writer aur history storage

# Terminal me logs ka format: LEVEL module: message
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


# Server start hote hi ek baar chalta hai: ML models load + history store ready
@asynccontextmanager  # is function ko "lifespan" (start/stop hook) banata hai
async def lifespan(app):  # FastAPI ye function start pe chalayega
    load_all_models()  # .joblib ML model memory me load karo
    history_store.init_history()  # MongoDB ya memory history taiyar karo
    yield  # yahan tak start ka kaam; iske baad server requests leta hai


# Asli FastAPI app object (title/version /docs page pe dikhte hain)
app = FastAPI(title="RoastMe AI API", version="1.0.0", lifespan=lifespan)

# --- Simple rate limit: har IP ki last 60 second ki AI wali requests gin ke rakhte hain ---
_recent_requests = defaultdict(deque)  # { ip: [time1, time2, ...] }


@app.middleware("http")  # har request isi function se hoke guzarti hai
async def rate_limit(request: Request, call_next):  # call_next = asli route chalao
    # /api ki POST requests + naya quiz banana (wo bhi AI call karta hai)
    if (request.method == "POST" and request.url.path.startswith("/api/")) or request.url.path == "/api/npc/questions":  # AI wali requests gino
        client_ip = request.client.host if request.client else "unknown"  # user ka IP address
        now = time.monotonic()  # abhi ka time (seconds me)
        window = _recent_requests[client_ip]  # is IP ki purani request times
        # 60 second se purani entries hata do
        while window and now - window[0] > 60:  # sabse purani entry 60 sec se zyada purani hai?
            window.popleft()  # to use queue se nikaal do
        # limit cross hui to 429 (Too Many Requests)
        if len(window) >= config.RATE_LIMIT_PER_MINUTE:  # minute me limit se zyada?
            return _error(429, "Easy there! Too many roasts in a minute. Try again shortly.")  # rok do
        window.append(now)  # is request ka time yaad rakho
    return await call_next(request)  # sab theek, request aage route tak jaane do


# CORS rate limiter ke BAAD add kiya, taaki 429 error bhi browser padh sake
app.add_middleware(  # app me CORS layer jodo
    CORSMiddleware,  # FastAPI ka ready-made CORS middleware
    allow_origins=config.CORS_ORIGINS,  # sirf ye websites call kar sakti hain
    allow_methods=["GET", "POST", "DELETE"],  # ye HTTP methods allowed
    allow_headers=["Content-Type"],  # JSON bhejne ke liye ye header chahiye
)  # add_middleware khatam


# --- Har error ka same format: {"ok": false, "error": {"message": ..., "fields": [...]}} ---
def _error(status_code, message, fields=None):  # error response banane wala helper
    body = {"ok": False, "error": {"message": message}}  # basic error body
    if fields:  # agar kisi field ki galti hai
        body["error"]["fields"] = fields  # to field-wise details bhi jodo
    return JSONResponse(status_code=status_code, content=body)  # JSON + status code bhejo


# Error message me field ka naam user-friendly dikhane ke liye
FRIENDLY_FIELD_NAMES = {"bio": "Bio / routine", "habits": "Habits", "nickname": "Nickname", "quiz_id": "Quiz"}


# Pydantic validation fail (jaise bio bahut chhota) → 422 + saaf message
@app.exception_handler(RequestValidationError)  # validation error aaye to ye chalao
async def validation_error(request, exc):  # exc = error ki details
    fields = []  # har galat field ki list
    for issue in exc.errors():  # Pydantic ki har galti pe loop
        field = str(issue["loc"][-1]) if issue["loc"] else "request"  # kis field me galti (jaise "bio")
        label = FRIENDLY_FIELD_NAMES.get(field, field)  # "bio" → "Bio / routine"
        fields.append({"field": field, "message": f"{label}: {issue['msg']}"})  # readable message jodo
    message = fields[0]["message"] if fields else "Invalid request."  # pehli galti main message
    return _error(422, message, fields)  # 422 = data galat hai


# 404, 422 jaise HTTP errors ko bhi same format me bhejo
@app.exception_handler(HTTPException)  # HTTP error aaye to ye chalao
async def http_error(request, exc):  # exc.detail me message hota hai
    return _error(exc.status_code, str(exc.detail))  # same format me bhejo


# Koi unexpected crash → 500, par user ko andar ki details nahi dikhate
@app.exception_handler(Exception)  # koi bhi bacha hua error
async def unexpected_error(request, exc):  # crash pakdo
    logging.getLogger("app").exception("Unhandled error")  # poori details terminal me (developer ke liye)
    return _error(500, "Something went wrong on our side. Please try again.")  # user ko simple message


# GET / → API zinda hai ya nahi
@app.get("/")  # root URL
def status():  # simple status check
    # naam, version aur docs ka link bhejo
    return {"ok": True, "data": {"name": "RoastMe AI API", "version": app.version, "docs": "/docs"}}


# GET /health → models load hue? AI kaunsa? history kahan save ho rahi?
@app.get("/health")  # health check URL
def health():  # server ki haalat batao
    return {  # response dict shuru
        "ok": True,  # sab theek
        "data": {  # asli details
            "status": "healthy",  # server chal raha hai
            "models": [roast_classifier.info()],  # ML model ki info
            "comedy_generator": ai_provider.provider_name(),  # jaise nvidia → gemini, ya local-templates
            "history_storage": history_store.history.backend,  # "memory" ya "mongodb"
        },  # data band
    }  # response band


# Routes jodna: /api/roast, /api/npc, /api/camera-roast, /api/history
app.include_router(features.router)  # roast, npc, camera wale routes
app.include_router(history.router)  # history wale routes
