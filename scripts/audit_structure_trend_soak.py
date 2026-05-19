from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_TERMS = ["BTC", "ETH", "MSFT", "COIN", "NVDA", "SOL", "AAPL", "GLD"]


def parse_time(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def as_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except Exception:
        return None


def score_label(score: float | None) -> str:
    if score is None:
        return ""
    if score >= 75:
        return "Strong"
    if score >= 50:
        return "Mixed"
    return "Weak"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise SystemExit(f"[FAIL] missing {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise SystemExit(f"[FAIL] {path} is not a JSON object")
    return data


def source_score(row: dict[str, Any]) -> float | None:
    screener = row.get("screener") if isinstance(row.get("screener"), dict) else {}
    archetype = row.get("archetype") if isinstance(row.get("archetype"), dict) else {}
    indicators = row.get("indicators") if isinstance(row.get("indicators"), dict) else {}

    for obj in [screener, archetype, indicators, row]:
        for key in [
            "structure_score",
            "structureScore",
            "signal_structure_score",
            "signalStructureScore",
            "screener_attention_priority_score",
            "attention_priority_score",
            "priority_score",
            "priorityScore",
            "score",
        ]:
            value = as_float(obj.get(key))
            if value is not None:
                return value

    return None


def summarize_term(term: str, history: dict[str, Any], screener_store: dict[str, Any], min_points: int) -> tuple[bool, str]:
    points = history.get("points_by_term", {}).get(term, [])
    if not isinstance(points, list) or not points:
        return False, f"{term:>5}  FAIL  no history points"

    parsed = []
    seen = set()

    for point in points:
        if not isinstance(point, dict):
            return False, f"{term:>5}  FAIL  non-object point"

        ts = point.get("as_of_utc")
        score = as_float(point.get("structure_score"))
        dt = parse_time(ts)

        if not ts or not dt:
            return False, f"{term:>5}  FAIL  invalid timestamp: {ts}"

        if ts in seen:
            return False, f"{term:>5}  FAIL  duplicate timestamp: {ts}"

        if score is None:
            return False, f"{term:>5}  FAIL  missing numeric structure_score"

        seen.add(ts)
        parsed.append((dt, score, point))

    parsed.sort(key=lambda item: item[0])
    first_dt, first_score, _ = parsed[0]
    latest_dt, latest_score, latest_point = parsed[-1]
    delta = latest_score - first_score
    window_hours = max(0.0, (latest_dt - first_dt).total_seconds() / 3600)

    latest_by_term = history.get("latest_by_term", {}).get(term, {})
    latest_payload_score = as_float(latest_by_term.get("structure_score")) if isinstance(latest_by_term, dict) else None

    screener_row = screener_store.get("by_term", {}).get(term, {})
    screener_score = source_score(screener_row) if isinstance(screener_row, dict) else None

    warnings = []

    if len(parsed) < min_points:
        warnings.append(f"only {len(parsed)} point(s)")

    if latest_payload_score is not None and abs(latest_payload_score - latest_score) > 0.05:
        warnings.append(f"latest_by_term mismatch {latest_payload_score:.1f}")

    if screener_score is not None and abs(screener_score - latest_score) > 0.05:
        warnings.append(f"screener mismatch {screener_score:.1f}")

    sign = "+" if delta > 0 else ""
    status = "WARN" if warnings else "OK"
    warning_text = f"  [{' ; '.join(warnings)}]" if warnings else ""

    return True, (
        f"{term:>5}  {status:<4}  "
        f"pts={len(parsed):>2}  window={window_hours:>4.1f}h  "
        f"latest={latest_score:>5.1f} {score_label(latest_score):<6}  "
        f"delta={sign}{delta:>5.1f}  "
        f"{latest_point.get('as_of_utc')}{warning_text}"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Structure Score trend soak health.")
    parser.add_argument("--history", default="fix26_structure_score_history.json")
    parser.add_argument("--screener", default="fix26_screener_store.json")
    parser.add_argument("--terms", nargs="*", default=DEFAULT_TERMS)
    parser.add_argument("--min-points", type=int, default=2)
    args = parser.parse_args()

    history = load_json(Path(args.history))
    screener_store = load_json(Path(args.screener))

    print("Structure Trend Soak Audit")
    print("=" * 80)
    print(f"snapshot_hour_utc: {history.get('snapshot_hour_utc')}")
    print(f"retention_hours:   {history.get('retention_hours')}")
    print(f"asset_count:       {history.get('asset_count')}")
    print("=" * 80)

    hard_fail = False

    for raw_term in args.terms:
        term = str(raw_term).strip().upper()
        ok, line = summarize_term(term, history, screener_store, args.min_points)
        print(line)
        if not ok:
            hard_fail = True

    print("=" * 80)

    if hard_fail:
        raise SystemExit("[FAIL] structure trend soak audit found hard failures")

    print("[OK] structure trend soak audit completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
