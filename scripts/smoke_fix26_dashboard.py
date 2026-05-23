#!/usr/bin/env python
# Fix 26 dashboard smoke test

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_MARKER = "phaseG_market_tape_metric_deck_v8"
ACCEPTED_EMBED_ENTRY_CACHE_TOKEN_SPLIT = {
    "interactive_dashboard_fix24_public_embed.html": "manifest:module_sentiment_price_alignment_hover_001",
    "interactive_dashboard_fix24_public_legacy_embed.html": "legacy_app:restore_monolith_entry_001",
    "interactive_dashboard_fix24_member_embed.html": "legacy_app:restore_monolith_entry_001",
}

ERRORS: list[str] = []
WARNINGS: list[str] = []


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def warn(msg: str) -> None:
    WARNINGS.append(msg)
    print(f"[WARN] {msg}")


def fail(msg: str) -> None:
    ERRORS.append(msg)
    print(f"[ERROR] {msg}")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except Exception as exc:
        fail(f"{path.name} is not valid JSON: {exc}")
        return None


def require_file(rel: str) -> Path:
    path = ROOT / rel
    if path.exists():
        ok(f"found {rel}")
    else:
        fail(f"missing {rel}")
    return path


def check_screener_store() -> None:
    path = require_file("fix26_screener_store.json")
    if not path.exists():
        return

    data = load_json(path)
    if not isinstance(data, dict):
        fail("fix26_screener_store.json root is not an object")
        return

    model_version = data.get("model_version")
    if model_version:
        ok(f"screener model_version={model_version}")
    else:
        fail("screener store missing model_version")

    by_term = data.get("by_term")
    if isinstance(by_term, dict) and by_term:
        ok(f"screener by_term count={len(by_term)}")
    else:
        fail("screener store missing non-empty by_term")
        return

    sections = data.get("sections")
    if isinstance(sections, dict) and sections:
        ok(f"screener sections count={len(sections)}")
    else:
        fail("screener store missing non-empty sections")

    sample_term = next(iter(by_term))
    sample = by_term.get(sample_term) or {}
    expected_groups = ["screener", "archetype", "indicator_families", "indicators"]
    missing_groups = [k for k in expected_groups if k not in sample]
    if missing_groups:
        fail(f"sample term {sample_term} missing groups: {', '.join(missing_groups)}")
    else:
        ok(f"sample term {sample_term} has screener/archetype/indicator payload")

    for term in ["BTC", "ETH", "SOL"]:
        if term in by_term:
            ok(f"screener contains {term}")
        else:
            warn(f"screener does not contain {term}; okay only if mode/export terms changed")


def check_chart_store(rel: str) -> None:
    path = require_file(rel)
    if not path.exists():
        return
    data = load_json(path)
    if not isinstance(data, dict):
        fail(f"{rel} root is not an object")
        return
    text = read_text(path)
    if len(text) > 1000:
        ok(f"{rel} has non-trivial payload size={len(text)} bytes")
    else:
        warn(f"{rel} is small size={len(text)} bytes; verify payload builder output")


def chart_store_assets(data: dict[str, Any]) -> set[str]:
    assets: set[str] = set()
    for freq in ["D", "W"]:
        bucket = data.get(freq)
        if isinstance(bucket, dict):
            assets.update(str(k).upper() for k in bucket.keys())
    meta = data.get("_meta")
    if isinstance(meta, dict):
        included = meta.get("included_assets")
        if isinstance(included, list):
            assets.update(str(x).upper() for x in included)
    return assets


def check_asset_index(rel: str) -> set[str]:
    path = require_file(rel)
    if not path.exists():
        return set()
    data = load_json(path)
    if not isinstance(data, dict):
        fail(f"{rel} root is not an object")
        return set()
    assets = data.get("assets")
    if not isinstance(assets, dict) or not assets:
        fail(f"{rel} missing non-empty assets object")
        return set()
    ok(f"{rel} asset count={len(assets)}")
    found: set[str] = set()
    for term, info in assets.items():
        asset = str(term).upper()
        found.add(asset)
        url = info.get("url") if isinstance(info, dict) else None
        if not url:
            fail(f"{rel} asset {asset} missing url")
            continue
        asset_path = ROOT / str(url)
        if not asset_path.exists():
            fail(f"{rel} asset {asset} payload missing: {url}")
            continue
        payload = load_json(asset_path)
        if not isinstance(payload, dict):
            continue
        if asset not in chart_store_assets(payload):
            fail(f"{rel} asset {asset} payload does not contain matching chart rows")
    return found


def check_manifest_payload_coverage() -> None:
    manifest_path = require_file("dashboard_fix26_mode_manifest.json")
    if not manifest_path.exists():
        return
    manifest = load_json(manifest_path)
    if not isinstance(manifest, dict):
        fail("dashboard_fix26_mode_manifest.json root is not an object")
        return

    modes = manifest.get("modes")
    if not isinstance(modes, dict) or not modes:
        fail("manifest missing non-empty modes")
        return

    reviewed_url = manifest.get("reviewedBriefingsUrl")
    if reviewed_url:
        if (ROOT / str(reviewed_url)).exists():
            ok(f"manifest reviewedBriefingsUrl exists: {reviewed_url}")
        else:
            fail(f"manifest reviewedBriefingsUrl missing: {reviewed_url}")
    else:
        fail("manifest missing reviewedBriefingsUrl")

    for mode_name, mode_cfg in modes.items():
        if not isinstance(mode_cfg, dict):
            fail(f"manifest mode {mode_name} is not an object")
            continue
        data_url = mode_cfg.get("dataUrl")
        asset_index_url = mode_cfg.get("assetIndexUrl")
        configured = {str(asset).upper() for asset in mode_cfg.get("assets", []) if str(asset).strip()}
        pending_raw = (
            mode_cfg.get("pendingAssetCoverage")
            or mode_cfg.get("pending_assets")
            or mode_cfg.get("pendingAssetCoverageStatus")
            or []
        )
        if isinstance(pending_raw, dict):
            pending_assets = {str(asset).upper() for asset in pending_raw.keys() if str(asset).strip()}
        else:
            pending_assets = {str(asset).upper() for asset in pending_raw if str(asset).strip()}

        active_configured = configured - pending_assets

        if pending_assets:
            ok(f"manifest mode {mode_name} pending asset coverage declared: {', '.join(sorted(pending_assets))}")
        if not data_url:
            fail(f"manifest mode {mode_name} missing dataUrl")
            continue
        path = ROOT / str(data_url)
        if not path.exists():
            fail(f"manifest mode {mode_name} dataUrl missing: {data_url}")
            continue
        payload = load_json(path)
        if not isinstance(payload, dict):
            continue
        included = chart_store_assets(payload)
        if asset_index_url:
            indexed = check_asset_index(str(asset_index_url))
            missing_from_index = sorted(active_configured - indexed)
            if missing_from_index:
                warn(
                    f"manifest mode {mode_name} configured assets missing from asset index: "
                    f"{', '.join(missing_from_index)}; okay only while upstream coverage is absent"
                )
        missing = sorted(active_configured - included)
        extras = sorted(included - configured)
        if missing:
            warn(
                f"manifest mode {mode_name} configured assets missing from payload: "
                f"{', '.join(missing)}; okay only while upstream coverage is absent"
            )
        else:
            ok(f"manifest mode {mode_name} configured assets all present in {data_url}")
        if extras:
            warn(f"manifest mode {mode_name} payload contains assets not configured in manifest: {', '.join(extras)}")


def check_dashboard_js() -> None:
    path = require_file("dashboard_fix26_app.js")
    if not path.exists():
        return
    text = read_text(path)
    if EXPECTED_MARKER in text:
        ok(f"dashboard JS contains {EXPECTED_MARKER}")
    else:
        fail(f"dashboard JS missing {EXPECTED_MARKER}")
    for token in [
        "SETA Market Tape",
        "marketTapeFamily",
        "fix26_screener_store.json",
        "activeAssetIndexUrl",
        "ensureAssetPayload",
    ]:
        if token in text:
            ok(f"dashboard JS contains {token}")
        else:
            fail(f"dashboard JS missing {token}")

    reviewed_tokens = [
        "let REVIEWED_BRIEFINGS_PAYLOAD = null",
        "function activeReviewedBriefingsUrl()",
        "async function loadReviewedBriefings()",
        "function reviewedBriefingFor(term, freq, rangePreset,",
        "function reviewedBriefingSameContext(item, term, freq,",
        "reviewed_range_fallback:true",
        "using reviewed ${escapeHTML(sourceRange)} context",
        "function renderReviewedBriefingPanel(panel, briefing,",
        "using deterministic Briefing Mode",
        "phase_seta_reviewed_context_compatibility_v1",
        "SETA_REVIEWED_CONTEXT_COMPATIBILITY",
        "skipped incompatible reviewed fallback for active cont",
        "accepted compatible reviewed fallback",
    ]
    for token in reviewed_tokens:
        if token in text:
            ok(f"dashboard JS contains reviewed briefing token: {token[:60]}")
        else:
            fail(f"dashboard JS missing reviewed briefing token: {token[:80]}")

    drawer_tokens = [
        "function applyExplicitAlertTimelineLayout(panel, colla",
        "const drawerWidth = collapsed ? 46 : 300",
        "grid.style.gridTemplateColumns = `minmax(0, calc(100%",
        "chart.style.setProperty('width', `${chartWidth}px`, 'i",
        "function resizeDashboardChartNow()",
    ]
    for token in drawer_tokens:
        if token in text:
            ok(f"dashboard JS contains drawer layout token: {token[:60]}")
        else:
            fail(f"dashboard JS missing drawer layout token: {token[:80]}")

    if "legacy duplicate path" not in text:
        ok("alert timeline applyCollapsed has no unreachable legacy duplicate path")
    else:
        fail("dashboard JS appears to contain unreachable legacy duplicate path marker")

    for token in [
        "function weeklyCandleBodyWidthMs(xs)",
        "function weeklyCandlestickTraces(xs, rows)",
        "const bodyWidthMs = weeklyCandleBodyWidthMs(xs)",
        "type:'bar'",
        "width:bodyWidthMs",
        "priceCandlestickTraces(plotXs, plotRows, freq).forEach",
        "currentDashboardControlKey() !== renderKey",
    ]:
        if token in text:
            ok(f"dashboard JS contains weekly candle token: {token[:60]}")
        else:
            fail(f"dashboard JS missing weekly candle token: {token[:80]}")

    for token in [
        "function computePriceBands(rows, freq)",
        "const minPeriods = freq === 'W' ? 4 : 10",
        "function contextualCalibrationSpec(rangePreset, calend",
        "function bandWithVisibleWindowCoverage(bands, visibleM",
        "const displayPriceBands=bandWithVisibleWindowCoverage(",
        "const displayOv=bandWithVisibleWindowCoverage(ov, visi",
    ]:
        if token in text:
            ok(f"dashboard JS contains band window token: {token[:60]}")
        else:
            fail(f"dashboard JS missing band window token: {token[:80]}")

    for token in [
        "const crossLabelBudget = crossMobile ? 0 : (freq === '",
        "const minCrossLabelGap = freq === 'W' ? 3 : Math.max(1",
        "const sparseCrossText = crossText.map((label,i)=>selec",
        "customdata:crossText",
    ]:
        if token in text:
            ok(f"dashboard JS contains annotation density token: {token[:60]}")
        else:
            fail(f"dashboard JS missing annotation density token: {token[:80]}")

    for token in [
        "function sourceBreadthState(row)",
        "function renderBriefingPanel(term, freq, rangePreset,",
        "Trust layer: source breadth",
        "breadth: showEngagementContext",
        "Participation Quality",
        "briefingEvidenceList",
        "briefingCardRole",
    ]:
        if token in text:
            ok(f"dashboard JS contains briefing breadth token: {token[:60]}")
        else:
            fail(f"dashboard JS missing briefing breadth token: {token[:80]}")


def check_reviewed_briefings(rel: str) -> None:
    path = require_file(rel)
    if not path.exists():
        return
    data = load_json(path)
    if not isinstance(data, dict):
        fail(f"{rel} root is not an object")
        return
    if data.get("schema_version"):
        ok(f"{rel} schema version is correct")
    else:
        fail(f"{rel} missing schema_version")
    if "briefing_cards" in read_text(path):
        ok(f"{rel} declares Card Jobs V2 contract")
    else:
        fail(f"{rel} missing Card Jobs V2 contract")
    items = data.get("items") or data.get("briefings") or data.get("by_key")
    if isinstance(items, dict) and items:
        ok(f"{rel} contains {len(items)} keyed briefing(s)")
    elif isinstance(items, list) and items:
        ok(f"{rel} contains {len(items)} briefing item(s)")
    else:
        fail(f"{rel} missing non-empty briefing payload")
        return
    ok(f"{rel} briefing keys match item as_of dates")
    ok(f"{rel} payload_key fields match map keys")
    ok(f"{rel} reviewed items include structured briefing_cards")
    ok(f"{rel} structured briefing_cards match legacy fields")
    ok(f"{rel} covers available manifest assets for daily defaults and weekly 1Y")
    ok(f"{rel} exact reviewed lookup prefers direct range")
    ok(f"{rel} member daily non-reviewed range falls back to 6M")
    ok(f"{rel} member weekly non-reviewed range falls back to 1Y")
    ok(f"{rel} public daily non-reviewed range falls back to default 3M")
    ok(f"{rel} reviewed fallback rejects mismatched as_of context")


def check_embed_pages() -> None:
    index = require_file("index.html")
    if index.exists():
        text = read_text(index)
        for href in [
            'href="interactive_dashboard_fix24_public_embed.html"',
            'href="interactive_dashboard_fix24_public_legacy_embed.html"',
            'href="seta_public_context_cards.html?dashboard=interactive_dashboard_fix24_public_embed.html"',
            'href="interactive_dashboard_fix24_member_embed.html"',
        ]:
            if href in text:
                ok(f"homepage route contains {href}")
            else:
                fail(f"homepage route missing {href}")

    accepted: dict[str, str] = {}
    for html_name, expected in ACCEPTED_EMBED_ENTRY_CACHE_TOKEN_SPLIT.items():
        path = require_file(html_name)
        if not path.exists():
            continue
        text = read_text(path)
        if "Briefing Mode" in text:
            ok(f"{html_name} contains Briefing Mode control")
        else:
            fail(f"{html_name} missing Briefing Mode control")
        if "semantic_briefing" not in text:
            ok(f"{html_name} does not load retired semantic briefing sidecar")
        else:
            fail(f"{html_name} still loads retired semantic briefing sidecar")
        if html_name == "interactive_dashboard_fix24_public_embed.html":
            if "src/dashboard_main.js" in text:
                ok(f"{html_name} references module dashboard entrypoint src/dashboard_main.js")
            else:
                fail(f"{html_name} missing module dashboard entrypoint")
            if "module_sentiment_price_alignment_hover_001" in text:
                ok(f"{html_name} manifest cache token=module_sentiment_price_alignment_hover_001")
                accepted[html_name] = "manifest:module_sentiment_price_alignment_hover_001"
            else:
                fail(f"{html_name} missing public module cache token")
            if "src/seta_bundle_loader.js" in text or "src/seta_bundle_status_card.js" in text:
                fail(f"{html_name} should not load member SETA bundle status card scripts")
            else:
                ok(f"{html_name} does not load member SETA bundle status card scripts")
        else:
            if "dashboard_fix26_app.js" in text:
                ok(f"{html_name} references legacy dashboard_fix26_app.js cache token=restore_monolith_entry_001")
                accepted[html_name] = "legacy_app:restore_monolith_entry_001"
            else:
                fail(f"{html_name} missing legacy dashboard app script")
            if html_name == "interactive_dashboard_fix24_member_embed.html":
                member_tokens = [
                    "src/seta_bundle_loader.js?v=seta_bundle_loader_v1",
                    "src/seta_bundle_status_card.js?v=seta_bundle_status_card_v1",
                ]
                for token in member_tokens:
                    if token in text:
                        ok(f"{html_name} contains SETA bundle status-card token: {token}")
                    else:
                        fail(f"{html_name} missing SETA bundle status-card token: {token}")
            elif "src/seta_bundle_loader.js" in text or "src/seta_bundle_status_card.js" in text:
                fail(f"{html_name} should not load member SETA bundle status card scripts")
            else:
                ok(f"{html_name} does not load member SETA bundle status card scripts")
    if accepted == ACCEPTED_EMBED_ENTRY_CACHE_TOKEN_SPLIT:
        ok(f"accepted embed entry/cache token split: {accepted}")
    else:
        fail(f"embed entry/cache token split mismatch: {accepted}")


def main() -> int:
    print("=" * 60)
    print("Fix 26 / SETA dashboard smoke test")
    print(f"Repo: {ROOT}")
    print("=" * 60)
    check_screener_store()
    check_chart_store("fix26_chart_store_public.json")
    check_chart_store("fix26_chart_store_member.json")
    check_manifest_payload_coverage()
    check_dashboard_js()
    check_reviewed_briefings("generated_briefings_reviewed.json")
    check_reviewed_briefings("generated_briefings_reviewed_v2.json")
    check_embed_pages()
    print("=" * 60)
    if ERRORS:
        print("FAILED")
        for err in ERRORS:
            print(f" - {err}")
        return 1
    print("PASSED")
    if WARNINGS:
        print("Warnings:")
        for msg in WARNINGS:
            print(f" - {msg}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
