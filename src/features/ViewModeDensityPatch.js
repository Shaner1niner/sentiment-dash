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
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
        display: grid;
        grid-template-columns: minmax(220px, .72fr) minmax(320px, 1.28fr);
        gap: 10px;
        align-items: stretch;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState {
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 10px;
        background: rgba(5, 7, 10, .28);
        padding: 10px 12px;
        min-height: 76px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState span,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState em {
        display: block;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState span {
        color: #58a6ff;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .08em;
        margin-bottom: 7px;
        text-transform: uppercase;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState strong {
        color: #f0f6fc;
        display: block;
        font-size: 12px;
        line-height: 1.4;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState em {
        color: #8b949e;
        font-size: 10px;
        font-style: normal;
        margin-top: 6px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
        margin-top: 0;
        min-height: 76px;
      }
      @media (max-width: 760px) {
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
}

function signalStateDetailItem(detailPanel) {
    return Array.from(detailPanel.querySelectorAll('.moduleMarketTapeDetailItem')).find(item => {
        const label = item.querySelector('span')?.textContent || '';
        return label.trim().toLowerCase() === 'signal state';
    }) || null;
}

function resetBriefingCompact(detailPanel) {
    const compact = detailPanel.querySelector('.moduleMarketTapeBriefingCompact');
    if (!compact) return;

    const trend = compact.querySelector('.moduleMarketTapeTrendWidget');
    if (trend && compact.parentNode) {
        compact.parentNode.insertBefore(trend, compact);
    }

    compact.remove();
}

function buildSignalStateCard(detailPanel) {
    const item = signalStateDetailItem(detailPanel);
    if (!item) return null;

    const value = item.querySelector('strong')?.textContent?.trim() || '';
    if (!value) return null;

    const card = document.createElement('section');
    card.className = 'moduleMarketTapeBriefingSignalState';
    card.setAttribute('aria-label', 'Signal State');
    card.innerHTML = `
      <span>Signal State</span>
      <strong></strong>
      <em>Compact read · full detail in Research</em>
    `;
    card.querySelector('strong').textContent = value;
    return card;
}

function applyBriefingCompact(detailPanel, mode) {
    resetBriefingCompact(detailPanel);

    if (mode !== 'briefing') return;

    const trend = detailPanel.querySelector('.moduleMarketTapeTrendWidget');
    if (!trend) return;

    const signalState = buildSignalStateCard(detailPanel);
    if (!signalState) return;

    const compact = document.createElement('div');
    compact.className = 'moduleMarketTapeBriefingCompact';
    compact.setAttribute('data-view-mode-token', PATCH_TOKEN);
    compact.appendChild(signalState);

    trend.parentNode.insertBefore(compact, trend);
    compact.appendChild(trend);
}

function applyViewModeDensity() {
    if (typeof document === 'undefined') return;

    installViewModeDensityStyle();

    const mode = normalizedViewMode();
    document.documentElement.setAttribute('data-seta-view-mode', mode);

    const detailPanel = document.getElementById('module-market-tape-detail');
    if (detailPanel) {
        applyBriefingCompact(detailPanel, mode);

        const hasBriefingTrend = Boolean(detailPanel.querySelector('.moduleMarketTapeTrendWidget'));
        const showDetail = mode === 'research' || hasBriefingTrend;
        detailPanel.hidden = !showDetail;
        detailPanel.setAttribute('aria-hidden', showDetail ? 'false' : 'true');
        detailPanel.setAttribute('data-view-mode-token', PATCH_TOKEN);
        detailPanel.setAttribute('data-view-mode-detail', mode === 'research' ? 'full' : (hasBriefingTrend ? 'structure-trend-signal-state' : 'hidden'));
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
