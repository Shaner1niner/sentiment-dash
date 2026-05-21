from __future__ import annotations

"""Static smoke checks for the DB history backfill helper.

This test does not connect to Postgres and does not write data. It protects the
helper's dry-run-first safety model and explicit write flags.
"""

import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "backfill_final_enriched_from_chart_history.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not SCRIPT.exists():
        fail("missing backfill helper script")
    text = SCRIPT.read_text(encoding="utf-8")

    required_tokens = [
        "Dry-run is the default",
        "No DB writes happen unless --execute is provided",
        "DEFAULT_TARGET_TABLE = \"final_combined_data_enriched_tbl\"",
        "DEFAULT_CSV = Path(r\"C:",
        "final_combined_data_enriched_chart_history.csv",
        "--execute",
        "--write-mode",
        "--allow-delete-insert",
        "normalize_constraint_columns",
        "PostgreSQL array literal string such as '{date,term}'",
        "upsert requires a PRIMARY KEY or UNIQUE constraint",
        "delete-insert requires --allow-delete-insert",
        "common_column_count",
        "ignored_csv_columns_sample",
        "missing_target_columns_sample",
        "target_summary_before",
        "target_summary_after",
    ]
    for token in required_tokens:
        if token not in text:
            fail(f"missing expected token: {token}")

    try:
        ast.parse(text)
    except SyntaxError as exc:
        fail(f"backfill helper has syntax error: {exc}")

    dry_run_gate = "if not args.execute:\n            return report"
    dry_run_idx = text.find(dry_run_gate)
    if dry_run_idx < 0:
        fail("missing explicit dry-run return before execution")

    guarded_execution_tokens = [
        "if args.write_mode == \"upsert\":\n            executed = execute_upsert(",
        "else:\n            executed = execute_delete_insert(",
    ]
    for token in guarded_execution_tokens:
        token_idx = text.find(token)
        if token_idx < 0:
            fail(f"missing guarded execution token: {token}")
        if dry_run_idx > token_idx:
            fail("dry-run return appears after guarded execution branch")
    ok("backfill helper is dry-run-first with explicit execution gating")

    if text.count("conn.execute(") < 4:
        fail("expected DB inspection and execution paths to be explicit")
    ok("backfill helper contains explicit DB inspection/write paths")

    print("[OK] DB history backfill helper smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
