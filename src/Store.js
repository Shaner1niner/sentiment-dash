export const CONTROL_STATE_KEYS = Object.freeze({
    asset: 'currentAsset',
    freq: 'currentFrequency',
    range: 'currentRange',
    briefingMode: 'currentView',
    priceDisplay: 'currentChartType',
    scaleMode: 'currentScaleMode',
    ribbon: 'currentRibbon',
    sentRibbon: 'currentSentimentRibbon',
    regimeLayer: 'currentRegimeLayer',
    engagement: 'currentAttention',
    bollinger: 'currentBands',
    osc: 'currentTimingView'
});

export const DEFAULT_CONTROL_STATE = Object.freeze({
    currentAsset: 'BTC',
    currentFrequency: 'D',
    currentRange: '3M',
    currentView: 'briefing',
    currentChartType: 'candles',
    currentScaleMode: 'price_overlays',
    currentRibbon: 'none',
    currentSentimentRibbon: 'curated',
    currentRegimeLayer: 'on',
    currentAttention: 'context',
    currentBands: 'none',
    currentTimingView: 'both'
});

export const Store = {
    state: {
        assetStoreIndex: null,
        screenerStore: null,
        reviewedBriefings: null,
        ...DEFAULT_CONTROL_STATE
    },

    listeners: {},

    snapshot() {
        return { ...this.state };
    },

    setScreenerData(data) {
        this.state.screenerStore = data;
        this.emit('screenerUpdated', data);
    },

    setAssetStoreIndex(data) {
        this.state.assetStoreIndex = data;
        this.emit('assetStoreIndexUpdated', data);
    },

    setReviewedBriefings(data) {
        this.state.reviewedBriefings = data;
        this.emit('reviewedBriefingsUpdated', data);
    },

    setAsset(assetTicker) {
        return this.setControl('asset', assetTicker);
    },

    setControl(controlId, value) {
        const stateKey = CONTROL_STATE_KEYS[controlId];
        if (!stateKey) {
            console.warn(`Store: unknown control id "${controlId}"`);
            return false;
        }

        const normalizedValue = controlId === 'asset'
            ? String(value || DEFAULT_CONTROL_STATE.currentAsset).trim().toUpperCase()
            : String(value ?? '').trim();

        if (!normalizedValue) return false;

        const previous = this.state[stateKey];
        if (previous === normalizedValue) return false;

        this.state[stateKey] = normalizedValue;

        const payload = {
            controlId,
            stateKey,
            value: normalizedValue,
            previous,
            state: this.snapshot()
        };

        this.emit('controlChanged', payload);
        this.emit(`${controlId}Changed`, payload);
        this.emit(`${stateKey}Changed`, payload);

        if (controlId === 'asset') {
            this.emit('assetChanged', normalizedValue);
        }

        return true;
    },

    setControls(controlValues = {}) {
        const changed = [];
        Object.entries(controlValues).forEach(([controlId, value]) => {
            if (this.setControl(controlId, value)) {
                changed.push(controlId);
            }
        });
        if (changed.length) {
            this.emit('controlsBatchChanged', { changed, state: this.snapshot() });
        }
        return changed;
    },

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
        return () => {
            this.listeners[event] = (this.listeners[event] || []).filter(cb => cb !== callback);
        };
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};
