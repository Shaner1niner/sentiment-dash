#!/usr/bin/env python
"""Build deterministic SETA semantic briefing state from ai_briefing_input_v1.

This helper is local/offline. It converts the structured AI briefing input into
a ranked semantic state object before prose is written. It does not call an AI
provider, does not modify reviewed payloads, and does not touch dashboard
runtime code.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from build_ai_briefing_input import build_input

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_VERSION = "seta_semantic_briefing_state_v1"


def clean_text(value: Any, fallback: str = "") -> str:
    text = str(value).strip() if value not in (None, "") else fallback
    return re.sub(r"\s+", " ", text)


def num(value: Any) -> float | None:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n else None


def text_blob(value: Any) -> str:
    parts: list[str] = []

    def walk(item: Any) -> None:
        if isinstance(item, dict):
            for v in item.values():
                walk(v)
        elif isinstance(item, list):
            for v in item:
                walk(v)
        elif item not in (None, ""):
            parts.append(str(item))

    walk(value)
    return " ".join(parts).lower()


def section_text(briefing_input: dict[str, Any], *sections: str) -> str:
    return " ".join(text_blob(briefing_input.get(section) or {}) for section in sections)


def has(text: str, *needles: str) -> bool:
    return any(needle.lower() in text for needle in needles)


def classify_data_quality(briefing_input: dict[str, Any]) -> dict[str, Any]:
    source = briefing_input.get("source_metadata") or {}
    warnings: list[str] = []
    row_count = num(source.get("row_count_visible"))
    if row_count is not None and row_count < 20:
        warnings.append("sparse_visible_context")
    if (briefing_input.get("price_context") or {}).get("price_data_lagged"):
        warnings.append("price_data_lagged")
    if briefing_input.get("as_of") in (None, ""):
        warnings.append("missing_as_of")
    return {
        "status": "qualified" if warnings else "ok",
        "warnings": warnings,
        "range_fallback_used": bool(source.get("range_fallback_used")),
        "stale_context": "stale" in text_blob(briefing_input),
    }


def classify_regime(briefing_input: dict[str, Any]) -> dict[str, Any]:
    text = section_text(briefing_input, "overlap_context", "sentiment_context", "event_context")
    label = clean_text((briefing_input.get("sentiment_context") or {}).get("archetype_summary"))
    if "strong bearish" in text:
        state = "strong_bearish_regime"
        label = label or "Strong Bearish SETA regime"
    elif "strong bullish" in text:
        state = "strong_bullish_regime"
        label = label or "Strong Bullish SETA regime"
    elif "weakening sentiment momentum" in text and "price momentum is not yet fully broken" in text:
        state = "weakening_sentiment_price_resilience"
        label = "Weakening sentiment momentum with price resilience"
    elif has(text, "compression", "transition", "transitional"):
        state = "mixed_transition"
        label = label or "Transitional / compression regime"
    else:
        state = "regime_unknown"
        label = label or "Layered SETA context"

    return {
        "state": state,
        "label": label,
        "score_band": "unknown",
    }


def classify_pressure(briefing_input: dict[str, Any]) -> dict[str, Any]:
    text = section_text(briefing_input, "overlap_context", "indicator_context", "event_context", "sentiment_context")
    has_confirmed = bool(re.search(r"\bconfirmed\b", text)) and not bool(re.search(r"\bunconfirmed\b", text))
    bullish = "bullish pressure" in text
    bearish = "bearish pressure" in text

    if bullish:
        direction = "bullish"
        state = "confirmed_bullish_pressure" if has_confirmed else "unconfirmed_bullish_pressure"
        label = "Confirmed bullish pressure" if has_confirmed else "Unconfirmed bullish pressure"
    elif bearish:
        direction = "bearish"
        state = "confirmed_bearish_pressure" if has_confirmed else "unconfirmed_bearish_pressure"
        label = "Confirmed bearish pressure" if has_confirmed else "Unconfirmed bearish pressure"
    elif "watch" in text:
        direction = "mixed"
        state = "watch_condition"
        label = "Shared-zone watch condition"
    elif "inactive" in text or "no active inside-zone confirmation" in text:
        direction = "none"
        state = "inactive_overlap"
        label = "Shared-zone confirmation inactive"
    else:
        direction = "none"
        state = "no_active_pressure"
        label = "No active pressure state"

    return {
        "state": state,
        "direction": direction,
        "confirmation": "confirmed" if state.startswith("confirmed") else ("unconfirmed" if state.startswith("unconfirmed") else state),
        "label": label,
    }


def classify_event(briefing_input: dict[str, Any]) -> dict[str, Any]:
    text = section_text(briefing_input, "event_context", "overlap_context", "sentiment_context")
    event = briefing_input.get("event_context") or {}
    raw_label = clean_text(event.get("latest_event_tier") or event.get("latest_event_direction") or "")

    if "rejection" in text and "bearish" in text:
        state = "bearish_rejection"
        label = "Bearish rejection"
    elif "rejection" in text:
        state = "rejection"
        label = "Rejection"
    elif "repair" in text or "bullish repair" in text:
        state = "bullish_repair"
        label = "Bullish repair"
    elif "confirmed" in text:
        state = "confirmed_event"
        label = raw_label or "Confirmed event"
    elif event.get("no_visible_events"):
        state = "none"
        label = "No visible event"
    else:
        state = "event_unknown"
        label = raw_label or "Event context unavailable"

    return {
        "state": state,
        "label": label,
        "recency": "latest" if state not in {"none", "event_unknown"} else "none",
    }


def classify_timing(briefing_input: dict[str, Any]) -> dict[str, Any]:
    indicators = briefing_input.get("indicator_context") or {}
    text = text_blob(indicators)
    hist = num(indicators.get("macd_histogram"))
    stoch = num(indicators.get("stoch_rsi"))

    if hist is None:
        histogram_state = "unknown"
    elif hist > 0:
        histogram_state = "positive"
    elif hist < 0:
        histogram_state = "negative"
    else:
        histogram_state = "flat"

    if stoch is None:
        stoch_state = "unknown"
    elif stoch >= 80:
        stoch_state = "stretched_high"
    elif stoch <= 20:
        stoch_state = "washed_out"
    else:
        stoch_state = "mid_range"

    if "constructive" in text or "strong" in text:
        rsi_state = "constructive"
    elif "weak" in text:
        rsi_state = "weak"
    elif "mixed" in text or "neutral" in text:
        rsi_state = "mixed"
    else:
        rsi_state = "unknown"

    if "negative divergence" in text or "narrative weakening" in text:
        macd_state = "negative_divergence"
    elif "positive divergence" in text or "sentiment repair" in text:
        macd_state = "positive_divergence"
    elif "bearish" in text:
        macd_state = "bearish"
    elif "bullish" in text:
        macd_state = "bullish"
    else:
        macd_state = "mixed_or_unknown"

    if macd_state == "negative_divergence" and rsi_state == "constructive":
        state = "negative_divergence_with_constructive_rsi"
        label = "negative divergence with constructive RSI"
    elif macd_state == "negative_divergence":
        state = "negative_sentiment_divergence"
        label = "negative divergence / narrative weakening"
    elif macd_state == "bearish" and rsi_state == "mixed":
        state = "bearish_timing_with_mixed_rsi"
        label = "bearish timing with mixed RSI"
    elif macd_state == "bearish" and rsi_state == "constructive":
        state = "bearish_timing_with_constructive_rsi"
        label = "bearish timing with constructive RSI"
    elif macd_state == "positive_divergence":
        state = "positive_divergence_or_repair"
        label = "positive divergence / sentiment repair"
    else:
        state = "mixed_timing"
        label = "mixed timing"

    return {
        "state": state,
        "label": label,
        "macd_state": macd_state,
        "histogram_state": histogram_state,
        "rsi_state": rsi_state,
        "stoch_rsi_state": stoch_state,
    }


def classify_ribbon(briefing_input: dict[str, Any]) -> dict[str, Any]:
    text = section_text(briefing_input, "sentiment_context", "overlap_context")
    if "bearish expansion" in text:
        state = "bearish_expansion"
        label = "bearish expansion"
    elif "bearish" in text and "low" in text:
        state = "bearish_low_structure"
        label = "bearish / low structure"
    elif "neutral" in text and "coiling" in text:
        state = "neutral_coiling"
        label = "neutral / coiling"
    elif "compression" in text or "transition" in text:
        state = "compression_transition"
        label = "compression / transition"
    else:
        state = "ribbon_unknown"
        label = "ribbon context unavailable"
    return {"state": state, "label": label}


def classify_participation(briefing_input: dict[str, Any], pressure: dict[str, Any], timing: dict[str, Any], event: dict[str, Any]) -> dict[str, Any]:
    attention = briefing_input.get("attention_context") or {}
    price = briefing_input.get("price_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    trend = briefing_input.get("participation_trend") or {}
    authorship = briefing_input.get("authorship_breadth_trend") or {}

    attention_label = clean_text(attention.get("attention_label"), "Unknown")
    attention_l = attention_label.lower()
    direction = clean_text(trend.get("direction"), "Unknown")
    conviction = clean_text(attention.get("attention_conviction_label"), "").lower()
    spike = num(attention.get("attention_spike_score"))
    breadth_label = clean_text(breadth.get("source_breadth_label") or authorship.get("current_label"), "Unknown")
    breadth_l = breadth_label.lower()
    volume = clean_text(price.get("volume_confirmation"), "Unknown")
    volume_l = volume.lower()
    recent_direction = clean_text(price.get("recent_direction_label"), "").lower()

    elevated = attention_l in {"elevated", "extreme"} or (spike is not None and spike >= 65)
    quiet = attention_l == "quiet"
    broad = "broad" in breadth_l
    narrow = "narrow" in breadth_l or "source limited" in breadth_l
    pressure_active = str(pressure.get("state", "")).startswith(("confirmed", "unconfirmed"))
    stoch_high = timing.get("stoch_rsi_state") == "stretched_high"
    washed_out = timing.get("stoch_rsi_state") == "washed_out"

    if elevated and "bearish" in conviction and (stoch_high or recent_direction == "rising"):
        role = "warning_context"
        role_label = "bearish attention warning context"
        confidence = "qualified_confirmation"
    elif elevated and "bullish" in conviction and washed_out:
        role = "early_repair_probe"
        role_label = "bullish repair probe"
        confidence = "watch_condition"
    elif elevated and narrow:
        role = "narrow_source_risk"
        role_label = "visible but concentrated participation"
        confidence = "source_qualified"
    elif pressure_active and quiet:
        role = "confidence_limiter"
        role_label = "quiet participation limits confirmation"
        confidence = "qualified_confirmation"
    elif pressure_active and ("high" in volume_l):
        role = "confirmer"
        role_label = "volume-supported pressure context"
        confidence = "participation_supported"
    elif quiet and broad:
        role = "source_breadth_stabilizer"
        role_label = "quiet but broadly sourced participation"
        confidence = "measured"
    elif broad:
        role = "source_breadth_stabilizer"
        role_label = "broadly sourced participation"
        confidence = "measured"
    else:
        role = "non_confirming_background_noise"
        role_label = "background participation context"
        confidence = "qualified"

    if quiet:
        level_state = "quiet"
    elif attention_l in {"normal", "elevated", "extreme"}:
        level_state = attention_l
    else:
        level_state = "unknown"

    if direction.lower() == "rising":
        state = f"{level_state}_increasing"
    elif direction.lower() in {"falling", "cooling"}:
        state = f"{level_state}_cooling"
    elif direction.lower() == "stable":
        state = f"{level_state}_stable"
    else:
        state = level_state

    return {
        "state": state,
        "role": role,
        "role_label": role_label,
        "attention_level": attention_label,
        "attention_direction": direction,
        "attention_conviction": clean_text(attention.get("attention_conviction_label"), "Unknown"),
        "volume_state": "high" if "high" in volume_l else ("normal" if "normal" in volume_l else "unknown"),
        "breadth_state": "broad_stable" if broad else ("narrow_or_source_limited" if narrow else "unknown"),
        "confidence_from_participation": confidence,
    }


def decide_semantic_state(
    briefing_input: dict[str, Any],
    data_quality: dict[str, Any],
    regime: dict[str, Any],
    pressure: dict[str, Any],
    event: dict[str, Any],
    timing: dict[str, Any],
    participation: dict[str, Any],
) -> dict[str, Any]:
    text = section_text(briefing_input, "sentiment_context", "overlap_context", "event_context", "indicator_context")
    primary_state = "layered_seta_context"
    primary_label = "Layered SETA context"
    counter_signal = ""
    confidence_state = participation.get("confidence_from_participation", "qualified")
    precedence_rule = "fallback_layered_context"

    if data_quality["status"] != "ok":
        confidence_state = "data_limited"

    if pressure["state"] == "confirmed_bullish_pressure":
        primary_state = pressure["state"]
        primary_label = "Confirmed bullish pressure"
        precedence_rule = "confirmed_pressure_over_timing"
    elif pressure["state"] == "confirmed_bearish_pressure":
        primary_state = pressure["state"]
        primary_label = "Confirmed bearish pressure"
        precedence_rule = "confirmed_pressure_over_timing"
    elif pressure["state"] == "unconfirmed_bullish_pressure":
        primary_state = pressure["state"]
        if event["state"] == "bearish_rejection":
            primary_label = "Unconfirmed bullish pressure with bearish rejection risk"
            counter_signal = "bearish_rejection_counter_signal"
            confidence_state = "qualified_confirmation"
        else:
            primary_label = "Unconfirmed bullish pressure"
        precedence_rule = "pressure_state_over_generic_archetype"
    elif pressure["state"] == "unconfirmed_bearish_pressure":
        primary_state = pressure["state"]
        if event["state"] == "bullish_repair":
            primary_label = "Unconfirmed bearish pressure with bullish repair risk"
            counter_signal = "bullish_repair_counter_signal"
            confidence_state = "qualified_confirmation"
        else:
            primary_label = "Unconfirmed bearish pressure"
        precedence_rule = "pressure_state_over_generic_archetype"
    elif participation["role"] == "warning_context":
        primary_state = "bearish_attention_spike_exhaustion_watch"
        primary_label = "Bearish attention spike with exhaustion risk"
        counter_signal = "price_strength_or_extension"
        confidence_state = "warning_context"
        precedence_rule = "attention_warning_over_generic_timing"
    elif participation["role"] == "early_repair_probe":
        primary_state = "bullish_repair_probe"
        primary_label = "Bullish repair attempt with incomplete confirmation"
        counter_signal = "weak_structure_counter_signal"
        confidence_state = "watch_condition"
        precedence_rule = "attention_repair_probe_over_generic_timing"
    elif regime["state"] in {"strong_bearish_regime", "strong_bullish_regime"}:
        primary_state = regime["state"]
        primary_label = regime["label"]
        if pressure["state"] in {"inactive_overlap", "no_active_pressure"}:
            counter_signal = "inactive_overlap_limiter"
            confidence_state = "qualified_confirmation"
        precedence_rule = "extreme_regime_over_timing"
    elif regime["state"] == "weakening_sentiment_price_resilience":
        primary_state = regime["state"]
        primary_label = "Weakening sentiment momentum with price resilience"
        if event["state"] in {"rejection", "bearish_rejection"}:
            counter_signal = "latest_rejection_context"
            confidence_state = "qualified_confirmation"
        elif pressure["state"] == "inactive_overlap":
            counter_signal = "inactive_overlap_limiter"
            confidence_state = "timing_led"
        precedence_rule = "specific_archetype_after_pressure_checks"
    elif timing["state"] == "bearish_timing_with_mixed_rsi":
        primary_state = "bearish_timing_pressure_mixed_rsi"
        primary_label = "Bearish timing pressure with mixed RSI"
        if pressure["state"] == "inactive_overlap":
            counter_signal = "inactive_overlap_limiter"
            confidence_state = "timing_led"
        precedence_rule = "timing_over_generic_context"
    elif timing["state"] == "bearish_timing_with_constructive_rsi":
        primary_state = "bearish_timing_pressure_constructive_rsi"
        primary_label = "Bearish timing pressure with constructive RSI"
        counter_signal = "constructive_rsi_counter_signal"
        confidence_state = "measured"
        precedence_rule = "timing_over_generic_context"
    elif timing["state"] == "negative_divergence_with_constructive_rsi":
        primary_state = "weakening_sentiment_price_resilience"
        primary_label = "Weakening sentiment momentum with price resilience"
        counter_signal = "constructive_rsi_counter_signal"
        confidence_state = "measured"
        precedence_rule = "timing_divergence_with_resilience"

    if data_quality["status"] != "ok":
        counter_signal = counter_signal or "data_quality_limiter"

    return {
        "primary_state": primary_state,
        "primary_label": primary_label,
        "counter_signal": counter_signal,
        "confidence_state": confidence_state,
        "precedence_rule": precedence_rule,
    }


def evidence_atoms_for(
    pressure: dict[str, Any],
    event: dict[str, Any],
    timing: dict[str, Any],
    participation: dict[str, Any],
    data_quality: dict[str, Any],
) -> list[str]:
    atoms: list[str] = []
    if pressure["state"] in {"confirmed_bullish_pressure", "unconfirmed_bullish_pressure"}:
        atoms.append("bullish_pressure_" + pressure["confirmation"])
    elif pressure["state"] in {"confirmed_bearish_pressure", "unconfirmed_bearish_pressure"}:
        atoms.append("bearish_pressure_" + pressure["confirmation"])
    elif pressure["state"] == "inactive_overlap":
        atoms.append("inactive_overlap")
    elif pressure["state"] == "watch_condition":
        atoms.append("shared_zone_watch")

    if event["state"] not in {"none", "event_unknown"}:
        atoms.append(event["state"])

    for key in ["macd_state", "histogram_state", "rsi_state", "stoch_rsi_state"]:
        value = timing.get(key)
        if value and value != "unknown":
            atoms.append(f"{key}_{value}")

    if participation.get("state") and participation["state"] != "unknown":
        atoms.append(f"participation_{participation['state']}")
    if participation.get("volume_state") not in {"", "unknown", None}:
        atoms.append(f"volume_{participation['volume_state']}")
    if participation.get("breadth_state") not in {"", "unknown", None}:
        atoms.append(f"breadth_{participation['breadth_state']}")
    if data_quality["status"] != "ok":
        atoms.append("data_quality_limited")

    return atoms


def narrative_atoms_for(decision: dict[str, Any], pressure: dict[str, Any], event: dict[str, Any], timing: dict[str, Any], participation: dict[str, Any]) -> dict[str, list[str]]:
    what = [decision["primary_label"]]
    if pressure["state"] != "no_active_pressure":
        what.append(pressure["label"])
    if decision.get("counter_signal"):
        what.append(decision["counter_signal"])
    what.append(timing["label"])
    what.append(participation["role_label"])

    why = [
        f"confidence:{decision['confidence_state']}",
        f"precedence:{decision['precedence_rule']}",
    ]
    if event["state"] not in {"none", "event_unknown"}:
        why.append(f"event:{event['state']}")

    return {
        "what_seta_sees": what,
        "why_it_matters": why,
        "evidence": [],
        "participation_quality": [participation["role"], participation["role_label"]],
    }


def build_semantic_state(briefing_input: dict[str, Any]) -> dict[str, Any]:
    data_quality = classify_data_quality(briefing_input)
    regime = classify_regime(briefing_input)
    pressure = classify_pressure(briefing_input)
    event = classify_event(briefing_input)
    timing = classify_timing(briefing_input)
    ribbon = classify_ribbon(briefing_input)
    participation = classify_participation(briefing_input, pressure, timing, event)
    decision = decide_semantic_state(briefing_input, data_quality, regime, pressure, event, timing, participation)
    atoms = evidence_atoms_for(pressure, event, timing, participation, data_quality)

    semantic = {
        "schema_version": SCHEMA_VERSION,
        "asset": briefing_input.get("asset"),
        "asset_family": asset_family_for(briefing_input),
        "mode": briefing_input.get("mode"),
        "frequency": briefing_input.get("frequency"),
        "display_range": briefing_input.get("display_range"),
        "as_of": briefing_input.get("as_of"),
        "data_quality": data_quality,
        "regime": regime,
        "pressure": pressure,
        "event": event,
        "timing": timing,
        "ribbon": ribbon,
        "participation": participation,
        "semantic_decision": decision,
        "evidence_atoms": atoms,
        "narrative_atoms": narrative_atoms_for(decision, pressure, event, timing, participation),
        "semantic_trace": {
            "precedence_rule": decision["precedence_rule"],
            "primary_state_source": primary_source_for(decision),
            "counter_signal_source": counter_source_for(decision),
            "confidence_limiter": confidence_limiter_for(decision, participation, data_quality),
        },
    }
    return semantic


def asset_family_for(briefing_input: dict[str, Any]) -> str:
    asset = clean_text(briefing_input.get("asset"), "").upper()
    crypto = {"BTC", "ETH", "SOL", "DOGE", "ADA", "XRP", "LINK", "AVAX", "MATIC", "DOT", "LTC", "BCH", "UNI", "AAVE"}
    etf = {"SPY", "QQQ", "GLD", "SLV", "TLT", "DIA", "IWM"}
    if asset in crypto:
        return "crypto"
    if asset in etf:
        return "etf"
    return "equity"


def primary_source_for(decision: dict[str, Any]) -> list[str]:
    rule = decision.get("precedence_rule")
    if rule in {"pressure_state_over_generic_archetype", "confirmed_pressure_over_timing"}:
        return ["overlap_context", "event_context"]
    if rule in {"attention_warning_over_generic_timing", "attention_repair_probe_over_generic_timing"}:
        return ["attention_context", "indicator_context", "price_context"]
    if rule == "extreme_regime_over_timing":
        return ["sentiment_context", "overlap_context"]
    if "timing" in str(rule):
        return ["indicator_context", "sentiment_context"]
    return ["sentiment_context", "event_context", "indicator_context"]


def counter_source_for(decision: dict[str, Any]) -> list[str]:
    counter = decision.get("counter_signal") or ""
    if "rejection" in counter or "repair" in counter:
        return ["event_context"]
    if "inactive_overlap" in counter:
        return ["overlap_context"]
    if "rsi" in counter:
        return ["indicator_context"]
    if "data_quality" in counter:
        return ["source_metadata"]
    return []


def confidence_limiter_for(decision: dict[str, Any], participation: dict[str, Any], data_quality: dict[str, Any]) -> str:
    if data_quality["status"] != "ok":
        return "data_quality"
    if decision.get("confidence_state") in {"qualified_confirmation", "watch_condition", "timing_led"}:
        if participation.get("role") == "confidence_limiter":
            return "quiet_participation"
        if decision.get("counter_signal"):
            return decision["counter_signal"]
    if participation.get("role") in {"narrow_source_risk", "confidence_limiter"}:
        return participation["role"]
    return ""


def load_input(args: argparse.Namespace) -> dict[str, Any]:
    if args.input:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Input JSON root must be an object")
        return data
    return build_input(args.mode, args.asset, args.frequency, args.display_range)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", help="Existing ai_briefing_input_v1 JSON file.")
    parser.add_argument("--mode", choices=["public", "member"], default="public")
    parser.add_argument("--asset", default="BTC")
    parser.add_argument("--frequency", choices=["D", "W"], default="D")
    parser.add_argument("--display-range", default="3M")
    parser.add_argument("--output", help="Optional output JSON path. Defaults to stdout.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    briefing_input = load_input(args)
    semantic = build_semantic_state(briefing_input)
    text = json.dumps(semantic, indent=2, sort_keys=True)
    if args.output:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(text + "\n", encoding="utf-8")
        print(f"[OK] wrote {output}")
    else:
        print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
