from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
runner = ROOT / "scripts" / "run_sentiment_price_alignment_soak.py"
audit = ROOT / "scripts" / "audit_sentiment_price_alignment.py"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

if not runner.exists():
    fail("missing scripts/run_sentiment_price_alignment_soak.py")
if not audit.exists():
    fail("missing scripts/audit_sentiment_price_alignment.py")

runner_text = runner.read_text(encoding="utf-8")

for token in [
    "SETA Sentiment-Price Alignment soak audit",
    "audit_sentiment_price_alignment.py",
    "--write-latest",
    "--write-timestamped",
    "sentiment_price_alignment_audit_latest.txt",
    "Sentiment-Price Alignment soak audit completed",
]:
    if token not in runner_text:
        fail(f"soak runner missing token: {token}")
ok("soak runner contains expected CLI/reporting tokens")

result = subprocess.run(
    [sys.executable, str(runner), "--min-points", "20"],
    cwd=ROOT,
    text=True,
    capture_output=True,
)

print(result.stdout, end="")
if result.returncode != 0:
    print(result.stderr, end="")
    fail("soak runner command failed")

for token in [
    "Sentiment-Price Alignment audit",
    "[OK] Sentiment-Price Alignment audit passed",
    "[OK] Sentiment-Price Alignment soak audit completed",
]:
    if token not in result.stdout:
        fail(f"soak runner output missing token: {token}")

ok("soak runner command passed")
