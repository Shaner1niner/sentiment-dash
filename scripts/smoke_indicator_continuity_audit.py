from __future__ import annotations

"""Static smoke test for audit_indicator_continuity.py."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "audit_indicator_continuity.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not SCRIPT.exists():
        fail("missing scripts/audit_indicator_continuity.py")
    text = SCRIPT.read_text(encoding="utf-8")

    required_tokens = [
        "Indicator Continuity Audit v1",
        "Read-only indicator continuity audit",
        "unexpected null runs",
        "DEFAULT_PAYLOAD_DIR",
        "dashboard_fix26_mode_manifest.json",
        "fix26_chart_store_assets",
        "INDICATOR_CONFIG",
        "rsi",
        "sentiment_rsi",
        "stochastic_rsi",
        "stochastic_rsi_d",
        "sentiment_stochastic_rsi_d",
        "warmup",
        "max_mid_null_run",
        "find_unexpected_null_runs",
        "unexpected_null_run_count",
        "max_unexpected_null_run",
        "--warn-only",
        "--terms",
        "--json",
    ]
    for token in required_tokens:
        if token not in text:
            fail(f"missing expected token: {token}")
    ok("indicator continuity audit includes expected indicators and report fields")

    read_only_tokens = [
        "load_payload_rows",
        "load_json",
        "manifest_assets",
        "return 1 if report.get",
    ]
    for token in read_only_tokens:
        if token not in text:
            fail(f"missing read-only audit token: {token}")
    ok("indicator continuity audit uses read-only payload inspection")

    forbidden_fragments = [
        "write_text(",
        "json.dump(",
        "to_sql(",
        "create_engine(",
    ]
    for token in forbidden_fragments:
        if token in text:
            fail(f"unexpected non-read-only fragment found: {token}")
    ok("indicator continuity audit has no known payload-write or DB-engine calls")

    print("[OK] indicator continuity audit smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
