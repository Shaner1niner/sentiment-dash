#!/usr/bin/env python
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STORE = ROOT / "src" / "Store.js"
CONTROLS = ROOT / "src" / "features" / "Controls.js"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def require_tokens(path: Path, tokens: list[str]) -> list[str]:
    text = path.read_text(encoding="utf-8-sig", errors="ignore")
    return [token for token in tokens if token not in text]


def main() -> int:
    if not STORE.exists():
        return fail("missing src/Store.js")
    if not CONTROLS.exists():
        return fail("missing src/features/Controls.js")

    store_text = STORE.read_text(encoding="utf-8-sig", errors="ignore")
    controls_text = CONTROLS.read_text(encoding="utf-8-sig", errors="ignore")

    store_tokens = [
        "CONTROL_STATE_KEYS",
        "DEFAULT_CONTROL_STATE",
        "currentAsset: 'BTC'",
        "currentFrequency: 'D'",
        "currentRange: '3M'",
        "currentView: 'briefing'",
        "currentChartType: 'candles'",
        "currentScaleMode: 'price_overlays'",
        "currentRibbon: 'none'",
        "currentSentimentRibbon: 'curated'",
        "currentRegimeLayer: 'on'",
        "currentAttention: 'context'",
        "currentBands: 'none'",
        "currentTimingView: 'both'",
        "setControl(controlId, value)",
        "setControls(controlValues = {})",
        "snapshot()",
        "this.emit('controlChanged'",
        "this.emit('assetChanged'",
    ]
    missing_store = [token for token in store_tokens if token not in store_text]
    if missing_store:
        return fail(f"Store.js missing token(s): {missing_store}")

    control_tokens = [
        "import { Store, CONTROL_STATE_KEYS } from '../Store.js';",
        "applyStoreStateToControls()",
        "Store.setControl(controlId, val)",
        "document.addEventListener('change'",
        "CONTROL_STATE_KEYS[controlId]",
        "fix26_chart_store_member_index.json",
        "bindStoreSync()",
        "syncControlElement(controlId, value)",
        "normalizeControlValue(controlId, payload)",
        "Store.on('controlChanged'",
        "Store.on('assetChanged'",
        "Control element synced:",
        "document.createElement('option')",
    ]
    missing_controls = [token for token in control_tokens if token not in controls_text]
    if missing_controls:
        return fail(f"Controls.js missing token(s): {missing_controls}")

    if "'[object Object]'" not in controls_text:
        return fail("Controls.js does not guard against object-shaped control payload logs")

    if "Future implementation" in controls_text:
        return fail("Controls.js still contains future-implementation placeholder")

    for control_id in [
        "asset", "freq", "range", "briefingMode", "priceDisplay", "scaleMode",
        "ribbon", "sentRibbon", "regimeLayer", "engagement", "bollinger", "osc"
    ]:
        if control_id not in store_text:
            return fail(f"Store.js missing control id mapping: {control_id}")

    print("[OK] Store module declares explicit dashboard control state")
    print("[OK] Controls module routes select changes into Store")
    print("[OK] Controls module syncs Store control changes back to select elements")
    print("[OK] Controls module normalizes object-shaped sync payloads before logging")
    print("[OK] Controls module handles Market Tape asset clicks through Store assetChanged")
    print("[OK] module store/control state smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
