import sys
import json
import re

# --- Aspect Extraction Logic ---
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

# --- Lexicon-based Sentiment Analysis Logic ---
EMOJI_POS = re.compile(r"[👍👌😊🙂😀😍🤩❤️💖💗💙💚💛💜💝✨⭐️🌟🥰]")
EMOJI_NEG = re.compile(r"[👎😡🤬😠😭😢☹️🙁💔]")

LEX_MAP = {
    # Positive Hinglish
    "badiya": "good", "badhiya": "good", "mast": "great", "supar": "super",
    "osm": "awesome", "gud": "good", "accha": "good", "acha": "good", "achha": "good",
    "zabardast": "awesome", "jhakaas": "awesome", "ekdum": "very", "bhot": "very",
    "bahut": "very", "sahi": "good", "best": "best", "top": "best", "ekno": "excellent",
    "kamaal": "amazing", "kamal": "amazing", "shandar": "wonderful", "badhia": "good",
    "lajawab": "awesome", "jabardast": "awesome", "maje": "fun", "maja": "fun",
    "bindaas": "cool", "dhamaal": "fun", "dhinchak": "cool", "jbrdst": "awesome",
    "zbrdst": "awesome", "bdhiya": "good", "superb": "superb", "faaadu": "awesome",
    "darun": "great", "shandaar": "wonderful", "gazab": "amazing", "khatarnak": "awesome",
    
    # Negative Hinglish  
    "nhi": "not", "nahi": "not", "nai": "not", "mat": "not", "mtt": "not",
    "bekar": "bad", "bakwas": "bad", "faltu": "useless", "bekaar": "bad",
    "ghatiya": "bad", "ganda": "bad", "kharab": "bad", "bura": "bad",
    "bakvaas": "bad", "bewakoof": "stupid", "pagal": "crazy", "nautanki": "drama",
    "dhokha": "fraud", "thug": "scam", "thugi": "scam", "locha": "problem",
    "problem": "problem", "dikkat": "problem", "pareshani": "problem",
    "kaam": "work", "kaamnaahi": "notworking", "naahin": "not", "naa": "not",
    "band": "blocked", "fek": "fake", "feek": "fake", "bakwaas": "bad",
    "ghatia": "bad", "kachra": "trash", "kachara": "trash", "faltu": "useless",
    "timepass": "waste", "bore": "boring", "bor": "boring", "bakvas": "bad"
}
POS_SET = {
    "good","best","excellent","awesome","nice","great","love","amazing","useful","helpful",
    "super","fantastic","happy","perfect","fast","easy","wonderful","cool","brilliant",
    "superb","better","liked","like","loved","enjoy","enjoyed","satisfied","wow",
    "badiya","mast","supar","osm","gud","accha","acha","achha","zabardast","jhakaas",
    "sahi","ekno","kamaal","kamal","shandar","badhia","lajawab","jabardast","maje","maja",
    "bindaas","dhamaal","dhinchak","jbrdst","zbrdst","bdhiya","faaadu","darun","shandaar",
    "gazab","khatarnak","very","bhot","bahut","ekdum","smoothly","smooth","powerful",
    "safe","secure","trusted","trust","reliable","top","recommend","recommended"
}
NEG_SET = {
    "bad","worst","waste","bug","slow","crash","freeze","freezes","freezing","hang","lag",
    "issue","blocked","block","ban","spam","problem","error","fail","failed","hate","useless",
    "boring","poor","terrible","uninstall","stuck","loading","overlay","fraud","scam",
    "deducted","deduction","protect","protection","notworking","cantpay","cantlogin","deny",
    "denied","downloading","qr","scanner","bekar","bakwas","faltu","bekaar","ghatiya",
    "ganda","kharab","bura","bakvaas","bewakoof","pagal","nautanki","dhokha","thug","thugi",
    "locha","dikkat","pareshani","kaamnaahi","band","fek","feek","ghatia","kachra",
    "kachara","timepass","bore","bor","bakvas","dangerous","unsafe","risk","risky",
    "cheat","cheating","loot","looted","missing","lost","gone","delete","deleted"
}
NEGATORS = {"not","no","never","dont","don't","cant","cannot","nhi","nahi","nai"}
BOOSTERS = {"very","really","so","too","extremely","super","absolutely"}

def normalize(text: str) -> str:
    t = (text or "").lower()
    t = re.sub(r"(.)\1{2,}", r"\1\1", t)
    t = re.sub(r"\bnot\s+working\b", "notworking", t)
    t = re.sub(r"\bcan'?t\s+pay\b", "cantpay", t)
    t = re.sub(r"\bcan'?t\s+login\b", "cantlogin", t)
    tokens = re.findall(r"[a-zA-Z']+|\d+", t)
    mapped = [LEX_MAP.get(tok, tok) for tok in tokens]
    return " ".join(mapped)

def lex_analyze(text: str):
    norm = normalize(text)
    tokens = norm.split()
    pos = len(EMOJI_POS.findall(text)) * 1.2
    neg = len(EMOJI_NEG.findall(text)) * 1.2
    for i, tok in enumerate(tokens):
        boost = 1.25 if i > 0 and tokens[i-1] in BOOSTERS else 1.0
        window_neg = ((i>0 and tokens[i-1] in NEGATORS) or (i>1 and tokens[i-2] in NEGATORS) or (i+1<len(tokens) and tokens[i+1] in NEGATORS))
        if tok in POS_SET:
            if window_neg: neg += 1.0 * boost
            else: pos += 1.0 * boost
        elif tok in NEG_SET:
            if window_neg: pos += 1.0 * boost
            else: neg += 1.0 * boost

    if "notworking" in norm or re.search(r"\bqr\b.*\b(not|nhi|nahi|nai)\b", norm): neg += 1.5
    if re.search(r"fraud|deduct(ed|ion)|money.*cut", norm): neg += 1.5

    alpha = 1.0
    pos_prob = (pos + alpha) / (pos + neg + 2 * alpha)
    neg_prob = (neg + alpha) / (pos + neg + 2 * alpha)
    maxp = max(pos_prob, neg_prob)

    if maxp >= 0.58:
        label = "positive" if pos_prob >= neg_prob else "negative"
        score = maxp
    else:
        label = "neutral"
        score = 1 - abs(pos_prob - 0.5) * 2

    clamp = lambda v, lo, hi: min(hi, max(lo, v))
    score = clamp(score, 0.45, 0.85) if label == "neutral" else clamp(score, 0.55, 0.95)
    return label, round(score, 2)

def summarize(items):
    total = len(items)
    p = sum(1 for r in items if r["sentiment"] == "positive")
    n = sum(1 for r in items if r["sentiment"] == "negative")
    ne = total - p - n
    pct = lambda x: round((x/total)*100, 2) if total else 0
    overall = "neutral"
    if p>n and p>=ne: overall="positive"
    elif n>p and n>=ne: overall="negative"
    return {"total": total, "positive": p, "neutral": ne, "negative": n,
            "positivePct": pct(p), "neutralPct": pct(ne), "negativePct": pct(n), "overall": overall}

# --- Main Execution Block ---
def main():
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw or "{}")
        reviews = payload.get("data", [])
        do_absa = payload.get("absa", False)

        out = []
        for r in reviews:
          text = (r.get("text") or "")
          label, score = lex_analyze(text)
          aspects = extract_aspects(text) if do_absa else []
          out.append({"id": r.get("id"), "text": text, "sentiment": label, "score": score, "aspects": aspects})

        print(json.dumps({"total": len(out), "data": out, "summary": summarize(out)}, ensure_ascii=False))
    except Exception as e:
        print(f"Python Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()