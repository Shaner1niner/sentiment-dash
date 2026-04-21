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
    "adj_close": "last",
    "volume": "sum",
}

MAX_FIELDS = {
    "buy", "sell", "neutral",
    "high_volume_7", "high_volume_20",
    "boll_overlap_break_confirmed", "boll_overlap_break_confirmed_high_volume",
    "boll_overlap_volume_confirmation_flag", "boll_overlap_reentry_flag",
    "sent_ribbon_transition_flag", "sent_ribbon_compression_flag",
}

SUM_FIELDS = {
    "x_post_count", "x_unique_authors", "x_engagement_sum", "x_reach_sum",
    "x_impact_abs_sum", "x_impact_signed_sum",
    "reddit_post_count", "reddit_unique_authors", "reddit_engagement_sum", "reddit_reach_sum",
    "reddit_impact_abs_sum", "reddit_impact_signed_sum",
    "bsky_post_count", "bsky_unique_authors", "bsky_engagement_sum", "bsky_reach_sum",
    "bsky_impact_abs_sum", "bsky_impact_signed_sum",
    "news_article_count", "news_post_count", "news_unique_authors", "news_engagement_sum",
    "news_reach_sum", "news_relevance_sum", "news_proxy_impact", "news_proxy_engagement_raw",
    "news_proxy_impact_signed",
}


def snake_case(name: str) -> str:
    s = str(name).strip()
    s = s.replace("%", "pct")
    s = re.sub(r"[^0-9A-Za-z]+", "_", s)
    s = re.sub(r"(?<!^)(?=[A-Z])", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s.lower()


def load_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    if "date" not in {c.lower() for c in df.columns}:
        raise ValueError("Input CSV must contain a date column.")

    renamed = {}
    seen: set[str] = set()
    for col in df.columns:
        new = snake_case(col)
        if new in seen:
            continue
        renamed[col] = new
        seen.add(new)
    df = df[list(renamed.keys())].rename(columns=renamed)
    if "date" not in df.columns or "term" not in df.columns:
        raise ValueError("Input CSV must contain 'date' and 'term' columns after normalization.")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["term"] = df["term"].astype(str).str.strip().str.upper()
    df = df.dropna(subset=["date", "term"]).sort_values(["term", "date"]).reset_index(drop=True)

    if "rsi_d" not in df.columns and "rsi" in df.columns:
        df["rsi_d"] = df["rsi"]
    if "sentiment_rsi_d" not in df.columns and "sentiment_rsi" in df.columns:
        df["sentiment_rsi_d"] = df["sentiment_rsi"]

    band_aliases = {
        "sentiment_upper_band": ["sentiment_upper_band", "sentiment_upper_band_1"],
        "sentiment_lower_band": ["sentiment_lower_band", "sentiment_lower_band_1"],
        "price_upper_band": ["price_upper_band", "price_upper_band_1"],
        "price_lower_band": ["price_lower_band", "price_lower_band_1"],
    }
    for target, candidates in band_aliases.items():
        if target in df.columns:
            continue
        for c in candidates:
            if c in df.columns:
                df[target] = df[c]
                break

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
        return value
    return value


def clean_for_json(df: pd.DataFrame, asset_calendar: str) -> list[dict[str, Any]]:
    out = df.copy()
    out["date"] = pd.to_datetime(out["date"], errors="coerce")
    records = []
    for record in out.to_dict(orient="records"):
        cleaned = {k: sanitize_value(v) for k, v in record.items()}
        cleaned["asset_calendar"] = asset_calendar
        records.append(cleaned)
    return records


def reduce_week(group: pd.DataFrame) -> dict[str, Any]:
    group = group.sort_values("date")
    row: dict[str, Any] = {}
    for col in group.columns:
        if col == "date":
            row[col] = group[col].iloc[-1]
        elif col == "term":
            row[col] = group[col].iloc[-1]
        elif col in OHLC_AGG:
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


def parse_terms(raw: str | None) -> list[str]:
    if not raw:
        return []
    terms = [t.strip().upper() for t in raw.split(",") if t.strip()]
    return list(dict.fromkeys(terms))


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Fix 24 chart-store JSON for the current HTML loader.")
    parser.add_argument("--input-csv", required=True, help="Path to final_combined_data_enriched_chart_history.csv")
    parser.add_argument("--output-json", required=True, help="Path to write fix24_chart_store.json")
    parser.add_argument("--terms", default="", help="Optional comma-separated asset filter")
    parser.add_argument("--public-only", action="store_true", help="Use the default free/public asset basket")
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

    store: dict[str, dict[str, list[dict[str, Any]]]] = {"D": {}, "W": {}}

    for term, term_df in df.groupby("term", sort=True):
        term_df = term_df.sort_values("date").reset_index(drop=True)
        calendar = infer_calendar(term_df)
        store["D"][term] = clean_for_json(term_df, calendar)
        weekly_df = build_weekly(term_df)
        store["W"][term] = clean_for_json(weekly_df, calendar)

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
        },
    }

    with output_json.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, allow_nan=False)

    print(f"[OK] wrote {output_json}")
    print(f"[OK] daily terms={len(store['D'])} rows={sum(len(v) for v in store['D'].values())}")
    print(f"[OK] weekly terms={len(store['W'])} rows={sum(len(v) for v in store['W'].values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
