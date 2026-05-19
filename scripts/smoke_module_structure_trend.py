from __future__ import annotations

import json
from pathlib import Path


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


history_path = Path("fix26_structure_score_history.json")
market_tape_path = Path("src/features/MarketTape.js")
store_path = Path("src/Store.js")
public_embed_path = Path("interactive_dashboard_fix24_public_embed.html")

for path in [history_path, market_tape_path, store_path, public_embed_path]:
    if not path.exists():
        fail(f"missing {path}")
    ok(f"found {path}")

history = json.loads(history_path.read_text(encoding="utf-8"))
points_by_term = history.get("points_by_term", {})

if not isinstance(points_by_term, dict) or not points_by_term:
    fail("points_by_term missing or empty")

for term in ["BTC", "ETH", "MSFT"]:
    points = points_by_term.get(term, [])
    if len(points) < 2:
        fail(f"{term} has fewer than 2 real structure history points")
ok("required assets have at least 2 real structure history points")

market_tape = market_tape_path.read_text(encoding="utf-8")
for token in [
    "STRUCTURE_HISTORY_CACHE_TOKEN",
    "fix26_structure_score_history.json",
    "function renderStructureTrend(row)",
    "moduleMarketTapeTrendWidget",
    "Store.on('structureScoreHistoryUpdated'",
]:
    if token not in market_tape:
        fail(f"MarketTape.js missing token: {token}")
ok("MarketTape.js includes structure trend loader/render path")

store = store_path.read_text(encoding="utf-8")
for token in ["structureScoreHistory", "setStructureScoreHistory", "structureScoreHistoryUpdated"]:
    if token not in store:
        fail(f"Store.js missing token: {token}")
ok("Store.js includes structure history state")

public_embed = public_embed_path.read_text(encoding="utf-8")
for token in ["module_structure_trend_001", "moduleMarketTapeTrendWidget", "moduleMarketTapeTrendBody"]:
    if token not in public_embed:
        fail(f"public embed missing token: {token}")
ok("public embed includes structure trend CSS and cache token")
