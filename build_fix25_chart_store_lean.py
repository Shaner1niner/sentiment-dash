from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

DEFAULT_PUBLIC_TERMS = ["BTC", "ETH", "NVDA", "NFLX", "COIN"]

OHLC_AGG = {
    "open": "first",
    "high": "max",
    "low": "min",
    "close": "last",
    "volume": "sum",
}

# Minimal field contract required by the current public/member Fix 25 embed HTML.
CORE_FIELDS = [
    "date",
    "open", "high", "low", "close", "volume",
    "close_ma_7", "close_ma_21", "close_ma_50", "close_ma_100", "close_ma_200",
    "combined_compound_ma_7", "combined_compound_ma_21", "combined_compound_ma_50",
    "combined_compound_ma_100", "combined_compound_ma_200",
    "scaled_combined_compound_ma_7", "scaled_combined_compound_ma_21",
    "scaled_combined_compound_ma_50", "scaled_combined_compound_ma_100",
    "scaled_combined_compound_ma_200",
    "rsi", "rsi_d", "sentiment_rsi", "sentiment_rsi_d",
    "stochastic_rsi", "stochastic_rsi_d", "sentiment_stochastic_rsi_d",
    "macd", "macd_signal", "macd_histogram", "macd_signal_cross",
    "macd_cross_significance", "scaled_sentiment_macd", "scaled_sentiment_macd_signal",
    "sentiment_upper_band", "sentiment_lower_band",
    "boll_upper_overlap_advanced", "boll_lower_overlap_advanced",
    "boll_upper_overlap_band", "boll_lower_overlap_band",
    "boll_volatility_flag", "boll_volatility_flag_num",
    "high_volume_7", "high_volume_20",
    "boll_overlap_volume_confirmation_flag", "boll_overlap_break_confirmed_high_volume",
    "signal_boll_overlap_break_confirmed_high_volume",
    "boll_overlap_reentry_flag", "boll_overlap_rejection_bullish_flag",
    "boll_overlap_rejection_bearish_flag",
    "attention_level_score", "attention_conviction_score_signed",
    "attention_spike_score", "attention_regime_score",
    "sent_ribbon_regime_raw", "sent_ribbon_regime_score", "sent_ribbon_regime_confidence",
    "sent_ribbon_compression_flag", "sent_ribbon_transition_flag",
    "sent_ribbon_transition_type", "sent_ribbon_width_raw", "sent_ribbon_width_abs",
    "sent_ribbon_width_z", "sent_ribbon_center_slope_21", "sent_ribbon_center_slope_21_z",
    "sent_ribbon_stack_score", "sent_ribbon_alignment_count",
]

SUM_FIELDS = {"volume"}
MAX_FIELDS = {
    "high_volume_7", "high_volume_20", "boll_volatility_flag_num",
    "boll_overlap_break_confirmed_high_volume", "signal_boll_overlap_break_confirmed_high_volume",
    "boll_overlap_reentry_flag", "boll_overlap_rejection_bullish_flag",
    "boll_overlap_rejection_bearish_flag", "sent_ribbon_compression_flag",
    "sent_ribbon_transition_flag",
}
LAST_NON_NULL_FIELDS = set(CORE_FIELDS) - set(OHLC_AGG) - SUM_FIELDS - MAX_FIELDS - {"date"}


def snake_case(name: str) -> str:
    s = str(name).strip()
    s = s.replace("%", "pct")
    s = re.sub(r"[^0-9A-Za-z]+", "_", s)
    s = re.sub(r"(?<!^)(?=[A-Z])", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s.lower()


def parse_terms(raw: str | None) -> list[str]:
    if not raw:
        return []
    terms = [t.strip().upper() for t in raw.split(",") if t.strip()]
    return list(dict.fromkeys(terms))


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    renamed: dict[str, str] = {}
    seen: set[str] = set()
    for col in df.columns:
        new = snake_case(col)
        if new in seen:
            continue
        renamed[col] = new
        seen.add(new)
    return df[list(renamed.keys())].rename(columns=renamed)


def load_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df = normalize_columns(df)
    if "date" not in df.columns or "term" not in df.columns:
        raise ValueError("Input CSV must contain 'date' and 'term' columns after normalization.")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["term"] = df["term"].astype(str).str.strip().str.upper()
    df = df.dropna(subset=["date", "term"]).sort_values(["term", "date"]).reset_index(drop=True)

    # Alias / backfill fields expected by the current HTML.
    if "rsi_d" not in df.columns and "rsi" in df.columns:
        df["rsi_d"] = df["rsi"]
    if "sentiment_rsi_d" not in df.columns and "sentiment_rsi" in df.columns:
        df["sentiment_rsi_d"] = df["sentiment_rsi"]

    for target, candidates in {
        "sentiment_upper_band": ["sentiment_upper_band", "sentiment_upper_band_1"],
        "sentiment_lower_band": ["sentiment_lower_band", "sentiment_lower_band_1"],
        "boll_upper_overlap_advanced": ["boll_upper_overlap_advanced"],
        "boll_lower_overlap_advanced": ["boll_lower_overlap_advanced"],
        "boll_upper_overlap_band": ["boll_upper_overlap_band"],
        "boll_lower_overlap_band": ["boll_lower_overlap_band"],
    }.items():
        if target in df.columns:
            continue
        for cand in candidates:
            if cand in df.columns:
                df[target] = df[cand]
                break

    # Keep only fields the HTML actually uses, plus term for grouping.
    keep = [c for c in CORE_FIELDS if c in df.columns]
    missing = [c for c in CORE_FIELDS if c not in df.columns and c != "date"]
    for col in missing:
        df[col] = pd.NA
        keep.append(col)
    df = df[["term"] + [c for c in CORE_FIELDS if c in df.columns]].copy()
    return df


def infer_calendar(term_df: pd.DataFrame) -> str:
    weekdays = set(term_df["date"].dt.dayofweek.dropna().astype(int).tolist())
    return "continuous" if 5 in weekdays or 6 in weekdays else "trading_sessions"


def sanitize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m-%d")
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass
    if isinstance(value, float):
        if not math.isfinite(value):
            return None
        # Reduce payload size while preserving chart fidelity.
        rounded = round(value, 6)
        if rounded.is_integer():
            return int(rounded)
        return rounded
    return value


def clean_for_json(df: pd.DataFrame, asset_calendar: str) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for raw in df.to_dict(orient="records"):
        rec = {k: sanitize_value(v) for k, v in raw.items() if k != "term"}
        rec["asset_calendar"] = asset_calendar
        records.append(rec)
    return records


def reduce_week(group: pd.DataFrame) -> dict[str, Any]:
    group = group.sort_values("date")
    row: dict[str, Any] = {"date": group["date"].iloc[-1]}
    for col in [c for c in group.columns if c not in {"date", "term"}]:
        if col in OHLC_AGG:
            op = OHLC_AGG[col]
            series = pd.to_numeric(group[col], errors="coerce")
            if op == "first":
                row[col] = series.dropna().iloc[0] if series.notna().any() else None
            elif op == "last":
                row[col] = series.dropna().iloc[-1] if series.notna().any() else None
            elif op == "max":
                row[col] = series.max() if series.notna().any() else None
            elif op == "min":
                row[col] = series.min() if series.notna().any() else None
            elif op == "sum":
                row[col] = series.sum() if series.notna().any() else None
        elif col in SUM_FIELDS:
            series = pd.to_numeric(group[col], errors="coerce")
            row[col] = series.sum() if series.notna().any() else None
        elif col in MAX_FIELDS:
            series = pd.to_numeric(group[col], errors="coerce")
            row[col] = series.max() if series.notna().any() else None
        else:
            non_null = group[col].dropna()
            row[col] = non_null.iloc[-1] if len(non_null) else None
    return row


def build_weekly(term_df: pd.DataFrame) -> pd.DataFrame:
    tmp = term_df.copy().sort_values("date")
    tmp["week_bucket"] = tmp["date"].dt.to_period("W-FRI")
    rows = [reduce_week(g.drop(columns=["week_bucket"])) for _, g in tmp.groupby("week_bucket", sort=True)]
    out = pd.DataFrame(rows)
    out["date"] = pd.to_datetime(out["date"], errors="coerce")
    return out.sort_values("date").reset_index(drop=True)


def build_store(df: pd.DataFrame) -> dict[str, dict[str, list[dict[str, Any]]]]:
    store: dict[str, dict[str, list[dict[str, Any]]]] = {"D": {}, "W": {}}
    for term, term_df in df.groupby("term", sort=True):
        term_df = term_df.sort_values("date").reset_index(drop=True)
        calendar = infer_calendar(term_df)
        store["D"][term] = clean_for_json(term_df, calendar)
        weekly_df = build_weekly(term_df)
        store["W"][term] = clean_for_json(weekly_df, calendar)
    return store


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a lean Fix 25 chart-store JSON for the current embed HTML.")
    parser.add_argument("--input-csv", required=True, help="Path to final_combined_data_enriched_chart_history.csv")
    parser.add_argument("--output-json", required=True, help="Path to write the website chart-store JSON")
    parser.add_argument("--terms", default="", help="Optional comma-separated asset filter")
    parser.add_argument("--public-only", action="store_true", help="Use the default free/public asset basket")
    parser.add_argument("--minify", action="store_true", help="Write compact JSON without pretty indentation")
    args = parser.parse_args()

    input_csv = Path(args.input_csv).resolve()
    output_json = Path(args.output_json).resolve()
    output_json.parent.mkdir(parents=True, exist_ok=True)

    df = load_csv(input_csv)

    terms = parse_terms(args.terms)
    if args.public_only:
        terms = DEFAULT_PUBLIC_TERMS
    if terms:
        df = df[df["term"].isin(terms)].copy()

    if df.empty:
        raise ValueError("No rows left after filtering; nothing to write.")

    store = build_store(df)
    payload = {
        "D": store["D"],
        "W": store["W"],
        "_meta": {
            "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source_csv": str(input_csv),
            "term_count": len(store["D"]),
            "row_count_daily": sum(len(v) for v in store["D"].values()),
            "row_count_weekly": sum(len(v) for v in store["W"].values()),
            "public_terms": DEFAULT_PUBLIC_TERMS,
            "field_count_per_row": len(CORE_FIELDS) - 1 + 1,  # minus term, plus asset_calendar
            "builder": "build_fix25_chart_store_lean.py",
        },
    }

    with output_json.open("w", encoding="utf-8") as f:
        if args.minify:
            json.dump(payload, f, allow_nan=False, separators=(",", ":"))
        else:
            json.dump(payload, f, allow_nan=False, indent=2)

    print(f"[OK] wrote {output_json}")
    print(f"[OK] daily terms={len(store['D'])} rows={sum(len(v) for v in store['D'].values())}")
    print(f"[OK] weekly terms={len(store['W'])} rows={sum(len(v) for v in store['W'].values())}")
    print(f"[OK] approx row field count={payload['_meta']['field_count_per_row']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
