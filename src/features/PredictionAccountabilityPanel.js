import { Store } from '../Store.js';

const STYLE_ID = 'seta-prediction-accountability-panel-style';
const TARGET_ID = 'module-prediction-accountability-panel';
const OVERLAY_URL = 'public_content/prediction_outcomes/prediction_outcome_overlay_latest.json?v=prediction_accountability_panel_001';
const OVERLAY_SCHEMA_VERSION = 'prediction_outcome_overlay_v1';
const OVERLAY_STALE_WARNING_HOURS = 48;

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

function rowDateMs(row) {
    const candidates = [
        row?.prediction_date,
        row?.resolved_at,
        row?.resolution_date,
        row?.generated_at,
    ];
    for (const value of candidates) {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function sortedRows() {
    return [...rows()].sort((a, b) => {
        const dateDelta = rowDateMs(b) - rowDateMs(a);
        if (dateDelta !== 0) return dateDelta;
        return String(a?.term || '').localeCompare(String(b?.term || ''));
    });
}

function latestRowForAsset(asset) {
    const ticker = String(asset || '').trim().toUpperCase();
    return sortedRows().find(row => String(row?.term || '').trim().toUpperCase() === ticker) || null;
}

function recentRows(limit = 6) {
    return sortedRows().slice(0, limit);
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
      .modulePredictionWarning {
        margin: 0 0 10px;
        border: 1px solid rgba(242, 204, 96, .22);
        border-radius: 10px;
        background: rgba(242, 204, 96, .07);
        color: #f2cc60;
        padding: 8px 10px;
        font-size: 11px;
        line-height: 1.45;
      }
      .modulePredictionWarning ul {
        margin: 4px 0 0 16px;
        padding: 0;
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
          <h2>Loading outcome tracking</h2>
          <p>Checking the latest measured prediction outcomes.</p>
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
          <h2>Outcome tracking unavailable</h2>
          <p>${escapeHtml(error?.message || error || 'Could not load prediction outcome overlay.')}</p>
        </div>
        <span class="modulePredictionAccountabilityPill">Offline</span>
      </div>
      <p class="modulePredictionNote">This panel is informational outcome tracking. SETA explains market emotion and setup quality; accountability rows are measured after their windows close.</p>
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

function isPendingResolutionBasis(row) {
    if (!row || typeof row !== 'object') return false;
    const status = String(row.outcome_status || '').trim().toLowerCase();
    const basisStatus = String(row.resolution_basis_status || '').trim().toLowerCase();
    const note = String(row.public_display_note || '').trim().toLowerCase();
    return (
        status === 'pending_resolution_basis' ||
        basisStatus === 'missing' ||
        note.includes('resolution basis')
    );
}

function hasFinalOutcome(row) {
    return (
        isResolved(row) &&
        !isNoCall(row) &&
        !isPendingResolutionBasis(row) &&
        (
            row?.is_correct === 1 ||
            row?.is_correct === 0 ||
            row?.is_correct === true ||
            row?.is_correct === false
        )
    );
}

function correctnessClass(row) {
    if (!hasFinalOutcome(row)) return 'isPending';
    if (row?.is_correct === 1 || row?.is_correct === true) return 'isCorrect';
    if (row?.is_correct === 0 || row?.is_correct === false) return 'isIncorrect';
    return 'isPending';
}

function correctnessLabel(row) {
    if (!hasFinalOutcome(row)) return 'Pending';
    if (row?.is_correct === 1 || row?.is_correct === true) return 'Correct';
    if (row?.is_correct === 0 || row?.is_correct === false) return 'Miss';
    return 'Pending';
}

function summaryCounts(sourceRows) {
    const list = Array.isArray(sourceRows) ? sourceRows : [];
    const summary = {
        row_count: list.length,
        resolved_count: 0,
        pending_count: 0,
        no_call_count: 0,
        pending_basis_count: 0,
        final_outcome_count: 0,
    };

    list.forEach((row) => {
        if (isNoCall(row)) summary.no_call_count += 1;
        if (isPendingResolutionBasis(row)) summary.pending_basis_count += 1;
        if (hasFinalOutcome(row)) summary.final_outcome_count += 1;
        if (isResolved(row)) {
            summary.resolved_count += 1;
        } else {
            summary.pending_count += 1;
        }
    });

    return summary;
}

function metadataNumber(meta, key, fallback) {
    const number = Number(meta?.[key]);
    return Number.isFinite(number) ? number : fallback;
}

function metadataCountWarnings(meta, derived) {
    const labels = {
        row_count: 'row count',
        resolved_count: 'resolved count',
        pending_count: 'pending count',
        no_call_count: 'unscored count',
    };

    return Object.keys(labels).flatMap((key) => {
        const declared = Number(meta?.[key]);
        if (!Number.isFinite(declared)) return [];
        if (declared === derived[key]) return [];
        return [`Overlay metadata ${labels[key]} (${declared}) differs from row-derived count (${derived[key]}).`];
    });
}

function parseDateMs(value) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function overlayFreshnessState(generatedAt) {
    const generatedMs = parseDateMs(generatedAt);
    if (generatedMs == null) {
        return {
            label: 'Freshness unknown',
            warning: 'Overlay metadata is missing a parseable generated_at timestamp.',
        };
    }

    const ageHours = (Date.now() - generatedMs) / 36e5;
    if (ageHours < -1) {
        return {
            label: 'Timestamp ahead',
            warning: 'Overlay generated_at timestamp appears to be in the future.',
        };
    }
    if (ageHours > OVERLAY_STALE_WARNING_HOURS) {
        return {
            label: 'Stale overlay',
            warning: `Overlay generated_at is ${Math.round(ageHours)} hours old; verify the public refresh completed.`,
        };
    }
    return {
        label: 'Fresh overlay',
        warning: '',
    };
}

function panelWarnings(meta, derived, allRows) {
    const freshness = overlayFreshnessState(meta.generated_at);
    const warnings = metadataCountWarnings(meta, derived);
    if (freshness.warning) warnings.push(freshness.warning);
    if (!allRows.length) warnings.push('No prediction outcome rows are available in the current overlay.');
    return { freshness, warnings };
}

function displayWindowLabel(row) {
    const days = Number(row?.horizon_days || 1);
    if (!Number.isFinite(days) || days <= 0) return 'N/A';
    return `${days}D`;
}

function displayPredictionLabel(row) {
    if (!row) return 'N/A';
    if (isNoCall(row)) return 'No score';
    return labelDirection(row.prediction_label);
}

function displayResultLabel(row) {
    if (!row) return 'N/A';
    if (isNoCall(row)) return 'N/A';
    if (isPendingResolutionBasis(row)) return 'Pending basis';
    if (!isResolved(row)) return 'Not final';
    return labelDirection(row.actual_label, 'Resolved');
}

function publicOutcomeStatusLabel(row) {
    if (!row) return 'Unavailable';
    if (isNoCall(row)) return 'No score';
    if (isPendingResolutionBasis(row)) return 'Pending basis';
    if (!isResolved(row)) return 'In progress';
    if (hasFinalOutcome(row)) return correctnessLabel(row);
    return 'Resolved';
}

function publicOutcomeStatusClass(row) {
    if (!row || isNoCall(row)) return 'isPending';
    if (isPendingResolutionBasis(row)) return 'isPending';
    if (!isResolved(row)) return 'isPending';
    return correctnessClass(row);
}

function outcomeBasisNote(row) {
    if (!row) return '';
    if (isNoCall(row)) {
        return 'No accountability result is assigned to low-confidence or unscored rows.';
    }
    if (isPendingResolutionBasis(row)) {
        return 'Correct/Miss display is withheld until the public payload includes the resolution basis.';
    }
    if (!isResolved(row)) {
        return 'Current result is not final. Outcome resolves after the prediction window closes.';
    }
    if (!hasOutcomeBasis(row)) {
        return 'Resolved row is shown without a detailed public resolution basis; review the upstream payload if this persists.';
    }
    return 'Measured over the stored prediction window, not the live candle.';
}

function recentOutcomeText(row) {
    const date = formatDate(row.prediction_date);
    const prediction = displayPredictionLabel(row);
    const result = displayResultLabel(row);

    if (isNoCall(row)) return `${date}: No score`;
    if (isPendingResolutionBasis(row)) return `${date}: ${prediction} - Pending basis`;
    if (!isResolved(row)) return `${date}: ${prediction} - In progress`;
    if (hasFinalOutcome(row)) return `${date}: ${prediction} - ${result} (${correctnessLabel(row)})`;
    return `${date}: ${prediction} - ${result}`;
}

function renderWarningBlock(warnings) {
    if (!warnings.length) return '';
    return `
      <div class="modulePredictionWarning">
        <strong>Review note</strong>
        <ul>${warnings.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
    `;
}

function renderRecentRows(recents) {
    if (!recents.length) {
        return '<p class="modulePredictionNote">No prediction outcome rows are available in the current overlay.</p>';
    }

    return recents.map(row => `
      <div class="modulePredictionRecentRow">
        <strong>${escapeHtml(row.term)}</strong>
        <span>${escapeHtml(recentOutcomeText(row))}</span>
        <span>Confidence ${escapeHtml(asPercent(row.confidence))}</span>
        <span class="modulePredictionBadge ${escapeHtml(publicOutcomeStatusClass(row))}">${escapeHtml(publicOutcomeStatusLabel(row))}</span>
      </div>
    `).join('');
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
    const allRows = rows();
    const derived = summaryCounts(allRows);
    const { freshness, warnings } = panelWarnings(meta, derived, allRows);
    const asset = activeAsset();
    const activeRow = latestRowForAsset(asset);
    const accuracy = asPercent(meta.selective_accuracy ?? meta.accuracy_on_all_resolved);
    const recents = recentRows(6);
    const pillText = accuracy === '—'
        ? freshness.label
        : `${accuracy} historical follow-through`;

    target.className = 'modulePredictionAccountabilityPanel';
    target.innerHTML = `
      <div class="modulePredictionAccountabilityHeader">
        <div>
          <div class="modulePredictionAccountabilityKicker">Prediction Accountability</div>
          <h2>Outcome Tracking</h2>
          <p>Tracks stored SETA reads and measured outcomes after their windows close. Accountability context only.</p>
        </div>
        <span class="modulePredictionAccountabilityPill">${escapeHtml(pillText)}</span>
      </div>

      <div class="modulePredictionMetricGrid">
        <div class="modulePredictionMetric"><span>Rows</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'row_count', derived.row_count)))}</strong></div>
        <div class="modulePredictionMetric"><span>Resolved</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'resolved_count', derived.resolved_count)))}</strong></div>
        <div class="modulePredictionMetric"><span>Pending</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'pending_count', derived.pending_count)))}</strong></div>
        <div class="modulePredictionMetric"><span>No score</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'no_call_count', derived.no_call_count)))}</strong></div>
        <div class="modulePredictionMetric"><span>Final scored</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'called_evaluated_count', derived.final_outcome_count)))}</strong></div>
        <div class="modulePredictionMetric"><span>Basis pending</span><strong>${escapeHtml(asNumber(metadataNumber(meta, 'pending_resolution_basis_count', derived.pending_basis_count)))}</strong></div>
      </div>

      ${renderWarningBlock(warnings)}

      <div class="modulePredictionActiveRow">
        <h3>${escapeHtml(asset)} latest tracked outcome</h3>
        ${activeRow ? `
          <div class="modulePredictionFactGrid">
            <div class="modulePredictionFact"><span>Date</span><strong>${escapeHtml(formatDate(activeRow.prediction_date))}</strong></div>
            <div class="modulePredictionFact"><span>Stored read</span><strong>${escapeHtml(displayPredictionLabel(activeRow))}</strong></div>
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
        <p class="modulePredictionNote">Recent measured outcomes across tracked assets.</p>
        ${renderRecentRows(recents)}
      </div>

      <p class="modulePredictionNote">
        Accountability view only. Measured results reflect stored prediction windows, not live candle movement. Final scored rows are the only rows eligible for Correct/Miss display; pending basis rows remain withheld until public resolution context is available. Historical follow-through is measured on resolved prediction outcomes and excludes low-confidence or unscored rows where applicable. Read this as after-the-fact accountability context.
        Generated: ${escapeHtml(meta.generated_at || 'unknown')}.
      </p>
    `;
}

function validateOverlayContract(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.rows) || !data.metadata || typeof data.metadata !== 'object') {
        throw new Error('Overlay JSON did not match the expected contract.');
    }

    const rootSchema = String(data.schema_version || '').trim();
    const metadataSchema = String(data.metadata.schema_version || '').trim();

    if (rootSchema !== OVERLAY_SCHEMA_VERSION || metadataSchema !== OVERLAY_SCHEMA_VERSION) {
        throw new Error(`Overlay schema mismatch. Expected ${OVERLAY_SCHEMA_VERSION}.`);
    }
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
        validateOverlayContract(data);
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
    _test: {
        hasFinalOutcome,
        isNoCall,
        isPendingResolutionBasis,
        overlayFreshnessState,
        publicOutcomeStatusLabel,
        summaryCounts,
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
