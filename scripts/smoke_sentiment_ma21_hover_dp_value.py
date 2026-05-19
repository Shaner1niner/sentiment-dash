from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
renderer = ROOT / "src" / "PlotlyRenderer.js"
html = ROOT / "interactive_dashboard_fix24_public_embed.html"
main = ROOT / "src" / "dashboard_main.js"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

renderer_text = renderer.read_text(encoding="utf-8")
html_text = html.read_text(encoding="utf-8")
main_text = main.read_text(encoding="utf-8")

for token in [
    "function decisionPressureDisplayValue(row = {})",
    "Decision Pressure: %{customdata[2]}",
    "decisionPressureLabel(row)",
    "decisionPressureSkew(row)",
    "decisionPressureSource(row)",
    "decisionPressureGate(row)",
    "legendgroup: 'sentiment-ma-21'",
    "showlegend: false",
]:
    if token not in renderer_text:
        fail(f"PlotlyRenderer missing hover DP value token: {token}")
ok("PlotlyRenderer includes DP score hover and hides Sentiment MA 21 legend entry")

for token in [
    "module_sentiment_price_alignment_hover_001",
    "value=\"sentiment_ma_21\" selected>Sentiment MA 21",
]:
    if token not in html_text:
        fail(f"public embed missing token: {token}")
ok("public embed cache token and MA Stack menu are intact")

if "PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001" not in main_text:
    fail("dashboard_main.js missing PlotlyRenderer hover DP value cache token")
ok("dashboard_main cache-busts PlotlyRenderer import")
