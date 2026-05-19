from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
store = ROOT / "src" / "Store.js"
html = ROOT / "interactive_dashboard_fix24_public_embed.html"
main = ROOT / "src" / "dashboard_main.js"

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

store_text = store.read_text(encoding="utf-8")
html_text = html.read_text(encoding="utf-8")
main_text = main.read_text(encoding="utf-8")

if "currentRibbon: 'sentiment_ma_21'" not in store_text:
    fail("Store does not default MA Stack to sentiment_ma_21")
ok("Store defaults MA Stack to Sentiment MA 21")

for token in [
    'value="none">None',
    'value="sentiment_ma_21" selected>Sentiment MA 21',
    'value="price_ma_21">Price MA 21',
    'value="sentiment_ribbon">Sentiment Ribbon',
    'value="price_ribbon">Price Ribbon',
    'value="combined_ma">Combined MA',
    'value="combined_ribbon">Combined Ribbon',
]:
    if token not in html_text:
        fail(f"public embed missing MA Stack token: {token}")
ok("public embed exposes expanded MA Stack menu")

if "PlotlyRenderer.js?v=module_" not in main_text:
    fail("dashboard_main.js missing active PlotlyRenderer module cache token")
ok("dashboard_main cache-busts PlotlyRenderer import")
