#!/usr/bin/env python
"""
SETA social reply draft mode v3.

Draft-only social reply helper. It loads the current SETA screener store and
agent reference files, detects a supported asset in a social comment, and returns
structured JSON with a human-review-required draft reply.

This script never posts to any platform.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
STORE_PATH = ROOT / "fix26_screener_store.json"
REFERENCE_PATH = ROOT / "agent_reference" / "seta_agent_reference.json"
GUIDANCE_PATH = ROOT / "agent_reference" / "seta_reply_guidance.md"
EXAMPLES_PATH = ROOT / "agent_reference" / "seta_reply_examples.jsonl"

FAMILIES = ["macd", "rsi", "attention", "bollinger", "ribbon", "trend"]
DISPLAY_NAMES = {
    "macd": "MACD",
    "rsi": "RSI",
    "attention": "Attention",
    "bollinger": "Bollinger",
    "ribbon": "Ribbon",
    "trend": "Trend",
}

ADVICE_TERMS = ["financial advice", "buy", "sell", "buy signal", "sell signal", "should i", "should we", "entry", "exit"]
HOSTILE_TERMS = ["scam", "fraud", "idiot", "clown", "garbage", "fake", "shill", "pump and dump"]
QUESTION_MARKERS = ["?", "why", "what", "how", "is ", "are ", "does ", "do ", "can ", "should "]


def load_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def load_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def load_jsonl_count(path: Path) -> int:
    try:
        return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
    except Exception:
        return 0


def iter_items(obj: Any, prefix: str = "") -> Iterable[Tuple[str, Any]]:
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            yield key, v
            yield from iter_items(v, key)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            key = f"{prefix}[{i}]"
            yield key, v
            yield from iter_items(v, key)


def norm_text(value: Any) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null", "n/a", "na"}:
        return ""
    return s


def as_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().replace(",", "")
    m = re.search(r"-?\d+(?:\.\d+)?", s)
    if not m:
        return None
    try:
        return float(m.group(0))
    except Exception:
        return None


def fmt_num(value: Any, digits: int = 1) -> str:
    n = as_float(value)
    if n is None:
        return ""
    if abs(n - round(n)) < 0.05:
        return str(int(round(n)))
    return f"{n:.{digits}f}"


def clean_label(raw: Any) -> str:
    s = norm_text(raw)
    if not s:
        return ""
    # Remove excessive duplicate numeric tails like "75.7 80.21294663160973".
    parts = s.split()
    if len(parts) >= 2 and all(as_float(p) is not None for p in parts[-2:]):
        # Keep a single rounded numeric token if the whole label is just numbers.
        if all(as_float(p) is not None for p in parts):
            return fmt_num(parts[0])
        s = " ".join(parts[:-1])
    # Round any long decimals inside the label.
    def repl(m: re.Match[str]) -> str:
        return fmt_num(m.group(0))
    s = re.sub(r"-?\d+\.\d{2,}", repl, s)
    s = re.sub(r"\s+", " ", s).strip(" ;,/")
    return s


def find_first(row: Dict[str, Any], include: List[str], prefer_text: bool = False, exclude: Optional[List[str]] = None) -> Any:
    exclude = exclude or []
    best = None
    for key, value in iter_items(row):
        kl = key.lower()
        if all(token in kl for token in include) and not any(token in kl for token in exclude):
            if value is None or isinstance(value, (dict, list)):
                continue
            if prefer_text and norm_text(value) and as_float(value) is None:
                return value
            if best is None and norm_text(value):
                best = value
    return best


def classify_score(score: Optional[float], family: str = "") -> str:
    if score is None:
        return ""
    if family == "attention":
        if score >= 70:
            return "elevated"
        if score >= 45:
            return "active"
        return "normal"
    if score >= 75:
        return "strong"
    if score >= 60:
        return "constructive"
    if score >= 45:
        return "mixed"
    return "weak"


def extract_family(row: Dict[str, Any], family: str) -> Dict[str, Any]:
    # Prefer readable labels/state/buckets; then numeric scores.
    label = None
    for token in ["label", "state", "bucket", "direction", "status", "summary"]:
        label = find_first(row, [family, token], prefer_text=True)
        if norm_text(label):
            break
    score = None
    for token in ["score", "value", "rank"]:
        score = find_first(row, [family, token], prefer_text=False, exclude=["label"])
        if as_float(score) is not None:
            break

    # Common aliases.
    if family == "ribbon":
        if not norm_text(label):
            label = find_first(row, ["sent", "ribbon", "label"], prefer_text=True)
        if as_float(score) is None:
            score = find_first(row, ["ribbon", "direction", "score"])
    elif family == "trend":
        if not norm_text(label):
            label = find_first(row, ["trend", "label"], prefer_text=True) or find_first(row, ["ma", "trend"], prefer_text=True)
        if as_float(score) is None:
            score = find_first(row, ["trend", "score"]) or find_first(row, ["ma", "score"])
    elif family == "bollinger":
        if not norm_text(label):
            label = find_first(row, ["bollinger", "label"], prefer_text=True) or find_first(row, ["overlap", "label"], prefer_text=True)
        if as_float(score) is None:
            score = find_first(row, ["bollinger", "score"]) or find_first(row, ["overlap", "score"])

    n = as_float(score)
    label_clean = clean_label(label)
    if not label_clean:
        label_clean = classify_score(n, family)

    return {
        "score": n,
        "score_display": fmt_num(n) if n is not None else "",
        "label": label_clean or "unknown",
    }


def find_term(comment: str, by_term: Dict[str, Any]) -> Optional[str]:
    text = comment.upper()
    terms = sorted((str(t).upper() for t in by_term.keys()), key=len, reverse=True)
    for term in terms:
        patterns = [rf"\${re.escape(term)}\b", rf"\b{re.escape(term)}\b"]
        if any(re.search(p, text) for p in patterns):
            return term
    return None


def build_context(term: str, row: Dict[str, Any]) -> Dict[str, Any]:
    family_context = {fam: extract_family(row, fam) for fam in FAMILIES}
    priority = find_first(row, ["priority", "score"]) or find_first(row, ["screener", "priority"])
    summary = find_first(row, ["summary", "score"]) or find_first(row, ["overall", "score"])
    summary_bucket = find_first(row, ["summary", "bucket"], prefer_text=True) or find_first(row, ["summary", "label"], prefer_text=True)
    archetype = find_first(row, ["primary", "archetype"], prefer_text=True) or find_first(row, ["archetype"], prefer_text=True)
    direction = find_first(row, ["direction"], prefer_text=True, exclude=["score"])
    risk = find_first(row, ["risk", "note"], prefer_text=True) or find_first(row, ["archetype", "risk"], prefer_text=True)

    return {
        "term": term,
        "summary_score": as_float(summary),
        "summary_bucket": clean_label(summary_bucket) or "unknown",
        "priority_score": as_float(priority),
        "primary_archetype": clean_label(archetype) or "unknown",
        "direction": clean_label(direction) or "unknown",
        "families": {k: f"{v['score_display']} {v['label']}".strip() if v["score_display"] else v["label"] for k, v in family_context.items()},
        "family_detail": family_context,
        "risk_note": clean_label(risk) or "No special risk note available.",
    }


def family_phrase(name: str, detail: Dict[str, Any], include_score: bool = False) -> str:
    label = detail.get("label") or "unknown"
    score = detail.get("score_display") or ""
    display = DISPLAY_NAMES.get(name, name.title())
    if label == "unknown" and not score:
        return ""
    label = label.replace("RSI ", "").replace("Macd ", "").strip()
    if include_score and score:
        return f"{display} {score} ({label})"
    return f"{display} {label}"


def select_drivers(context: Dict[str, Any], platform: str) -> List[str]:
    details = context.get("family_detail", {})
    # Prefer the most explanatory families first. Avoid listing unknowns.
    order = ["macd", "rsi", "bollinger", "ribbon", "attention", "trend"]
    limit = 3 if platform.lower() in {"x", "bsky"} else 4
    drivers = []
    for fam in order:
        phrase = family_phrase(fam, details.get(fam, {}), include_score=False)
        if phrase and "unknown" not in phrase.lower():
            drivers.append(phrase)
    return drivers[:limit]


def join_drivers(drivers: List[str]) -> str:
    if not drivers:
        return "mixed signal families"
    if len(drivers) == 1:
        return drivers[0]
    if len(drivers) == 2:
        return f"{drivers[0]} and {drivers[1]}"
    return ", ".join(drivers[:-1]) + f", and {drivers[-1]}"


def is_question(comment: str) -> bool:
    s = comment.strip().lower()
    return any(m in s for m in QUESTION_MARKERS)


def has_any(comment: str, terms: List[str]) -> bool:
    s = comment.lower()
    return any(t in s for t in terms)


def draft_reply(platform: str, comment: str, context: Dict[str, Any], reply_type: str) -> str:
    term = context["term"]
    drivers = select_drivers(context, platform)
    driver_text = join_drivers(drivers)
    archetype = context.get("primary_archetype") or "unknown"
    priority = fmt_num(context.get("priority_score"))

    # Avoid contradictory or unclear Summary output in public replies. Use priority/archetype instead.
    if reply_type == "financial_advice_boundary":
        base = f"I would not treat ${term} as a buy/sell call. SETA is showing context"
        if priority:
            base += f" with priority around {priority}"
        if archetype and archetype != "unknown":
            base += f" and a {archetype.lower()} setup"
        base += f". Main drivers: {driver_text}. Useful for framing risk/reward, not financial advice."
        return base

    if reply_type == "hostile_or_bait_context":
        return f"I would keep this to signal context: ${term} is being flagged by SETA because of {driver_text}. That is not a guarantee or a call to chase price."

    if platform.lower() == "reddit":
        base = f"${term} is showing up because SETA is seeing a driver stack rather than one isolated signal"
        if archetype and archetype != "unknown":
            base += f". The current setup bucket is {archetype}"
        base += f". Main drivers: {driver_text}. I would treat that as watchlist context, not a guaranteed outcome."
        return base

    base = f"${term} is showing up because SETA is seeing a driver stack, not one isolated signal"
    if priority:
        base += f". Priority is around {priority}"
    base += f"; main drivers: {driver_text}. Worth watching, not a guaranteed outcome."
    return base


def build_result(platform: str, comment: str) -> Dict[str, Any]:
    store = load_json(STORE_PATH, {})
    by_term = store.get("by_term", {}) if isinstance(store, dict) else {}
    reference_loaded = bool(load_json(REFERENCE_PATH, {}))
    guidance_loaded = bool(load_text(GUIDANCE_PATH))
    example_count = load_jsonl_count(EXAMPLES_PATH)

    term = find_term(comment, by_term)
    hostile = has_any(comment, HOSTILE_TERMS)
    advice_bait = has_any(comment, ADVICE_TERMS)
    question = is_question(comment)

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

    row = by_term.get(term) or by_term.get(term.upper()) or by_term.get(term.lower()) or {}
    context = build_context(term, row if isinstance(row, dict) else {})

    if hostile:
        reply_type = "hostile_or_bait_context"
        risk = "high"
        should_reply = False if not question else True
    elif advice_bait:
        reply_type = "financial_advice_boundary"
        risk = "high"
        should_reply = True
    else:
        reply_type = "educational_signal_context"
        risk = "low" if question else "medium"
        should_reply = True

    reply = draft_reply(platform, comment, context, reply_type) if should_reply else ""
    return {
        "should_reply": should_reply,
        "detected_term": term,
        "reply_type": reply_type,
        "risk_level": risk,
        "draft_reply": reply,
        "reasoning_summary": f"Detected {term}; built reply with v3 formatter. advice_bait={advice_bait}; hostile={hostile}; question={question}.",
        "requires_human_review": True,
        "platform": platform,
        "context": context,
        "reference_loaded": reference_loaded,
        "guidance_loaded": guidance_loaded,
        "example_count": example_count,
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="Draft SETA social replies. Draft-only; never posts.")
    ap.add_argument("--platform", default="x", choices=["x", "bsky", "reddit"], help="Target platform style")
    ap.add_argument("--comment", required=True, help="Incoming social comment text")
    args = ap.parse_args()
    result = build_result(args.platform, args.comment)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
