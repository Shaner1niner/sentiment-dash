#!/usr/bin/env python
"""
Build Fix 26 enhanced screener store JSON.

Reads:
  seta_market_screener_365d.json or .csv
  seta_signal_archetypes_365d.json or .csv
  seta_indicator_matrix_365d.json or .csv

Writes:
  fix26_screener_store.json

The output is one website-friendly payload with:
  sections[]
  records[]
  by_term[TERM].screener
  by_term[TERM].archetype
  by_term[TERM].indicator_families
  by_term[TERM].indicators
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


SCREENER_BASE = "seta_market_screener_365d"
ARCHETYPE_BASE = "seta_signal_archetypes_365d"
INDICATOR_BASE = "seta_indicator_matrix_365d"


def clean_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, (int, bool)):
        return value
    if isinstance(value, str):
        s = value.strip()
        if s == "" or s.lower() in {"nan", "none", "null", "nat"}:
            return None
        try:
            if any(ch in s for ch in [".", "e", "E"]):
                f = float(s)
                return f if math.isfinite(f) else None
            return int(s)
        except Exception:
            return s
    if isinstance(value, list):
        return [clean_value(v) for v in value]
    if isinstance(value, dict):
        return {str(k): clean_value(v) for k, v in value.items()}
    return value


def clean_record(record: Dict[str, Any]) -> Dict[str, Any]:
    return {str(k): clean_value(v) for k, v in record.items()}


def read_json_records(path: Path) -> List[Dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return [clean_record(r) for r in data if isinstance(r, dict)]
    if isinstance(data, dict):
        records = data.get("records")
        if isinstance(records, list):
            return [clean_record(r) for r in records if isinstance(r, dict)]
        if all(isinstance(v, dict) for v in data.values()):
            return [clean_record(v) for v in data.values()]
    raise ValueError(f"Could not find records in JSON file: {path}")


def read_csv_records(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return [clean_record(r) for r in csv.DictReader(f)]


def read_records(source_dir: Path, base_name: str) -> List[Dict[str, Any]]:
    json_path = source_dir / f"{base_name}.json"
    csv_path = source_dir / f"{base_name}.csv"
    if json_path.exists():
        return read_json_records(json_path)
    if csv_path.exists():
        return read_csv_records(csv_path)
    raise FileNotFoundError(f"Missing {base_name}.json or {base_name}.csv in {source_dir}")


def term_of(row: Dict[str, Any]) -> str:
    return str(row.get("term") or row.get("asset") or "").strip().upper()


def num(row: Dict[str, Any], key: str, default: Optional[float] = None) -> Optional[float]:
    value = row.get(key)
    if value is None:
        return default
    try:
        f = float(value)
        return f if math.isfinite(f) else default
    except Exception:
        return default


def text(row: Dict[str, Any], key: str, default: str = "") -> str:
    value = row.get(key)
    return default if value is None else str(value)


def sort_by_priority(records: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(
        records,
        key=lambda r: (
            -(num(r, "screener_attention_priority_score", -9999) or -9999),
            int(num(r, "screener_attention_priority_rank", 999999) or 999999),
            term_of(r),
        ),
    )


def top_n(records: Iterable[Dict[str, Any]], n: int) -> List[Dict[str, Any]]:
    return sort_by_priority(records)[:n]


def direction(row: Dict[str, Any]) -> str:
    return (
        text(row, "archetype_direction")
        or text(row, "signal_consensus_direction_label")
        or text(row, "latest_event_direction")
        or "Mixed"
    )


def primary_archetype(row: Dict[str, Any]) -> str:
    return text(row, "primary_archetype") or "Monitor"


def action_bucket(row: Dict[str, Any]) -> str:
    return text(row, "screener_action_bucket") or primary_archetype(row)


def is_bullish(row: Dict[str, Any]) -> bool:
    d = direction(row).lower()
    return "bull" in d and "bear" not in d


def is_bearish(row: Dict[str, Any]) -> bool:
    return "bear" in direction(row).lower()


def has_fresh_confirmed(row: Dict[str, Any]) -> bool:
    if action_bucket(row).lower() == "fresh confirmed event":
        return True
    days = num(row, "days_since_latest_confirmed")
    return days is not None and days <= 7


def has_watch_cluster(row: Dict[str, Any]) -> bool:
    hay = " ".join([primary_archetype(row), text(row, "secondary_archetype")]).lower()
    if "watch cluster" in hay:
        return True
    recent_watch = num(row, "recent_watch_count_7d", 0) or 0
    recent_confirmed = num(row, "recent_confirmed_count_7d", 0) or 0
    return recent_watch >= 3 and recent_confirmed == 0


def has_narrative_divergence(row: Dict[str, Any]) -> bool:
    hay = " ".join(
        [
            primary_archetype(row),
            text(row, "secondary_archetype"),
            text(row, "macd_family_label"),
            text(row, "sent_price_macd_joint_slope_label"),
            text(row, "screener_reason_summary"),
        ]
    ).lower()
    return any(
        phrase in hay
        for phrase in [
            "narrative deterioration",
            "narrative weakening",
            "sentiment deteriorating",
            "negative divergence",
        ]
    )


def has_sentiment_repair(row: Dict[str, Any]) -> bool:
    hay = " ".join(
        [
            primary_archetype(row),
            text(row, "secondary_archetype"),
            text(row, "macd_family_label"),
            text(row, "sent_price_macd_joint_slope_label"),
        ]
    ).lower()
    return "sentiment repair" in hay or "positive divergence" in hay


def high_conflict(row: Dict[str, Any]) -> bool:
    dispersion = num(row, "signal_dispersion_score", 0) or 0
    return dispersion >= 20 or bool(num(row, "reason_high_dispersion", 0))


def quiet_or_monitor(row: Dict[str, Any]) -> bool:
    hay = " ".join(
        [
            primary_archetype(row),
            text(row, "secondary_archetype"),
            action_bucket(row),
            text(row, "screener_reason_summary"),
        ]
    ).lower()
    return "quiet" in hay or "monitor" in hay


def build_sections(screener_records: List[Dict[str, Any]], n: int) -> Dict[str, List[Dict[str, Any]]]:
    return {
        "top_priority": top_n(screener_records, n),
        "fresh_confirmed": top_n((r for r in screener_records if has_fresh_confirmed(r)), n),
        "watch_clusters": top_n((r for r in screener_records if has_watch_cluster(r)), n),
        "narrative_divergence": top_n((r for r in screener_records if has_narrative_divergence(r)), n),
        "sentiment_repair": top_n((r for r in screener_records if has_sentiment_repair(r)), n),
        "bullish_setups": top_n((r for r in screener_records if is_bullish(r)), n),
        "bearish_setups": top_n((r for r in screener_records if is_bearish(r)), n),
        "high_conflict": top_n((r for r in screener_records if high_conflict(r)), n),
        "quiet_monitor": top_n((r for r in screener_records if quiet_or_monitor(r)), n),
    }


def summarize_indicator_families(indicators: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_family: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in indicators:
        by_family[text(row, "indicator_family", "Other")].append(row)

    priority_names = {
        "Summary": ["signal_consensus_direction_score", "signal_consensus_confidence_score", "signal_dispersion_score"],
        "Bollinger / Overlap": ["attention_adjusted_bollinger_score", "bollinger_direction_score", "bollinger_confidence_score", "bollinger_watch_cluster_score"],
        "MACD": ["macd_family_direction_score", "price_macd_direction_score", "sentiment_macd_direction_score", "sent_price_macd_joint_slope_score", "sent_price_macd_crossover_score"],
        "RSI": ["rsi_family_state_score", "price_rsi_state_score", "sentiment_rsi_state_score", "sent_price_rsi_relationship_score", "stoch_rsi_timing_score"],
        "Sentiment Ribbon": ["sent_ribbon_direction_score", "sent_ribbon_structure_score", "sent_ribbon_transition_risk_score"],
        "MA Trend": ["ma_trend_direction_score"],
        "Attention": ["attention_participation_score", "attention_confirmation_score"],
    }

    out: List[Dict[str, Any]] = []
    for fam, rows in by_family.items():
        preferred = priority_names.get(fam, [])
        primary = None
        for name in preferred:
            primary = next((r for r in rows if text(r, "indicator_name") == name), None)
            if primary:
                break
        if primary is None:
            primary = sorted(
                rows,
                key=lambda r: (
                    abs(num(r, "contribution_to_consensus", 0) or 0),
                    abs((num(r, "score_0_100", 50) or 50) - 50),
                ),
                reverse=True,
            )[0]

        top_rows = sorted(
            rows,
            key=lambda r: (
                abs(num(r, "contribution_to_consensus", 0) or 0),
                abs(num(r, "contribution_to_attention_priority", 0) or 0),
                abs((num(r, "score_0_100", 50) or 50) - 50),
            ),
            reverse=True,
        )[:5]

        out.append(
            {
                "indicator_family": fam,
                "primary_indicator": text(primary, "indicator_name"),
                "score_0_100": num(primary, "score_0_100"),
                "direction_label": text(primary, "direction_label", "n/a"),
                "strength_label": text(primary, "strength_label", "n/a"),
                "confidence_label": text(primary, "confidence_label", "n/a"),
                "interpretation": text(primary, "interpretation"),
                "top_indicators": top_rows,
            }
        )

    family_order = {"Summary": 0, "Bollinger / Overlap": 1, "MACD": 2, "RSI": 3, "Sentiment Ribbon": 4, "MA Trend": 5, "Attention": 6}
    return sorted(out, key=lambda r: (family_order.get(text(r, "indicator_family"), 99), text(r, "indicator_family")))


def compact_screener_record(row: Dict[str, Any]) -> Dict[str, Any]:
    keep = [
        "screener_attention_priority_rank", "term", "asset_universe", "primary_sector",
        "screener_attention_priority_score", "screener_action_bucket", "primary_archetype",
        "secondary_archetype", "archetype_direction", "archetype_confidence", "archetype_summary",
        "archetype_risk_note", "screener_reason_summary", "signal_consensus_direction_score",
        "signal_consensus_direction_label", "signal_dispersion_score", "signal_consensus_confidence_score",
        "latest_data_date", "latest_close", "latest_event_tier", "latest_event_direction",
        "latest_event_quality_score", "latest_event_dashboard_summary_label", "latest_confirmed_event_date",
        "latest_confirmed_event_direction", "latest_confirmed_quality_score",
        "latest_confirmed_dashboard_summary_label", "days_since_latest_event", "days_since_latest_confirmed",
        "bollinger_direction_score", "bollinger_confidence_score", "bollinger_watch_cluster_score",
        "attention_adjusted_bollinger_score", "price_macd_direction_score", "sentiment_macd_direction_score",
        "sent_price_macd_crossover_score", "sent_price_macd_joint_slope_score",
        "sent_price_macd_joint_slope_label", "macd_family_direction_score", "macd_family_label",
        "rsi_family_state_score", "rsi_family_label", "sent_ribbon_direction_score",
        "sent_ribbon_structure_score", "sent_ribbon_label", "ma_trend_direction_score",
        "attention_participation_score", "attention_confirmation_score", "recent_watch_count_7d",
        "recent_confirmed_count_7d", "reason_fresh_confirmed_event", "reason_high_attention",
        "reason_bollinger_extreme", "reason_macd_improving", "reason_sentiment_momentum",
        "reason_low_dispersion", "reason_high_dispersion", "reason_stale_event",
        "reason_conflicted_signals", "matched_conditions", "missing_confirmations", "all_matched_archetypes",
    ]
    return {k: row.get(k) for k in keep if k in row}


def build_store(source_dir: Path, max_section_rows: int) -> Dict[str, Any]:
    screener_records = sort_by_priority(read_records(source_dir, SCREENER_BASE))
    archetype_records = read_records(source_dir, ARCHETYPE_BASE)
    indicator_records = read_records(source_dir, INDICATOR_BASE)

    archetype_by_term = {term_of(r): r for r in archetype_records if term_of(r)}
    indicators_by_term: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in indicator_records:
        t = term_of(row)
        if t:
            indicators_by_term[t].append(row)

    by_term: Dict[str, Dict[str, Any]] = {}
    for row in screener_records:
        t = term_of(row)
        if not t:
            continue
        indicators = indicators_by_term.get(t, [])
        by_term[t] = {
            "screener": row,
            "archetype": archetype_by_term.get(t),
            "indicator_families": summarize_indicator_families(indicators) if indicators else [],
            "indicators": indicators,
        }

    sections_full = build_sections(screener_records, max_section_rows)
    sections_compact = {key: [compact_screener_record(r) for r in rows] for key, rows in sections_full.items()}
    latest_dates = sorted({str(r.get("latest_data_date")) for r in screener_records if r.get("latest_data_date")})

    return {
        "dataset": "fix26_screener_store",
        "model_version": "phase_g_market_tape_v1",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_dir": str(source_dir),
        "source_files": {
            "screener": f"{SCREENER_BASE}.json/.csv",
            "archetypes": f"{ARCHETYPE_BASE}.json/.csv",
            "indicators": f"{INDICATOR_BASE}.json/.csv",
        },
        "row_counts": {
            "screener": len(screener_records),
            "archetypes": len(archetype_records),
            "indicators": len(indicator_records),
            "terms": len(by_term),
        },
        "latest_data_date": latest_dates[-1] if latest_dates else None,
        "sections": sections_compact,
        "top_priority": sections_compact["top_priority"],
        "top_bullish": sections_compact["bullish_setups"],
        "top_bearish": sections_compact["bearish_setups"],
        "fresh_confirmed": sections_compact["fresh_confirmed"],
        "watch_cluster_building": sections_compact["watch_clusters"],
        "records": [compact_screener_record(r) for r in screener_records],
        "by_term": by_term,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--output-filename", default="fix26_screener_store.json")
    parser.add_argument("--max-section-rows", type=int, default=12)
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()

    source_dir = Path(args.source_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    store = build_store(source_dir, max_section_rows=args.max_section_rows)
    out_path = output_dir / args.output_filename
    out_path.write_text(
        json.dumps(store, ensure_ascii=False, indent=2 if args.pretty else None, separators=None if args.pretty else (",", ":")),
        encoding="utf-8",
    )

    print(f"[OK] wrote {out_path}")
    print(f"[OK] records={store['row_counts']['screener']} terms={store['row_counts']['terms']} archetypes={store['row_counts']['archetypes']} indicators={store['row_counts']['indicators']}")
    print("[OK] top priority:")
    for row in store["sections"].get("top_priority", [])[:10]:
        print(f"      {str(row.get('term') or ''):<8} {float(row.get('screener_attention_priority_score') or 0):>6.1f}  {str(row.get('screener_action_bucket') or row.get('primary_archetype') or '')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
