import random
import json

NUM_SAMPLES = 3000

categories = ["Food", "Shopping", "Bills", "Travel", "Entertainment", "Other"]

merchants = [
    "Swiggy", "Zomato", "Amazon", "Flipkart", "Uber",
    "Ola", "Netflix", "Spotify", "Airtel", "Jio"
]

# ---------- UTIL ----------

def format_amount(amount):
    return random.choice([
        f"₹{amount}", f"{amount} INR", f"{amount} rs", f"Rs {amount}", str(amount)
    ])

def add_noise(text):
    tokens = ["txn id", "upi ref", "debited", "credited", "success"]
    if random.random() < 0.6:
        text += f" {random.choice(tokens)} {random.randint(10000,99999)}"
    return text

def random_case(text):
    return "".join(
        c.upper() if random.random() < 0.25 else c.lower()
        for c in text
    )

def maybe_typo(text):
    if random.random() < 0.2:
        i = random.randint(0, len(text)-2)
        text = text[:i] + text[i+1] + text[i] + text[i+2:]
    return text

# ---------- EASY (still slightly noisy) ----------

def generate_easy():
    amount = random.randint(50, 5000)
    merchant = random.choice(merchants)

    text = random.choice([
        f"Paid {format_amount(amount)} to {merchant}",
        f"Spent {format_amount(amount)} at {merchant}",
        f"{merchant} charged {format_amount(amount)}"
    ])

    return {
        "text": text,
        "amount": amount,
        "merchant": merchant.lower(),
        "category": assign_category(merchant, text)
    }

# ---------- MEDIUM (weak signals) ----------

def generate_medium():
    amount = random.randint(50, 5000)

    text = random.choice([
        f"{amount} recharge",
        f"{amount} subscription",
        f"{amount} bill paid",
        f"paid {amount} online",
        f"{amount} spent via upi",
        f"{amount} order placed",
        f"{amount} cab ride"
    ])

    text = add_noise(text)
    text = random_case(text)

    return {
        "text": text,
        "amount": amount,
        "merchant": None,
        "category": assign_category(None, text)
    }

# ---------- HARD (real ambiguity) ----------

def generate_hard():
    amount = random.randint(50, 5000)

    text = random.choice([
        f"{format_amount(amount)} payment successful",
        f"{format_amount(amount)} debited",
        f"transaction completed {amount}",
        f"{amount} transferred",
        f"{amount} sent",
        f"{amount} paid"
    ])

    text = add_noise(text)
    text = maybe_typo(text)

    return {
        "text": text,
        "amount": amount,
        "merchant": None,
        "category": assign_category(None, text)
    }

# ---------- CATEGORY ASSIGNMENT (CORE FIX) ----------

def assign_category(merchant, text):
    """
    Probabilistic labeling to avoid deterministic mapping
    """

    # If merchant exists → soft bias (NOT fixed)
    if merchant:
        bias_map = {
            "Swiggy": ["Food", "Shopping"],
            "Zomato": ["Food"],
            "Amazon": ["Shopping", "Entertainment"],
            "Netflix": ["Entertainment", "Bills"],
            "Uber": ["Travel"],
            "Airtel": ["Bills", "Other"],
        }

        if merchant in bias_map:
            return random.choice(bias_map[merchant])

    # If no merchant → infer weakly from text
    if "recharge" in text:
        return random.choice(["Bills", "Other"])
    if "subscription" in text:
        return random.choice(["Entertainment", "Bills"])
    if "ride" in text:
        return random.choice(["Travel", "Other"])

    # fallback
    return random.choice(categories)

# ---------- MAIN ----------

def generate_sample():
    r = random.random()

    if r < 0.4:
        sample = generate_easy()
    elif r < 0.7:
        sample = generate_medium()
    else:
        sample = generate_hard()

    # ---------- LABEL NOISE ----------
    if random.random() < 0.08:
        sample["category"] = random.choice(categories)

    return sample

def generate_dataset(n):
    return [generate_sample() for _ in range(n)]

if __name__ == "__main__":
    data = generate_dataset(NUM_SAMPLES)

    with open("final_dataset_v2.5.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("Generated realistic dataset (Stage 2.5)")
