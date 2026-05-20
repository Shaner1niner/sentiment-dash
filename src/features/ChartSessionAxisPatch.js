import { PlotlyRenderer } from '../PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001';

const PATCH_TOKEN = 'module_chart_session_axis_001';

const CRYPTO_ASSETS = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'MATIC', 'LINK', 'LTC', 'BCH', 'DOT']);
const PRICE_FIELDS = new Set(['open', 'high', 'low', 'close', 'adj_close', 'volume']);
const SUM_HINTS = ['count', 'volume', 'posts', 'comments', 'engagement', 'mentions', 'num_'];
const AVG_HINTS = ['sent', 'sentiment', 'compound', 'vader', 'roberta', 'bsky', 'reddit', 'twitter', 'tweet', 'news'];
const CONTINUOUS_LINE_NAMES = new Set(['price', 'sentiment']);

function assetSymbol(state = {}) {
    return String(state.currentAsset || '').trim().toUpperCase();
}

function isCryptoAsset(state = {}) {
    return CRYPTO_ASSETS.has(assetSymbol(state));
}

function asDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
}

function rowDate(row = {}) {
    return asDate(row.dateObj || row.date || row.dt || row.timestamp);
}

function dateKey(date) {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
}

function isWeekendDate(date) {
    const day = date ? date.getUTCDay() : -1;
    return day === 0 || day === 6;
}

function nextMondayKey(date) {
    if (!date) return '';
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = d.getUTCDay();
    const add = day === 6 ? 2 : day === 0 ? 1 : 0;
    d.setUTCDate(d.getUTCDate() + add);
    return dateKey(d);
}

function finiteNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function shouldAverageField(key) {
    const lower = String(key || '').toLowerCase();
    return AVG_HINTS.some(hint => lower.includes(hint)) && !PRICE_FIELDS.has(lower);
}

function shouldSumField(key) {
    const lower = String(key || '').toLowerCase();
    return SUM_HINTS.some(hint => lower.includes(hint)) && !PRICE_FIELDS.has(lower);
}

function mergeWeekendContext(target, weekendRows) {
    if (!target || !weekendRows.length) return target;
    const next = { ...target };
    const keys = new Set();
    weekendRows.forEach(row => Object.keys(row || {}).forEach(key => keys.add(key)));

    keys.forEach(key => {
        if (PRICE_FIELDS.has(String(key).toLowerCase())) return;
        if (!shouldAverageField(key) && !shouldSumField(key)) return;
        const values = weekendRows.map(row => finiteNumber(row?.[key])).filter(value => value !== null);
        if (!values.length) return;

        const current = finiteNumber(next[key]);
        if (shouldSumField(key)) {
            next[key] = (current || 0) + values.reduce((sum, value) => sum + value, 0);
            return;
        }

        const allValues = current === null ? values : [current, ...values];
        next[key] = allValues.reduce((sum, value) => sum + value, 0) / allValues.length;
    });

    next.__session_axis_weekend_context = weekendRows.length;
    return next;
}

function normalizeEquityRowsToTradingSessions(rows = []) {
    const source = Array.isArray(rows) ? rows : [];
    if (!source.length) return source;

    const weekdayRows = [];
    const weekendByMonday = new Map();

    source.forEach(row => {
        const d = rowDate(row);
        if (!d) {
            weekdayRows.push(row);
            return;
        }
        if (isWeekendDate(d)) {
            const key = nextMondayKey(d);
            if (!weekendByMonday.has(key)) weekendByMonday.set(key, []);
            weekendByMonday.get(key).push(row);
            return;
        }
        weekdayRows.push(row);
    });

    return weekdayRows.map(row => {
        const key = dateKey(rowDate(row));
        return mergeWeekendContext(row, weekendByMonday.get(key) || []);
    });
}

function sessionRangebreaksForState(state = {}) {
    if (isCryptoAsset(state)) return [];
    return [{ bounds: ['sat', 'mon'] }];
}

function chartTypeForState(state = {}) {
    return String(state.currentChartType || 'candles').trim().toLowerCase();
}

function shouldConnectLineTrace(trace = {}) {
    if (!trace || trace.type !== 'scatter' || trace.mode !== 'lines') return false;
    const name = String(trace.name || '').trim().toLowerCase();
    return CONTINUOUS_LINE_NAMES.has(name);
}

function applyLineModeContinuity(traces = [], state = {}) {
    if (chartTypeForState(state) !== 'line') return traces;
    return (Array.isArray(traces) ? traces : []).map(trace => {
        if (!shouldConnectLineTrace(trace)) return trace;
        return {
            ...trace,
            connectgaps: true,
            meta: {
                ...(trace.meta || {}),
                sessionAxisLineContinuity: true
            }
        };
    });
}

function patchChartSessionAxis() {
    if (PlotlyRenderer.__chartSessionAxisPatch === PATCH_TOKEN) return;
    PlotlyRenderer.__chartSessionAxisPatch = PATCH_TOKEN;

    const originalSelectRowsForState = PlotlyRenderer.selectRowsForState;
    PlotlyRenderer.selectRowsForState = function patchedSelectRowsForState(rows = [], state = {}) {
        const selected = originalSelectRowsForState.call(this, rows, state);
        return isCryptoAsset(state) ? selected : normalizeEquityRowsToTradingSessions(selected);
    };

    const originalBuildLayout = PlotlyRenderer.buildLayout;
    PlotlyRenderer.buildLayout = function patchedBuildLayout(baseLayout = {}, state = {}, rows = []) {
        const layout = originalBuildLayout.call(this, baseLayout, state, rows) || {};
        layout.xaxis = {
            ...(layout.xaxis || {}),
            rangebreaks: sessionRangebreaksForState(state)
        };
        return layout;
    };

    const originalBuildPriceTraces = PlotlyRenderer.buildPriceTraces;
    PlotlyRenderer.buildPriceTraces = function patchedBuildPriceTraces(rows = [], state = {}) {
        const traces = originalBuildPriceTraces.call(this, rows, state);
        return applyLineModeContinuity(traces, state);
    };
}

patchChartSessionAxis();

export { PATCH_TOKEN, normalizeEquityRowsToTradingSessions, sessionRangebreaksForState, applyLineModeContinuity, patchChartSessionAxis };
