import { Store } from '../Store.js';

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
                    ticker = target.innerText.trim().split('\n')[0].replace(/[^A-Z]/g, ''); 
                }
                
                if (ticker && ticker.length > 0) {
                    console.log(`Market Tape caught click for: ${ticker}`);
                    Store.setAsset(ticker);
                }
            }
        });
    }
};
