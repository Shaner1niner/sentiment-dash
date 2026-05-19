from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
audit = ROOT / "scripts" / "audit_sentiment_price_alignment.py"
renderer = ROOT / "src" / "PlotlyRenderer.js"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

if not audit.exists():
    fail("missing scripts/audit_sentiment_price_alignment.py")

audit_text = audit.read_text(encoding="utf-8")
renderer_text = renderer.read_text(encoding="utf-8")

for token in [
    "Sentiment-Price Alignment audit",
    "classify_alignment",
    "Sentiment premium",
    "Price premium",
    "Mild sentiment premium",
    "Mild price premium",
    "Aligned",
    "scaled_combined_compound_ma_21",
]:
    if token not in audit_text:
        fail(f"audit helper missing token: {token}")
ok("audit helper contains alignment taxonomy")

for token in [
    "function sentimentPriceAlignmentLabel(row = {}, scaledSentimentValue = null)",
    "Alignment: %{customdata[6]}",
]:
    if token not in renderer_text:
        fail(f"renderer missing alignment hover token: {token}")
ok("renderer still exposes Sentiment-Price Alignment hover")

result = subprocess.run(
    [sys.executable, str(audit), "--min-points", "20"],
    cwd=ROOT,
    text=True,
    capture_output=True,
)

print(result.stdout, end="")
if result.returncode != 0:
    print(result.stderr, end="")
    fail("alignment audit command failed")

ok("alignment audit command passed")
