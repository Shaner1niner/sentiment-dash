#!/usr/bin/env python
"""Smoke-test deterministic SETA semantic briefing state classification."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

from build_ai_briefing_input import build_input
from build_ai_briefing_semantic_state import build_semantic_state


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"[OK] {message}")


def assert_equal(actual: Any, expected: Any, message: str) -> None:
    if actual != expected:
        raise AssertionError(f"{message}: expected {expected!r}, got {actual!r}")
    print(f"[OK] {message}")


def base_case() -> dict[str, Any]:
    return {
        "schema_version": "ai_briefing_input_v1",
        "asset": "TEST",
        "mode": "member",
        "frequency": "D",
        "display_range": "6M",
        "as_of": "2026-05-11",
        "source_metadata": {"row_count_visible": 120},
        "price_context": {
            "latest_close": 100,
            "latest_close_date": "2026-05-11",
            "recent_direction_label": "Rising",
            "volume_confirmation": "Normal Volume",
        },
        "overlap_context": {
            "dashboard_summary_label": "Transitional",
            "overlap_state": "Inactive",
            "overlap_event_type": "",
            "structure_label": "Flat / Transition",
        },
        "sentiment_context": {
            "sentiment_state": "Flat / Transition",
            "archetype_summary": "TEST shows weakening sentiment momentum while price momentum is not yet fully broken.",
            "ribbon_label": "Mixed / Neutral",
        },
        "attention_context": {
            "attention_label": "Quiet",
            "attention_conviction_label": "Mixed / Neutral",
            "attention_spike_score": 20,
        },
        "breadth_trust": {"source_breadth_label": "Broad"},
        "participation_trend": {"direction": "Stable", "public_note": "Participation is quiet and broadly stable."},
        "authorship_breadth_trend": {"current_label": "Broad", "public_note": "Authorship breadth is broad and broadly stable."},
        "indicator_context": {
            "macd_label": "Negative Divergence / Narrative Weakening",
            "macd_histogram": 0.5,
            "rsi_label": "RSI Mixed / Neutral",
            "stoch_rsi": 55,
        },
        "event_context": {"no_visible_events": True},
    }


def synthetic_bullish_pressure_bearish_rejection() -> dict[str, Any]:
    data = base_case()
    data["overlap_context"].update(
        {
            "overlap_state": "Bullish Pressure Active",
            "overlap_event_type": "Bearish Rejection",
            "dashboard_summary_label": "Bullish Pressure Active",
        }
    )
    data["event_context"].update(
        {
            "no_visible_events": False,
            "latest_event_tier": "Rejection",
            "latest_event_direction": "Bearish",
            "latest_event_date": "2026-05-11",
        }
    )
    data["price_context"]["volume_confirmation"] = "High Volume"
    data["indicator_context"].update({"rsi_label": "RSI Constructive", "stoch_rsi": 91})
    return data


def synthetic_bearish_attention_price_extended() -> dict[str, Any]:
    data = base_case()
    data["sentiment_context"]["archetype_summary"] = "Price strength with stretched timing."
    data["attention_context"].update(
        {
            "attention_label": "Elevated",
            "attention_conviction_label": "Bearish Conviction",
            "attention_spike_score": 82,
        }
    )
    data["indicator_context"].update({"stoch_rsi": 94, "rsi_label": "RSI Constructive"})
    data["price_context"]["recent_direction_label"] = "Rising"
    return data


def synthetic_quiet_broad_participation() -> dict[str, Any]:
    data = base_case()
    data["attention_context"].update({"attention_label": "Quiet", "attention_spike_score": 5})
    data["breadth_trust"]["source_breadth_label"] = "Broad"
    return data


def run_real_case_checks() -> None:
    cases = [
        ("BTC", "public", "D", "3M", {"Weakening sentiment momentum with price resilience", "Bearish timing pressure with constructive RSI"}),
        ("NVDA", "public", "D", "3M", {"Weakening sentiment momentum with price resilience"}),
        ("LINK", "member", "D", "6M", {"Unconfirmed bullish pressure with bearish rejection risk"}),
        ("MSFT", "member", "D", "6M", {"Bearish timing pressure with mixed RSI"}),
    ]

    for asset, mode, freq, display_range, expected_labels in cases:
        semantic = build_semantic_state(build_input(mode, asset, freq, display_range))
        assert_equal(semantic["schema_version"], "seta_semantic_briefing_state_v1", f"{asset} semantic schema version")
        assert_true(semantic["semantic_decision"]["primary_label"] in expected_labels, f"{asset} primary label is expected")
        assert_true(bool(semantic["evidence_atoms"]), f"{asset} has evidence atoms")
        assert_true(bool(semantic["semantic_trace"]["precedence_rule"]), f"{asset} records precedence rule")

    link = build_semantic_state(build_input("member", "LINK", "D", "6M"))
    assert_equal(link["pressure"]["state"], "unconfirmed_bullish_pressure", "LINK pressure state is unconfirmed bullish")
    assert_equal(link["semantic_decision"]["counter_signal"], "bearish_rejection_counter_signal", "LINK has bearish rejection counter-signal")
    assert_equal(link["semantic_decision"]["confidence_state"], "qualified_confirmation", "LINK confidence is qualified")
    assert_true(
        link["participation"]["role"] in {"confidence_limiter", "source_breadth_stabilizer", "confirmer"},
        "LINK participation role is classified",
    )


def run_synthetic_checks() -> None:
    pressure = build_semantic_state(synthetic_bullish_pressure_bearish_rejection())
    assert_equal(
        pressure["semantic_decision"]["primary_label"],
        "Unconfirmed bullish pressure with bearish rejection risk",
        "pressure state outranks generic archetype",
    )
    assert_equal(
        pressure["semantic_decision"]["counter_signal"],
        "bearish_rejection_counter_signal",
        "bearish rejection is retained as counter-signal",
    )

    attention = build_semantic_state(synthetic_bearish_attention_price_extended())
    assert_equal(
        attention["participation"]["role"],
        "warning_context",
        "bearish attention spike with overextension sets warning context",
    )
    assert_equal(
        attention["semantic_decision"]["primary_label"],
        "Bearish attention spike with exhaustion risk",
        "attention warning can become primary when no stronger pressure state exists",
    )

    quiet = build_semantic_state(synthetic_quiet_broad_participation())
    assert_equal(
        quiet["participation"]["role"],
        "source_breadth_stabilizer",
        "quiet broad participation is source-breadth stabilizer",
    )
    assert_true(
        "demand" not in " ".join(quiet["narrative_atoms"]["participation_quality"]).lower(),
        "quiet broad participation is not called demand",
    )

    evidence_text = " ".join(pressure["evidence_atoms"]).lower()
    assert_true("confidence_improves" not in evidence_text, "evidence atoms avoid interpretive confidence language")


def main() -> int:
    run_real_case_checks()
    run_synthetic_checks()
    print("SETA semantic briefing state smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
