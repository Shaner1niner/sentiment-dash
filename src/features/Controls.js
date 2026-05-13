import { Store, CONTROL_STATE_KEYS } from '../Store.js';

export const Controls = {
    _bound: false,
    _storeSyncBound: false,

    async init() {
        console.log("Controls Module Initialized (True Parity)");
        await this.populateNativeDropdowns();
        this.applyStoreStateToControls();
        this.bindEvents();
        this.bindStoreSync();
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

    bindStoreSync() {
        if (this._storeSyncBound) return;
        this._storeSyncBound = true;

        Store.on('controlChanged', ({ controlId, value }) => {
            this.syncControlElement(controlId, value);
        });

        Store.on('controlsBatchChanged', ({ changed = [], state = {} }) => {
            changed.forEach(controlId => {
                const stateKey = CONTROL_STATE_KEYS[controlId];
                if (stateKey) this.syncControlElement(controlId, state[stateKey]);
            });
        });

        Store.on('assetChanged', ticker => {
            this.syncControlElement('asset', ticker);
        });
    },

    syncControlElement(controlId, value) {
        if (!controlId || !CONTROL_STATE_KEYS[controlId]) return false;

        const el = document.getElementById(controlId);
        if (!el || el.tagName.toLowerCase() !== 'select') return false;

        const normalizedValue = controlId === 'asset'
            ? String(value || '').trim().toUpperCase()
            : String(value ?? '').trim();

        if (!normalizedValue) return false;

        const hasOption = Array.from(el.options || []).some(option => option.value === normalizedValue);

        if (!hasOption && controlId === 'asset') {
            const option = document.createElement('option');
            option.value = normalizedValue;
            option.textContent = normalizedValue;
            el.appendChild(option);
        } else if (!hasOption) {
            return false;
        }

        if (el.value !== normalizedValue) {
            el.value = normalizedValue;
            console.log(`Control element synced: ${controlId} = ${normalizedValue}`);
        }

        return true;
    },

    applyStoreStateToControls() {
        Object.entries(CONTROL_STATE_KEYS).forEach(([controlId, stateKey]) => {
            const value = Store.state[stateKey];
            if (value !== undefined && value !== null && value !== '') {
                this.syncControlElement(controlId, value);
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
                this.syncControlElement('asset', Store.state.currentAsset);
            }

            console.log(`Controls: Populated asset dropdown with ${assets.length} tickers.`);

        } catch (error) {
            console.error("Controls: Failed to populate data:", error);
        }
    }
};
