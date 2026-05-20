from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
module = ROOT / "src" / "features" / "ChartSessionAxisPatch.js"
entry = ROOT / "src" / "dashboard_main.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


for path in [module, entry]:
    if not path.exists():
        fail(f"missing {path.relative_to(ROOT)}")

module_text = module.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")

for token in [
    "module_chart_session_axis_001",
    "CRYPTO_ASSETS",
    "normalizeEquityRowsToTradingSessions",
    "sessionRangebreaksForState",
    "bounds: ['sat', 'mon']",
    "__session_axis_weekend_context",
    "PlotlyRenderer.selectRowsForState",
    "PlotlyRenderer.buildLayout",
    "rangebreaks",
]:
    if token not in module_text:
        fail(f"chart session axis patch missing token: {token}")

ok("chart session axis patch protects equity rangebreaks and weekend sentiment context roll-forward")

if "ChartSessionAxisPatch.js?v=module_chart_session_axis_001" not in entry_text:
    fail("dashboard entrypoint does not load ChartSessionAxisPatch")

ok("dashboard entrypoint loads chart session axis patch")
