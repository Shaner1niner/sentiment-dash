#!/usr/bin/env python
"""
SETA Blog Draft Generator v1

Builds a draft-only blog/newsletter article from:
  - reply_agent/blog_outlines/seta_blog_outline_latest.json
  - reply_agent/website_snippets/seta_website_snippets_latest.json
  - agent_reference/seta_style_guide_v2_2.json

Outputs:
  reply_agent/blog_drafts/seta_blog_draft_YYYY-MM-DD.md
  reply_agent/blog_drafts/seta_blog_draft_YYYY-MM-DD.json
  reply_agent/blog_drafts/seta_blog_draft_latest.md
  reply_agent/blog_drafts/seta_blog_draft_latest.json

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
OUTLINE_LATEST = REPO_ROOT / "reply_agent" / "blog_outlines" / "seta_blog_outline_latest.json"
SNIPPETS_LATEST = REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json"
STYLE_JSON = REPO_ROOT / "agent_reference" / "seta_style_guide_v2_2.json"
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "blog_drafts"


def clean_text(v: Any) -> str:
    if v is None:
        return ""
    s = str(v).strip()
    s = re.sub(r"\s+", " ", s)
    if s.lower() in {"nan", "none", "null"}:
        return ""
    return s


def load_json(path: Path, default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if not path.exists():
        if default is not None:
            return default
        raise SystemExit(f"[ERROR] Missing JSON file: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")


def sentence_trim(text: str, max_chars: int = 900) -> str:
    text = clean_text(text)
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars].rstrip()
    last = max(cut.rfind("."), cut.rfind(";"))
    if last > 240:
        return cut[: last + 1]
    return cut.rstrip(" ,;:") + "..."


def normalize_universe(v: Any) -> str:
    s = clean_text(v).lower()
    if s in {"crypto", "cryptos", "digital assets"}:
        return "crypto"
    if s in {"equity", "equities", "stocks", "stock"}:
        return "equities"
    return s or "unknown"


def make_slug(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or "seta-blog-draft"


def paragraph(text: str) -> str:
    return clean_text(text)


def asset_term(asset: Dict[str, Any]) -> str:
    return clean_text(asset.get("term")).upper()


def asset_heading(asset: Dict[str, Any]) -> str:
    return clean_text(asset.get("heading")) or f"{asset_term(asset)}: SETA context"


def lead_section(asset: Dict[str, Any]) -> List[str]:
    term = asset_term(asset)
    lines: List[str] = []
    lines.append(f"## {asset_heading(asset)}")
    lines.append("")

    one = clean_text(asset.get("one_liner"))
    note = clean_text(asset.get("public_note"))
    watch = clean_text(asset.get("watch_condition"))
    read = clean_text(asset.get("seta_read"))
    narrative = clean_text(asset.get("narrative"))

    if one:
        lines.append(one)
        lines.append("")

    if note:
        lines.append(note)
        lines.append("")
    else:
        lines.append(
            f"{term} is the lead read in today’s SETA packet because it best captures the current tension between participation, narrative, and confirmation."
        )
        lines.append("")

    if narrative:
        lines.append(
            f"The narrative layer matters here because SETA does not treat attention as validation by itself. {narrative}"
        )
        lines.append("")

    if watch:
        lines.append(f"The watch condition is straightforward: {watch}")
        lines.append("")

    if read:
        lines.append(f"SETA read: {read}.")
        lines.append("")

    return lines


def supporting_section(assets: List[Dict[str, Any]]) -> List[str]:
    lines: List[str] = []
    if not assets:
        return lines

    lines.append("## Supporting reads")
    lines.append("")
    lines.append(
        "The supporting names matter less as isolated calls and more as contrast cases. They show whether today’s SETA tape is being driven by broad participation, contested structure, repair, or narrative churn."
    )
    lines.append("")

    for asset in assets:
        term = asset_term(asset)
        heading = asset_heading(asset)
        one = clean_text(asset.get("one_liner"))
        watch = clean_text(asset.get("watch_condition"))
        read = clean_text(asset.get("seta_read"))

        lines.append(f"### {heading}")
        lines.append("")
        if one:
            lines.append(one)
            lines.append("")
        if watch:
            lines.append(f"Watch condition: {watch}")
            lines.append("")
        if read:
            lines.append(f"SETA read: {read}.")
            lines.append("")

    return lines


def market_context_section(outline: Dict[str, Any]) -> List[str]:
    lines: List[str] = []
    mix = outline.get("market_mix", {}) if isinstance(outline.get("market_mix"), dict) else {}
    crypto_count = int(mix.get("crypto", 0) or 0)
    equity_count = int(mix.get("equities", 0) or 0)

    lines.append("## Market context")
    lines.append("")

    if crypto_count and equity_count:
        lines.append(
            "The important part of a mixed crypto/equity packet is that the two markets do not confirm the same way. Crypto can move quickly when attention diffuses, while equities usually need leadership and structure to earn confirmation. SETA keeps those lanes separate."
        )
    elif crypto_count:
        lines.append(
            "For crypto, the core question is whether attention is broadening sustainably or simply rotating through a crowded story. Price can move before confirmation, so SETA treats diffusion and narrative coherence as separate layers."
        )
    elif equity_count:
        lines.append(
            "For equities, the core question is whether leadership is coherent and broad enough to earn confirmation. SETA is slower to call equity regimes because institutional sponsorship matters more than speed."
        )
    else:
        lines.append(
            "The core SETA question is whether participation, narrative, and structure are confirming one another or separating."
        )

    lines.append("")
    return lines


def close_section() -> List[str]:
    return [
        "## Closing read",
        "",
        "The useful read is not that any one asset has to move a specific way. The useful read is where attention, narrative, and structure are either confirming one another or separating.",
        "",
        "That separation is where SETA does its work. Attention without validation can still matter, validation without diffusion can still be fragile, and the rare cases where both are present deserve more focus.",
        "",
        "This is interpretation context, not a prediction or trade signal.",
        "",
    ]


def editorial_notes(outline: Dict[str, Any]) -> List[str]:
    lines: List[str] = []
    lines.append("## Editorial notes")
    lines.append("")
    lines.append("- Keep the final version calm and explanatory.")
    lines.append("- Avoid buy/sell language.")
    lines.append("- Treat sentiment as context, not a trigger.")
    lines.append("- Preserve crypto/equity separation.")
    lines.append("- Prefer yes-and framing when responding to outside narratives.")
    lines.append("")
    return lines


def build_draft(outline: Dict[str, Any], snippets: Dict[str, Any], style: Dict[str, Any]) -> Dict[str, Any]:
    date = clean_text(outline.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")
    created_at = datetime.now(UTC).isoformat(timespec="seconds")

    title = clean_text(outline.get("title")) or f"SETA Daily Field Note — {date}"
    subtitle = clean_text(outline.get("subtitle")) or "A SETA field note on participation, narrative, and confirmation beneath price."
    thesis = clean_text(outline.get("thesis"))
    core_angle = clean_text(outline.get("core_angle"))

    lead = outline.get("lead_asset", {}) if isinstance(outline.get("lead_asset"), dict) else {}
    supporting = outline.get("supporting_assets", []) if isinstance(outline.get("supporting_assets"), list) else []

    lines: List[str] = []
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"*{subtitle}*")
    lines.append("")
    lines.append("> Draft-only. SETA explains behavior beneath price. This is interpretation context, not a prediction or trade signal.")
    lines.append("")

    if thesis:
        lines.append("## Thesis")
        lines.append("")
        lines.append(sentence_trim(thesis, 1100))
        lines.append("")

    if core_angle:
        lines.append("## Core angle")
        lines.append("")
        lines.append(sentence_trim(core_angle, 700))
        lines.append("")

    lines.extend(market_context_section(outline))
    lines.extend(lead_section(lead))
    lines.extend(supporting_section(supporting))
    lines.extend(close_section())
    lines.extend(editorial_notes(outline))

    md = "\n".join(lines).strip() + "\n"

    draft = {
        "schema_version": "seta_blog_draft_v1",
        "date": date,
        "created_at_utc": created_at,
        "draft_only": True,
        "posting_performed": False,
        "title": title,
        "slug": make_slug(title),
        "subtitle": subtitle,
        "lead_asset": asset_term(lead),
        "supporting_assets": [asset_term(x) for x in supporting],
        "markdown": md,
        "word_count_estimate": len(re.findall(r"\w+", md)),
        "style_core_identity": clean_text(style.get("core_identity")) or "SETA explains behavior beneath price.",
        "source_outline_title": clean_text(outline.get("title")),
        "guardrails": [
            "Do not predict.",
            "Do not issue trade signals.",
            "Use sentiment as context, not a trigger.",
            "Separate crypto from equities.",
            "Keep human review before publication.",
        ],
    }
    return draft


def build_blog_draft(outline_path: Path, snippets_path: Path, style_path: Path, out_dir: Path) -> Dict[str, Any]:
    outline = load_json(outline_path)
    snippets = load_json(snippets_path, default={})
    style = load_json(style_path, default={})

    draft = build_draft(outline, snippets, style)
    date = draft["date"].replace("/", "-")

    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"seta_blog_draft_{date}.json"
    md_path = out_dir / f"seta_blog_draft_{date}.md"
    latest_json = out_dir / "seta_blog_draft_latest.json"
    latest_md = out_dir / "seta_blog_draft_latest.md"

    write_json(json_path, draft)
    write_json(latest_json, draft)
    md_path.write_text(draft["markdown"], encoding="utf-8")
    latest_md.write_text(draft["markdown"], encoding="utf-8")

    summary = {
        "outline_path": str(outline_path),
        "snippets_path": str(snippets_path),
        "json_path": str(json_path),
        "markdown_path": str(md_path),
        "latest_json": str(latest_json),
        "latest_markdown": str(latest_md),
        "date": draft["date"],
        "title": draft["title"],
        "lead_asset": draft["lead_asset"],
        "supporting_assets": draft["supporting_assets"],
        "word_count_estimate": draft["word_count_estimate"],
        "draft_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA blog draft complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Build draft-only SETA blog/newsletter article from blog outline.")
    ap.add_argument("--outline", default=str(OUTLINE_LATEST), help="Blog outline JSON. Defaults to latest.")
    ap.add_argument("--snippets", default=str(SNIPPETS_LATEST), help="Website snippets JSON.")
    ap.add_argument("--style", default=str(STYLE_JSON), help="SETA style guide JSON.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    args = ap.parse_args()

    outline_path = Path(args.outline)
    snippets_path = Path(args.snippets)
    style_path = Path(args.style)
    out_dir = Path(args.out_dir)

    if not outline_path.exists():
        print(f"[ERROR] Blog outline not found: {outline_path}")
        return 2
    if not snippets_path.exists():
        print(f"[WARN] Website snippets not found: {snippets_path}; continuing with outline only.")
    if not style_path.exists():
        print(f"[WARN] Style guide not found: {style_path}; continuing with built-in guardrails.")

    build_blog_draft(outline_path, snippets_path, style_path, out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
