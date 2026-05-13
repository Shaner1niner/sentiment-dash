# Display Range Monolith Seam Extract

Purpose: capture exact local `dashboard_fix26_app.js` seam before changing runtime behavior.

## Summary

- `visibleMask`: `12` context block(s)
- `plotRows`: `3` context block(s)
- `plotXs`: `2` context block(s)
- `bandWithVisibleWindowCoverage`: `4` context block(s)
- `displayPriceBands`: `3` context block(s)
- `displayOv`: `3` context block(s)
- `rangePreset`: `12` context block(s)
- `currentDashboardControlKey`: `4` context block(s)
- `renderKey`: `3` context block(s)
- `Plotly render calls`: `3` context block(s)

## Context blocks

### visibleMask

#### Hit near line 22112

```javascript
022107: 
022108: 
022109: 
022110: 
022111: 
022112: function bandWithVisibleWindowCoverage(bands, visibleMask){
022113: 
022114:   if(!bands || !Array.isArray(bands.up) || !Array.isArray(bands.low)) return bands;
022115: 
022116:   const up = bands.up.slice();
022117:   const low = bands.low.slice();
022118:   const visibleIdx = [];
022119: 
022120:   for(let i=0; i<visibleMask.length; i++){
```

#### Hit near line 22120

```javascript
022115: 
022116:   const up = bands.up.slice();
022117:   const low = bands.low.slice();
022118:   const visibleIdx = [];
022119: 
022120:   for(let i=0; i<visibleMask.length; i++){
022121:     if(visibleMask[i]) visibleIdx.push(i);
022122:   }
022123: 
022124:   if(!visibleIdx.length) return {...bands, up, low};
022125: 
022126:   const firstValid = visibleIdx.find(i=>num(up[i])!==null && num(low[i])!==null);
022127:   const lastValid = visibleIdx.slice().reverse().find(i=>num(up[i])!==null && num(low[i])!==null);
022128: 
```

#### Hit near line 22121

```javascript
022116:   const up = bands.up.slice();
022117:   const low = bands.low.slice();
022118:   const visibleIdx = [];
022119: 
022120:   for(let i=0; i<visibleMask.length; i++){
022121:     if(visibleMask[i]) visibleIdx.push(i);
022122:   }
022123: 
022124:   if(!visibleIdx.length) return {...bands, up, low};
022125: 
022126:   const firstValid = visibleIdx.find(i=>num(up[i])!==null && num(low[i])!==null);
022127:   const lastValid = visibleIdx.slice().reverse().find(i=>num(up[i])!==null && num(low[i])!==null);
022128: 
022129:   if(firstValid === undefined || lastValid === undefined) return {...bands, up, low};
```

#### Hit near line 42857

```javascript
042852: 
042853: 
042854: 
042855: 
042856: 
042857: function computeAlertDiagnosticInfo(rows, overlap, visibleMask, term=null){
042858: 
042859: 
042860: 
042861: 
042862: 
042863: 
042864: 
042865: 
```

#### Hit near line 42953

```javascript
042948: 
042949: 
042950: 
042951: 
042952: 
042953:     if(!visibleMask[i]) continue;
042954: 
042955: 
042956: 
042957: 
042958: 
042959: 
042960: 
042961: 
```

#### Hit near line 49193

```javascript
049188: 
049189: 
049190: 
049191: 
049192: 
049193: function addOverlapBandWithPlaybook(data, x, upper, lower, rows, overlap, lineColor, fillColor, namePrefix, axis, visibleMask){
049194: 
049195: 
049196: 
049197: 
049198: 
049199: 
049200: 
049201: 
```

#### Hit near line 56457

```javascript
056452: 
056453: 
056454: 
056455: 
056456: 
056457: function computeOverlapSignalInfo(rows, overlap, visibleMask){
056458: 
056459: 
056460: 
056461: 
056462: 
056463: 
056464: 
056465: 
```

#### Hit near line 56553

```javascript
056548: 
056549: 
056550: 
056551: 
056552: 
056553:     if(!visibleMask[i]) continue;
056554: 
056555: 
056556: 
056557: 
056558: 
056559: 
056560: 
056561: 
```

#### Hit near line 57417

```javascript
057412: 
057413: 
057414: 
057415: 
057416: 
057417:     if(!visibleMask[i]) continue;
057418: 
057419: 
057420: 
057421: 
057422: 
057423: 
057424: 
057425: 
```

#### Hit near line 58025

```javascript
058020: 
058021: 
058022: 
058023: 
058024: 
058025:       if(!visibleMask[i]) continue;
058026: 
058027: 
058028: 
058029: 
058030: 
058031: 
058032: 
058033: 
```

#### Hit near line 59497

```javascript
059492: 
059493: 
059494: 
059495: 
059496: 
059497: function attentionSoftOverlayRows(rows, visibleMask){
059498: 
059499: 
059500: 
059501: 
059502: 
059503: 
059504: 
059505: 
```

#### Hit near line 59593

```javascript
059588: 
059589: 
059590: 
059591: 
059592: 
059593:     if(!visibleMask[i]) continue;
059594: 
059595: 
059596: 
059597: 
059598: 
059599: 
059600: 
059601: 
```

### plotRows

#### Hit near line 84829

```javascript
084824: 
084825: 
084826: 
084827:   const visibleMask=rows.map(r=>r.dateObj>=visStart&&r.dateObj<=visEnd);
084828: 
084829:   const plotRows=rows.filter((r,i)=>visibleMask[i]);
084830:   const plotXs=plotRows.map(r=>r.dateObj);
084831: 
084832: 
084833: 
084834: 
084835: 
084836: 
084837: 
```

#### Hit near line 84830

```javascript
084825: 
084826: 
084827:   const visibleMask=rows.map(r=>r.dateObj>=visStart&&r.dateObj<=visEnd);
084828: 
084829:   const plotRows=rows.filter((r,i)=>visibleMask[i]);
084830:   const plotXs=plotRows.map(r=>r.dateObj);
084831: 
084832: 
084833: 
084834: 
084835: 
084836: 
084837: 
084838: 
```

#### Hit near line 85667

```javascript
085662: 
085663: 
085664: 
085665: 
085666: 
085667:   if(priceDisplay==='candles') priceCandlestickTraces(plotXs, plotRows, freq).forEach(t=>data.push(t));
085668: 
085669: 
085670: 
085671: 
085672: 
085673: 
085674: 
085675: 
```

### plotXs

#### Hit near line 84830

```javascript
084825: 
084826: 
084827:   const visibleMask=rows.map(r=>r.dateObj>=visStart&&r.dateObj<=visEnd);
084828: 
084829:   const plotRows=rows.filter((r,i)=>visibleMask[i]);
084830:   const plotXs=plotRows.map(r=>r.dateObj);
084831: 
084832: 
084833: 
084834: 
084835: 
084836: 
084837: 
084838: 
```

#### Hit near line 85667

```javascript
085662: 
085663: 
085664: 
085665: 
085666: 
085667:   if(priceDisplay==='candles') priceCandlestickTraces(plotXs, plotRows, freq).forEach(t=>data.push(t));
085668: 
085669: 
085670: 
085671: 
085672: 
085673: 
085674: 
085675: 
```

### bandWithVisibleWindowCoverage

#### Hit near line 22112

```javascript
022107: 
022108: 
022109: 
022110: 
022111: 
022112: function bandWithVisibleWindowCoverage(bands, visibleMask){
022113: 
022114:   if(!bands || !Array.isArray(bands.up) || !Array.isArray(bands.low)) return bands;
022115: 
022116:   const up = bands.up.slice();
022117:   const low = bands.low.slice();
022118:   const visibleIdx = [];
022119: 
022120:   for(let i=0; i<visibleMask.length; i++){
```

#### Hit near line 85056

```javascript
085051: 
085052: 
085053: 
085054:   const priceBands=computePriceBands(rows, freq);
085055: 
085056:   const displayPriceBands=bandWithVisibleWindowCoverage(priceBands, visibleMask);
085057: 
085058: 
085059: 
085060: 
085061: 
085062: 
085063: 
085064: 
```

#### Hit near line 85954

```javascript
085949: 
085950: 
085951: 
085952:   const activeSentBands=activeOverlapModel.sentimentBands || mappedBands;
085953: 
085954:   const displaySentBands=bandWithVisibleWindowCoverage(activeSentBands, visibleMask);
085955: 
085956: 
085957: 
085958: 
085959: 
085960: 
085961: 
085962: 
```

#### Hit near line 86018

```javascript
086013: 
086014: 
086015: 
086016:   const ov=activeOverlapModel.overlap;
086017: 
086018:   const displayOv=bandWithVisibleWindowCoverage(ov, visibleMask);
086019: 
086020: 
086021: 
086022: 
086023: 
086024: 
086025: 
086026: 
```

### displayPriceBands

#### Hit near line 85056

```javascript
085051: 
085052: 
085053: 
085054:   const priceBands=computePriceBands(rows, freq);
085055: 
085056:   const displayPriceBands=bandWithVisibleWindowCoverage(priceBands, visibleMask);
085057: 
085058: 
085059: 
085060: 
085061: 
085062: 
085063: 
085064: 
```

#### Hit near line 85890

```javascript
085885: 
085886: 
085887: 
085888: 
085889: 
085890:   if(bandsLayerPolicy.priceBand) addFilledBand(data,xs,displayPriceBands.up,displayPriceBands.low,COLORS.priceBand,COLORS.priceFill,priceBands.derived?'Price Band (TV 20,2 Derived)':'Price Band','y');
085891: 
085892: 
085893: 
085894: 
085895: 
085896: 
085897: 
085898: 
```

#### Hit near line 91193

```javascript
091188: 
091189: 
091190: 
091191: 
091192: 
091193:       const up=num(displayPriceBands.up[i]), lo=num(displayPriceBands.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);
091194: 
091195: 
091196: 
091197: 
091198: 
091199: 
091200: 
091201: 
```

### displayOv

#### Hit near line 86018

```javascript
086013: 
086014: 
086015: 
086016:   const ov=activeOverlapModel.overlap;
086017: 
086018:   const displayOv=bandWithVisibleWindowCoverage(ov, visibleMask);
086019: 
086020: 
086021: 
086022: 
086023: 
086024: 
086025: 
086026: 
```

#### Hit near line 86791

```javascript
086786: 
086787: 
086788: 
086789: 
086790: 
086791:   if(bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') addOverlapBandWithPlaybook(data,xs,displayOv.up,displayOv.low,rows,ov,COLORS.overlapBand,COLORS.overlapFill,overlapInfo.modelLabel,'y',visibleMask);
086792: 
086793: 
086794: 
086795: 
086796: 
086797: 
086798: 
086799: 
```

#### Hit near line 91383

```javascript
091378: 
091379: 
091380: 
091381: 
091382: 
091383:       const up=num(displayOv.up[i]), lo=num(displayOv.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);
091384: 
091385: 
091386: 
091387: 
091388: 
091389: 
091390: 
091391: 
```

### rangePreset

#### Hit near line 31395

```javascript
031390: 
031391: 
031392: 
031393: 
031394: 
031395: function contextualCalibrationSpec(rangePreset, calendar, freq){
031396: 
031397: 
031398: 
031399: 
031400: 
031401: 
031402: 
031403: 
```

#### Hit near line 31435

```javascript
031430:       '6M': {window: 26, minPeriods: 5, smooth: 3},
031431:       'YTD': {window: 26, minPeriods: 5, smooth: 3},
031432:       '1Y': {window: 52, minPeriods: 6, smooth: 3},
031433:       'All': {window: 52, minPeriods: 6, smooth: 3}
031434:     };
031435:     return {...(weeklyMap[rangePreset] || weeklyMap['3M']), qLo:0.05, qHi:0.95};
031436:   }
031437: 
031438:   const continuous = calendar==='continuous';
031439: 
031440: 
031441: 
031442: 
031443: 
```

#### Hit near line 31725

```javascript
031720: 
031721: 
031722: 
031723: 
031724: 
031725:   return {...(map[rangePreset] || map['3M']), qLo:0.05, qHi:0.95};
031726: 
031727: 
031728: 
031729: 
031730: 
031731: 
031732: 
031733: 
```

#### Hit near line 31789

```javascript
031784: 
031785: 
031786: 
031787: 
031788: 
031789: function computeContextualSentimentBands(rows, rangePreset, calendar, freq){
031790: 
031791: 
031792: 
031793: 
031794: 
031795: 
031796: 
031797: 
```

#### Hit near line 31820

```javascript
031815: 
031816: 
031817: 
031818: 
031819: 
031820:   const spec=contextualCalibrationSpec(rangePreset, calendar, freq);
031821: 
031822: 
031823: 
031824: 
031825: 
031826: 
031827: 
031828: 
```

#### Hit near line 33835

```javascript
033830: 
033831: 
033832: 
033833: 
033834: 
033835: function chooseOverlapModel(rows, priceBands, mappedBands, rangePreset, calendar, bollinger, freq){
033836: 
033837: 
033838: 
033839: 
033840: 
033841: 
033842: 
033843: 
```

#### Hit near line 33898

```javascript
033893: 
033894: 
033895: 
033896: 
033897: 
033898:     const contextualBands = computeContextualSentimentBands(rows, rangePreset, calendar, freq);
033899: 
033900: 
033901: 
033902: 
033903: 
033904: 
033905: 
033906: 
```

#### Hit near line 61693

```javascript
061688: function reviewedBriefingKeyPart(value, fallback){
061689:   const text=String(value || fallback || '').trim().toLowerCase();
061690:   return text.replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || fallback;
061691: }
061692: 
061693: function reviewedBriefingKey(mode, term, freq, rangePreset, asOf){
061694:   return [
061695:     reviewedBriefingKeyPart(mode, 'mode'),
061696:     reviewedBriefingKeyPart(term, 'asset'),
061697:     reviewedBriefingKeyPart(freq, 'freq'),
061698:     reviewedBriefingKeyPart(rangePreset, 'range'),
061699:     reviewedBriefingKeyPart(asOf, 'asof')
061700:   ].join('::');
061701: }
```

#### Hit near line 61698

```javascript
061693: function reviewedBriefingKey(mode, term, freq, rangePreset, asOf){
061694:   return [
061695:     reviewedBriefingKeyPart(mode, 'mode'),
061696:     reviewedBriefingKeyPart(term, 'asset'),
061697:     reviewedBriefingKeyPart(freq, 'freq'),
061698:     reviewedBriefingKeyPart(rangePreset, 'range'),
061699:     reviewedBriefingKeyPart(asOf, 'asof')
061700:   ].join('::');
061701: }
061702: 
061703: function reviewedBriefingText(value, fallback=''){
061704:   return String(value || fallback || '').trim();
061705: }
061706: 
```

#### Hit near line 61707

```javascript
061702: 
061703: function reviewedBriefingText(value, fallback=''){
061704:   return String(value || fallback || '').trim();
061705: }
061706: 
061707: function reviewedBriefingMatches(item, term, freq, rangePreset, asOf){
061708:   if(!item || typeof item !== 'object') return false;
061709:   if(item.schema_version !== 'ai_briefing_output_v1') return false;
061710:   if(item.review_status !== 'reviewed') return false;
061711:   if(item.suppressed === true || item.public_suppressed === true) return false;
061712:   if(reviewedBriefingKeyPart(item.asset, 'asset') !== reviewedBriefingKeyPart(term, 'asset')) return false;
061713:   if(reviewedBriefingKeyPart(item.frequency, 'freq') !== reviewedBriefingKeyPart(freq, 'freq')) return false;
061714:   if(reviewedBriefingKeyPart(item.as_of, 'asof') !== reviewedBriefingKeyPart(asOf, 'asof')) return false;
061715:   if(item.mode && reviewedBriefingKeyPart(item.mode, 'mode') !== reviewedBriefingKeyPart(currentMode(), 'mode')) return false;
```

#### Hit near line 61716

```javascript
061711:   if(item.suppressed === true || item.public_suppressed === true) return false;
061712:   if(reviewedBriefingKeyPart(item.asset, 'asset') !== reviewedBriefingKeyPart(term, 'asset')) return false;
061713:   if(reviewedBriefingKeyPart(item.frequency, 'freq') !== reviewedBriefingKeyPart(freq, 'freq')) return false;
061714:   if(reviewedBriefingKeyPart(item.as_of, 'asof') !== reviewedBriefingKeyPart(asOf, 'asof')) return false;
061715:   if(item.mode && reviewedBriefingKeyPart(item.mode, 'mode') !== reviewedBriefingKeyPart(currentMode(), 'mode')) return false;
061716:   if(item.display_range && reviewedBriefingKeyPart(item.display_range, 'range') !== reviewedBriefingKeyPart(rangePreset, 'range')) return false;
061717:   return true;
061718: }
061719: 
061720: function reviewedBriefingSameContext(item, term, freq, asOf){
061721:   if(!item || typeof item !== 'object') return false;
061722:   if(item.schema_version !== 'ai_briefing_output_v1') return false;
061723:   if(item.review_status !== 'reviewed') return false;
061724:   if(item.suppressed === true || item.public_suppressed === true) return false;
```

#### Hit near line 61732

```javascript
061727:   if(reviewedBriefingKeyPart(item.as_of, 'asof') !== reviewedBriefingKeyPart(asOf, 'asof')) return false;
061728:   if(item.mode && reviewedBriefingKeyPart(item.mode, 'mode') !== reviewedBriefingKeyPart(currentMode(), 'mode')) return false;
061729:   return true;
061730: }
061731: 
061732: function reviewedBriefingFor(term, freq, rangePreset, row){
061733:   const asOf=reviewedBriefingText(row?.date || row?.as_of);
061734:   const payload=REVIEWED_BRIEFINGS_PAYLOAD;
061735:   if(!asOf || !payload?.briefings) return null;
061736:   const key=reviewedBriefingKey(currentMode(), term, freq, rangePreset, asOf);
061737:   const direct=payload.briefings[key];
061738:   if(reviewedBriefingMatches(direct, term, freq, rangePreset, asOf)) return direct;
061739:   const candidates=Object.values(payload.briefings).filter(item=>reviewedBriefingSameContext(item, term, freq, asOf));
061740:   const fallback=candidates.find(item=>reviewedBriefingKeyPart(item.display_range, 'range') === (freq === 'W' ? '1y' : '6m')) || candidates[0];
```

### currentDashboardControlKey

#### Hit near line 84524

```javascript
084519:   const hasPlot = Array.isArray(chart.data) && chart.data.length > 0;
084520:   if(hasPlot && typeof Plotly.react === 'function') return Plotly.react(chart, data, layout, config);
084521:   return Plotly.newPlot(chart, data, layout, config);
084522: }
084523: 
084524: function currentDashboardControlKey(){
084525:   return CONTROL_IDS.map(id => document.getElementById(id)?.value || "").join("|");
084526: }
084527: 
084528: function priceCandlestickTrace(xs, rows, freq){
084529: 
084530:   const isWeekly = freq === 'W';
084531: 
084532:   const upFill = isWeekly ? 'rgba(232,238,241,0.96)' : COLORS.price;
```

#### Hit near line 84690

```javascript
084685: 
084686: 
084687: 
084688:   const term=document.getElementById('asset').value, freq=document.getElementById('freq').value, rangePreset=document.getElementById('range').value, briefingMode=briefingModeValue(), priceDisplay=document.getElementById('priceDisplay').value, scaleMode=document.getElementById('scaleMode').value, ribbon=document.getElementById('ribbon').value, sentRibbon=document.getElementById('sentRibbon').value, regimeLayer=document.getElementById('regimeLayer').value, engagement=document.getElementById('engagement').value, bollinger=document.getElementById('bollinger').value, osc=document.getElementById('osc').value;
084689: 
084690:   const renderKey = currentDashboardControlKey();
084691: 
084692: 
084693: 
084694: 
084695: 
084696: 
084697: 
084698: 
```

#### Hit near line 84729

```javascript
084724:   if(!await ensureAssetPayload(term)){
084725:     document.getElementById('helperText').textContent = `Loading ${term} dashboard data...`;
084726:     return;
084727:   }
084728: 
084729:   if(currentDashboardControlKey() !== renderKey) return scheduleBuildFigure();
084730: 
084731:   const rows=cloneRows(STORE[freq][term]||[]); if(!rows.length) return;
084732: 
084733: 
084734: 
084735: 
084736: 
084737: 
```

#### Hit near line 94077

```javascript
094072: 
094073: 
094074: 
094075: 
094076: 
094077:   if(DASH_RENDER_QUEUED || renderKey !== currentDashboardControlKey()) return;
094078: 
094079:   drawDashboardPlot(data, layout).then(()=>{
094080: 
094081: 
094082: 
094083: 
094084: 
094085: 
```

### renderKey

#### Hit near line 84690

```javascript
084685: 
084686: 
084687: 
084688:   const term=document.getElementById('asset').value, freq=document.getElementById('freq').value, rangePreset=document.getElementById('range').value, briefingMode=briefingModeValue(), priceDisplay=document.getElementById('priceDisplay').value, scaleMode=document.getElementById('scaleMode').value, ribbon=document.getElementById('ribbon').value, sentRibbon=document.getElementById('sentRibbon').value, regimeLayer=document.getElementById('regimeLayer').value, engagement=document.getElementById('engagement').value, bollinger=document.getElementById('bollinger').value, osc=document.getElementById('osc').value;
084689: 
084690:   const renderKey = currentDashboardControlKey();
084691: 
084692: 
084693: 
084694: 
084695: 
084696: 
084697: 
084698: 
```

#### Hit near line 84729

```javascript
084724:   if(!await ensureAssetPayload(term)){
084725:     document.getElementById('helperText').textContent = `Loading ${term} dashboard data...`;
084726:     return;
084727:   }
084728: 
084729:   if(currentDashboardControlKey() !== renderKey) return scheduleBuildFigure();
084730: 
084731:   const rows=cloneRows(STORE[freq][term]||[]); if(!rows.length) return;
084732: 
084733: 
084734: 
084735: 
084736: 
084737: 
```

#### Hit near line 94077

```javascript
094072: 
094073: 
094074: 
094075: 
094076: 
094077:   if(DASH_RENDER_QUEUED || renderKey !== currentDashboardControlKey()) return;
094078: 
094079:   drawDashboardPlot(data, layout).then(()=>{
094080: 
094081: 
094082: 
094083: 
094084: 
094085: 
```

### Plotly render calls

#### Hit near line 84520

```javascript
084515: function drawDashboardPlot(data, layout){
084516:   const chart = document.getElementById('chart');
084517:   if(!chart || typeof Plotly === 'undefined') return Promise.resolve();
084518:   const config = {responsive:true, displaylogo:false};
084519:   const hasPlot = Array.isArray(chart.data) && chart.data.length > 0;
084520:   if(hasPlot && typeof Plotly.react === 'function') return Plotly.react(chart, data, layout, config);
084521:   return Plotly.newPlot(chart, data, layout, config);
084522: }
084523: 
084524: function currentDashboardControlKey(){
084525:   return CONTROL_IDS.map(id => document.getElementById(id)?.value || "").join("|");
084526: }
084527: 
084528: function priceCandlestickTrace(xs, rows, freq){
```

#### Hit near line 84521

```javascript
084516:   const chart = document.getElementById('chart');
084517:   if(!chart || typeof Plotly === 'undefined') return Promise.resolve();
084518:   const config = {responsive:true, displaylogo:false};
084519:   const hasPlot = Array.isArray(chart.data) && chart.data.length > 0;
084520:   if(hasPlot && typeof Plotly.react === 'function') return Plotly.react(chart, data, layout, config);
084521:   return Plotly.newPlot(chart, data, layout, config);
084522: }
084523: 
084524: function currentDashboardControlKey(){
084525:   return CONTROL_IDS.map(id => document.getElementById(id)?.value || "").join("|");
084526: }
084527: 
084528: function priceCandlestickTrace(xs, rows, freq){
084529: 
```

#### Hit near line 166376

```javascript
166371:   function patchRenderFunctions(){
166372:     wrap("reviewedBriefingFor", function(args){ return args[0]; }, null);
166373:     wrap("renderBriefingPanel", function(args){ return args[0]; }, undefined);
166374:     wrap("renderReviewedBriefingPanel", function(args){ return assetFromBriefing(args[1]) || args[2] || args[0]; }, undefined);
166375:     wrap("renderDashboardChart", function(args){ return args[0]; }, undefined);
166376:     wrap("renderChart", function(args){ return args[0]; }, undefined);
166377:   }
166378: 
166379:   var changeTimer = null;
166380:   function onSelectionChanged(){
166381:     clearTimeout(changeTimer);
166382:     changeTimer = setTimeout(function(){
166383:       patchRenderFunctions();
166384:       showLoading("selection changed");
```

