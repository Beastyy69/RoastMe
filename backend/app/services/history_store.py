"""Roast history kahan save ho.

MONGODB_URI set hai to MongoDB, warna har client_id ki chhoti list server memory me
(server restart = history gayab). Sirf RESULT save hota hai, user ka likha bio nahi.
"""

import logging  # warnings/info print karne ke liye
import uuid  # har entry ki unique id banane ke liye
from collections import defaultdict, deque  # memory storage ke liye
from datetime import datetime, timezone  # entry kab bani

from app import config  # MONGODB_URI waghaira

logger = logging.getLogger(__name__)  # is file ka logger

# Ek user ki max 50 entries; purani apne aap hat jaati hain
MAX_ITEMS_PER_CLIENT = 50  # limit


def _now():  # abhi ka time text me
    return datetime.now(timezone.utc).isoformat(timespec="seconds")  # jaise "2026-10-23T10:00:00+00:00"


# Option 1: memory me (koi database setup nahi chahiye)
class MemoryHistory:  # RAM me history
    backend = "memory"  # /health pe ye naam dikhta hai

    def __init__(self):  # object bante waqt
        # deque(maxlen) = list jo full hone pe sabse purana item khud hata deti hai
        self._items = defaultdict(lambda: deque(maxlen=MAX_ITEMS_PER_CLIENT))  # { client_id: [entries] }

    def add(self, client_id, entry):  # nayi entry jodo
        item = {"id": uuid.uuid4().hex, "created_at": _now(), **entry}  # id + time + data
        self._items[client_id].appendleft(item)  # sabse aage (newest pehle)
        return item  # bani hui entry wapas

    def list(self, client_id, limit=20):  # recent entries
        return list(self._items[client_id])[:limit]  # pehli `limit` entries

    def delete(self, client_id, item_id):  # ek entry hatao
        items = self._items[client_id]  # is user ki list
        for item in items:  # har entry check karo
            if item["id"] == item_id:  # id match hui?
                items.remove(item)  # hata do
                return True  # mil gayi aur hata di
        return False  # nahi mili

    def clear(self, client_id):  # saari history saaf
        count = len(self._items[client_id])  # kitni thi
        self._items.pop(client_id, None)  # poori list hata do
        return count  # kitni hatai


# Option 2: MongoDB (permanent storage)
class MongoHistory:  # database me history
    backend = "mongodb"  # /health pe ye naam dikhta hai

    def __init__(self, uri, database):  # connection banao
        from pymongo import DESCENDING, MongoClient  # MongoDB library (sirf zaroorat pe import)

        client = MongoClient(uri, serverSelectionTimeoutMS=5000)  # 5 sec me connect na ho to error
        client.admin.command("ping")  # URI galat hai to turant pata chal jaaye
        self._collection = client[database]["history"]  # "history" naam ki collection (table jaisi)
        self._collection.create_index([("client_id", 1), ("created_at", DESCENDING)])  # fast search ke liye index
        self._descending = DESCENDING  # baad me sort ke liye yaad rakho

    def add(self, client_id, entry):  # nayi entry jodo
        item = {"id": uuid.uuid4().hex, "created_at": _now(), **entry}  # id + time + data
        self._collection.insert_one({**item, "client_id": client_id})  # database me daalo
        return item  # entry wapas (client_id ke bina)

    def list(self, client_id, limit=20):  # recent entries
        cursor = (  # query banao
            self._collection.find({"client_id": client_id}, {"_id": 0, "client_id": 0})  # is user ki, extra fields hata ke
            .sort("created_at", self._descending)  # newest pehle
            .limit(limit)  # sirf `limit` entries
        )  # query band
        return list(cursor)  # list me badal ke wapas

    def delete(self, client_id, item_id):  # ek entry hatao
        result = self._collection.delete_one({"client_id": client_id, "id": item_id})  # match wali delete
        return result.deleted_count == 1  # delete hui to True

    def clear(self, client_id):  # saari history saaf
        return self._collection.delete_many({"client_id": client_id}).deleted_count  # kitni hatai


# Mongo try karo, fail ho to memory pe aa jao
def create_history_store():  # sahi storage chuno
    if config.MONGODB_URI:  # .env me Mongo URI di hai?
        try:  # connect ki koshish
            store = MongoHistory(config.MONGODB_URI, config.MONGODB_DB)  # Mongo se connect
            logger.info("History: using MongoDB")  # terminal me batao
            return store  # Mongo use karo
        except Exception:  # connect nahi hua
            logger.exception("MongoDB unavailable, falling back to in-memory history")  # warning
    return MemoryHistory()  # memory wali storage


history = MemoryHistory()  # default (server start se pehle bhi kuch to ho)


def init_history():  # main.py start pe call karta hai
    """Server start pe ek baar call hota hai. Routes `history_store.history` use karte hain."""
    global history  # upar wala global variable badlenge
    history = create_history_store()  # Mongo ya memory set karo


def save_if_requested(client_id, kind, title, text, score):  # routes yahi call karte hain
    if not client_id:  # client_id nahi aaya?
        return None  # to save mat karo
    try:  # save fail ho sakta hai
        return history.add(client_id, {"kind": kind, "title": title, "text": text, "score": score})  # save + entry wapas
    except Exception:  # database problem
        # History zaroori nahi; save fail ho to bhi roast user ko milna chahiye
        logger.exception("Could not save history entry")  # warning
        return None  # bina history ke aage badho
