#!/usr/bin/env python
# Smoke test for SETA reply draft queue context columns.

from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_seta_reply_draft_queue.py"
SAMPLE_INPUT = ROOT / "reply_agent" / "sample_inputs" / "sample_queue_comments.jsonl"
OUT_DIR = ROOT / "reply_agent" / "draft_queue" / "_smoke_context_columns"

REQUIRED_COLUMNS = [
    "daily_asset_state",
    "daily_structural_state",
    "daily_decision_pressure_rank",
    "daily_resolution_skew",
    "narrative_regime",
    "narrative_coherence_bucket",
    "narrative_top_keywords",
    "layers_used",
]


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> int:
    print(f"[ERROR] {msg}")
    return 1


def latest_file(pattern: str) -> Path | None:
    matches = sorted(OUT_DIR.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return matches[0] if matches else None


def main() -> int:
    print("=" * 76)
    print("SETA reply queue context-column smoke test")
    print("=" * 76)
    if not BUILDER.exists():
        return fail(f"missing builder: {BUILDER}")
    ok("found queue builder")
    if not SAMPLE_INPUT.exists():
        return fail(f"missing sample input: {SAMPLE_INPUT}")
    ok("found sample queue input")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(BUILDER),
        "--input",
        str(SAMPLE_INPUT),
        "--out-dir",
        str(OUT_DIR),
        "--limit",
        "4",
    ]
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True)
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        return fail("queue builder failed")

    out_jsonl = latest_file("seta_reply_drafts_*.jsonl")
    out_csv = latest_file("seta_reply_drafts_*.csv")
    if not out_jsonl or not out_csv:
        return fail("missing queue outputs")
    ok(f"found JSONL output: {out_jsonl}")
    ok(f"found CSV output: {out_csv}")

    rows = [json.loads(line) for line in out_jsonl.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not rows:
        return fail("JSONL output has no rows")
    ok(f"JSONL output has {len(rows)} rows")
    if not all(row.get("requires_human_review") is True for row in rows):
        return fail("all rows must require human review")
    ok("all rows require human review")
    if not all(row.get("draft_only") is True for row in rows):
        return fail("draft-only invariant failed")
    ok("draft-only invariant holds")
    if not any(row.get("daily_asset_state") for row in rows):
        return fail("no rows have daily_asset_state")
    ok("at least one row has daily context columns")
    if not any(row.get("narrative_regime") for row in rows):
        return fail("no rows have narrative_regime")
    ok("at least one row has narrative context columns")

    with out_csv.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        missing = [col for col in REQUIRED_COLUMNS if col not in (reader.fieldnames or [])]
    if missing:
        return fail(f"CSV missing required context columns: {missing}")
    ok("CSV includes flattened daily/narrative context columns")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
