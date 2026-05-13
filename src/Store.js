export const Store = {
    state: {
        assetStoreIndex: null,
        screenerStore: null,
        reviewedBriefings: null,
        currentAsset: 'BTC'
    },
    
    setScreenerData(data) {
        this.state.screenerStore = data;
        this.emit('screenerUpdated');
    },
    
    setAsset(assetTicker) {
        this.state.currentAsset = assetTicker;
        this.emit('assetChanged', assetTicker);
    },

    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }
};
