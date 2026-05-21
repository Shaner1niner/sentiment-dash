from __future__ import annotations

"""Static smoke checks for refresh_fix26_dashboard_all.bat DB-export opt-in.

This smoke test does not run the production refresh. It verifies that the BAT
keeps the legacy exporter as the default path, exposes an explicit DB bridge
opt-in, protects fallback behavior, and passes calibrated history-depth
guardrails to the DB chart-history bridge.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BAT = ROOT / "refresh_fix26_dashboard_all.bat"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not BAT.exists():
        fail("missing refresh_fix26_dashboard_all.bat")
    text = BAT.read_text(encoding="utf-8")

    required_tokens = [
        "set \"DB_EXPORT_BRIDGE=%WEBSITE_REPO%\\scripts\\export_dashboard_chart_history_from_db.py\"",
        "if \"%USE_DB_CHART_EXPORT%\"==\"\" set \"USE_DB_CHART_EXPORT=0\"",
        "if \"%DB_EXPORT_FALLBACK_TO_LEGACY%\"==\"\" set \"DB_EXPORT_FALLBACK_TO_LEGACY=1\"",
        "if \"%DB_CHART_EXPORT_ASSET_SOURCE%\"==\"\" set \"DB_CHART_EXPORT_ASSET_SOURCE=manifest\"",
        "if \"%DB_CHART_MIN_ROWS_PER_TERM%\"==\"\" set \"DB_CHART_MIN_ROWS_PER_TERM=150\"",
        "if \"%DB_CHART_MIN_MEDIAN_ROWS_PER_TERM%\"==\"\" set \"DB_CHART_MIN_MEDIAN_ROWS_PER_TERM=250\"",
        "if \"%DB_CHART_MIN_DATE_SPAN_DAYS%\"==\"\" set \"DB_CHART_MIN_DATE_SPAN_DAYS=330\"",
        "echo [1/8] Running legacy chart-history exporter...",
        "echo [1b/8] Overlaying chart-history CSV from canonical DB table...",
        "--asset-source \"%DB_CHART_EXPORT_ASSET_SOURCE%\"",
        "--min-rows-per-term %DB_CHART_MIN_ROWS_PER_TERM%",
        "--min-median-rows-per-term %DB_CHART_MIN_MEDIAN_ROWS_PER_TERM%",
        "--min-date-span-days %DB_CHART_MIN_DATE_SPAN_DAYS%",
        "--tableau-autosync-dir \"%TABLEAU_AUTOSYNC_DIR%\"",
        "echo [WARN] DB chart-history overlay failed. Continuing with legacy exporter chart-history CSV.",
        "DB_EXPORT_FALLBACK_TO_LEGACY=0",
        "DB chart-history export must pass row/date-depth guardrails before overwriting CSVs",
        "Legacy exporter still refreshes alert/audit/attention sidecars used downstream",
    ]
    for token in required_tokens:
        if token not in text:
            fail(f"missing expected token: {token}")
    ok("refresh BAT exposes DB bridge opt-in, fallback controls, and calibrated depth guard thresholds")

    legacy_idx = text.find("echo [1/8] Running legacy chart-history exporter...")
    overlay_idx = text.find("echo [1b/8] Overlaying chart-history CSV from canonical DB table...")
    screener_idx = text.find("echo [2/8] Building SETA market screener")
    if not (0 <= legacy_idx < overlay_idx < screener_idx):
        fail("expected order is legacy exporter, optional DB overlay, then screener builder")
    ok("refresh BAT runs optional DB overlay after legacy exporter and before screener build")

    if text.count("%PYTHON_EXE%\" \"%DB_EXPORT_BRIDGE%\"") != 1:
        fail("expected exactly one DB export bridge invocation")
    ok("refresh BAT invokes DB export bridge exactly once")

    print("[OK] refresh DB export opt-in smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
