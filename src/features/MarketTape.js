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

function detailCandidateValue(row, source, keys, ticker = '') {
    const direct = valueOf(source || {}, keys, null);
    if (direct && !isGenericMarketTapeCopy(direct, ticker)) return compactMarketTapeText(direct, 190);
    return '';
}

function detailSourceSummary(row) {
    const source = row?.source || {};
    const sources = [];

    if (source.screener || source.scorecard || source.market_tape) sources.push('screener');
    if (source.archetype || source.market_tape_family || source.family) sources.push('archetype');
    if (source.indicators || source.indicator_payload || source.indicator) sources.push('indicators');
    if (!sources.length && Object.keys(source).length) sources.push('by_term');

    return sources.length ? sources.join(' / ') : 'module row';
}

function selectedDetailItems(row) {
    if (!row) return [];

    const ticker = row.ticker || '';
    const source = row.source || {};
    const screener = source.screener || source.scorecard || source.market_tape || {};
    const archetype = source.archetype || source.market_tape_family || source.family || {};
    const indicators = source.indicators || source.indicator_payload || source.indicator || {};

    const items = [
        ['Rank / score', `${rankLabel(row)} • ${formatScore(row.score)}`],
        ['Setup read', displayCardHeadline(row)],
        ['Watch item', displayCardCopy(row)],
        ['Tags', displayCardTags(row).join(' / ')],
        ['Payload source', detailSourceSummary(row)],
        ['Screener note', detailCandidateValue(row, screener, ['note', 'summary', 'description', 'rationale', 'reason'], ticker)],
        ['Archetype', detailCandidateValue(row, archetype, ['family', 'label', 'headline', 'summary', 'description'], ticker)],
        ['Indicator context', detailCandidateValue(row, indicators, ['summary', 'description', 'rationale', 'reason', 'watch_item', 'watchItem'], ticker)]
    ];

    const seen = new Set();

    return items
        .map(([label, value]) => ({ label, value: cleanDisplayText(value) }))
        .filter(item => {
            if (!item.value || isGenericMarketTapeCopy(item.value, ticker)) return false;
            const key = `${item.label}:${item.value}`.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 8);
}

function prettyDeckLabel(value) {
    const text = cleanDisplayText(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase());

    return text || 'Context';
}

function formatDeckValue(value, ticker = '', maxLength = 185) {
    if (value === null || value === undefined || value === '') return '';

    if (typeof value === 'number') return formatScore(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';

    if (Array.isArray(value)) {
        const text = value
            .map(item => typeof item === 'object' ? '' : cleanDisplayText(item))
            .filter(Boolean)
            .join(' / ');
        return text ? compactMarketTapeText(text, maxLength) : '';
    }

    if (typeof value === 'object') return '';

    const text = cleanDisplayText(value);
    if (!text || isGenericMarketTapeCopy(text, ticker)) return '';

    return compactMarketTapeText(text, maxLength);
}

function deckFactFromKeys(source, label, keys, ticker = '') {
    const value = valueOf(source || {}, keys, null);
    const text = formatDeckValue(value, ticker);
    if (!text) return null;

    return { label, value: text };
}

function collectDeckFactsFromSource(source, ticker = '', preferredFacts = [], limit = 5) {
    const facts = [];
    const seen = new Set();

    const addFact = (fact) => {
        if (!fact || !fact.label || !fact.value) return;
        const key = `${fact.label}:${fact.value}`.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        facts.push(fact);
    };

    preferredFacts.forEach(([label, keys]) => addFact(deckFactFromKeys(source, label, keys, ticker)));

    walkPrimitives(source, (key, value, path) => {
        if (facts.length >= limit) return;
        const keyText = String(key || '');
        const pathText = path.join('.');

        if (!/(read|setup|watch|signal|state|bias|tone|confidence|confirm|conflict|momentum|trend|macd|rsi|volume|participation|breadth|score|rank|receipt|context|label|family)/i.test(pathText)) {
            return;
        }

        const text = formatDeckValue(value, ticker, 170);
        if (!text) return;

        addFact({
            label: prettyDeckLabel(keyText),
            value: text
        });
    });

    return facts.slice(0, limit);
}

function deckSourceObject(row, primaryKeys) {
    const source = row?.source || {};
    for (const key of primaryKeys) {
        const candidate = source[key];
        if (candidate && typeof candidate === 'object' && Object.keys(candidate).length) return candidate;
    }

    return {};
}

function marketTapeDetailDeckSections(row) {
    if (!row) return [];

    const ticker = row.ticker || '';
    const source = row.source || {};
    const screener = deckSourceObject(row, ['screener', 'scorecard', 'market_tape']);
    const archetype = deckSourceObject(row, ['archetype', 'market_tape_family', 'family']);
    const indicators = deckSourceObject(row, ['indicators', 'indicator_payload', 'indicator']);

    const screenerFacts = collectDeckFactsFromSource(
        Object.keys(screener).length ? screener : source,
        ticker,
        [
            ['Setup read', ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'read', 'primary_read']],
            ['Watch item', ['watch_item', 'watchItem', 'watch', 'rationale', 'reason']],
            ['State', ['state', 'stance', 'bias', 'tone']],
            ['Score', ['priority_score', 'priorityScore', 'seta_score', 'setaScore', 'market_tape_score', 'score']],
            ['Rank', ['priority_rank', 'priorityRank', 'market_tape_rank', 'rank']]
        ],
        5
    );

    const archetypeFacts = collectDeckFactsFromSource(
        archetype,
        ticker,
        [
            ['Family', ['family', 'label', 'archetype', 'name']],
            ['Confirmation', ['confirmation', 'confirmation_state', 'confirmationState']],
            ['Conflict', ['conflict', 'conflict_label', 'conflictLabel']],
            ['Confidence', ['confidence', 'conviction', 'quality']],
            ['Context', ['context', 'summary', 'description']]
        ],
        5
    );

    const indicatorFacts = collectDeckFactsFromSource(
        indicators,
        ticker,
        [
            ['Trend momentum', ['trend_momentum', 'trendMomentum', 'momentum', 'trend']],
            ['MACD impulse', ['macd_impulse', 'macdImpulse', 'macd', 'macd_state', 'macdState']],
            ['RSI context', ['rsi', 'rsi_context', 'rsiContext']],
            ['Volume context', ['volume_context', 'volumeContext', 'volume']],
            ['Participation', ['participation', 'breadth', 'source_breadth', 'sourceBreadth']]
        ],
        5
    );

    const fallbackSetup = [
        { label: 'Setup read', value: displayCardHeadline(row) },
        { label: 'Watch item', value: displayCardCopy(row) },
        { label: 'Tags', value: displayCardTags(row).join(' / ') }
    ].filter(fact => fact.value && !isGenericMarketTapeCopy(fact.value, ticker));

    const sections = [
        {
            title: 'Screener receipt',
            subtitle: 'rank / score / setup',
            facts: screenerFacts.length ? screenerFacts : fallbackSetup
        },
        {
            title: 'Archetype read',
            subtitle: 'family / confirmation',
            facts: archetypeFacts.length ? archetypeFacts : [{ label: 'Tags', value: displayCardTags(row).join(' / ') }]
        },
        {
            title: 'Indicator context',
            subtitle: 'momentum / participation',
            facts: indicatorFacts.length ? indicatorFacts : [{ label: 'Watch item', value: displayCardCopy(row) }]
        }
    ];

    return sections
        .map(section => ({
            ...section,
            facts: section.facts
                .map(fact => ({ label: fact.label, value: formatDeckValue(fact.value, ticker, 190) }))
                .filter(fact => fact.label && fact.value)
                .slice(0, 5)
        }))
        .filter(section => section.facts.length);
}

function renderMarketTapeDetailDeck(row) {
    const sections = marketTapeDetailDeckSections(row);
    if (!sections.length) return '';

    const cards = sections.map(section => {
        const facts = section.facts.map(fact => `
            <li>
              <span>${escapeHtml(fact.label)}</span>
              <strong>${escapeHtml(fact.value)}</strong>
            </li>
        `).join('');

        return `
          <article class="moduleMarketTapeDeckCard">
            <div>
              <h3>${escapeHtml(section.title)}</h3>
              <em>${escapeHtml(section.subtitle)}</em>
            </div>
            <ul>${facts}</ul>
          </article>
        `;
    }).join('');

    return `
      <section class="moduleMarketTapeDetailDeck" aria-label="Market Tape detail deck">
        <div class="moduleMarketTapeDeckHeader">
          <span>Detail deck</span>
          <em>${escapeHtml(detailSourceSummary(row))}</em>
        </div>
        <div class="moduleMarketTapeDeckGrid">${cards}</div>
      </section>
    `;
}

function eventSourceObjects(row) {
    const source = row?.source || {};
    const buckets = [
        source,
        source.screener || source.scorecard || source.market_tape || {},
        source.archetype || source.market_tape_family || source.family || {},
        source.indicators || source.indicator_payload || source.indicator || {}
    ];

    const candidates = [];

    const collect = (value) => {
        if (!value) return;
        if (Array.isArray(value)) {
            value.forEach(item => collect(item));
            return;
        }
        if (typeof value === 'object') candidates.push(value);
    };

    buckets.forEach(bucket => {
        [
            'events',
            'event_timeline',
            'eventTimeline',
            'latest_events',
            'latestEvents',
            'confirmations',
            'confirmation_events',
            'confirmationEvents',
            'alerts',
            'watch_events',
            'watchEvents',
            'catalysts',
            'receipts'
        ].forEach(key => collect(bucket[key]));

        const latest = valueOf(bucket, [
            'latest_event',
            'latestEvent',
            'latest_receipt',
            'latestReceipt',
            'recent_event',
            'recentEvent',
            'watch_event',
            'watchEvent',
            'confirmation',
            'missing_confirmations',
            'missingConfirmations'
        ], null);

        if (latest && typeof latest === 'object') collect(latest);
        if (latest && typeof latest !== 'object') {
            candidates.push({ label: String(latest), summary: String(latest), type: 'confirmation' });
        }
    });

    return candidates;
}

function eventValue(item, keys, fallback = '') {
    const direct = valueOf(item || {}, keys, null);
    if (direct !== null && direct !== undefined && direct !== '') return direct;
    return fallback;
}

function normalizeMarketTapeEvent(item, index = 0, row = null) {
    const ticker = row?.ticker || '';
    const source = item && typeof item === 'object' ? item : { label: item };
    const label = firstNonGenericMarketTapeText([
        eventValue(source, ['label', 'title', 'event', 'name', 'type', 'category'], ''),
        eventValue(source, ['confirmation', 'missing_confirmations', 'missingConfirmations'], ''),
        eventValue(source, ['headline', 'summary', 'description', 'note'], '')
    ], ticker, 92) || `Event ${index + 1}`;

    const detail = firstNonGenericMarketTapeText([
        eventValue(source, ['summary', 'description', 'note', 'rationale', 'reason', 'detail', 'details'], ''),
        eventValue(source, ['watch_item', 'watchItem', 'watch'], ''),
        eventValue(source, ['confirmation', 'missing_confirmations', 'missingConfirmations'], '')
    ], ticker, 150) || displayCardCopy(row);

    const date = formatDeckValue(eventValue(source, ['date', 'as_of', 'asOf', 'timestamp', 'published_at', 'publishedAt'], ''), ticker, 40);
    const status = formatDeckValue(eventValue(source, ['status', 'state', 'result', 'direction', 'tone', 'bias'], ''), ticker, 60);
    const metaParts = [date, status].filter(Boolean);
    const meta = metaParts.length ? metaParts.join(' / ') : 'watch context';

    return {
        label,
        detail,
        meta
    };
}

function marketTapeTimelineItems(row) {
    if (!row) return [];

    const ticker = row.ticker || '';
    const explicitEvents = eventSourceObjects(row)
        .map((item, index) => normalizeMarketTapeEvent(item, index, row))
        .filter(item => item.label && item.detail);

    const seen = new Set();
    const dedupe = (items) => items.filter(item => {
        const key = `${item.label}:${item.detail}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const normalizedEvents = dedupe(explicitEvents);
    if (normalizedEvents.length) return normalizedEvents.slice(0, 4);

    const source = row.source || {};
    const screener = source.screener || source.scorecard || source.market_tape || {};
    const archetype = source.archetype || source.market_tape_family || source.family || {};
    const indicators = source.indicators || source.indicator_payload || source.indicator || {};

    const latestClose = formatDeckValue(valueOf(screener, ['latest_close', 'latestClose', 'close', 'price'], ''), ticker, 50);
    const asOf = formatDeckValue(valueOf(screener, ['as_of', 'asOf', 'date', 'latest_date', 'latestDate'], ''), ticker, 50);
    const missingConfirmations = firstNonGenericMarketTapeText([
        valueOf(archetype, ['missing_confirmations', 'missingConfirmations', 'confirmation', 'confirmation_state', 'confirmationState'], null)
    ], ticker, 150);
    const indicatorContext = firstNonGenericMarketTapeText([
        valueOf(indicators, ['indicator_family', 'indicatorFamily', 'family'], null),
        valueOf(indicators, ['direction_label', 'directionLabel', 'strength_label', 'strengthLabel', 'confidence_label', 'confidenceLabel'], null)
    ], ticker, 120);

    return dedupe([
        {
            label: 'Setup read',
            meta: 'selected asset',
            detail: displayCardHeadline(row)
        },
        {
            label: 'Confirmation watch',
            meta: missingConfirmations ? 'confirmation gate' : 'watch item',
            detail: missingConfirmations || displayCardCopy(row)
        },
        {
            label: 'Receipt context',
            meta: [latestClose ? `close ${latestClose}` : '', asOf].filter(Boolean).join(' / ') || detailSourceSummary(row),
            detail: indicatorContext || `${ticker || 'Asset'} remains under screener / archetype / indicator review.`
        }
    ].filter(item => item.detail && !isGenericMarketTapeCopy(item.detail, ticker))).slice(0, 4);
}

function renderMarketTapeEventTimeline(row) {
    const items = marketTapeTimelineItems(row);
    if (!items.length) return '';

    const timeline = items.map((item, index) => `
        <li class="moduleMarketTapeTimelineItem">
          <span class="moduleMarketTapeTimelineDot">${index + 1}</span>
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <em>${escapeHtml(item.meta)}</em>
            <p>${escapeHtml(item.detail)}</p>
          </div>
        </li>
    `).join('');

    return `
      <section class="moduleMarketTapeEventTimeline" aria-label="Market Tape event timeline">
        <div class="moduleMarketTapeTimelineHeader">
          <span>Event / confirmation timeline</span>
          <em>${escapeHtml(row?.ticker || 'Asset')}</em>
        </div>
        <ol>${timeline}</ol>
      </section>
    `;
}

function renderSelectedDetail(row) {
    if (!row) return '';

    const detailItems = selectedDetailItems(row);
    if (!detailItems.length) return '';

    const detailDeck = renderMarketTapeDetailDeck(row);
    const eventTimeline = renderMarketTapeEventTimeline(row);
    const rows = detailItems.map(item => `
        <div class="moduleMarketTapeDetailItem">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
    `).join('');

    return `
      <section class="moduleMarketTapeSelectedDetail" aria-label="Selected Market Tape detail">
        <div class="moduleMarketTapeDetailKicker">Selected Market Tape Detail</div>
        <div class="moduleMarketTapeDetailGrid">${rows}</div>
        ${detailDeck}
        ${eventTimeline}
      </section>
    `;
}

const MARKET_TAPE_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'bullish', label: 'Bullish' },
    { key: 'bearish', label: 'Bearish' },
    { key: 'momentum', label: 'Momentum' },
    { key: 'watch', label: 'Watch' },
    { key: 'confirmation', label: 'Confirmation' },
    { key: 'high-conviction', label: 'High Conviction' },
    { key: 'quiet', label: 'Quiet' }
];

function filterKeyForLabel(value) {
    const key = cleanDisplayText(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return key || 'all';
}

function rowFilterKeySpace(row) {
    const tags = displayCardTags(row);
    const copy = `${displayCardHeadline(row)} ${displayCardCopy(row)} ${tags.join(' ')}`;
    const lower = copy.toLowerCase();
    const keys = new Set(tags.map(filterKeyForLabel));

    if (/bull|constructive|repair|rebound|resilien/.test(lower)) keys.add('bullish');
    if (/bear|weak|deteriorat|reject|risk|pressure/.test(lower)) keys.add('bearish');
    if (/momentum|macd|trend/.test(lower)) keys.add('momentum');
    if (/watch|monitor/.test(lower)) keys.add('watch');
    if (/confirm/.test(lower)) keys.add('confirmation');
    if (/high-conviction|high conviction|strong/.test(lower)) keys.add('high-conviction');
    if (/quiet|low conviction|not match/.test(lower)) keys.add('quiet');

    return keys;
}

function filterRowsForChip(rows, filterKey = 'all') {
    const key = filterKeyForLabel(filterKey);
    if (!key || key === 'all') return rows;

    return rows.filter(row => rowFilterKeySpace(row).has(key));
}

function filterChipOptions(rows) {
    return MARKET_TAPE_FILTERS.map(definition => ({
        ...definition,
        count: definition.key === 'all'
            ? rows.length
            : filterRowsForChip(rows, definition.key).length
    })).filter(chip => chip.key === 'all' || chip.count > 0);
}

function renderFilterChips(rows, activeFilter = 'all') {
    const activeKey = filterKeyForLabel(activeFilter);
    const chips = filterChipOptions(rows);
    if (chips.length <= 1) return '';

    const buttons = chips.map(chip => {
        const isActive = chip.key === activeKey || (chip.key === 'all' && activeKey === 'all');
        return `
          <button class="moduleMarketTapeFilterChip ${isActive ? 'isActive' : ''}" type="button" data-market-tape-filter="${escapeHtml(chip.key)}">
            <span>${escapeHtml(chip.label)}</span>
            <em>${escapeHtml(chip.count)}</em>
          </button>
        `;
    }).join('');

    return `
      <nav class="moduleMarketTapeFilters" aria-label="Market Tape filters">
        ${buttons}
      </nav>
    `;
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
    filter: 'all',
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
            const filterTarget = e.target.closest('[data-market-tape-filter]');
            if (filterTarget) {
                this.filter = filterTarget.getAttribute('data-market-tape-filter') || 'all';
                this.render();
                return;
            }

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
        const activeFilter = this.filter || 'all';
        const filteredRows = filterRowsForChip(rows, activeFilter);
        const visibleRows = filteredRows.slice(0, 8);
        const active = rows.find(row => row.ticker === activeAsset) || filteredRows[0] || rows[0] || null;
        const selectedDetail = active ? renderSelectedDetail(active) : '';
        const filterChips = renderFilterChips(rows, activeFilter);
        const emptyMessage = visibleRows.length ? '' : '<div class="moduleMarketTapeEmpty">No Market Tape cards match this filter.</div>';

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
            ${filterChips}
            <div class="moduleMarketTapeGrid">${itemCards}</div>
            ${emptyMessage}
            ${selectedDetail}
          </article>
        `;
    }
};
