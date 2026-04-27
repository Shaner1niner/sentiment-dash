#!/usr/bin/env python
from __future__ import annotations
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DRAFT = ROOT / "scripts" / "draft_seta_social_reply.py"

BAD_FRAGMENTS = ["80.212946", "76.529264", "Summary 4.0", "Macd ", "Rsi ", "  "]


def run(platform: str, comment: str):
    out = subprocess.check_output(
        [sys.executable, str(DRAFT), "--platform", platform, "--comment", comment],
        cwd=str(ROOT),
        text=True,
        encoding="utf-8",
    )
    return json.loads(out)


def assert_ok(cond: bool, msg: str):
    if not cond:
        raise SystemExit(f"[FAIL] {msg}")
    print(f"[OK] {msg}")


def main():
    print("=" * 60)
    print("SETA reply formatting v3 smoke test")
    print("=" * 60)
    btc = run("x", "Why is $BTC ranked so high today?")
    eth = run("reddit", "Is $ETH financial advice or a buy signal?")

    assert_ok(btc["detected_term"] == "BTC", "BTC detected")
    assert_ok(btc["should_reply"] is True, "BTC should reply")
    assert_ok("not one isolated signal" in btc["draft_reply"], "BTC reply uses cleaner driver-stack framing")
    assert_ok("MACD" in btc["draft_reply"] or "RSI" in btc["draft_reply"], "BTC reply includes clean family names")
    assert_ok(all(fragment not in btc["draft_reply"] for fragment in BAD_FRAGMENTS), "BTC reply avoids raw machine formatting")

    assert_ok(eth["reply_type"] == "financial_advice_boundary", "ETH advice boundary detected")
    assert_ok("not financial advice" in eth["draft_reply"].lower(), "ETH reply includes advice boundary")
    assert_ok(all(fragment not in eth["draft_reply"] for fragment in BAD_FRAGMENTS), "ETH reply avoids raw machine formatting")
    assert_ok(eth["requires_human_review"] is True, "human review remains required")

    print("=" * 60)
    print("PASSED")


if __name__ == "__main__":
    main()
