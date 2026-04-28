#!/usr/bin/env python
"""
SETA Website Explanation Snippets v1

Builds website-facing explanation snippets from the SETA daily content packet.

Input:
  reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
  or latest matching packet in reply_agent/content_packets/

Outputs:
  reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.json
  reply_agent/website_snippets/seta_website_snippets_latest.json
  reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.csv
  reply_agent/website_snippets/seta_website_snippets_YYYY-MM-DD.md

Optional public copy:
  public/seta_explain_latest.json
  public/seta_explain_YYYY-MM-DD.json

This script does not publish, post, or call external APIs.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "reply_agent" / "content_packets"
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "website_snippets"
DEFAULT_PUBLIC_DIR = REPO_ROOT / "public"


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False, allow_nan=False)


def latest_content_packet(content_dir: Path = CONTENT_DIR) -> Path:
    matches = sorted(
        [p for p in content_dir.glob("seta_daily_content_packet_*.json") if "_smoke" not in str(p)],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not matches:
        raise SystemExit(f"[ERROR] No daily content packet JSON found in {content_dir}")
    return matches[0]


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).strip()
    text = re.sub(r"\s+", " ", text)
    if text.lower() in {"nan", "none", "null"}:
        return ""
    return text


def sentence_trim(text: str, max_chars: int = 260) -> str:
    text = clean_text(text)
    if len(text) <= max_chars:
        return text
    # Prefer sentence boundary.
    cut = text[:max_chars].rstrip()
    last_period = max(cut.rfind("."), cut.rfind(";"))
    if last_period >= 80:
        return cut[: last_period + 1]
    return cut.rstrip(" ,;:") + "..."


def normalize_universe(value: Any) -> str:
    text = clean_text(value).lower()
    if text in {"crypto", "cryptos", "digital assets"}:
        return "crypto"
    if text in {"equity", "equities", "stocks", "stock"}:
        return "equities"
    return text or "unknown"


def friendly_state(value: Any) -> str:
    text = clean_text(value).lower()
    mapping = {
        "diffusion": "participation is broadening",
        "disagreement": "structure is contested",
        "repair": "conditions are repairing",
        "decay": "structure is weakening",
        "churn": "attention is rotating",
    }
    return mapping.get(text, text)


def keyword_phrase(value: Any) -> str:
    if not isinstance(value, list):
        return ""
    words: List[str] = []
    seen = set()
    for raw in value:
        w = clean_text(raw).lower()
        if not w:
            continue
        if w == "basis" and any(clean_text(x).lower() == "cost basis" for x in value):
            continue
        if len(w) > 44:
            continue
        if w not in seen:
            words.append(w)
            seen.add(w)
        if len(words) >= 3:
            break
    if not words:
        return ""
    if len(words) == 1:
        return words[0]
    if len(words) == 2:
        return f"{words[0]} and {words[1]}"
    return f"{words[0]}, {words[1]}, and {words[2]}"



def _as_number(value: Any) -> Optional[float]:
    try:
        if value is None:
            return None
        text = str(value).strip()
        if not text or text.lower() in {"nan", "none", "null"}:
            return None
        return float(text)
    except Exception:
        return None


def _rank_bucket(value: Any) -> str:
    n = _as_number(value)
    if n is None:
        return ""
    if n <= 3:
        return "high"
    if n <= 8:
        return "elevated"
    return "lower"


def _theme_words(value: Any) -> List[str]:
    if not isinstance(value, list):
        return []
    out: List[str] = []
    for raw in value:
        if isinstance(raw, dict):
            word = clean_text(raw.get("keyword") or raw.get("term") or raw.get("value"))
        else:
            word = clean_text(raw)
        if word:
            out.append(word.lower())
    return out


def compress_narrative_theme(value: Any) -> str:
    words = _theme_words(value)
    joined = " | ".join(words)

    if not words:
        return ""

    theme_rules = [
        (("cook", "ternus", "ceo", "leadership"), "leadership transition"),
        (("privacy", "scaling", "ethereum scaling"), "privacy and scaling"),
        (("cost basis", "basis", "resistance", "spot", "volume"), "resistance / cost-basis debate"),
        (("ai infrastructure", "hpe", "hewlett", "packard", "enterprise"), "AI infrastructure exposure"),
        (("paypal", "bitcoin", "mstr", "consumer"), "payments and crypto exposure"),
        (("mstr", "bitcoin treasury", "tether", "lending", "liquidity"), "crypto balance-sheet/liquidity"),
        (("discover", "changes", "trends", "insights"), "search/discovery changes"),
        (("netflix", "beef", "disney", "production", "japan"), "content slate and streaming competition"),
        (("bulls", "breakout", "rally", "hold price"), "breakout/rally debate"),
    ]

    for needles, label in theme_rules:
        if any(n in joined for n in needles):
            return label

    return keyword_phrase(words)


def copy_archetype(row: Dict[str, Any]) -> str:
    state = clean_text(row.get("asset_state")).lower()
    structural = clean_text(row.get("structural_state")).lower()
    narrative = clean_text(row.get("narrative_regime")).lower()
    coherence = clean_text(row.get("narrative_coherence_bucket")).lower()
    rank_bucket = _rank_bucket(row.get("decision_pressure_rank"))

    if "churn" in narrative or "noise" in narrative or "very noisy" in coherence:
        return "narrative_churn"
    if "diffusion" in state and rank_bucket in {"high", "elevated"}:
        return "participation_diffusion"
    if "diffusion" in state:
        return "broadening_participation"
    if "disagreement" in state:
        return "contested_structure"
    if "repair" in state:
        return "repair_watch"
    if "rejection" in structural or "decay" in structural:
        return "validation_risk"
    if rank_bucket == "high":
        return "decision_pressure"
    return "seta_context"


def universe_frame(row: Dict[str, Any]) -> Dict[str, str]:
    universe = normalize_universe(row.get("universe"))
    if universe == "crypto":
        return {
            "market": "crypto tape",
            "health": "whether attention broadens sustainably",
            "confirmation": "participation and narrative coherence",
        }
    if universe == "equities":
        return {
            "market": "equity tape",
            "health": "whether leadership becomes coherent and broad enough to earn confirmation",
            "confirmation": "sector leadership and structural confirmation",
        }
    return {
        "market": "SETA tape",
        "health": "whether attention and structure confirm together",
        "confirmation": "participation, coherence, and structure",
    }


def editorial_headline(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    arch = copy_archetype(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))

    if arch == "narrative_churn":
        if theme:
            return f"{term}: active attention, unresolved story"
        return f"{term}: signal versus narrative noise"
    if arch == "participation_diffusion":
        return f"{term}: participation is broadening"
    if arch == "broadening_participation":
        return f"{term}: broadening, not yet all-clear"
    if arch == "contested_structure":
        return f"{term}: contested structure"
    if arch == "repair_watch":
        return f"{term}: repair watch"
    if arch == "validation_risk":
        return f"{term}: validation risk"
    if arch == "decision_pressure":
        return f"{term}: decision-pressure watch"
    return f"{term}: SETA context"


def editorial_one_liner(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    arch = copy_archetype(row)
    frame = universe_frame(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    state = clean_text(row.get("asset_state"))
    structural = clean_text(row.get("structural_state"))
    rank_bucket = _rank_bucket(row.get("decision_pressure_rank"))

    if arch == "narrative_churn":
        if theme:
            return f"{term} has attention, but the story is still rotating around {theme}."
        return f"{term} has attention, but the narrative has not anchored to one clean thesis."
    if arch == "participation_diffusion":
        return f"{term} is showing broader participation, and the open question is whether that breadth can hold."
    if arch == "broadening_participation":
        return f"{term} is broadening, though SETA still wants confirmation beneath the surface."
    if arch == "contested_structure":
        return f"{term} is active, and the SETA layer reads the structure as contested rather than cleanly confirmed."
    if arch == "repair_watch":
        return f"{term} looks more like repair than all-clear; confirmation still matters."
    if arch == "validation_risk":
        return f"{term} has visible activity, while the structural layer still argues for validation risk."
    if rank_bucket:
        return f"{term} sits in a {rank_bucket} decision-pressure zone in the {frame['market']}."
    if state:
        return f"{term} sits in a {state} state inside the {frame['market']}."
    if structural:
        return f"{term} has a structural read of {structural}."
    return f"{term} has a SETA context read available."


def editorial_short_explanation(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    arch = copy_archetype(row)
    frame = universe_frame(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    structural = clean_text(row.get("structural_state"))
    rank = row.get("decision_pressure_rank")
    skew = clean_text(row.get("resolution_skew"))

    if arch == "narrative_churn":
        theme_part = f" around {theme}" if theme else ""
        text = (
            f"{term} is not just a price read; the narrative layer is rotating{theme_part}. "
            f"In the {frame['market']}, SETA cares about {frame['health']}. "
            f"Right now this reads as attention that still needs validation."
        )
    elif arch in {"participation_diffusion", "broadening_participation"}:
        text = (
            f"{term} is showing participation diffusion, which means the conversation is broadening rather than staying trapped in one narrow pocket. "
            f"The next test is whether that breadth can translate into {frame['confirmation']}."
        )
    elif arch == "contested_structure":
        text = (
            f"{term} is active, and the SETA layer reads the structure as contested. "
            f"That does not make it a clean rejection or a clean confirmation; it puts the setup in a decision zone."
        )
    elif arch == "repair_watch":
        text = (
            f"{term} is in a repair watch. "
            f"The read is less about calling direction and more about whether sponsorship rebuilds enough to confirm the move."
        )
    elif arch == "validation_risk":
        text = (
            f"{term} still has validation risk. "
            f"Surface activity may remain visible, while the underlying structure has not fully earned confirmation."
        )
    else:
        text = editorial_one_liner(row)

    extras: List[str] = []
    if structural and structural.lower() not in text.lower():
        extras.append(f"Structure reads as {structural}.")
    if rank not in (None, "", "nan"):
        extras.append(f"Decision-pressure rank: {rank}.")
    if skew and skew.lower() != "unknown":
        extras.append(f"Skew: {skew}.")

    if extras:
        text += " " + " ".join(extras)

    text += " This is interpretation context, not a trade signal."
    return sentence_trim(text, 520)


def editorial_expanded_explanation(row: Dict[str, Any]) -> str:
    frame = universe_frame(row)
    short = editorial_short_explanation(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    coherence = clean_text(row.get("narrative_coherence_bucket"))
    narrative_regime = clean_text(row.get("narrative_regime"))

    parts = [short]

    if theme:
        parts.append(f"The live narrative theme is {theme}.")
    if narrative_regime or coherence:
        nbits = []
        if narrative_regime:
            nbits.append(f"regime: {narrative_regime}")
        if coherence:
            nbits.append(f"coherence: {coherence}")
        parts.append("Narrative layer — " + "; ".join(nbits) + ".")

    parts.append(f"For the {frame['market']}, the key test is {frame['health']}.")
    return sentence_trim(" ".join(parts), 850)

def headline_for(row: Dict[str, Any]) -> str:
    return sentence_trim(editorial_headline(row), 90)

def regime_note_for(row: Dict[str, Any]) -> str:
    frame = universe_frame(row)
    state = clean_text(row.get("asset_state"))
    structural = clean_text(row.get("structural_state"))
    skew = clean_text(row.get("resolution_skew"))
    rank = row.get("decision_pressure_rank")

    pieces: List[str] = []
    if state:
        pieces.append(f"In the {frame['market']}, this reads as {state}.")
    if structural:
        pieces.append(f"Structure reads as {structural}.")
    if rank not in (None, "", "nan"):
        pieces.append(f"Decision-pressure rank: {rank}.")
    if skew and skew.lower() != "unknown":
        pieces.append(f"Resolution skew: {skew}.")
    return " ".join(pieces)

def narrative_note_for(row: Dict[str, Any]) -> str:
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    regime = clean_text(row.get("narrative_regime"))
    coherence = clean_text(row.get("narrative_coherence_bucket"))

    if not theme and not regime and not coherence:
        return ""

    parts: List[str] = []
    if theme:
        parts.append(f"The live narrative is clustering around {theme}.")
    if regime:
        if "churn" in regime.lower() or "noise" in regime.lower():
            parts.append("That reads as rotation rather than one clean, settled story.")
        elif regime.lower() == "unclassified":
            parts.append("The narrative has not resolved into a strong single regime.")
        else:
            parts.append(f"Narrative regime: {regime}.")
    if coherence:
        parts.append(f"Coherence is {coherence}.")
    return " ".join(parts)

def short_explanation_for(row: Dict[str, Any]) -> str:
    return editorial_short_explanation(row)

def social_blurb_for(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    arch = copy_archetype(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    one = editorial_one_liner(row)

    if arch == "narrative_churn" and theme:
        return sentence_trim(f"${term} has attention, but the story is still rotating around {theme}. SETA reads this as context that needs validation, not a trade signal.", 280)

    return sentence_trim(one + " Context, not a signal.", 280)


def watch_condition_for(row: Dict[str, Any]) -> str:
    arch = copy_archetype(row)
    frame = universe_frame(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))

    if arch == "narrative_churn":
        if theme:
            return f"Watch whether {theme} becomes a coherent thesis or stays as rotating attention."
        return "Watch whether attention resolves into a coherent thesis or fades back into churn."
    if arch in {"participation_diffusion", "broadening_participation"}:
        return f"Watch whether broadening participation translates into {frame['confirmation']}."
    if arch == "contested_structure":
        return "Watch whether structure catches up to participation, or participation fades first."
    if arch == "repair_watch":
        return "Watch whether sponsorship rebuilds enough to confirm the repair."
    if arch == "validation_risk":
        return "Watch whether validation improves before surface activity loses sponsorship."
    if arch == "decision_pressure":
        return "Watch whether decision pressure resolves into confirmation or rejection."
    return f"Watch whether {frame['confirmation']} improves."


def seta_read_line(row: Dict[str, Any]) -> str:
    bits: List[str] = []

    arch = copy_archetype(row).replace("_", " ")
    if arch:
        bits.append(arch)

    rank = row.get("decision_pressure_rank")
    if rank not in (None, "", "nan"):
        bits.append(f"rank {rank}")

    skew = clean_text(row.get("resolution_skew"))
    if skew and skew.lower() != "unknown":
        bits.append(f"{skew} skew")

    structural = clean_text(row.get("structural_state"))
    if structural:
        bits.append(structural)

    return " | ".join(bits)


def public_note_for(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    arch = copy_archetype(row)
    frame = universe_frame(row)
    theme = compress_narrative_theme(row.get("narrative_top_keywords"))
    structural = clean_text(row.get("structural_state"))

    if arch == "narrative_churn":
        if theme:
            return (
                f"{term} has active attention, but the story is still rotating around {theme}. "
                f"In {frame['market']}, that means the setup needs narrative coherence before it becomes a cleaner read."
            )
        return (
            f"{term} has attention, but the story is not anchored to one clean thesis yet. "
            f"The important question is whether participation broadens or drifts back into noise."
        )

    if arch in {"participation_diffusion", "broadening_participation"}:
        return (
            f"{term} is showing broader participation. "
            f"That is constructive for the {frame['market']}, while the next test is whether the breadth can hold and earn confirmation."
        )

    if arch == "contested_structure":
        extra = f" {structural} is the key tension." if structural else ""
        return (
            f"{term} is active, and SETA reads the structure as contested rather than cleanly confirmed. "
            f"This is a decision zone, not an all-clear setup.{extra}"
        )

    if arch == "repair_watch":
        return (
            f"{term} looks more like repair than confirmation. "
            f"The useful read is whether sponsorship is rebuilding underneath the surface."
        )

    if arch == "validation_risk":
        return (
            f"{term} still carries validation risk. "
            f"Surface activity may be visible, while the underlying structure has not fully earned confirmation."
        )

    if arch == "decision_pressure":
        return (
            f"{term} is sitting in a decision-pressure zone. "
            f"The signal is less about prediction and more about whether confirmation or rejection arrives next."
        )

    return editorial_one_liner(row)


def markdown_meta_line(row: Dict[str, Any]) -> str:
    read = seta_read_line(row)
    if read:
        return f"**SETA read:** {read}"
    return "**SETA read:** context watch"

def build_snippet(row: Dict[str, Any], packet_date: str, created_at: str) -> Dict[str, Any]:
    term = clean_text(row.get("term")).upper()
    narrative_note = narrative_note_for(row)
    regime_note = regime_note_for(row)
    expanded = editorial_expanded_explanation(row)
    public_note = public_note_for(row)
    watch = watch_condition_for(row)
    read_line = seta_read_line(row)

    snippet = {
        "term": term,
        "universe": normalize_universe(row.get("universe")),
        "copy_archetype": copy_archetype(row),
        "narrative_theme": compress_narrative_theme(row.get("narrative_top_keywords")),
        "headline": sentence_trim(headline_for(row), 90),
        "one_liner": sentence_trim(editorial_one_liner(row), 180),
        "public_note": sentence_trim(public_note, 420),
        "short_explanation": short_explanation_for(row),
        "expanded_explanation": expanded,
        "watch_condition": watch,
        "seta_read_line": read_line,
        "regime_note": regime_note,
        "narrative_note": narrative_note,
        "social_blurb": social_blurb_for(row),
        "risk_note": "Interpretation context only; not a prediction or trade signal.",
        "content_angle": clean_text(row.get("content_angle")),
        "asset_state": clean_text(row.get("asset_state")),
        "decision_pressure_rank": row.get("decision_pressure_rank"),
        "structural_state": clean_text(row.get("structural_state")),
        "resolution_skew": clean_text(row.get("resolution_skew")),
        "narrative_regime": clean_text(row.get("narrative_regime")),
        "narrative_coherence_bucket": clean_text(row.get("narrative_coherence_bucket")),
        "narrative_top_keywords": row.get("narrative_top_keywords") if isinstance(row.get("narrative_top_keywords"), list) else [],
        "updated_at": packet_date,
        "generated_at_utc": created_at,
        "draft_only": True,
        "posting_performed": False,
    }
    return snippet

def write_csv(path: Path, snippets: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "term", "universe", "headline", "short_explanation", "regime_note",
        "narrative_note", "social_blurb", "risk_note", "content_angle",
        "asset_state", "decision_pressure_rank", "structural_state",
        "resolution_skew", "narrative_regime", "narrative_coherence_bucket",
        "narrative_top_keywords", "updated_at"
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for row in snippets:
            out = dict(row)
            vals = out.get("narrative_top_keywords", [])
            cleaned = []
            if isinstance(vals, list):
                for item in vals:
                    if isinstance(item, dict):
                        cleaned.append(str(item.get("keyword") or item.get("term") or item.get("value") or ""))
                    else:
                        cleaned.append(str(item))
            elif vals:
                cleaned.append(str(vals))
            out["narrative_top_keywords"] = ", ".join([x for x in cleaned if x and x.lower() not in {"nan", "none", "null"}])
            w.writerow(out)


def write_markdown(path: Path, payload: Dict[str, Any]) -> None:
    lines: List[str] = []
    lines.append(f"# SETA Website Explanation Snippets — {payload.get('date')}")
    lines.append("")
    lines.append("Draft-only product copy for website/dashboard review.")
    lines.append("")
    lines.append("> SETA explains behavior beneath price. These notes are interpretation context, not predictions or trade signals.")
    lines.append("")

    snippets = payload.get("snippets", [])
    if snippets:
        lines.append("## Daily field notes")
        lines.append("")

    for s in snippets:
        lines.append(f"### {s.get('headline')}")
        lines.append("")
        lines.append(s.get("one_liner") or s.get("short_explanation", ""))
        lines.append("")

        public_note = s.get("public_note") or s.get("short_explanation", "")
        if public_note:
            lines.append(public_note)
            lines.append("")

        watch = s.get("watch_condition", "")
        if watch:
            lines.append(f"**Watch condition:** {watch}")
            lines.append("")

        read = s.get("seta_read_line", "")
        if read:
            lines.append(f"**SETA read:** {read}")
            lines.append("")

        narrative = s.get("narrative_note", "")
        if narrative:
            lines.append(f"**Narrative:** {narrative}")
            lines.append("")

        lines.append(f"**Risk note:** {s.get('risk_note')}")
        lines.append("")
        lines.append("---")
        lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(chr(10).join(lines), encoding="utf-8")

def build_website_snippets(
    input_path: Path,
    out_dir: Path,
    public_dir: Optional[Path] = None,
    copy_public: bool = False,
) -> Dict[str, Any]:
    packet = load_json(input_path)
    date = clean_text(packet.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")
    created_at = datetime.now(UTC).isoformat(timespec="seconds")
    rows = packet.get("rows", [])
    if not isinstance(rows, list):
        raise SystemExit("[ERROR] content packet rows is not a list")

    snippets = [
        build_snippet(row, date, created_at)
        for row in rows
        if isinstance(row, dict) and clean_text(row.get("term"))
    ]

    payload = {
        "schema_version": "seta_website_snippets_v1",
        "date": date,
        "created_at_utc": created_at,
        "source_content_packet": str(input_path),
        "draft_only": True,
        "posting_performed": False,
        "snippets": snippets,
        "by_term": {s["term"]: s for s in snippets},
    }

    safe_date = date.replace("/", "-")
    out_dir.mkdir(parents=True, exist_ok=True)

    dated_json = out_dir / f"seta_website_snippets_{safe_date}.json"
    latest_json = out_dir / "seta_website_snippets_latest.json"
    dated_csv = out_dir / f"seta_website_snippets_{safe_date}.csv"
    dated_md = out_dir / f"seta_website_snippets_{safe_date}.md"

    write_json(dated_json, payload)
    write_json(latest_json, payload)
    write_csv(dated_csv, snippets)
    write_markdown(dated_md, payload)

    public_outputs: Dict[str, str] = {}
    if copy_public:
        public_dir = public_dir or DEFAULT_PUBLIC_DIR
        public_dir.mkdir(parents=True, exist_ok=True)
        public_dated = public_dir / f"seta_explain_{safe_date}.json"
        public_latest = public_dir / "seta_explain_latest.json"
        write_json(public_dated, payload)
        write_json(public_latest, payload)
        public_outputs = {
            "public_dated_json": str(public_dated),
            "public_latest_json": str(public_latest),
        }

    summary = {
        "input_path": str(input_path),
        "dated_json": str(dated_json),
        "latest_json": str(latest_json),
        "csv_path": str(dated_csv),
        "markdown_path": str(dated_md),
        "public_outputs": public_outputs,
        "date": date,
        "snippets": len(snippets),
        "draft_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA website snippets complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Build SETA website explanation snippets from the daily content packet.")
    ap.add_argument("--input", default="", help="Daily content packet JSON. Defaults to latest in reply_agent/content_packets.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--copy-public", action="store_true", help="Also write public/seta_explain_latest.json and dated JSON.")
    ap.add_argument("--public-dir", default=str(DEFAULT_PUBLIC_DIR))
    args = ap.parse_args()

    input_path = Path(args.input) if args.input else latest_content_packet()
    if not input_path.exists():
        print(f"[ERROR] Input not found: {input_path}")
        return 2

    build_website_snippets(
        input_path=input_path,
        out_dir=Path(args.out_dir),
        public_dir=Path(args.public_dir),
        copy_public=args.copy_public,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
