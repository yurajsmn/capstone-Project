import type { Review } from "../types";
export async function fetchReviews(appId: string, max = 50, country = "in", lang = "en"): Promise<Review[]> {
  const mod: any = await import("google-play-scraper");
  const gplay: any = mod.default ?? mod;

  const out: Review[] = [];
  const seen = new Set<string>();
  let token: string | undefined;

  while (out.length < max) {
    const num = Math.min(199, max - out.length);
    const page: any = await gplay.reviews({
      appId,
      sort: gplay.sort.NEWEST,
      num,
      paginate: true,
      nextPaginationToken: token,
      country,
      lang
    });
    const data = page?.data ?? [];
    for (const r of data) {
      const rid = String(r.id || r.userName || r.date || `${out.length}`);
      if (seen.has(rid)) continue;
      seen.add(rid);
      const text = String(r.text || "").trim();
      if (!text) continue;
      const hash = Math.abs(rid.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0));
      out.push({ id: hash, text, source: "play" });
      if (out.length >= max) break;
    }
    token = page?.nextPaginationToken;
    if (!token || data.length === 0) break;
    await new Promise(r => setTimeout(r, 250));
  }
  return out;
}
