#!/usr/bin/env python
"""
SETA Manual Posting Packet v1

Builds copy/paste-ready posting packets from an approved-only SETA replies export.

Input:
  reply_agent/approved_replies/seta_approved_replies_*.jsonl

Outputs:
  reply_agent/manual_posting_packets/seta_manual_posting_packet_<timestamp>.jsonl
  reply_agent/manual_posting_packets/seta_manual_posting_packet_<timestamp>.csv
  reply_agent/manual_posting_packets/x_manual_packet_<timestamp>.csv
  reply_agent/manual_posting_packets/bsky_manual_packet_<timestamp>.csv
  reply_agent/manual_posting_packets/reddit_manual_packet_<timestamp>.csv

Safety invariant:
  - This script never posts to any platform.
  - manual_posting_status defaults to "not_posted".
  - posting_performed is always false.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "manual_posting_packets"


def utc_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


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
        "manual_packet_id",
        "manual_packet_created_at_utc",
        "platform",
        "manual_posting_status",
        "copy_paste_reply",
        "copy_paste_length",
        "copy_paste_warning",
        "detected_term",
        "risk_level",
        "reply_type",
        "intent",
        "comment_id",
        "author",
        "source_comment_text",
        "approved_export_id",
        "approved_exported_at_utc",
        "reviewed_by",
        "reviewed_at_utc",
        "review_note",
        "posting_guardrail",
        "posting_performed",
        "ready_for_posting",
        "requires_human_review",
        "daily_asset_state",
        "daily_structural_state",
        "daily_decision_pressure_rank",
        "daily_resolution_skew",
        "narrative_regime",
        "narrative_coherence_bucket",
        "narrative_top_keywords",
        "layers_used",
        "source_approved_export",
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


def normalize_platform(value: Any) -> str:
    text = str(value or "").strip().lower()
    aliases = {
        "twitter": "x",
        "x.com": "x",
        "bluesky": "bsky",
        "blue sky": "bsky",
    }
    return aliases.get(text, text or "unknown")


def get_reply_text(row: Dict[str, Any]) -> str:
    for key in ("approved_reply_text", "edited_reply", "draft_reply", "reply_text"):
        val = row.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return ""


def platform_limit(platform: str) -> Optional[int]:
    # Keep conservative enough for easy manual posting.
    if platform == "x":
        return 280
    if platform == "bsky":
        return 300
    return None


def length_warning(platform: str, text: str) -> str:
    limit = platform_limit(platform)
    if limit is None:
        return ""
    if len(text) > limit:
        return f"over_{platform}_limit_{len(text)}_of_{limit}"
    if len(text) > int(limit * 0.92):
        return f"near_{platform}_limit_{len(text)}_of_{limit}"
    return ""


def build_manual_row(
    row: Dict[str, Any],
    source_path: Path,
    packet_id: str,
    created_at: str,
) -> Dict[str, Any]:
    platform = normalize_platform(row.get("platform"))
    reply = get_reply_text(row)

    out = dict(row)
    out["manual_packet_id"] = packet_id
    out["manual_packet_created_at_utc"] = created_at
    out["platform"] = platform
    out["source_approved_export"] = str(source_path)
    out["manual_posting_status"] = "not_posted"
    out["copy_paste_reply"] = reply
    out["copy_paste_length"] = len(reply)
    out["copy_paste_warning"] = length_warning(platform, reply)

    # Stable source comment alias for reviewer convenience.
    out["source_comment_text"] = row.get("comment_text", row.get("source_comment_text", ""))

    # Preserve no-posting safety.
    out["posting_performed"] = False
    out["posting_guardrail"] = "Manual posting packet only; no API posting performed."
    out["requires_human_review"] = True

    # The approved export may say ready_for_posting=false; manual packets should
    # not escalate that to true. They are copy/paste aids, not posting orders.
    out["ready_for_posting"] = False

    return out


def build_packet(input_path: Path, out_dir: Path, limit: Optional[int] = None) -> Dict[str, Any]:
    rows = read_jsonl(input_path)

    eligible = []
    skipped = 0
    for row in rows:
        if str(row.get("status", "")).strip().lower() != "approved":
            skipped += 1
            continue
        if not get_reply_text(row):
            skipped += 1
            continue
        eligible.append(row)

    if limit is not None:
        eligible = eligible[: max(0, limit)]

    stamp = utc_stamp()
    packet_id = f"seta_manual_posting_packet_{stamp}"
    created_at = now_iso()

    packet_rows = [
        build_manual_row(row, input_path, packet_id, created_at)
        for row in eligible
    ]

    out_dir.mkdir(parents=True, exist_ok=True)

    all_jsonl = out_dir / f"{packet_id}.jsonl"
    all_csv = out_dir / f"{packet_id}.csv"

    write_jsonl(all_jsonl, packet_rows)
    write_csv(all_csv, packet_rows)

    platform_counts: Dict[str, int] = {}
    platform_csvs: Dict[str, str] = {}

    for platform in ("x", "bsky", "reddit"):
        p_rows = [row for row in packet_rows if row.get("platform") == platform]
        if not p_rows:
            continue
        path = out_dir / f"{platform}_manual_packet_{stamp}.csv"
        write_csv(path, p_rows)
        platform_counts[platform] = len(p_rows)
        platform_csvs[platform] = str(path)

    summary = {
        "input_path": str(input_path),
        "output_jsonl": str(all_jsonl),
        "output_csv": str(all_csv),
        "platform_csvs": platform_csvs,
        "rows_in_approved_export": len(rows),
        "eligible_approved_rows": len(eligible),
        "skipped_rows": skipped,
        "packet_rows": len(packet_rows),
        "platform_counts": platform_counts,
        "manual_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA manual posting packet complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Build manual posting packets from approved SETA replies.")
    p.add_argument("--input", required=True, help="Approved replies JSONL path.")
    p.add_argument(
        "--out-dir",
        default=str(DEFAULT_OUT_DIR),
        help="Output directory. Default: reply_agent/manual_posting_packets",
    )
    p.add_argument("--limit", type=int, default=None, help="Optional max rows to include.")
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

    build_packet(input_path=input_path, out_dir=Path(args.out_dir), limit=args.limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
