// Very small rule-based placeholder sentiment analyzer for Hinglish.
// Replace with your hybrid CNN + Bi-LSTM model integration later.

export type SentimentLabel = "positive" | "neutral" | "negative";

const ELONG_RE = /(.)\1{2,}/g;
const EMOJI_POS = /[👍👌😊🙂😀😍🤩❤️💖💗💙💚💛💜💝✨⭐️🌟🥰]/g;
const EMOJI_NEG = /[👎😡🤬😠😭😢☹️🙁💔]/g;

const LEX_MAP: Record<string, string> = {
  // Positive Hinglish
  badiya: "good", badhiya: "good", mast: "great", supar: "super", osm: "awesome", gud: "good",
  accha: "good", acha: "good", achha: "good", zabardast: "awesome", jhakaas: "awesome",
  ekdum: "very", bhot: "very", bahut: "very", sahi: "good", ekno: "excellent",
  kamaal: "amazing", kamal: "amazing", shandar: "wonderful", badhia: "good",
  lajawab: "awesome", jabardast: "awesome", maje: "fun", maja: "fun",
  bindaas: "cool", dhamaal: "fun", dhinchak: "cool", jbrdst: "awesome",
  zbrdst: "awesome", bdhiya: "good", faaadu: "awesome", darun: "great",
  shandaar: "wonderful", gazab: "amazing", khatarnak: "awesome",
  
  // Negative Hinglish
  nhi: "not", nahi: "not", nai: "not", mat: "not", mtt: "not",
  bekar: "bad", bakwas: "bad", faltu: "useless", bekaar: "bad",
  ghatiya: "bad", ganda: "bad", kharab: "bad", bura: "bad",
  bakvaas: "bad", bewakoof: "stupid", pagal: "crazy", nautanki: "drama",
  dhokha: "fraud", thug: "scam", thugi: "scam", locha: "problem",
  dikkat: "problem", pareshani: "problem", kaam: "work", kaamnaahi: "notworking",
  naahin: "not", naa: "not", band: "blocked", fek: "fake", feek: "fake",
  ghatia: "bad", kachra: "trash", kachara: "trash", timepass: "waste",
  bore: "boring", bor: "boring", bakvas: "bad"
};
const POS = new Set(["good","best","excellent","awesome","nice","great","love","amazing","useful","helpful","super","fantastic","happy","perfect","fast","easy","wonderful","cool","brilliant","superb","better","liked","like","loved","enjoy","enjoyed","satisfied","wow","badiya","mast","supar","osm","gud","accha","acha","achha","zabardast","jhakaas","sahi","ekno","kamaal","kamal","shandar","badhia","lajawab","jabardast","maje","maja","bindaas","dhamaal","dhinchak","jbrdst","zbrdst","bdhiya","faaadu","darun","shandaar","gazab","khatarnak","bhot","bahut","ekdum","smoothly","smooth","powerful","safe","secure","trusted","trust","reliable","top","recommend","recommended"]);
const NEG = new Set(["bad","worst","waste","bug","slow","crash","freeze","freezes","freezing","hang","lag","issue","blocked","block","ban","spam","problem","error","fail","failed","hate","useless","boring","poor","terrible","uninstall","stuck","loading","overlay","fraud","scam","deducted","deduction","protect","protection","notworking","cantpay","cantlogin","deny","denied","downloading","qr","scanner","bekar","bakwas","faltu","bekaar","ghatiya","ganda","kharab","bura","bakvaas","bewakoof","pagal","nautanki","dhokha","thug","thugi","locha","dikkat","pareshani","kaamnaahi","band","fek","feek","ghatia","kachra","kachara","timepass","bore","bor","bakvas","dangerous","unsafe","risk","risky","cheat","cheating","loot","looted","missing","lost","gone","delete","deleted"]);
const NEGATORS = new Set(["not","no","never","dont","don't","cant","cannot","nhi","nahi","nai"]);
const BOOST = new Set(["very","really","so","too","extremely","super","absolutely"]);

function normalize(s: string): string {
  let t = (s || "").toLowerCase().replace(ELONG_RE, "$1$1");
  t = t.replace(/\bnot\s+working\b/g, "notworking").replace(/\bcan'?t\s+pay\b/g, "cantpay").replace(/\bcan'?t\s+login\b/g, "cantlogin");
  const tokens = t.match(/[a-zA-Z']+|\d+/g) || [];
  return tokens.map(tok => LEX_MAP[tok] ?? tok).join(" ");
}

function analyzeTokens(text: string) {
  const t = normalize(text);
  const tokens = t.split(/\s+/).filter(Boolean);
  let pos = 0, neg = 0;

  pos += (t.match(EMOJI_POS) || []).length * 1.2;
  neg += (t.match(EMOJI_NEG) || []).length * 1.2;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const boost = i > 0 && BOOST.has(tokens[i - 1]) ? 1.25 : 1.0;
    const windowNeg = (i > 0 && NEGATORS.has(tokens[i - 1])) || (i > 1 && NEGATORS.has(tokens[i - 2])) || (i + 1 < tokens.length && NEGATORS.has(tokens[i + 1]));
    if (POS.has(tok)) {
      if (windowNeg) neg += 1.0 * boost; else pos += 1.0 * boost;
    } else if (NEG.has(tok)) {
      if (windowNeg) pos += 1.0 * boost; else neg += 1.0 * boost;
    }
  }

  if (/\bnotworking\b/.test(t) || /fraud|deduct(ed|ion)|money.*cut/.test(t)) neg += 1.5;

  const alpha = 1;
  const posProb = (pos + alpha) / (pos + neg + 2 * alpha);
  const negProb = (neg + alpha) / (pos + neg + 2 * alpha);
  const maxProb = Math.max(posProb, negProb);

  let label: "positive" | "neutral" | "negative" = "neutral";
  if (maxProb >= 0.58) label = posProb >= negProb ? "positive" : "negative";

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  let score: number;
  if (label === "neutral") score = clamp(1 - Math.abs(posProb - 0.5) * 2, 0.45, 0.85);
  else score = clamp(maxProb, 0.55, 0.95);

  return { label, score: +score.toFixed(2) };
}

export function analyzeText(text: string, id?: number) {
  const { label, score } = analyzeTokens(text || "");
  return { id, text, sentiment: label, score };
}