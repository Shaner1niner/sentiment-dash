#!/usr/bin/env python
"""Draft-only SETA social reply generator.

This script does not post to any platform. It reads an incoming social comment,
finds a likely ticker/asset, loads the current SETA screener JSON and agent
reference files, and emits a structured draft reply object for human review.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

DEFAULT_REPO = Path(r"C:\Users\shane\sentiment-dash")
SUPPORTED_PLATFORMS = {"x", "twitter", "bsky", "bluesky", "reddit", "generic"}
HOSTILE_WORDS = {
    "scam", "idiot", "moron", "fraud", "shit", "bullshit", "stupid", "dumb",
    "loser", "clown", "trash", "pump", "shill", "grift", "rug"
}
ADVICE_BAIT = [
    "should i buy", "should i sell", "buy now", "sell now", "price target",
    "guaranteed", "will it go up", "will it pump", "100x", "financial advice",
    "is this advice", "tell me what to buy", "entry", "stop loss"
]
QUESTION_HINTS = {"why", "what", "how", "is", "are", "does", "do", "can", "should", "?"}


def load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        if default is not None:
            return default
        raise FileNotFoundError(f"Missing required file: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def load_text(path: Path, default: str = "") -> str:
    return path.read_text(encoding="utf-8") if path.exists() else default


def load_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    out: List[Dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def norm_term(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]", "", value.upper().strip().lstrip("$"))


def by_term_from_store(store: Dict[str, Any]) -> Dict[str, Any]:
    by_term = store.get("by_term") or store.get("terms") or {}
    if isinstance(by_term, list):
        mapped = {}
        for row in by_term:
            if isinstance(row, dict) and row.get("term"):
                mapped[norm_term(str(row["term"]))] = row
        return mapped
    if isinstance(by_term, dict):
        return {norm_term(k): v for k, v in by_term.items() if isinstance(v, dict)}
    return {}


def extract_known_terms(comment: str, known_terms: Iterable[str]) -> List[str]:
    known = sorted({norm_term(t) for t in known_terms if t}, key=len, reverse=True)
    found: List[str] = []
    text = comment.upper()
    tokens = set(norm_term(t) for t in re.findall(r"\$?[A-Za-z][A-Za-z0-9._-]{1,9}", comment))
    for term in known:
        if not term:
            continue
        if term in tokens or f"${term}" in text:
            found.append(term)
    return found


def row_value(row: Dict[str, Any], keys: Iterable[str], default: Any = None) -> Any:
    for key in keys:
        val = row.get(key)
        if val is None:
            continue
        sval = str(val).strip()
        if sval and sval.lower() not in {"nan", "none", "null", "n/a"}:
            return val
    return default


def score_value(row: Dict[str, Any], keys: Iterable[str]) -> Optional[float]:
    val = row_value(row, keys)
    if val is None:
        return None
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def classify_score(score: Optional[float]) -> str:
    if score is None:
        return "unknown"
    if score >= 80:
        return "very strong"
    if score >= 66:
        return "strong"
    if score >= 55:
        return "constructive"
    if score >= 45:
        return "mixed / neutral"
    if score >= 35:
        return "soft"
    return "weak"


def clean_label(value: Any, fallback: str = "unknown") -> str:
    if value is None:
        return fallback
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null", "n/a"}:
        return fallback
    return s


def platform_label(platform: str) -> str:
    p = platform.lower().strip()
    if p == "twitter":
        return "x"
    if p == "bluesky":
        return "bsky"
    return p if p in SUPPORTED_PLATFORMS else "generic"


def is_hostile(comment: str) -> bool:
    low = comment.lower()
    return any(w in low for w in HOSTILE_WORDS)


def is_advice_bait(comment: str) -> bool:
    low = comment.lower()
    return any(p in low for p in ADVICE_BAIT)


def looks_like_question(comment: str) -> bool:
    low = comment.lower()
    return "?" in comment or any(re.search(rf"\b{re.escape(w)}\b", low) for w in QUESTION_HINTS if w != "?")


def build_context(term: str, row: Dict[str, Any]) -> Dict[str, Any]:
    summary = score_value(row, ["summary_score", "overall_strength_score", "screener_strength_score", "score"])
    priority = score_value(row, ["screener_attention_priority_score", "screener_priority_score", "attention_priority_score"])
    macd = row_value(row, ["macd_family_label", "sent_price_macd_joint_slope_label", "macd_label"])
    rsi = row_value(row, ["rsi_family_label", "rsi_label"])
    attention = row_value(row, ["attention_label", "attention_regime_label", "attention_state_label"])
    bollinger = row_value(row, ["bollinger_family_label", "bollinger_label", "overlap_label"])
    ribbon = row_value(row, ["sent_ribbon_label", "ribbon_label"])
    trend = row_value(row, ["ma_trend_label", "trend_label", "ma_family_label"])
    archetype = row_value(row, ["primary_archetype", "archetype_summary", "screener_action_bucket"])
    direction = row_value(row, ["archetype_direction", "signal_consensus_direction_label", "latest_event_direction"])
    risk = row_value(row, ["archetype_risk_note", "risk_note", "missing_confirmation_note"])
    return {
        "term": term,
        "summary_score": summary,
        "summary_bucket": classify_score(summary),
        "priority_score": priority,
        "primary_archetype": clean_label(archetype),
        "direction": clean_label(direction),
        "families": {
            "macd": clean_label(macd),
            "rsi": clean_label(rsi),
            "attention": clean_label(attention),
            "bollinger": clean_label(bollinger),
            "ribbon": clean_label(ribbon),
            "trend": clean_label(trend),
        },
        "risk_note": clean_label(risk, "No special risk note available."),
    }


def pick_drivers(ctx: Dict[str, Any], max_items: int = 4) -> List[str]:
    fam = ctx.get("families", {})
    order = ["macd", "ribbon", "bollinger", "attention", "rsi", "trend"]
    items: List[str] = []
    for key in order:
        val = clean_label(fam.get(key), "unknown")
        if val != "unknown":
            label = key.capitalize()
            items.append(f"{label}: {val}")
        if len(items) >= max_items:
            break
    return items


def draft_reply(platform: str, comment: str, ctx: Dict[str, Any], advice_bait: bool, hostile: bool) -> str:
    term = ctx["term"]
    score = ctx.get("summary_score")
    bucket = ctx.get("summary_bucket", "unknown")
    archetype = ctx.get("primary_archetype", "unknown")
    drivers = pick_drivers(ctx)
    score_part = f"Summary is {score:.0f} ({bucket})" if isinstance(score, (int, float)) else f"Summary reads {bucket}"

    if hostile:
        return (
            f"I would keep this framed as signal context, not a prediction. For ${term}, SETA currently reads: "
            f"{score_part}. The useful part is the driver stack, not arguing certainty: "
            f"{'; '.join(drivers) if drivers else 'mixed / limited signal detail available'}."
        )

    if advice_bait:
        return (
            f"I would not treat SETA as buy/sell advice. For ${term}, the model is flagging context: "
            f"{score_part}, with {archetype}. Key drivers: "
            f"{'; '.join(drivers) if drivers else 'not enough family detail available'}. "
            "Useful as a watchlist/risk-context input, not a guarantee or a substitute for your own plan."
        )

    if "why" in comment.lower() or "rank" in comment.lower():
        return (
            f"${term} is showing up because SETA has a constructive driver stack rather than a single isolated signal. "
            f"{score_part}; archetype/context: {archetype}. "
            f"The main contributors I would point to are {', '.join(drivers) if drivers else 'mixed signal families'}. "
            "That means it is worth watching, not that the outcome is guaranteed."
        )

    if "bear" in comment.lower() or "bull" in comment.lower():
        return (
            f"For ${term}, I would describe the SETA read as {bucket}, not absolute. "
            f"The current context is {archetype}, with drivers like "
            f"{', '.join(drivers) if drivers else 'limited family detail available'}. "
            "The model is trying to summarize alignment across sentiment, attention, and technical families."
        )

    return (
        f"SETA is flagging ${term} as {bucket}: {score_part}. "
        f"Context: {archetype}. Main drivers: "
        f"{'; '.join(drivers) if drivers else 'mixed / limited signal detail available'}. "
        "I would frame that as signal context for a watchlist, not a certain directional call."
    )


def evaluate(platform: str, comment: str, repo: Path, explicit_term: Optional[str] = None) -> Dict[str, Any]:
    repo = repo.resolve()
    store = load_json(repo / "fix26_screener_store.json")
    by_term = by_term_from_store(store)
    agent_ref = load_json(repo / "agent_reference" / "seta_agent_reference.json", default={})
    guidance = load_text(repo / "agent_reference" / "seta_reply_guidance.md")
    examples = load_jsonl(repo / "agent_reference" / "seta_reply_examples.jsonl")

    platform = platform_label(platform)
    hostile = is_hostile(comment)
    advice = is_advice_bait(comment)
    question = looks_like_question(comment)

    detected_terms = [norm_term(explicit_term)] if explicit_term else extract_known_terms(comment, by_term.keys())
    detected_terms = [t for t in detected_terms if t in by_term]
    term = detected_terms[0] if detected_terms else None

    if not term:
        return {
            "should_reply": False,
            "detected_term": None,
            "reply_type": "no_supported_asset_detected",
            "risk_level": "medium",
            "draft_reply": "",
            "reasoning_summary": "No known SETA term was detected in the comment.",
            "requires_human_review": True,
            "platform": platform,
        }

    row = by_term[term]
    ctx = build_context(term, row)
    risk_level = "high" if advice or hostile else ("medium" if not question else "low")
    should_reply = bool(term) and (question or advice or "rank" in comment.lower() or platform in {"bsky", "reddit", "x"})

    out = {
        "should_reply": should_reply,
        "detected_term": term,
        "reply_type": "financial_advice_boundary" if advice else ("hostile_or_bait_context" if hostile else "educational_signal_context"),
        "risk_level": risk_level,
        "draft_reply": draft_reply(platform, comment, ctx, advice, hostile) if should_reply else "",
        "reasoning_summary": (
            f"Detected {term}; built reply from SETA screener family drivers. "
            f"advice_bait={advice}; hostile={hostile}; question={question}."
        ),
        "requires_human_review": True,
        "platform": platform,
        "context": ctx,
        "reference_loaded": bool(agent_ref),
        "guidance_loaded": bool(guidance.strip()),
        "example_count": len(examples),
    }
    return out


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Draft-only SETA social reply generator")
    parser.add_argument("--repo", default=str(DEFAULT_REPO), help="sentiment-dash repo path")
    parser.add_argument("--platform", default="generic", help="x, bsky, reddit, or generic")
    parser.add_argument("--comment", help="incoming social comment text")
    parser.add_argument("--term", help="explicit asset/ticker override")
    parser.add_argument("--input-json", help="JSON file with platform/comment/term")
    parser.add_argument("--output-json", help="optional output path")
    args = parser.parse_args(argv)

    platform = args.platform
    comment = args.comment
    term = args.term
    if args.input_json:
        payload = load_json(Path(args.input_json))
        platform = payload.get("platform", platform)
        comment = payload.get("comment", payload.get("text", comment))
        term = payload.get("term", term)
    if not comment:
        raise SystemExit("[ERROR] Provide --comment or --input-json")

    result = evaluate(platform=platform, comment=comment, repo=Path(args.repo), explicit_term=term)
    rendered = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output_json:
        Path(args.output_json).write_text(rendered + "\n", encoding="utf-8")
        print(f"[OK] wrote {args.output_json}")
    else:
        print(rendered)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
