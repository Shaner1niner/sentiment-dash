#!/usr/bin/env python
"""
Smoke test for SETA Website Explanation Snippets v1.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_BUILDER = REPO_ROOT / "scripts" / "build_seta_daily_content_packet.py"
SNIPPET_BUILDER = REPO_ROOT / "scripts" / "build_seta_website_snippets.py"
CONTENT_SMOKE_DIR = REPO_ROOT / "reply_agent" / "content_packets" / "_smoke_website_snippets"
SNIPPET_SMOKE_DIR = REPO_ROOT / "reply_agent" / "website_snippets" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)


def newest(path: Path, pattern: str) -> Path:
    matches = sorted(path.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    if not matches:
        fail(f"no files matching {pattern} in {path}")
    return matches[0]


def main() -> int:
    print("=" * 76)
    print("SETA website snippets smoke test")
    print("=" * 76)

    for path, label in [
        (CONTENT_BUILDER, "daily content packet builder"),
        (SNIPPET_BUILDER, "website snippet builder"),
    ]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    # Build a fresh small content packet for the smoke test.
    proc = subprocess.run(
        [sys.executable, str(CONTENT_BUILDER), "--out-dir", str(CONTENT_SMOKE_DIR), "--max-terms", "6"],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        fail("daily content packet builder failed")

    packet_json = newest(CONTENT_SMOKE_DIR, "seta_daily_content_packet_*.json")
    ok(f"built content packet: {packet_json}")

    proc = subprocess.run(
        [sys.executable, str(SNIPPET_BUILDER), "--input", str(packet_json), "--out-dir", str(SNIPPET_SMOKE_DIR)],
        cwd=str(REPO_ROOT),
        text=True,
        capture_output=True,
    )
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        fail("website snippet builder failed")

    latest = SNIPPET_SMOKE_DIR / "seta_website_snippets_latest.json"
    if not latest.exists():
        fail("latest snippet JSON missing")
    payload = json.loads(latest.read_text(encoding="utf-8"))

    if payload.get("draft_only") is not True:
        fail("draft_only invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed should be false")
    snippets = payload.get("snippets", [])
    if len(snippets) < 1:
        fail("no snippets generated")

    first = snippets[0]
    for key in ["term", "headline", "short_explanation", "risk_note", "social_blurb"]:
        if not first.get(key):
            fail(f"first snippet missing {key}")

    if "by_term" not in payload or not isinstance(payload["by_term"], dict):
        fail("by_term lookup missing")

    csvs = list(SNIPPET_SMOKE_DIR.glob("seta_website_snippets_*.csv"))
    mds = list(SNIPPET_SMOKE_DIR.glob("seta_website_snippets_*.md"))
    if not csvs:
        fail("CSV output missing")
    if not mds:
        fail("Markdown output missing")

    ok(f"snippets generated: {len(snippets)}")
    ok("draft-only and no-posting invariants hold")
    ok("JSON latest, CSV, and Markdown outputs exist")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
