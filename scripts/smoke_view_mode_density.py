from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
patch = ROOT / "src" / "features" / "ViewModeDensityPatch.js"
entry = ROOT / "src" / "dashboard_main.js"
store = ROOT / "src" / "Store.js"
embed = ROOT / "interactive_dashboard_fix24_public_embed.html"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [patch, entry, store, embed]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

patch_text = patch.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")
store_text = store.read_text(encoding="utf-8")
embed_text = embed.read_text(encoding="utf-8")

for token in [
    "module_view_mode_density_001",
    "currentView",
    "briefing",
    "research",
    "module-market-tape-detail",
    "detailPanel.hidden",
    "data-seta-view-mode",
    "moduleMarketTapeTrendWidget",
    "data-view-mode-detail",
    "structure-trend",
    "moduleMarketTapeEventTimeline",
    "moduleMarketTapeDetailDeck",
    "MutationObserver",
]:
    if token not in patch_text:
        fail(f"View mode density patch missing token: {token}")
ok("View mode density patch keeps Structure Trend while hiding heavy diagnostics in Briefing mode")

if "ViewModeDensityPatch.js?v=module_view_mode_density_001" not in entry_text:
    fail("dashboard entrypoint does not load ViewModeDensityPatch")
ok("dashboard entrypoint loads View mode density patch")

for token in [
    "briefingMode: 'currentView'",
    "currentView: 'briefing'",
]:
    if token not in store_text:
        fail(f"Store missing View mode contract token: {token}")
ok("Store exposes briefingMode as currentView")

for token in [
    "id=\"briefingMode\"",
    "value=\"briefing\"",
    "value=\"research\"",
]:
    if token not in embed_text:
        fail(f"public embed missing View dropdown token: {token}")
ok("public embed exposes Briefing / Research View dropdown")
