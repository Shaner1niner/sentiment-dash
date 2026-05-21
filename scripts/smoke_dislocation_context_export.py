"""Smoke-test the SETA dislocation dashboard export for sentiment-dash.

This script validates the prediction-engine export contract from the dashboard
side without recomputing research rules. It is intentionally read-only and uses
only the Python standard library so it can run in the dashboard repo without
extra dependencies.

Example:
    python scripts/smoke_dislocation_context_export.py \
      --export C:\\SETA_engine\\SETA_Prediction_Intelligence_Engine\\artifacts\\dislocation_strategy\\dislocation_dashboard_export.csv
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

REQUIRED_COLUMNS = [
    "rule_id",
    "strategy",
    "asset_class_scope",
    "rule_role",
    "registry_status",
    "validation_start_date",
    "target_horizon",
    "benchmark_rule_id",
    "dashboard_tier",
    "dashboard_label",
    "dashboard_status",
    "is_locked_rule",
    "is_lead_rule",
    "is_baseline_rule",
    "is_attention_rule",
    "forward_row_count",
    "forward_unique_terms",
    "forward_unique_dates",
    "forward_3d_available_count",
    "forward_3d_pending_count",
    "forward_3d_availability_rate",
    "maturity_score",
    "maturity_level",
    "risk_guard_language",
    "public_copy_short",
    "public_copy_detail",
]

VALID_DASHBOARD_STATUSES = {
    "locked_no_forward_events_yet",
    "forward_outcomes_pending",
    "forward_outcomes_available",
    "locked_monitoring",
    "retired",
}

VALID_DASHBOARD_TIERS = {
    "lead_research_challenger",
    "mandatory_baseline",
    "attention_research",
    "monitoring",
    "secondary_comparator",
    "research_context",
}

FORBIDDEN_PUBLIC_COPY_TERMS = [
    " buy ",
    " sell ",
    " guaranteed ",
    " trade signal ",
    " price target ",
    " bottom is in ",
]

NUMERIC_NON_NEGATIVE_COLUMNS = [
    "forward_row_count",
    "forward_unique_terms",
    "forward_unique_dates",
    "forward_3d_available_count",
    "forward_3d_pending_count",
]


def _truthy(value: str | None) -> bool | None:
    if value is None:
        return None
    text = str(value).strip().lower()
    if text in {"true", "1", "yes", "y"}:
        return True
    if text in {"false", "0", "no", "n"}:
        return False
    return None


def _to_int(value: str | None) -> int | None:
    try:
        return int(float(str(value).strip()))
    except (TypeError, ValueError):
        return None


def _is_blank(value: str | None) -> bool:
    return value is None or str(value).strip() == ""


def _add_error(errors: list[dict[str, Any]], row_number: int | None, rule_id: str | None, field: str, message: str) -> None:
    errors.append(
        {
            "row_number": row_number,
            "rule_id": rule_id,
            "field": field,
            "message": message,
        }
    )


def load_rows(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
        fieldnames = list(reader.fieldnames or [])
    return rows, fieldnames


def validate_rows(rows: list[dict[str, str]], fieldnames: list[str]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    errors: list[dict[str, Any]] = []
    missing_columns = [column for column in REQUIRED_COLUMNS if column not in fieldnames]
    for column in missing_columns:
        _add_error(errors, None, None, column, "missing required dislocation export column")

    if missing_columns:
        return errors, {
            "valid": False,
            "row_count": len(rows),
            "error_count": len(errors),
            "lead_rule_count": 0,
            "baseline_rule_count": 0,
        }

    seen_rule_ids: set[str] = set()
    lead_rule_count = 0
    baseline_rule_count = 0
    status_counts: dict[str, int] = {}
    tier_counts: dict[str, int] = {}

    for index, row in enumerate(rows, start=2):
        rule_id = (row.get("rule_id") or "").strip()
        if not rule_id:
            _add_error(errors, index, None, "rule_id", "rule_id is required")
        elif rule_id in seen_rule_ids:
            _add_error(errors, index, rule_id, "rule_id", "duplicate rule_id")
        seen_rule_ids.add(rule_id)

        for field in [
            "strategy",
            "asset_class_scope",
            "dashboard_tier",
            "dashboard_label",
            "dashboard_status",
            "risk_guard_language",
            "public_copy_short",
        ]:
            if _is_blank(row.get(field)):
                _add_error(errors, index, rule_id, field, f"{field} is required")

        status = (row.get("dashboard_status") or "").strip()
        tier = (row.get("dashboard_tier") or "").strip()
        status_counts[status] = status_counts.get(status, 0) + 1
        tier_counts[tier] = tier_counts.get(tier, 0) + 1

        if status and status not in VALID_DASHBOARD_STATUSES:
            _add_error(errors, index, rule_id, "dashboard_status", f"invalid dashboard_status: {status}")
        if tier and tier not in VALID_DASHBOARD_TIERS:
            _add_error(errors, index, rule_id, "dashboard_tier", f"invalid dashboard_tier: {tier}")

        for field in ["is_locked_rule", "is_lead_rule", "is_baseline_rule", "is_attention_rule"]:
            value = _truthy(row.get(field))
            if value is None:
                _add_error(errors, index, rule_id, field, f"{field} must be boolean-like")
            elif field == "is_lead_rule" and value:
                lead_rule_count += 1
            elif field == "is_baseline_rule" and value:
                baseline_rule_count += 1

        for field in NUMERIC_NON_NEGATIVE_COLUMNS:
            value = _to_int(row.get(field))
            if value is None:
                _add_error(errors, index, rule_id, field, f"{field} must be numeric")
            elif value < 0:
                _add_error(errors, index, rule_id, field, f"{field} must be non-negative")

        forward_rows = _to_int(row.get("forward_row_count"))
        available = _to_int(row.get("forward_3d_available_count"))
        pending = _to_int(row.get("forward_3d_pending_count"))
        if forward_rows is not None and available is not None and pending is not None:
            if available + pending != forward_rows:
                _add_error(
                    errors,
                    index,
                    rule_id,
                    "forward_3d_counts",
                    "available + pending must equal forward_row_count",
                )

        public_copy = f" {row.get('public_copy_short', '')} {row.get('public_copy_detail', '')} ".lower()
        for forbidden in FORBIDDEN_PUBLIC_COPY_TERMS:
            if forbidden in public_copy:
                _add_error(errors, index, rule_id, "public_copy", f"forbidden public copy term: {forbidden.strip()}")

    if lead_rule_count != 1:
        _add_error(errors, None, None, "is_lead_rule", "export must contain exactly one lead rule")
    if baseline_rule_count < 1:
        _add_error(errors, None, None, "is_baseline_rule", "export must contain at least one baseline rule")
    if "DLOC_EQ_ULTRA_001" not in seen_rule_ids:
        _add_error(errors, None, "DLOC_EQ_ULTRA_001", "rule_id", "lead locked rule missing")

    summary = {
        "valid": not errors,
        "row_count": len(rows),
        "error_count": len(errors),
        "lead_rule_count": lead_rule_count,
        "baseline_rule_count": baseline_rule_count,
        "dashboard_status_counts": status_counts,
        "dashboard_tier_counts": tier_counts,
    }
    return errors, summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke-test SETA dislocation context export for sentiment-dash.")
    parser.add_argument(
        "--export",
        default="public_content/dislocation_dashboard_export.csv",
        help="Path to dislocation_dashboard_export.csv from SETA_Prediction_Intelligence_Engine.",
    )
    parser.add_argument(
        "--summary-json",
        default=None,
        help="Optional path to write validation summary JSON.",
    )
    parser.add_argument(
        "--allow-missing",
        action="store_true",
        help="Return success when the export file is absent. Useful before the first local handoff copy.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    export_path = Path(args.export)
    if not export_path.exists():
        summary = {
            "valid": bool(args.allow_missing),
            "missing": True,
            "export": str(export_path),
            "message": "dislocation export file not found",
        }
        print(json.dumps(summary, indent=2))
        if args.summary_json:
            Path(args.summary_json).parent.mkdir(parents=True, exist_ok=True)
            Path(args.summary_json).write_text(json.dumps(summary, indent=2), encoding="utf-8")
        if args.allow_missing:
            return
        raise SystemExit(1)

    rows, fieldnames = load_rows(export_path)
    errors, summary = validate_rows(rows, fieldnames)
    summary["export"] = str(export_path)

    if args.summary_json:
        Path(args.summary_json).parent.mkdir(parents=True, exist_ok=True)
        Path(args.summary_json).write_text(json.dumps(summary, indent=2), encoding="utf-8")

    print(json.dumps(summary, indent=2))
    if errors:
        print("dislocation_context_export_errors:")
        for error in errors:
            print(json.dumps(error, sort_keys=True))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
