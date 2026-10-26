"""RoastMe AI ka chhota text classifier (roast topic) train karta hai.

backend folder se chalao:
    python training/train_model.py

Data do hisso me hai:
    generated_examples.json = ~1100 NVIDIA ke likhe examples → model INHI se seekhta hai
    dataset.json            = 150 haath se likhe examples → sirf TEST (model ne kabhi nahi dekhe)
Isse jo accuracy aati hai wo imaandaar hai: model ko apne hi data pe nahi parakhte.

Ye file banti hai (server start pe load hoti hai):
    app/ml/models/roast_category.joblib
"""

import json  # JSON files padhne ke liye
from datetime import datetime, timezone  # model kab train hua, wo time
from pathlib import Path  # file paths aasaani se banane ke liye

import joblib  # trained model ko file me save karne ke liye
import sklearn  # scikit-learn (version save karne ke liye)
from sklearn.feature_extraction.text import TfidfVectorizer  # text → numbers
from sklearn.linear_model import LogisticRegression  # classification model
from sklearn.metrics import accuracy_score, classification_report  # test ka result nikalne ke tools
from sklearn.model_selection import StratifiedKFold, cross_val_score  # training data pe CV (sirf info ke liye)
from sklearn.pipeline import FeatureUnion, Pipeline  # steps ko jodne ke liye

BACKEND_DIR = Path(__file__).resolve().parent.parent  # backend/ folder ka path
TEST_PATH = BACKEND_DIR / "training" / "dataset.json"  # 150 haath se likhe (test)
TRAIN_PATH = BACKEND_DIR / "training" / "generated_examples.json"  # NVIDIA ke likhe (training)
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
    # C=16: sirf training data pe CV se chuna (test data dekhe bina)
    return Pipeline([("features", features), ("classifier", LogisticRegression(max_iter=3000, C=16.0))])


def train_and_save(train_examples, test_examples, model_name):  # training + test data
    texts = [example["text"] for example in train_examples]  # training sentences
    labels = [example["label"] for example in train_examples]  # training categories
    test_texts = [example["text"] for example in test_examples]  # test sentences
    test_labels = [example["label"] for example in test_examples]  # test categories

    # Sirf info: training data ke andar 5-fold CV (ye number thoda zyada aata hai, asli test neeche hai)
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)  # data ko 5 hisso me baanto
    cv_scores = cross_val_score(build_pipeline(), texts, labels, cv=folds, scoring="accuracy")  # 5 baar train+test

    pipeline = build_pipeline()  # final model banao
    pipeline.fit(texts, labels)  # model sirf generated data se seekhta hai

    # Asli imaandaar test: 150 haath se likhe examples jo model ne kabhi nahi dekhe
    predictions = pipeline.predict(test_texts)  # model ke jawab
    test_accuracy = accuracy_score(test_labels, predictions)  # kitne sahi (0-1)

    # Model ke saath kuch info bhi save karo (/health pe dikhti hai)
    bundle = {  # sab ek dict me
        "pipeline": pipeline,  # trained model
        "labels": sorted(set(labels)),  # saari categories
        "test_accuracy": round(float(test_accuracy), 3),  # haath se likhe test set pe accuracy
        "test_examples": len(test_texts),  # test me kitne examples
        "training_examples": len(texts),  # kitne examples se seekha
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),  # kab train hua
        "sklearn_version": sklearn.__version__,  # kis version se (load karte waqt match hona chahiye)
    }  # bundle band
    output_path = MODELS_DIR / f"{model_name}.joblib"  # file ka naam
    joblib.dump(bundle, output_path)  # file me save karo

    print(f"[{model_name}] trained on {len(texts)} generated examples, {len(bundle['labels'])} labels")  # kitna data
    print(f"[{model_name}] CV on training data (info only): {cv_scores.mean():.3f}")  # training ke andar ka score
    print(f"[{model_name}] TEST accuracy on {len(test_texts)} hand-written examples: {test_accuracy:.3f}")  # asli number
    print(classification_report(test_labels, predictions, digits=2))  # har category ka result
    print(f"[{model_name}] saved to {output_path.relative_to(BACKEND_DIR)}")  # kahan save hua


# Data padho aur model train karo
def main():  # script ka main kaam
    MODELS_DIR.mkdir(parents=True, exist_ok=True)  # models folder nahi hai to bana do
    test = json.loads(TEST_PATH.read_text(encoding="utf-8"))["roast_categories"]  # 150 test examples
    train = json.loads(TRAIN_PATH.read_text(encoding="utf-8"))["examples"]  # generated training examples
    train_and_save(train, test, "roast_category")  # topic model train + test


if __name__ == "__main__":  # file seedha chalayi gayi ho (import nahi)
    main()  # to training shuru
