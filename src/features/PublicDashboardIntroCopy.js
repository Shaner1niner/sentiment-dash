const INTRO_COPY_TOKEN = 'module_public_dashboard_intro_copy_001';

const PUBLIC_DASHBOARD_SUBTITLE = 'Read attention, sentiment, structure, and confirmation context in one view. SETA explains market emotion and setup quality - not price targets or trade instructions.';

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

function applyPublicDashboardIntroCopy() {
    if (typeof document === 'undefined') return;

    const banner = document.querySelector('.harnessBanner');
    if (banner) {
        const paragraph = banner.querySelector('p');
        if (paragraph) {
            paragraph.textContent = PUBLIC_DASHBOARD_SUBTITLE;
            paragraph.setAttribute('data-copy-token', INTRO_COPY_TOKEN);
        }
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

export { CONTROL_LABELS, PUBLIC_DASHBOARD_SUBTITLE, applyPublicDashboardIntroCopy };
