
import json
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from sklearn.metrics import classification_report, accuracy_score

# ---------- LOAD MODEL ----------
model = BertForSequenceClassification.from_pretrained("bert_model")
tokenizer = BertTokenizer.from_pretrained("bert_model")

model.eval()

# ---------- LOAD DATA ----------
with open("final_dataset_v2.5.json", "r", encoding="utf-8") as f:
    data = json.load(f)

texts = [d["text"] for d in data]
labels = [d["category"] for d in data]

label_list = list(sorted(set(labels)))
label2id = {l: i for i, l in enumerate(label_list)}

true = [label2id[l] for l in labels]

preds = []

for text in texts:
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=64)
    with torch.no_grad():
        outputs = model(**inputs)
    pred = torch.argmax(outputs.logits, dim=1).item()
    preds.append(pred)

print("\n=== BERT PERFORMANCE ===")
print("Accuracy:", accuracy_score(true, preds))
print("\nClassification Report:\n")
print(classification_report(true, preds))

