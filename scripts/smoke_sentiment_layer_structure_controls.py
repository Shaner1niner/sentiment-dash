from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
patch = ROOT / "src" / "features" / "SentimentLayerStructureControlPatch.js"
entry = ROOT / "src" / "dashboard_main.js"
intro = ROOT / "src" / "features" / "PublicDashboardIntroCopy.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [patch, entry, intro]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

patch_text = patch.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")
intro_text = intro.read_text(encoding="utf-8")

for token in [
    "module_sentiment_layer_structure_controls_001",
    "sentimentLayerEnabled",
    "structureStripEnabled",
    "currentTimingView",
    "currentRegimeLayer",
    "isSentimentTrace",
    "isStructureStripTrace",
    "isStructureStripShape",
    "PlotlyRenderer.buildPriceTraces",
    "PlotlyRenderer.buildLayout",
]:
    if token not in patch_text:
        fail(f"layer control patch missing token: {token}")
ok("layer control patch guards sentiment traces and structure strip rendering")

if "SentimentLayerStructureControlPatch.js?v=module_sentiment_layer_structure_controls_001" not in entry_text:
    fail("dashboard entrypoint does not load layer control patch")
ok("dashboard entrypoint loads layer control patch before rendering")

for token in [
    "Structure strip",
    "Sentiment layer",
]:
    if token not in intro_text:
        fail(f"public copy labels missing token: {token}")
ok("public control labels match actual layer semantics")
