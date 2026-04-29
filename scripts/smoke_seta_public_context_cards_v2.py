#!/usr/bin/env python
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "seta_public_context_cards.html"
DATA = ROOT / "public_content" / "seta_website_snippets_latest.json"

def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)

def ok(msg: str) -> None:
    print(f"[OK] {msg}")

def main() -> int:
    print("=" * 76)
    print("SETA public context cards v2 smoke test")
    print("=" * 76)
    if not HTML.exists():
        fail(f"missing HTML page: {HTML}")
    ok("found public context cards HTML")
    if not DATA.exists():
        fail(f"missing public snippets JSON: {DATA}")
    ok("found public snippets JSON")
    html = HTML.read_text(encoding="utf-8")
    for token in [
        "Behavior beneath price",
        "Attention is not validation",
        "setaFeatured",
        "setaStatus",
        "setaActions",
        "public_safe=true",
        "posting_performed=false",
        "More context",
        "context only",
        "scroll-margin-top",
        "window.SETA_PUBLIC_SNIPPETS_URL",
        "URLSearchParams",
        "INITIAL_ASSET",
        "INITIAL_UNIVERSE",
        "COMPACT_MODE",
        "Open the SETA Dashboard",
    ]:
        if token not in html:
            fail(f"HTML missing v2 token: {token}")
    ok("HTML contains expected v2 card hooks")
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    if payload.get("schema_version") != "seta_public_website_snippets_v1":
        fail(f"unexpected schema_version: {payload.get('schema_version')}")
    if payload.get("public_safe") is not True:
        fail("public_safe is not true")
    if payload.get("posting_performed") is not False:
        fail("posting_performed is not false")
    snippets = payload.get("snippets", [])
    if not isinstance(snippets, list) or not snippets:
        fail("public snippets missing or empty")
    if not any(str(s.get("watch_condition", "")).strip() for s in snippets if isinstance(s, dict)):
        fail("no snippet has watch_condition")
    if not any(str(s.get("seta_read_line", "")).strip() for s in snippets if isinstance(s, dict)):
        fail("no snippet has seta_read_line")
    ok(f"public snippets available: {len(snippets)}")
    ok("public-safe invariants hold")
    ok("v2 presentation hooks present")
    print("=" * 76)
    print("PASSED")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
