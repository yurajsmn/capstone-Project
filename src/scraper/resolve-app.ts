import path from "path";

const NAME_TO_PACKAGE: Record<string, string> = {
  phonepe: "com.phonepe.app",
  whatsapp: "com.whatsapp",
  instagram: "com.instagram.android",
  facebook: "com.facebook.katana",
  paytm: "net.one97.paytm",
  amazon: "in.amazon.mShop.android.shopping",
  flipkart: "com.flipkart.android"
};

function looksLikePackage(id: string) {
  return /^(?:[a-z][a-z0-9_]*\.)+[a-z0-9_]+$/i.test(id) && !/\s/.test(id);
}

export async function resolvePlayAppId(input: string) {
  const term = (input || "").trim();
  if (!term) return { notFound: true, warning: "Empty query" };
  if (looksLikePackage(term)) return { appId: term };

  const lower = term.toLowerCase();
  if (NAME_TO_PACKAGE[lower]) {
    return { appId: NAME_TO_PACKAGE[lower] };
  }

  const mod: any = await import("google-play-scraper");
  const gplay: any = mod.default ?? mod;

  let results: any[] = [];
  try { results = await gplay.search({ term, num: 10, lang: "en" }); } catch {}
  if (!results.length) try { results = await gplay.search({ term, num: 10, lang: "en", country: "in" }); } catch {}

  if (!results.length) return { notFound: true, warning: `No app found for "${term}"` };

  const top = results[0];
  const exact = results.find((r: any) => (r.title || "").toLowerCase() === lower) || top;
  const candidates = results.slice(0, 5).map((r: any) => `${r.title} (${r.appId})`).join("; ");
  const warning = exact === top && results.length <= 1 ? undefined : `Resolved "${term}" → ${exact.title} (${exact.appId}). Candidates: ${candidates}`;
  return { appId: exact.appId, warning };
}