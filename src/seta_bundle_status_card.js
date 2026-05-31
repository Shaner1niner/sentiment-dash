// SETA bundle status card v1
//
// First visible member-mode surface for staged SETA equal/mcap bundles.
// This is intentionally read-only. It does not add charts, selectors,
// interpretations, or changes to the existing Fix 26 chart-store flow.

(function attachSetaBundleStatusCard(globalScope) {
  'use strict';

  const CARD_ID = 'setaBundleStatusCard';
  const CARD_CLASS = 'setaBundleStatusCard';
  const READY_CLASS = 'is-ready';
  const PENDING_CLASS = 'is-pending';
  const ERROR_CLASS = 'is-error';

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatList(values) {
    if (!Array.isArray(values) || !values.length) return 'Unavailable';
    return values.map((item) => escapeHTML(item)).join(' / ');
  }

  function formatWeightings(values) {
    if (!Array.isArray(values) || !values.length) return 'Unavailable';
    return values
      .map((item) => (String(item).toLowerCase() === 'mcap' ? 'market-cap' : String(item)))
      .map((item) => escapeHTML(item))
      .join(' / ');
  }

  function ensureStyles(documentRef) {
    if (!documentRef || documentRef.getElementById('setaBundleStatusCardStyles')) return;
    const style = documentRef.createElement('style');
    style.id = 'setaBundleStatusCardStyles';
    style.textContent = `
      .${CARD_CLASS} {
        margin: 14px 0 16px 0;
        padding: 14px 16px;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.72);
        color: #e5e7eb;
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.18);
      }
      .${CARD_CLASS} .setaBundleStatusEyebrow {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #93c5fd;
        margin-bottom: 6px;
      }
      .${CARD_CLASS} .setaBundleStatusTitle {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 7px;
      }
      .${CARD_CLASS} .setaBundleStatusCopy {
        font-size: 12px;
        line-height: 1.45;
        color: #cbd5e1;
        margin-bottom: 10px;
      }
      .${CARD_CLASS} .setaBundleStatusGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px 14px;
      }
      .${CARD_CLASS} .setaBundleStatusMetric {
        min-width: 0;
      }
      .${CARD_CLASS} .setaBundleStatusLabel {
        font-size: 10px;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 2px;
      }
      .${CARD_CLASS} .setaBundleStatusValue {
        font-size: 12px;
        color: #f8fafc;
        overflow-wrap: anywhere;
      }
      .${CARD_CLASS}.${PENDING_CLASS} .setaBundleStatusTitle { color: #fbbf24; }
      .${CARD_CLASS}.${ERROR_CLASS} .setaBundleStatusTitle { color: #fca5a5; }
      .${CARD_CLASS}.${READY_CLASS} .setaBundleStatusTitle { color: #86efac; }
      @media (max-width: 680px) {
        .${CARD_CLASS} .setaBundleStatusGrid { grid-template-columns: 1fr; }
      }
    `;
    documentRef.head.appendChild(style);
  }

  function cardShell(documentRef) {
    let card = documentRef.getElementById(CARD_ID);
    if (card) return card;
    card = documentRef.createElement('section');
    card.id = CARD_ID;
    card.className = `${CARD_CLASS} ${PENDING_CLASS}`;
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
      <div class="setaBundleStatusEyebrow">SETA Bundle</div>
      <div class="setaBundleStatusTitle">Checking bundle availability...</div>
      <div class="setaBundleStatusCopy">Loading the staged equal/market-cap SETA bundle manifest.</div>
    `;

    const summaryLead = documentRef.getElementById('summaryLead');
    if (summaryLead && summaryLead.parentNode) {
      summaryLead.parentNode.insertBefore(card, summaryLead.nextSibling);
    } else {
      documentRef.body.insertBefore(card, documentRef.body.firstChild);
    }
    return card;
  }

  function renderUnavailable(card, reason) {
    card.className = `${CARD_CLASS} ${ERROR_CLASS}`;
    card.innerHTML = `
      <div class="setaBundleStatusEyebrow">SETA Bundle</div>
      <div class="setaBundleStatusTitle">Bundle unavailable</div>
      <div class="setaBundleStatusCopy">The staged SETA equal/market-cap bundle could not be loaded yet. Existing dashboard charts are unaffected.</div>
      <div class="setaBundleStatusGrid">
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Status</div>
          <div class="setaBundleStatusValue">Pending</div>
        </div>
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Reason</div>
          <div class="setaBundleStatusValue">${escapeHTML(reason || 'manifest unavailable')}</div>
        </div>
      </div>
    `;
  }

  function renderAvailable(card, manifest) {
    card.className = `${CARD_CLASS} ${READY_CLASS}`;
    card.innerHTML = `
      <div class="setaBundleStatusEyebrow">SETA Bundle</div>
      <div class="setaBundleStatusTitle">Available</div>
      <div class="setaBundleStatusCopy">Equal-weight remains the baseline. Market-cap weighting is available as an alternate participation-structure lens, not a price prediction or trade signal.</div>
      <div class="setaBundleStatusGrid">
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Latest date</div>
          <div class="setaBundleStatusValue">${escapeHTML(manifest.latest_date || 'Unavailable')}</div>
        </div>
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Generated at</div>
          <div class="setaBundleStatusValue">${escapeHTML(manifest.generated_at || 'Unavailable')}</div>
        </div>
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Universes</div>
          <div class="setaBundleStatusValue">${formatList(manifest.universes)}</div>
        </div>
        <div class="setaBundleStatusMetric">
          <div class="setaBundleStatusLabel">Weightings</div>
          <div class="setaBundleStatusValue">${formatWeightings(manifest.weightings)}</div>
        </div>
      </div>
    `;
  }

  async function renderSetaBundleStatusCard(options) {
    const opts = options || {};
    const documentRef = opts.documentRef || globalScope.document;
    if (!documentRef) return null;
    ensureStyles(documentRef);
    const card = cardShell(documentRef);
    const loader = opts.loader || globalScope.SETA_BUNDLE_LOADER;
    if (!loader || typeof loader.loadSetaBundleManifest !== 'function') {
      renderUnavailable(card, 'loader unavailable');
      return { status: 'unavailable', reason: 'loader unavailable' };
    }
    try {
      const loaded = await loader.loadSetaBundleManifest({ manifestUrl: opts.manifestUrl, fetchImpl: opts.fetchImpl });
      renderAvailable(card, loaded.manifest);
      return { status: 'available', manifest: loaded.manifest };
    } catch (error) {
      renderUnavailable(card, error && error.message ? error.message : String(error));
      return { status: 'unavailable', reason: error && error.message ? error.message : String(error) };
    }
  }

  const api = { renderSetaBundleStatusCard };
  globalScope.SETA_BUNDLE_STATUS_CARD = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope.document) {
    globalScope.addEventListener('DOMContentLoaded', () => {
      renderSetaBundleStatusCard();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
