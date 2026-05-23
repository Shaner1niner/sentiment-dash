#!/usr/bin/env python
"""
Dashboard Quality Gate v1

Runs the required post-refresh dashboard validation checks:
1. BTC/ETH/SOL oscillator continuity audit
2. Full member oscillator continuity audit
3. Dashboard ops health diagnostics

This script exits non-zero if any required gate fails.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


COMMANDS = [
    [
        sys.executable,
        "scripts/audit_indicator_continuity.py",
        "--terms",
        "BTC,ETH,SOL",
    ],
    [
        sys.executable,
        "scripts/audit_indicator_continuity.py",
    ],
    [
        sys.executable,
        "scripts/report_dashboard_ops_health.py",
        "--diagnostics",
    ],
]


def run_command(cmd: list[str]) -> int:
    print("\n" + "=" * 100)
    print("Running:", " ".join(cmd))
    print("=" * 100)

    result = subprocess.run(cmd, cwd=ROOT)
    if result.returncode != 0:
        print("\n[FAIL] Dashboard quality gate failed:")
        print(" ".join(cmd))
        return result.returncode

    print("\n[PASS]", " ".join(cmd))
    return 0


def main() -> int:
    print("Dashboard Quality Gate v1")
    print("=" * 100)

    for cmd in COMMANDS:
        code = run_command(cmd)
        if code != 0:
            return code

    print("\n" + "=" * 100)
    print("[PASS] Dashboard quality gate complete.")
    print("=" * 100)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
