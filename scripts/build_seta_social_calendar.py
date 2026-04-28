#!/usr/bin/env python
"""
SETA Social Content Calendar v1

Builds draft-only daily social post candidates from:
  - reply_agent/blog_drafts/seta_blog_draft_latest.json
  - reply_agent/website_snippets/seta_website_snippets_latest.json
  - reply_agent/blog_outlines/seta_blog_outline_latest.json
  - agent_reference/seta_style_guide_v2_2.json

Outputs:
  reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.json
  reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.csv
  reply_agent/social_calendar/seta_social_calendar_YYYY-MM-DD.md
  reply_agent/social_calendar/seta_social_calendar_latest.json
  reply_agent/social_calendar/seta_social_calendar_latest.md

No posting. No API calls. Draft-only.
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
BLOG_DRAFT_LATEST = REPO_ROOT / "reply_agent" / "blog_drafts" / "seta_blog_draft_latest.json"
WEBSITE_SNIPPETS_LATEST = REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json"
BLOG_OUTLINE_LATEST = REPO_ROOT / "reply_agent" / "blog_outlines" / "seta_blog_outline_latest.json"
STYLE_JSON = REPO_ROOT / "agent_reference" / "seta_style_guide_v2_2.json"
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "social_calendar"


PLATFORM_LIMITS = {
    "x": 280,
    "bsky": 300,
    "reddit": 1200,
}


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


def sentence_trim(text: str, max_chars: int) -> str:
    text = clean_text(text)
    if len(text) <= max_chars:
        return text
    cut = text[:max_chars].rstrip()
    last = max(cut.rfind("."), cut.rfind(";"))
    if last >= max(80, int(max_chars * 0.45)):
        return cut[: last + 1]
    return cut.rstrip(" ,;:") + "..."


def normalize_universe(v: Any) -> str:
    s = clean_text(v).lower()
    if s in {"crypto", "cryptos", "digital assets"}:
        return "crypto"
    if s in {"equity", "equities", "stocks", "stock"}:
        return "equities"
    return s or "unknown"


def term_tag(term: str) -> str:
    term = clean_text(term).upper()
    if not term:
        return ""
    return f"${term}"


def safe_post(text: str, platform: str) -> str:
    limit = PLATFORM_LIMITS.get(platform, 280)
    return sentence_trim(text, limit)


def by_term(snippets_payload: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    data = snippets_payload.get("by_term", {})
    if isinstance(data, dict):
        return {str(k).upper(): v for k, v in data.items() if isinstance(v, dict)}
    snippets = snippets_payload.get("snippets", [])
    if not isinstance(snippets, list):
        return {}
    return {clean_text(s.get("term")).upper(): s for s in snippets if isinstance(s, dict) and clean_text(s.get("term"))}



def compact_seta_read(read: Any) -> str:
    text = clean_text(read)
    if not text:
        return ""
    parts = [p.strip() for p in text.split("|") if p.strip()]
    if len(parts) <= 3:
        return " | ".join(parts)
    return " | ".join(parts[:3])


def short_archetype_phrase(snippet: Dict[str, Any]) -> str:
    arch = clean_text(snippet.get("copy_archetype")).replace("_", " ").strip()
    if not arch:
        return "context watch"
    mapping = {
        "participation diffusion": "participation broadening",
        "broadening participation": "participation broadening",
        "contested structure": "contested structure",
        "repair watch": "repair watch",
        "narrative churn": "narrative churn",
        "validation risk": "validation risk",
        "decision pressure": "decision pressure",
    }
    return mapping.get(arch, arch)


def x_hook(snippet: Dict[str, Any]) -> str:
    term = term_tag(snippet.get("term"))
    phrase = short_archetype_phrase(snippet)
    theme = clean_text(snippet.get("narrative_theme"))
    read = compact_seta_read(snippet.get("seta_read_line"))

    if "participation" in phrase:
        base = f"{term}: participation is broadening. The question is whether breadth earns confirmation."
    elif phrase == "contested structure":
        base = f"{term}: active tape, contested structure. Not clean confirmation yet."
    elif phrase == "repair watch":
        base = f"{term}: repair watch. The key is whether sponsorship rebuilds beneath the move."
    elif phrase == "narrative churn":
        if theme:
            base = f"{term}: attention is active, but the story is still rotating around {theme}."
        else:
            base = f"{term}: attention is active, but the story is not anchored yet."
    else:
        base = f"{term}: SETA read is {phrase}."

    if read:
        base += f" SETA: {read}."
    base += " Context, not a signal."
    return safe_post(base, "x")


def x_watch(snippet: Dict[str, Any]) -> str:
    term = term_tag(snippet.get("term"))
    watch = clean_text(snippet.get("watch_condition"))
    if watch.lower().startswith("watch whether"):
        watch = watch[len("watch "):]
    text = f"{term} watch: {watch or clean_text(snippet.get('one_liner'))}. SETA is tracking confirmation, not making a price call."
    return safe_post(text, "x")


def bsky_note(snippet: Dict[str, Any]) -> str:
    term = term_tag(snippet.get("term"))
    one = clean_text(snippet.get("one_liner"))
    public_note = clean_text(snippet.get("public_note"))
    watch = clean_text(snippet.get("watch_condition"))

    lines = [f"{term}: {one}"]
    if public_note and public_note.lower() not in one.lower():
        lines.append("")
        lines.append(public_note)
    if watch:
        lines.append("")
        lines.append(f"Watching: {watch}")
    lines.append("")
    lines.append("Context, not a trade signal.")
    return safe_post(chr(10).join(lines), "bsky")


def bsky_watch(snippet: Dict[str, Any]) -> str:
    term = term_tag(snippet.get("term"))
    watch = clean_text(snippet.get("watch_condition"))
    read = compact_seta_read(snippet.get("seta_read_line"))
    text = f"{term} watch condition:" + chr(10) + watch
    if read:
        text += chr(10) + chr(10) + f"SETA read: {read}"
    text += chr(10) + chr(10) + "Interpretation context only."
    return safe_post(text, "bsky")


def reddit_seed(snippet: Dict[str, Any]) -> str:
    term = term_tag(snippet.get("term"))
    public_note = clean_text(snippet.get("public_note") or snippet.get("short_explanation"))
    watch = clean_text(snippet.get("watch_condition"))
    read = compact_seta_read(snippet.get("seta_read_line"))
    narrative = clean_text(snippet.get("narrative_note"))

    parts = [
        f"My SETA read on {term}:",
        "",
        public_note,
    ]

    if narrative:
        parts.extend(["", f"Narrative layer: {narrative}"])
    if watch:
        parts.extend(["", f"Watch condition: {watch}"])
    if read:
        parts.extend(["", f"SETA read: {read}"])

    parts.extend([
        "",
        "I would treat this as context for participation, narrative, and structure -- not as financial advice or a buy/sell call.",
    ])

    return safe_post(chr(10).join(parts), "reddit")


def row_priority(row: Dict[str, Any]) -> int:
    ctype = clean_text(row.get("content_type"))
    platform = clean_text(row.get("platform"))
    if ctype == "blog_thread_opener":
        return 0
    if ctype == "blog_theme_note":
        return 1
    if platform == "x":
        return 2
    if platform == "bsky":
        return 3
    if platform == "reddit":
        return 4
    return 9

def make_x_post(snippet: Dict[str, Any], variant: str = "asset") -> str:
    if variant == "watch":
        return x_watch(snippet)
    if variant == "theme":
        theme = clean_text(snippet.get("narrative_theme"))
        term = term_tag(snippet.get("term"))
        if theme:
            return safe_post(f"{term}: attention is active, but the live theme is still {theme}. SETA is watching whether it becomes coherent or stays as churn. Context, not a signal.", "x")
    return x_hook(snippet)

def make_bsky_post(snippet: Dict[str, Any], variant: str = "asset") -> str:
    if variant == "watch":
        return bsky_watch(snippet)
    return bsky_note(snippet)

def make_reddit_comment(snippet: Dict[str, Any]) -> str:
    return reddit_seed(snippet)

def blog_thread_posts(blog_draft: Dict[str, Any], outline: Dict[str, Any]) -> List[Dict[str, Any]]:
    title = clean_text(blog_draft.get("title"))
    lead = clean_text(blog_draft.get("lead_asset"))
    thesis = clean_text(outline.get("thesis"))
    core_angle = clean_text(outline.get("core_angle"))

    posts: List[Dict[str, Any]] = []

    if title and thesis:
        text = (
            f"SETA field note: {title}. "
            f"The point is not prediction; it is where participation, narrative, and structure are confirming or separating."
        )
        posts.append({
            "platform": "x",
            "content_type": "blog_thread_opener",
            "term": lead,
            "draft_text": safe_post(text, "x"),
            "status": "pending",
            "requires_human_review": True,
        })

    if core_angle:
        text = (
            f"Today's SETA angle:" + chr(10) + f"{core_angle}" + chr(10) + chr(10) +
            "We are watching behavior beneath price: participation, narrative, and confirmation."
        )
        posts.append({
            "platform": "bsky",
            "content_type": "blog_theme_note",
            "term": lead,
            "draft_text": safe_post(text, "bsky"),
            "status": "pending",
            "requires_human_review": True,
        })

    return posts

def build_rows(snippets_payload: Dict[str, Any], blog_draft: Dict[str, Any], outline: Dict[str, Any], max_assets: int = 6) -> List[Dict[str, Any]]:
    snippets = snippets_payload.get("snippets", [])
    if not isinstance(snippets, list):
        snippets = []

    def rank_key(s: Dict[str, Any]) -> tuple:
        try:
            rank = float(s.get("decision_pressure_rank"))
        except Exception:
            rank = 999.0
        return (rank, clean_text(s.get("term")))

    top = sorted([s for s in snippets if isinstance(s, dict)], key=rank_key)[:max_assets]

    rows: List[Dict[str, Any]] = []
    date = clean_text(snippets_payload.get("date") or blog_draft.get("date") or outline.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")

    for idx, row in enumerate(blog_thread_posts(blog_draft, outline), start=1):
        row.update({
            "id": f"{date}_theme_{idx}",
            "date": date,
            "source": "blog_draft",
            "draft_only": True,
            "posting_performed": False,
            "risk_level": "low",
            "char_count": len(row.get("draft_text", "")),
        })
        rows.append(row)

    for s in top:
        term = clean_text(s.get("term")).upper()
        archetype = clean_text(s.get("copy_archetype"))
        universe = normalize_universe(s.get("universe"))

        candidates = [
            ("x", "asset_context", make_x_post(s, "asset")),
            ("x", "watch_condition", make_x_post(s, "watch")),
            ("bsky", "asset_context", make_bsky_post(s, "asset")),
            ("bsky", "watch_condition", make_bsky_post(s, "watch")),
            ("reddit", "discussion_reply_seed", make_reddit_comment(s)),
        ]

        if clean_text(s.get("narrative_theme")) and clean_text(s.get("copy_archetype")) == "narrative_churn":
            candidates.append(("x", "narrative_theme", make_x_post(s, "theme")))

        for platform, ctype, text in candidates:
            rows.append({
                "id": f"{date}_{platform}_{term}_{ctype}",
                "date": date,
                "platform": platform,
                "term": term,
                "universe": universe,
                "content_type": ctype,
                "copy_archetype": archetype,
                "draft_text": text,
                "char_count": len(text),
                "status": "pending",
                "requires_human_review": True,
                "risk_level": "low" if ctype != "discussion_reply_seed" else "medium",
                "source": "website_snippets",
                "draft_only": True,
                "posting_performed": False,
            })

    return sorted(rows, key=row_priority)

def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "id", "date", "platform", "term", "universe", "content_type",
        "copy_archetype", "draft_text", "char_count", "status",
        "requires_human_review", "risk_level", "source",
        "draft_only", "posting_performed",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow(row)


def markdown_calendar(payload: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append(f"# SETA Social Content Calendar -- {payload.get('date')}")
    lines.append("")
    lines.append("Draft-only social post candidates. Nothing here is posted automatically.")
    lines.append("")
    lines.append("> SETA explains behavior beneath price. Context, not predictions or trade signals.")
    lines.append("")

    by_platform: Dict[str, List[Dict[str, Any]]] = {}
    for row in payload.get("rows", []):
        by_platform.setdefault(row.get("platform", "unknown"), []).append(row)

    for platform in ["x", "bsky", "reddit", "unknown"]:
        items = by_platform.get(platform, [])
        if not items:
            continue

        label = {"x": "X", "bsky": "Bluesky", "reddit": "Reddit"}.get(platform, platform.upper())
        lines.append(f"## {label}")
        lines.append("")

        for row in items:
            term = row.get("term") or "theme"
            ctype = clean_text(row.get("content_type")).replace("_", " ")
            lines.append(f"### {ctype} -- {term}")
            lines.append("")
            lines.append("```text")
            lines.append(row.get("draft_text", ""))
            lines.append("```")
            lines.append("")
            lines.append(f"Status: {row.get('status')} | Review: {row.get('requires_human_review')} | Risk: {row.get('risk_level')} | Chars: {row.get('char_count')}")
            lines.append("")
            lines.append("---")
            lines.append("")

    return chr(10).join(lines)

def build_social_calendar(
    blog_draft_path: Path,
    snippets_path: Path,
    outline_path: Path,
    style_path: Path,
    out_dir: Path,
    max_assets: int,
) -> Dict[str, Any]:
    blog_draft = load_json(blog_draft_path)
    snippets = load_json(snippets_path)
    outline = load_json(outline_path, default={})
    style = load_json(style_path, default={})

    date = clean_text(snippets.get("date") or blog_draft.get("date") or outline.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")
    created_at = datetime.now(UTC).isoformat(timespec="seconds")
    rows = build_rows(snippets, blog_draft, outline, max_assets=max_assets)

    payload = {
        "schema_version": "seta_social_calendar_v1",
        "date": date,
        "created_at_utc": created_at,
        "draft_only": True,
        "posting_performed": False,
        "requires_human_review": True,
        "source_files": {
            "blog_draft": str(blog_draft_path),
            "website_snippets": str(snippets_path),
            "blog_outline": str(outline_path),
            "style_guide": str(style_path),
        },
        "style_core_identity": clean_text(style.get("core_identity")) or "SETA explains behavior beneath price.",
        "rows": rows,
        "counts": {
            "rows": len(rows),
            "x": sum(1 for r in rows if r.get("platform") == "x"),
            "bsky": sum(1 for r in rows if r.get("platform") == "bsky"),
            "reddit": sum(1 for r in rows if r.get("platform") == "reddit"),
        },
    }

    safe_date = date.replace("/", "-")
    out_dir.mkdir(parents=True, exist_ok=True)

    dated_json = out_dir / f"seta_social_calendar_{safe_date}.json"
    latest_json = out_dir / "seta_social_calendar_latest.json"
    dated_csv = out_dir / f"seta_social_calendar_{safe_date}.csv"
    dated_md = out_dir / f"seta_social_calendar_{safe_date}.md"
    latest_md = out_dir / "seta_social_calendar_latest.md"

    md = markdown_calendar(payload)

    write_json(dated_json, payload)
    write_json(latest_json, payload)
    write_csv(dated_csv, rows)
    dated_md.write_text(md, encoding="utf-8")
    latest_md.write_text(md, encoding="utf-8")

    summary = {
        "json_path": str(dated_json),
        "latest_json": str(latest_json),
        "csv_path": str(dated_csv),
        "markdown_path": str(dated_md),
        "latest_markdown": str(latest_md),
        "date": date,
        "rows": len(rows),
        "counts": payload["counts"],
        "draft_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA social content calendar complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description="Build draft-only SETA social content calendar.")
    ap.add_argument("--blog-draft", default=str(BLOG_DRAFT_LATEST))
    ap.add_argument("--snippets", default=str(WEBSITE_SNIPPETS_LATEST))
    ap.add_argument("--outline", default=str(BLOG_OUTLINE_LATEST))
    ap.add_argument("--style", default=str(STYLE_JSON))
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--max-assets", type=int, default=6)
    args = ap.parse_args()

    for path_text, label in [
        (args.blog_draft, "blog draft"),
        (args.snippets, "website snippets"),
    ]:
        if not Path(path_text).exists():
            print(f"[ERROR] Missing {label}: {path_text}")
            return 2

    build_social_calendar(
        blog_draft_path=Path(args.blog_draft),
        snippets_path=Path(args.snippets),
        outline_path=Path(args.outline),
        style_path=Path(args.style),
        out_dir=Path(args.out_dir),
        max_assets=args.max_assets,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
