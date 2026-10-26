"""Request ka shape (Pydantic models).

Route chalne se PEHLE Pydantic check kar leta hai: type sahi hai? length limit me hai?
Galat hua to FastAPI khud 422 error bhej deta hai.
"""

from enum import Enum  # fixed choices wali values ke liye
from typing import List, Optional  # List = list type, Optional = ho bhi sakta hai, nahi bhi

from pydantic import BaseModel, Field, field_validator  # data check karne wali library

# Anonymous id: sirf letters, numbers, dash; 8-64 characters
CLIENT_ID_PATTERN = r"^[A-Za-z0-9-]{8,64}$"  # regex pattern


# Enum = sirf yahi values allowed, kuch aur bheja to error
class Intensity(str, Enum):  # roast kitna teekha
    friendly = "friendly"  # halka
    savage = "savage"  # teekha
    extra_spicy = "extra_spicy"  # sabse teekha


class Category(str, Enum):  # roast ka topic
    auto = "auto"  # ML khud chunega
    student_life = "student_life"  # padhai wala
    procrastination = "procrastination"  # kaam taalna
    gaming = "gaming"  # games
    productivity = "productivity"  # productivity apps wala
    general = "general"  # baaki sab


# Base class: har string field ke aage-peeche ke spaces hata deta hai
class _Trimmed(BaseModel):  # baaki models isse inherit karte hain
    @field_validator("*", mode="before")  # har field pe, check se pehle chalo
    @classmethod  # class level function
    def strip_strings(cls, value):  # value = aane wala data
        return value.strip() if isinstance(value, str) else value  # string hai to spaces hatao


# POST /api/roast ki body
class RoastRequest(_Trimmed):  # roast form ka data
    nickname: Optional[str] = Field(default=None, max_length=30)  # naam (optional, max 30)
    bio: str = Field(min_length=10, max_length=600)  # bio zaroori, 10-600 characters
    habits: Optional[str] = Field(default=None, max_length=400)  # habits optional, max 400
    intensity: Intensity = Intensity.extra_spicy  # default extra spicy (sabse teekha)
    category: Category = Category.auto  # default auto (ML)
    client_id: Optional[str] = Field(default=None, pattern=CLIENT_ID_PATTERN)  # history ke liye id


# POST /api/npc ki body: kaunsa quiz + har sawal ka chuna hua option number
class NpcRequest(BaseModel):  # quiz ke answers
    quiz_id: str = Field(pattern=r"^[a-f0-9]{32}$")  # GET /api/npc/questions se mili id
    answers: List[int] = Field(min_length=1, max_length=20)  # jaise [2, 1, 0, 3, ...]
    nickname: Optional[str] = Field(default=None, max_length=30)  # naam optional
    client_id: Optional[str] = Field(default=None, pattern=CLIENT_ID_PATTERN)  # history id


# --- Camera Roast ke signals (browser/phone pe face detection se) ---
class Expression(str, Enum):  # chehre ka expression
    smiling = "smiling"  # muskurana
    neutral = "neutral"  # normal
    surprised = "surprised"  # muh khula / shocked
    eyebrows_raised = "eyebrows_raised"  # bhauhein upar
    eyes_closed = "eyes_closed"  # aankhein band


class Distance(str, Enum):  # camera se doori
    close = "close"  # bahut paas
    normal = "normal"  # theek
    far = "far"  # bahut door


class Lighting(str, Enum):  # roshni
    dark = "dark"  # andhera
    normal = "normal"  # theek
    bright = "bright"  # bahut zyada


class FaceFilter(str, Enum):  # user ka chuna hua filter
    none = "none"  # koi filter nahi
    sunglasses = "sunglasses"  # chashma
    crown = "crown"  # taj
    clown = "clown"  # clown naak
    devil = "devil"  # seeng
    npc = "npc"  # NPC scanner
    flames = "flames"  # aag


PHOTO_PREFIX = "data:image/jpeg;base64,"  # photo isi format me aani chahiye
MAX_PHOTO_CHARS = 2_500_000  # ~1.8 MB photo tak (choti JPEG kaafi hai)


class CameraRoastRequest(BaseModel):  # camera roast ka data
    """Device pe nikle signals + (optional) photo.

    Photo SIRF tab aati hai jab user "Roast my look" on rakhe. Server use kahin save nahi karta,
    bas AI (NVIDIA/Gemini) ko dikha ke roast likhwata hai.
    """

    expression: Expression  # zaroori field
    faces: int = Field(ge=1, le=5)  # kitne chehre (1-5)
    distance: Distance = Distance.normal  # default normal
    lighting: Lighting = Lighting.normal  # default normal
    head_tilted: bool = False  # sir tedha?
    looking_away: bool = False  # camera se nazar hati?
    filter: FaceFilter = FaceFilter.none  # chuna hua filter
    intensity: Intensity = Intensity.savage  # roast kitna teekha
    photo: Optional[str] = Field(default=None, max_length=MAX_PHOTO_CHARS)  # "data:image/jpeg;base64,..." (optional)
    client_id: Optional[str] = Field(default=None, pattern=CLIENT_ID_PATTERN)  # history id

    @field_validator("photo")  # photo field check
    @classmethod  # class level function
    def check_photo(cls, value):  # value = photo ka text
        if value is not None and not value.startswith(PHOTO_PREFIX):  # JPEG data URL nahi hai?
            raise ValueError("Photo must be a JPEG data URL.")  # 422 error
        return value  # sahi hai


# POST /api/predict-category ki body
class PredictRequest(_Trimmed):  # ML test ke liye
    text: str = Field(min_length=3, max_length=1000)  # koi bhi text, 3-1000 characters
