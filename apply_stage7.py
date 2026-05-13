import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

MARKET_TAPE_JS = '''import { Store } from '../Store.js';

export const MarketTape = {
    init() {
        console.log("Market Tape Module Initialized (Universal Listener)");
        this.bindEvents();
    },
    
    bindEvents() {
        // Listen to clicks anywhere on the document (Event Delegation)
        document.addEventListener('click', (e) => {
            // Check if the clicked element or its parent looks like an asset button/row
            const target = e.target.closest('[data-ticker], .tape-item, .asset-row, .market-tape-item');
            if (target) {
                let ticker = target.getAttribute('data-ticker');
                
                // Fallback if there is no data-ticker attribute
                if (!ticker) {
                    ticker = target.innerText.trim().split('\\n')[0].replace(/[^A-Z]/g, ''); 
                }
                
                if (ticker && ticker.length > 0) {
                    console.log(`Market Tape caught click for: ${ticker}`);
                    Store.setAsset(ticker);
                }
            }
        });
    }
};
'''

CONTROLS_JS = '''import { Store } from '../Store.js';

export const Controls = {
    init() {
        console.log("Controls Module Initialized (Universal Listener)");
        this.bindEvents();
    },
    
    bindEvents() {
        // Listen to ANY dropdown change on the page
        document.addEventListener('change', (e) => {
            if (e.target.tagName.toLowerCase() === 'select') {
                const val = e.target.value;
                if (val && val.length > 0 && val !== 'Select Asset') {
                    console.log(`Dropdown caught change for: ${val}`);
                    Store.setAsset(val);
                }
            }
        });
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
    
    // Preserve Test Harness buttons if they exist
    const btnBtc = document.getElementById('btn-btc');
    if (btnBtc) btnBtc.addEventListener('click', () => Store.setAsset('BTC'));
    const btnEth = document.getElementById('btn-eth');
    if (btnEth) btnEth.addEventListener('click', () => Store.setAsset('ETH'));
    const btnNvda = document.getElementById('btn-nvda');
    if (btnNvda) btnNvda.addEventListener('click', () => Store.setAsset('NVDA'));
    
    // Auto-detect the correct chart container for real UI vs Test Harness
    const containerEl = document.getElementById('chart-container') || 
                        document.querySelector('.js-plotly-plot') || 
                        document.getElementById('plotly-div') ||
                        document.querySelector('[id*="chart"]'); // fuzzy match
                        
    if(containerEl && !containerEl.id) containerEl.id = 'seta-chart-v2-target';
    const targetId = containerEl ? containerEl.id : null;

    Store.on('assetChanged', (newAsset) => {
        // Update Test UI if it exists
        const feedbackEl = document.getElementById('ui-feedback');
        if (feedbackEl) { feedbackEl.innerText = newAsset; feedbackEl.style.color = "#3fb950"; }
        
        if(targetId) {
            loadAndRenderAsset(newAsset, targetId);
        } else {
            console.error("V2 Dashboard Error: Could not find a chart container on this page.");
        }
    });
});

async function loadAndRenderAsset(ticker, targetId) {
    const chartContainer = document.getElementById(targetId);
    if(!chartContainer) return;
    
    chartContainer.style.opacity = "0.5"; // simple loading visual
    
    try {
        const response = await fetch(`./fix26_chart_store_assets/member/${ticker}.json`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const payload = await response.json();
        
        const layout = payload.layout || {};
        layout.paper_bgcolor = '#0d1117'; layout.plot_bgcolor = '#0d1117'; layout.font = { color: '#c9d1d9' };
        
        await PlotlyRenderer.renderChart(targetId, payload.data, layout, payload.config || { responsive: true });
        chartContainer.style.opacity = "1.0";
    } catch (error) {
        console.error("Chart load failed:", error);
        chartContainer.style.opacity = "1.0";
    }
}
'''

def apply():
    print("Wiring resilient V2 UI Modules...")
    (REPO_ROOT / "src" / "features" / "MarketTape.js").write_text(MARKET_TAPE_JS, encoding="utf-8")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    (REPO_ROOT / "src" / "dashboard_main.js").write_text(MAIN_JS, encoding="utf-8")
    
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Refactor: Implement universal Event Delegation for V2 UI modules"])
    print("Stage 7 complete! V2 Modules are bulletproofed.")

if __name__ == "__main__":
    apply()