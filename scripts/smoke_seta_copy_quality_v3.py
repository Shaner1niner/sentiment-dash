#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_seta_website_snippets.py"
CONTENT_BUILDER = ROOT / "scripts" / "build_seta_daily_content_packet.py"
OUT_CONTENT = ROOT / "reply_agent" / "content_packets" / "_smoke_copy_quality_v3"
OUT_SNIPPETS = ROOT / "reply_agent" / "website_snippets" / "_smoke_copy_quality_v3"


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


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        fail(f"command failed: {' '.join(cmd)}")
    return proc


def main() -> int:
    print("=" * 76)
    print("SETA Copy Quality v3 smoke test")
    print("=" * 76)

    for path, label in [(BUILDER, "website snippet builder"), (CONTENT_BUILDER, "daily content builder")]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    run([sys.executable, str(CONTENT_BUILDER), "--out-dir", str(OUT_CONTENT), "--max-terms", "10"])
    packet = newest(OUT_CONTENT, "seta_daily_content_packet_*.json")
    ok(f"built content packet: {packet}")

    run([sys.executable, str(BUILDER), "--input", str(packet), "--out-dir", str(OUT_SNIPPETS)])
    latest = OUT_SNIPPETS / "seta_website_snippets_latest.json"
    if not latest.exists():
        fail("latest website snippets JSON missing")

    payload = json.loads(latest.read_text(encoding="utf-8"))
    snippets = payload.get("snippets", [])
    if len(snippets) < 1:
        fail("no snippets generated")

    required = [
        "term",
        "headline",
        "one_liner",
        "public_note",
        "short_explanation",
        "expanded_explanation",
        "watch_condition",
        "seta_read_line",
        "social_blurb",
        "risk_note",
        "copy_archetype",
    ]

    for s in snippets:
        for key in required:
            if not s.get(key):
                fail(f"snippet missing {key}: {s.get('term')}")
        if len(s.get("headline", "")) > 100:
            fail(f"headline too long for {s.get('term')}")
        if len(s.get("public_note", "")) > 460:
            fail(f"public_note too long for {s.get('term')}")
        combined = (s.get("public_note", "") + " " + s.get("social_blurb", "")).lower()
        if "financial advice" in combined or "guaranteed" in combined:
            fail(f"forbidden phrase in {s.get('term')}")

    md = newest(OUT_SNIPPETS, "seta_website_snippets_*.md")
    text = md.read_text(encoding="utf-8")
    if "**Watch condition:**" not in text:
        fail("Markdown missing Watch condition lines")
    if "**SETA read:**" not in text:
        fail("Markdown missing SETA read lines")
    if text.count("Risk note") < len(snippets):
        fail("Markdown missing risk note coverage")
    if "Daily state:" in text:
        fail("Markdown still includes old data-label phrasing: Daily state")

    ok(f"snippets checked: {len(snippets)}")
    ok("presentation fields present")
    ok("Markdown has Watch condition and SETA read structure")
    ok("old data-label phrasing reduced")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
