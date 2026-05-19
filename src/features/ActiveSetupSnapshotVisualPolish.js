const PATCH_TOKEN = 'module_active_setup_snapshot_visual_polish_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;
let patchQueued = false;
let observer = null;

function asNumber(value) {
    const match = String(value || '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

function toneForScore(score) {
    if (score === null) return 'isMixed';
    if (score < 35) return 'isWeak';
    if (score >= 70) return 'isStrong';
    return 'isMixed';
}

function installStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
        grid-template-columns: minmax(170px, .62fr) minmax(220px, .9fr) minmax(360px, 1.45fr);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero {
        --structure-accent: #f2cc60;
        --structure-accent-soft: rgba(242, 204, 96, .36);
        --structure-accent-glow: rgba(242, 204, 96, .06);
        border-color: var(--structure-accent-soft) !important;
        box-shadow: 0 0 0 1px var(--structure-accent-glow) inset, 0 0 22px var(--structure-accent-glow) !important;
        min-height: 90px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero.isWeak {
        --structure-accent: #ff7b72;
        --structure-accent-soft: rgba(255, 123, 114, .32);
        --structure-accent-glow: rgba(255, 123, 114, .055);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero.isMixed {
        --structure-accent: #f2cc60;
        --structure-accent-soft: rgba(242, 204, 96, .36);
        --structure-accent-glow: rgba(242, 204, 96, .06);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero.isStrong {
        --structure-accent: #7ee787;
        --structure-accent-soft: rgba(126, 231, 135, .32);
        --structure-accent-glow: rgba(126, 231, 135, .055);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero span,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingStructureHero strong {
        color: var(--structure-accent) !important;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeStructureMeter i {
        background: linear-gradient(90deg, var(--structure-accent-soft), var(--structure-accent)) !important;
        box-shadow: 0 0 10px var(--structure-accent-glow);
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
        min-height: 90px;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendBody {
        display: block;
        width: 100%;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendBody svg {
        display: block;
        height: 50px;
        max-width: 100%;
        width: 100%;
      }
      @media (max-width: 980px) {
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact {
          grid-template-columns: minmax(170px, .8fr) minmax(260px, 1.2fr);
        }
        html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeBriefingCompact .moduleMarketTapeTrendWidget {
          grid-column: 1 / -1;
        }
      }
    `;
    document.head.appendChild(style);
}

function applyStructureScoreTone() {
    document.querySelectorAll('#module-market-tape-detail .moduleMarketTapeBriefingStructureHero').forEach(card => {
        const scoreText = card.querySelector('strong')?.textContent || '';
        const score = asNumber(scoreText);
        const tone = toneForScore(score);
        card.classList.remove('isWeak', 'isMixed', 'isStrong');
        card.classList.add(tone);
        card.setAttribute('data-structure-score-tone', tone);
    });
}

function applyVisualPolish() {
    if (typeof document === 'undefined') return;
    installStyle();
    applyStructureScoreTone();
}

function queueApplyVisualPolish() {
    if (patchQueued) return;
    patchQueued = true;
    window.requestAnimationFrame(() => {
        patchQueued = false;
        applyVisualPolish();
    });
}

function startActiveSetupSnapshotVisualPolish() {
    applyVisualPolish();
    if (!observer) {
        observer = new MutationObserver(() => queueApplyVisualPolish());
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startActiveSetupSnapshotVisualPolish);
} else {
    startActiveSetupSnapshotVisualPolish();
}

export { PATCH_TOKEN, applyVisualPolish, startActiveSetupSnapshotVisualPolish };
