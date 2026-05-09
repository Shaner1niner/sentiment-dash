#!/usr/bin/env python
"""Build a compact SETA AI briefing input from local Fix 26 payloads."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from ai_briefing_reference import build_default_briefing_guidance

ROOT = Path(__file__).resolve().parents[1]

RANGE_DAYS = {
    "1M": 31,
    "3M": 93,
    "6M": 186,
    "1Y": 366,
    "2Y": 732,
}

DISALLOWED_PHRASES = [
    "buy",
    "sell",
    "strong buy",
    "price target",
    "guaranteed",
    "will rally",
    "will crash",
    "should enter",
    "should exit",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def rounded(value: Any, digits: int = 4) -> float | None:
    n = num(value)
    return None if n is None else round(n, digits)


def first_present(mapping: dict[str, Any], keys: list[str]) -> Any:
    for key in keys:
        value = mapping.get(key)
        if value not in (None, ""):
            return value
    return None


def first_num(mapping: dict[str, Any], keys: list[str]) -> float | None:
    for key in keys:
        value = num(mapping.get(key))
        if value is not None:
            return value
    return None


def parse_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return None


def visible_rows(rows: list[dict[str, Any]], display_range: str) -> list[dict[str, Any]]:
    if not rows:
        return []
    if display_range.upper() == "ALL":
        return rows
    latest = parse_date(rows[-1].get("date"))
    days = RANGE_DAYS.get(display_range.upper())
    if latest is None or days is None:
        return rows
    cutoff = latest - timedelta(days=days)
    filtered = [row for row in rows if (parse_date(row.get("date")) or latest) >= cutoff]
    return filtered or rows


def latest_priced_row(rows: list[dict[str, Any]]) -> tuple[dict[str, Any], int]:
    for idx in range(len(rows) - 1, -1, -1):
        if num(rows[idx].get("close")) is not None:
            return rows[idx], idx
    return rows[-1], len(rows) - 1


def load_manifest_mode(mode: str) -> dict[str, Any]:
    manifest = read_json(ROOT / "dashboard_fix26_mode_manifest.json")
    modes = manifest.get("modes") or {}
    if mode not in modes:
        raise ValueError(f"Unknown mode {mode!r}; expected one of {sorted(modes)}")
    return modes[mode]


def load_asset_rows(mode: str, asset: str, frequency: str) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    cfg = load_manifest_mode(mode)
    asset = asset.upper()
    frequency = frequency.upper()
    index_url = cfg.get("assetIndexUrl")
    if index_url:
        index = read_json(ROOT / str(index_url))
        info = (index.get("assets") or {}).get(asset)
        if not info:
            raise ValueError(f"{asset} is not present in {index_url}")
        payload = read_json(ROOT / str(info["url"]))
    else:
        payload = read_json(ROOT / str(cfg["dataUrl"]))
    rows = ((payload.get(frequency) or {}).get(asset)) or []
    if not rows:
        raise ValueError(f"No {frequency} rows found for {asset} in {mode} mode")
    return rows, payload.get("_meta") or {}


def load_screener_row(asset: str) -> dict[str, Any]:
    path = ROOT / "fix26_screener_store.json"
    if not path.exists():
        return {}
    store = read_json(path)
    row = ((store.get("by_term") or {}).get(asset.upper()) or {}).get("screener") or {}
    return row if isinstance(row, dict) else {}


def score_label(score: float | None, high: str, mid: str, low: str) -> str:
    if score is None:
        return "Unknown"
    if score >= 65:
        return high
    if score >= 45:
        return mid
    return low


def attention_level_label(row: dict[str, Any]) -> str:
    level = first_num(row, ["attention_level_score", "attention_regime_score"])
    if level is None:
        return "Unknown"
    if level >= 75:
        return "Extreme"
    if level >= 60:
        return "Elevated"
    if level >= 40:
        return "Normal"
    return "Quiet"


def attention_regime_label(row: dict[str, Any]) -> str:
    regime = num(row.get("attention_regime_score"))
    spike = num(row.get("attention_spike_score"))
    if regime is None and spike is None:
        return "Normal Regime"
    if (spike is not None and spike >= 65) or (regime is not None and regime >= 70):
        return "Event Burst"
    if regime is not None and regime >= 55:
        return "Elevated Participation"
    return "Normal Regime"


def conviction_label(row: dict[str, Any]) -> str:
    conviction = num(row.get("attention_conviction_score_signed"))
    if conviction is None:
        return "Mixed / Neutral"
    if conviction >= 25:
        return "Bullish Conviction"
    if conviction <= -25:
        return "Bearish Conviction"
    return "Mixed / Neutral"


def source_breadth(row: dict[str, Any]) -> dict[str, Any]:
    score = first_num(row, ["attention_source_breadth_score", "engagement_source_breadth_score"])
    raw_label = str(row.get("attention_breadth_label") or row.get("engagement_breadth_label") or "").strip()
    if score is None and raw_label:
        return {
            "source_breadth_score": None,
            "source_breadth_label": raw_label,
            "source_breadth_confidence": "label_only",
            "source_caveat": "Breadth label is present, but no numeric source breadth score is available.",
            "interpretation": "Treat participation breadth as a qualitative trust check.",
            "mention_in_public_copy": True,
        }
    if score is None:
        return {
            "source_breadth_score": None,
            "source_breadth_label": "Source Limited",
            "source_breadth_confidence": "unavailable",
            "source_caveat": "Source breadth is unavailable or sample-limited for this row.",
            "interpretation": "Participation confidence should be treated as limited.",
            "mention_in_public_copy": True,
        }
    label = "Broad" if score >= 70 else ("Moderate" if score >= 45 else "Narrow")
    confidence = "usable" if score >= 45 else "caution"
    interpretation = {
        "Broad": "Participation appears distributed across a broader source base.",
        "Moderate": "Participation has some breadth, but still needs structure confirmation.",
        "Narrow": "Attention may be concentrated in a smaller source set.",
    }[label]
    return {
        "source_breadth_score": round(score, 2),
        "source_breadth_label": label,
        "source_breadth_confidence": confidence,
        "source_caveat": "X and news inputs may be sample-limited; news breadth may reflect outlet repetition or syndication.",
        "interpretation": interpretation,
        "mention_in_public_copy": True,
    }


def build_input(mode: str, asset: str, frequency: str, display_range: str) -> dict[str, Any]:
    mode = mode.lower()
    asset = asset.upper()
    frequency = frequency.upper()
    rows, payload_meta = load_asset_rows(mode, asset, frequency)
    vis = visible_rows(rows, display_range)
    latest = vis[-1]
    latest_price_row, latest_price_idx = latest_priced_row(vis)
    previous = vis[latest_price_idx - 1] if latest_price_idx > 0 else {}
    screener = load_screener_row(asset)
    latest_close = num(latest_price_row.get("close"))
    previous_close = num(previous.get("close"))
    price_change = None
    if latest_close is not None and previous_close not in (None, 0):
        price_change = (latest_close - previous_close) / previous_close
    breadth = source_breadth(latest)
    summary_label = str(latest.get("seta_dashboard_summary_label") or "")
    archetypes = [
        item
        for item in [screener.get("primary_archetype"), screener.get("secondary_archetype")]
        if item
    ]

    return {
        "schema_version": "ai_briefing_input_v1",
        "asset": asset,
        "frequency": frequency,
        "display_range": display_range.upper(),
        "mode": mode,
        "as_of": latest.get("date"),
        "source_metadata": {
            "builder": payload_meta.get("builder"),
            "payload_generated_at_utc": payload_meta.get("generated_at_utc"),
            "screener_generated_at_utc": read_json(ROOT / "fix26_screener_store.json").get("generated_at_utc")
            if (ROOT / "fix26_screener_store.json").exists()
            else None,
            "row_count_visible": len(vis),
        },
        "price_context": {
            "latest_close": rounded(latest_close, 6),
            "latest_close_date": latest_price_row.get("date"),
            "price_data_lagged": latest_price_row is not latest,
            "previous_visible_close": rounded(previous_close, 6),
            "visible_period_change_pct": rounded(price_change * 100 if price_change is not None else None, 3),
            "recent_direction_label": "Rising" if (price_change or 0) > 0 else ("Falling" if (price_change or 0) < 0 else "Flat"),
            "latest_volume": rounded(first_present(screener, ["latest_volume"]) or latest.get("volume"), 3),
            "volume_confirmation": first_present(
                latest,
                ["boll_overlap_volume_confirmation_flag"],
            )
            or ("High Volume" if num(latest.get("high_volume_20")) else "Normal Volume"),
            "price_confirmation": first_present(
                screener,
                ["latest_event_tier", "latest_confirmed_tier", "screener_action_bucket"],
            ),
        },
        "overlap_context": {
            "overlap_source": "Combined Overlap",
            "dashboard_summary_label": summary_label or None,
            "overlap_state": first_present(
                screener,
                ["latest_event_overlap_state", "boll_overlap_state", "latest_confirmed_dashboard_summary_label"],
            ),
            "overlap_event_type": first_present(
                screener,
                ["latest_event_overlap_event_type", "boll_overlap_event_type", "primary_archetype"],
            ),
            "structure_label": first_present(screener, ["sent_ribbon_regime_raw", "latest_event_sent_ribbon_regime"])
            or latest.get("sent_ribbon_regime_raw"),
            "latest_transition": latest.get("sent_ribbon_transition_type"),
            "volatility_label": first_present(screener, ["latest_event_boll_volatility_flag", "boll_volatility_flag"])
            or latest.get("boll_volatility_flag"),
            "latest_confirmed": {
                "date": first_present(screener, ["latest_confirmed_event_date", "latest_confirmed_date"]),
                "direction": screener.get("latest_confirmed_event_direction"),
                "summary": screener.get("latest_confirmed_dashboard_summary_label"),
            },
        },
        "sentiment_context": {
            "sentiment_state": latest.get("sent_ribbon_regime_raw"),
            "sentiment_score": rounded(latest.get("sent_ribbon_regime_score"), 2),
            "sentiment_confidence": rounded(latest.get("sent_ribbon_regime_confidence"), 2),
            "ribbon_label": screener.get("sent_ribbon_label"),
            "primary_archetype": screener.get("primary_archetype"),
            "secondary_archetype": screener.get("secondary_archetype"),
            "archetype_summary": screener.get("archetype_summary"),
            "archetype_risk_note": screener.get("archetype_risk_note"),
        },
        "attention_context": {
            "attention_score": rounded(first_num(latest, ["attention_level_score", "attention_regime_score"]), 2),
            "attention_label": attention_level_label(latest),
            "attention_regime_label": attention_regime_label(latest),
            "attention_conviction_label": conviction_label(latest),
            "attention_spike_score": rounded(latest.get("attention_spike_score"), 2),
            "attention_caveat": "Attention describes participation context; it is not validation by itself.",
            "material_enough_to_mention": attention_level_label(latest) in {"Elevated", "Extreme"} or breadth["source_breadth_label"] != "Source Limited",
        },
        "breadth_trust": breadth,
        "indicator_context": {
            "macd_label": screener.get("macd_family_label") or score_label(rounded(latest.get("macd")), "MACD Bullish", "MACD Neutral", "MACD Bearish"),
            "macd": rounded(latest.get("macd"), 4),
            "macd_signal": rounded(latest.get("macd_signal"), 4),
            "macd_histogram": rounded(latest.get("macd_histogram"), 4),
            "rsi_label": screener.get("rsi_family_label") or score_label(rounded(latest.get("rsi")), "RSI Strong", "RSI Neutral", "RSI Weak"),
            "rsi": rounded(latest.get("rsi"), 2),
            "stoch_rsi": rounded(latest.get("stochastic_rsi"), 2),
            "stoch_rsi_d": rounded(latest.get("stochastic_rsi_d"), 2),
            "bollinger_label": screener.get("latest_event_overlap_state") or screener.get("boll_overlap_state"),
            "timing_caveat": "Traditional indicators provide timing context and should not override the full SETA evidence stack.",
        },
        "event_context": {
            "latest_event_date": screener.get("latest_event_date"),
            "latest_event_tier": screener.get("latest_event_tier"),
            "latest_event_direction": screener.get("latest_event_direction"),
            "latest_event_quality_score": rounded(screener.get("latest_event_quality_score"), 2),
            "latest_confirmed_event_date": screener.get("latest_confirmed_event_date"),
            "latest_confirmed_event_direction": screener.get("latest_confirmed_event_direction"),
            "confirmed_count_visible_proxy": rounded(screener.get("confirmed_count"), 0),
            "watch_count_visible_proxy": rounded(screener.get("watch_count"), 0),
            "no_visible_events": not bool(screener.get("latest_event_date") or screener.get("latest_confirmed_event_date")),
            "screener_reason_summary": screener.get("screener_reason_summary"),
        },
        "reference_guidance": build_default_briefing_guidance(archetypes=archetypes),
        "safety_constraints": {
            "public_safe_required": True,
            "educational_only": True,
            "disallowed_phrases": DISALLOWED_PHRASES,
            "financial_advice_prohibited": True,
            "allowed_tone": "concise, explanatory, non-advisory",
            "max_summary_words": 45,
            "max_headline_chars": 90,
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["public", "member"], default="public")
    parser.add_argument("--asset", default="BTC")
    parser.add_argument("--frequency", choices=["D", "W"], default="D")
    parser.add_argument("--display-range", default="3M")
    parser.add_argument("--output", help="Optional output JSON path. Defaults to stdout.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    payload = build_input(args.mode, args.asset, args.frequency, args.display_range)
    text = json.dumps(payload, indent=2, sort_keys=True)
    if args.output:
        out = Path(args.output)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
