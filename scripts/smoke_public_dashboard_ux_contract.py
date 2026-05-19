from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
contract = ROOT / "docs" / "public_dashboard_ux_contract.md"
intro = ROOT / "src" / "features" / "PublicDashboardIntroCopy.js"
radar = ROOT / "src" / "features" / "MarketTapeAttentionStructureCards.js"
view_mode = ROOT / "src" / "features" / "ViewModeDensityPatch.js"
layer_controls = ROOT / "src" / "features" / "SentimentLayerStructureControlPatch.js"
briefing = ROOT / "src" / "features" / "BriefingPanel.js"
entry = ROOT / "src" / "dashboard_main.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [contract, intro, radar, view_mode, layer_controls, briefing, entry]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

contract_text = contract.read_text(encoding="utf-8")
intro_text = intro.read_text(encoding="utf-8")
radar_text = radar.read_text(encoding="utf-8")
view_text = view_mode.read_text(encoding="utf-8")
layer_text = layer_controls.read_text(encoding="utf-8")
briefing_text = briefing.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")

for token in [
    "SETA Public Dashboard UX Contract",
    "market emotion, setup quality, and participation context",
    "Briefing: clean reader mode",
    "Research: expanded diagnostic mode",
    "Market Radar cards are ranked by attention but scored by structure",
    "compact Signal State",
    "Structure Trend sparkline",
    "Structure stack: Mixed",
    "does not provide price targets or trade instructions",
]:
    if token not in contract_text:
        fail(f"UX contract missing token: {token}")
ok("UX contract documents current product behavior")

for token in [
    "Read attention, sentiment, structure, and confirmation context in one view.",
    "not price targets or trade instructions",
    "Structure strip",
    "Sentiment layer",
    "Attention layer",
    "Range bands",
    "Trend lens",
]:
    if token not in intro_text:
        fail(f"public intro/control copy missing token: {token}")
ok("public intro and controls remain reader-native")

for token in [
    "Ranked by attention. Scored by structure.",
    "#${rank} by Attention",
    "Structure</span>",
]:
    if token not in radar_text:
        fail(f"Market Radar contract missing token: {token}")

for removed_token in ["Why surfaced:", "function whySurfaced"]:
    if removed_token in radar_text:
        fail(f"Market Radar should not reintroduce repetitive per-card copy: {removed_token}")
ok("Market Radar attention/structure hierarchy is protected")

for token in [
    "SentimentLayerStructureControlPatch.js?v=module_sentiment_layer_structure_controls_001",
    "ViewModeDensityPatch.js?v=module_view_mode_density_001",
]:
    if token not in entry_text:
        fail(f"dashboard entry missing module import: {token}")
ok("dashboard loads layer-control and view-mode patches")

for token in [
    "sentimentLayerEnabled",
    "structureStripEnabled",
    "PlotlyRenderer.buildPriceTraces",
    "PlotlyRenderer.buildLayout",
]:
    if token not in layer_text:
        fail(f"layer control patch missing token: {token}")
ok("Sentiment layer and Structure strip behavior is protected")

for token in [
    "moduleMarketTapeBriefingSignalState",
    "Signal State",
    "moduleMarketTapeTrendPrimaryReadout",
    "Structure stack:",
    "moduleMarketTapeTrendStackLabel",
    "moduleMarketTapeEventTimeline",
    "moduleMarketTapeDetailDeck",
    "structure-trend-signal-state",
]:
    if token not in view_text:
        fail(f"View mode density contract missing token: {token}")
ok("Briefing/Research density contract is protected")

for token in [
    "BRIEFING_VISIBLE_EVIDENCE_ITEMS = 3",
    "RESEARCH_VISIBLE_EVIDENCE_ITEMS = 6",
    "Research mode / source briefing",
    "data-view-mode",
]:
    if token not in briefing_text:
        fail(f"Briefing evidence density contract missing token: {token}")
ok("Briefing evidence density remains view-aware")
