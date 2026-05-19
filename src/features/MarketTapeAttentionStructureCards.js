import { Store } from '../Store.js';

const PATCH_TOKEN = 'module_market_tape_attention_structure_cards_001';
const STYLE_ID = `${PATCH_TOKEN}_style`;

function cleanText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function asNumber(value, fallback = null) {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function valueAtPath(source, path) {
    return String(path || '').split('.').reduce((cursor, key) => (
        cursor && cursor[key] !== undefined ? cursor[key] : undefined
    ), source);
}

function firstNumber(source, paths) {
    for (const path of paths) {
        const n = asNumber(valueAtPath(source, path), null);
        if (n !== null) return n;
    }
    return null;
}

function formatScore(value) {
    const n = asNumber(value, null);
    if (n === null) return '—';
    if (Math.abs(n) >= 100) return String(Math.round(n));
    return n.toFixed(1).replace(/\.0$/, '');
}

function recordForTicker(ticker) {
    const normalized = String(ticker || '').trim().toUpperCase();
    const payload = Store.state.screenerStore || window.SCREENER_STORE || {};
    const byTerm = payload.by_term || payload.byTerm || payload.assets || payload.terms || {};

    if (!normalized || !byTerm || typeof byTerm !== 'object') return {};
    return byTerm[normalized] || byTerm[normalized.toLowerCase()] || byTerm[normalized.toUpperCase()] || {};
}

function latestStructurePoint(ticker) {
    const normalized = String(ticker || '').trim().toUpperCase();
    const history = Store.state.structureScoreHistory || {};
    const byTerm = history.points_by_term || history.pointsByTerm || {};
    const raw = byTerm[normalized] || byTerm[normalized.toLowerCase()] || byTerm[normalized.toUpperCase()] || [];

    if (!Array.isArray(raw) || !raw.length) return null;

    return raw
        .map(point => {
            const score = asNumber(point?.structure_score ?? point?.structureScore, null);
            if (score === null) return null;

            const timestamp = Date.parse(String(point?.as_of_utc || point?.asOfUtc || point?.timestamp || '').replace('Z', '+00:00'));
            return {
                score,
                timestamp: Number.isFinite(timestamp) ? timestamp : 0
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.timestamp - b.timestamp)
        .at(-1) || null;
}

function structureScoreForTicker(ticker) {
    const historyPoint = latestStructurePoint(ticker);
    if (historyPoint) return historyPoint.score;

    const record = recordForTicker(ticker);
    return firstNumber(record, [
        'structure_score',
        'structureScore',
        'signal_structure_score',
        'signalStructureScore',
        'screener.structure_score',
        'screener.structureScore',
        'screener.signal_structure_score',
        'screener.signalStructureScore',
        'scorecard.structure_score',
        'scorecard.structureScore',
        'market_tape.structure_score',
        'market_tape.structureScore',
        'archetype.structure_score',
        'archetype.structureScore',
        'market_tape_family.structure_score',
        'market_tape_family.structureScore',
        'family.structure_score',
        'family.structureScore',
        'indicators.structure_score',
        'indicators.structureScore',
        'indicator_payload.structure_score',
        'indicator_payload.structureScore',
        'indicator.structure_score',
        'indicator.structureScore'
    ]);
}

function attentionRankForCard(card, ticker) {
    const record = recordForTicker(ticker);
    const fromRecord = firstNumber(record, [
        'rank',
        'priority_rank',
        'priorityRank',
        'market_tape_rank',
        'marketTapeRank',
        'screener.rank',
        'screener.priority_rank',
        'screener.priorityRank',
        'market_tape.rank',
        'market_tape.priority_rank',
        'market_tape.priorityRank'
    ]);

    if (fromRecord !== null && fromRecord > 0) return Math.round(fromRecord);

    const current = cleanText(card.querySelector('.moduleMarketTapeItemTop strong')?.textContent || '');
    const match = current.match(/#\s*(\d+)/);
    return match ? Number(match[1]) : null;
}

function whySurfaced(rowText, tagsText) {
    const lower = `${rowText || ''} ${tagsText || ''}`.toLowerCase();

    if (/no recent confirmed|not fully confirmed|confirmation[^.]*incomplete|missing confirmation|watch candidates/.test(lower)) {
        return 'attention is elevated, but confirmation is still incomplete.';
    }

    if (/high.?conviction|confirmed alert|confirmation complete|confirmed setup/.test(lower)) {
        return 'attention is elevated and the structure read is more fully confirmed.';
    }

    if (/bear|risk|weak|pressure|deteriorat|transition-risk/.test(lower)) {
        return 'attention is elevated around a weaker or risk-heavy structure profile.';
    }

    if (/momentum/.test(lower) && /not yet|still developing|not fully|watch|monitor/.test(lower)) {
        return 'attention is elevated while momentum is still developing.';
    }

    if (/quiet|low conviction|thin/.test(lower)) {
        return 'attention keeps it on the board, but participation remains quiet.';
    }

    return 'attention is elevated, so this setup is worth reviewing against structure.';
}

function installStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .moduleMarketTapeSortGuide {
        margin: -2px 0 10px;
        border: 1px solid rgba(125, 211, 252, .16);
        border-radius: 10px;
        background: rgba(5, 7, 10, .34);
        color: #8b949e;
        font-size: 11px;
        line-height: 1.35;
        padding: 8px 10px;
      }
      .moduleMarketTapeSortGuide strong {
        color: #f0f6fc;
      }
      .moduleMarketTapeItemTop {
        align-items: flex-start;
      }
      .moduleMarketTapeAttentionRank {
        display: block;
        color: #9bdcff;
        font-size: 10px;
        line-height: 1.15;
        letter-spacing: .01em;
        margin-bottom: 3px;
      }
      .moduleMarketTapeTicker {
        display: block;
        color: #f0f6fc;
        font-size: 12px;
        line-height: 1.1;
      }
      .moduleMarketTapeStructureScore {
        display: inline-flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        min-width: 54px;
        color: #f2cc60;
        font-style: normal !important;
        line-height: 1.05;
      }
      .moduleMarketTapeStructureScore span {
        color: #8b949e;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: .05em;
      }
      .moduleMarketTapeStructureScore strong {
        color: #f2cc60;
        font-size: 12px;
        font-weight: 800;
      }
      .moduleMarketTapeWhySurfaced {
        margin-top: 8px !important;
        border-top: 1px solid rgba(139, 148, 158, .14);
        padding-top: 7px;
        color: #8b949e;
      }
      .moduleMarketTapeWhySurfaced strong {
        color: #9bdcff;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
}

function patchGuide() {
    const panel = document.getElementById('module-market-tape');
    const card = panel?.querySelector('.moduleMarketTapeCard');
    const grid = panel?.querySelector('.moduleMarketTapeGrid');
    if (!card || !grid || card.querySelector('.moduleMarketTapeSortGuide')) return;

    const guide = document.createElement('p');
    guide.className = 'moduleMarketTapeSortGuide';
    guide.innerHTML = '<strong>Ranked by attention. Scored by structure.</strong> Attention shows where focus is concentrated; Structure shows how coherent the setup looks.';
    card.insertBefore(guide, grid);
}

function patchCard(card) {
    if (!card || !card.matches('.moduleMarketTapeItem[data-ticker]')) return;

    const ticker = String(card.getAttribute('data-ticker') || '').trim().toUpperCase();
    const top = card.querySelector('.moduleMarketTapeItemTop');
    const title = top?.querySelector('strong');
    const score = top?.querySelector('em');
    if (!ticker || !top || !title || !score) return;

    const rank = attentionRankForCard(card, ticker);
    const structureScore = structureScoreForTicker(ticker);
    const attentionLabel = rank ? `#${rank} by Attention` : 'By Attention';

    title.innerHTML = `<span class="moduleMarketTapeAttentionRank">${escapeHtml(attentionLabel)}</span><span class="moduleMarketTapeTicker">${escapeHtml(ticker)}</span>`;
    score.className = 'moduleMarketTapeStructureScore';
    score.innerHTML = `<span>Structure</span><strong>${escapeHtml(formatScore(structureScore))}</strong>`;

    const copy = cleanText(card.querySelector('p:not(.moduleMarketTapeWhySurfaced)')?.textContent || '');
    const tags = cleanText(card.querySelector('.moduleMarketTapeTags')?.textContent || '');
    let why = card.querySelector('.moduleMarketTapeWhySurfaced');
    if (!why) {
        why = document.createElement('p');
        why.className = 'moduleMarketTapeWhySurfaced';
        card.appendChild(why);
    }
    why.innerHTML = `<strong>Why surfaced:</strong> ${escapeHtml(whySurfaced(copy, tags))}`;
}

function patchMarketTape() {
    installStyle();
    patchGuide();
    document.querySelectorAll('#module-market-tape .moduleMarketTapeItem[data-ticker]').forEach(patchCard);
}

function start() {
    patchMarketTape();

    const observer = new MutationObserver(() => patchMarketTape());
    observer.observe(document.body, { childList: true, subtree: true });

    ['assetChanged', 'controlChanged', 'screenerUpdated', 'structureScoreHistoryUpdated'].forEach(eventName => {
        try {
            Store.on(eventName, () => setTimeout(patchMarketTape, 0));
        } catch (_) {}
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
