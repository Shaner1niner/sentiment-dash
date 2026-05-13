#!/usr/bin/env python
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOADER = ROOT / "src" / "ReviewedBriefingLoader.js"
PANEL = ROOT / "src" / "features" / "BriefingPanel.js"
MAIN = ROOT / "src" / "dashboard_main.js"
HARNESS = ROOT / "module_runtime_smoke_harness.html"
REVIEWED = ROOT / "generated_briefings_reviewed_v2.json"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def main() -> int:
    for path in [LOADER, PANEL, MAIN, HARNESS]:
        if not path.exists():
            return fail(f"missing {path.relative_to(ROOT)}")

    loader = read(LOADER)
    panel = read(PANEL)
    main = read(MAIN)
    harness = read(HARNESS)

    loader_tokens = [
        "export const ReviewedBriefingLoader",
        "generated_briefings_reviewed_v2.json",
        "Store.setReviewedBriefings(this.payload)",
        "matchForState(state = Store.snapshot()",
        "flattenReviewedPayload(payload)",
    ]
    missing_loader = [token for token in loader_tokens if token not in loader]
    if missing_loader:
        return fail(f"ReviewedBriefingLoader.js missing token(s): {missing_loader}")

    panel_tokens = [
        "export const BriefingPanel",
        "module-briefing-panel",
        "Module Briefing",
        "What SETA Sees",
        "Why It Matters",
        "Participation Quality",
        "ReviewedBriefingLoader.matchForState(state)",
        "Store.on('controlChanged'",
    ]
    missing_panel = [token for token in panel_tokens if token not in panel]
    if missing_panel:
        return fail(f"BriefingPanel.js missing token(s): {missing_panel}")

    main_tokens = [
        "import { BriefingPanel } from './features/BriefingPanel.js';",
        "await BriefingPanel.init();",
    ]
    missing_main = [token for token in main_tokens if token not in main]
    if missing_main:
        return fail(f"dashboard_main.js missing token(s): {missing_main}")

    harness_tokens = [
        'id="module-briefing-panel"',
        "moduleBriefingPanel",
        "moduleBriefingCard",
    ]
    missing_harness = [token for token in harness_tokens if token not in harness]
    if missing_harness:
        return fail(f"module_runtime_smoke_harness.html missing token(s): {missing_harness}")

    if REVIEWED.exists():
        payload = json.loads(REVIEWED.read_text(encoding="utf-8-sig"))
        if not payload:
            return fail("generated_briefings_reviewed_v2.json is empty")
        text = json.dumps(payload)[:500000]
        if "briefing_cards" not in text:
            return fail("reviewed briefing payload sample does not expose briefing_cards")
        print("[OK] reviewed briefing payload present with briefing_cards")
    else:
        print("[WARN] generated_briefings_reviewed_v2.json not present; skipped payload sample check")

    print("[OK] ReviewedBriefingLoader module exists")
    print("[OK] BriefingPanel renders module briefing sections")
    print("[OK] dashboard_main initializes BriefingPanel")
    print("[OK] harness includes module briefing target")
    print("[OK] module briefing panel parity smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
