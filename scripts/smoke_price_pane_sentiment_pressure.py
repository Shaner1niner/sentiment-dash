from pathlib import Path
import json

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

renderer = Path("src/PlotlyRenderer.js")
main = Path("src/dashboard_main.js")
html = Path("interactive_dashboard_fix24_public_embed.html")
payload = Path("fix26_chart_store_assets/public/BTC.json")

for path in [renderer, main, html, payload]:
    if not path.exists():
        fail(f"missing {path}")
    ok(f"found {path}")

renderer_text = renderer.read_text(encoding="utf-8")
for token in [
    "MODULE_SENTIMENT_PRESSURE_FIELDS",
    "attention_conviction_score_signed",
    "function buildSentimentPressureRailTraces(rows = [], x = [])",
    "sentimentPressureRailRange",
    "Sentiment Pressure rail",
    "Sentiment Pressure",
    "buildSentimentPressureRailTraces",
]:
    if token not in renderer_text:
        fail(f"renderer missing token: {token}")
ok("renderer includes Sentiment Pressure rail trace path")

if "zero: min + spread * 0.30" in renderer_text:
    fail("legacy mid-pane Sentiment Pressure projection is still present")
ok("legacy mid-pane Sentiment Pressure projection removed")


main_text = main.read_text(encoding="utf-8")
if "PlotlyRenderer.js?v=module_price_sentiment_pressure_rail_001" not in main_text:
    fail("dashboard_main.js missing PlotlyRenderer cache token")
ok("dashboard_main.js cache-busts PlotlyRenderer import")

html_text = html.read_text(encoding="utf-8")
if "module_price_sentiment_pressure_rail_001" not in html_text:
    fail("public embed missing cache token")
ok("public embed includes Sentiment Pressure cache token")

data = json.loads(payload.read_text(encoding="utf-8"))
rows = data.get("D", {}).get("BTC", [])
if not rows:
    fail("BTC payload has no daily rows")

count = sum(1 for row in rows if row.get("attention_conviction_score_signed") is not None)
if count < 5:
    fail(f"BTC payload has too few attention_conviction_score_signed values: {count}")
ok(f"BTC payload has {count} Sentiment Pressure values")
