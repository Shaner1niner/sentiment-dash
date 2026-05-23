// SETA bundle mini-panel v1
//
// Member-only, read-only CSV preview for staged SETA equal/mcap bundles.
// This does not alter chart stores, chart controls, or public dashboard behavior.

(function attachSetaBundleMiniPanel(globalScope) {
  'use strict';

  const PANEL_ID = 'setaBundleMiniPanel';
  const PANEL_CLASS = 'setaBundleMiniPanel';
  const UNIVERSES = ['all', 'crypto', 'stocks'];
  const WEIGHTINGS = ['equal', 'mcap'];
  const ROLES = ['ecosystem', 'sector', 'asset', 'multi_level'];

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

  function parseCsvPreview(csvText, limit) {
    const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (!lines.length) return { headers: [], rows: [], rowCount: 0 };
    const headers = parseCsvLine(lines[0]).map((item) => item.trim());
    const dataLines = lines.slice(1);
    const rows = dataLines.slice(0, limit || 5).map((line) => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, idx) => {
        row[header || `column_${idx + 1}`] = values[idx] == null ? '' : values[idx];
      });
      return row;
    });
    return { headers, rows, rowCount: dataLines.length };
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
      @media (max-width: 760px) {
        .${PANEL_CLASS} .setaMiniControls { grid-template-columns: 1fr; }
        .${PANEL_CLASS} .setaMiniMeta { grid-template-columns: 1fr; }
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
      <div class="setaMiniEyebrow">SETA Bundle Preview</div>
      <div class="setaMiniTitle">Bundle CSV preview</div>
      <div class="setaMiniCopy">Read-only preview of one manifest-listed SETA bundle file. Equal-weight remains the baseline; market-cap is an alternate participation-structure lens.</div>
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

  function renderPreview(output, result) {
    const preview = parseCsvPreview(result.csvText, 5);
    const visibleHeaders = preview.headers.slice(0, 8);
    const tableRows = preview.rows.map((row) => `
      <tr>${visibleHeaders.map((header) => `<td>${escapeHTML(row[header])}</td>`).join('')}</tr>
    `).join('');
    output.innerHTML = `
      <div class="setaMiniMeta">
        <div class="setaMiniMetaLabel">Rows</div><div class="setaMiniMetaValue">${escapeHTML(preview.rowCount)}</div>
        <div class="setaMiniMetaLabel">Source file</div><div class="setaMiniMetaValue">${escapeHTML(result.relativePath)}</div>
      </div>
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

  const api = { parseCsvPreview, renderSetaBundleMiniPanel };
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
