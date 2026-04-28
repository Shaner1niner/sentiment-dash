#!/usr/bin/env python
# Smoke test for SETA Daily Context v1.
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build_seta_daily_context.py"
OUT = ROOT / "reply_agent" / "daily_context" / "_smoke"


def ok(msg: str) -> None:
    print(f"[OK] {msg}")


def fail(msg: str) -> None:
    print(f"[ERROR] {msg}")
    raise SystemExit(1)


def main() -> int:
    print("=" * 72)
    print("SETA daily context smoke test")
    print("=" * 72)
    if not BUILDER.exists():
        fail(f"missing builder: {BUILDER}")
    ok("found daily context builder")
    cmd = [sys.executable, str(BUILDER), "--out-dir", str(OUT)]
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    print(proc.stdout)
    if proc.returncode != 0:
        print(proc.stderr)
        fail("builder failed")
    latest = OUT / "seta_daily_context_latest.json"
    if not latest.exists():
        fail("latest context output missing")
    ok("latest daily context exists")
    data = json.loads(latest.read_text(encoding="utf-8"))
    universes = data.get("universes", {})
    by_term = data.get("by_term", {})
    if not universes:
        fail("no universes found in daily context")
    ok(f"universes: {sorted(universes.keys())}")
    if not by_term:
        fail("no by_term context found")
    ok(f"by_term count={len(by_term)}")
    sample_terms = [t for t in ("BTC", "ETH", "SOL", "AAPL", "MSTR", "NVDA") if t in by_term]
    if not sample_terms:
        fail("no expected sample terms found")
    ok(f"sample terms: {sample_terms}")
    for term in sample_terms[:3]:
        row = by_term[term]
        if not row.get("universe"):
            fail(f"{term} missing universe")
        useful = any(row.get(k) is not None for k in ("asset_state", "analyst_take", "decision_pressure", "structural_state"))
        if not useful:
            fail(f"{term} has no useful daily context fields")
        ok(f"{term} has usable daily context")
    print("=" * 72)
    print("PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
