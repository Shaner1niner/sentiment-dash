from __future__ import annotations

"""Export dashboard chart history from the canonical enriched DB table.

This is the conservative Phase 2 bridge for the Dashboard DB Source Contract:

    Postgres final_combined_data_enriched_tbl
      -> final_combined_data_enriched_chart_history.csv
      -> existing build_fix26_chart_store_payloads.py

The script does not build dashboard JSON payloads directly. It only exports a
CSV compatible with the existing payload builder so the static dashboard
contract remains stable while the source of truth moves closer to Postgres.

Environment:
  TWT_SNT_DB_URL must be set unless using --print-manifest-terms only.

Examples:
  python scripts/export_dashboard_chart_history_from_db.py --dry-run
  python scripts/export_dashboard_chart_history_from_db.py --output-dir C:\Users\shane\snt_exports
  python scripts/export_dashboard_chart_history_from_db.py --asset-source db --dry-run
"""

import argparse
import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import bindparam, create_engine, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_ENV = "TWT_SNT_DB_URL"
DEFAULT_SOURCE_TABLE = "final_combined_data_enriched_tbl"
DEFAULT_MANIFEST = ROOT / "dashboard_fix26_mode_manifest.json"
DEFAULT_OUTPUT_FILENAME = "final_combined_data_enriched_chart_history.csv"
DEFAULT_OUTPUT_DIR = ROOT / "snt_exports"

REQUIRED_EXPORT_COLUMNS = ["date", "term"]


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def manifest_assets(manifest: dict[str, Any], mode: str) -> list[str]:
    assets = manifest.get("modes", {}).get(mode, {}).get("assets", [])
    out: list[str] = []
    seen: set[str] = set()
    for raw in assets:
        term = str(raw).strip().upper()
        if term and term not in seen:
            seen.add(term)
            out.append(term)
    return out


def manifest_union_assets(manifest: dict[str, Any]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for mode in ("public", "member"):
        for term in manifest_assets(manifest, mode):
            if term not in seen:
                seen.add(term)
                out.append(term)
    return out


def parse_terms(raw_terms: str | None) -> list[str]:
    if not raw_terms:
        return []
    out: list[str] = []
    seen: set[str] = set()
    for piece in raw_terms.split(","):
        term = piece.strip().upper()
        if term and term not in seen:
            seen.add(term)
            out.append(term)
    return out


def parse_table_name(name: str) -> tuple[str | None, str]:
    parts = [p.strip() for p in str(name).split(".") if p.strip()]
    if len(parts) == 1:
        return None, parts[0]
    if len(parts) == 2:
        return parts[0], parts[1]
    raise ValueError(f"Unsupported table name: {name!r}. Use table or schema.table.")


def qualified_table(name: str) -> str:
    schema, table = parse_table_name(name)
    if schema:
        return f'"{schema}"."{table}"'
    return f'"{table}"'


def columns_sql(schema: str | None, table: str) -> tuple[str, dict[str, Any]]:
    if schema:
        return (
            "select column_name from information_schema.columns where table_schema = :schema and table_name = :table order by ordinal_position",
            {"schema": schema, "table": table},
        )
    return (
        "select column_name from information_schema.columns where table_schema not in ('pg_catalog','information_schema') and table_name = :table order by ordinal_position",
        {"table": table},
    )


def source_columns(conn: Any, source_table: str) -> list[str]:
    schema, table = parse_table_name(source_table)
    sql, params = columns_sql(schema, table)
    return [str(row[0]) for row in conn.execute(text(sql), params).fetchall()]


def db_terms(conn: Any, source_table: str, history_days: int | None) -> list[str]:
    where = ["term is not null", "date is not null"]
    params: dict[str, Any] = {}
    if history_days is not None:
        where.append("date >= current_date - (:history_days * interval '1 day')")
        params["history_days"] = int(history_days)
    sql = f"""
        select distinct upper(trim(term::text)) as term
        from {qualified_table(source_table)}
        where {' and '.join(where)}
        order by upper(trim(term::text))
    """
    return [str(row[0]).strip().upper() for row in conn.execute(text(sql), params).fetchall() if row[0]]


def determine_terms(args: argparse.Namespace, conn: Any | None, manifest: dict[str, Any] | None) -> list[str]:
    explicit_terms = parse_terms(args.terms)
    if explicit_terms:
        return explicit_terms

    if args.asset_source == "manifest":
        if manifest is None:
            raise ValueError("manifest is required when --asset-source manifest")
        if args.mode == "all":
            return manifest_union_assets(manifest)
        return manifest_assets(manifest, args.mode)

    if args.asset_source == "db":
        if conn is None:
            raise ValueError("DB connection is required when --asset-source db")
        return db_terms(conn, args.source_table, None if args.no_history_filter else args.history_days)

    raise ValueError(f"Unsupported asset source: {args.asset_source}")


def build_query(source_table: str, terms: list[str], history_days: int | None) -> Any:
    where = ["term is not null", "date is not null"]
    params: dict[str, Any] = {}

    if terms:
        where.append("upper(trim(term::text)) in :terms")
        params["terms"] = terms
    if history_days is not None:
        where.append("date >= current_date - (:history_days * interval '1 day')")
        params["history_days"] = int(history_days)

    sql = f"""
        select *
        from {qualified_table(source_table)}
        where {' and '.join(where)}
        order by upper(trim(term::text)), date
    """
    query = text(sql)
    if terms:
        query = query.bindparams(bindparam("terms", expanding=True))
    return query, params


def export_chart_history(args: argparse.Namespace) -> dict[str, Any]:
    manifest = load_json(Path(args.manifest)) if Path(args.manifest).exists() else None

    if args.print_manifest_terms:
        terms = determine_terms(args, None, manifest)
        print(",".join(terms))
        return {"printed_terms": terms}

    db_url = os.environ.get(args.db_env)
    if not db_url:
        raise RuntimeError(f"{args.db_env} is not set")

    engine = create_engine(db_url)
    with engine.connect() as conn:
        columns = source_columns(conn, args.source_table)
        missing = [col for col in REQUIRED_EXPORT_COLUMNS if col not in columns]
        if missing:
            raise RuntimeError(f"source table missing required columns: {', '.join(missing)}")

        terms = determine_terms(args, conn, manifest)
        history_days = None if args.no_history_filter else args.history_days
        query, params = build_query(args.source_table, terms, history_days)

        if args.dry_run:
            count_query = f"select count(*) from ({str(query)}) as export_preview"
            count_params = dict(params)
            if terms:
                count_query = text(count_query).bindparams(bindparam("terms", expanding=True))
            else:
                count_query = text(count_query)
            row_count = int(conn.execute(count_query, count_params).scalar() or 0)
            return {
                "dry_run": True,
                "source_table": args.source_table,
                "asset_source": args.asset_source,
                "mode": args.mode,
                "term_count": len(terms),
                "terms": terms,
                "history_days": history_days,
                "row_count": row_count,
                "source_column_count": len(columns),
            }

        df = pd.read_sql_query(query, conn, params=params)

    if df.empty:
        raise RuntimeError("DB export returned zero rows; refusing to write an empty chart-history CSV")

    df["term"] = df["term"].astype(str).str.strip().str.upper()
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.strftime("%Y-%m-%d")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / args.output_filename
    df.to_csv(output_path, index=False)

    tableau_path = None
    if args.tableau_autosync_dir:
        tableau_dir = Path(args.tableau_autosync_dir)
        tableau_dir.mkdir(parents=True, exist_ok=True)
        tableau_path = tableau_dir / args.output_filename
        shutil.copy2(output_path, tableau_path)

    return {
        "dry_run": False,
        "source_table": args.source_table,
        "asset_source": args.asset_source,
        "mode": args.mode,
        "term_count": int(df["term"].nunique()),
        "terms": sorted(df["term"].dropna().unique().tolist()),
        "history_days": None if args.no_history_filter else args.history_days,
        "row_count": len(df),
        "column_count": len(df.columns),
        "output_path": str(output_path),
        "tableau_autosync_path": str(tableau_path) if tableau_path else None,
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export dashboard chart-history CSV from the canonical enriched DB table.")
    parser.add_argument("--db-env", default=DEFAULT_DB_ENV)
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--mode", choices=["public", "member", "all"], default="all")
    parser.add_argument("--asset-source", choices=["manifest", "db"], default="manifest")
    parser.add_argument("--terms", default=None, help="Comma-separated explicit asset list. Overrides --asset-source.")
    parser.add_argument("--history-days", type=int, default=365)
    parser.add_argument("--no-history-filter", action="store_true")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--output-filename", default=DEFAULT_OUTPUT_FILENAME)
    parser.add_argument("--tableau-autosync-dir", default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--print-manifest-terms", action="store_true")
    args = parser.parse_args()

    result = export_chart_history(args)
    if args.json:
        print(json.dumps(result, indent=2, default=str))
    elif not args.print_manifest_terms:
        print("[OK] dashboard chart-history DB export bridge")
        for key, value in result.items():
            print(f"{key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
