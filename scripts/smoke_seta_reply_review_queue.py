#!/usr/bin/env python
"""Smoke test for SETA reply review / approval workflow v1."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SAMPLE_INPUT = ROOT / "reply_agent" / "sample_inputs" / "sample_queue_comments.jsonl"
BUILDER = ROOT / "scripts" / "build_seta_reply_draft_queue.py"
REVIEWER = ROOT / "scripts" / "review_seta_reply_queue.py"
SMOKE_DIR = ROOT / "reply_agent" / "review_queue" / "_smoke"
DRAFT_DIR = ROOT / "reply_agent" / "draft_queue" / "_smoke_review"


def run(cmd):
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr, file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def read_jsonl(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def latest_jsonl(folder: Path) -> Path:
    files = sorted(folder.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        raise SystemExit(f"[ERROR] No JSONL outputs found in {folder}")
    return files[0]


def main() -> int:
    print("=" * 84)
    print("SETA reply review queue smoke test")
    print("=" * 84)

    for p, label in [(SAMPLE_INPUT, "sample queue input"), (BUILDER, "queue builder"), (REVIEWER, "reviewer")]:
        if not p.exists():
            raise SystemExit(f"[ERROR] missing {label}: {p}")
        print(f"[OK] found {label}")

    DRAFT_DIR.mkdir(parents=True, exist_ok=True)
    SMOKE_DIR.mkdir(parents=True, exist_ok=True)

    run([sys.executable, str(BUILDER), "--input", str(SAMPLE_INPUT), "--out-dir", str(DRAFT_DIR), "--limit", "4"])
    draft_path = latest_jsonl(DRAFT_DIR)
    print(f"[OK] built draft queue: {draft_path}")

    reviewed_path = SMOKE_DIR / "seta_reply_reviewed_smoke.jsonl"
    proc = run([
        sys.executable,
        str(REVIEWER),
        "--input",
        str(draft_path),
        "--output",
        str(reviewed_path),
        "--approve",
        "1,3",
        "--reject",
        "4",
        "--reviewed-by",
        "smoke_test",
        "--note",
        "smoke validation",
    ])
    print(proc.stdout)

    rows = read_jsonl(reviewed_path)
    if len(rows) != 4:
        raise SystemExit(f"[ERROR] expected 4 reviewed rows, got {len(rows)}")
    if rows[0].get("status") != "approved":
        raise SystemExit("[ERROR] row 1 was not approved")
    if rows[2].get("status") != "approved":
        raise SystemExit("[ERROR] row 3 was not approved")
    if rows[3].get("status") != "rejected":
        raise SystemExit("[ERROR] row 4 was not rejected")
    if not all(r.get("draft_only") is True for r in rows):
        raise SystemExit("[ERROR] draft_only invariant failed")
    if not all(r.get("requires_human_review") is True for r in rows):
        raise SystemExit("[ERROR] requires_human_review invariant failed")
    if not reviewed_path.with_suffix(".csv").exists():
        raise SystemExit("[ERROR] reviewed CSV output missing")

    print("[OK] reviewed queue has 4 rows")
    print("[OK] approvals/rejections applied")
    print("[OK] draft-only invariant holds")
    print("[OK] CSV mirror exists")
    print("=" * 84)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
