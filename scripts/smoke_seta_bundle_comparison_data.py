#!/usr/bin/env python
"""Data-backed smoke test for SETA equal-vs-mcap staged bundle comparisons.

This validates that the real staged bundle can produce matched equal-vs-mcap
rank comparisons across every universe/level pair. It complements the UI wiring
smoke tests by checking the actual data path.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MANIFEST = ROOT / "seta_bundles" / "latest" / "manifest.json"
UNIVERSES = ("all", "crypto", "stocks")
ROLES = ("ecosystem", "sector", "asset", "multi_level")
RANK_COLUMN_HINTS = (
    "seta_score",
    "seta",
    "score",
    "sentiment_score",
    "sentiment",
    "value",
    "weighted_score",
    "combined_score",
    "rank_score",
)
LABEL_COLUMN_HINTS = ("term", "asset", "name", "sector", "ecosystem", "symbol", "label")

ERRORS: list[str] = []
WARNINGS: list[str] = []


@dataclass(frozen=True)
class RankedRow:
    label: str
    rank: int
    value: float


@dataclass(frozen=True)
class ComparisonRow:
    label: str
    equal_rank: int
    mcap_rank: int
    delta: int
    equal_value: float
    mcap_value: float


def ok(message: str) -> None:
    print(f"[OK] {message}")


def warn(message: str) -> None:
    WARNINGS.append(message)
    print(f"[WARN] {message}")


def fail(message: str) -> None:
    ERRORS.append(message)
    print(f"[ERROR] {message}")


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig")


def load_json(path: Path) -> Any:
    try:
        return json.loads(read_text(path))
    except Exception as exc:
        fail(f"manifest is not valid JSON: {exc}")
        return None


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    cleaned = str(value).strip().replace("$", "").replace("%", "").replace(",", "")
    if not cleaned:
        return None
    try:
        parsed = float(cleaned)
    except ValueError:
        return None
    if parsed != parsed:
        return None
    return parsed


def normalized_column_name(column: str) -> str:
    cleaned = "".join(ch.lower() if ch.isalnum() else "_" for ch in str(column).strip())
    while "__" in cleaned:
        cleaned = cleaned.replace("__", "_")
    return cleaned.strip("_")


def read_csv_rows(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        headers = list(reader.fieldnames or [])
        rows = [dict(row) for row in reader]
    return headers, rows


def numeric_count(rows: list[dict[str, str]], column: str) -> int:
    return sum(1 for row in rows if parse_number(row.get(column)) is not None)


def choose_rank_column(headers: list[str], rows: list[dict[str, str]]) -> str | None:
    usable = [
        {"column": column, "normalized": normalized_column_name(column), "count": numeric_count(rows, column)}
        for column in headers
    ]
    usable = [item for item in usable if int(item["count"]) > 0]
    if not usable:
        return None

    for hint in RANK_COLUMN_HINTS:
        for item in usable:
            if item["normalized"] == hint:
                return str(item["column"])
    for hint in RANK_COLUMN_HINTS:
        for item in usable:
            if hint in str(item["normalized"]):
                return str(item["column"])
    usable.sort(key=lambda item: int(item["count"]), reverse=True)
    return str(usable[0]["column"])


def choose_shared_rank_column(
    equal_headers: list[str],
    equal_rows: list[dict[str, str]],
    mcap_headers: list[str],
    mcap_rows: list[dict[str, str]],
) -> str | None:
    equal_preferred = choose_rank_column(equal_headers, equal_rows)
    if equal_preferred and equal_preferred in mcap_headers and numeric_count(mcap_rows, equal_preferred) > 0:
        return equal_preferred
    mcap_preferred = choose_rank_column(mcap_headers, mcap_rows)
    if mcap_preferred and mcap_preferred in equal_headers and numeric_count(equal_rows, mcap_preferred) > 0:
        return mcap_preferred
    shared = [column for column in equal_headers if column in mcap_headers]
    return choose_rank_column(shared, equal_rows + mcap_rows)


def choose_label_column(headers: list[str]) -> str | None:
    if not headers:
        return None
    normalized = [(column, normalized_column_name(column)) for column in headers]
    for hint in LABEL_COLUMN_HINTS:
        for column, normalized in normalized:
            if normalized == hint:
                return column
    for hint in LABEL_COLUMN_HINTS:
        for column, normalized in normalized:
            if hint in normalized:
                return column
    return headers[0]


def choose_shared_label_column(equal_headers: list[str], mcap_headers: list[str]) -> str | None:
    equal_label = choose_label_column(equal_headers)
    if equal_label and equal_label in mcap_headers:
        return equal_label
    mcap_label = choose_label_column(mcap_headers)
    if mcap_label and mcap_label in equal_headers:
        return mcap_label
    for column in equal_headers:
        if column in mcap_headers:
            return column
    return None


def ranked_by_label(rows: list[dict[str, str]], label_column: str, rank_column: str) -> dict[str, RankedRow]:
    ranked: list[tuple[str, float]] = []
    for row in rows:
        label = str(row.get(label_column) or "").strip()
        value = parse_number(row.get(rank_column))
        if not label or value is None:
            continue
        ranked.append((label, value))
    ranked.sort(key=lambda item: item[1], reverse=True)

    by_label: dict[str, RankedRow] = {}
    for idx, (label, value) in enumerate(ranked, start=1):
        if label not in by_label:
            by_label[label] = RankedRow(label=label, rank=idx, value=value)
    return by_label


def compare_files(equal_path: Path, mcap_path: Path) -> dict[str, Any]:
    equal_headers, equal_rows = read_csv_rows(equal_path)
    mcap_headers, mcap_rows = read_csv_rows(mcap_path)
    rank_column = choose_shared_rank_column(equal_headers, equal_rows, mcap_headers, mcap_rows)
    label_column = choose_shared_label_column(equal_headers, mcap_headers)
    if not rank_column or not label_column:
        return {
            "rank_column": rank_column,
            "label_column": label_column,
            "matched_rows": [],
            "risers": [],
            "decliners": [],
            "equal_rows": len(equal_rows),
            "mcap_rows": len(mcap_rows),
        }

    equal_by_label = ranked_by_label(equal_rows, label_column, rank_column)
    mcap_by_label = ranked_by_label(mcap_rows, label_column, rank_column)
    matched: list[ComparisonRow] = []
    for label, equal_item in equal_by_label.items():
        mcap_item = mcap_by_label.get(label)
        if not mcap_item:
            continue
        matched.append(
            ComparisonRow(
                label=label,
                equal_rank=equal_item.rank,
                mcap_rank=mcap_item.rank,
                delta=equal_item.rank - mcap_item.rank,
                equal_value=equal_item.value,
                mcap_value=mcap_item.value,
            )
        )
    risers = sorted(matched, key=lambda row: row.delta, reverse=True)[:5]
    decliners = sorted(matched, key=lambda row: row.delta)[:5]
    return {
        "rank_column": rank_column,
        "label_column": label_column,
        "matched_rows": matched,
        "risers": risers,
        "decliners": decliners,
        "equal_rows": len(equal_rows),
        "mcap_rows": len(mcap_rows),
    }


def rel_from_manifest(manifest: dict[str, Any], universe: str, weighting: str, role: str) -> str | None:
    try:
        value = manifest["files"][universe][weighting][role]
    except Exception:
        return None
    return value if isinstance(value, str) and value.strip() else None


def format_rows(rows: list[ComparisonRow]) -> str:
    if not rows:
        return "none"
    return ", ".join(f"{row.label}(E{row.equal_rank}/M{row.mcap_rank}/d{row.delta:+d})" for row in rows)


def check_matrix(manifest_path: Path, min_matched_rows: int) -> None:
    if not manifest_path.exists():
        fail(f"manifest missing: {manifest_path}")
        return
    manifest = load_json(manifest_path)
    if not isinstance(manifest, dict):
        return
    ok(f"found manifest: {manifest_path.relative_to(ROOT)}")

    base_dir = manifest_path.parent
    total_pairs = 0
    total_matched = 0
    total_nonzero_delta_pairs = 0

    for universe in UNIVERSES:
        for role in ROLES:
            total_pairs += 1
            equal_rel = rel_from_manifest(manifest, universe, "equal", role)
            mcap_rel = rel_from_manifest(manifest, universe, "mcap", role)
            if not equal_rel or not mcap_rel:
                fail(f"{universe}/{role} missing equal or mcap manifest file declaration")
                continue
            equal_path = base_dir / equal_rel
            mcap_path = base_dir / mcap_rel
            if not equal_path.exists():
                fail(f"{universe}/{role} equal CSV missing: {equal_path.relative_to(ROOT)}")
                continue
            if not mcap_path.exists():
                fail(f"{universe}/{role} mcap CSV missing: {mcap_path.relative_to(ROOT)}")
                continue

            result = compare_files(equal_path, mcap_path)
            matched = result["matched_rows"]
            if not result["rank_column"]:
                fail(f"{universe}/{role} no shared numeric SETA-like rank column")
                continue
            if not result["label_column"]:
                fail(f"{universe}/{role} no shared label column")
                continue
            if len(matched) < min_matched_rows:
                fail(
                    f"{universe}/{role} matched rows below threshold: "
                    f"matched={len(matched)} threshold={min_matched_rows}"
                )
                continue
            total_matched += len(matched)
            nonzero_deltas = [row for row in matched if row.delta != 0]
            if nonzero_deltas:
                total_nonzero_delta_pairs += 1
            else:
                warn(f"{universe}/{role} matched rows but all rank deltas are zero")

            ok(
                f"{universe}/{role}: matched={len(matched)} "
                f"equal_rows={result['equal_rows']} mcap_rows={result['mcap_rows']} "
                f"label={result['label_column']} rank={result['rank_column']}"
            )
            ok(f"{universe}/{role} top mcap risers: {format_rows(result['risers'])}")
            ok(f"{universe}/{role} top mcap decliners: {format_rows(result['decliners'])}")

    if total_pairs == 0:
        fail("no universe/role pairs checked")
    else:
        ok(f"checked comparison pairs={total_pairs} total_matched_rows={total_matched}")
    if total_nonzero_delta_pairs == 0:
        fail("no comparison pair produced non-zero rank deltas")
    else:
        ok(f"comparison pairs with non-zero rank deltas={total_nonzero_delta_pairs}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Data-backed SETA equal-vs-mcap comparison smoke test.")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=DEFAULT_MANIFEST,
        help="Path to staged SETA bundle manifest. Defaults to seta_bundles/latest/manifest.json.",
    )
    parser.add_argument(
        "--min-matched-rows",
        type=int,
        default=1,
        help="Minimum matched labels required per universe/level pair. Defaults to 1.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = args.manifest if args.manifest.is_absolute() else ROOT / args.manifest
    print("=" * 60)
    print("SETA equal-vs-mcap data comparison smoke test")
    print(f"Repo: {ROOT}")
    print(f"Manifest: {manifest_path}")
    print("=" * 60)

    check_matrix(manifest_path, args.min_matched_rows)

    print("=" * 60)
    if ERRORS:
        print("FAILED")
        for error in ERRORS:
            print(f" - {error}")
        return 1
    print("PASSED")
    if WARNINGS:
        print("Warnings:")
        for warning in WARNINGS:
            print(f" - {warning}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
