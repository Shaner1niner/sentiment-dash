from __future__ import annotations

"""
Build lightweight Fix26 screener JSON payload for the website dashboard.

Input:
  - seta_market_screener_365d.csv, usually from G:\My Drive\Tableau_AutoSync

Output:
  - fix26_screener_store.json, usually into the sentiment-dash repo root

Design:
  - Keep website payload small and dashboard-friendly.
  - Preserve the full CSVs for Tableau / detailed analysis.
  - Include enough fields for a Top Priority / Bullish / Bearish / Fresh Confirmed panel.
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DEFAULT_SOURCE_DIR = Path(r"G:\My Drive\Tableau_AutoSync")
DEFAULT_OUTPUT_DIR = Path(r"C:\Users\shane\sentiment-dash")
DEFAULT_INPUT_FILENAME = "seta_market_screener_365d.csv"
DEFAULT_OUTPUT_FILENAME = "fix26_screener_store.json"
PAYLOAD_VERSION = "fix26_screener_store_v1_2026_04_25"


def n(v: Any, default: float = np.nan) -> float:
    try:
        if v is None or pd.isna(v):
            return default
        x = float(v)
        return x if np.isfinite(x) else default
    except Exception:
        return default


def s(v: Any, default: str = "") -> str:
    if v is None:
        return default
    try:
        if pd.isna(v):
            return default
    except Exception:
        pass
    return str(v)


def clean_json_value(v: Any) -> Any:
    """Convert pandas/numpy values into JSON-safe native values."""
    if v is None:
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        if np.isnan(v) or np.isinf(v):
            return None
        return float(v)
    if isinstance(v, float):
        if np.isnan(v) or np.isinf(v):
            return None
        return v
    if isinstance(v, (pd.Timestamp,)):
        if pd.isna(v):
            return None
        return v.strftime("%Y-%m-%d")
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass
    return v


def clean_record(rec: dict[str, Any]) -> dict[str, Any]:
    return {k: clean_json_value(v) for k, v in rec.items()}


def existing_cols(df: pd.DataFrame, cols: list[str]) -> list[str]:
    return [c for c in cols if c in df.columns]


CARD_FIELDS = [
    "screener_attention_priority_rank",
    "term",
    "asset_universe",
    "primary_sector",
    "latest_data_date",
    "latest_close",
    "screener_attention_priority_score",
    "screener_action_bucket",
    "primary_archetype",
    "secondary_archetype",
    "archetype_direction",
    "archetype_confidence",
    "archetype_summary",
    "archetype_risk_note",
    "screener_reason_summary",
    "signal_consensus_direction_score",
    "signal_consensus_direction_label",
    "signal_dispersion_score",
    "signal_consensus_confidence_score",
    "days_since_latest_event",
    "latest_event_tier",
    "latest_event_direction",
    "latest_event_quality_score",
    "latest_event_dashboard_summary_label",
    "days_since_latest_confirmed",
    "latest_confirmed_event_date",
    "latest_confirmed_event_direction",
    "latest_confirmed_quality_score",
    "latest_confirmed_dashboard_summary_label",
    "bollinger_direction_score",
    "attention_adjusted_bollinger_score",
    "macd_family_direction_score",
    "macd_family_label",
    "sent_price_macd_joint_slope_label",
    "rsi_family_state_score",
    "rsi_family_label",
    "sent_ribbon_direction_score",
    "sent_ribbon_label",
    "attention_participation_score",
    "attention_confirmation_score",
    "recent_watch_count_7d",
    "recent_confirmed_count_7d",
    "screener_model_version",
    "screener_generated_at_utc",
]


def select_records(df: pd.DataFrame, fields: list[str], limit: int) -> list[dict[str, Any]]:
    cols = existing_cols(df, fields)
    if not cols:
        return []
    return [clean_record(r) for r in df[cols].head(limit).to_dict(orient="records")]


def sort_priority(df: pd.DataFrame) -> pd.DataFrame:
    x = df.copy()
    if "screener_attention_priority_rank" in x.columns:
        x["_rank_sort"] = pd.to_numeric(x["screener_attention_priority_rank"], errors="coerce")
        x["_score_sort"] = pd.to_numeric(x.get("screener_attention_priority_score", np.nan), errors="coerce")
        return x.sort_values(["_rank_sort", "_score_sort", "term"], ascending=[True, False, True], na_position="last")
    x["_score_sort"] = pd.to_numeric(x.get("screener_attention_priority_score", np.nan), errors="coerce")
    return x.sort_values(["_score_sort", "term"], ascending=[False, True], na_position="last")


def build_bucket(df: pd.DataFrame, bucket: str, limit: int = 25) -> list[dict[str, Any]]:
    if "screener_action_bucket" not in df.columns:
        return []
    sub = df[df["screener_action_bucket"].astype(str).str.lower().eq(bucket.lower())].copy()
    sub = sort_priority(sub)
    return select_records(sub, CARD_FIELDS, limit)


def build_archetype_bucket(df: pd.DataFrame, archetype_contains: str, limit: int = 25) -> list[dict[str, Any]]:
    if "primary_archetype" not in df.columns:
        return []
    pat = archetype_contains.lower()
    mask = df["primary_archetype"].astype(str).str.lower().str.contains(pat, na=False)
    if "secondary_archetype" in df.columns:
        mask = mask | df["secondary_archetype"].astype(str).str.lower().str.contains(pat, na=False)
    sub = sort_priority(df[mask].copy())
    return select_records(sub, CARD_FIELDS, limit)


def build_store(source_dir: Path, output_dir: Path, input_filename: str, output_filename: str, limit: int = 25) -> Path:
    source_dir = Path(source_dir)
    output_dir = Path(output_dir)
    input_path = source_dir / input_filename
    output_path = output_dir / output_filename

    if not input_path.exists():
        raise FileNotFoundError(f"Missing screener CSV: {input_path}")

    df = pd.read_csv(input_path, low_memory=False)
    if "term" not in df.columns:
        raise ValueError("Screener CSV must include a 'term' column.")

    df["term"] = df["term"].astype(str).str.strip().str.upper()

    priority = sort_priority(df)

    bullish = df.copy()
    if "signal_consensus_direction_score" in bullish.columns:
        bullish["_dir_score"] = pd.to_numeric(bullish["signal_consensus_direction_score"], errors="coerce")
        bullish = bullish[bullish["_dir_score"] >= 57.5].sort_values(["_dir_score", "screener_attention_priority_score", "term"], ascending=[False, False, True], na_position="last")
    else:
        bullish = bullish.iloc[0:0]

    bearish = df.copy()
    if "signal_consensus_direction_score" in bearish.columns:
        bearish["_dir_score"] = pd.to_numeric(bearish["signal_consensus_direction_score"], errors="coerce")
        bearish = bearish[bearish["_dir_score"] <= 42.5].sort_values(["_dir_score", "screener_attention_priority_score", "term"], ascending=[True, False, True], na_position="last")
    else:
        bearish = bearish.iloc[0:0]

    fresh_confirmed = df.copy()
    if "days_since_latest_confirmed" in fresh_confirmed.columns:
        fresh_confirmed["_days_conf"] = pd.to_numeric(fresh_confirmed["days_since_latest_confirmed"], errors="coerce")
        fresh_confirmed = fresh_confirmed[fresh_confirmed["_days_conf"] <= 7]
        fresh_confirmed = sort_priority(fresh_confirmed)
    else:
        fresh_confirmed = fresh_confirmed.iloc[0:0]

    by_term_fields = existing_cols(df, CARD_FIELDS)
    by_term = {
        s(row.get("term")): clean_record(row)
        for row in df[by_term_fields].to_dict(orient="records")
        if s(row.get("term"))
    }

    model_version = ""
    if "screener_model_version" in df.columns and not df["screener_model_version"].dropna().empty:
        model_version = s(df["screener_model_version"].dropna().iloc[0])

    generated_at = ""
    if "screener_generated_at_utc" in df.columns and not df["screener_generated_at_utc"].dropna().empty:
        generated_at = s(df["screener_generated_at_utc"].dropna().iloc[0])

    action_distribution = {}
    if "screener_action_bucket" in df.columns:
        action_distribution = {s(k): int(v) for k, v in df["screener_action_bucket"].fillna("Missing").value_counts().to_dict().items()}

    archetype_distribution = {}
    if "primary_archetype" in df.columns:
        archetype_distribution = {s(k): int(v) for k, v in df["primary_archetype"].fillna("Missing").value_counts().to_dict().items()}

    payload = {
        "payload_version": PAYLOAD_VERSION,
        "model_version": model_version,
        "screener_generated_at_utc": generated_at,
        "json_generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "source_csv": str(input_path),
        "record_count": int(len(df)),
        "sections": {
            "top_priority": select_records(priority, CARD_FIELDS, limit),
            "top_bullish": select_records(bullish, CARD_FIELDS, limit),
            "top_bearish": select_records(bearish, CARD_FIELDS, limit),
            "fresh_confirmed": select_records(fresh_confirmed, CARD_FIELDS, limit),
            "fresh_confirmed_bullish": select_records(fresh_confirmed[fresh_confirmed.get("latest_confirmed_event_direction", "").astype(str).str.lower().str.contains("bull", na=False)] if "latest_confirmed_event_direction" in fresh_confirmed.columns else fresh_confirmed.iloc[0:0], CARD_FIELDS, limit),
            "fresh_confirmed_bearish": select_records(fresh_confirmed[fresh_confirmed.get("latest_confirmed_event_direction", "").astype(str).str.lower().str.contains("bear", na=False)] if "latest_confirmed_event_direction" in fresh_confirmed.columns else fresh_confirmed.iloc[0:0], CARD_FIELDS, limit),
            "high_attention_conflict": build_bucket(df, "Conflicted / High Dispersion", limit),
            "high_quality_watch": build_bucket(df, "High-Quality Watch", limit),
            "consensus_bullish": build_bucket(df, "Consensus Bullish", limit),
            "consensus_bearish": build_bucket(df, "Consensus Bearish", limit),
            "watch_cluster_building": build_archetype_bucket(df, "Watch Cluster", limit),
            "sentiment_repair": build_archetype_bucket(df, "Sentiment Repair", limit),
            "narrative_deterioration": build_archetype_bucket(df, "Narrative Deterioration", limit),
            "quiet_neutral": build_archetype_bucket(df, "Quiet Neutral", limit),
        },
        "by_term": by_term,
        "distributions": {
            "action_bucket": action_distribution,
            "primary_archetype": archetype_distribution,
        },
        "field_notes": {
            "screener_attention_priority_score": "0-100 review priority; high means inspect first, not necessarily bullish.",
            "signal_consensus_direction_score": "0 bearish, 50 neutral, 100 bullish.",
            "screener_reason_summary": "Human-readable explanation assembled from the strongest current reason flags.",
            "primary_archetype": "Highest-priority matched interpretive setup archetype.",
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"[OK] wrote {output_path}")
    print(f"[OK] records={len(df)} sections={len(payload['sections'])} by_term={len(by_term)}")
    print("[OK] top priority:")
    for rec in payload["sections"]["top_priority"][:10]:
        print(f"  {rec.get('screener_attention_priority_rank', '')!s:>3} {rec.get('term', ''):<6} {n(rec.get('screener_attention_priority_score'), 0):5.1f} {rec.get('signal_consensus_direction_label', ''):<15} {rec.get('primary_archetype', '')}")

    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Build lightweight Fix26 screener JSON store for website dashboard.")
    parser.add_argument("--source-dir", default=str(DEFAULT_SOURCE_DIR), help="Directory containing seta_market_screener_365d.csv.")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR), help="Directory to write fix26_screener_store.json.")
    parser.add_argument("--input-filename", default=DEFAULT_INPUT_FILENAME, help="Input screener CSV filename.")
    parser.add_argument("--output-filename", default=DEFAULT_OUTPUT_FILENAME, help="Output JSON filename.")
    parser.add_argument("--limit", type=int, default=25, help="Number of records per section.")
    args = parser.parse_args()

    build_store(
        source_dir=Path(args.source_dir),
        output_dir=Path(args.output_dir),
        input_filename=args.input_filename,
        output_filename=args.output_filename,
        limit=args.limit,
    )


if __name__ == "__main__":
    main()
