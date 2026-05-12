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
from build_ai_briefing_semantic_state import build_semantic_state
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


def combined_context_text(briefing_input: dict[str, Any]) -> str:
    overlap = briefing_input.get("overlap_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    event = briefing_input.get("event_context") or {}
    parts = [
        overlap.get("dashboard_summary_label"),
        overlap.get("overlap_state"),
        overlap.get("overlap_event_type"),
        (overlap.get("latest_confirmed") or {}).get("summary") if isinstance(overlap.get("latest_confirmed"), dict) else None,
        (overlap.get("latest_confirmed") or {}).get("direction") if isinstance(overlap.get("latest_confirmed"), dict) else None,
        indicators.get("bollinger_label"),
        sentiment.get("primary_archetype"),
        sentiment.get("secondary_archetype"),
        sentiment.get("archetype_summary"),
        event.get("latest_event_tier"),
        event.get("latest_event_direction"),
        event.get("latest_confirmed_event_direction"),
        event.get("screener_reason_summary"),
    ]
    return " ".join(clean_text(part, "") for part in parts if part not in (None, "")).lower()


def semantic_state_for(briefing_input: dict[str, Any]) -> dict[str, Any]:
    # Return cached SETA semantic state for this briefing input.
    # The semantic helper is deterministic/local and owns the primary market-state
    # judgment. The generator consumes it for prose without changing the output
    # schema.
    cached = briefing_input.get("_semantic_state")
    if isinstance(cached, dict):
        return cached
    semantic = build_semantic_state(briefing_input)
    briefing_input["_semantic_state"] = semantic
    return semantic


def semantic_decision_for(briefing_input: dict[str, Any]) -> dict[str, Any]:
    return semantic_state_for(briefing_input).get("semantic_decision") or {}


def semantic_participation_for(briefing_input: dict[str, Any]) -> dict[str, Any]:
    return semantic_state_for(briefing_input).get("participation") or {}


def semantic_timing_for(briefing_input: dict[str, Any]) -> dict[str, Any]:
    return semantic_state_for(briefing_input).get("timing") or {}


def human_counter_signal(value: Any) -> str:
    text = clean_text(value, "")
    mapping = {
        "bearish_rejection_counter_signal": "the outside-zone extension did not persist",
        "bullish_repair_counter_signal": "the opposite-side pressure response keeps confirmation qualified",
        "inactive_overlap_limiter": "shared-zone confirmation is inactive",
        "latest_rejection_context": "recent range return keeps confirmation qualified",
        "constructive_rsi_counter_signal": "constructive internal strength tempers the bearish read",
        "weak_structure_counter_signal": "weaker structure keeps confirmation incomplete",
        "price_strength_or_extension": "price strength and extension keep exhaustion risk contextual",
        "data_quality_limiter": "data quality limits confidence",
    }
    return mapping.get(text, text.replace("_", " ") if text else "")

def confidence_phrase(value: Any) -> str:
    text = clean_text(value, "").lower()
    mapping = {
        "qualified_confirmation": "the read stays qualified rather than decisive",
        "participation_supported": "participation supports the setup, but does not prove it",
        "warning_context": "the setup is better treated as warning context than validation",
        "watch_condition": "the setup remains in watch mode",
        "timing_led": "the read is led by the technical stack because overlap confirmation is inactive",
        "measured": "confidence remains measured",
        "source_qualified": "source concentration keeps confidence qualified",
        "data_limited": "data quality limits confidence",
        "qualified": "confidence remains qualified",
    }
    return mapping.get(text, "confidence remains measured")

def first_upper(value: Any) -> str:
    text = clean_text(value, "")
    return text[:1].upper() + text[1:] if text else ""


def lower_phrase(value: Any) -> str:
    return clean_text(value, "").strip().lower()


def sentence_once(parts: list[str]) -> str:
    seen: set[str] = set()
    out: list[str] = []
    for part in parts:
        item = clean_text(part, "")
        if not item:
            continue
        key = lower_phrase(item).strip(" .")
        if key in seen:
            continue
        seen.add(key)
        if item[-1:] not in ".!?":
            item += "."
        out.append(item)
    return " ".join(out)


def contains_meaning(haystack: str, phrase: str) -> bool:
    h = lower_phrase(haystack)
    p = lower_phrase(phrase).strip(" .")
    if not p:
        return True
    if p in h:
        return True
    # Handle the common duplicate where one sentence says "inactive" and
    # another says "shared-zone confirmation is inactive".
    if "shared-zone confirmation is inactive" in p and "shared-zone confirmation is inactive" in h:
        return True
    if "bearish rejection" in p and "bearish rejection" in h:
        return True
    if "latest rejection" in p and "rejection" in h:
        return True
    return False


def participation_market_phrase(participation: dict[str, Any]) -> str:
    role = clean_text(participation.get("role"), "")
    role_label = clean_text(participation.get("role_label"), "")
    state = clean_text(participation.get("state"), "")
    breadth = clean_text(participation.get("breadth_state"), "")
    attention = clean_text(participation.get("attention_level"), "")

    if role == "warning_context":
        return "participation is acting as a warning context rather than validation"
    if role == "early_repair_probe":
        return "participation is probing repair, but confirmation is still incomplete"
    if role == "narrow_source_risk":
        return "participation is visible but concentrated"
    if role == "confidence_limiter":
        return "quiet participation keeps confirmation limited"
    if role == "confirmer":
        return "participation supports the pressure context without proving it"
    if role == "source_breadth_stabilizer":
        if "quiet" in state.lower() or attention.lower() == "quiet":
            return "participation is quiet but broadly sourced"
        return "participation is broadly sourced"
    if role_label:
        return role_label
    if breadth == "broad_stable":
        return "participation is broadly sourced"
    return "participation remains contextual"


def optional_ribbon_phrase(value: Any) -> str:
    text = clean_text(value, "").strip().lower()
    if not text or text in {"unavailable", "ribbon unavailable", "ribbon context unavailable"}:
        return ""
    if "unavailable" in text:
        return ""
    return f"with {text} ribbon context"


def public_primary_label(value: Any) -> str:
    # Translate internal semantic primary labels into public briefing language.
    # This is intentionally narrow. Broad cleanup belongs only in
    # public_briefing_text() as a defensive leak backstop.
    text = display_label(value)
    replacements = {
        "Bearish timing pressure with mixed RSI": "Bearish technical pressure with mixed internal strength",
        "Bearish timing pressure with constructive RSI": "Bearish technical pressure with constructive internal strength",
        "Bearish timing pressure with weak RSI": "Bearish technical pressure with weak internal strength",
        "Bullish timing pressure with mixed RSI": "Bullish technical pressure with mixed internal strength",
        "Bullish timing pressure with constructive RSI": "Bullish technical pressure with constructive internal strength",
        "Bullish timing pressure with weak RSI": "Bullish technical pressure with weak internal strength",
        "bearish timing pressure with mixed RSI": "bearish technical pressure with mixed internal strength",
        "bearish timing pressure with constructive RSI": "bearish technical pressure with constructive internal strength",
        "bullish timing pressure with mixed RSI": "bullish technical pressure with mixed internal strength",
        "bullish timing pressure with constructive RSI": "bullish technical pressure with constructive internal strength",
        "bearish timing with mixed RSI": "bearish technical pressure with mixed internal strength",
        "bullish timing with mixed RSI": "bullish technical pressure with mixed internal strength",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def technical_stack_label(indicators: dict[str, Any]) -> str:
    # Summarize MACD, RSI, histogram, and Stoch RSI in expert public language.
    macd_raw = clean_text(indicators.get("macd_label"), "").lower()
    rsi_raw = clean_text(indicators.get("rsi_label"), "").lower()
    hist = indicators.get("macd_histogram")
    stoch = indicators.get("stoch_rsi")
    parts: list[str] = []

    if "negative divergence" in macd_raw or "narrative weakening" in macd_raw:
        parts.append("trend-momentum is weakening")
    elif "positive divergence" in macd_raw or "sentiment repair" in macd_raw:
        parts.append("trend-momentum is repairing")
    elif "bearish" in macd_raw:
        parts.append("trend-momentum is bearish")
    elif "bullish" in macd_raw:
        parts.append("trend-momentum is constructive")
    elif macd_raw:
        parts.append(translate_label(indicators.get("macd_label"), ""))

    if "constructive" in rsi_raw or "strong" in rsi_raw:
        parts.append("internal strength remains constructive")
    elif "mixed" in rsi_raw or "neutral" in rsi_raw:
        parts.append("internal strength is mixed")
    elif "weak" in rsi_raw:
        parts.append("internal strength is weak")
    elif rsi_raw:
        parts.append(translate_label(indicators.get("rsi_label"), ""))

    hist_n = None
    try:
        hist_n = float(hist)
    except (TypeError, ValueError):
        pass
    if hist_n is not None:
        if hist_n > 0:
            parts.append("MACD impulse is positive")
        elif hist_n < 0:
            parts.append("MACD impulse is negative")

    stoch_n = None
    try:
        stoch_n = float(stoch)
    except (TypeError, ValueError):
        pass
    if stoch_n is not None:
        if stoch_n >= 80:
            parts.append("short-term extension is elevated")
        elif stoch_n <= 20:
            parts.append("short-term momentum is washed out")
        else:
            parts.append("short-term extension is mid-range")

    if not parts:
        return "technical context unavailable"
    return "; ".join(parts)


def overlap_zone_sentence_from_input(briefing_input: dict[str, Any]) -> str:
    # Translate overlap/pressure state into public shared-zone language.
    combined = combined_context_text(briefing_input)

    has_confirmed = bool(re.search(r"\bconfirmed\b", combined)) and not bool(re.search(r"\bunconfirmed\b", combined))
    has_bullish_pressure = "bullish pressure" in combined
    has_bearish_pressure = "bearish pressure" in combined
    has_rejection = "rejection" in combined
    has_repair = "repair" in combined
    has_bearish_context = bool(re.search(r"\bbearish\b", combined))
    has_bullish_context = bool(re.search(r"\bbullish\b", combined))

    if has_bullish_pressure and has_bearish_context and not has_confirmed:
        return "Price briefly moved outside the shared price/sentiment range, then rotated back toward that range; bullish pressure remains unconfirmed."
    if has_bearish_pressure and has_bullish_context and not has_confirmed:
        return "Price briefly moved outside the shared price/sentiment range, then rotated back toward that range; bearish pressure remains unconfirmed."

    if has_confirmed and has_bearish_pressure:
        return "Price is above the shared price/sentiment zone, creating confirmed bearish pressure."
    if has_confirmed and has_bullish_pressure:
        return "Price is below the shared price/sentiment zone, creating confirmed bullish pressure."

    if has_bearish_pressure:
        return "Price is above the shared price/sentiment zone, creating bearish pressure / exhaustion context."
    if has_bullish_pressure:
        return "Price is below the shared price/sentiment zone, creating bullish pressure / reversion context."

    if "outside" in combined or "pressure active" in combined:
        return "Price is outside the shared price/sentiment zone, but confirmation is incomplete."
    if has_rejection or has_repair:
        return "Shared-zone confirmation is not cleanly active; recent range return keeps confirmation qualified."
    if "watch" in combined:
        return "Price is near a shared-zone decision point, but confirmation is incomplete."
    if "inactive" in combined:
        return "Shared-zone confirmation is inactive; technical evidence carries more weight than overlap confirmation."
    return "SETA compares price behavior against the shared price/sentiment zone."

def overlap_zone_sentence(overlap: dict[str, Any]) -> str:
    """Backward-compatible wrapper for older callers."""
    return overlap_zone_sentence_from_input({"overlap_context": overlap})


def overlap_definition_sentence() -> str:
    return "Overlap is the shared zone where price bands and sentiment bands agree."


def timing_definition_sentence() -> str:
    return "Technical context means whether MACD, RSI, Stoch RSI, and related indicators confirm, weaken, or conflict with the setup."


LABEL_TRANSLATIONS = [
    (re.compile(r"\bNone\s+Inside\b", re.I), "no active inside-zone confirmation"),
    (re.compile(r"\bQuiet\s*/\s*Ignore\b", re.I), "low-intensity movement that does not raise confidence by itself"),
    (re.compile(r"\bCompression\s+Coil\b", re.I), "sentiment momentum is compressing rather than expanding"),
    (re.compile(r"\bCrowded\s+Bearish\s*/\s*Broad\b", re.I), "bearish participation appears broad across available sources"),
    (re.compile(r"\bFlat\s*/\s*Transition\b", re.I), "transitional rather than clearly directional"),
    (re.compile(r"\bNegative\s+Divergence\s*/\s*Narrative\s+Weakening\b", re.I), "negative divergence or narrative weakening flagged by the technical model"),
    (re.compile(r"\bPositive\s+Divergence\s*/\s*Sentiment\s+Repair\b", re.I), "positive divergence or sentiment repair flagged by the technical model"),
    (re.compile(r"\bRSI\s+Mixed\s*/\s*Neutral\b", re.I), "RSI is mixed/neutral"),
    (re.compile(r"\bRibbon\s+Neutral\s*/\s+Coiling\b", re.I), "sentiment ribbon is neutral and coiling"),
    (re.compile(r"\bquality\s+score\b", re.I), "event quality read"),
]
def translate_label(value: Any, fallback: str = "unavailable") -> str:
    text = clean_text(value, fallback)
    for pattern, replacement in LABEL_TRANSLATIONS:
        text = pattern.sub(replacement, text)
    return text


def display_label(value: Any) -> str:
    text = clean_text(value, "")
    text = re.sub(r"\brsi\b", "RSI", text, flags=re.I)
    text = re.sub(r"\bmacd\b", "MACD", text, flags=re.I)
    text = re.sub(r"\bseta\b", "SETA", text, flags=re.I)
    return text


def lower_first_label(value: Any) -> str:
    text = display_label(value)
    if not text:
        return text
    return text[:1].lower() + text[1:]

def volume_phrase(value: Any) -> str:
    text = clean_text(value, "unavailable").lower()
    if text == "normal volume":
        return "normal"
    if text == "high volume":
        return "high"
    return text


def structure_label(overlap: dict[str, Any]) -> str:
    return translate_label(overlap.get("structure_label"), "structure unavailable")


def timing_context_label(indicators: dict[str, Any]) -> str:
    return technical_stack_label(indicators)


def primary_read_label(briefing_input: dict[str, Any]) -> str:
    semantic_label = public_primary_label(semantic_decision_for(briefing_input).get("primary_label"))
    if semantic_label:
        return semantic_label

    overlap = briefing_input.get("overlap_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    event = briefing_input.get("event_context") or {}

    asset = clean_text(briefing_input.get("asset"), "")
    context = combined_context_text(briefing_input)

    def polish(value: Any) -> str:
        text = translate_label(value, "")
        text = re.sub(r"\s+", " ", text).strip(" .")
        text = re.sub(r"\brsi\b", "RSI", text, flags=re.I)
        text = re.sub(r"\bmacd\b", "MACD", text, flags=re.I)
        text = re.sub(r"\bseta\b", "SETA", text, flags=re.I)
        if asset:
            text = re.sub(r"^" + re.escape(asset) + r"\s+shows\s+", "", text, flags=re.I).strip()
        return public_primary_label(text)

    def rsi_phrase() -> str:
        rsi = clean_text(indicators.get("rsi_label"), "").lower()
        if "constructive" in rsi or "strong" in rsi:
            return "constructive internal strength"
        if "weak" in rsi:
            return "weak internal strength"
        if "mixed" in rsi or "neutral" in rsi:
            return "mixed internal strength"
        return "mixed confirmation"

    if "strong bearish" in context:
        return "Strong Bearish SETA risk state"
    if "strong bullish" in context:
        return "Strong Bullish SETA opportunity state"

    if "bullish pressure" in context and ("bearish" in context or "rejection" in context):
        return "Unconfirmed bullish pressure with bearish rejection risk"
    if "bearish pressure" in context and ("bullish" in context or "rejection" in context):
        return "Unconfirmed bearish pressure with counter-pressure risk"
    if "bearish pressure" in context:
        return "Bearish pressure"
    if "bullish pressure" in context:
        return "Bullish pressure"
    if "weakening sentiment momentum" in context and "price momentum is not yet fully broken" in context:
        return "Weakening sentiment momentum with price resilience"

    macd = clean_text(indicators.get("macd_label"), "").lower()
    if "bearish" in macd or "bearish" in context:
        return f"Bearish technical pressure with {rsi_phrase()}"
    if "bullish" in macd or "bullish" in context:
        return f"Bullish technical pressure with {rsi_phrase()}"

    for value in [
        sentiment.get("archetype_summary"),
        event.get("screener_reason_summary"),
        sentiment.get("primary_archetype"),
        overlap_read_label(overlap),
    ]:
        text = polish(value)
        if text:
            return text
    return "Layered SETA context"

def build_summary(briefing_input: dict[str, Any]) -> str:
    asset = briefing_input["asset"]
    sentiment = briefing_input.get("sentiment_context") or {}
    attention = briefing_input.get("attention_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    primary = lower_first_label(public_primary_label(primary_read_label(briefing_input)))
    sentiment_label = translate_label(sentiment.get("sentiment_state")).lower()
    attention_label = clean_text(attention.get("attention_label")).lower()
    breadth_label = clean_text(breadth.get("source_breadth_label")).lower()

    return (
        f"{asset} shows {primary}. "
        f"Sentiment is {sentiment_label}, attention is {attention_label}, "
        f"and source breadth is {breadth_label}."
    )


def build_what_seta_sees(briefing_input: dict[str, Any]) -> str:
    sentiment = briefing_input.get("sentiment_context") or {}
    semantic = semantic_state_for(briefing_input)
    decision = semantic.get("semantic_decision") or {}
    participation = semantic.get("participation") or {}
    event_state = semantic.get("event") or {}

    primary = public_primary_label(clean_text(decision.get("primary_label"), primary_read_label(briefing_input)))
    primary_state = clean_text(decision.get("primary_state"), "")
    zone = overlap_zone_sentence_from_input(briefing_input)
    technical = timing_context_label(briefing_input.get("indicator_context") or {})
    ribbon = clean_text(
        (semantic.get("ribbon") or {}).get("label"),
        translate_label(sentiment.get("ribbon_label") or sentiment.get("sentiment_state"), "ribbon unavailable"),
    )
    participation_phrase = participation_market_phrase(participation)
    counter_signal = human_counter_signal(decision.get("counter_signal"))
    event_note = clean_text(event_state.get("label"), "")

    if primary_state == "weakening_sentiment_price_resilience":
        opener = f"Primary read: {primary}. Price is holding up better than the sentiment/technical stack is confirming."
    elif primary_state.startswith("unconfirmed_"):
        opener = f"Primary read: {primary}. The pressure is visible, but the confirmation stack is still conflicted."
    elif primary_state.startswith("bearish_timing"):
        opener = f"Primary read: {primary}. The bearish read is technical-stack led rather than overlap-confirmed."
    else:
        opener = f"Primary read: {primary}."

    ribbon_phrase = optional_ribbon_phrase(ribbon)
    technical_sentence = f"The technical stack shows {technical}"
    if ribbon_phrase:
        technical_sentence += f", {ribbon_phrase}"
    technical_sentence += f", and {participation_phrase}"

    parts = [opener, zone]
    if counter_signal and not contains_meaning(" ".join(parts), counter_signal):
        parts.append(first_upper(counter_signal))
    parts.append(technical_sentence)
    if event_note and event_state.get("state") not in {"none", "event_unknown"} and not contains_meaning(" ".join(parts), event_note):
        parts.append(f"Latest event context is {event_note}")
    return sentence_once(parts)


def build_why_it_matters(briefing_input: dict[str, Any]) -> str:
    quality = briefing_input.get("participation_quality") or {}
    semantic = semantic_state_for(briefing_input)
    decision = semantic.get("semantic_decision") or {}
    pressure = semantic.get("pressure") or {}
    participation = semantic.get("participation") or {}

    primary = public_primary_label(clean_text(decision.get("primary_label"), primary_read_label(briefing_input)))
    primary_state = clean_text(decision.get("primary_state"), "")
    technical = timing_context_label(briefing_input.get("indicator_context") or {})
    confidence = confidence_phrase(decision.get("confidence_state"))
    participation_phrase = participation_market_phrase(participation)
    counter_signal = human_counter_signal(decision.get("counter_signal"))
    quality_note = clean_text(quality.get("public_note"), "")

    pressure_state = clean_text(pressure.get("state"), "")
    if primary_state == "weakening_sentiment_price_resilience":
        base = "This matters because price strength and sentiment confirmation are not moving with equal force."
    elif pressure_state.startswith("confirmed"):
        base = "This matters because shared-zone pressure is confirmed, so technical confirmation and participation quality become the key confidence checks."
    elif pressure_state.startswith("unconfirmed"):
        base = "This matters because pressure is visible, but the setup has not earned clean confirmation."
    elif decision.get("confidence_state") == "warning_context":
        base = "This matters because attention is functioning as a warning context, not as validation by itself."
    elif decision.get("confidence_state") == "timing_led":
        base = "This matters because the read is coming from the technical stack while shared-zone confirmation remains inactive."
    elif primary_state.startswith("bearish_timing"):
        base = "This matters because the bearish read is coming from technical pressure, not from a fully confirmed shared-zone break."
    else:
        base = "This matters because the asset is not giving a clean one-direction read across price, sentiment, technical confirmation, and participation."

    parts = [
        base,
        f"The primary read is {lower_first_label(primary)}, while the technical stack shows {technical}",
        f"{first_upper(confidence)}; {participation_phrase}",
    ]
    if counter_signal and not contains_meaning(" ".join(parts), counter_signal):
        parts.append(first_upper(counter_signal))
    if quality_note and "No participation surge is visible" not in quality_note:
        parts.append(quality_note)
    return sentence_once(parts)

def read_implication_label(primary: str, zone: str, structure: str, timing: str) -> str:
    combined = f"{primary} {zone} {structure} {timing}".lower()
    if "not currently outside" not in zone.lower() and ("outside" in zone.lower() or "pressure active" in combined):
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
    # Build factual receipt lines for the Evidence card.
    #
    # The Evidence card should not carry the narrative thesis. Interpretation
    # belongs in What SETA Sees and Why It Matters; this card should show the
    # underlying receipts that produced the read.
    price = briefing_input.get("price_context") or {}
    overlap = briefing_input.get("overlap_context") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    attention = briefing_input.get("attention_context") or {}
    indicators = briefing_input.get("indicator_context") or {}
    event = briefing_input.get("event_context") or {}

    close_date = clean_text(price.get("latest_close_date"), "")
    close_date_text = f" ({close_date})" if close_date else ""

    shared_state = translate_label(overlap.get("dashboard_summary_label") or overlap.get("overlap_state"))
    structure = structure_label(overlap)
    overlap_event = translate_label(overlap.get("overlap_event_type"), "")
    event_bits: list[str] = []
    if overlap_event:
        event_bits.append(f"overlap event is {overlap_event}")
    latest_confirmed = overlap.get("latest_confirmed")
    if isinstance(latest_confirmed, dict):
        confirmed_summary = clean_text(latest_confirmed.get("summary"), "")
        confirmed_date = clean_text(latest_confirmed.get("date"), "")
        if confirmed_summary:
            if confirmed_date:
                event_bits.append(f"latest confirmed context is {confirmed_summary} on {confirmed_date}")
            else:
                event_bits.append(f"latest confirmed context is {confirmed_summary}")
    event_clause = "; " + "; ".join(event_bits) if event_bits else ""

    participation = clean_text(attention.get("attention_label"))
    breadth_label = clean_text(breadth.get("source_breadth_label"), "unavailable")
    timing = timing_context_label(indicators)

    receipts = [
        f"Latest available close: {compact_number(price.get('latest_close'))}{close_date_text}.",
        f"Shared-zone receipt: {shared_state}; structure is {structure}{event_clause}.",
        f"Technical receipt: {timing}.",
        f"Participation receipt: attention is {participation.lower()}; source breadth is {breadth_label}; volume context is {volume_phrase(price.get('volume_confirmation'))}.",
    ]

    if event.get("latest_event_tier") or event.get("latest_confirmed_event_date"):
        event_tier = translate_label(event.get("latest_event_tier"), "event unavailable")
        event_direction = translate_label(event.get("latest_event_direction"), "")
        event_date = clean_text(event.get("latest_event_date"), "")
        direction_text = f" {event_direction}" if event_direction else ""
        date_text = f" on {event_date}" if event_date else ""
        receipts.append(f"Event receipt: latest visible event is {event_tier}{direction_text}{date_text}.")
    else:
        receipts.append("Event receipt: no fresh event in view.")

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
    participation_trend = briefing_input.get("participation_trend") or {}
    breadth_trend = briefing_input.get("authorship_breadth_trend") or {}
    quality = briefing_input.get("participation_quality") or {}
    breadth = briefing_input.get("breadth_trust") or {}
    semantic_participation = semantic_participation_for(briefing_input)

    participation_note = clean_text(participation_trend.get("public_note"), "")
    breadth_note = clean_text(breadth_trend.get("public_note") or breadth.get("source_breadth_public_note"), "")
    quality_label = clean_text(quality.get("label"), "Participation quality")
    role = clean_text(semantic_participation.get("role"), "")

    if role == "warning_context":
        semantic_note = "Attention is useful as a warning layer here, not as proof of validation."
    elif role == "early_repair_probe":
        semantic_note = "Participation is probing repair, but the setup still needs confirmation from structure or timing."
    elif role == "narrow_source_risk":
        semantic_note = "Visible participation is concentrated, so source breadth keeps confidence qualified."
    elif role == "confidence_limiter":
        semantic_note = "Participation is not forceful enough to confirm the pressure state."
    elif role == "confirmer":
        semantic_note = "Participation supports the pressure context, while still falling short of proof."
    elif role == "source_breadth_stabilizer":
        semantic_note = "The read is distributed rather than isolated, but breadth alone does not imply demand."
    else:
        semantic_note = participation_market_phrase(semantic_participation)

    return sentence_once([
        f"{quality_label}.",
        participation_note,
        breadth_note,
        semantic_note,
        "This keeps confidence tied to participation breadth and source coverage.",
    ])

def build_briefing_cards(briefing_input: dict[str, Any]) -> dict[str, Any]:
    """Build the canonical briefing-card contract.

    Top-level prose fields are compatibility mirrors of these cards.
    """
    return {
        "what_seta_sees": {
            "role": "Interpretation",
            "copy": build_what_seta_sees(briefing_input),
        },
        "why_it_matters": {
            "role": "Implication",
            "copy": build_why_it_matters(briefing_input),
        },
        "evidence": {
            "role": "Receipts",
            "items": build_evidence_receipts(briefing_input),
        },
        "participation_quality": {
            "role": "Trust check",
            "copy": build_trust_check(briefing_input),
        },
    }


def build_watch_item(briefing_input: dict[str, Any]) -> str:
    event = briefing_input.get("event_context") or {}
    sentiment = briefing_input.get("sentiment_context") or {}
    price = briefing_input.get("price_context") or {}
    semantic = semantic_state_for(briefing_input)
    decision = semantic.get("semantic_decision") or {}
    timing = semantic.get("timing") or {}
    pressure = semantic.get("pressure") or {}

    primary_state = clean_text(decision.get("primary_state"), "")
    counter_signal = clean_text(decision.get("counter_signal"), "")
    pressure_state = clean_text(pressure.get("state"), "")
    timing_state = clean_text(timing.get("state"), "")

    if "bearish_rejection" in counter_signal or (event.get("latest_event_tier") and "rejection" in clean_text(event.get("latest_event_tier"), "").lower()):
        return "Watch whether the range return becomes confirmed shared-zone pressure, or fades while the technical stack remains mixed."
    if pressure_state.startswith("unconfirmed"):
        return "Watch whether the pressure state gains confirmation from timing and participation, or fades back into a watch condition."
    if primary_state == "weakening_sentiment_price_resilience":
        return "Watch whether price resilience persists while sentiment momentum weakens, or whether participation starts confirming the divergence."
    if primary_state.startswith("bearish_timing") or "bearish" in timing_state:
        return "Watch whether bearish technical pressure broadens into shared-zone confirmation, or fades while internal strength remains mixed."

    risk = sentiment.get("archetype_risk_note")
    if risk:
        return public_safe_sentence(risk)
    confirmation = price.get("price_confirmation")
    if confirmation:
        return f"Watch whether {clean_text(confirmation).lower()} context gains structure and follow-through."
    if event.get("no_visible_events"):
        return "Watch for a fresh confirmed or watch event before upgrading the read."
    return "Watch for confirmation from structure, volume, and follow-through."


def public_briefing_text(value: Any) -> Any:
    # Defensive public-copy backstop. Phrase generation should happen in the
    # semantic/public phrase helpers above.
    if isinstance(value, dict):
        return {k: public_briefing_text(v) for k, v in value.items()}
    if isinstance(value, list):
        return [public_briefing_text(v) for v in value]
    if not isinstance(value, str):
        return value

    text = value
    leak_replacements = {
        "Recent zone return keeps confirmation qualified. ": "",
        " Recent zone return keeps confirmation qualified.": "",
        "Recent zone return keeps confirmation qualified.": "",
        "recent zone return keeps confirmation qualified. ": "",
        " recent zone return keeps confirmation qualified.": "",
        "recent zone return keeps confirmation qualified.": "",
        "ribbon context unavailable ribbon context": "",
        "Latest event context is Bearish rejection.": "Price briefly moved outside the shared price/sentiment range, then rotated back toward that range.",
        "Latest event context is Bearish rejection": "Price briefly moved outside the shared price/sentiment range, then rotated back toward that range",
        "latest rejection context remains relevant": "recent range return keeps confirmation qualified",
        "bearish rejection remains a counter-signal": "the outside-zone extension did not persist",
        "bullish counter-pressure remains a counter-signal": "the opposite-side pressure response keeps confirmation qualified",
        "range re-entry": "range return",
        "re-entry": "return",
        "timing stack": "technical stack",
        "Timing stack": "Technical stack",
        "timing pressure": "technical pressure",
        "Timing pressure": "Technical pressure",
        "timing evidence": "technical evidence",
        "Timing evidence": "Technical evidence",
        "timing-led": "technical-stack led",
        "Timing-led": "Technical-stack led",
        "mixed RSI": "mixed internal strength",
        "constructive RSI": "constructive internal strength",
        "technical stack is trend-momentum is": "technical stack shows trend-momentum is",
    }
    for old, new in leak_replacements.items():
        text = text.replace(old, new)

    text = re.sub(r",\s*,", ",", text)
    text = re.sub(r"\s+,", ",", text)
    text = re.sub(r",\s+and\s+\.", ".", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.replace(" ,", ",").replace(" .", ".").strip()

def generate_draft(briefing_input: dict[str, Any]) -> dict[str, Any]:
    asset = briefing_input["asset"]
    frequency = briefing_input["frequency"]
    as_of = briefing_input["as_of"]
    overlap = briefing_input.get("overlap_context") or {}
    summary = build_summary(briefing_input)
    briefing_cards = build_briefing_cards(briefing_input)

    draft = {
        "schema_version": "ai_briefing_output_v1",
        "asset": asset,
        "frequency": frequency,
        "as_of": as_of,
        "headline": f"{asset} SETA briefing: {public_primary_label(primary_read_label(briefing_input))}"[:90],
        "summary": summary,
        "what_seta_sees": briefing_cards["what_seta_sees"]["copy"],
        "why_it_matters": briefing_cards["why_it_matters"]["copy"],
        "evidence": briefing_cards["evidence"]["items"],
        "trust_check": briefing_cards["participation_quality"]["copy"],
        "briefing_cards": briefing_cards,
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
            "prompt_version": "seta_briefing_prompt_v2",
        },
        "reference_guidance_used": bool((briefing_input.get("reference_guidance") or {}).get("definitions")),
    }
    return draft


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
    draft = public_briefing_text(draft)
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


