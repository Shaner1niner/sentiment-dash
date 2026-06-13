import { PlotlyRenderer } from '../PlotlyRenderer.js?v=module_crypto_partial_daily_overlay_001';

// Modular Confirmed Diamonds Patch v1
//
// Minimal modular restoration for confirmed pressure markers. This deliberately
// avoids the legacy drawer stack and uses existing row-level chart fields only.
// Visible copy stays educational: confirmed pressure / structure context.

const PATCH_FLAG = '__setaModularConfirmedDiamondsPatchV1';
const CONFIRMED_DIAMOND_TRACE_NAME = 'Confirmed Pressure';

const CONSTRUCTIVE_FIELDS = [
  'overlap_constructive_confirmed',
  'constructive_confirmed',
  'bullish_confirmed',
  'confirmed_bullish',
  'positive_confirmed',
  'confirmed_positive',
  'risk_on_confirmed',
  'confirmed_risk_on'
];

const RISK_OFF_FIELDS = [
  'overlap_risk_off_confirmed',
  'risk_off_confirmed',
  'bearish_confirmed',
  'confirmed_bearish',
  'negative_confirmed',
  'confirmed_negative',
  'riskoff_confirmed',
  'confirmed_riskoff'
];

const CONFIRMED_TYPE_FIELDS = [
  'overlap_confirmed_event_type',
  'overlapConfirmedEventType',
  'confirmed_event_type',
  'confirmedEventType',
  'confirmed_alert_type',
  'confirmedAlertType',
  'confirmed_pressure_type',
  'confirmedPressureType',
  'seta_confirmed_pressure_type',
  'signal_confirmed_type',
  'alert_event_type',
  'event_type',
  'alert_type',
  'latest_confirmed_event_type'
];

const CONFIRMED_FLAG_FIELDS = [
  'overlap_confirmed',
  'overlapConfirmed',
  'boll_overlap_confirmed',
  'confirmed_alert_flag',
  'is_confirmed_alert',
  'confirmed_pressure_flag',
  'structure_confirmed_flag',
  'signal_confirmed_flag',
  'confirmed_flag',
  'is_confirmed'
];

const DIRECTION_FIELDS = [
  'confirmed_direction',
  'confirmedDirection',
  'alert_direction',
  'source_alert_direction',
  'overlap_direction',
  'signal_direction',
  'direction_label',
  'direction',
  'sentiment_direction',
  'signal_consensus_direction_label'
];

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function firstValue(row, fields = []) {
  for (const field of fields) {
    const value = row && row[field];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return null;
}

function truthy(value) {
  if (value === true) return true;
  if (value === false || value === null || value === undefined || value === '') return false;
  const numeric = asNumber(value);
  if (numeric !== null) return numeric === 1;
  return /^(true|yes|y|confirmed|1)$/i.test(String(value).trim());
}

function rowHasFlag(row, fields = []) {
  return fields.some(field => truthy(row && row[field]));
}

function rowText(row, fields = []) {
  return fields
    .map(field => row && row[field])
    .filter(value => value !== null && value !== undefined && value !== '')
    .map(value => String(value).trim())
    .join(' ')
    .toLowerCase();
}

function escapeHover(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function priceForMarker(row, kind) {
  const close = asNumber(row && row.close);
  const high = asNumber(row && row.high);
  const low = asNumber(row && row.low);
  if (kind === 'constructive') return low ?? close ?? high;
  if (kind === 'riskOff') return high ?? close ?? low;
  return close ?? high ?? low;
}

function confirmedPressureKind(row) {
  if (!row || typeof row !== 'object') return null;

  if (rowHasFlag(row, CONSTRUCTIVE_FIELDS)) return 'constructive';
  if (rowHasFlag(row, RISK_OFF_FIELDS)) return 'riskOff';

  const typeText = rowText(row, CONFIRMED_TYPE_FIELDS);
  const directionText = rowText(row, DIRECTION_FIELDS);
  const combined = `${typeText} ${directionText}`.trim();
  const hasConfirmed = /confirmed|confirmation|validated/.test(combined) || rowHasFlag(row, CONFIRMED_FLAG_FIELDS);

  if (!hasConfirmed) return null;
  if (/risk[-_\s]?off|bear|negative|downside|weak|distribution|breakdown/.test(combined)) return 'riskOff';
  if (/constructive|bull|positive|upside|strong|accumulation|breakout|risk[-_\s]?on/.test(combined)) return 'constructive';

  const sentiment = asNumber(firstValue(row, [
    'combined_compound',
    'compound',
    'sentiment_compound',
    'weighted_sentiment',
    'avg_sentiment',
    'sentiment_score'
  ]));
  if (sentiment !== null) {
    if (sentiment > 0.08) return 'constructive';
    if (sentiment < -0.08) return 'riskOff';
  }

  return 'mixed';
}

function markerStyle(kind) {
  if (kind === 'constructive') {
    return {
      label: 'Constructive confirmed pressure',
      symbol: 'diamond',
      fill: 'rgba(126,231,135,0.86)',
      line: 'rgba(126,231,135,1)'
    };
  }
  if (kind === 'riskOff') {
    return {
      label: 'Risk-off confirmed pressure',
      symbol: 'diamond-open',
      fill: 'rgba(255,123,114,0.72)',
      line: 'rgba(255,123,114,0.98)'
    };
  }
  return {
    label: 'Mixed confirmed pressure',
    symbol: 'diamond-wide',
    fill: 'rgba(242,204,96,0.68)',
    line: 'rgba(242,204,96,0.95)'
  };
}

function hoverText(row, kind) {
  const style = markerStyle(kind);
  const date = firstValue(row, ['date', 'dt', 'timestamp']);
  const close = firstValue(row, ['close', 'latest_close', 'price']);
  const type = firstValue(row, CONFIRMED_TYPE_FIELDS);
  const pieces = [
    `<b>${escapeHover(style.label)}</b>`,
    date ? `Date: ${escapeHover(date)}` : '',
    close !== null && close !== undefined && close !== '' ? `Close: ${escapeHover(close)}` : '',
    type ? `Context: ${escapeHover(type)}` : '',
    'Read: educational structure context, not a standalone instruction.'
  ];
  return pieces.filter(Boolean).join('<br>');
}

export function modularConfirmedDiamondRows(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .map(row => {
      const kind = confirmedPressureKind(row);
      const price = kind ? priceForMarker(row, kind) : null;
      if (!kind || price === null || !row.date) return null;
      return { row, kind, price };
    })
    .filter(Boolean);
}

export function buildModularConfirmedDiamondTraces(rows = []) {
  const markerRows = modularConfirmedDiamondRows(rows);
  if (!markerRows.length) return [];

  return [{
    type: 'scatter',
    mode: 'markers',
    name: CONFIRMED_DIAMOND_TRACE_NAME,
    legendrank: 52,
    x: markerRows.map(item => item.row.date),
    y: markerRows.map(item => item.price),
    marker: {
      symbol: markerRows.map(item => markerStyle(item.kind).symbol),
      size: markerRows.map(item => item.kind === 'mixed' ? 8 : 9),
      color: markerRows.map(item => markerStyle(item.kind).fill),
      line: {
        color: markerRows.map(item => markerStyle(item.kind).line),
        width: 1.3
      }
    },
    opacity: 0.95,
    text: markerRows.map(item => hoverText(item.row, item.kind)),
    hovertemplate: '%{text}<extra></extra>'
  }];
}

export function patchPlotlyRendererConfirmedDiamonds() {
  if (!PlotlyRenderer || PlotlyRenderer[PATCH_FLAG]) return false;
  const originalBuildPriceTraces = PlotlyRenderer.buildPriceTraces.bind(PlotlyRenderer);
  PlotlyRenderer.buildPriceTraces = function buildPriceTracesWithConfirmedDiamonds(rows, state = {}, partialDailyCandle = null) {
    const traces = originalBuildPriceTraces(rows, state, partialDailyCandle);
    const diamondTraces = buildModularConfirmedDiamondTraces(rows);
    return diamondTraces.length ? traces.concat(diamondTraces) : traces;
  };
  PlotlyRenderer[PATCH_FLAG] = true;
  return true;
}

patchPlotlyRendererConfirmedDiamonds();

if (typeof window !== 'undefined') {
  window.SETA_MODULAR_CONFIRMED_DIAMONDS = {
    buildModularConfirmedDiamondTraces,
    modularConfirmedDiamondRows,
    patchPlotlyRendererConfirmedDiamonds
  };
}
