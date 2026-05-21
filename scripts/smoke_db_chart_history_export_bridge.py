from __future__ import annotations

"""Static smoke checks for the DB chart-history export bridge.

This smoke test does not connect to Postgres. It protects the conservative
Phase 2 contract: DB table -> CSV bridge -> existing payload builder.
"""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "export_dashboard_chart_history_from_db.py"
DOC = ROOT / "docs" / "DASHBOARD_DB_SOURCE_CONTRACT_V1.md"


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
    script_text = require_text(
        SCRIPT,
        [
            "DEFAULT_SOURCE_TABLE = \"final_combined_data_enriched_tbl\"",
            "DEFAULT_OUTPUT_FILENAME = \"final_combined_data_enriched_chart_history.csv\"",
            "DEFAULT_DB_ENV = \"TWT_SNT_DB_URL\"",
            "asset-source",
            "manifest_union_assets",
            "db_terms",
            "dry_run",
            "tableau_autosync_dir",
            "pd.read_sql_query",
            "df.to_csv",
            "refusing to write an empty chart-history CSV",
            "existing build_fix26_chart_store_payloads.py",
        ],
    )
    try:
        ast.parse(script_text)
    except SyntaxError as exc:
        fail(f"export bridge has syntax error: {exc}")

    forbidden_tokens = [
        "insert into",
        "update ",
        "delete from",
        "drop table",
        "create table",
        "alter table",
    ]
    lowered = script_text.lower()
    for token in forbidden_tokens:
        if token in lowered:
            fail(f"export bridge should not write to DB; found token: {token}")
    ok("DB chart-history export bridge is syntactically valid and DB-read-only")

    require_text(
        DOC,
        [
            "Phase 2 - DB-to-CSV bridge",
            "Postgres -> final_combined_data_enriched_chart_history.csv -> existing payload builder",
        ],
    )
    ok("DB source contract documents the bridge boundary")

    print("[OK] DB chart-history export bridge smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
