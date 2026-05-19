import { PlotlyRenderer } from '../PlotlyRenderer.js?v=module_sentiment_price_alignment_hover_001';

const PATCH_TOKEN = 'module_sentiment_layer_structure_controls_001';

const STRUCTURE_STRIP_COLORS = new Set([
    'rgba(126,231,135,0.36)',
    'rgba(126,231,135,0.24)',
    'rgba(242,204,96,0.22)',
    'rgba(255,191,105,0.27)',
    'rgba(255,123,114,0.34)'
]);

function controlMode(value, fallback = '') {
    return String(value ?? fallback)
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}

function sentimentLayerEnabled(state = {}) {
    return controlMode(state.currentTimingView, 'both') !== 'price';
}

function structureStripEnabled(state = {}) {
    return controlMode(state.currentRegimeLayer, 'on') !== 'off';
}

function traceName(trace = {}) {
    return `${trace?.name || ''} ${trace?.legendgroup || ''}`.toLowerCase();
}

function isSentimentTrace(trace = {}) {
    return /sentiment/.test(traceName(trace));
}

function isStructureStripTrace(trace = {}) {
    return String(trace?.name || '').trim().toLowerCase() === 'structure';
}

function isStructureStripShape(shape = {}) {
    return shape?.type === 'rect'
        && shape?.yref === 'paper'
        && STRUCTURE_STRIP_COLORS.has(String(shape?.fillcolor || ''));
}

function isStructureStripAnnotation(annotation = {}) {
    return String(annotation?.text || '').trim().toLowerCase() === 'structure';
}

function patchRendererControls() {
    if (PlotlyRenderer.__sentimentLayerStructureControlsPatch === PATCH_TOKEN) return;
    PlotlyRenderer.__sentimentLayerStructureControlsPatch = PATCH_TOKEN;

    const originalShouldShowSentimentOverlay = PlotlyRenderer.shouldShowSentimentOverlay;
    PlotlyRenderer.shouldShowSentimentOverlay = function patchedShouldShowSentimentOverlay(state = {}) {
        if (!sentimentLayerEnabled(state)) return false;
        return originalShouldShowSentimentOverlay.call(this, state);
    };

    const originalShouldShowSentimentBands = PlotlyRenderer.shouldShowSentimentBands;
    PlotlyRenderer.shouldShowSentimentBands = function patchedShouldShowSentimentBands(state = {}) {
        return sentimentLayerEnabled(state) && originalShouldShowSentimentBands.call(this, state);
    };

    const originalBuildPriceTraces = PlotlyRenderer.buildPriceTraces;
    PlotlyRenderer.buildPriceTraces = function patchedBuildPriceTraces(rows = [], state = {}) {
        let traces = originalBuildPriceTraces.call(this, rows, state) || [];

        if (!sentimentLayerEnabled(state)) {
            traces = traces.filter(trace => !isSentimentTrace(trace));
        }

        if (!structureStripEnabled(state)) {
            traces = traces.filter(trace => !isStructureStripTrace(trace));
        }

        return traces;
    };

    const originalBuildLayout = PlotlyRenderer.buildLayout;
    PlotlyRenderer.buildLayout = function patchedBuildLayout(baseLayout = {}, state = {}, rows = []) {
        const layout = originalBuildLayout.call(this, baseLayout, state, rows) || {};

        if (!structureStripEnabled(state)) {
            layout.shapes = Array.isArray(layout.shapes)
                ? layout.shapes.filter(shape => !isStructureStripShape(shape))
                : layout.shapes;
            layout.annotations = Array.isArray(layout.annotations)
                ? layout.annotations.filter(annotation => !isStructureStripAnnotation(annotation))
                : layout.annotations;
        }

        return layout;
    };
}

patchRendererControls();

export { PATCH_TOKEN, patchRendererControls, sentimentLayerEnabled, structureStripEnabled };
