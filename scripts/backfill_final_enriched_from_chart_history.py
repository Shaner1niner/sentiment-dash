from __future__ import annotations

r"""Dry-run-first helper for backfilling final_combined_data_enriched_tbl.

Purpose
-------
The dashboard DB bridge is wired and protected, but the canonical enriched DB
source currently has short history depth. This helper compares the full-depth
legacy chart-history CSV against the DB table and can backfill matching columns
into the target table only when explicitly run with --execute.

Safety model
------------
- Dry-run is the default.
- No DB writes happen unless --execute is provided.
- Only columns present in both CSV and target table are considered.
- Required keys are date + term by default.
- Upsert mode requires a unique/primary constraint on the conflict keys.
- Delete-insert mode is available only with --execute and --allow-delete-insert.

Typical dry run:
  python scripts/backfill_final_enriched_from_chart_history.py ^
    --csv C:\Users\shane\snt_exports\final_combined_data_enriched_chart_history.csv ^
    --json

Strict execution with an existing date/term unique constraint:
  python scripts/backfill_final_enriched_from_chart_history.py ^
    --csv C:\Users\shane\snt_exports\final_combined_data_enriched_chart_history.csv ^
    --execute ^
    --write-mode upsert
"""

import argparse
import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_ENV = "TWT_SNT_DB_URL"
DEFAULT_TARGET_TABLE = "final_combined_data_enriched_tbl"
DEFAULT_CSV = Path(r"C:\Users\shane\snt_exports\final_combined_data_enriched_chart_history.csv")
DEFAULT_KEYS = ["date", "term"]
DEFAULT_CHUNK_SIZE = 1000


@dataclass
class TableRef:
    schema: str | None
    table: str


def parse_table_name(name: str) -> TableRef:
    parts = [p.strip() for p in str(name).split(".") if p.strip()]
    if len(parts) == 1:
        return TableRef(None, parts[0])
    if len(parts) == 2:
        return TableRef(parts[0], parts[1])
    raise ValueError(f"Unsupported table name: {name!r}. Use table or schema.table.")


def qualified_table(name: str) -> str:
    ref = parse_table_name(name)
    if ref.schema:
        return f'"{ref.schema}"."{ref.table}"'
    return f'"{ref.table}"'


def columns_sql(ref: TableRef) -> tuple[str, dict[str, Any]]:
    if ref.schema:
        return (
            "select column_name from information_schema.columns where table_schema = :schema and table_name = :table order by ordinal_position",
            {"schema": ref.schema, "table": ref.table},
        )
    return (
        "select column_name from information_schema.columns where table_schema not in ('pg_catalog','information_schema') and table_name = :table order by ordinal_position",
        {"table": ref.table},
    )


def table_columns(conn: Any, table_name: str) -> list[str]:
    sql, params = columns_sql(parse_table_name(table_name))
    return [str(row[0]) for row in conn.execute(text(sql), params).fetchall()]


def existing_constraint_columns(conn: Any, table_name: str) -> list[list[str]]:
    ref = parse_table_name(table_name)
    params: dict[str, Any] = {"table": ref.table}
    schema_clause = ""
    if ref.schema:
        params["schema"] = ref.schema
        schema_clause = "and tc.table_schema = :schema"
    else:
        schema_clause = "and tc.table_schema not in ('pg_catalog','information_schema')"
    sql = f"""
        select tc.constraint_name,
               array_agg(kcu.column_name order by kcu.ordinal_position) as columns
        from information_schema.table_constraints tc
        join information_schema.key_column_usage kcu
          on tc.constraint_name = kcu.constraint_name
         and tc.table_schema = kcu.table_schema
         and tc.table_name = kcu.table_name
        where tc.table_name = :table
          {schema_clause}
          and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE')
        group by tc.constraint_name
    """
    return [list(row[1]) for row in conn.execute(text(sql), params).fetchall()]


def read_csv_headers(path: Path) -> list[str]:
    return pd.read_csv(path, nrows=0).columns.astype(str).tolist()


def normalize_frame(df: pd.DataFrame, key_columns: list[str]) -> pd.DataFrame:
    out = df.copy()
    if "term" in out.columns:
        out["term"] = out["term"].astype(str).str.strip().str.upper()
    if "date" in out.columns:
        out["date"] = pd.to_datetime(out["date"], errors="coerce").dt.strftime("%Y-%m-%d")
    out = out.dropna(subset=key_columns)
    out = out.drop_duplicates(subset=key_columns, keep="last")
    return out


def csv_summary(path: Path, key_columns: list[str]) -> dict[str, Any]:
    df = pd.read_csv(path, usecols=[c for c in key_columns if c in read_csv_headers(path)])
    df = normalize_frame(df, key_columns)
    dates = pd.to_datetime(df["date"], errors="coerce") if "date" in df.columns else pd.Series(dtype="datetime64[ns]")
    terms = sorted(df["term"].dropna().astype(str).str.upper().unique().tolist()) if "term" in df.columns else []
    return {
        "row_count": int(len(df)),
        "term_count": len(terms),
        "terms": terms,
        "min_date": dates.min().date().isoformat() if len(dates.dropna()) else None,
        "max_date": dates.max().date().isoformat() if len(dates.dropna()) else None,
    }


def db_summary(conn: Any, table_name: str, terms: list[str], key_columns: list[str]) -> dict[str, Any]:
    if "date" not in key_columns or "term" not in key_columns:
        return {}
    params = {"terms": terms}
    where = ""
    if terms:
        where = "where upper(trim(term::text)) = any(:terms)"
    sql = f"""
        select count(*)::bigint as row_count,
               count(distinct upper(trim(term::text)))::bigint as term_count,
               min(date)::date as min_date,
               max(date)::date as max_date
        from {qualified_table(table_name)}
        {where}
    """
    row = conn.execute(text(sql), params).first()
    if row is None:
        return {}
    return {
        "row_count": int(row[0] or 0),
        "term_count": int(row[1] or 0),
        "min_date": row[2].isoformat() if row[2] else None,
        "max_date": row[3].isoformat() if row[3] else None,
    }


def build_insert_sql(table_name: str, columns: list[str], key_columns: list[str]) -> str:
    quoted_cols = [f'"{col}"' for col in columns]
    placeholders = [f":{col}" for col in columns]
    update_cols = [col for col in columns if col not in key_columns]
    set_clause = ", ".join(f'"{col}" = excluded."{col}"' for col in update_cols)
    conflict_cols = ", ".join(f'"{col}"' for col in key_columns)
    return (
        f"insert into {qualified_table(table_name)} ({', '.join(quoted_cols)}) "
        f"values ({', '.join(placeholders)}) "
        f"on conflict ({conflict_cols}) do update set {set_clause}"
    )


def chunked_records(df: pd.DataFrame, chunk_size: int) -> list[list[dict[str, Any]]]:
    records = df.where(pd.notna(df), None).to_dict(orient="records")
    return [records[i : i + chunk_size] for i in range(0, len(records), chunk_size)]


def execute_upsert(conn: Any, df: pd.DataFrame, table_name: str, columns: list[str], key_columns: list[str], chunk_size: int) -> int:
    sql = text(build_insert_sql(table_name, columns, key_columns))
    total = 0
    for chunk in chunked_records(df[columns], chunk_size):
        if not chunk:
            continue
        conn.execute(sql, chunk)
        total += len(chunk)
    return total


def execute_delete_insert(conn: Any, df: pd.DataFrame, table_name: str, columns: list[str], key_columns: list[str], chunk_size: int) -> int:
    terms = sorted(df["term"].dropna().astype(str).str.upper().unique().tolist())
    min_date = df["date"].min()
    max_date = df["date"].max()
    delete_sql = text(
        f"""
        delete from {qualified_table(table_name)}
        where upper(trim(term::text)) = any(:terms)
          and date between :min_date and :max_date
        """
    )
    conn.execute(delete_sql, {"terms": terms, "min_date": min_date, "max_date": max_date})
    quoted_cols = [f'"{col}"' for col in columns]
    placeholders = [f":{col}" for col in columns]
    insert_sql = text(
        f"insert into {qualified_table(table_name)} ({', '.join(quoted_cols)}) values ({', '.join(placeholders)})"
    )
    total = 0
    for chunk in chunked_records(df[columns], chunk_size):
        if not chunk:
            continue
        conn.execute(insert_sql, chunk)
        total += len(chunk)
    return total


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    key_columns = [c.strip() for c in args.key_columns.split(",") if c.strip()]
    csv_columns = read_csv_headers(csv_path)
    missing_csv_keys = [c for c in key_columns if c not in csv_columns]
    if missing_csv_keys:
        raise RuntimeError(f"CSV missing key columns: {', '.join(missing_csv_keys)}")

    db_url = os.environ.get(args.db_env)
    if not db_url:
        raise RuntimeError(f"{args.db_env} is not set")

    engine = create_engine(db_url)
    with engine.begin() as conn:
        target_columns = table_columns(conn, args.target_table)
        missing_db_keys = [c for c in key_columns if c not in target_columns]
        if missing_db_keys:
            raise RuntimeError(f"target table missing key columns: {', '.join(missing_db_keys)}")

        common_columns = [c for c in csv_columns if c in target_columns]
        ignored_csv_columns = [c for c in csv_columns if c not in target_columns]
        missing_target_columns = [c for c in target_columns if c not in csv_columns]
        constraints = existing_constraint_columns(conn, args.target_table)
        has_key_constraint = key_columns in constraints

        csv_info = csv_summary(csv_path, key_columns)
        target_info_before = db_summary(conn, args.target_table, csv_info.get("terms", []), key_columns)

        report: dict[str, Any] = {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "dry_run": not args.execute,
            "csv": str(csv_path),
            "target_table": args.target_table,
            "write_mode": args.write_mode,
            "key_columns": key_columns,
            "csv_column_count": len(csv_columns),
            "target_column_count": len(target_columns),
            "common_column_count": len(common_columns),
            "ignored_csv_columns_count": len(ignored_csv_columns),
            "ignored_csv_columns_sample": ignored_csv_columns[:50],
            "missing_target_columns_count": len(missing_target_columns),
            "missing_target_columns_sample": missing_target_columns[:50],
            "csv_summary": csv_info,
            "target_summary_before": target_info_before,
            "has_key_constraint": has_key_constraint,
            "key_constraints": constraints,
            "executed_rows": 0,
        }

        if not args.execute:
            return report

        if args.write_mode == "upsert" and not has_key_constraint:
            raise RuntimeError(
                f"upsert requires a PRIMARY KEY or UNIQUE constraint exactly on {key_columns}; "
                "use --write-mode delete-insert --allow-delete-insert only after reviewing the dry run"
            )
        if args.write_mode == "delete-insert" and not args.allow_delete_insert:
            raise RuntimeError("delete-insert requires --allow-delete-insert")

        usecols = common_columns
        df = pd.read_csv(csv_path, usecols=usecols)
        df = normalize_frame(df, key_columns)
        if df.empty:
            raise RuntimeError("CSV produced zero rows after key normalization; refusing to write")

        if args.limit_rows:
            df = df.head(args.limit_rows)

        if args.write_mode == "upsert":
            executed = execute_upsert(conn, df, args.target_table, common_columns, key_columns, args.chunk_size)
        else:
            executed = execute_delete_insert(conn, df, args.target_table, common_columns, key_columns, args.chunk_size)

        report["executed_rows"] = executed
        report["target_summary_after"] = db_summary(conn, args.target_table, csv_info.get("terms", []), key_columns)
        return report


def print_text(report: dict[str, Any]) -> None:
    print("DB final enriched backfill helper")
    print("=" * 80)
    for key in [
        "dry_run",
        "csv",
        "target_table",
        "write_mode",
        "key_columns",
        "csv_column_count",
        "target_column_count",
        "common_column_count",
        "ignored_csv_columns_count",
        "missing_target_columns_count",
        "has_key_constraint",
        "executed_rows",
    ]:
        print(f"{key}: {report.get(key)}")
    print(f"csv_summary: {report.get('csv_summary')}")
    print(f"target_summary_before: {report.get('target_summary_before')}")
    if "target_summary_after" in report:
        print(f"target_summary_after: {report.get('target_summary_after')}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Dry-run-first backfill helper for final_combined_data_enriched_tbl.")
    parser.add_argument("--csv", default=str(DEFAULT_CSV))
    parser.add_argument("--target-table", default=DEFAULT_TARGET_TABLE)
    parser.add_argument("--db-env", default=DEFAULT_DB_ENV)
    parser.add_argument("--key-columns", default=",".join(DEFAULT_KEYS))
    parser.add_argument("--write-mode", choices=["upsert", "delete-insert"], default="upsert")
    parser.add_argument("--execute", action="store_true", help="Actually write matching CSV columns to the target DB table.")
    parser.add_argument("--allow-delete-insert", action="store_true", help="Required when --write-mode delete-insert is used.")
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE)
    parser.add_argument("--limit-rows", type=int, default=0, help="Optional execution row limit for first-pass testing.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print_text(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
