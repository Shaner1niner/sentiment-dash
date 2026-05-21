from __future__ import annotations

"""Static smoke test for the adaptive asset universe promotion report.

This test intentionally avoids requiring a live DB connection. It checks that
scripts/report_asset_universe_promotion.py remains a read-only reporting tool
and preserves adaptive promotion policy semantics.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "report_asset_universe_promotion.py"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


def main() -> int:
    if not SCRIPT.exists():
        fail("missing scripts/report_asset_universe_promotion.py")
    text = SCRIPT.read_text(encoding="utf-8")

    required_tokens = [
        "Read-only adaptive asset-universe promotion report",
        "DEFAULT_TARGET_MEMBER_COUNT = \"auto\"",
        "DEFAULT_SOURCE_TABLE = \"final_combined_data_enriched_tbl\"",
        "DEFAULT_MIN_ROWS_PER_TERM = 150",
        "DEFAULT_MIN_DATE_SPAN_DAYS = 330",
        "DEFAULT_WARM_MIN_ROWS_PER_TERM = 45",
        "DEFAULT_WARM_MIN_DATE_SPAN_DAYS = 45",
        "DEFAULT_MAX_PROMOTION_GROWTH_FRACTION = 0.50",
        "target_member_count_mode",
        "effective_target_member_count",
        "max_promotion_additions_this_run",
        "recommended_add_count",
        "eligible_unconfigured_assets",
        "warming_unconfigured_assets",
        "blocked_unconfigured_assets",
        "pinned_terms_report",
        "--target-member-count",
        "--max-promotion-growth-fraction",
        "--pin-terms",
        "--json",
    ]
    for token in required_tokens:
        if token not in text:
            fail(f"missing expected token: {token}")
    ok("asset promotion report uses adaptive target policy and candidate tiers")

    fixed_target_tokens = [
        "DEFAULT_TARGET_MEMBER_COUNT = 40",
        "configured member assets: 28",
        "target member assets: 40",
        "candidate_count: 12",
    ]
    for token in fixed_target_tokens:
        if token in text:
            fail(f"fixed target wording should not be part of the default contract: {token}")
    ok("asset promotion report no longer hard-codes 28 -> 40 as the default contract")

    allowed_structure_tokens = [
        "select upper(trim(term::text)) as term",
        "create_engine(db_url)",
        "conn.execute(text(sql), params).fetchall()",
        "load_json(Path(args.manifest))",
    ]
    for token in allowed_structure_tokens:
        if token not in text:
            fail(f"missing read-only structure token: {token}")
    ok("asset promotion report uses read-only query/report structure")

    blocked_api_tokens = [".write_text(", "open(\"w", "json.dump(", "to_sql(", "execute(text(sql))"]
    for token in blocked_api_tokens:
        if token in text:
            fail(f"unexpected write-like API token found: {token}")
    ok("asset promotion report does not contain known file/DB write API calls")

    print("[OK] adaptive asset universe promotion report smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
