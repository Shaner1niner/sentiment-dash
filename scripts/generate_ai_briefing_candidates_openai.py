#!/usr/bin/env python
"""Generate local SETA briefing candidate outputs with the OpenAI Responses API.

This script is intentionally local-only: it reads a candidate prompt pack,
requires OPENAI_API_KEY from the environment, writes candidate JSON files under
the prompt pack's candidate_outputs directory, and validates each output. It
does not modify reviewed/static dashboard payloads.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from build_ai_briefing_sample_packet import ROOT, path_label
from check_ai_briefing_output import validate_output

RESPONSES_URL = "https://api.openai.com/v1/responses"
DEFAULT_MODEL = "gpt-5.1"
DEFAULT_REASONING_EFFORT = "high"

BRIEFING_OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "schema_version": {"type": "string", "enum": ["ai_briefing_output_v1"]},
        "asset": {"type": "string"},
        "frequency": {"type": "string", "enum": ["D", "W"]},
        "as_of": {"type": "string"},
        "headline": {"type": "string"},
        "summary": {"type": "string"},
        "briefing_cards": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "what_seta_sees": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "role": {"type": "string", "enum": ["Interpretation"]},
                        "copy": {"type": "string"},
                    },
                    "required": ["role", "copy"],
                },
                "why_it_matters": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "role": {"type": "string", "enum": ["Implication"]},
                        "copy": {"type": "string"},
                    },
                    "required": ["role", "copy"],
                },
                "evidence": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "role": {"type": "string", "enum": ["Receipts"]},
                        "items": {
                            "type": "array",
                            "items": {"type": "string"},
                            "minItems": 3,
                            "maxItems": 5,
                        },
                    },
                    "required": ["role", "items"],
                },
                "participation_quality": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "role": {"type": "string", "enum": ["Trust check"]},
                        "copy": {"type": "string"},
                    },
                    "required": ["role", "copy"],
                },
            },
            "required": ["what_seta_sees", "why_it_matters", "evidence", "participation_quality"],
        },
        "what_seta_sees": {"type": "string"},
        "why_it_matters": {"type": "string"},
        "evidence": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 3,
            "maxItems": 5,
        },
        "trust_check": {"type": "string"},
        "watch_item": {"type": "string"},
        "limitations": {"type": "string"},
        "public_safe_disclaimer": {"type": "string"},
        "source_breadth_used": {"type": "boolean"},
        "review_status": {"type": "string", "enum": ["draft"]},
        "model_metadata": {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "provider": {"type": "string"},
                "model": {"type": "string"},
                "prompt_version": {"type": "string", "enum": ["seta_briefing_prompt_v2"]},
            },
            "required": ["provider", "model", "prompt_version"],
        },
    },
    "required": [
        "schema_version",
        "asset",
        "frequency",
        "as_of",
        "headline",
        "summary",
        "briefing_cards",
        "what_seta_sees",
        "why_it_matters",
        "evidence",
        "trust_check",
        "watch_item",
        "limitations",
        "public_safe_disclaimer",
        "source_breadth_used",
        "review_status",
        "model_metadata",
    ],
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        item = json.loads(line)
        if not isinstance(item, dict):
            raise ValueError(f"{path} contains a non-object JSONL row")
        records.append(item)
    return records


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def prompt_text(record: dict[str, Any]) -> str:
    return "\n\n".join(
        [
            str(record.get("task_prompt") or ""),
            "SETA briefing input JSON:",
            json.dumps(record.get("briefing_input") or {}, indent=2, sort_keys=True),
        ]
    )


def response_payload(record: dict[str, Any], *, model: str, reasoning_effort: str) -> dict[str, Any]:
    return {
        "model": model,
        "instructions": record.get("system_instruction"),
        "input": prompt_text(record),
        "reasoning": {"effort": reasoning_effort},
        "text": {
            "format": {
                "type": "json_schema",
                "name": "ai_briefing_output_v1",
                "description": "A validated SETA briefing candidate output.",
                "schema": BRIEFING_OUTPUT_SCHEMA,
                "strict": True,
            },
            "verbosity": "low",
        },
        "store": False,
    }


def extract_output_text(response: dict[str, Any]) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]
    chunks: list[str] = []
    for item in response.get("output") or []:
        for content in item.get("content") or []:
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "".join(chunks).strip()


def call_openai(payload: dict[str, Any], api_key: str, *, timeout: int) -> dict[str, Any]:
    request = urllib.request.Request(
        RESPONSES_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI request failed with HTTP {exc.code}: {body}") from exc


def candidate_output_path(prompt_jsonl: Path, record: dict[str, Any]) -> Path:
    relative = str(record.get("candidate_output_path") or "").strip()
    if not relative:
        relative = f"candidate_outputs/{record.get('candidate_id', 'candidate')}_candidate.json"
    path = Path(relative)
    return path if path.is_absolute() else prompt_jsonl.parent / path


def generate_candidates(
    prompt_jsonl: Path,
    *,
    model: str,
    reasoning_effort: str,
    limit: int | None,
    only: set[str] | None,
    sleep_seconds: float,
    timeout: int,
    force: bool,
) -> dict[str, Any]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    records = read_jsonl(prompt_jsonl)
    if only:
        records = [record for record in records if str(record.get("candidate_id")) in only]
    if limit is not None:
        records = records[:limit]

    results: list[dict[str, Any]] = []
    for index, record in enumerate(records, start=1):
        output_path = candidate_output_path(prompt_jsonl, record)
        if output_path.exists() and not force:
            candidate = json.loads(output_path.read_text(encoding="utf-8"))
            errors = validate_output(candidate, record.get("briefing_input") if isinstance(record.get("briefing_input"), dict) else None)
            results.append(
                {
                    "candidate_id": record.get("candidate_id"),
                    "status": "existing_pass" if not errors else "existing_fail",
                    "output_path": path_label(output_path),
                    "validation_errors": errors,
                }
            )
            continue

        print(f"[INFO] generating {index}/{len(records)} {record.get('candidate_id')}")
        try:
            response = call_openai(response_payload(record, model=model, reasoning_effort=reasoning_effort), api_key, timeout=timeout)
            text = extract_output_text(response)
            candidate = json.loads(text)
            if isinstance(candidate, dict):
                metadata = candidate.setdefault("model_metadata", {})
                if isinstance(metadata, dict):
                    metadata["provider"] = "openai"
                    metadata["model"] = model
                    metadata["prompt_version"] = "seta_briefing_prompt_v2"
            errors = validate_output(candidate, record.get("briefing_input") if isinstance(record.get("briefing_input"), dict) else None)
            write_json(output_path, candidate)
            results.append(
                {
                    "candidate_id": record.get("candidate_id"),
                    "status": "pass" if not errors else "fail",
                    "output_path": path_label(output_path),
                    "validation_errors": errors,
                    "response_id": response.get("id"),
                }
            )
        except Exception as exc:
            results.append(
                {
                    "candidate_id": record.get("candidate_id"),
                    "status": "error",
                    "output_path": path_label(output_path),
                    "validation_errors": [str(exc)],
                }
            )
        if sleep_seconds and index < len(records):
            time.sleep(sleep_seconds)

    return {
        "schema_version": "ai_briefing_openai_candidate_run_v1",
        "prompt_jsonl": path_label(prompt_jsonl),
        "model": model,
        "reasoning_effort": reasoning_effort,
        "candidate_count": len(results),
        "pass_count": sum(1 for item in results if str(item.get("status")).endswith("pass")),
        "results": results,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prompt-jsonl", required=True, help="Path to ai_candidate_prompts.jsonl.")
    parser.add_argument("--model", default=os.environ.get("OPENAI_BRIEFING_MODEL", DEFAULT_MODEL))
    parser.add_argument("--reasoning-effort", default=os.environ.get("OPENAI_BRIEFING_REASONING", DEFAULT_REASONING_EFFORT))
    parser.add_argument("--limit", type=int, help="Optional number of prompt records to process.")
    parser.add_argument("--only", action="append", help="Candidate id to process. May be repeated or comma-separated.")
    parser.add_argument("--sleep-seconds", type=float, default=0.5)
    parser.add_argument("--timeout", type=int, default=120)
    parser.add_argument("--force", action="store_true", help="Overwrite existing candidate files.")
    parser.add_argument("--run-report", help="Optional JSON run report path.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    prompt_jsonl = Path(args.prompt_jsonl).resolve()
    only = None
    if args.only:
        only = {item.strip() for chunk in args.only for item in str(chunk).split(",") if item.strip()}
    report = generate_candidates(
        prompt_jsonl,
        model=args.model,
        reasoning_effort=args.reasoning_effort,
        limit=args.limit,
        only=only,
        sleep_seconds=args.sleep_seconds,
        timeout=args.timeout,
        force=args.force,
    )
    report_path = Path(args.run_report).resolve() if args.run_report else prompt_jsonl.parent / "openai_candidate_run_report.json"
    write_json(report_path, report)
    print(f"[OK] wrote {report_path}")
    print(f"[OK] passing candidates: {report['pass_count']}/{report['candidate_count']}")
    return 0 if report["pass_count"] == report["candidate_count"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
