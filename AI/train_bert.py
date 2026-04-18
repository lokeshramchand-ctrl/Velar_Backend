import json
import torch
from datasets import Dataset
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    TrainingArguments,
    Trainer
)
from sklearn.metrics import accuracy_score, f1_score

# ---------- LOAD DATA ----------
with open("final_dataset_v2.5.json", "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [d["text"] for d in data]
labels = [d["category"] for d in data]

label_list = list(sorted(set(labels)))
label2id = {l: i for i, l in enumerate(label_list)}
id2label = {i: l for l, i in label2id.items()}

y = [label2id[l] for l in labels]

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

# ---------- METRICS ----------
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = torch.argmax(torch.tensor(logits), axis=1)

    return {
        "accuracy": accuracy_score(labels, preds),
        "f1": f1_score(labels, preds, average="weighted")
    }

# ---------- TRAINING ----------
training_args = TrainingArguments(
    output_dir="./bert_results",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    logging_dir="./logs",
)

trainer = Trainer(
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
