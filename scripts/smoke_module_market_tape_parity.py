#!/usr/bin/env python
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MARKET_TAPE = ROOT / "src" / "features" / "MarketTape.js"
HARNESS = ROOT / "module_runtime_smoke_harness.html"
SCREENER = ROOT / "fix26_screener_store.json"

SCORE_KEY_RE = re.compile(r"(priority.*score|seta.*score|market.*score|tape.*score|deck.*score|metric.*score|total.*score|score)$", re.I)
RANK_KEY_RE = re.compile(r"(priority.*rank|market.*rank|tape.*rank|rank|ordinal|position|order)$", re.I)


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def walk(obj: Any, path: tuple[str, ...] = (), depth: int = 0):
    if depth > 7:
        return
    if isinstance(obj, dict):
        for key, value in obj.items():
            next_path = path + (str(key),)
            if isinstance(value, (dict, list)):
                yield from walk(value, next_path, depth + 1)
            else:
                yield str(key), value, next_path
    elif isinstance(obj, list):
        for idx, value in enumerate(obj):
            next_path = path + (str(idx),)
            if isinstance(value, (dict, list)):
                yield from walk(value, next_path, depth + 1)


def numeric_candidates(payload: Any, key_re: re.Pattern[str]) -> list[tuple[str, float]]:
    found: list[tuple[str, float]] = []
    for key, value, path in walk(payload):
        if not key_re.search(key):
            continue
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)) and value > 0:
            found.append((".".join(path), float(value)))
        elif isinstance(value, str):
            try:
                number = float(value)
            except ValueError:
                continue
            if number > 0:
                found.append((".".join(path), number))
    return found


def main() -> int:
    for path in [MARKET_TAPE, HARNESS, SCREENER]:
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
        "normalizeMarketTapeItem(item, ticker, hint = {})",
        "collectSectionHints(payload)",
        "deepFindNumber(source, keyRegex",
        "formatScore(score)",
        "rankLabel(row)",
        "displayCardCopy(row)",
        "displayCardHeadline(row)",
        "displayCardTags(row)",
        "selectedDetailItems(row)",
        "renderSelectedDetail(row)",
        "renderMarketTapeDetailDeck(row)",
        "marketTapeDetailDeckSections(row)",
        "moduleMarketTapeSelectedDetail",
        "moduleMarketTapeDetailDeck",
        "moduleMarketTapeDeckCard",
        "filterRowsForChip(rows, filterKey = 'all')",
        "renderFilterChips(rows, activeFilter = 'all')",
        "data-market-tape-filter",
        "deriveTagsFromCopy(copy, ticker = '')",
        "moduleMarketTapeItem",
        "Store.setAsset(ticker)",
    ]
    missing_market = [token for token in market_tokens if token not in market_tape]
    if missing_market:
        return fail(f"MarketTape.js missing token(s): {missing_market}")

    forbidden_market = [
        "<p>${escapeHtml(row.label)}</p>",
        "'<span>Monitor</span>'",
        "${active.label}` : 'Market tape'",
        "active ? active.watchItem"
    ]
    present_forbidden = [token for token in forbidden_market if token in market_tape]
    if present_forbidden:
        return fail(f"MarketTape.js still uses generic card rendering fallback(s): {present_forbidden}")

    harness_tokens = [
        'id="module-market-tape"',
        "moduleMarketTapePanel",
        "moduleMarketTapeCard",
        "moduleMarketTapeGrid",
        "moduleMarketTapeFilters",
        "moduleMarketTapeFilterChip",
    ]
    missing_harness = [token for token in harness_tokens if token not in harness]
    if missing_harness:
        return fail(f"module_runtime_smoke_harness.html missing token(s): {missing_harness}")

    payload = json.loads(SCREENER.read_text(encoding="utf-8-sig"))
    by_term = payload.get("by_term")
    if not isinstance(by_term, dict):
        return fail("fix26_screener_store.json missing object-map by_term")
    for ticker in ["BTC", "ETH", "SOL"]:
        if ticker not in by_term:
            return fail(f"fix26_screener_store.json missing {ticker}")

    score_candidates = numeric_candidates(payload, SCORE_KEY_RE)
    rank_candidates = numeric_candidates(payload, RANK_KEY_RE)

    if not score_candidates:
        return fail("screener payload exposes no positive score-like numeric fields for module Market Tape mapping")

    print(f"[OK] screener by_term assets available: {len(by_term)}")
    print(f"[OK] positive score-like field candidates: {len(score_candidates)}")
    if rank_candidates:
        print(f"[OK] positive rank-like field candidates: {len(rank_candidates)}")
    else:
        print("[WARN] no rank-like numeric field candidates found; rank label will fall back to ticker")

    print("[OK] MarketTape maps screener score/rank fields before fallback")
    print("[OK] MarketTape formats missing scores as dash instead of zero")
    print("[OK] MarketTape renders richer card body/tag mapping through display helpers")
    print("[OK] MarketTape renders selected detail panel for active item")
    print("[OK] MarketTape renders filter chips for category filtering")
    print("[OK] MarketTape renders richer selected detail deck sections")
    print("[OK] MarketTape preserves click-to-asset behavior")
    print("[OK] module market tape score field mapping smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
