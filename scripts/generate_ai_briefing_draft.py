#!/usr/bin/env python
"""Generate a local draft SETA AI briefing output from structured input.

This is intentionally deterministic. It exercises the AI briefing workflow and
review/safety contract without calling an AI provider or touching the live
dashboard path.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from build_ai_briefing_input import build_input
from check_ai_briefing_output import validate_output

ROOT = Path(__file__).resolve().parents[1]


def clean_text(value: Any, fallback: str = "unavailable") -> str:
    text = str(value).strip() if value not in (None, "") else fallback
    text = re.sub(r"\s+", " ", text)
    return text


def sentence(value: Any, fallback: str = "Context is unavailable.") -> str:
    text = clean_text(value, fallback)
    if text[-1:] not in ".!?":
        text += "."
    return text


def public_safe_sentence(value: Any, fallback: str = "Context is unavailable.") -> str:
    text = sentence(value, fallback)
    text = re.sub(r"\brisk/reward\b", "signal freshness", text, flags=re.I)
    text = re.sub(r"\bless favorable\b", "less clear", text, flags=re.I)
    return text


def compact_number(value: Any) -> str:
    try:
        n = float(value)
    except (TypeError, ValueError):
        return "n/a"
    if abs(n) >= 1000:
        return f"{n:,.0f}"
    if abs(n) >= 100:
        return f"{n:.0f}"
    if abs(n) >= 10:
        return f"{n:.1f}"
    return f"{n:.2f}"


def output_path_for(briefing_input: dict[str, Any], output_dir: Path) -> Path:
    asset = clean_text(briefing_input.get("asset"), "asset").lower()
    freq = clean_text(briefing_input.get("frequency"), "freq").lower()
    display_range = clean_text(briefing_input.get("display_range"), "range").lower()
    mode = clean_text(briefing_input.get("mode"), "mode").lower()
    as_of = clean_text(briefing_input.get("as_of"), "asof").replace("-", "")
    return output_dir / f"{asset}_{freq}_{display_range}_{mode}_{as_of}_draft.json"


def overlap_read_label(overlap: dict[str, Any]) -> str:
    state = clean_text(overlap.get("overlap_state"))
    event_type = clean_text(overlap.get("overlap_event_type"))
    state_l = state.lower()
    event_l = event_type.lower()
    if "bullish pressure" in state_l and "bearish" in event_l:
        return "Bullish Pressure, Bearish Watch"
    if "bearish pressure" in state_l and "bullish" in event_l:
        return "Bearish Pressure, Bullish Watch"
    return event_type


def overlap_zone_sentence(overlap: dict[str, Any]) -> str:
    """Translate internal overlap state into public shared-zone language."""
    state = clean_text(overlap.get("overlap_state"), "")
    label = overlap_read_label(overlap)
    combined = f"{state} {label}".lower()

    if "inactive" in combined:
        return "Price is not currently outside the shared price/sentiment zone."
    if "pressure active" in combined:
        return "Price is outside the shared price/sentiment zone."
    if "watch" in combined:
        return "SETA is watching whether price remains outside or returns toward the shared price/sentiment zone."
    return "SETA compares price behavior against the shared price/sentiment zone."


def overlap_definition_sentence() -> str:
    return "Overlap is the shared zone where price bands and sentiment bands agree."


def timing_definition_sentence() -> str:
    return "Timing context means whether indicators confirm, weaken, or conflict with the setup."


def structure_label(overlap: dict[str, Any]) -> str:
    return clean_text(overlap.get("structure_label"), "structure unavailable")


def timing_context_label(indicators: dict[str, Any]) -> str:
    macd = clean_text(indicators.get("macd_label"), "")
    rsi = clean_text(indicators.get("rsi_label"), "")
    parts = [part for part in [macd, rsi] if part and part != "unavailable"]
    if not parts:
        return "timing unavailable"
    return "; ".join(parts)


def build_summary(briefing_input: dict[str, Any]) -> str:
    asset = briefing_input["asset"]
    overlap = briefing_input.get("overlap_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    attention = briefing_input.get("attention_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}

    return (
        f"{asset} shows the {overlap_read_label(overlap).lower()} setup with "
        f"{clean_text(sentiment.get('sentiment_state')).lower()} sentiment, "
        f"{clean_text(attention.get('attention_label')).lower()} attention, and "
        f"{clean_text(breadth.get('source_breadth_label')).lower()} source breadth."
    )


def build_what_seta_sees(briefing_input: dict[str, Any]) -> str:
    overlap = briefing_input.get("overlap_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    primary = overlap_read_label(overlap)
    structure = structure_label(overlap)
    timing = timing_context_label(indicators)

    return (
        f"Primary read: {primary}. "
        f"{overlap_zone_sentence(overlap)} "
        f"Structure reads {structure}, while timing context reads {timing}."
    )


def build_why_it_matters(briefing_input: dict[str, Any]) -> str:
    overlap = briefing_input.get("overlap_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    quality = briefing_input.get("participation_quality") or {}

    primary = overlap_read_label(overlap)
    zone = overlap_zone_sentence(overlap)
    structure = structure_label(overlap)
    timing = timing_context_label(indicators)
    implication = read_implication_label(primary, zone, structure, timing)
    quality_note = clean_text(quality.get("public_note"), "")

    if implication == "outside-zone condition":
        base = "This matters because price is outside the shared zone, so SETA treats the move as a potential price/sentiment dislocation."
    elif implication == "watch condition":
        base = "This matters because SETA is watching whether the move returns inside the shared zone or develops stronger confirmation."
    elif implication == "mixed constructive structure":
        base = "This matters because structure is constructive, but timing has not confirmed it, keeping the read mixed rather than decisive."
    elif implication == "mixed defensive structure":
        base = "This matters because timing is improving against a weaker structure, so confirmation still needs more support."
    elif implication == "low-escalation context":
        base = "This matters because the setup is low-escalation: useful context, but not a strong participation-driven move."
    else:
        base = "This matters because SETA is separating structure, timing, and participation before assigning confidence."

    return " ".join(part for part in [base, "Timing context shows whether indicators align or conflict with the setup.", quality_note] if part)


def read_implication_label(primary: str, zone: str, structure: str, timing: str) -> str:
    combined = f"{primary} {zone} {structure} {timing}".lower()
    if "outside" in zone.lower() or "pressure" in combined:
        return "outside-zone condition"
    if "watch" in combined:
        return "watch condition"
    if "bullish" in structure.lower() and "bearish" in timing.lower():
        return "mixed constructive structure"
    if "bearish" in structure.lower() and "bullish" in timing.lower():
        return "mixed defensive structure"
    if "quiet" in combined or "neutral" in combined:
        return "low-escalation context"
    return "layered SETA context"


def build_evidence_receipts(briefing_input: dict[str, Any]) -> list[str]:
    price = briefing_input.get("price_context") or {}
    overlap = briefing_input.get("overlap_context") or {}
    attention = briefing_input.get("attention_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    event = briefing_input.get("event_context") or {}

    close_label = "Latest available close" if price.get("price_data_lagged") else "Latest close"
    close_date = clean_text(price.get("latest_close_date"), "")
    close_date_text = f" ({close_date})" if close_date else ""

    receipts = [
        f"{close_label}: {compact_number(price.get('latest_close'))}{close_date_text}.",
        f"Shared zone: {clean_text(overlap.get('overlap_state'))}.",
        f"Structure: {clean_text(overlap.get('structure_label'))}.",
        f"Timing: {clean_text(indicators.get('macd_label'))}; {clean_text(indicators.get('rsi_label'))}.",
        f"Participation: {clean_text(attention.get('attention_label'))}; volume is {clean_text(price.get('volume_confirmation')).lower()}.",
    ]

    if event.get("latest_event_tier") or event.get("latest_confirmed_event_date"):
        receipts[1] += f" Latest event: {clean_text(event.get('latest_event_tier'))} on {clean_text(event.get('latest_event_date'))}."

    return receipts[:5]


def build_evidence(briefing_input: dict[str, Any]) -> list[str]:
    return build_evidence_receipts(briefing_input)


def public_breadth_caveat(breadth: dict[str, Any]) -> str:
    label = clean_text(breadth.get("source_breadth_label"), "").lower()
    confidence = clean_text(
        breadth.get("source_breadth_confidence")
        or breadth.get("confidence")
        or breadth.get("source_confidence"),
        "",
    ).lower()

    if "source limited" in label or "narrow" in label or "limited" in confidence or "low" in confidence:
        return "Confidence is qualified by available source coverage."
    return ""


def build_trust_check(briefing_input: dict[str, Any]) -> str:
    participation = briefing_input.get("participation_trend") or {}
    breadth_trend = briefing_input.get("authorship_breadth_trend") or {}
    quality = briefing_input.get("participation_quality") or {}
    breadth = briefing_input.get("breadth_trust") or {}

    participation_note = clean_text(participation.get("public_note"), "")
    breadth_note = clean_text(breadth_trend.get("public_note") or breadth.get("source_breadth_public_note"), "")
    quality_note = clean_text(quality.get("public_note"), "")
    quality_label = clean_text(quality.get("label"), "Participation quality")

    return " ".join(
        part
        for part in [
            f"{quality_label}.",
            participation_note,
            breadth_note,
            quality_note,
            "Participation quality is a trust layer, not a standalone demand signal.",
        ]
        if part
    )


def build_watch_item(briefing_input: dict[str, Any]) -> str:
    event = briefing_input.get("event_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    price = briefing_input.get("price_context") or {}
    risk = sentiment.get("archetype_risk_note")
    if risk:
        return public_safe_sentence(risk)
    confirmation = price.get("price_confirmation")
    if confirmation:
        return f"Watch whether {clean_text(confirmation).lower()} context gains structure and follow-through."
    if event.get("no_visible_events"):
        return "Watch for a fresh confirmed or watch event before upgrading the read."
    return "Watch for confirmation from structure, volume, and follow-through."


def generate_draft(briefing_input: dict[str, Any]) -> dict[str, Any]:
    asset = briefing_input["asset"]
    frequency = briefing_input["frequency"]
    as_of = briefing_input["as_of"]
    overlap = briefing_input.get("overlap_context") or {}
    summary = build_summary(briefing_input)

    return {
        "schema_version": "ai_briefing_output_v1",
        "asset": asset,
        "frequency": frequency,
        "as_of": as_of,
        "headline": f"{asset} SETA briefing: {overlap_read_label(overlap)}"[:90],
        "summary": summary,
        "what_seta_sees": build_what_seta_sees(briefing_input),
        "why_it_matters": build_why_it_matters(briefing_input),
        "evidence": build_evidence(briefing_input),
        "trust_check": build_trust_check(briefing_input),
        "watch_item": build_watch_item(briefing_input),
        "limitations": (
            "This draft uses only structured SETA payload fields. Source coverage and stale upstream data "
            "can limit confidence."
        ),
        "public_safe_disclaimer": "Educational market context only; not investment advice.",
        "source_breadth_used": True,
        "review_status": "draft",
        "model_metadata": {
            "provider": "local",
            "model": "deterministic_template_v2",
            "prompt_version": "seta_briefing_prompt_v1",
        },
        "reference_guidance_used": bool((briefing_input.get("reference_guidance") or {}).get("definitions")),
    }


def load_input(args: argparse.Namespace) -> dict[str, Any]:
    if args.input:
        data = json.loads(Path(args.input).read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Input JSON root must be an object")
        return data
    return build_input(args.mode, args.asset, args.frequency, args.display_range)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", help="Existing ai_briefing_input_v1 JSON file.")
    parser.add_argument("--mode", choices=["public", "member"], default="public")
    parser.add_argument("--asset", default="BTC")
    parser.add_argument("--frequency", choices=["D", "W"], default="D")
    parser.add_argument("--display-range", default="3M")
    parser.add_argument("--output", help="Optional output JSON file. Defaults to briefing_outputs/<slug>.json.")
    parser.add_argument("--output-dir", default="briefing_outputs", help="Default output directory when --output is omitted.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    briefing_input = load_input(args)
    draft = generate_draft(briefing_input)
    errors = validate_output(draft, briefing_input)
    if errors:
        for error in errors:
            print(f"[ERROR] {error}")
        return 1
    output = Path(args.output) if args.output else output_path_for(briefing_input, ROOT / args.output_dir)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(draft, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"[OK] wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

