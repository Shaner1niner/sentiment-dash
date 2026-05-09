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


def build_summary(briefing_input: dict[str, Any]) -> str:
    asset = briefing_input["asset"]
    overlap = briefing_input.get("overlap_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    attention = briefing_input.get("attention_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    return (
        f"{asset} shows {clean_text(overlap.get('overlap_event_type'))} with "
        f"{clean_text(sentiment.get('sentiment_state'))} sentiment, "
        f"{clean_text(attention.get('attention_label')).lower()} attention, and "
        f"{clean_text(breadth.get('source_breadth_label')).lower()} source breadth."
    )


def build_evidence(briefing_input: dict[str, Any]) -> list[str]:
    price = briefing_input.get("price_context") or {}
    overlap = briefing_input.get("overlap_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    attention = briefing_input.get("attention_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    indicators = briefing_input.get("indicator_context") or {}
    event = briefing_input.get("event_context") or {}
    close_label = "Latest available close" if price.get("price_data_lagged") else "Latest close"
    close_date = clean_text(price.get("latest_close_date"), "")
    close_date_text = f" from {close_date}" if price.get("price_data_lagged") and close_date else ""
    evidence = [
        (
            f"{close_label} is {compact_number(price.get('latest_close'))}{close_date_text}; "
            f"recent visible direction is {clean_text(price.get('recent_direction_label')).lower()} "
            f"with {clean_text(price.get('volume_confirmation')).lower()}."
        ),
        (
            f"Overlap context is {clean_text(overlap.get('overlap_state'))}; "
            f"structure reads {clean_text(overlap.get('structure_label'))}."
        ),
        (
            f"Sentiment context is {clean_text(sentiment.get('sentiment_state'))}; "
            f"primary setup is {clean_text(sentiment.get('primary_archetype'))}."
        ),
        (
            f"Attention is {clean_text(attention.get('attention_label')).lower()} "
            f"with {clean_text(attention.get('attention_regime_label')).lower()}."
        ),
        (
            f"Timing context: {clean_text(indicators.get('macd_label'))}; "
            f"{clean_text(indicators.get('rsi_label'))}."
        ),
    ]
    if breadth.get("source_breadth_label"):
        evidence[3] += f" Source breadth is {clean_text(breadth.get('source_breadth_label')).lower()}."
    if event.get("latest_event_tier") or event.get("latest_confirmed_event_date"):
        evidence[1] += (
            f" Latest event is {clean_text(event.get('latest_event_tier'))}"
            f" on {clean_text(event.get('latest_event_date'))}."
        )
    return evidence[:5]


def build_watch_item(briefing_input: dict[str, Any]) -> str:
    event = briefing_input.get("event_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    price = briefing_input.get("price_context") or {}
    risk = sentiment.get("archetype_risk_note")
    if risk:
        return sentence(risk)
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
    attention = briefing_input.get("attention_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    indicators = briefing_input.get("indicator_context") or {}
    summary = build_summary(briefing_input)
    breadth_label = clean_text(breadth.get("source_breadth_label"), "Source Limited")
    breadth_score = breadth.get("source_breadth_score")
    breadth_score_text = "" if breadth_score is None else f" ({compact_number(breadth_score)})"
    return {
        "schema_version": "ai_briefing_output_v1",
        "asset": asset,
        "frequency": frequency,
        "as_of": as_of,
        "headline": f"{asset} SETA briefing: {clean_text(overlap.get('overlap_event_type'))}"[:90],
        "summary": summary,
        "what_seta_sees": (
            f"SETA sees {clean_text(overlap.get('overlap_state'))} with "
            f"{clean_text(overlap.get('structure_label'))} structure and "
            f"{clean_text(indicators.get('macd_label')).lower()} timing context."
        ),
        "why_it_matters": (
            f"{clean_text(attention.get('attention_label'))} attention and "
            f"{clean_text(attention.get('attention_regime_label')).lower()} describe participation context, "
            "while price and overlap structure remain the evidence base."
        ),
        "evidence": build_evidence(briefing_input),
        "trust_check": (
            f"Source breadth is {breadth_label}{breadth_score_text}. "
            f"{clean_text(breadth.get('interpretation'))} "
            f"{clean_text(breadth.get('source_caveat'))}"
        ),
        "watch_item": build_watch_item(briefing_input),
        "limitations": (
            "This draft uses only structured SETA payload fields. Source coverage, X sampling, "
            "news repetition, and stale upstream data can limit confidence."
        ),
        "public_safe_disclaimer": "Educational market context only; not investment advice.",
        "source_breadth_used": True,
        "review_status": "draft",
        "model_metadata": {
            "provider": "local",
            "model": "deterministic_template_v1",
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
