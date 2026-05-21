from __future__ import annotations

"""Static smoke checks for the Dashboard DB Source Contract v1.

This smoke test intentionally does not connect to Postgres. It protects the
contract doc and the read-only reporting script so the DB-source migration can
advance without changing generated payloads or requiring local secrets in CI.
"""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOC = ROOT / "docs" / "DASHBOARD_DB_SOURCE_CONTRACT_V1.md"
REPORT_SCRIPT = ROOT / "scripts" / "report_dashboard_db_source_contract.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def require_text(path: Path, tokens: list[str]) -> str:
    if not path.exists():
        fail(f"missing file: {path.relative_to(ROOT)}")
    text = path.read_text(encoding="utf-8")
    for token in tokens:
        if token not in text:
            fail(f"{path.relative_to(ROOT)} missing token: {token}")
    return text


def main() -> int:
    doc_text = require_text(
        DOC,
        [
            "final_combined_data_enriched_tbl",
            "final_combined_data_enriched_dictionary_tbl",
            "Postgres final enriched table",
            "generated static JSON payloads",
            "Pipeline universe",
            "Public mode assets",
            "Member mode assets",
            "Do not commit",
            "Automatically expose every upstream asset publicly",
        ],
    )
    if "browser dashboard should not connect to Postgres directly" not in doc_text:
        fail("contract must preserve the static dashboard / no browser-DB boundary")
    ok("DB source contract doc preserves source tables, mode universe rules, and safety boundaries")

    script_text = require_text(
        REPORT_SCRIPT,
        [
            "DEFAULT_SOURCE_TABLE = \"final_combined_data_enriched_tbl\"",
            "DEFAULT_DICTIONARY_TABLE = \"final_combined_data_enriched_dictionary_tbl\"",
            "DEFAULT_DB_ENV = \"TWT_SNT_DB_URL\"",
            "REQUIRED_DASHBOARD_COLUMNS",
            "configured_missing_from_db",
            "unconfigured_available_assets",
            "configured_missing_from_index",
            "stale_assets",
            "--json",
        ],
    )

    try:
        ast.parse(script_text)
    except SyntaxError as exc:
        fail(f"report script has syntax error: {exc}")

    forbidden_write_tokens = [
        ".to_csv(",
        ".to_json(",
        ".write_text(",
        "open(\"w",
        "open('w",
        "insert into",
        "delete from",
        "drop table",
        "create table",
    ]
    lowered = script_text.lower()
    for token in forbidden_write_tokens:
        if token in lowered:
            fail(f"report script should remain read-only; found token: {token}")
    ok("DB source report script is syntactically valid and protected as read-only")

    print("[OK] dashboard DB source contract smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
