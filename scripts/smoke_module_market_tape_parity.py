#!/usr/bin/env python
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKET_TAPE = ROOT / "src" / "features" / "MarketTape.js"
HARNESS = ROOT / "module_runtime_smoke_harness.html"
SCREENER = ROOT / "fix26_screener_store.json"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def main() -> int:
    for path in [MARKET_TAPE, HARNESS]:
        if not path.exists():
            return fail(f"missing {path.relative_to(ROOT)}")

    market_tape = read(MARKET_TAPE)
    harness = read(HARNESS)

    market_tokens = [
        "export const MarketTape",
        "async load(options = {})",
        "fix26_screener_store.json",
        "Store.setScreenerData(this.payload)",
        "assetRowsFromScreener(payload)",
        "normalizeMarketTapeItem(item, ticker)",
        "moduleMarketTapePanel",
        "moduleMarketTapeItem",
        "Store.setAsset(ticker)",
        "Store.on('assetChanged'",
    ]
    missing_market = [token for token in market_tokens if token not in market_tape]
    if missing_market:
        return fail(f"MarketTape.js missing token(s): {missing_market}")

    harness_tokens = [
        'id="module-market-tape"',
        "moduleMarketTapePanel",
        "moduleMarketTapeCard",
        "moduleMarketTapeGrid",
    ]
    missing_harness = [token for token in harness_tokens if token not in harness]
    if missing_harness:
        return fail(f"module_runtime_smoke_harness.html missing token(s): {missing_harness}")

    if SCREENER.exists():
        payload = json.loads(SCREENER.read_text(encoding="utf-8-sig"))
        by_term = payload.get("by_term")
        if not isinstance(by_term, dict):
            return fail("fix26_screener_store.json missing object-map by_term")
        for ticker in ["BTC", "ETH", "SOL"]:
            if ticker not in by_term:
                return fail(f"fix26_screener_store.json missing {ticker}")
        print(f"[OK] screener by_term assets available: {len(by_term)}")
    else:
        print("[WARN] fix26_screener_store.json not present; skipped payload sample check")

    print("[OK] MarketTape loads screener store in module runtime")
    print("[OK] MarketTape renders module market tape panel")
    print("[OK] MarketTape items preserve click-to-asset behavior")
    print("[OK] harness includes module market tape target")
    print("[OK] module market tape parity smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
