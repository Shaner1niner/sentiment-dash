#!/usr/bin/env python
from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "dashboard_fix26_app.js"


def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def main() -> int:
    print("=" * 76)
    print("SETA MACD visual polish v3 smoke test")
    print("=" * 76)

    if not TARGET.exists():
        fail(f"missing dashboard app: {TARGET}")

    ok("found dashboard app")
    src = TARGET.read_text(encoding="utf-8")

    required_tokens = [
        "SETA MACD visual polish v3",
        "Price MACD Histogram",
        "Sentiment MACD Histogram Overlay",
        "Hidden by default: scaled_sentiment_macd",
        "Sentiment MACD Signal",
        "Hidden fast line",
        "Sentiment bull",
        "Sentiment bear",
        "Last Sentiment Cross",
        "Price Hist",
    ]

    for token in required_tokens:
        if token not in src:
            fail(f"missing token: {token}")

    forbidden_tokens = [
        "'Scaled Sentiment MACD','y2'",
        "name:'MACD Histogram'",
        "Last Cross: ${lastCrossText} | Histogram:",
    ]
    for token in forbidden_tokens:
        if token in src:
            fail(f"old token still present: {token}")

    ok("visual polish tokens present")
    ok("old noisy/default MACD tokens removed")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
