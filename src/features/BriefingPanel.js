import { Store } from '../Store.js';
import { ReviewedBriefingLoader } from '../ReviewedBriefingLoader.js';
import { synthesizeAssetBriefing } from './AssetBriefingSynthesis.js?v=asset_briefing_synthesis_001';

const BRIEFING_VISIBLE_EVIDENCE_ITEMS = 3;
const RESEARCH_VISIBLE_EVIDENCE_ITEMS = 6;
const SYNTHESIS_STYLE_ID = 'module-briefing-synthesis-style';

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

function isInactiveSharedZoneOnly(text) {
    const copy = String(text || '').toLowerCase();
    if (!copy) return false;

    const mentionsSharedZone = copy.includes('shared-zone') || copy.includes('shared zone') || copy.includes('inside-zone') || copy.includes('inside zone');
    if (!mentionsSharedZone) return false;

    const inactive = copy.includes('inactive') ||
        copy.includes('no active') ||
        copy.includes('not active') ||
        copy.includes('not present') ||
        copy.includes('not confirmed') ||
        copy.includes('overlap event is monitor context');

    const activeOrMaterial = copy.includes('active and confirmed') ||
        copy.includes('confirmed overlap') ||
        copy.includes('active inside-zone confirmation') ||
        copy.includes('watch cluster') ||
        copy.includes('high-conviction') ||
        copy.includes('material');

    return inactive && !activeOrMaterial;
}

function polishBriefingCopy(text) {
    let copy = plainText(text, '');
    if (!copy) return copy;

    const replacements = [
        [/Unconfirmed bullish pressure\.\s*The pressure is visible, but the confirmation stack is still conflicted\.\s*/gi, 'Constructive pressure is visible, but confirmation is still developing. '],
        [/Unconfirmed bearish pressure\.\s*The pressure is visible, but the confirmation stack is still conflicted\.\s*/gi, 'Risk-off pressure is visible, but confirmation is still developing. '],
        [/Unconfirmed bullish pressure\./gi, 'Constructive pressure remains unconfirmed.'],
        [/Unconfirmed bearish pressure\./gi, 'Risk-off pressure remains unconfirmed.'],
        [/bullish pressure is not fully confirmed/gi, 'constructive pressure is not fully confirmed'],
        [/bearish pressure is not fully confirmed/gi, 'risk-off pressure is not fully confirmed'],
        [/Bullish repair context/gi, 'Constructive repair context'],
        [/Bearish pressure context/gi, 'Risk-off pressure context'],
        [/Shared-zone confirmation is inactive; technical evidence carries more weight than overlap confirmation\.\s*/gi, ''],
        [/Shared-zone confirmation is inactive\.\s*/gi, ''],
        [/Overlap confirmation is inactive; technical evidence carries more weight\.\s*/gi, '']
    ];

    replacements.forEach(([pattern, replacement]) => {
        copy = copy.replace(pattern, replacement);
    });

    return copy.replace(/\s{2,}/g, ' ').trim();
}

function cardCopy(item, title, keys, fallback) {
    const structured = cardFromBriefingCards(item, title);
    if (structured) {
        return polishBriefingCopy(
            structured.body || structured.copy || structured.text || structured.summary || structured.bullets || fallback
        );
    }

    return polishBriefingCopy(valueOf(item, keys) || fallback);
}

function normalizeEvidenceItems(item) {
    const card = cardFromBriefingCards(item, 'evidence');
    const cardItems = card && Array.isArray(card.body) ? card.body : null;
    if (cardItems && cardItems.length) {
        return cardItems
            .map(v => polishBriefingCopy(v))
            .filter(Boolean)
            .filter(v => !isInactiveSharedZoneOnly(v));
    }

    const candidates = valueOf(item, ['evidence', 'receipts', 'briefing_evidence', 'evidence_list']);
    if (Array.isArray(candidates)) {
        return candidates
            .map(v => polishBriefingCopy(v))
            .filter(Boolean)
            .filter(v => !isInactiveSharedZoneOnly(v));
    }

    const text = polishBriefingCopy(candidates || '');
    if (text && !isInactiveSharedZoneOnly(text)) return [text];

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

function ensureSynthesisStyles() {
    if (typeof document === 'undefined' || document.getElementById(SYNTHESIS_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = SYNTHESIS_STYLE_ID;
    style.textContent = `
      .moduleBriefingSynthesis {
        border: 1px solid rgba(125, 211, 252, .24);
        border-radius: 12px;
        background: linear-gradient(180deg, rgba(13, 17, 23, .72), rgba(5, 7, 10, .48));
        padding: 12px;
        margin: 0 0 12px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03);
      }
      .moduleBriefingSynthesisKicker {
        color: #7dd3fc;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: .08em;
        margin-bottom: 4px;
        font-weight: 700;
      }
      .moduleBriefingSynthesis h3 {
        margin: 0 0 6px;
        color: #f0f6fc;
        font-size: 14px;
        line-height: 1.25;
      }
      .moduleBriefingSynthesis p {
        margin: 0;
        color: #c9d1d9;
        font-size: 12px;
        line-height: 1.45;
      }
      .moduleBriefingSynthesisChips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 9px;
      }
      .moduleBriefingSynthesisChips span {
        border: 1px solid rgba(125, 211, 252, .22);
        border-radius: 999px;
        color: #9bdcff;
        background: rgba(5, 7, 10, .36);
        font-size: 10px;
        line-height: 1;
        padding: 4px 7px;
      }
      .moduleBriefingSynthesisChips strong {
        color: #f2cc60;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
}

function humanizeState(value) {
    return String(value || 'mixed').replaceAll('_', ' ');
}

function payloadRows(payload) {
    if (!payload || typeof payload !== 'object') return [];
    const candidates = [
        payload.rows,
        payload.data,
        payload.records,
        payload.chart_rows,
        payload.chartData,
        payload.price_rows
    ];
    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length) return candidate;
    }
    return [];
}

function latestPayloadRow() {
    const payload = Store.state && Store.state.currentAssetPayload;
    const rows = payloadRows(payload);
    const latest = rows.length ? rows[rows.length - 1] : null;
    return latest && typeof latest === 'object' ? latest : {};
}

function synthesisInput(item, state, headline, what, why, participation) {
    const evidenceText = normalizeEvidenceItems(item).join(' ');
    return {
        ...latestPayloadRow(),
        ...(item && typeof item === 'object' ? item : {}),
        asset: state.currentAsset || valueOf(item, ['asset', 'ticker', 'term']) || 'Asset',
        regime_label: valueOf(item, ['regime_label', 'regime', 'signal_state']) || headline,
        primary_read: headline,
        what_seta_sees: what,
        why_it_matters: why,
        participation_quality: participation,
        evidence: evidenceText,
        attention_summary: valueOf(item, ['attention_summary', 'market_tape_summary', 'attention_label']) || evidenceText
    };
}

function synthesisBlock(synthesis) {
    if (!synthesis || typeof synthesis !== 'object') return '';

    const asset = escapeHtml(synthesis.asset || 'Asset');
    const combinedLabel = escapeHtml(synthesis.combined_state_label || humanizeState(synthesis.combined_state));
    const confirmation = escapeHtml(humanizeState(synthesis.confirmation_quality));
    const participation = escapeHtml(humanizeState(synthesis.participation_state));
    const focus = escapeHtml(synthesis.language_focus || 'confirmation quality');
    const primaryTension = escapeHtml(synthesis.primary_tension || 'signals are mixed, so confirmation quality remains the focus');
    const watchNext = escapeHtml(synthesis.watch_next || 'whether confirmation quality broadens');

    return `
      <section class="moduleBriefingSynthesis" data-combined-state="${escapeHtml(synthesis.combined_state)}" data-confirmation-quality="${escapeHtml(synthesis.confirmation_quality)}">
        <div class="moduleBriefingSynthesisKicker">Combined SETA Read</div>
        <h3>${asset} reads as ${combinedLabel}</h3>
        <p>The primary tension is ${primaryTension}. Confirmation quality remains ${confirmation}. Watch next: ${watchNext}.</p>
        <div class="moduleBriefingSynthesisChips" aria-label="Asset briefing synthesis summary">
          <span>State: <strong>${combinedLabel}</strong></span>
          <span>Confirmation: <strong>${confirmation}</strong></span>
          <span>Participation: <strong>${participation}</strong></span>
          <span>Focus: <strong>${focus}</strong></span>
        </div>
      </section>
    `;
}

export const BriefingPanel = {
    targetId: 'module-briefing-panel',
    ready: false,

    async init(options = {}) {
        this.targetId = options.targetId || this.targetId;
        this.ensureTarget();
        ensureSynthesisStyles();

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
        ensureSynthesisStyles();
        const state = Store.snapshot();
        const item = ReviewedBriefingLoader.matchForState(state);

        const asset = escapeHtml(state.currentAsset || 'BTC');
        const freq = escapeHtml(state.currentFrequency || 'D');
        const range = escapeHtml(state.currentRange || '3M');

        const headline = escapeHtml(
            polishBriefingCopy(
                plainText(
                    valueOf(item, ['headline', 'title', 'briefing_title', 'primary_read']),
                    `${asset} asset briefing`
                )
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

        const synthesis = synthesizeAssetBriefing(
            synthesisInput(item, state, headline, what, why, participation)
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

            ${synthesisBlock(synthesis)}

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
