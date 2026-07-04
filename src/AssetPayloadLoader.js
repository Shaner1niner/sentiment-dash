import { Store } from './Store.js';

const ASSET_PAYLOAD_CACHE_TOKEN = 'module_attention_tfidf_payload_001';
const PUBLIC_DEFAULT_ASSET = 'SPY';
const MEMBER_DEFAULT_ASSET = 'BTC';

function withAssetPayloadCacheToken(url) {
    const separator = String(url || '').includes('?') ? '&' : '?';
    return `${url}${separator}v=${ASSET_PAYLOAD_CACHE_TOKEN}`;
}

function normalizeMode(mode) {
    return String(mode || '').trim().toLowerCase() === 'public' ? 'public' : 'member';
}

function defaultAssetForMode(mode) {
    return normalizeMode(mode) === 'public' ? PUBLIC_DEFAULT_ASSET : MEMBER_DEFAULT_ASSET;
}

export const AssetPayloadLoader = {
    mode: (window.DASH_MODE_DEFAULT || 'member').toLowerCase(),
    cache: {},

    assetPath(assetTicker, mode = this.mode) {
        const safeMode = normalizeMode(mode);
        const asset = String(assetTicker || Store.state.currentAsset || defaultAssetForMode(safeMode)).trim().toUpperCase();
        return withAssetPayloadCacheToken(`./fix26_chart_store_assets/${safeMode}/${asset}.json`);
    },

    cacheKey(assetTicker, mode = this.mode) {
        const safeMode = normalizeMode(mode);
        const asset = String(assetTicker || Store.state.currentAsset || defaultAssetForMode(safeMode)).trim().toUpperCase();
        return `${safeMode}:${asset}`;
    },

    hasCachedAsset(assetTicker, mode = this.mode) {
        return Object.prototype.hasOwnProperty.call(this.cache, this.cacheKey(assetTicker, mode));
    },

    getCachedAsset(assetTicker, mode = this.mode) {
        return this.cache[this.cacheKey(assetTicker, mode)] || null;
    },

    async loadAsset(assetTicker = Store.state.currentAsset, options = {}) {
        const mode = normalizeMode(options.mode || this.mode || 'member');
        const asset = String(assetTicker || Store.state.currentAsset || defaultAssetForMode(mode)).trim().toUpperCase();
        const key = this.cacheKey(asset, mode);
        const force = !!options.force;

        if (!force && this.cache[key]) {
            Store.setCurrentAssetPayload(this.cache[key], { asset, mode, fromCache: true });
            return this.cache[key];
        }

        const url = this.assetPath(asset, mode);

        Store.emit('assetPayloadLoading', { asset, mode, url, state: Store.snapshot() });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const payload = await response.json();

            this.cache[key] = payload;
            Store.setCurrentAssetPayload(payload, { asset, mode, url, fromCache: false });

            return payload;
        } catch (error) {
            Store.emit('assetPayloadError', { asset, mode, url, error, state: Store.snapshot() });
            throw error;
        }
    }
};
