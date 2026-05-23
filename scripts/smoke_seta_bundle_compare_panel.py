#!/usr/bin/env python
"""Smoke-test member-only SETA equal-vs-mcap comparison panel wiring."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPARE_PANEL = ROOT / "src" / "seta_bundle_compare_panel.js"
MEMBER_EMBED = ROOT / "interactive_dashboard_fix24_member_embed.html"
PUBLIC_EMBEDS = [
    ROOT / "interactive_dashboard_fix24_public_embed.html",
    ROOT / "interactive_dashboard_fix24_public_legacy_embed.html",
]

ERRORS: list[str] = []
WARNINGS: list[str] = []


def ok(message: str) -> None:
    print(f"[OK] {message}")


def fail(message: str) -> None:
    ERRORS.append(message)
    print(f"[ERROR] {message}")


def warn(message: str) -> None:
    WARNINGS.append(message)
    print(f"[WARN] {message}")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig")


def require_file(path: Path, label: str) -> str:
    if not path.exists():
        fail(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    ok(f"found {label}: {path.relative_to(ROOT)}")
    return read_text(path)


def require_token(text: str, token: str, label: str) -> None:
    if token in text:
        ok(label)
    else:
        fail(f"missing token for {label}: {token}")


def reject_token(text: str, token: str, label: str) -> None:
    if token in text:
        fail(f"unexpected token for {label}: {token}")
    else:
        ok(label)


def check_module() -> None:
    text = require_file(COMPARE_PANEL, "comparison panel module")
    if not text:
        return
    for token, label in [
        ("SETA bundle comparison panel v1", "module declares comparison panel v1"),
        ("SETA_BUNDLE_COMPARE_PANEL", "module exports global API"),
        ("compareEqualMcap", "module includes equal-vs-mcap comparison function"),
        ("chooseSharedRankColumn", "module includes shared rank-column selection"),
        ("chooseSharedLabelColumn", "module includes shared label-column selection"),
        ("rankedByLabel", "module ranks rows by label"),
        ("loadSetaBundleCsv", "module calls loader CSV read path"),
        ("weighting: 'equal'", "module explicitly loads equal weighting"),
        ("weighting: 'mcap'", "module explicitly loads mcap weighting"),
        ("setaCompareUniverse", "module includes universe control"),
        ("setaCompareRole", "module includes level control"),
        ("Rows matched", "module renders matched row count"),
        ("Comparison column", "module renders comparison column"),
        ("Top mcap risers", "module renders mcap risers"),
        ("Top mcap decliners", "module renders mcap decliners"),
        ("E ${escapeHTML(row.equalRank)}", "module renders equal rank"),
        ("M ${escapeHTML(row.mcapRank)}", "module renders mcap rank"),
        ("Δ ${escapeHTML", "module renders rank delta"),
        ("participation-structure lens, not a price prediction or trade signal", "module includes non-predictive comparison copy"),
        ("Comparison unavailable: no shared label and numeric SETA-like column found", "module has quiet no-comparison fallback"),
        ("escapeHTML", "module escapes rendered values"),
    ]:
        require_token(text, token, label)


def check_member_embed() -> None:
    text = require_file(MEMBER_EMBED, "member embed")
    if not text:
        return
    for token, label in [
        ("src/seta_bundle_loader.js?v=seta_bundle_loader_v1", "member embed loads SETA bundle loader"),
        ("src/seta_bundle_status_card.js?v=seta_bundle_status_card_v1", "member embed loads SETA status card"),
        ("src/seta_bundle_mini_panel.js?v=seta_bundle_mini_panel_v1", "member embed loads SETA mini-panel"),
        ("src/seta_bundle_compare_panel.js?v=seta_bundle_compare_panel_v1", "member embed loads SETA comparison panel"),
    ]:
        require_token(text, token, label)


def check_public_embeds() -> None:
    for path in PUBLIC_EMBEDS:
        text = require_file(path, f"public embed {path.name}")
        if not text:
            continue
        reject_token(text, "src/seta_bundle_compare_panel.js", f"{path.name} does not load SETA comparison panel")


def main() -> int:
    print("=" * 60)
    print("SETA bundle comparison panel smoke test")
    print(f"Repo: {ROOT}")
    print("=" * 60)

    check_module()
    check_member_embed()
    check_public_embeds()

    print("=" * 60)
    if ERRORS:
        print("FAILED")
        for error in ERRORS:
            print(f" - {error}")
        return 1
    print("PASSED")
    if WARNINGS:
        print("Warnings:")
        for warning in WARNINGS:
            print(f" - {warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
