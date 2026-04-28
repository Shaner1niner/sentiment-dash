#!/usr/bin/env python
"""Smoke test for SETA Reply Draft Queue v1."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd()
SCRIPT = ROOT / "scripts" / "build_seta_reply_draft_queue.py"
SAMPLE = ROOT / "reply_agent" / "sample_inputs" / "sample_queue_comments.jsonl"
OUT_DIR = ROOT / "reply_agent" / "draft_queue" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    raise SystemExit(f"[ERROR] {msg}")


def main() -> int:
    print("=" * 60)
    print("SETA reply queue smoke test")
    print("=" * 60)
    if not SCRIPT.exists():
        fail(f"missing {SCRIPT}")
    ok("found queue builder")
    if not SAMPLE.exists():
        fail(f"missing {SAMPLE}")
    ok("found sample queue input")
    if not (ROOT / "scripts" / "draft_seta_social_reply.py").exists():
        fail("missing scripts/draft_seta_social_reply.py")
    ok("found draft reply script")

    cmd = [sys.executable, str(SCRIPT), "--input", str(SAMPLE), "--out-dir", str(OUT_DIR), "--limit", "4"]
    proc = subprocess.run(cmd, text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        fail("queue builder failed")
    print(proc.stdout)

    jsonl_files = sorted(OUT_DIR.glob("seta_reply_drafts_*.jsonl"))
    csv_files = sorted(OUT_DIR.glob("seta_reply_drafts_*.csv"))
    if not jsonl_files:
        fail("no JSONL queue output found")
    if not csv_files:
        fail("no CSV queue output found")
    latest = jsonl_files[-1]
    rows = [json.loads(line) for line in latest.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(rows) != 4:
        fail(f"expected 4 queue rows, got {len(rows)}")
    ok("queue output has 4 rows")
    if not all(r.get("requires_human_review") is True for r in rows):
        fail("all rows must require human review")
    ok("all rows require human review")
    if any(r.get("posted") for r in rows):
        fail("draft queue should never mark posted=true")
    ok("draft-only invariant holds")
    if not any(r.get("should_reply") for r in rows):
        fail("expected at least one should_reply=true row")
    ok("at least one reply draft generated")
    print("=" * 60)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
