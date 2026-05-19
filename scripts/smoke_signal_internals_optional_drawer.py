from pathlib import Path

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def ok(message: str) -> None:
    print(f"[OK] {message}")

html_path = Path("interactive_dashboard_fix24_public_embed.html")
market_tape_path = Path("src/features/MarketTape.js")

html = html_path.read_text(encoding="utf-8")
market_tape = market_tape_path.read_text(encoding="utf-8")

for token in [
    ".moduleMarketTapeDetailDeck:not([open]) .moduleMarketTapeDeckGrid",
    'content: "Show";',
    'content: "Hide";',
    ".moduleMarketTapeDetailDeck[open] .moduleMarketTapeDeckHeader::after",
]:
    if token not in html:
        fail(f"public embed missing optional drawer styling token: {token}")
ok("public embed includes optional Signal Internals drawer styling")

details_token = '<details class="moduleMarketTapeDetailDeck moduleMarketTapeTechnicalDetail" aria-label="Signal internals">'
if details_token not in market_tape:
    fail("Signal Internals details element missing or changed")
if '<details class="moduleMarketTapeDetailDeck moduleMarketTapeTechnicalDetail" open' in market_tape:
    fail("Signal Internals should not be forced open by default")
ok("Signal Internals remains a collapsed-by-default details drawer")

if "src/dashboard_main.js?v=module_" not in html:
    fail("public embed missing active module dashboard cache token")
ok("public embed keeps active module dashboard cache token")
