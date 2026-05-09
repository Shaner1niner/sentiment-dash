#!/usr/bin/env python
"""Promote validated SETA AI briefing drafts into a reviewed static payload."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from check_ai_briefing_output import load_json, validate_output

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "generated_briefings_reviewed.json"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def safe_key_part(value: Any, fallback: str) -> str:
    text = str(value or fallback).strip().lower()
    return "".join(ch if ch.isalnum() else "_" for ch in text).strip("_") or fallback


def briefing_key(briefing: dict[str, Any], mode: str, display_range: str) -> str:
    return "::".join(
        [
            safe_key_part(mode, "mode"),
            safe_key_part(briefing.get("asset"), "asset"),
            safe_key_part(briefing.get("frequency"), "freq"),
            safe_key_part(display_range, "range"),
            safe_key_part(briefing.get("as_of"), "asof"),
        ]
    )


def reviewed_briefing(
    draft: dict[str, Any],
    *,
    briefing_input: dict[str, Any] | None,
    reviewer: str,
    review_note: str,
    source_path: Path,
) -> dict[str, Any]:
    out = dict(draft)
    out["review_status"] = "reviewed"
    out["review_metadata"] = {
        "reviewed_at_utc": utc_now(),
        "reviewer": reviewer,
        "review_note": review_note,
        "source_draft_path": str(source_path),
        "source_input_schema_version": (briefing_input or {}).get("schema_version"),
    }
    errors = validate_output(out, briefing_input)
    if errors:
        raise ValueError("; ".join(errors))
    return out


def payload_for(
    reviewed: list[dict[str, Any]],
    *,
    mode: str,
    display_range: str,
    payload_note: str,
) -> dict[str, Any]:
    by_key: dict[str, dict[str, Any]] = {}
    for briefing in reviewed:
        key = briefing_key(briefing, mode, display_range)
        item = dict(briefing)
        item["mode"] = mode
        item["display_range"] = display_range
        item["payload_key"] = key
        by_key[key] = item
    return {
        "schema_version": "generated_briefings_reviewed_v1",
        "generated_at_utc": utc_now(),
        "payload_note": payload_note,
        "briefing_count": len(by_key),
        "briefings": by_key,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("drafts", nargs="+", help="Draft ai_briefing_output_v1 JSON file(s) to promote.")
    parser.add_argument("--input", help="Optional ai_briefing_input_v1 JSON file for single-draft cross-checks.")
    parser.add_argument("--mode", default="public", choices=["public", "member"], help="Dashboard mode for payload keying.")
    parser.add_argument("--display-range", default="3M", help="Display range for payload keying.")
    parser.add_argument("--reviewer", default="local-review", help="Reviewer name or identifier.")
    parser.add_argument("--review-note", default="Promoted through local reviewed-briefing workflow.")
    parser.add_argument("--payload-note", default="Reviewed SETA briefing payload. Dashboard consumption is not wired yet.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Reviewed static payload path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.input and len(args.drafts) != 1:
        raise SystemExit("--input can only be used with one draft file.")
    briefing_input = load_json(Path(args.input)) if args.input else None
    if briefing_input is not None and not isinstance(briefing_input, dict):
        raise SystemExit("--input JSON root must be an object.")

    reviewed: list[dict[str, Any]] = []
    for draft_item in args.drafts:
        path = Path(draft_item)
        draft = load_json(path)
        if not isinstance(draft, dict):
            raise SystemExit(f"{path}: draft root must be an object.")
        base_errors = validate_output(draft, briefing_input if isinstance(briefing_input, dict) else None)
        if base_errors:
            raise SystemExit(f"{path}: draft failed validation before review: {'; '.join(base_errors)}")
        reviewed.append(
            reviewed_briefing(
                draft,
                briefing_input=briefing_input if isinstance(briefing_input, dict) else None,
                reviewer=args.reviewer,
                review_note=args.review_note,
                source_path=path,
            )
        )

    payload = payload_for(reviewed, mode=args.mode, display_range=args.display_range, payload_note=args.payload_note)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"[OK] wrote {output} with {payload['briefing_count']} reviewed briefing(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
