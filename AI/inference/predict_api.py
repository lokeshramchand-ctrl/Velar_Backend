import os
import re
import joblib
import numpy as np

from flask import Flask, request, jsonify

# ---------- PATH HANDLING (IMPORTANT) ----------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "..", "research", "artifacts", "category_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "..", "research", "artifacts", "vectorizer.pkl")
RULES_PATH = os.path.join(BASE_DIR, "..")

# Add parent directory to path for imports
import sys
sys.path.append(RULES_PATH)

from transaction_rules import get_category_from_rules

# ---------- LOAD MODELS ----------

model = joblib.load(MODEL_PATH)
vectorizer = joblib.load(VECTORIZER_PATH)

app = Flask(__name__)

# ---------- EXTRACTION FUNCTIONS ----------

def extract_amount(text):
    match = re.search(r'(\d+(?:\.\d{1,2})?)', text.replace(',', ''))
    return float(match.group(1)) if match else None


def extract_merchant(text):
    words = text.lower().split()

    stopwords = {"paid", "to", "at", "for", "on", "spent", "rs", "inr"}
    filtered = [w for w in words if w not in stopwords and not w.isdigit()]

    return filtered[0] if filtered else None


# ---------- MAIN PREDICT ----------

@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "Text is required"}), 400

    # ---- Extraction ----
    amount = extract_amount(text)
    merchant = extract_merchant(text)

    # ---- Rule-based classification ----
    category = get_category_from_rules(text)

    if category:
        confidence = 0.95
    else:
        X = vectorizer.transform([text])
        probs = model.predict_proba(X)[0]

        prediction = model.classes_[np.argmax(probs)]
        confidence = float(np.max(probs))

        category = prediction

    return jsonify({
        "amount": amount,
        "merchant": merchant,
        "category": category,
        "confidence": round(confidence, 3)
    })


# ---------- SERVER ----------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)