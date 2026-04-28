#!/usr/bin/env python
"""
SETA reply review / approval workflow v1.

Draft-only review helper. This script does not post to any platform.
It reads a SETA reply draft queue JSONL file, applies review actions,
and writes a reviewed queue JSONL + CSV to reply_agent/review_queue by default.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Set

ALLOWED_STATUSES = {"pending", "approved", "rejected", "edited", "posted_later"}
APPROVABLE_STATUSES = {"pending", "edited"}


def now_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise SystemExit(f"[ERROR] Input file not found: {path}")
    if path.is_dir():
        raise SystemExit(f"[ERROR] Input path is a folder, not a JSONL file: {path}")
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"[ERROR] Invalid JSON on line {line_no}: {exc}") from exc
            if not isinstance(obj, dict):
                raise SystemExit(f"[ERROR] Line {line_no} is not a JSON object")
            rows.append(obj)
    return rows


def write_jsonl(path: Path, rows: Sequence[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=False) + "\n")


def flatten_for_csv(row: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in row.items():
        if isinstance(v, (dict, list)):
            out[k] = json.dumps(v, ensure_ascii=False, sort_keys=True)
        else:
            out[k] = v
    return out


def write_csv(path: Path, rows: Sequence[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    flat = [flatten_for_csv(r) for r in rows]
    keys: List[str] = []
    for row in flat:
        for k in row.keys():
            if k not in keys:
                keys.append(k)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=keys, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(flat)


def parse_indices(raw: str | None, max_n: int) -> Set[int]:
    if not raw:
        return set()
    out: Set[int] = set()
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            a, b = part.split("-", 1)
            start, end = int(a), int(b)
            if start > end:
                start, end = end, start
            out.update(range(start, end + 1))
        else:
            out.add(int(part))
    bad = [i for i in out if i < 1 or i > max_n]
    if bad:
        raise SystemExit(f"[ERROR] Index out of range: {bad}; queue has {max_n} rows")
    return out


def short(text: Any, width: int = 88) -> str:
    s = "" if text is None else str(text)
    s = " ".join(s.split())
    return s if len(s) <= width else s[: width - 1] + "..."


def get_row_id(row: Dict[str, Any], idx: int) -> str:
    for key in ("queue_id", "comment_id", "id", "source_id"):
        val = row.get(key)
        if val not in (None, ""):
            return str(val)
    return f"row_{idx:04d}"


def print_queue(rows: Sequence[Dict[str, Any]], limit: int | None = None) -> None:
    n = len(rows) if limit is None else min(limit, len(rows))
    print("=" * 84)
    print(f"SETA reply review queue preview ({n}/{len(rows)} rows)")
    print("=" * 84)
    for i, row in enumerate(rows[:n], start=1):
        print(
            f"[{i}] {row.get('platform','?')} "
            f"term={row.get('detected_term') or row.get('term') or '?'} "
            f"risk={row.get('risk_level','?')} "
            f"type={row.get('reply_type','?')} "
            f"status={row.get('status','pending')}"
        )
        print(f"    comment: {short(row.get('comment_text') or row.get('comment') or row.get('input_comment'))}")
        print(f"    draft:   {short(row.get('draft_reply'))}")
    print("=" * 84)


def apply_review_actions(
    rows: List[Dict[str, Any]],
    approve: Set[int],
    reject: Set[int],
    posted_later: Set[int],
    edit_idx: int | None,
    edit_reply: str | None,
    reviewed_by: str,
    note: str | None,
    approve_all_low_risk: bool,
) -> List[Dict[str, Any]]:
    stamp = now_iso()
    if approve_all_low_risk:
        for i, row in enumerate(rows, start=1):
            if row.get("risk_level") == "low" and row.get("should_reply") is True:
                approve.add(i)

    collisions = (approve & reject) | (approve & posted_later) | (reject & posted_later)
    if collisions:
        raise SystemExit(f"[ERROR] Conflicting status actions for row(s): {sorted(collisions)}")

    if edit_idx is not None:
        if edit_idx < 1 or edit_idx > len(rows):
            raise SystemExit(f"[ERROR] Edit index out of range: {edit_idx}")
        if not edit_reply:
            raise SystemExit("[ERROR] --edit-index requires --edit-reply")

    for i, row in enumerate(rows, start=1):
        row.setdefault("queue_id", get_row_id(row, i))
        row.setdefault("status", "pending")
        row.setdefault("requires_human_review", True)
        row.setdefault("draft_only", True)

        review_event = None
        if i in approve:
            if row.get("requires_human_review") is not True:
                raise SystemExit(f"[ERROR] Row {i} cannot be approved because requires_human_review is not true")
            row["status"] = "approved"
            review_event = "approved"
        elif i in reject:
            row["status"] = "rejected"
            review_event = "rejected"
        elif i in posted_later:
            row["status"] = "posted_later"
            review_event = "posted_later"
        elif edit_idx == i:
            row["original_draft_reply"] = row.get("draft_reply", "")
            row["draft_reply"] = edit_reply
            row["status"] = "edited"
            review_event = "edited"

        if row.get("status") not in ALLOWED_STATUSES:
            row["status"] = "pending"

        if review_event:
            row["reviewed_at"] = stamp
            row["reviewed_by"] = reviewed_by
            if note:
                row["review_note"] = note
            row.setdefault("review_history", [])
            history = row["review_history"]
            if isinstance(history, list):
                history.append({"event": review_event, "at": stamp, "by": reviewed_by, "note": note or ""})

        # Safety invariant: review workflow prepares approvals but never posts.
        row["draft_only"] = True
    return rows


def summarize(rows: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    statuses: Dict[str, int] = {}
    risk: Dict[str, int] = {}
    for row in rows:
        statuses[str(row.get("status", "pending"))] = statuses.get(str(row.get("status", "pending")), 0) + 1
        risk[str(row.get("risk_level", "unknown"))] = risk.get(str(row.get("risk_level", "unknown")), 0) + 1
    return {
        "rows": len(rows),
        "status_counts": statuses,
        "risk_counts": risk,
        "approved_count": statuses.get("approved", 0),
        "draft_only": all(row.get("draft_only") is True for row in rows),
        "requires_human_review_count": sum(1 for row in rows if row.get("requires_human_review") is True),
    }


def default_output_path(input_path: Path) -> Path:
    root = Path.cwd() / "reply_agent" / "review_queue"
    return root / f"seta_reply_reviewed_{now_stamp()}.jsonl"


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Review / approve SETA reply draft queue JSONL files.")
    parser.add_argument("--input", required=True, help="Input draft queue JSONL file")
    parser.add_argument("--output", default=None, help="Output reviewed JSONL path. Defaults to reply_agent/review_queue")
    parser.add_argument("--list", action="store_true", help="Preview queue rows and exit unless actions are supplied")
    parser.add_argument("--limit", type=int, default=25, help="Preview row limit")
    parser.add_argument("--approve", default=None, help="Comma/range row numbers to approve, e.g. 1,3-5")
    parser.add_argument("--reject", default=None, help="Comma/range row numbers to reject")
    parser.add_argument("--posted-later", default=None, help="Comma/range row numbers to mark posted_later")
    parser.add_argument("--approve-all-low-risk", action="store_true", help="Approve all low-risk rows that should_reply=true")
    parser.add_argument("--edit-index", type=int, default=None, help="One-based row number to edit")
    parser.add_argument("--edit-reply", default=None, help="Replacement reply text for --edit-index")
    parser.add_argument("--reviewed-by", default="human_reviewer", help="Reviewer label to stamp into reviewed rows")
    parser.add_argument("--note", default=None, help="Optional review note")
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    rows = read_jsonl(input_path)
    if not rows:
        raise SystemExit("[ERROR] Input queue has no rows")

    approve = parse_indices(args.approve, len(rows))
    reject = parse_indices(args.reject, len(rows))
    posted_later = parse_indices(args.posted_later, len(rows))
    has_actions = bool(approve or reject or posted_later or args.approve_all_low_risk or args.edit_index is not None)

    if args.list:
        print_queue(rows, args.limit)
        if not has_actions:
            return 0

    rows = apply_review_actions(
        rows,
        approve=approve,
        reject=reject,
        posted_later=posted_later,
        edit_idx=args.edit_index,
        edit_reply=args.edit_reply,
        reviewed_by=args.reviewed_by,
        note=args.note,
        approve_all_low_risk=args.approve_all_low_risk,
    )

    output_jsonl = Path(args.output) if args.output else default_output_path(input_path)
    output_csv = output_jsonl.with_suffix(".csv")
    write_jsonl(output_jsonl, rows)
    write_csv(output_csv, rows)

    summary = summarize(rows)
    summary.update({"input_path": str(input_path), "output_jsonl": str(output_jsonl), "output_csv": str(output_csv)})

    print("=" * 84)
    print("SETA reply review queue complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
