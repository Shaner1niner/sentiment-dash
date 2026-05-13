# Display Range Runtime Wiring Inventory

- Generated UTC: `2026-05-13T06:50:49+00:00`
- Branch: `refactor/display-range-window-runtime-wiring-v1`

## Purpose

Inventory the current display-range / visible-window runtime seams before wiring `src/core/displayRangeWindow.js` into live dashboard behavior.

## Files scanned

- `dashboard_fix26_app.js`: `present`
- `src/dashboard_main.js`: `present`
- `src/Store.js`: `present`
- `src/PlotlyRenderer.js`: `present`
- `src/features/Controls.js`: `present`
- `src/core/displayRangeWindow.js`: `present`

## Pattern inventory

### `dashboard_fix26_app.js`

#### display_range_core_import — `4` hit(s)

- L22112: `function bandWithVisibleWindowCoverage(bands, visibleMask){`
- L85056: `const displayPriceBands=bandWithVisibleWindowCoverage(priceBands, visibleMask);`
- L85954: `const displaySentBands=bandWithVisibleWindowCoverage(activeSentBands, visibleMask);`
- L86018: `const displayOv=bandWithVisibleWindowCoverage(ov, visibleMask);`

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `25` hit(s)

- L9887: `const preset=String(selectedValue("range") || selectedValue("displayRange") || "").trim();`
- L22112: `function bandWithVisibleWindowCoverage(bands, visibleMask){`
- L22120: `for(let i=0; i<visibleMask.length; i++){`
- L22121: `if(visibleMask[i]) visibleIdx.push(i);`
- L31395: `function contextualCalibrationSpec(rangePreset, calendar, freq){`
- L31435: `return {...(weeklyMap[rangePreset] || weeklyMap['3M']), qLo:0.05, qHi:0.95};`
- L31725: `return {...(map[rangePreset] || map['3M']), qLo:0.05, qHi:0.95};`
- L31789: `function computeContextualSentimentBands(rows, rangePreset, calendar, freq){`
- L31820: `const spec=contextualCalibrationSpec(rangePreset, calendar, freq);`
- L33835: `function chooseOverlapModel(rows, priceBands, mappedBands, rangePreset, calendar, bollinger, freq){`
- L33898: `const contextualBands = computeContextualSentimentBands(rows, rangePreset, calendar, freq);`
- L42857: `function computeAlertDiagnosticInfo(rows, overlap, visibleMask, term=null){`
- L42953: `if(!visibleMask[i]) continue;`
- L49193: `function addOverlapBandWithPlaybook(data, x, upper, lower, rows, overlap, lineColor, fillColor, namePrefix, axis, visibleMask){`
- L56457: `function computeOverlapSignalInfo(rows, overlap, visibleMask){`
- L56553: `if(!visibleMask[i]) continue;`
- L57417: `if(!visibleMask[i]) continue;`
- L58025: `if(!visibleMask[i]) continue;`
- L59497: `function attentionSoftOverlayRows(rows, visibleMask){`
- L59593: `if(!visibleMask[i]) continue;`
- L59817: `function attentionStrongOverlayRows(rows, visibleMask){`
- L59913: `if(!visibleMask[i]) continue;`
- L60137: `function engagementOverlayShapes(rows, visibleMask, freq){`
- L60169: `const softIdxs=attentionSoftOverlayRows(rows, visibleMask);`
- L60201: `const strongSet=new Set(attentionStrongOverlayRows(rows, visibleMask));`

#### band_window_runtime — `8` hit(s)

- L22112: `function bandWithVisibleWindowCoverage(bands, visibleMask){`
- L85056: `const displayPriceBands=bandWithVisibleWindowCoverage(priceBands, visibleMask);`
- L85890: `if(bandsLayerPolicy.priceBand) addFilledBand(data,xs,displayPriceBands.up,displayPriceBands.low,COLORS.priceBand,COLORS.priceFill,priceBands.derived?'Price Band (TV 20,2 Derived)':'Price Band','y');`
- L85954: `const displaySentBands=bandWithVisibleWindowCoverage(activeSentBands, visibleMask);`
- L86018: `const displayOv=bandWithVisibleWindowCoverage(ov, visibleMask);`
- L86791: `if(bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') addOverlapBandWithPlaybook(data,xs,displayOv.up,displayOv.low,rows,ov,COLORS.overlapBand,COLORS.overlapFill,overlapInfo.modelLabel,'y',visibleMask);`
- L91193: `const up=num(displayPriceBands.up[i]), lo=num(displayPriceBands.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);`
- L91383: `const up=num(displayOv.up[i]), lo=num(displayOv.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);`

#### render_guard — `6` hit(s)

- L84524: `function currentDashboardControlKey(){`
- L84690: `const renderKey = currentDashboardControlKey();`
- L84729: `if(currentDashboardControlKey() !== renderKey) return scheduleBuildFigure();`
- L94077: `if(DASH_RENDER_QUEUED || renderKey !== currentDashboardControlKey()) return;`
- L166345: `try{ console.debug("[SETA asset guard] skipped stale render", {fn:name, renderAsset:upper(term), current:currentContext()}); }catch(_){}`
- L166406: `window.SETA_ASSET_SWITCH_GUARD = {currentContext:currentContext, showLoading:showLoading, clearLoading:clearLoading, patchRenderFunctions:patchRenderFunctions};`

#### plotly_render — `3` hit(s)

- L84520: `if(hasPlot && typeof Plotly.react === 'function') return Plotly.react(chart, data, layout, config);`
- L84521: `return Plotly.newPlot(chart, data, layout, config);`
- L166376: `wrap("renderChart", function(args){ return args[0]; }, undefined);`

### `src/dashboard_main.js`

#### display_range_core_import — `0` hit(s)

- none

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `0` hit(s)

- none

#### band_window_runtime — `0` hit(s)

- none

#### render_guard — `0` hit(s)

- none

#### plotly_render — `1` hit(s)

- L55: `await PlotlyRenderer.renderChart(targetId, payload.data, layout, payload.config || { responsive: true });`

### `src/Store.js`

#### display_range_core_import — `0` hit(s)

- none

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `0` hit(s)

- none

#### band_window_runtime — `0` hit(s)

- none

#### render_guard — `0` hit(s)

- none

#### plotly_render — `0` hit(s)

- none

### `src/PlotlyRenderer.js`

#### display_range_core_import — `0` hit(s)

- none

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `0` hit(s)

- none

#### band_window_runtime — `0` hit(s)

- none

#### render_guard — `0` hit(s)

- none

#### plotly_render — `4` hit(s)

- L2: `static async renderChart(containerId, data, layout, config) {`
- L4: `await window.Plotly.newPlot(containerId, mutatedData, layout, config);`
- L5: `this.applyVisibleWindowOptimizer(containerId);`
- L16: `static applyVisibleWindowOptimizer(containerId) {`

### `src/features/Controls.js`

#### display_range_core_import — `0` hit(s)

- none

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `0` hit(s)

- none

#### band_window_runtime — `0` hit(s)

- none

#### render_guard — `0` hit(s)

- none

#### plotly_render — `0` hit(s)

- none

### `src/core/displayRangeWindow.js`

#### display_range_core_import — `9` hit(s)

- L21: `export function displayRangeWindowDays(rangePreset, fallback = "3M") {`
- L40: `export function selectedWindowBounds(rows, rangePreset, options = {}) {`
- L52: `return { range, start: null, end: null, days: displayRangeWindowDays(range, fallback) };`
- L56: `const days = displayRangeWindowDays(range, fallback);`
- L66: `export function visibleWindowMask(rows, rangePreset, options = {}) {`
- L69: `const bounds = selectedWindowBounds(source, rangePreset, options);`
- L79: `export function selectedWindowRows(rows, rangePreset, options = {}) {`
- L81: `const mask = visibleWindowMask(source, rangePreset, options);`
- L85: `export function bandWithVisibleWindowCoverage(bands, visibleMask) {`

#### range_control — `0` hit(s)

- none

#### frequency_control — `0` hit(s)

- none

#### visible_window_runtime — `15` hit(s)

- L13: `export function normalizeDisplayRange(rangePreset, fallback = "3M") {`
- L14: `const text = String(rangePreset || fallback || "3M").trim().toUpperCase();`
- L21: `export function displayRangeWindowDays(rangePreset, fallback = "3M") {`
- L22: `const range = normalizeDisplayRange(rangePreset, fallback);`
- L40: `export function selectedWindowBounds(rows, rangePreset, options = {}) {`
- L42: `const range = normalizeDisplayRange(rangePreset, fallback);`
- L52: `return { range, start: null, end: null, days: displayRangeWindowDays(range, fallback) };`
- L56: `const days = displayRangeWindowDays(range, fallback);`
- L66: `export function visibleWindowMask(rows, rangePreset, options = {}) {`
- L69: `const bounds = selectedWindowBounds(source, rangePreset, options);`
- L79: `export function selectedWindowRows(rows, rangePreset, options = {}) {`
- L81: `const mask = visibleWindowMask(source, rangePreset, options);`
- L85: `export function bandWithVisibleWindowCoverage(bands, visibleMask) {`
- L87: `if (!Array.isArray(visibleMask) || !visibleMask.length) return bands;`
- L88: `return bands.map((value, index) => (visibleMask[index] ? value : null));`

#### band_window_runtime — `1` hit(s)

- L85: `export function bandWithVisibleWindowCoverage(bands, visibleMask) {`

#### render_guard — `0` hit(s)

- none

#### plotly_render — `0` hit(s)

- none

## Initial read

- `src/core/displayRangeWindow.js` is present and pure/additive.
- Runtime wiring should not replace Plotly rendering architecture yet.
- The safest next patch should connect range state first, then use the helper to compute the selected x-window.
- If the monolith still owns the production render path, patching should target only the existing `visibleMask` / `plotRows` / band-window seam.
- If the module path owns production render, patching should add `currentRange` to `Store`, route `#range` changes through `Controls`, and pass the selected range into `PlotlyRenderer` without changing trace construction.

## Recommended decision gate

Before runtime changes, confirm which render path is active on the deployed dashboard:

1. `src/dashboard_main.js` module path
2. `dashboard_fix26_app.js` monolith path
3. Hybrid path

Then patch only that path.

