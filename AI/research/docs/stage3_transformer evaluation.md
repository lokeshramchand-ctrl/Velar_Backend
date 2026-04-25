# Stage 3: Transformer-Based Modeling (BERT)

## Objective

The objective of Stage 3 is to evaluate whether a transformer-based model can overcome the limitations observed in earlier stages, particularly:

* Sensitivity to ambiguity
* Weak handling of contextual signals
* Dependence on explicit lexical patterns

This stage introduces a contextual language model to assess whether semantic understanding improves classification performance on realistic financial transaction data.

---

## Motivation

Results from Stage 2.5 demonstrated that:

* TF-IDF models achieve moderate performance (~48% accuracy)
* Performance degrades significantly under ambiguous and noisy inputs
* The dataset no longer contains deterministic mappings, reflecting real-world conditions

Given these limitations, it is necessary to evaluate models capable of contextual reasoning. Transformer architectures, particularly BERT, are designed to capture semantic relationships beyond surface-level features.

---

## Methodology

### Model Selection

A pre-trained BERT base model (`bert-base-uncased`) was selected due to its:

* Bidirectional context modeling
* Strong performance on text classification tasks
* Availability of pre-trained weights for transfer learning

The model was fine-tuned for multi-class classification with six categories:

* Bills
* Entertainment
* Food
* Other
* Shopping
* Travel

---

### Data

The model was trained on the Stage 2.5 dataset, which includes:

* ~3000 samples
* Balanced but noisy class distribution
* Mixed difficulty levels:

  * Easy (explicit signals)
  * Medium (weak signals)
  * Hard (ambiguous or missing context)

---

### Training Configuration

* Tokenization: WordPiece tokenizer with max length = 64
* Train/Test Split: 80/20
* Batch Size: 16
* Epochs: 6
* Learning Rate: 3e-5
* Weight Decay: 0.01
* Warmup: linear warmup applied
* Loss Function: Cross-entropy with class weighting

Class weights were introduced to mitigate imbalance and improve minority class performance.

---

### Evaluation Metrics

* Accuracy
* Weighted F1-score
* Class-wise precision and recall

---

## Results

### Overall Performance

```txt
Accuracy: ~0.50
Weighted F1: ~0.50
```

---

### Class-wise Observations

* Strong performance in categories with clear semantic signals:

  * Food (F1 ≈ 0.60)
  * Travel (F1 ≈ 0.57)

* Moderate performance in mixed-signal categories:

  * Shopping (F1 ≈ 0.49)
  * Bills (F1 ≈ 0.48)

* Weak performance in ambiguous categories:

  * Entertainment (F1 ≈ 0.36)
  * Other (F1 ≈ 0.45)

---

## Comparative Analysis

| Model  | Accuracy | Key Characteristics      |
| ------ | -------- | ------------------------ |
| TF-IDF | ~0.48    | Lexical pattern matching |
| BERT   | ~0.50    | Context-aware modeling   |

The transformer model provides only marginal improvement over the TF-IDF baseline.

---

## Analysis

### 1. Limited Performance Gain

Despite its architectural advantages, BERT achieved only a small improvement (~2%). This indicates that:

* Contextual modeling alone is insufficient under high ambiguity
* The dataset lacks strong, consistent supervision signals

---

### 2. Impact of Dataset Realism

The dataset introduced:

* Probabilistic labeling
* Overlapping semantic categories
* Missing or weak contextual cues

These factors reduce the effectiveness of both classical and deep learning models.

---

### 3. Ambiguity as a Fundamental Constraint

Examples such as:

* "₹1200 paid"
* "transaction completed"

contain insufficient information for reliable classification. This highlights a key limitation:

> Model performance is bounded by the informativeness of the input, not just model capacity.

---

### 4. Small Data Regime

Transformer models typically require large datasets to generalize effectively. With only ~3000 samples:

* Fine-tuning is limited
* Generalization remains weak
* Overfitting and underfitting risks coexist

---

## Key Insight

> Increasing model complexity does not guarantee improved performance when the dataset is small, noisy, and inherently ambiguous.

---

## Implications

This stage demonstrates that:

* Realistic datasets expose limitations in both classical and modern NLP models
* Ambiguity and weak supervision are primary bottlenecks
* Data quality and signal strength are more critical than model architecture

---

## Limitations

* Limited dataset size (~3000 samples)
* Synthetic data generation may not fully capture real-world distributions
* No incorporation of external knowledge (e.g., merchant databases)

---

## Conclusion

The introduction of BERT provides only marginal improvement over the TF-IDF baseline, reinforcing the conclusion that:

* Dataset realism significantly increases task difficulty
* Model performance is constrained by data ambiguity
* Advanced architectures require stronger supervision or larger datasets to be effective

---

## Future Work

Future directions include:

* Scaling dataset size (10k+ samples)
* Incorporating contextual metadata (time, location, transaction type)
* Exploring domain-specific pretraining
* Evaluating lighter transformer variants (e.g., DistilBERT)
* Introducing semi-supervised or contrastive learning approaches

---

## Summary

Stage 3 completes the modeling pipeline by demonstrating that even advanced transformer models struggle under realistic financial text conditions. This establishes a robust baseline for future research and highlights the central role of data quality in machine learning systems.
