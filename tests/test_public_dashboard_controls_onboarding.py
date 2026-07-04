from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DASHBOARD_MAIN = ROOT / "src" / "dashboard_main.js"
CONTROL_POLISH = ROOT / "src" / "features" / "PublicControlDensityPolish.js"
PUBLIC_DASHBOARD = ROOT / "interactive_dashboard_fix24_public_embed.html"


def test_public_dashboard_controls_onboarding_is_wired():
    main = DASHBOARD_MAIN.read_text(encoding="utf-8")

    assert "module_public_control_density_polish_003_controls_onboarding_accountability_001" in main
    assert "PUBLIC_CONTROL_DENSITY_POLISH.init" in main


def test_public_controls_are_grouped_without_changing_control_ids():
    source = CONTROL_POLISH.read_text(encoding="utf-8")

    assert "data-seta-onboarding-rail" in source
    assert "How to read this sample" in source
    assert "Pick an asset" in source
    assert "Start with the selected asset and context date." in source
    assert "Read market context" in source
    assert "Compare sentiment, attention, and structure against recent price behavior." in source
    assert "Use the chart as context" in source
    assert "Treat this as market context only, not a trading signal." in source
    assert "4 - Accountability" in source
    assert "Check measured outcomes" in source
    assert "Review historical follow-through after the chart." in source

    assert "PRIMARY_CONTROLS = ['asset', 'freq', 'range', 'briefingMode']" in source
    assert "ADVANCED_CONTROLS = ['priceDisplay', 'scaleMode', 'ribbon', 'regimeLayer', 'engagement', 'bollinger', 'osc']" in source
    assert "data-seta-primary-controls" in source
    assert "data-seta-advanced-controls" in source
    assert "More chart controls" in source
    assert "controlsEl.innerHTML = ''" in source


def test_public_dashboard_beta_cta_and_footer_remain_present():
    html = PUBLIC_DASHBOARD.read_text(encoding="utf-8")

    assert "data-seta-beta-access-cta" in html
    assert "https://www.data-and-finance.com/beta-access" in html
    assert "Context only. Not investment advice. Not a trading signal." in html
