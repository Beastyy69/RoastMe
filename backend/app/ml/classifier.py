"""Trained scikit-learn models ko load karke prediction karta hai.

Ye sirf text ka topic batata hai (gaming, student life...). Ye joke nahi likhta
aur kisi ki personality judge nahi karta.
"""

import logging  # log messages ke liye
from pathlib import Path  # file paths ke liye

import joblib  # saved model file load karne ke liye

logger = logging.getLogger(__name__)  # is file ka logger

# .joblib files yahan save hoti hain (train_model.py banata hai)
MODELS_DIR = Path(__file__).resolve().parent / "models"  # app/ml/models folder


# Ek model ka wrapper: load(), info(), predict()
class TextClassifier:  # ek model sambhalne wali class
    def __init__(self, model_name, fallback_label, min_confidence):  # object banate waqt settings
        self.model_name = model_name  # file ka naam (bina .joblib)
        self.fallback_label = fallback_label  # kam bharosa ho to ye label
        self.min_confidence = min_confidence  # minimum probability (0.40)
        self.bundle = None  # abhi model load nahi hua

    def load(self):  # file se model memory me lao
        # File nahi mili ya kharab hai to app crash nahi hogi, bas fallback category milegi
        path = MODELS_DIR / f"{self.model_name}.joblib"  # poora file path
        try:  # load fail ho sakta hai
            self.bundle = joblib.load(path)  # model + info load
            logger.info("Loaded ML model %s", path.name)  # terminal me batao
        except FileNotFoundError:  # file hi nahi mili
            logger.warning("Model %s not found. Run: python training/train_model.py", path.name)  # train karne ki salah
        except Exception:  # file kharab hai ya sklearn ka version alag hai
            logger.exception("Could not load model %s", path.name)  # error details print

    @property  # function ko variable jaisa use karo
    def available(self):  # model load hua ya nahi
        return self.bundle is not None  # bundle hai to True

    # /health endpoint ke liye model ki details (accuracy, kitne examples)
    def info(self):  # model ki details
        if not self.available:  # model nahi hai?
            return {"name": self.model_name, "loaded": False}  # sirf naam + not loaded
        return {  # details ka dict
            "name": self.model_name,  # model ka naam
            "loaded": True,  # load ho gaya
            "labels": self.bundle["labels"],  # saari categories
            "cv_accuracy": self.bundle["cv_accuracy"],  # test accuracy
            "training_examples": self.bundle["training_examples"],  # kitne examples se seekha
            "trained_at": self.bundle["trained_at"],  # kab train hua
        }  # band

    def predict(self, text):  # text ka topic batao
        """Text ka topic + har topic ki probability return karta hai.

        Agar sabse badi probability `min_confidence` (40%) se kam hai, to model pe
        bharosa nahi karte: `fallback_label` dete hain aur `confident` False.
        """
        if not self.available:  # model nahi hai?
            return {  # details ka dict
                "label": self.fallback_label,  # model nahi to fallback
                "confidence": None,  # koi confidence nahi
                "confident": False,  # bharosa nahi
                "model_label": None,  # model ka label nahi
                "probabilities": {},  # khaali
                "model_available": False,  # model missing
            }  # band

        pipeline = self.bundle["pipeline"]  # trained sklearn pipeline
        # har category ka % chance, jaise gaming 0.74, general 0.05...
        probabilities = pipeline.predict_proba([text])[0]
        # sabse zyada probability wala pehle
        ranked = sorted(zip(pipeline.classes_, probabilities), key=lambda pair: pair[1], reverse=True)
        top_label, top_probability = ranked[0]  # sabse upar wala label aur uska %
        confident = top_probability >= self.min_confidence  # 40% ya zyada = bharosa

        return {  # details ka dict
            "label": top_label if confident else self.fallback_label,  # final label
            "confidence": round(float(top_probability), 3),  # probability (3 decimal)
            "confident": bool(confident),  # bharosa hai ya nahi
            "model_label": top_label,  # model ka asli jawab
            "probabilities": {label: round(float(p), 3) for label, p in ranked},  # har category ka %
            "model_available": True,  # model chal raha hai
        }  # band


# Ek model: roast ka topic
roast_classifier = TextClassifier("roast_category", fallback_label="general", min_confidence=0.40)  # topic model


# main.py ise server start pe call karta hai
def load_all_models():  # saare models load
    roast_classifier.load()  # topic model load
