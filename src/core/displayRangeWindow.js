// SETA display-range / visible-window core helpers.
// Pure utilities only. This module does not mutate dashboard runtime state.

export const DISPLAY_RANGE_WINDOW_DAYS = Object.freeze({
  "1M": 31,
  "3M": 92,
  "6M": 184,
  "1Y": 370,
  "2Y": 740,
  "5Y": 1850
});

export function normalizeDisplayRange(rangePreset, fallback = "3M") {
  const text = String(rangePreset || fallback || "3M").trim().toUpperCase();
  if (text === "ALL" || text === "MAX") return "ALL";
  return Object.prototype.hasOwnProperty.call(DISPLAY_RANGE_WINDOW_DAYS, text)
    ? text
    : String(fallback || "3M").toUpperCase();
}

export function displayRangeWindowDays(rangePreset, fallback = "3M") {
  const range = normalizeDisplayRange(rangePreset, fallback);
  return range === "ALL" ? null : DISPLAY_RANGE_WINDOW_DAYS[range];
}

export function coerceDate(value) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (value === null || value === undefined || value === "") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function dateFromRow(row) {
  if (!row || typeof row !== "object") return null;
  return coerceDate(row.dateObj || row.date || row.dt || row.timestamp);
}

export function selectedWindowBounds(rows, rangePreset, options = {}) {
  const fallback = options.fallback || "3M";
  const range = normalizeDisplayRange(rangePreset, fallback);
  const accessor = typeof options.dateAccessor === "function" ? options.dateAccessor : dateFromRow;

  const dates = (Array.isArray(rows) ? rows : [])
    .map(accessor)
    .map(coerceDate)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) {
    return { range, start: null, end: null, days: displayRangeWindowDays(range, fallback) };
  }

  const end = options.endDate ? coerceDate(options.endDate) : dates[dates.length - 1];
  const days = displayRangeWindowDays(range, fallback);

  if (days === null) {
    return { range, start: dates[0], end, days: null };
  }

  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { range, start, end, days };
}

export function visibleWindowMask(rows, rangePreset, options = {}) {
  const source = Array.isArray(rows) ? rows : [];
  const accessor = typeof options.dateAccessor === "function" ? options.dateAccessor : dateFromRow;
  const bounds = selectedWindowBounds(source, rangePreset, options);

  return source.map((row) => {
    const d = coerceDate(accessor(row));
    if (!d || !bounds.end) return false;
    if (!bounds.start) return true;
    return d.getTime() >= bounds.start.getTime() && d.getTime() <= bounds.end.getTime();
  });
}

export function selectedWindowRows(rows, rangePreset, options = {}) {
  const source = Array.isArray(rows) ? rows : [];
  const mask = visibleWindowMask(source, rangePreset, options);
  return source.filter((_, index) => mask[index]);
}

export function bandWithVisibleWindowCoverage(bands, visibleMask) {
  if (!Array.isArray(bands)) return bands;
  if (!Array.isArray(visibleMask) || !visibleMask.length) return bands;
  return bands.map((value, index) => (visibleMask[index] ? value : null));
}

export const SETA_DISPLAY_RANGE_WINDOW_CORE_VERSION = "display_range_window_core_v1";
