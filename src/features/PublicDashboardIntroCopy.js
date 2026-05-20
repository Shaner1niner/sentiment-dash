const INTRO_COPY_TOKEN = 'module_public_dashboard_intro_copy_001';

const PUBLIC_DASHBOARD_SUBTITLE = 'Read attention, sentiment, structure, and confirmation context in one view. SETA explains market emotion and setup quality - not price targets or trade instructions.';
const PUBLIC_LANGUAGE_GUIDE_URL = './how_seta_reads_the_market.html';

const CONTROL_LABELS = {
    asset: 'Asset',
    freq: 'Frequency',
    range: 'Display range',
    briefingMode: 'View',
    priceDisplay: 'Chart type',
    scaleMode: 'Chart scale',
    ribbon: 'Trend lens',
    regimeLayer: 'Structure strip',
    engagement: 'Attention layer',
    bollinger: 'Range bands',
    osc: 'Sentiment layer'
};

function applyControlLabels() {
    Object.entries(CONTROL_LABELS).forEach(([controlId, label]) => {
        const el = document.querySelector(`[data-label-for="${controlId}"]`);
        if (!el) return;
        el.textContent = label;
        el.setAttribute('data-copy-token', INTRO_COPY_TOKEN);
    });
}

function installLanguageGuideLinkStyle() {
    if (document.getElementById(`${INTRO_COPY_TOKEN}_style`)) return;

    const style = document.createElement('style');
    style.id = `${INTRO_COPY_TOKEN}_style`;
    style.textContent = `
      .setaLanguageGuideLink {
        border: 1px solid rgba(125, 211, 252, .32);
        border-radius: 999px;
        color: #7dd3fc;
        display: inline-flex;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .06em;
        margin-top: 8px;
        padding: 5px 9px;
        text-decoration: none;
        text-transform: uppercase;
        width: fit-content;
      }
      .setaLanguageGuideLink:hover,
      .setaLanguageGuideLink:focus {
        border-color: rgba(125, 211, 252, .62);
        color: #b6e7ff;
        outline: none;
      }
    `;
    document.head.appendChild(style);
}

function applyLanguageGuideLink(banner) {
    if (!banner || banner.querySelector('[data-seta-language-guide-link]')) return;

    const link = document.createElement('a');
    link.className = 'setaLanguageGuideLink';
    link.href = PUBLIC_LANGUAGE_GUIDE_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'How SETA reads the market';
    link.setAttribute('data-seta-language-guide-link', INTRO_COPY_TOKEN);
    banner.appendChild(link);
}

function applyPublicDashboardIntroCopy() {
    if (typeof document === 'undefined') return;

    installLanguageGuideLinkStyle();

    const banner = document.querySelector('.harnessBanner');
    if (banner) {
        const paragraph = banner.querySelector('p');
        if (paragraph) {
            paragraph.textContent = PUBLIC_DASHBOARD_SUBTITLE;
            paragraph.setAttribute('data-copy-token', INTRO_COPY_TOKEN);
        }
        applyLanguageGuideLink(banner);
    }

    applyControlLabels();

    if (document.title === 'SETA Public Dashboard') {
        document.title = 'SETA Public Dashboard | Attention, Sentiment, Structure';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPublicDashboardIntroCopy);
} else {
    applyPublicDashboardIntroCopy();
}

export { CONTROL_LABELS, PUBLIC_DASHBOARD_SUBTITLE, PUBLIC_LANGUAGE_GUIDE_URL, applyPublicDashboardIntroCopy };