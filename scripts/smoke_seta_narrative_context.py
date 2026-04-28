#!/usr/bin/env python
"""Smoke test for SETA Narrative TF-IDF Context v1."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_seta_narrative_context.py"
OUT_DIR = ROOT / "reply_agent" / "narrative_context" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    print(f"[FAIL] {msg}")
    raise SystemExit(1)


def main() -> int:
    print("=" * 72)
    print("SETA narrative TF-IDF context smoke test")
    print("=" * 72)

    if not BUILDER.exists():
        fail(f"missing builder: {BUILDER}")
    ok("found narrative context builder")

    cmd = [sys.executable, str(BUILDER), "--out-dir", str(OUT_DIR), "--top-n", "5"]
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True)
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        fail("builder failed")

    latest = OUT_DIR / "seta_narrative_context_latest.json"
    if not latest.exists():
        fail("latest narrative context missing")
    ok("latest narrative context exists")

    with latest.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if data.get("schema_version") != "seta_narrative_context_v1":
        fail("unexpected schema_version")
    ok("schema version is v1")

    if data.get("draft_only") is not True:
        fail("draft_only invariant failed")
    ok("draft-only invariant holds")

    by_term = data.get("by_term") or {}
    if len(by_term) < 3:
        fail(f"too few terms: {len(by_term)}")
    ok(f"by_term count={len(by_term)}")

    required = ["BTC", "ETH"]
    for term in required:
        if term not in by_term:
            fail(f"missing {term}")
        item = by_term[term]
        if not item.get("top_keywords"):
            fail(f"{term} missing top_keywords")
        if not item.get("top_lifts"):
            fail(f"{term} missing top_lifts")
        if not item.get("reply_note"):
            fail(f"{term} missing reply_note")
        ok(f"{term} has narrative keywords, lifts, and reply_note")

    print("=" * 72)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
