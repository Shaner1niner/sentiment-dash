from __future__ import annotations

"""Smoke test the dashboard runtime prediction outcome overlay asset."""

import argparse
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
DEFAULT_ASSET = ROOT / "public_content" / "prediction_outcomes" / "prediction_outcome_overlay_latest.json"

sys.path.insert(0, str(SCRIPTS))
from validate_prediction_outcome_overlay import load_overlay, validate_overlay  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test prediction outcome overlay runtime asset.")
    parser.add_argument("--path", type=Path, default=DEFAULT_ASSET)
    parser.add_argument("--min-rows", type=int, default=1)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    report = validate_overlay(load_overlay(args.path))
    failures = list(report.get("failures") or [])

    row_count = report.get("row_count")
    if not isinstance(row_count, int) or row_count < args.min_rows:
        failures.append(f"row_count must be >= {args.min_rows}; got {row_count}")

    report = {
        **report,
        "path": str(args.path),
        "valid": not failures,
        "failures": failures,
    }

    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print("Prediction Outcome Overlay Runtime Asset Smoke")
        print("=" * 80)
        print(f"path: {args.path}")
        print(f"valid: {report['valid']}")
        print(f"row_count: {report.get('row_count')}")
        print(f"resolved_count: {report.get('resolved_count')}")
        print(f"pending_count: {report.get('pending_count')}")
        print(f"selective_accuracy: {report.get('selective_accuracy')}")
        if failures:
            print("failures:")
            for failure in failures:
                print(f"  - {failure}")

    return 0 if report["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
