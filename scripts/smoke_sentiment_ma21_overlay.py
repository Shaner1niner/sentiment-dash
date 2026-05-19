from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
renderer = ROOT / "src" / "PlotlyRenderer.js"
store = ROOT / "src" / "Store.js"
html = ROOT / "interactive_dashboard_fix24_public_embed.html"
main = ROOT / "src" / "dashboard_main.js"
btc = ROOT / "fix26_chart_store_assets" / "public" / "BTC.json"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

renderer_text = renderer.read_text(encoding="utf-8")
store_text = store.read_text(encoding="utf-8")
html_text = html.read_text(encoding="utf-8")
main_text = main.read_text(encoding="utf-8")

if "currentRibbon: 'sentiment_ma_21'" not in store_text:
    fail("Store does not default MA Stack to sentiment_ma_21")
ok("Store defaults MA Stack to Sentiment MA 21")

for token in [
    'value="sentiment_ma_21" selected>Sentiment MA 21',
    'value="price_ma_21">Price MA 21',
    'value="sentiment_ribbon">Sentiment Ribbon',
    'value="price_ribbon">Price Ribbon',
    'value="combined_ma">Combined MA',
    'value="combined_ribbon">Combined Ribbon',
    "module_sentiment_price_alignment_hover_001",
]:
    if token not in html_text:
        fail(f"public embed missing MA Stack token: {token}")
ok("public embed exposes expanded MA Stack menu")

for token in [
    "function addSentimentMa21OverlayTrace(traces, x, rows)",
    "MODULE_SENTIMENT_MA21_PRICE_FIELDS",
    "MODULE_SENTIMENT_MA21_RAW_FIELDS",
    "function decisionPressureDisplayValue(row = {})",
    "Decision Pressure: %{customdata[2]}",
    "Skew: %{customdata[3]}",
    "Source: %{customdata[4]}",
    "showlegend: false",
    "function decisionPressureLabel(row = {})",
    "function decisionPressureSkew(row = {})",
    "function decisionPressureSource(row = {})",
    "ribbon === 'sentiment_ma_21'",
    "ribbon === 'combined_ribbon'",
]:
    if token not in renderer_text:
        fail(f"PlotlyRenderer missing Sentiment MA 21 token: {token}")
ok("PlotlyRenderer includes Sentiment MA 21 and Decision Pressure hover path")

if "PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001" not in main_text:
    fail("dashboard_main.js missing PlotlyRenderer cache token")
ok("dashboard_main cache-busts PlotlyRenderer import")

payload = json.loads(btc.read_text(encoding="utf-8"))
rows = payload.get("D", {}).get("BTC", [])
if len(rows) < 30:
    fail("BTC public payload has too few rows")

scaled_count = sum(1 for row in rows if row.get("scaled_combined_compound_ma_21") is not None)
raw_count = sum(1 for row in rows if row.get("combined_compound_ma_21") is not None)
pressure_count = sum(
    1 for row in rows
    if row.get("attention_conviction_score_signed") is not None
    or row.get("attention_level_score") is not None
    or row.get("sent_ribbon_stack_score") is not None
)

if scaled_count < 20:
    fail(f"too few scaled Sentiment MA 21 values: {scaled_count}")
if raw_count < 20:
    fail(f"too few raw Sentiment MA 21 values: {raw_count}")
if pressure_count < 20:
    fail(f"too few Decision Pressure candidate values: {pressure_count}")

ok(f"BTC payload has Sentiment MA 21 values={scaled_count}, raw={raw_count}, pressure candidates={pressure_count}")
