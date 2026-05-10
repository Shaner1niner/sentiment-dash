#!/usr/bin/env python
"""Validate draft or reviewed SETA AI briefing outputs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from ai_briefing_quality_gates import check_briefing_quality_gates

REQUIRED_FIELDS = [
    "schema_version",
    "asset",
    "frequency",
    "as_of",
    "headline",
    "summary",
    "briefing_cards",
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
ALLOWED_PROMPT_VERSIONS = {"seta_briefing_prompt_v1", "seta_briefing_prompt_v2"}
BRIEFING_CARD_ROLES = {
    "what_seta_sees": "Interpretation",
    "why_it_matters": "Implication",
    "evidence": "Receipts",
    "participation_quality": "Trust check",
}
EVIDENCE_INTERPRETATION_PATTERNS = [
    r"\bthis matters\b",
    r"\bseta treats\b",
    r"\bwatch whether\b",
    r"\bshould\b",
    r"\bconfidence\b",
]

def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


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

    cards = output.get("briefing_cards")
    if not isinstance(cards, dict):
        errors.append("briefing_cards must be an object")
    else:
        required_cards = list(BRIEFING_CARD_ROLES)
        for card_name in required_cards:
            if card_name not in cards or not isinstance(cards.get(card_name), dict):
                errors.append(f"briefing_cards.{card_name} must be an object")
        text_card_map = {
            "what_seta_sees": "what_seta_sees",
            "why_it_matters": "why_it_matters",
            "participation_quality": "trust_check",
        }
        for card_name, legacy_field in text_card_map.items():
            card = cards.get(card_name)
            if isinstance(card, dict):
                copy = card.get("copy")
                role = card.get("role")
                if role != BRIEFING_CARD_ROLES[card_name]:
                    errors.append(f"briefing_cards.{card_name}.role must be {BRIEFING_CARD_ROLES[card_name]!r}")
                if not isinstance(copy, str) or not copy.strip():
                    errors.append(f"briefing_cards.{card_name}.copy must be a non-empty string")
                elif copy != output.get(legacy_field):
                    errors.append(f"briefing_cards.{card_name}.copy must match {legacy_field}")
        evidence_card = cards.get("evidence")
        if isinstance(evidence_card, dict):
            role = evidence_card.get("role")
            items = evidence_card.get("items")
            if role != BRIEFING_CARD_ROLES["evidence"]:
                errors.append("briefing_cards.evidence.role must be 'Receipts'")
            if not isinstance(items, list) or not all(isinstance(item, str) and item.strip() for item in items):
                errors.append("briefing_cards.evidence.items must be a non-empty list of strings")
            elif items != evidence:
                errors.append("briefing_cards.evidence.items must match evidence")

        if isinstance(cards.get("participation_quality"), dict):
            participation_copy = str(cards["participation_quality"].get("copy") or "").lower()
            if "participation" not in participation_copy:
                errors.append("briefing_cards.participation_quality.copy must mention participation")
            if not any(token in participation_copy for token in ["breadth", "authorship", "source"]):
                errors.append("briefing_cards.participation_quality.copy must mention breadth/authorship/source context")

        if isinstance(cards.get("evidence"), dict) and isinstance(cards["evidence"].get("items"), list):
            for idx, item in enumerate(cards["evidence"]["items"]):
                item_text = str(item)
                for pattern in EVIDENCE_INTERPRETATION_PATTERNS:
                    if re.search(pattern, item_text, flags=re.IGNORECASE):
                        errors.append(f"briefing_cards.evidence.items[{idx}] must stay factual and avoid interpretive wording")
                        break

        if isinstance(cards.get("what_seta_sees"), dict) and isinstance(cards.get("evidence"), dict):
            what_copy = str(cards["what_seta_sees"].get("copy") or "").strip()
            evidence_items = cards["evidence"].get("items")
            if isinstance(evidence_items, list) and what_copy and what_copy in {str(item).strip() for item in evidence_items}:
                errors.append("briefing_cards.what_seta_sees.copy must not duplicate an evidence receipt")

    review_status = output.get("review_status")
    if review_status not in ALLOWED_REVIEW_STATUSES:
        errors.append(f"review_status must be one of {sorted(ALLOWED_REVIEW_STATUSES)}")

    metadata = output.get("model_metadata")
    if not isinstance(metadata, dict):
        errors.append("model_metadata must be an object")
    elif metadata.get("prompt_version") not in ALLOWED_PROMPT_VERSIONS:
        errors.append(f"model_metadata.prompt_version must be one of {sorted(ALLOWED_PROMPT_VERSIONS)}")

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

    gates = check_briefing_quality_gates(output, briefing_input)
    errors.extend(str(error) for error in gates.get("errors") or [])

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
