import { Store } from './Store.js';
import { AssetPayloadLoader } from './AssetPayloadLoader.js';
import { PlotlyRenderer } from './PlotlyRenderer.js';
import { MarketTape } from './features/MarketTape.js';
import { Controls } from './features/Controls.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("SETA Dashboard V2 Modules Initialized");
    MarketTape.init();
    Controls.init();

    const btnBtc = document.getElementById('btn-btc');
    if (btnBtc) btnBtc.addEventListener('click', () => Store.setAsset('BTC'));
    const btnEth = document.getElementById('btn-eth');
    if (btnEth) btnEth.addEventListener('click', () => Store.setAsset('ETH'));
    const btnNvda = document.getElementById('btn-nvda');
    if (btnNvda) btnNvda.addEventListener('click', () => Store.setAsset('NVDA'));

    const containerEl = document.getElementById('chart-container') ||
                        document.querySelector('.js-plotly-plot') ||
                        document.getElementById('plotly-div') ||
                        document.getElementById('chart') ||
                        document.querySelector('[id*="chart"]');

    if (containerEl && !containerEl.id) containerEl.id = 'seta-chart-v2-target';
    const targetId = containerEl ? containerEl.id : null;

    Store.on('assetChanged', (event) => {
        const value = typeof event === 'string'
            ? event
            : (event && event.value) || Store.state.currentAsset;

        const feedbackEl = document.getElementById('ui-feedback');
        if (feedbackEl) {
            feedbackEl.innerText = value;
            feedbackEl.style.color = "#3fb950";
        }

        if (targetId) {
            loadAndRenderAsset(value, targetId);
        } else {
            console.error("V2 Dashboard Error: Could not find a chart container on this page.");
        }
    });

    Store.on('controlChanged', ({ controlId, state }) => {
        if (controlId === 'asset') return;
        console.log(`Module control changed: ${controlId}`, state);

        if (targetId && Store.state.currentAssetPayload) {
            renderCurrentPayload(targetId);
        }
    });

    if (targetId) {
        await loadAndRenderAsset(Store.state.currentAsset, targetId);
    }
});

async function loadAndRenderAsset(ticker, targetId) {
    const chartContainer = document.getElementById(targetId);
    if (!chartContainer) return;

    chartContainer.style.opacity = "0.5";

    try {
        await AssetPayloadLoader.loadAsset(ticker);
        await renderCurrentPayload(targetId);
        chartContainer.style.opacity = "1.0";
    } catch (error) {
        console.error("Chart load failed:", error);
        chartContainer.style.opacity = "1.0";
    }
}

async function renderCurrentPayload(targetId) {
    const payload = Store.state.currentAssetPayload;
    if (!payload) {
        console.warn("Module renderer: no current asset payload available");
        return;
    }

    await PlotlyRenderer.renderAssetPayload(
        targetId,
        payload,
        Store.snapshot(),
        payload.config || { responsive: true }
    );
}
