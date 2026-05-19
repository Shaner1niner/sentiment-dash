from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "MarketTapeAttentionStructureCards.js"
entry = ROOT / "src" / "dashboard_main.js"
public_embed = ROOT / "interactive_dashboard_fix24_public_embed.html"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [module, entry, public_embed]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

module_text = module.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")
embed_text = public_embed.read_text(encoding="utf-8")

for token in [
    "module_market_tape_attention_structure_cards_001",
    "Ranked by attention. Scored by structure.",
    "#${rank} by Attention",
    "Structure</span>",
    "Store.state.structureScoreHistory",
    "structureScoreForTicker",
    "latestStructurePoint",
    "requestAnimationFrame",
    "MutationObserver",
]:
    if token not in module_text:
        fail(f"attention/structure card module missing token: {token}")
ok("Market Tape attention/structure card module contains expected reader framing")

for removed_token in [
    "Why surfaced:",
    "attention is elevated, but confirmation is still incomplete.",
    "function whySurfaced",
]:
    if removed_token in module_text:
        fail(f"attention/structure card module still contains repetitive card copy: {removed_token}")
ok("Market Tape cards omit repetitive why-surfaced microcopy")

if "MarketTapeAttentionStructureCards.js?v=module_market_tape_attention_structure_cards_001" not in entry_text:
    fail("dashboard module entrypoint does not load MarketTapeAttentionStructureCards")
ok("dashboard module entrypoint loads attention/structure card patch")

for token in [
    "module-market-tape",
    "src/dashboard_main.js",
]:
    if token not in embed_text:
        fail(f"public embed missing token: {token}")
ok("public module route exposes Market Tape and module entrypoint")
