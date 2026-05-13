#!/usr/bin/env python
"""
SETA Content Pipeline Runner v2 (Direct Execution & Dual Save)

Runs the draft-only SETA content pipeline sequentially using direct shared-memory 
execution to eliminate subprocess overhead. Implements Smart Dual Save for output redundancy.
"""

from __future__ import annotations

import argparse
import json
import sys
import runpy
import traceback
import shutil
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "pipeline_runs"
CLOUD_SYNC_DIR = REPO_ROOT / "cloud_sync_staging"  # Smart Dual Save target

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
    if not path.exists(): return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

def smart_dual_save(primary_path: Path, content: str) -> None:
    """Writes to local disk and simultaneously mirrors to cloud sync staging."""
    # 1. Local Write
    primary_path.parent.mkdir(parents=True, exist_ok=True)
    primary_path.write_text(content, encoding="utf-8")
    
    # 2. Cloud Mirror Write
    relative_path = primary_path.relative_to(REPO_ROOT)
    cloud_path = CLOUD_SYNC_DIR / relative_path
    cloud_path.parent.mkdir(parents=True, exist_ok=True)
    cloud_path.write_text(content, encoding="utf-8")

def write_json(path: Path, obj: Any) -> None:
    payload = json.dumps(obj, indent=2, ensure_ascii=False, allow_nan=False)
    smart_dual_save(path, payload)

def newest(path: Path, pattern: str) -> Optional[Path]:
    if not path.exists(): return None
    matches = sorted(
        [p for p in path.glob(pattern) if "_smoke" not in str(p).lower() and "latest" not in p.name.lower()],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return matches[0] if matches else None

def resolve_output(step: Dict[str, Any]) -> Optional[Path]:
    latest = Path(step["expected_latest"])
    if latest.exists(): return latest
    return newest(Path(step["fallback_glob"]), step["fallback_pattern"])

def validate_safety(path: Optional[Path]) -> Tuple[bool, List[str], Dict[str, Any]]:
    # [Unchanged validation logic from v1]
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
    is_public_safe = payload.get("public_safe") is True

    if is_public_safe:
        messages.append("Top-level public_safe=true.")
    elif payload.get("draft_only") is not True:
        ok = False
        messages.append("Top-level draft_only is not true.")
    else:
        messages.append("Top-level draft_only=true.")

    if payload.get("posting_performed") is not False:
        ok = False
        messages.append("Top-level posting_performed is not false.")
    else:
        messages.append("Top-level posting_performed=false.")

    rows = payload.get("rows")
    if isinstance(rows, list) and rows:
        action_rows = [
            r for r in rows
            if isinstance(r, dict) and ("posting_performed" in r or "requires_human_review" in r or "status" in r or "draft_text" in r)
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

def run_step_direct(step: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    """Executes the builder script directly in the current memory space using runpy."""
    name = step["name"]
    script = Path(step["script"])
    
    result: Dict[str, Any] = {
        "name": name,
        "script": str(script),
        "started_at_utc": now_iso(),
        "status": "pending",
        "returncode": None,
        "stdout_tail": "",
        "stderr_tail": "",
        "output_json": None,
        "safety_ok": False,
        "safety_messages": [],
        "summary": {}
    }

    if not script.exists():
        result.update({"status": "missing_script", "finished_at_utc": now_iso(), "stderr_tail": f"Missing script: {script}", "returncode": 2})
        return result

    if dry_run:
        result.update({"status": "passed", "finished_at_utc": now_iso(), "returncode": 0, "stdout_tail": "[DRY RUN] Direct memory execution skipped."})
        return result

    try:
        # Override sys.argv to prevent argparse from reading the runner's arguments
        original_argv = sys.argv
        sys.argv = [str(script)]
        
        # Execute script directly in shared memory
        runpy.run_path(str(script), run_name="__main__")
        
        # Restore arguments
        sys.argv = original_argv
        result["returncode"] = 0
        
    except Exception as e:
        sys.argv = original_argv
        result["returncode"] = 1
        result["status"] = "failed"
        result["stderr_tail"] = traceback.format_exc()
        result["finished_at_utc"] = now_iso()
        return result

    result["finished_at_utc"] = now_iso()
    output = resolve_output(step)
    result["output_json"] = str(output) if output else None

    safety_ok, messages, payload = validate_safety(output)
    result["safety_ok"] = safety_ok
    result["safety_messages"] = messages
    
    if not safety_ok:
        result["status"] = "failed_safety_check"
    else:
        result["status"] = "passed"

    return result

def markdown_summary(run: Dict[str, Any]) -> str:
    lines = [f"# SETA Content Pipeline Run — {run.get('run_id')}", "", f"Started: {run.get('started_at_utc')}", f"Finished: {run.get('finished_at_utc')}", f"Status: {run.get('status')}", "", "> V2 Direct Execution Pipeline. Output mirrored via Smart Dual Save.", ""]
    for step in run.get("steps", []):
        lines.extend([f"### {step.get('name')} — {step.get('status')}", "", f"- Output JSON: {step.get('output_json')}", f"- Safety OK: {step.get('safety_ok')}"])
        if step.get("stderr_tail"):
            lines.extend(["", "```text", step.get("stderr_tail", ""), "```"])
        lines.append("")
    return "\n".join(lines)

def collect_final_outputs() -> Dict[str, str]:
    paths = {
        "content_packet": REPO_ROOT / "reply_agent" / "content_packets" / "seta_daily_content_packet_latest.json",
        "website_snippets": REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json",
        "blog_draft": REPO_ROOT / "reply_agent" / "blog_drafts" / "seta_blog_draft_latest.json",
        "public_website_content": REPO_ROOT / "public_content" / "seta_website_snippets_latest.json",
    }
    return {k: str(v) for k, v in paths.items() if v.exists()}

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--continue-on-error", action="store_true")
    args = ap.parse_args()

    run_id = now_stamp()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    CLOUD_SYNC_DIR.mkdir(parents=True, exist_ok=True)

    run: Dict[str, Any] = {
        "schema_version": "seta_content_pipeline_run_v2",
        "run_id": run_id,
        "started_at_utc": now_iso(),
        "finished_at_utc": None,
        "status": "running",
        "draft_only": True,
        "posting_performed": False,
        "steps": [],
        "final_outputs": {},
    }

    print("=" * 76); print("SETA content pipeline runner V2 (Direct Execution)"); print("=" * 76)
    overall_ok = True

    for step in STEPS:
        print(f"[RUN] {step['name']}")
        result = run_step_direct(step, dry_run=args.dry_run)
        run["steps"].append(result)

        if result["status"] == "passed":
            print(f"[OK] {step['name']}")
        else:
            overall_ok = False
            print(f"[ERROR] {step['name']} status={result['status']}")
            if result.get("stderr_tail"): print(result["stderr_tail"])
            if not args.continue_on_error: break

    run["finished_at_utc"] = now_iso()
    run["final_outputs"] = collect_final_outputs()
    run["status"] = "passed" if overall_ok else "failed"

    json_path = out_dir / f"seta_content_pipeline_run_{run_id}.json"
    latest_json = out_dir / "seta_content_pipeline_run_latest.json"
    
    write_json(json_path, run)
    write_json(latest_json, run)
    
    summary = {"run_id": run_id, "status": run["status"], "steps": len(run["steps"])}
    print("=" * 76); print("SETA content pipeline complete"); print(json.dumps(summary, indent=2))

    return 0 if overall_ok else 1

if __name__ == "__main__":
    raise SystemExit(main())
