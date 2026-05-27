// SETA bundle mini-panel v2
//
// Member-only, read-only CSV preview and ranking summary for staged SETA
// equal/mcap bundles. This does not alter chart stores, chart controls,
// public embeds, or existing dashboard behavior.

(function attachSetaBundleMiniPanel(globalScope) {
  'use strict';

  const PANEL_ID = 'setaBundleMiniPanel';
  const PANEL_CLASS = 'setaBundleMiniPanel';
  const UNIVERSES = ['all', 'crypto', 'stocks'];
  const WEIGHTINGS = ['equal', 'mcap'];
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

  function parseCsvPreview(csvText, limit) {
    const parsed = parseCsvRecords(csvText);
    return { headers: parsed.headers, rows: parsed.records.slice(0, limit || 5), rowCount: parsed.rowCount };
  }

  function columnUsableNumericCount(records, column) {
    return records.reduce((count, row) => (parseNumber(row[column]) == null ? count : count + 1), 0);
  }

  function normalizedColumnName(column) {
    return String(column || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
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

  function rankCsvRecords(csvText, limit) {
    const parsed = parseCsvRecords(csvText);
    const rankColumn = chooseRankColumn(parsed.headers, parsed.records);
    const labelColumn = chooseLabelColumn(parsed.headers);
    if (!rankColumn) {
      return { ...parsed, rankColumn: null, labelColumn, topRows: [], bottomRows: [] };
    }
    const ranked = parsed.records
      .map((row) => ({ row, rankValue: parseNumber(row[rankColumn]) }))
      .filter((item) => item.rankValue != null)
      .sort((a, b) => b.rankValue - a.rankValue);
    const size = limit || 5;
    return {
      ...parsed,
      rankColumn,
      labelColumn,
      topRows: ranked.slice(0, size),
      bottomRows: ranked.slice(-size).reverse(),
    };
  }

  function ensureStyles(documentRef) {
    if (!documentRef || documentRef.getElementById('setaBundleMiniPanelStyles')) return;
    const style = documentRef.createElement('style');
    style.id = 'setaBundleMiniPanelStyles';
    style.textContent = `
      .${PANEL_CLASS} {
        margin: 0 0 16px 0;
        padding: 14px 16px;
        border: 1px solid rgba(148, 163, 184, 0.24);
        border-radius: 14px;
        background: rgba(2, 6, 23, 0.58);
        color: #e5e7eb;
      }
      .${PANEL_CLASS} .setaMiniEyebrow {
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a5b4fc;
        margin-bottom: 6px;
      }
      .${PANEL_CLASS} .setaMiniTitle {
        font-size: 15px;
        font-weight: 700;
        margin-bottom: 7px;
      }
      .${PANEL_CLASS} .setaMiniCopy {
        font-size: 12px;
        line-height: 1.45;
        color: #cbd5e1;
        margin-bottom: 10px;
      }
      .${PANEL_CLASS} .setaMiniControls {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
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
        background: rgba(15, 23, 42, 0.88);
        color: #f8fafc;
        padding: 8px 9px;
      }
      .${PANEL_CLASS} .setaMiniMeta {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 6px 10px;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .${PANEL_CLASS} .setaMiniMetaLabel { color: #94a3b8; }
      .${PANEL_CLASS} .setaMiniMetaValue { color: #f8fafc; overflow-wrap: anywhere; }
      .${PANEL_CLASS} .setaRankGrid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin: 10px 0 12px 0;
      }
      .${PANEL_CLASS} .setaRankCard {
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 12px;
        padding: 10px;
        background: rgba(15, 23, 42, 0.44);
      }
      .${PANEL_CLASS} .setaRankTitle {
        font-size: 12px;
        font-weight: 700;
        color: #bfdbfe;
        margin-bottom: 7px;
      }
      .${PANEL_CLASS} .setaRankList {
        display: grid;
        gap: 5px;
      }
      .${PANEL_CLASS} .setaRankItem {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 8px;
        font-size: 12px;
        color: #e2e8f0;
      }
      .${PANEL_CLASS} .setaRankValue { color: #f8fafc; font-variant-numeric: tabular-nums; }
      .${PANEL_CLASS} .setaMiniTableLabel {
        font-size: 11px;
        color: #94a3b8;
        margin: 8px 0 4px 0;
      }
      .${PANEL_CLASS} table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .${PANEL_CLASS} th,
      .${PANEL_CLASS} td {
        border-top: 1px solid rgba(148, 163, 184, 0.18);
        padding: 6px 7px;
        text-align: left;
        vertical-align: top;
        max-width: 180px;
        overflow-wrap: anywhere;
      }
      .${PANEL_CLASS} th { color: #bfdbfe; font-weight: 700; }
      .${PANEL_CLASS} td { color: #e2e8f0; }
      .${PANEL_CLASS} .setaMiniError { color: #fca5a5; font-size: 12px; }
      .${PANEL_CLASS} .setaMiniNote { color: #fbbf24; font-size: 12px; margin: 8px 0 10px 0; }
      @media (max-width: 760px) {
        .${PANEL_CLASS} .setaMiniControls { grid-template-columns: 1fr; }
        .${PANEL_CLASS} .setaMiniMeta { grid-template-columns: 1fr; }
        .${PANEL_CLASS} .setaRankGrid { grid-template-columns: 1fr; }
      }
    `;
    documentRef.head.appendChild(style);
  }

  function optionHTML(values, selected) {
    return values.map((value) => {
      const label = value === 'mcap' ? 'market-cap' : value;
      const isSelected = value === selected ? ' selected' : '';
      return `<option value="${escapeHTML(value)}"${isSelected}>${escapeHTML(label)}</option>`;
    }).join('');
  }

  function panelShell(documentRef) {
    let panel = documentRef.getElementById(PANEL_ID);
    if (panel) return panel;
    panel = documentRef.createElement('section');
    panel.id = PANEL_ID;
    panel.className = PANEL_CLASS;
    panel.innerHTML = `
      <div class="setaMiniEyebrow">SETA Bundle Summary</div>
      <div class="setaMiniTitle">Bundle ranking preview</div>
      <div class="setaMiniCopy">Read-only summary of one manifest-listed SETA bundle file. Equal-weight remains the baseline; market-cap is an alternate participation-structure lens, not a prediction or trade signal.</div>
      <div class="setaMiniControls">
        <div><label for="setaMiniUniverse">Universe</label><select id="setaMiniUniverse">${optionHTML(UNIVERSES, 'all')}</select></div>
        <div><label for="setaMiniWeighting">Weighting</label><select id="setaMiniWeighting">${optionHTML(WEIGHTINGS, 'equal')}</select></div>
        <div><label for="setaMiniRole">Level</label><select id="setaMiniRole">${optionHTML(ROLES, 'ecosystem')}</select></div>
      </div>
      <div class="setaMiniOutput" id="setaMiniOutput">Loading preview...</div>
    `;
    const statusCard = documentRef.getElementById('setaBundleStatusCard');
    if (statusCard && statusCard.parentNode) {
      statusCard.parentNode.insertBefore(panel, statusCard.nextSibling);
    } else {
      const summaryLead = documentRef.getElementById('summaryLead');
      if (summaryLead && summaryLead.parentNode) {
        summaryLead.parentNode.insertBefore(panel, summaryLead.nextSibling);
      } else {
        documentRef.body.insertBefore(panel, documentRef.body.firstChild);
      }
    }
    return panel;
  }

  function formatRankValue(value) {
    if (value == null) return 'n/a';
    if (Math.abs(value) >= 100) return value.toFixed(1);
    if (Math.abs(value) >= 10) return value.toFixed(2);
    return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }

  function renderRankList(title, rows, labelColumn, rankColumn) {
    if (!rows.length) {
      return `
        <div class="setaRankCard">
          <div class="setaRankTitle">${escapeHTML(title)}</div>
          <div class="setaMiniNote">No rankable rows.</div>
        </div>
      `;
    }
    return `
      <div class="setaRankCard">
        <div class="setaRankTitle">${escapeHTML(title)}</div>
        <div class="setaRankList">
          ${rows.map((item) => `
            <div class="setaRankItem">
              <div>${escapeHTML(item.row[labelColumn] || 'Unnamed')}</div>
              <div class="setaRankValue">${escapeHTML(formatRankValue(item.rankValue))}</div>
            </div>
          `).join('')}
        </div>
        <div class="setaMiniTableLabel">Rank column: ${escapeHTML(rankColumn)}</div>
      </div>
    `;
  }

  function renderPreview(output, result) {
    const preview = parseCsvPreview(result.csvText, 5);
    const ranking = rankCsvRecords(result.csvText, 5);
    const visibleHeaders = preview.headers.slice(0, 8);
    const tableRows = preview.rows.map((row) => `
      <tr>${visibleHeaders.map((header) => `<td>${escapeHTML(row[header])}</td>`).join('')}</tr>
    `).join('');
    const rankingHTML = ranking.rankColumn ? `
      <div class="setaRankGrid">
        ${renderRankList('Top 5', ranking.topRows, ranking.labelColumn, ranking.rankColumn)}
        ${renderRankList('Bottom 5', ranking.bottomRows, ranking.labelColumn, ranking.rankColumn)}
      </div>
    ` : '<div class="setaMiniNote">Ranking unavailable: no usable numeric SETA-like column found. CSV preview remains available.</div>';

    output.innerHTML = `
      <div class="setaMiniMeta">
        <div class="setaMiniMetaLabel">Rows</div><div class="setaMiniMetaValue">${escapeHTML(preview.rowCount)}</div>
        <div class="setaMiniMetaLabel">Source file</div><div class="setaMiniMetaValue">${escapeHTML(result.relativePath)}</div>
        <div class="setaMiniMetaLabel">Rank column</div><div class="setaMiniMetaValue">${escapeHTML(ranking.rankColumn || 'Unavailable')}</div>
      </div>
      ${rankingHTML}
      <div class="setaMiniTableLabel">First 5 CSV records</div>
      <table aria-label="SETA bundle CSV preview">
        <thead><tr>${visibleHeaders.map((header) => `<th>${escapeHTML(header)}</th>`).join('')}</tr></thead>
        <tbody>${tableRows || '<tr><td>No preview rows</td></tr>'}</tbody>
      </table>
    `;
  }

  function renderError(output, error) {
    output.innerHTML = `<div class="setaMiniError">Preview unavailable: ${escapeHTML(error && error.message ? error.message : error)}</div>`;
  }

  async function refreshPreview(panel, options) {
    const opts = options || {};
    const loader = opts.loader || globalScope.SETA_BUNDLE_LOADER;
    const output = panel.querySelector('#setaMiniOutput');
    if (!loader || typeof loader.loadSetaBundleCsv !== 'function') {
      renderError(output, 'loader unavailable');
      return null;
    }
    const universe = panel.querySelector('#setaMiniUniverse').value;
    const weighting = panel.querySelector('#setaMiniWeighting').value;
    const role = panel.querySelector('#setaMiniRole').value;
    output.textContent = 'Loading preview...';
    try {
      const result = await loader.loadSetaBundleCsv({ universe, weighting, role, manifestUrl: opts.manifestUrl, fetchImpl: opts.fetchImpl });
      renderPreview(output, result);
      return result;
    } catch (error) {
      renderError(output, error);
      return null;
    }
  }

  async function renderSetaBundleMiniPanel(options) {
    const opts = options || {};
    const documentRef = opts.documentRef || globalScope.document;
    if (!documentRef) return null;
    ensureStyles(documentRef);
    const panel = panelShell(documentRef);
    ['setaMiniUniverse', 'setaMiniWeighting', 'setaMiniRole'].forEach((id) => {
      const el = panel.querySelector(`#${id}`);
      if (el && !el.dataset.setaMiniBound) {
        el.dataset.setaMiniBound = '1';
        el.addEventListener('change', () => refreshPreview(panel, opts));
      }
    });
    await refreshPreview(panel, opts);
    return panel;
  }

  const api = { chooseRankColumn, parseCsvPreview, parseCsvRecords, rankCsvRecords, renderSetaBundleMiniPanel };
  globalScope.SETA_BUNDLE_MINI_PANEL = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (globalScope.document) {
    globalScope.addEventListener('DOMContentLoaded', () => {
      renderSetaBundleMiniPanel();
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
