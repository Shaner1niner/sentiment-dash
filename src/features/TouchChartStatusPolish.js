const PATCH_TOKEN = 'module_touch_chart_status_polish_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;
let observer = null;
let queued = false;

function isTouchLayout() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(hover: none), (pointer: coarse), (max-width: 900px)').matches;
}

function looksLikeChartStatus(text = '') {
    const value = String(text || '').trim();
    if (!value) return false;
    return /Markers:/i.test(value)
        || /\brows\b/i.test(value)
        || /\bcandles\b/i.test(value)
        || /\bprice_overlays\b/i.test(value)
        || /\battention\b/i.test(value)
        || /\bregime/i.test(value);
}

function installTouchChartStatusStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html[data-touch-chart-status-polish="${PATCH_TOKEN}"] #chart .setaTouchHiddenChartStatus {
        display: none !important;
      }
      html[data-touch-chart-status-polish="${PATCH_TOKEN}"] #chart .modebar-container {
        opacity: .08 !important;
      }
      html[data-touch-chart-status-polish="${PATCH_TOKEN}"] #chart:hover .modebar-container,
      html[data-touch-chart-status-polish="${PATCH_TOKEN}"] #chart:focus-within .modebar-container {
        opacity: .55 !important;
      }
    `;
    document.head.appendChild(style);
}

function applyTouchChartStatusPolish() {
    if (typeof document === 'undefined') return;
    installTouchChartStatusStyle();

    const touch = isTouchLayout();
    document.documentElement.toggleAttribute('data-touch-chart-status-polish', touch);
    if (touch) {
        document.documentElement.setAttribute('data-touch-chart-status-polish', PATCH_TOKEN);
    }

    const chart = document.getElementById('chart');
    if (!chart) return;

    chart.querySelectorAll('.setaTouchHiddenChartStatus').forEach(node => {
        node.classList.remove('setaTouchHiddenChartStatus');
    });

    if (!touch) return;

    chart.querySelectorAll('text').forEach(node => {
        if (looksLikeChartStatus(node.textContent)) {
            node.classList.add('setaTouchHiddenChartStatus');
        }
    });
}

function queueTouchChartStatusPolish() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
        queued = false;
        applyTouchChartStatusPolish();
    });
}

function startTouchChartStatusPolish() {
    applyTouchChartStatusPolish();
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', queueTouchChartStatusPolish, { passive: true });
    }
    if (!observer && typeof MutationObserver !== 'undefined' && document.body) {
        observer = new MutationObserver(() => queueTouchChartStatusPolish());
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTouchChartStatusPolish);
} else {
    startTouchChartStatusPolish();
}

export { PATCH_TOKEN, applyTouchChartStatusPolish, startTouchChartStatusPolish };
