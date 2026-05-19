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
    candleUpLine: 'rgba(226,232,240,0.92)',
    candleUpFill: 'rgba(226,232,240,0.72)',
    candleDownLine: 'rgba(125,133,144,0.82)',
    candleDownFill: 'rgba(82,92,108,0.54)',
    priceLine: '#d7dee8',
    priceBandLine: 'rgba(155,220,255,0.38)',
    priceBandFill: 'rgba(155,220,255,0.032)',
    priceBandBasisLine: 'rgba(155,220,255,0.18)',
    priceMaRibbonLine: 'rgba(155,220,255,0.50)',
    priceMaRibbonSoftLine: 'rgba(155,220,255,0.26)',
    sentimentMaRibbonLine: 'rgba(242,204,96,0.46)',
    sentimentMaRibbonSoftLine: 'rgba(242,204,96,0.24)',
    sentimentRibbonLine: 'rgba(242,204,96,0.34)',
    sentimentRibbonFill: 'rgba(242,204,96,0.030)',
    overlapBandLine: 'rgba(242,204,96,0.58)',
    overlapBandFill: 'rgba(242,204,96,0.070)',
    attentionMarkerLine: 'rgba(242,204,96,0.86)',
    attentionMarkerFill: 'rgba(242,204,96,0.18)',
    attentionMarkerHalo: 'rgba(242,204,96,0.075)',
    attentionBullLine: 'rgba(126,231,135,0.88)',
    attentionBullFill: 'rgba(126,231,135,0.20)',
    attentionBullHalo: 'rgba(126,231,135,0.075)',
    attentionBearLine: 'rgba(255,123,114,0.90)',
    attentionBearFill: 'rgba(255,123,114,0.20)',
    attentionBearHalo: 'rgba(255,123,114,0.080)',
    attentionNeutralLine: 'rgba(242,204,96,0.86)',
    attentionNeutralFill: 'rgba(242,204,96,0.18)',
    attentionNeutralHalo: 'rgba(242,204,96,0.075)',
    unavailableText: '#f2cc60'
};

const MODULE_SENTIMENT_VISUALS = {
    legendLine: 'rgba(255,214,102,0.78)',
    line: 'rgba(242,204,96,0.42)',
    lineSoft: 'rgba(242,204,96,0.26)',
    histPositive: 'rgba(242,204,96,0.105)',
    histNegative: 'rgba(155,180,255,0.075)'
};

const MODULE_MACD_PANEL_VISUALS = {
    macdLine: 'rgba(255,132,204,0.92)',
    macdGlowLine: 'rgba(255,132,204,0.10)',
    macdGlowWidth: 3.75,
    macdSignalLine: 'rgba(255,132,204,0.38)',
    sentimentMacdLine: MODULE_SENTIMENT_VISUALS.line,
    sentimentMacdSignalLine: MODULE_SENTIMENT_VISUALS.lineSoft,
    sentimentMacdHistPositive: MODULE_SENTIMENT_VISUALS.histPositive,
    sentimentMacdHistNegative: MODULE_SENTIMENT_VISUALS.histNegative,
    macdZeroRail: 'rgba(170,155,130,0.22)',
    macdHistPositiveStrong: 'rgba(197,120,92,0.48)',
    macdHistPositiveSoft: 'rgba(197,120,92,0.26)',
    macdHistNegativeStrong: 'rgba(135,120,190,0.42)',
    macdHistNegativeSoft: 'rgba(135,120,190,0.22)'
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
    rsiSentimentLine: MODULE_SENTIMENT_VISUALS.line,
    stochRsiLine: 'rgba(126,231,185,0.68)',
    stochRsiGlowLine: 'rgba(126,231,185,0.095)',
    stochRsiGlowWidth: 3.25,
    stochRsiSentimentLine: MODULE_SENTIMENT_VISUALS.line,
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

function seriesForFirstAvailableField(rows, fields = []) {
    const source = Array.isArray(rows) ? rows : [];
    for (const field of fields) {
        const y = finiteSeries(source, field);
        if (hasEnoughSeries(y, source, 0.18, 5)) {
            return { field, y };
        }
    }
    return null;
}

function bandPairFromFieldFamilies(rows, upperFields = [], lowerFields = [], basisFields = []) {
    const source = Array.isArray(rows) ? rows : [];
    const upper = seriesForFirstAvailableField(source, upperFields);
    const lower = seriesForFirstAvailableField(source, lowerFields);
    if (!upper || !lower) return null;

    const basis = seriesForFirstAvailableField(source, basisFields);
    return {
        upper,
        lower,
        basis,
        source: 'field'
    };
}

function rollingCloseStddev(rows, period = 20, minPeriods = 10) {
    const source = Array.isArray(rows) ? rows : [];
    const closes = source.map(row => asNumber(row?.close));
    const out = new Array(source.length).fill(null);

    for (let index = 0; index < closes.length; index += 1) {
        const start = Math.max(0, index - period + 1);
        const values = closes
            .slice(start, index + 1)
            .filter(value => value !== null && Number.isFinite(value));

        if (values.length < minPeriods) continue;

        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        out[index] = Math.sqrt(variance);
    }

    return out;
}

function computeSharedVolatilityBands(rows, centerFields = [], freq = 'D') {
    const source = Array.isArray(rows) ? rows : [];
    const center = seriesForFirstAvailableField(source, centerFields);
    if (!center) return null;

    const normalizedFreq = String(freq || 'D').trim().toUpperCase();
    const minPeriods = normalizedFreq === 'W' ? 4 : 10;
    const stddev = rollingCloseStddev(source, 20, minPeriods);

    const upper = center.y.map((value, index) => {
        const centerValue = asNumber(value);
        const width = asNumber(stddev[index]);
        return centerValue === null || width === null ? null : centerValue + 2 * width;
    });

    const lower = center.y.map((value, index) => {
        const centerValue = asNumber(value);
        const width = asNumber(stddev[index]);
        return centerValue === null || width === null ? null : centerValue - 2 * width;
    });

    if (!hasEnoughSeries(upper, source, 0.18, 5) || !hasEnoughSeries(lower, source, 0.18, 5)) return null;

    return {
        upper: { field: `${center.field}_tableau_upper`, y: upper },
        lower: { field: `${center.field}_tableau_lower`, y: lower },
        basis: center,
        source: 'computed_tableau_shared_volatility'
    };
}

function resolveTableauPriceBandSeries(rows, freq = 'D') {
    return bandPairFromFieldFamilies(
        rows,
        [
            'boll_upper_price_calc_7',
            'price_Upper_Band',
            'price_upper_band',
            'price_upper',
            'boll_upper_price_band'
        ],
        [
            'boll_lower_price_calc_7',
            'price_Lower_Band',
            'price_lower_band',
            'price_lower',
            'boll_lower_price_band'
        ],
        [
            'close_ma_7',
            'boll_price_basis_calc_20',
            'close_ma_21'
        ]
    ) || computeSharedVolatilityBands(rows, ['close_ma_7', 'close_ma_21', 'close'], freq);
}

function resolveTableauSentimentBandSeries(rows, freq = 'D') {
    return bandPairFromFieldFamilies(
        rows,
        [
            'boll_upper_sent_calc_7',
            'sentiment_Upper_Band',
            'scaled_sentiment_upper_band',
            'combined_sentiment_upper_band',
            'sentiment_price_upper_band'
        ],
        [
            'boll_lower_sent_calc_7',
            'sentiment_Lower_Band',
            'scaled_sentiment_lower_band',
            'combined_sentiment_lower_band',
            'sentiment_price_lower_band'
        ],
        [
            'boll_centerline_sent_calc_7',
            'scaled_combined_compound_ma_7',
            'scaled_combined_compound_ma_21'
        ]
    ) || computeSharedVolatilityBands(
        rows,
        ['scaled_combined_compound_ma_7', 'scaled_combined_compound_ma_21', 'scaled_combined_compound'],
        freq
    );
}

function deriveTableauOverlapBandSeries(priceBand, sentimentBand) {
    const priceUpper = Array.isArray(priceBand?.upper?.y) ? priceBand.upper.y : null;
    const priceLower = Array.isArray(priceBand?.lower?.y) ? priceBand.lower.y : null;
    const sentimentUpper = Array.isArray(sentimentBand?.upper?.y) ? sentimentBand.upper.y : null;
    const sentimentLower = Array.isArray(sentimentBand?.lower?.y) ? sentimentBand.lower.y : null;

    if (!priceUpper || !priceLower || !sentimentUpper || !sentimentLower) return null;

    const length = Math.max(priceUpper.length, priceLower.length, sentimentUpper.length, sentimentLower.length);
    const upper = new Array(length).fill(null);
    const lower = new Array(length).fill(null);

    for (let index = 0; index < length; index += 1) {
        const pu = asNumber(priceUpper[index]);
        const pl = asNumber(priceLower[index]);
        const su = asNumber(sentimentUpper[index]);
        const sl = asNumber(sentimentLower[index]);

        if ([pu, pl, su, sl].some(value => value === null)) continue;

        let hi = null;
        let lo = null;

        if (pu >= sl && su >= pl) {
            hi = Math.max(Math.min(pu, su), pl);
            lo = Math.min(Math.max(pl, sl), pu);
        } else {
            hi = Math.abs(pu - sl) < Math.abs(su - pl) ? Math.max(pu, pl) : Math.max(su, pl);
            lo = Math.abs(pl - su) < Math.abs(sl - pu) ? Math.min(pl, pu) : Math.min(sl, pu);
        }

        if (hi !== null && lo !== null && hi < lo) {
            const tmp = hi;
            hi = lo;
            lo = tmp;
        }

        upper[index] = hi;
        lower[index] = lo;
    }

    if (!compact(upper).length || !compact(lower).length) return null;

    return {
        upper: { field: 'derived_tableau_overlap_upper', y: upper },
        lower: { field: 'derived_tableau_overlap_lower', y: lower },
        source: 'computed_tableau_overlap'
    };
}

function addBandEnvelopeTraces(traces, x, band, {
    name,
    lineColor,
    fillColor,
    width = 1,
    legendgroup,
    hoverPrefix = name,
    showLowerLegend = false,
    showUpperLegend = true,
    legendrank
}) {
    if (!band?.upper?.y || !band?.lower?.y) return;

    const lowerWidth = Math.max(0.55, width * 0.72);

    traces.push({
        type: 'scatter',
        mode: 'lines',
        name: `${name} Lower`,
        x,
        y: band.lower.y,
        line: { color: lineColor, width: lowerWidth },
        opacity: 0.76,
        legendgroup,
        showlegend: showLowerLegend,
        hovertemplate: `%{x}<br>${hoverPrefix} Lower: %{y:,.2f}<extra></extra>`
    });

    traces.push({
        type: 'scatter',
        mode: 'lines',
        name,
        x,
        y: band.upper.y,
        line: { color: lineColor, width },
        opacity: 0.88,
        fill: 'tonexty',
        fillcolor: fillColor,
        legendgroup,
        showlegend: showUpperLegend,
        ...(Number.isFinite(legendrank) ? { legendrank } : {}),
        hovertemplate: `%{x}<br>${hoverPrefix} Upper: %{y:,.2f}<extra></extra>`
    });
}

function rollingMeanSeries(rows, sourceField, window) {
    const source = Array.isArray(rows) ? rows : [];
    const values = source.map(row => finiteNumber(row?.[sourceField]));
    const output = new Array(values.length).fill(null);
    let sum = 0;
    let count = 0;
    const queue = [];

    values.forEach((value, index) => {
        queue.push(value);
        if (Number.isFinite(value)) {
            sum += value;
            count += 1;
        }

        if (queue.length > window) {
            const removed = queue.shift();
            if (Number.isFinite(removed)) {
                sum -= removed;
                count -= 1;
            }
        }

        const minPeriods = Math.max(5, Math.ceil(window * 0.35));
        if (count >= minPeriods) {
            output[index] = sum / count;
        }
    });

    return output;
}

function movingAverageSeriesForField(rows, field) {
    const direct = finiteSeries(rows, field);
    if (hasEnoughSeries(direct, rows, 0.18, 5)) return direct;

    const match = String(field || '').match(/^(.*)_ma_(\d+)$/);
    if (!match) return direct;

    const sourceField = match[1];
    const window = Number.parseInt(match[2], 10);
    if (!Number.isFinite(window) || window <= 1) return direct;

    return rollingMeanSeries(rows, sourceField, window);
}

function maPeriodFromField(field) {
    const match = String(field || '').match(/_ma_(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : null;
}

function maStackLineStyle(field, stackKind = 'price') {
    const period = maPeriodFromField(field);
    const priceStyles = {
        7: { color: 'rgba(180,232,255,0.86)', width: 1.34, opacity: 0.94 },
        21: { color: 'rgba(120,190,235,0.66)', width: 1.14, opacity: 0.82 },
        100: { color: 'rgba(92,128,160,0.44)', width: 0.96, opacity: 0.68 },
        200: { color: 'rgba(65,92,120,0.35)', width: 0.86, opacity: 0.58 }
    };
    const sentimentStyles = {
        7: { color: 'rgba(255,214,112,0.46)', width: 0.82, opacity: 0.54 },
        21: { color: 'rgba(234,182,78,0.62)', width: 1.12, opacity: 0.78 },
        100: { color: 'rgba(164,124,62,0.42)', width: 0.90, opacity: 0.62 },
        200: { color: 'rgba(120,90,52,0.32)', width: 0.80, opacity: 0.52 }
    };

    const fallback = stackKind === 'sentiment'
        ? { color: 'rgba(242,204,96,0.48)', width: 0.92, opacity: 0.64 }
        : { color: 'rgba(155,220,255,0.48)', width: 1.00, opacity: 0.70 };

    return (stackKind === 'sentiment' ? sentimentStyles : priceStyles)[period] || fallback;
}

function addMovingAverageRibbonTraces(traces, x, rows, {
    name,
    fields = [],
    lineColor,
    softLineColor,
    legendgroup,
    legendrank,
    width = 0.95,
    stackKind = 'price'
}) {
    const source = Array.isArray(rows) ? rows : [];
    const series = fields
        .map(field => ({ field, y: movingAverageSeriesForField(source, field) }))
        .filter(item => hasEnoughSeries(item.y, source, 0.18, 5));

    if (series.length < 2) return;

    series.forEach((item, index) => {
        const isLegendTrace = index === 0;
        const traceName = isLegendTrace ? name : `${name} ${fieldLabel(item.field)}`;
        const style = maStackLineStyle(item.field, stackKind);

        traces.push({
            type: 'scatter',
            mode: 'lines',
            name: traceName,
            x,
            y: item.y,
            line: {
                color: style.color || (isLegendTrace ? lineColor : softLineColor),
                width: style.width || (isLegendTrace ? width : Math.max(0.62, width * (0.88 - index * 0.08)))
            },
            opacity: style.opacity ?? (isLegendTrace ? 0.88 : Math.max(0.44, 0.70 - index * 0.08)),
            legendgroup,
            showlegend: isLegendTrace,
            ...(Number.isFinite(legendrank) ? { legendrank } : {}),
            hovertemplate: `%{x}<br>${fieldLabel(item.field)}: %{y:,.2f}<extra></extra>`
        });
    });
}

function buildMovingAverageRibbonTraces(rows = [], x = [], modes = {}) {
    const traces = [];
    const ribbon = controlMode(modes.ribbon, 'none');
    const sentimentRibbon = controlMode(modes.sentimentRibbon, 'curated');
    const scaleMode = controlMode(modes.scaleMode, 'price_overlays');

    if (scaleMode === 'price_only') return traces;

    if (ribbon === 'price' || ribbon === 'both') {
        addMovingAverageRibbonTraces(traces, x, rows, {
            name: 'Price MA Stack',
            fields: ['close_ma_7', 'close_ma_21', 'close_ma_100', 'close_ma_200'],
            lineColor: MODULE_CHART_VISUALS.priceMaRibbonLine,
            softLineColor: MODULE_CHART_VISUALS.priceMaRibbonSoftLine,
            legendgroup: 'price-ma-ribbon',
            legendrank: 18,
            width: 1.12,
            stackKind: 'price'
        });
    }

    if (ribbon === 'sentiment' || ribbon === 'both') {
        const sentimentFields = sentimentRibbon === 'full'
            ? ['scaled_combined_compound_ma_21', 'scaled_combined_compound_ma_7', 'scaled_combined_compound_ma_100', 'scaled_combined_compound_ma_200']
            : ['scaled_combined_compound_ma_21', 'scaled_combined_compound_ma_100', 'scaled_combined_compound_ma_200'];

        addMovingAverageRibbonTraces(traces, x, rows, {
            name: 'Sentiment MA Stack',
            fields: sentimentFields,
            lineColor: MODULE_CHART_VISUALS.sentimentMaRibbonLine,
            softLineColor: MODULE_CHART_VISUALS.sentimentMaRibbonSoftLine,
            legendgroup: 'sentiment-ma-ribbon',
            legendrank: 28,
            width: 0.98,
            stackKind: 'sentiment'
        });
    }

    return traces;
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


function escapeHoverValue(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function finiteNumber(value) {
    const n = asNumber(value);
    return n === null ? NaN : n;
}

function finiteQuantile(values = [], q = 0.75) {
    const xs = compact(values).sort((a, b) => a - b);
    if (!xs.length) return null;
    if (xs.length === 1) return xs[0];

    const position = Math.max(0, Math.min(1, q)) * (xs.length - 1);
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    const weight = position - lower;

    return xs[lower] + (xs[upper] - xs[lower]) * weight;
}

const MODULE_ATTENTION_SCORE_FIELDS = [
    'attention_level_score',
    'attention_priority_score',
    'screener_attention_priority_score',
    'attention_regime_score',
    'attention_spike_score',
    'attention_participation_score'
];

const MODULE_ATTENTION_FLAG_FIELDS = [
    'attention_spike_flag',
    'attention_spike',
    'attention_spike_detected',
    'screener_attention_spike',
    'screener_attention_spike_flag',
    'participation_spike_flag',
    'engagement_spike_flag'
];

const MODULE_ATTENTION_LABEL_FIELDS = [
    'attention_priority_label',
    'screener_attention_priority_label',
    'attention_regime_label',
    'attention_context_label',
    'attention_label',
    'participation_label',
    'engagement_label'
];

const MODULE_TFIDF_TEXT_FIELDS = [
    'attention_tfidf_summary',
    'attention_keyword_summary',
    'attention_topic_summary',
    'attention_theme_summary',
    'tfidf_tooltip',
    'tfidf_summary',
    'tf_idf_summary',
    'top_tfidf_summary',
    'keyword_summary',
    'keywords_summary',
    'narrative_keywords',
    'narrative_keyword_summary',
    'source_keyword_summary',
    'article_keyword_summary',
    'news_keyword_summary',
    'reddit_keyword_summary',
    'bsky_keyword_summary'
];

const MODULE_TFIDF_TOKEN_FIELDS = [
    'attention_tfidf_keywords',
    'attention_keywords',
    'attention_terms',
    'attention_topics',
    'attention_themes',
    'tfidf_keywords',
    'tf_idf_keywords',
    'top_tfidf_keywords',
    'top_keywords',
    'keywords',
    'keyword_terms',
    'dominant_keywords',
    'theme_keywords',
    'top_terms',
    'terms',
    'article_keywords',
    'news_keywords',
    'reddit_keywords',
    'bsky_keywords',
    'source_keywords'
];

function firstAttentionScore(row) {
    return firstRowValue(row, MODULE_ATTENTION_SCORE_FIELDS);
}

function firstAttentionLabel(row) {
    return firstRowValue(row, MODULE_ATTENTION_LABEL_FIELDS);
}

function hasAttentionSpikeFlag(row) {
    return markerFlag(row, MODULE_ATTENTION_FLAG_FIELDS);
}

function normalizeKeywordTokens(value, limit = 5) {
    if (value === null || value === undefined || value === '') return [];

    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === 'string') return item;

                if (item && typeof item === 'object') {
                    const term = item.term || item.keyword || item.text || item.token || item.word || item.label;
                    const score = asNumber(item.score ?? item.tfidf ?? item.tf_idf ?? item.weight ?? item.value);
                    if (!term) return '';
                    return score === null ? String(term) : `${term} (${score.toFixed(score >= 10 ? 0 : 2)})`;
                }

                return '';
            })
            .flatMap(item => normalizeKeywordTokens(item, limit))
            .slice(0, limit);
    }

    if (typeof value === 'object') {
        return Object.entries(value)
            .sort((a, b) => (asNumber(b[1]) ?? 0) - (asNumber(a[1]) ?? 0))
            .map(([term, score]) => {
                const n = asNumber(score);
                return n === null ? term : `${term} (${n.toFixed(n >= 10 ? 0 : 2)})`;
            })
            .slice(0, limit);
    }

    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
    if (!text || text.toLowerCase() === 'nan') return [];

    if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
        try {
            return normalizeKeywordTokens(JSON.parse(text), limit);
        } catch (_) {
            // Fall through to delimiter parsing.
        }
    }

    return text
        .split(/[|,;•\n]+/)
        .map(part => part.trim().replace(/^['"\[]+|['"\]]+$/g, ''))
        .map(part => part.replace(/\s*[:=]\s*-?\d+(?:\.\d+)?$/, ''))
        .filter(part => part && part.toLowerCase() !== 'nan')
        .slice(0, limit);
}

function narrativeKeywordAssetTerms(row) {
    const values = [
        firstRowValue(row, ['term', 'db_term', 'asset', 'ticker', 'symbol', 'asset_ticker', 'asset_symbol']),
        firstRowValue(row, ['term_display', 'asset_name'])
    ];

    const terms = new Set();

    values.forEach(value => {
        String(value ?? '')
            .split(/[,\s|;/]+/)
            .map(part => part.trim().toLowerCase())
            .filter(Boolean)
            .forEach(part => {
                if (part && part !== 'nan') terms.add(part);
            });
    });

    return terms;
}

function formatNarrativeKeywordToken(value, assetTerms = new Set()) {
    const raw = String(value || '')
        .replace(/[_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!raw || /^nan$/i.test(raw)) return '';

    const lower = raw.toLowerCase();
    const generic = new Set([
        'strong', 'weak', 'new', 'news', 'stock', 'stocks', 'share', 'shares',
        'market', 'markets', 'price', 'prices', 'today', 'week', 'daily',
        'update', 'report', 'company', 'companies', 'million', 'billion',
        'buy', 'sell'
    ]);

    if (generic.has(lower)) return '';

    const fixedCaseMap = {
        ai: 'AI',
        etf: 'ETF',
        etfs: 'ETFs',
        sec: 'SEC',
        cpi: 'CPI',
        fed: 'Fed',
        usa: 'US',
        us: 'US',
        usd: 'USD',
        jpy: 'JPY',
        ev: 'EV',
        evs: 'EVs',
        defi: 'DeFi',
        iphone: 'iPhone',
        openai: 'OpenAI',
        nvidia: 'NVIDIA'
    };

    if (assetTerms.has(lower)) return lower.toUpperCase();
    if (fixedCaseMap[lower]) return fixedCaseMap[lower];

    return lower
        .split(' ')
        .map((part, index) => {
            if (assetTerms.has(part)) return part.toUpperCase();
            if (fixedCaseMap[part]) return fixedCaseMap[part];
            if (part.length <= 2) return part;
            return index === 0
                ? `${part.charAt(0).toUpperCase()}${part.slice(1)}`
                : part;
        })
        .join(' ');
}

function narrativeKeywordAliasTokens(values) {
    const present = new Set(values.map(value => String(value).toLowerCase()));
    const aliases = new Map([
        ['apple', ['aapl']],
        ['coinbase', ['coin']],
        ['microsoft', ['msft']],
        ['nvidia', ['nvda']],
        ['tesla', ['tsla']],
        ['google', ['googl', 'goog']],
        ['alphabet', ['googl', 'goog']],
        ['meta', ['meta']],
        ['amazon', ['amzn']],
        ['netflix', ['nflx']]
    ]);

    const redundant = new Set();

    aliases.forEach((tickers, readable) => {
        if (!present.has(readable)) return;
        tickers.forEach(ticker => {
            if (present.has(ticker)) redundant.add(ticker);
        });
    });

    return redundant;
}

function dedupeNarrativeKeywordList(keywords, assetTerms = new Set(), limit = 4) {
    const values = Array.isArray(keywords) ? keywords.filter(Boolean) : [];
    const lowerValues = new Set(values.map(value => String(value).toLowerCase()));
    const aliasRedundant = narrativeKeywordAliasTokens(values);

    const compact = values.filter(value => {
        const lower = String(value).toLowerCase();

        if (aliasRedundant.has(lower)) return false;

        // Suppress active ticker tokens when a cleaner brand/name token is already present.
        // Example: Apple + AAPL -> keep Apple, drop AAPL.
        if (assetTerms.has(lower)) {
            const hasReadableCompanion = values.some(other => {
                const otherLower = String(other).toLowerCase();
                return otherLower !== lower
                    && !assetTerms.has(otherLower)
                    && otherLower.length > 3
                    && !/^[A-Z0-9.:-]+$/.test(String(other));
            });

            if (hasReadableCompanion) return false;
        }

        return lowerValues.has(lower);
    });

    return compact.slice(0, limit);
}

function compactNarrativeKeywords(value, limit = 4, row = null) {
    const seen = new Set();
    const formatted = [];
    const assetTerms = narrativeKeywordAssetTerms(row);

    normalizeKeywordTokens(value, limit + 6).forEach(term => {
        const clean = formatNarrativeKeywordToken(term, assetTerms);
        const key = clean.toLowerCase();
        if (!clean || seen.has(key)) return;
        seen.add(key);
        formatted.push(clean);
    });

    return dedupeNarrativeKeywordList(formatted, assetTerms, limit).join(' · ');
}

function keywordSummaryFromRow(row, limit = 4) {
    const direct = firstRowValue(row, MODULE_TFIDF_TEXT_FIELDS);
    if (direct) {
        const compact = compactNarrativeKeywords(direct, limit, row);
        if (compact) return compact;
    }

    const seen = new Set();
    const keywords = [];
    const assetTerms = narrativeKeywordAssetTerms(row);

    for (const field of MODULE_TFIDF_TOKEN_FIELDS) {
        normalizeKeywordTokens(row?.[field], limit + 4).forEach(term => {
            const clean = formatNarrativeKeywordToken(term, assetTerms);
            const key = clean.toLowerCase();
            if (!clean || seen.has(key)) return;
            seen.add(key);
            keywords.push(clean);
        });

        if (keywords.length >= limit) break;
    }

    return dedupeNarrativeKeywordList(keywords, assetTerms, limit).join(' · ');
}

function cleanAttentionContextPhrase(value) {
    let text = String(value ?? '')
        .replace(/[_]+/g, ' ')
        .replace(/[|]+/g, ';')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text || /^nan$/i.test(text) || /^null$/i.test(text) || /^none$/i.test(text)) return '';

    text = text
        .replace(/\bNone Inside\b/gi, '')
        .replace(/\bNone Outside\b/gi, '')
        .replace(/\bnot available\b/gi, '')
        .replace(/\s*[-–—]>\s*/g, ' → ')
        .replace(/\s*[;]\s*/g, '; ')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return '';

    const lower = text.toLowerCase();

    if (/high volume|volume/i.test(text)) return 'High volume';
    if (/broad|breadth|participation/i.test(text)) return 'Broad participation';
    if (/crowded/i.test(text)) return /bear/i.test(text) ? 'Crowded bearish pressure' : 'Crowded attention';
    if (/bearish expansion/i.test(text)) return 'Bearish expansion';
    if (/bullish expansion/i.test(text)) return 'Bullish expansion';
    if (/rejection/i.test(text)) return 'Rejection pressure';
    if (/transition/i.test(text)) return 'Transition pressure';
    if (/flat/i.test(text)) return 'Flat / mixed pressure';
    if (/mixed|neutral|low \/ mixed/i.test(text)) return 'Mixed pressure';
    if (/bull/i.test(text) && !/bear/i.test(text)) return 'Constructive pressure';
    if (/bear|risk[-\s]?off/i.test(text) && !/bull/i.test(text)) return 'Risk-off pressure';

    return text.length > 44 ? `${text.slice(0, 41).trim()}...` : text;
}

function attentionNarrativeContextFromRow(row) {
    const rawValues = [
        firstRowValue(row, [
            'attention_context',
            'attention_context_summary',
            'attention_reason',
            'attention_driver',
            'attention_explanation'
        ]),
        firstRowValue(row, [
            'seta_dashboard_summary_label',
            'seta_summary_label',
            'dashboard_summary_label'
        ]),
        firstRowValue(row, [
            'sent_ribbon_transition_type',
            'sent_ribbon_regime_raw',
            'sentiment_regime',
            'ribbon_regime'
        ]),
        firstRowValue(row, [
            'boll_overlap_volume_confirmation_flag',
            'boll_volatility_flag',
            'volume_regime',
            'participation_regime'
        ])
    ];

    const pieces = [];

    rawValues.forEach(value => {
        String(value ?? '')
            .split(/[;|]/)
            .map(cleanAttentionContextPhrase)
            .filter(Boolean)
            .forEach(phrase => pieces.push(phrase));
    });

    const seen = new Set();
    const unique = pieces.filter(value => {
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const priority = [
        'Risk-off pressure',
        'Constructive pressure',
        'Bearish expansion',
        'Bullish expansion',
        'Transition pressure',
        'Mixed pressure',
        'Broad participation',
        'High volume'
    ];

    const ordered = [
        ...priority.filter(item => unique.includes(item)),
        ...unique.filter(item => !priority.includes(item))
    ];

    const joined = ordered.slice(0, 3).join(' · ');
    return joined.length > 92 ? `${joined.slice(0, 89).trim()}...` : joined;
}

function attentionSpikeThreshold(rows = []) {
    const scores = rows
        .map(row => asNumber(firstAttentionScore(row)))
        .filter(value => value !== null);

    if (!scores.length) return null;

    const q85 = finiteQuantile(scores, 0.85);
    const maxScore = Math.max(...scores);

    if (maxScore <= 1.5) return Math.max(0.72, q85 ?? 0.72);
    return Math.max(58, q85 ?? 58);
}

function attentionSecondaryThreshold(rows = []) {
    const scores = rows
        .map(row => asNumber(firstAttentionScore(row)))
        .filter(value => value !== null);

    if (!scores.length) return null;

    const q70 = finiteQuantile(scores, 0.70);
    const maxScore = Math.max(...scores);

    if (maxScore <= 1.5) return Math.max(0.55, q70 ?? 0.55);
    return Math.max(42, q70 ?? 42);
}

function attentionHighlightLimit(rows = []) {
    const count = Array.isArray(rows) ? rows.length : 0;
    if (count <= 45) return 6;
    if (count <= 100) return 10;
    if (count <= 180) return 14;
    return 18;
}

function rowHasAttentionLabelSpike(row) {
    const text = String(firstAttentionLabel(row) || '').toLowerCase();
    return ['spike', 'elevated', 'high', 'hot', 'surge', 'breakout'].some(token => text.includes(token));
}

function rowLooksLikeAttentionSpike(row, threshold = null) {
    const score = asNumber(firstAttentionScore(row));
    return hasAttentionSpikeFlag(row)
        || rowHasAttentionLabelSpike(row)
        || (score !== null && threshold !== null && score >= threshold);
}

function calibratedAttentionLevelLabel(score) {
    const value = asNumber(score);
    if (value === null) return '';

    if (value < 10) return 'Quiet';
    if (value < 20) return 'Baseline';
    if (value < 35) return 'Active';
    if (value < 50) return 'Elevated';
    if (value < 65) return 'High';
    return 'Extreme';
}

function calibratedAttentionConvictionLabel(signedConviction) {
    const value = asNumber(signedConviction);
    if (value === null) return '';

    if (value <= -35) return 'Strong risk-off';
    if (value <= -20) return 'Risk-off';
    if (value <= -8) return 'Leaning risk-off';
    if (value < 8) return 'Mixed / weak';
    if (value < 20) return 'Leaning constructive';
    if (value < 35) return 'Constructive';
    return 'Strong constructive';
}

function attentionParticipationLabel(value) {
    const text = String(value ?? '').trim();
    const numeric = asNumber(value);

    if (numeric !== null) {
        if (numeric >= 75) return 'Broad';
        if (numeric >= 45) return 'Moderate';
        if (numeric > 0) return 'Narrow';
    }

    if (/broad|wide|high/i.test(text)) return 'Broad';
    if (/moderate|medium|mixed/i.test(text)) return 'Moderate';
    if (/narrow|low|thin/i.test(text)) return 'Narrow';

    return '';
}

function splitAttentionContext(context) {
    const pieces = String(context || '')
        .split(/\s*·\s*/)
        .map(part => part.trim())
        .filter(Boolean);

    const regime = pieces.find(part => /expansion|transition|pressure|rejection|risk[-\s]?off|constructive|mixed/i.test(part)) || '';
    const participation = pieces
        .filter(part => /participation|volume|crowded|broad/i.test(part))
        .slice(0, 2)
        .join(' · ');

    return { regime, participation };
}

function attentionContextHoverFragment(row, { includeKeywords = false, compactMode = false, threshold = null } = {}) {
    const score = asNumber(firstAttentionScore(row));
    const label = firstAttentionLabel(row);
    const participation = firstRowValue(row, ['attention_participation_score', 'participation_score', 'engagement_score']);
    const signedConviction = attentionSignedConviction(row);
    const direction = firstRowValue(row, ['signal_consensus_direction_label', 'direction_label', 'direction', 'screener_direction_label']);
    const keywords = includeKeywords || rowLooksLikeAttentionSpike(row, threshold)
        ? keywordSummaryFromRow(row)
        : '';
    const context = keywords ? '' : attentionNarrativeContextFromRow(row);
    const contextParts = splitAttentionContext(context);

    const attentionLevel = calibratedAttentionLevelLabel(score);
    const convictionLabel = calibratedAttentionConvictionLabel(signedConviction);
    const participationLabel = attentionParticipationLabel(participation) || contextParts.participation;

    const lines = [];

    if (attentionLevel) {
        lines.push(`<b>Attention level</b>: ${escapeHoverValue(attentionLevel)}`);
    } else if (label) {
        lines.push(`<b>Attention</b>: ${escapeHoverValue(label)}`);
    }

    if (convictionLabel) {
        lines.push(`<b>Conviction</b>: ${escapeHoverValue(convictionLabel)}`);
    } else if (direction) {
        lines.push(`<b>Direction</b>: ${escapeHoverValue(direction)}`);
    }

    if (contextParts.regime) {
        lines.push(`<b>Regime context</b>: ${escapeHoverValue(contextParts.regime)}`);
    }

    if (!compactMode && participationLabel) {
        lines.push(`<b>Participation</b>: ${escapeHoverValue(participationLabel)}`);
    }

    if (keywords) {
        lines.push(`<b>Narrative keywords</b>: ${escapeHoverValue(keywords)}`);
    } else if (context && !contextParts.regime && !participationLabel) {
        lines.push(`<b>Context</b>: ${escapeHoverValue(context)}`);
    }

    if (!lines.length) return '';
    return `<br>${lines.join('<br>')}`;
}

function attentionDirectionScore(row) {
    return asNumber(firstRowValue(row, [
        'signal_consensus_direction_score',
        'screener_signal_consensus_direction_score',
        'screener_direction_score',
        'direction_score',
        'signal_consensus_score',
        'direction_confidence',
        'consensus_direction_score',
        'source_direction_score'
    ]));
}

function attentionSignedConviction(row) {
    return asNumber(firstRowValue(row, [
        'attention_conviction_score_signed',
        'attention_signed_conviction_score',
        'attention_direction_score_signed',
        'signed_attention_score',
        'attention_polarity_score'
    ]));
}

function rowHasAttentionContext(row) {
    return firstAttentionScore(row) !== null
        || attentionDirectionScore(row) !== null
        || Boolean(firstAttentionLabel(row))
        || Boolean(firstRowValue(row, [
            'signal_consensus_direction_label',
            'direction_label',
            'direction',
            'screener_direction_label'
        ]));
}

function attentionMarkerRank(row, threshold = null) {
    const score = asNumber(firstAttentionScore(row));
    const directionScore = attentionDirectionScore(row);
    const explicit = hasAttentionSpikeFlag(row) || rowHasAttentionLabelSpike(row);
    const thresholdHit = score !== null && threshold !== null && score >= threshold;
    const hasDirection = attentionDirectionKind(row) !== 'neutral';

    let rank = 0;
    if (explicit) rank += 1000;
    if (thresholdHit) rank += 450;
    if (hasDirection) rank += 160;
    if (score !== null) rank += score <= 1.5 ? score * 100 : score;
    if (directionScore !== null) rank += Math.abs(directionScore - 50) * 1.8;

    return rank;
}

function attentionMarkerRows(rows = [], maxMarkers = null) {
    const source = Array.isArray(rows) ? rows : [];
    const threshold = attentionSpikeThreshold(source);
    const secondaryThreshold = attentionSecondaryThreshold(source);
    const limit = maxMarkers ?? attentionHighlightLimit(source);

    const candidates = source
        .map((row, index) => {
            const close = asNumber(row?.close);
            if (close === null || !rowHasAttentionContext(row)) return null;

            const explicit = hasAttentionSpikeFlag(row) || rowHasAttentionLabelSpike(row);
            const score = asNumber(firstAttentionScore(row));
            const signedConviction = attentionSignedConviction(row);
            const directionScore = attentionDirectionScore(row);
            const directionKnown = attentionDirectionKind(row) !== 'neutral';
            const highAttention = score !== null && threshold !== null && score >= threshold;
            const elevatedAttention = score !== null && secondaryThreshold !== null && score >= secondaryThreshold;
            const signedPulse = signedConviction !== null && Math.abs(signedConviction) >= 6;
            const strongDirection = directionScore !== null && Math.abs(directionScore - 50) >= 13;

            if (!explicit && !highAttention && !(elevatedAttention && (signedPulse || directionKnown || strongDirection))) {
                return null;
            }

            const rank = attentionMarkerRank(row, threshold)
                + (highAttention ? 240 : 0)
                + (elevatedAttention ? 100 : 0)
                + (signedPulse ? Math.min(220, Math.abs(signedConviction) * 6) : 0)
                + (strongDirection ? 60 : 0);

            return { row, index, rank, explicit, score: score ?? 0 };
        })
        .filter(Boolean);

    if (!candidates.length) return [];

    const selected = [];
    const sorted = candidates.slice().sort((a, b) => b.rank - a.rank);
    const minGap = Math.max(2, Math.round(source.length / Math.max(7, limit * 2.2)));

    sorted.forEach(candidate => {
        if (selected.length >= limit) return;
        const tooClose = selected.some(item => Math.abs(item.index - candidate.index) < minGap);
        if (!tooClose || candidate.explicit) selected.push(candidate);
    });

    return selected
        .sort((a, b) => a.index - b.index)
        .map(item => item.row);
}

function attentionMarkerSize(row) {
    const score = asNumber(firstAttentionScore(row));
    if (score === null) return 9;

    const normalized = score <= 1.5 ? score * 100 : score;
    return Math.max(8, Math.min(15, 8 + normalized / 16));
}

function attentionDirectionText(row) {
    return [
        firstRowValue(row, [
            'signal_consensus_direction_label',
            'screener_signal_consensus_direction_label',
            'screener_direction_label',
            'consensus_direction_label',
            'direction_label',
            'direction',
            'source_direction_label'
        ]),
        firstRowValue(row, [
            'sentiment_label',
            'sentiment_direction',
            'compound_label',
            'combined_compound_label',
            'source_sentiment_label',
            'ribbon_direction_label'
        ]),
        firstAttentionLabel(row)
    ]
        .filter(value => value !== null && value !== undefined && value !== '')
        .join(' ')
        .toLowerCase();
}

function attentionDirectionKind(row) {
    const signedConviction = attentionSignedConviction(row);
    const text = attentionDirectionText(row);
    const score = attentionDirectionScore(row);
    const sentiment = asNumber(firstRowValue(row, [
        'combined_compound',
        'compound',
        'sentiment_compound',
        'weighted_sentiment',
        'avg_sentiment',
        'sentiment_score'
    ]));

    if (signedConviction !== null && Math.abs(signedConviction) >= 1.25) {
        return signedConviction > 0 ? 'bull' : 'bear';
    }

    if (/bear|risk[-\s]?off|negative|down|sell|weak|fragile|distribution|breakdown|fear|panic/.test(text)) {
        return 'bear';
    }

    if (/bull|risk[-\s]?on|positive|up|buy|strong|constructive|accumulation|breakout|supportive/.test(text)) {
        return 'bull';
    }

    if (score !== null) {
        if (score >= 57) return 'bull';
        if (score <= 43) return 'bear';
    }

    if (sentiment !== null) {
        if (sentiment > 0.08) return 'bull';
        if (sentiment < -0.08) return 'bear';
    }

    return 'neutral';
}

function attentionMarkerStyle(row) {
    const kind = attentionDirectionKind(row);
    if (kind === 'bull') {
        return {
            kind,
            label: 'Constructive attention',
            line: MODULE_CHART_VISUALS.attentionBullLine,
            fill: MODULE_CHART_VISUALS.attentionBullFill,
            halo: MODULE_CHART_VISUALS.attentionBullHalo
        };
    }

    if (kind === 'bear') {
        return {
            kind,
            label: 'Risk-off attention',
            line: MODULE_CHART_VISUALS.attentionBearLine,
            fill: MODULE_CHART_VISUALS.attentionBearFill,
            halo: MODULE_CHART_VISUALS.attentionBearHalo
        };
    }

    return {
        kind,
        label: 'Mixed attention',
        line: MODULE_CHART_VISUALS.attentionNeutralLine,
        fill: MODULE_CHART_VISUALS.attentionNeutralFill,
        halo: MODULE_CHART_VISUALS.attentionNeutralHalo
    };
}

function attentionMarkerHoverText(row) {
    const style = attentionMarkerStyle(row);
    const parts = [
        `<b>${style.label}</b>`,
        hoverText('Date', firstRowValue(row, ['date', 'dt', 'timestamp']), 48),
        hoverNumber('Close', firstRowValue(row, ['close', 'latest_close', 'price']), 2)
    ].filter(Boolean);

    const context = attentionContextHoverFragment(row, {
        includeKeywords: true,
        compactMode: false
    });

    return `${parts.join('<br>')}${context}`;
}

function attentionHighlightWidthMs(rows = []) {
    const dates = (Array.isArray(rows) ? rows : [])
        .map(asDate)
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length < 2) return DAY_MS * 0.7;

    const steps = [];
    for (let index = 1; index < dates.length; index += 1) {
        const step = dates[index].getTime() - dates[index - 1].getTime();
        if (Number.isFinite(step) && step > 0) steps.push(step);
    }

    if (!steps.length) return DAY_MS * 0.7;

    steps.sort((a, b) => a - b);
    const medianStep = steps[Math.floor(steps.length / 2)];
    return Math.max(DAY_MS * 0.65, Math.min(DAY_MS * 7.0, medianStep * 1.05));
}

function attentionHighlightPriceRange(rows = []) {
    const source = Array.isArray(rows) ? rows : [];
    const lows = source
        .map(row => asNumber(row?.low ?? row?.close))
        .filter(value => value !== null);
    const highs = source
        .map(row => asNumber(row?.high ?? row?.close))
        .filter(value => value !== null);

    if (!lows.length || !highs.length) return null;

    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const spread = Math.max(1, max - min);
    const pad = spread * 0.045;

    return {
        base: min - pad,
        height: spread + pad * 2
    };
}

function buildAttentionMarkerTraces(rows = []) {
    const markerRows = attentionMarkerRows(rows);
    const range = attentionHighlightPriceRange(rows);

    if (!markerRows.length || !range) return [];

    return [
        {
            type: 'bar',
            name: 'Attention Highlights',
            legendrank: 55,
            x: markerRows.map(row => row.date),
            y: markerRows.map(() => range.height),
            base: markerRows.map(() => range.base),
            width: attentionHighlightWidthMs(rows),
            marker: {
                color: markerRows.map(row => attentionMarkerStyle(row).fill),
                line: {
                    color: markerRows.map(row => attentionMarkerStyle(row).line),
                    width: 0.25
                }
            },
            opacity: 0.40,
            text: markerRows.map(row => attentionMarkerHoverText(row)),
            hovertemplate: '%{text}<extra></extra>'
        }
    ];
}




const MODULE_STRUCTURE_STRIP_FIELDS = [
    'screener_attention_priority_score',
    'screener_structure_score',
    'structure_score',
    'signal_structure_score',
    'seta_dashboard_summary_score',
    'seta_score',
    'dashboard_score'
];


function objectPathValue(source, path, fallback = null) {
    let cursor = source;
    for (const key of String(path || '').split('.')) {
        if (cursor && Object.prototype.hasOwnProperty.call(cursor, key)) {
            cursor = cursor[key];
        } else {
            return fallback;
        }
    }
    return cursor ?? fallback;
}

function screenerStoreItemForAsset(state = {}) {
    const asset = String(state.currentAsset || '').trim().toUpperCase();
    if (!asset) return null;

    const store = state.screenerStore || {};
    const byTerm = store.by_term || store.byTerm || store.assets || store.terms || {};

    if (Array.isArray(byTerm)) {
        return byTerm.find(item => {
            const ticker = String(
                item?.ticker || item?.term || item?.asset || item?.symbol || item?.db_term || ''
            ).trim().toUpperCase();
            return ticker === asset;
        }) || null;
    }

    return byTerm?.[asset] || byTerm?.[asset.toLowerCase()] || null;
}

function currentStructureReadoutScore(state = {}) {
    const item = screenerStoreItemForAsset(state);
    if (!item || typeof item !== 'object') return null;

    const paths = [
        'screener.structure_score',
        'screener.structureScore',
        'screener.signal_structure_score',
        'screener.signalStructureScore',
        'screener.screener_attention_priority_score',
        'screener.attention_priority_score',
        'screener.priority_score',
        'screener.priorityScore',
        'archetype.structure_score',
        'archetype.structureScore',
        'archetype.archetype_confidence',
        'archetype.archetypeConfidence',
        'archetype.confidence_score',
        'archetype.confidenceScore',
        'indicators.structure_score',
        'indicators.structureScore',
        'indicators.signal_structure_score',
        'indicators.signalStructureScore',
        'structure_score',
        'structureScore',
        'signal_structure_score',
        'signalStructureScore',
        'screener_attention_priority_score',
        'attention_priority_score',
        'priority_score',
        'priorityScore',
        'score'
    ];

    for (const path of paths) {
        const n = asNumber(objectPathValue(item, path));
        if (n !== null) return n;
    }

    return null;
}

function structureScoreForStripRow(row = {}, index = 0, rows = [], state = {}) {
    const latestIndex = Math.max(0, (Array.isArray(rows) ? rows.length : 0) - 1);
    const override = index === latestIndex ? currentStructureReadoutScore(state) : null;
    if (override !== null) return override;

    for (const field of MODULE_STRUCTURE_STRIP_FIELDS) {
        const n = asNumber(row?.[field]);
        if (n !== null) return n;
    }

    return null;
}


function structureScoreStripQuality(score) {
    const n = asNumber(score);
    if (n === null) return null;
    if (n >= 82) return 'strong';
    if (n >= 68) return 'constructive';
    if (n >= 50) return 'mixed';
    if (n >= 35) return 'weak';
    return 'stressed';
}

function structureScoreStripLabel(score) {
    const n = asNumber(score);
    if (n === null) return '';
    if (n >= 82) return 'Strong structure';
    if (n >= 68) return 'Constructive structure';
    if (n >= 50) return 'Mixed structure';
    if (n >= 35) return 'Weak structure';
    return 'Stressed structure';
}

function structureScoreStripColor(quality) {
    const colors = {
        strong: 'rgba(126,231,135,0.36)',
        constructive: 'rgba(126,231,135,0.24)',
        mixed: 'rgba(242,204,96,0.22)',
        weak: 'rgba(255,191,105,0.27)',
        stressed: 'rgba(255,123,114,0.34)'
    };
    return colors[quality] || 'rgba(148,163,184,0.10)';
}

function structureScoreStripDirection(row = {}) {
    const fields = [
        'direction_label',
        'signal_consensus_direction_label',
        'seta_dashboard_direction_label',
        'screener_direction_label',
        'bias_label'
    ];

    for (const field of fields) {
        const value = row?.[field];
        if (value !== undefined && value !== null && String(value).trim()) {
            return cleanDisplayText(value);
        }
    }

    return '';
}

function structureScoreStripHoverY(rows = []) {
    const source = Array.isArray(rows) ? rows : [];
    const lows = source
        .map(row => asNumber(row?.low ?? row?.close))
        .filter(value => value !== null);
    const highs = source
        .map(row => asNumber(row?.high ?? row?.close))
        .filter(value => value !== null);

    if (!lows.length || !highs.length) return null;

    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const spread = Math.max(1, max - min);
    return min + spread * 0.065;
}

function buildStructureScoreStripHoverTrace(rows = [], state = {}) {
    const source = Array.isArray(rows) ? rows : [];
    if (!source.length) return null;

    const series = seriesForFirstSupportedField(source, MODULE_STRUCTURE_STRIP_FIELDS, 0.12, 5);
    const hoverY = structureScoreStripHoverY(source);

    if (!series || !Array.isArray(series.y) || hoverY === null) return null;

    const x = source.map(row => plotDateValue(row));
    const y = source.map((row, index) => structureScoreForStripRow(row, index, source, state) === null ? null : hoverY);

    const customdata = source.map((row, index) => {
        const score = structureScoreForStripRow(row, index, source, state);
        if (score === null) return ['', '', ''];

        return [
            score.toFixed(1),
            structureScoreStripLabel(score),
            structureScoreStripDirection(row)
        ];
    });

    const validCount = customdata.filter(item => item[0]).length;
    if (validCount < 5) return null;

    return {
        type: 'scatter',
        mode: 'markers',
        name: 'Structure',
        x,
        y,
        customdata,
        showlegend: false,
        hovertemplate: '%{x}<br>Structure Score: %{customdata[0]}<br>%{customdata[1]}%{customdata[2]:+}<extra></extra>'.replace('%{customdata[2]:+}', '%{customdata[2]}'),
        marker: {
            size: 12,
            color: 'rgba(242,204,96,0.01)',
            line: { color: 'rgba(0,0,0,0)', width: 0 }
        },
        opacity: 0.01
    };
}

function buildStructureScoreStripShapes(rows = [], priceDomain = [0, 1], state = {}) {
    const source = Array.isArray(rows) ? rows : [];
    if (!source.length) return [];

    const series = seriesForFirstSupportedField(source, MODULE_STRUCTURE_STRIP_FIELDS, 0.12, 5);
    if (!series || !Array.isArray(series.y)) return [];

    const y0 = Math.max(0, Math.min(1, (priceDomain?.[0] ?? 0) + 0.006));
    const y1 = Math.max(0, Math.min(1, y0 + 0.018));

    const states = source.map((row, index) => structureScoreStripQuality(structureScoreForStripRow(row, index, source, state)));
    const shapes = [];
    let startIndex = null;
    let activeQuality = null;

    const closeSegment = endIndex => {
        if (startIndex === null || !activeQuality) return;
        const x0 = plotDateValue(source[startIndex]);
        const x1 = segmentEndDateValue(source, endIndex);
        if (!x0 || !x1) return;

        shapes.push({
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0,
            x1,
            y0,
            y1,
            fillcolor: structureScoreStripColor(activeQuality),
            line: { color: 'rgba(0,0,0,0)', width: 0 },
            layer: 'below'
        });
    };

    states.forEach((quality, index) => {
        if (!quality) {
            closeSegment(index - 1);
            startIndex = null;
            activeQuality = null;
            return;
        }

        if (startIndex === null) {
            startIndex = index;
            activeQuality = quality;
            return;
        }

        if (quality !== activeQuality) {
            closeSegment(index - 1);
            startIndex = index;
            activeQuality = quality;
        }
    });

    closeSegment(states.length - 1);

    return shapes;
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

function regimeMarkerHoverText(row, definition, options = {}) {
    const parts = [
        `Marker: ${definition.name}`,
        hoverText('Date', firstRowValue(row, ['date', 'dt', 'timestamp']), 48),
        hoverNumber('Close', firstRowValue(row, ['close', 'latest_close', 'price']), 2),
        hoverText('Ribbon', firstRowValue(row, ['sentiment_ribbon_state', 'sent_ribbon_state', 'sentiment_ribbon', 'ribbon_state']), 72),
        hoverText('Regime', firstRowValue(row, ['regime_label', 'regime', 'market_regime', 'context_regime']), 72),
        hoverNumber('Structure Score', firstRowValue(row, ['seta_dashboard_summary_score', 'seta_score', 'dashboard_score']), 1),
        options.includeAttention === false ? '' : hoverNumber('Attention', firstRowValue(row, ['attention_level_score', 'attention_priority_score', 'screener_attention_priority_score']), 1),
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
    sentimentMacd: [
        'scaled_sentiment_macd',
        'sentiment_macd',
        'sentiment_macd_line',
        'sent_macd',
        'sent_macd_line',
        'combined_sentiment_macd',
        'combined_sentiment_macd_line',
        'combined_compound_macd',
        'combined_compound_macd_line',
        'scaled_combined_compound_macd',
        'scaled_combined_compound_macd_line'
    ],
    sentimentMacdSignal: [
        'scaled_sentiment_macd_signal',
        'sentiment_macd_signal',
        'sent_macd_signal',
        'combined_sentiment_macd_signal',
        'combined_compound_macd_signal',
        'scaled_combined_compound_macd_signal'
    ],
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

function derivedSeriesDelta(primary, signal) {
    const primaryY = Array.isArray(primary?.y) ? primary.y : [];
    const signalY = Array.isArray(signal?.y) ? signal.y : [];
    const length = Math.max(primaryY.length, signalY.length);

    const y = Array.from({ length }, (_, index) => {
        const a = asNumber(primaryY[index]);
        const b = asNumber(signalY[index]);
        return a === null || b === null ? null : a - b;
    });

    return compact(y).length ? { field: `${primary?.field || 'primary'} - ${signal?.field || 'signal'}`, y } : null;
}

function sentimentMacdHistogramColors(values = []) {
    return values.map(value => {
        const current = asNumber(value);
        if (current === null) return MODULE_MACD_PANEL_VISUALS.sentimentMacdHistPositive;
        return current >= 0
            ? MODULE_MACD_PANEL_VISUALS.sentimentMacdHistPositive
            : MODULE_MACD_PANEL_VISUALS.sentimentMacdHistNegative;
    });
}

function macdHistogramColors(values = []) {
    return values.map((value, index) => {
        const current = asNumber(value);
        const previous = index > 0 ? asNumber(values[index - 1]) : null;

        if (current === null) return MODULE_MACD_PANEL_VISUALS.macdHistPositiveSoft;

        const expanding = previous === null
            ? Math.abs(current) > 0
            : Math.abs(current) >= Math.abs(previous);

        if (current >= 0) {
            return expanding
                ? MODULE_MACD_PANEL_VISUALS.macdHistPositiveStrong
                : MODULE_MACD_PANEL_VISUALS.macdHistPositiveSoft;
        }

        return expanding
            ? MODULE_MACD_PANEL_VISUALS.macdHistNegativeStrong
            : MODULE_MACD_PANEL_VISUALS.macdHistNegativeSoft;
    });
}

function buildMacdZeroRailShape() {
    return {
        type: 'line',
        xref: 'paper',
        yref: 'y3',
        x0: 0,
        x1: 1,
        y0: 0,
        y1: 0,
        line: {
            color: MODULE_MACD_PANEL_VISUALS.macdZeroRail,
            width: 1
        },
        layer: 'below'
    };
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
        return attention === 'overlay' || attention === 'overlay_marks';
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
        const scaleMode = controlMode(modes.scaleMode, 'price_overlays');
        const allBandDiagnostics = bands === 'all' || bands === 'both' || scaleMode === 'all_visible';
        const overlapBand = allBandDiagnostics
            || ['contextual', 'combined_overlap', 'canonical_overlap', 'overlap'].includes(bands);

        return {
            mode: bands,
            priceBand: allBandDiagnostics || bands === 'price',
            sentimentEnvelope: allBandDiagnostics || bands === 'sentiment',
            overlapBand,
            allBandDiagnostics
        };
    }

    static overlapBandName(modes = {}) {
        const bands = controlMode(modes.bands, 'none');
        if (['contextual', 'combined_overlap', 'canonical_overlap', 'overlap'].includes(bands)) {
            return 'Overlap Band';
        }
        return 'Overlap Band';
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
            text: `Overlap Band unavailable for selected asset/range`,
            color: MODULE_CHART_VISUALS.unavailableText
        };
    }

    static hasChartStack(rows = []) {
        const source = Array.isArray(rows) ? rows : [];
        return Boolean(
            seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macd, 0.12, 5)
            || seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentMacd, 0.08, 3)
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
                    text: markerRows.map(row => regimeMarkerHoverText(row, definition, { includeAttention: controlMode(state.currentAttention, 'context') !== 'off' })),
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
        const sentimentMacd = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentMacd, 0.08, 3);
        const sentimentMacdSignal = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.sentimentMacdSignal, 0.08, 3);
        const sentimentMacdHist = derivedSeriesDelta(sentimentMacd, sentimentMacdSignal);
        const macdHist = seriesForFirstSupportedField(source, MODULE_CHART_STACK_FIELDS.macdHist, 0.12, 5);

        if (macdHist) {
            traces.push({
                type: 'bar',
                name: 'MACD Histogram',
                showlegend: false,
                x,
                y: macdHist.y,
                yaxis: 'y3',
                marker: { color: macdHistogramColors(macdHist.y) },
                hovertemplate: `%{x}<br>${fieldLabel(macdHist.field)}: %{y:,.4f}<extra></extra>`
            });
        }

        if (sentimentMacdHist) {
            traces.push({
                type: 'bar',
                name: 'Sentiment MACD Histogram',
                x,
                y: sentimentMacdHist.y,
                yaxis: 'y3',
                marker: { color: sentimentMacdHistogramColors(sentimentMacdHist.y) },
                opacity: 0.72,
                showlegend: false,
                hovertemplate: `%{x}<br>Sentiment MACD Delta: %{y:,.4f}<extra></extra>`
            });
        }

        if (sentimentMacdSignal && (!sentimentMacd || sentimentMacdSignal.field !== sentimentMacd.field)) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Sentiment Trend',
                showlegend: false,
                x,
                y: sentimentMacdSignal.y,
                yaxis: 'y3',
                line: {
                    color: MODULE_MACD_PANEL_VISUALS.sentimentMacdSignalLine,
                    width: 0.85,
                    dash: 'shortdash'
                },
                hovertemplate: `%{x}<br>Sentiment Trend: %{y:,.4f}<extra></extra>`
            });
        }

        if (macd) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'MACD glow',
                x,
                y: macd.y,
                yaxis: 'y3',
                line: {
                    color: MODULE_MACD_PANEL_VISUALS.macdGlowLine,
                    width: MODULE_MACD_PANEL_VISUALS.macdGlowWidth
                },
                hoverinfo: 'skip',
                showlegend: false,
                connectgaps: false
            });

            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'MACD',
                showlegend: false,
                legendrank: 80,
                x,
                y: macd.y,
                yaxis: 'y3',
                line: {
                    color: MODULE_MACD_PANEL_VISUALS.macdLine,
                    width: 1.42
                },
                hovertemplate: `%{x}<br>${fieldLabel(macd.field)}: %{y:,.4f}<extra></extra>`
            });
        }

        if (macdSignal) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'MACD Signal',
                showlegend: false,
                x,
                y: macdSignal.y,
                yaxis: 'y3',
                line: { color: MODULE_MACD_PANEL_VISUALS.macdSignalLine, width: 0.95, dash: 'shortdash' },
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
                showlegend: false,
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
                showlegend: false,
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
                showlegend: false,
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
                showlegend: false,
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

        const hasSentimentContext = Boolean(sentimentMacd || sentimentMacdSignal || sentimentMacdHist || sentimentRsi || sentimentStochRsi);
        if (hasSentimentContext) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Sentiment',
                legendrank: 70,
                x: [x[0]],
                y: [null],
                yaxis: 'y3',
                line: { color: MODULE_SENTIMENT_VISUALS.legendLine, width: 1.35 },
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
        const attentionEnabled = modes.attention !== 'off';
        const attentionThreshold = attentionEnabled ? attentionSpikeThreshold(source) : null;
        const attentionContext = source.map(row => attentionEnabled
            ? attentionContextHoverFragment(row, {
                includeKeywords: rowLooksLikeAttentionSpike(row, attentionThreshold),
                compactMode: modes.attention === 'context',
                threshold: attentionThreshold
            })
            : '');
        const traces = [];

        if (this.shouldShowAttentionOverlay(state)) {
            buildAttentionMarkerTraces(source).forEach(trace => traces.push(trace));
        }

        if (modes.chartType === 'line') {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Price',
                legendrank: 10,
                x,
                y: close,
                customdata: attentionContext,
                line: { color: MODULE_CHART_VISUALS.priceLine, width: 1.8 },
                hovertemplate: '%{x}<br>Close: %{y:,.2f}%{customdata}<extra></extra>'
            });
        } else {
            traces.push({
                type: 'candlestick',
                name: 'Price',
                legendrank: 10,
                x,
                open,
                high,
                low,
                close,
                customdata: attentionContext,
                increasing: {
                    line: { color: MODULE_CHART_VISUALS.candleUpLine, width: 1.05 },
                    fillcolor: MODULE_CHART_VISUALS.candleUpFill
                },
                decreasing: {
                    line: { color: MODULE_CHART_VISUALS.candleDownLine, width: 0.95 },
                    fillcolor: MODULE_CHART_VISUALS.candleDownFill
                },
                whiskerwidth: 0.38,
                hovertemplate: '%{x}<br>O: %{open:,.2f}<br>H: %{high:,.2f}<br>L: %{low:,.2f}<br>C: %{close:,.2f}%{customdata}<extra></extra>'
            });
        }

        const structureScoreStripHoverTrace = buildStructureScoreStripHoverTrace(source, state);
        if (structureScoreStripHoverTrace) traces.push(structureScoreStripHoverTrace);

        const bandPolicy = this.buildBandLayerPolicy(modes);
        const tableauPriceBand = resolveTableauPriceBandSeries(source, state.currentFrequency);
        const tableauSentimentBand = resolveTableauSentimentBandSeries(source, state.currentFrequency);
        const tableauOverlapBand = deriveTableauOverlapBandSeries(tableauPriceBand, tableauSentimentBand);

        buildMovingAverageRibbonTraces(source, x, modes).forEach(trace => traces.push(trace));

        if (this.shouldShowPriceBands(state)) {
            if (bandPolicy.priceBand && tableauPriceBand) {
                addBandEnvelopeTraces(traces, x, tableauPriceBand, {
                    name: 'Price Band',
                    legendrank: 20,
                    lineColor: MODULE_CHART_VISUALS.priceBandLine,
                    fillColor: MODULE_CHART_VISUALS.priceBandFill,
                    width: 0.78,
                    legendgroup: 'price-band',
                    hoverPrefix: 'Price Band'
                });
            }

            if (bandPolicy.overlapBand) {
                const overlapBand = tableauOverlapBand || this.resolveCombinedOverlapBandSeries(source);
                if (overlapBand) {
                    const bandName = this.overlapBandName(modes);
                    addBandEnvelopeTraces(traces, x, overlapBand, {
                        name: bandName,
                        legendrank: 40,
                        lineColor: MODULE_CHART_VISUALS.overlapBandLine,
                        fillColor: MODULE_CHART_VISUALS.overlapBandFill,
                        width: 0.88,
                        legendgroup: 'combined-overlap',
                        hoverPrefix: bandName
                    });
                }
            }
        }

        if (this.shouldShowSentimentBands(state) && tableauSentimentBand) {
            addBandEnvelopeTraces(traces, x, tableauSentimentBand, {
                name: 'Sentiment Band',
                legendrank: 30,
                lineColor: MODULE_CHART_VISUALS.sentimentRibbonLine,
                fillColor: MODULE_CHART_VISUALS.sentimentRibbonFill,
                width: 0.74,
                legendgroup: 'sentiment-band',
                hoverPrefix: 'Sentiment Band'
            });
        }

        if (modes.scaleMode === 'all_visible') {
            const dashboardScore = finiteSeries(source, 'seta_dashboard_summary_score');
            if (hasEnoughSeries(dashboardScore, source, 0.18, 5)) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Structure Score',
                    showlegend: false,
                    x,
                    y: dashboardScore,
                    yaxis: 'y2',
                    line: { width: 1 },
                    hovertemplate: '%{x}<br>Structure Score: %{y:,.1f}<extra></extra>'
                });
            }
        }

        // Regime marker traces are intentionally not rendered by default.
        // They add visual clutter and duplicate attention/context semantics in the public chart.
        // Keep buildRegimeMarkerTraces available for future diagnostic/debug modes.
        if (controlMode(state.currentRegimeMarkers, 'off') === 'on') {
            this.buildRegimeMarkerTraces(source, state).forEach(trace => traces.push(trace));
        }

        this.buildIndicatorStackTraces(source, state).forEach(trace => traces.push(trace));

        return traces;
    }

    static buildLayout(baseLayout = {}, state = {}, rows = []) {
        const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
        const freq = String(state.currentFrequency || 'D').trim().toUpperCase();
        const range = String(state.currentRange || '3M').trim().toUpperCase();
        const freqLabel = freq === 'W' ? 'Weekly' : 'Daily';
        const modes = this.buildControlModeSummary(state);
        const showSecondaryAxis = modes.scaleMode === 'all_visible';
        const showChartStack = this.hasChartStack(rows);
        const priceDomain = showChartStack ? [0.42, 1] : [0, 1];
        const structureScoreStripShapes = buildStructureScoreStripShapes(rows, priceDomain, state);
        const regimeSummary = this.regimeMarkerSummary(rows, state);
        const overlapStatus = this.overlapBandStatus(rows, state);
        const macdZeroRailShapes = showChartStack ? [buildMacdZeroRailShape()] : [];
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
                    gridcolor: 'rgba(148,163,184,0.035)',
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
                traceorder: 'normal',
                x: 0.018,
                xanchor: 'left',
                y: 0.985,
                yanchor: 'top',
                bgcolor: 'rgba(8,12,18,0.82)',
                bordercolor: 'rgba(148,163,184,0.18)',
                borderwidth: 1,
                itemclick: 'toggleothers',
                itemdoubleclick: 'toggle',
                font: { color: MODULE_CHART_VISUALS.secondaryText, size: 9 }
            },
            margin: { l: 62, r: showSecondaryAxis ? 86 : 54, t: 56, b: showChartStack ? 68 : 42, ...(baseLayout.margin || {}) },
            shapes: [
                ...((baseLayout && Array.isArray(baseLayout.shapes)) ? baseLayout.shapes : []),
                ...structureScoreStripShapes,
                ...macdZeroRailShapes,
                ...rsiZoneBackgroundShapes,
                ...rsiRailShapes,
                ...stochRsiZoneBackgroundShapes,
                ...stochRsiRailShapes
            ],
            annotations: [
                ...((baseLayout && Array.isArray(baseLayout.annotations)) ? baseLayout.annotations : []),
                ...(structureScoreStripShapes.length ? [{
                    text: 'structure',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.985,
                    y: Math.min(0.99, (priceDomain?.[0] ?? 0) + 0.028),
                    xanchor: 'right',
                    showarrow: false,
                    font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                }] : []),
                ...(showChartStack ? [
                    {
                        text: 'momentum',
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.985,
                        y: 0.397,
                        xanchor: 'right',
                        showarrow: false,
                        font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                    },
                    {
                        text: 'pressure',
                        xref: 'paper',
                        yref: 'paper',
                        x: 0.985,
                        y: 0.257,
                        xanchor: 'right',
                        showarrow: false,
                        font: { color: MODULE_CHART_VISUALS.mutedText, size: 9 }
                    },
                    {
                        text: 'timing',
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
                        ? `SETA chart context • ${rows.length} rows • ${modes.chartType} / ${modes.scaleMode}${modes.attention !== 'off' ? ` • attention ${modes.attention === 'context' ? 'context' : 'marks'}` : ''}${showChartStack ? ' • chart stack' : ''}${regimeSummary ? ' • regime markers' : ''}`
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
            hovermode: layout.hovermode || 'closest',
            hoverdistance: layout.hoverdistance ?? 36,
            spikedistance: layout.spikedistance ?? 36,
            hoverlabel: {
                bgcolor: 'rgba(8,12,18,0.96)',
                bordercolor: 'rgba(155,220,255,0.22)',
                font: { color: MODULE_CHART_VISUALS.primaryText, size: 11 },
                align: 'left',
                namelength: -1,
                ...(layout.hoverlabel || {})
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
