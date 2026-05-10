#!/usr/bin/env python
"""Smoke-test the local SETA AI briefing input/output contract."""

from __future__ import annotations

import json
from pathlib import Path
from tempfile import TemporaryDirectory

from build_ai_briefing_input import build_input
from check_ai_briefing_output import validate_output
from generate_ai_briefing_draft import generate_draft
from ai_briefing_quality_gates import check_briefing_quality_gates, count_visible_metrics
from ai_briefing_reference import build_default_briefing_guidance, load_briefing_reference_pack
from promote_ai_briefing_reviewed import payload_for, payload_for_entries, reviewed_briefing


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"[OK] {message}")


def valid_output(briefing_input: dict) -> dict:
    asset = briefing_input["asset"]
    frequency = briefing_input["frequency"]
    as_of = briefing_input["as_of"]
    breadth = briefing_input["breadth_trust"]["source_breadth_label"]
    output = {
        "schema_version": "ai_briefing_output_v1",
        "asset": asset,
        "frequency": frequency,
        "as_of": as_of,
        "headline": f"{asset} SETA briefing shows mixed behavioral context",
        "summary": "SETA shows a structured read with participation context, indicator evidence, and source breadth as a confidence qualifier.",
        "what_seta_sees": "The current setup is defined by the latest overlap, sentiment, and indicator context in the input.",
        "why_it_matters": "The evidence helps separate price behavior from attention context without turning the read into an instruction.",
        "evidence": [
            f"Latest data date is {as_of}.",
            f"Source breadth is {breadth}.",
            "Attention is treated as context rather than validation by itself.",
        ],
        "trust_check": f"Participation quality uses source breadth as a trust layer; breadth is {breadth}, so confidence should be calibrated to the input caveat.",
        "watch_item": "Watch for confirmation from structure and follow-through if the setup remains active.",
        "limitations": "This briefing uses only the structured SETA input and may be limited by source coverage.",
        "public_safe_disclaimer": "Educational market context only; not investment advice.",
        "source_breadth_used": True,
        "review_status": "draft",
        "model_metadata": {
            "provider": "local-smoke",
            "model": "fixture",
            "prompt_version": "seta_briefing_prompt_v2",
        },
    }
    output["briefing_cards"] = {
        "what_seta_sees": {
            "role": "Interpretation",
            "copy": output["what_seta_sees"],
        },
        "why_it_matters": {
            "role": "Implication",
            "copy": output["why_it_matters"],
        },
        "evidence": {
            "role": "Receipts",
            "items": output["evidence"],
        },
        "participation_quality": {
            "role": "Trust check",
            "copy": output["trust_check"],
        },
    }
    return output


def main() -> int:
    btc = build_input("public", "BTC", "D", "3M")
    assert_true(btc["schema_version"] == "ai_briefing_input_v1", "BTC input schema version is correct")
    assert_true(btc["asset"] == "BTC", "BTC input asset is correct")
    assert_true(btc["breadth_trust"]["source_breadth_label"] in {"Broad", "Moderate", "Narrow", "Source Limited"}, "BTC breadth label is normalized")
    assert_true(btc["safety_constraints"]["public_safe_required"] is True, "BTC input requires public safety")
    assert_true(bool(btc["reference_guidance"]["definitions"]), "BTC input includes reference guidance")
    assert_true(not btc["reference_guidance"]["missing_files"], "reference guidance has no missing files")

    nvda = build_input("member", "NVDA", "W", "1Y")
    assert_true(nvda["frequency"] == "W", "NVDA weekly input frequency is correct")
    assert_true(nvda["mode"] == "member", "NVDA member input mode is correct")
    assert_true(nvda["source_metadata"]["row_count_visible"] > 0, "NVDA weekly visible row count is positive")

    good = valid_output(btc)
    assert_true(validate_output(good, btc) == [], "valid fixture output passes safety checks")

    generated = generate_draft(btc)
    assert_true(validate_output(generated, btc) == [], "deterministic generated draft passes safety checks")
    cards = generated.get("briefing_cards") or {}
    assert_true(set(cards) >= {"what_seta_sees", "why_it_matters", "evidence", "participation_quality"}, "deterministic generated draft includes structured briefing cards")
    assert_true(cards["what_seta_sees"]["copy"] == generated["what_seta_sees"], "structured interpretation card matches legacy field")
    assert_true(cards["evidence"]["items"] == generated["evidence"], "structured evidence card matches legacy receipts")
    assert_true(cards["participation_quality"]["copy"] == generated["trust_check"], "structured participation card matches trust field")
    missing_cards = dict(good)
    del missing_cards["briefing_cards"]
    assert_true(any("briefing_cards" in error for error in validate_output(missing_cards, btc)), "briefing cards are required by the output contract")
    role_bad = dict(good)
    role_bad["briefing_cards"] = json.loads(json.dumps(good["briefing_cards"]))
    role_bad["briefing_cards"]["evidence"]["role"] = "Evidence"
    assert_true(any("briefing_cards.evidence.role" in error for error in validate_output(role_bad, btc)), "briefing card roles are constrained")
    assert_true(generated["review_status"] == "draft", "deterministic generated draft stays in draft status")
    assert_true(generated["reference_guidance_used"] is True, "deterministic generated draft records reference guidance usage")
    extension_input = dict(btc)
    extension_input["sentiment_context"] = dict(btc["sentiment_context"])
    extension_input["sentiment_context"]["archetype_risk_note"] = "Strength can persist, but risk/reward may be less favorable after extension."
    extension_draft = generate_draft(extension_input)
    assert_true("risk/reward" not in extension_draft["watch_item"].lower(), "deterministic draft sanitizes risk/reward wording")
    reviewed = reviewed_briefing(
        generated,
        briefing_input=btc,
        reviewer="smoke-test",
        review_note="Smoke-test promotion only.",
        source_path=Path("briefing_outputs/smoke_fixture.json"),
    )
    assert_true(reviewed["review_status"] == "reviewed", "review promotion marks draft as reviewed")
    assert_true(validate_output(reviewed, btc) == [], "reviewed briefing passes validation")
    reviewed_payload = payload_for([reviewed], mode="public", display_range="3M", payload_note="Smoke-test payload only.")
    assert_true(reviewed_payload["schema_version"] == "generated_briefings_reviewed_v1", "reviewed payload schema version is correct")
    assert_true(reviewed_payload["briefing_count"] == 1, "reviewed payload contains one briefing")
    mixed_payload = payload_for_entries(
        [(reviewed, "public", "3M"), (reviewed, "public", "1Y")],
        payload_note="Smoke-test mixed range payload only.",
    )
    assert_true(mixed_payload["briefing_count"] == 2, "reviewed payload supports mixed display ranges")

    bad = dict(good)
    bad["headline"] = "BTC will rally to a guaranteed price target"
    bad["evidence"] = ["Buy BTC now", "Source breadth proves organic demand", "Price target is certain"]
    errors = validate_output(bad, btc)
    assert_true(any("forbidden" in error for error in errors), "unsafe fixture output fails forbidden-language checks")

    attention_bad = dict(good)
    attention_bad["why_it_matters"] = "Attention proves adoption and validates the move."
    attention_errors = validate_output(attention_bad, btc)
    assert_true(any("attention treated as" in error for error in attention_errors), "attention/adoption misuse fails quality gates")

    internal_bad = dict(good)
    internal_bad["what_seta_sees"] = "Route=technical_structure and signal_consensus_direction_score show the setup."
    internal_errors = validate_output(internal_bad, btc)
    assert_true(any("internal" in error or "debug" in error for error in internal_errors), "internal/debug language fails quality gates")

    metric_heavy = dict(good)
    metric_heavy["evidence"] = ["RSI 52, sentiment 61, attention 72, dispersion 18.", "Breadth is broad.", "Context is mixed."]
    metric_gate = check_briefing_quality_gates(metric_heavy, btc, max_visible_metrics=3)
    assert_true(bool(metric_gate["warnings"]), "metric-heavy briefing receives a quality warning")
    assert_true(count_visible_metrics(metric_heavy["evidence"][0]) == 4, "visible metric counter catches numeric receipts")

    with TemporaryDirectory() as tmp:
        out = Path(tmp) / "btc_input.json"
        out.write_text(json.dumps(btc, indent=2), encoding="utf-8")
        reloaded = json.loads(out.read_text(encoding="utf-8"))
        assert_true(reloaded["asset"] == "BTC", "briefing input JSON round-trips")
        payload_out = Path(tmp) / "generated_briefings_reviewed.json"
        payload_out.write_text(json.dumps(reviewed_payload, indent=2), encoding="utf-8")
        reloaded_payload = json.loads(payload_out.read_text(encoding="utf-8"))
        assert_true(reloaded_payload["briefing_count"] == 1, "reviewed payload JSON round-trips")

    pack = load_briefing_reference_pack()
    assert_true(len(pack.columns) >= 100, "reference pack column index is populated")
    guidance = build_default_briefing_guidance(archetypes=["Fresh Bullish Reversal"])
    joined = " ".join(str(item) for item in guidance["definitions"] + guidance["cautions"])
    assert_true("attention" in joined.lower() or "breadth" in joined.lower(), "reference guidance includes attention or breadth context")

    print("AI briefing contract smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
