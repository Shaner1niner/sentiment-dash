from __future__ import annotations

import json
from pathlib import Path
from typing import Any

STRUCTURE_FIELDS = [
    "screener_attention_priority_score",
    "screener_structure_score",
    "structure_score",
    "signal_structure_score",
    "seta_dashboard_summary_score",
    "seta_score",
    "dashboard_score",
]

ASSETS = ["BTC", "SOL", "NVDA", "AAPL", "MSFT", "COIN", "ETH", "GLD"]


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


def first_score(row: dict[str, Any]) -> tuple[str | None, float | None]:
    for field in STRUCTURE_FIELDS:
        value = as_float(row.get(field))
        if value is not None:
            return field, value
    return None, None


def load_chart_rows(asset: str) -> list[dict[str, Any]]:
    candidates = [
        Path(f"fix26_chart_store_assets/public/{asset}.json"),
        Path(f"fix26_chart_store_assets/member/{asset}.json"),
    ]

    for path in candidates:
        if not path.exists():
            continue

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


def main() -> int:
    checked = 0

    for asset in ASSETS:
        rows = load_chart_rows(asset)
        if not rows:
            print(f"[SKIP] {asset}: no chart rows")
            continue

        latest = rows[-1]
        field, score = first_score(latest)

        if field is None or score is None:
            fail(f"{asset}: latest chart row has no Structure Score candidate field")

        print(f"[OK] {asset}: latest strip source={field} score={score:.1f} date={latest.get('date')}")
        checked += 1

        if field not in {"screener_attention_priority_score", "screener_structure_score", "structure_score", "signal_structure_score"}:
            fail(
                f"{asset}: strip source is still falling back to dashboard-summary field {field}; "
                "expected screener/current readout score source when available"
            )

    if checked < 4:
        fail(f"too few assets checked: {checked}")

    ok(f"Structure strip source alignment checked for {checked} assets")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
