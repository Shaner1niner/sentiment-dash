// SETA bundle comparison panel v1
//
// Member-only, read-only equal-vs-market-cap comparison for staged SETA
// bundles. This does not alter chart stores, chart controls, public embeds,
// or existing dashboard behavior.

(function attachSetaBundleComparePanel(globalScope) {
  'use strict';

  const PANEL_ID = 'setaBundleComparePanel';
  const PANEL_CLASS = 'setaBundleComparePanel';
  const UNIVERSES = ['all', 'crypto', 'stocks'];
  const ROLES = ['ecosystem', 'sector', 'asset', 'multi_level'];
  const RANK_COLUMN_HINTS = [
    'seta_score',
    'seta',
    'score',
    'sentiment_score',
    'sentiment',
    'value',
    'weighted_score',
    'combined_score',
    'rank_score',
  ];
  const LABEL_COLUMN_HINTS = ['term', 'asset', 'name', 'sector', 'ecosystem', 'symbol', 'label'];

  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseCsvLine(line) {
    const values = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      const next = line[i + 1];
      if (ch === '"' && quoted && next === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = !quoted;
      } else if (ch === ',' && !quoted) {
        values.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    values.push(current);
    return values;
  }

  function parseNumber(value) {
    if (value == null) return null;
    const cleaned = String(value).trim().replace(/[$,%]/g, '').replace(/,/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseCsvRecords(csvText) {
    const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length) return { headers: [], records: [], rowCount: 0 };
    const headers = parseCsvLine(lines[0]).map((item, idx) => item.trim() || `column_${idx + 1}`);
    const records = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] == null ? '' : values[idx];
      });
      return row;
    });
    return { headers, records, rowCount: records.length };
  }

  function normalizedColumnName(column) {
    return String(column || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  function columnUsableNumericCount(records, column) {
    return records.reduce((count, row) => (parseNumber(row[column]) == null ? count : count + 1), 0);
  }

  function chooseRankColumn(headers, records) {
    if (!headers.length || !records.length) return null;
    const usableColumns = headers
      .map((column) => ({ column, normalized: normalizedColumnName(column), count: columnUsableNumericCount(records, column) }))
      .filter((item) => item.count > 0);
    if (!usableColumns.length) return null;

    for (const hint of RANK_COLUMN_HINTS) {
      const exact = usableColumns.find((item) => item.normalized === hint);
      if (exact) return exact.column;
    }
    for (const hint of RANK_COLUMN_HINTS) {
      const partial = usableColumns.find((item) => item.normalized.includes(hint));
      if (partial) return partial.column;
    }
    usableColumns.sort((a, b) => b.count - a.count);
    return usableColumns[0].column;
  }

  function chooseSharedRankColumn(equalParsed, mcapParsed) {
    const equalPreferred = chooseRankColumn(equalParsed.headers, equalParsed.records);
    if (equalPreferred && mcapParsed.headers.includes(equalPreferred) && columnUsableNumericCount(mcapParsed.records, equalPreferred) > 0) {
      return equalPreferred;
    }
    const mcapPreferred = chooseRankColumn(mcapParsed.headers, mcapParsed.records);
    if (mcapPreferred && equalParsed.headers.includes(mcapPreferred) && columnUsableNumericCount(equalParsed.records, mcapPreferred) > 0) {
      return mcapPreferred;
    }
    const shared = equalParsed.headers.filter((column) => mcapParsed.headers.includes(column));
    return chooseRankColumn(shared, equalParsed.records.concat(mcapParsed.records));
  }

  function chooseLabelColumn(headers) {
    if (!headers.length) return null;
    const normalized = headers.map((column) => ({ column, normalized: normalizedColumnName(column) }));
    for (const hint of LABEL_COLUMN_HINTS) {
      const exact = normalized.find((item) => item.normalized === hint);
      if (exact) return exact.column;
    }
    for (const hint of LABEL_COLUMN_HINTS) {
      const partial = normalized.find((item) => item.normalized.includes(hint));
      if (partial) return partial.column;
    }
    return headers[0];
  }

  function chooseSharedLabelColumn(equalParsed, mcapParsed) {
    const equalLabel = chooseLabelColumn(equalParsed.headers);
    if (equalLabel && mcapParsed.headers.includes(equalLabel)) return equalLabel;
    const mcapLabel = chooseLabelColumn(mcapParsed.headers);
    if (mcapLabel && equalParsed.headers.includes(mcapLabel)) return mcapLabel;
    return equalParsed.headers.find((column) => mcapParsed.headers.includes(column)) || null;
  }

  function rankedByLabel(parsed, labelColumn, rankColumn) {
    const ranked = parsed.records
      .map((row) => ({ label: String(row[labelColumn] || '').trim(), row, value: parseNumber(row[rankColumn]) }))
      .filter((item) => item.label && item.value != null)
      .sort((a, b) => b.value - a.value);
    const byLabel = new Map();
    ranked.forEach((item, idx) => {
      if (!byLabel.has(item.label)) {
        byLabel.set(item.label, { ...item, rank: idx + 1 });
      }
    });
    return byLabel;
  }

  function compareEqualMcap(equalCsvText, mcapCsvText, limit) {
    const equalParsed = parseCsvRecords(equalCsvText);
    const mcapParsed = parseCsvRecords(mcapCsvText);
    const rankColumn = chooseSharedRankColumn(equalParsed, mcapParsed);
    const labelColumn = chooseSharedLabelColumn(equalParsed, mcapParsed);
    if (!rankColumn || !labelColumn) {
      return { equalParsed, mcapParsed, rankColumn, labelColumn, matchedRows: [], risers: [], decliners: [] };
    }

    const equalByLabel = rankedByLabel(equalParsed, labelColumn, rankColumn);
    const mcapByLabel = rankedByLabel(mcapParsed, labelColumn, rankColumn);
    const matchedRows = [];
    equalByLabel.forEach((equalItem, label) => {
      const mcapItem = mcapByLabel.get(label);
      if (!mcapItem) return;
      const delta = equalItem.rank - mcapItem.rank;
      matchedRows.push({
        label,
        equalRank: equalItem.rank,
        mcapRank: mcapItem.rank,
        delta,
        equalValue: equalItem.value,
        mcapValue: mcapItem.value,
      });
    });
    const size = limit || 5;
    const risers = matchedRows.slice().sort((a, b) => b.delta - a.delta).slice(0, size);
    const decliners = matchedRows.slice().sort((a, b) => a.delta - b.delta).slice(0, size);
    return { equalParsed, mcapParsed, rankColumn, labelColumn, matchedRows, risers, decliners };
  }

  function ensureStyles(documentRef) {
    if (!documentRef || documentRef.getElementById('setaBundleComparePanelStyles')) return;
    const style = documentRef.createElement('style');
    style.id = 'setaBundleComparePanelStyles';
    style.textContent = `
      .${PANEL_CLASS} {
        margin: 0 0 16px 0;
        padding: 14px 16px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.62);
        color: #e5e7eb;
      }
      .${PANEL_CLASS} .setaCompareEyebrow {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #67e8f9;
        margin-bottom: 6px;
      }
      .${PANEL_CLASS} .setaCompareTitle {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 7px;
      }
      .${PANEL_CLASS} .setaCompareCopy {
        font-size: 12px;
        line-height: 1.45;
        color: #cbd5e1;
        margin-bottom: 10px;
      }
      .${PANEL_CLASS} .setaCompareControls {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 12px;
      }
      .${PANEL_CLASS} label {
        display: block;
        font-size: 10px;
        letter-spacing: 0.09em;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 4px;
      }
      .${PANEL_CLASS} select {
        width: 100%;
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 10px;
        background: rgba(2, 6, 23, 0.88);
        color: #f8fafc;
        padding: 8px 9px;
      }
      .${PANEL_CLASS} .setaCompareMeta {
        display: grid;
        grid-template-columns: 120px 1fr;
        gap: 6px 10px;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .${PANEL_CLASS} .setaCompareMetaLabel { color: #94a3b8; }
      .${PANEL_CLASS} .setaCompareMetaValue { color: #f8fafc; overflow-wrap: anywhere; }
      .${PANEL_CLASS} .setaCompareGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .${PANEL_CLASS} .setaCompareCard {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        padding: 10px;
        background: rgba(2, 6, 23, 0.42);
      }
      .${PANEL_CLASS} .setaCompareCardTitle {
        font-size: 12px;
        font-weight: 700;
        color: #bfdbfe;
        margin-bottom: 7px;
      }
      .${PANEL_CLASS} .setaCompareRow {
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        gap: 8px;
        font-size: 12px;
        color: #e2e8f0;
        padding: 4px 0;
        border-top: 1px solid rgba(148, 163, 184, 0.12);
      }
      .${PANEL_CLASS} .setaCompareRow:first-of-type { border-top: 0; }
      .${PANEL_CLASS} .setaCompareNumber { color: #f8fafc; font-variant-numeric: tabular-nums; }
      .${PANEL_CLASS} .setaCompareError { color: #fca5a5; font-size: 12px; }
      .${PANEL_CLASS} .setaCompareNote { color: #fbbf24; font-size: 12px; margin: 8px 0 10px 0; }
      @media (max-width: 760px) {
        .${PANEL_CLASS} .setaCompareControls,
        .${PANEL_CLASS} .setaCompareGrid { grid-template-columns: 1fr; }
        .${PANEL_CLASS} .setaCompareMeta { grid-template-columns: 1fr; }
      }
    `;
    documentRef.head.appendChild(style);
  }

  function optionHTML(values, selected) {
    return values.map((value) => {
      const isSelected = value === selected ? ' selected' : '';
      return `<option value="${escapeHTML(value)}"${isSelected}>${escapeHTML(value)}</option>`;
    }).join('');
  }

  function panelShell(documentRef) {
    let panel = documentRef.getElementById(PANEL_ID);
    if (panel) return panel;
    panel = documentRef.createElement('section');
    panel.id = PANEL_ID;
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
      <div class="setaCompareEyebrow">SETA Bundle Comparison</div>
      <div class="setaCompareTitle">Equal vs market-cap participation shift</div>
      <div class="setaCompareCopy">Read-only comparison of equal-weight and market-cap-weighted SETA rankings for the same universe and level. Rank movement is a participation-structure lens, not a price prediction or trade signal.</div>
      <div class="setaCompareControls">
        <div><label for="setaCompareUniverse">Universe</label><select id="setaCompareUniverse">${optionHTML(UNIVERSES, 'all')}</select></div>
        <div><label for="setaCompareRole">Level</label><select id="setaCompareRole">${optionHTML(ROLES, 'asset')}</select></div>
      </div>
      <div class="setaCompareOutput" id="setaCompareOutput">Loading comparison...</div>
    `;

    const miniPanel = documentRef.getElementById('setaBundleMiniPanel');
    if (miniPanel && miniPanel.parentNode) {
      miniPanel.parentNode.insertBefore(panel, miniPanel.nextSibling);
    } else {
      const statusCard = documentRef.getElementById('setaBundleStatusCard');
      if (statusCard && statusCard.parentNode) {
        statusCard.parentNode.insertBefore(panel, statusCard.nextSibling);
      } else {
        documentRef.body.insertBefore(panel, documentRef.body.firstChild);
      }
    }
    return panel;
  }

  function formatValue(value) {
    if (value == null) return 'n/a';
    if (Math.abs(value) >= 100) return value.toFixed(1);
    if (Math.abs(value) >= 10) return value.toFixed(2);
    return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  function renderComparisonRows(rows) {
    if (!rows.length) return '<div class="setaCompareNote">No matched rank shifts.</div>';
    return rows.map((row) => `
      <div class="setaCompareRow">
        <div>${escapeHTML(row.label)}</div>
        <div class="setaCompareNumber">E ${escapeHTML(row.equalRank)}</div>
        <div class="setaCompareNumber">M ${escapeHTML(row.mcapRank)}</div>
        <div class="setaCompareNumber">Δ ${escapeHTML(row.delta > 0 ? `+${row.delta}` : row.delta)}</div>
      </div>
    `).join('');
  }

  function renderComparison(output, result, comparison) {
    if (!comparison.rankColumn || !comparison.labelColumn) {
      output.innerHTML = '<div class="setaCompareNote">Comparison unavailable: no shared label and numeric SETA-like column found. Existing dashboard charts are unaffected.</div>';
      return;
    }
    output.innerHTML = `
      <div class="setaCompareMeta">
        <div class="setaCompareMetaLabel">Rows matched</div><div class="setaCompareMetaValue">${escapeHTML(comparison.matchedRows.length)}</div>
        <div class="setaCompareMetaLabel">Comparison column</div><div class="setaCompareMetaValue">${escapeHTML(comparison.rankColumn)}</div>
        <div class="setaCompareMetaLabel">Label column</div><div class="setaCompareMetaValue">${escapeHTML(comparison.labelColumn)}</div>
        <div class="setaCompareMetaLabel">Files</div><div class="setaCompareMetaValue">${escapeHTML(result.equalPath)} vs ${escapeHTML(result.mcapPath)}</div>
      </div>
      <div class="setaCompareGrid">
        <div class="setaCompareCard">
          <div class="setaCompareCardTitle">Top mcap risers</div>
          ${renderComparisonRows(comparison.risers)}
        </div>
        <div class="setaCompareCard">
          <div class="setaCompareCardTitle">Top mcap decliners</div>
          ${renderComparisonRows(comparison.decliners)}
        </div>
      </div>
    `;
  }

  function renderError(output, error) {
    output.innerHTML = `<div class="setaCompareError">Comparison unavailable: ${escapeHTML(error && error.message ? error.message : error)}</div>`;
  }

  async function refreshComparison(panel, options) {
    const opts = options || {};
    const loader = opts.loader || globalScope.SETA_BUNDLE_LOADER;
    const output = panel.querySelector('#setaCompareOutput');
    if (!loader || typeof loader.loadSetaBundleCsv !== 'function') {
      renderError(output, 'loader unavailable');
      return null;
    }
    const universe = panel.querySelector('#setaCompareUniverse').value;
    const role = panel.querySelector('#setaCompareRole').value;
    output.textContent = 'Loading comparison...';
    try {
      const equalResult = await loader.loadSetaBundleCsv({ universe, weighting: 'equal', role, manifestUrl: opts.manifestUrl, fetchImpl: opts.fetchImpl });
      const mcapResult = await loader.loadSetaBundleCsv({ universe, weighting: 'mcap', role, manifestUrl: opts.manifestUrl, fetchImpl: opts.fetchImpl });
      const comparison = compareEqualMcap(equalResult.csvText, mcapResult.csvText, 5);
      const result = { equalPath: equalResult.relativePath, mcapPath: mcapResult.relativePath };
      renderComparison(output, result, comparison);
      return { comparison, result };
    } catch (error) {
      renderError(output, error);
      return null;
    }
  }

  async function renderSetaBundleComparePanel(options) {
    const opts = options || {};
    const documentRef = opts.documentRef || globalScope.document;
    if (!documentRef) return null;
    ensureStyles(documentRef);
    const panel = panelShell(documentRef);
    ['setaCompareUniverse', 'setaCompareRole'].forEach((id) => {
      const el = panel.querySelector(`#${id}`);
      if (el && !el.dataset.setaCompareBound) {
        el.dataset.setaCompareBound = '1';
        el.addEventListener('change', () => refreshComparison(panel, opts));
      }
    });
    await refreshComparison(panel, opts);
    return panel;
  }

  const api = { compareEqualMcap, parseCsvRecords, renderSetaBundleComparePanel };
  globalScope.SETA_BUNDLE_COMPARE_PANEL = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope.document) {
    globalScope.addEventListener('DOMContentLoaded', () => {
      renderSetaBundleComparePanel();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
