# Stage 2: Dataset Refinement

## Objective

The goal of Stage 2 was to improve dataset quality by addressing the limitations observed in Stage 1, particularly:

* Complete failure on ambiguous inputs
* Inability to predict the "Other" class
* Over-reliance on explicit merchant keywords
* Lack of semantic diversity in transaction descriptions

The focus was on restructuring the dataset to better reflect real-world financial transaction patterns while maintaining learnability.

---

## Motivation

Stage 1 revealed that the baseline model (TF-IDF + Logistic Regression) achieved high performance on structured inputs but failed under ambiguity. This failure was primarily due to:

* Deterministic mappings between merchants and categories
* Lack of representation for ambiguous or incomplete transactions
* Over-simplified input patterns

To address this, Stage 2 introduced controlled complexity into the dataset.

---

## Dataset Design Changes

### 1. Redefinition of the "Other" Class

Previously, the "Other" category acted as a fallback with weak representation. In Stage 2, it was redefined as a meaningful class with structured patterns such as:

* Generic financial actions (e.g., "money transferred", "payment completed")
* Peer-to-peer transactions
* Non-categorical financial events

This ensured the model learns to explicitly identify ambiguous or non-classifiable transactions.

---

### 2. Introduction of Weak-Signal Samples (Medium Difficulty)

Medium-difficulty samples were redesigned to remove explicit merchant references and rely on contextual phrases such as:

* "subscription"
* "bill payment"
* "cab ride"
* "food order"

These samples require the model to infer category from partial semantic cues rather than direct keyword mapping.

---

### 3. Enhanced Hard Samples

Hard samples were redesigned to include:

* Missing merchant information
* Conflicting signals (e.g., "Netflix electricity bill")
* Multi-intent descriptions (e.g., "food and shopping")
* Noisy SMS-like formats

These samples simulate real-world ambiguity and test model robustness.

---

### 4. Semantic Anchors

To move beyond keyword matching, contextual phrases were introduced:

* "monthly subscription"
* "electricity bill"
* "ride payment"
* "order placed"

These encourage the model to learn intent rather than relying solely on entity names.

---

## Results

### Training and Evaluation

* Accuracy (in-distribution): ~0.96
* Cross-dataset accuracy: ~0.97
* Near-perfect precision across most classes

---

## Analysis

While the results showed extremely high performance, further inspection revealed that:

* Many patterns were still implicitly deterministic
* Certain keywords strongly encoded category labels
* The dataset introduced structured signals that were easily exploitable by the model

This led to artificially inflated performance.

---

## Key Limitation

The primary issue identified was:

> The dataset contained implicit label encoding, allowing the model to achieve high accuracy without genuine semantic understanding.

---

## Conclusion

Stage 2 successfully improved dataset coverage and resolved several structural issues from Stage 1, particularly:

* Improved handling of the "Other" class
* Increased diversity in input patterns
* Introduction of ambiguity

However, it also introduced unintended bias through predictable patterns, leading to overestimated model performance.

---

## Transition to Stage 2.5

To address these limitations, Stage 2.5 focuses on:

* Removing deterministic mappings
* Introducing probabilistic labeling
* Increasing realism through ambiguity and noise
* Preventing model overfitting to synthetic patterns
