"""History endpoints. Har browser/phone ka apna anonymous client_id hota hai,
us id ki history hi dikhti/delete hoti hai. Koi login nahi.
"""

from fastapi import APIRouter, HTTPException, Query  # Query = URL ke ?param= values

from app.schemas.api import CLIENT_ID_PATTERN  # id ka pattern
from app.services import history_store  # history storage

router = APIRouter(prefix="/api/history")  # saare URLs /api/history se shuru

# client_id query param me aata hai aur pattern se validate hota hai
ClientId = Query(pattern=CLIENT_ID_PATTERN)  # ?client_id=... zaroori aur valid hona chahiye


# GET /api/history?client_id=... → recent results
@router.get("")  # URL: GET /api/history
def list_history(client_id: str = ClientId, limit: int = Query(default=20, ge=1, le=50)):  # limit 1-50
    items = history_store.history.list(client_id, limit)  # is user ki entries
    return {"ok": True, "data": {"items": items, "storage": history_store.history.backend}}  # entries + storage type


# DELETE /api/history/<id> → ek entry hatao
@router.delete("/{item_id}")  # URL me entry ki id
def delete_item(item_id: str, client_id: str = ClientId):  # kaunsi entry, kiski
    if not history_store.history.delete(client_id, item_id):  # delete nahi hui?
        raise HTTPException(status_code=404, detail="That history entry no longer exists.")  # 404 error
    return {"ok": True, "data": {"deleted": item_id}}  # success


# DELETE /api/history → saari history saaf
@router.delete("")  # URL: DELETE /api/history
def clear_history(client_id: str = ClientId):  # kiski history
    count = history_store.history.clear(client_id)  # sab hatao, ginti lo
    return {"ok": True, "data": {"deleted_count": count}}  # kitni hatai
