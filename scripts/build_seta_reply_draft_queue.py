#!/usr/bin/env python
# SETA reply draft queue builder.
# Reads social comments from JSONL, calls draft_seta_social_reply.py, and writes reviewable JSONL + CSV queues.
# Queue rows are draft-only and include flattened screener/daily/narrative context columns for easier review.

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DRAFT_SCRIPT = ROOT / "scripts" / "draft_seta_social_reply.py"
DEFAULT_OUT_DIR = ROOT / "reply_agent" / "draft_queue"


def now_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Input JSONL not found: {path}")
    if path.is_dir():
        raise IsADirectoryError(f"Input must be a JSONL file, not a folder: {path}")
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"Invalid JSON on line {line_no} in {path}: {exc}") from exc
            if not isinstance(obj, dict):
                raise ValueError(f"Line {line_no} must be a JSON object")
            rows.append(obj)
    return rows


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, allow_nan=False) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames: list[str] = []
    seen: set[str] = set()
    preferred = [
        "queue_row_id",
        "status",
        "platform",
        "comment_id",
        "author",
        "comment_text",
        "detected_term",
        "should_reply",
        "reply_type",
        "intent",
        "risk_level",
        "requires_human_review",
        "draft_only",
        "draft_reply",
        "daily_universe",
        "daily_asset_state",
        "daily_structural_state",
        "daily_decision_pressure_rank",
        "daily_decision_pressure",
        "daily_resolution_skew",
        "daily_analyst_take",
        "narrative_regime",
        "narrative_coherence_bucket",
        "narrative_top_keywords",
        "narrative_top_lifts",
        "layers_used",
        "primary_archetype",
        "direction",
        "priority_score",
        "summary_bucket",
        "risk_note",
        "reasoning_summary",
        "generated_at_utc",
    ]
    for key in preferred:
        for row in rows:
            if key in row and key not in seen:
                fieldnames.append(key)
                seen.add(key)
                break
    for row in rows:
        for key in row.keys():
            if key not in seen:
                fieldnames.append(key)
                seen.add(key)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            csv_row: dict[str, Any] = {}
            for key in fieldnames:
                val = row.get(key)
                if isinstance(val, (dict, list)):
                    csv_row[key] = json.dumps(val, ensure_ascii=False, allow_nan=False)
                elif val is None:
                    csv_row[key] = ""
                else:
                    csv_row[key] = val
            writer.writerow(csv_row)


def safe_get(obj: Any, *path: str) -> Any:
    cur = obj
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur


def clean_scalar(value: Any) -> Any:
    if value is None:
        return None
    # Avoid leaking Python/JSON NaN-ish strings into CSV review files.
    if isinstance(value, float) and value != value:
        return None
    if isinstance(value, str) and value.strip().lower() in {"nan", "none", "null"}:
        return None
    return value


def join_terms(items: Any, limit: int = 5) -> str:
    if not isinstance(items, list):
        return ""
    out: list[str] = []
    for item in items:
        if item is None:
            continue
        s = str(item).strip()
        if not s or s.lower() in {"nan", "none", "null"}:
            continue
        if s not in out:
            out.append(s)
        if len(out) >= limit:
            break
    return " | ".join(out)


def layers_used(context: dict[str, Any]) -> str:
    layers = context.get("layers") if isinstance(context.get("layers"), dict) else {}
    names = [name for name in ("screener", "daily", "narrative") if layers.get(name)]
    return ",".join(names)


def call_draft(platform: str, comment: str, python_exe: str) -> dict[str, Any]:
    if not DRAFT_SCRIPT.exists():
        raise FileNotFoundError(f"Draft reply script not found: {DRAFT_SCRIPT}")
    cmd = [python_exe, str(DRAFT_SCRIPT), "--platform", platform, "--comment", comment]
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(
            "Draft script failed\n"
            f"Command: {' '.join(cmd)}\n"
            f"stdout:\n{proc.stdout}\n"
            f"stderr:\n{proc.stderr}"
        )
    text = proc.stdout.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Draft script did not return valid JSON. Output was:\n{text}") from exc


def normalize_input_row(row: dict[str, Any]) -> tuple[str, str, str, str]:
    platform = str(row.get("platform") or "x").strip().lower()
    comment = str(row.get("comment") or row.get("comment_text") or row.get("text") or "").strip()
    comment_id = str(row.get("comment_id") or row.get("id") or "").strip()
    author = str(row.get("author") or row.get("username") or "").strip()
    if not comment:
        raise ValueError(f"Input row is missing comment/comment_text/text: {row}")
    return platform, comment, comment_id, author


def flatten_draft(input_row: dict[str, Any], draft: dict[str, Any], row_id: int) -> dict[str, Any]:
    context = draft.get("context") if isinstance(draft.get("context"), dict) else {}
    daily = context.get("daily") if isinstance(context.get("daily"), dict) else {}
    narrative = context.get("narrative") if isinstance(context.get("narrative"), dict) else {}
    platform, comment, comment_id, author = normalize_input_row(input_row)

    should_reply = bool(draft.get("should_reply"))
    status = "pending" if should_reply else "skipped"

    flat: dict[str, Any] = {
        "queue_row_id": row_id,
        "status": status,
        "platform": platform,
        "comment_id": comment_id,
        "author": author,
        "comment_text": comment,
        "detected_term": draft.get("detected_term"),
        "should_reply": should_reply,
        "reply_type": draft.get("reply_type"),
        "intent": draft.get("intent"),
        "risk_level": draft.get("risk_level"),
        "requires_human_review": bool(draft.get("requires_human_review", True)),
        "draft_only": True,
        "draft_reply": draft.get("draft_reply"),
        "reasoning_summary": draft.get("reasoning_summary"),
        "primary_archetype": context.get("primary_archetype"),
        "direction": context.get("direction"),
        "priority_score": clean_scalar(context.get("priority_score")),
        "summary_bucket": context.get("summary_bucket"),
        "risk_note": context.get("risk_note"),
        "daily_universe": clean_scalar(daily.get("universe")),
        "daily_asset_state": clean_scalar(daily.get("asset_state")),
        "daily_structural_state": clean_scalar(daily.get("structural_state")),
        "daily_decision_pressure_rank": clean_scalar(daily.get("decision_pressure_rank")),
        "daily_decision_pressure": clean_scalar(daily.get("decision_pressure")),
        "daily_resolution_skew": clean_scalar(daily.get("resolution_skew")),
        "daily_analyst_take": clean_scalar(daily.get("analyst_take")),
        "narrative_regime": clean_scalar(narrative.get("regime")),
        "narrative_coherence_bucket": clean_scalar(narrative.get("coherence_bucket")),
        "narrative_top_keywords": join_terms(narrative.get("top_keywords"), limit=5),
        "narrative_top_lifts": join_terms(narrative.get("top_lifts"), limit=5),
        "layers_used": layers_used(context),
        "generated_at_utc": datetime.now(UTC).isoformat(timespec="seconds"),
        "source_input": input_row,
        "draft_json": draft,
    }
    # Keep a few layer booleans as explicit scan columns.
    context_layers = context.get("layers") if isinstance(context.get("layers"), dict) else {}
    flat["layer_screener"] = bool(context_layers.get("screener"))
    flat["layer_daily"] = bool(context_layers.get("daily"))
    flat["layer_narrative"] = bool(context_layers.get("narrative"))
    return flat


def build_queue(input_path: Path, out_dir: Path, python_exe: str, limit: int | None = None) -> dict[str, Any]:
    input_path = input_path if input_path.is_absolute() else ROOT / input_path
    out_dir = out_dir if out_dir.is_absolute() else ROOT / out_dir
    rows = read_jsonl(input_path)
    if limit is not None:
        rows = rows[:limit]

    queue_rows: list[dict[str, Any]] = []
    for idx, input_row in enumerate(rows, start=1):
        platform, comment, _comment_id, _author = normalize_input_row(input_row)
        draft = call_draft(platform, comment, python_exe)
        flat = flatten_draft(input_row, draft, idx)
        queue_rows.append(flat)
        print(
            f"[{idx}/{len(rows)}] {platform} "
            f"term={flat.get('detected_term')} "
            f"type={flat.get('reply_type')} "
            f"status={flat.get('status')} "
            f"daily={flat.get('daily_asset_state') or '-'} "
            f"narrative={flat.get('narrative_regime') or '-'}"
        )

    stamp = now_stamp()
    output_jsonl = out_dir / f"seta_reply_drafts_{stamp}.jsonl"
    output_csv = out_dir / f"seta_reply_drafts_{stamp}.csv"
    write_jsonl(output_jsonl, queue_rows)
    write_csv(output_csv, queue_rows)

    summary = {
        "input_path": str(input_path),
        "output_jsonl": str(output_jsonl),
        "output_csv": str(output_csv),
        "rows": len(queue_rows),
        "should_reply_count": sum(1 for row in queue_rows if row.get("should_reply")),
        "high_risk_count": sum(1 for row in queue_rows if row.get("risk_level") == "high"),
        "daily_context_count": sum(1 for row in queue_rows if row.get("layer_daily")),
        "narrative_context_count": sum(1 for row in queue_rows if row.get("layer_narrative")),
        "draft_only": True,
    }
    print("=" * 60)
    print("SETA reply draft queue complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False, allow_nan=False))
    return summary


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a SETA social reply draft queue from JSONL comments.")
    parser.add_argument("--input", required=True, help="Input JSONL file of social comments.")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Output directory for draft queue JSONL/CSV.")
    parser.add_argument("--python-exe", default=sys.executable, help="Python executable to use for draft generation.")
    parser.add_argument("--limit", type=int, default=None, help="Optional max rows to process.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    build_queue(Path(args.input), Path(args.out_dir), args.python_exe, args.limit)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
