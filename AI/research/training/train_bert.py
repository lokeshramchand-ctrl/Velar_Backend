
import json
import torch
import numpy as np
from datasets import Dataset
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer
)
from sklearn.metrics import accuracy_score, f1_score
from sklearn.utils.class_weight import compute_class_weight

# ---------- LOAD DATA ----------
with open("final_dataset_v2.5.json", "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [d["text"] for d in data]
labels = [d["category"] for d in data]

label_list = sorted(list(set(labels)))
label2id = {l: i for i, l in enumerate(label_list)}
id2label = {i: l for l, i in label2id.items()}

y = np.array([label2id[l] for l in labels])

dataset = Dataset.from_dict({
    "text": texts,
    "label": y
})

dataset = dataset.train_test_split(test_size=0.2)

# ---------- TOKENIZER ----------
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

def tokenize(example):
    return tokenizer(
        example["text"],
        padding="max_length",
        truncation=True,
        max_length=64
    )

dataset = dataset.map(tokenize)

dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "label"])

# ---------- MODEL ----------
model = BertForSequenceClassification.from_pretrained(
    "bert-base-uncased",
    num_labels=len(label_list)
)

# ---------- CLASS WEIGHTS ----------
class_weights = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(y),
    y=y
)

class_weights = torch.tensor(class_weights, dtype=torch.float)

# ---------- CUSTOM TRAINER (WITH WEIGHTED LOSS) ----------
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.get("labels")
        outputs = model(**inputs)
        logits = outputs.get("logits")

        loss_fct = torch.nn.CrossEntropyLoss(
            weight=class_weights.to(logits.device)
        )

        loss = loss_fct(logits, labels)

        return (loss, outputs) if return_outputs else loss
# ---------- METRICS ----------
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=1)

    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted")
    }

# ---------- TRAINING CONFIG ----------
training_args = TrainingArguments(
    output_dir="./bert_results",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=3e-5,          # ↑ slightly higher
    per_device_train_batch_size=16,
    num_train_epochs=6,          # ↑ more epochs
    weight_decay=0.01,
    warmup_ratio=0.1,            # ↑ important for stability
    logging_steps=50,
    report_to="none",            # avoid warnings
)

# ---------- TRAINER ----------
trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    eval_dataset=dataset["test"],
    compute_metrics=compute_metrics,
)

trainer.train()

# ---------- SAVE ----------
model.save_pretrained("bert_model")
tokenizer.save_pretrained("bert_model")

print("BERT model trained and saved.")
