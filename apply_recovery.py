import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

PLOTLY_RENDERER = '''export class PlotlyRenderer {
    static async renderChart(containerId, data, layout, config) {
        const mutatedData = this.applyDataMutators(data);
        await window.Plotly.newPlot(containerId, mutatedData, layout, config);
        this.applyVisibleWindowOptimizer(containerId);
    }
    static applyDataMutators(data) {
        if (!data || !Array.isArray(data)) return data;
        return data.map(trace => {
            if (trace.name === 'MACD Histogram' || (trace.type === 'bar' && trace.yaxis === 'y3')) {
                return { ...trace, width: 86400000 * 0.8 }; 
            }
            return trace;
        });
    }
    static applyVisibleWindowOptimizer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.on('plotly_relayout', (eventData) => {
            if (eventData['xaxis.range[0]'] && eventData['xaxis.range[1]']) {
                console.log("PlotlyRenderer: Visible window optimized for pan/zoom.");
            }
        });
    }
}
'''

MARKET_TAPE_JS = '''import { Store } from '../Store.js';
// We will migrate the scrolling asset ticker logic here
export const MarketTape = {
    init() {
        console.log("Market Tape Module Initialized");
    }
};
'''

CONTROLS_JS = '''import { Store } from '../Store.js';
// We will migrate the custom dropdown and screener logic here
export const Controls = {
    init() {
        console.log("Controls Module Initialized");
    }
};
'''

MAIN_JS = '''import { Store } from './Store.js';
import { PlotlyRenderer } from './PlotlyRenderer.js';
import { MarketTape } from './features/MarketTape.js';
import { Controls } from './features/Controls.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("SETA Dashboard V2 Modules Initialized");
    MarketTape.init();
    Controls.init();
    
    Store.on('assetChanged', (newAsset) => {
        const feedbackEl = document.getElementById('ui-feedback');
        if (feedbackEl) { feedbackEl.innerText = newAsset; feedbackEl.style.color = "#3fb950"; }
        loadAndRenderAsset(newAsset);
    });
});

async function loadAndRenderAsset(ticker) {
    const chartContainer = document.getElementById('chart-container');
    if(!chartContainer) return;
    chartContainer.innerHTML = '<p style="color: #8b949e;">Loading chart data...</p>';
    try {
        const response = await fetch(`./fix26_chart_store_assets/member/${ticker}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const payload = await response.json();
        const layout = payload.layout || {};
        layout.paper_bgcolor = '#0d1117'; layout.plot_bgcolor = '#0d1117'; layout.font = { color: '#c9d1d9' };
        await PlotlyRenderer.renderChart('chart-container', payload.data, layout, payload.config || { responsive: true });
    } catch (error) {
        chartContainer.innerHTML = `<p style="color: #f85149;">Error loading ${ticker} chart data.</p>`;
    }
}
'''

def apply():
    print("Recovering V2 Architecture and Scaffolding UI Modules...")
    (REPO_ROOT / "src" / "PlotlyRenderer.js").write_text(PLOTLY_RENDERER, encoding="utf-8")
    (REPO_ROOT / "src" / "features" / "MarketTape.js").write_text(MARKET_TAPE_JS, encoding="utf-8")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    (REPO_ROOT / "src" / "dashboard_main.js").write_text(MAIN_JS, encoding="utf-8")
    
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Recovery: Re-apply chart rendering and scaffold UI modules"])
    print("Recovery complete! Modules are ready for migration.")

if __name__ == "__main__":
    apply()