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
    "run_registry.jsonl",
    "exit_code",
    "blocking_count",
]

for token in required_feature_tokens:
    if token in {"run_registry.jsonl", "exit_code", "blocking_count"}:
        if token in feature_text:
            fail(f"backend jargon leaked into public indicator copy: {token}")
        continue
    if token not in feature_text:
        fail(f"DataFreshnessIndicator missing token: {token}")

required_entry_tokens = [
    "DataFreshnessIndicator",
    "DataFreshnessIndicator.init()",
    "module_data_freshness_indicator_001",
]

for token in required_entry_tokens:
    if token not in entry_text:
        fail(f"dashboard_main missing data freshness wiring token: {token}")

ok("data freshness indicator feature and dashboard wiring are present")
ok("public indicator copy avoids backend run-registry jargon")
