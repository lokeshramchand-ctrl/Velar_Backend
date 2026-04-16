import json
import joblib
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np
import pandas as pd

# ---------- LOAD MODEL ----------
model = joblib.load("/home/lowsl/code/velar_node_backend/Backend/AI/model/category_model.pkl")
vectorizer = joblib.load("/home/lowsl/code/velar_node_backend/Backend/AI/model/vectorizer.pkl")

# ---------- LOAD DATA ----------
with open("/home/lowsl/code/velar_node_backend/Backend/AI/datasets/Json/final_dataset_v2.5.json", "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [d["text"] for d in data]
labels = [d["category"] for d in data]

# ---------- TRANSFORM ----------
X = vectorizer.transform(texts)
y_true = labels

# ---------- PREDICT ----------
y_pred = model.predict(X)

# ---------- BASIC METRICS ----------
print("\n=== OVERALL PERFORMANCE ===")
print("Accuracy:", accuracy_score(y_true, y_pred))

print("\n=== CLASSIFICATION REPORT ===")
print(classification_report(y_true, y_pred))

# ---------- CONFUSION MATRIX ----------
print("\n=== CONFUSION MATRIX ===")
cm = confusion_matrix(y_true, y_pred)
print(cm)

# ---------- SAVE CONFUSION MATRIX ----------
df_cm = pd.DataFrame(cm)
df_cm.to_csv("confusion_matrix.csv", index=False)

# ---------- ERROR ANALYSIS ----------
errors = []

for i in range(len(texts)):
    if y_true[i] != y_pred[i]:
        errors.append({
            "text": texts[i],
            "true": y_true[i],
            "predicted": y_pred[i]
        })

with open("errors.json", "w", encoding="utf-8") as f:
    json.dump(errors, f, indent=2, ensure_ascii=False)

print(f"\nTotal Errors: {len(errors)} saved to errors.json")

# ---------- DIFFICULTY ANALYSIS ----------
def classify_difficulty(sample):
    text = sample["text"].lower()

    if "txn" in text or "upi" in text:
        return "medium"
    if sample["merchant"] is None:
        return "hard"
    if len(text.split()) < 3:
        return "hard"

    return "easy"

difficulty_scores = {
    "easy": [],
    "medium": [],
    "hard": []
}

for i, sample in enumerate(data):
    diff = classify_difficulty(sample)
    correct = int(y_true[i] == y_pred[i])
    difficulty_scores[diff].append(correct)

print("\n=== DIFFICULTY-WISE ACCURACY ===")
for k, v in difficulty_scores.items():
    if len(v) > 0:
        print(f"{k}: {sum(v)/len(v):.2f}")
