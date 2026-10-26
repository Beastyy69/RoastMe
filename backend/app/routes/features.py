"""Saare feature endpoints: Roast, Camera Roast, NPC Meter, ML predict.

Route ka kaam chhota hai: request lo → service ko do → result history me save → JSON bhejo.
"""

from fastapi import APIRouter, HTTPException  # APIRouter = routes ka group, HTTPException = error bhejna

from app.ml.classifier import roast_classifier  # topic wala ML model
from app.schemas.api import CameraRoastRequest, NpcRequest, PredictRequest, RoastRequest  # request shapes
from app.services import npc_service  # NPC quiz ka logic
from app.services.camera_roast_service import create_camera_roast  # camera roast banane wala function
from app.services.history_store import save_if_requested  # history me save karne wala helper
from app.services.roast_service import create_roast  # text roast banane wala function

# Har route ke aage "/api" lagta hai
router = APIRouter(prefix="/api")  # isme jo bhi route banega uska URL /api/... hoga


# Success response ka standard format: {"ok": true, "data": ...}
def _ok(data):  # chhota helper taaki har jagah same format ho
    return {"ok": True, "data": data}  # ok + asli data


# POST /api/roast → text roast (bio + habits se)
@router.post("/roast")  # URL: POST /api/roast
def roast(request: RoastRequest):  # FastAPI body ko RoastRequest me check karke deta hai
    result = create_roast(request)  # ML + AI/templates se roast banao
    # client_id aaya hai to result history me save karo
    saved = save_if_requested(  # history me save karne ki koshish
        request.client_id, "roast", f"{result['category'].replace('_', ' ').title()} roast",  # kiska, kya type, title
        result["roast"], result["heat_rating"],  # text aur score
    )  # save_if_requested khatam
    result["history_id"] = saved["id"] if saved else None  # save hua to uski id, warna None
    return _ok(result)  # JSON response bhejo


# POST /api/camera-roast → sirf face signals aate hain, photo nahi
@router.post("/camera-roast")  # URL: POST /api/camera-roast
def camera_roast(request: CameraRoastRequest):  # body me expression, distance, filter...
    result = create_camera_roast(request)  # signals se roast banao
    # history me save (title, roast text, score)
    saved = save_if_requested(request.client_id, "camera", result["title"], result["roast"], result["roast_score"])
    result["history_id"] = saved["id"] if saved else None  # history id jodo
    return _ok(result)  # JSON bhejo


# GET /api/npc/questions → naya quiz (AI ke likhe random sawal, points ke bina)
@router.get("/npc/questions")  # URL: GET /api/npc/questions
def npc_questions():  # koi body nahi chahiye
    return _ok(npc_service.new_quiz())  # quiz_id + sawal bhejo


# POST /api/npc → answers ka NPC score + jawabon pe roast
@router.post("/npc")  # URL: POST /api/npc
def npc(request: NpcRequest):  # body me quiz_id + answers list
    try:  # scoring me galti ho sakti hai
        result = npc_service.score_quiz(request)  # points jod ke score + roast
    except npc_service.QuizExpired as error:  # quiz purana / server restart
        raise HTTPException(status_code=410, detail=str(error))  # 410 = ab nahi hai
    except ValueError as error:  # answers kam the ya galat number tha
        raise HTTPException(status_code=422, detail=str(error))  # 422 error bhejo
    saved = save_if_requested(  # history me save
        request.client_id, "npc", result["title"], result["roast"], result["npc_score"]  # details
    )  # save khatam
    result["history_id"] = saved["id"] if saved else None  # history id jodo
    return _ok(result)  # JSON bhejo


# POST /api/predict-category → seedha ML model ka result (testing ke liye)
@router.post("/predict-category")  # URL: POST /api/predict-category
def predict_category(request: PredictRequest):  # body me sirf "text"
    return _ok(  # response banao
        {  # model ka result
            "roast_category": roast_classifier.predict(request.text),  # topic model ka jawab
        }  # dict band
    )  # _ok band
