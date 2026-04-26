# Stage 2.5: Realism Adjustment

## Objective

The goal of Stage 2.5 was to correct the limitations of Stage 2 by introducing realistic data distributions and eliminating implicit label leakage.

This stage focuses on simulating real-world financial text conditions, including ambiguity, inconsistency, and uncertainty.

---

## Motivation

Stage 2 demonstrated that high performance can be achieved through structured dataset design. However, this performance was not representative of real-world conditions due to:

* Deterministic keyword-to-category mappings
* Predictable linguistic patterns
* Lack of uncertainty in label assignment

To build a robust system, the dataset must reflect the inherent ambiguity of financial transaction data.

---

## Dataset Design Changes

### 1. Probabilistic Label Assignment

Instead of fixed mappings, categories are assigned probabilistically based on weak signals.

Examples:

* "subscription" → Entertainment or Bills
* "recharge" → Bills or Other
* "ride" → Travel or Other

This prevents the model from learning deterministic rules.

---

### 2. Merchant Decoupling

Merchants are no longer tied to a single category.

Examples:

* "Swiggy" → Food or Shopping
* "Netflix" → Entertainment or Bills
* "Amazon" → Shopping or Entertainment

This reflects real-world scenarios where merchants offer multiple services.

---

### 3. True Ambiguity in Hard Samples

Hard samples were redesigned to include:

* Minimal or no semantic cues
* Generic transaction phrases
* No clear mapping to a specific category

Examples:

* "₹1200 paid"
* "transaction completed"
* "amount debited"

These samples require contextual reasoning beyond keyword matching.

---

### 4. Label Noise Introduction

A small percentage of samples (~8%) were assigned random labels to simulate real-world annotation noise.

This improves model robustness and prevents overfitting.

---

### 5. Increased Linguistic Variability

Additional variations were introduced:

* Random casing
* Typographical noise
* SMS-style formatting
* Informal phrasing

This better reflects real-world input variability.

---

## Results

### In-Distribution Evaluation

* Accuracy: ~0.48

### Difficulty-wise Performance

* Easy: ~0.61
* Medium: ~0.37
* Hard: ~0.40

---

## Analysis

### 1. Significant Performance Drop

Compared to Stage 2 (~0.97 accuracy), performance dropped to ~0.48.

This indicates removal of artificial patterns and transition to realistic data.

---

### 2. Improved Class Behavior

* The "Other" class is now actively predicted (recall ~0.54)
* Predictions are distributed across classes rather than collapsing

---

### 3. Difficulty Sensitivity

Performance degrades as ambiguity increases:

* Easy samples retain reasonable accuracy
* Medium and hard samples expose model limitations

---

### 4. Model Limitations Exposed

The TF-IDF model shows:

* Limited ability to handle ambiguous inputs
* Dependence on surface-level lexical features
* Lack of semantic understanding

---

## Key Insight

> As dataset realism increases, traditional bag-of-words models exhibit significant performance degradation, revealing their reliance on shallow lexical patterns rather than semantic comprehension.

---

## Implications

This stage establishes a realistic baseline for financial text classification and demonstrates that:

* High performance on synthetic data is not indicative of real-world capability
* Dataset design critically impacts model evaluation
* Robust models must handle ambiguity and incomplete information

---

## Conclusion

Stage 2.5 successfully transforms the dataset into a realistic approximation of financial transaction data. The resulting performance reflects the true limitations of the baseline model.

This provides a strong foundation for evaluating more advanced models.

---

## Next Steps

The limitations observed in this stage motivate the transition to transformer-based models such as BERT, which are better suited for:

* Contextual understanding
* Ambiguity resolution
* Semantic inference

The next stage will focus on evaluating such models against the refined dataset.
