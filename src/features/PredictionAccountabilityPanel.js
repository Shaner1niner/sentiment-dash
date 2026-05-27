import { Store } from '../Store.js';

const STYLE_ID = 'seta-prediction-accountability-panel-style';
const TARGET_ID = 'module-prediction-accountability-panel';
const OVERLAY_URL = 'public_content/prediction_outcomes/prediction_outcome_overlay_latest.json?v=prediction_accountability_panel_001';

let overlayPayload = null;
let overlayError = null;
let overlayLoading = false;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function asPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return `${Math.round(number * 100)}%`;
}

function asNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : '—';
}

function labelDirection(value, fallback = '—') {
    const text = String(value ?? '').trim().toLowerCase();
    if (text === 'up') return 'Up';
    if (text === 'down') return 'Down';
    return fallback;
}

function correctnessClass(row) {
    if (row?.is_correct === 1 || row?.is_correct === true) return 'isCorrect';
    if (row?.is_correct === 0 || row?.is_correct === false) return 'isIncorrect';
    return 'isPending';
}

function correctnessLabel(row) {
    if (row?.is_correct === 1 || row?.is_correct === true) return 'Correct';
    if (row?.is_correct === 0 || row?.is_correct === false) return 'Miss';
    return 'Pending';
}

function formatDate(value) {
    if (!value) return '—';
    return String(value).slice(0, 10);
}

function activeAsset() {
    return String(Store?.state?.currentAsset || 'BTC').trim().toUpperCase();
}

function rows() {
    return Array.isArray(overlayPayload?.rows) ? overlayPayload.rows : [];
}

function metadata() {
    return overlayPayload?.metadata && typeof overlayPayload.metadata === 'object'
        ? overlayPayload.metadata
        : {};
}

function latestRowForAsset(asset) {
    const ticker = String(asset || '').trim().toUpperCase();
    return rows().find(row => String(row?.term || '').trim().toUpperCase() === ticker) || null;
}

function recentRows(limit = 6) {
    return rows().slice(0, limit);
}

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .modulePredictionAccountabilityPanel {
        margin: 14px 0;
        border: 1px solid rgba(125, 211, 252, .22);
        border-radius: 14px;
        background:
          radial-gradient(circle at top left, rgba(125, 211, 252, .08), transparent 34%),
          linear-gradient(180deg, rgba(13, 17, 23, .82), rgba(5, 7, 10, .58));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
        padding: 14px;
      }
      .modulePredictionAccountabilityHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 12px;
      }
      .modulePredictionAccountabilityKicker {
        color: #7dd3fc;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .08em;
        margin-bottom: 4px;
      }
      .modulePredictionAccountabilityHeader h2 {
        margin: 0 0 4px;
        color: #f0f6fc;
        font-size: 16px;
        line-height: 1.25;
      }
      .modulePredictionAccountabilityHeader p {
        margin: 0;
        color: #8b949e;
        font-size: 12px;
        line-height: 1.4;
      }
      .modulePredictionAccountabilityPill {
        border: 1px solid rgba(126, 231, 135, .4);
        border-radius: 999px;
        color: #7ee787;
        background: rgba(13, 17, 23, .52);
        padding: 4px 8px;
        white-space: nowrap;
        font-size: 11px;
        font-weight: 700;
      }
      .modulePredictionMetricGrid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      }
      .modulePredictionMetric {
        border: 1px solid rgba(139, 148, 158, .18);
        border-radius: 10px;
        background: rgba(5, 7, 10, .42);
        padding: 10px;
      }
      .modulePredictionMetric span {
        display: block;
        color: #8b949e;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: .05em;
        margin-bottom: 3px;
      }
      .modulePredictionMetric strong {
        display: block;
        color: #f0f6fc;
        font-size: 18px;
        line-height: 1.15;
      }
      .modulePredictionActiveRow {
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 10px;
        background: rgba(13, 17, 23, .44);
        padding: 10px;
        margin-bottom: 10px;
      }
      .modulePredictionActiveRow h3 {
        margin: 0 0 8px;
        color: #9bdcff;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: .06em;
      }
      .modulePredictionFactGrid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
      }
      .modulePredictionFact {
        border: 1px solid rgba(139, 148, 158, .14);
        border-radius: 8px;
        padding: 7px;
        background: rgba(5, 7, 10, .35);
      }
      .modulePredictionFact span {
        display: block;
        color: #8b949e;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .05em;
        margin-bottom: 2px;
      }
      .modulePredictionFact strong {
        display: block;
        color: #f0f6fc;
        font-size: 11px;
        line-height: 1.25;
      }
      .modulePredictionRecent {
        display: grid;
        gap: 6px;
      }
      .modulePredictionRecentRow {
        display: grid;
        grid-template-columns: 70px 1fr 1fr 76px;
        gap: 8px;
        align-items: center;
        border-top: 1px solid rgba(139, 148, 158, .12);
        padding-top: 6px;
        color: #c9d1d9;
        font-size: 11px;
      }
      .modulePredictionRecentRow:first-child {
        border-top: 0;
        padding-top: 0;
      }
      .modulePredictionBadge {
        border: 1px solid rgba(139, 148, 158, .20);
        border-radius: 999px;
        padding: 3px 7px;
        text-align: center;
        font-size: 10px;
        font-weight: 700;
      }
      .modulePredictionBadge.isCorrect {
        color: #7ee787;
        border-color: rgba(126, 231, 135, .35);
      }
      .modulePredictionBadge.isIncorrect {
        color: #ffa198;
        border-color: rgba(248, 81, 73, .35);
      }
      .modulePredictionBadge.isPending {
        color: #f2cc60;
        border-color: rgba(242, 204, 96, .35);
      }
      .modulePredictionNote {
        margin: 10px 0 0;
        padding-top: 9px;
        border-top: 1px solid rgba(125, 211, 252, .12);
        color: #8b949e;
        font-size: 11px;
        line-height: 1.45;
      }
      .modulePredictionAccountabilityPanel.isError {
        border-color: rgba(248, 81, 73, .32);
      }
      @media (max-width: 980px) {
        .modulePredictionMetricGrid,
        .modulePredictionFactGrid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .modulePredictionRecentRow {
          grid-template-columns: 58px 1fr 1fr;
        }
        .modulePredictionRecentRow .modulePredictionBadge {
          grid-column: 1 / -1;
          width: fit-content;
        }
      }
      @media (max-width: 640px) {
        .modulePredictionMetricGrid,
        .modulePredictionFactGrid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
}

function ensureTarget() {
    let target = document.getElementById(TARGET_ID);
    if (target) return target;

    const anchor =
        document.getElementById('module-market-tape-detail') ||
        document.getElementById('module-briefing-panel') ||
        document.getElementById('module-market-tape') ||
        document.querySelector('.harnessBanner');

    target = document.createElement('section');
    target.id = TARGET_ID;
    target.className = 'modulePredictionAccountabilityPanel';
    target.setAttribute('aria-live', 'polite');

    if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(target, anchor.nextSibling);
    } else {
        document.body.prepend(target);
    }

    return target;
}

function renderLoading() {
    const target = ensureTarget();
    target.className = 'modulePredictionAccountabilityPanel';
    target.innerHTML = `
      <div class="modulePredictionAccountabilityHeader">
        <div>
          <div class="modulePredictionAccountabilityKicker">Prediction Accountability</div>
          <h2>Loading outcome overlay</h2>
          <p>Checking the latest resolved prediction outcomes.</p>
        </div>
        <span class="modulePredictionAccountabilityPill">Loading</span>
      </div>
    `;
}

function renderError(error) {
    const target = ensureTarget();
    target.className = 'modulePredictionAccountabilityPanel isError';
    target.innerHTML = `
      <div class="modulePredictionAccountabilityHeader">
        <div>
          <div class="modulePredictionAccountabilityKicker">Prediction Accountability</div>
          <h2>Outcome overlay unavailable</h2>
          <p>${escapeHtml(error?.message || error || 'Could not load prediction outcome overlay.')}</p>
        </div>
        <span class="modulePredictionAccountabilityPill">Offline</span>
      </div>
      <p class="modulePredictionNote">This panel is informational. SETA explains market emotion and setup quality; it does not issue trade instructions.</p>
    `;
}




const OUTCOME_BASIS_FIELDS = [
    'resolution_date',
    'resolved_at',
    'anchor_date',
    'anchor_price',
    'resolution_price',
    'actual_return',
    'actual_move_pct',
    'resolution_basis',
    'is_final_resolution',
];

function hasOutcomeBasis(row) {
    if (!row || typeof row !== 'object') return false;
    return OUTCOME_BASIS_FIELDS.some((key) => {
        const value = row[key];
        return value !== undefined && value !== null && value !== '' && value !== 'null';
    });
}

function isNoCall(row) {
    if (!row || typeof row !== 'object') return true;
    const callStatus = String(row.call_status || '').toLowerCase();
    const predictionLabel = String(row.prediction_label || '').toLowerCase();
    return callStatus.includes('no') || predictionLabel.includes('no call') || predictionLabel.includes('no_call');
}

function isResolved(row) {
    return row && String(row.outcome_status || '').toLowerCase() === 'resolved';
}


function displayWindowLabel(row) {
    const days = Number(row?.horizon_days || 1);
    if (!Number.isFinite(days) || days <= 0) return 'N/A';
    return `${days}D`;
}

function displayPredictionLabel(row) {
    if (!row) return 'N/A';
    if (isNoCall(row)) return 'No call';
    return labelDirection(row.prediction_label);
}

function displayResultLabel(row) {
    if (!row) return 'N/A';
    if (isNoCall(row)) return 'N/A';
    if (!isResolved(row)) return 'Not final';
    return labelDirection(row.actual_label);
}

function publicOutcomeStatusLabel(row) {
    if (!row) return 'Unavailable';
    if (isNoCall(row)) return 'No score';
    if (!isResolved(row)) return 'In progress';
    return 'Resolved';
}

function publicOutcomeStatusClass(row) {
    if (!row || isNoCall(row)) return 'isPending';
    if (!isResolved(row)) return 'isPending';
    return correctnessClass(row);
}

function outcomeBasisNote(row) {
    if (!row) return '';
    if (isNoCall(row)) {
        return 'No accountability result is assigned to no-call or low-confidence rows.';
    }
    if (!isResolved(row)) {
        return 'Current result is not final. Outcome resolves after the prediction window closes.';
    }
    if (!hasOutcomeBasis(row)) {
        return 'Measured over the stored prediction window, not the live candle.';
    }
    return 'Measured over the stored prediction window, not the live candle.';
}

function recentOutcomeText(row) {
    const date = formatDate(row.prediction_date);
    const prediction = displayPredictionLabel(row);
    const result = displayResultLabel(row);

    if (isNoCall(row)) return `${date}: No call`;
    if (!isResolved(row)) return `${date}: ${prediction} - In progress`;
    return `${date}: ${prediction} - ${result}`;
}




function renderPanel() {
    const target = ensureTarget();

    if (overlayLoading && !overlayPayload) {
        renderLoading();
        return;
    }

    if (overlayError && !overlayPayload) {
        renderError(overlayError);
        return;
    }

    const meta = metadata();
    const asset = activeAsset();
    const activeRow = latestRowForAsset(asset);
    const accuracy = asPercent(meta.selective_accuracy ?? meta.accuracy_on_all_resolved);
    const recents = recentRows(6);

    target.className = 'modulePredictionAccountabilityPanel';
    target.innerHTML = `
      <div class="modulePredictionAccountabilityHeader">
        <div>
          <div class="modulePredictionAccountabilityKicker">Prediction Accountability</div>
          <h2>Model Call Tracking</h2>
          <p>Tracks stored model calls and measured outcomes after prediction windows close. Not a live trading signal.</p>
        </div>
        <span class="modulePredictionAccountabilityPill">${escapeHtml(accuracy)} selective accuracy</span>
      </div>

      <div class="modulePredictionMetricGrid">
        <div class="modulePredictionMetric"><span>Rows</span><strong>${escapeHtml(asNumber(meta.row_count))}</strong></div>
        <div class="modulePredictionMetric"><span>Resolved</span><strong>${escapeHtml(asNumber(meta.resolved_count))}</strong></div>
        <div class="modulePredictionMetric"><span>Pending</span><strong>${escapeHtml(asNumber(meta.pending_count))}</strong></div>
        <div class="modulePredictionMetric"><span>No-call</span><strong>${escapeHtml(asNumber(meta.no_call_count))}</strong></div>
      </div>

      <div class="modulePredictionActiveRow">
        <h3>${escapeHtml(asset)} latest model call</h3>
        ${activeRow ? `
          <div class="modulePredictionFactGrid">
            <div class="modulePredictionFact"><span>Date</span><strong>${escapeHtml(formatDate(activeRow.prediction_date))}</strong></div>
            <div class="modulePredictionFact"><span>Prediction</span><strong>${escapeHtml(displayPredictionLabel(activeRow))}</strong></div>
            <div class="modulePredictionFact"><span>Window</span><strong>${escapeHtml(displayWindowLabel(activeRow))}</strong></div>
            <div class="modulePredictionFact"><span>Measured result</span><strong>${escapeHtml(displayResultLabel(activeRow))}</strong></div>
            <div class="modulePredictionFact"><span>Confidence</span><strong>${escapeHtml(asPercent(activeRow.confidence))}</strong></div>
            <div class="modulePredictionFact"><span>Status</span><strong>${escapeHtml(publicOutcomeStatusLabel(activeRow))}</strong></div>
          </div>
          <p class="modulePredictionNote">${escapeHtml(outcomeBasisNote(activeRow))}</p>
        ` : `
          <p class="modulePredictionNote">No recent ${escapeHtml(asset)} prediction outcome is present in the current overlay sample.</p>
        `}
      </div>

      <div class="modulePredictionRecent">
        <p class="modulePredictionNote">Recent accountability sample across tracked assets.</p>
        ${recents.map(row => `
          <div class="modulePredictionRecentRow">
            <strong>${escapeHtml(row.term)}</strong>
            <span>${escapeHtml(recentOutcomeText(row))}</span>
            <span>Confidence ${escapeHtml(asPercent(row.confidence))}</span>
            <span class="modulePredictionBadge ${escapeHtml(publicOutcomeStatusClass(row))}">${escapeHtml(publicOutcomeStatusLabel(row))}</span>
          </div>
        `).join('')}
      </div>

      <p class="modulePredictionNote">
        Accountability view only. Measured results reflect stored prediction windows, not live candle movement. Accuracy is measured on resolved prediction outcomes and excludes low-confidence/no-call rows where applicable. This is not a trade signal or price target.
        Generated: ${escapeHtml(meta.generated_at || 'unknown')}.
      </p>
    `;
}

async function loadOverlay() {
    overlayLoading = true;
    overlayError = null;
    renderPanel();

    try {
        const response = await fetch(OVERLAY_URL, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Overlay returned HTTP ${response.status}`);
        }
        const data = await response.json();
        if (!data || typeof data !== 'object' || !Array.isArray(data.rows) || !data.metadata) {
            throw new Error('Overlay JSON did not match the expected contract.');
        }
        overlayPayload = data;
    } catch (error) {
        overlayError = error;
        console.warn('Prediction accountability overlay failed to load:', error);
    } finally {
        overlayLoading = false;
        renderPanel();
    }
}

export const PredictionAccountabilityPanel = {
    init() {
        ensureStyle();
        ensureTarget();
        loadOverlay();

        try {
            Store.on('assetChanged', () => renderPanel());
            Store.on('controlChanged', () => renderPanel());
        } catch (_) {}
    },
};

function start() {
    PredictionAccountabilityPanel.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
