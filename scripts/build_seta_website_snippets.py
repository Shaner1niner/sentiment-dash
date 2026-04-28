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


def headline_for(row: Dict[str, Any]) -> str:
    term = clean_text(row.get("term")).upper()
    angle = clean_text(row.get("content_angle"))
    state = clean_text(row.get("asset_state")).lower()
    narrative = clean_text(row.get("narrative_regime")).lower()
    rank = row.get("decision_pressure_rank")

    if "noise" in narrative or "churn" in narrative:
        return f"{term}: signal versus narrative noise"
    if "diffusion" in state:
        return f"{term}: participation is broadening"
    if "disagreement" in state:
        return f"{term}: contested structure"
    if "repair" in state:
        return f"{term}: repair watch"
    if rank not in (None, "", "nan"):
        return f"{term}: decision-pressure watch"
    if angle:
        return f"{term}: {angle}"
    return f"{term}: SETA context"


def regime_note_for(row: Dict[str, Any]) -> str:
    state = clean_text(row.get("asset_state"))
    structural = clean_text(row.get("structural_state"))
    skew = clean_text(row.get("resolution_skew"))
    rank = row.get("decision_pressure_rank")

    pieces: List[str] = []
    if state:
        pieces.append(f"Daily state: {state}.")
    if structural:
        pieces.append(f"Structure: {structural}.")
    if rank not in (None, "", "nan"):
        pieces.append(f"Decision-pressure rank: {rank}.")
    if skew and skew.lower() != "unknown":
        pieces.append(f"Resolution skew: {skew}.")
    return " ".join(pieces)


def narrative_note_for(row: Dict[str, Any]) -> str:
    regime = clean_text(row.get("narrative_regime"))
    coherence = clean_text(row.get("narrative_coherence_bucket"))
    kw = keyword_phrase(row.get("narrative_top_keywords"))

    if not regime and not coherence and not kw:
        return ""

    parts: List[str] = []
    if regime:
        parts.append(f"Narrative regime: {regime}.")
    if coherence:
        parts.append(f"Coherence: {coherence}.")
    if kw:
        parts.append(f"Current themes: {kw}.")
    return " ".join(parts)


def short_explanation_for(row: Dict[str, Any]) -> str:
    website_note = clean_text(row.get("website_note"))
    if website_note:
        return sentence_trim(website_note, 360)

    term = clean_text(row.get("term")).upper()
    state_phrase = friendly_state(row.get("asset_state"))
    structural = clean_text(row.get("structural_state"))
    if state_phrase:
        msg = f"{term} is in a SETA state where {state_phrase}."
        if structural:
            msg += f" Structural read: {structural}."
        msg += " This is context for interpretation, not a prediction."
        return msg

    return f"{term} has a SETA context read available. This is context for interpretation, not a prediction."


def social_blurb_for(row: Dict[str, Any]) -> str:
    text = clean_text(row.get("social_hook"))
    if text:
        return sentence_trim(text, 260)
    return sentence_trim(short_explanation_for(row), 240)


def build_snippet(row: Dict[str, Any], packet_date: str, created_at: str) -> Dict[str, Any]:
    term = clean_text(row.get("term")).upper()
    narrative_note = narrative_note_for(row)
    regime_note = regime_note_for(row)

    snippet = {
        "term": term,
        "universe": normalize_universe(row.get("universe")),
        "headline": sentence_trim(headline_for(row), 90),
        "short_explanation": short_explanation_for(row),
        "regime_note": regime_note,
        "narrative_note": narrative_note,
        "social_blurb": social_blurb_for(row),
        "risk_note": "Useful context for interpretation, not a prediction or trade signal.",
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
    for s in payload.get("snippets", []):
        lines.append(f"## {s.get('headline')}")
        lines.append("")
        lines.append(s.get("short_explanation", ""))
        lines.append("")
        if s.get("regime_note"):
            lines.append(f"**Regime:** {s.get('regime_note')}")
            lines.append("")
        if s.get("narrative_note"):
            lines.append(f"**Narrative:** {s.get('narrative_note')}")
            lines.append("")
        lines.append(f"**Risk note:** {s.get('risk_note')}")
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


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
