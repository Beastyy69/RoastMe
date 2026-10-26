"""RoastMe AI ka chhota text classifier (roast topic) train karta hai.

backend folder se chalao:
    python training/train_model.py

Ye file banti hai (server start pe load hoti hai):
    app/ml/models/roast_category.joblib
"""

import json  # dataset.json padhne ke liye
from datetime import datetime, timezone  # model kab train hua, wo time
from pathlib import Path  # file paths aasaani se banane ke liye

import joblib  # trained model ko file me save karne ke liye
import sklearn  # scikit-learn (version save karne ke liye)
from sklearn.feature_extraction.text import TfidfVectorizer  # text → numbers
from sklearn.linear_model import LogisticRegression  # classification model
from sklearn.model_selection import StratifiedKFold, cross_val_score  # accuracy test karne ke tools
from sklearn.pipeline import FeatureUnion, Pipeline  # steps ko jodne ke liye

BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/ folder ka path
DATASET_PATH = BACKEND_DIR / "training" / "dataset.json"  # training data ki file
MODELS_DIR = BACKEND_DIR / "app" / "ml" / "models"  # models yahan save honge


def build_pipeline():  # naya (untrained) model banao
    # Word n-grams topic ke words pakadte hain; character n-grams typos, plural
    # aur slang ("gamer", "gaming", "gamin") samajhne me help karte hain.
    features = FeatureUnion(  # do tarah ke features ko jodo
        [  # list shuru
            ("words", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, strip_accents="unicode")),  # 1-2 word ke pieces
            ("chars", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),  # 3-5 letter ke pieces
        ]  # list band
    )  # FeatureUnion band
    # TF-IDF features → Logistic Regression (har category ki probability)
    return Pipeline([("features", features), ("classifier", LogisticRegression(max_iter=3000, C=4.0))])


def train_and_save(examples, model_name):  # examples = [{"text":..., "label":...}, ...]
    texts = [example["text"] for example in examples]  # sirf sentences ki list
    labels = [example["label"] for example in examples]  # sirf categories ki list

    # Imaandaar test: 5-fold cross-validation (model ko unseen data pe check karo)
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)  # data ko 5 hisso me baanto
    scores = cross_val_score(build_pipeline(), texts, labels, cv=folds, scoring="accuracy")  # 5 baar train+test

    pipeline = build_pipeline()  # final model banao
    # Final model saare data pe train karo
    pipeline.fit(texts, labels)  # model seekh raha hai

    # Model ke saath kuch info bhi save karo (/health pe dikhti hai)
    bundle = {  # sab ek dict me
        "pipeline": pipeline,  # trained model
        "labels": sorted(set(labels)),  # saari categories
        "cv_accuracy": round(float(scores.mean()), 3),  # average accuracy
        "training_examples": len(texts),  # kitne examples the
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),  # kab train hua
        "sklearn_version": sklearn.__version__,  # kis version se (load karte waqt match hona chahiye)
    }  # bundle band
    output_path = MODELS_DIR / f"{model_name}.joblib"  # file ka naam
    joblib.dump(bundle, output_path)  # file me save karo

    print(f"[{model_name}] {len(texts)} examples, {len(bundle['labels'])} labels")  # kitna data
    print(f"[{model_name}] 5-fold CV accuracy: {scores.mean():.3f} (+/- {scores.std():.3f})")  # accuracy
    print(f"[{model_name}] saved to {output_path.relative_to(BACKEND_DIR)}")  # kahan save hua


# Dataset padho aur model train karo
def main():  # script ka main kaam
    MODELS_DIR.mkdir(parents=True, exist_ok=True)  # models folder nahi hai to bana do
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))  # JSON file padho
    train_and_save(dataset["roast_categories"], "roast_category")  # topic model train


if __name__ == "__main__":  # file seedha chalayi gayi ho (import nahi)
    main()  # to training shuru
