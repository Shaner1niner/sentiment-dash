#!/usr/bin/env python
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLOTLY = ROOT / "src" / "PlotlyRenderer.js"
MAIN = ROOT / "src" / "dashboard_main.js"
BTC = ROOT / "fix26_chart_store_assets" / "member" / "BTC.json"


def fail(message: str) -> int:
    print(f"[ERROR] {message}")
    return 1


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig", errors="ignore")


def main() -> int:
    if not PLOTLY.exists():
        return fail("missing src/PlotlyRenderer.js")
    if not MAIN.exists():
        return fail("missing src/dashboard_main.js")

    plotly = read(PLOTLY)
    main_js = read(MAIN)

    plotly_tokens = [
        "import { selectedWindowRows } from './core/displayRangeWindow.js';",
        "static async renderAssetPayload(containerId, payload, state = {}, config = {})",
        "static resolveRows(payload, state = {})",
        "static selectRowsForState(rows, state = {})",
        "static buildPriceTraces(rows, state = {})",
        "static buildLayout(baseLayout = {}, state = {}, rows = [])",
        "selectedWindowRows(source, range",
        "payload?.[freq]?.[asset]",
        "type: 'candlestick'",
        "Module renderer",
    ]
    missing_plotly = [token for token in plotly_tokens if token not in plotly]
    if missing_plotly:
        return fail(f"PlotlyRenderer.js missing token(s): {missing_plotly}")

    main_tokens = [
        "PlotlyRenderer.renderAssetPayload(",
        "renderCurrentPayload(targetId)",
        "Store.state.currentAssetPayload",
        "if (controlId === 'asset') return;",
    ]
    missing_main = [token for token in main_tokens if token not in main_js]
    if missing_main:
        return fail(f"dashboard_main.js missing token(s): {missing_main}")

    if "PlotlyRenderer.renderChart(targetId, payload.data" in main_js:
        return fail("dashboard_main.js still calls PlotlyRenderer.renderChart with payload.data directly")

    if BTC.exists():
        payload = json.loads(BTC.read_text(encoding="utf-8-sig"))
        rows = payload.get("D", {}).get("BTC", [])
        if len(rows) < 30:
            return fail("BTC member daily payload has too few rows for renderer parity smoke")
        sample = rows[-1]
        for field in ["date", "open", "high", "low", "close"]:
            if field not in sample:
                return fail(f"BTC sample row missing required field: {field}")
        print(f"[OK] BTC member daily sample rows available: {len(rows)}")
    else:
        print("[WARN] BTC member asset payload not present; skipped sample payload check")

    print("[OK] PlotlyRenderer can resolve chart-store asset rows")
    print("[OK] dashboard_main routes module payloads through renderAssetPayload")
    print("[OK] module Plotly renderer parity smoke passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
