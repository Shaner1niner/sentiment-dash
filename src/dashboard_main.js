import { Store } from './Store.js';
import { AssetPayloadLoader } from './AssetPayloadLoader.js?v=fix26_asset_loader_001';
import { PlotlyRenderer } from './PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001';
import './features/SentimentLayerStructureControlPatch.js?v=module_sentiment_layer_structure_controls_001';
import { MarketTape } from './features/MarketTape.js';
import './features/MarketTapeAttentionStructureCards.js?v=module_market_tape_attention_structure_cards_001';
import './features/PublicDashboardIntroCopy.js?v=module_public_dashboard_intro_copy_001';
import './features/ViewModeDensityPatch.js?v=module_view_mode_density_001';
import { Controls } from './features/Controls.js';
import { BriefingPanel } from './features/BriefingPanel.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("SETA Dashboard V2 Modules Initialized");
    await Controls.init();
    MarketTape.init();
    await BriefingPanel.init();

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

let activeAssetLoadRequestId = 0;

function normalizeAssetTicker(value) {
    return String(value || Store.state.currentAsset || 'BTC').trim().toUpperCase();
}

function renderAssetLoadError(targetId, ticker, error) {
    const chartContainer = document.getElementById(targetId);
    if (!chartContainer) return;

    try {
        if (window.Plotly && typeof window.Plotly.purge === 'function') {
            window.Plotly.purge(chartContainer);
        }
    } catch (_) {}

    chartContainer.innerHTML = `
      <div style="display:grid;place-items:center;min-height:360px;padding:32px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:#0d1117;color:#c9d1d9;text-align:center;">
        <div>
          <strong style="display:block;margin-bottom:8px;color:#ffdf7e;">${ticker} chart payload unavailable on this route.</strong>
          <span style="color:#8b949e;">Use a chart-covered public asset or open the legacy/research route for broader coverage.</span>
        </div>
      </div>
    `;
}

async function loadAndRenderAsset(ticker, targetId) {
    const chartContainer = document.getElementById(targetId);
    if (!chartContainer) return;

    const requestedAsset = normalizeAssetTicker(ticker);
    const requestId = ++activeAssetLoadRequestId;

    chartContainer.style.opacity = "0.5";

    try {
        await AssetPayloadLoader.loadAsset(requestedAsset);

        if (requestId !== activeAssetLoadRequestId || normalizeAssetTicker(Store.state.currentAsset) !== requestedAsset) {
            return;
        }

        await renderCurrentPayload(targetId, requestedAsset);
        chartContainer.style.opacity = "1.0";
    } catch (error) {
        console.error("Chart load failed:", error);

        if (requestId === activeAssetLoadRequestId && normalizeAssetTicker(Store.state.currentAsset) === requestedAsset) {
            renderAssetLoadError(targetId, requestedAsset, error);
        }

        chartContainer.style.opacity = "1.0";
    }
}

async function renderCurrentPayload(targetId, requestedAsset = Store.state.currentAsset) {
    const payload = Store.state.currentAssetPayload;
    if (!payload) {
        console.warn("Module renderer: no current asset payload available");
        return;
    }

    const activeAsset = normalizeAssetTicker(requestedAsset);
    const metaAsset = normalizeAssetTicker(Store.state.assetPayloadMeta?.asset || activeAsset);

    if (metaAsset !== activeAsset) {
        console.warn(`Module renderer: skipping stale payload ${metaAsset}; active asset is ${activeAsset}`);
        return;
    }

    await PlotlyRenderer.renderAssetPayload(
        targetId,
        payload,
        { ...Store.snapshot(), currentAsset: activeAsset },
        payload.config || { responsive: true }
    );
}