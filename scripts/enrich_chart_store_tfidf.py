from __future__ import annotations

import argparse
import csv
import json
import math
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]

GENERIC_KEYWORDS = {
    "new", "news", "stock", "stocks", "share", "shares", "market", "markets",
    "price", "prices", "today", "week", "daily", "update", "report", "reports",
    "company", "companies", "million", "billion", "buy", "sell", "free",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
}

def parse_number(value: Any) -> float | None:
    text = str(value or "").strip().replace(",", "")
    if not text or text.lower() in {"nan", "none", "null", "inf", "-inf"}:
        return None
    try:
        num = float(text)
    except ValueError:
        return None
    return None if math.isnan(num) or math.isinf(num) else num

def clean_text(value: Any) -> str:
    text = str(value or "").replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return ""
    return text

def normalize_term(value: Any) -> str:
    return clean_text(value).upper()

def normalize_date(value: Any) -> str:
    text = clean_text(value)
    match = re.search(r"\d{4}-\d{2}-\d{2}", text)
    return match.group(0) if match else text[:10]

def clean_keyword(value: Any) -> str:
    text = clean_text(value).lower()
    text = re.sub(r"^[^\w]+|[^\w]+$", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""
    if len(text) <= 1 or len(text) > 48:
        return ""
    if re.fullmatch(r"[-+]?\d+(\.\d+)?", text):
        return ""
    return text

def keyword_is_generic(keyword: str) -> bool:
    if keyword in GENERIC_KEYWORDS:
        return True
    parts = keyword.split()
    return len(parts) == 1 and parts[0] in GENERIC_KEYWORDS

def add_keyword_compact(selected: list[str], keyword: str, limit: int) -> None:
    if not keyword:
        return

    # Prefer more specific phrases over one-word fragments.
    for i, existing in enumerate(list(selected)):
        if existing == keyword:
            return
        if existing in keyword and len(keyword.split()) > len(existing.split()):
            selected[i] = keyword
            return
        if keyword in existing:
            return

    selected.append(keyword)

    if len(selected) > limit:
        del selected[limit:]

def build_keyword_map(source_csv: Path, max_keywords: int) -> tuple[dict[tuple[str, str], dict[str, Any]], dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)

    with source_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []

        required = {"date", "term", "keyword"}
        missing = sorted(required - set(fieldnames))
        if missing:
            raise RuntimeError(f"TF-IDF source missing required columns: {missing}")

        row_count = 0
        for row in reader:
            row_count += 1
            term = normalize_term(row.get("term"))
            date = normalize_date(row.get("date"))
            keyword = clean_keyword(row.get("keyword"))
            if not term or not date or not keyword:
                continue

            grouped[(term, date)].append({
                "keyword": keyword,
                "rank": parse_number(row.get("keyword_rank")) or 9999,
                "tfidf_share": parse_number(row.get("tfidf_share")) or 0,
                "tfidf_score": parse_number(row.get("tfidf_score")) or 0,
                "hybrid_rank_score": parse_number(row.get("hybrid_rank_score")) or 0,
                "sentiment_label": clean_text(row.get("keyword_sentiment_label")),
            })

    keyword_map: dict[tuple[str, str], dict[str, Any]] = {}

    for key, items in grouped.items():
        items = sorted(
            items,
            key=lambda item: (
                item["rank"],
                -item["hybrid_rank_score"],
                -item["tfidf_share"],
                -item["tfidf_score"],
            )
        )

        selected: list[str] = []

        # First pass: avoid generic one-word junk.
        for item in items:
            kw = item["keyword"]
            if keyword_is_generic(kw):
                continue
            add_keyword_compact(selected, kw, max_keywords)
            if len(selected) >= max_keywords:
                break

        # Fallback: use generic terms only if nothing better exists.
        if not selected:
            for item in items:
                add_keyword_compact(selected, item["keyword"], max_keywords)
                if len(selected) >= max_keywords:
                    break

        if selected:
            keyword_map[key] = {
                "keywords": selected,
                "source_count": len(items),
                "top_share": items[0]["tfidf_share"] if items else None,
            }

    meta = {
        "source_csv": str(source_csv),
        "source_rows": row_count,
        "source_columns": len(fieldnames),
        "term_date_groups": len(grouped),
        "term_date_groups_with_keywords": len(keyword_map),
        "fieldnames": fieldnames,
    }
    return keyword_map, meta

def row_is_attention_relevant(row: dict[str, Any], attention_min: float, conviction_min: float) -> bool:
    attention = parse_number(row.get("attention_level_score"))
    conviction = parse_number(row.get("attention_conviction_score_signed"))
    regime = parse_number(row.get("attention_regime_score"))
    spike = parse_number(row.get("attention_spike_score"))

    if attention is not None and attention >= attention_min:
        return True
    if conviction is not None and abs(conviction) >= conviction_min:
        return True
    if regime is not None and regime >= attention_min:
        return True
    if spike is not None and spike > 0:
        return True

    return False

def enrich_payload(path: Path, keyword_map: dict[tuple[str, str], dict[str, Any]], args: argparse.Namespace) -> dict[str, int]:
    data = json.loads(path.read_text(encoding="utf-8"))

    matched = 0
    enriched = 0

    for freq in ["D", "W"]:
        bucket = data.get(freq)
        if not isinstance(bucket, dict):
            continue

        for asset, rows in bucket.items():
            term = normalize_term(asset)
            if not isinstance(rows, list):
                continue

            for row in rows:
                if not isinstance(row, dict):
                    continue

                date = normalize_date(row.get("date"))
                if not date:
                    continue

                info = keyword_map.get((term, date))
                if not info:
                    continue

                matched += 1

                if not args.all_matches and not row_is_attention_relevant(row, args.attention_min, args.conviction_min):
                    continue

                keywords = info["keywords"][: args.max_keywords]
                if not keywords:
                    continue

                row["attention_tfidf_keywords"] = ", ".join(keywords)
                row["attention_tfidf_top_keyword"] = keywords[0]
                row["attention_tfidf_keyword_count"] = len(keywords)
                row["attention_tfidf_source"] = "tfidf_keywords_exploded"

                if info.get("top_share") is not None:
                    row["attention_tfidf_top_share"] = round(float(info["top_share"]), 6)

                enriched += 1

    if enriched and not args.dry_run:
        path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    return {"matched": matched, "enriched": enriched}

def payload_paths(modes: list[str]) -> list[Path]:
    paths: list[Path] = []

    for mode in modes:
        aggregate = ROOT / f"fix26_chart_store_{mode}.json"
        if aggregate.exists():
            paths.append(aggregate)

        asset_dir = ROOT / "fix26_chart_store_assets" / mode
        if asset_dir.exists():
            paths.extend(sorted(asset_dir.glob("*.json")))

    return paths

def main() -> None:
    parser = argparse.ArgumentParser(description="Enrich chart-store attention rows with daily TF-IDF keywords.")
    parser.add_argument(
        "--csv",
        default=r"C:\Users\shane\Tableau_LocalBackups\tfidf_keywords_exploded.csv",
        help="Path to tfidf_keywords_exploded.csv",
    )
    parser.add_argument("--modes", nargs="+", default=["public", "member"], choices=["public", "member"])
    parser.add_argument("--max-keywords", type=int, default=6)
    parser.add_argument("--attention-min", type=float, default=25.0)
    parser.add_argument("--conviction-min", type=float, default=8.0)
    parser.add_argument("--all-matches", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    source_csv = Path(args.csv)
    if not source_csv.exists():
        raise FileNotFoundError(f"TF-IDF source not found: {source_csv}")

    keyword_map, meta = build_keyword_map(source_csv, args.max_keywords)

    print("[INFO] TF-IDF source")
    print(json.dumps(meta, indent=2))

    totals = {
        "files": 0,
        "changed_files": 0,
        "matched_rows": 0,
        "enriched_rows": 0,
    }

    for path in payload_paths(args.modes):
        result = enrich_payload(path, keyword_map, args)
        totals["files"] += 1
        totals["matched_rows"] += result["matched"]
        totals["enriched_rows"] += result["enriched"]

        if result["enriched"]:
            totals["changed_files"] += 1
            print(f"[OK] {path.relative_to(ROOT)} matched={result['matched']} enriched={result['enriched']}")

    print("[INFO] totals")
    print(json.dumps(totals, indent=2))

    if totals["enriched_rows"] == 0:
        raise RuntimeError("No payload rows enriched. Check source path, term/date joins, or attention thresholds.")

    if args.dry_run:
        print("[DRY-RUN] no files written")

if __name__ == "__main__":
    main()
