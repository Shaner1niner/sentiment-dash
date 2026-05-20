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
import os
import runpy
import traceback
import shutil
from datetime import datetime, UTC
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT_DIR = REPO_ROOT / "reply_agent" / "pipeline_runs"
CLOUD_SYNC_DIR = REPO_ROOT / "cloud_sync_staging"  # Smart Dual Save target

OUTPUT_PROFILE_REQUIRED_CONTENT = "required_content"
OUTPUT_PROFILE_REQUIRED_PUBLIC = "required_public_content"
OUTPUT_PROFILE_OPTIONAL_DRAFT = "optional_draft_output"
OUTPUT_PROFILE_EXPERIMENTAL = "experimental_output"

REQUIRED_OUTPUT_PROFILES = {
    OUTPUT_PROFILE_REQUIRED_CONTENT,
    OUTPUT_PROFILE_REQUIRED_PUBLIC,
}

# ==============================================================================
# 🚨 CRITICAL FIX: DYNAMIC DATE INJECTION
# This forces all downstream scripts (like build_seta_daily_content_packet.py)
# to use the current live date instead of the hardcoded 2026-05-11.
# ==============================================================================
# We set this to 2026-05-14 to perfectly match the CSV generation clock.
os.environ["SETA_RUN_DATE"] = datetime.now(UTC).strftime("%Y-%m-%d")

STEPS = [
    {
        "name": "daily_content_packet",
        "script": REPO_ROOT / "scripts" / "build_seta_daily_content_packet.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "content_packets" / "seta_daily_content_packet_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "content_packets",
        "fallback_pattern": "seta_daily_content_packet_*.json",
        "output_profile": OUTPUT_PROFILE_REQUIRED_CONTENT,
    },
    {
        "name": "website_snippets",
        "script": REPO_ROOT / "scripts" / "build_seta_website_snippets.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "website_snippets" / "seta_website_snippets_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "website_snippets",
        "fallback_pattern": "seta_website_snippets_*.json",
        "output_profile": OUTPUT_PROFILE_REQUIRED_CONTENT,
    },
    {
        "name": "blog_outline",
        "script": REPO_ROOT / "scripts" / "build_seta_blog_outline.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "blog_outlines" / "seta_blog_outline_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "blog_outlines",
        "fallback_pattern": "seta_blog_outline_*.json",
        "output_profile": OUTPUT_PROFILE_OPTIONAL_DRAFT,
    },
    {
        "name": "blog_draft",
        "script": REPO_ROOT / "scripts" / "build_seta_blog_draft.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "blog_drafts" / "seta_blog_draft_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "blog_drafts",
        "fallback_pattern": "seta_blog_draft_*.json",
        "output_profile": OUTPUT_PROFILE_OPTIONAL_DRAFT,
    },
    {
        "name": "social_calendar",
        "script": REPO_ROOT / "scripts" / "build_seta_social_calendar.py",
        "expected_latest": REPO_ROOT / "reply_agent" / "social_calendar" / "seta_social_calendar_latest.json",
        "fallback_glob": REPO_ROOT / "reply_agent" / "social_calendar",
        "fallback_pattern": "seta_social_calendar_*.json",
        "output_profile": OUTPUT_PROFILE_OPTIONAL_DRAFT,
    },
    {
        "name": "public_website_content",
        "script": REPO_ROOT / "scripts" / "publish_seta_public_website_content.py",
        "expected_latest": REPO_ROOT / "public_content" / "seta_website_snippets_latest.json",
        "fallback_glob": REPO_ROOT / "public_content",
        "fallback_pattern": "seta_website_snippets_*.json",
        "output_profile": OUTPUT_PROFILE_REQUIRED_PUBLIC,
    },
]

def now_ts() -> str:
    return datetime.now(UTC).strftime("%Y%m%d_%H%M%S")

def now_iso() -> str:
    return datetime.now(UTC).isoformat(timespec="seconds")

def load_expected_content_date() -> Optional[str]:
    """Use the latest daily context date as the freshness source of truth."""
    path = REPO_ROOT / "reply_agent" / "daily_context" / "seta_daily_context_latest.json"
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None
    date_value = payload.get("date")
    return str(date_value) if date_value else None

def ensure_dir(d: Path) -> None:
    if not d.exists():
        d.mkdir(parents=True, exist_ok=True)

def find_latest_file(glob_dir: Path, pattern: str) -> Optional[Path]:
    if not glob_dir.exists():
        return None
    matches = list(glob_dir.glob(pattern))
    if not matches:
        return None
    valid_matches = [f for f in matches if f.name != pattern.replace("*", "latest")]
    if not valid_matches:
        return None
    return max(valid_matches, key=lambda p: p.stat().st_mtime)

def get_output_profile(step: Dict[str, Any]) -> str:
    return str(step.get("output_profile") or OUTPUT_PROFILE_REQUIRED_CONTENT)

def is_required_step(step: Dict[str, Any]) -> bool:
    return get_output_profile(step) in REQUIRED_OUTPUT_PROFILES

def get_actual_output(step: Dict[str, Any]) -> Optional[Path]:
    expected = step["expected_latest"]
    if expected.exists():
        return expected
    fallback = find_latest_file(step["fallback_glob"], step["fallback_pattern"])
    return fallback if fallback and fallback.exists() else None

def validate_safety(path: Optional[Path]) -> Tuple[bool, List[str], Dict[str, Any]]:
    messages = []
    if not path or not path.exists():
        messages.append("No JSON output found to validate.")
        return False, messages, {}

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        messages.append(f"Failed to parse JSON output: {e}")
        return False, messages, {}

    safety_ok = True
    
    if data.get("draft_only") is not True and data.get("public_safe") is not True:
        safety_ok = False
        messages.append("Top-level draft_only or public_safe is missing or false.")
    else:
        if data.get("draft_only"):
            messages.append("Top-level draft_only=true.")
        if data.get("public_safe"):
            messages.append("Top-level public_safe=true.")

    if data.get("posting_performed") is not False:
        safety_ok = False
        messages.append("Top-level posting_performed is missing or true (EXPECTED FALSE IN DRAFT MODE).")
    else:
        messages.append("Top-level posting_performed=false.")

    items = data.get("rows", data.get("snippets", []))
    if not items:
        messages.append("No rows/snippets found to validate.")
        return safety_ok, messages, data

    first_item = items[0]
    if "requires_human_review" in first_item:
        all_unposted = all(not item.get("posting_performed", True) for item in items)
        all_reviewed = all(item.get("requires_human_review", False) for item in items)
        if not all_unposted:
            safety_ok = False
            messages.append("One or more action rows report posting_performed=true.")
        else:
            messages.append("All action row-level posting_performed flags are false.")

        if not all_reviewed:
            safety_ok = False
            messages.append("One or more action rows report requires_human_review=false.")
        else:
            messages.append("All action row-level requires_human_review flags are true.")
    else:
        messages.append("Rows are informational; row-level action safety checks skipped.")

    return safety_ok, messages, data

def summarize_payload(data: Dict[str, Any], step_name: str) -> Dict[str, Any]:
    summary = {}
    if "date" in data: summary["date"] = data["date"]
    
    items = data.get("rows", data.get("snippets", []))
    if items:
        if step_name == "daily_content_packet":
            summary["rows"] = items
        elif step_name == "website_snippets" or step_name == "public_website_content":
            summary["snippets"] = items
        else:
            summary["rows"] = items
            summary["counts"] = {"rows": len(items)}
            if "platform" in items[0]:
                platforms = [i.get("platform", "unknown") for i in items]
                for p in set(platforms):
                    summary["counts"][p] = platforms.count(p)

    if "lead_asset" in data: summary["lead_asset"] = data["lead_asset"]
    if "title" in data: summary["title"] = data["title"]
    if "word_count_estimate" in data: summary["word_count_estimate"] = data["word_count_estimate"]
    if "supporting_assets" in data: summary["supporting_assets"] = data["supporting_assets"]

    return summary

def normalize_system_exit_code(code: Any) -> int:
    """Convert SystemExit.code into a process-style integer return code."""
    if code is None:
        return 0
    if isinstance(code, int):
        return code
    if isinstance(code, str):
        if not code.strip():
            return 0
        try:
            return int(code.strip())
        except ValueError:
            return 1
    return 1

def run_step_direct(step: Dict[str, Any], dry_run: bool = False) -> Dict[str, Any]:
    script = step["script"]
    output_profile = get_output_profile(step)
    result = {
        "name": step["name"],
        "output_profile": output_profile,
        "required_output": output_profile in REQUIRED_OUTPUT_PROFILES,
        "started_at_utc": now_iso(),
        "status": "pending",
        "returncode": None,
        "stdout_tail": "",
        "stderr_tail": "",
        "output_path": None,
        "safety_ok": False,
        "safety_messages": [],
        "payload_summary": {}
    }

    if not script.exists():
        result.update({"status": "missing_script", "finished_at_utc": now_iso(), "stderr_tail": f"Missing script: {script}", "returncode": 2})
        return result

    if dry_run:
        result.update({"status": "passed", "finished_at_utc": now_iso(), "returncode": 0, "stdout_tail": "[DRY RUN] Direct memory execution skipped."})
        return result

    original_argv = sys.argv[:]
    try:
        # Child scripts commonly use argparse and/or sys.exit(main()).
        # Give each script a clean argv and treat SystemExit(0) as success
        # instead of allowing it to terminate the entire runner after step 1.
        sys.argv = [str(script)]
        try:
            runpy.run_path(str(script), run_name="__main__")
            exit_code = 0
        except SystemExit as e:
            exit_code = normalize_system_exit_code(e.code)

        result["returncode"] = exit_code

        if exit_code != 0:
            result["status"] = "failed"
            result["stderr_tail"] = f"Script exited with code {exit_code}"
            result["finished_at_utc"] = now_iso()
            return result

    except Exception:
        result["returncode"] = 1
        result["stderr_tail"] = traceback.format_exc()
        result["status"] = "failed"
        result["finished_at_utc"] = now_iso()
        return result
    finally:
        sys.argv = original_argv

    output = get_actual_output(step)
    if not output:
        missing_level = "required" if result["required_output"] else "optional"
        result.update({
            "status": "failed" if result["required_output"] else "optional_missing",
            "finished_at_utc": now_iso(),
            "stderr_tail": f"Expected {missing_level} output not found for {step['name']}",
        })
        return result

    result["output_path"] = str(output)
    safety_ok, messages, payload = validate_safety(output)

    expected_date = load_expected_content_date()
    payload_date = payload.get("date") if isinstance(payload, dict) else None
    if expected_date and payload_date:
        if str(payload_date) != str(expected_date):
            safety_ok = False
            messages.append(
                f"Freshness mismatch: output date={payload_date} but daily_context date={expected_date}."
            )
        else:
            messages.append(f"Freshness OK: output date matches daily_context date {expected_date}.")

    result["safety_ok"] = safety_ok
    result["safety_messages"] = messages

    if safety_ok:
        result["status"] = "passed"
        result["payload_summary"] = summarize_payload(payload, step["name"])
    else:
        result["status"] = "safety_violation"

    result["finished_at_utc"] = now_iso()
    return result

def collect_final_outputs() -> Dict[str, str]:
    outputs = {}
    for step in STEPS:
        actual = get_actual_output(step)
        if actual:
            outputs[step["name"]] = str(actual)
    return outputs

def summarize_run_quality(steps: List[Dict[str, Any]]) -> Dict[str, Any]:
    counts = {
        "required_missing_count": 0,
        "optional_missing_count": 0,
        "safety_violation_count": 0,
        "failed_count": 0,
        "passed_count": 0,
    }
    by_profile: Dict[str, Dict[str, int]] = {}
    for step in steps:
        status = str(step.get("status"))
        profile = str(step.get("output_profile") or "unknown")
        by_profile.setdefault(profile, {})
        by_profile[profile][status] = by_profile[profile].get(status, 0) + 1
        if status == "passed":
            counts["passed_count"] += 1
        elif status == "optional_missing":
            counts["optional_missing_count"] += 1
        elif status == "safety_violation":
            counts["safety_violation_count"] += 1
        elif step.get("required_output") and status in {"failed", "missing_script"}:
            counts["required_missing_count"] += 1
            counts["failed_count"] += 1
        elif status in {"failed", "missing_script"}:
            counts["failed_count"] += 1

    if counts["required_missing_count"] or counts["safety_violation_count"]:
        run_quality_status = "red"
    elif counts["optional_missing_count"] or counts["failed_count"]:
        run_quality_status = "yellow"
    else:
        run_quality_status = "green"

    return {
        "run_quality_status": run_quality_status,
        "warning_counts": counts,
        "by_output_profile": by_profile,
    }

def smart_dual_save_run(report_path: Path) -> None:
    if not CLOUD_SYNC_DIR.exists():
        CLOUD_SYNC_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        cloud_target = CLOUD_SYNC_DIR / report_path.name
        shutil.copy2(report_path, cloud_target)
        print(f"[DUAL SAVE] Copied run report to {cloud_target}")
    except Exception as e:
        print(f"[DUAL SAVE ERROR] Could not sync run report: {e}")

def main() -> int:
    parser = argparse.ArgumentParser(description="SETA Content Pipeline Runner V2 (Direct Execution)")
    parser.add_argument("--dry-run", action="store_true", help="Skip execution, verify paths.")
    parser.add_argument("--out-dir", type=str, default=str(DEFAULT_OUT_DIR), help="Directory for run reports.")
    parser.add_argument("--continue-on-error", action="store_true", help="Run all steps even if one fails.")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    ensure_dir(out_dir)

    run_id = now_ts()
    run = {
        "run_id": run_id,
        "started_at_utc": now_iso(),
        "finished_at_utc": None,
        "status": "running",
        "run_quality_status": "unknown",
        "draft_only": True,
        "posting_performed": False,
        "steps": [],
        "final_outputs": {},
        "output_quality": {},
    }

    print("=" * 76); print("SETA content pipeline runner V2 (Direct Execution)"); print("=" * 76)
    overall_ok = True

    for step in STEPS:
        print(f"[RUN] {step['name']}")
        result = run_step_direct(step, dry_run=args.dry_run)
        run["steps"].append(result)

        if result["status"] == "passed":
            print(f"[OK] {step['name']}")
        elif result["status"] == "optional_missing":
            print(f"[WARN] {step['name']} optional output missing")
        else:
            overall_ok = False
            print(f"[ERROR] {step['name']} status={result['status']}")
            if result.get("stderr_tail"): print(result["stderr_tail"])
            if not args.continue_on_error: break

    run["finished_at_utc"] = now_iso()
    run["final_outputs"] = collect_final_outputs()
    run["output_quality"] = summarize_run_quality(run["steps"])
    run["run_quality_status"] = run["output_quality"]["run_quality_status"]
    run["status"] = "passed" if overall_ok else "failed"

    json_path = out_dir / f"seta_content_pipeline_run_{run_id}.json"
    latest_json = out_dir / "seta_content_pipeline_run_latest.json"
    
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(run, f, indent=2)
    shutil.copy2(json_path, latest_json)

    md_path = out_dir / f"seta_content_pipeline_run_{run_id}.md"
    latest_md = out_dir / "seta_content_pipeline_run_latest.md"
    
    md_lines = [
        f"# SETA Content Pipeline Run — {run_id}\n",
        f"Started: {run['started_at_utc']}",
        f"Finished: {run['finished_at_utc']}",
        f"Status: {run['status']}",
        f"Run quality: {run['run_quality_status']}\n",
        "> Draft-only pipeline. No posting is performed.\n",
        "## Output quality\n",
        "```json",
        json.dumps(run["output_quality"], indent=2),
        "```\n",
        "## Steps\n"
    ]

    for s in run["steps"]:
        md_lines.append(f"### {s['name']} — {s['status']}\n")
        md_lines.append(f"- Output profile: {s.get('output_profile', 'unknown')}")
        md_lines.append(f"- Required output: {s.get('required_output', False)}")
        if s['returncode'] is not None: md_lines.append(f"- Return code: {s['returncode']}")
        if s['output_path']: md_lines.append(f"- Output JSON: {s['output_path']}")
        md_lines.append(f"- Safety OK: {s['safety_ok']}")
        for msg in s['safety_messages']: md_lines.append(f"  - {msg}")
        if s['payload_summary']:
            md_lines.append("- Summary:")
            for k, v in s['payload_summary'].items():
                md_lines.append(f"  - {k}: {v}")
        if s['stderr_tail']:
            md_lines.append("\n**Error Output:**")
            md_lines.append("```text")
            md_lines.append(s['stderr_tail'])
            md_lines.append("```")
        md_lines.append("\n")

    md_lines.append("## Final outputs\n")
    for name, path in run["final_outputs"].items():
        md_lines.append(f"- {name}: {path}")
    md_lines.append("\n")

    md_content = "\n".join(md_lines)
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)
    shutil.copy2(md_path, latest_md)

    print("=" * 76)
    print("SETA content pipeline complete")
    print(json.dumps({
        "run_id": run_id,
        "status": run["status"],
        "run_quality_status": run["run_quality_status"],
        "json_path": str(json_path),
        "markdown_path": str(md_path),
        "latest_json": str(latest_json),
        "latest_markdown": str(latest_md),
        "steps": len(run["steps"]),
        "draft_only": run["draft_only"],
        "posting_performed": run["posting_performed"],
        "final_outputs": run["final_outputs"],
        "output_quality": run["output_quality"],
    }, indent=2))
    print("=" * 76)

    # Trigger Smart Dual Save for the run report
    smart_dual_save_run(md_path)

    return 0 if overall_ok else 1

if __name__ == "__main__":
    sys.exit(main())