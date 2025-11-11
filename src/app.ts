import express from "express";
import cors from "cors";
import path from "path";
import { spawnSync } from "child_process";
import { analyzeText } from "./utils/sentiment";
import { fetchReviews } from "./scraper/fetch-play-reviews";
import { resolvePlayAppId } from "./scraper/resolve-app";
import type { Review } from "./types";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = parseInt(process.env.PORT || "3000", 10);
const PY = process.env.PYTHON || "python";

function summarize(items: Array<{ sentiment: "positive" | "neutral" | "negative" }>) {
  const total = items.length;
  let p = 0, n = 0, ne = 0;
  for (const r of items) {
    if (r.sentiment === "positive") p++;
    else if (r.sentiment === "negative") n++;
    else ne++;
  }
  const pct = (x: number) => total ? +((x / total) * 100).toFixed(2) : 0;
  let overall: "positive" | "neutral" | "negative" = "neutral";
  if (p > n && p >= ne) overall = "positive";
  else if (n > p && n >= ne) overall = "negative";
  return { total, positive: p, neutral: ne, negative: n, positivePct: pct(p), neutralPct: pct(ne), negativePct: pct(n), overall };
}

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/scrape", async (req, res) => {
  const { platform, appId, max = 50, useModel = false, absa = false, country = "in", lang = "en" } = req.body || {};
  if (!platform || !appId) return res.status(400).json({ error: "Provide { platform, appId }" });
  if (platform !== "play") return res.status(501).json({ error: "Only platform='play' supported" });

  try {
    const resolved = await resolvePlayAppId(String(appId));
    if ((resolved as any).notFound) return res.status(404).json({ error: "App not found", query: appId, warning: resolved.warning });
    const warning = resolved.warning;

    const reviews: Review[] = await fetchReviews(resolved.appId, Number(max), String(country), String(lang));
    const base = reviews.map(r => ({ ...analyzeText(r.text, r.id), aspects: [] as string[] }));

    if (!useModel) {
      return res.json({ total: base.length, data: base, summary: summarize(base), warning });
    }

    const py = spawnSync(PY, [path.join(__dirname, "model", "infer.py")], {
      cwd: path.join(__dirname, "model"),
      input: JSON.stringify({
        data: reviews,
        absa,
        spModel: path.join(__dirname, "model", "tokenizer", "sp.model"),
        weights: path.join(__dirname, "model", "hybrid.pt"),
        vocabSize: 8000
      }),
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    });

    if (py.status !== 0) {
      return res.json({ total: base.length, data: base, summary: summarize(base), warning, pyError: py.stderr });
    }
    const out = JSON.parse(py.stdout || "{}");
    out.warning = out.warning ?? warning;
    return res.json(out);
  } catch (e: any) {
    return res.status(500).json({ error: "Scrape failed", details: String(e) });
  }
});

app.listen(PORT, () => console.log(`Server http://localhost:${PORT}`));