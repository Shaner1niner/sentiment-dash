from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
html = ROOT / "interactive_dashboard_fix24_public_embed.html"
doc = ROOT / "docs" / "public_chart_glossary.md"
qa_runner = ROOT / "scripts" / "run_public_dashboard_qa.py"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

for path in [html, doc, qa_runner]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

html_text = html.read_text(encoding="utf-8")
doc_text = doc.read_text(encoding="utf-8")
qa_text = qa_runner.read_text(encoding="utf-8")

for token in [
    'id="module-chart-guide"',
    "How to read this chart",
    "Structure strip",
    "Sentiment MA 21",
    "Alignment",
    "Decision Pressure",
    "not a standalone trade signal",
    ".moduleChartGuide",
]:
    if token not in html_text:
        fail(f"public embed missing chart glossary token: {token}")
ok("public embed includes collapsed chart glossary")

for token in [
    "SETA Public Chart Glossary",
    "Structure strip",
    "Sentiment MA 21",
    "Sentiment premium",
    "Price premium",
    "Decision Pressure",
    "not model logic",
    "Avoid direct price predictions or trade instructions",
]:
    if token not in doc_text:
        fail(f"glossary doc missing token: {token}")
ok("chart glossary doc is present")

if "smoke_public_chart_glossary.py" not in qa_text:
    fail("public dashboard QA bundle does not include chart glossary smoke")
ok("public dashboard QA bundle includes chart glossary smoke")
