import { Store } from './Store.js';

function valueOf(item, keys) {
    for (const key of keys) {
        if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
    }
    return null;
}

function normalizeAsset(value) {
    return String(value || '').trim().toUpperCase();
}

function normalizeFreq(value) {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'D' || raw === 'DAILY' || raw === 'DAY') return 'D';
    if (raw === 'W' || raw === 'WEEKLY' || raw === 'WEEK') return 'W';
    return raw;
}

function normalizeRange(value) {
    return String(value || '').trim().toUpperCase();
}

function objectMapToItems(candidate) {
    return Object.entries(candidate)
        .filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value))
        .map(([payloadKey, value]) => ({
            payload_key: value && value.payload_key ? value.payload_key : payloadKey,
            ...(value || {})
        }));
}

function flattenReviewedPayload(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;

    const candidates = [
        payload.items,
        payload.briefings,
        payload.records,
        payload.reviewed,
        payload.reviewed_briefings,
        payload.generated_briefings,
        payload.map,
        payload.by_key,
        payload.briefings_by_key,
        payload.payloads,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) return candidate;
        if (candidate && typeof candidate === 'object') {
            const items = objectMapToItems(candidate);
            if (items.length) return items;
        }
    }

    if (typeof payload === 'object') {
        const items = objectMapToItems(payload);
        if (items.length) return items;
    }

    return [];
}

function assetFor(item) {
    return normalizeAsset(valueOf(item, ['asset', 'term', 'ticker', 'symbol', 'db_term']));
}

function freqFor(item) {
    return normalizeFreq(valueOf(item, ['freq', 'frequency', 'timeframe', 'cadence']));
}

function rangeFor(item) {
    return normalizeRange(valueOf(item, ['range', 'display_range', 'rangePreset', 'range_preset', 'window']));
}

function scoreItem(item, state) {
    const asset = normalizeAsset(state.currentAsset);
    const freq = normalizeFreq(state.currentFrequency);
    const range = normalizeRange(state.currentRange);

    let score = 0;
    if (assetFor(item) === asset) score += 100;
    if (freqFor(item) === freq) score += 25;
    if (rangeFor(item) === range) score += 20;

    const mode = String(window.DASH_MODE_DEFAULT || '').toLowerCase();
    const itemMode = String(valueOf(item, ['mode', 'dashboard_mode']) || '').toLowerCase();
    if (itemMode && mode && itemMode === mode) score += 5;

    if (item.reviewed || item.is_reviewed || item.review_status === 'reviewed') score += 2;

    return score;
}

export const ReviewedBriefingLoader = {
    url: window.DASH_REVIEWED_BRIEFINGS_URL || './generated_briefings_reviewed_v2.json',
    payload: null,

    async load(options = {}) {
        if (this.payload && !options.force) {
            Store.setReviewedBriefings(this.payload);
            return this.payload;
        }

        const response = await fetch(this.url);
        if (!response.ok) throw new Error(`Reviewed briefing fetch failed: ${response.status}`);

        this.payload = await response.json();
        Store.setReviewedBriefings(this.payload);
        return this.payload;
    },

    allItems(payload = this.payload || Store.state.reviewedBriefings) {
        return flattenReviewedPayload(payload);
    },

    matchForState(state = Store.snapshot(), payload = this.payload || Store.state.reviewedBriefings) {
        const asset = normalizeAsset(state.currentAsset);
        if (!asset) return null;

        const items = this.allItems(payload).filter(item => assetFor(item) === asset);
        if (!items.length) return null;

        const scored = items
            .map(item => ({ item, score: scoreItem(item, state) }))
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                const ad = String(valueOf(a.item, ['as_of', 'date', 'generated_at']) || '');
                const bd = String(valueOf(b.item, ['as_of', 'date', 'generated_at']) || '');
                return bd.localeCompare(ad);
            });

        return scored[0] ? scored[0].item : null;
    }
};
