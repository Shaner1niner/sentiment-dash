import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

CONTROLS_JS = '''import { Store } from '../Store.js';

export const Controls = {
    async init() {
        console.log("Controls Module Initialized (True Parity)");
        await this.populateNativeDropdowns();
        this.bindEvents();
    },
    
    bindEvents() {
        // We revert back to native select event listeners, as we are
        // relying on the browser/CSS to style the native <select> elements
        // exactly as defined in dashboard_fix26_base.css
        document.addEventListener('change', (e) => {
            if (e.target.tagName.toLowerCase() === 'select') {
                const val = e.target.value;
                if (val && val.length > 0 && !val.includes('Select')) {
                    console.log(`Dropdown caught change for: ${val}`);
                    
                    // Route to Store based on the ID of the select element
                    if (e.target.id === 'asset') {
                        Store.setAsset(val);
                    } else {
                        // Future implementation: handle other control changes (range, freq, etc.)
                        console.log(`Setting changed: ${e.target.id} = ${val}`);
                    }
                }
            }
        });
    },

    async populateNativeDropdowns() {
        // Target only the asset dropdown for dynamic population
        const assetSelect = document.getElementById('asset');
        if (!assetSelect) return;

        try {
            const response = await fetch('./fix26_chart_store_member_index.json');
            let assets = [];
            
            if (response.ok) {
                const data = await response.json();
                assets = data && data.assets ? Object.keys(data.assets) : (!Array.isArray(data) ? Object.keys(data) : data);
            } else {
                console.warn("Index fetch failed, using fallback list.");
                assets = ["AAPL","AMD","AMZN","BTC","ETH","NVDA","SOL"];
            }

            // Rebuild the <option> list for the asset dropdown
            const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
            assetSelect.innerHTML = optionsHtml;
            
            // Set initial value to match Store if necessary
            if (Store.state.currentAsset) {
                assetSelect.value = Store.state.currentAsset;
            }

            console.log(`Controls: Populated asset dropdown with ${assets.length} tickers.`);

        } catch (error) {
            console.error("Controls: Failed to populate data:", error);
        }
    }
};
'''

def apply():
    print("Applying Stage 12: Reverting to native <select> elements leveraging dashboard_fix26_base.css...")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    
    # We also need to make sure the hotfix CSS injected in Stage 11 is removed
    # This is handled by the complete overwrite of Controls.js above.

    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Refactor: Revert to native <select> elements to inherit base CSS styles"])
    print("Stage 12 applied! Dropdowns should now inherit the correct dark theme from your CSS file.")

if __name__ == "__main__":
    apply()