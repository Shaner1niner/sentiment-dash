#!/usr/bin/env python3
"""Validate a SETA Evidence Handoff v1 dashboard payload.

This script is intentionally dependency-free so it can run in the static
sentiment-dash repository without requiring the private pipeline environment.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

REQUIRED_SAFETY_PHRASES = (
    "Historical diagnostic only",
    "not a trade signal",
    "recommendation",
    "price forecast",
)

REQUIRED_PRIMARY_METRICS = (
    "events",
    "unique_terms",
    "date_range",
    "edge_7d_mean",
    "forward_7d_win_rate",
    "baseline_7d_win_rate",
)


def load_payload(path: str | Path) -> dict[str, Any]:
    payload_path = Path(path)
    with payload_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    if not isinstance(payload, dict):
        raise ValueError("Payload root must be a JSON object.")
    return payload


def find_card(payload: dict[str, Any], archetype: str) -> dict[str, Any] | None:
    cards = payload.get("cards")
    if not isinstance(cards, list):
        return None
    for card in cards:
        if isinstance(card, dict) and card.get("archetype") == archetype:
            return card
    return None


def validate_payload(payload: dict[str, Any], expected_primary: str = "attention_validation") -> list[str]:
    errors: list[str] = []

    if payload.get("schema_version") != "seta_evidence_handoff_v1":
        errors.append("schema_version must equal seta_evidence_handoff_v1")

    if payload.get("primary_archetype") != expected_primary:
        errors.append(f"primary_archetype must equal {expected_primary}")

    safety_note = str(payload.get("safety_note") or "")
    for phrase in REQUIRED_SAFETY_PHRASES:
        if phrase not in safety_note:
            errors.append(f"safety_note missing phrase: {phrase}")

    cards = payload.get("cards")
    if not isinstance(cards, list) or not cards:
        errors.append("cards must be a non-empty list")
        return errors

    primary_card = find_card(payload, expected_primary)
    if primary_card is None:
        errors.append(f"missing primary card: {expected_primary}")
        return errors

    if not primary_card.get("title"):
        errors.append("primary card missing title")
    if not primary_card.get("status"):
        errors.append("primary card missing status")
    if not primary_card.get("public_takeaway"):
        errors.append("primary card missing public_takeaway")

    metrics = primary_card.get("metrics")
    if not isinstance(metrics, dict):
        errors.append("primary card metrics must be an object")
    else:
        for metric in REQUIRED_PRIMARY_METRICS:
            if metric not in metrics:
                errors.append(f"primary card missing metric: {metric}")

    caveats = primary_card.get("caveats")
    if not isinstance(caveats, list) or not caveats:
        errors.append("primary card caveats must be a non-empty list")
    else:
        caveat_text = " ".join(str(c) for c in caveats)
        if "not a trade signal" not in caveat_text:
            errors.append("primary card caveats must preserve trade-signal guardrail")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate SETA Evidence Handoff v1 payload")
    parser.add_argument(
        "--payload",
        default="seta_bundles/latest/evidence/dashboard_evidence_payload.json",
        help="Path to dashboard_evidence_payload.json",
    )
    parser.add_argument("--primary-archetype", default="attention_validation")
    parser.add_argument(
        "--allow-missing",
        action="store_true",
        help="Exit successfully when the payload file is missing. Useful before the generated artifact is wired into refresh automation.",
    )
    args = parser.parse_args()

    payload_path = Path(args.payload)
    if not payload_path.exists():
        message = f"[WARN] evidence handoff payload not found: {payload_path}"
        if args.allow_missing:
            print(message)
            return 0
        print(message)
        return 1

    payload = load_payload(payload_path)
    errors = validate_payload(payload, expected_primary=args.primary_archetype)
    if errors:
        print("[FAIL] evidence handoff payload validation failed")
        for error in errors:
            print(f"  - {error}")
        return 1

    primary_card = find_card(payload, args.primary_archetype) or {}
    print("[OK] evidence handoff payload valid")
    print(f"payload={payload_path}")
    print(f"primary_archetype={payload.get('primary_archetype')}")
    print(f"primary_status={payload.get('primary_status')}")
    print(f"primary_title={primary_card.get('title')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
