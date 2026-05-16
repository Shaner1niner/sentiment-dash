# Combined Overlap and Structure Inventory

## Purpose

Inventory existing monolith, module, and payload references related to combined overlap, price/sentiment structure, decision pressure, ribbons, confirmation, and candidate score fields.

This is a research checkpoint only. It does not change runtime behavior, calculations, routes, asset coverage, or payloads.

## Branch

`research/combined-overlap-structure-inventory-v1`

## Research question

Before adding or redefining a SETA Structure Score, confirm what already exists in the legacy monolith and payload contracts so the module route can reuse proven semantics instead of reinventing them.

## Working definition

Proposed SETA terminology:

> Structure is the alignment state between price behavior, sentiment behavior, attention, participation breadth, and confirmation context.

This should not be framed as a trade signal or price prediction. It is a context / alignment layer.

## Code search summary

| File | Keyword hit groups | Keywords found |
|---|---:|---|
| `dashboard_fix26_app.js` | 73 | combined overlap, overlap, structure, dashboard score, seta_dashboard_summary_score, bollinger, ribbon, confirmation, pressure, alignment, sentiment_ribbon, scaled_combined_compound |
| `src/PlotlyRenderer.js` | 24 | combined_overlap, overlap, seta_dashboard_summary_score, bollinger, ribbon, sentiment_ribbon, scaled_combined_compound |
| `src/features/Controls.js` | 0 | none |
| `src/features/MarketTape.js` | 10 | confirmation, pressure |
| `src/features/Store.js` | missing |  |
| `src/dashboard_main.js` | 0 | none |
| `interactive_dashboard_fix24_public_embed.html` | 5 | combined overlap, overlap, bollinger, ribbon |
| `interactive_dashboard_fix24_public_legacy_embed.html` | 9 | combined overlap, overlap, bollinger, ribbon |
| `interactive_dashboard_fix24_member_embed.html` | 9 | combined overlap, overlap, bollinger, ribbon |

## Monolith and module code excerpts

### `dashboard_fix26_app.js`

#### Keyword: `combined overlap`

```text
14531: 
14532: ? 'Combined Overlap remains primary, Engagement stays contextual, and member mode keeps the fuller analytical surface without losing price readability.'
14533: 
```

```text
14563: 
14564: : 'Combined Overlap leads. Engagement confirms. Traditional indicators remain visible for timing.');
14565: 
```

```text
56840: 
56841: annotation:'Combined overlap model: unavailable', latestConfirmed:'No confirmed alert in view.', modelLabel: overlap?.family==='contextual' ? 'Contextual Ove...
56842: 
```

```text
57640: 
57641: let narrative='Combined overlap is inside its expected joint range.';
57642: 
```

#### Keyword: `overlap`

```text
14531: 
14532: ? 'Combined Overlap remains primary, Engagement stays contextual, and member mode keeps the fuller analytical surface without losing price readability.'
14533: 
```

```text
14563: 
14564: : 'Combined Overlap leads. Engagement confirms. Traditional indicators remain visible for timing.');
14565: 
```

```text
16119: 
16120: overlapBand:'rgba(255,224,120,0.95)', overlapFill:'rgba(255,224,120,0.12)', rsi:'#e8e8e8', stoch:'#46b9ff', stochD:'#d99c2c',
16121: 
```

```text
18600: if (raw.includes("sentiment")) return "sentiment";
18601: if (raw.includes("combined") || raw.includes("contextual") || raw.includes("canonical") || raw.includes("overlap")) return "overlap";
18602: if (raw.includes("all") || raw.includes("full") || raw.includes("both")) return "all";
```

#### Keyword: `structure`

```text
192: 
193: - Intentional choice: preserve the last coherent UI/control structure and transform
194: 
```

```text
40104: 
40105: const structure=overlapStructureAt(rowsUse, overlap, idxUse);
40106: 
```

```text
40136: 
40137: const structuralVol=structure==='Expansion' ? 'High' : 'Low';
40138: 
```

```text
40264: 
40265: if(!type) return {type:null, confirmed:false, policy:'none', universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume, volumeSource:volumeSta...
40266: 
```

#### Keyword: `dashboard score`

```text
126407: 
126408: {term:"SETA Score", aliases:["Summary Score"], definition:"Composite SETA read for the selected asset/date. It blends sentiment structure, attention, ribbon,...
126409: 
```

#### Keyword: `seta_dashboard_summary_score`

```text
52328: 
52329: 'seta_dashboard_summary_score',
52330: 
```

```text
71075: 
71076: num(row.seta_dashboard_summary_score),
71077: 
```

```text
120871: 
120872: const score = fmtScore(row?.seta_dashboard_summary_score);
120873: 
```

#### Keyword: `bollinger`

```text
6414: 
6415: `<span class="line muted">Bands ${selectedValue("bollinger")} · Timing ${selectedValue("osc")} · Attention ${selectedValue("engagement")}</span>`,
6416: 
```

```text
13232: 
13233: return cfg && cfg.defaults ? cfg.defaults : {freq:'D',range:'3M',briefingMode:'briefing',priceDisplay:'candles',scaleMode:'price_overlays',ribbon:'none',sent...
13234: 
```

```text
18646: 
18647: const idCandidates = ["bands","band","bollinger","bandMode","bandsMode","bandSelector","bandsSelector"];
18648: for (const id of idCandidates){
```

```text
18664: 
18665: function getBandsLayerPolicy(bollingerMode){
18666: const fromControl = normalizeBandsMode(readBandsControlMode());
```

#### Keyword: `ribbon`

```text
13232: 
13233: return cfg && cfg.defaults ? cfg.defaults : {freq:'D',range:'3M',briefingMode:'briefing',priceDisplay:'candles',scaleMode:'price_overlays',ribbon:'none',sent...
13234: 
```

```text
25218: 
25219: const haveUpstream = rows.some(r => r.sent_ribbon_regime_raw!==undefined || r.sent_ribbon_regime_score!==undefined);
25220: 
```

```text
25314: 
25315: regime: r.sent_ribbon_regime_raw || 'Flat',
25316: 
```

```text
25346: 
25347: regimeScore: num(r.sent_ribbon_regime_score) ?? 0,
25348: 
```

#### Keyword: `confirmation`

```text
35464: 
35465: const txt=String(row?.boll_overlap_volume_confirmation_flag || '').trim().toLowerCase();
35466: 
```

```text
35496: 
35497: if(txt.includes('high')) return {known:true, high:true, source:'boll_overlap_volume_confirmation_flag'};
35498: 
```

```text
35528: 
35529: if(txt.includes('normal') || txt.includes('low')) return {known:true, high:false, source:'boll_overlap_volume_confirmation_flag'};
35530: 
```

```text
39688: 
39689: function overlapConfirmationMeta(row, overlap, idx, rows=null, term=null){
39690: 
```

#### Keyword: `pressure`

```text
45352: 
45353: detail:'Confirmed bullish pressure, but the overlap corridor is still falling aggressively. Treat as a countertrend reversal attempt, not a clean trend-align...
45354: 
```

```text
45608: 
45609: detail:'Confirmed bearish pressure, but the overlap corridor is still rising aggressively. Treat as a countertrend fade attempt, not a clean trend-aligned sh...
45610: 
```

```text
45832: 
45833: detail:`Confirmed ${type} pressure is aligned with the active overlap corridor context. ${meta.policy==='hybrid' ? 'Hybrid policy active.' : 'Legacy policy a...
45834: 
```

```text
47400: 
47401: detail = 'Confirmed bullish pressure exists, but it is countertrend against a still-falling overlap corridor. Treat as a spring-like reversal attempt, not a...
47402: 
```

#### Keyword: `alignment`

```text
224: 
225: behavior before deeper indicator-alignment work.
226: 
```

```text
24514: 
24515: const alignmentCount=comps.filter(v=>v!==0).length;
24516: 
```

```text
24994: 
24995: stackScore, alignmentCount, basis
24996: 
```

```text
25698: 
25699: alignmentCount: num(r.sent_ribbon_alignment_count),
25700: 
```

#### Keyword: `sentiment_ribbon`

```text
49576: 
49577: 'sentiment_ribbon_label',
49578: 
```

```text
53096: 
53097: 'sentiment_ribbon_label',
53098: 
```

```text
98343: 
98344: {name:'Ribbon', tokens:['ribbon'], scoreKeys:['sent_ribbon_direction_score','sent_ribbon_score','sentiment_ribbon_score'], labelKeys:['sent_ribbon_label','se...
98345: 
```

#### Keyword: `scaled_combined_compound`

```text
28098: 
28099: const scaledCenter=rows.map(r=> num(r.scaled_combined_compound_ma_21));
28100: 
```

```text
29410: 
29411: const base=num(r.scaled_combined_compound_ma_21);
29412: 
```

### `src/PlotlyRenderer.js`

#### Keyword: `combined_overlap`

```text
280: return (scaleMode !== 'price_only'
281: && ['price', 'contextual', 'overlap', 'combined_overlap', 'both'].includes(bands))
282: || ribbon === 'price'
```

#### Keyword: `overlap`

```text
99: {
100: key: 'confirmedOverlap',
101: name: 'Confirmed Overlap',
```

```text
100: key: 'confirmedOverlap',
101: name: 'Confirmed Overlap',
102: fields: ['boll_overlap_break_confirmed_high_volume', 'boll_overlap_break_confirmed', 'confirmed_overlap_event', 'confirmed_bollinger_overlap'],
```

```text
101: name: 'Confirmed Overlap',
102: fields: ['boll_overlap_break_confirmed_high_volume', 'boll_overlap_break_confirmed', 'confirmed_overlap_event', 'confirmed_bollinger_overlap'],
103: symbol: 'diamond-open',
```

```text
280: return (scaleMode !== 'price_only'
281: && ['price', 'contextual', 'overlap', 'combined_overlap', 'both'].includes(bands))
282: || ribbon === 'price'
```

#### Keyword: `seta_dashboard_summary_score`

```text
139: hoverText('Regime', firstRowValue(row, ['regime_label', 'regime', 'market_regime', 'context_regime']), 72),
140: hoverNumber('SETA score', firstRowValue(row, ['seta_dashboard_summary_score', 'seta_score', 'dashboard_score']), 1),
141: hoverNumber('Attention', firstRowValue(row, ['attention_level_score', 'attention_priority_score', 'screener_attention_priority_score']), 1),
```

```text
619: if (modes.scaleMode === 'all_visible') {
620: const dashboardScore = finiteSeries(source, 'seta_dashboard_summary_score');
621: if (hasEnoughSeries(dashboardScore, source, 0.18, 5)) {
```

#### Keyword: `bollinger`

```text
101: name: 'Confirmed Overlap',
102: fields: ['boll_overlap_break_confirmed_high_volume', 'boll_overlap_break_confirmed', 'confirmed_overlap_event', 'confirmed_bollinger_overlap'],
103: symbol: 'diamond-open',
```

#### Keyword: `ribbon`

```text
106: {
107: key: 'ribbonTransition',
108: name: 'Ribbon Transition',
```

```text
107: key: 'ribbonTransition',
108: name: 'Ribbon Transition',
109: fields: ['sent_ribbon_transition_flag', 'sentiment_ribbon_transition_flag', 'ribbon_transition_flag', 'sentiment_ribbon_transition'],
```

```text
108: name: 'Ribbon Transition',
109: fields: ['sent_ribbon_transition_flag', 'sentiment_ribbon_transition_flag', 'ribbon_transition_flag', 'sentiment_ribbon_transition'],
110: symbol: 'triangle-up-open',
```

```text
137: hoverNumber('Close', firstRowValue(row, ['close', 'latest_close', 'price']), 2),
138: hoverText('Ribbon', firstRowValue(row, ['sentiment_ribbon_state', 'sent_ribbon_state', 'sentiment_ribbon', 'ribbon_state']), 72),
139: hoverText('Regime', firstRowValue(row, ['regime_label', 'regime', 'market_regime', 'context_regime']), 72),
```

#### Keyword: `sentiment_ribbon`

```text
108: name: 'Ribbon Transition',
109: fields: ['sent_ribbon_transition_flag', 'sentiment_ribbon_transition_flag', 'ribbon_transition_flag', 'sentiment_ribbon_transition'],
110: symbol: 'triangle-up-open',
```

```text
137: hoverNumber('Close', firstRowValue(row, ['close', 'latest_close', 'price']), 2),
138: hoverText('Ribbon', firstRowValue(row, ['sentiment_ribbon_state', 'sent_ribbon_state', 'sentiment_ribbon', 'ribbon_state']), 72),
139: hoverText('Regime', firstRowValue(row, ['regime_label', 'regime', 'market_regime', 'context_regime']), 72),
```

#### Keyword: `scaled_combined_compound`

```text
557: const sentimentFields = modes.sentimentRibbon === 'full'
558: ? ['scaled_combined_compound_ma_7', 'scaled_combined_compound_ma_21', 'scaled_combined_compound_ma_50']
559: : ['scaled_combined_compound_ma_21'];
```

```text
558: ? ['scaled_combined_compound_ma_7', 'scaled_combined_compound_ma_21', 'scaled_combined_compound_ma_50']
559: : ['scaled_combined_compound_ma_21'];
560: 
```

### `src/features/MarketTape.js`

#### Keyword: `confirmation`

```text
328: deepFindText(source, WATCH_KEY_RE)
329: ]) || 'Watch for confirmation in price, sentiment, and participation context.';
330: 
```

```text
427: if (/repair|recover/.test(lower)) add('Repair');
428: if (/confirm/.test(lower)) add('Confirmation');
429: if (/watch|monitor/.test(lower)) add('Watch');
```

```text
462: 
463: return `${ticker || 'Asset'} remains on module Market Tape watch; monitor price, sentiment, and participation confirmation.`;
464: }
```

```text
659: ['Family', ['family', 'label', 'archetype', 'name']],
660: ['Confirmation', ['confirmation', 'confirmation_state', 'confirmationState']],
661: ['Conflict', ['conflict', 'conflict_label', 'conflictLabel']],
```

#### Keyword: `pressure`

```text
424: if (/bull|constructive|repair|rebound|resilien/.test(lower)) add('Bullish');
425: if (/bear|weak|deteriorat|reject|risk|pressure/.test(lower)) add('Bearish');
426: if (/momentum|macd|trend/.test(lower)) add('Momentum');
```

```text
1198: if (/bull|constructive|repair|rebound|resilien/.test(lower)) keys.add('bullish');
1199: if (/bear|weak|deteriorat|reject|risk|pressure/.test(lower)) keys.add('bearish');
1200: if (/momentum|macd|trend/.test(lower)) keys.add('momentum');
```

### `interactive_dashboard_fix24_public_embed.html`

#### Keyword: `combined overlap`

```text
556: <div class="control" data-control="engagement"><label data-label-for="engagement">ATTENTION</label><select id="engagement"><option value="off">Off</option><o...
557: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none" selected>None</optio...
558: <div class="control" data-control="osc"><label data-label-for="osc">TIMING VIEW</label><select id="osc"><option value="price">Price Only</option><option valu...
```

#### Keyword: `overlap`

```text
556: <div class="control" data-control="engagement"><label data-label-for="engagement">ATTENTION</label><select id="engagement"><option value="off">Off</option><o...
557: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none" selected>None</optio...
558: <div class="control" data-control="osc"><label data-label-for="osc">TIMING VIEW</label><select id="osc"><option value="price">Price Only</option><option valu...
```

#### Keyword: `bollinger`

```text
556: <div class="control" data-control="engagement"><label data-label-for="engagement">ATTENTION</label><select id="engagement"><option value="off">Off</option><o...
557: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none" selected>None</optio...
558: <div class="control" data-control="osc"><label data-label-for="osc">TIMING VIEW</label><select id="osc"><option value="price">Price Only</option><option valu...
```

#### Keyword: `ribbon`

```text
552: <div class="control" data-control="scaleMode"><label data-label-for="scaleMode">SCALE MODE</label><select id="scaleMode"><option value="price_overlays" selec...
553: <div class="control" data-control="ribbon"><label data-label-for="ribbon">RIBBON</label><select id="ribbon"><option value="none" selected>None</option><optio...
554: <div class="control" data-control="sentRibbon"><label data-label-for="sentRibbon">SENTIMENT RIBBON</label><select id="sentRibbon"><option value="curated" sel...
```

```text
553: <div class="control" data-control="ribbon"><label data-label-for="ribbon">RIBBON</label><select id="ribbon"><option value="none" selected>None</option><optio...
554: <div class="control" data-control="sentRibbon"><label data-label-for="sentRibbon">SENTIMENT RIBBON</label><select id="sentRibbon"><option value="curated" sel...
555: <div class="control" data-control="regimeLayer"><label data-label-for="regimeLayer">REGIME VISUALS</label><select id="regimeLayer"><option value="on" selecte...
```

### `interactive_dashboard_fix24_public_legacy_embed.html`

#### Keyword: `combined overlap`

```text
222: 
223: <div class="sub">Combined Overlap leads. Engagement confirms. Traditional indicators remain visible for timing.</div><div class="modeBadge" id="modeBadge">Pu...
224: 
```

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

```text
706: 
707: <div class="meta"><div class="assetTitle" id="assetTitle">BTC Â· Daily</div><div class="helper" id="helperText">Daily view Â· Combined Overlap primary Â· Eng...
708: 
```

#### Keyword: `overlap`

```text
222: 
223: <div class="sub">Combined Overlap leads. Engagement confirms. Traditional indicators remain visible for timing.</div><div class="modeBadge" id="modeBadge">Pu...
224: 
```

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

```text
706: 
707: <div class="meta"><div class="assetTitle" id="assetTitle">BTC Â· Daily</div><div class="helper" id="helperText">Daily view Â· Combined Overlap primary Â· Eng...
708: 
```

#### Keyword: `bollinger`

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

#### Keyword: `ribbon`

```text
482: 
483: <div class="control" data-control="ribbon"><label data-label-for="ribbon">RIBBON</label><select id="ribbon"><option value="none">None</option><option value="...
484: 
```

```text
514: 
515: <div class="control" data-control="sentRibbon"><label data-label-for="sentRibbon">SENTIMENT RIBBON</label><select id="sentRibbon"><option value="curated">Cur...
516: 
```

### `interactive_dashboard_fix24_member_embed.html`

#### Keyword: `combined overlap`

```text
222: 
223: <div class="sub">Combined Overlap remains primary, Engagement stays contextual, and member mode keeps the fuller analytical surface without losing price read...
224: 
```

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

```text
706: 
707: <div class="meta"><div class="assetTitle" id="assetTitle">BTC Â· Daily</div><div class="helper" id="helperText">Member view Â· Combined Overlap primary Â· En...
708: 
```

#### Keyword: `overlap`

```text
222: 
223: <div class="sub">Combined Overlap remains primary, Engagement stays contextual, and member mode keeps the fuller analytical surface without losing price read...
224: 
```

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

```text
706: 
707: <div class="meta"><div class="assetTitle" id="assetTitle">BTC Â· Daily</div><div class="helper" id="helperText">Member view Â· Combined Overlap primary Â· En...
708: 
```

#### Keyword: `bollinger`

```text
610: 
611: <div class="control" data-control="bollinger"><label data-label-for="bollinger">BANDS</label><select id="bollinger"><option value="none">None</option><option...
612: 
```

#### Keyword: `ribbon`

```text
482: 
483: <div class="control" data-control="ribbon"><label data-label-for="ribbon">RIBBON</label><select id="ribbon"><option value="none">None</option><option value="...
484: 
```

```text
514: 
515: <div class="control" data-control="sentRibbon"><label data-label-for="sentRibbon">SENTIMENT RIBBON</label><select id="sentRibbon"><option value="curated">Cur...
516: 
```

## JSON / payload field inventory

### `fix26_screener_store.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `score_0_100` | 1458 | 74.32784646669751 |
| `screener_attention_priority_score` | 1445 | 68.62318598401494 |
| `contribution_to_attention_priority` | 1269 | 24.32784646669751 |
| `macd_family_label` | 176 | Bullish Confirmation |
| `missing_confirmations` | 176 | Needs confirmed event, volume, or volatility gate |
| `rsi_family_label` | 176 | RSI Constructive |
| `sent_price_macd_joint_slope_label` | 176 | Both Rising |
| `sent_ribbon_label` | 176 | Bullish / Low Structure |
| `signal_consensus_direction_score` | 176 | 74.32784646669751 |
| `signal_dispersion_score` | 176 | 6.235011911310303 |
| `attention_adjusted_bollinger_score` | 149 | 65.96394520064399 |
| `attention_confirmation_score` | 149 | 32.0 |
| `attention_participation_score` | 149 | 29.390877283974532 |
| `bollinger_confidence_score` | 149 | 75.33333333333333 |
| `bollinger_direction_score` | 149 | 73.47639000094705 |
| `bollinger_watch_cluster_score` | 149 | 68.0 |
| `latest_confirmed_quality_score` | 149 | 38.45471225904674 |
| `latest_event_quality_score` | 149 | 26.169697678801786 |
| `ma_trend_direction_score` | 149 | 75.0 |
| `macd_family_direction_score` | 149 | 75.50596611469676 |
| `price_macd_direction_score` | 149 | 82.0 |
| `reason_bollinger_extreme` | 149 | 0 |
| `reason_high_attention` | 149 | 0 |
| `reason_high_dispersion` | 149 | 0 |
| `reason_low_dispersion` | 149 | 1 |
| `reason_macd_improving` | 149 | 1 |
| `reason_sentiment_momentum` | 149 | 1 |
| `rsi_family_state_score` | 149 | 67.07799548658984 |
| `screener_attention_priority_rank` | 149 | 1 |
| `sent_price_macd_crossover_score` | 149 | 42.0 |
| `sent_price_macd_joint_slope_score` | 149 | 82.0 |
| `sent_ribbon_direction_score` | 149 | 83.0 |
| `sent_ribbon_structure_score` | 149 | 45.98658551421923 |
| `sentiment_macd_direction_score` | 149 | 100.0 |
| `signal_consensus_confidence_score` | 149 | 93.31087293871282 |
| `attention_conviction_score_signed` | 27 | -10.921558707432052 |
| `attention_level_score` | 27 | 20.023820055641615 |
| `attention_regime_score` | 27 | 24.59944625123812 |
| `avg_alert_quality_score` | 27 | 39.5448742852222 |
| `avg_attention_level_score` | 27 | 22.523725568517648 |

### `fix26_chart_store_public.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `attention_conviction_score_signed` | 1974 | 0 |
| `attention_level_score` | 1974 | 0 |
| `attention_regime_score` | 1974 | 17.5 |
| `attention_source_breadth_score` | 1974 | 100 |
| `attention_spike_score` | 1974 | 0 |
| `boll_lower_overlap_advanced` | 1974 |  |
| `boll_lower_overlap_band` | 1974 |  |
| `boll_overlap_break_confirmed_high_volume` | 1974 | 0 |
| `boll_overlap_reentry_flag` | 1974 | 0 |
| `boll_overlap_rejection_bearish_flag` | 1974 | 0 |
| `boll_overlap_rejection_bullish_flag` | 1974 | 0 |
| `boll_overlap_volume_confirmation_flag` | 1974 | Normal Volume |
| `boll_upper_overlap_advanced` | 1974 |  |
| `boll_upper_overlap_band` | 1974 |  |
| `boll_volatility_flag` | 1974 |  |
| `boll_volatility_flag_num` | 1974 | 0 |
| `combined_compound_ma_100` | 1974 | 0.143107 |
| `combined_compound_ma_200` | 1974 | 0.143107 |
| `combined_compound_ma_21` | 1974 | 0.143107 |
| `combined_compound_ma_50` | 1974 | 0.143107 |
| `combined_compound_ma_7` | 1974 | 0.143107 |
| `macd` | 1974 | 0 |
| `macd_cross_significance` | 1974 | 0 |
| `macd_histogram` | 1974 | 0 |
| `macd_signal` | 1974 | 0 |
| `macd_signal_cross` | 1974 | 0 |
| `rsi` | 1974 |  |
| `rsi_d` | 1974 |  |
| `scaled_combined_compound_ma_100` | 1974 | 211.239247 |
| `scaled_combined_compound_ma_200` | 1974 | 220.818993 |
| `scaled_combined_compound_ma_21` | 1974 | 221.046943 |
| `scaled_combined_compound_ma_50` | 1974 | 213.135251 |
| `scaled_combined_compound_ma_7` | 1974 | 236.259023 |
| `scaled_sentiment_macd` | 1974 | 1.806607 |
| `scaled_sentiment_macd_signal` | 1974 | 1.358968 |
| `sent_ribbon_alignment_count` | 1974 | 3 |
| `sent_ribbon_center_slope_21` | 1974 |  |
| `sent_ribbon_center_slope_21_z` | 1974 |  |
| `sent_ribbon_compression_flag` | 1974 | 0 |
| `sent_ribbon_regime_confidence` | 1974 | 20 |

### `fix26_chart_store_public_index.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `version` | 2 | fix26 |

### `fix26_chart_store_member.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `attention_conviction_score_signed` | 6318 | 0 |
| `attention_level_score` | 6318 | 0 |
| `attention_regime_score` | 6318 | 17.5 |
| `attention_source_breadth_score` | 6318 | 100 |
| `attention_spike_score` | 6318 | 0 |
| `boll_lower_overlap_advanced` | 6318 |  |
| `boll_lower_overlap_band` | 6318 |  |
| `boll_overlap_break_confirmed_high_volume` | 6318 | 0 |
| `boll_overlap_reentry_flag` | 6318 | 0 |
| `boll_overlap_rejection_bearish_flag` | 6318 | 0 |
| `boll_overlap_rejection_bullish_flag` | 6318 | 0 |
| `boll_overlap_volume_confirmation_flag` | 6318 | Normal Volume |
| `boll_upper_overlap_advanced` | 6318 |  |
| `boll_upper_overlap_band` | 6318 |  |
| `boll_volatility_flag` | 6318 |  |
| `boll_volatility_flag_num` | 6318 | 0 |
| `combined_compound_ma_100` | 6318 | 0.143107 |
| `combined_compound_ma_200` | 6318 | 0.143107 |
| `combined_compound_ma_21` | 6318 | 0.143107 |
| `combined_compound_ma_50` | 6318 | 0.143107 |
| `combined_compound_ma_7` | 6318 | 0.143107 |
| `macd` | 6318 | 0 |
| `macd_cross_significance` | 6318 | 0 |
| `macd_histogram` | 6318 | 0 |
| `macd_signal` | 6318 | 0 |
| `macd_signal_cross` | 6318 | 0 |
| `rsi` | 6318 |  |
| `rsi_d` | 6318 |  |
| `scaled_combined_compound_ma_100` | 6318 | 211.239247 |
| `scaled_combined_compound_ma_200` | 6318 | 220.818993 |
| `scaled_combined_compound_ma_21` | 6318 | 221.046943 |
| `scaled_combined_compound_ma_50` | 6318 | 213.135251 |
| `scaled_combined_compound_ma_7` | 6318 | 236.259023 |
| `scaled_sentiment_macd` | 6318 | 1.806607 |
| `scaled_sentiment_macd_signal` | 6318 | 1.358968 |
| `sent_ribbon_alignment_count` | 6318 | 3 |
| `sent_ribbon_center_slope_21` | 6318 |  |
| `sent_ribbon_center_slope_21_z` | 6318 |  |
| `sent_ribbon_compression_flag` | 6318 | 0 |
| `sent_ribbon_regime_confidence` | 6318 | 20 |

### `fix26_chart_store_member_index.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `version` | 2 | fix26 |

### `generated_briefings_reviewed.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `schema_version` | 72 | ai_briefing_output_v1 |
| `participation_quality` | 70 |  |
| `prompt_version` | 70 | seta_briefing_prompt_v2 |
| `source_input_schema_version` | 70 | ai_briefing_input_v1 |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::aapl::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::aapl::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::aapl::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::aapl::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::aapl::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::aapl::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amd::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amd::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amd::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amd::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amd::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amd::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amzn::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amzn::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amzn::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amzn::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amzn::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amzn::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |

### `generated_briefings_reviewed_v2.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `schema_version` | 72 | ai_briefing_output_v1 |
| `participation_quality` | 70 |  |
| `prompt_version` | 70 | seta_briefing_prompt_v2 |
| `source_input_schema_version` | 70 | ai_briefing_input_v1 |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::aapl::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::aapl::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::aapl::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::aapl::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::aapl::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::aapl::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::aapl::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::aapl::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amd::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amd::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amd::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amd::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amd::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amd::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amd::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amd::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amzn::d::6m::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amzn::d::6m::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amzn::d::6m::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amzn::d::6m::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality` | 1 |  |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality.copy` | 1 | Measured / distributed. Participation is quiet and broadly stable. Au... |
| `briefings.member::amzn::w::1y::2026_05_15.briefing_cards.participation_quality.role` | 1 | Receipts |
| `briefings.member::amzn::w::1y::2026_05_15.model_metadata.prompt_version` | 1 | seta_briefing_prompt_v2 |
| `briefings.member::amzn::w::1y::2026_05_15.review_metadata.source_input_schema_version` | 1 | ai_briefing_input_v1 |
| `briefings.member::amzn::w::1y::2026_05_15.schema_version` | 1 | ai_briefing_output_v1 |

### `public_content/seta_website_snippets_latest.json`

Top matching fields:

| Field/key | Count | Sample value |
|---|---:|---|
| `decision_pressure_rank` | 24 | 1 |
| `snippets.decision_pressure_rank` | 12 | 1 |
| `schema_version` | 2 | seta_public_website_snippets_v1 |
| `by_term.AAPL.decision_pressure_rank` | 1 | 1 |
| `by_term.ADA.decision_pressure_rank` | 1 | 1 |
| `by_term.AMZN.decision_pressure_rank` | 1 | 1 |
| `by_term.BNB.decision_pressure_rank` | 1 | 1 |
| `by_term.CVX.decision_pressure_rank` | 1 | 1 |
| `by_term.DOGE.decision_pressure_rank` | 1 | 1 |
| `by_term.GOOGL.decision_pressure_rank` | 1 | 1 |
| `by_term.KAS.decision_pressure_rank` | 1 | 1 |
| `by_term.LINK.decision_pressure_rank` | 1 | 1 |
| `by_term.NVDA.decision_pressure_rank` | 1 | 1 |
| `by_term.TSMC.decision_pressure_rank` | 1 | 1 |
| `by_term.XRP.decision_pressure_rank` | 1 | 1 |

## Chart asset payload inventory

Scanned chart asset JSON files: `35`

Top chart asset fields related to overlap / structure / score / ribbons:

| Field/key | Count | Sample value |
|---|---:|---|
| `attention_conviction_score_signed` | 8292 | 0 |
| `attention_level_score` | 8292 | 0 |
| `attention_regime_score` | 8292 | 17.5 |
| `attention_source_breadth_score` | 8292 | 100 |
| `attention_spike_score` | 8292 | 0 |
| `boll_lower_overlap_advanced` | 8292 |  |
| `boll_lower_overlap_band` | 8292 |  |
| `boll_overlap_break_confirmed_high_volume` | 8292 | 0 |
| `boll_overlap_reentry_flag` | 8292 | 0 |
| `boll_overlap_rejection_bearish_flag` | 8292 | 0 |
| `boll_overlap_rejection_bullish_flag` | 8292 | 0 |
| `boll_overlap_volume_confirmation_flag` | 8292 | Normal Volume |
| `boll_upper_overlap_advanced` | 8292 |  |
| `boll_upper_overlap_band` | 8292 |  |
| `boll_volatility_flag` | 8292 |  |
| `boll_volatility_flag_num` | 8292 | 0 |
| `combined_compound_ma_100` | 8292 | 0.143107 |
| `combined_compound_ma_200` | 8292 | 0.143107 |
| `combined_compound_ma_21` | 8292 | 0.143107 |
| `combined_compound_ma_50` | 8292 | 0.143107 |
| `combined_compound_ma_7` | 8292 | 0.143107 |
| `macd` | 8292 | 0 |
| `macd_cross_significance` | 8292 | 0 |
| `macd_histogram` | 8292 | 0 |
| `macd_signal` | 8292 | 0 |
| `macd_signal_cross` | 8292 | 0 |
| `rsi` | 8292 |  |
| `rsi_d` | 8292 |  |
| `scaled_combined_compound_ma_100` | 8292 | 211.239247 |
| `scaled_combined_compound_ma_200` | 8292 | 220.818993 |
| `scaled_combined_compound_ma_21` | 8292 | 221.046943 |
| `scaled_combined_compound_ma_50` | 8292 | 213.135251 |
| `scaled_combined_compound_ma_7` | 8292 | 236.259023 |
| `scaled_sentiment_macd` | 8292 | 1.806607 |
| `scaled_sentiment_macd_signal` | 8292 | 1.358968 |
| `sent_ribbon_alignment_count` | 8292 | 3 |
| `sent_ribbon_center_slope_21` | 8292 |  |
| `sent_ribbon_center_slope_21_z` | 8292 |  |
| `sent_ribbon_compression_flag` | 8292 | 0 |
| `sent_ribbon_regime_confidence` | 8292 | 20 |
| `sent_ribbon_regime_raw` | 8292 | Mixed |
| `sent_ribbon_regime_score` | 8292 | 62.5 |
| `sent_ribbon_stack_score` | 8292 | 75 |
| `sent_ribbon_transition_flag` | 8292 | 0 |
| `sent_ribbon_transition_type` | 8292 |  |
| `sent_ribbon_width_abs` | 8292 | 25.019776 |
| `sent_ribbon_width_raw` | 8292 | 25.019776 |
| `sent_ribbon_width_z` | 8292 |  |
| `sentiment_lower_band` | 8292 |  |
| `sentiment_rsi` | 8292 |  |
| `sentiment_rsi_d` | 8292 |  |
| `sentiment_stochastic_rsi_d` | 8292 |  |
| `sentiment_upper_band` | 8292 |  |
| `seta_dashboard_score_source` | 8292 | derived_fix26_v1 |
| `seta_dashboard_summary_score` | 8292 | 49.25 |
| `signal_boll_overlap_break_confirmed_high_volume` | 8292 | False |
| `stochastic_rsi` | 8292 |  |
| `stochastic_rsi_d` | 8292 |  |
| `D.AAPL.attention_conviction_score_signed` | 400 | 0 |
| `D.AAPL.attention_level_score` | 400 | 0 |
| `D.AAPL.attention_regime_score` | 400 | 17.5 |
| `D.AAPL.attention_source_breadth_score` | 400 | 100 |
| `D.AAPL.attention_spike_score` | 400 | 0 |
| `D.AAPL.boll_lower_overlap_advanced` | 400 |  |
| `D.AAPL.boll_lower_overlap_band` | 400 |  |
| `D.AAPL.boll_overlap_break_confirmed_high_volume` | 400 | 0 |
| `D.AAPL.boll_overlap_reentry_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_rejection_bearish_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_rejection_bullish_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_volume_confirmation_flag` | 400 | Normal Volume |
| `D.AAPL.boll_upper_overlap_advanced` | 400 |  |
| `D.AAPL.boll_upper_overlap_band` | 400 |  |
| `D.AAPL.boll_volatility_flag` | 400 |  |
| `D.AAPL.boll_volatility_flag_num` | 400 | 0 |
| `D.AAPL.combined_compound_ma_100` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_200` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_21` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_50` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_7` | 400 | 0.143107 |
| `D.AAPL.macd` | 400 | 0 |

## Candidate Structure Score ingredients

These fields appear related to a future structure/alignment surface. They should be reviewed before creating any new calculated score.

| Field/key | Count | Sample value |
|---|---:|---|
| `attention_conviction_score_signed` | 8292 | 0 |
| `attention_level_score` | 8292 | 0 |
| `attention_regime_score` | 8292 | 17.5 |
| `attention_source_breadth_score` | 8292 | 100 |
| `attention_spike_score` | 8292 | 0 |
| `boll_lower_overlap_advanced` | 8292 |  |
| `boll_lower_overlap_band` | 8292 |  |
| `boll_overlap_break_confirmed_high_volume` | 8292 | 0 |
| `boll_overlap_reentry_flag` | 8292 | 0 |
| `boll_overlap_rejection_bearish_flag` | 8292 | 0 |
| `boll_overlap_rejection_bullish_flag` | 8292 | 0 |
| `boll_overlap_volume_confirmation_flag` | 8292 | Normal Volume |
| `boll_upper_overlap_advanced` | 8292 |  |
| `boll_upper_overlap_band` | 8292 |  |
| `combined_compound_ma_100` | 8292 | 0.143107 |
| `combined_compound_ma_200` | 8292 | 0.143107 |
| `combined_compound_ma_21` | 8292 | 0.143107 |
| `combined_compound_ma_50` | 8292 | 0.143107 |
| `combined_compound_ma_7` | 8292 | 0.143107 |
| `scaled_combined_compound_ma_100` | 8292 | 211.239247 |
| `scaled_combined_compound_ma_200` | 8292 | 220.818993 |
| `scaled_combined_compound_ma_21` | 8292 | 221.046943 |
| `scaled_combined_compound_ma_50` | 8292 | 213.135251 |
| `scaled_combined_compound_ma_7` | 8292 | 236.259023 |
| `sent_ribbon_alignment_count` | 8292 | 3 |
| `sent_ribbon_regime_score` | 8292 | 62.5 |
| `sent_ribbon_stack_score` | 8292 | 75 |
| `seta_dashboard_score_source` | 8292 | derived_fix26_v1 |
| `seta_dashboard_summary_score` | 8292 | 49.25 |
| `signal_boll_overlap_break_confirmed_high_volume` | 8292 | False |
| `D.AAPL.attention_conviction_score_signed` | 400 | 0 |
| `D.AAPL.attention_level_score` | 400 | 0 |
| `D.AAPL.attention_regime_score` | 400 | 17.5 |
| `D.AAPL.attention_source_breadth_score` | 400 | 100 |
| `D.AAPL.attention_spike_score` | 400 | 0 |
| `D.AAPL.boll_lower_overlap_advanced` | 400 |  |
| `D.AAPL.boll_lower_overlap_band` | 400 |  |
| `D.AAPL.boll_overlap_break_confirmed_high_volume` | 400 | 0 |
| `D.AAPL.boll_overlap_reentry_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_rejection_bearish_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_rejection_bullish_flag` | 400 | 0 |
| `D.AAPL.boll_overlap_volume_confirmation_flag` | 400 | Normal Volume |
| `D.AAPL.boll_upper_overlap_advanced` | 400 |  |
| `D.AAPL.boll_upper_overlap_band` | 400 |  |
| `D.AAPL.combined_compound_ma_100` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_200` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_21` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_50` | 400 | 0.143107 |
| `D.AAPL.combined_compound_ma_7` | 400 | 0.143107 |
| `D.AAPL.scaled_combined_compound_ma_100` | 400 | 211.239247 |
| `D.AAPL.scaled_combined_compound_ma_200` | 400 | 220.818993 |
| `D.AAPL.scaled_combined_compound_ma_21` | 400 | 221.046943 |
| `D.AAPL.scaled_combined_compound_ma_50` | 400 | 213.135251 |
| `D.AAPL.scaled_combined_compound_ma_7` | 400 | 236.259023 |
| `D.AAPL.sent_ribbon_alignment_count` | 400 | 3 |
| `D.AAPL.sent_ribbon_regime_score` | 400 | 62.5 |
| `D.AAPL.sent_ribbon_stack_score` | 400 | 75 |
| `D.AAPL.seta_dashboard_score_source` | 400 | derived_fix26_v1 |
| `D.AAPL.seta_dashboard_summary_score` | 400 | 49.25 |
| `D.AAPL.signal_boll_overlap_break_confirmed_high_volume` | 400 | False |
| `D.BTC.attention_conviction_score_signed` | 400 | 0 |
| `D.BTC.attention_level_score` | 400 | 0 |
| `D.BTC.attention_regime_score` | 400 | 17.5 |
| `D.BTC.attention_source_breadth_score` | 400 | 100 |
| `D.BTC.attention_spike_score` | 400 | 0 |
| `D.BTC.boll_lower_overlap_advanced` | 400 |  |
| `D.BTC.boll_lower_overlap_band` | 400 |  |
| `D.BTC.boll_overlap_break_confirmed_high_volume` | 400 | 0 |
| `D.BTC.boll_overlap_reentry_flag` | 400 | 0 |
| `D.BTC.boll_overlap_rejection_bearish_flag` | 400 | 0 |
| `D.BTC.boll_overlap_rejection_bullish_flag` | 400 | 0 |
| `D.BTC.boll_overlap_volume_confirmation_flag` | 400 | Normal Volume |
| `D.BTC.boll_upper_overlap_advanced` | 400 |  |
| `D.BTC.boll_upper_overlap_band` | 400 |  |
| `D.BTC.combined_compound_ma_100` | 400 | 0.143107 |
| `D.BTC.combined_compound_ma_200` | 400 | 0.143107 |
| `D.BTC.combined_compound_ma_21` | 400 | 0.143107 |
| `D.BTC.combined_compound_ma_50` | 400 | 0.143107 |
| `D.BTC.combined_compound_ma_7` | 400 | 0.143107 |
| `D.BTC.scaled_combined_compound_ma_100` | 400 | 211.239247 |

## Initial interpretation

### What appears reusable

- Existing overlap / shared-zone / ribbon / confirmation fields should be treated as the first source of truth.
- Existing dashboard or summary score fields should be reviewed before adding a new Structure Score.
- Existing briefing language around pressure, confirmation, participation, and source breadth should inform labels and tooltip copy.

### What needs a separate correctness pass

- The `Combined Overlap` control needs its own visual contract review.
- The module renderer should only show combined overlap visuals when the needed fields exist for the selected asset/range.
- If the fields are missing, the UI should degrade intentionally rather than silently appearing broken.

### What needs a product contract

- A future `Structure Score` should be defined before implementation.
- The contract should specify exact ingredients, scale, label, tooltip text, and non-signal language.
- The score should explain alignment / tension / confirmation context, not predict price or recommend action.

## Recommended follow-up branches

### 1. Combined overlap visual contract

Suggested branch:

```text
fix/module-combined-overlap-visual-contract-v1
```

Scope:

- confirm which fields power Combined Overlap
- make the control visibly do something only when data exists
- add a designed unavailable / no-data fallback if needed
- no new score calculation
- no payload regeneration

### 2. Structure Score product contract

Suggested branch:

```text
docs/structure-score-product-contract-v1
```

Scope:

- define SETA Structure Score terminology
- decide whether to reuse existing fields or create a new derived field
- define scale and thresholds
- define non-trading-signal copy
- define placement in the module dashboard

## Non-goals

- no route changes
- no dashboard runtime changes
- no payload regeneration
- no calculation changes
- no monolith deletion
- no asset universe changes

## Final recommendation

Use the monolith and existing payload contracts as the source of truth before implementing new Structure Score behavior.

The immediate next implementation should be a narrow Combined Overlap visual contract fix. The Structure Score should come after a product contract confirms whether existing payload fields are sufficient or whether a new data-contract field is required.
