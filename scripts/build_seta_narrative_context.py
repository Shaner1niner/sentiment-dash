#!/usr/bin/env python
"""
Build SETA Narrative TF-IDF Context v1.

Reads the daily TF-IDF narrative JSON exports:
  - seta_narrative_summary_*.json
  - seta_narrative_top_keywords_*.json
  - seta_narrative_top_lifts_*.json

Writes compact, reply-agent-friendly context:
  - reply_agent/narrative_context/seta_narrative_context_<date>.json
  - reply_agent/narrative_context/seta_narrative_context_latest.json

The output is intentionally draft-only and advisory. It is meant to explain
what the live narrative is about, not to create trade recommendations.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = ROOT / "reply_agent" / "narrative_context"

PATTERNS = {
    "summary": "seta_narrative_summary_*.json",
    "top_keywords": "seta_narrative_top_keywords_*.json",
    "top_lifts": "seta_narrative_top_lifts_*.json",
}


def now_utc_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def as_float(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def round_or_none(value: Any, ndigits: int = 4) -> Optional[float]:
    f = as_float(value)
    if f is None:
        return None
    return round(f, ndigits)


def term_key(value: Any) -> str:
    return str(value or "").strip().upper()


def parse_date_from_name(path: Path) -> Optional[str]:
    m = re.search(r"(20\d{2}-\d{2}-\d{2})", path.name)
    return m.group(1) if m else None


def infer_context_date(summary_rows: List[Dict[str, Any]], files: Dict[str, Path]) -> str:
    recent_ends = sorted({str(r.get("recent_end")) for r in summary_rows if r.get("recent_end")})
    if recent_ends:
        return recent_ends[-1]
    for p in files.values():
        d = parse_date_from_name(p)
        if d:
            return d
    return datetime.now(UTC).strftime("%Y-%m-%d")


def candidate_source_roots(explicit: Optional[str]) -> List[Path]:
    roots: List[Path] = []
    if explicit:
        roots.append(Path(explicit))

    env_root = os.environ.get("SETA_NARRATIVE_SOURCE_DIR")
    if env_root:
        roots.append(Path(env_root))

    # Common locations in this project/workflow. Missing paths are harmless.
    roots.extend([
        ROOT,
        ROOT / "reply_agent" / "narrative_source",
        ROOT / "agent_reference" / "narrative_source",
        Path.cwd(),
        Path.home() / "Downloads",
        Path(r"G:\My Drive\SETA_AutoSync"),
        Path(r"G:\My Drive\SETA_AutoSync\outputs"),
    ])

    seen = set()
    unique: List[Path] = []
    for r in roots:
        key = str(r).lower()
        if key not in seen:
            unique.append(r)
            seen.add(key)
    return unique


def find_latest_file(pattern: str, roots: Iterable[Path]) -> Optional[Path]:
    candidates: List[Path] = []
    for root in roots:
        if not root.exists():
            continue
        if root.is_file():
            if root.match(pattern):
                candidates.append(root)
            continue
        try:
            candidates.extend(root.rglob(pattern))
        except OSError:
            continue
    if not candidates:
        return None
    # Prefer most recently modified; filename timestamp usually agrees.
    return sorted(candidates, key=lambda p: (p.stat().st_mtime, p.name), reverse=True)[0]


def find_input_files(source_dir: Optional[str]) -> Dict[str, Path]:
    roots = candidate_source_roots(source_dir)
    found: Dict[str, Path] = {}
    missing: List[str] = []
    for key, pattern in PATTERNS.items():
        path = find_latest_file(pattern, roots)
        if path is None:
            missing.append(pattern)
        else:
            found[key] = path
    if missing:
        searched = "\n  ".join(str(p) for p in roots)
        raise FileNotFoundError(
            "Missing narrative JSON export(s): " + ", ".join(missing) + "\nSearched:\n  " + searched
        )
    return found


def index_ranked_rows(rows: List[Dict[str, Any]], top_n: int) -> Dict[str, List[Dict[str, Any]]]:
    by_term: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        term = term_key(row.get("term"))
        if not term:
            continue
        by_term.setdefault(term, []).append(row)
    for term, term_rows in by_term.items():
        term_rows.sort(key=lambda r: int(r.get("rank") or 999999))
        by_term[term] = term_rows[:top_n]
    return by_term


def clean_keyword_row(row: Dict[str, Any], include_lift: bool = False) -> Dict[str, Any]:
    out = {
        "rank": int(row.get("rank") or 0),
        "keyword": str(row.get("keyword") or "").strip(),
        "share": round_or_none(row.get("share") if "share" in row else row.get("recent_share"), 6),
    }
    if include_lift:
        out["prior_share"] = round_or_none(row.get("prior_share"), 6)
        out["recent_share"] = round_or_none(row.get("recent_share"), 6)
        out["lift"] = round_or_none(row.get("lift"), 6)
    return out


def narrative_note(summary: Dict[str, Any], keywords: List[Dict[str, Any]], lifts: List[Dict[str, Any]]) -> str:
    regime = str(summary.get("narrative_regime") or "Unclassified")
    coh = as_float(summary.get("narrative_coherence_score"))
    top_terms = [k.get("keyword") for k in keywords[:3] if k.get("keyword")]
    lift_terms = [k.get("keyword") for k in lifts[:3] if k.get("keyword")]

    if regime.lower().startswith("churn"):
        base = "Narrative is noisy/churning rather than dominated by one clean theme"
    elif regime.lower() == "unclassified":
        base = "Narrative does not yet classify into a strong single regime"
    else:
        base = f"Narrative regime is {regime}"

    pieces = [base]
    if coh is not None:
        pieces.append(f"coherence {coh:.2f}")
    if top_terms:
        pieces.append("top themes: " + ", ".join(top_terms))
    if lift_terms:
        pieces.append("fresh lifts: " + ", ".join(lift_terms))
    return "; ".join(pieces) + "."


def build_context(files: Dict[str, Path], top_n: int = 5) -> Dict[str, Any]:
    summary_rows = load_json(files["summary"])
    keyword_rows = load_json(files["top_keywords"])
    lift_rows = load_json(files["top_lifts"])

    if not isinstance(summary_rows, list):
        raise ValueError(f"Expected list in {files['summary']}")
    if not isinstance(keyword_rows, list):
        raise ValueError(f"Expected list in {files['top_keywords']}")
    if not isinstance(lift_rows, list):
        raise ValueError(f"Expected list in {files['top_lifts']}")

    kw_by_term = index_ranked_rows(keyword_rows, top_n)
    lift_by_term = index_ranked_rows(lift_rows, top_n)
    context_date = infer_context_date(summary_rows, files)

    by_term: Dict[str, Any] = {}
    for row in summary_rows:
        term = term_key(row.get("term"))
        if not term:
            continue
        keywords = [clean_keyword_row(r) for r in kw_by_term.get(term, [])]
        lifts = [clean_keyword_row(r, include_lift=True) for r in lift_by_term.get(term, [])]
        clean_summary = {
            "recent_start": row.get("recent_start"),
            "recent_end": row.get("recent_end"),
            "prior_start": row.get("prior_start"),
            "prior_end": row.get("prior_end"),
            "combined_rows_recent": row.get("combined_rows_recent"),
            "tfidf_rows_recent": row.get("tfidf_rows_recent"),
            "unique_keywords_recent": row.get("unique_keywords_recent_clean"),
            "top1_share": round_or_none(row.get("top1_share"), 6),
            "top3_share": round_or_none(row.get("top3_share"), 6),
            "entropy_norm": round_or_none(row.get("entropy_norm"), 6),
            "dominance_gap": round_or_none(row.get("dominance_gap"), 6),
            "topk_jaccard": round_or_none(row.get("topk_jaccard"), 6),
            "topk_weighted_overlap": round_or_none(row.get("topk_weighted_overlap"), 6),
            "new_keywords_topk": row.get("new_keywords_topk"),
            "narrative_regime": row.get("narrative_regime") or "Unclassified",
            "narrative_coherence_score": round_or_none(row.get("narrative_coherence_score"), 6),
        }
        by_term[term] = {
            "term": term,
            "summary": clean_summary,
            "top_keywords": keywords,
            "top_lifts": lifts,
            "reply_note": narrative_note(clean_summary, keywords, lifts),
        }

    regime_counts: Dict[str, int] = {}
    for obj in by_term.values():
        reg = obj["summary"].get("narrative_regime") or "Unclassified"
        regime_counts[reg] = regime_counts.get(reg, 0) + 1

    return {
        "schema_version": "seta_narrative_context_v1",
        "generated_at": now_utc_iso(),
        "date": context_date,
        "draft_only": True,
        "source_files": {k: str(v) for k, v in files.items()},
        "terms": len(by_term),
        "regime_counts": regime_counts,
        "by_term": dict(sorted(by_term.items())),
    }


def build_and_write(source_dir: Optional[str], out_dir: Path, top_n: int) -> Dict[str, Any]:
    files = find_input_files(source_dir)
    context = build_context(files, top_n=top_n)
    dated_path = out_dir / f"seta_narrative_context_{context['date']}.json"
    latest_path = out_dir / "seta_narrative_context_latest.json"
    write_json(dated_path, context)
    write_json(latest_path, context)
    return {
        "dated_path": str(dated_path),
        "latest_path": str(latest_path),
        "date": context["date"],
        "terms": context["terms"],
        "regime_counts": context["regime_counts"],
        "draft_only": context["draft_only"],
        "source_files": context["source_files"],
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Build SETA narrative TF-IDF context JSON.")
    parser.add_argument("--source-dir", default=None, help="Directory to search for seta_narrative_*.json exports.")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory for narrative context JSON.")
    parser.add_argument("--top-n", type=int, default=5, help="Number of top keywords/lifts to keep per term.")
    args = parser.parse_args(argv)

    summary = build_and_write(args.source_dir, Path(args.out_dir), args.top_n)
    print("=" * 72)
    print("SETA narrative TF-IDF context complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
