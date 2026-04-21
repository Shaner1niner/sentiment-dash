from __future__ import annotations

import argparse
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

OHLC_AGG = {
    "open": "first",
    "high": "max",
    "low": "min",
    "close": "last",
    "volume": "sum",
}

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
    "attention_spike_score", "attention_regime_score", "attention_source_breadth_score",
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


def snake_case(name: str) -> str:
    s = str(name).strip()
    s = s.replace("%", "pct")
    s = re.sub(r"[^0-9A-Za-z]+", "_", s)
    s = re.sub(r"(?<!^)(?=[A-Z])", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s.lower()


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


def load_manifest(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        manifest = json.load(f)
    if "modes" not in manifest:
        raise ValueError("Manifest must contain a 'modes' object.")
    return manifest


def mode_assets(manifest: dict[str, Any], mode: str) -> list[str]:
    assets = manifest.get("modes", {}).get(mode, {}).get("assets", [])
    out = []
    for token in assets:
        t = str(token).strip().upper()
        if t and t not in out:
            out.append(t)
    return out


def union_assets(manifest: dict[str, Any]) -> list[str]:
    out = []
    for mode in ("public", "member"):
        for t in mode_assets(manifest, mode):
            if t not in out:
                out.append(t)
    return out


def load_csv(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, low_memory=False)
    df = normalize_columns(df)
    if "date" not in df.columns or "term" not in df.columns:
        raise ValueError("Input CSV must contain 'date' and 'term' columns after normalization.")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["term"] = df["term"].astype(str).str.strip().str.upper()
    df = df.dropna(subset=["date", "term"]).sort_values(["term", "date"]).reset_index(drop=True)

    if "rsi_d" not in df.columns and "rsi" in df.columns:
        df["rsi_d"] = df["rsi"]
    if "sentiment_rsi_d" not in df.columns and "sentiment_rsi" in df.columns:
        df["sentiment_rsi_d"] = df["sentiment_rsi"]

    alias_groups = {
        "sentiment_upper_band": ["sentiment_upper_band", "sentiment_upper_band_1"],
        "sentiment_lower_band": ["sentiment_lower_band", "sentiment_lower_band_1"],
        "boll_upper_overlap_advanced": ["boll_upper_overlap_advanced"],
        "boll_lower_overlap_advanced": ["boll_lower_overlap_advanced"],
        "boll_upper_overlap_band": ["boll_upper_overlap_band"],
        "boll_lower_overlap_band": ["boll_lower_overlap_band"],
        "scaled_sentiment_macd": ["scaled_sentiment_macd"],
        "scaled_sentiment_macd_signal": ["scaled_sentiment_macd_signal"],
    }
    for target, candidates in alias_groups.items():
        if target in df.columns:
            continue
        for cand in candidates:
            if cand in df.columns:
                df[target] = df[cand]
                break

    keep = [c for c in CORE_FIELDS if c in df.columns]
    missing = [c for c in CORE_FIELDS if c not in df.columns and c != "date"]
    for col in missing:
        df[col] = pd.NA
        keep.append(col)
    return df[["term"] + [c for c in CORE_FIELDS if c in df.columns]].copy()


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


def write_payload(df: pd.DataFrame, mode: str, manifest: dict[str, Any], output_path: Path, source_csv: Path, *, minify: bool) -> dict[str, Any]:
    configured_terms = mode_assets(manifest, mode)
    filtered = df[df["term"].isin(configured_terms)].copy()
    missing_terms = [t for t in configured_terms if t not in set(filtered["term"].unique())]
    if filtered.empty:
        raise ValueError(f"No rows left for mode={mode} after filtering configured assets.")
    store = build_store(filtered)
    payload = {
        "D": store["D"],
        "W": store["W"],
        "_meta": {
            "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "mode": mode,
            "source_csv": str(source_csv),
            "configured_assets": configured_terms,
            "included_assets": sorted(store["D"].keys()),
            "missing_assets": missing_terms,
            "term_count": len(store["D"]),
            "row_count_daily": sum(len(v) for v in store["D"].values()),
            "row_count_weekly": sum(len(v) for v in store["W"].values()),
            "field_count_per_row": len(CORE_FIELDS),
            "builder": "build_fix26_chart_store_payloads.py",
            "manifest_version": manifest.get("version", "unknown"),
        },
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        if minify:
            json.dump(payload, f, allow_nan=False, separators=(",", ":"))
        else:
            json.dump(payload, f, allow_nan=False, indent=2)
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Build lean Fix 26 chart-store JSON payloads from chart-history CSV.")
    parser.add_argument("--manifest", default="dashboard_fix26_mode_manifest.json", help="Path to Fix 26 mode manifest JSON")
    parser.add_argument("--input-csv", help="Path to final_combined_data_enriched_chart_history.csv or compatible enriched CSV")
    parser.add_argument("--output-dir", default=".", help="Directory for generated JSON payloads")
    parser.add_argument("--mode", choices=["public", "member", "all"], default="all", help="Which payload(s) to generate")
    parser.add_argument("--minify", action="store_true", help="Write compact JSON without pretty indentation")
    parser.add_argument("--print-export-terms", action="store_true", help="Print the union of public/member assets and exit")
    args = parser.parse_args()

    manifest_path = Path(args.manifest).resolve()
    manifest = load_manifest(manifest_path)

    if args.print_export_terms:
        print(",".join(union_assets(manifest)))
        return 0

    if not args.input_csv:
        raise ValueError("--input-csv is required unless --print-export-terms is used.")

    df = load_csv(Path(args.input_csv).resolve())
    output_dir = Path(args.output_dir).resolve()
    modes = [args.mode] if args.mode in {"public", "member"} else ["public", "member"]

    written = []
    for mode in modes:
        default_name = manifest.get("modes", {}).get(mode, {}).get("dataUrl") or f"fix26_chart_store_{mode}.json"
        payload = write_payload(df, mode, manifest, output_dir / default_name, Path(args.input_csv).resolve(), minify=args.minify)
        written.append((mode, output_dir / default_name, payload))

    for mode, path, payload in written:
        print(f"[OK] wrote {path}")
        print(f"[OK] {mode} terms={payload['_meta']['term_count']} daily_rows={payload['_meta']['row_count_daily']} weekly_rows={payload['_meta']['row_count_weekly']}")
        if payload["_meta"]["missing_assets"]:
            print(f"[WARN] {mode} missing assets: {', '.join(payload['_meta']['missing_assets'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
