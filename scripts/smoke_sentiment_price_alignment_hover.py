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
    "function sentimentPriceAlignmentLabel(row = {}, scaledSentimentValue = null)",
    "Alignment: %{customdata[6]}",
    "Sentiment premium",
    "Price premium",
    "Mild sentiment premium",
    "Mild price premium",
    "const scaledSentiment = asNumber(series.y?.[index]);",
    "sentimentPriceAlignmentLabel(row, scaledSentiment)",
]:
    if token not in renderer_text:
        fail(f"PlotlyRenderer missing Sentiment-Price Alignment token: {token}")
ok("PlotlyRenderer includes Sentiment-Price Alignment hover taxonomy")

if "module_sentiment_price_alignment_hover_001" not in html_text:
    fail("public embed missing Sentiment-Price Alignment cache token")
ok("public embed cache token updated")

if "PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001" not in main_text:
    fail("dashboard_main.js missing Sentiment-Price Alignment PlotlyRenderer cache token")
ok("dashboard_main cache-busts PlotlyRenderer import")
