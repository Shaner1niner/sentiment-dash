import { Store } from '../Store.js';

const STYLE_ID = 'seta-data-freshness-indicator-style';
const TARGET_ID = 'module-data-freshness-indicator';
const DAY_MS = 24 * 60 * 60 * 1000;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function asDate(value) {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
}

function rowsForPayload(payload, state = Store.snapshot()) {
    if (!payload || typeof payload !== 'object') return [];

    const freq = String(state.currentFrequency || 'D').trim().toUpperCase();
    const asset = String(state.currentAsset || 'BTC').trim().toUpperCase();
    const candidates = [
        payload?.[freq]?.[asset],
        payload?.[freq]?.[asset.toLowerCase()],
        payload?.[freq],
        payload?.[asset],
        payload?.[asset.toLowerCase()],
        payload?.rows,
        payload?.candles
    ];

    return candidates.find(Array.isArray) || [];
}

function latestRowDate(rows = []) {
    const dates = (Array.isArray(rows) ? rows : [])
        .map(row => asDate(row?.date || row?.dt || row?.timestamp))
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime());

    return dates.length ? dates[dates.length - 1] : null;
}

function daysBetween(later, earlier) {
    const a = asDate(later);
    const b = asDate(earlier);
    if (!a || !b) return null;
    return Math.floor((Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) - Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate())) / DAY_MS);
}

function isReviewedBriefing(state = Store.snapshot()) {
    const store = state.reviewedBriefings;
    if (!store) return false;

    const asset = String(state.currentAsset || '').trim().toUpperCase();
    const freq = String(state.currentFrequency || '').trim().toUpperCase();
    const rows = Array.isArray(store)
        ? store
        : Object.values(store?.records || store?.items || store?.by_asset || store?.byAsset || store || {}).flat();

    return rows.some(item => {
        if (!item || typeof item !== 'object') return false;
        const itemAsset = String(item.asset || item.term || item.ticker || item.symbol || item.db_term || '').trim().toUpperCase();
        const itemFreq = String(item.frequency || item.freq || item.input_frequency || '').trim().toUpperCase();
        const reviewed = item.reviewed || item.is_reviewed || String(item.review_status || '').toLowerCase() === 'reviewed';
        return reviewed && (!asset || !itemAsset || itemAsset === asset) && (!freq || !itemFreq || itemFreq === freq);
    });
}

function dateLabel(date) {
    const d = asDate(date);
    if (!d) return '';
    return d.toISOString().slice(0, 10);
}

function freshnessTooltip(status) {
    const base = 'Freshness is a data-quality cue, not a price forecast or trade instruction.';
    const dateText = status.latestDataDate ? ` Latest visible data date: ${status.latestDataDate}.` : '';

    if (status.status === 'stale') {
        return `Latest visible data is older than expected.${dateText} Interpret short-term signals with caution. ${base}`;
    }

    if (status.status === 'source_warning' || status.status === 'partial_coverage') {
        return `Latest visible data may have partial refresh coverage.${dateText} Interpret short-term signals with caution. ${base}`;
    }

    if (status.status === 'reviewed') {
        return `Reviewed dashboard context is available.${dateText} SETA explains market emotion and setup quality, not trade instructions.`;
    }

    if (status.status === 'fresh') {
        return `Fresh means the selected dashboard payload contains recent visible data.${dateText} ${base}`;
    }

    return `Freshness could not be confirmed from dated dashboard rows. ${base}`;
}

export function classifyDataFreshness(state = Store.snapshot(), now = new Date()) {
    const payload = state.currentAssetPayload;
    const rows = rowsForPayload(payload, state);
    const latestDate = latestRowDate(rows);
    const loadedAt = asDate(state.assetPayloadMeta?.loadedAt);
    const ageDays = latestDate ? daysBetween(now, latestDate) : null;
    const reviewed = isReviewedBriefing(state);

    if (!payload || !rows.length || !latestDate) {
        const status = {
            status: 'unknown',
            label: 'freshness unknown',
            detail: 'Dashboard payload loaded, but no dated rows were available for a freshness read.',
            generatedAt: loadedAt ? loadedAt.toISOString() : null,
            latestDataDate: null,
            reviewed
        };
        return { ...status, tooltip: freshnessTooltip(status) };
    }

    if (ageDays !== null && ageDays > 7) {
        const status = {
            status: 'stale',
            label: 'stale',
            detail: `Latest visible data is from ${dateLabel(latestDate)}. Interpret short-term signals with caution.`,
            generatedAt: loadedAt ? loadedAt.toISOString() : null,
            latestDataDate: dateLabel(latestDate),
            reviewed
        };
        return { ...status, tooltip: freshnessTooltip(status) };
    }

    if (ageDays !== null && ageDays > 2) {
        const status = {
            status: 'source_warning',
            label: 'source warning',
            detail: `Latest visible data is from ${dateLabel(latestDate)}. Some refresh coverage may be partial.`,
            generatedAt: loadedAt ? loadedAt.toISOString() : null,
            latestDataDate: dateLabel(latestDate),
            reviewed
        };
        return { ...status, tooltip: freshnessTooltip(status) };
    }

    if (reviewed) {
        const status = {
            status: 'reviewed',
            label: 'reviewed',
            detail: `Reviewed dashboard context loaded. Latest visible data date: ${dateLabel(latestDate)}.`,
            generatedAt: loadedAt ? loadedAt.toISOString() : null,
            latestDataDate: dateLabel(latestDate),
            reviewed
        };
        return { ...status, tooltip: freshnessTooltip(status) };
    }

    const status = {
        status: 'fresh',
        label: ageDays === 0 ? 'refreshed today' : 'fresh',
        detail: `Latest visible data date: ${dateLabel(latestDate)}.`,
        generatedAt: loadedAt ? loadedAt.toISOString() : null,
        latestDataDate: dateLabel(latestDate),
        reviewed
    };
    return { ...status, tooltip: freshnessTooltip(status) };
}

function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .moduleDataFreshnessIndicator {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: -4px 0 14px;
        color: #8b949e;
        font-size: 11px;
      }
      .moduleDataFreshnessPill {
        border: 1px solid rgba(125, 211, 252, .30);
        border-radius: 999px;
        background: rgba(13, 17, 23, .78);
        color: #9bdcff;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 9px;
        text-transform: uppercase;
        letter-spacing: .055em;
        font-weight: 800;
      }
      .moduleDataFreshnessPill::before {
        content: '';
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 10px currentColor;
      }
      .moduleDataFreshnessPill.is-reviewed,
      .moduleDataFreshnessPill.is-fresh {
        border-color: rgba(126, 231, 135, .42);
        color: #7ee787;
      }
      .moduleDataFreshnessPill.is-source_warning,
      .moduleDataFreshnessPill.is-partial_coverage {
        border-color: rgba(242, 204, 96, .42);
        color: #f2cc60;
      }
      .moduleDataFreshnessPill.is-stale {
        border-color: rgba(255, 123, 114, .45);
        color: #ffa198;
      }
      .moduleDataFreshnessPill.is-unknown {
        border-color: rgba(139, 148, 158, .30);
        color: #8b949e;
      }
      .moduleDataFreshnessDetail {
        color: #8b949e;
        line-height: 1.35;
      }
      @media (max-width: 640px) {
        .moduleDataFreshnessIndicator {
          margin-top: 2px;
        }
      }
    `;
    document.head.appendChild(style);
}

function ensureTarget() {
    let target = document.getElementById(TARGET_ID);
    if (target) return target;

    const banner = document.querySelector('.harnessBanner');
    target = document.createElement('section');
    target.id = TARGET_ID;
    target.className = 'moduleDataFreshnessIndicator';
    target.setAttribute('aria-live', 'polite');

    if (banner && banner.parentNode) {
        banner.parentNode.insertBefore(target, banner.nextSibling);
    } else {
        document.body.prepend(target);
    }
    return target;
}

export const DataFreshnessIndicator = {
    targetId: TARGET_ID,

    init() {
        ensureStyle();
        ensureTarget();
        this.render();

        Store.on('assetPayloadUpdated', () => this.render());
        Store.on('reviewedBriefingsUpdated', () => this.render());
        Store.on('controlChanged', () => this.render());
    },

    render() {
        const target = ensureTarget();
        const status = classifyDataFreshness(Store.snapshot());
        target.innerHTML = `
          <span class="moduleDataFreshnessPill is-${escapeHtml(status.status)}" title="${escapeHtml(status.tooltip || status.detail)}">${escapeHtml(status.label)}</span>
          <span class="moduleDataFreshnessDetail" title="${escapeHtml(status.tooltip || status.detail)}">${escapeHtml(status.detail)}</span>
        `;
    }
};
