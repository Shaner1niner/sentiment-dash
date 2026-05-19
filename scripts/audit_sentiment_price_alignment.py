from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ASSET_DIR = ROOT / "fix26_chart_store_assets" / "public"

PRICE_FIELDS = [
    "close",
    "Close",
    "price",
    "last_price",
    "adj_close",
]

SCALED_SENTIMENT_FIELDS = [
    "scaled_combined_compound_ma_21",
    "scaled_sentiment_ma_21",
    "sentiment_price_ma_21",
    "scaled_sentiment_pressure_ma_21",
]

RAW_SENTIMENT_FIELDS = [
    "combined_compound_ma_21",
    "sentiment_ma_21",
    "weighted_sentiment_ma_21",
    "sentiment_pressure_ma_21",
]


def as_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number:
        return None
    return number


def first_float(row: dict[str, Any], fields: list[str]) -> float | None:
    for field in fields:
        number = as_float(row.get(field))
        if number is not None:
            return number
    return None


def first_text(row: dict[str, Any], fields: list[str]) -> str:
    for field in fields:
        value = row.get(field)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def load_rows(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    term = path.stem.upper()

    if isinstance(payload, list):
        return [row for row in payload if isinstance(row, dict)]

    if isinstance(payload, dict):
        d_payload = payload.get("D")
        if isinstance(d_payload, dict):
            rows = d_payload.get(term) or d_payload.get(path.stem)
            if isinstance(rows, list):
                return [row for row in rows if isinstance(row, dict)]

        for key in ("rows", "data", "chartRows"):
            rows = payload.get(key)
            if isinstance(rows, list):
                return [row for row in rows if isinstance(row, dict)]

    return []


def classify_alignment(gap_pct: float) -> str:
    if gap_pct >= 3:
        return "Sentiment premium"
    if gap_pct >= 1:
        return "Mild sentiment premium"
    if gap_pct <= -3:
        return "Price premium"
    if gap_pct <= -1:
        return "Mild price premium"
    return "Aligned"


def comparable_points(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    points: list[dict[str, Any]] = []

    for row in rows:
        price = first_float(row, PRICE_FIELDS)
        scaled_sentiment = first_float(row, SCALED_SENTIMENT_FIELDS)

        if price is None or scaled_sentiment is None or abs(price) < 1e-9:
            continue

        gap_pct = ((scaled_sentiment - price) / abs(price)) * 100
        points.append(
            {
                "date": first_text(row, ["date", "Date", "datetime", "timestamp"]) or "unknown",
                "price": price,
                "scaled_sentiment": scaled_sentiment,
                "raw_sentiment": first_float(row, RAW_SENTIMENT_FIELDS),
                "gap_pct": gap_pct,
                "label": classify_alignment(gap_pct),
            }
        )

    return points


def audit_asset(path: Path, min_points: int) -> tuple[bool, str]:
    term = path.stem.upper()
    rows = load_rows(path)
    points = comparable_points(rows)

    if len(points) < min_points:
        return False, f"{term:<6} FAIL comparable_points={len(points)} min_points={min_points}"

    latest = points[-1]
    counts: dict[str, int] = {}
    for point in points:
        counts[point["label"]] = counts.get(point["label"], 0) + 1

    avg_gap = sum(point["gap_pct"] for point in points) / len(points)
    min_gap = min(point["gap_pct"] for point in points)
    max_gap = max(point["gap_pct"] for point in points)

    distribution = ", ".join(
        f"{label}={count}"
        for label, count in sorted(counts.items(), key=lambda item: item[0])
    )

    raw = latest["raw_sentiment"]
    raw_text = "n/a" if raw is None else f"{raw:.3f}"

    message = (
        f"{term:<6} OK points={len(points):>3} "
        f"latest={latest['label']} ({latest['gap_pct']:+.1f}% scaled) "
        f"raw={raw_text} avg_gap={avg_gap:+.1f}% range=[{min_gap:+.1f}, {max_gap:+.1f}] "
        f"dist: {distribution}"
    )
    return True, message


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit Sentiment-Price Alignment hover taxonomy across public assets."
    )
    parser.add_argument("--asset", help="Optional single asset symbol, e.g. BTC")
    parser.add_argument("--min-points", type=int, default=20)
    args = parser.parse_args()

    if not PUBLIC_ASSET_DIR.exists():
        print(f"[FAIL] missing public asset directory: {PUBLIC_ASSET_DIR}")
        return 1

    paths = sorted(PUBLIC_ASSET_DIR.glob("*.json"))
    if args.asset:
        wanted = args.asset.upper()
        paths = [path for path in paths if path.stem.upper() == wanted]

    if not paths:
        print("[FAIL] no public asset payloads matched")
        return 1

    print("Sentiment-Price Alignment audit")
    print(f"assets={len(paths)} min_points={args.min_points}")
    print("-" * 120)

    failures = 0
    for path in paths:
        ok, message = audit_asset(path, args.min_points)
        print(message)
        if not ok:
            failures += 1

    print("-" * 120)
    if failures:
        print(f"[FAIL] assets failed={failures}")
        return 1

    print("[OK] Sentiment-Price Alignment audit passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
