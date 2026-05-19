from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def py_script(name: str) -> list[str]:
    return [sys.executable, str(ROOT / "scripts" / name)]

def run_step(label: str, command: list[str]) -> int:
    print("=" * 120)
    print(f"[QA] {label}")
    print("[CMD] " + " ".join(str(part) for part in command))
    print("-" * 120)
    result = subprocess.run(command, cwd=ROOT, text=True)
    if result.returncode != 0:
        print("-" * 120)
        print(f"[FAIL] {label} exited with code {result.returncode}")
        return result.returncode
    print("-" * 120)
    print(f"[OK] {label}")
    return 0

def build_steps(args: argparse.Namespace) -> list[tuple[str, list[str]]]:
    soak = py_script("run_sentiment_price_alignment_soak.py")
    if args.write_alignment_latest:
        soak.append("--write-latest")
    if args.alignment_asset:
        soak.extend(["--asset", args.alignment_asset.upper()])

    steps = [
        ("Sentiment-Price Alignment soak", soak),
        ("Sentiment-Price Alignment soak runner smoke", py_script("smoke_sentiment_price_alignment_soak_runner.py")),
        ("Sentiment-Price Alignment audit smoke", py_script("smoke_sentiment_price_alignment_audit.py")),
        ("Sentiment-Price Alignment hover smoke", py_script("smoke_sentiment_price_alignment_hover.py")),
        ("Public chart glossary smoke", py_script("smoke_public_chart_glossary.py")),
        ("Public dashboard intro copy smoke", py_script("smoke_public_dashboard_intro_copy.py")),
        ("Market Tape attention/structure card smoke", py_script("smoke_market_tape_attention_structure_cards.py")),
        ("Sentiment layer and structure controls smoke", py_script("smoke_sentiment_layer_structure_controls.py")),
        ("View mode density smoke", py_script("smoke_view_mode_density.py")),
        ("Sentiment MA 21 Decision Pressure hover smoke", py_script("smoke_sentiment_ma21_hover_dp_value.py")),
        ("Sentiment MA 21 overlay smoke", py_script("smoke_sentiment_ma21_overlay.py")),
        ("Sentiment MA 21 controls smoke", py_script("smoke_sentiment_ma21_controls.py")),
        ("Price pane Structure strip smoke", py_script("smoke_price_pane_structure_strip.py")),
        ("Structure strip score alignment smoke", py_script("smoke_structure_strip_score_alignment.py")),
    ]

    if not args.skip_full_dashboard_smoke:
        steps.append(("Fix26 full dashboard smoke", py_script("smoke_fix26_dashboard.py")))

    return steps

def main() -> int:
    parser = argparse.ArgumentParser(description="Run the SETA public dashboard post-refresh QA bundle.")
    parser.add_argument("--write-alignment-latest", action="store_true")
    parser.add_argument("--alignment-asset")
    parser.add_argument("--skip-full-dashboard-smoke", action="store_true")
    args = parser.parse_args()

    print("SETA Public Dashboard QA bundle")
    print(f"utc={datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    print(f"repo={ROOT}")
    print(f"full_dashboard_smoke={'no' if args.skip_full_dashboard_smoke else 'yes'}")

    for label, command in build_steps(args):
        rc = run_step(label, command)
        if rc != 0:
            print("=" * 120)
            print(f"[FAIL] Public dashboard QA stopped at: {label}")
            return rc

    print("=" * 120)
    print("[OK] Public dashboard QA bundle passed")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
