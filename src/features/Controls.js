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

    normalizeControlValue(controlId, payload) {
        if (!controlId || payload === undefined || payload === null) return '';

        let value = payload;

        if (typeof value === 'object') {
            const stateKey = CONTROL_STATE_KEYS[controlId];
            const candidates = controlId === 'asset'
                ? [
                    value.value,
                    value.asset,
                    value.ticker,
                    value.term,
                    value.symbol,
                    value.db_term,
                    value.currentAsset,
                    value[stateKey],
                    value.controlValue
                ]
                : [
                    value.value,
                    value[stateKey],
                    value.controlValue
                ];

            value = candidates.find(candidate => (
                candidate !== undefined
                && candidate !== null
                && typeof candidate !== 'object'
                && String(candidate).trim() !== ''
            ));

            if (value === undefined || value === null) return '';
        }

        let normalizedValue = String(value ?? '').trim();

        if (!normalizedValue || normalizedValue === '[object Object]') return '';

        if (controlId === 'asset') {
            normalizedValue = normalizedValue.toUpperCase();
        }

        return normalizedValue;
    },

    syncControlElement(controlId, value) {
        if (!controlId || !CONTROL_STATE_KEYS[controlId]) return false;

        const el = document.getElementById(controlId);
        if (!el || el.tagName.toLowerCase() !== 'select') return false;

        const normalizedValue = this.normalizeControlValue(controlId, value);
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
            const mode = String(window.DASH_MODE_DEFAULT || 'member').trim().toLowerCase() === 'public'
                ? 'public'
                : 'member';
            const indexUrl = mode === 'public'
                ? './fix26_chart_store_public_index.json'
                : './fix26_chart_store_member_index.json';
            const response = await fetch(indexUrl);
            let assets = [];

            if (response.ok) {
                const data = await response.json();
                Store.setAssetStoreIndex(data);
                assets = data && data.assets ? Object.keys(data.assets) : (!Array.isArray(data) ? Object.keys(data) : data);
            } else {
                console.warn("Index fetch failed, using fallback list.");
                assets = mode === 'public'
                    ? ["AAPL","BTC","COIN","ETH","GLD","MSFT","NVDA","SOL"]
                    : ["AAPL","AMD","AMZN","BTC","ETH","NVDA","SOL"];
            }

            assets = assets
                .map(ticker => String(ticker || '').trim().toUpperCase())
                .filter(Boolean)
                .sort();

            const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
            assetSelect.innerHTML = optionsHtml;

            if (assets.length && !assets.includes(String(Store.state.currentAsset || '').trim().toUpperCase())) {
                Store.setAsset(assets[0]);
            } else if (Store.state.currentAsset) {
                this.syncControlElement('asset', Store.state.currentAsset);
            }

            console.log(`Controls: Populated asset dropdown with ${assets.length} ${mode} chart-covered tickers.`);

        } catch (error) {
            console.error("Controls: Failed to populate data:", error);
        }
    }
};
