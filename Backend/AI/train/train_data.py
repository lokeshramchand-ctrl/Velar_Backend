import json
import os
import random
import numpy as np
from collections import Counter

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_class_weight

import joblib

# ---------- CONFIG ----------
DATA_PATH = "/home/lowsl/code/velar_node_backend/Backend/AI/datasets/Json/final_dataset_v2.json"
MODEL_DIR = "/home/lowsl/code/velar_node_backend/Backend/AI/model"
SEED = 42

os.makedirs(MODEL_DIR, exist_ok=True)

# ---------- REPRODUCIBILITY ----------
random.seed(SEED)
np.random.seed(SEED)

# ---------- LOAD DATA ----------
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [d["text"] for d in data]
labels = [d["category"] for d in data]

print("Dataset size:", len(texts))
print("Class distribution:", Counter(labels))

# ---------- SPLIT ----------
X_train, X_test, y_train, y_test = train_test_split(
    texts,
    labels,
    test_size=0.2,
    random_state=SEED,
    stratify=labels  # IMPORTANT for balance
)

# ---------- VECTORIZER ----------
vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 2),      # captures short phrases
    max_features=8000,
    min_df=2,                # ignore very rare tokens
    sublinear_tf=True        # better scaling
)

X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ---------- CLASS WEIGHTS (IMPORTANT) ----------
classes = np.unique(y_train)
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=classes,
    y=y_train
)
class_weight_dict = dict(zip(classes, class_weights))

print("Class weights:", class_weight_dict)

# ---------- MODEL ----------
model = LogisticRegression(
    max_iter=300,
    class_weight=class_weight_dict,
    n_jobs=-1
)

model.fit(X_train_vec, y_train)

# ---------- EVALUATION ----------
y_pred = model.predict(X_test_vec)

print("\n=== EVALUATION ===")
print("Accuracy:", round(accuracy_score(y_test, y_pred), 4))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred, zero_division=0))

# ---------- SAVE ----------
joblib.dump(model, os.path.join(MODEL_DIR, "category_model.pkl"))
joblib.dump(vectorizer, os.path.join(MODEL_DIR, "vectorizer.pkl"))

print("\nModel + Vectorizer saved to " + MODEL_DIR)

# ---------- OPTIONAL: SAVE TEST SET ----------
with open(os.path.join(MODEL_DIR, "test_split.json"), "w", encoding="utf-8") as f:
    json.dump(
        [{"text": t, "label": l} for t, l in zip(X_test, y_test)],
        f,
        indent=2,
        ensure_ascii=False
    )

print("Saved test_split.json for reproducibility")
