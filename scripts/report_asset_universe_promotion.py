from __future__ import annotations

"""Read-only adaptive asset-universe promotion report for the Fix 26 dashboard.

The report inspects the current dashboard manifest and the canonical enriched
DB table, then ranks unconfigured DB assets for possible member-dashboard
promotion. It does not mutate the manifest, generated payloads, or database.

Default behavior is adaptive and compact:
  - derive the current member/public counts from the manifest
  - derive the effective promotion target from eligible DB coverage
  - cap any one promotion batch by a growth fraction of the current member set
  - show eligible, warming, blocked, configured, and pinned-term diagnostics
  - estimate readiness timing for warming assets if coverage keeps accruing
  - limit default text/JSON samples so routine PowerShell output stays readable

A fixed target can still be modeled with --target-member-count 40, and full JSON
can still be emitted with --full-json.
"""

import argparse
import json
import math
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
DEFAULT_TARGET_MEMBER_COUNT = "auto"
DEFAULT_HISTORY_DAYS = 365
DEFAULT_MIN_ROWS_PER_TERM = 150
DEFAULT_MIN_DATE_SPAN_DAYS = 330
DEFAULT_WARM_MIN_ROWS_PER_TERM = 45
DEFAULT_WARM_MIN_DATE_SPAN_DAYS = 45
DEFAULT_MAX_PROMOTION_GROWTH_FRACTION = 0.50
DEFAULT_OUTPUT_LIMIT = 10


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
    warming: bool
    status: str
    block_reasons: tuple[str, ...]
    rows_to_strict_threshold: int | None
    days_to_strict_span_threshold: int | None
    estimated_days_to_row_threshold: int | None
    estimated_days_to_span_threshold: int | None
    estimated_days_to_eligible: int | None
    promotion_blocker: str | None
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


def status_for_asset(
    *,
    configured_member: bool,
    fresh: bool,
    strict_deep: bool,
    strict_wide: bool,
    warm_deep: bool,
    warm_wide: bool,
) -> tuple[str, bool, bool, tuple[str, ...]]:
    if configured_member:
        return "already_configured", False, False, ()

    reasons: list[str] = []
    if not fresh:
        reasons.append("stale_or_missing_latest_date")
    if not strict_deep:
        reasons.append("below_strict_row_threshold")
    if not strict_wide:
        reasons.append("below_strict_date_span_threshold")

    eligible = fresh and strict_deep and strict_wide
    if eligible:
        return "eligible_now", True, False, ()

    warming = fresh and warm_deep and warm_wide
    if warming:
        return "warming", False, True, tuple(reasons)

    if not warm_deep:
        reasons.append("below_warm_row_threshold")
    if not warm_wide:
        reasons.append("below_warm_date_span_threshold")
    return "blocked", False, False, tuple(dict.fromkeys(reasons))


def readiness_forecast(
    *,
    row_count: int,
    span: int | None,
    age: int | None,
    max_age_days: int,
    min_rows_per_term: int,
    min_date_span_days: int,
    configured_member: bool,
) -> tuple[int | None, int | None, int | None, int | None, int | None, str | None]:
    if configured_member:
        return None, None, None, None, None, None

    rows_gap = max(0, min_rows_per_term - row_count)
    span_gap = None if span is None else max(0, min_date_span_days - span)
    days_to_rows = rows_gap
    days_to_span = span_gap

    if age is None or age > max_age_days:
        freshness_days = None
    else:
        freshness_days = 0

    components = [days_to_rows]
    if days_to_span is not None:
        components.append(days_to_span)
    if freshness_days is not None:
        components.append(freshness_days)

    if freshness_days is None or span_gap is None:
        days_to_eligible = None
    else:
        days_to_eligible = max(components)

    blockers: list[tuple[str, int]] = []
    if rows_gap > 0:
        blockers.append(("row_threshold", rows_gap))
    if span_gap is None:
        return rows_gap, span_gap, days_to_rows, days_to_span, days_to_eligible, "missing_date_span"
    if span_gap > 0:
        blockers.append(("date_span_threshold", span_gap))
    if freshness_days is None:
        return rows_gap, span_gap, days_to_rows, days_to_span, days_to_eligible, "freshness_threshold"
    if not blockers:
        return rows_gap, span_gap, days_to_rows, days_to_span, days_to_eligible, None
    blockers.sort(key=lambda item: (-item[1], item[0]))
    return rows_gap, span_gap, days_to_rows, days_to_span, days_to_eligible, blockers[0][0]


def build_asset_stats(
    rows: list[dict[str, Any]],
    public_assets: list[str],
    member_assets: list[str],
    *,
    min_rows_per_term: int,
    min_date_span_days: int,
    warm_min_rows_per_term: int,
    warm_min_date_span_days: int,
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
        configured_public = term in public_set
        configured_member = term in member_set
        fresh = age is not None and age <= max_age_days
        strict_deep = row_count >= min_rows_per_term
        strict_wide = span is not None and span >= min_date_span_days
        warm_deep = row_count >= warm_min_rows_per_term
        warm_wide = span is not None and span >= warm_min_date_span_days
        status, eligible, warming, block_reasons = status_for_asset(
            configured_member=configured_member,
            fresh=fresh,
            strict_deep=strict_deep,
            strict_wide=strict_wide,
            warm_deep=warm_deep,
            warm_wide=warm_wide,
        )
        (
            rows_to_strict,
            days_to_strict_span,
            days_to_rows,
            days_to_span,
            days_to_eligible,
            promotion_blocker,
        ) = readiness_forecast(
            row_count=row_count,
            span=span,
            age=age,
            max_age_days=max_age_days,
            min_rows_per_term=min_rows_per_term,
            min_date_span_days=min_date_span_days,
            configured_member=configured_member,
        )

        score = 0.0
        score += min(row_count, 366) / 366 * 70
        score += (min(span or 0, 365) / 365) * 25
        if age is not None:
            score += max(0, 5 - min(age, 5))
        if warming:
            score += 1.0

        stats.append(
            AssetStats(
                term=term,
                row_count=row_count,
                min_date=iso_date(row.get("min_date")),
                max_date=iso_date(row.get("max_date")),
                date_span_days=span,
                latest_age_days=age,
                configured_public=configured_public,
                configured_member=configured_member,
                eligible=eligible,
                warming=warming,
                status=status,
                block_reasons=block_reasons,
                rows_to_strict_threshold=rows_to_strict,
                days_to_strict_span_threshold=days_to_strict_span,
                estimated_days_to_row_threshold=days_to_rows,
                estimated_days_to_span_threshold=days_to_span,
                estimated_days_to_eligible=days_to_eligible,
                promotion_blocker=promotion_blocker,
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
        "warming": item.warming,
        "status": item.status,
        "block_reasons": list(item.block_reasons),
        "rows_to_strict_threshold": item.rows_to_strict_threshold,
        "days_to_strict_span_threshold": item.days_to_strict_span_threshold,
        "estimated_days_to_row_threshold": item.estimated_days_to_row_threshold,
        "estimated_days_to_span_threshold": item.estimated_days_to_span_threshold,
        "estimated_days_to_eligible": item.estimated_days_to_eligible,
        "promotion_blocker": item.promotion_blocker,
    }


def target_member_count_value(raw: str, current_member_count: int, eligible_count: int, max_additions: int) -> tuple[str, int]:
    if str(raw).strip().lower() == "auto":
        additions = min(eligible_count, max_additions)
        return "auto", current_member_count + additions
    value = int(raw)
    if value < 0:
        raise ValueError("--target-member-count must be 'auto' or a non-negative integer")
    return str(value), value


def pinned_term_report(pinned_terms: list[str], stats: list[AssetStats]) -> list[dict[str, Any]]:
    by_term = {item.term: item for item in stats}
    out: list[dict[str, Any]] = []
    for term in pinned_terms:
        item = by_term.get(term)
        if item is None:
            out.append({"term": term, "status": "not_in_db", "block_reasons": ["not_present_in_source_table"]})
        else:
            out.append(as_dict(item))
    return out


def readiness_summary(warming_assets: list[AssetStats], *, limit: int | None = None) -> dict[str, Any]:
    if not warming_assets:
        return {
            "next_estimated_days_to_eligible": None,
            "next_assets": [],
            "dominant_promotion_blockers": {},
        }
    ranked = sorted(
        warming_assets,
        key=lambda item: (
            item.estimated_days_to_eligible if item.estimated_days_to_eligible is not None else 10**9,
            -item.score,
            item.term,
        ),
    )
    blockers: dict[str, int] = {}
    for item in warming_assets:
        blocker = item.promotion_blocker or "none"
        blockers[blocker] = blockers.get(blocker, 0) + 1
    next_days = ranked[0].estimated_days_to_eligible
    next_assets = [as_dict(item) for item in ranked if item.estimated_days_to_eligible == next_days]
    if limit is not None:
        next_assets = next_assets[:max(0, limit)]
    return {
        "next_estimated_days_to_eligible": next_days,
        "next_assets": next_assets,
        "dominant_promotion_blockers": dict(sorted(blockers.items(), key=lambda pair: (-pair[1], pair[0]))),
    }


def build_report(args: argparse.Namespace) -> dict[str, Any]:
    manifest = load_json(Path(args.manifest))
    public_assets = manifest_assets(manifest, "public")
    member_assets = manifest_assets(manifest, "member")
    configured_union = sorted(set(public_assets) | set(member_assets))
    pinned_terms = parse_terms(args.pin_terms)

    base_report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source_table": args.source_table,
        "target_member_count_requested": str(args.target_member_count),
        "current_member_count": len(member_assets),
        "current_public_count": len(public_assets),
        "configured_union_count": len(configured_union),
        "configured_public_assets": public_assets,
        "configured_member_assets": member_assets,
        "configured_union_assets": configured_union,
    }

    db_url = os.environ.get(args.db_env)
    if not db_url:
        return {
            **base_report,
            "db_available": False,
            "db_error": f"{args.db_env} is not set",
            "effective_target_member_count": len(member_assets),
            "recommended_add_count": 0,
            "recommended_candidate_count": 0,
            "recommended_candidates": [],
            "readiness_summary": readiness_summary([]),
            "pinned_terms_report": [],
        }

    rows = fetch_asset_rows(db_url, args.source_table, None if args.no_history_filter else args.history_days)
    stats = build_asset_stats(
        rows,
        public_assets,
        member_assets,
        min_rows_per_term=args.min_rows_per_term,
        min_date_span_days=args.min_date_span_days,
        warm_min_rows_per_term=args.warm_min_rows_per_term,
        warm_min_date_span_days=args.warm_min_date_span_days,
        max_age_days=args.max_age_days,
    )
    eligible_unconfigured = [item for item in stats if item.status == "eligible_now"]
    warming_unconfigured = [item for item in stats if item.status == "warming"]
    blocked_unconfigured = [item for item in stats if item.status == "blocked"]
    configured_assets = [item for item in stats if item.status == "already_configured"]

    max_additions = max(0, math.ceil(len(member_assets) * args.max_promotion_growth_fraction))
    target_mode, effective_target = target_member_count_value(
        str(args.target_member_count),
        len(member_assets),
        len(eligible_unconfigured),
        max_additions,
    )
    recommended_add_count = max(0, min(effective_target - len(member_assets), len(eligible_unconfigured), max_additions))

    by_term = {item.term: item for item in eligible_unconfigured}
    pinned_eligible = [by_term[term] for term in pinned_terms if term in by_term]
    pinned_set = {item.term for item in pinned_eligible}
    ranked = pinned_eligible + [item for item in eligible_unconfigured if item.term not in pinned_set]
    recommended = ranked[:recommended_add_count]

    row_counts = [item.row_count for item in stats]
    return {
        **base_report,
        "db_available": True,
        "db_error": None,
        "history_days": None if args.no_history_filter else args.history_days,
        "thresholds": {
            "min_rows_per_term": args.min_rows_per_term,
            "min_date_span_days": args.min_date_span_days,
            "warm_min_rows_per_term": args.warm_min_rows_per_term,
            "warm_min_date_span_days": args.warm_min_date_span_days,
            "max_age_days": args.max_age_days,
            "max_promotion_growth_fraction": args.max_promotion_growth_fraction,
        },
        "forecast_assumptions": {
            "row_accumulation_rate": "one row per asset per day",
            "date_span_accumulation_rate": "one calendar day per day while source remains fresh",
        },
        "target_member_count_mode": target_mode,
        "effective_target_member_count": effective_target,
        "max_promotion_additions_this_run": max_additions,
        "recommended_add_count": recommended_add_count,
        "db_asset_count": len(stats),
        "eligible_unconfigured_count": len(eligible_unconfigured),
        "warming_unconfigured_count": len(warming_unconfigured),
        "blocked_unconfigured_count": len(blocked_unconfigured),
        "already_configured_count": len(configured_assets),
        "recommended_candidate_count": len(recommended),
        "recommended_candidates": [as_dict(item) for item in recommended],
        "warming_unconfigured_assets": [as_dict(item) for item in warming_unconfigured],
        "blocked_unconfigured_assets": [as_dict(item) for item in blocked_unconfigured],
        "eligible_unconfigured_assets": [as_dict(item) for item in eligible_unconfigured],
        "readiness_summary": readiness_summary(warming_unconfigured),
        "pinned_terms_report": pinned_term_report(pinned_terms, stats),
        "all_assets_summary": {
            "row_count_min": min(row_counts) if row_counts else 0,
            "row_count_median": float(median(row_counts)) if row_counts else 0.0,
            "row_count_max": max(row_counts) if row_counts else 0,
        },
    }


def compact_report(report: dict[str, Any], *, limit: int) -> dict[str, Any]:
    sample_limit = max(0, int(limit))
    summary_keys = [
        "generated_at_utc", "source_table", "db_available", "db_error", "history_days",
        "current_member_count", "current_public_count", "configured_union_count",
        "target_member_count_requested", "target_member_count_mode", "effective_target_member_count",
        "max_promotion_additions_this_run", "recommended_add_count", "db_asset_count",
        "eligible_unconfigured_count", "warming_unconfigured_count", "blocked_unconfigured_count",
        "already_configured_count", "recommended_candidate_count", "thresholds",
        "forecast_assumptions", "all_assets_summary",
    ]
    out = {key: report.get(key) for key in summary_keys if key in report}
    readiness = dict(report.get("readiness_summary") or {})
    if isinstance(readiness.get("next_assets"), list):
        readiness["next_assets"] = readiness["next_assets"][:sample_limit]
    out["readiness_summary"] = readiness
    out["recommended_candidates"] = (report.get("recommended_candidates") or [])[:sample_limit]
    out["eligible_unconfigured_assets_sample"] = (report.get("eligible_unconfigured_assets") or [])[:sample_limit]
    out["warming_unconfigured_assets_sample"] = (report.get("warming_unconfigured_assets") or [])[:sample_limit]
    out["blocked_unconfigured_assets_sample"] = (report.get("blocked_unconfigured_assets") or [])[:sample_limit]
    out["pinned_terms_report"] = report.get("pinned_terms_report") or []
    out["output_policy"] = {
        "compact_json": True,
        "sample_limit": sample_limit,
        "full_json_flag": "--full-json",
    }
    return out


def print_asset_lines(items: list[dict[str, Any]], *, limit: int) -> None:
    for item in items[:limit]:
        reasons = ",".join(item.get("block_reasons") or [])
        reason_text = f"  reasons={reasons}" if reasons else ""
        blocker_text = f"  blocker={item.get('promotion_blocker')}" if item.get("promotion_blocker") else ""
        eta_text = f"  eta={item.get('estimated_days_to_eligible')}d" if item.get("estimated_days_to_eligible") is not None else ""
        print(
            f"  {item['term']:>8}  status={item.get('status', ''):<18} score={item.get('score', 0):>7}  "
            f"rows={item.get('row_count', ''):>4}  span={item.get('date_span_days')}  "
            f"max_date={item.get('max_date')}  age={item.get('latest_age_days')}"
            f"{eta_text}{blocker_text}{reason_text}"
        )


def print_text_report(report: dict[str, Any], *, limit: int) -> None:
    print("Adaptive Asset Universe Promotion Report v2")
    print("=" * 80)
    for key in [
        "db_available", "db_error", "source_table", "history_days",
        "current_member_count", "target_member_count_requested", "target_member_count_mode",
        "effective_target_member_count", "max_promotion_additions_this_run",
        "recommended_add_count", "db_asset_count", "eligible_unconfigured_count",
        "warming_unconfigured_count", "blocked_unconfigured_count", "recommended_candidate_count",
    ]:
        print(f"{key}: {report.get(key)}")
    readiness = report.get("readiness_summary") or {}
    print(f"next_estimated_days_to_eligible: {readiness.get('next_estimated_days_to_eligible')}")
    print(f"dominant_promotion_blockers: {readiness.get('dominant_promotion_blockers')}")
    print(f"output_limit: {limit} rows per section; use --limit N or --json --full-json for more")
    print()
    print("Recommended candidates:")
    print_asset_lines(report.get("recommended_candidates", []), limit=limit)
    print()
    print("Warming candidates:")
    print_asset_lines(report.get("warming_unconfigured_assets", []), limit=limit)
    pinned = report.get("pinned_terms_report") or []
    if pinned:
        print()
        print("Pinned terms report:")
        print_asset_lines(pinned, limit=max(limit, len(pinned)))


def main() -> int:
    parser = argparse.ArgumentParser(description="Rank DB assets for adaptive member-dashboard promotion.")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--source-table", default=DEFAULT_SOURCE_TABLE)
    parser.add_argument("--db-env", default=DEFAULT_DB_ENV)
    parser.add_argument("--target-member-count", default=DEFAULT_TARGET_MEMBER_COUNT, help="Use 'auto' or an integer what-if target.")
    parser.add_argument("--max-promotion-growth-fraction", type=float, default=DEFAULT_MAX_PROMOTION_GROWTH_FRACTION)
    parser.add_argument("--history-days", type=int, default=DEFAULT_HISTORY_DAYS)
    parser.add_argument("--no-history-filter", action="store_true")
    parser.add_argument("--min-rows-per-term", type=int, default=DEFAULT_MIN_ROWS_PER_TERM)
    parser.add_argument("--min-date-span-days", type=int, default=DEFAULT_MIN_DATE_SPAN_DAYS)
    parser.add_argument("--warm-min-rows-per-term", type=int, default=DEFAULT_WARM_MIN_ROWS_PER_TERM)
    parser.add_argument("--warm-min-date-span-days", type=int, default=DEFAULT_WARM_MIN_DATE_SPAN_DAYS)
    parser.add_argument("--max-age-days", type=int, default=5)
    parser.add_argument("--pin-terms", help="Comma-separated terms to prefer first if eligible and diagnose otherwise.")
    parser.add_argument("--limit", type=int, default=DEFAULT_OUTPUT_LIMIT, help="Rows to show per output section. Default: 10")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--full-json", action="store_true", help="With --json, emit full arrays instead of compact samples.")
    args = parser.parse_args()

    report = build_report(args)
    if args.json:
        payload = report if args.full_json else compact_report(report, limit=args.limit)
        print(json.dumps(payload, indent=2, default=str))
    else:
        print_text_report(report, limit=args.limit)
    return 0 if report.get("db_available") else 2


if __name__ == "__main__":
    raise SystemExit(main())
