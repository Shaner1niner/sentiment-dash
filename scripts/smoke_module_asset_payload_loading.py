#!/usr/bin/env python
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "src" / "Store.js"
LOADER = ROOT / "src" / "AssetPayloadLoader.js"
MAIN = ROOT / "src" / "dashboard_main.js"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def main() -> int:
    for path in [STORE, LOADER, MAIN]:
        if not path.exists():
            return fail(f"missing {path.relative_to(ROOT)}")

    store = read(STORE)
    loader = read(LOADER)
    main = read(MAIN)

    store_tokens = [
        "currentAssetPayload: null",
        "assetPayloadMeta: null",
        "setCurrentAssetPayload(payload, meta = {})",
        "this.emit('assetPayloadUpdated'",
        "this.emit('assetPayloadLoading'",
        "this.emit('assetPayloadError'",
    ]
    missing_store = [token for token in store_tokens if token not in store]
    if missing_store:
        return fail(f"Store.js missing token(s): {missing_store}")

    loader_tokens = [
        "export const AssetPayloadLoader",
        "fix26_chart_store_assets/${safeMode}/${asset}.json",
        "cacheKey(assetTicker",
        "hasCachedAsset(assetTicker",
        "getCachedAsset(assetTicker",
        "async loadAsset(assetTicker = Store.state.currentAsset",
        "Store.setCurrentAssetPayload(payload",
        "Store.emit('assetPayloadLoading'",
        "Store.emit('assetPayloadError'",
    ]
    missing_loader = [token for token in loader_tokens if token not in loader]
    if missing_loader:
        return fail(f"AssetPayloadLoader.js missing token(s): {missing_loader}")

    main_tokens = [
        "import { AssetPayloadLoader } from './AssetPayloadLoader.js';",
        "AssetPayloadLoader.loadAsset(ticker)",
        "loadAndRenderAsset(Store.state.currentAsset, targetId)",
        "document.getElementById('chart')",
    ]
    missing_main = [token for token in main_tokens if token not in main]
    if missing_main:
        return fail(f"dashboard_main.js missing token(s): {missing_main}")

    if "fetch(`./fix26_chart_store_assets/member/${ticker}.json`)" in main:
        return fail("dashboard_main.js still fetches payloads directly")

    print("[OK] AssetPayloadLoader module exists")
    print("[OK] Store tracks current asset payload metadata")
    print("[OK] dashboard_main routes asset payload loading through AssetPayloadLoader")
    print("[OK] module asset payload loading smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
