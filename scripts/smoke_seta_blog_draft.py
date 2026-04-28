#!/usr/bin/env python
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT_BUILDER = ROOT / "scripts" / "build_seta_daily_content_packet.py"
WEBSITE_BUILDER = ROOT / "scripts" / "build_seta_website_snippets.py"
OUTLINE_BUILDER = ROOT / "scripts" / "build_seta_blog_outline.py"
DRAFT_BUILDER = ROOT / "scripts" / "build_seta_blog_draft.py"

CONTENT_SMOKE_DIR = ROOT / "reply_agent" / "content_packets" / "_smoke_blog_draft"
SNIPPETS_SMOKE_DIR = ROOT / "reply_agent" / "website_snippets" / "_smoke_blog_draft"
OUTLINE_SMOKE_DIR = ROOT / "reply_agent" / "blog_outlines" / "_smoke_blog_draft"
DRAFT_SMOKE_DIR = ROOT / "reply_agent" / "blog_drafts" / "_smoke"


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
    print("SETA blog draft smoke test")
    print("=" * 76)

    for path, label in [
        (CONTENT_BUILDER, "daily content packet builder"),
        (WEBSITE_BUILDER, "website snippet builder"),
        (OUTLINE_BUILDER, "blog outline builder"),
        (DRAFT_BUILDER, "blog draft builder"),
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
        fail("website snippets latest missing")
    ok(f"built smoke website snippets: {snippets_json}")

    run([
        sys.executable,
        str(OUTLINE_BUILDER),
        "--content",
        str(content_json),
        "--snippets",
        str(snippets_json),
        "--out-dir",
        str(OUTLINE_SMOKE_DIR),
    ])
    outline_json = OUTLINE_SMOKE_DIR / "seta_blog_outline_latest.json"
    if not outline_json.exists():
        fail("blog outline latest missing")
    ok(f"built smoke blog outline: {outline_json}")

    run([
        sys.executable,
        str(DRAFT_BUILDER),
        "--outline",
        str(outline_json),
        "--snippets",
        str(snippets_json),
        "--out-dir",
        str(DRAFT_SMOKE_DIR),
    ])
    draft_json = DRAFT_SMOKE_DIR / "seta_blog_draft_latest.json"
    draft_md = DRAFT_SMOKE_DIR / "seta_blog_draft_latest.md"
    if not draft_json.exists():
        fail("blog draft latest JSON missing")
    if not draft_md.exists():
        fail("blog draft latest Markdown missing")

    payload = json.loads(draft_json.read_text(encoding="utf-8"))
    required = [
        "title",
        "slug",
        "lead_asset",
        "supporting_assets",
        "markdown",
        "word_count_estimate",
        "guardrails",
    ]
    for key in required:
        if not payload.get(key):
            fail(f"draft missing {key}")

    if payload.get("draft_only") is not True:
        fail("draft_only invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed invariant failed")

    md = draft_md.read_text(encoding="utf-8")
    for phrase in ["Thesis", "Market context", "Closing read", "Draft-only"]:
        if phrase not in md:
            fail(f"Markdown missing phrase: {phrase}")

    banned = ["buy now", "sell now", "guaranteed", "this means price will"]
    low_md = md.lower()
    for b in banned:
        if b in low_md:
            fail(f"banned phrase found: {b}")

    wc = int(payload.get("word_count_estimate") or 0)
    if wc < 250:
        fail(f"draft too short; word_count_estimate={wc}")

    ok(f"title: {payload['title']}")
    ok(f"lead asset: {payload['lead_asset']}")
    ok(f"word count estimate: {wc}")
    ok("draft-only and no-posting invariants hold")
    ok("Markdown structure checks pass")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
