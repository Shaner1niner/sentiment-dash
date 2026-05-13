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
        const selects = document.querySelectorAll('select');
        if (selects.length === 0) return;

        try {
            const response = await fetch('./fix26_chart_store_member_index.json');
            let assets = [];
            
            if (response.ok) {
                const data = await response.json();
                
                // FIX: Target the actual 'assets' object inside the payload
                if (data && data.assets) {
                    assets = Object.keys(data.assets);
                } else if (!Array.isArray(data)) {
                    assets = Object.keys(data); // Fallback
                } else {
                    assets = data;
                }
            } else {
                console.warn("Index fetch failed, using fallback asset list.");
                assets = ["AAPL","AMD","AMZN","AVAX","BNB","BTC","COIN","DOGE","DXY","ETH","GLD","GOOGL","LINK","META","MSFT","MSTR","NFLX","NVDA","PLTR","QQQ","SHOP","SMCI","SOL","TLT","TSLA","XLE","XRP"];
            }

            selects.forEach(select => {
                const firstOption = select.querySelector('option');
                const placeholder = firstOption ? firstOption.outerHTML : '<option value="">Select Asset...</option>';
                const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
                select.innerHTML = placeholder + optionsHtml;
            });

            console.log(`Controls: Successfully populated dropdowns with ${assets.length} actual asset tickers.`);

        } catch (error) {
            console.error("Controls: Failed to populate dropdowns:", error);
        }
    }
};
'''

def apply():
    print("Applying Stage 10: Correcting JSON parsing for dropdown assets...")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Fix: Update Controls.js to target data.assets payload for dropdown population"])
    print("Fix applied! Dropdowns will now accurately display your available charting tickers.")

if __name__ == "__main__":
    apply()