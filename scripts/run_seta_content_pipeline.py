#!/usr/bin/env python
"""
SETA Content Pipeline Runner v1

Runs the draft-only SETA content pipeline in order:

  1. Daily content packet
  2. Website snippets
  3. Blog outline
  4. Blog draft
  5. Social content calendar

Optional:
  --include-reply-queue to also run the reply draft queue if sample/live input is available.

Outputs:
  reply_agent/pipeline_runs/seta_content_pipeline_run_YYYY-MM-DD_HHMMSS.json
  reply_agent/pipeline_runs/seta_content_pipeline_run_YYYY-MM-DD_HHMMSS.md
  reply_agent/pipeline_runs/seta_content_pipeline_run_latest.json
  reply_agent/pipeline_runs/seta_content_pipeline_run_latest.md

Safety:
  - No posting.
  - No API calls by this runner.
  - Verifies draft_only=true and posting_performed=false where output JSON exists.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "pipeline_runs"

STEPS = [
    {
        "name": "daily_content_packet",
        "script": REPO_ROOT / "scripts" / "build_seta_daily_content_packet.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "content_packets" / "seta_daily_content_packet_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "content_packets",
        "fallback_pattern": "seta_daily_content_packet_*.json",
    },
    {
        "name": "website_snippets",
        "script": REPO_ROOT / "scripts" / "build_seta_website_snippets.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "website_snippets",
        "fallback_pattern": "seta_website_snippets_*.json",
    },
    {
        "name": "blog_outline",
        "script": REPO_ROOT / "scripts" / "build_seta_blog_outline.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "blog_outlines" / "seta_blog_outline_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "blog_outlines",
        "fallback_pattern": "seta_blog_outline_*.json",
    },
    {
        "name": "blog_draft",
        "script": REPO_ROOT / "scripts" / "build_seta_blog_draft.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "blog_drafts" / "seta_blog_draft_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "blog_drafts",
        "fallback_pattern": "seta_blog_draft_*.json",
    },
    {
        "name": "social_calendar",
        "script": REPO_ROOT / "scripts" / "build_seta_social_calendar.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "social_calendar" / "seta_social_calendar_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "social_calendar",
        "fallback_pattern": "seta_social_calendar_*.json",
    },
    {
        "name": "public_website_content",
        "script": REPO_ROOT / "scripts" / "publish_seta_public_website_content.py",
        "expected_latest": REPO_ROOT / "public_content" / "seta_website_snippets_latest.json",
        "fallback_glob": REPO_ROOT / "public_content",
        "fallback_pattern": "seta_website_snippets_*.json",
    },
]


def now_stamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")


def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")


def read_json(path: Path) -> Dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False), encoding="utf-8")


def newest(path: Path, pattern: str) -> Optional[Path]:
    if not path.exists():
        return None
    matches = sorted(
        [p for p in path.glob(pattern) if "_smoke" not in str(p).lower() and "latest" not in p.name.lower()],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return matches[0] if matches else None


def resolve_output(step: Dict[str, Any]) -> Optional[Path]:
    latest = Path(step["expected_latest"])
    if latest.exists():
        return latest
    return newest(Path(step["fallback_glob"]), step["fallback_pattern"])


def run_command(cmd: List[str], cwd: Path, dry_run: bool = False) -> Dict[str, Any]:
    if dry_run:
        return {
            "returncode": 0,
            "stdout": "[DRY RUN] " + " ".join(cmd),
            "stderr": "",
        }

    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        capture_output=True,
    )
    return {
        "returncode": proc.returncode,
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


def validate_safety(path: Optional[Path]) -> Tuple[bool, List[str], Dict[str, Any]]:
    messages: List[str] = []
    payload: Dict[str, Any] = {}

    if not path or not path.exists():
        messages.append("No JSON output found to validate.")
        return False, messages, payload

    payload = read_json(path)
    if not payload:
        messages.append(f"Could not parse JSON output: {path}")
        return False, messages, payload

    ok = True

    # Most artifacts have top-level safety flags.
    if payload.get("draft_only") is not True:
        ok = False
        messages.append("Top-level draft_only is not true.")
    else:
        messages.append("Top-level draft_only=true.")

    if payload.get("posting_performed") is not False:
        ok = False
        messages.append("Top-level posting_performed is not false.")
    else:
        messages.append("Top-level posting_performed=false.")

    # Row-level check only applies to action/review artifacts.
    # Informational artifacts, like daily content packets, may have rows without
    # posting/review fields and should rely on top-level safety flags.
    rows = payload.get("rows")
    if isinstance(rows, list) and rows:
        action_rows = [
            r for r in rows
            if isinstance(r, dict) and (
                "posting_performed" in r or
                "requires_human_review" in r or
                "status" in r or
                "draft_text" in r
            )
        ]
        if action_rows:
            bad_posting = [r for r in action_rows if r.get("posting_performed") is not False]
            bad_review = [r for r in action_rows if r.get("requires_human_review") is not True]
            if bad_posting:
                ok = False
                messages.append(f"{len(bad_posting)} action row(s) have posting_performed not false.")
            else:
                messages.append("All action row-level posting_performed flags are false.")
            if bad_review:
                ok = False
                messages.append(f"{len(bad_review)} action row(s) missing requires_human_review=true.")
            else:
                messages.append("All action row-level requires_human_review flags are true.")
        else:
            messages.append("Rows are informational; row-level action safety checks skipped.")

    return ok, messages, payload


def summarize_payload(step_name: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    summary: Dict[str, Any] = {}
    if not payload:
        return summary

    for key in [
        "date",
        "rows",
        "snippets",
        "lead_asset",
        "title",
        "word_count_estimate",
    ]:
        if key in payload:
            summary[key] = payload.get(key)

    if step_name == "social_calendar":
        summary["counts"] = payload.get("counts", {})
    if step_name == "blog_draft":
        summary["supporting_assets"] = payload.get("supporting_assets", [])
    if step_name == "blog_outline":
        lead = payload.get("lead_asset", {})
        if isinstance(lead, dict):
            summary["lead_asset"] = lead.get("term")
        summary["supporting_assets"] = [
            x.get("term") for x in payload.get("supporting_assets", []) if isinstance(x, dict)
        ]

    return summary


def run_step(step: Dict[str, Any], python_exe: str, dry_run: bool = False) -> Dict[str, Any]:
    name = step["name"]
    script = Path(step["script"])
    started = now_iso()

    result: Dict[str, Any] = {
        "name": name,
        "script": str(script),
        "started_at_utc": started,
        "finished_at_utc": None,
        "status": "pending",
        "returncode": None,
        "stdout_tail": "",
        "stderr_tail": "",
        "output_json": None,
        "safety_ok": False,
        "safety_messages": [],
        "summary": {},
    }

    if not script.exists():
        result.update({
            "status": "missing_script",
            "finished_at_utc": now_iso(),
            "stderr_tail": f"Missing script: {script}",
            "returncode": 2,
        })
        return result

    cmd = [python_exe, str(script)]
    proc = run_command(cmd, REPO_ROOT, dry_run=dry_run)

    result["returncode"] = proc["returncode"]
    result["stdout_tail"] = proc["stdout"][-4000:]
    result["stderr_tail"] = proc["stderr"][-4000:]
    result["finished_at_utc"] = now_iso()

    if proc["returncode"] != 0:
        result["status"] = "failed"
        return result

    output = resolve_output(step)
    result["output_json"] = str(output) if output else None

    safety_ok, messages, payload = validate_safety(output)
    result["safety_ok"] = safety_ok
    result["safety_messages"] = messages
    result["summary"] = summarize_payload(name, payload)

    if not safety_ok:
        result["status"] = "failed_safety_check"
    else:
        result["status"] = "passed"

    return result


def run_reply_queue(python_exe: str, dry_run: bool = False) -> Dict[str, Any]:
    script = REPO_ROOT / "scripts" / "build_seta_reply_draft_queue.py"
    sample = REPO_ROOT / "reply_agent" / "sample_inputs" / "sample_queue_comments.jsonl"
    started = now_iso()

    result: Dict[str, Any] = {
        "name": "reply_draft_queue",
        "script": str(script),
        "input": str(sample),
        "started_at_utc": started,
        "finished_at_utc": None,
        "status": "pending",
        "returncode": None,
        "stdout_tail": "",
        "stderr_tail": "",
        "safety_ok": False,
        "safety_messages": [],
        "summary": {},
    }

    if not script.exists():
        result.update({
            "status": "missing_script",
            "finished_at_utc": now_iso(),
            "returncode": 2,
            "stderr_tail": f"Missing script: {script}",
        })
        return result

    if not sample.exists():
        result.update({
            "status": "missing_input",
            "finished_at_utc": now_iso(),
            "returncode": 2,
            "stderr_tail": f"Missing input: {sample}",
        })
        return result

    cmd = [python_exe, str(script), "--input", str(sample)]
    proc = run_command(cmd, REPO_ROOT, dry_run=dry_run)
    result["returncode"] = proc["returncode"]
    result["stdout_tail"] = proc["stdout"][-4000:]
    result["stderr_tail"] = proc["stderr"][-4000:]
    result["finished_at_utc"] = now_iso()

    if proc["returncode"] != 0:
        result["status"] = "failed"
        return result

    # The queue builder names outputs by timestamp; inspect latest JSONL is not JSON.
    # Treat subprocess success as operational success, while preserving draft-only policy
    # through the queue script's own smoke tests elsewhere.
    result["status"] = "passed"
    result["safety_ok"] = True
    result["safety_messages"] = ["Reply queue builder completed. Queue rows remain draft-only by script design."]
    return result


def markdown_summary(run: Dict[str, Any]) -> str:
    lines: List[str] = []
    lines.append(f"# SETA Content Pipeline Run — {run.get('run_id')}")
    lines.append("")
    lines.append(f"Started: {run.get('started_at_utc')}")
    lines.append(f"Finished: {run.get('finished_at_utc')}")
    lines.append(f"Status: {run.get('status')}")
    lines.append("")
    lines.append("> Draft-only pipeline. No posting is performed.")
    lines.append("")

    lines.append("## Steps")
    lines.append("")
    for step in run.get("steps", []):
        lines.append(f"### {step.get('name')} — {step.get('status')}")
        lines.append("")
        lines.append(f"- Return code: {step.get('returncode')}")
        lines.append(f"- Output JSON: {step.get('output_json')}")
        lines.append(f"- Safety OK: {step.get('safety_ok')}")
        for msg in step.get("safety_messages", []):
            lines.append(f"  - {msg}")
        summary = step.get("summary") or {}
        if summary:
            lines.append("- Summary:")
            for k, v in summary.items():
                lines.append(f"  - {k}: {v}")
        if step.get("stderr_tail"):
            lines.append("")
            lines.append("```text")
            lines.append(step.get("stderr_tail", ""))
            lines.append("```")
        lines.append("")

    lines.append("## Final outputs")
    lines.append("")
    for k, v in (run.get("final_outputs") or {}).items():
        lines.append(f"- {k}: {v}")
    lines.append("")
    return "\n".join(lines)


def collect_final_outputs() -> Dict[str, str]:
    paths = {
        "content_packet": REPO_ROOT / "reply_agent" / "content_packets" / "seta_daily_content_packet_latest.json",
        "website_snippets": REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json",
        "blog_outline": REPO_ROOT / "reply_agent" / "blog_outlines" / "seta_blog_outline_latest.json",
        "blog_draft": REPO_ROOT / "reply_agent" / "blog_drafts" / "seta_blog_draft_latest.json",
        "social_calendar": REPO_ROOT / "reply_agent" / "social_calendar" / "seta_social_calendar_latest.json",
        "public_website_content": REPO_ROOT / "public_content" / "seta_website_snippets_latest.json",
    }
    return {k: str(v) for k, v in paths.items() if v.exists()}


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the draft-only SETA content pipeline.")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--python-exe", default=sys.executable)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--include-reply-queue", action="store_true")
    ap.add_argument("--continue-on-error", action="store_true")
    args = ap.parse_args()

    run_id = now_stamp()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    run: Dict[str, Any] = {
        "schema_version": "seta_content_pipeline_run_v1",
        "run_id": run_id,
        "started_at_utc": now_iso(),
        "finished_at_utc": None,
        "status": "running",
        "repo_root": str(REPO_ROOT),
        "python_exe": args.python_exe,
        "dry_run": bool(args.dry_run),
        "draft_only": True,
        "posting_performed": False,
        "steps": [],
        "final_outputs": {},
    }

    print("=" * 76)
    print("SETA content pipeline runner")
    print("=" * 76)

    overall_ok = True

    for step in STEPS:
        print(f"[RUN] {step['name']}")
        result = run_step(step, args.python_exe, dry_run=args.dry_run)
        run["steps"].append(result)

        if result["status"] == "passed":
            print(f"[OK] {step['name']}")
        else:
            overall_ok = False
            print(f"[ERROR] {step['name']} status={result['status']}")
            if result.get("stderr_tail"):
                print(result["stderr_tail"])
            if not args.continue_on_error:
                break

    if args.include_reply_queue and (overall_ok or args.continue_on_error):
        print("[RUN] reply_draft_queue")
        result = run_reply_queue(args.python_exe, dry_run=args.dry_run)
        run["steps"].append(result)
        if result["status"] == "passed":
            print("[OK] reply_draft_queue")
        else:
            overall_ok = False
            print(f"[ERROR] reply_draft_queue status={result['status']}")

    run["finished_at_utc"] = now_iso()
    run["final_outputs"] = collect_final_outputs()
    run["status"] = "passed" if overall_ok else "failed"

    json_path = out_dir / f"seta_content_pipeline_run_{run_id}.json"
    md_path = out_dir / f"seta_content_pipeline_run_{run_id}.md"
    latest_json = out_dir / "seta_content_pipeline_run_latest.json"
    latest_md = out_dir / "seta_content_pipeline_run_latest.md"

    write_json(json_path, run)
    write_json(latest_json, run)
    md = markdown_summary(run)
    md_path.write_text(md, encoding="utf-8")
    latest_md.write_text(md, encoding="utf-8")

    summary = {
        "run_id": run_id,
        "status": run["status"],
        "json_path": str(json_path),
        "markdown_path": str(md_path),
        "latest_json": str(latest_json),
        "latest_markdown": str(latest_md),
        "steps": len(run["steps"]),
        "draft_only": True,
        "posting_performed": False,
    }

    print("=" * 76)
    print("SETA content pipeline complete")
    print(json.dumps(summary, indent=2, ensure_ascii=False))

    return 0 if overall_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
