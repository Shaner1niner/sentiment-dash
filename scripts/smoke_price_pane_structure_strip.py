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
    "MODULE_STRUCTURE_STRIP_FIELDS",
    "function buildStructureScoreStripShapes(rows = [], priceDomain = [0, 1])",
    "structureScoreStripQuality",
    "structureScoreStripColor",
    "...structureScoreStripShapes",
    "text: 'structure'",
    "stressed: 'rgba(255,123,114,0.34)'",
    "strong: 'rgba(126,231,135,0.36)'",
    "Structure Score: %{customdata[0]}",
    "function buildStructureScoreStripHoverTrace(rows = [])",
    "structureScoreStripHoverY",
    "structureScoreStripLabel",
]:
    if token not in renderer_text:
        fail(f"renderer missing token: {token}")
ok("renderer includes Structure Score strip path")

for retired in [
    "MODULE_SENTIMENT_PRESSURE_FIELDS",
    "buildSentimentPressureRailTraces",
    "Sentiment Pressure rail",
    "zero: min + spread * 0.30",
]:
    if retired in renderer_text:
        fail(f"retired Sentiment Pressure overlay token still present: {retired}")
ok("retired Sentiment Pressure price-pane overlay removed")

main_text = main.read_text(encoding="utf-8")
if "PlotlyRenderer.js?v=module_price_structure_strip_hover_001" not in main_text:
    fail("dashboard_main.js missing Structure Score strip cache token")
ok("dashboard_main.js cache-busts PlotlyRenderer import")

html_text = html.read_text(encoding="utf-8")
if "module_price_structure_strip_hover_001" not in html_text:
    fail("public embed missing Structure Score strip cache token")
ok("public embed includes Structure Score strip cache token")

data = json.loads(payload.read_text(encoding="utf-8"))
rows = data.get("D", {}).get("BTC", [])
if not rows:
    fail("BTC payload has no daily rows")

fields = [
    "seta_dashboard_summary_score",
    "seta_score",
    "dashboard_score",
    "structure_score",
    "signal_structure_score",
    "screener_attention_priority_score",
]

count = sum(1 for row in rows if any(row.get(field) is not None for field in fields))
if count < 5:
    fail(f"BTC payload has too few Structure Score strip values: {count}")
ok(f"BTC payload has {count} Structure Score strip values")
