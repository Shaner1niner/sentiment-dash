from __future__ import annotations

"""Compact read-only dashboard operations health report.

This script is intended as the one-command cockpit check for the Fix 26 SETA
dashboard. It does not refresh payloads, mutate the manifest, or write to the
DB. It runs/read-checks the existing health surfaces and prints a concise
recommendation.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable

LOCAL_SMOKE = ROOT / "scripts" / "smoke_fix26_dashboard.py"
LIVE_SMOKE = ROOT / "scripts" / "smoke_github_pages_live.py"
REFRESH_DEFAULT_SMOKE = ROOT / "scripts" / "smoke_refresh_db_export_opt_in.py"
ASSET_PROMOTION_REPORT = ROOT / "scripts" / "report_asset_universe_promotion.py"
DB_SOURCE_CONTRACT_REPORT = ROOT / "scripts" / "report_dashboard_db_source_contract.py"
REFRESH_BAT = ROOT / "refresh_fix26_dashboard_all.bat"


@dataclass
class CommandResult:
    name: str
    command: list[str]
    returncode: int
    stdout: str
    stderr: str

    @property
    def passed(self) -> bool:
        return self.returncode == 0


def run_command(name: str, command: list[str], *, timeout: int) -> CommandResult:
    try:
        completed = subprocess.run(
            command,
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
        return CommandResult(name, command, completed.returncode, completed.stdout, completed.stderr)
    except subprocess.TimeoutExpired as exc:
        return CommandResult(
            name,
            command,
            124,
            exc.stdout or "",
            (exc.stderr or "") + f"\nTimed out after {timeout}s",
        )


def git_status_short() -> str:
    result = run_command("git_status", ["git", "status", "--short"], timeout=30)
    if not result.passed:
        return f"error: {result.stderr.strip() or result.stdout.strip()}"
    return result.stdout.strip()


def refresh_default_enabled() -> bool | None:
    if not REFRESH_BAT.exists():
        return None
    text = REFRESH_BAT.read_text(encoding="utf-8", errors="replace")
    if 'if "%USE_DB_CHART_EXPORT%"=="" set "USE_DB_CHART_EXPORT=1"' in text:
        return True
    if 'if "%USE_DB_CHART_EXPORT%"=="" set "USE_DB_CHART_EXPORT=0"' in text:
        return False
    return None


def parse_key_values(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        key = key.strip()
        if re.fullmatch(r"[A-Za-z0-9_]+", key):
            out[key] = value.strip()
    return out


def parse_asset_report(stdout: str) -> dict[str, Any]:
    try:
        data = json.loads(stdout)
        if isinstance(data, dict):
            return data
    except json.JSONDecodeError:
        pass
    return parse_key_values(stdout)


def load_asset_readiness(*, timeout: int) -> tuple[dict[str, Any], CommandResult]:
    result = run_command(
        "asset_readiness",
        [PYTHON, str(ASSET_PROMOTION_REPORT), "--json"],
        timeout=timeout,
    )
    return parse_asset_report(result.stdout) if result.stdout else {}, result


def run_optional_script(name: str, path: Path, *, timeout: int, skip: bool = False) -> CommandResult | None:
    if skip:
        return None
    if not path.exists():
        return CommandResult(name, [PYTHON, str(path)], 127, "", f"Missing script: {path}")
    return run_command(name, [PYTHON, str(path)], timeout=timeout)


def status_word(result: CommandResult | None) -> str:
    if result is None:
        return "skipped"
    return "passed" if result.passed else f"failed({result.returncode})"


def recommendation(asset: dict[str, Any], failures: list[str]) -> str:
    if failures:
        return "fix failing health checks before changing dashboard behavior"
    eligible = int(asset.get("eligible_unconfigured_count") or 0)
    warming = int(asset.get("warming_unconfigured_count") or 0)
    blocker = None
    readiness = asset.get("readiness_summary")
    if isinstance(readiness, dict):
        blockers = readiness.get("dominant_promotion_blockers") or {}
        if isinstance(blockers, dict) and blockers:
            blocker = next(iter(blockers))
    if eligible > 0:
        return "review eligible unconfigured assets for a controlled manifest-promotion PR"
    if warming > 0 and blocker == "date_span_threshold":
        return "keep member universe unchanged; warming assets need more historical span"
    if warming > 0:
        return "keep member universe unchanged; inspect warming asset blockers"
    return "no asset-universe action required"


def print_result_tail(result: CommandResult | None, *, lines: int = 6) -> None:
    if result is None or result.passed:
        return
    combined = "\n".join([result.stdout.strip(), result.stderr.strip()]).strip()
    if not combined:
        return
    print(f"\n[{result.name} diagnostics]")
    for line in combined.splitlines()[-lines:]:
        print(line)


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    repo_status = git_status_short()
    db_default = refresh_default_enabled()

    refresh_smoke = run_optional_script(
        "refresh_default_smoke",
        REFRESH_DEFAULT_SMOKE,
        timeout=args.timeout,
        skip=args.skip_static_smokes,
    )
    local_smoke = run_optional_script("local_dashboard_smoke", LOCAL_SMOKE, timeout=args.timeout, skip=args.skip_local)
    live_smoke = run_optional_script("live_pages_smoke", LIVE_SMOKE, timeout=args.live_timeout, skip=args.skip_live)
    db_contract = run_optional_script("db_source_contract", DB_SOURCE_CONTRACT_REPORT, timeout=args.timeout, skip=args.skip_db_contract)
    asset_report, asset_result = load_asset_readiness(timeout=args.timeout)

    failures: list[str] = []
    for result in [refresh_smoke, local_smoke, live_smoke, db_contract, asset_result]:
        if result is not None and not result.passed:
            failures.append(result.name)

    db_contract_values = parse_key_values(db_contract.stdout) if db_contract and db_contract.stdout else {}
    readiness = asset_report.get("readiness_summary") if isinstance(asset_report.get("readiness_summary"), dict) else {}

    return {
        "repo_status": "clean" if repo_status == "" else repo_status,
        "refresh_db_chart_history_default": db_default,
        "refresh_default_smoke": status_word(refresh_smoke),
        "local_dashboard_smoke": status_word(local_smoke),
        "live_pages_smoke": status_word(live_smoke),
        "db_source_contract": status_word(db_contract),
        "asset_readiness_report": status_word(asset_result),
        "source_table": asset_report.get("source_table") or db_contract_values.get("source_table"),
        "member_assets_configured": asset_report.get("current_member_count") or db_contract_values.get("configured_asset_count"),
        "db_assets_available": asset_report.get("db_asset_count") or db_contract_values.get("eligible_asset_count"),
        "eligible_unconfigured_assets": asset_report.get("eligible_unconfigured_count"),
        "warming_unconfigured_assets": asset_report.get("warming_unconfigured_count"),
        "blocked_unconfigured_assets": asset_report.get("blocked_unconfigured_count"),
        "next_estimated_days_to_eligible": readiness.get("next_estimated_days_to_eligible"),
        "dominant_promotion_blockers": readiness.get("dominant_promotion_blockers"),
        "recommendation": recommendation(asset_report, failures),
        "failures": failures,
        "command_results": {
            "refresh_default_smoke": refresh_smoke,
            "local_dashboard_smoke": local_smoke,
            "live_pages_smoke": live_smoke,
            "db_source_contract": db_contract,
            "asset_readiness_report": asset_result,
        },
    }


def printable_report(report: dict[str, Any], *, show_diagnostics: bool) -> None:
    print("Dashboard Ops Health v1")
    print("=" * 80)
    rows = [
        ("repo_status", report.get("repo_status")),
        ("refresh_db_chart_history_default", report.get("refresh_db_chart_history_default")),
        ("refresh_default_smoke", report.get("refresh_default_smoke")),
        ("local_dashboard_smoke", report.get("local_dashboard_smoke")),
        ("live_pages_smoke", report.get("live_pages_smoke")),
        ("db_source_contract", report.get("db_source_contract")),
        ("asset_readiness_report", report.get("asset_readiness_report")),
        ("source_table", report.get("source_table")),
        ("member_assets_configured", report.get("member_assets_configured")),
        ("db_assets_available", report.get("db_assets_available")),
        ("eligible_unconfigured_assets", report.get("eligible_unconfigured_assets")),
        ("warming_unconfigured_assets", report.get("warming_unconfigured_assets")),
        ("blocked_unconfigured_assets", report.get("blocked_unconfigured_assets")),
        ("next_estimated_days_to_eligible", report.get("next_estimated_days_to_eligible")),
        ("dominant_promotion_blockers", report.get("dominant_promotion_blockers")),
        ("recommendation", report.get("recommendation")),
    ]
    for key, value in rows:
        print(f"{key}: {value}")

    if show_diagnostics:
        for result in report.get("command_results", {}).values():
            print_result_tail(result)


def json_report(report: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in report.items() if key != "command_results"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a compact read-only dashboard ops health report.")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--live-timeout", type=int, default=180)
    parser.add_argument("--skip-live", action="store_true")
    parser.add_argument("--skip-local", action="store_true")
    parser.add_argument("--skip-static-smokes", action="store_true")
    parser.add_argument("--skip-db-contract", action="store_true")
    parser.add_argument("--diagnostics", action="store_true", help="Print failed command output tails.")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        print(json.dumps(json_report(report), indent=2, default=str))
    else:
        printable_report(report, show_diagnostics=args.diagnostics)
    return 1 if report.get("failures") else 0


if __name__ == "__main__":
    raise SystemExit(main())
