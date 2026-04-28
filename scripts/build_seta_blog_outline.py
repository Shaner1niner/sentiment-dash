#!/usr/bin/env python
"""
SETA Blog Outline Generator v1

Builds draft-only blog outlines from:
  - reply_agent/content_packets/seta_daily_content_packet_YYYY-MM-DD.json
  - reply_agent/website_snippets/seta_website_snippets_latest.json
  - agent_reference/seta_style_guide_v2_2.json

Outputs:
  reply_agent/blog_outlines/seta_blog_outline_YYYY-MM-DD.md
  reply_agent/blog_outlines/seta_blog_outline_YYYY-MM-DD.json
  reply_agent/blog_outlines/seta_blog_outline_latest.md
  reply_agent/blog_outlines/seta_blog_outline_latest.json

No posting. No API calls. Draft-only.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIR = REPO_ROOT / "reply_agent" / "content_packets"
SNIPPETS_LATEST = REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json"
STYLE_JSON = REPO_ROOT / "agent_reference" / "seta_style_guide_v2_2.json"
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "blog_outlines"


def clean_text(v: Any) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    s = re.sub(r"\s+", " ", s)
    if s.lower() in {"nan", "none", "null"}:
        return ""
    return s


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")


def latest_content_packet() -> Path:
    matches = sorted(
        [p for p in CONTENT_DIR.glob("seta_daily_content_packet_*.json") if "_smoke" not in str(p)],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not matches:
        raise SystemExit(f"[ERROR] No content packet found in {CONTENT_DIR}")
    return matches[0]


def normalize_universe(v: Any) -> str:
    s = clean_text(v).lower()
    if s in {"crypto", "cryptos", "digital assets"}:
        return "crypto"
    if s in {"equity", "equities", "stocks", "stock"}:
        return "equities"
    return s or "unknown"


def score_rank(v: Any) -> float:
    try:
        if v is None:
            return 999.0
        s = str(v).strip()
        if not s or s.lower() in {"nan", "none", "null"}:
            return 999.0
        return float(s)
    except Exception:
        return 999.0


def choose_hero(snippets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not snippets:
        return None

    def key(s: Dict[str, Any]):
        archetype_bonus = {
            "participation_diffusion": 0,
            "narrative_churn": 1,
            "contested_structure": 2,
            "repair_watch": 3,
            "decision_pressure": 4,
            "validation_risk": 5,
            "broadening_participation": 6,
            "seta_context": 7,
        }.get(clean_text(s.get("copy_archetype")), 8)
        return (score_rank(s.get("decision_pressure_rank")), archetype_bonus, clean_text(s.get("term")))

    return sorted(snippets, key=key)[0]


def choose_supporting(snippets: List[Dict[str, Any]], hero_term: str, max_items: int = 5) -> List[Dict[str, Any]]:
    rest = [s for s in snippets if clean_text(s.get("term")).upper() != hero_term.upper()]
    rest = sorted(rest, key=lambda s: (score_rank(s.get("decision_pressure_rank")), clean_text(s.get("term"))))
    return rest[:max_items]


def universe_counts(snippets: List[Dict[str, Any]]) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for s in snippets:
        u = normalize_universe(s.get("universe"))
        counts[u] = counts.get(u, 0) + 1
    return counts


def title_for(hero: Dict[str, Any], counts: Dict[str, int]) -> str:
    term = clean_text(hero.get("term")).upper()
    arch = clean_text(hero.get("copy_archetype")).replace("_", " ")
    if counts.get("crypto", 0) and counts.get("equities", 0):
        return f"SETA Daily Field Note: {term}, participation, and the shape beneath price"
    if counts.get("crypto", 0):
        return f"SETA Crypto Field Note: {term} and the attention layer beneath price"
    if counts.get("equities", 0):
        return f"SETA Equity Field Note: {term} and the confirmation layer beneath price"
    return f"SETA Daily Field Note: {term} and the behavior beneath price"


def thesis_for(hero: Dict[str, Any], snippets: List[Dict[str, Any]]) -> str:
    term = clean_text(hero.get("term")).upper()
    hero_one = clean_text(hero.get("one_liner"))
    counts = universe_counts(snippets)

    if counts.get("crypto", 0) and counts.get("equities", 0):
        market_frame = "Today’s SETA read is mixed across crypto and equities, which makes the shared question less about direction and more about confirmation."
    elif counts.get("crypto", 0):
        market_frame = "Today’s crypto read is about whether attention is broadening sustainably or still rotating through narrative churn."
    elif counts.get("equities", 0):
        market_frame = "Today’s equity read is about whether leadership is coherent enough to earn confirmation."
    else:
        market_frame = "Today’s SETA read is about participation, narrative, and structural confirmation."

    if hero_one:
        return f"{market_frame} {hero_one}"
    return f"{market_frame} {term} is the lead asset because its setup has the clearest decision pressure in the current packet."


def angle_for(hero: Dict[str, Any]) -> str:
    arch = clean_text(hero.get("copy_archetype"))
    theme = clean_text(hero.get("narrative_theme"))
    if arch == "participation_diffusion":
        return "Participation is broadening, but breadth still has to earn confirmation."
    if arch == "narrative_churn":
        if theme:
            return f"Attention is present, but the story is still rotating around {theme}."
        return "Attention is present, but the story has not anchored to one clean thesis."
    if arch == "contested_structure":
        return "The setup is active, but structure is contested rather than cleanly confirmed."
    if arch == "repair_watch":
        return "The setup reads as repair, not a clean all-clear."
    if arch == "validation_risk":
        return "Surface activity remains visible, while validation risk is still present."
    return "The useful read is behavioral context, not a directional call."


def section_from_snippet(s: Dict[str, Any]) -> Dict[str, Any]:
    term = clean_text(s.get("term")).upper()
    return {
        "heading": clean_text(s.get("headline")) or f"{term}: SETA context",
        "one_liner": clean_text(s.get("one_liner")),
        "public_note": clean_text(s.get("public_note") or s.get("short_explanation")),
        "watch_condition": clean_text(s.get("watch_condition")),
        "seta_read": clean_text(s.get("seta_read_line")),
        "narrative": clean_text(s.get("narrative_note")),
        "risk_note": clean_text(s.get("risk_note")),
        "term": term,
        "copy_archetype": clean_text(s.get("copy_archetype")),
        "universe": normalize_universe(s.get("universe")),
    }


def build_outline(content_packet: Dict[str, Any], snippets_payload: Dict[str, Any]) -> Dict[str, Any]:
    snippets = snippets_payload.get("snippets", [])
    if not isinstance(snippets, list) or not snippets:
        raise SystemExit("[ERROR] Website snippets payload has no snippets")

    date = clean_text(snippets_payload.get("date") or content_packet.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")
    created_at = datetime.now(UTC).isoformat(timespec="seconds")

    hero = choose_hero(snippets)
    if not hero:
        raise SystemExit("[ERROR] Could not choose hero snippet")

    hero_term = clean_text(hero.get("term")).upper()
    supporting = choose_supporting(snippets, hero_term, max_items=5)
    counts = universe_counts(snippets)

    outline = {
        "schema_version": "seta_blog_outline_v1",
        "date": date,
        "created_at_utc": created_at,
        "draft_only": True,
        "posting_performed": False,
        "title": title_for(hero, counts),
        "subtitle": "A SETA field note on participation, narrative, and confirmation beneath price.",
        "thesis": thesis_for(hero, snippets),
        "lead_asset": section_from_snippet(hero),
        "core_angle": angle_for(hero),
        "supporting_assets": [section_from_snippet(s) for s in supporting],
        "market_mix": counts,
        "recommended_structure": [
            "Open with the behavioral question, not the price move.",
            "Explain the lead asset through participation, narrative, and confirmation.",
            "Use supporting assets as contrast cases.",
            "Separate crypto reflexivity from equity confirmation.",
            "Close with watch conditions and the reminder that SETA is context, not a signal.",
        ],
        "style_guardrails": [
            "Do not predict.",
            "Do not issue buy/sell language.",
            "Use sentiment as context, not as a trigger.",
            "Prefer 'reads as', 'suggests', and 'we are watching whether'.",
            "Use yes-and framing where possible.",
        ],
    }
    return outline


def md_section_for_asset(asset: Dict[str, Any]) -> List[str]:
    lines: List[str] = []
    lines.append(f"## {asset.get('heading')}")
    lines.append("")
    if asset.get("one_liner"):
        lines.append(asset["one_liner"])
        lines.append("")
    if asset.get("public_note"):
        lines.append(asset["public_note"])
        lines.append("")
    if asset.get("watch_condition"):
        lines.append(f"**Watch condition:** {asset['watch_condition']}")
        lines.append("")
    if asset.get("seta_read"):
        lines.append(f"**SETA read:** {asset['seta_read']}")
        lines.append("")
    if asset.get("narrative"):
        lines.append(f"**Narrative:** {asset['narrative']}")
        lines.append("")
    return lines


def markdown_outline(outline: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append(f"# {outline['title']}")
    lines.append("")
    lines.append(f"*{outline['subtitle']}*")
    lines.append("")
    lines.append("> Draft-only. SETA explains behavior beneath price. This is interpretation context, not a prediction or trade signal.")
    lines.append("")
    lines.append("## Working thesis")
    lines.append("")
    lines.append(outline["thesis"])
    lines.append("")
    lines.append("## Core angle")
    lines.append("")
    lines.append(outline["core_angle"])
    lines.append("")
    lines.extend(md_section_for_asset(outline["lead_asset"]))

    supporting = outline.get("supporting_assets", [])
    if supporting:
        lines.append("## Supporting reads")
        lines.append("")
        for asset in supporting:
            lines.append(f"### {asset.get('heading')}")
            lines.append("")
            if asset.get("one_liner"):
                lines.append(asset["one_liner"])
                lines.append("")
            if asset.get("watch_condition"):
                lines.append(f"**Watch:** {asset['watch_condition']}")
                lines.append("")
            if asset.get("seta_read"):
                lines.append(f"**SETA read:** {asset['seta_read']}")
                lines.append("")

    lines.append("## Suggested close")
    lines.append("")
    lines.append("The useful read is not that any one asset has to move a specific way. The useful read is where attention, narrative, and structure are either confirming one another or separating. That separation is where SETA does its work.")
    lines.append("")
    lines.append("## Editorial guardrails")
    lines.append("")
    for g in outline.get("style_guardrails", []):
        lines.append(f"- {g}")
    lines.append("")
    return "\n".join(lines)


def build_blog_outline(
    content_path: Path,
    snippets_path: Path,
    out_dir: Path,
) -> Dict[str, Any]:
    content_packet = load_json(content_path)
    snippets_payload = load_json(snippets_path)

    outline = build_outline(content_packet, snippets_payload)
    date = outline["date"].replace("/", "-")

    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"seta_blog_outline_{date}.json"
    md_path = out_dir / f"seta_blog_outline_{date}.md"
    latest_json = out_dir / "seta_blog_outline_latest.json"
    latest_md = out_dir / "seta_blog_outline_latest.md"

    md = markdown_outline(outline)

    write_json(json_path, outline)
    write_json(latest_json, outline)
    md_path.write_text(md, encoding="utf-8")
    latest_md.write_text(md, encoding="utf-8")

    summary = {
        "content_path": str(content_path),
        "snippets_path": str(snippets_path),
        "json_path": str(json_path),
        "markdown_path": str(md_path),
        "latest_json": str(latest_json),
        "latest_markdown": str(latest_md),
        "date": outline["date"],
        "lead_asset": outline["lead_asset"]["term"],
        "supporting_assets": [x["term"] for x in outline["supporting_assets"]],
        "draft_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA blog outline complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Build draft-only SETA blog outline from daily content packet and website snippets.")
    ap.add_argument("--content", default="", help="Daily content packet JSON. Defaults to latest.")
    ap.add_argument("--snippets", default=str(SNIPPETS_LATEST), help="Website snippets JSON.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    args = ap.parse_args()

    content_path = Path(args.content) if args.content else latest_content_packet()
    snippets_path = Path(args.snippets)
    out_dir = Path(args.out_dir)

    if not content_path.exists():
        print(f"[ERROR] Content packet not found: {content_path}")
        return 2
    if not snippets_path.exists():
        print(f"[ERROR] Website snippets not found: {snippets_path}")
        return 2

    build_blog_outline(content_path, snippets_path, out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
