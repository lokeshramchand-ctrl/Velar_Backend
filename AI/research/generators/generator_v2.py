import random
import json

NUM_SAMPLES = 3000

# ---------- CATEGORY CONFIG ----------
categories = {
    "Food": ["Swiggy", "Zomato", "KFC"],
    "Shopping": ["Amazon", "Flipkart", "Nike"],
    "Bills": ["Airtel", "Jio", "Electricity"],
    "Travel": ["Uber", "Ola"],
    "Entertainment": ["Netflix", "Spotify"]
}

all_merchants = [m for v in categories.values() for m in v]

# ---------- UTIL ----------

def format_amount(amount):
    return random.choice([
        f"₹{amount}", f"{amount} INR", f"{amount} rs", f"Rs {amount}", str(amount)
    ])

def add_noise(text):
    tokens = ["txn id", "upi ref", "success", "debited", "credited"]
    if random.random() < 0.5:
        text += f" {random.choice(tokens)} {random.randint(10000,99999)}"
    return text

def random_case(text):
    return "".join(c.upper() if random.random() < 0.3 else c.lower() for c in text)

# ---------- EASY (CLEAR SIGNAL) ----------

def generate_easy():
    category = random.choice(list(categories.keys()))
    merchant = random.choice(categories[category])
    amount = random.randint(50, 5000)

    templates = [
        "Paid {amount} to {merchant}",
        "Spent {amount} at {merchant}",
        "{merchant} charged {amount}",
    ]

    text = random.choice(templates).format(
        amount=format_amount(amount),
        merchant=merchant
    )

    return {
        "text": text,
        "amount": amount,
        "merchant": merchant.lower(),
        "category": category
    }

# ---------- MEDIUM (WEAK SIGNALS, NO MERCHANT) ----------

def infer_category_from_text(text):
    text = text.lower()

    if "recharge" in text or "bill" in text:
        return "Bills"
    if "subscription" in text or "movie" in text:
        return "Entertainment"
    if "food" in text:
        return "Food"
    if "ride" in text or "cab" in text:
        return "Travel"
    if "shopping" in text or "order" in text:
        return "Shopping"

    return "Other"

def generate_medium():
    amount = random.randint(50, 5000)

    patterns = [
        f"{amount} recharge",
        f"{amount} bill payment",
        f"{amount} subscription",
        f"{amount} spent via upi",
        f"paid {amount} online",
        f"{amount} food order",
        f"{amount} cab ride",
    ]

    text = random.choice(patterns)
    category = infer_category_from_text(text)

    text = add_noise(text)
    text = random_case(text)

    return {
        "text": text,
        "amount": amount,
        "merchant": None,   # CRITICAL
        "category": category
    }

# ---------- HARD (AMBIGUOUS + ADVERSARIAL) ----------

def generate_hard():
    amount = random.randint(50, 5000)

    hard_type = random.choice([
        "no_signal",
        "conflicting",
        "multi_intent",
        "realistic_sms",
        "natural_language"
    ])

    # --- 1. No signal (pure ambiguity)
    if hard_type == "no_signal":
        text = random.choice([
            "transaction completed",
            "amount debited",
            "payment successful",
            "money transferred"
        ]) + f" {format_amount(amount)}"

        return {
            "text": add_noise(text),
            "amount": amount,
            "merchant": None,
            "category": "Other"
        }

    # --- 2. Conflicting signals
    elif hard_type == "conflicting":
        merchant = random.choice(all_merchants)
        text = f"{merchant} electricity bill {format_amount(amount)}"

        return {
            "text": text,
            "amount": amount,
            "merchant": merchant.lower(),
            "category": "Bills"
        }

    # --- 3. Multi-intent
    elif hard_type == "multi_intent":
        text = f"Paid {format_amount(amount)} for food and shopping"

        return {
            "text": text,
            "amount": amount,
            "merchant": None,
            "category": random.choice(["Food", "Shopping"])
        }

    # --- 4. Real SMS-like
    elif hard_type == "realistic_sms":
        text = f"INR {amount} debited A/C UPI txn success"

        return {
            "text": text,
            "amount": amount,
            "merchant": None,
            "category": "Other"
        }

    # --- 5. Natural language
    else:
        text = f"went out and spent {format_amount(amount)} on food"

        return {
            "text": text,
            "amount": amount,
            "merchant": None,
            "category": "Food"
        }

# ---------- OTHER (STRONG CLASS SUPPORT) ----------

def generate_other():
    amount = random.randint(50, 5000)

    patterns = [
        f"{amount} transferred",
        f"{amount} sent via upi",
        f"{amount} credited",
        f"money sent {amount}",
        f"payment done {amount}"
    ]

    text = random.choice(patterns)

    return {
        "text": add_noise(text),
        "amount": amount,
        "merchant": None,
        "category": "Other"
    }

# ---------- MAIN SAMPLER ----------

def generate_sample():
    r = random.random()

    if r < 0.4:
        return generate_easy()
    elif r < 0.7:
        return generate_medium()
    elif r < 0.9:
        return generate_hard()
    else:
        return generate_other()  # ensures strong "Other" class

def generate_dataset(n):
    return [generate_sample() for _ in range(n)]

# ---------- MAIN ----------

if __name__ == "__main__":
    data = generate_dataset(NUM_SAMPLES)

    with open("final_dataset_v2.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Generated {NUM_SAMPLES} samples (Stage 2 refined dataset)")

