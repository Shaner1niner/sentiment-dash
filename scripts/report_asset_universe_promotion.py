from __future__ import annotations

"""Read-only asset-universe promotion report for the Fix 26 dashboard.

The report inspects the current dashboard manifest and the canonical enriched
DB table, then ranks unconfigured DB assets for possible member-dashboard
promotion. It does not mutate the manifest, generated payloads, or database.

Default use case:
  configured member assets: 28
  target member assets: 40
  candidate_count: 12

Requires TWT_SNT_DB_URL for live DB inspection.
"""

import argparse
import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import median
from typing import Any

from sqlalchemy import create_engine, text

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB_ENV = "TWT_SNT_DB_URL"
DEFAULT_SOURCE_TABLE = "final_combined_data_enriched_tbl"
DEFAULT_MANIFEST = ROOT / "dashboard_fix26_mode_manifest.json"
DEFAULT_TARGET_MEMBER_COUNT = 40
DEFAULT_HISTORY_DAYS = 365
DEFAULT_MIN_ROWS_PER_TERM = 150
DEFAULT_MIN_DATE_SPAN_DAYS = 330


@dataclass(frozen=True)
class AssetStats:
    term: str
    row_count: int
    min_date: str | None
    max_date: str | None
    date_span_days: int | None
    latest_age_days: int | None
    configured_public: bool
    configured_member: bool
    eligible: bool
    score: float


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


def parse_terms(raw: str | None) -> list[str]:
    if not raw:
        return []
    seen: set[str] = set()
    out: list[str] = []
    for piece in raw.split(","):
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


def fetch_asset_rows(db_url: str, source_table: str, history_days: int | None) -> list[dict[str, Any]]:
    engine = create_engine(db_url)
    where = ["term is not null", "date is not null"]
    params: dict[str, Any] = {}
    if history_days is not None:
        where.append("date >= current_date - (:history_days * interval '1 day')")
        params["history_days"] = int(history_days)

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
    with engine.connect() as conn:
        return [dict(row._mapping) for row in conn.execute(text(sql), params).fetchall()]


def build_asset_stats(
    rows: list[dict[str, Any]],
    public_assets: list[str],
    member_assets: list[str],
    *,
    min_rows_per_term: int,
    min_date_span_days: int,
    max_age_days: int,
) -> list[AssetStats]:
    today = datetime.now(timezone.utc).date()
    public_set = set(public_assets)
    member_set = set(member_assets)
    stats: list[AssetStats] = []

    for row in rows:
        term = str(row.get("term") or "").strip().upper()
        if not term:
            continue
        row_count = int(row.get("row_count") or 0)
        min_d = date_value(row.get("min_date"))
        max_d = date_value(row.get("max_date"))
        span = (max_d - min_d).days if min_d and max_d else None
        age = (today - max_d).days if max_d else None
        fresh = age is not None and age <= max_age_days
        deep = row_count >= min_rows_per_term
        wide = span is not None and span >= min_date_span_days
        eligible = fresh and deep and wide

        # Coverage-only ranking. This intentionally avoids signal quality or
        # subjective desirability so promotion remains an ops/data decision.
        score = 0.0
        score += min(row_count, 366) / 366 * 70
        score += (min(span or 0, 365) / 365) * 25
        if age is not None:
            score += max(0, 5 - min(age, 5))

        stats.append(
            AssetStats(
                term=term,
                row_count=row_count,
                min_date=iso_date(row.get("min_date")),
                max_date=iso_date(row.get("max_date")),
                date_span_days=span,
                latest_age_days=age,
                configured_public=term in public_set,
                configured_member=term in member_set,
                eligible=eligible,
                score=round(score, 4),
            )
        )
    return sorted(stats, key=lambda item: (-item.score, item.term))


def as_dict(item: AssetStats) -> dict[str, Any]:
    return {
        "term": item.term,
        "score": item.score,
        "row_count": item.row_count,
        "min_date": item.min_date,
        "max_date": item.max_date,
        "date_span_days": item.date_span_days,
        "latest_age_days": item.latest_age_days,
        "configured_public": item.configured_public,
        "configured_member": item.configured_member,
        "eligible": item.eligible,
    }


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    manifest = load_json(Path(args.manifest))
    public_assets = manifest_assets(manifest, "public")
    member_assets = manifest_assets(manifest, "member")
    configured_union = sorted(set(public_assets) | set(member_assets))
    pinned_terms = parse_terms(args.pin_terms)

    db_url = os.environ.get(args.db_env)
    if not db_url:
        return {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "db_available": False,
            "db_error": f"{args.db_env} is not set",
            "source_table": args.source_table,
            "target_member_count": args.target_member_count,
            "current_member_count": len(member_assets),
            "promotion_needed_count": max(0, args.target_member_count - len(member_assets)),
            "configured_member_assets": member_assets,
            "candidate_count": 0,
            "recommended_candidates": [],
        }

    rows = fetch_asset_rows(db_url, args.source_table, None if args.no_history_filter else args.history_days)
    stats = build_asset_stats(
        rows,
        public_assets,
        member_assets,
        min_rows_per_term=args.min_rows_per_term,
        min_date_span_days=args.min_date_span_days,
        max_age_days=args.max_age_days,
    )
    eligible_unconfigured = [item for item in stats if item.eligible and not item.configured_member]
    by_term = {item.term: item for item in eligible_unconfigured}

    promotion_needed = max(0, args.target_member_count - len(member_assets))
    pinned = [by_term[term] for term in pinned_terms if term in by_term]
    pinned_set = {item.term for item in pinned}
    ranked = pinned + [item for item in eligible_unconfigured if item.term not in pinned_set]
    recommended = ranked[:promotion_needed]

    row_counts = [item.row_count for item in stats]
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "db_available": True,
        "db_error": None,
        "source_table": args.source_table,
        "history_days": None if args.no_history_filter else args.history_days,
        "thresholds": {
            "min_rows_per_term": args.min_rows_per_term,
            "min_date_span_days": args.min_date_span_days,
            "max_age_days": args.max_age_days,
        },
        "target_member_count": args.target_member_count,
        "current_member_count": len(member_assets),
        "current_public_count": len(public_assets),
        "configured_union_count": len(configured_union),
        "db_asset_count": len(stats),
        "eligible_unconfigured_count": len(eligible_unconfigured),
        "promotion_needed_count": promotion_needed,
        "recommended_candidate_count": len(recommended),
        "configured_public_assets": public_assets,
        "configured_member_assets": member_assets,
        "configured_union_assets": configured_union,
        "recommended_candidates": [as_dict(item) for item in recommended],
        "eligible_unconfigured_assets": [as_dict(item) for item in eligible_unconfigured],
        "all_assets_summary": {
            "row_count_min": min(row_counts) if row_counts else 0,
            "row_count_median": float(median(row_counts)) if row_counts else 0.0,
            "row_count_max": max(row_counts) if row_counts else 0,
        },
    }


def print_text_report(report: dict[str, Any]) -> None:
    print("Asset Universe Promotion Report v1")
    print("=" * 80)
    for key in [
        "db_available", "db_error", "source_table", "history_days",
        "current_member_count", "target_member_count", "promotion_needed_count",
        "db_asset_count", "eligible_unconfigured_count", "recommended_candidate_count",
    ]:
        print(f"{key}: {report.get(key)}")
    print()
    print("Recommended candidates:")
    for item in report.get("recommended_candidates", []):
        print(
            f"  {item['term']:>8}  score={item['score']:>7}  rows={item['row_count']:>4}  "
            f"span={item['date_span_days']}  max_date={item['max_date']}  age={item['latest_age_days']}"
        )


def main() -> int:
    parser = argparse.ArgumentParser(description="Rank DB assets for controlled member-dashboard promotion.")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--db-env", default=DEFAULT_DB_ENV)
    parser.add_argument("--target-member-count", type=int, default=DEFAULT_TARGET_MEMBER_COUNT)
    parser.add_argument("--history-days", type=int, default=DEFAULT_HISTORY_DAYS)
    parser.add_argument("--no-history-filter", action="store_true")
    parser.add_argument("--min-rows-per-term", type=int, default=DEFAULT_MIN_ROWS_PER_TERM)
    parser.add_argument("--min-date-span-days", type=int, default=DEFAULT_MIN_DATE_SPAN_DAYS)
    parser.add_argument("--max-age-days", type=int, default=5)
    parser.add_argument("--pin-terms", help="Comma-separated terms to prefer first if eligible.")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print_text_report(report)
    return 0 if report.get("db_available") else 2


if __name__ == "__main__":
    raise SystemExit(main())
