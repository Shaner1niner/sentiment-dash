#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BLOG_BUILDER = ROOT / "scripts" / "build_seta_blog_outline.py"
WEBSITE_BUILDER = ROOT / "scripts" / "build_seta_website_snippets.py"
CONTENT_BUILDER = ROOT / "scripts" / "build_seta_daily_content_packet.py"

CONTENT_SMOKE_DIR = ROOT / "reply_agent" / "content_packets" / "_smoke_blog_outline"
SNIPPETS_SMOKE_DIR = ROOT / "reply_agent" / "website_snippets" / "_smoke_blog_outline"
BLOG_SMOKE_DIR = ROOT / "reply_agent" / "blog_outlines" / "_smoke"


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
    print("SETA blog outline smoke test")
    print("=" * 76)

    for path, label in [
        (BLOG_BUILDER, "blog outline builder"),
        (WEBSITE_BUILDER, "website snippet builder"),
        (CONTENT_BUILDER, "daily content packet builder"),
    ]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    run([sys.executable, str(CONTENT_BUILDER), "--out-dir", str(CONTENT_SMOKE_DIR), "--max-terms", "8"])
    content_json = newest(CONTENT_SMOKE_DIR, "seta_daily_content_packet_*.json")
    ok(f"built smoke content packet: {content_json}")

    run([sys.executable, str(WEBSITE_BUILDER), "--input", str(content_json), "--out-dir", str(SNIPPETS_SMOKE_DIR)])
    snippets_json = SNIPPETS_SMOKE_DIR / "seta_website_snippets_latest.json"
    if not snippets_json.exists():
        fail("smoke website snippets latest JSON missing")
    ok(f"built smoke website snippets: {snippets_json}")

    run([
        sys.executable,
        str(BLOG_BUILDER),
        "--content",
        str(content_json),
        "--snippets",
        str(snippets_json),
        "--out-dir",
        str(BLOG_SMOKE_DIR),
    ])

    latest_json = BLOG_SMOKE_DIR / "seta_blog_outline_latest.json"
    latest_md = BLOG_SMOKE_DIR / "seta_blog_outline_latest.md"
    if not latest_json.exists():
        fail("latest blog outline JSON missing")
    if not latest_md.exists():
        fail("latest blog outline Markdown missing")

    payload = json.loads(latest_json.read_text(encoding="utf-8"))
    required = [
        "title",
        "subtitle",
        "thesis",
        "lead_asset",
        "core_angle",
        "supporting_assets",
        "recommended_structure",
        "style_guardrails",
    ]
    for key in required:
        if not payload.get(key):
            fail(f"blog outline missing {key}")

    if payload.get("draft_only") is not True:
        fail("draft_only invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed invariant failed")

    md = latest_md.read_text(encoding="utf-8")
    for phrase in ["Working thesis", "Core angle", "Suggested close", "Draft-only"]:
        if phrase not in md:
            fail(f"Markdown missing phrase: {phrase}")

    banned = ["buy now", "sell now", "guaranteed", "this means price will"]
    low_md = md.lower()
    for b in banned:
        if b in low_md:
            fail(f"banned phrase found: {b}")

    ok(f"lead asset: {payload['lead_asset'].get('term')}")
    ok(f"supporting count: {len(payload.get('supporting_assets', []))}")
    ok("draft-only and no-posting invariants hold")
    ok("Markdown structure checks pass")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
