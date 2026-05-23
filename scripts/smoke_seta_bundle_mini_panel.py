#!/usr/bin/env python
"""Smoke-test member-only SETA bundle mini-panel wiring and ranking summary tokens."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MINI_PANEL = ROOT / "src" / "seta_bundle_mini_panel.js"
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
    text = require_file(MINI_PANEL, "mini-panel module")
    if not text:
        return
    for token, label in [
        ("SETA bundle mini-panel v2", "module declares mini-panel v2"),
        ("SETA_BUNDLE_MINI_PANEL", "module exports global API"),
        ("parseCsvPreview", "module includes CSV preview parser"),
        ("parseCsvRecords", "module includes CSV record parser"),
        ("rankCsvRecords", "module includes ranking summary function"),
        ("chooseRankColumn", "module includes defensive rank-column selection"),
        ("RANK_COLUMN_HINTS", "module includes preferred rank-column hints"),
        ("LABEL_COLUMN_HINTS", "module includes label-column hints"),
        ("renderSetaBundleMiniPanel", "module includes render entrypoint"),
        ("loadSetaBundleCsv", "module calls loader CSV read path"),
        ("setaMiniUniverse", "module includes universe control"),
        ("setaMiniWeighting", "module includes weighting control"),
        ("setaMiniRole", "module includes level control"),
        ("market-cap is an alternate participation-structure lens, not a prediction or trade signal", "module includes non-predictive mcap copy"),
        ("Rows", "module renders row count"),
        ("Source file", "module renders source file"),
        ("Rank column", "module renders selected rank column"),
        ("Top 5", "module renders top-5 summary"),
        ("Bottom 5", "module renders bottom-5 summary"),
        ("First 5 CSV records", "module preserves CSV preview"),
        ("Ranking unavailable: no usable numeric SETA-like column found", "module has quiet no-ranking fallback"),
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
    ]:
        require_token(text, token, label)


def check_public_embeds() -> None:
    for path in PUBLIC_EMBEDS:
        text = require_file(path, f"public embed {path.name}")
        if not text:
            continue
        reject_token(text, "src/seta_bundle_mini_panel.js", f"{path.name} does not load SETA mini-panel")


def main() -> int:
    print("=" * 60)
    print("SETA bundle mini-panel smoke test")
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
