import { selectedWindowRows } from './core/displayRangeWindow.js';

const DAY_MS = 24 * 60 * 60 * 1000;

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

        ['xaxis', 'yaxis', 'yaxis2'].forEach(axisKey => {
            if (next[axisKey] && typeof next[axisKey] === 'object') {
                next[axisKey] = withoutUndefinedLayoutKeys(next[axisKey]);
            }
        });

        if (next.xaxis && !next.xaxis.anchor) next.xaxis.anchor = 'y';
        if (next.yaxis && !next.yaxis.anchor) next.yaxis.anchor = 'x';
        if (next.yaxis2 && !next.yaxis2.anchor) next.yaxis2.anchor = 'x';

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
        const bands = controlMode(state.currentBands, 'none');
        const ribbon = controlMode(state.currentRibbon, 'none');
        const scaleMode = controlMode(state.currentScaleMode, 'price_overlays');

        return (scaleMode !== 'price_only'
            && ['price', 'contextual', 'overlap', 'combined_overlap', 'both'].includes(bands))
            || ribbon === 'price'
            || ribbon === 'both'
            || scaleMode === 'price_overlays';
    }

    static shouldShowSentimentBands(state = {}) {
        const bands = controlMode(state.currentBands, 'none');
        const ribbon = controlMode(state.currentRibbon, 'none');
        const scaleMode = controlMode(state.currentScaleMode, 'price_overlays');

        return scaleMode !== 'price_only'
            && (bands === 'sentiment' || bands === 'both' || ribbon === 'sentiment' || ribbon === 'both');
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
                line: { width: 1.4 },
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
                increasing: { line: { color: '#c9d1d9' } },
                decreasing: { line: { color: '#8b949e' } },
                hovertemplate: '%{x}<br>O: %{open:,.2f}<br>H: %{high:,.2f}<br>L: %{low:,.2f}<br>C: %{close:,.2f}<extra></extra>'
            });
        }

        if (this.shouldShowPriceBands(state)) {
            const priceBandFields = modes.bands === 'price' || modes.ribbon === 'price' || modes.ribbon === 'both'
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
                        line: { width: 1 },
                        hovertemplate: `%{x}<br>${fieldLabel(field)}: %{y:,.2f}<extra></extra>`
                    });
                }
            });

            const upperBand = source.map(row => asNumber(row.boll_upper_overlap_band ?? row.boll_upper_overlap_advanced));
            const lowerBand = source.map(row => asNumber(row.boll_lower_overlap_band ?? row.boll_lower_overlap_advanced));
            if (hasEnoughSeries(upperBand, source, 0.10, 3) && hasEnoughSeries(lowerBand, source, 0.10, 3)) {
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Overlap Upper',
                    x,
                    y: upperBand,
                    line: { width: 1 },
                    hoverinfo: 'skip'
                });
                traces.push({
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Overlap Lower',
                    x,
                    y: lowerBand,
                    line: { width: 1 },
                    fill: 'tonexty',
                    hoverinfo: 'skip'
                });
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
                    name: 'SETA Score',
                    x,
                    y: dashboardScore,
                    yaxis: 'y2',
                    line: { width: 1 },
                    hovertemplate: '%{x}<br>SETA Score: %{y:,.1f}<extra></extra>'
                });
            }
        }

        if (this.shouldShowRegimeMarkers(state)) {
            const markerRows = source.filter(row => (
                asNumber(row.high_volume_20) === 1
                || asNumber(row.sent_ribbon_transition_flag) === 1
                || asNumber(row.boll_overlap_break_confirmed_high_volume) === 1
            ));

            if (markerRows.length) {
                traces.push({
                    type: 'scatter',
                    mode: 'markers',
                    name: 'Regime Marks',
                    x: markerRows.map(row => row.date),
                    y: markerRows.map(row => asNumber(row.close)),
                    marker: { size: 7, symbol: 'circle-open' },
                    hovertemplate: '%{x}<br>Regime / confirmation mark<extra></extra>'
                });
            }
        }

        return traces;
    }

    static buildLayout(baseLayout = {}, state = {}, rows = []) {
        const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
        const freq = String(state.currentFrequency || 'D').trim().toUpperCase();
        const range = String(state.currentRange || '3M').trim().toUpperCase();
        const freqLabel = freq === 'W' ? 'Weekly' : 'Daily';
        const modes = this.buildControlModeSummary(state);
        const showSecondaryAxis = modes.scaleMode === 'all_visible' || modes.attention === 'overlay' || modes.attention === 'overlay_marks';

        return {
            ...this.withDarkDefaults(baseLayout, state),
            title: {
                text: `${asset} • ${freqLabel} • ${range}`,
                font: { color: '#c9d1d9', size: 14 }
            },
            xaxis: {
                ...(baseLayout.xaxis || {}),
                type: 'date',
                anchor: 'y',
                rangeslider: { visible: false },
                gridcolor: 'rgba(255,255,255,0.08)',
                zerolinecolor: 'rgba(255,255,255,0.12)'
            },
            yaxis: {
                ...(baseLayout.yaxis || {}),
                title: 'Price',
                anchor: 'x',
                autorange: true,
                fixedrange: false,
                gridcolor: 'rgba(255,255,255,0.08)',
                zerolinecolor: 'rgba(255,255,255,0.12)'
            },
            ...(showSecondaryAxis ? {
                yaxis2: {
                    ...(baseLayout.yaxis2 || {}),
                    title: 'Context',
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    showgrid: false,
                    zeroline: false,
                    rangemode: 'tozero'
                }
            } : {}),
            showlegend: true,
            margin: { l: 55, r: showSecondaryAxis ? 55 : 25, t: 48, b: 40, ...(baseLayout.margin || {}) },
            annotations: [
                ...((baseLayout && Array.isArray(baseLayout.annotations)) ? baseLayout.annotations : []),
                {
                    text: rows.length
                        ? `Module renderer • ${rows.length} rows • ${modes.chartType} / ${modes.scaleMode}`
                        : 'Module renderer • no rows found',
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
            paper_bgcolor: layout.paper_bgcolor || '#0d1117',
            plot_bgcolor: layout.plot_bgcolor || '#0d1117',
            font: layout.font || { color: '#c9d1d9' },
            dragmode: layout.dragmode || 'pan'
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
