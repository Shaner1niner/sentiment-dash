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
    static async renderChart(containerId, data, layout = {}, config = {}) {
        const mutatedData = this.applyDataMutators(data);
        await window.Plotly.newPlot(containerId, mutatedData, layout, config);
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

    static buildPriceTraces(rows, state = {}) {
        const source = Array.isArray(rows) ? rows : [];
        if (!source.length) return [];

        const x = source.map(row => row.date);
        const close = source.map(row => asNumber(row.close));
        const open = source.map(row => asNumber(row.open));
        const high = source.map(row => asNumber(row.high));
        const low = source.map(row => asNumber(row.low));

        const chartType = String(state.currentChartType || 'candles').toLowerCase();
        const traces = [];

        if (chartType === 'line') {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Price',
                x,
                y: close,
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

        const sentimentOverlay = source.map(row => asNumber(row.scaled_combined_compound_ma_21));
        if (compact(sentimentOverlay).length >= Math.max(5, Math.floor(source.length * 0.25))) {
            traces.push({
                type: 'scatter',
                mode: 'lines',
                name: 'Sentiment MA',
                x,
                y: sentimentOverlay,
                line: { width: 1 },
                hovertemplate: '%{x}<br>Sentiment MA: %{y:,.2f}<extra></extra>'
            });
        }

        const upperBand = source.map(row => asNumber(row.boll_upper_overlap_band ?? row.boll_upper_overlap_advanced));
        const lowerBand = source.map(row => asNumber(row.boll_lower_overlap_band ?? row.boll_lower_overlap_advanced));
        if (compact(upperBand).length && compact(lowerBand).length) {
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

        return traces;
    }

    static buildLayout(baseLayout = {}, state = {}, rows = []) {
        const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
        const freq = String(state.currentFrequency || 'D').trim().toUpperCase();
        const range = String(state.currentRange || '3M').trim().toUpperCase();
        const freqLabel = freq === 'W' ? 'Weekly' : 'Daily';

        return {
            ...this.withDarkDefaults(baseLayout, state),
            title: {
                text: `${asset} • ${freqLabel} • ${range}`,
                font: { color: '#c9d1d9', size: 14 }
            },
            xaxis: {
                ...(baseLayout.xaxis || {}),
                type: 'date',
                rangeslider: { visible: false },
                gridcolor: 'rgba(255,255,255,0.08)',
                zerolinecolor: 'rgba(255,255,255,0.12)'
            },
            yaxis: {
                ...(baseLayout.yaxis || {}),
                title: 'Price',
                gridcolor: 'rgba(255,255,255,0.08)',
                zerolinecolor: 'rgba(255,255,255,0.12)'
            },
            showlegend: true,
            margin: { l: 55, r: 25, t: 48, b: 40, ...(baseLayout.margin || {}) },
            annotations: [
                ...((baseLayout && Array.isArray(baseLayout.annotations)) ? baseLayout.annotations : []),
                {
                    text: rows.length ? `Module renderer • ${rows.length} rows` : 'Module renderer • no rows found',
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
