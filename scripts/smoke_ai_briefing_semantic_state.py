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




def synthetic_active_confirmed_bearish_pressure_with_price_resilience() -> dict[str, Any]:
    data = base_case()
    data["sentiment_context"]["archetype_summary"] = (
        "TEST shows weakening sentiment momentum while price momentum is not yet fully broken."
    )
    data["overlap_context"].update(
        {
            "dashboard_summary_label": "Bearish Pressure",
            "overlap_state": "Bearish Pressure",
            "overlap_event_type": "Monitor",
            "latest_confirmed": {
                "summary": "Confirmed Bearish Pressure",
                "direction": "Bearish",
                "date": "2026-05-11",
            },
        }
    )
    return data


def synthetic_range_return_after_bearish_pressure() -> dict[str, Any]:
    data = base_case()
    data["overlap_context"].update(
        {
            "dashboard_summary_label": "Transitional",
            "overlap_state": "Inactive",
            "overlap_event_type": "Bearish Rejection",
            "latest_confirmed": {
                "summary": "Confirmed Bearish Pressure",
                "direction": "Bearish",
                "date": "2026-05-10",
            },
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
    return data

def run_real_case_checks() -> None:
    # Live market-data cases are intentionally schema/no-crash checks only.
    # Exact semantic expectations belong in frozen fixture checks below,
    # because refreshed market data can legitimately move an asset from one
    # semantic state to another.
    cases = [
        ("BTC", "public", "D", "3M"),
        ("NVDA", "public", "D", "3M"),
        ("LINK", "member", "D", "6M"),
        ("MSFT", "member", "D", "6M"),
    ]

    for asset, mode, freq, display_range in cases:
        semantic = build_semantic_state(build_input(mode, asset, freq, display_range))
        assert_equal(semantic["schema_version"], "seta_semantic_briefing_state_v1", f"{asset} live semantic schema version")
        assert_true(bool(semantic["semantic_decision"]["primary_label"]), f"{asset} live primary label is populated")
        assert_true(bool(semantic["semantic_decision"]["primary_state"]), f"{asset} live primary state is populated")
        assert_true(bool(semantic["evidence_atoms"]), f"{asset} live case has evidence atoms")
        assert_true(bool(semantic["semantic_trace"]["precedence_rule"]), f"{asset} live case records precedence rule")


def semantic_fixture_path() -> Path:
    return Path(__file__).resolve().parents[1] / "fixtures" / "semantic_briefing_state" / "real_cases_2026_05_12.json"


def run_frozen_real_fixture_checks() -> None:
    fixture_path = semantic_fixture_path()
    assert_true(fixture_path.exists(), "frozen semantic real-case fixture exists")

    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    assert_equal(fixture.get("schema_version"), "seta_semantic_fixture_pack_v1", "frozen semantic fixture schema version")

    cases = fixture.get("cases") or []
    assert_true(bool(cases), "frozen semantic fixture contains cases")

    for case in cases:
        case_id = case.get("case_id") or case.get("asset") or "unknown"
        semantic = build_semantic_state(case["input"])
        decision = semantic.get("semantic_decision") or {}
        trace = semantic.get("semantic_trace") or {}
        pressure = semantic.get("pressure") or {}
        participation = semantic.get("participation") or {}
        expected = case.get("expected") or {}

        assert_equal(semantic.get("schema_version"), expected.get("schema_version"), f"{case_id} frozen schema version")
        assert_equal(decision.get("primary_state"), expected.get("primary_state"), f"{case_id} frozen primary state")
        assert_equal(decision.get("primary_label"), expected.get("primary_label"), f"{case_id} frozen primary label")
        assert_equal(decision.get("counter_signal"), expected.get("counter_signal"), f"{case_id} frozen counter-signal")
        assert_equal(decision.get("confidence_state"), expected.get("confidence_state"), f"{case_id} frozen confidence state")
        assert_equal(trace.get("precedence_rule"), expected.get("precedence_rule"), f"{case_id} frozen precedence rule")
        assert_equal(pressure.get("state"), expected.get("pressure_state"), f"{case_id} frozen pressure state")
        assert_equal(participation.get("role"), expected.get("participation_role"), f"{case_id} frozen participation role")
        assert_true(len(semantic.get("evidence_atoms") or []) >= int(expected.get("min_evidence_atoms", 1)), f"{case_id} frozen evidence atoms are present")


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

    active_pressure = build_semantic_state(synthetic_active_confirmed_bearish_pressure_with_price_resilience())
    assert_equal(
        active_pressure["semantic_decision"]["primary_state"],
        "confirmed_bearish_pressure",
        "active confirmed bearish pressure outranks price-resilience archetype",
    )
    assert_equal(
        active_pressure["semantic_trace"]["precedence_rule"],
        "active_confirmed_pressure_over_archetype",
        "active confirmed pressure records matrix precedence",
    )
    assert_equal(
        active_pressure["shared_zone_matrix"]["transition"],
        "active_outside_zone",
        "active confirmed pressure remains outside shared zone",
    )

    range_return = build_semantic_state(synthetic_range_return_after_bearish_pressure())
    assert_equal(
        range_return["shared_zone_matrix"]["transition"],
        "range_return",
        "range return is distinct from active confirmed pressure",
    )
    assert_true(
        range_return["semantic_decision"]["primary_state"] != "confirmed_bearish_pressure",
        "range return does not claim active confirmed bearish pressure",
    )

    evidence_text = " ".join(pressure["evidence_atoms"]).lower()
    assert_true("confidence_improves" not in evidence_text, "evidence atoms avoid interpretive confidence language")


def main() -> int:
    run_real_case_checks()
    run_frozen_real_fixture_checks()
    run_synthetic_checks()
    print("SETA semantic briefing state smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
