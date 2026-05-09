#!/usr/bin/env python
"""Regression check for SETA briefing semantic clarity.

This script generates deterministic draft briefings for a small asset matrix and
checks that the public-facing copy preserves the semantic contract:

- primary read is explicit
- shared price/sentiment zone language is present
- structure and timing are separated
- timing context is explained
- trust check does not use blocked breadth-as-proof wording

It intentionally creates temporary outputs only.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ASSETS = ["BTC", "ETH", "NVDA", "GLD", "MSFT"]


def run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def text_fields(payload: dict) -> str:
    parts: list[str] = []
    for key in ["headline", "summary", "what_seta_sees", "why_it_matters", "trust_check", "limitations"]:
        value = payload.get(key)
        if isinstance(value, str):
            parts.append(value)
    evidence = payload.get("evidence")
    if isinstance(evidence, list):
        parts.extend(str(item) for item in evidence)
    return "\n".join(parts)


def check_payload(path: Path) -> list[str]:
    errors: list[str] = []
    payload = json.loads(path.read_text(encoding="utf-8"))
    what = str(payload.get("what_seta_sees") or "")
    why = str(payload.get("why_it_matters") or "")
    trust = str(payload.get("trust_check") or "")
    combined = text_fields(payload).lower()

    required_pairs = [
        ("what_seta_sees", "Primary read:", what),
        ("what_seta_sees", "shared price/sentiment zone", what),
        ("what_seta_sees", "Structure reads", what),
        ("what_seta_sees", "timing context reads", what),
        ("why_it_matters", "timing context", why),
        ("why_it_matters", "indicators align or conflict", why),
        ("trust_check", "trust layer", trust),
        ("trust_check", "standalone demand signal", trust),
    ]

    for field, needle, haystack in required_pairs:
        if needle.lower() not in haystack.lower():
            errors.append(f"{path.name}: {field} missing semantic phrase: {needle!r}")

    forbidden = [
        "not proof",
        "proof of demand",
        "breadth proves",
        "attention confirms",
        "attention validates",
        "overlap event",
    ]
    for needle in forbidden:
        if needle in combined:
            errors.append(f"{path.name}: contains forbidden phrase: {needle!r}")

    return errors


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets", nargs="*", default=DEFAULT_ASSETS)
    parser.add_argument("--frequency", default="D")
    parser.add_argument("--display-range", default="3M")
    parser.add_argument("--mode", default="public")
    parser.add_argument("--keep-outputs", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    output_dir = ROOT / "briefing_outputs" / "_semantic_regression"
    output_dir.mkdir(parents=True, exist_ok=True)

    all_errors: list[str] = []
    generated: list[Path] = []

    for asset in args.assets:
        output = output_dir / f"{asset.lower()}_{args.frequency.lower()}_{args.display_range.lower()}_{args.mode}_semantic_regression.json"
        generated.append(output)

        gen_cmd = [
            sys.executable,
            "scripts/generate_ai_briefing_draft.py",
            "--mode",
            args.mode,
            "--asset",
            asset,
            "--frequency",
            args.frequency,
            "--display-range",
            args.display_range,
            "--output",
            str(output),
        ]
        gen = run(gen_cmd)
        if gen.returncode != 0:
            all_errors.append(f"{asset}: generator failed\n{gen.stdout}")
            continue

        check_cmd = [
            sys.executable,
            "scripts/check_ai_briefing_output.py",
            str(output),
        ]
        check = run(check_cmd)
        if check.returncode != 0:
            all_errors.append(f"{asset}: schema/quality validation failed\n{check.stdout}")
            continue

        all_errors.extend(check_payload(output))

    if not args.keep_outputs:
        for path in generated:
            try:
                path.unlink()
            except FileNotFoundError:
                pass
        try:
            output_dir.rmdir()
        except OSError:
            pass

    if all_errors:
        for error in all_errors:
            print(f"[ERROR] {error}")
        return 1

    print(f"[OK] semantic briefing regression passed for {len(args.assets)} asset(s): {', '.join(args.assets)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
