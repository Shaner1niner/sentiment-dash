from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, Iterable, Optional

ROOT = Path(__file__).resolve().parents[1]
SCREENER = ROOT / "fix26_screener_store.json"
AGENT_REF = ROOT / "agent_reference" / "seta_agent_reference.json"
GUIDANCE = ROOT / "agent_reference" / "seta_reply_guidance.md"
EXAMPLES = ROOT / "agent_reference" / "seta_reply_examples.jsonl"


def load_json(path: Path, default: Any):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def load_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return ""


def flatten(obj: Any, prefix: str = "") -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, dict):
                out.update(flatten(v, key))
            else:
                out[key] = v
    return out


def clean(v: Any) -> Optional[Any]:
    if v is None:
        return None
    s = str(v).strip()
    if not s or s.lower() in {"nan", "none", "null", "n/a", "na", "unknown"}:
        return None
    return v


def as_float(v: Any) -> Optional[float]:
    v = clean(v)
    if v is None:
        return None
    try:
        return round(float(v), 1)
    except Exception:
        return None


def label_from_score(score: Optional[float], bullish="Bullish", bearish="Bearish") -> str:
    if score is None:
        return "unknown"
    if score >= 70:
        return f"Strong {bullish}"
    if score >= 57.5:
        return bullish
    if score <= 30:
        return f"Strong {bearish}"
    if score <= 42.5:
        return bearish
    return "Neutral"


def pick(flat: Dict[str, Any], exact: Iterable[str] = (), contains_all: Iterable[str] = (), contains_any: Iterable[str] = ()) -> Any:
    # exact suffix match first so nested keys work, e.g. indicator.summary_score
    exact_l = [x.lower() for x in exact]
    for k, v in flat.items():
        kl = k.lower().split(".")[-1]
        if kl in exact_l and clean(v) is not None:
            return v
    all_l = [x.lower() for x in contains_all]
    any_l = [x.lower() for x in contains_any]
    for k, v in flat.items():
        kl = k.lower()
        if all(x in kl for x in all_l) and (not any_l or any(x in kl for x in any_l)) and clean(v) is not None:
            return v
    return None


def pick_score(flat: Dict[str, Any], family: str) -> Optional[float]:
    fam = family.lower()
    candidates = {
        "summary": ["summary_score", "seta_score", "overall_strength_score", "signal_consensus_score"],
        "macd": ["macd_family_score", "macd_attention_adjusted_score", "macd_signal_strength_score"],
        "rsi": ["rsi_family_score", "rsi_attention_adjusted_score", "rsi_combined_strength_score", "rsi_strength_score"],
        "attention": ["attention_score", "attention_regime_score", "attention_level_score"],
        "bollinger": ["attention_adjusted_bollinger_score", "bollinger_attention_adjusted_score", "bollinger_strength_score"],
        "ribbon": ["sent_ribbon_score", "sent_ribbon_direction_score", "sentiment_ribbon_score"],
        "trend": ["ma_trend_score", "ma_combined_strength_trend_score", "ma_attention_adjusted_score", "ma_strength_enhanced_score"],
    }.get(fam, [])
    val = pick(flat, exact=candidates)
    if val is None:
        val = pick(flat, contains_all=[fam], contains_any=["score", "strength"])
    return as_float(val)


def pick_label(flat: Dict[str, Any], family: str, score: Optional[float]) -> str:
    fam = family.lower()
    val = pick(flat, exact=[f"{fam}_label", f"{fam}_family_label", f"{fam}_state", f"{fam}_direction"], contains_all=[fam], contains_any=["label", "state", "direction", "bucket"])
    if clean(val) is not None:
        return str(val).strip()
    return label_from_score(score)


def detect_term(comment: str, terms: Iterable[str]) -> Optional[str]:
    text = comment.upper()
    for term in sorted([str(t).upper() for t in terms], key=len, reverse=True):
        if re.search(rf"(?<![A-Z0-9])\$?{re.escape(term)}(?![A-Z0-9])", text):
            return term
    return None


def is_advice_bait(comment: str) -> bool:
    s = comment.lower()
    return any(x in s for x in ["financial advice", "buy signal", "should i buy", "should i sell", "guaranteed", "price target"])


def is_hostile(comment: str) -> bool:
    s = comment.lower()
    return any(x in s for x in ["scam", "idiot", "trash", "fraud", "clown", "pump and dump"])


def build_context(term: str, row: Dict[str, Any]) -> Dict[str, Any]:
    flat = flatten(row)
    summary = pick_score(flat, "summary")
    priority = as_float(pick(flat, exact=["screener_priority_score", "priority_score", "attention_priority_score"], contains_all=["priority"], contains_any=["score"]))
    archetype = pick(flat, exact=["primary_archetype", "archetype", "archetype_summary", "screener_action_bucket"], contains_any=["archetype", "action_bucket"])
    direction = pick(flat, exact=["archetype_direction", "direction", "latest_event_direction"], contains_any=["direction"])

    fams = {}
    for fam in ["macd", "rsi", "attention", "bollinger", "ribbon", "trend"]:
        score = pick_score(flat, fam)
        label = pick_label(flat, fam, score)
        if score is None:
            fams[fam] = label if label != "unknown" else "unknown"
        else:
            fams[fam] = f"{score:g} {label}"

    risk_note = pick(flat, exact=["risk_note", "archetype_risk_note", "setup_risk_note"], contains_any=["risk_note", "risk"])
    return {
        "term": term,
        "summary_score": summary,
        "summary_bucket": label_from_score(summary),
        "priority_score": priority,
        "primary_archetype": str(archetype).strip() if clean(archetype) is not None else "unknown",
        "direction": str(direction).strip() if clean(direction) is not None else "unknown",
        "families": fams,
        "risk_note": str(risk_note).strip() if clean(risk_note) is not None else "No special risk note available.",
    }


def drivers(context: Dict[str, Any]) -> str:
    fams = context.get("families", {})
    good = []
    for name in ["macd", "rsi", "attention", "bollinger", "ribbon", "trend"]:
        val = str(fams.get(name, "unknown"))
        if val != "unknown":
            good.append(f"{name.title()} {val}")
    return "; ".join(good[:4]) if good else "mixed signal families"


def draft_reply(platform: str, comment: str) -> Dict[str, Any]:
    store = load_json(SCREENER, {})
    by_term = store.get("by_term", {}) if isinstance(store, dict) else {}
    term = detect_term(comment, by_term.keys())
    advice = is_advice_bait(comment)
    hostile = is_hostile(comment)
    question = "?" in comment or any(x in comment.lower() for x in ["why", "what", "how", "is this"])
    ref = load_json(AGENT_REF, {})
    guidance = load_text(GUIDANCE)
    example_count = 0
    if EXAMPLES.exists():
        example_count = sum(1 for line in EXAMPLES.read_text(encoding="utf-8").splitlines() if line.strip())

    if not term:
        if advice:
            return {
                "should_reply": true,
                "detected_term": None,
                "reply_type": "financial_advice_boundary",
                "risk_level": "high",
                "draft_reply": "I would not frame SETA as a buy/sell signal or financial advice. It is a signal-context layer: useful for explaining what the model is seeing, but not a guarantee or substitute for risk management.",
                "reasoning_summary": "No asset detected, but financial-advice bait was detected.",
                "requires_human_review": True,
                "platform": platform,
            }
        return {"should_reply": False, "detected_term": None, "reply_type": "no_supported_asset_detected", "risk_level": "medium", "draft_reply": "", "reasoning_summary": "No known SETA term was detected in the comment.", "requires_human_review": True, "platform": platform}

    context = build_context(term, by_term.get(term, {}))

    if hostile:
        return {"should_reply": False, "detected_term": term, "reply_type": "hostile_or_bait_context", "risk_level": "high", "draft_reply": "", "reasoning_summary": "Detected hostile/bait language; draft mode recommends no reply.", "requires_human_review": True, "platform": platform, "context": context}

    if advice:
        reply = f"I would not treat ${term} as a buy/sell call. SETA is showing context: Summary {context['summary_score'] if context['summary_score'] is not None else '--'} ({context['summary_bucket']}), with drivers like {drivers(context)}. Useful for framing risk/reward, not financial advice."
        typ = "financial_advice_boundary"
        risk = "high"
    else:
        reply = f"${term} is showing up because SETA is seeing a driver stack rather than one isolated signal. Summary {context['summary_score'] if context['summary_score'] is not None else '--'} ({context['summary_bucket']}); main drivers: {drivers(context)}. Worth watching, not a guaranteed outcome."
        typ = "educational_signal_context"
        risk = "low" if question else "medium"

    return {
        "should_reply": True,
        "detected_term": term,
        "reply_type": typ,
        "risk_level": risk,
        "draft_reply": reply,
        "reasoning_summary": f"Detected {term}; built reply from flattened SETA screener payload. advice_bait={advice}; hostile={hostile}; question={question}.",
        "requires_human_review": True,
        "platform": platform,
        "context": context,
        "reference_loaded": bool(ref),
        "guidance_loaded": bool(guidance),
        "example_count": example_count,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--platform", default="x", choices=["x", "bsky", "reddit"])
    ap.add_argument("--comment", required=True)
    args = ap.parse_args()
    print(json.dumps(draft_reply(args.platform, args.comment), indent=2))

if __name__ == "__main__":
    main()
