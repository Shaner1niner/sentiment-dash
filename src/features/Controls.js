import { Store, CONTROL_STATE_KEYS } from '../Store.js';

export const Controls = {
    _bound: false,

    async init() {
        console.log("Controls Module Initialized (True Parity)");
        await this.populateNativeDropdowns();
        this.applyStoreStateToControls();
        this.bindEvents();
    },

    bindEvents() {
        if (this._bound) return;
        this._bound = true;

        document.addEventListener('change', (e) => {
            const target = e.target;
            if (!target || target.tagName.toLowerCase() !== 'select') return;

            const controlId = target.id;
            const val = target.value;

            if (!controlId || !CONTROL_STATE_KEYS[controlId]) return;
            if (!val || val.length <= 0 || val.includes('Select')) return;

            const changed = Store.setControl(controlId, val);
            if (changed) {
                console.log(`Control state changed: ${controlId} = ${val}`);
            }
        });
    },

    applyStoreStateToControls() {
        Object.entries(CONTROL_STATE_KEYS).forEach(([controlId, stateKey]) => {
            const el = document.getElementById(controlId);
            if (!el) return;
            const value = Store.state[stateKey];
            if (value !== undefined && value !== null && value !== '') {
                el.value = value;
            }
        });
    },

    async populateNativeDropdowns() {
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

            const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
            assetSelect.innerHTML = optionsHtml;

            if (Store.state.currentAsset) {
                assetSelect.value = Store.state.currentAsset;
            }

            console.log(`Controls: Populated asset dropdown with ${assets.length} tickers.`);

        } catch (error) {
            console.error("Controls: Failed to populate data:", error);
        }
    }
};
