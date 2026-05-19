from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ASSETS = ["BTC", "SOL", "NVDA", "AAPL", "MSFT", "COIN", "ETH", "GLD"]

STRUCTURE_FIELDS = [
    "screener_attention_priority_score",
    "screener_structure_score",
    "structure_score",
    "signal_structure_score",
    "seta_dashboard_summary_score",
    "seta_score",
    "dashboard_score",
]

READOUT_PATHS = [
    "screener.structure_score",
    "screener.structureScore",
    "screener.signal_structure_score",
    "screener.signalStructureScore",
    "screener.screener_attention_priority_score",
    "screener.attention_priority_score",
    "screener.priority_score",
    "screener.priorityScore",
    "archetype.structure_score",
    "archetype.structureScore",
    "archetype.archetype_confidence",
    "archetype.archetypeConfidence",
    "archetype.confidence_score",
    "archetype.confidenceScore",
    "indicators.structure_score",
    "indicators.structureScore",
    "indicators.signal_structure_score",
    "indicators.signalStructureScore",
    "structure_score",
    "structureScore",
    "signal_structure_score",
    "signalStructureScore",
    "screener_attention_priority_score",
    "attention_priority_score",
    "priority_score",
    "priorityScore",
    "score",
]


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def path_value(source: dict[str, Any], path: str) -> Any:
    cursor: Any = source
    for key in path.split("."):
        if isinstance(cursor, dict) and key in cursor:
            cursor = cursor[key]
        else:
            return None
    return cursor


def first_chart_score(row: dict[str, Any]) -> tuple[str | None, float | None]:
    for field in STRUCTURE_FIELDS:
        value = as_float(row.get(field))
        if value is not None:
            return field, value
    return None, None


def first_readout_score(item: dict[str, Any]) -> tuple[str | None, float | None]:
    for path in READOUT_PATHS:
        value = as_float(path_value(item, path))
        if value is not None:
            return path, value
    return None, None


def load_chart_rows(asset: str) -> list[dict[str, Any]]:
    candidates = [
        Path(f"fix26_chart_store_assets/public/{asset}.json"),
        Path(f"fix26_chart_store_assets/member/{asset}.json"),
    ]

    for path in candidates:
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            rows = data.get("D", {}).get(asset) or data.get("rows") or []
            if rows:
                return rows

    store = Path("fix26_chart_store_public.json")
    if store.exists():
        data = json.loads(store.read_text(encoding="utf-8"))
        rows = data.get("D", {}).get(asset) or data.get(asset) or []
        if rows:
            return rows

    return []


def load_screener_items() -> dict[str, dict[str, Any]]:
    path = Path("fix26_screener_store.json")
    if not path.exists():
        fail("missing fix26_screener_store.json")

    data = json.loads(path.read_text(encoding="utf-8"))
    by_term = data.get("by_term") or data.get("byTerm") or data.get("assets") or data.get("terms") or {}

    if not isinstance(by_term, dict):
        fail("fix26_screener_store.json by_term is not an object")

    return {str(key).upper(): value for key, value in by_term.items() if isinstance(value, dict)}


def main() -> int:
    renderer = Path("src/PlotlyRenderer.js").read_text(encoding="utf-8")
    for token in [
        "function currentStructureReadoutScore(state = {})",
        "function structureScoreForStripRow(row = {}, index = 0, rows = [], state = {})",
        "buildStructureScoreStripHoverTrace(source, state)",
        "buildStructureScoreStripShapes(rows, priceDomain, state)",
    ]:
        if token not in renderer:
            fail(f"renderer missing override token: {token}")
    ok("renderer has latest current-readout override path")

    screener_items = load_screener_items()
    readout_count = 0
    checked = 0

    for asset in ASSETS:
        rows = load_chart_rows(asset)
        item = screener_items.get(asset)

        if not rows or not item:
            print(f"[SKIP] {asset}: missing chart rows or screener item")
            continue

        chart_field, chart_score = first_chart_score(rows[-1])
        readout_path, readout_score = first_readout_score(item)

        if chart_field is None or chart_score is None:
            fail(f"{asset}: latest chart row has no Structure Score candidate field")

        if readout_path is None or readout_score is None:
            print(f"[INFO] {asset}: no readout score found; latest strip will use chart row {chart_field}={chart_score:.1f}")
        else:
            print(
                f"[OK] {asset}: chart_latest={chart_field}:{chart_score:.1f}; "
                f"current_readout={readout_path}:{readout_score:.1f}; latest strip override active"
            )
            readout_count += 1

        checked += 1

    if checked < 4:
        fail(f"too few assets checked: {checked}")
    if readout_count < 4:
        fail(f"too few current readout scores available: {readout_count}")

    ok(f"Structure strip alignment checked for {checked} assets; {readout_count} have current readout overrides")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
