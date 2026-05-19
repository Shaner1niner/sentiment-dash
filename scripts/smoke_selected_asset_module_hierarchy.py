from pathlib import Path

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

html_path = Path("interactive_dashboard_fix24_public_embed.html")
market_tape_path = Path("src/features/MarketTape.js")

if not html_path.exists():
    fail("missing interactive_dashboard_fix24_public_embed.html")
if not market_tape_path.exists():
    fail("missing src/features/MarketTape.js")

html = html_path.read_text(encoding="utf-8")
market_tape = market_tape_path.read_text(encoding="utf-8")

for token in [
    ".moduleMarketTapeDetailPanel",
    ".moduleMarketTapeSelectedDetail",
    "box-shadow: inset 0 1px 0 rgba(255,255,255,.03);",
    ".moduleMarketTapeDetailItem:nth-child(-n+4)",
    ".moduleMarketTapeDetailItem:nth-child(n+5)",
    ".moduleMarketTapeTechnicalDetail summary",
]:
    if token not in html:
        fail(f"public embed missing selected-asset hierarchy token: {token}")
ok("public embed includes selected-asset hierarchy styling")

for token in [
    "const detailDeck = renderMarketTapeDetailDeck(row);",
    "const structureTrend = renderStructureTrend(row);",
    "const eventTimeline = renderMarketTapeEventTimeline(row);",
    "${structureTrend}",
    "${eventTimeline}",
    "${detailDeck}",
]:
    if token not in market_tape:
        fail(f"MarketTape selected detail render path missing token: {token}")
ok("MarketTape selected detail render stack remains intact")

if "src/dashboard_main.js?v=module_" not in html:
    fail("public embed module cache token was not updated")
ok("public embed cache token updated")
