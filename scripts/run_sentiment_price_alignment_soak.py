from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT_SCRIPT = ROOT / "scripts" / "audit_sentiment_price_alignment.py"
DEFAULT_OUTPUT_DIR = ROOT / "qa_outputs"


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")


def build_command(asset: str | None, min_points: int) -> list[str]:
    command = [
        sys.executable,
        str(AUDIT_SCRIPT),
        "--min-points",
        str(min_points),
    ]

    if asset:
        command.extend(["--asset", asset.upper()])

    return command


def write_report(output_dir: Path, text: str, *, latest: bool, timestamped: bool) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    if latest:
        latest_path = output_dir / "sentiment_price_alignment_audit_latest.txt"
        latest_path.write_text(text, encoding="utf-8", newline="")
        print(f"[OK] wrote {latest_path.relative_to(ROOT)}")

    if timestamped:
        stamped_path = output_dir / f"sentiment_price_alignment_audit_{utc_stamp()}.txt"
        stamped_path.write_text(text, encoding="utf-8", newline="")
        print(f"[OK] wrote {stamped_path.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Run the Sentiment-Price Alignment soak audit after dashboard refreshes."
    )
    parser.add_argument("--asset", help="Optional single asset symbol, e.g. BTC")
    parser.add_argument("--min-points", type=int, default=20)
    parser.add_argument(
        "--write-latest",
        action="store_true",
        help="Write qa_outputs/sentiment_price_alignment_audit_latest.txt",
    )
    parser.add_argument(
        "--write-timestamped",
        action="store_true",
        help="Write a timestamped qa_outputs/sentiment_price_alignment_audit_*.txt file",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Output directory for optional QA reports",
    )
    args = parser.parse_args()

    if not AUDIT_SCRIPT.exists():
        print(f"[FAIL] missing audit script: {AUDIT_SCRIPT}")
        return 1

    command = build_command(args.asset, args.min_points)

    result = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        capture_output=True,
    )

    header = "\n".join(
        [
            "SETA Sentiment-Price Alignment soak audit",
            f"utc={datetime.now(timezone.utc).isoformat(timespec='seconds')}",
            f"command={' '.join(command)}",
            "-" * 120,
            "",
        ]
    )

    report = header + result.stdout
    if result.stderr:
        report += "\n[stderr]\n" + result.stderr

    print(report, end="" if report.endswith("\n") else "\n")

    if args.write_latest or args.write_timestamped:
        write_report(
            Path(args.output_dir),
            report,
            latest=args.write_latest,
            timestamped=args.write_timestamped,
        )

    if result.returncode != 0:
        print("[FAIL] Sentiment-Price Alignment soak audit failed")
        return result.returncode

    print("[OK] Sentiment-Price Alignment soak audit completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
