import { Store } from '../Store.js';

const PATCH_TOKEN = 'module_view_mode_density_001';

let patchQueued = false;
let observer = null;

function normalizedViewMode() {
    const value = String(Store.state.currentView || 'briefing').trim().toLowerCase();
    return value === 'research' ? 'research' : 'briefing';
}

function applyViewModeDensity() {
    if (typeof document === 'undefined') return;

    const mode = normalizedViewMode();
    document.documentElement.setAttribute('data-seta-view-mode', mode);

    const detailPanel = document.getElementById('module-market-tape-detail');
    if (detailPanel) {
        const showDetail = mode === 'research';
        detailPanel.hidden = !showDetail;
        detailPanel.setAttribute('aria-hidden', showDetail ? 'false' : 'true');
        detailPanel.setAttribute('data-view-mode-token', PATCH_TOKEN);
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
