import { Store } from '../Store.js';

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

function assetRowsFromScreener(payload) {
    if (!payload || typeof payload !== 'object') return [];

    const byTerm = payload.by_term || payload.byTerm || payload.assets || payload.terms || {};
    if (Array.isArray(byTerm)) {
        return byTerm.map((item, index) => normalizeMarketTapeItem(item, item.term || item.asset || item.ticker || `asset-${index}`));
    }

    if (byTerm && typeof byTerm === 'object') {
        return Object.entries(byTerm).map(([ticker, item]) => normalizeMarketTapeItem(item, ticker));
    }

    return [];
}

function normalizeMarketTapeItem(item, ticker) {
    const source = item && typeof item === 'object' ? item : {};
    const screener = source.screener || source.scorecard || source.market_tape || {};
    const archetype = source.archetype || source.market_tape_family || source.family || {};
    const indicators = source.indicators || source.indicator_payload || source.indicator || {};

    const score = asNumber(
        nestedValue(source, [
            'priority_score',
            'seta_score',
            'score',
            'screener.priority_score',
            'screener.seta_score',
            'screener.score',
            'market_tape.priority_score',
            'market_tape.score'
        ], null),
        0
    );

    const label = valueOf(source, ['headline', 'label', 'title', 'read', 'primary_read'], null)
        || valueOf(screener, ['headline', 'label', 'title', 'read', 'primary_read'], null)
        || valueOf(archetype, ['headline', 'label', 'title', 'family'], null)
        || `${ticker} market tape candidate`;

    const stance = valueOf(source, ['stance', 'bias', 'state', 'tone'], null)
        || valueOf(screener, ['stance', 'bias', 'state', 'tone'], null)
        || valueOf(archetype, ['stance', 'bias', 'state', 'tone', 'family'], null)
        || 'Monitor';

    const watchItem = valueOf(source, ['watch_item', 'watchItem', 'watch'], null)
        || valueOf(screener, ['watch_item', 'watchItem', 'watch'], null)
        || valueOf(indicators, ['watch_item', 'watchItem', 'watch'], null)
        || 'Watch for confirmation in price, sentiment, and participation context.';

    const tags = [
        stance,
        valueOf(source, ['conflict_label', 'conflict'], null) || valueOf(screener, ['conflict_label', 'conflict'], null),
        valueOf(source, ['freshness_label', 'freshness'], null) || valueOf(screener, ['freshness_label', 'freshness'], null),
        valueOf(archetype, ['family', 'label'], null)
    ].filter(Boolean).slice(0, 4);

    return {
        ticker: String(ticker || source.term || source.asset || source.ticker || '').trim().toUpperCase(),
        score,
        label: String(label),
        stance: String(stance),
        watchItem: String(watchItem),
        tags,
        source
    };
}

function sortTapeRows(rows, activeAsset) {
    return [...rows].sort((a, b) => {
        if (a.ticker === activeAsset && b.ticker !== activeAsset) return -1;
        if (b.ticker === activeAsset && a.ticker !== activeAsset) return 1;
        return (b.score || 0) - (a.score || 0) || a.ticker.localeCompare(b.ticker);
    });
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
                    <h2>Loading market tape…</h2>
                  </div>
                  <span class="moduleMarketTapePill">pending</span>
                </header>
              </article>
            `;
            return;
        }

        const itemCards = visibleRows.map(row => {
            const isActive = row.ticker === activeAsset;
            const tags = row.tags.length
                ? row.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')
                : '<span>Monitor</span>';

            return `
              <button class="moduleMarketTapeItem ${isActive ? 'isActive' : ''}" data-ticker="${escapeHtml(row.ticker)}" type="button">
                <div class="moduleMarketTapeItemTop">
                  <strong>${escapeHtml(row.ticker)}</strong>
                  <em>${Math.round(row.score || 0)}</em>
                </div>
                <div class="moduleMarketTapeTags">${tags}</div>
                <p>${escapeHtml(row.label)}</p>
              </button>
            `;
        }).join('');

        target.innerHTML = `
          <article class="moduleMarketTapeCard">
            <header class="moduleMarketTapeHeader">
              <div>
                <div class="moduleMarketTapeKicker">Module Market Tape • Active ${escapeHtml(activeAsset)}</div>
                <h2>${escapeHtml(active ? `${active.ticker}: ${active.label}` : 'Market tape')}</h2>
                <p>${escapeHtml(active ? active.watchItem : 'Select a market tape item to update the module asset context.')}</p>
              </div>
              <span class="moduleMarketTapePill">${rows.length} assets</span>
            </header>
            <div class="moduleMarketTapeGrid">${itemCards}</div>
          </article>
        `;
    }
};
