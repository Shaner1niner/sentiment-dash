import { Store } from '../Store.js';

const SCORE_KEY_RE = /(priority.*score|seta.*score|market.*score|tape.*score|deck.*score|metric.*score|total.*score|score)$/i;
const RANK_KEY_RE = /(priority.*rank|market.*rank|tape.*rank|rank|ordinal|position|order)$/i;
const LABEL_KEY_RE = /(headline|setup.*label|market.*label|tape.*label|primary.*setup|primary.*read|read|title|thesis|archetype.*label|family)$/i;
const WATCH_KEY_RE = /(watch.*item|watch|rationale|reason|description|summary|note)$/i;

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function asNumber(value, fallback = null) {
    if (value === null || value === undefined || value === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function isUsefulText(value) {
    if (typeof value !== 'string') return false;
    const text = value.trim();
    if (!text) return false;
    if (/^https?:\/\//i.test(text)) return false;
    if (/^[A-Z]{1,6}$/.test(text)) return false;
    return text.length >= 4 && text.length <= 260;
}

function valueOf(item, keys, fallback = null) {
    for (const key of keys) {
        if (item && item[key] !== undefined && item[key] !== null && item[key] !== '') return item[key];
    }
    return fallback;
}

function nestedValue(item, paths, fallback = null) {
    for (const path of paths) {
        const value = path.split('.').reduce((cursor, key) => (
            cursor && cursor[key] !== undefined ? cursor[key] : undefined
        ), item);
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
}

function walkPrimitives(value, callback, path = [], depth = 0) {
    if (depth > 7 || value === null || value === undefined) return;

    if (Array.isArray(value)) {
        value.forEach((item, index) => walkPrimitives(item, callback, [...path, String(index)], depth + 1));
        return;
    }

    if (typeof value === 'object') {
        Object.entries(value).forEach(([key, item]) => {
            if (item && typeof item === 'object') {
                walkPrimitives(item, callback, [...path, key], depth + 1);
            } else {
                callback(key, item, [...path, key]);
            }
        });
    }
}

function deepFindNumber(source, keyRegex, options = {}) {
    const values = [];
    walkPrimitives(source, (key, value, path) => {
        if (!keyRegex.test(String(key))) return;
        const n = asNumber(value, null);
        if (n === null) return;
        if (options.positive && n <= 0) return;
        values.push({ value: n, path: path.join('.') });
    });

    if (!values.length) return null;

    if (options.preferLowest) {
        return values.sort((a, b) => a.value - b.value)[0].value;
    }

    if (options.preferHighest) {
        return values.sort((a, b) => b.value - a.value)[0].value;
    }

    return values[0].value;
}

function deepFindText(source, keyRegex) {
    const values = [];
    walkPrimitives(source, (key, value) => {
        if (!keyRegex.test(String(key))) return;
        if (isUsefulText(value)) values.push(String(value).trim());
    });
    return values[0] || null;
}

function collectTextValues(value, out = [], depth = 0) {
    if (depth > 5 || value === null || value === undefined) return out;

    if (typeof value === 'string') {
        if (isUsefulText(value)) out.push(value.trim());
        return out;
    }

    if (Array.isArray(value)) {
        value.forEach(item => collectTextValues(item, out, depth + 1));
        return out;
    }

    if (typeof value === 'object') {
        Object.values(value).forEach(item => collectTextValues(item, out, depth + 1));
    }

    return out;
}

function tickerFor(item, fallback = '') {
    if (typeof item === 'string') {
        const raw = item.trim().toUpperCase();
        return /^[A-Z0-9]{1,8}$/.test(raw) ? raw : '';
    }

    const source = item && typeof item === 'object' ? item : {};
    const direct = valueOf(source, ['ticker', 'term', 'asset', 'symbol', 'db_term'], fallback);
    const raw = String(direct || '').trim().toUpperCase();
    return /^[A-Z0-9]{1,8}$/.test(raw) ? raw : '';
}

function addHint(hints, ticker, patch = {}) {
    if (!ticker) return;
    if (!hints[ticker]) {
        hints[ticker] = {
            score: null,
            rank: null,
            label: null,
            watchItem: null,
            tags: []
        };
    }

    const hint = hints[ticker];

    if (patch.score !== null && patch.score !== undefined) {
        const n = asNumber(patch.score, null);
        if (n !== null && (hint.score === null || n > hint.score)) hint.score = n;
    }

    if (patch.rank !== null && patch.rank !== undefined) {
        const n = asNumber(patch.rank, null);
        if (n !== null && n > 0 && (hint.rank === null || n < hint.rank)) hint.rank = n;
    }

    if (!hint.label && isUsefulText(patch.label)) hint.label = String(patch.label).trim();
    if (!hint.watchItem && isUsefulText(patch.watchItem)) hint.watchItem = String(patch.watchItem).trim();

    (patch.tags || []).forEach(tag => {
        const text = String(tag || '').trim();
        if (text && !hint.tags.includes(text)) hint.tags.push(text);
    });
}

function arraysWithTickerCandidates(source) {
    const arrays = [];

    function visit(value, depth = 0) {
        if (depth > 5 || value === null || value === undefined) return;

        if (Array.isArray(value)) {
            const hasTicker = value.some(item => tickerFor(item));
            if (hasTicker) arrays.push(value);
            value.forEach(item => visit(item, depth + 1));
            return;
        }

        if (typeof value === 'object') {
            Object.values(value).forEach(item => visit(item, depth + 1));
        }
    }

    visit(source);
    return arrays;
}

function collectSectionHints(payload) {
    const hints = {};
    const sectionsRaw = payload && payload.sections ? payload.sections : [];
    const sections = Array.isArray(sectionsRaw)
        ? sectionsRaw
        : (sectionsRaw && typeof sectionsRaw === 'object' ? Object.values(sectionsRaw) : []);

    sections.forEach(section => {
        const sectionName = valueOf(section, ['title', 'label', 'name', 'key', 'section'], null);
        const sectionTag = isUsefulText(sectionName) ? String(sectionName).trim() : null;

        arraysWithTickerCandidates(section).forEach(candidates => {
            candidates.forEach((candidate, index) => {
                const ticker = tickerFor(candidate);
                if (!ticker) return;

                const source = candidate && typeof candidate === 'object' ? candidate : {};
                const rank = asNumber(
                    valueOf(source, ['rank', 'priority_rank', 'priorityRank', 'market_tape_rank', 'order', 'position'], null),
                    index + 1
                );

                addHint(hints, ticker, {
                    score: deepFindNumber(source, SCORE_KEY_RE, { positive: true, preferHighest: true }),
                    rank,
                    label: deepFindText(source, LABEL_KEY_RE),
                    watchItem: deepFindText(source, WATCH_KEY_RE),
                    tags: [sectionTag].filter(Boolean)
                });
            });
        });
    });

    return hints;
}

function firstUsefulNumber(values) {
    for (const value of values) {
        const n = asNumber(value, null);
        if (n !== null && n > 0) return n;
    }
    for (const value of values) {
        const n = asNumber(value, null);
        if (n !== null) return n;
    }
    return null;
}

function firstUsefulText(values) {
    for (const value of values) {
        if (isUsefulText(value)) return String(value).trim();
    }
    return null;
}

function assetRowsFromScreener(payload) {
    if (!payload || typeof payload !== 'object') return [];

    const sectionHints = collectSectionHints(payload);
    const byTerm = payload.by_term || payload.byTerm || payload.assets || payload.terms || {};

    if (Array.isArray(byTerm)) {
        return byTerm.map((item, index) => {
            const ticker = tickerFor(item, `asset-${index}`);
            return normalizeMarketTapeItem(item, ticker, sectionHints[ticker] || {});
        });
    }

    if (byTerm && typeof byTerm === 'object') {
        return Object.entries(byTerm).map(([ticker, item]) => (
            normalizeMarketTapeItem(item, ticker, sectionHints[String(ticker).toUpperCase()] || {})
        ));
    }

    return Object.entries(sectionHints).map(([ticker, hint]) => normalizeMarketTapeItem({}, ticker, hint));
}

function normalizeMarketTapeItem(item, ticker, hint = {}) {
    const source = item && typeof item === 'object' ? item : {};
    const screener = source.screener || source.scorecard || source.market_tape || {};
    const archetype = source.archetype || source.market_tape_family || source.family || {};
    const indicators = source.indicators || source.indicator_payload || source.indicator || {};

    const resolvedTicker = tickerFor(source, ticker);

    const score = firstUsefulNumber([
        nestedValue(source, [
            'priority_score',
            'priorityScore',
            'seta_score',
            'setaScore',
            'market_tape_score',
            'marketTapeScore',
            'tape_score',
            'score',
            'screener.priority_score',
            'screener.priorityScore',
            'screener.seta_score',
            'screener.setaScore',
            'screener.market_tape_score',
            'screener.score',
            'market_tape.priority_score',
            'market_tape.score'
        ], null),
        deepFindNumber(screener, SCORE_KEY_RE, { positive: true, preferHighest: true }),
        deepFindNumber(archetype, SCORE_KEY_RE, { positive: true, preferHighest: true }),
        deepFindNumber(indicators, SCORE_KEY_RE, { positive: true, preferHighest: true }),
        deepFindNumber(source, SCORE_KEY_RE, { positive: true, preferHighest: true }),
        hint.score
    ]);

    const rank = firstUsefulNumber([
        valueOf(source, ['rank', 'priority_rank', 'priorityRank', 'market_tape_rank', 'marketTapeRank'], null),
        valueOf(screener, ['rank', 'priority_rank', 'priorityRank', 'market_tape_rank', 'marketTapeRank'], null),
        deepFindNumber(screener, RANK_KEY_RE, { positive: true, preferLowest: true }),
        deepFindNumber(source, RANK_KEY_RE, { positive: true, preferLowest: true }),
        hint.rank
    ]);

    const label = firstUsefulText([
        valueOf(source, ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'read', 'primary_read'], null),
        valueOf(screener, ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'read', 'primary_read'], null),
        valueOf(archetype, ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'family'], null),
        hint.label,
        deepFindText(screener, LABEL_KEY_RE),
        deepFindText(archetype, LABEL_KEY_RE),
        deepFindText(source, LABEL_KEY_RE)
    ]) || `${resolvedTicker} market tape candidate`;

    const stance = firstUsefulText([
        valueOf(source, ['stance', 'bias', 'state', 'tone'], null),
        valueOf(screener, ['stance', 'bias', 'state', 'tone'], null),
        valueOf(archetype, ['stance', 'bias', 'state', 'tone', 'family'], null)
    ]) || 'Monitor';

    const watchItem = firstUsefulText([
        valueOf(source, ['watch_item', 'watchItem', 'watch'], null),
        valueOf(screener, ['watch_item', 'watchItem', 'watch'], null),
        valueOf(indicators, ['watch_item', 'watchItem', 'watch'], null),
        hint.watchItem,
        deepFindText(screener, WATCH_KEY_RE),
        deepFindText(source, WATCH_KEY_RE)
    ]) || 'Watch for confirmation in price, sentiment, and participation context.';

    const directTagCandidates = [
        stance,
        valueOf(source, ['conflict_label', 'conflict'], null) || valueOf(screener, ['conflict_label', 'conflict'], null),
        valueOf(source, ['freshness_label', 'freshness'], null) || valueOf(screener, ['freshness_label', 'freshness'], null),
        valueOf(archetype, ['family', 'label'], null),
        ...(hint.tags || []),
        ...collectTextValues(valueOf(source, ['tags', 'labels', 'badges'], [])),
        ...collectTextValues(valueOf(screener, ['tags', 'labels', 'badges'], []))
    ];

    const tags = [];
    directTagCandidates.forEach(tag => {
        const text = String(tag || '').trim();
        if (text && text.length <= 42 && !tags.includes(text)) tags.push(text);
    });

    return {
        ticker: resolvedTicker,
        score,
        rank,
        label: String(label),
        stance: String(stance),
        watchItem: String(watchItem),
        tags: tags.slice(0, 4),
        source
    };
}

function cleanDisplayText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isGenericMarketTapeCopy(value, ticker = '') {
    const text = cleanDisplayText(value);
    if (!text) return true;

    const lower = text.toLowerCase();
    const t = String(ticker || '').trim().toLowerCase();

    if (['summary', 'monitor', 'candidate', 'watch', 'market tape candidate', 'none', 'n/a', 'null'].includes(lower)) {
        return true;
    }

    if (t && lower === `${t} market tape candidate`) return true;
    if (lower.endsWith(' market tape candidate')) return true;
    if (/^#?\d*\s*[A-Z0-9]{1,8}$/.test(text)) return true;

    return false;
}

function compactMarketTapeText(value, maxLength = 150) {
    const text = cleanDisplayText(value);
    if (!text || text.length <= maxLength) return text;

    const sentence = text.split(/(?<=[.!?])\s+/)[0] || text;
    if (sentence.length <= maxLength) return sentence;

    return `${sentence.slice(0, maxLength - 3).trim()}...`;
}

function firstNonGenericMarketTapeText(candidates, ticker = '', maxLength = 150) {
    for (const candidate of candidates) {
        if (!candidate) continue;
        const text = cleanDisplayText(candidate);
        if (!text || isGenericMarketTapeCopy(text, ticker)) continue;
        if (!isUsefulText(text) && text.length < 8) continue;
        return compactMarketTapeText(text, maxLength);
    }

    return '';
}

function shortLabelFromCopy(copy, ticker = '') {
    const text = firstNonGenericMarketTapeText([copy], ticker, 92);
    if (!text) return '';

    const withoutTicker = ticker
        ? text.replace(new RegExp(`^${ticker}\\s*[:\\-–—•]*\\s*`, 'i'), '').trim()
        : text;

    return compactMarketTapeText(withoutTicker || text, 92);
}

function deriveTagsFromCopy(copy, ticker = '') {
    const text = cleanDisplayText(copy);
    const lower = text.toLowerCase();
    const tags = [];

    const add = (tag) => {
        if (!tag || tags.includes(tag)) return;
        tags.push(tag);
    };

    if (/bull|constructive|repair|rebound|resilien/.test(lower)) add('Bullish');
    if (/bear|weak|deteriorat|reject|risk|pressure/.test(lower)) add('Bearish');
    if (/momentum|macd|trend/.test(lower)) add('Momentum');
    if (/repair|recover/.test(lower)) add('Repair');
    if (/confirm/.test(lower)) add('Confirmation');
    if (/watch|monitor/.test(lower)) add('Watch');
    if (/participation|breadth|source/.test(lower)) add('Participation');
    if (/sentiment/.test(lower)) add('Sentiment');
    if (/conflict|mixed/.test(lower)) add('Conflict');
    if (/quiet|low conviction|not match/.test(lower)) add('Quiet');
    if (/high-conviction|high conviction|strong/.test(lower)) add('High Conviction');
    if (/volume/.test(lower)) add('Volume');

    return tags.slice(0, 4);
}

function displayCardCopy(row) {
    const ticker = row?.ticker || '';
    const source = row?.source || {};
    const screener = source?.screener || source?.scorecard || source?.market_tape || {};
    const archetype = source?.archetype || source?.market_tape_family || source?.family || {};
    const indicators = source?.indicators || source?.indicator_payload || source?.indicator || {};

    const candidates = [
        row?.watchItem,
        row?.label,
        valueOf(source, ['watch_item', 'watchItem', 'watch', 'rationale', 'reason', 'description', 'summary'], null),
        valueOf(screener, ['watch_item', 'watchItem', 'watch', 'rationale', 'reason', 'description', 'summary'], null),
        valueOf(archetype, ['watch_item', 'watchItem', 'watch', 'rationale', 'reason', 'description', 'summary', 'label', 'family'], null),
        valueOf(indicators, ['watch_item', 'watchItem', 'watch', 'rationale', 'reason', 'description', 'summary'], null),
        deepFindText(screener, WATCH_KEY_RE),
        deepFindText(archetype, WATCH_KEY_RE),
        deepFindText(indicators, WATCH_KEY_RE),
        deepFindText(source, WATCH_KEY_RE)
    ];

    const text = firstNonGenericMarketTapeText(candidates, ticker, 170);
    if (text) return text;

    return `${ticker || 'Asset'} remains on module Market Tape watch; monitor price, sentiment, and participation confirmation.`;
}

function displayCardHeadline(row) {
    const ticker = row?.ticker || '';
    const candidates = [
        row?.label,
        shortLabelFromCopy(row?.watchItem, ticker),
        row?.watchItem,
        valueOf(row?.source || {}, ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'read', 'primary_read'], null)
    ];

    const text = firstNonGenericMarketTapeText(candidates, ticker, 92);
    if (text) return text;

    return 'Market tape watch';
}

function displayCardTags(row) {
    const ticker = row?.ticker || '';
    const explicitTags = (row?.tags || [])
        .map(tag => cleanDisplayText(tag))
        .filter(tag => tag && !isGenericMarketTapeCopy(tag, ticker));

    const derivedTags = deriveTagsFromCopy(`${row?.label || ''} ${row?.watchItem || ''}`, ticker);
    const tags = [];

    [...explicitTags, ...derivedTags].forEach(tag => {
        if (!tag || tags.includes(tag)) return;
        tags.push(tag);
    });

    return tags.length ? tags.slice(0, 4) : ['Watch'];
}

function sortTapeRows(rows, activeAsset) {
    return [...rows].sort((a, b) => {
        if (a.ticker === activeAsset && b.ticker !== activeAsset) return -1;
        if (b.ticker === activeAsset && a.ticker !== activeAsset) return 1;

        const aScore = a.score === null || a.score === undefined ? -Infinity : a.score;
        const bScore = b.score === null || b.score === undefined ? -Infinity : b.score;
        if (bScore !== aScore) return bScore - aScore;

        const aRank = a.rank || Infinity;
        const bRank = b.rank || Infinity;
        if (aRank !== bRank) return aRank - bRank;

        return a.ticker.localeCompare(b.ticker);
    });
}

function formatScore(score) {
    const n = asNumber(score, null);
    if (n === null) return '—';
    if (Math.abs(n) >= 100) return Math.round(n).toString();
    return n.toFixed(1).replace(/\.0$/, '');
}

function rankLabel(row) {
    const rank = asNumber(row.rank, null);
    return rank && rank > 0 ? `#${Math.round(rank)} ${row.ticker}` : row.ticker;
}

export const MarketTape = {
    targetId: 'module-market-tape',
    payload: null,
    _bound: false,

    init(options = {}) {
        console.log("Market Tape Module Initialized (Universal Listener)");
        this.targetId = options.targetId || this.targetId;
        this.ensureTarget();
        this.bindEvents();
        this.bindStoreEvents();
        this.load().catch(error => {
            console.warn('MarketTape: screener load failed', error);
            this.render();
        });
    },

    async load(options = {}) {
        if (this.payload && !options.force) {
            Store.setScreenerData(this.payload);
            this.render();
            return this.payload;
        }

        const response = await fetch('./fix26_screener_store.json');
        if (!response.ok) throw new Error(`Screener store fetch failed: ${response.status}`);

        this.payload = await response.json();
        Store.setScreenerData(this.payload);
        this.render();
        return this.payload;
    },

    ensureTarget() {
        let target = document.getElementById(this.targetId);
        if (target) return target;

        const briefing = document.getElementById('module-briefing-panel');
        const chart = document.getElementById('chart') || document.getElementById('chart-container');
        target = document.createElement('section');
        target.id = this.targetId;
        target.className = 'moduleMarketTapePanel';

        if (briefing && briefing.parentNode) {
            briefing.parentNode.insertBefore(target, briefing.nextSibling);
        } else if (chart && chart.parentNode) {
            chart.parentNode.insertBefore(target, chart);
        } else {
            document.body.appendChild(target);
        }

        return target;
    },

    bindEvents() {
        if (this._bound) return;
        this._bound = true;

        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-ticker], .tape-item, .asset-row, .market-tape-item, .moduleMarketTapeItem');
            if (target) {
                let ticker = target.getAttribute('data-ticker');

                if (!ticker) {
                    ticker = target.innerText.trim().split('\n')[0].replace(/[^A-Z]/g, '');
                }

                if (ticker && ticker.length > 0) {
                    console.log(`Market Tape caught click for: ${ticker}`);
                    Store.setAsset(ticker);
                }
            }
        });
    },

    bindStoreEvents() {
        Store.on('assetChanged', () => this.render());
        Store.on('controlChanged', ({ controlId }) => {
            if (['asset', 'range', 'freq', 'briefingMode'].includes(controlId)) this.render();
        });
        Store.on('screenerUpdated', data => {
            this.payload = data;
            this.render();
        });
    },

    rows() {
        return assetRowsFromScreener(this.payload || Store.state.screenerStore);
    },

    render() {
        const target = this.ensureTarget();
        const activeAsset = String(Store.state.currentAsset || 'BTC').trim().toUpperCase();
        const rows = sortTapeRows(this.rows(), activeAsset);
        const visibleRows = rows.slice(0, 8);
        const active = rows.find(row => row.ticker === activeAsset) || visibleRows[0] || null;

        if (!rows.length) {
            target.innerHTML = `
              <article class="moduleMarketTapeCard">
                <header class="moduleMarketTapeHeader">
                  <div>
                    <div class="moduleMarketTapeKicker">Module Market Tape</div>
                    <h2>Loading market tape...</h2>
                  </div>
                  <span class="moduleMarketTapePill">pending</span>
                </header>
              </article>
            `;
            return;
        }

        const itemCards = visibleRows.map(row => {
            const isActive = row.ticker === activeAsset;
            const tags = displayCardTags(row)
                .map(tag => `<span>${escapeHtml(tag)}</span>`)
                .join('');

            return `
              <button class="moduleMarketTapeItem ${isActive ? 'isActive' : ''}" data-ticker="${escapeHtml(row.ticker)}" type="button">
                <div class="moduleMarketTapeItemTop">
                  <strong>${escapeHtml(rankLabel(row))}</strong>
                  <em>${escapeHtml(formatScore(row.score))}</em>
                </div>
                <div class="moduleMarketTapeTags">${tags}</div>
                <p>${escapeHtml(displayCardCopy(row))}</p>
              </button>
            `;
        }).join('');

        target.innerHTML = `
          <article class="moduleMarketTapeCard">
            <header class="moduleMarketTapeHeader">
              <div>
                <div class="moduleMarketTapeKicker">Module Market Tape - Active ${escapeHtml(activeAsset)}</div>
                <h2>${escapeHtml(active ? `${rankLabel(active)}: ${displayCardHeadline(active)}` : 'Market tape')}</h2>
                <p>${escapeHtml(active ? displayCardCopy(active) : 'Select a market tape item to update the module asset context.')}</p>
              </div>
              <span class="moduleMarketTapePill">${rows.length} assets</span>
            </header>
            <div class="moduleMarketTapeGrid">${itemCards}</div>
          </article>
        `;
    }
};
