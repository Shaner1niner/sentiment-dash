#!/usr/bin/env python
"""Build a controlled SETA briefing sample packet for human review.

The packet is local-only by default. It creates representative inputs and
deterministic v2 draft outputs, validates each draft, and writes a compact
Markdown review packet. This is the bridge between the schema contract and a
future AI-generated sample run.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from build_ai_briefing_input import build_input
from check_ai_briefing_output import validate_output
from generate_ai_briefing_draft import generate_draft

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class SampleCase:
    mode: str
    asset: str
    frequency: str
    display_range: str
    reason: str

    @property
    def slug(self) -> str:
        return "_".join(
            [
                self.mode.lower(),
                self.asset.lower(),
                self.frequency.lower(),
                self.display_range.lower(),
            ]
        )


DEFAULT_CASES = [
    SampleCase("public", "BTC", "D", "3M", "Core public crypto read with active dashboard traffic."),
    SampleCase("public", "NVDA", "W", "1Y", "Large-cap equity weekly read with different scale and participation dynamics."),
    SampleCase("public", "GLD", "D", "3M", "Defensive asset / cross-market context check."),
    SampleCase("public", "SOL", "D", "3M", "Crypto asset with faster sentiment and participation shifts."),
    SampleCase("member", "LINK", "D", "6M", "Member-mode crypto read using the fuller daily context window."),
    SampleCase("member", "ETH", "W", "1Y", "Weekly crypto read for slower structural language."),
    SampleCase("member", "MSFT", "D", "6M", "Mega-cap equity read with quieter participation risk."),
    SampleCase("member", "AAPL", "W", "1Y", "Weekly equity read for breadth/trust wording across a long window."),
]


PROMPT_V2_REVIEW_BRIEF = """Prompt version: seta_briefing_prompt_v2

For a future AI-generated run, each output should generate briefing_cards first:
- What SETA Sees: interpretation of the current read.
- Why It Matters: implication of the read, without advice or prediction.
- Evidence: factual receipts only.
- Participation Quality: participation movement plus authorship/source breadth as a trust layer.

Legacy top-level fields must mirror the cards until the dashboard no longer
needs them. Keep all language educational, non-advisory, and non-predictive.
"""


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def read_case(value: str) -> SampleCase:
    parts = [part.strip() for part in value.split(",")]
    if len(parts) < 4:
        raise argparse.ArgumentTypeError("case must be mode,asset,frequency,display_range[,reason]")
    mode, asset, frequency, display_range = parts[:4]
    reason = parts[4] if len(parts) > 4 and parts[4] else "User-specified sample case."
    return SampleCase(mode.lower(), asset.upper(), frequency.upper(), display_range.upper(), reason)


def safe_text(value: Any, fallback: str = "") -> str:
    text = str(value).strip() if value not in (None, "") else fallback
    return " ".join(text.split())


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def path_label(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def card_lines(draft: dict[str, Any]) -> list[str]:
    cards = draft.get("briefing_cards") or {}
    output: list[str] = []
    for key, title in [
        ("what_seta_sees", "What SETA Sees"),
        ("why_it_matters", "Why It Matters"),
        ("evidence", "Evidence"),
        ("participation_quality", "Participation Quality"),
    ]:
        card = cards.get(key) or {}
        role = safe_text(card.get("role"), "Unlabeled")
        output.append(f"### {title} ({role})")
        if key == "evidence":
            items = card.get("items") if isinstance(card.get("items"), list) else draft.get("evidence") or []
            for item in items:
                output.append(f"- {safe_text(item)}")
        else:
            output.append(safe_text(card.get("copy") or draft.get(key) or draft.get("trust_check")))
        output.append("")
    return output


def review_flags(draft: dict[str, Any]) -> list[str]:
    cards = draft.get("briefing_cards") or {}
    flags: list[str] = []
    participation = safe_text(((cards.get("participation_quality") or {}).get("copy") or draft.get("trust_check"))).lower()
    if "participation" in participation and any(token in participation for token in ["breadth", "authorship", "source"]):
        flags.append("Participation Quality includes participation plus breadth/source context.")
    evidence = (cards.get("evidence") or {}).get("items") or draft.get("evidence") or []
    if 3 <= len(evidence) <= 5:
        flags.append("Evidence has 3-5 receipts.")
    metadata = draft.get("model_metadata") or {}
    if metadata.get("prompt_version") == "seta_briefing_prompt_v2":
        flags.append("Prompt contract is v2.")
    return flags


def build_packet(cases: list[SampleCase], output_dir: Path) -> dict[str, Any]:
    inputs_dir = output_dir / "inputs"
    drafts_dir = output_dir / "drafts"
    rows: list[dict[str, Any]] = []
    errors: list[str] = []

    for case in cases:
        try:
            briefing_input = build_input(case.mode, case.asset, case.frequency, case.display_range)
            draft = generate_draft(briefing_input)
            validation_errors = validate_output(draft, briefing_input)
            input_path = inputs_dir / f"{case.slug}_input.json"
            draft_path = drafts_dir / f"{case.slug}_draft.json"
            write_json(input_path, briefing_input)
            write_json(draft_path, draft)
            rows.append(
                {
                    "case": case.__dict__,
                    "as_of": draft.get("as_of"),
                    "headline": draft.get("headline"),
                    "summary": draft.get("summary"),
                    "input_path": path_label(input_path),
                    "draft_path": path_label(draft_path),
                    "validation_errors": validation_errors,
                    "review_flags": review_flags(draft),
                    "draft": draft,
                }
            )
        except Exception as exc:
            message = f"{case.slug}: {exc}"
            errors.append(message)
            rows.append(
                {
                    "case": case.__dict__,
                    "validation_errors": [message],
                }
            )

    packet = {
        "schema_version": "ai_briefing_sample_packet_v1",
        "generated_at_utc": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "sample_count": len(rows),
        "valid_count": sum(1 for row in rows if not row.get("validation_errors")),
        "prompt_contract": "seta_briefing_prompt_v2",
        "review_questions": [
            "Does each card do a distinct job?",
            "Does Evidence stay factual rather than interpretive?",
            "Does Participation Quality treat authorship/source breadth as a trust layer?",
            "Does any copy sound advisory, predictive, or overconfident?",
            "Would this language be helpful in the live dashboard?",
        ],
        "rows": rows,
        "errors": errors,
    }
    write_json(output_dir / "sample_review_packet.json", packet)
    return packet


def write_markdown(packet: dict[str, Any], output_dir: Path) -> Path:
    path = output_dir / "sample_review_packet.md"
    lines = [
        "# SETA AI Briefing Sample Review Packet",
        "",
        f"Generated: {packet['generated_at_utc']}",
        f"Prompt contract: `{packet['prompt_contract']}`",
        f"Samples: {packet['sample_count']} total, {packet['valid_count']} valid",
        "",
        "## Review Lens",
        "",
        PROMPT_V2_REVIEW_BRIEF,
        "## Human Review Questions",
        "",
    ]
    for question in packet["review_questions"]:
        lines.append(f"- {question}")
    lines.append("")

    for idx, row in enumerate(packet["rows"], start=1):
        case = row.get("case") or {}
        label = f"{case.get('mode', '').upper()} {case.get('asset')} {case.get('frequency')} {case.get('display_range')}"
        lines.extend(
            [
                f"## {idx}. {label}",
                "",
                f"Reason: {safe_text(case.get('reason'))}",
                f"As of: {safe_text(row.get('as_of'), 'unavailable')}",
                f"Input: `{safe_text(row.get('input_path'), 'not written')}`",
                f"Draft: `{safe_text(row.get('draft_path'), 'not written')}`",
                "",
            ]
        )
        validation_errors = row.get("validation_errors") or []
        if validation_errors:
            lines.append("Validation: FAIL")
            for error in validation_errors:
                lines.append(f"- {safe_text(error)}")
            lines.append("")
            continue

        draft = row["draft"]
        lines.extend(
            [
                "Validation: PASS",
                f"Headline: {safe_text(draft.get('headline'))}",
                f"Summary: {safe_text(draft.get('summary'))}",
                "",
                "Review flags:",
            ]
        )
        for flag in row.get("review_flags") or []:
            lines.append(f"- {safe_text(flag)}")
        lines.append("")
        lines.extend(card_lines(draft))

    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--case",
        action="append",
        type=read_case,
        help="Sample case as mode,asset,frequency,display_range[,reason]. May be repeated.",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Output directory. Defaults to briefing_outputs/sample_review_<UTC stamp>.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cases = args.case or DEFAULT_CASES
    output_dir = Path(args.output_dir).resolve() if args.output_dir else ROOT / "briefing_outputs" / f"sample_review_{utc_stamp()}"
    output_dir.mkdir(parents=True, exist_ok=True)
    packet = build_packet(cases, output_dir)
    markdown_path = write_markdown(packet, output_dir)
    print(f"[OK] wrote {markdown_path}")
    print(f"[OK] valid samples: {packet['valid_count']}/{packet['sample_count']}")
    if packet.get("errors"):
        for error in packet["errors"]:
            print(f"[ERROR] {error}")
        return 1
    return 0 if packet["valid_count"] == packet["sample_count"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
