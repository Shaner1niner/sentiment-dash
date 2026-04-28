#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNNER = ROOT / "scripts" / "run_seta_content_pipeline.py"
SMOKE_OUT = ROOT / "reply_agent" / "pipeline_runs" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)


def main() -> int:
    print("=" * 76)
    print("SETA content pipeline runner smoke test")
    print("=" * 76)

    if not RUNNER.exists():
        fail(f"missing runner: {RUNNER}")
    ok("found pipeline runner")

    proc = subprocess.run(
        [
            sys.executable,
            str(RUNNER),
            "--out-dir",
            str(SMOKE_OUT),
        ],
        cwd=str(ROOT),
        text=True,
        capture_output=True,
    )

    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        fail("pipeline runner failed")

    latest_json = SMOKE_OUT / "seta_content_pipeline_run_latest.json"
    latest_md = SMOKE_OUT / "seta_content_pipeline_run_latest.md"
    if not latest_json.exists():
        fail("latest run JSON missing")
    if not latest_md.exists():
        fail("latest run Markdown missing")

    payload = json.loads(latest_json.read_text(encoding="utf-8"))
    if payload.get("status") != "passed":
        fail(f"pipeline status was not passed: {payload.get('status')}")
    if payload.get("draft_only") is not True:
        fail("draft_only invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed invariant failed")

    steps = payload.get("steps", [])
    if len(steps) < 5:
        fail(f"expected at least 5 steps, got {len(steps)}")

    for step in steps:
        if step.get("status") != "passed":
            fail(f"step did not pass: {step.get('name')} status={step.get('status')}")
        if step.get("safety_ok") is not True:
            fail(f"step safety failed: {step.get('name')}")

    final_outputs = payload.get("final_outputs", {})
    for key in ["website_snippets", "blog_outline", "blog_draft", "social_calendar"]:
        if key not in final_outputs:
            fail(f"missing final output key: {key}")

    md = latest_md.read_text(encoding="utf-8")
    for phrase in ["SETA Content Pipeline Run", "Draft-only pipeline", "Final outputs"]:
        if phrase not in md:
            fail(f"run Markdown missing phrase: {phrase}")

    ok(f"steps passed: {len(steps)}")
    ok("draft-only and no-posting invariants hold")
    ok("final outputs found")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
