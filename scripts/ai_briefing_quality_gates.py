#!/usr/bin/env python
"""Quality gates for SETA AI briefing drafts.

This module adapts the SETA reply-engine safety doctrine for dashboard
briefings. It is deterministic, local-only, and deliberately conservative.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Any

ADVISORY_PATTERNS = [
    (r"\bstrong\s+buy\b", "strong buy language"),
    (r"\bbuy\b", "buy language"),
    (r"\bsell\b", "sell language"),
    (r"\bhold\b", "hold language"),
    (r"\bprice\s+target\b", "price target language"),
    (r"\btarget\b", "target language"),
    (r"\bentry\b", "entry language"),
    (r"\bexit\b", "exit language"),
    (r"\blong this\b", "long-language / trade signal"),
    (r"\bshort this\b", "short-language / trade signal"),
    (r"\bshould\s+(enter|exit|buy|sell|hold)\b", "personalized action language"),
]

PREDICTION_PATTERNS = [
    (r"\bguaranteed\b", "guarantee language"),
    (r"\bthis means price will\b", "price forecast language"),
    (r"\bwill\s+(rally|rise|crash|fall|moon|surge|collapse|break)\b", "unsupported future claim"),
    (r"\bgoing to\b[^.]{0,80}\b(up|down|pump|dump|moon|crash|break|rally|fall)\b", "unsupported future claim"),
    (r"\bnext stop\b", "price path language"),
    (r"\bby next week\b", "timing prediction language"),
    (r"\bby tomorrow\b", "timing prediction language"),
]

INTERNAL_LANGUAGE_PATTERNS = [
    (r"\btf[- ]?idf\b", "internal TF-IDF language"),
    (r"\brankings?\b", "internal ranking language"),
    (r"\blifts?\b", "internal lift language"),
    (r"\bp[- ]?values?\b", "internal statistics language"),
    (r"\braw column\b", "raw column language"),
    (r"\bscore internals?\b", "score-internal language"),
    (r"\b[a-z]+_[a-z0-9_]+\b", "raw snake_case field name"),
    (r"\bentropy_norm\b", "internal column name"),
    (r"\bdominance_gap\b", "internal column name"),
    (r"\bflag_[a-z0-9_]+\b", "internal flag name"),
    (r"\b[a-z]+_[a-z0-9_]*_score\b", "raw score column name"),
    (r"\b(?:Route|Lens|TermCard|AnalystSourceCollision|SuppressedMatchedTerm)\s*=", "reply-engine debug label"),
]

OPAQUE_LABEL_PATTERNS = [
    (r"\bNone\s+Inside\b", "untranslated overlap label"),
    (r"\bQuiet\s*/\s*Ignore\b", "untranslated attention label"),
    (r"\bCompression\s+Coil\b", "untranslated compression label"),
    (r"\bCrowded\s+Bearish\s*/\s*Broad\b", "untranslated breadth label"),
    (r"\bFlat\s*/\s*Transition\b", "untranslated transition label"),
    (r"\bRejection\s+tier\b", "untranslated event-quality label"),
    (r"\bquality\s+score\b", "untranslated quality-score label"),
]

DATE_PRECISION_PATTERNS = [
    (r"\blatest\s+close\b(?!\s+(?:available|value))", "ambiguous latest-close wording"),
    (r"\bcurrent\s+close\b", "ambiguous current-close wording"),
    (r"\bfinal\s+close\b", "unsupported final-close wording"),
]

ATTENTION_MISUSE_PATTERNS = [
    (r"\battention\b[^.]{0,60}\b(adoption|adopted)\b", "attention treated as adoption"),
    (r"\battention\s*=\s*adoption\b", "attention treated as adoption"),
    (r"\battention\s+(is|equals|=)\s+validation\b", "attention treated as validation"),
    (r"\battention\b[^.]{0,60}\b(validates|confirms)\b", "attention treated as validation"),
    (r"\battention proves\b", "attention treated as proof"),
]

BREADTH_MISUSE_PATTERNS = [
    (r"\bbreadth\b[^.]{0,80}\bproves?\b", "breadth treated as proof"),
    (r"\bproves?\s+organic\s+demand\b", "overstated breadth claim"),
    (r"\borganic\s+demand\s+is\s+confirmed\b", "overstated organic-demand claim"),
]

HYPE_PATTERNS = [
    (r"\b100x\b", "hype language"),
    (r"\bmoon\b", "hype language"),
    (r"\bno brainer\b", "overcertainty language"),
    (r"\beveryone knows\b", "overcertainty language"),
    (r"\bthe alpha is\b", "alpha/trade framing"),
]

NUMERIC_METRIC_RE = re.compile(r"(?<![A-Za-z])[-+]?\d+(?:\.\d+)?\s*(?:%|x|/\d+)?")
CONFLICT_RESOLUTION_RE = re.compile(
    r"\b(?:but|while|although|mixed|contested|counter|conflict|limits?|caveat|not\s+clean|not\s+decisive|transition|measured|qualified)\b",
    re.IGNORECASE,
)
PARTICIPATION_DIRECTION_RE = re.compile(
    r"\b(?:quiet|normal|elevated|extreme|broad|moderate|narrow|rising|increasing|cooling|falling|stable|broadly\s+stable|broadening|narrowing|distributed|concentrated|source-limited|source\s+limited)\b",
    re.IGNORECASE,
)
TRUST_IMPLICATION_RE = re.compile(
    r"\b(?:trust|confidence|qualified|calibrated|reliable\s+(?:read|view)|usability|not\s+a\s+standalone|not\s+validation|source\s+coverage|measured\s+read)\b",
    re.IGNORECASE,
)
STACK_SYNTHESIS_RE = re.compile(r"\b(?:stack\s+summary|together|combined|combines|synthesis)\b", re.IGNORECASE)
STACK_COMPONENTS_RE = re.compile(r"\bprice\b.*\b(?:structure|backdrop)\b.*\b(?:timing|momentum|indicator)\b.*\bparticipation\b", re.IGNORECASE)


@dataclass
class BriefingGateResult:
    passed: bool = True
    hard_fail: bool = False
    needs_rewrite: bool = False
    warnings: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    def add_error(self, message: str) -> None:
        self.errors.append(message)
        self.passed = False
        self.hard_fail = True
        self.needs_rewrite = True

    def add_warning(self, message: str) -> None:
        self.warnings.append(message)
        if not self.hard_fail:
            self.needs_rewrite = True

    def merge(self, other: "BriefingGateResult") -> None:
        self.errors.extend(other.errors)
        self.warnings.extend(other.warnings)
        self.passed = self.passed and other.passed
        self.hard_fail = self.hard_fail or other.hard_fail
        self.needs_rewrite = self.needs_rewrite or other.needs_rewrite

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def count_visible_metrics(text: str) -> int:
    return len(NUMERIC_METRIC_RE.findall(str(text or "")))


def briefing_text_fields(output: dict[str, Any]) -> list[tuple[str, str]]:
    fields: list[tuple[str, str]] = []
    for key, value in output.items():
        if key in {"schema_version", "asset", "frequency", "as_of", "review_status", "public_safe_disclaimer", "model_metadata"}:
            continue
        if isinstance(value, str):
            fields.append((key, value))
        elif isinstance(value, list):
            for idx, item in enumerate(value):
                if isinstance(item, str):
                    fields.append((f"{key}[{idx}]", item))
    return fields


def _contains(text: str, pattern: str) -> bool:
    return bool(re.search(pattern, text, flags=re.IGNORECASE))


def _check_patterns(text: str, patterns: list[tuple[str, str]], field: str) -> list[str]:
    errors: list[str] = []
    for pattern, label in patterns:
        if _contains(text, pattern):
            errors.append(f"{field} contains forbidden {label}: {text!r}")
    return errors


def evaluate_public_briefing_text(output: dict[str, Any], *, max_visible_metrics: int = 3) -> BriefingGateResult:
    result = BriefingGateResult()
    combined_text = " ".join(value for _, value in briefing_text_fields(output))

    for field, value in briefing_text_fields(output):
        for pattern_set in [
            ADVISORY_PATTERNS,
            PREDICTION_PATTERNS,
            INTERNAL_LANGUAGE_PATTERNS,
            OPAQUE_LABEL_PATTERNS,
            DATE_PRECISION_PATTERNS,
            ATTENTION_MISUSE_PATTERNS,
            BREADTH_MISUSE_PATTERNS,
            HYPE_PATTERNS,
        ]:
            for error in _check_patterns(value, pattern_set, field):
                result.add_error(error)

    if count_visible_metrics(combined_text) > max_visible_metrics:
        result.add_warning(
            f"Visible metric budget exceeded: {count_visible_metrics(combined_text)} metrics found; "
            f"briefings should use at most {max_visible_metrics} prominent numeric receipts."
        )

    return result


def evaluate_structural_contract(output: dict[str, Any], briefing_input: dict[str, Any] | None = None) -> BriefingGateResult:
    result = BriefingGateResult()

    breadth = (briefing_input or {}).get("breadth_trust") if briefing_input else None
    if breadth:
        trust_check = str(output.get("trust_check") or "")
        if output.get("source_breadth_used") is not True:
            result.add_error("source_breadth_used must be true when input breadth_trust is present.")
        if not trust_check.strip():
            result.add_error("trust_check is required when breadth_trust is present.")
        if _frames_breadth_as_proof(trust_check):
            result.add_error("trust_check must not frame breadth as proof.")

    why_it_matters = str(output.get("why_it_matters") or "")
    if "attention" in why_it_matters.lower() and not any(
        word in why_it_matters.lower() for word in ["context", "not validation", "not a signal", "participation"]
    ):
        result.add_warning("why_it_matters mentions attention without clearly framing it as context.")

    limitations = str(output.get("limitations") or "")
    if briefing_input and briefing_input.get("mode") == "public" and not limitations.strip():
        result.add_error("public outputs must include limitations.")

    cards = output.get("briefing_cards") if isinstance(output.get("briefing_cards"), dict) else {}
    evidence_card = cards.get("evidence") if isinstance(cards.get("evidence"), dict) else {}
    evidence_items = evidence_card.get("items") if isinstance(evidence_card.get("items"), list) else output.get("evidence")
    if isinstance(evidence_items, list) and evidence_items:
        if not any(_is_stack_synthesis_receipt(str(item or "")) for item in evidence_items):
            result.add_error("evidence must include one stack-summary/synthesis receipt, not only raw indicator facts.")

    participation_copy = str(output.get("trust_check") or "")
    if participation_copy:
        if not PARTICIPATION_DIRECTION_RE.search(participation_copy):
            result.add_error("trust_check must describe participation or breadth direction/level, not only boilerplate.")
        if not TRUST_IMPLICATION_RE.search(participation_copy):
            result.add_error("trust_check must state the trust/confidence implication of participation breadth.")

    if briefing_input:
        dominant = _dominant_input_direction(briefing_input)
        if dominant:
            interpretive_text = " ".join(
                str(output.get(key) or "")
                for key in ["headline", "summary", "what_seta_sees", "why_it_matters", "watch_item", "trust_check"]
            )
            lower = interpretive_text.lower()
            opposite = "bearish" if dominant == "bullish" else "bullish"
            if opposite in lower and not CONFLICT_RESOLUTION_RE.search(interpretive_text):
                result.add_error(
                    f"narrative mentions {opposite} against a {dominant} input context without resolving the conflict."
                )

    return result


def _dominant_input_direction(briefing_input: dict[str, Any]) -> str:
    sources: list[str] = []
    for section_name in ["overlap_context", "sentiment_context", "event_context"]:
        section = briefing_input.get(section_name)
        if isinstance(section, dict):
            for key in [
                "dashboard_summary_label",
                "overlap_state",
                "overlap_event_type",
                "primary_archetype",
                "secondary_archetype",
                "latest_event_direction",
                "latest_confirmed_event_direction",
            ]:
                value = section.get(key)
                if value not in (None, ""):
                    sources.append(str(value).lower())
    text = " ".join(sources)
    bullish = text.count("bullish")
    bearish = text.count("bearish")
    if bullish > bearish:
        return "bullish"
    if bearish > bullish:
        return "bearish"
    return ""


def _is_stack_synthesis_receipt(text: str) -> bool:
    if STACK_SYNTHESIS_RE.search(text):
        return True
    return bool(STACK_COMPONENTS_RE.search(" ".join(text.split())))


def _frames_breadth_as_proof(text: str) -> bool:
    lowered = " ".join(str(text or "").lower().split())
    if re.search(r"\bproves?\b", lowered):
        return True
    proof_match = re.search(r"\bproof\b", lowered)
    if not proof_match:
        return False
    prefix = lowered[max(0, proof_match.start() - 40) : proof_match.start()]
    return not any(phrase in prefix for phrase in ["not ", "no ", "rather than ", "instead of ", "without "])


def check_briefing_quality_gates(
    output: dict[str, Any],
    briefing_input: dict[str, Any] | None = None,
    *,
    max_visible_metrics: int = 3,
) -> dict[str, Any]:
    combined = BriefingGateResult()
    combined.merge(evaluate_public_briefing_text(output, max_visible_metrics=max_visible_metrics))
    combined.merge(evaluate_structural_contract(output, briefing_input))
    return combined.to_dict()
