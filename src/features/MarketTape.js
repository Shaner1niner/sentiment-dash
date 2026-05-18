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
    ]) || `${resolvedTicker} radar candidate`;

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

    if (['summary', 'monitor', 'candidate', 'watch', 'radar candidate', 'none', 'n/a', 'null'].includes(lower)) {
        return true;
    }

    if (t && lower === `${t} radar candidate`) return true;
    if (lower.endsWith(' radar candidate')) return true;
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

    return `${ticker || 'Asset'} remains on module Market Radar watch; monitor price, sentiment, and participation confirmation.`;
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

    return 'Radar watch';
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

function structureQualityLabel(score) {
    const value = asNumber(score, null);
    if (value === null) return '';

    if (value >= 75) return 'Strong';
    if (value >= 50) return 'Mixed';
    return 'Weak';
}

function structureScoreDetail(row, screener = {}, archetype = {}, indicators = {}) {
    const score = valueOf(screener, [
        'structure_score',
        'structureScore',
        'signal_structure_score',
        'signalStructureScore',
        'screener_attention_priority_score',
        'attention_priority_score',
        'priority_score',
        'priorityScore'
    ], valueOf(archetype, [
        'structure_score',
        'structureScore',
        'archetype_confidence',
        'archetypeConfidence',
        'confidence_score',
        'confidenceScore'
    ], valueOf(indicators, [
        'structure_score',
        'structureScore',
        'signal_structure_score',
        'signalStructureScore'
    ], null)));

    const label = valueOf(screener, [
        'structure_label',
        'structureLabel',
        'signal_structure_label',
        'signalStructureLabel',
        'strength_label',
        'strengthLabel',
        'confidence_label',
        'confidenceLabel'
    ], valueOf(archetype, [
        'structure_label',
        'structureLabel',
        'confidence_label',
        'confidenceLabel'
    ], valueOf(indicators, [
        'structure_label',
        'structureLabel',
        'strength_label',
        'strengthLabel',
        'confidence_label',
        'confidenceLabel'
    ], '')));

    const scoreText = formatDeckValue(score, row?.ticker || '', 42);
    const labelText = cleanDisplayText(label) || structureQualityLabel(score);

    if (scoreText && labelText && !isGenericMarketTapeCopy(labelText, row?.ticker || '')) {
        return `${scoreText} · ${labelText}`;
    }

    return scoreText;
}

function selectedDetailItems(row) {
    if (!row) return [];

    const ticker = row.ticker || '';
    const source = row.source || {};
    const screener = source.screener || source.scorecard || source.market_tape || {};
    const archetype = source.archetype || source.market_tape_family || source.family || {};
    const indicators = source.indicators || source.indicator_payload || source.indicator || {};

    const items = [
        ['Structure Score', structureScoreDetail(row, screener, archetype, indicators) || `${rankLabel(row)} • ${formatScore(row.score)}`],
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

function friendlyDeckLabel(value) {
    const raw = cleanDisplayText(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const lower = raw.toLowerCase();

    if (/screener attention priority score|attention priority score|priority score|structure score|signal structure score/.test(lower)) {
        return 'Structure Score';
    }

    if (/signal consensus direction score|direction score/.test(lower)) {
        return 'Direction Score';
    }

    if (/signal consensus direction label|direction label/.test(lower)) {
        return 'Direction Label';
    }

    return prettyDeckLabel(value);
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
            label: friendlyDeckLabel(keyText),
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
            ['Structure Score', ['structure_score', 'structureScore', 'signal_structure_score', 'signalStructureScore', 'screener_attention_priority_score', 'attention_priority_score', 'priority_score', 'priorityScore']],
            ['Direction Score', ['signal_consensus_direction_score', 'direction_score', 'directionScore']],
            ['Direction Label', ['signal_consensus_direction_label', 'direction_label', 'directionLabel']],
            ['Setup read', ['headline', 'setup_label', 'setupLabel', 'label', 'title', 'read', 'primary_read']],
            ['Watch item', ['watch_item', 'watchItem', 'watch', 'rationale', 'reason']]
        ],
        5
    );

    const archetypeFacts = collectDeckFactsFromSource(
        archetype,
        ticker,
        [
            ['Family', ['family', 'label', 'archetype', 'name']],
            ['Confirmation', ['confirmation', 'confirmation_state', 'confirmationState']],
            ['Structure Score', ['structure_score', 'structureScore', 'screener_attention_priority_score', 'attention_priority_score', 'priority_score', 'priorityScore', 'archetype_confidence', 'archetypeConfidence']],
            ['Direction Score', ['signal_consensus_direction_score', 'direction_score', 'directionScore']],
            ['Direction Label', ['signal_consensus_direction_label', 'direction_label', 'directionLabel']]
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
            subtitle: 'structure / direction / setup',
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
      <details class="moduleMarketTapeDetailDeck moduleMarketTapeTechnicalDetail" aria-label="Signal internals">
        <summary class="moduleMarketTapeDeckHeader">
          <span>Signal Internals</span>
          <em>Optional model detail · ${escapeHtml(detailSourceSummary(row))}</em>
        </summary>
        <div class="moduleMarketTapeDeckGrid">${cards}</div>
      </details>
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


function timelineCopy(value, ticker = '', maxLength = 150) {
    const text = firstNonGenericMarketTapeText([value], ticker, maxLength);
    if (!text) return '';

    const safeTicker = String(ticker || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return text
        .replace(new RegExp(`^${safeTicker}\\s*[:\\-–—•]*\\s*`, 'i'), '')
        .replace(/\s+/g, ' ')
        .trim();
}

function timelineCompactList(parts, fallback = '') {
    const text = parts
        .map(part => cleanDisplayText(part))
        .filter(Boolean)
        .filter((part, index, arr) => arr.findIndex(item => item.toLowerCase() === part.toLowerCase()) === index)
        .join('; ');

    return text || fallback;
}

function timelineReadableLabel(value, fallback = 'Timeline item') {
    const text = cleanDisplayText(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
        .trim();

    return text || fallback;
}

function timelineEventLabel(source, detail, index = 0, row = null) {
    const ticker = row?.ticker || '';
    const rawLabel = timelineCopy(valueOf(source || {}, ['label', 'title', 'event', 'name', 'type', 'category'], ''), ticker, 72);
    const detailText = cleanDisplayText(detail);
    const labelText = cleanDisplayText(rawLabel);

    if (labelText && labelText.toLowerCase() !== detailText.toLowerCase()) {
        return timelineReadableLabel(labelText, `Event ${index + 1}`);
    }

    const lower = detailText.toLowerCase();

    if (/missing|confirmation|confirm|gate|breakdown|volatility|volume/.test(lower)) return 'Confirmation watch';
    if (/setup|read|archetype|high-conviction|conviction|signal family/.test(lower)) return 'Setup read';
    if (/receipt|close|score|direction|indicator|screener|priority/.test(lower)) return 'Receipt context';
    if (/momentum|macd|trend|rsi/.test(lower)) return 'Technical context';
    if (/participation|breadth|source/.test(lower)) return 'Participation context';

    return index === 0 ? 'Setup read' : `Context item ${index + 1}`;
}

function timelineEventMeta(source, fallback = 'watch context') {
    const date = formatDeckValue(eventValue(source, ['date', 'as_of', 'asOf', 'timestamp', 'published_at', 'publishedAt'], ''), '', 40);
    const status = formatDeckValue(eventValue(source, ['status', 'state', 'result', 'direction', 'tone', 'bias'], ''), '', 60);
    const family = formatDeckValue(eventValue(source, ['family', 'category', 'type'], ''), '', 60);
    const meta = [date, status, family]
        .map(part => cleanDisplayText(part))
        .filter(Boolean)
        .filter((part, index, arr) => arr.findIndex(item => item.toLowerCase() === part.toLowerCase()) === index)
        .join(' / ');

    return meta || fallback;
}


function timelineEventKind(source, detail = '') {
    const sourceText = cleanDisplayText([
        eventValue(source, ['status', 'state', 'result', 'direction', 'tone', 'bias'], ''),
        eventValue(source, ['family', 'category', 'type'], ''),
        eventValue(source, ['label', 'title', 'event', 'name'], ''),
        detail
    ].join(' ')).toLowerCase();

    if (/confirmed|accepted|validated|complete|resolved/.test(sourceText)) return 'confirmed';
    if (/debate|conflict|mixed|rejected|risk|bearish/.test(sourceText)) return 'debate';
    if (/watch|missing|confirmation|gate|pending|monitor/.test(sourceText)) return 'watch';
    if (/receipt|close|score|rank|priority|direction/.test(sourceText)) return 'receipt';
    if (/momentum|macd|rsi|trend|technical/.test(sourceText)) return 'technical';
    if (/participation|breadth|source|volume/.test(sourceText)) return 'participation';
    if (/setup|read|archetype|conviction/.test(sourceText)) return 'setup';

    return 'context';
}

function timelineFact(label, value, ticker = '', maxLength = 72) {
    const text = formatDeckValue(value, ticker, maxLength);
    if (!text) return null;
    return { label, value: text };
}

function timelineEventFacts(source, row = null, detail = '') {
    const ticker = row?.ticker || '';
    const screener = row?.source?.screener || row?.source?.scorecard || row?.source?.market_tape || {};
    const archetype = row?.source?.archetype || row?.source?.market_tape_family || row?.source?.family || {};
    const indicators = row?.source?.indicators || row?.source?.indicator_payload || row?.source?.indicator || {};

    const candidates = [
        timelineFact('Date', eventValue(source, ['date', 'as_of', 'asOf', 'timestamp', 'published_at', 'publishedAt'], ''), ticker, 52),
        timelineFact('Status', eventValue(source, ['status', 'state', 'result', 'direction', 'tone', 'bias'], ''), ticker, 58),
        timelineFact('Family', eventValue(source, ['family', 'category', 'type'], ''), ticker, 58),
        timelineFact('Close', eventValue(source, ['close', 'latest_close', 'latestClose', 'price'], valueOf(screener, ['latest_close', 'latestClose', 'close', 'price'], '')), ticker, 46),
        timelineFact('Structure Score', eventValue(source, ['priority_score', 'priorityScore', 'score', 'attention_priority_score'], valueOf(screener, ['screener_attention_priority_score', 'attention_priority_score', 'priority_score', 'priorityScore', 'score'], '')), ticker, 46),
        timelineFact('Direction', eventValue(source, ['direction_label', 'directionLabel', 'direction', 'bias'], valueOf(screener, ['signal_consensus_direction_label', 'direction_label', 'directionLabel'], '')), ticker, 62),
        timelineFact('Confirmation', eventValue(source, ['confirmation', 'confirmation_state', 'confirmationState'], valueOf(archetype, ['missing_confirmations', 'missingConfirmations', 'confirmation', 'confirmation_state', 'confirmationState'], '')), ticker, 72),
        timelineFact('Indicator', eventValue(source, ['indicator_family', 'indicatorFamily', 'indicator', 'technical'], valueOf(indicators, ['indicator_family', 'indicatorFamily', 'family'], '')), ticker, 62)
    ].filter(Boolean);

    const seen = new Set();
    return candidates.filter(fact => {
        const key = `${fact.label}:${fact.value}`.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).slice(0, 5);
}

function timelineEventEvidence(source, row = null, detail = '') {
    const ticker = row?.ticker || '';
    const candidates = [
        eventValue(source, ['evidence', 'receipt', 'receipts', 'context', 'context_note', 'contextNote'], ''),
        eventValue(source, ['summary', 'description', 'note', 'rationale', 'reason', 'detail', 'details'], ''),
        eventValue(source, ['watch_item', 'watchItem', 'watch'], ''),
        detail
    ];

    const evidence = [];
    candidates.forEach(candidate => {
        collectTextValues(candidate, evidence, 0);
    });

    if (!evidence.length && detail) evidence.push(detail);

    const seen = new Set();
    return evidence
        .map(value => timelineCopy(value, ticker, 130))
        .filter(Boolean)
        .filter(value => {
            const key = value.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 3);
}

function renderTimelineFacts(item) {
    const facts = Array.isArray(item?.facts) ? item.facts : [];
    if (!facts.length) return '';

    return `
            <dl class="moduleMarketTapeTimelineFacts">
              ${facts.map(fact => `
                <div>
                  <dt>${escapeHtml(fact.label)}</dt>
                  <dd>${escapeHtml(fact.value)}</dd>
                </div>
              `).join('')}
            </dl>
    `;
}

function renderTimelineEvidence(item) {
    const evidence = Array.isArray(item?.evidence) ? item.evidence : [];
    if (!evidence.length) return '';

    return `
            <ul class="moduleMarketTapeTimelineEvidence">
              ${evidence.map(line => `<li>${escapeHtml(line)}</li>`).join('')}
            </ul>
    `;
}
function normalizeMarketTapeEvent(item, index = 0, row = null) {
    const ticker = row?.ticker || '';
    const source = item && typeof item === 'object' ? item : { label: item, summary: item };

    const detail = timelineCopy(firstNonGenericMarketTapeText([
        eventValue(source, ['summary', 'description', 'note', 'rationale', 'reason', 'detail', 'details'], ''),
        eventValue(source, ['watch_item', 'watchItem', 'watch'], ''),
        eventValue(source, ['confirmation', 'missing_confirmations', 'missingConfirmations'], ''),
        eventValue(source, ['label', 'title', 'event', 'name'], '')
    ], ticker, 160), ticker, 160) || displayCardCopy(row);

    return {
        label: timelineEventLabel(source, detail, index, row),
        detail,
        meta: timelineEventMeta(source),
        kind: timelineEventKind(source, detail),
        facts: timelineEventFacts(source, row, detail),
        evidence: timelineEventEvidence(source, row, detail)
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
    const priorityScore = formatDeckValue(valueOf(screener, ['screener_attention_priority_score', 'attention_priority_score', 'priority_score', 'priorityScore', 'score'], ''), ticker, 45);
    const directionScore = formatDeckValue(valueOf(screener, ['signal_consensus_direction_score', 'direction_score', 'directionScore'], ''), ticker, 45);
    const directionLabel = formatDeckValue(valueOf(screener, ['signal_consensus_direction_label', 'direction_label', 'directionLabel'], ''), ticker, 70);
    const indicatorFamily = formatDeckValue(valueOf(indicators, ['indicator_family', 'indicatorFamily', 'family'], ''), ticker, 70);
    const strengthLabel = formatDeckValue(valueOf(indicators, ['strength_label', 'strengthLabel', 'confidence_label', 'confidenceLabel'], ''), ticker, 70);
    const missingConfirmations = timelineCopy(firstNonGenericMarketTapeText([
        valueOf(archetype, ['missing_confirmations', 'missingConfirmations', 'confirmation', 'confirmation_state', 'confirmationState'], null)
    ], ticker, 150), ticker, 150);
    const setupRead = timelineCopy(displayCardHeadline(row), ticker, 140);
    const watchRead = timelineCopy(displayCardCopy(row), ticker, 150);

    const setupDetail = setupRead && setupRead.toLowerCase() !== watchRead.toLowerCase()
        ? setupRead
        : timelineCompactList(
            [
                directionLabel ? `Direction: ${directionLabel}` : '',
                priorityScore ? `Structure score: ${priorityScore}` : '',
                indicatorFamily ? `Indicator family: ${indicatorFamily}` : ''
            ],
            watchRead || `${ticker || 'Asset'} remains on Market Radar watch.`
        );

    const receiptDetail = timelineCompactList(
        [
            priorityScore ? `Structure score ${priorityScore}` : '',
            directionScore ? `direction score ${directionScore}` : '',
            directionLabel ? directionLabel : '',
            indicatorFamily ? `${indicatorFamily} family` : '',
            strengthLabel ? `${strengthLabel} strength` : ''
        ],
        `${ticker || 'Asset'} remains under screener, archetype, and indicator review.`
    );

    const items = [
        {
            label: 'Setup read',
            meta: 'selected asset',
            detail: setupDetail,
            kind: 'setup',
            facts: [
                priorityScore ? { label: 'Structure Score', value: priorityScore } : null,
                directionLabel ? { label: 'Direction', value: directionLabel } : null,
                indicatorFamily ? { label: 'Indicator', value: indicatorFamily } : null
            ].filter(Boolean),
            evidence: [setupRead, watchRead].filter(Boolean).slice(0, 2)
        },
        {
            label: 'Confirmation watch',
            meta: missingConfirmations ? 'confirmation gate' : 'watch item',
            detail: missingConfirmations || watchRead,
            kind: 'watch',
            facts: [
                missingConfirmations ? { label: 'Gate', value: missingConfirmations } : null,
                strengthLabel ? { label: 'Strength', value: strengthLabel } : null,
                directionScore ? { label: 'Direction Score', value: directionScore } : null
            ].filter(Boolean),
            evidence: [missingConfirmations || watchRead].filter(Boolean)
        },
        {
            label: 'Receipt context',
            meta: [latestClose ? `close ${latestClose}` : '', asOf].filter(Boolean).join(' / ') || detailSourceSummary(row),
            detail: receiptDetail,
            kind: 'receipt',
            facts: [
                latestClose ? { label: 'Close', value: latestClose } : null,
                asOf ? { label: 'As of', value: asOf } : null,
                priorityScore ? { label: 'Structure Score', value: priorityScore } : null,
                directionScore ? { label: 'Direction Score', value: directionScore } : null
            ].filter(Boolean),
            evidence: [receiptDetail].filter(Boolean)
        }
    ];

    return dedupe(items
        .filter(item => item.detail && !isGenericMarketTapeCopy(item.detail, ticker))
        .filter(item => item.label.toLowerCase() !== item.detail.toLowerCase()))
        .slice(0, 4);
}

function renderMarketTapeEventTimeline(row) {
    const items = marketTapeTimelineItems(row);
    if (!items.length) return '';

    const timeline = items.map((item, index) => `
        <li class="moduleMarketTapeTimelineItem is-${escapeHtml(item.kind || 'context')}">
          <span class="moduleMarketTapeTimelineDot">${index + 1}</span>
          <div>
            <div class="moduleMarketTapeTimelineTitleRow">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(timelineReadableLabel(item.kind || 'context', 'Context'))}</span>
            </div>
            <em>${escapeHtml(item.meta)}</em>
            <p>${escapeHtml(item.detail)}</p>
            ${renderTimelineFacts(item)}
            ${renderTimelineEvidence(item)}
          </div>
        </li>
    `).join('');

    return `
      <section class="moduleMarketTapeEventTimeline" aria-label="Evidence trail">
        <div class="moduleMarketTapeTimelineHeader">
          <span>Evidence Trail</span>
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
      <section class="moduleMarketTapeSelectedDetail" aria-label="Asset Signal Readout">
        <div class="moduleMarketTapeDetailKicker">Asset Signal Readout</div>
        <div class="moduleMarketTapeDetailGrid">${rows}</div>
        ${eventTimeline}
        ${detailDeck}
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
      <nav class="moduleMarketTapeFilters" aria-label="Market Radar filters">
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

function chartCoveredTickerSet() {
    const assets = Store.state.assetStoreIndex?.assets;
    if (!assets || typeof assets !== 'object') return null;

    const tickers = Object.keys(assets)
        .map(ticker => String(ticker || '').trim().toUpperCase())
        .filter(Boolean);

    return tickers.length ? new Set(tickers) : null;
}

function filterRowsToChartCoverage(rows) {
    const source = Array.isArray(rows) ? rows : [];
    const covered = chartCoveredTickerSet();
    if (!covered || !covered.size) return source;
    return source.filter(row => covered.has(String(row?.ticker || '').trim().toUpperCase()));
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
    detailTargetId: 'module-market-tape-detail',
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
        const controls = document.querySelector('.controls');
        const chart = document.getElementById('chart') || document.getElementById('chart-container');
        target = document.createElement('section');
        target.id = this.targetId;
        target.className = 'moduleMarketTapePanel';

        if (briefing && briefing.parentNode) {
            briefing.parentNode.insertBefore(target, briefing);
        } else if (controls && controls.parentNode) {
            controls.parentNode.insertBefore(target, controls.nextSibling);
        } else if (chart && chart.parentNode) {
            chart.parentNode.insertBefore(target, chart);
        } else {
            document.body.appendChild(target);
        }

        return target;
    },

    ensureDetailTarget() {
        let target = document.getElementById(this.detailTargetId);
        if (target) return target;

        const briefing = document.getElementById('module-briefing-panel');
        const chart = document.getElementById('chart') || document.getElementById('chart-container');
        target = document.createElement('section');
        target.id = this.detailTargetId;
        target.className = 'moduleMarketTapeDetailPanel';

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
                    const normalizedTicker = String(ticker || '').trim().toUpperCase();
                    const covered = chartCoveredTickerSet();

                    if (covered && covered.size && !covered.has(normalizedTicker)) {
                        console.warn(`MarketTape: ignored unsupported public chart ticker ${normalizedTicker}`);
                        return;
                    }

                    console.log(`Market Tape caught click for: ${normalizedTicker}`);
                    Store.setAsset(normalizedTicker);
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
        Store.on('assetStoreIndexUpdated', () => this.render());
    },

    rows() {
        return filterRowsToChartCoverage(assetRowsFromScreener(this.payload || Store.state.screenerStore));
    },

    render() {
        const target = this.ensureTarget();
        const detailTarget = this.ensureDetailTarget();
        let activeAsset = String(Store.state.currentAsset || 'BTC').trim().toUpperCase();
        const baseRows = this.rows();

        if (baseRows.length && !baseRows.some(row => row.ticker === activeAsset)) {
            activeAsset = baseRows[0].ticker;
        }

        const rows = sortTapeRows(baseRows, activeAsset);
        const activeFilter = this.filter || 'all';
        const filteredRows = filterRowsForChip(rows, activeFilter);
        const visibleRows = filteredRows.slice(0, 8);
        const active = rows.find(row => row.ticker === activeAsset) || filteredRows[0] || rows[0] || null;
        const selectedDetail = active ? renderSelectedDetail(active) : '';
        const filterChips = renderFilterChips(rows, activeFilter);
        const emptyMessage = visibleRows.length ? '' : '<div class="moduleMarketTapeEmpty">No Market Radar cards match this filter.</div>';

        if (!rows.length) {
            detailTarget.innerHTML = '';

            target.innerHTML = `
              <article class="moduleMarketTapeCard">
                <header class="moduleMarketTapeHeader">
                  <div>
                    <div class="moduleMarketTapeKicker">Market Radar</div>
                    <h2>Loading market radar...</h2>
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
                <div class="moduleMarketTapeKicker">Market Radar · Active ${escapeHtml(activeAsset)}</div>
                <h2>${escapeHtml(active ? `${rankLabel(active)}: ${displayCardHeadline(active)}` : 'Market radar')}</h2>
                <p>${escapeHtml(active ? displayCardCopy(active) : 'Select a radar card to update the selected asset context.')}</p>
              </div>
              <span class="moduleMarketTapePill">${rows.length} assets</span>
            </header>
            ${filterChips}
            <div class="moduleMarketTapeGrid">${itemCards}</div>
            ${emptyMessage}
          </article>
        `;

        detailTarget.innerHTML = selectedDetail;
    }
};
