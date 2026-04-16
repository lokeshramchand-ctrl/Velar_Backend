import json
import joblib
from sklearn.metrics import classification_report, accuracy_score

# ---------- LOAD MODEL ----------
# ---------- LOAD MODEL ----------
model = joblib.load("category_model.pkl")
vectorizer = joblib.load("vectorizer.pkl")

# ---------- LOAD HARD DATASET ----------
with open("final_dataset_v2.5.json", "r", encoding="utf-8") as f:
    hard_data = json.load(f)

texts = [d["text"] for d in hard_data]
labels = [d["category"] for d in hard_data]

# ---------- TRANSFORM ----------
X = vectorizer.transform(texts)

# ---------- PREDICT ----------
y_pred = model.predict(X)

# ---------- METRICS ----------
print("\n=== CROSS DATASET EVALUATION ===")
print("Train: EASY dataset")
print("Test: HARD dataset\n")

print("Accuracy:", round(accuracy_score(labels, y_pred), 4))

print("\nClassification Report:\n")
print(classification_report(labels, y_pred, zero_division=0))

# ---------- ERROR ANALYSIS ----------
errors = []

for i in range(len(texts)):
    if labels[i] != y_pred[i]:
        errors.append({
            "text": texts[i],
            "true": labels[i],
            "predicted": y_pred[i]
        })

with open("cross_errors.json", "w", encoding="utf-8") as f:
    json.dump(errors, f, indent=2, ensure_ascii=False)

print(f"\nErrors saved: {len(errors)} → cross_errors.json")

# ---------- DIFFICULTY ANALYSIS ----------
def classify_difficulty(sample):
    text = sample["text"].lower()

    if sample["merchant"] is None:
        return "hard"
    elif "upi" in text or "txn" in text:
        return "medium"
    else:
        return "easy"

scores = {"easy": [], "medium": [], "hard": []}

for i, sample in enumerate(hard_data):
    diff = classify_difficulty(sample)
    correct = int(labels[i] == y_pred[i])
    scores[diff].append(correct)

print("\n=== DIFFICULTY-WISE ACCURACY ===")
for k, v in scores.items():
    if len(v) > 0:
        print(f"{k}: {sum(v)/len(v):.2f}")
