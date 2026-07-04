from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = ROOT / "interactive_dashboard_fix24_public_embed.html"
MAIN = ROOT / "src" / "dashboard_main.js"
FRESHNESS_FEATURE = ROOT / "src" / "features" / "DataFreshnessIndicator.js"
PUBLIC_INDEX = ROOT / "fix26_chart_store_public_index.json"
SPY_ASSET = ROOT / "fix26_chart_store_assets" / "public" / "SPY.json"
BETA_ACCESS_URL = "https://www.data-and-finance.com/beta-access"
OVERVIEW_URL = "https://www.data-and-finance.com"


def test_public_dashboard_mounts_current_data_indicator():
    html = DASHBOARD.read_text(encoding="utf-8")
    main = MAIN.read_text(encoding="utf-8")

    assert "public_freshness_001" in html
    assert "DataFreshnessIndicator" in main
    assert "module_data_freshness_indicator_002_public_current_marker_001" in main
    assert "module_public_dashboard_intro_copy_002" in main


def test_public_dashboard_static_shell_uses_productized_copy():
    html = DASHBOARD.read_text(encoding="utf-8")

    assert "<title>SETA Public Market Context Dashboard</title>" in html
    assert '<h1>SETA Public Market Context Dashboard <span id="ui-feedback">SPY</span></h1>' in html
    assert "A public-safe sample of SETA's market attention, participation, structure, and sentiment context." in html

    forbidden_shell_terms = [
        "Production public module " + "runtime surface",
        "Legacy public " + "dashboard",
        "fallback " + "route",
        "SETA Public Dashboard " + "BTC",
    ]
    for term in forbidden_shell_terms:
        assert term not in html


def test_public_dashboard_has_public_safe_beta_access_cta():
    html = DASHBOARD.read_text(encoding="utf-8")

    assert 'data-seta-beta-access-cta' in html
    assert "Join SETA Beta Access" in html
    assert "Back to SETA Overview" in html
    assert BETA_ACCESS_URL in html
    assert OVERVIEW_URL in html
    assert "stripe.com" not in html.lower()
    assert html.index('class="harnessBanner"') < html.index("data-seta-beta-access-cta") < html.index('class="controls"')


def test_freshness_indicator_uses_public_metadata_without_hardcoded_dates():
    source = FRESHNESS_FEATURE.read_text(encoding="utf-8")

    assert "Context through:" in source
    assert "Public sample refreshed:" in source
    assert "public-safe sample" in source
    assert "public_content/site_refresh_status.json" in source
    assert "generated_at_utc" in source
    assert "2026-" not in source
    assert "row_count" not in source
    assert "source_csv" not in source


def test_public_fixture_metadata_supports_spy_default_and_crypto_selection():
    public_index = json.loads(PUBLIC_INDEX.read_text(encoding="utf-8"))
    spy_payload = json.loads(SPY_ASSET.read_text(encoding="utf-8"))

    assert public_index["mode"] == "public"
    assert public_index["generated_at_utc"]
    assert {"SPY", "BTC", "ETH"}.issubset(public_index["assets"])

    assert spy_payload["_meta"]["mode"] == "public"
    assert spy_payload["_meta"]["generated_at_utc"]
    assert spy_payload["D"]["SPY"][-1]["date"]
