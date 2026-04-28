#!/usr/bin/env python
"""
Smoke test for SETA Approved Replies Export v1.
"""

from __future__ import annotations

import csv
import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
SCRIPTS_DIR = REPO_ROOT / "scripts"
SAMPLE_INPUT = REPO_ROOT / "reply_agent" / "sample_inputs" / "sample_queue_comments.jsonl"
DRAFT_OUT = REPO_ROOT / "reply_agent" / "draft_queue" / "_smoke_approved_export"
REVIEW_OUT = REPO_ROOT / "reply_agent" / "review_queue" / "_smoke_approved_export"
APPROVED_OUT = REPO_ROOT / "reply_agent" / "approved_replies" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(cmd, cwd=str(REPO_ROOT), text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        fail(f"command failed: {' '.join(cmd)}")
    return proc


def newest_jsonl(path: Path) -> Path:
    matches = sorted(path.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        fail(f"no JSONL files found in {path}")
    return matches[0]


def read_jsonl(path: Path) -> list[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    return rows


def main() -> int:
    print("=" * 76)
    print("SETA approved replies export smoke test")
    print("=" * 76)

    builder = SCRIPTS_DIR / "build_seta_reply_draft_queue.py"
    reviewer = SCRIPTS_DIR / "review_seta_reply_queue.py"
    exporter = SCRIPTS_DIR / "export_seta_approved_replies.py"

    for path, label in [
        (builder, "draft queue builder"),
        (reviewer, "reviewer"),
        (exporter, "approved exporter"),
        (SAMPLE_INPUT, "sample queue input"),
    ]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    # 1. Build a draft queue from sample comments.
    DRAFT_OUT.mkdir(parents=True, exist_ok=True)
    run([
        sys.executable,
        str(builder),
        "--input",
        str(SAMPLE_INPUT),
        "--out-dir",
        str(DRAFT_OUT),
        "--limit",
        "4",
    ])
    draft_jsonl = newest_jsonl(DRAFT_OUT)
    ok(f"built draft queue: {draft_jsonl}")

    # 2. Review it: approve 1 and 3, reject 2, leave 4 pending.
    REVIEW_OUT.mkdir(parents=True, exist_ok=True)
    reviewed_path = REVIEW_OUT / "seta_reply_reviewed_smoke.jsonl"
    run([
        sys.executable,
        str(reviewer),
        "--input",
        str(draft_jsonl),
        "--output",
        str(reviewed_path),
        "--approve",
        "1,3",
        "--reject",
        "2",
        "--reviewed-by",
        "smoke",
        "--note",
        "approved export smoke",
    ])
    ok(f"built reviewed queue: {reviewed_path}")

    reviewed_rows = read_jsonl(reviewed_path)
    approved_reviewed = [r for r in reviewed_rows if str(r.get("status", "")).lower() == "approved"]
    if len(approved_reviewed) != 2:
        fail(f"expected 2 approved reviewed rows, got {len(approved_reviewed)}")
    ok("reviewed queue has 2 approved rows")

    # 3. Export approved-only rows.
    APPROVED_OUT.mkdir(parents=True, exist_ok=True)
    proc = run([
        sys.executable,
        str(exporter),
        "--input",
        str(reviewed_path),
        "--out-dir",
        str(APPROVED_OUT),
    ])
    print(proc.stdout)

    approved_jsonl = newest_jsonl(APPROVED_OUT)
    approved_csv = approved_jsonl.with_suffix(".csv")
    if not approved_csv.exists():
        fail(f"missing CSV mirror: {approved_csv}")
    ok(f"found approved JSONL: {approved_jsonl}")
    ok(f"found approved CSV: {approved_csv}")

    rows = read_jsonl(approved_jsonl)
    if len(rows) != 2:
        fail(f"expected 2 exported rows, got {len(rows)}")
    ok("approved export has 2 rows")

    for row in rows:
        if row.get("status") != "approved":
            fail("export included a non-approved row")
        if row.get("posting_performed") is True:
            fail("posting_performed should never be true")
        if row.get("ready_for_posting") is not False:
            fail("ready_for_posting should default to false")
        if row.get("requires_human_review") is not True:
            fail("requires_human_review should remain true")
        if not row.get("draft_reply"):
            fail("approved row missing draft_reply")
        if "posting_guardrail" not in row:
            fail("approved row missing posting_guardrail")
    ok("approved-only and safety invariants hold")

    with approved_csv.open("r", encoding="utf-8", newline="") as f:
        csv_rows = list(csv.DictReader(f))
    if len(csv_rows) != 2:
        fail(f"expected 2 CSV rows, got {len(csv_rows)}")
    for col in ["platform", "detected_term", "draft_reply", "ready_for_posting", "posting_guardrail"]:
        if col not in csv_rows[0]:
            fail(f"CSV missing column: {col}")
    ok("CSV mirror includes expected posting-handoff columns")

    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
