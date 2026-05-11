#!/usr/bin/env python
"""Compare AI briefing candidates against deterministic sample baselines."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from build_ai_briefing_sample_packet import ROOT, path_label, safe_text
from check_ai_briefing_output import validate_output


CARD_TITLES = {
    "what_seta_sees": "What SETA Sees",
    "why_it_matters": "Why It Matters",
    "evidence": "Evidence",
    "participation_quality": "Participation Quality",
}
STACK_SYNTHESIS_RE = re.compile(r"\b(?:stack\s+summary|together|combined|combines|synthesis)\b", re.IGNORECASE)
STACK_COMPONENTS_RE = re.compile(r"\bprice\b.*\b(?:structure|backdrop)\b.*\b(?:timing|momentum|indicator)\b.*\bparticipation\b", re.IGNORECASE)
UNTRANSLATED_LABEL_RE = re.compile(
    r"\b(?:None\s+Inside|Quiet\s*/\s*Ignore|Compression\s+Coil|Crowded\s+Bearish\s*/\s*Broad|Flat\s*/\s*Transition|quality\s+score)\b",
    re.IGNORECASE,
)
DATE_AMBIGUITY_RE = re.compile(r"\blatest\s+close\b(?!\s+(?:available|value))", re.IGNORECASE)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_path(label: str | None) -> Path | None:
    if not label:
        return None
    path = Path(label)
    return path if path.is_absolute() else ROOT / path


def case_slug(case: dict[str, Any]) -> str:
    return "_".join(
        [
            str(case.get("mode") or "").lower(),
            str(case.get("asset") or "").lower(),
            str(case.get("frequency") or "").lower(),
            str(case.get("display_range") or "").lower(),
        ]
    )


def candidate_path_for(candidate_dir: Path, slug: str) -> Path | None:
    for name in [f"{slug}_candidate.json", f"{slug}.json"]:
        path = candidate_dir / name
        if path.exists():
            return path
    return None


def card_text(payload: dict[str, Any], key: str) -> str:
    cards = payload.get("briefing_cards") or {}
    card = cards.get(key) or {}
    if key == "evidence":
        items = card.get("items") if isinstance(card.get("items"), list) else payload.get("evidence") or []
        return "\n".join(f"- {safe_text(item)}" for item in items)
    legacy_key = "trust_check" if key == "participation_quality" else key
    return safe_text(card.get("copy") or payload.get(legacy_key))


def comparison_flags(candidate: dict[str, Any]) -> list[str]:
    flags: list[str] = []
    cards = candidate.get("briefing_cards") or {}
    evidence = (cards.get("evidence") or {}).get("items") or candidate.get("evidence") or []
    participation = card_text(candidate, "participation_quality").lower()
    visible_text = " ".join(
        str(value or "")
        for value in [
            candidate.get("headline"),
            candidate.get("summary"),
            card_text(candidate, "what_seta_sees"),
            card_text(candidate, "why_it_matters"),
            card_text(candidate, "evidence"),
            card_text(candidate, "participation_quality"),
            candidate.get("watch_item"),
        ]
    )
    if 3 <= len(evidence) <= 5:
        flags.append("Evidence count is in range.")
    if any(is_stack_synthesis_receipt(str(item or "")) for item in evidence):
        flags.append("Evidence includes stack synthesis.")
    if "participation" in participation and any(token in participation for token in ["breadth", "authorship", "source"]):
        flags.append("Participation Quality includes breadth/source trust framing.")
    if any(
        token in participation
        for token in [
            "quiet",
            "normal",
            "elevated",
            "extreme",
            "broad",
            "moderate",
            "narrow",
            "rising",
            "increasing",
            "cooling",
            "falling",
            "stable",
            "broadening",
            "narrowing",
            "distributed",
            "concentrated",
        ]
    ):
        flags.append("Participation Quality describes level or direction.")
    if not DATE_AMBIGUITY_RE.search(visible_text):
        flags.append("Date/close wording avoids ambiguous latest-close phrasing.")
    if not UNTRANSLATED_LABEL_RE.search(visible_text):
        flags.append("No untranslated internal label from the review ban list.")
    if ((candidate.get("model_metadata") or {}).get("prompt_version") == "seta_briefing_prompt_v2"):
        flags.append("Candidate declares prompt v2.")
    return flags


def is_stack_synthesis_receipt(text: str) -> bool:
    if STACK_SYNTHESIS_RE.search(text):
        return True
    return bool(STACK_COMPONENTS_RE.search(" ".join(text.split())))


def compare(sample_packet: dict[str, Any], candidate_dir: Path) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for row in sample_packet.get("rows") or []:
        case = row.get("case") or {}
        slug = case_slug(case)
        input_path = resolve_path(row.get("input_path"))
        baseline_path = resolve_path(row.get("draft_path"))
        candidate_path = candidate_path_for(candidate_dir, slug)
        item: dict[str, Any] = {
            "slug": slug,
            "case": case,
            "candidate_path": path_label(candidate_path) if candidate_path else "",
            "status": "missing",
            "validation_errors": [],
            "flags": [],
            "cards": {},
        }
        if not candidate_path:
            item["validation_errors"] = ["candidate output is missing"]
            rows.append(item)
            continue
        try:
            briefing_input = load_json(input_path) if input_path else None
            baseline = load_json(baseline_path) if baseline_path else {}
            candidate = load_json(candidate_path)
            errors = validate_output(candidate, briefing_input if isinstance(briefing_input, dict) else None)
            item["status"] = "pass" if not errors else "fail"
            item["validation_errors"] = errors
            item["flags"] = comparison_flags(candidate)
            for key, title in CARD_TITLES.items():
                item["cards"][key] = {
                    "title": title,
                    "baseline": card_text(baseline, key),
                    "candidate": card_text(candidate, key),
                }
        except Exception as exc:
            item["status"] = "fail"
            item["validation_errors"] = [str(exc)]
        rows.append(item)
    return {
        "schema_version": "ai_briefing_candidate_comparison_v1",
        "candidate_dir": path_label(candidate_dir),
        "case_count": len(rows),
        "pass_count": sum(1 for row in rows if row["status"] == "pass"),
        "missing_count": sum(1 for row in rows if row["status"] == "missing"),
        "rows": rows,
    }


def write_markdown(path: Path, result: dict[str, Any]) -> None:
    lines = [
        "# SETA AI Briefing Candidate Comparison",
        "",
        f"Candidate dir: `{result['candidate_dir']}`",
        f"Cases: {result['case_count']} total, {result['pass_count']} passing, {result['missing_count']} missing",
        "",
    ]
    for row in result["rows"]:
        case = row.get("case") or {}
        label = f"{case.get('mode', '').upper()} {case.get('asset')} {case.get('frequency')} {case.get('display_range')}"
        lines.extend(
            [
                f"## {label}",
                "",
                f"Candidate: `{row.get('candidate_path') or 'missing'}`",
                f"Status: {row['status'].upper()}",
                "",
            ]
        )
        if row.get("validation_errors"):
            lines.append("Validation notes:")
            for error in row["validation_errors"]:
                lines.append(f"- {safe_text(error)}")
            lines.append("")
        if row.get("flags"):
            lines.append("Positive flags:")
            for flag in row["flags"]:
                lines.append(f"- {safe_text(flag)}")
            lines.append("")
        for key in CARD_TITLES:
            card = (row.get("cards") or {}).get(key)
            if not card:
                continue
            lines.extend(
                [
                    f"### {card['title']}",
                    "",
                    "Baseline:",
                    card["baseline"] or "Unavailable.",
                    "",
                    "Candidate:",
                    card["candidate"] or "Unavailable.",
                    "",
                ]
            )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample-packet", required=True, help="Path to sample_review_packet.json.")
    parser.add_argument("--candidate-dir", required=True, help="Directory containing *_candidate.json files.")
    parser.add_argument("--output", help="Markdown comparison output path.")
    parser.add_argument("--json-output", help="Optional JSON comparison output path.")
    parser.add_argument("--allow-missing", action="store_true", help="Return success even when some candidates are missing.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    sample_packet_path = Path(args.sample_packet).resolve()
    candidate_dir = Path(args.candidate_dir).resolve()
    result = compare(load_json(sample_packet_path), candidate_dir)
    output = Path(args.output).resolve() if args.output else candidate_dir.parent / "ai_candidate_comparison.md"
    write_markdown(output, result)
    if args.json_output:
        json_output = Path(args.json_output).resolve()
        json_output.parent.mkdir(parents=True, exist_ok=True)
        json_output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"[OK] wrote {output}")
    print(f"[OK] passing candidates: {result['pass_count']}/{result['case_count']}")
    if result["missing_count"] and args.allow_missing:
        return 0
    return 0 if result["pass_count"] == result["case_count"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
