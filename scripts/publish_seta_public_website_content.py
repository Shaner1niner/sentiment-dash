#!/usr/bin/env python
from __future__ import annotations

import argparse, json, re
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT_JSON = REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json"
DEFAULT_INPUT_MD = REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.md"
DEFAULT_OUT_DIR = REPO_ROOT / "public_content"

PUBLIC_SNIPPET_FIELDS = [
    "term", "universe", "copy_archetype", "narrative_theme", "headline",
    "one_liner", "public_note", "short_explanation", "expanded_explanation",
    "watch_condition", "seta_read_line", "regime_note", "narrative_note",
    "social_blurb", "risk_note", "content_angle", "asset_state",
    "decision_pressure_rank", "structural_state", "resolution_skew",
    "narrative_regime", "narrative_coherence_bucket", "narrative_top_keywords",
    "updated_at",
]

def clean_text(v: Any) -> str:
    if v is None:
        return ""
    s = re.sub(r"\s+", " ", str(v).strip())
    return "" if s.lower() in {"nan", "none", "null"} else s

def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)

def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")

def public_value(v: Any) -> Any:
    if isinstance(v, dict):
        return {str(k): public_value(x) for k, x in v.items()}
    if isinstance(v, list):
        return [public_value(x) for x in v]
    if isinstance(v, float) and v != v:
        return None
    return v

def sanitize_keyword_list(v: Any) -> List[Any]:
    if not isinstance(v, list):
        return []
    out = []
    for item in v:
        if isinstance(item, dict):
            clean = {}
            for key in ["keyword", "term", "rank", "share", "score"]:
                if key in item:
                    clean[key] = public_value(item.get(key))
            if clean:
                out.append(clean)
        else:
            text = clean_text(item)
            if text:
                out.append(text)
    return out

def sanitize_snippet(snippet: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for field in PUBLIC_SNIPPET_FIELDS:
        if field in snippet:
            value = snippet.get(field)
            if field == "narrative_top_keywords":
                value = sanitize_keyword_list(value)
            out[field] = public_value(value)
    term = clean_text(out.get("term")).upper()
    out["term"] = term
    out.setdefault("headline", f"{term}: SETA context")
    out.setdefault("risk_note", "Interpretation context only; not a prediction or trade signal.")
    return out

def build_public_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    snippets_raw = payload.get("snippets", [])
    if not isinstance(snippets_raw, list):
        snippets_raw = []
    snippets = [sanitize_snippet(s) for s in snippets_raw if isinstance(s, dict) and clean_text(s.get("term"))]
    by_term = {s["term"]: s for s in snippets if s.get("term")}
    date = clean_text(payload.get("date")) or datetime.now(UTC).strftime("%Y-%m-%d")
    return {
        "schema_version": "seta_public_website_snippets_v1",
        "date": date,
        "published_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
        "draft_only": False,
        "public_safe": True,
        "posting_performed": False,
        "description": "Public-safe SETA website explanation snippets. Interpretation context only; not predictions or trade signals.",
        "snippets": snippets,
        "by_term": by_term,
        "counts": {"snippets": len(snippets), "terms": len(by_term)},
    }

def public_markdown(payload: Dict[str, Any]) -> str:
    lines = [
        f"# SETA Website Snippets — {payload.get('date')}",
        "",
        "Public-safe explanation copy for website/dashboard display.",
        "",
        "> SETA explains behavior beneath price. Interpretation context only; not predictions or trade signals.",
        "",
    ]
    for s in payload.get("snippets", []):
        if not isinstance(s, dict):
            continue
        lines += [f"## {s.get('headline')}", ""]
        lines += [str(s.get("public_note") or s.get("one_liner") or ""), ""]
        if s.get("watch_condition"):
            lines += [f"**Watch condition:** {s.get('watch_condition')}", ""]
        if s.get("seta_read_line"):
            lines += [f"**SETA read:** {s.get('seta_read_line')}", ""]
        if s.get("risk_note"):
            lines += [f"**Risk note:** {s.get('risk_note')}", ""]
        lines += ["---", ""]
    return "\n".join(lines)

def publish(input_json: Path, input_md: Path, out_dir: Path) -> Dict[str, Any]:
    if not input_json.exists():
        raise SystemExit(f"[ERROR] Missing website snippets JSON: {input_json}")
    public_payload = build_public_payload(load_json(input_json))
    date = str(public_payload.get("date", "")).replace("/", "-")
    out_dir.mkdir(parents=True, exist_ok=True)
    dated_json = out_dir / f"seta_website_snippets_{date}.json"
    latest_json = out_dir / "seta_website_snippets_latest.json"
    dated_md = out_dir / f"seta_website_snippets_{date}.md"
    latest_md = out_dir / "seta_website_snippets_latest.md"
    md_text = public_markdown(public_payload)
    write_json(dated_json, public_payload)
    write_json(latest_json, public_payload)
    dated_md.write_text(md_text, encoding="utf-8")
    latest_md.write_text(md_text, encoding="utf-8")
    summary = {
        "input_json": str(input_json), "dated_json": str(dated_json),
        "latest_json": str(latest_json), "dated_markdown": str(dated_md),
        "latest_markdown": str(latest_md), "date": public_payload.get("date"),
        "snippets": public_payload.get("counts", {}).get("snippets"),
        "terms": public_payload.get("counts", {}).get("terms"),
        "public_safe": True, "posting_performed": False,
    }
    print("=" * 76)
    print("SETA public website content publish complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary

def main() -> int:
    ap = argparse.ArgumentParser(description="Publish public-safe SETA website snippets.")
    ap.add_argument("--input-json", default=str(DEFAULT_INPUT_JSON))
    ap.add_argument("--input-md", default=str(DEFAULT_INPUT_MD))
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    args = ap.parse_args()
    publish(Path(args.input_json), Path(args.input_md), Path(args.out_dir))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
