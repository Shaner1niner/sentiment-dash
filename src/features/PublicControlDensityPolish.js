// Public Control Density Polish v3
//
// Public-route-only DOM polish that keeps the existing Controls.js contract intact.
// It reorganizes existing control nodes into a small primary row and a collapsed
// advanced section. It does not change control IDs, payload schemas, chart data,
// scoring, or research route behavior.

(function attachPublicControlDensityPolish(globalScope) {
  'use strict';

  const STYLE_ID = 'publicControlDensityPolishStyles';
  const APPLIED_ATTR = 'data-public-control-density-polished';
  const PUBLIC_MODE = 'public';
  const PRIMARY_CONTROLS = ['asset', 'freq', 'range', 'briefingMode'];
  const ADVANCED_CONTROLS = ['priceDisplay', 'scaleMode', 'ribbon', 'regimeLayer', 'engagement', 'bollinger', 'osc'];

  function isPublicMode() {
    return String(globalScope.DASH_MODE_DEFAULT || '').toLowerCase() === PUBLIC_MODE;
  }

  function injectStyles(documentRef) {
    if (!documentRef || documentRef.getElementById(STYLE_ID)) return;
    const style = documentRef.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .harnessBanner {
        position: relative;
        overflow: hidden;
      }
      .harnessBanner::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(circle at 18% 0%, rgba(125, 211, 252, .10), transparent 32%);
      }
      .harnessBanner h1,
      .harnessBanner p {
        position: relative;
        z-index: 1;
      }
      .publicReadingRail {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin: 0 0 14px;
      }
      .publicReadingStep {
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(13, 17, 23, .70), rgba(5, 7, 10, .44));
        padding: 11px 12px;
        min-height: 74px;
      }
      .publicReadingStep span {
        display: block;
        color: #7dd3fc;
        font-size: 10px;
        letter-spacing: .10em;
        text-transform: uppercase;
        margin-bottom: 5px;
      }
      .publicReadingStep strong {
        display: block;
        color: #f0f6fc;
        font-size: 13px;
        line-height: 1.2;
        margin-bottom: 3px;
      }
      .publicReadingStep em {
        display: block;
        color: #8b949e;
        font-size: 11px;
        font-style: normal;
        line-height: 1.35;
      }
      .controls.publicControlDeck {
        display: block;
        border: 1px solid rgba(125, 211, 252, .18);
        border-radius: 14px;
        background: rgba(13, 17, 23, .62);
        padding: 12px;
        margin: 0 0 14px;
      }
      .publicPrimaryControls {
        display: grid;
        grid-template-columns: minmax(140px, 1.2fr) repeat(3, minmax(116px, .8fr));
        gap: 10px;
        align-items: end;
      }
      .publicPrimaryControls .control,
      .publicAdvancedControls .control {
        min-width: 0;
      }
      .publicAdvancedControlShell {
        margin-top: 10px;
        border-top: 1px solid rgba(125, 211, 252, .12);
        padding-top: 9px;
      }
      .publicAdvancedControlShell summary {
        list-style: none;
        cursor: pointer;
        user-select: none;
        color: #7dd3fc;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .publicAdvancedControlShell summary::-webkit-details-marker {
        display: none;
      }
      .publicAdvancedControlShell summary em {
        color: #8b949e;
        font-style: normal;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
      }
      .publicAdvancedControlShell summary::after {
        content: 'Show';
        border: 1px solid rgba(125, 211, 252, .32);
        border-radius: 999px;
        padding: 2px 8px;
        color: #7dd3fc;
        font-size: 10px;
        letter-spacing: .04em;
        background: rgba(5, 7, 10, .58);
      }
      .publicAdvancedControlShell[open] summary::after {
        content: 'Hide';
        color: #f2cc60;
        border-color: rgba(242, 204, 96, .36);
      }
      .publicAdvancedControls {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 10px;
        opacity: .88;
      }
      .publicAdvancedControls label {
        color: #8b949e;
      }
      .publicControlNote {
        margin: 8px 0 0;
        color: #8b949e;
        font-size: 11px;
        line-height: 1.35;
      }
      @media (max-width: 900px) {
        .publicReadingRail,
        .publicPrimaryControls,
        .publicAdvancedControls {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 620px) {
        .publicReadingRail,
        .publicPrimaryControls,
        .publicAdvancedControls {
          grid-template-columns: 1fr;
        }
      }
    `;
    documentRef.head.appendChild(style);
  }

  function controlFor(container, controlId) {
    return container.querySelector(`.control[data-control="${controlId}"]`);
  }

  function buildReadingRail(documentRef) {
    const rail = documentRef.createElement('section');
    rail.className = 'publicReadingRail';
    rail.setAttribute('aria-label', 'How to read this sample');
    rail.setAttribute('data-seta-onboarding-rail', 'public-dashboard-controls-onboarding');
    rail.innerHTML = `
      <article class="publicReadingStep"><span>1 - Radar</span><strong>Pick an asset</strong><em>Start with the selected asset and context date.</em></article>
      <article class="publicReadingStep"><span>2 - Briefing</span><strong>Read market context</strong><em>Compare sentiment, attention, and structure against recent price behavior.</em></article>
      <article class="publicReadingStep"><span>3 - Chart</span><strong>Use the chart as context</strong><em>Treat this as market context only, not a trading signal.</em></article>
      <article class="publicReadingStep"><span>4 - Accountability</span><strong>Check measured outcomes</strong><em>Review historical follow-through after the chart.</em></article>
    `;
    return rail;
  }

  function polishBanner(documentRef) {
    const banner = documentRef.querySelector('.harnessBanner');
    if (!banner || banner.dataset.publicCopyPolished === '1') return;
    const paragraph = banner.querySelector('p');
    if (paragraph) {
      paragraph.textContent = 'A public-safe sample of SETA market attention, participation, structure, and sentiment context. Start with the selected asset, then use more chart controls only when needed.';
    }
    banner.dataset.publicCopyPolished = '1';
  }

  function insertReadingRail(documentRef, controlsEl) {
    if (documentRef.querySelector('.publicReadingRail')) return;
    const banner = documentRef.querySelector('.harnessBanner');
    const rail = buildReadingRail(documentRef);
    if (banner && banner.parentNode) {
      banner.parentNode.insertBefore(rail, banner.nextSibling);
    } else if (controlsEl && controlsEl.parentNode) {
      controlsEl.parentNode.insertBefore(rail, controlsEl);
    }
  }

  function applyControlDensity(documentRef) {
    const controlsEl = documentRef.querySelector('.controls');
    if (!controlsEl || controlsEl.getAttribute(APPLIED_ATTR) === '1') return;

    const primaryWrap = documentRef.createElement('div');
    primaryWrap.className = 'publicPrimaryControls';
    primaryWrap.setAttribute('data-seta-primary-controls', 'asset-frequency-range-view');

    const advancedWrap = documentRef.createElement('div');
    advancedWrap.className = 'publicAdvancedControls';
    advancedWrap.setAttribute('data-seta-advanced-controls', 'chart-display-layers');

    PRIMARY_CONTROLS.forEach((controlId) => {
      const node = controlFor(controlsEl, controlId);
      if (node) primaryWrap.appendChild(node);
    });

    ADVANCED_CONTROLS.forEach((controlId) => {
      const node = controlFor(controlsEl, controlId);
      if (node) advancedWrap.appendChild(node);
    });

    if (!primaryWrap.children.length) return;

    const details = documentRef.createElement('details');
    details.className = 'publicAdvancedControlShell';
    details.innerHTML = '<summary>More chart controls <em>chart type, structure, attention, timing</em></summary>';
    details.appendChild(advancedWrap);

    const note = documentRef.createElement('p');
    note.className = 'publicControlNote';
    note.textContent = 'Start with asset, range, and view. More controls change the display, not the public context.';

    controlsEl.classList.add('publicControlDeck');
    controlsEl.setAttribute(APPLIED_ATTR, '1');
    controlsEl.innerHTML = '';
    controlsEl.appendChild(primaryWrap);
    controlsEl.appendChild(details);
    controlsEl.appendChild(note);
  }

  function init() {
    const documentRef = globalScope.document;
    if (!documentRef || !isPublicMode()) return;
    injectStyles(documentRef);
    polishBanner(documentRef);
    const controlsEl = documentRef.querySelector('.controls');
    insertReadingRail(documentRef, controlsEl);
    applyControlDensity(documentRef);
  }

  const api = { init };
  globalScope.PUBLIC_CONTROL_DENSITY_POLISH = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope.document) {
    if (globalScope.document.readyState === 'loading') {
      globalScope.document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
