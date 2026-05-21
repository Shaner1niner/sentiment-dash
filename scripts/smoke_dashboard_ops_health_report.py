from __future__ import annotations

"""Static smoke test for report_dashboard_ops_health.py.

This does not run live checks. It protects the one-command cockpit contract and
ensures the report remains read-only.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "report_dashboard_ops_health.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not SCRIPT.exists():
        fail("missing scripts/report_dashboard_ops_health.py")
    text = SCRIPT.read_text(encoding="utf-8")

    required_tokens = [
        "Compact read-only dashboard operations health report",
        "Dashboard Ops Health v1",
        "refresh_db_chart_history_default",
        "refresh_default_smoke",
        "local_dashboard_smoke",
        "live_pages_smoke",
        "db_source_contract",
        "asset_readiness_report",
        "member_assets_configured",
        "db_assets_available",
        "eligible_unconfigured_assets",
        "warming_unconfigured_assets",
        "next_estimated_days_to_eligible",
        "dominant_promotion_blockers",
        "recommendation",
        "--skip-live",
        "--skip-local",
        "--skip-static-smokes",
        "--skip-db-contract",
        "--diagnostics",
        "--json",
    ]
    for token in required_tokens:
        if token not in text:
            fail(f"missing expected token: {token}")
    ok("dashboard ops health report includes cockpit fields and skip flags")

    read_only_tokens = [
        '"git", "status", "--short"',
        "smoke_fix26_dashboard.py",
        "smoke_github_pages_live.py",
        "smoke_refresh_db_export_opt_in.py",
        "report_asset_universe_promotion.py",
        "report_dashboard_db_source_contract.py",
    ]
    for token in read_only_tokens:
        if token not in text:
            fail(f"missing read-only dependency token: {token}")
    ok("dashboard ops health report composes existing read-only checks")

    blocked_tokens = [
        "refresh_fix26_dashboard_all.bat]",
        "git add",
        "git commit",
        "git push",
        ".write_text(",
        "json.dump(",
        "to_sql(",
    ]
    for token in blocked_tokens:
        if token in text:
            fail(f"unexpected mutation-like token found: {token}")
    ok("dashboard ops health report has no known mutation actions")

    print("[OK] dashboard ops health report smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
