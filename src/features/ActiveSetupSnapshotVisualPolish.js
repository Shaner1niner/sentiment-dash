const PATCH_TOKEN = 'module_active_setup_snapshot_visual_polish_002';
const STYLE_ID = `${PATCH_TOKEN}_style`;
let patchQueued = false;
let observer = null;

function asNumber(value) {
    const match = String(value || '').match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
}

function asSignedNumber(value) {
    const match = String(value || '').match(/[+-]?\d+(?:\.\d+)?/);
    if (!match) return null;
    const n = Number(match[0]);
    return Number.isFinite(n) ? n : null;
}

function formatScore(value) {
    if (!Number.isFinite(value)) return '';
    return value.toFixed(1).replace(/\.0$/, '');
}

function formatDelta(value) {
    if (!Number.isFinite(value)) return '';
    const text = Math.abs(value).toFixed(1).replace(/\.0$/, '');
    return `${value >= 0 ? '+' : '-'}${text}`;
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
        cursor: help;
        min-height: 90px;
        overflow: visible;
        position: relative;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendWidget[data-structure-trend-tooltip-copy]::after {
        background: rgba(5, 7, 10, .96);
        border: 1px solid rgba(125, 211, 252, .34);
        border-radius: 8px;
        box-shadow: 0 12px 36px rgba(0, 0, 0, .38), 0 0 24px rgba(88, 166, 255, .08);
        color: #dbeafe;
        content: attr(data-structure-trend-tooltip-copy);
        font-size: 11px;
        font-weight: 650;
        left: 50%;
        line-height: 1.45;
        max-width: min(340px, calc(100vw - 40px));
        min-width: 230px;
        opacity: 0;
        padding: 10px 12px;
        pointer-events: none;
        position: absolute;
        text-align: left;
        top: calc(100% + 8px);
        transform: translate(-50%, -3px);
        transition: opacity .12s ease, transform .12s ease;
        white-space: pre-line;
        z-index: 40;
      }
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendWidget[data-structure-trend-tooltip-copy]:hover::after,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendWidget[data-structure-trend-tooltip-copy]:focus-within::after,
      html[data-seta-view-mode="briefing"] #module-market-tape-detail .moduleMarketTapeTrendWidget[data-structure-trend-tooltip-copy]:focus::after {
        opacity: 1;
        transform: translate(-50%, 0);
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

function splitReadout(text) {
    return String(text || '').split(/\u00c2?\u00b7/).map(piece => piece.trim()).filter(Boolean);
}

function trendParts(trend) {
    const score = splitReadout(trend.querySelector('.moduleMarketTapeTrendPrimaryReadout')?.textContent || '')?.[0]
        || trend.querySelector('.moduleMarketTapeTrendReadout strong')?.textContent?.trim()
        || '';
    const primaryReadout = trend.querySelector('.moduleMarketTapeTrendPrimaryReadout')?.textContent || '';
    const raw = trend.querySelector('.moduleMarketTapeTrendReadout span')?.textContent?.trim() || '';
    const stackLabel = trend.querySelector('.moduleMarketTapeTrendStackLabel')?.textContent?.trim() || '';
    const pieces = splitReadout(raw);
    const delta = pieces[0] || '';
    const direction = pieces[1] || splitReadout(primaryReadout).slice(1).join(' / ');
    const stackRead = stackLabel.replace(/^Structure stack:\s*/i, '').replace(/\s*\([^)]*\)\s*$/, '')
        || pieces.slice(2).join(' / ');

    return { score, delta, direction, stackRead };
}

function buildStructureTrendTooltip(trend) {
    const { score, delta, direction, stackRead } = trendParts(trend);
    const latest = asNumber(score);
    const change = asSignedNumber(delta);

    if (latest === null && change === null && !direction && !stackRead) {
        return [
            '24h structure history',
            'Recent available structure reads are limited for this asset.',
            'Recent available structure reads, not a guarantee of complete hourly coverage.'
        ].join('\n');
    }

    const start = latest !== null && change !== null ? latest - change : null;
    const lines = ['24h structure history'];

    if (start !== null) lines.push(`Start: ${formatScore(start)}`);
    if (latest !== null) lines.push(`Latest: ${formatScore(latest)}`);
    if (change !== null) lines.push(`Change: ${formatDelta(change)}`);
    if (direction) lines.push(`Direction: ${direction.toLowerCase()}`);
    if (stackRead) lines.push(`Structure stack: ${stackRead}`);

    lines.push('Recent available structure reads, not a guarantee of complete hourly coverage.');
    return lines.join('\n');
}

function applyReaderSafeTrendCoverageCopy() {
    document.querySelectorAll('#module-market-tape-detail .moduleMarketTapeTrendHeader > em:not(.moduleMarketTapeTrendStackLabel)').forEach(label => {
        const text = label.textContent || '';
        const match = text.match(/(\d+)\s+real hourly point/i);
        if (!match) return;
        const count = match[1];
        label.textContent = `${count} available structure read${count === '1' ? '' : 's'}`;
        label.setAttribute('title', 'Recent available structure reads, not a guarantee of complete hourly coverage.');
    });
}

function applyStructureTrendTooltip() {
    document.querySelectorAll('#module-market-tape-detail .moduleMarketTapeTrendWidget').forEach(trend => {
        const tooltip = buildStructureTrendTooltip(trend);
        const aria = tooltip.replace(/\n/g, '. ');
        trend.setAttribute('title', tooltip);
        trend.setAttribute('aria-label', aria);
        trend.setAttribute('tabindex', '0');
        trend.setAttribute('data-structure-trend-tooltip', PATCH_TOKEN);
        trend.setAttribute('data-structure-trend-tooltip-copy', tooltip);
        trend.querySelector('.moduleMarketTapeTrendBody')?.setAttribute('title', tooltip);
        trend.querySelector('.moduleMarketTapeTrendBody svg')?.setAttribute('aria-label', aria);
    });
}

function applyVisualPolish() {
    if (typeof document === 'undefined') return;
    installStyle();
    applyStructureScoreTone();
    applyReaderSafeTrendCoverageCopy();
    applyStructureTrendTooltip();
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
