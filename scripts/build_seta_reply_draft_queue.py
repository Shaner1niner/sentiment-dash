#!/usr/bin/env python
"""
SETA Social Reply Agent - Batch Draft Queue v1.

Reads a JSONL file of social comments, runs scripts/draft_seta_social_reply.py
for each comment, and writes a reviewable JSONL + CSV draft queue.

Draft-only: this script never posts to any platform.
"""
from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

DEFAULT_INPUT = Path("reply_agent/sample_inputs/sample_queue_comments.jsonl")
DEFAULT_OUT_DIR = Path("reply_agent/draft_queue")
DRAFT_SCRIPT = Path("scripts/draft_seta_social_reply.py")


def utc_stamp() -> str:
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"[ERROR] {path}:{line_no} invalid JSON: {exc}")
            if not isinstance(obj, dict):
                raise SystemExit(f"[ERROR] {path}:{line_no} expected object per line")
            rows.append(obj)
    return rows


def normalize_platform(value: Any) -> str:
    p = str(value or "x").strip().lower()
    aliases = {"twitter": "x", "x.com": "x", "bluesky": "bsky", "blue_sky": "bsky", "reddit.com": "reddit"}
    p = aliases.get(p, p)
    if p not in {"x", "bsky", "reddit"}:
        p = "x"
    return p


def comment_text(row: Dict[str, Any]) -> str:
    for key in ("comment", "comment_text", "text", "body", "content"):
        val = row.get(key)
        if val is not None and str(val).strip():
            return str(val).strip()
    return ""


def run_single_draft(platform: str, comment: str, python_exe: str) -> Dict[str, Any]:
    if not DRAFT_SCRIPT.exists():
        raise SystemExit(f"[ERROR] Missing {DRAFT_SCRIPT}. Run from the sentiment-dash repo root.")

    cmd = [python_exe, str(DRAFT_SCRIPT), "--platform", platform, "--comment", comment]
    proc = subprocess.run(cmd, text=True, capture_output=True)
    if proc.returncode != 0:
        return {
            "should_reply": False,
            "detected_term": None,
            "reply_type": "draft_script_error",
            "risk_level": "high",
            "draft_reply": "",
            "reasoning_summary": (proc.stderr or proc.stdout or "draft script failed").strip()[:2000],
            "requires_human_review": True,
            "platform": platform,
        }
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError:
        return {
            "should_reply": False,
            "detected_term": None,
            "reply_type": "draft_json_parse_error",
            "risk_level": "high",
            "draft_reply": "",
            "reasoning_summary": proc.stdout.strip()[:2000],
            "requires_human_review": True,
            "platform": platform,
        }


def build_queue(input_path: Path, out_dir: Path, python_exe: str, limit: Optional[int] = None) -> Dict[str, Any]:
    rows = read_jsonl(input_path)
    if limit is not None:
        rows = rows[:limit]
    if not rows:
        raise SystemExit(f"[ERROR] No comments found in {input_path}")

    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = utc_stamp()
    out_jsonl = out_dir / f"seta_reply_drafts_{stamp}.jsonl"
    out_csv = out_dir / f"seta_reply_drafts_{stamp}.csv"

    results: List[Dict[str, Any]] = []
    for i, row in enumerate(rows, 1):
        platform = normalize_platform(row.get("platform"))
        text = comment_text(row)
        if not text:
            draft = {
                "should_reply": False,
                "detected_term": None,
                "reply_type": "empty_comment",
                "risk_level": "medium",
                "draft_reply": "",
                "reasoning_summary": "Input row had no comment text.",
                "requires_human_review": True,
                "platform": platform,
            }
        else:
            draft = run_single_draft(platform, text, python_exe)

        item = {
            "queue_version": "seta_reply_queue_v1",
            "queue_created_at_utc": stamp,
            "queue_index": i,
            "status": "pending" if draft.get("should_reply") else "no_reply_recommended",
            "platform": platform,
            "comment_id": row.get("comment_id") or row.get("id") or "",
            "author": row.get("author") or row.get("username") or "",
            "comment_url": row.get("url") or row.get("comment_url") or "",
            "comment_text": text,
            **draft,
        }
        # Safety invariants for draft-mode queue.
        item["requires_human_review"] = True
        item["posted"] = False
        item["approved"] = False
        results.append(item)
        print(f"[{i}/{len(rows)}] {platform} term={item.get('detected_term')} type={item.get('reply_type')} status={item.get('status')}")

    with out_jsonl.open("w", encoding="utf-8") as f:
        for item in results:
            f.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")

    csv_fields = [
        "queue_version", "queue_created_at_utc", "queue_index", "status",
        "platform", "comment_id", "author", "comment_url", "comment_text",
        "should_reply", "detected_term", "reply_type", "risk_level", "draft_reply",
        "reasoning_summary", "requires_human_review", "approved", "posted",
    ]
    with out_csv.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)

    summary = {
        "input_path": str(input_path),
        "output_jsonl": str(out_jsonl),
        "output_csv": str(out_csv),
        "rows": len(results),
        "should_reply_count": sum(1 for r in results if r.get("should_reply")),
        "high_risk_count": sum(1 for r in results if r.get("risk_level") == "high"),
        "draft_only": True,
    }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a draft-only SETA social reply review queue.")
    parser.add_argument("--input", default=str(DEFAULT_INPUT), help="Input JSONL comments file")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory for JSONL/CSV queue")
    parser.add_argument("--limit", type=int, default=None, help="Optional max rows")
    parser.add_argument("--python-exe", default=sys.executable, help="Python executable used to call draft script")
    args = parser.parse_args()

    summary = build_queue(Path(args.input), Path(args.out_dir), args.python_exe, args.limit)
    print("=" * 60)
    print("SETA reply draft queue complete")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
