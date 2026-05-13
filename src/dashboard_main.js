import { Store } from './Store.js';
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
