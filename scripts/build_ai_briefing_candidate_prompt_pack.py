#!/usr/bin/env python
"""Build provider-neutral AI candidate prompts from a sample review packet.

This script does not call an AI provider. It packages the exact structured
inputs from a sample packet into JSONL prompts so candidate AI outputs can be
generated outside the production dashboard path, then validated/reviewed before
anything is promoted.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from build_ai_briefing_sample_packet import DEFAULT_CASES, ROOT, build_packet, path_label, utc_stamp, write_json, write_markdown

SYSTEM_INSTRUCTION = (
    "You write SETA market briefings from structured evidence. Do not invent facts, "
    "provide investment advice, create price targets, or use buy/sell instructions. "
    "Treat sentiment, attention, and source breadth as context. Breadth is a trust "
    "check, not proof of organic demand. Use concise, plain language suitable for an "
    "educational market dashboard."
)

TASK_PROMPT = """Given the SETA briefing input JSON, produce one JSON object matching ai_briefing_output_v1 using prompt_version seta_briefing_prompt_v2.

Rules:
- Use only facts present in the input.
- Use public-facing labels, not raw field names. Never include snake_case tokens, underscores, internal key names, or score-column names in any user-visible text.
- Translate internal SETA labels into plain-English consequences. Do not use opaque phrases such as None Inside, Quiet / Ignore, Compression Coil, Crowded Bearish / Broad, Flat / Transition, rejection tier, or quality score unless you translate the consequence instead of repeating the label.
- Use asset, frequency, and as_of exactly as supplied by the input.
- Treat as_of as the reviewed payload date. Do not write "latest close" by itself; use "latest available close" only for price_context.latest_close and "latest reviewed value" when candle status is uncertain.
- Generate briefing_cards first.
- Apply this hierarchy before writing prose: SETA Score / dashboard archetype, shared-zone overlap state, timing stack, participation/attention, then confidence/confirmation.
- Never write that price is not outside the shared zone when the input shows Bearish Pressure, Bullish Pressure, Latest Confirmed, or an active pressure/watch event. Distinguish inside zone, outside unconfirmed, pressure, and confirmed pressure.
- what_seta_sees: primary read plus the most important counter-signal or limiting condition. Synthesize score/archetype, overlap, MACD, MACD histogram, RSI, Stoch RSI, sentiment MA ribbon, attention, breadth, and latest event when present.
- why_it_matters: confidence implication of the read, without advice or prediction. Resolve conflicts rather than listing bullish, bearish, and mixed signals without hierarchy.
- evidence: 3 to 5 items. The first item must be a one-sentence stack summary that synthesizes price, structure, timing, and participation. The remaining items should be terse factual receipts.
- Evidence must not use should, watch, proves, validates, or this matters.
- Use plain ASCII punctuation in every string.
- participation_quality: be concise. State participation level/direction and authorship/source breadth direction or level. Do not include implementation boilerplate, stale-data disclaimers, or educational disclaimer language inside this card.
- Never say breadth, authorship, attention, or participation proves anything.
- Use watch_item for the watch condition: what would improve or weaken confidence, stated as context rather than prediction.
- Mirror briefing_cards into the legacy top-level fields exactly:
  - what_seta_sees equals briefing_cards.what_seta_sees.copy.
  - why_it_matters equals briefing_cards.why_it_matters.copy.
  - evidence equals briefing_cards.evidence.items.
  - trust_check equals briefing_cards.participation_quality.copy.
- Keep the headline under 90 characters.
- Keep the summary under 45 words.
- Include limitations and public_safe_disclaimer.
- Set source_breadth_used to true when breadth_trust is present.
- Set review_status to draft.
- Set model_metadata.provider to openai, model to the selected model, and prompt_version to seta_briefing_prompt_v2.
- Return JSON only.
"""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_packet_path(value: str | None, output_dir: Path) -> Path:
    if value:
        return Path(value).resolve()
    sample_dir = output_dir / "sample_review"
    packet = build_packet_from_defaults(sample_dir)
    return packet


def build_packet_from_defaults(output_dir: Path) -> Path:
    built = build_packet(DEFAULT_CASES, output_dir)
    write_markdown(built, output_dir)
    return output_dir / "sample_review_packet.json"


def resolve_payload_path(label: str) -> Path:
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


def prompt_record(row: dict[str, Any]) -> dict[str, Any]:
    case = row.get("case") or {}
    input_path = resolve_payload_path(str(row.get("input_path") or ""))
    briefing_input = load_json(input_path)
    candidate_id = case_slug(case)
    return {
        "schema_version": "ai_briefing_candidate_prompt_v1",
        "candidate_id": candidate_id,
        "mode": case.get("mode"),
        "asset": case.get("asset"),
        "frequency": case.get("frequency"),
        "display_range": case.get("display_range"),
        "as_of": row.get("as_of"),
        "recommended_intelligence": "High",
        "system_instruction": SYSTEM_INSTRUCTION,
        "task_prompt": TASK_PROMPT,
        "briefing_input": briefing_input,
        "expected_output_schema": "ai_briefing_output_v1",
        "expected_prompt_version": "seta_briefing_prompt_v2",
        "baseline_draft_path": row.get("draft_path"),
        "candidate_output_path": f"candidate_outputs/{candidate_id}_candidate.json",
    }


def write_jsonl(path: Path, records: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(record, sort_keys=True) for record in records) + "\n", encoding="utf-8")


def write_markdown_pack(path: Path, records: list[dict[str, Any]], sample_packet_path: Path) -> None:
    lines = [
        "# SETA AI Briefing Candidate Prompt Pack",
        "",
        f"Sample packet: `{path_label(sample_packet_path)}`",
        f"Prompts: {len(records)}",
        "Recommended intelligence: High",
        "",
        "This pack is local-only. Generate candidate JSON outputs into `candidate_outputs/`, then run the comparator before any human review or promotion.",
        "",
        "## Contract",
        "",
        "- Output must be valid `ai_briefing_output_v1` JSON.",
        "- `briefing_cards` must be generated first and mirrored into legacy top-level fields.",
        "- Evidence must stay factual.",
        "- Evidence must include one stack-summary synthesis receipt before supporting facts.",
        "- Participation Quality must include participation plus authorship/source breadth as a trust layer.",
        "- Date wording must distinguish reviewed payload date from latest available price value.",
        "- Internal SETA labels must be translated into public-facing consequences.",
        "- No advisory, predictive, or overconfident language.",
        "",
        "## Cases",
        "",
    ]
    for record in records:
        lines.extend(
            [
                f"### {record['candidate_id']}",
                "",
                f"- Asset: {record['asset']}",
                f"- Mode: {record['mode']}",
                f"- Frequency/range: {record['frequency']} {record['display_range']}",
                f"- As of: {record['as_of']}",
                f"- Candidate output: `{record['candidate_output_path']}`",
                "",
            ]
        )
    path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample-packet", help="Existing sample_review_packet.json. Defaults to building a fresh default sample packet.")
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Output directory. Defaults to briefing_outputs/ai_candidate_pack_<UTC stamp>.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve() if args.output_dir else ROOT / "briefing_outputs" / f"ai_candidate_pack_{utc_stamp()}"
    output_dir.mkdir(parents=True, exist_ok=True)
    sample_packet_path = resolve_packet_path(args.sample_packet, output_dir)
    packet = load_json(sample_packet_path)
    rows = [row for row in packet.get("rows") or [] if not row.get("validation_errors")]
    records = [prompt_record(row) for row in rows]
    write_jsonl(output_dir / "ai_candidate_prompts.jsonl", records)
    write_markdown_pack(output_dir / "ai_candidate_prompt_pack.md", records, sample_packet_path)
    candidate_dir = output_dir / "candidate_outputs"
    candidate_dir.mkdir(exist_ok=True)
    (candidate_dir / "README.md").write_text(
        "Place AI-generated candidate JSON files here using the names listed in ai_candidate_prompt_pack.md.\n",
        encoding="utf-8",
    )
    write_json(
        output_dir / "ai_candidate_prompt_pack_manifest.json",
        {
            "schema_version": "ai_briefing_candidate_prompt_pack_v1",
            "sample_packet_path": path_label(sample_packet_path),
            "prompt_count": len(records),
            "prompt_jsonl": "ai_candidate_prompts.jsonl",
            "candidate_output_dir": "candidate_outputs",
        },
    )
    print(f"[OK] wrote {output_dir / 'ai_candidate_prompts.jsonl'}")
    print(f"[OK] prompt count: {len(records)}")
    return 0 if records else 1


if __name__ == "__main__":
    raise SystemExit(main())
