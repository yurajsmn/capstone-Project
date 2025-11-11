# Simple aspect extraction stub (rule + keyword)
ASPECT_KEYWORDS = {
    "payments": ["upi", "transfer", "send", "payment", "transaction", "pay", "receive"],
    "security_protect": ["protect", "protection", "otp", "pin", "blocked", "block", "secure", "security"],
    "qr_scanner": ["qr", "scanner", "scan"],
    "performance": ["lag", "slow", "hang", "freeze", "crash", "stuck", "loading", "overlay"],
    "ui": ["ui", "interface", "design", "layout", "theme"],
    "cashback": ["cashback", "reward", "offers", "offer"],
    "support": ["support", "customer", "help", "service", "complain", "complaint"],
    "login": ["login", "signin", "sign in", "password", "otp"],
    "install": ["download", "install", "update"],
    "fraud": ["fraud", "scam", "deduct", "deducted", "charge", "money cut"],
}

def extract_aspects(text: str):
    lower = (text or "").lower()
    found = set()
    for aspect, kws in ASPECT_KEYWORDS.items():
        if any(k in lower for k in kws):
            found.add(aspect)
    return list(found)