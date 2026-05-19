const INTRO_COPY_TOKEN = 'module_public_dashboard_intro_copy_001';

const PUBLIC_DASHBOARD_SUBTITLE = 'Read attention, sentiment, structure, and confirmation context in one view. SETA explains market emotion and setup quality - not price targets or trade instructions.';

function applyPublicDashboardIntroCopy() {
    if (typeof document === 'undefined') return;

    const banner = document.querySelector('.harnessBanner');
    if (!banner) return;

    const paragraph = banner.querySelector('p');
    if (paragraph) {
        paragraph.textContent = PUBLIC_DASHBOARD_SUBTITLE;
        paragraph.setAttribute('data-copy-token', INTRO_COPY_TOKEN);
    }

    if (document.title === 'SETA Public Dashboard') {
        document.title = 'SETA Public Dashboard | Attention, Sentiment, Structure';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPublicDashboardIntroCopy);
} else {
    applyPublicDashboardIntroCopy();
}

export { PUBLIC_DASHBOARD_SUBTITLE, applyPublicDashboardIntroCopy };
