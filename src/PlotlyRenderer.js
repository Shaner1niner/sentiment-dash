import { selectedWindowRows } from './core/displayRangeWindow.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const MODULE_CHART_VISUALS = {
    paperBg: '#080c12',
    plotBg: '#0a0f16',
    primaryText: '#f0f6fc',
    secondaryText: '#9aa8b8',
    mutedText: '#7d8590',
    grid: 'rgba(148,163,184,0.075)',
    gridSubtle: 'rgba(148,163,184,0.055)',
    zeroLine: 'rgba(148,163,184,0.18)',
    axisLine: 'rgba(148,163,184,0.22)',
    candleUpLine: '#d7dee8',
    candleUpFill: 'rgba(215,222,232,0.82)',
    candleDownLine: '#7d8590',
    candleDownFill: 'rgba(125,133,144,0.58)',
    priceLine: '#d7dee8',
    priceBandLine: 'rgba(155,220,255,0.62)',
    overlapBandLine: 'rgba(242,204,96,0.86)',
    overlapBandFill: 'rgba(242,204,96,0.13)',
    unavailableText: '#f2cc60'
};

const MODULE_TA_PANEL_VISUALS = {
    thresholdLine: 'rgba(155,220,255,0.20)',
    midline: 'rgba(148,163,184,0.035)',
    zeroLine: 'rgba(242,204,96,0.26)',
    panelBand: 'rgba(155,220,255,0.045)',
    macdBarOpacity: 0.52,
    macdLineWidth: 1.25,
    oscillatorLineWidth: 1.15,
    rsiPriceLine: 'rgba(190,150,255,0.92)',
    rsiPriceGlowLine: 'rgba(190,150,255,0.13)',
    rsiPriceGlowWidth: 4.5,
    rsiUpperRail: 'rgba(242,204,96,0.22)',
    rsiLowerRail: 'rgba(155,180,255,0.22)',
    rsiMidRail: 'rgba(148,163,184,0.09)',
    rsiSentimentLine: 'rgba(242,204,96,0.36)',
    stochRsiLine: 'rgba(126,231,185,0.68)',
    stochRsiGlowLine: 'rgba(126,231,185,0.095)',
    stochRsiGlowWidth: 3.25,
    stochRsiSentimentLine: 'rgba(242,204,96,0.34)',
    stochRsiSignalLine: 'rgba(255,123,114,0.46)',
    stochUpperRail: 'rgba(242,204,96,0.16)',
    stochUpperZoneFill: 'rgba(242,204,96,0.014)',
    stochLowerRail: 'rgba(155,180,255,0.16)',
    stochLowerZoneFill: 'rgba(155,180,255,0.014)',
    stochMidRail: 'rgba(148,163,184,0.07)',
    rsiUpperZoneFill: 'rgba(242,204,96,0.035)',
    rsiLowerZoneFill: 'rgba(155,220,255,0.035)',
    priceHighFill: 'rgba(242,204,96,0.135)',
    rsiHighSoftFill: 'rgba(242,204,96,0.045)',
    rsiHighMidFill: 'rgba(242,204,96,0.080)',
    rsiHighDeepFill: 'rgba(242,204,96,0.125)',
    priceLowFill: 'rgba(155,220,255,0.130)',
    rsiLowSoftFill: 'rgba(155,220,255,0.045)',
    rsiLowMidFill: 'rgba(155,220,255,0.080)',
    rsiLowDeepFill: 'rgba(155,220,255,0.120)',
    rsiSharedHighFill: 'rgba(242,204,96,0.135)',
    rsiSharedLowFill: 'rgba(155,180,255,0.130)',
    sentimentHighFill: 'rgba(255,123,114,0.125)',
    sentimentLowFill: 'rgba(126,231,135,0.115)',
    combinedHighFill: 'rgba(255,214,102,0.260)',
    rsiCombinedHighSoftFill: 'rgba(255,214,102,0.120)',
    rsiCombinedHighMidFill: 'rgba(255,214,102,0.210)',
    rsiCombinedHighDeepFill: 'rgba(255,214,102,0.330)',
    combinedLowFill: 'rgba(127,255,212,0.235)',
    rsiCombinedLowSoftFill: 'rgba(127,255,212,0.105)',
    rsiCombinedLowMidFill: 'rgba(127,255,212,0.190)',
    rsiCombinedLowDeepFill: 'rgba(127,255,212,0.305)',
    combinedMixedFill: 'rgba(190,118,255,0.220)',
    rsiMixedSoftFill: 'rgba(190,118,255,0.100)',
    rsiMixedMidFill: 'rgba(190,118,255,0.175)',
    rsiMixedDeepFill: 'rgba(190,118,255,0.285)',
    combinedLine: 'rgba(255,255,255,0.24)'
};

function compact(values) {
    return values.filter(value => value !== null && value !== undefined && Number.isFinite(Number(value)));
}

function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function asDate(row) {
    if (!row) return null;
    const value = row.dateObj || row.date || row.dt || row.timestamp;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
}

function latestDate(rows) {
    const dates = rows.map(asDate).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
    return dates.length ? dates[dates.length - 1] : null;
}

function controlMode(value, fallback = '') {
    return String(value ?? fallback)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}

function finiteSeries(rows, field) {
    return rows.map(row => asNumber(row?.[field]));
}

function hasEnoughSeries(values, rows, ratio = 0.18, floor = 3) {
    return compact(values).length >= Math.max(floor, Math.floor((rows || []).length * ratio));
}

function fieldLabel(field) {
    return String(field || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
}


function firstRowValue(row, fields = [], fallback = null) {
    for (const field of fields) {
        const value = row?.[field];
        if (value !== null && value !== undefined && value !== '') return value;
    }
    return fallback;
}

function markerFlag(row, fields = []) {
    return fields.some(field => {
        const value = row?.[field];
        if (value === true) return true;
        const n = asNumber(value, null);
        if (n !== null) return n === 1;
        return String(value ?? '').trim().toLowerCase() === 'true';
    });
}

function hoverNumber(label, value, precision = 2) {
    const n = asNumber(value, null);
    if (n === null) return '';
    const formatted = Math.abs(n) >= 100 ? Math.round(n).toString() : n.toFixed(precision).replace(/\.0+$/, '');
    return `${label}: ${formatted}`;
}

function hoverText(label, value, maxLength = 90) {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text || text.toLowerCase() === 'nan') return '';
    const clipped = text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
    return `${label}: ${clipped}`;
}

const MODULE_REGIME_MARKER_DEFINITIONS = [
    {
        key: 'confirmedOverlap',
        name: 'Confirmed Overlap',
        fields: ['boll_overlap_break_confirmed_high_volume', 'boll_overlap_break_confirmed', 'confirmed_overlap_event', 'confirmed_bollinger_overlap'],
        symbol: 'diamond-open',
        size: 9
    },
    {
        key: 'ribbonTransition',
        name: 'Ribbon Transition',
        fields: ['sent_ribbon_transition_flag', 'sentiment_ribbon_transition_flag', 'ribbon_transition_flag', 'sentiment_ribbon_transition'],
        symbol: 'triangle-up-open',
        size: 8
    },
    {
        key: 'highVolume',
        name: 'High Volume',
        fields: ['high_volume_20', 'high_volume_flag', 'volume_breakout_flag', 'volume_spike_flag'],
        symbol: 'circle-open',
        size: 7
    },
    {
        key: 'outsideExpectedRange',
        name: 'Outside Expected Range',
        fields: ['outside_expected_range', 'outside_expected_range_flag', 'outside_range_flag', 'expected_range_break_flag'],
        symbol: 'x-open',
        size: 8
    }
];

function rowMatchesRegimeMarker(row, definition) {
    return markerFlag(row, definition.fields);
}

function regimeMarkerHoverText(row, definition) {
    const parts = [
        `Marker: ${definition.name}`,
        hoverText('Date', firstRowValue(row, ['date', 'dt', 'timestamp']), 48),
        hoverNumber('Close', firstRowValue(row, ['close', 'latest_close', 'price']), 2),
        hoverText('Ribbon', firstRowValue(row, ['sentiment_ribbon_state', 'sent_ribbon_state', 'sentiment_ribbon', 'ribbon_state']), 72),
        hoverText('Regime', firstRowValue(row, ['regime_label', 'regime', 'market_regime', 'context_regime']), 72),
        hoverNumber('Structure Score', firstRowValue(row, ['seta_dashboard_summary_score', 'seta_score', 'dashboard_score']), 1),
        hoverNumber('Attention', firstRowValue(row, ['attention_level_score', 'attention_priority_score', 'screener_attention_priority_score']), 1),
        hoverText('Direction', firstRowValue(row, ['signal_consensus_direction_label', 'direction_label', 'direction']), 72)
    ].filter(Boolean);

    return parts.join('<br>');
}
function firstSupportedField(rows, candidates = [], ratio = 0.18, floor = 3) {
    const source = Array.isArray(rows) ? rows : [];
    for (const field of candidates) {
        const y = finiteSeries(source, field);
        if (hasEnoughSeries(y, source, ratio, floor)) return field;
    }
    return null;
}

function seriesForFirstSupportedField(rows, candidates = [], ratio = 0.18, floor = 3) {
    const field = firstSupportedField(rows, candidates, ratio, floor);
    return field ? { field, y: finiteSeries(rows, field) } : null;
}

const MODULE_CHART_STACK_FIELDS = {
    macd: ['macd', 'macd_line', 'macd_12_26_9', 'MACD', 'MACD_12_26_9', 'macd_value'],
    macdSignal: ['macd_signal', 'macd_signal_9', 'macds', 'MACDs', 'MACDs_12_26_9', 'signal_macd'],
    macdHist: ['macd_hist', 'macd_histogram', 'macdh', 'MACDh', 'MACDh_12_26_9', 'macd_diff', 'macd_delta'],
    rsi: ['rsi', 'rsi_14', 'RSI', 'RSI_14', 'relative_strength_index', 'ta_rsi_14'],
    sentimentRsi: [
        'sentiment_rsi',
        'sentiment_rsi_14',
        'sent_rsi',
        'sent_rsi_14',
        'rsi_sentiment',
        'rsi_sentiment_14',
        'sentiment_relative_strength_index',
        'combined_sentiment_rsi',
        'combined_sentiment_rsi_14',
        'combined_compound_rsi',
        'combined_compound_rsi_14',
        'scaled_combined_compound_rsi',
        'scaled_combined_compound_rsi_14',
        'compound_rsi',
        'compound_rsi_14',
        'snt_rsi',
        'snt_rsi_14'
    ],
    stochRsi: ['stochastic_rsi', 'stochastic_rsi_k', 'stoch_rsi', 'stochrsi', 'stoch_rsi_k', 'stochrsi_k', 'stoch_rsi_fastk', 'STOCHRSIk_14_14_3_3'],
    sentimentStochRsi: [
        'sentiment_stochastic_rsi',
        'sentiment_stochastic_rsi_k',
        'sentiment_stochastic_rsi_d',
        'sentiment_stoch_rsi',
        'sentiment_stoch_rsi_k',
        'sentiment_stoch_rsi_d',
        'sent_stochastic_rsi',
        'sent_stochastic_rsi_k',
        'sent_stochastic_rsi_d',
        'sent_stoch_rsi',
        'sent_stoch_rsi_k',
        'sent_stoch_rsi_d',
        'stoch_rsi_sentiment',
        'stochrsi_sentiment',
        'combined_sentiment_stochastic_rsi',
        'combined_sentiment_stoch_rsi',
        'combined_sentiment_stochastic_rsi_d',
        'combined_compound_stochastic_rsi',
        'combined_compound_stoch_rsi',
        'combined_compound_stochastic_rsi_d',
        'scaled_combined_compound_stochastic_rsi',
        'scaled_combined_compound_stoch_rsi',
        'scaled_combined_compound_stochastic_rsi_d'
    ],
    stochRsiSignal: ['stochastic_rsi_d', 'stochastic_rsi_signal', 'stoch_rsi_d', 'stochrsi_d', 'stoch_rsi_fastd', 'STOCHRSId_14_14_3_3'],
    sentimentStochRsiSignal: []
};

const MODULE_SENTIMENT_THRESHOLD_FIELDS = {
    value: [
        'scaled_combined_compound_ma_21',
        'scaled_combined_compound_ma_7',
        'scaled_combined_compound_ma_50',
        'combined_compound_ma_21',
        'combined_compound_ma_7',
        'combined_compound'
    ],
    upper: [
        'sentiment_upper_band',
        'scaled_sentiment_upper_band',
        'combined_sentiment_upper_band',
        'sentiment_upper'
    ],
    lower: [
        'sentiment_lower_band',
        'scaled_sentiment_lower_band',
        'combined_sentiment_lower_band',
        'sentiment_lower'
    ]
};

function plotDateValue(row) {
    return row?.date || row?.dt || row?.timestamp || null;
}

function segmentEndDateValue(rows, endIndex) {
    const next = plotDateValue(rows[endIndex + 1]);
    if (next) return next;

    const currentDate = asDate(rows[endIndex]);
    const previousDate = asDate(rows[endIndex - 1]);
    if (currentDate && previousDate) {
        const step = Math.max(DAY_MS, currentDate.getTime() - previousDate.getTime());
        return new Date(currentDate.getTime() + step).toISOString();
    }
    if (currentDate) return new Date(currentDate.getTime() + DAY_MS).toISOString();
    return plotDateValue(rows[endIndex]);
}

function thresholdStateStyle(kind) {
    const styles = {
        price_high: { fillcolor: MODULE_TA_PANEL_VISUALS.priceHighFill, width: 0 },
        price_low: { fillcolor: MODULE_TA_PANEL_VISUALS.priceLowFill, width: 0 },
        sentiment_high: { fillcolor: MODULE_TA_PANEL_VISUALS.sentimentHighFill, width: 0 },
        sentiment_low: { fillcolor: MODULE_TA_PANEL_VISUALS.sentimentLowFill, width: 0 },
        combined_high: { fillcolor: MODULE_TA_PANEL_VISUALS.combinedHighFill, width: 1 },
        combined_low: { fillcolor: MODULE_TA_PANEL_VISUALS.combinedLowFill, width: 1 },
        combined_mixed: { fillcolor: MODULE_TA_PANEL_VISUALS.combinedMixedFill, width: 1 }
    };
    return styles[kind] || null;
}

function rsiSentimentThresholdStates(rows = []) {
    const source = Array.isArray(rows) ? rows : [];
    const sentimentValue = seriesForFirstSupportedField(source, MODULE_SENTIMENT_THRESHOLD_FIELDS.value, 0.12, 5);
    const sentimentUpper = seriesForFirstSupportedField(source, MODULE_SENTIMENT_THRESHOLD_FIELDS.upper, 0.10, 3);
    const sentimentLower = seriesForFirstSupportedField(source, MODULE_SENTIMENT_THRESHOLD_FIELDS.lower, 0.10, 3);

    if (!sentimentValue || !sentimentUpper || !sentimentLower) {
        return source.map(() => null);
    }

    return source.map((row, index) => {
        const value = asNumber(sentimentValue.y[index]);
        const upper = asNumber(sentimentUpper.y[index]);
        const lower = asNumber(sentimentLower.y[index]);

        if (value !== null && upper !== null && value > upper) return 'high';
        if (value !== null && lower !== null && value < lower) return 'low';
        return null;
    });
}

function buildRsiZoneBackgroundShapes() {
    return [
        {
            type: 'rect',
            xref: 'paper',
            yref: 'y4',
            x0: 0,
            x1: 1,
            y0: 70,
            y1: 100,
            fillcolor: MODULE_TA_PANEL_VISUALS.rsiUpperZoneFill,
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            layer: 'below'
        },
        {
            type: 'rect',
            xref: 'paper',
            yref: 'y4',
            x0: 0,
            x1: 1,
            y0: 0,
            y1: 30,
            fillcolor: MODULE_TA_PANEL_VISUALS.rsiLowerZoneFill,
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            layer: 'below'
        }
    ];
}

function horizontalRailShape(yref, y, color) {
    return {
        type: 'line',
        xref: 'paper',
        yref,
        x0: 0,
        x1: 1,
        y0: y,
        y1: y,
        line: { color, width: 1 },
        layer: 'below'
    };
}

function buildRsiRailShapes() {
    return [
        horizontalRailShape('y4', 70, MODULE_TA_PANEL_VISUALS.rsiUpperRail),
        horizontalRailShape('y4', 50, MODULE_TA_PANEL_VISUALS.rsiMidRail),
        horizontalRailShape('y4', 30, MODULE_TA_PANEL_VISUALS.rsiLowerRail)
    ];
}

function buildStochRsiRailShapes() {
    return [
        horizontalRailShape('y5', 80, MODULE_TA_PANEL_VISUALS.stochUpperRail),
        horizontalRailShape('y5', 50, MODULE_TA_PANEL_VISUALS.stochMidRail),
        horizontalRailShape('y5', 20, MODULE_TA_PANEL_VISUALS.stochLowerRail)
    ];
}

function buildStochRsiZoneBackgroundShapes() {
    return [
        {
            type: 'rect',
            xref: 'paper',
            yref: 'y5',
            x0: 0,
            x1: 1,
            y0: 80,
            y1: 100,
            fillcolor: MODULE_TA_PANEL_VISUALS.stochUpperZoneFill,
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            layer: 'below'
        },
        {
            type: 'rect',
            xref: 'paper',
            yref: 'y5',
            x0: 0,
            x1: 1,
            y0: 0,
            y1: 20,
            fillcolor: MODULE_TA_PANEL_VISUALS.stochLowerZoneFill,
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            layer: 'below'
        }
    ];
}

function addRsiZoneFillTracePair(traces, x, y, baseline, fillcolor, name) {
    const active = y.map(value => asNumber(value) !== null);
    if (!active.some(Boolean)) return;

    traces.push({
        type: 'scatter',
        mode: 'lines',
        name: `${name} baseline`,
        x,
        y: active.map(isActive => isActive ? baseline : null),
        yaxis: 'y4',
        line: { width: 0, color: 'rgba(0,0,0,0)' },
        hoverinfo: 'skip',
        showlegend: false,
        connectgaps: false
    });

    traces.push({
        type: 'scatter',
        mode: 'lines',
        name,
        x,
        y,
        yaxis: 'y4',
        line: { width: 0, color: 'rgba(0,0,0,0)' },
        fill: 'tonexty',
        fillcolor,
        hoverinfo: 'skip',
        showlegend: false,
        connectgaps: false
    });
}

function rsiGradientFillColor(direction, layerName) {
    const colors = {
        high: {
            soft: MODULE_TA_PANEL_VISUALS.rsiHighSoftFill,
            mid: MODULE_TA_PANEL_VISUALS.rsiHighMidFill,
            deep: MODULE_TA_PANEL_VISUALS.rsiHighDeepFill
        },
        low: {
            soft: MODULE_TA_PANEL_VISUALS.rsiLowSoftFill,
            mid: MODULE_TA_PANEL_VISUALS.rsiLowMidFill,
            deep: MODULE_TA_PANEL_VISUALS.rsiLowDeepFill
        }
    };
    return colors[direction]?.[layerName] || MODULE_TA_PANEL_VISUALS.priceHighFill;
}

function buildRsiLayerValues(rsiValues = [], spec = {}) {
    return rsiValues.map(value => {
        const n = asNumber(value);
        if (n === null) return null;

        if (spec.direction === 'high') {
            if (n <= spec.baseline) return null;
            return Math.min(n, spec.cap);
        }

        if (n >= spec.baseline) return null;
        return Math.max(n, spec.cap);
    });
}

function addRsiGradientLayer(traces, x, rsiValues, spec) {
    const y = buildRsiLayerValues(rsiValues, spec);
    addRsiZoneFillTracePair(
        traces,
        x,
        y,
        spec.baseline,
        rsiGradientFillColor(spec.direction, spec.layerName),
        spec.name
    );
}

function buildRsiZoneFillTraces(rows = [], x = [], rsi = null) {
    const source = Array.isArray(rows) ? rows : [];
    if (!source.length || !rsi || !Array.isArray(rsi.y)) return [];

    const traces = [];

    [
        { direction: 'high', layerName: 'soft', baseline: 70, cap: 80, name: 'RSI 70-80 gradient fill' },
        { direction: 'high', layerName: 'mid', baseline: 80, cap: 90, name: 'RSI 80-90 gradient fill' },
        { direction: 'high', layerName: 'deep', baseline: 90, cap: 100, name: 'RSI 90-100 gradient fill' },
        { direction: 'low', layerName: 'soft', baseline: 30, cap: 20, name: 'RSI 20-30 gradient fill' },
        { direction: 'low', layerName: 'mid', baseline: 20, cap: 10, name: 'RSI 10-20 gradient fill' },
        { direction: 'low', layerName: 'deep', baseline: 10, cap: 0, name: 'RSI 0-10 gradient fill' }
    ].forEach(spec => addRsiGradientLayer(traces, x, rsi.y, spec));

    return traces;
}

function buildSharedRsiExtensionTraces(x = [], rsi = null, sentimentRsi = null) {
    if (!rsi || !sentimentRsi || !Array.isArray(rsi.y) || !Array.isArray(sentimentRsi.y)) return [];

    const sharedHigh = rsi.y.map((value, index) => {
        const price = asNumber(value);
        const sentiment = asNumber(sentimentRsi.y[index]);
        if (price === null || sentiment === null) return null;
        return price > 70 && sentiment > 70 ? Math.min(price, sentiment) : null;
    });

    const sharedLow = rsi.y.map((value, index) => {
        const price = asNumber(value);
        const sentiment = asNumber(sentimentRsi.y[index]);
        if (price === null || sentiment === null) return null;
        return price < 30 && sentiment < 30 ? Math.max(price, sentiment) : null;
    });

    const traces = [];
    addRsiZoneFillTracePair(
        traces,
        x,
        sharedHigh,
        70,
        MODULE_TA_PANEL_VISUALS.rsiSharedHighFill,
        'Price + Sentiment RSI upper extension'
    );
    addRsiZoneFillTracePair(
        traces,
        x,
        sharedLow,
        30,
        MODULE_TA_PANEL_VISUALS.rsiSharedLowFill,
        'Price + Sentiment RSI lower extension'
    );

    return traces;
}

function withoutUndefinedLayoutKeys(layout = {}) {
    return Object.fromEntries(
        Object.entries(layout || {}).filter(([, value]) => value !== undefined)
    );
}

function selectYtdRows(rows) {
    const end = latestDate(rows);
    if (!end) return rows;
    const start = new Date(end.getFullYear(), 0, 1);
    return rows.filter(row => {
        const d = asDate(row);
        return d && d >= start && d <= end;
    });
}

export class PlotlyRenderer {
    static normalizeLayoutForPlotly(layout = {}) {
        const source = layout && typeof layout === 'object' ? layout : {};
        const next = withoutUndefinedLayoutKeys(source);

        ['xaxis', 'yaxis', 'yaxis2', 'yaxis3', 'yaxis4', 'yaxis5'].forEach(axisKey => {
            if (next[axisKey] && typeof next[axisKey] === 'object') {
                next[axisKey] = withoutUndefinedLayoutKeys(next[axisKey]);
            }
        });

        if (next.xaxis && !next.xaxis.anchor) next.xaxis.anchor = 'y';
        if (next.yaxis && !next.yaxis.anchor) next.yaxis.anchor = 'x';
        if (next.yaxis2 && !next.yaxis2.anchor) next.yaxis2.anchor = 'x';
        if (next.yaxis3 && !next.yaxis3.anchor) next.yaxis3.anchor = 'x';
        if (next.yaxis4 && !next.yaxis4.anchor) next.yaxis4.anchor = 'x';
        if (next.yaxis5 && !next.yaxis5.anchor) next.yaxis5.anchor = 'x';

        return next;
    }

    static async renderChart(containerId, data, layout = {}, config = {}) {
        const mutatedData = this.applyDataMutators(data);
        const safeLayout = this.normalizeLayoutForPlotly(layout);
        await window.Plotly.newPlot(containerId, mutatedData, safeLayout, config);
        this.applyVisibleWindowOptimizer(containerId);
    }

    static async renderAssetPayload(containerId, payload, state = {}, config = {}) {
        if (payload && Array.isArray(payload.data)) {
            const layout = this.withDarkDefaults(payload.layout || {}, state);
            await this.renderChart(containerId, payload.data, layout, payload.config || config || { responsive: true });
            return;
        }

        const rows = this.resolveRows(payload, state);
        const visibleRows = this.selectRowsForState(rows, state);
        const traces = this.buildPriceTraces(visibleRows, state);
        const layout = this.buildLayout(payload && payload.layout ? payload.layout : {}, state, visibleRows);

        await this.renderChart(containerId, traces, layout, config || (payload && payload.config) || { responsive: true });
    }

    static resolveRows(payload, state = {}) {
        if (!payload || typeof payload !== 'object') return [];

        const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
        const freq = String(state.currentFrequency || 'D').trim().toUpperCase();

        const candidates = [
            payload?.[freq]?.[asset],
            payload?.[freq]?.[asset.toLowerCase()],
            payload?.[freq],
            payload?.[asset],
            payload?.[asset.toLowerCase()],
            payload?.rows,
            payload?.candles
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) return candidate;
        }

        return [];
    }

    static selectRowsForState(rows, state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        const range = String(state.currentRange || '3M').trim().toUpperCase();

        if (range === 'ALL') return source;
        if (range === 'YTD') return selectYtdRows(source);

        return selectedWindowRows(source, range, { dateAccessor: asDate });
    }

    static shouldShowSentimentOverlay(state = {}) {
        const timingView = controlMode(state.currentTimingView, 'both');
        const ribbon = controlMode(state.currentRibbon, 'none');
        const sentimentRibbon = controlMode(state.currentSentimentRibbon, 'curated');
        const scaleMode = controlMode(state.currentScaleMode, 'price_overlays');

        return timingView !== 'price'
            || ribbon === 'sentiment'
            || ribbon === 'both'
            || sentimentRibbon === 'full'
            || scaleMode === 'all_visible';
    }

    static shouldShowPriceBands(state = {}) {
        const modes = this.buildControlModeSummary(state);
        const policy = this.buildBandLayerPolicy(modes);
        return modes.scaleMode !== 'price_only'
            && (policy.priceBand || policy.overlapBand || policy.allBandDiagnostics);
    }

    static shouldShowSentimentBands(state = {}) {
        const modes = this.buildControlModeSummary(state);
        const policy = this.buildBandLayerPolicy(modes);
        return modes.scaleMode !== 'price_only'
            && (policy.sentimentEnvelope || policy.allBandDiagnostics);
    }

    static shouldShowAttentionOverlay(state = {}) {
        const attention = controlMode(state.currentAttention, 'context');
        const scaleMode = controlMode(state.currentScaleMode, 'price_overlays');
        return attention === 'overlay' || attention === 'overlay_marks' || scaleMode === 'all_visible';
    }

    static shouldShowRegimeMarkers(state = {}) {
        return controlMode(state.currentRegimeLayer, 'on') !== 'off';
    }

    static buildControlModeSummary(state = {}) {
        return {
            chartType: controlMode(state.currentChartType, 'candles'),
            scaleMode: controlMode(state.currentScaleMode, 'price_overlays'),
            ribbon: controlMode(state.currentRibbon, 'none'),
            sentimentRibbon: controlMode(state.currentSentimentRibbon, 'curated'),
            regimeLayer: controlMode(state.currentRegimeLayer, 'on'),
            attention: controlMode(state.currentAttention, 'context'),
            bands: controlMode(state.currentBands, 'none'),
            timingView: controlMode(state.currentTimingView, 'both')
        };
    }

    static buildBandLayerPolicy(modes = {}) {
        const bands = controlMode(modes.bands, 'none');
        const ribbon = controlMode(modes.ribbon, 'none');
        const scaleMode = controlMode(modes.scaleMode, 'price_overlays');
        const allBandDiagnostics = bands === 'all' || bands === 'both' || scaleMode === 'all_visible';
        const overlapBand = allBandDiagnostics
            || ['contextual', 'combined_overlap', 'canonical_overlap', 'overlap'].includes(bands);

        return {
            mode: bands,
            priceBand: allBandDiagnostics || bands === 'price' || ribbon === 'price' || ribbon === 'both',
            sentimentEnvelope: allBandDiagnostics || bands === 'sentiment' || ribbon === 'sentiment' || ribbon === 'both',
            overlapBand,
            allBandDiagnostics
        };
    }

    static overlapBandName(modes = {}) {
        const bands = controlMode(modes.bands, 'none');
        if (bands === 'contextual' || bands === 'combined_overlap') return 'Combined Overlap';
        if (bands === 'overlap' || bands === 'canonical_overlap') return 'Canonical Overlap';
        return 'Overlap';
    }

    static resolveCombinedOverlapBandSeries(rows = []) {
        const source = Array.isArray(rows) ? rows : [];
        const upper = seriesForFirstSupportedField(source, [
            'boll_upper_overlap_band',
            'boll_upper_overlap_advanced',
            'combined_overlap_upper_band',
            'combined_overlap_upper',
            'contextual_overlap_upper_band',
            'contextual_overlap_upper',
            'overlap_upper_band',
            'overlap_upper'
        ], 0.10, 3);
        const lower = seriesForFirstSupportedField(source, [
            'boll_lower_overlap_band',
            'boll_lower_overlap_advanced',
            'combined_overlap_lower_band',
            'combined_overlap_lower',
            'contextual_overlap_lower_band',
            'contextual_overlap_lower',
            'overlap_lower_band',
            'overlap_lower'
        ], 0.10, 3);

        return upper && lower ? { upper, lower } : null;
    }

    static overlapBandStatus(rows = [], state = {}) {
        const modes = this.buildControlModeSummary(state);
        const policy = this.buildBandLayerPolicy(modes);
        if (!policy.overlapBand) return null;

        const overlap = this.resolveCombinedOverlapBandSeries(rows);
        if (overlap) return null;

        return {
            text: `${this.overlapBandName(modes)} model: unavailable for selected asset/range`,
            color: MODULE_CHART_VISUALS.unavailableText
        };
    }

    static hasChartStack(rows = []) {
        const source = Array.isArray(rows) ? rows : [];
        return Boolean(
            seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macd, 0.12, 5)
            || seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macdHist, 0.12, 5)
            || seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.rsi, 0.12, 5)
            || seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentRsi, 0.08, 3)
            || seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.stochRsi, 0.12, 5)
        );
    }


    static buildRegimeMarkerTraces(rows, state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length || !this.shouldShowRegimeMarkers(state)) return [];

        return MODULE_REGIME_MARKER_DEFINITIONS
            .map(definition => {
                const markerRows = source.filter(row => rowMatchesRegimeMarker(row, definition));
                if (!markerRows.length) return null;

                return {
                    type: 'scatter',
                    mode: 'markers',
                    name: `Regime: ${definition.name}`,
                    x: markerRows.map(row => row.date),
                    y: markerRows.map(row => asNumber(row.close)),
                    marker: {
                        size: definition.size,
                        symbol: definition.symbol,
                        opacity: 0.95
                    },
                    text: markerRows.map(row => regimeMarkerHoverText(row, definition)),
                    hovertemplate: '%{text}<extra></extra>'
                };
            })
            .filter(Boolean);
    }

    static regimeMarkerSummary(rows = [], state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length || !this.shouldShowRegimeMarkers(state)) return '';

        const counts = MODULE_REGIME_MARKER_DEFINITIONS
            .map(definition => ({
                name: definition.name,
                count: source.filter(row => rowMatchesRegimeMarker(row, definition)).length
            }))
            .filter(item => item.count > 0);

        if (!counts.length) return '';

        return `Markers: ${counts.map(item => `${item.name} ${item.count}`).join(' • ')}`;
    }

    static buildIndicatorStackTraces(rows, state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length) return [];

        const x = source.map(row => row.date);
        const traces = [];

        const macd = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macd, 0.12, 5);
        const macdSignal = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macdSignal, 0.12, 5);
        const macdHist = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macdHist, 0.12, 5);

        if (macdHist) {
            traces.push({
                type: 'bar',
                name: 'MACD Histogram',
                x,
                y: macdHist.y,
                yaxis: 'y3',
                marker: { opacity: MODULE_TA_PANEL_VISUALS.macdBarOpacity },
                hovertemplate: `%{x}<br>${fieldLabel(macdHist.field)}: %{y:,.4f}<extra></extra>`
            });
        }

        if (macd) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'MACD',
                x,
                y: macd.y,
                yaxis: 'y3',
                line: { width: MODULE_TA_PANEL_VISUALS.macdLineWidth },
                hovertemplate: `%{x}<br>${fieldLabel(macd.field)}: %{y:,.4f}<extra></extra>`
            });
        }

        if (macdSignal) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'MACD Signal',
                x,
                y: macdSignal.y,
                yaxis: 'y3',
                line: { width: 1, dash: 'dot' },
                hovertemplate: `%{x}<br>${fieldLabel(macdSignal.field)}: %{y:,.4f}<extra></extra>`
            });
        }

        const rsi = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.rsi, 0.12, 5);
        const sentimentRsi = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentRsi, 0.08, 3);

        if (rsi) {
            buildRsiZoneFillTraces(source, x, rsi).forEach(trace => traces.push(trace));
            buildSharedRsiExtensionTraces(x, rsi, sentimentRsi).forEach(trace => traces.push(trace));
        }

        if (sentimentRsi && (!rsi || sentimentRsi.field !== rsi.field)) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Sentiment RSI',
                x,
                y: sentimentRsi.y,
                yaxis: 'y4',
                line: {
                    color: MODULE_TA_PANEL_VISUALS.rsiSentimentLine,
                    width: 0.9
                },
                hovertemplate: `%{x}<br>${fieldLabel(sentimentRsi.field)}: %{y:,.1f}<extra></extra>`
            });
        }

        if (rsi) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'RSI glow',
                x,
                y: rsi.y,
                yaxis: 'y4',
                line: {
                    color: MODULE_TA_PANEL_VISUALS.rsiPriceGlowLine,
                    width: MODULE_TA_PANEL_VISUALS.rsiPriceGlowWidth
                },
                hoverinfo: 'skip',
                showlegend: false,
                connectgaps: false
            });

            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'RSI',
                x,
                y: rsi.y,
                yaxis: 'y4',
                line: {
                    color: MODULE_TA_PANEL_VISUALS.rsiPriceLine,
                    width: 1.45
                },
                hovertemplate: `%{x}<br>${fieldLabel(rsi.field)}: %{y:,.1f}<extra></extra>`
            });
        }

        const stochRsi = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.stochRsi, 0.12, 5);
        const sentimentStochRsi = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentStochRsi, 0.08, 3);
        const stochRsiSignal = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.stochRsiSignal, 0.12, 5);

        if (sentimentStochRsi && (!stochRsi || sentimentStochRsi.field !== stochRsi.field)) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Sentiment Stoch RSI',
                x,
                y: sentimentStochRsi.y,
                yaxis: 'y5',
                line: { color: MODULE_TA_PANEL_VISUALS.stochRsiSentimentLine, width: 0.9 },
                hovertemplate: `%{x}<br>${fieldLabel(sentimentStochRsi.field)}: %{y:,.1f}<extra></extra>`
            });
        }

        if (stochRsi) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Stoch RSI glow',
                x,
                y: stochRsi.y,
                yaxis: 'y5',
                line: {
                    color: MODULE_TA_PANEL_VISUALS.stochRsiGlowLine,
                    width: MODULE_TA_PANEL_VISUALS.stochRsiGlowWidth
                },
                hoverinfo: 'skip',
                showlegend: false,
                connectgaps: false
            });

            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Stoch RSI',
                x,
                y: stochRsi.y,
                yaxis: 'y5',
                line: { color: MODULE_TA_PANEL_VISUALS.stochRsiLine, width: 1.12 },
                hovertemplate: `%{x}<br>${fieldLabel(stochRsi.field)}: %{y:,.1f}<extra></extra>`
            });
        }

        if (stochRsiSignal) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Stoch RSI Signal',
                x,
                y: stochRsiSignal.y,
                yaxis: 'y5',
                visible: 'legendonly',
                showlegend: false,
                line: { color: MODULE_TA_PANEL_VISUALS.stochRsiSignalLine, width: 0.9 },
                hoverinfo: 'skip'
            });
        }

        return traces;
    }

    static buildPriceTraces(rows, state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length) return [];

        const x = source.map(row => row.date);
        const close = finiteSeries(source, 'close');
        const open = finiteSeries(source, 'open');
        const high = finiteSeries(source, 'high');
        const low = finiteSeries(source, 'low');

        const modes = this.buildControlModeSummary(state);
        const traces = [];

        if (modes.chartType === 'line') {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Price',
                x,
                y: close,
                line: { color: MODULE_CHART_VISUALS.priceLine, width: 1.8 },
                hovertemplate: '%{x}<br>Close: %{y:,.2f}<extra></extra>'
            });
        } else {
            traces.push({
                type: 'candlestick',
                name: 'Price',
                x,
                open,
                high,
                low,
                close,
                increasing: {
                    line: { color: MODULE_CHART_VISUALS.candleUpLine, width: 1.15 },
                    fillcolor: MODULE_CHART_VISUALS.candleUpFill
                },
                decreasing: {
                    line: { color: MODULE_CHART_VISUALS.candleDownLine, width: 1.05 },
                    fillcolor: MODULE_CHART_VISUALS.candleDownFill
                },
                whiskerwidth: 0.45,
                hovertemplate: '%{x}<br>O: %{open:,.2f}<br>H: %{high:,.2f}<br>L: %{low:,.2f}<br>C: %{close:,.2f}<extra></extra>'
            });
        }

        const bandPolicy = this.buildBandLayerPolicy(modes);

        if (this.shouldShowPriceBands(state)) {
            const priceBandFields = bandPolicy.priceBand
                ? ['close_ma_21', 'close_ma_50']
                : [];

            priceBandFields.forEach(field => {
                const y = finiteSeries(source, field);
                if (hasEnoughSeries(y, source, 0.18, 5)) {
                    traces.push({
                        type: 'scatter',
                        mode: 'lines',
                        name: fieldLabel(field),
                        x,
                        y,
                        line: { color: MODULE_CHART_VISUALS.priceBandLine, width: 1 },
                        hovertemplate: `%{x}<br>${fieldLabel(field)}: %{y:,.2f}<extra></extra>`
                    });
                }
            });

            if (bandPolicy.overlapBand) {
                const overlapBand = this.resolveCombinedOverlapBandSeries(source);
                if (overlapBand) {
                    const bandName = this.overlapBandName(modes);
                    traces.push({
                        type: 'scatter',
                        mode: 'lines',
                        name: `${bandName} Lower`,
                        x,
                        y: overlapBand.lower.y,
                        line: { color: MODULE_CHART_VISUALS.overlapBandLine, width: 1 },
                        legendgroup: 'combined-overlap',
                        hovertemplate: `%{x}<br>${bandName} Lower: %{y:,.2f}<extra></extra>`
                    });
                    traces.push({
                        type: 'scatter',
                        mode: 'lines',
                        name: `${bandName} Upper`,
                        x,
                        y: overlapBand.upper.y,
                        line: { color: MODULE_CHART_VISUALS.overlapBandLine, width: 1 },
                        fill: 'tonexty',
                        fillcolor: MODULE_CHART_VISUALS.overlapBandFill,
                        legendgroup: 'combined-overlap',
                        hovertemplate: `%{x}<br>${bandName} Upper: %{y:,.2f}<extra></extra>`
                    });
                }
            }
        }

        if (this.shouldShowSentimentOverlay(state)) {
            const sentimentFields = modes.sentimentRibbon === 'full'
                ? ['scaled_combined_compound_ma_7', 'scaled_combined_compound_ma_21', 'scaled_combined_compound_ma_50']
                : ['scaled_combined_compound_ma_21'];

            sentimentFields.forEach((field, index) => {
                const y = finiteSeries(source, field);
                if (hasEnoughSeries(y, source, 0.18, 5)) {
                    traces.push({
                        type: 'scatter',
                        mode: 'lines',
                        name: index === 0 && modes.sentimentRibbon !== 'full' ? 'Sentiment MA' : fieldLabel(field),
                        x,
                        y,
                        line: { width: index === 0 ? 1.2 : 0.9 },
                        hovertemplate: `%{x}<br>${fieldLabel(field)}: %{y:,.2f}<extra></extra>`
                    });
                }
            });
        }

        if (this.shouldShowSentimentBands(state)) {
            const upperSentiment = finiteSeries(source, 'sentiment_upper_band');
            const lowerSentiment = finiteSeries(source, 'sentiment_lower_band');
            if (hasEnoughSeries(upperSentiment, source, 0.10, 3) && hasEnoughSeries(lowerSentiment, source, 0.10, 3)) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Sentiment Upper',
                    x,
                    y: upperSentiment,
                    line: { width: 1 },
                    hoverinfo: 'skip'
                });
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Sentiment Lower',
                    x,
                    y: lowerSentiment,
                    line: { width: 1 },
                    fill: 'tonexty',
                    hoverinfo: 'skip'
                });
            }
        }

        if (this.shouldShowAttentionOverlay(state)) {
            const attention = finiteSeries(source, 'attention_level_score');
            if (hasEnoughSeries(attention, source, 0.18, 5)) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Attention',
                    x,
                    y: attention,
                    yaxis: 'y2',
                    line: { width: 1, dash: 'dot' },
                    hovertemplate: '%{x}<br>Attention: %{y:,.1f}<extra></extra>'
                });
            }
        }

        if (modes.scaleMode === 'all_visible') {
            const dashboardScore = finiteSeries(source, 'seta_dashboard_summary_score');
            if (hasEnoughSeries(dashboardScore, source, 0.18, 5)) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Structure Score',
                    x,
                    y: dashboardScore,
                    yaxis: 'y2',
                    line: { width: 1 },
                    hovertemplate: '%{x}<br>Structure Score: %{y:,.1f}<extra></extra>'
                });
            }
        }

        this.buildRegimeMarkerTraces(source, state).forEach(trace => traces.push(trace));

        this.buildIndicatorStackTraces(source, state).forEach(trace => traces.push(trace));

        return traces;
    }

    static buildLayout(baseLayout = {}, state = {}, rows = []) {
        const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
        const freq = String(state.currentFrequency || 'D').trim().toUpperCase();
        const range = String(state.currentRange || '3M').trim().toUpperCase();
        const freqLabel = freq === 'W' ? 'Weekly' : 'Daily';
        const modes = this.buildControlModeSummary(state);
        const showSecondaryAxis = modes.scaleMode === 'all_visible' || modes.attention === 'overlay' || modes.attention === 'overlay_marks';
        const showChartStack = this.hasChartStack(rows);
        const priceDomain = showChartStack ? [0.42, 1] : [0, 1];
        const regimeSummary = this.regimeMarkerSummary(rows, state);
        const overlapStatus = this.overlapBandStatus(rows, state);
        const rsiZoneBackgroundShapes = showChartStack ? buildRsiZoneBackgroundShapes() : [];
        const rsiRailShapes = showChartStack ? buildRsiRailShapes() : [];
        const stochRsiZoneBackgroundShapes = showChartStack ? buildStochRsiZoneBackgroundShapes() : [];
        const stochRsiRailShapes = showChartStack ? buildStochRsiRailShapes() : [];

        return {
            ...this.withDarkDefaults(baseLayout, state),
            title: {
                text: `${asset} • ${freqLabel} • ${range}`,
                font: { color: MODULE_CHART_VISUALS.primaryText, size: 15 },
                x: 0.5,
                xanchor: 'center',
                y: 0.985
            },
            xaxis: {
                ...(baseLayout.xaxis || {}),
                type: 'date',
                anchor: 'y',
                rangeslider: { visible: false },
                gridcolor: MODULE_CHART_VISUALS.gridSubtle,
                zeroline: false,
                zerolinecolor: MODULE_CHART_VISUALS.zeroLine,
                linecolor: MODULE_CHART_VISUALS.axisLine,
                tickfont: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 },
                showspikes: true,
                spikemode: 'across',
                spikecolor: 'rgba(155,220,255,0.18)',
                spikethickness: 1
            },
            yaxis: {
                ...(baseLayout.yaxis || {}),
                title: { text: 'Price', font: { color: MODULE_CHART_VISUALS.secondaryText, size: 11 } },
                anchor: 'x',
                domain: priceDomain,
                autorange: true,
                fixedrange: false,
                gridcolor: MODULE_CHART_VISUALS.grid,
                zerolinecolor: MODULE_CHART_VISUALS.zeroLine,
                linecolor: MODULE_CHART_VISUALS.axisLine,
                tickfont: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 },
                tickformat: ',~s'
            },
            ...(showSecondaryAxis ? {
                yaxis2: {
                    ...(baseLayout.yaxis2 || {}),
                    title: { text: 'Context', font: { color: MODULE_CHART_VISUALS.mutedText, size: 10 } },
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    showgrid: false,
                    zeroline: false,
                    rangemode: 'tozero',
                    domain: priceDomain,
                    tickfont: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                }
            } : {}),
            ...(showChartStack ? {
                yaxis3: {
                    title: { text: 'MACD', font: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 } },
                    anchor: 'x',
                    domain: [0.285, 0.405],
                    zeroline: true,
                    zerolinecolor: MODULE_TA_PANEL_VISUALS.zeroLine,
                    zerolinewidth: 1,
                    gridcolor: MODULE_CHART_VISUALS.gridSubtle,
                    linecolor: MODULE_CHART_VISUALS.axisLine,
                    tickfont: { color: MODULE_CHART_VISUALS.secondaryText, size: 9 },
                    showline: true,
                    mirror: false
                },
                yaxis4: {
                    title: { text: 'RSI', font: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 } },
                    anchor: 'x',
                    domain: [0.145, 0.265],
                    range: [0, 100],
                    tickvals: [30, 50, 70],
                    ticktext: ['30', '50', '70'],
                    gridcolor: MODULE_TA_PANEL_VISUALS.midline,
                    linecolor: MODULE_CHART_VISUALS.axisLine,
                    zeroline: false,
                    tickfont: { color: 'rgba(154,168,184,0.70)', size: 9 },
                    showline: true,
                    mirror: false
                },
                yaxis5: {
                    title: { text: 'Stoch RSI', font: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 } },
                    anchor: 'x',
                    domain: [0, 0.125],
                    range: [0, 100],
                    tickvals: [20, 50, 80],
                    ticktext: ['20', '50', '80'],
                    gridcolor: MODULE_TA_PANEL_VISUALS.midline,
                    linecolor: MODULE_CHART_VISUALS.axisLine,
                    zeroline: false,
                    tickfont: { color: 'rgba(154,168,184,0.64)', size: 9 },
                    showline: true,
                    mirror: false
                }
            } : {}),
            showlegend: true,
            legend: {
                orientation: 'v',
                bgcolor: 'rgba(8,12,18,0.35)',
                bordercolor: 'rgba(148,163,184,0.16)',
                borderwidth: 1,
                font: { color: MODULE_CHART_VISUALS.secondaryText, size: 10 }
            },
            margin: { l: 62, r: showSecondaryAxis ? 68 : 38, t: 56, b: showChartStack ? 68 : 42, ...(baseLayout.margin || {}) },
            shapes: [
                ...((baseLayout && Array.isArray(baseLayout.shapes)) ? baseLayout.shapes : []),
                ...rsiZoneBackgroundShapes,
                ...rsiRailShapes,
                ...stochRsiZoneBackgroundShapes,
                ...stochRsiRailShapes
            ],
            annotations: [
                ...((baseLayout && Array.isArray(baseLayout.annotations)) ? baseLayout.annotations : []),
                ...(showChartStack ? [
                    {
                        text: 'MACD momentum',
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.985,
                        y: 0.397,
                        xanchor: 'right',
                        showarrow: false,
                        font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                    },
                    {
                        text: 'RSI pressure',
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.985,
                        y: 0.257,
                        xanchor: 'right',
                        showarrow: false,
                        font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                    },
                    {
                        text: 'Stoch timing',
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.985,
                        y: 0.117,
                        xanchor: 'right',
                        showarrow: false,
                        font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                    }
                ] : []),
                ...(regimeSummary ? [{
                    text: regimeSummary,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0,
                    y: 1.08,
                    showarrow: false,
                    font: { color: '#9bdcff', size: 10 },
                    align: 'left'
                }] : []),
                ...(overlapStatus ? [{
                    text: overlapStatus.text,
                    xref: 'paper',
                    yref: 'paper',
                    x: 0,
                    y: 1.035,
                    showarrow: false,
                    font: { color: overlapStatus.color, size: 10 },
                    align: 'left'
                }] : []),
                {
                    text: rows.length
                        ? `SETA chart context • ${rows.length} rows • ${modes.chartType} / ${modes.scaleMode}${showChartStack ? ' • chart stack' : ''}${regimeSummary ? ' • regime markers' : ''}`
                        : 'SETA chart context • no rows found',
                    xref: 'paper',
                    yref: 'paper',
                    x: 1,
                    y: 1.08,
                    showarrow: false,
                    font: { color: rows.length ? '#7ee787' : '#ff7b72', size: 10 },
                    align: 'right'
                }
            ]
        };
    }


    static withDarkDefaults(layout = {}, state = {}) {
        return {
            ...layout,
            paper_bgcolor: layout.paper_bgcolor || MODULE_CHART_VISUALS.paperBg,
            plot_bgcolor: layout.plot_bgcolor || MODULE_CHART_VISUALS.plotBg,
            font: layout.font || { color: MODULE_CHART_VISUALS.primaryText },
            dragmode: layout.dragmode || 'pan',
            hoverlabel: layout.hoverlabel || {
                bgcolor: 'rgba(8,12,18,0.96)',
                bordercolor: 'rgba(155,220,255,0.22)',
                font: { color: MODULE_CHART_VISUALS.primaryText, size: 11 }
            }
        };
    }

    static applyDataMutators(data) {
        if (!data || !Array.isArray(data)) return data;
        return data.map(trace => {
            if (trace.name === 'MACD Histogram' || (trace.type === 'bar' && trace.yaxis === 'y3')) {
                return { ...trace, width: DAY_MS * 0.8 };
            }
            return trace;
        });
    }

    static applyVisibleWindowOptimizer(containerId) {
        const container = document.getElementById(containerId);
        if (!container || typeof container.on !== 'function') return;
        container.on('plotly_relayout', (eventData) => {
            if (eventData['xaxis.range[0]'] && eventData['xaxis.range[1]']) {
                console.log("PlotlyRenderer: Visible window optimized for pan/zoom.");
            }
        });
    }
}
