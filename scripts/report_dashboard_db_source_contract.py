from __future__ import annotations

"""Read-only Dashboard DB Source Contract v1 report.

Inspects the canonical enriched dashboard table, its dictionary companion,
the current Fix 26 manifest, and generated asset index files.

Requires TWT_SNT_DB_URL for live DB inspection. Without it, the script still
reports manifest/index coverage and exits with code 2.
"""

import argparse
import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "dashboard_fix26_mode_manifest.json"
DEFAULT_SOURCE_TABLE = "final_combined_data_enriched_tbl"
DEFAULT_DICTIONARY_TABLE = "final_combined_data_enriched_dictionary_tbl"
DEFAULT_DB_ENV = "TWT_SNT_DB_URL"

REQUIRED_DASHBOARD_COLUMNS = [
    "date", "term", "open", "high", "low", "close", "volume",
    "close_ma_7", "close_ma_21", "close_ma_50", "close_ma_100", "close_ma_200",
    "combined_compound", "combined_compound_ma_7", "combined_compound_ma_21",
    "combined_compound_ma_50", "combined_compound_ma_100", "combined_compound_ma_200",
    "rsi", "sentiment_rsi", "stochastic_rsi", "stochastic_rsi_d",
    "sentiment_stochastic_rsi_d", "macd", "macd_signal", "macd_histogram",
    "scaled_sentiment_macd", "scaled_sentiment_macd_signal",
    "sentiment_upper_band", "sentiment_lower_band",
    "boll_upper_overlap_advanced", "boll_lower_overlap_advanced",
    "boll_upper_overlap_band", "boll_lower_overlap_band", "boll_volatility_flag",
    "high_volume_7", "high_volume_20", "attention_level_score",
    "attention_conviction_score_signed", "attention_regime_score",
    "attention_source_breadth_score", "sent_ribbon_regime_raw",
    "sent_ribbon_regime_score", "sent_ribbon_regime_confidence",
    "sent_ribbon_width_z", "sent_ribbon_center_slope_21_z",
    "seta_dashboard_summary_score", "seta_dashboard_summary_label",
]

INDEX_FILES = {
    "public": ROOT / "fix26_chart_store_public_index.json",
    "member": ROOT / "fix26_chart_store_member_index.json",
}


@dataclass
class DbReport:
    db_available: bool
    db_error: str | None
    source_columns: list[str]
    dictionary_columns: list[str]
    dictionary_field_names: list[str]
    asset_rows: list[dict[str, Any]]


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def manifest_assets(manifest: dict[str, Any], mode: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for raw in manifest.get("modes", {}).get(mode, {}).get("assets", []):
        term = str(raw).strip().upper()
        if term and term not in seen:
            seen.add(term)
            out.append(term)
    return out


def read_asset_index(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {"exists": False, "assets": {}, "generated_at_utc": None}
    data = load_json(path)
    assets = data.get("assets", {}) if isinstance(data.get("assets"), dict) else {}
    return {"exists": True, "assets": assets, "generated_at_utc": data.get("generated_at_utc")}


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


def table_exists_sql(schema: str | None, table: str) -> tuple[str, dict[str, Any]]:
    if schema:
        return (
            "select 1 from information_schema.tables where table_schema = :schema and table_name = :table limit 1",
            {"schema": schema, "table": table},
        )
    return (
        "select 1 from information_schema.tables where table_schema not in ('pg_catalog','information_schema') and table_name = :table limit 1",
        {"table": table},
    )


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


def first_present(values: list[str], candidates: list[str]) -> str | None:
    lower_to_real = {v.lower(): v for v in values}
    for candidate in candidates:
        found = lower_to_real.get(candidate.lower())
        if found:
            return found
    return None


def scalar_rows(conn: Any, sql: str, params: dict[str, Any]) -> list[Any]:
    from sqlalchemy import text

    return [row[0] for row in conn.execute(text(sql), params).fetchall()]


def inspect_db(db_url: str | None, source_table: str, dictionary_table: str) -> DbReport:
    if not db_url:
        return DbReport(False, f"{DEFAULT_DB_ENV} is not set", [], [], [], [])

    try:
        from sqlalchemy import create_engine, text
    except Exception as exc:
        return DbReport(False, f"sqlalchemy import failed: {exc}", [], [], [], [])

    try:
        engine = create_engine(db_url)
        source_schema, source_name = parse_table_name(source_table)
        dict_schema, dict_name = parse_table_name(dictionary_table)
        with engine.connect() as conn:
            sql, params = table_exists_sql(source_schema, source_name)
            if conn.execute(text(sql), params).first() is None:
                return DbReport(False, f"source table not found: {source_table}", [], [], [], [])

            sql, params = columns_sql(source_schema, source_name)
            source_columns = [str(x) for x in scalar_rows(conn, sql, params)]

            dictionary_columns: list[str] = []
            dictionary_field_names: list[str] = []
            sql, params = table_exists_sql(dict_schema, dict_name)
            if conn.execute(text(sql), params).first() is not None:
                sql, params = columns_sql(dict_schema, dict_name)
                dictionary_columns = [str(x) for x in scalar_rows(conn, sql, params)]
                field_col = first_present(dictionary_columns, ["column_name", "field_name", "field", "name", "source_column", "db_column"])
                if field_col:
                    sql = f"select distinct \"{field_col}\" from {qualified_table(dictionary_table)} where \"{field_col}\" is not null"
                    dictionary_field_names = [str(x).strip() for x in scalar_rows(conn, sql, {}) if str(x).strip()]

            asset_rows: list[dict[str, Any]] = []
            if "term" in source_columns and "date" in source_columns:
                sql = f"""
                    select upper(trim(term::text)) as term,
                           count(*)::bigint as row_count,
                           min(date)::date as min_date,
                           max(date)::date as max_date
                    from {qualified_table(source_table)}
                    where term is not null and date is not null
                    group by upper(trim(term::text))
                    order by upper(trim(term::text))
                """
                asset_rows = [dict(row._mapping) for row in conn.execute(text(sql)).fetchall()]

        return DbReport(True, None, source_columns, dictionary_columns, dictionary_field_names, asset_rows)
    except Exception as exc:
        return DbReport(False, str(exc), [], [], [], [])


def days_old(value: Any, today: date) -> int | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        d = value.date()
    elif isinstance(value, date):
        d = value
    else:
        for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                d = datetime.strptime(str(value).replace("Z", "+0000"), fmt).date()
                break
            except Exception:
                d = None
        if d is None:
            return None
    return (today - d).days


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    manifest = load_json(Path(args.manifest))
    mode_config = {"public": manifest_assets(manifest, "public"), "member": manifest_assets(manifest, "member")}
    configured_assets = sorted(set(mode_config["public"]) | set(mode_config["member"]))
    index_reports = {mode: read_asset_index(path) for mode, path in INDEX_FILES.items()}

    db = inspect_db(os.environ.get(args.db_env), args.source_table, args.dictionary_table)
    source_columns_lower = {c.lower() for c in db.source_columns}
    required_missing = [c for c in REQUIRED_DASHBOARD_COLUMNS if c.lower() not in source_columns_lower]

    dictionary_fields_lower = {c.lower() for c in db.dictionary_field_names}
    dictionary_missing = [c for c in db.source_columns if c.lower() not in dictionary_fields_lower] if dictionary_fields_lower else []

    today = datetime.now(timezone.utc).date()
    db_assets = {str(r.get("term") or "").upper(): r for r in db.asset_rows if r.get("term")}
    db_asset_terms = sorted(db_assets)

    stale_assets: list[str] = []
    eligible_assets: list[str] = []
    for term, row in db_assets.items():
        age = days_old(row.get("max_date"), today)
        if age is not None and age > args.max_age_days:
            stale_assets.append(term)
        elif age is not None:
            eligible_assets.append(term)

    modes: dict[str, Any] = {}
    for mode, assets in mode_config.items():
        index_assets = sorted(index_reports[mode]["assets"].keys())
        modes[mode] = {
            "configured_assets": assets,
            "configured_count": len(assets),
            "index_exists": index_reports[mode]["exists"],
            "index_generated_at_utc": index_reports[mode]["generated_at_utc"],
            "index_assets": index_assets,
            "index_asset_count": len(index_assets),
            "configured_missing_from_index": [t for t in assets if t not in index_assets],
            "index_extra_not_configured": [t for t in index_assets if t not in assets],
            "configured_missing_from_db": [t for t in assets if t not in db_asset_terms] if db.db_available else [],
            "configured_stale_in_db": [t for t in assets if t in stale_assets] if db.db_available else [],
        }

    return {
        "contract": "dashboard_db_source_contract_v1",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source_table": args.source_table,
        "dictionary_table": args.dictionary_table,
        "db_available": db.db_available,
        "db_error": db.db_error,
        "source_column_count": len(db.source_columns),
        "dictionary_column_count": len(db.dictionary_columns),
        "dictionary_field_count": len(db.dictionary_field_names),
        "required_missing_from_source": required_missing,
        "dictionary_missing_for_source_count": len(dictionary_missing),
        "dictionary_missing_for_source_sample": dictionary_missing[:50],
        "pipeline_asset_count": len(db_asset_terms),
        "pipeline_assets": db_asset_terms,
        "eligible_asset_count": len(eligible_assets),
        "eligible_assets": eligible_assets,
        "stale_assets": stale_assets,
        "configured_asset_count": len(configured_assets),
        "configured_assets": configured_assets,
        "configured_missing_from_db": [t for t in configured_assets if t not in db_asset_terms] if db.db_available else [],
        "unconfigured_available_assets": [t for t in db_asset_terms if t not in configured_assets],
        "modes": modes,
    }


def print_text_report(report: dict[str, Any]) -> None:
    print("Dashboard DB Source Contract v1")
    print("=" * 80)
    for key in [
        "source_table", "dictionary_table", "db_available", "db_error",
        "source_column_count", "dictionary_field_count",
        "pipeline_asset_count", "eligible_asset_count", "configured_asset_count",
    ]:
        print(f"{key}: {report.get(key)}")
    print(f"required_missing_from_source: {report['required_missing_from_source']}")
    print(f"configured_missing_from_db: {report['configured_missing_from_db']}")
    print(f"unconfigured_available_assets: {report['unconfigured_available_assets']}")
    print(f"stale_assets: {report['stale_assets']}")
    print()
    for mode, data in report["modes"].items():
        print(f"[{mode}]")
        for key in [
            "configured_count", "index_exists", "index_generated_at_utc", "index_asset_count",
            "configured_missing_from_index", "configured_missing_from_db", "configured_stale_in_db",
        ]:
            print(f"  {key}: {data.get(key)}")
        print()


def main() -> int:
    parser = argparse.ArgumentParser(description="Report DB-backed dashboard source contract coverage.")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--dictionary-table", default=DEFAULT_DICTIONARY_TABLE)
    parser.add_argument("--db-env", default=DEFAULT_DB_ENV)
    parser.add_argument("--max-age-days", type=int, default=5)
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON report.")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print_text_report(report)
    return 0 if report["db_available"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
