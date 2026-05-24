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
        grid-template-columns: minmax(170px, .62fr) minmax(220px, .9fr) minmax(320px, 1.28fr);
        gap: 10px;
        align-items: stretch;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState {
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 10px;
        background: rgba(5, 7, 10, .28);
        padding: 10px 12px;
        min-height: 86px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero {
        border-color: rgba(242, 204, 96, .28);
        box-shadow: 0 0 0 1px rgba(242, 204, 96, .035) inset, 0 0 22px rgba(242, 204, 96, .035);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero span,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero em,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState span,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState em {
        display: block;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero span,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState span {
        color: #58a6ff;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .08em;
        margin-bottom: 7px;
        text-transform: uppercase;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero span {
        color: #f2cc60;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero strong {
        color: #f2cc60;
        display: block;
        font-size: 24px;
        font-weight: 900;
        letter-spacing: -.03em;
        line-height: 1;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState strong {
        color: #f0f6fc;
        display: block;
        font-size: 12px;
        line-height: 1.4;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero em,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingSignalState em {
        color: #8b949e;
        font-size: 10px;
        font-style: normal;
        margin-top: 6px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeStructureMeter {
        background: rgba(255,255,255,.06);
        border-radius: 999px;
        height: 4px;
        margin: 8px 0 7px;
        overflow: hidden;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeStructureMeter i {
        background: linear-gradient(90deg, rgba(242,204,96,.42), rgba(242,204,96,.95));
        border-radius: inherit;
        display: block;
        height: 100%;
        width: var(--structure-score-pct, 0%);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
        margin-top: 0;
        min-height: 86px;
        padding: 10px 12px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader {
        align-items: flex-start;
        display: grid;
        gap: 3px 10px;
        grid-template-columns: 1fr auto;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader > span {
        grid-column: 1;
        grid-row: 1;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader > em:not(.moduleMarketTapeTrendStackLabel) {
        grid-column: 2;
        grid-row: 2;
        text-align: right;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader .moduleMarketTapeTrendPrimaryReadout {
        color: #f2cc60;
        font-size: 12px;
        font-weight: 900;
        grid-column: 2;
        grid-row: 1;
        justify-self: end;
        line-height: 1.1;
        white-space: nowrap;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader .moduleMarketTapeTrendStackLabel {
        color: #8b949e;
        font-size: 10px;
        font-style: normal;
        grid-column: 1;
        grid-row: 2;
        letter-spacing: .01em;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendBody {
        margin-top: 6px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendBody .moduleMarketTapeTrendReadout {
        display: none !important;
      }
      @media (max-width: 980px) {
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
          grid-template-columns: minmax(170px, .8fr) minmax(260px, 1.2fr);
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
          grid-column: 1 / -1;
        }
      }
      @media (max-width: 760px) {
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
          grid-template-columns: 1fr;
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader {
          grid-template-columns: 1fr;
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader > span,
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader > em:not(.moduleMarketTapeTrendStackLabel),
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader .moduleMarketTapeTrendPrimaryReadout,
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendHeader .moduleMarketTapeTrendStackLabel {
          grid-column: 1;
          grid-row: auto;
          justify-self: start;
          text-align: left;
        }
      }
    `;
    document.head.appendChild(style);
}

function detailItemByLabel(detailPanel, desiredLabel) {
    const normalized = String(desiredLabel || '').trim().toLowerCase();
    return Array.from(detailPanel.querySelectorAll('.moduleMarketTapeDetailItem')).find(item => {
        const label = item.querySelector('span')?.textContent || '';
        return label.trim().toLowerCase() === normalized;
    }) || null;
}

function detailItemValue(detailPanel, label) {
    return detailItemByLabel(detailPanel, label)?.querySelector('strong')?.textContent?.trim() || '';
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

function trendParts(trend) {
    const score = trend.querySelector('.moduleMarketTapeTrendReadout strong')?.textContent?.trim() || '';
    const raw = trend.querySelector('.moduleMarketTapeTrendReadout span')?.textContent?.trim() || '';
    const pieces = raw.split('·').map(piece => piece.trim()).filter(Boolean);
    const delta = pieces[0] || '';
    const direction = pieces[1] || '';
    const stackRead = pieces.slice(2).join(' · ');

    return { score, delta, direction, stackRead };
}

function numericScore(value) {
    const match = String(value || '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

function splitStructureScore(value = '') {
    const pieces = String(value || '').split('·').map(piece => piece.trim()).filter(Boolean);
    return {
        score: pieces[0] || '',
        stackRead: pieces.slice(1).join(' · ')
    };
}

function buildStructureScoreCard(detailPanel, trend) {
    const detailValue = detailItemValue(detailPanel, 'Structure Score');
    const detail = splitStructureScore(detailValue);
    const trendRead = trendParts(trend);
    const score = detail.score || trendRead.score;
    const stackRead = detail.stackRead || trendRead.stackRead || 'not classified';
    const direction = trendRead.direction || '';
    const delta = trendRead.delta || '';

    if (!score) return null;

    const pct = numericScore(score);
    const card = document.createElement('section');
    card.className = 'moduleMarketTapeBriefingStructureHero';
    card.setAttribute('aria-label', 'Structure Score');
    card.style.setProperty('--structure-score-pct', pct === null ? '0%' : `${pct}%`);
    card.innerHTML = `
      <span>Structure Score</span>
      <strong></strong>
      <div class="moduleMarketTapeStructureMeter" aria-hidden="true"><i></i></div>
      <em></em>
    `;
    card.querySelector('strong').textContent = score;
    card.querySelector('em').textContent = [
        `Overall setup quality: ${stackRead}`,
        direction ? `${direction}${delta ? ` ${delta}` : ''}` : ''
    ].filter(Boolean).join(' · ');
    return card;
}

function buildSignalStateCard(detailPanel) {
    const value = detailItemValue(detailPanel, 'Signal State');
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

function applyTrendReadoutHeader(trend) {
    if (!trend || trend.getAttribute('data-structure-trend-readout') === PATCH_TOKEN) return;

    const header = trend.querySelector('.moduleMarketTapeTrendHeader');
    if (!header) return;

    const { score, delta, direction, stackRead } = trendParts(trend);
    if (!score && !delta && !direction && !stackRead) return;

    const primary = document.createElement('strong');
    primary.className = 'moduleMarketTapeTrendPrimaryReadout';
    primary.textContent = [score, direction].filter(Boolean).join(' · ');

    const stack = document.createElement('em');
    stack.className = 'moduleMarketTapeTrendStackLabel';
    stack.textContent = `Structure stack: ${stackRead || 'not classified'}${delta ? ` (${delta})` : ''}`;

    header.appendChild(primary);
    header.appendChild(stack);
    trend.setAttribute('data-structure-trend-readout', PATCH_TOKEN);
}

function applyBriefingCompact(detailPanel, mode) {
    resetBriefingCompact(detailPanel);

    const trend = detailPanel.querySelector('.moduleMarketTapeTrendWidget');
    if (trend) applyTrendReadoutHeader(trend);

    if (mode !== 'briefing') return;

    if (!trend) return;

    const structureScore = buildStructureScoreCard(detailPanel, trend);
    const signalState = buildSignalStateCard(detailPanel);
    if (!structureScore || !signalState) return;

    const compact = document.createElement('div');
    compact.className = 'moduleMarketTapeBriefingCompact';
    compact.setAttribute('aria-label', 'Active Setup Snapshot');
    compact.setAttribute('data-view-mode-token', PATCH_TOKEN);
    compact.appendChild(structureScore);
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
        detailPanel.setAttribute('data-view-mode-detail', mode === 'research' ? 'full' : (hasBriefingTrend ? 'active-setup-snapshot' : 'hidden'));
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
