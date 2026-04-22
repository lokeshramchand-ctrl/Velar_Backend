# Stage 1: Cross-Dataset Evaluation (Generalization Test)

##  Objective

Evaluate how well a model trained on **clean, structured transaction data** generalizes to **noisy, ambiguous, real-world-like inputs**.

This experiment is designed to simulate real-world deployment conditions where:

* inputs are inconsistent
* merchants may be missing
* language may be noisy or mixed (e.g., Hinglish)

---

##  Experimental Setup

### Training Data

* Source: `simple_data.json`
* Characteristics:

  * Clean, template-based
  * Clear merchant-category relationships
  * Minimal ambiguity

### Test Data

* Source: `final_dataset.json`
* Characteristics:

  * Noisy (UPI refs, txn IDs, casing variations)
  * Hinglish + informal language
  * Missing merchants
  * Multi-merchant and conflicting signals
  * Ambiguous / generic transactions

---

##  Model

* Algorithm: Logistic Regression
* Features: TF-IDF (unigrams + bigrams)
* Class balancing: Enabled
* Training pipeline: See `train_model.py`

---

##  Results

### Overall Performance

* **Accuracy:** 0.7907

---

### Classification Report

| Category      | Precision | Recall   | F1-score |
| ------------- | --------- | -------- | -------- |
| Bills         | 0.80      | 0.95     | 0.87     |
| Entertainment | 0.93      | 0.92     | 0.92     |
| Food          | 0.71      | 0.91     | 0.80     |
| Shopping      | 0.65      | 0.93     | 0.77     |
| Travel        | 0.95      | 0.90     | 0.92     |
| **Other**     | **0.00**  | **0.00** | **0.00** |

---

### Difficulty-wise Accuracy

| Difficulty | Accuracy |
| ---------- | -------- |
| Easy       | 0.92     |
| Medium     | 1.00     |
| **Hard**   | **0.00** |

---

##  Key Findings

### 1. Strong Performance on Structured Inputs

The model performs well on:

* Inputs with clear merchant names
* Slightly noisy but still interpretable text

This indicates that TF-IDF + Logistic Regression can effectively learn:

> **surface-level lexical patterns (merchant → category)**

---

### 2. Complete Failure on Ambiguous Inputs

For **hard samples** (missing merchant, generic phrasing):

* Accuracy drops to **0.00**
* The model fails to generalize beyond keyword patterns

Example:

```txt
"payment successful ₹2000"
```

→ No strong features → incorrect prediction

---

### 3. Inability to Predict "Other" Class

* Precision: 0.00
* Recall: 0.00

The model **never predicts "Other"**, even when correct.

This suggests:

* Strong bias toward known merchant categories
* Lack of representation for ambiguous transactions

---

### 4. Over-reliance on Merchant Tokens

The model heavily depends on explicit keywords:

```txt
"Swiggy" → Food
"Netflix" → Entertainment
```

When these signals are:

* missing
* misleading
* conflicting

→ predictions become unreliable

---

### 5. Medium Difficulty May Be Underestimated

Medium accuracy = **1.00**, which indicates:

* Current "medium" samples still contain strong signals
* Dataset may not fully capture realistic mid-level ambiguity

---

##  Failure Cases (Examples)

From `cross_errors.json`:

---

### Missing Merchant

```txt
"₹1397 debited txn id 48291 success"
→ Predicted: Bills
→ Actual: Other
```

---

### Weak Signal

```txt
"transaction completed ₹999"
→ Predicted: Shopping
→ Actual: Other
```

---

### Conflicting Signal

```txt
"Netflix electricity bill ₹1500"
→ Predicted: Entertainment
→ Actual: Bills
```

---

##  Interpretation

This experiment demonstrates a critical limitation:

> **Bag-of-words models fail under incomplete or ambiguous financial signals.**

While they perform well in controlled environments, they:

* lack semantic understanding
* cannot infer context without explicit keywords

---

##  Conclusion

* High in-distribution accuracy (**93%**) is misleading
* Real-world performance drops significantly under noise
* Model fails entirely on ambiguous inputs

---

##  Next Steps

To address these limitations:

### 1. Improve Dataset

* Increase ambiguity in medium samples
* Strengthen "Other" class representation

### 2. Move Beyond TF-IDF

* Introduce transformer-based models (e.g., BERT)
* Capture semantic relationships instead of surface patterns

### 3. Add Entity Awareness

* Incorporate extraction (amount, merchant)
* Use structured + unstructured signals jointly

---

##  Summary Insight

> “Traditional bag-of-words models achieve high accuracy in controlled settings but fail completely under ambiguous, real-world financial inputs.”

---
