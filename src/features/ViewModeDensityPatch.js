import { Store } from '../Store.js';

const PATCH_TOKEN = 'module_view_mode_density_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;

let patchQueued = false;
let observer = null;

function normalizedViewMode() {
    const value = String(Store.state.currentView || 'briefing').trim().toLowerCase();
    return value === 'research' ? 'research' : 'briefing';
}

function installViewModeDensityStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeDetailKicker,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeDetailGrid,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeEventTimeline,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeDetailDeck {
        display: none !important;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeSelectedDetail {
        margin-top: 12px;
      }
    `;
    document.head.appendChild(style);
}

function applyViewModeDensity() {
    if (typeof document === 'undefined') return;

    installViewModeDensityStyle();

    const mode = normalizedViewMode();
    document.documentElement.setAttribute('data-seta-view-mode', mode);

    const detailPanel = document.getElementById('module-market-tape-detail');
    if (detailPanel) {
        const hasBriefingTrend = Boolean(detailPanel.querySelector('.moduleMarketTapeTrendWidget'));
        const showDetail = mode === 'research' || hasBriefingTrend;
        detailPanel.hidden = !showDetail;
        detailPanel.setAttribute('aria-hidden', showDetail ? 'false' : 'true');
        detailPanel.setAttribute('data-view-mode-token', PATCH_TOKEN);
        detailPanel.setAttribute('data-view-mode-detail', mode === 'research' ? 'full' : (hasBriefingTrend ? 'structure-trend' : 'hidden'));
    }
}

function queueApplyViewModeDensity() {
    if (patchQueued) return;
    patchQueued = true;
    window.requestAnimationFrame(() => {
        patchQueued = false;
        applyViewModeDensity();
    });
}

function startViewModeDensityPatch() {
    applyViewModeDensity();

    try {
        Store.on('controlChanged', ({ controlId }) => {
            if (controlId === 'briefingMode') queueApplyViewModeDensity();
        });
        Store.on('assetChanged', () => queueApplyViewModeDensity());
        Store.on('screenerUpdated', () => queueApplyViewModeDensity());
    } catch (_) {}

    if (!observer) {
        observer = new MutationObserver(() => queueApplyViewModeDensity());
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startViewModeDensityPatch);
} else {
    startViewModeDensityPatch();
}

export { PATCH_TOKEN, applyViewModeDensity, normalizedViewMode, startViewModeDensityPatch };
