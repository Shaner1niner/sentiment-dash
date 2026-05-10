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

    # Ensure at least one term has the rich Market Tape payload.
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
    # Keep this permissive because the exact builder shape has changed across phases.
    if len(text) > 1000:
        ok(f"{rel} has non-trivial payload size={len(text)} bytes")
    else:
        warn(f"{rel} is small size={len(text)} bytes; verify payload builder output")


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
        configured = {
            str(asset).upper()
            for asset in mode_cfg.get("assets", [])
            if str(asset).strip()
        }
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
            missing_from_index = sorted(configured - indexed)
            if missing_from_index:
                warn(
                    f"manifest mode {mode_name} configured assets missing from asset index: "
                    f"{', '.join(missing_from_index)}; okay only while upstream coverage is absent"
                )
        missing = sorted(configured - included)
        extras = sorted(included - configured)
        if missing:
            warn(
                f"manifest mode {mode_name} configured assets missing from payload: "
                f"{', '.join(missing)}; okay only while upstream coverage is absent"
            )
        else:
            ok(f"manifest mode {mode_name} configured assets all present in {data_url}")
        if extras:
            warn(
                f"manifest mode {mode_name} payload contains assets not configured in manifest: "
                f"{', '.join(extras)}"
            )


def check_dashboard_js() -> None:
    path = require_file("dashboard_fix26_app.js")
    if not path.exists():
        return
    text = read_text(path)
    if EXPECTED_MARKER in text:
        ok(f"dashboard JS contains {EXPECTED_MARKER}")
    else:
        fail(f"dashboard JS missing {EXPECTED_MARKER}")

    for token in ["SETA Market Tape", "marketTapeFamily", "fix26_screener_store.json", "activeAssetIndexUrl", "ensureAssetPayload"]:
        if token in text:
            ok(f"dashboard JS contains {token}")
        else:
            warn(f"dashboard JS missing token {token}")

    reviewed_briefing_tokens = [
        "let REVIEWED_BRIEFINGS_PAYLOAD = null",
        "function activeReviewedBriefingsUrl()",
        "async function loadReviewedBriefings()",
        "function reviewedBriefingFor(term, freq, rangePreset, row)",
        "function reviewedBriefingSameContext(item, term, freq, asOf)",
        "reviewed_range_fallback:true",
        "using reviewed ${escapeHTML(sourceRange)} context",
        "function renderReviewedBriefingPanel(panel, briefing, term, freq, rangePreset)",
        "using deterministic Briefing Mode",
    ]
    for token in reviewed_briefing_tokens:
        if token in text:
            ok(f"dashboard JS contains reviewed briefing token: {token[:54]}")
        else:
            fail(f"dashboard JS missing reviewed briefing token: {token}")

    drawer_tokens = [
        "function applyExplicitAlertTimelineLayout(panel, collapsed)",
        "const drawerWidth = collapsed ? 46 : 300",
        "grid.style.gridTemplateColumns = `minmax(0, calc(100% - ${drawerWidth + gap}px)) ${drawerWidth}px`",
        "chart.style.setProperty('width', `${chartWidth}px`, 'important')",
        "function resizeDashboardChartNow()",
    ]
    for token in drawer_tokens:
        if token in text:
            ok(f"dashboard JS contains drawer layout token: {token[:54]}")
        else:
            fail(f"dashboard JS missing drawer layout token: {token}")

    match = re.search(
        r"const applyCollapsed = \(collapsed\) => \{(?P<body>.*?)\n\s*\};\n+\s*if\(header\)",
        text,
        flags=re.S,
    )
    if not match:
        fail("dashboard JS missing alert timeline applyCollapsed block")
    else:
        body = match.group("body")
        legacy_tokens = [
            "panel.classList.toggle('collapsed', collapsed)",
            "grid.classList.toggle('drawerCollapsed', collapsed)",
            "setAlertSidePanelCollapsed(panel, collapsed, collapsedKey);",
        ]
        unexpected = [
            token
            for token in legacy_tokens
            if token in body and body.count(token) > (1 if token.startswith("setAlertSidePanelCollapsed") else 0)
        ]
        if unexpected:
            fail(f"alert timeline applyCollapsed still contains legacy duplicate toggle path: {unexpected}")
        elif "return;" in body:
            fail("alert timeline applyCollapsed still contains unreachable return guard")
        else:
            ok("alert timeline applyCollapsed has no unreachable legacy duplicate path")

    weekly_candle_tokens = [
        "function weeklyCandleBodyWidthMs(xs)",
        "function weeklyCandlestickTraces(xs, rows)",
        "const bodyWidthMs = weeklyCandleBodyWidthMs(xs)",
        "type:'bar'",
        "width:bodyWidthMs",
        "priceCandlestickTraces(xs, rows, freq).forEach(t=>data.push(t))",
    ]
    for token in weekly_candle_tokens:
        if token in text:
            ok(f"dashboard JS contains weekly candle token: {token[:54]}")
        else:
            fail(f"dashboard JS missing weekly candle token: {token}")

    band_window_tokens = [
        "function computePriceBands(rows, freq)",
        "const minPeriods = freq === 'W' ? 4 : 10",
        "function contextualCalibrationSpec(rangePreset, calendar, freq)",
        "function bandWithVisibleWindowCoverage(bands, visibleMask)",
        "const displayPriceBands=bandWithVisibleWindowCoverage(priceBands, visibleMask)",
        "const displayOv=bandWithVisibleWindowCoverage(ov, visibleMask)",
    ]
    for token in band_window_tokens:
        if token in text:
            ok(f"dashboard JS contains band window token: {token[:54]}")
        else:
            fail(f"dashboard JS missing band window token: {token}")

    annotation_density_tokens = [
        "const crossLabelBudget = crossMobile ? 0 : (freq === 'W' ? 4 : 6)",
        "const minCrossLabelGap = freq === 'W' ? 3 : Math.max(10, Math.ceil(visRows.length / 24))",
        "const sparseCrossText = crossText.map((label,i)=>selectedCrossLabels.has(i)?label:'')",
        "customdata:crossText",
    ]
    for token in annotation_density_tokens:
        if token in text:
            ok(f"dashboard JS contains annotation density token: {token[:54]}")
        else:
            fail(f"dashboard JS missing annotation density token: {token}")

    briefing_tokens = [
        "function sourceBreadthState(row)",
        "function renderBriefingPanel(term, freq, rangePreset, row, overlapInfo, engagementInfo)",
        "Trust layer: source breadth",
        "breadth: showEngagementContext",
        "Participation Quality",
        "briefingEvidenceList",
        "briefingCardRole",
    ]
    for token in briefing_tokens:
        if token in text:
            ok(f"dashboard JS contains briefing breadth token: {token[:54]}")
        else:
            fail(f"dashboard JS missing briefing breadth token: {token}")


def check_reviewed_briefing_payload_file(rel: str) -> None:
    path = require_file(rel)
    if not path.exists():
        return
    payload = load_json(path)
    if not isinstance(payload, dict):
        fail(f"{rel} root is not an object")
        return
    if payload.get("schema_version") == "generated_briefings_reviewed_v1":
        ok(f"{rel} schema version is correct")
    else:
        fail(f"{rel} schema version is incorrect")
    if payload.get("reviewed_payload_contract") == "briefing_card_jobs_v2":
        ok(f"{rel} declares Card Jobs V2 contract")
    else:
        fail(f"{rel} missing Card Jobs V2 contract")
    briefings = payload.get("briefings")
    if not isinstance(briefings, dict):
        fail(f"{rel} missing briefings object")
        return
    ok(f"{rel} contains {len(briefings)} keyed briefing(s)")
    mismatched_keys = []
    mismatched_payload_keys = []
    for key, item in briefings.items():
        if not isinstance(item, dict):
            fail(f"{rel} briefing {key} is not an object")
            continue
        expected_suffix = str(item.get("as_of", "")).replace("-", "_")
        if expected_suffix and not key.endswith(f"::{expected_suffix}"):
            mismatched_keys.append(key)
        if item.get("payload_key") != key:
            mismatched_payload_keys.append(key)
    if mismatched_keys:
        fail(f"{rel} has briefing keys that do not match item as_of: {mismatched_keys[:3]}")
    else:
        ok(f"{rel} briefing keys match item as_of dates")
    if mismatched_payload_keys:
        fail(f"{rel} has payload_key fields that do not match their map keys: {mismatched_payload_keys[:3]}")
    else:
        ok(f"{rel} payload_key fields match map keys")
    missing_cards = []
    mismatched_cards = []
    for key, item in briefings.items():
        if not isinstance(item, dict):
            continue
        cards = item.get("briefing_cards")
        if not isinstance(cards, dict):
            missing_cards.append(key)
            continue
        required = ["what_seta_sees", "why_it_matters", "evidence", "participation_quality"]
        if any(not isinstance(cards.get(name), dict) for name in required):
            missing_cards.append(key)
            continue
        if (cards["what_seta_sees"].get("copy") != item.get("what_seta_sees")
                or cards["why_it_matters"].get("copy") != item.get("why_it_matters")
                or cards["evidence"].get("items") != item.get("evidence")
                or cards["participation_quality"].get("copy") != item.get("trust_check")):
            mismatched_cards.append(key)
    if missing_cards:
        fail(f"{rel} missing structured briefing_cards on reviewed items: {missing_cards[:3]}")
    else:
        ok(f"{rel} reviewed items include structured briefing_cards")
    if mismatched_cards:
        fail(f"{rel} structured briefing_cards do not match legacy fields: {mismatched_cards[:3]}")
    else:
        ok(f"{rel} structured briefing_cards match legacy fields")
    manifest_path = ROOT / "dashboard_fix26_mode_manifest.json"
    if not manifest_path.exists():
        return
    manifest = load_json(manifest_path)
    modes = manifest.get("modes") if isinstance(manifest, dict) else None
    if not isinstance(modes, dict):
        return
    missing_expected = []
    for mode_name, mode_cfg in modes.items():
        if not isinstance(mode_cfg, dict):
            continue
        index_url = mode_cfg.get("assetIndexUrl")
        if not index_url:
            continue
        index_path = ROOT / str(index_url)
        if not index_path.exists():
            continue
        index = load_json(index_path)
        available_assets = set((index.get("assets") or {}).keys())
        daily_range = str((mode_cfg.get("defaults") or {}).get("range") or "3M").lower()
        for asset in mode_cfg.get("assets") or []:
            asset = str(asset).upper()
            if asset not in available_assets:
                continue
            expected_prefixes = [
                f"{str(mode_name).lower()}::{asset.lower()}::d::{daily_range}::",
                f"{str(mode_name).lower()}::{asset.lower()}::w::1y::",
            ]
            missing_expected.extend(prefix for prefix in expected_prefixes if not any(key.startswith(prefix) for key in briefings))
    if missing_expected:
        fail(f"{rel} missing expected reviewed manifest coverage: {missing_expected[:5]}")
    else:
        ok(f"{rel} covers available manifest assets for daily defaults and weekly 1Y")
    check_reviewed_range_fallback_contract(rel, briefings)


def reviewed_key_part(value: Any) -> str:
    return str(value or "").strip().lower().replace("-", "_")


def briefing_matches(item: dict[str, Any] | None, mode: str, asset: str, freq: str, display_range: str, as_of: str) -> bool:
    if not isinstance(item, dict):
        return False
    if item.get("schema_version") != "ai_briefing_output_v1":
        return False
    if item.get("review_status") != "reviewed":
        return False
    if item.get("suppressed") is True or item.get("public_suppressed") is True:
        return False
    if reviewed_key_part(item.get("mode")) != reviewed_key_part(mode):
        return False
    if reviewed_key_part(item.get("asset")) != reviewed_key_part(asset):
        return False
    if reviewed_key_part(item.get("frequency")) != reviewed_key_part(freq):
        return False
    if reviewed_key_part(item.get("as_of")) != reviewed_key_part(as_of):
        return False
    if reviewed_key_part(item.get("display_range")) != reviewed_key_part(display_range):
        return False
    return True


def briefing_same_context(item: dict[str, Any] | None, mode: str, asset: str, freq: str, as_of: str) -> bool:
    if not isinstance(item, dict):
        return False
    if item.get("schema_version") != "ai_briefing_output_v1":
        return False
    if item.get("review_status") != "reviewed":
        return False
    if item.get("suppressed") is True or item.get("public_suppressed") is True:
        return False
    return (
        reviewed_key_part(item.get("mode")) == reviewed_key_part(mode)
        and reviewed_key_part(item.get("asset")) == reviewed_key_part(asset)
        and reviewed_key_part(item.get("frequency")) == reviewed_key_part(freq)
        and reviewed_key_part(item.get("as_of")) == reviewed_key_part(as_of)
    )


def reviewed_lookup(
    briefings: dict[str, Any],
    mode: str,
    asset: str,
    freq: str,
    display_range: str,
    as_of: str,
) -> tuple[dict[str, Any] | None, bool]:
    key = "::".join(
        [
            reviewed_key_part(mode),
            reviewed_key_part(asset),
            reviewed_key_part(freq),
            reviewed_key_part(display_range),
            reviewed_key_part(as_of),
        ]
    )
    direct = briefings.get(key)
    if briefing_matches(direct, mode, asset, freq, display_range, as_of):
        return direct, False
    candidates = [
        item
        for item in briefings.values()
        if briefing_same_context(item if isinstance(item, dict) else None, mode, asset, freq, as_of)
    ]
    preferred_range = "1y" if reviewed_key_part(freq) == "w" else "6m"
    for item in candidates:
        if reviewed_key_part(item.get("display_range")) == preferred_range:
            return item, True
    return (candidates[0], True) if candidates else (None, False)


def check_reviewed_range_fallback_contract(rel: str, briefings: dict[str, Any]) -> None:
    member_link_daily_key = next((key for key in briefings if key.startswith("member::link::d::6m::")), None)
    member_link_weekly_key = next((key for key in briefings if key.startswith("member::link::w::1y::")), None)
    public_btc_daily_key = next((key for key in briefings if key.startswith("public::btc::d::3m::")), None)
    if not (member_link_daily_key and member_link_weekly_key and public_btc_daily_key):
        fail(f"{rel} missing representative keys for reviewed range fallback contract")
        return

    member_as_of = str(briefings[member_link_daily_key].get("as_of"))
    public_as_of = str(briefings[public_btc_daily_key].get("as_of"))
    daily_exact, daily_exact_fallback = reviewed_lookup(briefings, "member", "LINK", "D", "6M", member_as_of)
    daily_fallback, daily_was_fallback = reviewed_lookup(briefings, "member", "LINK", "D", "1Y", member_as_of)
    weekly_fallback, weekly_was_fallback = reviewed_lookup(briefings, "member", "LINK", "W", "3M", member_as_of)
    public_fallback, public_was_fallback = reviewed_lookup(briefings, "public", "BTC", "D", "1Y", public_as_of)
    mismatch, mismatch_fallback = reviewed_lookup(briefings, "member", "LINK", "D", "1Y", "1900-01-01")

    if daily_exact and not daily_exact_fallback:
        ok(f"{rel} exact reviewed lookup prefers direct range")
    else:
        fail(f"{rel} exact reviewed lookup did not prefer direct range")
    if daily_fallback and daily_was_fallback and reviewed_key_part(daily_fallback.get("display_range")) == "6m":
        ok(f"{rel} member daily non-reviewed range falls back to 6M")
    else:
        fail(f"{rel} member daily non-reviewed range did not fall back to 6M")
    if weekly_fallback and weekly_was_fallback and reviewed_key_part(weekly_fallback.get("display_range")) == "1y":
        ok(f"{rel} member weekly non-reviewed range falls back to 1Y")
    else:
        fail(f"{rel} member weekly non-reviewed range did not fall back to 1Y")
    if public_fallback and public_was_fallback and reviewed_key_part(public_fallback.get("display_range")) == "3m":
        ok(f"{rel} public daily non-reviewed range falls back to default 3M")
    else:
        fail(f"{rel} public daily non-reviewed range did not fall back to default 3M")
    if mismatch is None and not mismatch_fallback:
        ok(f"{rel} reviewed fallback rejects mismatched as_of context")
    else:
        fail(f"{rel} reviewed fallback accepted mismatched as_of context")


def check_reviewed_briefing_payload() -> None:
    check_reviewed_briefing_payload_file("generated_briefings_reviewed.json")
    manifest_path = ROOT / "dashboard_fix26_mode_manifest.json"
    if manifest_path.exists():
        manifest = load_json(manifest_path)
        reviewed_url = manifest.get("reviewedBriefingsUrl") if isinstance(manifest, dict) else None
        if reviewed_url and reviewed_url != "generated_briefings_reviewed.json":
            check_reviewed_briefing_payload_file(str(reviewed_url))


def check_embeds() -> None:
    cache_tokens: dict[str, str] = {}
    for rel in ["interactive_dashboard_fix24_public_embed.html", "interactive_dashboard_fix24_member_embed.html"]:
        path = require_file(rel)
        if not path.exists():
            continue
        text = read_text(path)
        if 'data-control="briefingMode"' in text:
            ok(f"{rel} contains Briefing Mode control")
        else:
            fail(f"{rel} missing Briefing Mode control")
        if "dashboard_briefing_semantic_patch.js" in text:
            fail(f"{rel} still loads retired semantic briefing sidecar")
        else:
            ok(f"{rel} does not load retired semantic briefing sidecar")
        match = re.search(r'dashboard_fix26_app\.js\?v=([^"\']+)', text)
        if not match:
            fail(f"{rel} does not reference dashboard_fix26_app.js with a cache token")
            continue
        cache = match.group(1)
        cache_tokens[rel] = cache
        ok(f"{rel} cache token={cache}")
    unique_tokens = sorted(set(cache_tokens.values()))
    if len(unique_tokens) > 1:
        warn(f"embed cache tokens differ: {cache_tokens}")
    elif unique_tokens:
        ok(f"embed cache token policy consistent: {unique_tokens[0]}")


def main() -> int:
    print("============================================================")
    print("Fix 26 / SETA dashboard smoke test")
    print(f"Repo: {ROOT}")
    print("============================================================")

    check_screener_store()
    check_chart_store("fix26_chart_store_public.json")
    check_chart_store("fix26_chart_store_member.json")
    check_manifest_payload_coverage()
    check_dashboard_js()
    check_reviewed_briefing_payload()
    check_embeds()

    print("============================================================")
    if WARNINGS:
        print(f"Warnings: {len(WARNINGS)}")
    if ERRORS:
        print(f"FAILED: {len(ERRORS)} error(s)")
        for e in ERRORS:
            print(f" - {e}")
        return 1
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
