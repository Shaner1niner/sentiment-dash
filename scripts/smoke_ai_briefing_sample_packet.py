#!/usr/bin/env python
"""Smoke-test the SETA AI briefing sample review packet builder."""

from __future__ import annotations

import json
from pathlib import Path

from build_ai_briefing_sample_packet import ROOT, SampleCase, build_packet, write_markdown


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"[OK] {message}")


def main() -> int:
    output_dir = ROOT / "briefing_outputs" / "_sample_packet_smoke"
    cases = [
        SampleCase("public", "BTC", "D", "3M", "Smoke test public crypto sample."),
        SampleCase("member", "NVDA", "W", "1Y", "Smoke test member equity sample."),
    ]
    packet = build_packet(cases, output_dir)
    markdown = write_markdown(packet, output_dir)

    assert_true(packet["schema_version"] == "ai_briefing_sample_packet_v1", "sample packet schema is correct")
    assert_true(packet["sample_count"] == 2, "sample packet contains two smoke cases")
    assert_true(packet["valid_count"] == 2, "all smoke samples validate")
    assert_true(markdown.exists(), "sample packet markdown is written")
    assert_true((output_dir / "sample_review_packet.json").exists(), "sample packet JSON is written")

    data = json.loads((output_dir / "sample_review_packet.json").read_text(encoding="utf-8"))
    rows = data.get("rows") or []
    assert_true(all((row.get("draft") or {}).get("briefing_cards") for row in rows), "each sample draft has briefing_cards")
    assert_true("Participation Quality" in markdown.read_text(encoding="utf-8"), "markdown includes Participation Quality section")
    print("AI briefing sample packet smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
