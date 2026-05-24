import { Store } from '../Store.js';
import { ReviewedBriefingLoader } from '../ReviewedBriefingLoader.js';

const BRIEFING_VISIBLE_EVIDENCE_ITEMS = 3;
const RESEARCH_VISIBLE_EVIDENCE_ITEMS = 6;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function valueOf(item, keys) {
    for (const key of keys) {
        if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
    }
    return null;
}

function plainText(value, fallback = 'Reviewed briefing content is not available for this module context yet.') {
    if (Array.isArray(value)) return value.map(v => plainText(v, '')).filter(Boolean).join(' ');
    if (value && typeof value === 'object') {
        return value.text || value.body || value.copy || value.summary || JSON.stringify(value);
    }
    return String(value || fallback).trim();
}

function normalizeBriefingCard(card, fallbackTitle = '') {
    if (!card || typeof card !== 'object') return null;
    return {
        title: card.title || card.heading || card.role || fallbackTitle,
        role: card.role || fallbackTitle,
        body: card.body || card.copy || card.text || card.summary || card.bullets || card.items || ''
    };
}

function cardFromBriefingCards(item, desiredTitle) {
    const cards = item && item.briefing_cards ? item.briefing_cards : null;
    const normalized = desiredTitle.toLowerCase();

    let candidates = [];

    if (Array.isArray(cards)) {
        candidates = cards.map(card => normalizeBriefingCard(card)).filter(Boolean);
    } else if (cards && typeof cards === 'object') {
        candidates = Object.entries(cards)
            .map(([key, card]) => normalizeBriefingCard(card, key))
            .filter(Boolean);
    }

    return candidates.find(card => {
        const title = String(card.title || card.role || '').toLowerCase();
        return title.includes(normalized) || normalized.includes(title);
    }) || null;
}

function cardCopy(item, title, keys, fallback) {
    const structured = cardFromBriefingCards(item, title);
    if (structured) {
        return plainText(
            structured.body || structured.copy || structured.text || structured.summary || structured.bullets,
            fallback
        );
    }

    return plainText(valueOf(item, keys), fallback);
}

function normalizeEvidenceItems(item) {
    const card = cardFromBriefingCards(item, 'evidence');
    const cardItems = card && Array.isArray(card.body) ? card.body : null;
    if (cardItems && cardItems.length) return cardItems.map(v => plainText(v, '')).filter(Boolean);

    const candidates = valueOf(item, ['evidence', 'receipts', 'briefing_evidence', 'evidence_list']);
    if (Array.isArray(candidates)) return candidates.map(v => plainText(v, '')).filter(Boolean);

    const text = plainText(candidates, '');
    if (text) return [text];

    const asOf = valueOf(item, ['as_of', 'date']);
    const payloadKey = valueOf(item, ['payload_key', 'key']);
    const rows = [];
    if (asOf) rows.push(`Reviewed context date: ${asOf}`);
    if (payloadKey) rows.push(`Payload key: ${payloadKey}`);
    return rows;
}

function currentViewMode(state = Store.snapshot()) {
    const value = String(state.currentView || 'briefing').trim().toLowerCase();
    return value === 'research' ? 'research' : 'briefing';
}

function evidenceLimitForState(state = Store.snapshot()) {
    return currentViewMode(state) === 'research'
        ? RESEARCH_VISIBLE_EVIDENCE_ITEMS
        : BRIEFING_VISIBLE_EVIDENCE_ITEMS;
}

function evidenceList(item, state = Store.snapshot()) {
    const items = normalizeEvidenceItems(item);
    if (!items.length) return '<li>Reviewed briefing payload loaded for module lookup.</li>';

    const limit = evidenceLimitForState(state);
    const visible = items.slice(0, limit);
    const hiddenCount = Math.max(0, items.length - visible.length);
    const rows = visible.map(v => `<li>${escapeHtml(v)}</li>`);

    if (hiddenCount > 0) {
        rows.push(`<li class="moduleBriefingMoreEvidence">+${hiddenCount} more reviewed receipt${hiddenCount === 1 ? '' : 's'} available in Research mode / source briefing.</li>`);
    }

    return rows.join('');
}

function sourceLabel(item) {
    if (!item) return 'deterministic fallback';
    if (item.reviewed || item.is_reviewed || item.review_status === 'reviewed') return 'reviewed';
    return 'reviewed payload';
}

export const BriefingPanel = {
    targetId: 'module-briefing-panel',
    ready: false,

    async init(options = {}) {
        this.targetId = options.targetId || this.targetId;
        this.ensureTarget();

        try {
            await ReviewedBriefingLoader.load();
            this.ready = true;
        } catch (error) {
            console.warn('BriefingPanel: reviewed briefing load failed', error);
        }

        this.render();

        Store.on('controlChanged', () => this.render());
        Store.on('assetPayloadUpdated', () => this.render());
        Store.on('reviewedBriefingsUpdated', () => this.render());
    },

    ensureTarget() {
        let target = document.getElementById(this.targetId);
        if (target) return target;

        const chart = document.getElementById('chart') || document.getElementById('chart-container');
        target = document.createElement('section');
        target.id = this.targetId;
        target.className = 'moduleBriefingPanel';
        if (chart && chart.parentNode) {
            chart.parentNode.insertBefore(target, chart);
        } else {
            document.body.appendChild(target);
        }
        return target;
    },

    render() {
        const target = this.ensureTarget();
        const state = Store.snapshot();
        const item = ReviewedBriefingLoader.matchForState(state);

        const asset = escapeHtml(state.currentAsset || 'BTC');
        const freq = escapeHtml(state.currentFrequency || 'D');
        const range = escapeHtml(state.currentRange || '3M');

        const headline = escapeHtml(
            plainText(
                valueOf(item, ['headline', 'title', 'briefing_title', 'primary_read']),
                `${asset} asset briefing`
            )
        );

        const what = cardCopy(
            item,
            'what',
            ['interpretation', 'what_seta_sees', 'what', 'summary', 'primary_read'],
            'Reviewed asset briefing context is available for this asset, but the detailed interpretation is still being normalized.'
        );

        const why = cardCopy(
            item,
            'why',
            ['implication', 'why_it_matters', 'why', 'rationale'],
            'This asset briefing is validating reviewed lookup and rendering before production cutover.'
        );

        const participation = cardCopy(
            item,
            'participation',
            ['participation_quality', 'trust_check', 'source_breadth', 'participation'],
            'Participation-quality copy will be expanded as asset briefing parity continues.'
        );

        target.innerHTML = `
          <article class="moduleBriefingCard" data-view-mode="${escapeHtml(currentViewMode(state))}">
            <header class="moduleBriefingHeader">
              <div>
                <div class="moduleBriefingKicker">Asset Briefing • ${asset} • ${freq} • ${range}</div>
                <h2>${headline}</h2>
              </div>
              <span class="moduleBriefingSource">${escapeHtml(sourceLabel(item))}</span>
            </header>

            <div class="moduleBriefingGrid">
              <section>
                <h3>What SETA Sees</h3>
                <p>${escapeHtml(what)}</p>
              </section>
              <section>
                <h3>Why It Matters</h3>
                <p>${escapeHtml(why)}</p>
              </section>
              <section>
                <h3>Evidence</h3>
                <ul>${evidenceList(item, state)}</ul>
              </section>
              <section>
                <h3>Participation Quality</h3>
                <p>${escapeHtml(participation)}</p>
              </section>
            </div>
          </article>
        `;
    }
};
