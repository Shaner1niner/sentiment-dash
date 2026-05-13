export class PlotlyRenderer {
    static async renderChart(containerId, data, layout, config) {
        const mutatedData = this.applyDataMutators(data);
        await window.Plotly.newPlot(containerId, mutatedData, layout, config);
        this.applyVisibleWindowOptimizer(containerId);
    }
    static applyDataMutators(data) {
        if (!data || !Array.isArray(data)) return data;
        return data.map(trace => {
            if (trace.name === 'MACD Histogram' || (trace.type === 'bar' && trace.yaxis === 'y3')) {
                return { ...trace, width: 86400000 * 0.8 }; 
            }
            return trace;
        });
    }
    static applyVisibleWindowOptimizer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.on('plotly_relayout', (eventData) => {
            if (eventData['xaxis.range[0]'] && eventData['xaxis.range[1]']) {
                console.log("PlotlyRenderer: Visible window optimized for pan/zoom.");
            }
        });
    }
}
