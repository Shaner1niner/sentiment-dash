from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
runner = ROOT / "scripts" / "run_public_dashboard_qa.py"
gitignore = ROOT / ".gitignore"
runbook = ROOT / "docs" / "public_dashboard_qa.md"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

for path in [runner, gitignore, runbook]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

runner_text = runner.read_text(encoding="utf-8")
gitignore_text = gitignore.read_text(encoding="utf-8")
runbook_text = runbook.read_text(encoding="utf-8")

for token in [
    "SETA Public Dashboard QA bundle",
    "run_sentiment_price_alignment_soak.py",
    "smoke_sentiment_price_alignment_hover.py",
    "smoke_public_chart_glossary.py",
    "smoke_market_tape_attention_structure_cards.py",
    "smoke_sentiment_ma21_hover_dp_value.py",
    "smoke_price_pane_structure_strip.py",
    "smoke_structure_strip_score_alignment.py",
    "smoke_fix26_dashboard.py",
]:
    if token not in runner_text:
        fail(f"QA runner missing token: {token}")
ok("QA runner includes expected checks")

if "qa_outputs/sentiment_price_alignment_audit_*.txt" not in gitignore_text:
    fail(".gitignore missing optional QA output rule")
ok(".gitignore ignores optional QA snapshots")

if "Public Dashboard QA" not in runbook_text:
    fail("runbook missing title")
ok("runbook exists")

result = subprocess.run([sys.executable, str(runner), "--help"], cwd=ROOT, text=True, capture_output=True)
if result.returncode != 0:
    fail("QA runner --help failed")

ok("QA runner CLI help is available")
