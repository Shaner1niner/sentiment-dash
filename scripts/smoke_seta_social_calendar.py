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
CALENDAR_BUILDER = ROOT / "scripts" / "build_seta_social_calendar.py"

CONTENT_SMOKE_DIR = ROOT / "reply_agent" / "content_packets" / "_smoke_social_calendar"
SNIPPETS_SMOKE_DIR = ROOT / "reply_agent" / "website_snippets" / "_smoke_social_calendar"
OUTLINE_SMOKE_DIR = ROOT / "reply_agent" / "blog_outlines" / "_smoke_social_calendar"
DRAFT_SMOKE_DIR = ROOT / "reply_agent" / "blog_drafts" / "_smoke_social_calendar"
CALENDAR_SMOKE_DIR = ROOT / "reply_agent" / "social_calendar" / "_smoke"


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
    print("SETA social content calendar smoke test")
    print("=" * 76)

    for path, label in [
        (CONTENT_BUILDER, "daily content packet builder"),
        (WEBSITE_BUILDER, "website snippet builder"),
        (OUTLINE_BUILDER, "blog outline builder"),
        (DRAFT_BUILDER, "blog draft builder"),
        (CALENDAR_BUILDER, "social calendar builder"),
    ]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    run([sys.executable, str(CONTENT_BUILDER), "--out-dir", str(CONTENT_SMOKE_DIR), "--max-terms", "8"])
    content_json = newest(CONTENT_SMOKE_DIR, "seta_daily_content_packet_*.json")
    ok(f"built content packet: {content_json}")

    run([sys.executable, str(WEBSITE_BUILDER), "--input", str(content_json), "--out-dir", str(SNIPPETS_SMOKE_DIR)])
    snippets_json = SNIPPETS_SMOKE_DIR / "seta_website_snippets_latest.json"
    if not snippets_json.exists():
        fail("website snippets latest missing")
    ok(f"built website snippets: {snippets_json}")

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
    ok(f"built blog outline: {outline_json}")

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
    if not draft_json.exists():
        fail("blog draft latest missing")
    ok(f"built blog draft: {draft_json}")

    run([
        sys.executable,
        str(CALENDAR_BUILDER),
        "--blog-draft",
        str(draft_json),
        "--snippets",
        str(snippets_json),
        "--outline",
        str(outline_json),
        "--out-dir",
        str(CALENDAR_SMOKE_DIR),
        "--max-assets",
        "5",
    ])

    latest_json = CALENDAR_SMOKE_DIR / "seta_social_calendar_latest.json"
    latest_md = CALENDAR_SMOKE_DIR / "seta_social_calendar_latest.md"
    if not latest_json.exists():
        fail("latest social calendar JSON missing")
    if not latest_md.exists():
        fail("latest social calendar Markdown missing")

    payload = json.loads(latest_json.read_text(encoding="utf-8"))
    rows = payload.get("rows", [])
    if not rows:
        fail("no calendar rows generated")

    if payload.get("draft_only") is not True:
        fail("draft_only invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed invariant failed")

    platforms = {r.get("platform") for r in rows}
    for p in ["x", "bsky", "reddit"]:
        if p not in platforms:
            fail(f"missing platform rows: {p}")

    for r in rows:
        text = r.get("draft_text", "")
        if not text:
            fail(f"empty draft_text for {r.get('id')}")
        if r.get("platform") == "x" and len(text) > 280:
            fail(f"x post too long: {r.get('id')}")
        if r.get("platform") == "bsky" and len(text) > 300:
            fail(f"bsky post too long: {r.get('id')}")
        low = text.lower()
        for banned in ["buy now", "sell now", "guaranteed", "this means price will"]:
            if banned in low:
                fail(f"banned phrase {banned} in {r.get('id')}")
        if r.get("requires_human_review") is not True:
            fail(f"row missing human review flag: {r.get('id')}")
        if r.get("posting_performed") is not False:
            fail(f"row posting_performed should be false: {r.get('id')}")

    ok(f"rows generated: {len(rows)}")
    ok(f"platforms: {sorted(platforms)}")
    ok("draft-only and no-posting invariants hold")
    ok("platform length and safety checks pass")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
