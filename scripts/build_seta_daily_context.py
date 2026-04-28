#!/usr/bin/env python
# SETA Daily Context v1 builder.
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from datetime import UTC, datetime
from html import unescape
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

DEFAULT_ROOT = Path(r"G:\My Drive\SETA_AutoSync\outputs")
DEFAULT_OUT = Path("reply_agent") / "daily_context"


def utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")


def latest_by_glob(patterns: Iterable[str]) -> Optional[Path]:
    candidates: List[Path] = []
    for pattern in patterns:
        if ":" in pattern[:3]:
            parent = Path(pattern.split("*")[0]).parent
            candidates.extend(parent.glob(Path(pattern).name) if parent.exists() else [])
        else:
            candidates.extend(Path().glob(pattern))
    existing = [p for p in candidates if p.exists()]
    return max(existing, key=lambda p: (p.stat().st_mtime, str(p))) if existing else None


def find_latest_summary(universe: str, root: Path) -> Optional[Path]:
    return latest_by_glob([
        str(root / "summaries" / f"SETA_{universe}_analysis_*_summary.json"),
        str(root / "summaries" / f"*{universe}*summary*.json"),
    ])


def find_latest_short_analysis(universe: str, root: Path) -> Optional[Path]:
    if universe == "crypto":
        return latest_by_glob([
            str(root / "crypto" / "SETA_crypto_analysis_*.md"),
            str(root / "crypto" / "SETA_crypto_analysis_*.docx"),
        ])
    return latest_by_glob([
        str(root / "equities" / "SETA_equities_analysis_*.docx"),
        str(root / "equities" / "SETA_equities_analysis_*.md"),
    ])


def extract_docx_text(path: Path) -> str:
    try:
        with zipfile.ZipFile(path) as zf:
            xml = zf.read("word/document.xml").decode("utf-8", errors="ignore")
    except Exception:
        return ""
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"</w:tr>", "\n", xml)
    xml = re.sub(r"<[^>]+>", "", xml)
    xml = unescape(xml)
    lines = [ln.strip() for ln in xml.splitlines()]
    return "\n".join([ln for ln in lines if ln])


def read_text_any(path: Optional[Path]) -> str:
    if not path or not path.exists():
        return ""
    if path.suffix.lower() == ".docx":
        return extract_docx_text(path)
    return path.read_text(encoding="utf-8", errors="ignore")


def normalize_term(x: Any) -> str:
    return str(x or "").strip().upper()


def compact_float(x: Any, digits: int = 3) -> Optional[float]:
    try:
        if x is None or x == "":
            return None
        return round(float(x), digits)
    except Exception:
        return None


def get_date_from_summary(summary: Dict[str, Any]) -> Optional[str]:
    dates = summary.get("dates")
    return str(dates[0]) if isinstance(dates, list) and dates else None


def extract_asset_attention(summary: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    table = (((summary.get("asset_attention_summary") or {}).get("table")) or [])
    if not isinstance(table, list):
        return out
    for row in table:
        if not isinstance(row, dict):
            continue
        term = normalize_term(row.get("asset") or row.get("term") or row.get("ticker"))
        if not term:
            continue
        out[term] = {
            "asset_state": row.get("state"),
            "recent_sentiment": compact_float(row.get("recent_sentiment")),
            "sentiment_delta": compact_float(row.get("sentiment_delta")),
            "recent_breadth": compact_float(row.get("recent_breadth")),
            "breadth_delta": compact_float(row.get("breadth_delta")),
            "recent_engagement": compact_float(row.get("recent_engagement")),
            "engagement_delta": compact_float(row.get("engagement_delta")),
            "row_count": row.get("row_count"),
        }
    return out


def extract_sector_attention(summary: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    table = (((summary.get("sector_attention_summary") or {}).get("table")) or [])
    if not isinstance(table, list):
        return out
    for row in table:
        if not isinstance(row, dict):
            continue
        sector = str(row.get("sector") or "").strip()
        if not sector:
            continue
        out[sector] = {
            "sector_state": row.get("state"),
            "recent_sentiment": compact_float(row.get("recent_sentiment")),
            "sentiment_delta": compact_float(row.get("sentiment_delta")),
            "recent_breadth": compact_float(row.get("recent_breadth")),
            "breadth_delta": compact_float(row.get("breadth_delta")),
            "recent_engagement": compact_float(row.get("recent_engagement")),
            "engagement_delta": compact_float(row.get("engagement_delta")),
        }
    return out


def walk_json(obj: Any):
    yield obj
    if isinstance(obj, dict):
        for v in obj.values():
            yield from walk_json(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_json(v)


def extract_decision_pressure(summary: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for node in walk_json(summary):
        if not isinstance(node, dict):
            continue
        term = normalize_term(node.get("asset") or node.get("term") or node.get("ticker"))
        if not term:
            continue
        keys = {str(k).lower().replace(" ", "_"): k for k in node.keys()}
        dp_key = next((keys[c] for c in ("decision_pressure", "decisionpressure", "pressure") if c in keys), None)
        if dp_key is None:
            continue
        out[term] = {
            "decision_pressure": compact_float(node.get(dp_key)),
            "structural_state": node.get(keys.get("structural_state")) if "structural_state" in keys else node.get("Structural State"),
            "resolution_skew": node.get(keys.get("resolution_skew")) if "resolution_skew" in keys else node.get("Resolution Skew"),
        }
    ranked = sorted([(t, v.get("decision_pressure")) for t, v in out.items() if isinstance(v.get("decision_pressure"), (int, float))], key=lambda x: x[1], reverse=True)
    for idx, (term, _) in enumerate(ranked, 1):
        out[term]["decision_pressure_rank"] = idx
    return out


def extract_section(text: str, start_patterns: List[str], stop_patterns: List[str]) -> str:
    if not text:
        return ""
    lines = text.splitlines()
    start = None
    for i, ln in enumerate(lines):
        low = ln.strip().lower()
        if any(re.search(p, low) for p in start_patterns):
            start = i + 1
            break
    if start is None:
        return ""
    end = len(lines)
    for j in range(start, len(lines)):
        low = lines[j].strip().lower()
        if any(re.search(p, low) for p in stop_patterns):
            end = j
            break
    chunk = "\n".join(lines[start:end]).strip()
    chunk = re.sub(r"\n{3,}", "\n\n", chunk)
    return chunk[:4000]


def parse_analyst_takes(text: str) -> Dict[str, str]:
    out: Dict[str, str] = {}
    if not text:
        return out
    in_takes = False
    for raw in text.splitlines():
        line = raw.strip().strip("-•").strip()
        low = line.lower()
        if "one-line analyst" in low or "one line analyst" in low:
            in_takes = True
            continue
        if in_takes and re.match(r"^(optional|bottom line|closing|long-form|equities \||crypto \|)", low):
            in_takes = False
        m = re.match(r"^\$?([A-Z][A-Z0-9]{1,8})\s*:\s*[\"“]?(.*?)[\"”]?$", line)
        if m:
            term, take = m.group(1).upper(), m.group(2).strip()
            if len(take) > 3:
                out[term] = take
    return out


def parse_ranked_table_from_text(text: str) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for line in text.splitlines():
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 3:
            continue
        term = normalize_term(parts[0])
        if not re.match(r"^[A-Z0-9]{2,8}$", term):
            continue
        dp = compact_float(parts[1])
        if dp is None:
            continue
        out[term] = {"decision_pressure": dp, "structural_state": parts[2] if len(parts) > 2 else None, "resolution_skew": parts[3] if len(parts) > 3 else None}
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for i, ln in enumerate(lines):
        term = normalize_term(ln)
        if re.match(r"^[A-Z0-9]{2,8}$", term) and i + 2 < len(lines):
            dp = compact_float(lines[i + 1])
            if dp is not None:
                out.setdefault(term, {})
                out[term].update({"decision_pressure": dp, "structural_state": lines[i + 2] if i + 2 < len(lines) else None})
    ranked = sorted([(t, v.get("decision_pressure")) for t, v in out.items() if isinstance(v.get("decision_pressure"), (int, float))], key=lambda x: x[1], reverse=True)
    for idx, (term, _) in enumerate(ranked, 1):
        out[term]["decision_pressure_rank"] = idx
    return out


def build_universe_context(universe: str, summary_path: Optional[Path], analysis_path: Optional[Path]) -> Dict[str, Any]:
    summary: Dict[str, Any] = read_json(summary_path) if summary_path and summary_path.exists() else {}
    text = read_text_any(analysis_path)
    date = get_date_from_summary(summary)
    asset_attention = extract_asset_attention(summary)
    sector_attention = extract_sector_attention(summary)
    dp_from_summary = extract_decision_pressure(summary)
    analyst_takes = parse_analyst_takes(text)
    dp_from_text = parse_ranked_table_from_text(text)
    macro = extract_section(text, [r"macro synthesis", r"macro narrative"], [r"sector commentary", r"sector transmission", r"asset-level", r"key asset", r"ranked table"])
    sector_commentary = extract_section(text, [r"sector commentary", r"sector transmission"], [r"asset-level", r"key asset", r"ranked table", r"decision pressure", r"one-line"])
    terms = set(asset_attention) | set(dp_from_summary) | set(dp_from_text) | set(analyst_takes)
    assets: Dict[str, Any] = {}
    for term in sorted(terms):
        merged: Dict[str, Any] = {"term": term, "universe": universe}
        if term in asset_attention:
            merged.update(asset_attention[term])
        if term in dp_from_summary:
            merged.update({k: v for k, v in dp_from_summary[term].items() if v is not None})
        if term in dp_from_text:
            merged.update({k: v for k, v in dp_from_text[term].items() if v is not None})
        if term in analyst_takes:
            merged["analyst_take"] = analyst_takes[term]
        assets[term] = merged
    return {
        "universe": universe,
        "date": date,
        "source_files": {"summary_json": str(summary_path) if summary_path else None, "short_analysis": str(analysis_path) if analysis_path else None},
        "summary_meta": {"dates": summary.get("dates"), "windows": summary.get("windows"), "date_mismatch": summary.get("date_mismatch"), "timeframe_mismatch": summary.get("timeframe_mismatch"), "state_counts": (summary.get("asset_attention_summary") or {}).get("state_counts")},
        "macro_synthesis": macro,
        "sector_commentary": sector_commentary,
        "sectors": sector_attention,
        "assets": assets,
    }


def build_daily_context(args: argparse.Namespace) -> Dict[str, Any]:
    root = Path(args.source_root)
    crypto_summary = Path(args.crypto_summary) if args.crypto_summary else find_latest_summary("crypto", root)
    equities_summary = Path(args.equities_summary) if args.equities_summary else find_latest_summary("equities", root)
    crypto_analysis = Path(args.crypto_analysis) if args.crypto_analysis else find_latest_short_analysis("crypto", root)
    equities_analysis = Path(args.equities_analysis) if args.equities_analysis else find_latest_short_analysis("equities", root)
    context: Dict[str, Any] = {"schema_version": "1.0", "kind": "seta_daily_context", "generated_at": utc_stamp(), "builder": "scripts/build_seta_daily_context.py", "universes": {}, "by_term": {}}
    for universe, summary_path, analysis_path in [("crypto", crypto_summary, crypto_analysis), ("equities", equities_summary, equities_analysis)]:
        if not summary_path and not analysis_path:
            print(f"[WARN] no {universe} summary or analysis source found", file=sys.stderr)
            continue
        uctx = build_universe_context(universe, summary_path, analysis_path)
        context["universes"][universe] = uctx
        for term, item in uctx.get("assets", {}).items():
            context["by_term"][term] = item
    dates = [u.get("date") for u in context["universes"].values() if isinstance(u, dict) and u.get("date")]
    context["date"] = dates[0] if dates else datetime.now(UTC).date().isoformat()
    return context


def main() -> int:
    ap = argparse.ArgumentParser(description="Build compact daily SETA context for the social reply agent.")
    ap.add_argument("--source-root", default=str(DEFAULT_ROOT), help="Root folder containing outputs/summaries, crypto, equities.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT), help="Output directory for daily context JSON.")
    ap.add_argument("--crypto-summary", default=None)
    ap.add_argument("--equities-summary", default=None)
    ap.add_argument("--crypto-analysis", default=None)
    ap.add_argument("--equities-analysis", default=None)
    args = ap.parse_args()
    context = build_daily_context(args)
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    date = context.get("date") or datetime.now(UTC).date().isoformat()
    dated_path = out_dir / f"seta_daily_context_{date}.json"
    latest_path = out_dir / "seta_daily_context_latest.json"
    write_json(dated_path, context)
    write_json(latest_path, context)
    print("=" * 72)
    print("SETA daily context complete")
    print(json.dumps({"dated_path": str(dated_path), "latest_path": str(latest_path), "date": date, "universes": sorted(context.get("universes", {}).keys()), "terms": len(context.get("by_term", {})), "draft_only": True}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
