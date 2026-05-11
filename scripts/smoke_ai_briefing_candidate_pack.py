#!/usr/bin/env python
"""Smoke-test AI briefing candidate prompt and comparison workflow."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from build_ai_briefing_candidate_prompt_pack import main as build_prompt_pack_main
from build_ai_briefing_sample_packet import ROOT, SampleCase, build_packet, write_markdown
from compare_ai_briefing_candidates import compare, write_markdown as write_comparison_markdown


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)
    print(f"[OK] {message}")


def main() -> int:
    output_dir = ROOT / "briefing_outputs" / "_candidate_pack_smoke"
    sample_dir = output_dir / "sample_review"
    cases = [
        SampleCase("public", "BTC", "D", "3M", "Smoke test public crypto sample."),
        SampleCase("member", "NVDA", "W", "1Y", "Smoke test member equity sample."),
    ]
    packet = build_packet(cases, sample_dir)
    write_markdown(packet, sample_dir)

    # Exercise the prompt-pack CLI path against the generated sample packet.
    import sys

    old_argv = sys.argv[:]
    try:
        sys.argv = [
            "build_ai_briefing_candidate_prompt_pack.py",
            "--sample-packet",
            str(sample_dir / "sample_review_packet.json"),
            "--output-dir",
            str(output_dir / "candidate_pack"),
        ]
        assert_true(build_prompt_pack_main() == 0, "candidate prompt pack command succeeds")
    finally:
        sys.argv = old_argv

    prompt_jsonl = output_dir / "candidate_pack" / "ai_candidate_prompts.jsonl"
    assert_true(prompt_jsonl.exists(), "candidate prompt JSONL is written")
    records = [json.loads(line) for line in prompt_jsonl.read_text(encoding="utf-8").splitlines() if line.strip()]
    assert_true(len(records) == 2, "candidate prompt pack has two records")
    assert_true(all(record["recommended_intelligence"] == "High" for record in records), "prompt records recommend High intelligence")

    candidate_dir = output_dir / "candidate_pack" / "candidate_outputs"
    for row in packet["rows"]:
        slug = "_".join(
            [
                row["case"]["mode"].lower(),
                row["case"]["asset"].lower(),
                row["case"]["frequency"].lower(),
                row["case"]["display_range"].lower(),
            ]
        )
        source = ROOT / row["draft_path"]
        shutil.copyfile(source, candidate_dir / f"{slug}_candidate.json")

    result = compare(packet, candidate_dir)
    comparison_md = output_dir / "candidate_pack" / "ai_candidate_comparison.md"
    write_comparison_markdown(comparison_md, result)
    assert_true(result["pass_count"] == 2, "baseline-as-candidate comparison passes")
    assert_true(comparison_md.exists(), "candidate comparison markdown is written")
    print("AI briefing candidate pack smoke test PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
