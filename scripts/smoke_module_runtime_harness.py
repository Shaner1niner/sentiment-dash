#!/usr/bin/env python
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HARNESS = ROOT / "module_runtime_smoke_harness.html"
PUBLIC_EMBED = ROOT / "interactive_dashboard_fix24_public_embed.html"
MEMBER_EMBED = ROOT / "interactive_dashboard_fix24_member_embed.html"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def main() -> int:
    if not HARNESS.exists():
        return fail("missing module_runtime_smoke_harness.html")

    html = read(HARNESS)

    required_tokens = [
        "SETA Module Runtime Smoke Harness",
        "Non-production module test surface",
        "https://cdn.plot.ly/plotly-2.35.2.min.js",
        'window.DASH_MODE_DEFAULT = "member"',
        'id="chart"',
        'type="module" src="./src/dashboard_main.js?v=module_runtime_smoke_harness_002"',
    ]

    missing = [token for token in required_tokens if token not in html]
    if missing:
        return fail(f"harness missing token(s): {missing}")

    for control_id in [
        "asset", "freq", "range", "briefingMode", "priceDisplay", "scaleMode",
        "ribbon", "sentRibbon", "regimeLayer", "engagement", "bollinger", "osc"
    ]:
        if f'id="{control_id}"' not in html:
            return fail(f"harness missing control id: {control_id}")

    monolith_script_tokens = [
        'src="dashboard_fix26_app.js',
        "src='dashboard_fix26_app.js",
        'src="./dashboard_fix26_app.js',
        "src='./dashboard_fix26_app.js",
    ]
    if any(token in html for token in monolith_script_tokens):
        return fail("harness should not load production monolith dashboard_fix26_app.js as a script")

    for embed in [PUBLIC_EMBED, MEMBER_EMBED]:
        if not embed.exists():
            return fail(f"missing production embed: {embed.name}")
        text = read(embed)
        if "dashboard_fix26_app.js?v=restore_monolith_entry_001" not in text:
            return fail(f"{embed.name} no longer references production monolith token")
        if "src/dashboard_main.js" in text:
            return fail(f"{embed.name} should not load module runtime")

    print("[OK] module runtime smoke harness exists")
    print("[OK] harness loads src/dashboard_main.js as a module")
    print("[OK] harness includes core dashboard controls and chart container")
    print("[OK] production embeds remain pinned to dashboard_fix26_app.js")
    print("[OK] module runtime harness smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
