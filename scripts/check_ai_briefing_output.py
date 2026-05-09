#!/usr/bin/env python
"""Validate draft or reviewed SETA AI briefing outputs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

REQUIRED_FIELDS = [
    "schema_version",
    "asset",
    "frequency",
    "as_of",
    "headline",
    "summary",
    "what_seta_sees",
    "why_it_matters",
    "evidence",
    "trust_check",
    "watch_item",
    "limitations",
    "public_safe_disclaimer",
    "source_breadth_used",
    "review_status",
    "model_metadata",
]

ALLOWED_REVIEW_STATUSES = {"draft", "reviewed", "suppressed", "expired"}

FORBIDDEN_PATTERNS = [
    (re.compile(r"\bstrong\s+buy\b", re.I), "strong buy language"),
    (re.compile(r"\bbuy\b", re.I), "buy language"),
    (re.compile(r"\bsell\b", re.I), "sell language"),
    (re.compile(r"\bhold\b", re.I), "hold language"),
    (re.compile(r"\bprice\s+target\b", re.I), "price target language"),
    (re.compile(r"\bguaranteed\b", re.I), "guarantee language"),
    (re.compile(r"\bwill\s+(rally|rise|crash|fall|moon|surge|collapse)\b", re.I), "unsupported future claim"),
    (re.compile(r"\bshould\s+(enter|exit|buy|sell|hold)\b", re.I), "personalized action language"),
    (re.compile(r"\bproves?\s+organic\s+demand\b", re.I), "overstated breadth claim"),
]


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def text_fields(output: dict[str, Any]) -> list[tuple[str, str]]:
    fields: list[tuple[str, str]] = []
    for key, value in output.items():
        if key == "public_safe_disclaimer":
            continue
        if isinstance(value, str):
            fields.append((key, value))
        elif isinstance(value, list):
            for idx, item in enumerate(value):
                if isinstance(item, str):
                    fields.append((f"{key}[{idx}]", item))
    return fields


def validate_output(output: dict[str, Any], briefing_input: dict[str, Any] | None = None) -> list[str]:
    errors: list[str] = []
    if output.get("schema_version") != "ai_briefing_output_v1":
        errors.append("schema_version must be ai_briefing_output_v1")

    for field in REQUIRED_FIELDS:
        if field not in output:
            errors.append(f"missing required field: {field}")

    headline = output.get("headline")
    if not isinstance(headline, str) or not headline.strip():
        errors.append("headline must be a non-empty string")
    elif len(headline) > 90:
        errors.append("headline must be 90 characters or fewer")

    summary = output.get("summary")
    if not isinstance(summary, str) or not summary.strip():
        errors.append("summary must be a non-empty string")
    elif word_count(summary) > 45:
        errors.append("summary must be 45 words or fewer")

    evidence = output.get("evidence")
    if not isinstance(evidence, list) or not all(isinstance(item, str) and item.strip() for item in evidence):
        errors.append("evidence must be a non-empty list of strings")
    elif not 3 <= len(evidence) <= 5:
        errors.append("evidence must contain 3 to 5 bullets")

    review_status = output.get("review_status")
    if review_status not in ALLOWED_REVIEW_STATUSES:
        errors.append(f"review_status must be one of {sorted(ALLOWED_REVIEW_STATUSES)}")

    metadata = output.get("model_metadata")
    if not isinstance(metadata, dict):
        errors.append("model_metadata must be an object")
    elif metadata.get("prompt_version") != "seta_briefing_prompt_v1":
        errors.append("model_metadata.prompt_version must be seta_briefing_prompt_v1")

    for field in ["what_seta_sees", "why_it_matters", "trust_check", "limitations", "public_safe_disclaimer"]:
        value = output.get(field)
        if not isinstance(value, str) or not value.strip():
            errors.append(f"{field} must be a non-empty string")

    if briefing_input:
        if output.get("asset") != briefing_input.get("asset"):
            errors.append("output asset does not match input asset")
        if output.get("frequency") != briefing_input.get("frequency"):
            errors.append("output frequency does not match input frequency")
        breadth = briefing_input.get("breadth_trust") or {}
        if breadth and output.get("source_breadth_used") is not True:
            errors.append("source_breadth_used must be true when input breadth_trust is present")
        if breadth and not str(output.get("trust_check") or "").strip():
            errors.append("trust_check is required when breadth_trust is present")

    for field, value in text_fields(output):
        for pattern, label in FORBIDDEN_PATTERNS:
            if pattern.search(value):
                errors.append(f"{field} contains forbidden {label}: {value!r}")

    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("outputs", nargs="+", help="AI briefing output JSON file(s) to validate.")
    parser.add_argument("--input", help="Optional ai_briefing_input_v1 JSON file for cross-checks.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    briefing_input = load_json(Path(args.input)) if args.input else None
    all_errors: list[str] = []
    for item in args.outputs:
        path = Path(item)
        try:
            data = load_json(path)
        except Exception as exc:
            all_errors.append(f"{path}: invalid JSON: {exc}")
            continue
        if not isinstance(data, dict):
            all_errors.append(f"{path}: root must be an object")
            continue
        errors = validate_output(data, briefing_input if isinstance(briefing_input, dict) else None)
        if errors:
            all_errors.extend(f"{path}: {error}" for error in errors)
        else:
            print(f"[OK] {path}")
    if all_errors:
        for error in all_errors:
            print(f"[ERROR] {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
