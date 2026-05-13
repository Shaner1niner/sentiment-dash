import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

CONTROLS_JS = '''import { Store } from '../Store.js';

export const Controls = {
    async init() {
        console.log("Controls Module Initialized");
        this.bindEvents();
        await this.populateDropdowns();
    },
    
    bindEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.tagName.toLowerCase() === 'select') {
                const val = e.target.value;
                if (val && val.length > 0 && !val.includes('Select')) {
                    console.log(`Dropdown caught change for: ${val}`);
                    Store.setAsset(val);
                }
            }
        });
    },

    async populateDropdowns() {
        // Find all select elements that look like asset dropdowns
        const selects = document.querySelectorAll('select');
        if (selects.length === 0) return;

        try {
            // 1. Fetch the official list of generated assets
            const response = await fetch('./fix26_chart_store_member_index.json');
            let assets = [];
            
            if (response.ok) {
                assets = await response.json();
            } else {
                console.warn("Index fetch failed, using fallback asset list.");
                // Hardcoded fallback based on your repo structure just in case
                assets = ["AAPL","AMD","AMZN","AVAX","BNB","BTC","COIN","DOGE","DXY","ETH","GLD","GOOGL","LINK","META","MSFT","MSTR","NFLX","NVDA","PLTR","QQQ","SHOP","SMCI","SOL","TLT","TSLA","XLE","XRP"];
            }

            // 2. Ensure we are dealing with an array of strings
            if (!Array.isArray(assets)) {
                assets = Object.keys(assets); // Just in case the JSON is an object map
            }

            // 3. Inject the options into every dropdown on the page
            selects.forEach(select => {
                // Keep the default placeholder (e.g., "Select Asset")
                const firstOption = select.querySelector('option');
                const placeholder = firstOption ? firstOption.outerHTML : '<option value="">Select Asset...</option>';
                
                // Build the list of tickers
                const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
                
                // Update the DOM
                select.innerHTML = placeholder + optionsHtml;
            });

            console.log(`Controls: Successfully populated dropdowns with ${assets.length} assets.`);

        } catch (error) {
            console.error("Controls: Failed to populate dropdowns:", error);
        }
    }
};
'''

def apply():
    print("Patching V2 Controls module to auto-populate dropdowns...")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Fix: Add dynamic dropdown population to Controls.js"])
    print("Fix applied! Dropdowns will now populate on load.")

if __name__ == "__main__":
    apply()