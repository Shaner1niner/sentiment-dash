#!/usr/bin/env python
"""Smoke test for SETA social reply draft mode."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path(r"C:\Users\shane\sentiment-dash")
SCRIPT = REPO / "scripts" / "draft_seta_social_reply.py"
SAMPLES = REPO / "reply_agent" / "sample_inputs" / "sample_social_comments.jsonl"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    raise SystemExit(f"[FAIL] {msg}")


def main() -> int:
    print("=" * 60)
    print("SETA reply agent smoke test")
    print("=" * 60)

    for p in [REPO / "fix26_screener_store.json", REPO / "agent_reference" / "seta_agent_reference.json", REPO / "agent_reference" / "seta_reply_guidance.md", SCRIPT, SAMPLES]:
        if not p.exists():
            fail(f"missing {p}")
        ok(f"found {p.name}")

    sample_lines = [line for line in SAMPLES.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not sample_lines:
        fail("no sample inputs")
    ok(f"sample count={len(sample_lines)}")

    for idx, line in enumerate(sample_lines[:5], start=1):
        payload = json.loads(line)
        cmd = [sys.executable, str(SCRIPT), "--repo", str(REPO), "--platform", payload.get("platform", "generic"), "--comment", payload.get("comment", "")]
        if payload.get("term"):
            cmd += ["--term", payload["term"]]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode != 0:
            print(proc.stdout)
            print(proc.stderr)
            fail(f"sample {idx} command failed")
        try:
            result = json.loads(proc.stdout)
        except json.JSONDecodeError as exc:
            print(proc.stdout)
            fail(f"sample {idx} did not emit JSON: {exc}")
        for key in ["should_reply", "detected_term", "reply_type", "risk_level", "draft_reply", "requires_human_review"]:
            if key not in result:
                fail(f"sample {idx} missing key {key}")
        if result["should_reply"] and not result["draft_reply"]:
            fail(f"sample {idx} should_reply but empty draft")
        if result["requires_human_review"] is not True:
            fail(f"sample {idx} must require human review")
        ok(f"sample {idx}: term={result.get('detected_term')} type={result.get('reply_type')} risk={result.get('risk_level')}")

    print("=" * 60)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
