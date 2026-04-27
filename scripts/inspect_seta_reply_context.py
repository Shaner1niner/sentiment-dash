from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(r"C:\Users\shane\sentiment-dash")
STORE = ROOT / "fix26_screener_store.json"


def flatten(obj, prefix=""):
    out = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, dict):
                out.update(flatten(v, key))
            else:
                out[key] = v
    return out


def main():
    data = json.loads(STORE.read_text(encoding="utf-8"))
    by_term = data.get("by_term", {})
    term = "BTC" if "BTC" in by_term else next(iter(by_term))
    row = by_term[term]
    flat = flatten(row)
    print(f"term={term}")
    print(f"top_level_keys={list(row.keys())}")
    print("\nCandidate score/label fields:")
    for k, v in sorted(flat.items()):
        kl = k.lower()
        if any(x in kl for x in ["summary", "priority", "archetype", "direction", "macd", "rsi", "attention", "boll", "ribbon", "trend"]):
            print(f"{k}: {v}")

if __name__ == "__main__":
    main()
