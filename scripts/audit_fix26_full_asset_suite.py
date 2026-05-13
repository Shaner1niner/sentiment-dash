#!/usr/bin/env python
"""Full asset-suite dashboard + briefing audit for SETA Fix26.

Read-only QA script. It checks asset-store coverage, reviewed briefing coverage,
copy artifacts, and dashboard guard tokens for recent range/render fixes.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if not (ROOT / "dashboard_fix26_app.js").exists():
    ROOT = Path.cwd()
OUT_DIR = ROOT / "qa_outputs"

MODES = {
    "public": {
        "index": ROOT / "fix26_chart_store_public_index.json",
        "asset_dir": ROOT / "fix26_chart_store_assets" / "public",
        "default_daily_range": "3M",
        "default_weekly_range": "1Y",
    },
    "member": {
        "index": ROOT / "fix26_chart_store_member_index.json",
        "asset_dir": ROOT / "fix26_chart_store_assets" / "member",
        "default_daily_range": "6M",
        "default_weekly_range": "1Y",
    },
}

DASHBOARD_TOKENS = [
    "priceCandlestickTraces(plotXs, plotRows, freq)",
    "const plotRows=rows.filter((r,i)=>visibleMask[i])",
    "const plotXs=plotRows.map(r=>r.dateObj)",
    "currentDashboardControlKey() !== renderKey",
    "SETA_REVIEWED_CONTEXT_COMPATIBILITY",
    "accepted compatible reviewed fallback",
    "skipped incompatible reviewed fallback for active context",
]

COPY_ARTIFACTS_EXACT = [
    "bTC",
    "BTC shows BTC has",
    "primary read is BTC has",
    "Primary read: BTC has",
    "profile..",
    "context..",
    "state..",
]

REQUIRED_ROW_FIELDS = ["date", "close", "seta_dashboard_summary_label", "asset_calendar"]


@dataclass
class Finding:
    severity: str
    area: str
    message: str
    asset: str | None = None
    mode: str | None = None
    detail: dict[str, Any] | None = None


def read_json(path: Path, default: Any = None) -> Any:
    if default is None:
        default = {}
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except Exception as exc:
        return {"_read_error": str(exc)}


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=True) + "\n", encoding="utf-8")


def parse_date(value: Any) -> datetime | None:
    if value in (None, ""):
        return None
    text = str(value).strip().replace("_", "-").replace("/", "-")
    try:
        return datetime.fromisoformat(text[:10])
    except Exception:
        return None


def asset_list_from_index(path: Path) -> list[str]:
    data = read_json(path, {})
    if isinstance(data, dict) and isinstance(data.get("assets"), dict):
        return sorted(str(k).upper() for k in data["assets"].keys())
    if isinstance(data, dict) and isinstance(data.get("assets"), list):
        return sorted(str(x).upper() for x in data["assets"])
    if isinstance(data, dict):
        return sorted(str(k).upper() for k in data.keys() if not str(k).startswith("_"))
    if isinstance(data, list):
        return sorted(str(x).upper() for x in data)
    return []


def configured_manifest_assets(mode: str) -> list[str]:
    manifest = read_json(ROOT / "dashboard_fix26_mode_manifest.json", {})
    candidates: list[Any] = []
    if isinstance(manifest, dict):
        mode_cfg = manifest.get(mode) or {}
        if isinstance(mode_cfg, dict):
            candidates.extend([mode_cfg.get("assets"), mode_cfg.get("configured_assets"), mode_cfg.get("assetOptions"), mode_cfg.get("asset_options")])
        modes = manifest.get("modes") or {}
        if isinstance(modes, dict):
            m = modes.get(mode) or {}
            if isinstance(m, dict):
                candidates.extend([m.get("assets"), m.get("configured_assets"), m.get("assetOptions"), m.get("asset_options")])
    for candidate in candidates:
        if isinstance(candidate, list):
            return sorted(str(x).upper() for x in candidate)
        if isinstance(candidate, dict):
            return sorted(str(k).upper() for k in candidate.keys())
    return []


def pending_manifest_assets(mode: str) -> list[str]:
    manifest = read_json(ROOT / "dashboard_fix26_mode_manifest.json", {})
    candidates: list[Any] = []

    if isinstance(manifest, dict):
        mode_cfg = manifest.get(mode) or {}
        if isinstance(mode_cfg, dict):
            candidates.extend([
                mode_cfg.get("pendingAssetCoverage"),
                mode_cfg.get("pending_assets"),
                mode_cfg.get("pendingAssetCoverageStatus"),
            ])

        modes = manifest.get("modes") or {}
        if isinstance(modes, dict):
            m = modes.get(mode) or {}
            if isinstance(m, dict):
                candidates.extend([
                    m.get("pendingAssetCoverage"),
                    m.get("pending_assets"),
                    m.get("pendingAssetCoverageStatus"),
                ])

    found: set[str] = set()
    for candidate in candidates:
        if isinstance(candidate, list):
            found.update(str(x).upper() for x in candidate if str(x).strip())
        elif isinstance(candidate, dict):
            found.update(str(k).upper() for k in candidate.keys() if str(k).strip())

    return sorted(found)

def extract_rows(payload: Any, freq: str, asset: str) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    freq_obj = payload.get(freq) or payload.get(freq.upper()) or payload.get(freq.lower())
    if isinstance(freq_obj, dict):
        for key in (asset, asset.upper(), asset.lower()):
            rows = freq_obj.get(key)
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
        for rows in freq_obj.values():
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
    if isinstance(freq_obj, list):
        return [r for r in freq_obj if isinstance(r, dict)]
    rows = payload.get("rows")
    if isinstance(rows, list):
        return [r for r in rows if isinstance(r, dict)]
    return []


def row_window_summary(rows: list[dict[str, Any]], days: int) -> dict[str, Any]:
    dates = [parse_date(r.get("date")) for r in rows]
    dates = [d for d in dates if d]
    if not dates:
        return {"row_count": len(rows), "visible_count": 0}
    end = max(dates)
    start = end - timedelta(days=days)
    visible = [d for d in dates if start <= d <= end]
    return {
        "start_expected": start.date().isoformat(),
        "end": end.date().isoformat(),
        "visible_count": len(visible),
        "visible_first": min(visible).date().isoformat() if visible else None,
        "visible_last": max(visible).date().isoformat() if visible else None,
        "calendar_span_days": (max(visible) - min(visible)).days if len(visible) >= 2 else 0,
    }


def scan_copy_artifacts_in_item(item: dict[str, Any]) -> list[dict[str, str]]:
    hits: list[dict[str, str]] = []
    field_texts: list[tuple[str, str]] = []
    for field in ["headline", "summary", "what_seta_sees", "why_it_matters", "trust_check", "watch_item"]:
        value = item.get(field)
        if isinstance(value, str):
            field_texts.append((field, value))
    cards = item.get("briefing_cards")
    if isinstance(cards, dict):
        for card_name, card in cards.items():
            if isinstance(card, dict) and isinstance(card.get("copy"), str):
                field_texts.append((f"briefing_cards.{card_name}.copy", card["copy"]))
    for field, text in field_texts:
        for token in COPY_ARTIFACTS_EXACT:
            if token in text:
                hits.append({"field": field, "token": token, "excerpt": text[:220]})
    return hits


def reviewed_briefings(data: Any) -> dict[str, Any]:
    if isinstance(data, dict) and isinstance(data.get("briefings"), dict):
        return data["briefings"]
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if isinstance(v, dict)}
    return {}


def latest_as_of_from_rows(rows: list[dict[str, Any]]) -> str | None:
    dates = [parse_date(r.get("date")) for r in rows]
    dates = [d for d in dates if d]
    return max(dates).strftime("%Y_%m_%d") if dates else None


def audit() -> dict[str, Any]:
    findings: list[Finding] = []
    mode_reports: dict[str, Any] = {}

    app_path = ROOT / "dashboard_fix26_app.js"
    dashboard_js = app_path.read_text(encoding="utf-8-sig", errors="ignore") if app_path.exists() else ""
    token_report = {}
    for token in DASHBOARD_TOKENS:
        token_report[token] = token in dashboard_js
        if not token_report[token]:
            findings.append(Finding("error", "dashboard_tokens", f"Missing dashboard token: {token}"))

    embed_tokens: dict[str, Any] = {}
    for embed in ["interactive_dashboard_fix24_public_embed.html", "interactive_dashboard_fix24_member_embed.html"]:
        path = ROOT / embed
        text = path.read_text(encoding="utf-8-sig", errors="ignore") if path.exists() else ""

        legacy_app_match = re.search(r"dashboard_fix26_app\.js\?v=([^\"']+)", text)
        module_entry_present = re.search(r"<script\b[^>]*src=[\"'](?:\./)?src/dashboard_main\.js[\"'][^>]*>", text) is not None
        manifest_match = re.search(r"DASH_MANIFEST_URL\s*=\s*[\"']dashboard_fix26_mode_manifest\.json\?v=([^\"']+)[\"']", text)

        if legacy_app_match:
            embed_tokens[embed] = {
                "entry_type": "legacy_app",
                "entry_token": legacy_app_match.group(1),
                "manifest_token": manifest_match.group(1) if manifest_match else None,
            }
        elif module_entry_present:
            embed_tokens[embed] = {
                "entry_type": "module_entry",
                "entry_token": "src/dashboard_main.js",
                "manifest_token": manifest_match.group(1) if manifest_match else None,
            }
        else:
            embed_tokens[embed] = {
                "entry_type": None,
                "entry_token": None,
                "manifest_token": manifest_match.group(1) if manifest_match else None,
            }
            findings.append(Finding("warning", "embed_cache", f"No recognized dashboard entry script found in {embed}"))

    reviewed_payloads = {name: read_json(ROOT / name, {}) for name in ["generated_briefings_reviewed.json", "generated_briefings_reviewed_v2.json"]}
    reviewed_reports: dict[str, Any] = {}
    for payload_name, payload in reviewed_payloads.items():
        briefings = reviewed_briefings(payload)
        artifact_hits = []
        for key, item in briefings.items():
            if isinstance(item, dict):
                for hit in scan_copy_artifacts_in_item(item):
                    artifact_hits.append({"payload_key": key, **hit})
        reviewed_reports[payload_name] = {
            "briefing_count": len(briefings),
            "copy_artifact_hit_count": len(artifact_hits),
            "copy_artifact_hits": artifact_hits[:100],
            "schema_version": payload.get("schema_version") if isinstance(payload, dict) else None,
        }
        if artifact_hits:
            findings.append(Finding("warning", "copy_artifacts", f"{payload_name} has {len(artifact_hits)} exact copy artifact hit(s)"))

    screener = read_json(ROOT / "fix26_screener_store.json", {})
    screener_terms: set[str] = set()
    if isinstance(screener, dict):
        by_term = screener.get("by_term")
        if isinstance(by_term, dict):
            screener_terms = {str(k).upper() for k in by_term.keys()}
        else:
            screener_terms = {str(k).upper() for k in screener.keys() if isinstance(k, str)}

    for mode, cfg in MODES.items():
        assets = asset_list_from_index(cfg["index"])
        configured = configured_manifest_assets(mode)
        pending_configured = pending_manifest_assets(mode)
        active_configured = sorted(set(configured) - set(pending_configured))
        mode_report = {
            "asset_count": len(assets),
            "assets": assets,
            "configured_assets": configured,
            "pending_configured_assets": pending_configured,
            "active_configured_assets": active_configured,
            "asset_reports": {},
        }
        if not assets:
            findings.append(Finding("error", "asset_index", f"No assets found in {cfg['index'].name}", mode=mode))
        missing_configured = sorted(set(active_configured) - set(assets))
        if missing_configured:
            findings.append(Finding("warning", "manifest_coverage", f"Active configured assets missing from {mode} index: {', '.join(missing_configured)}", mode=mode))

        for asset in assets:
            asset_path = cfg["asset_dir"] / f"{asset}.json"
            asset_report: dict[str, Any] = {"exists": asset_path.exists(), "in_screener": asset in screener_terms, "daily": {}, "weekly": {}, "reviewed": {}}
            if not asset_path.exists():
                findings.append(Finding("error", "asset_payload", f"Missing asset payload for {asset}", asset=asset, mode=mode))
                mode_report["asset_reports"][asset] = asset_report
                continue
            payload = read_json(asset_path, {})
            if isinstance(payload, dict) and "_read_error" in payload:
                findings.append(Finding("error", "asset_payload", f"Could not parse payload for {asset}: {payload['_read_error']}", asset=asset, mode=mode))
                mode_report["asset_reports"][asset] = asset_report
                continue

            daily_rows = extract_rows(payload, "D", asset)
            weekly_rows = extract_rows(payload, "W", asset)
            for freq, rows, key, days in [("D", daily_rows, "daily", 92), ("W", weekly_rows, "weekly", 370)]:
                if not rows:
                    sev = "warning" if freq == "W" else "error"
                    findings.append(Finding(sev, "rows", f"No {freq} rows found for {asset}", asset=asset, mode=mode))
                    asset_report[key] = {"row_count": 0}
                    continue
                dates = [parse_date(r.get("date")) for r in rows]
                dates = [d for d in dates if d]
                last = rows[-1]
                missing_fields = [f for f in REQUIRED_ROW_FIELDS if f not in last]
                if missing_fields:
                    findings.append(Finding("warning", "row_fields", f"{asset} latest {freq} row missing fields: {', '.join(missing_fields)}", asset=asset, mode=mode))
                asset_report[key] = {
                    "row_count": len(rows),
                    "first_date": min(dates).date().isoformat() if dates else None,
                    "last_date": max(dates).date().isoformat() if dates else None,
                    "latest_summary_label": last.get("seta_dashboard_summary_label"),
                    "latest_calendar": last.get("asset_calendar"),
                    "missing_latest_fields": missing_fields,
                    "display_window": row_window_summary(rows, days),
                }
            if daily_rows:
                asset_report["display_windows"] = {"3M": row_window_summary(daily_rows, 92), "6M": row_window_summary(daily_rows, 184)}
                if asset_report["display_windows"]["3M"].get("visible_count", 0) <= 0:
                    findings.append(Finding("error", "display_window", f"{asset} has no rows in computed 3M window", asset=asset, mode=mode))

            as_of = latest_as_of_from_rows(daily_rows) or ""
            for payload_name, payload_data in reviewed_payloads.items():
                briefings = reviewed_briefings(payload_data)
                daily_key = f"{mode}::{asset.lower()}::d::{cfg['default_daily_range'].lower()}::{as_of}"
                weekly_key = f"{mode}::{asset.lower()}::w::{cfg['default_weekly_range'].lower()}::{as_of}"
                asset_report["reviewed"][payload_name] = {
                    "daily_default_key": daily_key,
                    "daily_default_present": daily_key in briefings,
                    "weekly_default_key": weekly_key,
                    "weekly_default_present": weekly_key in briefings,
                }
                if as_of and daily_key not in briefings:
                    findings.append(Finding("warning", "reviewed_coverage", f"No direct reviewed daily default briefing for {daily_key}", asset=asset, mode=mode))
                if as_of and weekly_key not in briefings:
                    findings.append(Finding("warning", "reviewed_coverage", f"No direct reviewed weekly default briefing for {weekly_key}", asset=asset, mode=mode))

            if not asset_report["in_screener"]:
                findings.append(Finding("warning", "screener_coverage", f"{asset} not found in screener by_term", asset=asset, mode=mode))
            mode_report["asset_reports"][asset] = asset_report
        mode_reports[mode] = mode_report

    finding_dicts = [asdict(f) for f in findings]
    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "status": "passed" if not any(f.severity == "error" for f in findings) else "failed",
        "error_count": sum(1 for f in findings if f.severity == "error"),
        "warning_count": sum(1 for f in findings if f.severity == "warning"),
        "modes": {mode: {"asset_count": report["asset_count"]} for mode, report in mode_reports.items()},
        "dashboard_tokens_ok": all(token_report.values()),
        "embed_tokens": embed_tokens,
    }
    return {"summary": summary, "findings": finding_dicts, "dashboard_token_report": token_report, "reviewed_reports": reviewed_reports, "mode_reports": mode_reports}


def write_markdown(report: dict[str, Any], path: Path) -> None:
    s = report["summary"]
    lines = [
        "# Full Asset Suite Dashboard + Briefing Audit",
        "",
        f"- Generated UTC: `{s['generated_at_utc']}`",
        f"- Status: **{s['status']}**",
        f"- Errors: `{s['error_count']}`",
        f"- Warnings: `{s['warning_count']}`",
        f"- Public assets: `{s['modes'].get('public', {}).get('asset_count', 0)}`",
        f"- Member assets: `{s['modes'].get('member', {}).get('asset_count', 0)}`",
        f"- Dashboard guard tokens OK: `{s['dashboard_tokens_ok']}`",
        "",
        "## Embed cache tokens",
        "",
    ]
    for name, token in s["embed_tokens"].items():
        if isinstance(token, dict):
            lines.append(
                f"- `{name}`: entry=`{token.get('entry_type')}`, "
                f"entry token=`{token.get('entry_token')}`, "
                f"manifest token=`{token.get('manifest_token')}`"
            )
        else:
            lines.append(f"- `{name}`: `{token}`")
    lines.extend(["", "## Reviewed payload copy artifacts", ""])
    for payload_name, rr in report["reviewed_reports"].items():
        lines.append(f"- `{payload_name}`: `{rr['copy_artifact_hit_count']}` exact artifact hit(s), `{rr['briefing_count']}` briefing(s)")
    lines.extend(["", "## Findings", ""])
    if not report["findings"]:
        lines.append("No findings.")
    else:
        for f in report["findings"][:250]:
            asset = f" asset=`{f['asset']}`" if f.get("asset") else ""
            mode = f" mode=`{f['mode']}`" if f.get("mode") else ""
            lines.append(f"- **{f['severity'].upper()}** `{f['area']}`{mode}{asset}: {f['message']}")
        if len(report["findings"]) > 250:
            lines.append(f"- ... {len(report['findings']) - 250} additional finding(s) omitted from markdown; see JSON.")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    report = audit()
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    json_path = OUT_DIR / f"full_asset_suite_dashboard_briefing_audit_{stamp}.json"
    md_path = OUT_DIR / f"full_asset_suite_dashboard_briefing_audit_{stamp}.md"
    write_json(json_path, report)
    write_markdown(report, md_path)
    print("=" * 72)
    print("Full Asset Suite Dashboard + Briefing Audit")
    print("=" * 72)
    print(json.dumps(report["summary"], indent=2, ensure_ascii=False))
    print(f"[OK] wrote {json_path.relative_to(ROOT)}")
    print(f"[OK] wrote {md_path.relative_to(ROOT)}")
    if report["summary"]["error_count"]:
        print(f"[ERROR] audit found {report['summary']['error_count']} error(s)")
        return 1
    print("[OK] audit completed with no errors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
