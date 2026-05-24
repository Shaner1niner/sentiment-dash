import { Store } from '../Store.js';

const PATCH_TOKEN = 'module_research_source_mix_panel_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;
const DATA_PATHS = [
    './research_source_mix_contract.json',
    './fix26_chart_store_assets/public/research_source_mix_contract.json',
    './public/research_source_mix_contract.json',
    './data/research_source_mix_contract.json'
];

let loadPromise = null;
let sourceMixPayload = null;
let observer = null;
let queued = false;

function normalizedViewMode() {
    return String(Store.state.currentView || 'briefing').trim().toLowerCase() === 'research'
        ? 'research'
        : 'briefing';
}

function currentAsset() {
    return String(Store.state.currentAsset || '').trim().toUpperCase();
}

function cacheBust(url) {
    const joiner = String(url || '').includes('?') ? '&' : '?';
    return `${url}${joiner}v=${PATCH_TOKEN}`;
}

async function fetchFirstAvailableJson(paths = DATA_PATHS) {
    for (const path of paths) {
        try {
            const response = await fetch(cacheBust(path));
            if (!response.ok) continue;
            const payload = await response.json();
            if (payload && typeof payload === 'object') {
                return { payload, url: path };
            }
        } catch (_) {
            // The sidecar is optional until the SETA export has produced it.
        }
    }
    return { payload: null, url: null };
}

async function loadSourceMixPayload() {
    if (loadPromise) return loadPromise;
    loadPromise = fetchFirstAvailableJson().then(({ payload, url }) => {
        sourceMixPayload = payload ? { ...payload, __loadedFrom: url } : null;
        return sourceMixPayload;
    });
    return loadPromise;
}

function sourceMixContract(payload = sourceMixPayload) {
    if (!payload || typeof payload !== 'object') return null;
    return payload.research_source_mix || payload;
}

function sourceMixRecords(payload = sourceMixPayload) {
    const contract = sourceMixContract(payload);
    const records = contract?.records;
    return Array.isArray(records) ? records : [];
}

function recordForAsset(asset = currentAsset(), payload = sourceMixPayload) {
    const ticker = String(asset || '').trim().toUpperCase();
    if (!ticker) return null;
    return sourceMixRecords(payload).find(record => (
        String(record?.term || record?.asset || record?.ticker || '').trim().toUpperCase() === ticker
    )) || null;
}

function activeWeights(record) {
    const weights = Array.isArray(record?.source_weights) ? record.source_weights : [];
    return weights
        .filter(item => item && (item.is_active || Number(item.weight_pct || item.weight || 0) > 0))
        .map(item => ({
            source: String(item.source || '').trim(),
            label: String(item.label || item.source || '').trim(),
            pct: Number(item.weight_pct ?? (Number(item.weight || 0) * 100)),
            rank: Number(item.rank || 999)
        }))
        .filter(item => item.label && Number.isFinite(item.pct) && item.pct > 0)
        .sort((a, b) => (a.rank - b.rank) || (b.pct - a.pct));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function formatMethod(value) {
    const raw = String(value || '').trim();
    if (!raw) return 'Optimized source mix';
    return raw
        .replaceAll('_', ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .replace('Ridge Source Mix', 'Ridge source mix')
        .replace('Grid Optimized Source Mix', 'Grid-optimized source mix');
}

function metricText(record) {
    const quality = record?.quality || {};
    const items = [];
    if (quality.n_obs !== null && quality.n_obs !== undefined && quality.n_obs !== '') {
        items.push(`${quality.n_obs} observations`);
    }
    if (quality.r2_in_sample !== null && quality.r2_in_sample !== undefined && quality.r2_in_sample !== '') {
        const n = Number(quality.r2_in_sample);
        items.push(Number.isFinite(n) ? `R² ${n.toFixed(2)}` : `R² ${quality.r2_in_sample}`);
    }
    if (record?.run_date) items.push(`run ${record.run_date}`);
    return items.join(' · ');
}

function installStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .moduleResearchSourceMixPanel {
        border: 1px solid rgba(125, 211, 252, .22);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(13, 17, 23, .78), rgba(5, 7, 10, .72));
        box-shadow: 0 0 0 1px rgba(88, 166, 255, .035) inset, 0 18px 38px rgba(1, 4, 9, .18);
        margin-top: 12px;
        padding: 14px;
      }
      html[data-seta-view-mode="briefing"] .moduleResearchSourceMixPanel {
        display: none !important;
      }
      .moduleResearchSourceMixHeader {
        align-items: start;
        display: grid;
        gap: 8px;
        grid-template-columns: 1fr auto;
        margin-bottom: 10px;
      }
      .moduleResearchSourceMixHeader span {
        color: #7dd3fc;
        display: block;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .moduleResearchSourceMixHeader strong {
        color: #f0f6fc;
        display: block;
        font-size: 14px;
        line-height: 1.25;
        margin-top: 3px;
      }
      .moduleResearchSourceMixHeader em {
        color: #8b949e;
        font-size: 10px;
        font-style: normal;
        text-align: right;
        white-space: nowrap;
      }
      .moduleResearchSourceMixSummary {
        color: #c9d1d9;
        font-size: 12px;
        line-height: 1.45;
        margin: 0 0 12px;
      }
      .moduleResearchSourceMixBars {
        display: grid;
        gap: 8px;
      }
      .moduleResearchSourceMixBarRow {
        display: grid;
        gap: 6px;
      }
      .moduleResearchSourceMixBarTop {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: space-between;
      }
      .moduleResearchSourceMixBarTop strong,
      .moduleResearchSourceMixBarTop span {
        color: #f0f6fc;
        font-size: 11px;
      }
      .moduleResearchSourceMixBarTop span {
        color: #f2cc60;
        font-weight: 800;
      }
      .moduleResearchSourceMixBarTrack {
        background: rgba(255,255,255,.06);
        border-radius: 999px;
        height: 6px;
        overflow: hidden;
      }
      .moduleResearchSourceMixBarFill {
        background: linear-gradient(90deg, rgba(88,166,255,.42), rgba(125,211,252,.9));
        border-radius: inherit;
        display: block;
        height: 100%;
        width: var(--source-mix-pct, 0%);
      }
      .moduleResearchSourceMixFooter {
        color: #8b949e;
        display: flex;
        flex-wrap: wrap;
        font-size: 10px;
        gap: 6px 10px;
        margin-top: 12px;
      }
      @media (max-width: 720px) {
        .moduleResearchSourceMixHeader {
          grid-template-columns: 1fr;
        }
        .moduleResearchSourceMixHeader em {
          text-align: left;
          white-space: normal;
        }
      }
    `;
    document.head.appendChild(style);
}

function buildPanel(record) {
    const weights = activeWeights(record);
    if (!record || !weights.length) return null;

    const panel = document.createElement('section');
    panel.className = 'moduleResearchSourceMixPanel';
    panel.setAttribute('data-research-source-mix-panel', PATCH_TOKEN);
    panel.setAttribute('aria-label', 'Research Source Mix');

    const method = formatMethod(record.method);
    const summary = record.summary || weights.map(item => `${item.label} ${Math.round(item.pct)}%`).join(' · ');
    const metric = metricText(record);

    panel.innerHTML = `
      <div class="moduleResearchSourceMixHeader">
        <div>
          <span>Research Source Mix</span>
          <strong>Optimized source contribution for this read.</strong>
        </div>
        <em>${escapeHtml(method)}</em>
      </div>
      <p class="moduleResearchSourceMixSummary">${escapeHtml(summary)}</p>
      <div class="moduleResearchSourceMixBars"></div>
      <div class="moduleResearchSourceMixFooter">
        <span>Research-only diagnostic.</span>
        ${metric ? `<span>${escapeHtml(metric)}</span>` : ''}
      </div>
    `;

    const bars = panel.querySelector('.moduleResearchSourceMixBars');
    weights.forEach(item => {
        const row = document.createElement('div');
        row.className = 'moduleResearchSourceMixBarRow';
        row.style.setProperty('--source-mix-pct', `${Math.max(0, Math.min(100, item.pct))}%`);
        row.innerHTML = `
          <div class="moduleResearchSourceMixBarTop">
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.pct.toFixed(item.pct >= 10 ? 0 : 1))}%</span>
          </div>
          <div class="moduleResearchSourceMixBarTrack" aria-hidden="true"><i class="moduleResearchSourceMixBarFill"></i></div>
        `;
        bars.appendChild(row);
    });

    return panel;
}

function removeExistingPanels(root = document) {
    root.querySelectorAll('[data-research-source-mix-panel]').forEach(node => node.remove());
}

function panelTarget(detailPanel) {
    return detailPanel.querySelector('.moduleMarketTapeSelectedDetail') || detailPanel;
}

function renderResearchSourceMixPanel() {
    if (typeof document === 'undefined') return;
    installStyle();

    const detailPanel = document.getElementById('module-market-tape-detail');
    if (!detailPanel) return;

    removeExistingPanels(detailPanel);

    if (normalizedViewMode() !== 'research') return;

    const record = recordForAsset();
    const panel = buildPanel(record);
    if (!panel) return;

    const target = panelTarget(detailPanel);
    const detailGrid = target.querySelector('.moduleMarketTapeDetailGrid');
    const deck = target.querySelector('.moduleMarketTapeDetailDeck');
    const anchor = detailGrid || deck || null;
    if (anchor && anchor.parentNode === target) {
        target.insertBefore(panel, anchor.nextSibling);
    } else {
        target.appendChild(panel);
    }
}

function queueRender() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
        queued = false;
        renderResearchSourceMixPanel();
    });
}

async function startResearchSourceMixPanel() {
    installStyle();
    loadSourceMixPayload().then(() => queueRender());
    queueRender();

    try {
        Store.on('controlChanged', ({ controlId }) => {
            if (['asset', 'briefingMode'].includes(controlId)) queueRender();
        });
        Store.on('assetChanged', () => queueRender());
        Store.on('screenerUpdated', () => queueRender());
    } catch (_) {}

    if (!observer) {
        observer = new MutationObserver(() => queueRender());
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startResearchSourceMixPanel);
} else {
    startResearchSourceMixPanel();
}

export {
    PATCH_TOKEN,
    activeWeights,
    buildPanel,
    loadSourceMixPayload,
    recordForAsset,
    renderResearchSourceMixPanel,
    startResearchSourceMixPanel
};
