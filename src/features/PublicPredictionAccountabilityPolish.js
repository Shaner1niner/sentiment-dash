// Prediction Accountability Placement Polish v4
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

(function attachPredictionAccountabilityPlacementPolish(globalScope) {
  'use strict';

  const TARGET_ID = 'module-prediction-accountability-panel';
  const STYLE_ID = 'prediction-accountability-placement-polish-style';
  const PATCH_ATTR = 'data-accountability-placement-polished';
  const MOVED_ATTR = 'data-accountability-moved-below-chart';
  const SHOW_TEXT = globalScope.NodeFilter ? globalScope.NodeFilter.SHOW_TEXT : 4;

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

  function replaceText(root, from, to) {
    if (!root || !root.textContent || !root.textContent.includes(from)) return;
    const walker = root.ownerDocument.createTreeWalker(root, SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (node.nodeValue && node.nodeValue.includes(from)) {
        const nextValue = node.nodeValue.replaceAll(from, to);
        if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
      }
    });
  }

  function polishCopy(panel) {
    const heading = panel.querySelector('.modulePredictionAccountabilityHeader h2');
    setTextIfChanged(heading, 'Model Call Accountability');

    const subhead = panel.querySelector('.modulePredictionAccountabilityHeader p');
    if (subhead && /model calls|prediction windows|trading signal/i.test(subhead.textContent || '')) {
      setTextIfChanged(subhead, 'Tracks stored model calls and measured outcomes after prediction windows close. Accountability context only.');
    }

    panel.querySelectorAll('.modulePredictionActiveRow h3').forEach((node) => {
      const nextValue = node.textContent.replace('latest model call', 'latest tracked call');
      setTextIfChanged(node, nextValue);
    });

    panel.querySelectorAll('.modulePredictionFact span').forEach((node) => {
      if (node.textContent.trim() === 'Prediction') setTextIfChanged(node, 'Model call');
    });

    replaceText(panel, 'Not a live trading signal.', 'Not a standalone forecast or recommendation.');
    replaceText(panel, 'This is not a trade signal or price target.', 'This is not a standalone forecast or recommendation.');
    replaceText(panel, 'it does not issue trade instructions.', 'it does not issue recommendations.');
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
