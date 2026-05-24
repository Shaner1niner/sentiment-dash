const PATCH_TOKEN = 'module_mobile_public_dashboard_affordances_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;
let observer = null;
let queued = false;

function isMobileLayout() {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 720px), (hover: none) and (pointer: coarse)').matches;
}

function installStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .setaMobileJumpLinks {
        display: none;
      }
      html[data-seta-mobile-affordances="${PATCH_TOKEN}"] .setaMobileJumpLinks {
        align-items: center;
        display: flex;
        gap: 8px;
        margin: 10px 0 12px;
        overflow-x: auto;
        padding: 2px 0 4px;
        scrollbar-width: thin;
      }
      .setaMobileJumpLinks a {
        border: 1px solid rgba(88, 166, 255, .36);
        border-radius: 999px;
        color: #9bdcff;
        flex: 0 0 auto;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .04em;
        padding: 7px 10px;
        text-decoration: none;
        text-transform: uppercase;
      }
      .setaMobileChartHint {
        color: #8b949e;
        display: none;
        font-size: 11px;
        letter-spacing: .01em;
        margin: 8px 2px 0;
        text-align: center;
      }
      html[data-seta-mobile-affordances="${PATCH_TOKEN}"] .setaMobileChartHint {
        display: block;
      }
      html[data-seta-mobile-affordances="${PATCH_TOKEN}"] details[data-mobile-collapse="true"] > summary {
        cursor: pointer;
      }
      @media (max-width: 720px) {
        html[data-seta-mobile-affordances="${PATCH_TOKEN}"] #module-market-tape-detail[data-view-mode-detail="full"] .moduleMarketTapeEventTimeline,
        html[data-seta-mobile-affordances="${PATCH_TOKEN}"] #module-market-tape-detail[data-view-mode-detail="full"] .moduleMarketTapeDetailDeck {
          margin-top: 10px;
        }
      }
    `;
    document.head.appendChild(style);
}

function ensureId(node, id) {
    if (node && !node.id) node.id = id;
}

function ensureJumpLinks() {
    const shell = document.querySelector('.harnessShell') || document.body;
    if (!shell || shell.querySelector('.setaMobileJumpLinks')) return;

    const banner = document.querySelector('.harnessBanner');
    const controls = document.querySelector('.controls');
    const nav = document.createElement('nav');
    nav.className = 'setaMobileJumpLinks';
    nav.setAttribute('aria-label', 'Mobile dashboard shortcuts');
    nav.innerHTML = `
      <a href="#market-radar-mobile-anchor">Radar</a>
      <a href="#asset-briefing-mobile-anchor">Briefing</a>
      <a href="#active-snapshot-mobile-anchor">Snapshot</a>
      <a href="#chart-mobile-anchor">Chart</a>
    `;

    if (controls && controls.parentNode) {
        controls.parentNode.insertBefore(nav, controls.nextSibling);
    } else if (banner && banner.parentNode) {
        banner.parentNode.insertBefore(nav, banner.nextSibling);
    } else {
        shell.insertBefore(nav, shell.firstChild);
    }
}

function applyAnchors() {
    ensureId(document.querySelector('.moduleMarketTapeCard'), 'market-radar-mobile-anchor');
    ensureId(document.querySelector('.moduleBriefingCard'), 'asset-briefing-mobile-anchor');
    ensureId(document.getElementById('module-market-tape-detail'), 'active-snapshot-mobile-anchor');
    ensureId(document.getElementById('chart'), 'chart-mobile-anchor');
}

function ensureChartHint() {
    const chart = document.getElementById('chart');
    if (!chart || document.querySelector('.setaMobileChartHint')) return;
    const hint = document.createElement('div');
    hint.className = 'setaMobileChartHint';
    hint.textContent = 'Touch and drag the chart to inspect values.';
    chart.parentNode?.insertBefore(hint, chart);
}

function collapseResearchDiagnostics() {
    const mobile = isMobileLayout();
    const detail = document.getElementById('module-market-tape-detail');
    if (!detail || detail.getAttribute('data-view-mode-detail') !== 'full') return;

    detail.querySelectorAll('details').forEach(details => {
        const summary = details.querySelector('summary');
        const text = summary?.textContent || '';
        const isDeepDiagnostic = /Evidence Trail|Signal Internals/i.test(text);
        if (!isDeepDiagnostic) return;
        details.setAttribute('data-mobile-collapse', 'true');
        if (mobile && !details.hasAttribute('data-user-opened')) {
            details.open = false;
        }
    });
}

function markUserOpenedDetails() {
    document.querySelectorAll('details[data-mobile-collapse="true"]').forEach(details => {
        if (details.getAttribute('data-mobile-listener') === PATCH_TOKEN) return;
        details.setAttribute('data-mobile-listener', PATCH_TOKEN);
        details.addEventListener('toggle', () => {
            if (details.open) details.setAttribute('data-user-opened', 'true');
        });
    });
}

function applyMobileAffordances() {
    if (typeof document === 'undefined') return;
    installStyle();
    const mobile = isMobileLayout();
    document.documentElement.toggleAttribute('data-seta-mobile-affordances', mobile);
    if (mobile) document.documentElement.setAttribute('data-seta-mobile-affordances', PATCH_TOKEN);
    ensureJumpLinks();
    applyAnchors();
    ensureChartHint();
    collapseResearchDiagnostics();
    markUserOpenedDetails();
}

function queueApply() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
        queued = false;
        applyMobileAffordances();
    });
}

function startMobilePublicDashboardAffordances() {
    applyMobileAffordances();
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', queueApply, { passive: true });
    }
    if (!observer && typeof MutationObserver !== 'undefined' && document.body) {
        observer = new MutationObserver(() => queueApply());
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-view-mode-detail'] });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMobilePublicDashboardAffordances);
} else {
    startMobilePublicDashboardAffordances();
}

export { PATCH_TOKEN, applyMobileAffordances, startMobilePublicDashboardAffordances };