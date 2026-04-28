#!/usr/bin/env python
"""
SETA Approved Replies Export v1

Reads a reviewed SETA reply queue JSONL and exports only approved rows into:
  reply_agent/approved_replies/seta_approved_replies_<timestamp>.jsonl
  reply_agent/approved_replies/seta_approved_replies_<timestamp>.csv

Safety invariant:
  - This script never posts to any platform.
  - Exported rows include ready_for_posting=false by default.
  - Exported rows retain requires_human_review=true for audit continuity.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "approved_replies"


def utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            raw = line.strip()
            if not raw:
                continue
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"[ERROR] Invalid JSON on line {line_no} in {path}: {exc}") from exc
            if not isinstance(obj, dict):
                raise SystemExit(f"[ERROR] JSONL line {line_no} is not an object in {path}")
            rows.append(obj)
    return rows


def write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, allow_nan=False) + "\n")


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    return str(value)


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    preferred = [
        "approved_export_id",
        "approved_exported_at_utc",
        "platform",
        "comment_id",
        "author",
        "comment_text",
        "detected_term",
        "reply_type",
        "intent",
        "risk_level",
        "status",
        "ready_for_posting",
        "posting_guardrail",
        "requires_human_review",
        "draft_reply",
        "reviewed_by",
        "reviewed_at_utc",
        "review_note",
        "daily_asset_state",
        "daily_structural_state",
        "daily_decision_pressure_rank",
        "daily_resolution_skew",
        "daily_analyst_take",
        "narrative_regime",
        "narrative_coherence_bucket",
        "narrative_top_keywords",
        "narrative_top_lifts",
        "layers_used",
        "source_review_queue",
    ]

    fieldnames: List[str] = []
    for key in preferred:
        if any(key in row for row in rows):
            fieldnames.append(key)

    for row in rows:
        for key in row.keys():
            if key not in fieldnames:
                fieldnames.append(key)

    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({key: stringify(row.get(key)) for key in fieldnames})


def normalize_status(value: Any) -> str:
    return str(value or "").strip().lower()


def get_reply_text(row: Dict[str, Any]) -> str:
    # Keep current field name, but allow future/manual variants.
    for key in ("draft_reply", "edited_reply", "reply_text"):
        val = row.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def approved_export_row(
    row: Dict[str, Any],
    source_path: Path,
    export_id: str,
    exported_at: str,
    ready_for_posting: bool,
) -> Dict[str, Any]:
    out = dict(row)

    out["approved_export_id"] = export_id
    out["approved_exported_at_utc"] = exported_at
    out["source_review_queue"] = str(source_path)
    out["status"] = "approved"

    # Safety: the approved export is a handoff artifact, not a posting command.
    out["ready_for_posting"] = bool(ready_for_posting)
    out["posting_guardrail"] = (
        "Approved for manual posting export only; no API posting performed."
        if not ready_for_posting
        else "Approved export marked ready_for_posting by explicit CLI flag; no API posting performed by this script."
    )

    # Keep audit invariant from the draft/review system.
    out["requires_human_review"] = True

    # Ensure one canonical text field exists.
    out["draft_reply"] = get_reply_text(row)

    return out


def export_approved(
    input_path: Path,
    out_dir: Path,
    limit: Optional[int] = None,
    ready_for_posting: bool = False,
) -> Dict[str, Any]:
    rows = read_jsonl(input_path)
    approved = [row for row in rows if normalize_status(row.get("status")) == "approved"]

    # Drop approved rows that do not have text; keep the export clean and postable later.
    approved_with_text = [row for row in approved if get_reply_text(row)]

    if limit is not None:
        approved_with_text = approved_with_text[: max(0, limit)]

    stamp = utc_stamp()
    export_id = f"seta_approved_replies_{stamp}"
    exported_at = datetime.now(UTC).isoformat(timespec="seconds")

    output_rows = [
        approved_export_row(
            row=row,
            source_path=input_path,
            export_id=export_id,
            exported_at=exported_at,
            ready_for_posting=ready_for_posting,
        )
        for row in approved_with_text
    ]

    out_dir.mkdir(parents=True, exist_ok=True)
    jsonl_path = out_dir / f"{export_id}.jsonl"
    csv_path = out_dir / f"{export_id}.csv"

    write_jsonl(jsonl_path, output_rows)
    write_csv(csv_path, output_rows)

    summary = {
        "input_path": str(input_path),
        "output_jsonl": str(jsonl_path),
        "output_csv": str(csv_path),
        "rows_in_review_queue": len(rows),
        "approved_rows": len(approved),
        "approved_rows_with_text": len(approved_with_text),
        "exported_rows": len(output_rows),
        "ready_for_posting": bool(ready_for_posting),
        "draft_only": not bool(ready_for_posting),
        "posting_performed": False,
    }

    print("=" * 72)
    print("SETA approved replies export complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Export approved SETA reply rows from a reviewed queue.")
    p.add_argument("--input", required=True, help="Reviewed queue JSONL path.")
    p.add_argument(
        "--out-dir",
        default=str(DEFAULT_OUT_DIR),
        help="Output directory. Default: reply_agent/approved_replies",
    )
    p.add_argument("--limit", type=int, default=None, help="Optional max approved rows to export.")
    p.add_argument(
        "--ready-for-posting",
        action="store_true",
        help="Explicitly mark exported rows ready_for_posting=true. No posting is performed.",
    )
    return p


def main() -> int:
    args = build_arg_parser().parse_args()
    input_path = Path(args.input)
    if not input_path.exists():
        print(f"[ERROR] Input not found: {input_path}")
        return 2
    if input_path.is_dir():
        print(f"[ERROR] Input must be a JSONL file, not a directory: {input_path}")
        return 2

    export_approved(
        input_path=input_path,
        out_dir=Path(args.out_dir),
        limit=args.limit,
        ready_for_posting=args.ready_for_posting,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
