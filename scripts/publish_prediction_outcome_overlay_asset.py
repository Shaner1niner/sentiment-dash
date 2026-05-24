from __future__ import annotations

"""Publish prediction outcome overlay JSON into the dashboard runtime asset tree.

This script copies the validated overlay produced by SETA_Prediction_Intelligence_Engine
into sentiment-dash public_content so the dashboard can consume it as a static JSON asset.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
ENV_VAR = "SETA_PREDICTION_OUTCOME_OVERLAY_JSON"
DEFAULT_OUTPUT = ROOT / "public_content" / "prediction_outcomes" / "prediction_outcome_overlay_latest.json"

sys.path.insert(0, str(SCRIPTS))
from validate_prediction_outcome_overlay import load_overlay, validate_overlay  # noqa: E402


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish prediction outcome overlay runtime asset.")
    parser.add_argument("--source", type=Path, default=None, help=f"Source JSON path. Defaults to ${ENV_VAR}.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    raw_source = args.source or os.environ.get(ENV_VAR)
    if not raw_source:
        print(f"Missing source overlay path. Set {ENV_VAR} or pass --source.", file=sys.stderr)
        return 2

    source = Path(raw_source)
    output = args.output

    data = load_overlay(source)
    report = validate_overlay(data)
    if not report.get("valid"):
        print("Source overlay failed contract validation.", file=sys.stderr)
        print(json.dumps(report, indent=2, default=str), file=sys.stderr)
        return 1

    summary = {
        "source": str(source),
        "output": str(output),
        "dry_run": args.dry_run,
        "valid": report.get("valid"),
        "row_count": report.get("row_count"),
        "resolved_count": report.get("resolved_count"),
        "pending_count": report.get("pending_count"),
        "selective_accuracy": report.get("selective_accuracy"),
        "generated_at": report.get("generated_at"),
    }

    if not args.dry_run:
        write_json(output, data)

    if args.json:
        print(json.dumps(summary, indent=2, default=str))
    else:
        print("Prediction Outcome Overlay Runtime Asset Publisher")
        print("=" * 80)
        for key, value in summary.items():
            print(f"{key}: {value}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
