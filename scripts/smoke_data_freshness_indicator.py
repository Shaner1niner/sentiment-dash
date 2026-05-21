from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
feature = ROOT / "src" / "features" / "DataFreshnessIndicator.js"
entry = ROOT / "src" / "dashboard_main.js"


def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")


def ok(message: str) -> None:
    print(f"[OK] {message}")


if not feature.exists():
    fail("missing src/features/DataFreshnessIndicator.js")
if not entry.exists():
    fail("missing src/dashboard_main.js")

feature_text = feature.read_text(encoding="utf-8")
entry_text = entry.read_text(encoding="utf-8")

required_feature_tokens = [
    "export function classifyDataFreshness",
    "function freshnessTooltip",
    "tooltip: freshnessTooltip(status)",
    "title=\"${escapeHtml(status.tooltip || status.detail)}\"",
    "export const DataFreshnessIndicator",
    "module-data-freshness-indicator",
    "moduleDataFreshnessPill",
    "reviewed",
    "refreshed today",
    "source warning",
    "stale",
    "freshness unknown",
    "Dashboard payload loaded, but no dated rows were available",
    "Latest visible data date",
    "Fresh means the selected dashboard payload contains recent visible data",
    "Freshness is a data-quality cue, not a price forecast or trade instruction",
    "SETA explains market emotion and setup quality, not trade instructions",
]

for token in required_feature_tokens:
    if token not in feature_text:
        fail(f"DataFreshnessIndicator missing token: {token}")

for token in ["run_registry.jsonl", "exit_code", "blocking_count", "stack trace", "DB profile"]:
    if token in feature_text:
        fail(f"backend jargon leaked into public indicator copy: {token}")

for token in ["buy", "sell", "trade now", "price target", "guaranteed"]:
    if token in feature_text.lower():
        fail(f"trade-instruction language leaked into public freshness copy: {token}")

required_entry_tokens = [
    "DataFreshnessIndicator",
    "DataFreshnessIndicator.init()",
    "module_data_freshness_indicator_001",
]

for token in required_entry_tokens:
    if token not in entry_text:
        fail(f"dashboard_main missing data freshness wiring token: {token}")

ok("data freshness indicator feature and dashboard wiring are present")
ok("freshness tooltip explains data quality without backend jargon")
ok("freshness copy avoids trade-instruction language")
