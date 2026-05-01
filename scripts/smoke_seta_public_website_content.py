#!/usr/bin/env python
from __future__ import annotations

import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "scripts" / "run_seta_content_pipeline.py"
PUBLISHER = ROOT / "scripts" / "publish_seta_public_website_content.py"
SMOKE_PIPELINE_OUT = ROOT / "reply_agent" / "pipeline_runs" / "_smoke_public_website_content"
SMOKE_PUBLIC_OUT = ROOT / "public_content" / "_smoke"
LOCAL_DAILY_CONTEXT = ROOT / "reply_agent" / "daily_context" / "seta_daily_context_latest.json"

def ok(msg: str) -> None:
    print(f"[OK] {msg}")

def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)

def skip(msg: str) -> None:
    print(f"[SKIP] {msg}")

def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True)
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        fail(f"command failed: {' '.join(cmd)}")

def main() -> int:
    print("=" * 76)
    print("SETA public website content smoke test")
    print("=" * 76)
    for path, label in [(PIPELINE, "content pipeline runner"), (PUBLISHER, "public website content publisher")]:
        if not path.exists():
            fail(f"missing {label}: {path}")
        ok(f"found {label}")

    if not LOCAL_DAILY_CONTEXT.exists() or LOCAL_DAILY_CONTEXT.stat().st_size == 0:
        skip(
            "local daily context is not present; run scripts/build_seta_daily_context.py "
            "on the production machine before running this integration smoke"
        )
        print("=" * 76)
        print("SKIPPED")
        return 0

    run([sys.executable, str(PIPELINE), "--out-dir", str(SMOKE_PIPELINE_OUT)])
    snippets = ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json"
    if not snippets.exists():
        fail("website snippets latest JSON missing after pipeline")

    run([sys.executable, str(PUBLISHER), "--input-json", str(snippets), "--out-dir", str(SMOKE_PUBLIC_OUT)])

    latest_json = SMOKE_PUBLIC_OUT / "seta_website_snippets_latest.json"
    latest_md = SMOKE_PUBLIC_OUT / "seta_website_snippets_latest.md"
    if not latest_json.exists():
        fail("public latest JSON missing")
    if not latest_md.exists():
        fail("public latest Markdown missing")

    payload = json.loads(latest_json.read_text(encoding="utf-8"))
    if payload.get("schema_version") != "seta_public_website_snippets_v1":
        fail(f"unexpected schema_version: {payload.get('schema_version')}")
    if payload.get("public_safe") is not True:
        fail("public_safe invariant failed")
    if payload.get("posting_performed") is not False:
        fail("posting_performed invariant failed")
    snippets_out = payload.get("snippets", [])
    if not isinstance(snippets_out, list) or not snippets_out:
        fail("no snippets in public payload")

    text = latest_json.read_text(encoding="utf-8").lower()
    for raw in ["c:\\\\users", "g:\\\\my drive", "reply_agent\\\\pipeline_runs"]:
        if raw.lower() in text:
            fail(f"internal path leaked into public JSON: {raw}")

    for s in snippets_out:
        if not isinstance(s, dict) or not s.get("term") or not s.get("headline"):
            fail("bad snippet in public payload")

    md = latest_md.read_text(encoding="utf-8")
    if "SETA explains behavior beneath price" not in md or "Risk note" not in md:
        fail("public Markdown missing SETA framing/risk notes")

    ok(f"public snippets: {len(snippets_out)}")
    ok("public_safe and no-posting invariants hold")
    ok("no internal paths found")
    print("=" * 76)
    print("PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
