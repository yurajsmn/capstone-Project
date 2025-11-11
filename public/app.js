// Clean UI script: handles states, errors, summary, copy-to-clipboard

function setHidden(el, hidden) {
  if (el) el.hidden = !!hidden;
}
function setText(el, text) {
  if (el) el.textContent = text;
}
function setHTML(el, html) {
  if (el) el.innerHTML = html;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function summarize(items) {
  const out = {
    total: items?.length || 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  };
  for (const r of items || []) {
    if (r.sentiment === "positive") out.positive++;
    else if (r.sentiment === "negative") out.negative++;
    else out.neutral++;
  }
  return out;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("scrape-form");
  const btn = document.getElementById("scrape-btn");
  const platformEl = document.getElementById("platform");
  const appIdEl = document.getElementById("app-id");
  const maxEl = document.getElementById("max");
  const useModelEl = document.getElementById("use-model");

  const alertEl = document.getElementById("alert");
  const loadingEl = document.getElementById("loading");
  const resultSection = document.getElementById("scrape-result");
  const noteEl = document.getElementById("note");
  const pre = document.getElementById("scrape-json");
  const copyBtn = document.getElementById("copy-btn");

  const totalEl = document.getElementById("total-count");
  const posEl = document.getElementById("pos-count");
  const neuEl = document.getElementById("neu-count");
  const negEl = document.getElementById("neg-count");
  const overallEl = document.getElementById("overall-summary");
  const warningBox = document.getElementById("warning-box");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pre?.textContent || "");
      copyBtn.textContent = "Copied";
      setTimeout(() => (copyBtn.textContent = "Copy JSON"), 1000);
    } catch {
      // ignore
    }
  }

  if (copyBtn)
    copyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleCopy();
    });

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setHidden(alertEl, true);
    setHidden(noteEl, true);
    setText(alertEl, "");
    setText(pre, "");
    setHidden(resultSection, true);
    setHidden(loadingEl, false);
    btn && (btn.disabled = true);

    const formData = new FormData(form);
    const payload = {
      platform: platformEl ? platformEl.value : "play",
      appId: formData.get("appId")?.toString().trim() || "",
      max: Number(formData.get("max")) || 50,
      useModel: formData.get("useModel") === "on",
      absa: formData.get("absa") === "on",
    };

    if (!payload.appId) {
      setText(alertEl, "Enter a valid App ID (e.g., com.whatsapp).");
      setHidden(alertEl, false);
      setHidden(loadingEl, true);
      btn && (btn.disabled = false);
      return;
    }

    try {
      const res = await postJSON("/api/scrape", payload);
      // optional warning from backend
      if (res && res.warning) {
        warningBox.textContent = res.warning;
        warningBox.hidden = false;
      } else {
        warningBox.hidden = true;
      }

      const items = res?.data || [];
      const s = summarize(items);
      setText(totalEl, String(s.total));
      setText(posEl, String(s.positive));
      setText(neuEl, String(s.neutral));
      setText(negEl, String(s.negative));

      setText(pre, JSON.stringify(res, null, 2));
      if (res.summary) {
        const s = res.summary;
        setHTML(
          overallEl,
          `Overall: <strong>${s.overall}</strong> ` +
            `(pos ${s.positivePct}%, neu ${s.neutralPct}%, neg ${s.negativePct}%)`
        );
        setHidden(overallEl, false);
      } else {
        setHidden(overallEl, true);
      }

      setHidden(resultSection, false);
    } catch (err) {
      setText(alertEl, err && err.message ? err.message : String(err));
      setHidden(alertEl, false);
    } finally {
      setHidden(loadingEl, true);
      btn && (btn.disabled = false);
    }
  });
});
