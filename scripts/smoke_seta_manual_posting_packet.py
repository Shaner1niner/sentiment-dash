#!/usr/bin/env python
"""
Smoke test for SETA Manual Posting Packet v1.
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

DRAFT_OUT = REPO_ROOT / "reply_agent" / "draft_queue" / "_smoke_manual_packet"
REVIEW_OUT = REPO_ROOT / "reply_agent" / "review_queue" / "_smoke_manual_packet"
APPROVED_OUT = REPO_ROOT / "reply_agent" / "approved_replies" / "_smoke_manual_packet"
PACKET_OUT = REPO_ROOT / "reply_agent" / "manual_posting_packets" / "_smoke"


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


def newest(path: Path, pattern: str) -> Path:
    matches = sorted(path.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        fail(f"no files matching {pattern} in {path}")
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
    print("SETA manual posting packet smoke test")
    print("=" * 76)

    builder = SCRIPTS_DIR / "build_seta_reply_draft_queue.py"
    reviewer = SCRIPTS_DIR / "review_seta_reply_queue.py"
    exporter = SCRIPTS_DIR / "export_seta_approved_replies.py"
    packet_builder = SCRIPTS_DIR / "build_seta_manual_posting_packet.py"

    for path, label in [
        (builder, "draft queue builder"),
        (reviewer, "reviewer"),
        (exporter, "approved exporter"),
        (packet_builder, "manual packet builder"),
        (SAMPLE_INPUT, "sample input"),
    ]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

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
    draft_jsonl = newest(DRAFT_OUT, "*.jsonl")
    ok(f"built draft queue: {draft_jsonl}")

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
        "manual packet smoke",
    ])
    ok(f"built reviewed queue: {reviewed_path}")

    APPROVED_OUT.mkdir(parents=True, exist_ok=True)
    run([
        sys.executable,
        str(exporter),
        "--input",
        str(reviewed_path),
        "--out-dir",
        str(APPROVED_OUT),
    ])
    approved_jsonl = newest(APPROVED_OUT, "*.jsonl")
    ok(f"built approved export: {approved_jsonl}")

    PACKET_OUT.mkdir(parents=True, exist_ok=True)
    proc = run([
        sys.executable,
        str(packet_builder),
        "--input",
        str(approved_jsonl),
        "--out-dir",
        str(PACKET_OUT),
    ])
    print(proc.stdout)

    packet_jsonl = newest(PACKET_OUT, "seta_manual_posting_packet_*.jsonl")
    packet_csv = packet_jsonl.with_suffix(".csv")
    if not packet_csv.exists():
        fail(f"missing packet CSV: {packet_csv}")
    ok(f"found packet JSONL: {packet_jsonl}")
    ok(f"found packet CSV: {packet_csv}")

    rows = read_jsonl(packet_jsonl)
    if len(rows) != 2:
        fail(f"expected 2 packet rows, got {len(rows)}")
    ok("manual packet has approved rows only")

    for row in rows:
        if row.get("manual_posting_status") != "not_posted":
            fail("manual_posting_status should default to not_posted")
        if row.get("posting_performed") is not False:
            fail("posting_performed should be false")
        if row.get("ready_for_posting") is not False:
            fail("ready_for_posting should stay false")
        if row.get("requires_human_review") is not True:
            fail("requires_human_review should stay true")
        if not row.get("copy_paste_reply"):
            fail("copy_paste_reply is missing")
        if not isinstance(row.get("copy_paste_length"), int):
            fail("copy_paste_length should be an int")
    ok("manual-only safety invariants hold")

    with packet_csv.open("r", encoding="utf-8", newline="") as f:
        csv_rows = list(csv.DictReader(f))
    if len(csv_rows) != 2:
        fail(f"expected 2 CSV rows, got {len(csv_rows)}")
    for col in [
        "platform",
        "manual_posting_status",
        "copy_paste_reply",
        "source_comment_text",
        "posting_guardrail",
    ]:
        if col not in csv_rows[0]:
            fail(f"packet CSV missing column: {col}")
    ok("packet CSV includes copy/paste handoff columns")

    platform_csvs = list(PACKET_OUT.glob("*_manual_packet_*.csv"))
    if not platform_csvs:
        fail("expected at least one platform-specific CSV")
    ok(f"platform-specific CSVs created: {[p.name for p in platform_csvs]}")

    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
