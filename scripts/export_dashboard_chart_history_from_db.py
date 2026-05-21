from __future__ import annotations

"""Export dashboard chart history from the canonical enriched DB table.

Conservative Phase 2 bridge for the Dashboard DB Source Contract:

    Postgres final_combined_data_enriched_tbl
      -> final_combined_data_enriched_chart_history.csv
      -> existing build_fix26_chart_store_payloads.py

The script does not build dashboard JSON payloads directly. It only exports a
CSV compatible with the existing payload builder so the static dashboard
contract remains stable while the source of truth moves closer to Postgres.

Environment:
  TWT_SNT_DB_URL must be set unless using --print-manifest-terms only.
"""

import argparse
import json
import os
import shutil
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import median
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
DEFAULT_MIN_ROWS_PER_TERM = 180
DEFAULT_MIN_MEDIAN_ROWS_PER_TERM = 200
DEFAULT_MIN_DATE_SPAN_DAYS = 240


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


def where_clause(terms: list[str], history_days: int | None) -> tuple[list[str], dict[str, Any]]:
    where = ["term is not null", "date is not null"]
    params: dict[str, Any] = {}
    if terms:
        where.append("upper(trim(term::text)) in :terms")
        params["terms"] = terms
    if history_days is not None:
        where.append("date >= current_date - (:history_days * interval '1 day')")
        params["history_days"] = int(history_days)
    return where, params


def bind_query(sql: str, terms: list[str]) -> Any:
    query = text(sql)
    if terms:
        query = query.bindparams(bindparam("terms", expanding=True))
    return query


def db_terms(conn: Any, source_table: str, history_days: int | None) -> list[str]:
    where, params = where_clause([], history_days)
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


def build_export_query(source_table: str, terms: list[str], history_days: int | None) -> tuple[Any, dict[str, Any]]:
    where, params = where_clause(terms, history_days)
    sql = f"""
        select *
        from {qualified_table(source_table)}
        where {' and '.join(where)}
        order by upper(trim(term::text)), date
    """
    return bind_query(sql, terms), params


def build_term_stats_query(source_table: str, terms: list[str], history_days: int | None) -> tuple[Any, dict[str, Any]]:
    where, params = where_clause(terms, history_days)
    sql = f"""
        select upper(trim(term::text)) as term,
               count(*)::bigint as row_count,
               min(date)::date as min_date,
               max(date)::date as max_date
        from {qualified_table(source_table)}
        where {' and '.join(where)}
        group by upper(trim(term::text))
        order by upper(trim(term::text))
    """
    return bind_query(sql, terms), params


def date_value(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            return None


def iso_date(value: Any) -> str | None:
    parsed = date_value(value)
    return parsed.isoformat() if parsed else None


def stats_from_rows(rows: list[dict[str, Any]], requested_terms: list[str], min_rows_per_term: int) -> dict[str, Any]:
    normalized: list[dict[str, Any]] = []
    for row in rows:
        term = str(row.get("term") or "").strip().upper()
        if not term:
            continue
        normalized.append(
            {
                "term": term,
                "row_count": int(row.get("row_count") or 0),
                "min_date": iso_date(row.get("min_date")),
                "max_date": iso_date(row.get("max_date")),
            }
        )

    present_terms = {row["term"] for row in normalized}
    requested = {term.upper() for term in requested_terms if term}
    missing_terms = sorted(requested - present_terms)
    row_counts = [row["row_count"] for row in normalized]
    parsed_min_dates = [date_value(row["min_date"]) for row in normalized if row.get("min_date")]
    parsed_max_dates = [date_value(row["max_date"]) for row in normalized if row.get("max_date")]
    parsed_min_dates = [d for d in parsed_min_dates if d is not None]
    parsed_max_dates = [d for d in parsed_max_dates if d is not None]
    global_min = min(parsed_min_dates) if parsed_min_dates else None
    global_max = max(parsed_max_dates) if parsed_max_dates else None
    terms_below_min = [row for row in normalized if row["row_count"] < min_rows_per_term]

    return {
        "term_count": len(normalized),
        "requested_term_count": len(requested_terms),
        "missing_requested_terms": missing_terms,
        "row_count": sum(row_counts),
        "min_date": global_min.isoformat() if global_min else None,
        "max_date": global_max.isoformat() if global_max else None,
        "date_span_days": (global_max - global_min).days if global_min and global_max else None,
        "rows_per_term_min": min(row_counts) if row_counts else 0,
        "rows_per_term_median": float(median(row_counts)) if row_counts else 0.0,
        "rows_per_term_max": max(row_counts) if row_counts else 0,
        "terms_below_min_rows_count": len(terms_below_min),
        "terms_below_min_rows_sample": terms_below_min[:20],
    }


def stats_from_dataframe(df: pd.DataFrame, requested_terms: list[str], min_rows_per_term: int) -> dict[str, Any]:
    tmp = df[["date", "term"]].copy()
    tmp["term"] = tmp["term"].astype(str).str.strip().str.upper()
    tmp["date"] = pd.to_datetime(tmp["date"], errors="coerce")
    grouped = tmp.dropna(subset=["date", "term"]).groupby("term", dropna=True)["date"].agg(["size", "min", "max"]).reset_index()
    rows = [
        {
            "term": row["term"],
            "row_count": int(row["size"]),
            "min_date": row["min"].date() if pd.notna(row["min"]) else None,
            "max_date": row["max"].date() if pd.notna(row["max"]) else None,
        }
        for _, row in grouped.iterrows()
    ]
    return stats_from_rows(rows, requested_terms, min_rows_per_term)


def depth_guard(summary: dict[str, Any], args: argparse.Namespace) -> dict[str, Any]:
    failures: list[str] = []
    if args.skip_depth_guard:
        return {"enabled": False, "passed": True, "failures": [], "thresholds": {}}

    min_total_rows = int(args.min_total_rows or 0)
    min_rows_per_term = int(args.min_rows_per_term or 0)
    min_median_rows = int(args.min_median_rows_per_term or 0)
    min_date_span = int(args.min_date_span_days or 0)

    if summary["missing_requested_terms"]:
        failures.append(f"missing requested terms: {', '.join(summary['missing_requested_terms'][:20])}")
    if min_total_rows and summary["row_count"] < min_total_rows:
        failures.append(f"row_count {summary['row_count']} < min_total_rows {min_total_rows}")
    if min_rows_per_term and summary["rows_per_term_min"] < min_rows_per_term:
        failures.append(f"rows_per_term_min {summary['rows_per_term_min']} < min_rows_per_term {min_rows_per_term}")
    if min_median_rows and summary["rows_per_term_median"] < min_median_rows:
        failures.append(
            f"rows_per_term_median {summary['rows_per_term_median']:.1f} < min_median_rows_per_term {min_median_rows}"
        )
    if min_date_span and (summary["date_span_days"] is None or summary["date_span_days"] < min_date_span):
        failures.append(f"date_span_days {summary['date_span_days']} < min_date_span_days {min_date_span}")

    return {
        "enabled": True,
        "passed": not failures,
        "failures": failures,
        "thresholds": {
            "min_total_rows": min_total_rows,
            "min_rows_per_term": min_rows_per_term,
            "min_median_rows_per_term": min_median_rows,
            "min_date_span_days": min_date_span,
        },
    }


def export_chart_history(args: argparse.Namespace) -> dict[str, Any]:
    manifest_path = Path(args.manifest)
    manifest = load_json(manifest_path) if manifest_path.exists() else None

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
        stats_query, stats_params = build_term_stats_query(args.source_table, terms, history_days)
        stats_rows = [dict(row._mapping) for row in conn.execute(stats_query, stats_params).fetchall()]
        summary = stats_from_rows(stats_rows, terms, args.min_rows_per_term)
        guard = depth_guard(summary, args)

        if args.dry_run:
            return {
                "dry_run": True,
                "source_table": args.source_table,
                "asset_source": args.asset_source,
                "mode": args.mode,
                "terms": terms,
                "history_days": history_days,
                "source_column_count": len(columns),
                "history_depth": summary,
                "depth_guard": guard,
            }

        query, params = build_export_query(args.source_table, terms, history_days)
        df = pd.read_sql_query(query, conn, params=params)

    if df.empty:
        raise RuntimeError("DB export returned zero rows; refusing to write an empty chart-history CSV")

    df["term"] = df["term"].astype(str).str.strip().str.upper()
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.strftime("%Y-%m-%d")
    summary = stats_from_dataframe(df, terms, args.min_rows_per_term)
    guard = depth_guard(summary, args)
    if guard["enabled"] and not guard["passed"]:
        failures = "; ".join(guard["failures"])
        raise RuntimeError(f"DB chart-history depth guard failed: {failures}")

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
        "terms": sorted(df["term"].dropna().unique().tolist()),
        "history_days": None if args.no_history_filter else args.history_days,
        "row_count": len(df),
        "column_count": len(df.columns),
        "history_depth": summary,
        "depth_guard": guard,
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
    parser.add_argument("--min-total-rows", type=int, default=0)
    parser.add_argument("--min-rows-per-term", type=int, default=DEFAULT_MIN_ROWS_PER_TERM)
    parser.add_argument("--min-median-rows-per-term", type=int, default=DEFAULT_MIN_MEDIAN_ROWS_PER_TERM)
    parser.add_argument("--min-date-span-days", type=int, default=DEFAULT_MIN_DATE_SPAN_DAYS)
    parser.add_argument("--skip-depth-guard", action="store_true")
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
