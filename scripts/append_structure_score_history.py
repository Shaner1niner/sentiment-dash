from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "structure_score_history_v1"


def utc_hour_now() -> datetime:
    return datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)


def iso_z(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def as_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return round(float(value), 4)
    except (TypeError, ValueError):
        return None


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    return " ".join(text.split())


def first_value(*objects: dict[str, Any], keys: list[str]) -> Any:
    for obj in objects:
        if not isinstance(obj, dict):
            continue
        for key in keys:
            if key in obj and obj.get(key) not in (None, ""):
                return obj.get(key)
    return None


def structure_quality_label(score: float | None) -> str:
    if score is None:
        return ""
    if score >= 67:
        return "Strong"
    if score >= 34:
        return "Mixed"
    return "Weak"


def row_sources(row: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    source = row.get("source") if isinstance(row.get("source"), dict) else {}

    screener = row.get("screener")
    if not isinstance(screener, dict):
        screener = (
            source.get("screener")
            or source.get("scorecard")
            or source.get("market_tape")
            or {}
        )

    archetype = row.get("archetype")
    if not isinstance(archetype, dict):
        archetype = (
            source.get("archetype")
            or source.get("market_tape_family")
            or source.get("family")
            or {}
        )

    indicators = row.get("indicators")
    if not isinstance(indicators, dict):
        indicators = (
            source.get("indicators")
            or source.get("indicator_payload")
            or source.get("indicator")
            or {}
        )

    return screener or {}, archetype or {}, indicators or {}


def extract_point(term: str, row: dict[str, Any], as_of_utc: str) -> dict[str, Any] | None:
    screener, archetype, indicators = row_sources(row)

    structure_score = as_float(first_value(
        screener,
        archetype,
        indicators,
        row,
        keys=[
            "structure_score",
            "structureScore",
            "signal_structure_score",
            "signalStructureScore",
            "screener_attention_priority_score",
            "attention_priority_score",
            "priority_score",
            "priorityScore",
            "score",
        ],
    ))

    if structure_score is None:
        return None

    structure_label = clean_text(first_value(
        screener,
        archetype,
        indicators,
        row,
        keys=[
            "structure_label",
            "structureLabel",
            "signal_structure_label",
            "signalStructureLabel",
            "strength_label",
            "strengthLabel",
            "confidence_label",
            "confidenceLabel",
        ],
    )) or structure_quality_label(structure_score)

    direction_score = as_float(first_value(
        screener,
        archetype,
        indicators,
        row,
        keys=[
            "signal_consensus_direction_score",
            "direction_score",
            "directionScore",
            "signalDirectionScore",
            "signal_direction_score",
        ],
    ))

    direction_label = clean_text(first_value(
        screener,
        archetype,
        indicators,
        row,
        keys=[
            "signal_consensus_direction_label",
            "direction_label",
            "directionLabel",
            "signalDirectionLabel",
            "signal_direction_label",
        ],
    ))

    rank = clean_text(first_value(
        screener,
        row,
        keys=["rank", "market_rank", "marketRank", "rank_label", "rankLabel"],
    ))

    return {
        "as_of_utc": as_of_utc,
        "term": term,
        "structure_score": structure_score,
        "structure_label": structure_label,
        "direction_score": direction_score,
        "direction_label": direction_label,
        "rank": rank,
    }


def parse_time(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def load_existing(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def append_history(input_path: Path, output_path: Path, retention_hours: int) -> dict[str, Any]:
    screener_store = json.loads(input_path.read_text(encoding="utf-8"))
    by_term = screener_store.get("by_term", {})
    if not isinstance(by_term, dict) or not by_term:
        raise RuntimeError(f"No by_term map found in {input_path}")

    now = utc_hour_now()
    as_of_utc = iso_z(now)
    cutoff = now - timedelta(hours=retention_hours)

    existing = load_existing(output_path)
    points_by_term = existing.get("points_by_term", {})
    if not isinstance(points_by_term, dict):
        points_by_term = {}

    latest_by_term: dict[str, dict[str, Any]] = {}
    appended = 0
    skipped = 0

    for term, row in sorted(by_term.items()):
        if not isinstance(row, dict):
            skipped += 1
            continue

        term = clean_text(term).upper()
        point = extract_point(term, row, as_of_utc)
        if not point:
            skipped += 1
            continue

        prior = points_by_term.get(term, [])
        if not isinstance(prior, list):
            prior = []

        kept = []
        for item in prior:
            if not isinstance(item, dict):
                continue
            item_time = parse_time(clean_text(item.get("as_of_utc")))
            if not item_time or item_time < cutoff:
                continue
            if clean_text(item.get("as_of_utc")) == as_of_utc:
                continue
            kept.append(item)

        kept.append(point)
        kept.sort(key=lambda item: clean_text(item.get("as_of_utc")))

        points_by_term[term] = kept
        latest_by_term[term] = point
        appended += 1

    payload = {
        "schema_version": SCHEMA_VERSION,
        "generated_at_utc": iso_z(datetime.now(timezone.utc)),
        "snapshot_hour_utc": as_of_utc,
        "retention_hours": retention_hours,
        "source_file": input_path.name,
        "asset_count": len(latest_by_term),
        "points_by_term": points_by_term,
        "latest_by_term": latest_by_term,
    }

    output_path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"[OK] wrote {output_path}")
    print(f"[OK] snapshot_hour_utc={as_of_utc}")
    print(f"[OK] assets appended={appended}, skipped={skipped}")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Append hourly Structure Score snapshots.")
    parser.add_argument("--input", default="fix26_screener_store.json")
    parser.add_argument("--output", default="fix26_structure_score_history.json")
    parser.add_argument("--retention-hours", type=int, default=48)
    args = parser.parse_args()

    append_history(Path(args.input), Path(args.output), args.retention_hours)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
