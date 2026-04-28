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
    print("SETA public context cards smoke test")
    print("=" * 76)

    if not HTML.exists():
        fail(f"missing HTML page: {HTML}")
    ok("found public context cards HTML")

    if not DATA.exists():
        fail(f"missing public snippets JSON: {DATA}")
    ok("found public snippets JSON")

    html = HTML.read_text(encoding="utf-8")
    required_html = [
        "SETA Market Context",
        "public_content/seta_website_snippets_latest.json",
        "setaCards",
        "setaSearch",
        "public_safe",
        "posting_performed",
        "not a prediction or trade signal",
    ]
    for token in required_html:
        if token not in html:
            fail(f"HTML missing token: {token}")
    ok("HTML contains expected SETA card hooks")

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

    required_snippet_fields = ["term", "headline"]
    for i, snippet in enumerate(snippets[:5], start=1):
        for field in required_snippet_fields:
            if not str(snippet.get(field, "")).strip():
                fail(f"snippet {i} missing {field}")

    ok(f"public snippets available: {len(snippets)}")
    ok("public-safe invariants hold")
    print("=" * 76)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
