#!/usr/bin/env python
"""Smoke-test the local SETA AI briefing input/output contract."""

from __future__ import annotations

import json
from pathlib import Path
from tempfile import TemporaryDirectory

from build_ai_briefing_input import build_input
from check_ai_briefing_output import validate_output


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"[OK] {message}")


def valid_output(briefing_input: dict) -> dict:
    asset = briefing_input["asset"]
    frequency = briefing_input["frequency"]
    as_of = briefing_input["as_of"]
    breadth = briefing_input["breadth_trust"]["source_breadth_label"]
    return {
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
        "trust_check": f"Source breadth is {breadth}, so confidence should be calibrated to the breadth caveat in the input.",
        "watch_item": "Watch for confirmation from structure and follow-through if the setup remains active.",
        "limitations": "This briefing uses only the structured SETA input and may be limited by source coverage.",
        "public_safe_disclaimer": "Educational market context only; not investment advice.",
        "source_breadth_used": True,
        "review_status": "draft",
        "model_metadata": {
            "provider": "local-smoke",
            "model": "fixture",
            "prompt_version": "seta_briefing_prompt_v1",
        },
    }


def main() -> int:
    btc = build_input("public", "BTC", "D", "3M")
    assert_true(btc["schema_version"] == "ai_briefing_input_v1", "BTC input schema version is correct")
    assert_true(btc["asset"] == "BTC", "BTC input asset is correct")
    assert_true(btc["breadth_trust"]["source_breadth_label"] in {"Broad", "Moderate", "Narrow", "Source Limited"}, "BTC breadth label is normalized")
    assert_true(btc["safety_constraints"]["public_safe_required"] is True, "BTC input requires public safety")

    nvda = build_input("member", "NVDA", "W", "1Y")
    assert_true(nvda["frequency"] == "W", "NVDA weekly input frequency is correct")
    assert_true(nvda["mode"] == "member", "NVDA member input mode is correct")
    assert_true(nvda["source_metadata"]["row_count_visible"] > 0, "NVDA weekly visible row count is positive")

    good = valid_output(btc)
    assert_true(validate_output(good, btc) == [], "valid fixture output passes safety checks")

    bad = dict(good)
    bad["headline"] = "BTC will rally to a guaranteed price target"
    bad["evidence"] = ["Buy BTC now", "Source breadth proves organic demand", "Price target is certain"]
    errors = validate_output(bad, btc)
    assert_true(any("forbidden" in error for error in errors), "unsafe fixture output fails forbidden-language checks")

    with TemporaryDirectory() as tmp:
        out = Path(tmp) / "btc_input.json"
        out.write_text(json.dumps(btc, indent=2), encoding="utf-8")
        reloaded = json.loads(out.read_text(encoding="utf-8"))
        assert_true(reloaded["asset"] == "BTC", "briefing input JSON round-trips")

    print("AI briefing contract smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
