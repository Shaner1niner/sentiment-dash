// Prediction Accountability Placement Polish v5
//
// Modular-route copy and placement polish. Keeps the core
// PredictionAccountabilityPanel data contract intact while making accountability
// read as measured-outcome context rather than a trading surface.
//
// v2: observer-safe/idempotent. Avoids repeated text mutations from the
// MutationObserver loop that can lock the page during local QA.
// v3: starts observing before the first apply attempt so it still catches the
// accountability panel when PredictionAccountabilityPanel renders later.
// v4: applies below-chart placement to modular public and modular research/member
// routes for a consistent read-structure-first, review-accountability-later flow.
// v5: removes public-facing action-oriented phrasing in favor of outcome
// tracking, historical follow-through, and accountability language.

(function attachPredictionAccountabilityPlacementPolish(globalScope) {
  'use strict';

  const TARGET_ID = 'module-prediction-accountability-panel';
  const STYLE_ID = 'prediction-accountability-placement-polish-style';
  const PATCH_ATTR = 'data-accountability-placement-polished';
  const MOVED_ATTR = 'data-accountability-moved-below-chart';

  let observer = null;
  let applying = false;
  let observing = false;

  function mode() {
    return String(globalScope.DASH_MODE_DEFAULT || '').toLowerCase();
  }

  function isModularDashboardMode() {
    return mode() === 'public' || mode() === 'member';
  }

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) {
      node.textContent = value;
    }
  }

  function scheduleApply() {
    if (globalScope.requestAnimationFrame) {
      globalScope.requestAnimationFrame(apply);
    } else {
      setTimeout(apply, 0);
    }
  }

  function observe(documentRef) {
    if (!observer || !documentRef || !documentRef.body || observing) return;
    observer.observe(documentRef.body, {
      childList: true,
      subtree: true
    });
    observing = true;
  }

  function disconnectObserver() {
    if (!observer || !observing) return;
    observer.disconnect();
    observing = false;
  }

  function injectStyle(documentRef) {
    if (!documentRef || documentRef.getElementById(STYLE_ID)) return;
    const style = documentRef.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .modulePredictionAccountabilityPanel.publicAccountabilityAfterChart,
      .modulePredictionAccountabilityPanel.modularAccountabilityAfterChart {
        margin-top: 18px;
        margin-bottom: 18px;
      }
      .modulePredictionAccountabilityPanel.publicAccountabilityAfterChart::before,
      .modulePredictionAccountabilityPanel.modularAccountabilityAfterChart::before {
        content: 'Accountability layer';
        display: inline-flex;
        margin: 0 0 8px;
        padding: 3px 8px;
        border: 1px solid rgba(125, 211, 252, .24);
        border-radius: 999px;
        color: #7dd3fc;
        background: rgba(13, 17, 23, .52);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
    `;
    documentRef.head.appendChild(style);
  }

  function polishCopy(panel) {
    const heading = panel.querySelector('.modulePredictionAccountabilityHeader h2');
    setTextIfChanged(heading, 'Outcome Tracking');

    const subhead = panel.querySelector('.modulePredictionAccountabilityHeader p');
    if (subhead && /stored reads|prediction windows|accountability context/i.test(subhead.textContent || '')) {
      setTextIfChanged(subhead, 'Tracks stored SETA reads and measured outcomes after their windows close. Accountability context only.');
    }

    panel.querySelectorAll('.modulePredictionFact span').forEach((node) => {
      if (node.textContent.trim() === 'Prediction') {
        setTextIfChanged(node, 'Stored read');
      }
    });

  }

  function moveBelowChart(documentRef, panel) {
    const chart = documentRef.getElementById('chart');
    if (!chart || !chart.parentNode) return;
    if (panel.getAttribute(MOVED_ATTR) === '1' && panel.previousElementSibling === chart) return;
    if (panel.previousElementSibling !== chart) chart.parentNode.insertBefore(panel, chart.nextSibling);
    panel.classList.add('publicAccountabilityAfterChart');
    panel.classList.add('modularAccountabilityAfterChart');
    panel.setAttribute(MOVED_ATTR, '1');
  }

  function apply() {
    if (applying) return;
    const documentRef = globalScope.document;
    if (!documentRef || !isModularDashboardMode()) return;
    const panel = documentRef.getElementById(TARGET_ID);
    if (!panel) {
      observe(documentRef);
      return;
    }

    applying = true;
    disconnectObserver();

    try {
      injectStyle(documentRef);
      moveBelowChart(documentRef, panel);
      polishCopy(panel);
      if (panel.getAttribute(PATCH_ATTR) !== '1') panel.setAttribute(PATCH_ATTR, '1');
    } finally {
      applying = false;
      observe(documentRef);
    }
  }

  function init() {
    const documentRef = globalScope.document;
    if (!documentRef || !isModularDashboardMode()) return;

    observer = new MutationObserver(scheduleApply);
    observe(documentRef);
    apply();
  }

  if (globalScope.document) {
    if (globalScope.document.readyState === 'loading') {
      globalScope.document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
