/*
  v26 Recovery Baseline
  --------------------
  Provenance:
  - Recovered from the saved v25 checkpoint after reconstructing the version path
    through v20, v21/v22, and v23.
  - Intentional choice: preserve the last coherent UI/control structure and transform
    behavior before deeper indicator-alignment work.

  What this file is:
  - A stable structural baseline for continued v26 recovery.

  What this file is not yet:
  - A TradingView-aligned RSI/Stochastic RSI validation build.
  - A fully confirmed recreation of every unsaved v26 delta.
*/
const DASH_MODE_DEFAULT = window.DASH_MODE_DEFAULT || "public";
const MANIFEST_URL = new URLSearchParams(location.search).get("manifest") || window.DASH_MANIFEST_URL || "dashboard_fix26_mode_manifest.json";
let STORE = null;
let MODE_MANIFEST = null;

window.SETA_BUILD_INFO = {
  build: "rightdrawer_restore_001",
  branch: "phase-e-stability-build-info",
  dashboard: "fix26",
  mode: window.DASH_MODE || "unknown",
  alertPolicy: "stable-right-drawer",
  updated: "2026-04-25"
};

function currentMode(){ return new URLSearchParams(location.search).get("mode") || DASH_MODE_DEFAULT || "public"; }
function manifestModeConfig(){
  if (!MODE_MANIFEST || !MODE_MANIFEST.modes) return null;
  return MODE_MANIFEST.modes[currentMode()] || MODE_MANIFEST.modes.public || null;
}
function assetUniverse(){
  const cfg = manifestModeConfig();
  return Array.isArray(cfg?.assets) ? cfg.assets.slice() : [];
}
function modeDefaults(){
  const cfg = manifestModeConfig();
  return cfg && cfg.defaults ? cfg.defaults : {freq:'D',range:'3M',priceDisplay:'candles',scaleMode:'price_overlays',ribbon:'none',sentRibbon:'curated',regimeLayer:'off',engagement:'context',bollinger:'contextual',osc:'both'};
}
function activeDataUrl(){
  return new URLSearchParams(location.search).get('data') || manifestModeConfig()?.dataUrl || 'fix26_chart_store_public.json';
}
function showLegend(){ return !!manifestModeConfig()?.showLegend; }
function showLowerPanes(){ return manifestModeConfig()?.showLowerPanes !== false; }
function badgeOrder(){ return manifestModeConfig()?.badgeOrder || []; }
function helperPrefix(){ return manifestModeConfig()?.helperPrefix || null; }
function setSelectValue(id,val){ const el=document.getElementById(id); if(el && [...el.options].some(o=>o.value===val)) el.value=val; }
function populateAssetOptions(){
  const sel=document.getElementById('asset');
  const cfg = manifestModeConfig();
  const allowed = assetUniverse().filter(a => STORE && STORE.D && STORE.D[a]);
  sel.innerHTML = allowed.map(a=>`<option value="${a}">${a}</option>`).join('');
  const qAsset = new URLSearchParams(location.search).get('asset');
  const preferred = (qAsset && allowed.includes(qAsset)) ? qAsset : (cfg?.defaultAsset && allowed.includes(cfg.defaultAsset) ? cfg.defaultAsset : allowed[0]);
  if(preferred) sel.value = preferred;
}
function applyControlLabels(){
  const labels = (MODE_MANIFEST && MODE_MANIFEST.controlLabels) ? MODE_MANIFEST.controlLabels : {};
  document.querySelectorAll('[data-label-for]').forEach(el=>{
    const key = el.getAttribute('data-label-for');
    if(labels[key]) el.textContent = labels[key];
  });
}
function applyControlVisibility(){
  const cfg = manifestModeConfig();
  const visible = new Set(cfg?.controls || []);
  document.querySelectorAll('.control[data-control]').forEach(el=>{
    el.style.display = visible.has(el.dataset.control) ? '' : 'none';
  });
}
function applyModeUi(){
  const mode=currentMode();
  const cfg = manifestModeConfig() || {};
  document.getElementById('modeBadge').textContent = cfg.modeBadge || (mode==='member' ? 'Member Mode' : 'Public Mode');
  document.querySelector('.h1').textContent = cfg.title || (mode==='member' ? 'SETA Research Dashboard' : 'SETA Market Dashboard');
  document.querySelector('.sub').textContent = cfg.subtitle || (mode==='member'
    ? 'Combined Overlap remains primary, Engagement stays contextual, and member mode keeps the fuller analytical surface without losing price readability.'
    : 'Combined Overlap leads. Engagement confirms. Traditional indicators remain visible for timing.');
  document.title = document.querySelector('.h1').textContent;
  applyControlLabels();
  applyControlVisibility();
}
function applyModeDefaults(){
  const d = modeDefaults();
  Object.entries(d).forEach(([k,v])=>setSelectValue(k,v));
}
async function loadManifest(){
  const res = await fetch(MANIFEST_URL, {cache:'no-store'});
  if(!res.ok) throw new Error(`Failed to load manifest from ${MANIFEST_URL}: ${res.status}`);
  MODE_MANIFEST = await res.json();
}
async function loadStore(){
  const res = await fetch(activeDataUrl(), {cache:'no-store'});
  if(!res.ok) throw new Error(`Failed to load data from ${activeDataUrl()}: ${res.status}`);
  STORE = await res.json();
}
const COLORS = {
  bg:'#07090b', panel:'#0b0d10', grid:'rgba(255,255,255,0.12)', text:'#e7eef3', price:'#d8d8d8',
  ma7:'#ffffff', ma21:'#cfe9ff', ma50:'#878787', ma100:'#65a7e8', ma200:'#9a9a9a',
  priceBand:'rgba(125,185,255,0.95)', priceFill:'rgba(85,135,215,0.10)',
  sentCore:'#00ff00', sentInner:'rgba(0,255,0,0.16)', sentOuter:'rgba(0,255,0,0.07)', sentFill:'rgba(0,255,0,0.05)',
  sent7:'#00ff00', sent21:'#38ff63', sent50:'#5cff8b', sent100:'#80ffb2', sent200:'#a6ffd6',
  regimeBull:'#47dd7b', regimeBear:'#ff7474', regimeFlat:'#d6bf5e',
  regimeBullFill:'rgba(71,221,123,0.07)', regimeBearFill:'rgba(255,116,116,0.07)', regimeFlatFill:'rgba(214,191,94,0.06)',
  transitionBull:'rgba(71,221,123,0.95)', transitionBear:'rgba(255,116,116,0.95)', transitionFlat:'rgba(214,191,94,0.95)',
  overlapBand:'rgba(255,224,120,0.95)', overlapFill:'rgba(255,224,120,0.12)', rsi:'#e8e8e8', stoch:'#46b9ff', stochD:'#d99c2c',
  histUp:'#2dfc2d', histUpSoft:'#b7d0b7', histDown:'#ff6666', histDownSoft:'#d6a7a7'
};
function hexToRgba(hex, alpha){
  const h=String(hex||'').replace('#','');
  if(h.length!==6) return `rgba(0,255,0,${alpha})`;
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
function mixHex(hexA, hexB, t){
  const a=String(hexA||'').replace('#',''), b=String(hexB||'').replace('#','');
  if(a.length!==6 || b.length!==6) return hexA || hexB || '#ffffff';
  const tt=clamp(Number(t)||0,0,1);
  const ch=(s,i)=>parseInt(s.slice(i,i+2),16);
  const toHex=n=>Math.round(n).toString(16).padStart(2,'0');
  const r=ch(a,0)*(1-tt)+ch(b,0)*tt, g=ch(a,2)*(1-tt)+ch(b,2)*tt, b2=ch(a,4)*(1-tt)+ch(b,4)*tt;
  return `#${toHex(r)}${toHex(g)}${toHex(b2)}`;
}
function regimeBaseColor(regime){
  if(regime==='Bullish') return COLORS.regimeBull;
  if(regime==='Bearish') return COLORS.regimeBear;
  return COLORS.regimeFlat;
}
function regimeFillColor(regime){
  if(regime==='Bullish') return COLORS.regimeBullFill;
  if(regime==='Bearish') return COLORS.regimeBearFill;
  return COLORS.regimeFlatFill;
}
function regimePalette(regime, period){
  const base=regimeBaseColor(regime);
  const lighten=({7:0.00,21:0.10,50:0.20,100:0.30,200:0.40})[period] ?? 0.18;
  const core=mixHex(base,'#ffffff',lighten);
  return {core, inner:hexToRgba(core,0.16), outer:hexToRgba(core,0.06)};
}
function sentimentPalette(period){
  const core = ({7:COLORS.sent7,21:COLORS.sent21,50:COLORS.sent50,100:COLORS.sent100,200:COLORS.sent200})[period] || COLORS.sentCore;
  return {core, inner:hexToRgba(core,0.15), outer:hexToRgba(core,0.06)};
}
function num(v){ const n=(v===null||v===undefined||v==='')?null:Number(v); return (n===null || Number.isFinite(n)) ? n : null; }
function cloneRows(rows){ return rows.map(r=>{ const x={...r}; x.dateObj=new Date(r.date+'T00:00:00'); return x; }); }
function detectCalendar(rows){ return (rows[0]&&rows[0].asset_calendar)||'trading_sessions'; }
function visibleRows(rows,preset){
  if(!rows.length) return [];
  const end=rows[rows.length-1].dateObj;
  let start=null;
  if(preset==='All') return rows.slice();
  if(preset==='YTD') start=new Date(end.getFullYear(),0,1);
  else {
    start=new Date(end);
    const map={'1M':31,'3M':92,'6M':183,'1Y':366};
    start.setDate(start.getDate()-map[preset]);
  }
  return rows.filter(r=>r.dateObj>=start&&r.dateObj<=end);
}
function fitRowsForSentiment(rows, visRows, freq){
  if(!rows.length||!visRows.length) return rows.slice();
  const visStart=visRows[0].dateObj, visEnd=visRows[visRows.length-1].dateObj;
  const start=new Date(visStart);
  if(freq==='W') start.setDate(start.getDate()-730);
  else start.setDate(start.getDate()-260);
  const fit=rows.filter(r=>r.dateObj>=start && r.dateObj<=visEnd);
  return fit.length ? fit : rows.slice();
}
function futurePadDays(calendar,freq){ if(freq==='W') return 14; return calendar==='continuous'?3:5; }
function nextRangeEnd(visEnd,calendar,freq){ const d=new Date(visEnd); d.setDate(d.getDate()+futurePadDays(calendar,freq)); return d; }
function traceLine(x,y,name,color,width,dash='solid',axis='y',showlegend=true,hovertemplate=null,opacity=0.95,connectgaps=true){
  return {type:'scatter',mode:'lines',x,y,name,xaxis:axis==='y'?'x':axis==='y2'?'x2':axis==='y3'?'x3':'x4',yaxis:axis,line:{color,width,dash,shape:'linear'},connectgaps,opacity,showlegend,hovertemplate};
}
function sentimentBundle(x,y,name,axis,showlegend=true,hovertemplate=null,width=1.35,palette=null,connectgaps=true){
  const p=palette||{core:COLORS.sentCore, inner:COLORS.sentInner, outer:COLORS.sentOuter};
  return [
    traceLine(x,y,name+' glow 1',p.outer,width+4.0,'solid',axis,false,null,1.0,connectgaps),
    traceLine(x,y,name+' glow 2',p.inner,width+1.8,'solid',axis,false,null,1.0,connectgaps),
    traceLine(x,y,name,p.core,width,'solid',axis,showlegend,hovertemplate,0.92,connectgaps)
  ];
}
function addFilledBand(data,x,upper,lower,lineColor,fillColor,namePrefix,axis){
  data.push(traceLine(x,lower,namePrefix+' Lower',lineColor,1.0,'solid',axis,false,'%{x|%b %d, %Y}<br>'+namePrefix+' Lower=%{y:.2f}<extra></extra>',0.9));
  data.push({type:'scatter',mode:'lines',x:x,y:upper,name:namePrefix+' Upper',xaxis:axis==='y'?'x':axis==='y2'?'x2':axis==='y3'?'x3':'x4',yaxis:axis,line:{color:lineColor,width:1.0,dash:'solid',shape:'linear'},connectgaps:true,showlegend:true,hovertemplate:'%{x|%b %d, %Y}<br>'+namePrefix+' Upper=%{y:.2f}<extra></extra>',fill:'tonexty',fillcolor:fillColor,opacity:0.95});
}
function finiteVals(arr){ return arr.map(num).filter(v=>v!==null && Number.isFinite(v)); }
function mean(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null; }
function quantile(arr,q){
  if(!arr.length) return null;
  const xs=arr.slice().sort((a,b)=>a-b);
  const pos=(xs.length-1)*q, base=Math.floor(pos), rest=pos-base;
  if(xs[base+1]!==undefined) return xs[base] + rest*(xs[base+1]-xs[base]);
  return xs[base];
}
function stddev(arr){
  if(arr.length<2) return null;
  const m=mean(arr);
  const v=arr.reduce((a,b)=>a+(b-m)*(b-m),0)/(arr.length-1);
  return Number.isFinite(v) ? Math.sqrt(v) : null;
}
function rangeFinite(arr){
  const xs=finiteVals(arr);
  if(!xs.length) return null;
  return Math.max(...xs) - Math.min(...xs);
}
function rollingStd(series, window=20){
  const out=new Array(series.length).fill(null);
  for(let i=0;i<series.length;i++){
    const win=[];
    const start=Math.max(0, i-window+1);
    for(let j=start;j<=i;j++){
      const v=num(series[j]);
      if(v!==null) win.push(v);
    }
    out[i]=win.length>=window ? stddev(win) : null;
  }
  return out;
}
function robustSharedSentTransform(allRows, fitRows, visRows){
  const rawFit=finiteVals(fitRows.map(r=>r.combined_compound_ma_21));
  const rawVis=finiteVals(visRows.map(r=>r.combined_compound_ma_21));
  const priceFit=finiteVals(fitRows.map(r=>num(r.close_ma_21) ?? num(r.close)));
  const priceVis=finiteVals(visRows.map(r=>num(r.close_ma_21) ?? num(r.close)));
  const rawAll=finiteVals(allRows.map(r=>r.combined_compound_ma_21));
  const priceAll=finiteVals(allRows.map(r=>num(r.close_ma_21) ?? num(r.close)));

  const rx=rawFit.length ? rawFit : (rawVis.length ? rawVis : rawAll);
  const py=priceFit.length ? priceFit : (priceVis.length ? priceVis : priceAll);
  const anchorRaw=rawVis.length ? rawVis : rx;
  const anchorPrice=priceVis.length ? priceVis : py;
  if(rx.length<2 || py.length<2 || anchorRaw.length<1 || anchorPrice.length<1) return null;

  let a=null, b=null;
  const x05=quantile(rx,0.05), x95=quantile(rx,0.95), y05=quantile(py,0.05), y95=quantile(py,0.95);
  if([x05,x95,y05,y95].every(v=>v!==null && Number.isFinite(v)) && Math.abs(x95-x05) > 1e-12){
    a=(y95-y05)/(x95-x05);
  }
  if(a===null || !Number.isFinite(a) || Math.abs(a) < 1e-12){
    const sx=stddev(rx), sy=stddev(py);
    if(sx!==null && sy!==null && Number.isFinite(sx) && Number.isFinite(sy) && sx > 1e-12){
      a=sy/sx;
    }
  }
  if(a===null || !Number.isFinite(a) || Math.abs(a) < 1e-12) return null;
  const mRaw=mean(anchorRaw), mPrice=mean(anchorPrice);
  if(mRaw===null || mPrice===null) return null;
  b=mPrice - a*mRaw;
  return {a,b};
}
function applyTransform(v, model){ const x=num(v); if(x===null||!model) return null; return model.a*x + model.b; }
function rollingMean(series, window=20){
  const out=new Array(series.length).fill(null);
  for(let i=0;i<series.length;i++){
    const win=[];
    const start=Math.max(0, i-window+1);
    for(let j=start;j<=i;j++){
      const v=num(series[j]);
      if(v!==null) win.push(v);
    }
    out[i]=win.length>=window ? mean(win) : null;
  }
  return out;
}
function computePriceBands(rows){
  const up=new Array(rows.length).fill(null);
  const low=new Array(rows.length).fill(null);
  const basis=new Array(rows.length).fill(null);
  const validClose=[], validIdx=[];
  rows.forEach((r,i)=>{
    const c=num(r.close);
    if(c!==null && Number.isFinite(c)){ validClose.push(c); validIdx.push(i); }
  });
  const validBasis=rollingMean(validClose,20);
  const validSd=rollingStd(validClose,20);
  validIdx.forEach((rowIdx,k)=>{
    const b=validBasis[k], s=validSd[k];
    if(b===null || s===null || !Number.isFinite(b) || !Number.isFinite(s)) return;
    basis[rowIdx]=b;
    up[rowIdx]=b + 2*s;
    low[rowIdx]=b - 2*s;
  });
  return {up, low, basis, derived:true, method:'tv_close_20_2_trading'};
}
function mappedSentimentBands(rows, fitRows, visRows){
  const model=robustSharedSentTransform(rows, fitRows, visRows);
  if(!model) return {up:rows.map(r=>null), low:rows.map(r=>null), model:null};
  return {up: rows.map(r=>applyTransform(r.sentiment_upper_band, model)), low: rows.map(r=>applyTransform(r.sentiment_lower_band, model)), model};
}
function smoothFiniteSeries(values, window){
  const out=new Array(values.length).fill(null);
  const half=Math.max(0, Math.floor(window/2));
  for(let i=0;i<values.length;i++){
    let sum=0, count=0;
    for(let j=Math.max(0,i-half); j<=Math.min(values.length-1,i+half); j++){
      const v=num(values[j]);
      if(v!==null){ sum+=v; count+=1; }
    }
    out[i]=count ? sum/count : null;
  }
  return out;
}
function rollingQuantileSeries(values, window, q, minPeriods){
  const out=new Array(values.length).fill(null);
  for(let i=0;i<values.length;i++){
    const start=Math.max(0,i-window+1);
    const vals=[];
    for(let j=start;j<=i;j++){ const v=num(values[j]); if(v!==null && Number.isFinite(v)) vals.push(v); }
    out[i]=vals.length>=minPeriods ? quantile(vals,q) : null;
  }
  return out;
}
function rollingRobustZ(values, window=60, minPeriods=20){
  const out=new Array(values.length).fill(null);
  for(let i=0;i<values.length;i++){
    const start=Math.max(0,i-window+1);
    const vals=[];
    for(let j=start;j<=i;j++){ const v=num(values[j]); if(v!==null && Number.isFinite(v)) vals.push(v); }
    if(vals.length<minPeriods){ out[i]=null; continue; }
    const med=quantile(vals,0.5);
    const absDevs=vals.map(v=>Math.abs(v-med));
    const mad=quantile(absDevs,0.5);
    const cur=num(values[i]);
    if(cur===null || med===null || mad===null){ out[i]=null; continue; }
    const scale=mad===0 ? (stddev(vals) || 1) : (1.4826*mad);
    out[i]=(cur-med)/(scale || 1);
  }
  return out;
}
function chooseRegimeBasis(rows){
  const rawDistinct=[];
  rows.forEach(r=>{
    const vals=[num(r.combined_compound_ma_7),num(r.combined_compound_ma_21),num(r.combined_compound_ma_50),num(r.combined_compound_ma_100),num(r.combined_compound_ma_200)].filter(v=>v!==null);
    if(vals.length>=2) rawDistinct.push((Math.max(...vals)-Math.min(...vals)));
  });
  const maxSpread=rawDistinct.length ? Math.max(...rawDistinct) : 0;
  return maxSpread>1e-6 ? 'raw' : 'scaled';
}
function deriveRegimeInfo(rows){
  const basis=chooseRegimeBasis(rows);
  const prefix=basis==='raw' ? '' : 'scaled_';
  const ma7=rows.map(r=>num(r[prefix+'combined_compound_ma_7']));
  const ma21=rows.map(r=>num(r[prefix+'combined_compound_ma_21']));
  const ma50=rows.map(r=>num(r[prefix+'combined_compound_ma_50']));
  const ma100=rows.map(r=>num(r[prefix+'combined_compound_ma_100']));
  const ma200=rows.map(r=>num(r[prefix+'combined_compound_ma_200']));
  const slope21=ma21.map((v,i)=> v!==null && i>0 && ma21[i-1]!==null ? v-ma21[i-1] : null);
  const widthRaw=ma7.map((v,i)=> v!==null && ma200[i]!==null ? v-ma200[i] : null);
  const widthAbs=widthRaw.map(v=>v===null?null:Math.abs(v));
  const widthQ25=rollingQuantileSeries(widthAbs, 60, 0.25, 20);
  const widthZ=rollingRobustZ(widthRaw, 60, 20);
  const slopeZ=rollingRobustZ(slope21, 60, 20);
  const out=[];
  let prevRegime=null;
  for(let i=0;i<rows.length;i++){
    const comps=[
      ma7[i]!==null&&ma21[i]!==null ? Math.sign(ma7[i]-ma21[i]) : 0,
      ma21[i]!==null&&ma50[i]!==null ? Math.sign(ma21[i]-ma50[i]) : 0,
      ma50[i]!==null&&ma100[i]!==null ? Math.sign(ma50[i]-ma100[i]) : 0,
      ma100[i]!==null&&ma200[i]!==null ? Math.sign(ma100[i]-ma200[i]) : 0
    ];
    const bullStack=comps.every(v=>v===1);
    const bearStack=comps.every(v=>v===-1);
    const alignmentCount=comps.filter(v=>v!==0).length;
    const stackScore=(comps.reduce((a,b)=>a+b,0)/4)*100;
    const compression=widthAbs[i]!==null && widthQ25[i]!==null ? (widthAbs[i] <= widthQ25[i]) : false;
    const wScore=((clamp(widthZ[i]??0,-3,3))/3)*100;
    const sScore=((clamp(slopeZ[i]??0,-3,3))/3)*100;
    const regimeScore=(0.55*stackScore + 0.30*wScore + 0.15*sScore) * (compression ? 0.35 : 1.0);
    const confidence=clamp(0.50*Math.abs(stackScore) + 0.30*Math.min(100, Math.abs(widthZ[i]??0)*25) + 0.20*Math.min(100, Math.abs(slopeZ[i]??0)*25), 0, 100);
    let regime='Flat';
    if(bullStack && (slope21[i]??0) > 0 && !compression) regime='Bullish';
    else if(bearStack && (slope21[i]??0) < 0 && !compression) regime='Bearish';
    const transition=prevRegime!==null && regime!==prevRegime;
    out.push({
      regime, regimeScore, confidence, compression, transition,
      transitionType: transition ? `${prevRegime} -> ${regime}` : null,
      widthRaw: widthRaw[i], widthAbs: widthAbs[i], widthZ: widthZ[i], slope21: slope21[i], slopeZ: slopeZ[i],
      stackScore, alignmentCount, basis
    });
    prevRegime=regime;
  }
  return out;
}
function regimeInfoForRows(rows){
  const haveUpstream = rows.some(r => r.sent_ribbon_regime_raw!==undefined || r.sent_ribbon_regime_score!==undefined);
  if(!haveUpstream) return deriveRegimeInfo(rows);
  return rows.map((r,i)=>({
    regime: r.sent_ribbon_regime_raw || 'Flat',
    regimeScore: num(r.sent_ribbon_regime_score) ?? 0,
    confidence: num(r.sent_ribbon_regime_confidence) ?? 0,
    compression: Boolean(Number(r.sent_ribbon_compression_flag||0)),
    transition: Boolean(Number(r.sent_ribbon_transition_flag||0)),
    transitionType: r.sent_ribbon_transition_type || null,
    widthRaw: num(r.sent_ribbon_width_raw),
    widthAbs: num(r.sent_ribbon_width_abs),
    widthZ: num(r.sent_ribbon_width_z),
    slope21: num(r.sent_ribbon_center_slope_21),
    slopeZ: num(r.sent_ribbon_center_slope_21_z),
    stackScore: num(r.sent_ribbon_stack_score),
    alignmentCount: num(r.sent_ribbon_alignment_count),
    basis: 'upstream'
  }));
}
function buildRegimeBadgesHTML(current, lastTransitionRow, lastTransitionInfo){
  const cls = current.regime==='Bullish' ? 'badge-bull' : current.regime==='Bearish' ? 'badge-bear' : 'badge-flat';
  const conf=(current.confidence ?? 0).toFixed(0);
  const score=(current.regimeScore ?? 0).toFixed(0);
  const widthState=current.compression ? 'Compressed' : ((current.widthZ ?? 0)>=0 ? 'Expanding' : 'Narrowing');
  const transitionText = lastTransitionRow ? `${lastTransitionInfo.transitionType || 'state change'} on ${lastTransitionRow.date}` : 'none in view';
  return [
    `<span class="badge ${cls}"><b>Sentiment Ribbon</b> ${current.regime}</span>`,
    `<span class="badge badge-neutral"><b>Confidence</b> ${conf}</span>`,
    `<span class="badge badge-neutral"><b>Score</b> ${score}</span>`,
    `<span class="badge badge-neutral"><b>Width</b> ${widthState}</span>`,
    `<span class="badge badge-neutral"><b>Last transition</b> ${transitionText}</span>`
  ].join('');
}
function pushRegimeSegmentedBundle(data, x, y, name, axis, hovertemplate, width, period, regimeInfo){
  const basePalette=sentimentPalette(period);
  [
    traceLine(x,y,name+' base glow 1',basePalette.outer,Math.max(1,width+3.2),'solid',axis,false,null,0.12,true),
    traceLine(x,y,name+' base glow 2',basePalette.inner,Math.max(1,width+1.5),'solid',axis,false,null,0.18,true),
    traceLine(x,y,name+' base',basePalette.core,Math.max(0.9,width*0.98),'solid',axis,false,hovertemplate,0.42,true)
  ].forEach(t=>{ t.legendgroup=name; data.push(t); });

  const segments=[];
  let start=null, current=null;
  for(let i=0;i<y.length;i++){
    const v=num(y[i]);
    const reg=v!==null && regimeInfo[i] ? regimeInfo[i].regime : null;
    if(reg!==current){
      if(current!==null && start!==null) segments.push({start,end:i-1,regime:current});
      current=reg;
      start=reg!==null ? i : null;
    }
  }
  if(current!==null && start!==null) segments.push({start,end:y.length-1,regime:current});
  let legendShown=false;
  segments.forEach(seg=>{
    const segStart=Math.max(0, seg.start - (seg.start>0 ? 1 : 0));
    const segEnd=Math.min(y.length-1, seg.end + (seg.end<y.length-1 ? 1 : 0));
    const sx=x.slice(segStart, segEnd+1);
    const sy=y.slice(segStart, segEnd+1);
    const palette=regimePalette(seg.regime, period);
    const bundle=sentimentBundle(sx, sy, name, axis, !legendShown, hovertemplate, width, palette, true);
    bundle.forEach((t,idx)=>{ t.legendgroup=name; if(idx<2) t.showlegend=false; else if(legendShown) t.showlegend=false; data.push(t); });
    legendShown=true;
  });
  if(!segments.length){
    sentimentBundle(x, y, name, axis, true, hovertemplate, width, regimePalette('Flat', period), true).forEach(t=>data.push(t));
  }
}
function regimeSegments(rows, regimeInfo, visStart, visEnd){
  const segs=[];
  let current=null, startDate=null, endDate=null;
  for(let i=0;i<rows.length;i++){
    const d=rows[i].dateObj;
    if(d<visStart || d>visEnd) continue;
    const reg=regimeInfo[i] ? regimeInfo[i].regime : 'Flat';
    if(reg!==current){
      if(current!==null) segs.push({regime:current,start:startDate,end:endDate});
      current=reg; startDate=d; endDate=d;
    } else { endDate=d; }
  }
  if(current!==null) segs.push({regime:current,start:startDate,end:endDate});
  return segs;
}
function sentimentRibbonSeries(rows, fitRows, visRows, mode){
  const model=robustSharedSentTransform(rows, fitRows, visRows);
  const specs = mode==='full'
    ? [['combined_compound_ma_7','Scaled Sent MA 7',1.0,7],['combined_compound_ma_21','Scaled Sent MA 21',1.15,21],['combined_compound_ma_50','Scaled Sent MA 50',1.0,50],['combined_compound_ma_100','Scaled Sent MA 100',0.95,100],['combined_compound_ma_200','Scaled Sent MA 200',0.9,200]]
    : [['combined_compound_ma_21','Scaled Sent MA 21',1.15,21]];

  const rawCenter=rows.map(r=> model ? applyTransform(r.combined_compound_ma_21, model) : null);
  const scaledCenter=rows.map(r=> num(r.scaled_combined_compound_ma_21));
  const smoothRawCenter=smoothFiniteSeries(rawCenter, 9);
  const smoothScaledCenter=smoothFiniteSeries(scaledCenter, 11);
  let centerSeries=rows.map((r,i)=>{
    const raw=smoothRawCenter[i]!==null ? smoothRawCenter[i] : rawCenter[i];
    const scaled=smoothScaledCenter[i]!==null ? smoothScaledCenter[i] : scaledCenter[i];
    if(raw===null) return scaled;
    if(scaled===null) return raw;
    const prevRaw=i>0 && smoothRawCenter[i-1]!==null ? smoothRawCenter[i-1] : (i>0 ? rawCenter[i-1] : null);
    const prevScaled=i>0 && smoothScaledCenter[i-1]!==null ? smoothScaledCenter[i-1] : (i>0 ? scaledCenter[i-1] : null);
    const rawJump=prevRaw!==null ? Math.abs(raw-prevRaw) : 0;
    const scaledJump=prevScaled!==null ? Math.abs(scaled-prevScaled) : 0;
    const gap=Math.abs(raw-scaled);
    const anchorBand=Math.max(8, Math.abs(scaled)*0.015, scaledJump*4);
    const gapPenalty=Math.min(1, gap/(anchorBand*2));
    const jumpPenalty=Math.min(1, Math.max(0, rawJump-scaledJump)/(anchorBand*1.5));
    const rawWeight=Math.max(0.10, Math.min(0.45, 0.45*(1-gapPenalty)*(1-jumpPenalty)));
    return scaled*(1-rawWeight) + raw*rawWeight;
  });
  centerSeries=smoothFiniteSeries(centerSeries, 5).map((v,i)=> v!==null ? v : (smoothScaledCenter[i]!==null ? smoothScaledCenter[i] : scaledCenter[i]));

  if(mode!=='full'){
    return {
      series: [{name:'Scaled Sent MA 21', width:1.15, period:21, palette:sentimentPalette(21), y:centerSeries}],
      usedScaledFallback:false,
      usedHybridOffsets:false,
      model
    };
  }

  const offsetWindowForPeriod=(period)=> period<=21 ? 15 : (period<=50 ? 21 : 31);
  const familySeries=specs.map(([rawCol,name,w,period])=>{
    if(period===21){
      return {name, width:w, period, palette:sentimentPalette(period), y:centerSeries};
    }
    const scaledCol='scaled_'+rawCol;
    const rawSeries=rows.map(r=> model ? applyTransform(r[rawCol], model) : null);
    const raw21Series=centerSeries;
    const rawOffsets=rawSeries.map((v,i)=> v!==null && raw21Series[i]!==null ? v-raw21Series[i] : null);
    const smoothRawOffsets=smoothFiniteSeries(rawOffsets, offsetWindowForPeriod(period));
    const scaledOffsets=rows.map(r=>{
      const base=num(r.scaled_combined_compound_ma_21);
      const target=num(r[scaledCol]);
      return base!==null && target!==null ? target-base : null;
    });
    const structuralOffsets=smoothFiniteSeries(scaledOffsets, offsetWindowForPeriod(period));
    const y=rows.map((r,i)=>{
      const center=centerSeries[i];
      const structural=structuralOffsets[i];
      const rawOffset=smoothRawOffsets[i]!==null ? smoothRawOffsets[i] : rawOffsets[i];
      if(center===null) return null;
      if(structural!==null){
        const blended=rawOffset!==null ? (0.15*rawOffset + 0.85*structural) : structural;
        return center + blended;
      }
      if(rawOffset!==null) return center + rawOffset;
      const scaled=num(r[scaledCol]);
      return scaled!==null ? scaled : center;
    });
    return {name, width:w, period, palette:sentimentPalette(period), y};
  });

  return {
    series: familySeries,
    usedScaledFallback:false,
    usedHybridOffsets:true,
    model
  };
}

function displayedOverlap(priceUp, priceLow, sentUp, sentLow){
  const up=[], low=[];
  for(let i=0;i<priceUp.length;i++){
    const pu=num(priceUp[i]), pl=num(priceLow[i]), su=num(sentUp[i]), sl=num(sentLow[i]);
    if([pu,pl,su,sl].some(v=>v===null)){ up.push(null); low.push(null); continue; }
    const lo=Math.max(pl,sl), hi=Math.min(pu,su);
    if(hi>=lo){ up.push(hi); low.push(lo); } else { up.push(null); low.push(null); }
  }
  return {up,low};
}
function overlapBandsForTableau(rows, derivedOverlap){
  const up=[], low=[], source=[];
  for(let i=0;i<rows.length;i++){
    const r=rows[i]||{};
    const advUp = num(r.boll_upper_overlap_advanced);
    const advLow = num(r.boll_lower_overlap_advanced);
    const bandUp = num(r.boll_upper_overlap_band);
    const bandLow = num(r.boll_lower_overlap_band);
    const derUp = num(derivedOverlap?.up?.[i]);
    const derLow = num(derivedOverlap?.low?.[i]);

    if(advUp!==null && advLow!==null){
      up.push(advUp); low.push(advLow); source.push('advanced');
    } else if(bandUp!==null && bandLow!==null){
      up.push(bandUp); low.push(bandLow); source.push('precomputed_band');
    } else if(derUp!==null && derLow!==null){
      up.push(derUp); low.push(derLow); source.push('derived_fallback');
    } else {
      up.push(null); low.push(null); source.push('missing');
    }
  }
  return {up,low,source};
}
function contextualCalibrationSpec(rangePreset, calendar){
  const continuous = calendar==='continuous';
  const map = {
    '1M': {window: continuous ? 30 : 21, minPeriods: continuous ? 14 : 12, smooth: 3},
    '3M': {window: continuous ? 90 : 63, minPeriods: continuous ? 28 : 20, smooth: 5},
    '6M': {window: continuous ? 120 : 84, minPeriods: continuous ? 32 : 24, smooth: 5},
    'YTD': {window: continuous ? 120 : 84, minPeriods: continuous ? 32 : 24, smooth: 5},
    '1Y': {window: continuous ? 180 : 126, minPeriods: continuous ? 48 : 32, smooth: 7},
    'All': {window: continuous ? 180 : 126, minPeriods: continuous ? 48 : 32, smooth: 7}
  };
  return {...(map[rangePreset] || map['3M']), qLo:0.05, qHi:0.95};
}
function computeContextualSentimentBands(rows, rangePreset, calendar){
  const spec=contextualCalibrationSpec(rangePreset, calendar);
  const centers=rows.map(r=>num(r.combined_compound_ma_7) ?? num(r.combined_compound_ma_21));
  const sentUpRaw=rows.map(r=>num(r.sentiment_upper_band));
  const sentLowRaw=rows.map(r=>num(r.sentiment_lower_band));
  const closes=rows.map(r=>num(r.close) ?? num(r.close_ma_21));
  const up=new Array(rows.length).fill(null), low=new Array(rows.length).fill(null), basis=new Array(rows.length).fill(null), source=new Array(rows.length).fill('missing');
  const {window, minPeriods, smooth, qLo, qHi}=spec;
  for(let i=0;i<rows.length;i++){
    const start=Math.max(0, i-window+1);
    const rawVals=[], priceVals=[];
    for(let j=start;j<=i;j++){
      const rv=num(centers[j]);
      const pv=num(closes[j]);
      if(rv!==null && Number.isFinite(rv)) rawVals.push(rv);
      if(pv!==null && Number.isFinite(pv)) priceVals.push(pv);
    }
    const curUp=num(sentUpRaw[i]), curLow=num(sentLowRaw[i]);
    if(curUp===null || curLow===null || rawVals.length<minPeriods || priceVals.length<minPeriods) continue;
    const rawLo=quantile(rawVals, qLo), rawHi=quantile(rawVals, qHi), rawMid=quantile(rawVals, 0.5);
    const priceLo=quantile(priceVals, qLo), priceHi=quantile(priceVals, qHi), priceMid=quantile(priceVals, 0.5);
    let a=null;
    if([rawLo, rawHi, priceLo, priceHi].every(v=>v!==null && Number.isFinite(v)) && Math.abs(rawHi-rawLo) > 1e-12){
      a=(priceHi-priceLo)/(rawHi-rawLo);
    }
    if(a===null || !Number.isFinite(a) || Math.abs(a) < 1e-12){
      const sRaw=stddev(rawVals), sPrice=stddev(priceVals);
      if(sRaw!==null && sPrice!==null && Number.isFinite(sRaw) && Number.isFinite(sPrice) && sRaw > 1e-12){
        a=sPrice/sRaw;
      }
    }
    if(a===null || !Number.isFinite(a) || Math.abs(a) < 1e-12 || rawMid===null || priceMid===null) continue;
    const b=priceMid - a*rawMid;
    up[i]=a*curUp + b;
    low[i]=a*curLow + b;
    const center=num(centers[i]);
    basis[i]=center===null ? null : a*center + b;
    source[i]='contextual';
  }
  return {up:smoothFiniteSeries(up, smooth), low:smoothFiniteSeries(low, smooth), basis:smoothFiniteSeries(basis, smooth), source, spec};
}
function deriveAdvancedOverlapBands(priceUp, priceLow, sentUp, sentLow){
  const up=[], low=[], source=[];
  for(let i=0;i<priceUp.length;i++){
    const pu=num(priceUp[i]), pl=num(priceLow[i]), su=num(sentUp[i]), sl=num(sentLow[i]);
    if([pu,pl,su,sl].some(v=>v===null)){ up.push(null); low.push(null); source.push('missing'); continue; }
    let upper=null, lower=null;
    if(pu >= sl && su >= pl){
      upper = Math.max(Math.min(pu, su), pl);
      lower = Math.min(Math.max(pl, sl), pu);
      source.push('contextual_intersection');
    } else {
      upper = Math.abs(pu - sl) < Math.abs(su - pl) ? Math.max(pu, pl) : Math.max(su, pl);
      lower = Math.abs(pl - su) < Math.abs(sl - pu) ? Math.min(pl, pu) : Math.min(sl, pu);
      source.push('contextual_nearest');
    }
    if(upper!==null && lower!==null && upper < lower){
      const lo=Math.min(upper, lower), hi=Math.max(upper, lower);
      lower=lo; upper=hi;
    }
    up.push(upper); low.push(lower);
  }
  return {up, low, source};
}
function chooseOverlapModel(rows, priceBands, mappedBands, rangePreset, calendar, bollinger){
  if(bollinger==='contextual' || bollinger==='both'){
    const contextualBands = computeContextualSentimentBands(rows, rangePreset, calendar);
    const overlap = deriveAdvancedOverlapBands(priceBands.up, priceBands.low, contextualBands.up, contextualBands.low);
    return {
      family:'contextual',
      label:'Contextual Overlap',
      overlap:{...overlap, family:'contextual'},
      sentimentBands:contextualBands
    };
  }
  const ovRaw=displayedOverlap(priceBands.up,priceBands.low,mappedBands.up,mappedBands.low);
  const overlap=overlapBandsForTableau(rows, ovRaw);
  return {
    family:'canonical',
    label:'Canonical Overlap',
    overlap:{...overlap, family:'canonical'},
    sentimentBands:mappedBands
  };
}
function finiteQuantile(values, q){
  const xs=values.filter(v=>Number.isFinite(v)).slice().sort((a,b)=>a-b);
  if(!xs.length) return null;
  if(xs.length===1) return xs[0];
  const pos=(xs.length-1)*q, lo=Math.floor(pos), hi=Math.ceil(pos);
  if(lo===hi) return xs[lo];
  const w=pos-lo;
  return xs[lo]*(1-w)+xs[hi]*w;
}

function overlapVolatilityState(row){
  const txt=String(row?.boll_volatility_flag || '').trim().toLowerCase();
  if(txt==='high') return 'High';
  if(txt==='low' || txt==='stability' || txt==='stable') return 'Low';
  const n=num(row?.boll_volatility_flag_num);
  if(n!==null) return n>0 ? 'High' : 'Low';
  return 'Low';
}
function overlapOutsideType(row, overlap, idx){
  const c=num(row.close) ?? num(row.close_fill);
  const ou=num(overlap.up[idx]), ol=num(overlap.low[idx]);
  if(c===null || ou===null || ol===null) return null;
  if(c>ou) return 'bearish';
  if(c<ol) return 'bullish';
  return null;
}
function explicitHighVolumeState(row){
  const hv20=num(row?.high_volume_20);
  if(hv20!==null) return {known:true, high:hv20>0, source:'high_volume_20'};
  const hv7=num(row?.high_volume_7);
  if(hv7!==null) return {known:true, high:hv7>0, source:'high_volume_7'};
  const txt=String(row?.boll_overlap_volume_confirmation_flag || '').trim().toLowerCase();
  if(txt.includes('high')) return {known:true, high:true, source:'boll_overlap_volume_confirmation_flag'};
  if(txt.includes('normal') || txt.includes('low')) return {known:true, high:false, source:'boll_overlap_volume_confirmation_flag'};
  const confirmed=num(row?.boll_overlap_break_confirmed_high_volume);
  if(confirmed!==null) return {known:true, high:confirmed>0, source:'boll_overlap_break_confirmed_high_volume'};
  const signalConfirmed=num(row?.signal_boll_overlap_break_confirmed_high_volume);
  if(signalConfirmed!==null) return {known:true, high:signalConfirmed>0, source:'signal_boll_overlap_break_confirmed_high_volume'};
  return {known:false, high:false, source:'missing'};
}
function inferredHighVolumeState(rows, idx, window=60){
  const row=rows?.[idx] || {};
  const cur=num(row.volume);
  if(cur===null || !Number.isFinite(cur) || cur<=0) return {known:false, high:false, source:'volume_missing'};
  const vals=[];
  for(let j=Math.max(0, idx-window+1); j<=idx; j++){
    const v=num(rows[j]?.volume);
    if(v!==null && Number.isFinite(v) && v>0) vals.push(v);
  }
  if(vals.length<15) return {known:false, high:false, source:'volume_short_history'};
  const q60=finiteQuantile(vals, 0.60);
  const q75=finiteQuantile(vals, 0.75);
  const high = q60!==null && cur>=q60;
  const elevated = q75!==null && cur>=q75;
  return {known:true, high, elevated, source:elevated?'volume_q75':'volume_q60'};
}
function activeHighVolumeState(row, rows=null, idx=0){
  const explicit=explicitHighVolumeState(row);
  if(explicit.known) return explicit;
  if(rows && rows.length) return inferredHighVolumeState(rows, idx);
  return explicit;
}
function currentHighVolumeState(row){
  return explicitHighVolumeState(row).high;
}

function sourceFieldText(row, ...cols){
  for(const col of cols){
    const v=row?.[col];
    if(v!==undefined && v!==null && String(v).trim()!=='') return String(v).trim();
  }
  return '';
}
function sourceAlertDirection(row, fallbackType=null){
  const txt=sourceFieldText(row,
    'boll_overlap_alert_direction','boll_overlap_break_direction_raw','boll_overlap_event_type','boll_overlap_signal','boll_overlap_signal_raw','seta_alert_context_label'
  ).toLowerCase();
  if(txt.includes('bullish')) return 'bullish';
  if(txt.includes('bearish')) return 'bearish';
  const code=num(row?.boll_overlap_signal_code ?? row?.boll_overlap_state_code);
  if(code!==null){
    if(code>0) return 'bullish';
    if(code<0) return 'bearish';
  }
  if(truthyFlag(row,'signal_boll_overlap_bullish')) return 'bullish';
  if(truthyFlag(row,'signal_boll_overlap_bearish')) return 'bearish';
  return fallbackType;
}
function sourceAlertQuality(row){
  const direct=num(row?.boll_overlap_alert_quality_score);
  if(direct!==null) return direct;
  const strength=num(row?.boll_overlap_signal_strength_abs);
  if(strength!==null) return strength;
  const dist=num(row?.boll_overlap_break_distance_pct_band);
  if(dist!==null) return Math.max(0, Math.min(100, dist*200));
  return null;
}
function sourceConfirmedAlertType(row, fallbackType=null){
  const tier=sourceFieldText(row,'boll_overlap_alert_tier').toLowerCase();
  const directConfirmed = truthyFlag(row,'boll_overlap_break_confirmed_high_volume')
    || truthyFlag(row,'signal_boll_overlap_break_confirmed_high_volume')
    || (tier && tier.includes('confirmed'));
  if(!directConfirmed) return null;
  return sourceAlertDirection(row, fallbackType);
}
function sourceVolatilityState(row){
  if(truthyFlag(row,'signal_boll_overlap_high_volatility')) return 'High';
  const tier=sourceFieldText(row,'boll_overlap_alert_tier').toLowerCase();
  if(tier.includes('confirmed')) return 'High';
  const quality=sourceAlertQuality(row);
  if(quality!==null && quality>=65) return 'High';
  return 'Low';
}
function materialOutsideState(row, overlap, idx){
  const type=overlapOutsideType(row, overlap, idx);
  if(!type) return {type:null, outsidePct:null, material:false};
  const c=num(row.close) ?? num(row.close_fill);
  const rim=type==='bullish' ? num(overlap.low[idx]) : num(overlap.up[idx]);
  const outsidePct=(c!==null && rim!==null && Math.abs(rim)>1e-9) ? Math.abs(c-rim)/Math.abs(rim) : null;
  return {type, outsidePct, material: outsidePct!==null && outsidePct>=0.003};
}
function upstreamLegacySignalType(row){
  const buy=num(row?.buy), sell=num(row?.sell);
  const buySignal=num(row?.buy_signal ?? row?.Buy_Signal ?? row?.['Buy Signal']);
  const sellSignal=num(row?.sell_signal ?? row?.Sell_Signal ?? row?.['Sell Signal']);
  const bullish = (buy!==null && buy>0 && (sell===null || buy>=sell)) || (buySignal!==null && buySignal>0);
  const bearish = (sell!==null && sell>0 && (buy===null || sell>buy)) || (sellSignal!==null && sellSignal>0);
  if(bullish && !bearish) return 'bullish';
  if(bearish && !bullish) return 'bearish';
  if(bullish && bearish){
    if((buy??0)>(sell??0)) return 'bullish';
    if((sell??0)>(buy??0)) return 'bearish';
  }
  return null;
}
function currentAssetTerm(){
  return document.getElementById('asset')?.value || null;
}
function assetUniverseType(term, rows){
  const t=String(term || '').trim().toUpperCase();
  const cryptoSet=new Set(['BTC','ETH','SOL','DOGE','AVAX','LINK','BNB','XRP','ADA','LTC','DOT','TRX','ATOM','MATIC','SUI','PEPE','SHIB','HYPE']);
  if(cryptoSet.has(t)) return 'crypto';
  const calendar = rows && rows.length ? String(rows[0]?.asset_calendar || '').trim().toLowerCase() : '';
  if(calendar==='continuous') return 'crypto';
  return 'equity_like';
}
function activeOverlapVolatilityState(rows, overlap, idx, window=40, universe='equity_like'){
  if(overlap?.family!=='contextual') return overlapVolatilityState(rows[idx]);
  const widths=[];
  for(let j=Math.max(0, idx-window+1); j<=idx; j++){
    const w=overlapWidthAt(overlap, j);
    if(w!==null) widths.push(w);
  }
  if(widths.length < 20) return overlapVolatilityState(rows[idx]);
  const current = overlapWidthAt(overlap, idx);
  if(current===null) return overlapVolatilityState(rows[idx]);
  const q = universe==='crypto' ? 0.80 : 0.65;
  const threshold = finiteQuantile(widths, q);
  if(threshold!==null && current>=threshold) return 'High';
  const m = mean(widths), s = stddev(widths);
  if(m!==null && s!==null && current > (m + 0.75*s)) return 'High';
  return 'Low';
}
function overlapConfirmationMeta(row, overlap, idx, rows=null, term=null){
  const rowsUse = rows || [row];
  const idxUse = rows ? idx : 0;
  const universe=assetUniverseType(term || currentAssetTerm(), rowsUse);
  const outsideState=materialOutsideState(row, overlap, idx);
  const overlapType=outsideState.type;
  const upstreamType=upstreamLegacySignalType(row);
  const directSourceType=sourceConfirmedAlertType(row, overlapType || upstreamType);
  const type=overlapType || directSourceType || upstreamType;
  const signalSource=overlapType ? 'active_overlap' : (directSourceType ? 'source_alert' : (upstreamType ? 'upstream_signal' : 'none'));
  const legacyVol=overlapVolatilityState(row);
  const contextualVol=activeOverlapVolatilityState(rowsUse, overlap, idxUse, universe);
  const sourceVol=sourceVolatilityState(row);
  const structure=overlapStructureAt(rowsUse, overlap, idxUse);
  const structuralVol=structure==='Expansion' ? 'High' : 'Low';
  const volumeState=activeHighVolumeState(row, rowsUse, idxUse);
  const highVolume=volumeState.high;
  const quality=sourceAlertQuality(row);
  if(!type) return {type:null, confirmed:false, policy:'none', universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume, volumeSource:volumeState.source, signalSource, quality, structure, detail:'Inside active overlap'};

  // Explicit source-confirmed rows are authoritative if the chart can determine a direction.
  // This lets the dashboard consume the richer upstream overlap-alert fields when present.
  if(directSourceType){
    return {type:directSourceType, confirmed:true, policy:'source_confirmed', universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume:true, volumeSource:volumeState.source, signalSource:'source_alert', quality, structure, detail:'Source alert confirmation from enriched overlap-alert fields'};
  }

  // Upstream legacy buy/sell counts are already multi-window confirmed signals. They
  // restore the prior candlestick diamonds while the overlap model remains primary.
  if(signalSource==='upstream_signal'){
    return {type, confirmed:true, policy:universe==='crypto' ? 'legacy' : 'hybrid', universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume, volumeSource:volumeState.source, signalSource, upstreamSignal:true, quality, structure, detail:'Upstream legacy signal confirmation from multi-window Bollinger counts'};
  }

  if(!highVolume) return {type:null, confirmed:false, policy:universe==='crypto' ? 'hybrid_watch' : 'hybrid', universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume, volumeSource:volumeState.source, signalSource, quality, structure, detail:'Outside active overlap but high-volume confirmation is absent'};

  // Fix 26 parity update: volume remains the hard confirmation gate, but volatility
  // can now be satisfied by any of the source-aware signals we intentionally create:
  // legacy overlap volatility, contextual width expansion, explicit source volatility,
  // active structural expansion, or a high quality upstream overlap event.
  const highQuality = quality!==null && quality >= (universe==='crypto' ? 65 : 55);
  const confirmed = (legacyVol==='High' || contextualVol==='High' || sourceVol==='High' || structuralVol==='High' || highQuality);
  const usedContextual = legacyVol!=='High' && contextualVol==='High';
  const usedStructural = legacyVol!=='High' && contextualVol!=='High' && sourceVol!=='High' && structuralVol==='High';
  const usedQuality = legacyVol!=='High' && contextualVol!=='High' && sourceVol!=='High' && structuralVol!=='High' && highQuality;
  let policy = universe==='crypto' ? (usedContextual ? 'crypto_contextual' : 'legacy') : 'hybrid';
  if(sourceVol==='High') policy='source_volatility';
  if(usedStructural) policy='structural_expansion';
  if(usedQuality) policy='quality_gate';
  const gateLabel = sourceVol==='High' ? 'source volatility' : (usedStructural ? 'structural expansion' : (usedQuality ? 'source quality' : (usedContextual ? 'contextual volatility' : 'High volatility')));
  return {type:confirmed ? type : null, confirmed, policy, universe, legacyVol, contextualVol, sourceVol, structuralVol, highVolume, volumeSource:volumeState.source, signalSource, usedContextual, usedStructural, usedQuality, quality, structure, detail: confirmed ? `Confirmation: outside overlap + ${gateLabel} + High volume` : 'Confirmation failed: no volatility, structural expansion, or quality gate passed'};
}
function overlapConfirmedEventType(row, overlap, idx, rows=null, term=null){
  return overlapConfirmationMeta(row, overlap, idx, rows, term).type;
}
function overlapWatchCandidateMeta(row, overlap, idx, rows=null, term=null){
  const rowsUse = rows || [row];
  const idxUse = rows ? idx : 0;
  const confirmedMeta = overlapConfirmationMeta(row, overlap, idx, rows, term);
  if(confirmedMeta.type) return {...confirmedMeta, watch:false, confirmed:true};

  const universe=assetUniverseType(term || currentAssetTerm(), rowsUse);
  const type=overlapOutsideType(row, overlap, idx);
  if(!type) return {type:null, watch:false, confirmed:false, detail:'Inside active overlap'};

  const legacyVol=overlapVolatilityState(row);
  const contextualVol=activeOverlapVolatilityState(rowsUse, overlap, idxUse, universe);
  const volumeState=activeHighVolumeState(row, rowsUse, idxUse);
  const widthNow=overlapWidthAt(overlap, idx);
  const widthPrev=idx>0 ? overlapWidthAt(overlap, idx-1) : null;
  const widthExpanding=(widthNow!==null && widthPrev!==null && widthNow>widthPrev);
  const c=num(row.close) ?? num(row.close_fill);
  const rim=type==='bullish' ? num(overlap.low[idx]) : num(overlap.up[idx]);
  const outsidePct=(c!==null && rim!==null && Math.abs(rim)>1e-9) ? Math.abs(c-rim)/Math.abs(rim) : null;
  const materialOutside = outsidePct!==null && outsidePct>=0.003;

  const reasons=[];
  if(volumeState.high) reasons.push('volume elevated');
  else if(volumeState.known) reasons.push('volume normal');
  else reasons.push('volume unknown');
  if(legacyVol==='High') reasons.push('legacy volatility high');
  if(contextualVol==='High') reasons.push('contextual expansion high');
  if(widthExpanding) reasons.push('overlap width expanding');
  if(materialOutside) reasons.push('material outside break');

  const watch = contextualVol==='High' || legacyVol==='High' || volumeState.high || (widthExpanding && materialOutside);
  return {
    type: watch ? type : null,
    watch,
    confirmed:false,
    policy:universe==='crypto' ? 'crypto_watch' : 'equity_watch',
    universe,
    legacyVol,
    contextualVol,
    highVolume:volumeState.high,
    volumeSource:volumeState.source,
    signalSource:'active_overlap',
    outsidePct,
    detail: watch ? `Watch candidate: outside active overlap; ${reasons.join('; ')}` : 'Outside active overlap but watch filters did not pass'
  };
}
function computeAlertDiagnosticInfo(rows, overlap, visibleMask, term=null){
  const info={outside:0, volume:0, volatility:0, confirmed:0, watch:0};
  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;
    const outside=overlapOutsideType(rows[i], overlap, i);
    if(outside) info.outside += 1;
    const universe=assetUniverseType(term || currentAssetTerm(), rows);
    const legacyVol=overlapVolatilityState(rows[i]);
    const contextualVol=activeOverlapVolatilityState(rows, overlap, i, universe);
    const sourceVol=sourceVolatilityState(rows[i]);
    const structure=overlapStructureAt(rows, overlap, i);
    const quality=sourceAlertQuality(rows[i]);
    if(legacyVol==='High' || contextualVol==='High' || sourceVol==='High' || structure==='Expansion' || (quality!==null && quality>=(universe==='crypto'?65:55))) info.volatility += 1;
    if(activeHighVolumeState(rows[i], rows, i).high) info.volume += 1;
    const meta=overlapConfirmationMeta(rows[i], overlap, i, rows, term);
    if(meta.type) info.confirmed += 1;
    else if(overlapWatchCandidateMeta(rows[i], overlap, i, rows, term).type) info.watch += 1;
  }
  return info;
}
function overlapMidAt(overlap, idx){
  const ou=num(overlap.up[idx]), ol=num(overlap.low[idx]);
  if(ou===null || ol===null) return null;
  return (ou + ol) / 2;
}
function priorFiniteFrom(getter, idx, lookback){
  for(let j=Math.max(0, idx-lookback); j<=idx; j++){
    const v=getter(j);
    if(v!==null && Number.isFinite(v)) return {idx:j, value:v};
  }
  return null;
}
function overlapTrendContext(rows, overlap, idx, lookback=5){
  const currentMid = overlapMidAt(overlap, idx);
  const currentWidth = overlapWidthAt(overlap, idx);
  if(currentMid===null) return {midSlopePct:null, midAccelPct:null, widthSlopePct:null};

  const prevMidRef = priorFiniteFrom(j=>overlapMidAt(overlap,j), idx-1, lookback);
  const prevPrevMidRef = priorFiniteFrom(j=>overlapMidAt(overlap,j), (prevMidRef?.idx ?? idx)-1, lookback);
  const prevWidthRef = priorFiniteFrom(j=>overlapWidthAt(overlap,j), idx-1, lookback);

  const denom = prevMidRef && Math.abs(prevMidRef.value) > 1e-9 ? Math.abs(prevMidRef.value) : Math.max(Math.abs(currentMid), 1e-9);
  const midSlopePct = prevMidRef ? (currentMid - prevMidRef.value) / denom : null;

  let prevSlopePct = null;
  if(prevMidRef && prevPrevMidRef){
    const prevDenom = Math.abs(prevPrevMidRef.value) > 1e-9 ? Math.abs(prevPrevMidRef.value) : Math.max(Math.abs(prevMidRef.value), 1e-9);
    prevSlopePct = (prevMidRef.value - prevPrevMidRef.value) / prevDenom;
  }

  const midAccelPct = (midSlopePct!==null && prevSlopePct!==null) ? (midSlopePct - prevSlopePct) : null;
  const widthSlopePct = (currentWidth!==null && prevWidthRef && Math.abs(prevWidthRef.value) > 1e-9)
    ? (currentWidth - prevWidthRef.value) / Math.abs(prevWidthRef.value)
    : null;

  return {midSlopePct, midAccelPct, widthSlopePct};
}
function confirmedContextProfile(rows, overlap, idx){
  const meta = overlapConfirmationMeta(rows[idx], overlap, idx, rows, currentAssetTerm());
  const type = meta.type;
  if(!type){
    return {label:'Unconfirmed', code:'unconfirmed', detail: meta.detail || 'No confirmed overlap alert on this bar.', midSlopePct:null, midAccelPct:null, widthSlopePct:null};
  }
  const trend = overlapTrendContext(rows, overlap, idx);
  const slope = trend.midSlopePct;
  const accel = trend.midAccelPct;
  const widthSlope = trend.widthSlopePct;

  const widthExpanding = widthSlope!==null && widthSlope >= 0.10;
  const hardDown = slope!==null && slope <= -0.025;
  const hardUp = slope!==null && slope >= 0.025;
  const accelDown = accel!==null && accel <= -0.008;
  const accelUp = accel!==null && accel >= 0.008;

  if(type==='bullish' && hardDown && (accelDown || widthExpanding)){
    return {
      label:'Countertrend',
      code:'countertrend',
      detail:'Confirmed bullish pressure, but the overlap corridor is still falling aggressively. Treat as a countertrend reversal attempt, not a clean trend-aligned long.',
      ...trend
    };
  }
  if(type==='bearish' && hardUp && (accelUp || widthExpanding)){
    return {
      label:'Countertrend',
      code:'countertrend',
      detail:'Confirmed bearish pressure, but the overlap corridor is still rising aggressively. Treat as a countertrend fade attempt, not a clean trend-aligned short.',
      ...trend
    };
  }
  return {
    label:'Trend-Aligned',
    code:'trend_aligned',
    detail:`Confirmed ${type} pressure is aligned with the active overlap corridor context. ${meta.policy==='hybrid' ? 'Hybrid policy active.' : 'Legacy policy active.'}`,
    ...trend
  };
}

function overlapPlaybookProfile(rows, overlap, idx){
  const structure = overlapStructureAt(rows, overlap, idx);
  const currentEvent = overlapCurrentEventType(rows, overlap, idx);
  const state = overlapStateAt(rows, overlap, idx);
  const context = confirmedContextProfile(rows, overlap, idx);
  const trend = overlapTrendContext(rows, overlap, idx);
  const outside = overlapOutsideType(rows[idx], overlap, idx);
  const slope = trend.midSlopePct;
  const accel = trend.midAccelPct;
  const widthSlope = trend.widthSlopePct;

  let tag = 'Inside Expected Range';
  let family = 'Baseline';
  let detail = 'Price remains inside the active overlap corridor. Use the overlap rim as the current shared expectation boundary.';
  let confidence = 'Low';

  if(currentEvent==='Compression' || structure==='Compression'){
    tag = 'Compression Coil';
    family = 'Bollinger';
    detail = 'The active overlap has compressed relative to its recent width. This often precedes directional expansion but does not choose direction on its own.';
    confidence = 'Medium';
  } else if(currentEvent==='Expansion' || structure==='Expansion'){
    tag = 'Expansion Shock';
    family = 'Bollinger';
    detail = 'The active overlap has expanded materially. Expect wider expected-range behavior and less forgiving mean reversion.';
    confidence = 'Medium';
  }

  if(currentEvent==='Re-entry from Below' || currentEvent==='Re-entry from Above'){
    tag = 'Failed Break / Re-entry';
    family = 'Bollinger';
    detail = 'Price has moved back into the active overlap after breaching it. This behaves more like a failed break than a clean trend continuation.';
    confidence = 'Medium';
  } else if(currentEvent==='Bullish Rejection' || currentEvent==='Bearish Rejection'){
    tag = currentEvent;
    family = 'Bollinger';
    detail = 'Price tested the active overlap edge and failed to hold beyond it, suggesting rejection at the corridor boundary.';
    confidence = 'Medium';
  }

  if(outside==='bullish' && state.code==='confirmed_bullish'){
    if(context.code==='countertrend'){
      tag = 'Spring-like Reversal Watch';
      family = 'Wyckoff Analog';
      detail = 'Confirmed bullish pressure exists, but it is countertrend against a still-falling overlap corridor. Treat as a spring-like reversal attempt, not a settled uptrend.';
      confidence = 'Medium';
    } else {
      tag = 'Mean-Reversion Long';
      family = 'Bollinger';
      detail = 'Confirmed bullish pressure is occurring with trend-compatible overlap context. This is closer to a valid reversion long than a panic catch.';
      confidence = 'High';
    }
  } else if(outside==='bearish' && state.code==='confirmed_bearish'){
    if(context.code==='countertrend'){
      tag = 'Upthrust-like Fade Watch';
      family = 'Wyckoff Analog';
      detail = 'Confirmed bearish pressure exists, but it is countertrend against a still-rising overlap corridor. Treat as an upthrust-like fade attempt, not a settled downtrend.';
      confidence = 'Medium';
    } else {
      tag = 'Mean-Reversion Short';
      family = 'Bollinger';
      detail = 'Confirmed bearish pressure is occurring with trend-compatible overlap context. This is closer to a valid reversion short than a blind fade.';
      confidence = 'High';
    }
  } else if(outside==='bullish' && state.code==='bullish_pressure'){
    tag = 'Lower-Rim Reversal Watch';
    family = 'Bollinger';
    detail = 'Price is below the active overlap lower rim, but the move is not fully confirmed. Treat as a developing reversal watch, not a completed signal.';
    confidence = 'Low';
  } else if(outside==='bearish' && state.code==='bearish_pressure'){
    tag = 'Upper-Rim Fade Watch';
    family = 'Bollinger';
    detail = 'Price is above the active overlap upper rim, but the move is not fully confirmed. Treat as a developing fade watch, not a completed signal.';
    confidence = 'Low';
  } else if(structure==='Balanced' && slope!==null){
    if(slope >= 0.02){
      tag = 'Band Walk Up';
      family = 'Bollinger';
      detail = 'The active overlap midline is rising with a balanced corridor. This is more trend-carrying than mean-reverting behavior.';
      confidence = 'Medium';
    } else if(slope <= -0.02){
      tag = 'Band Walk Down';
      family = 'Bollinger';
      detail = 'The active overlap midline is falling with a balanced corridor. This is more trend-carrying than mean-reverting behavior.';
      confidence = 'Medium';
    }
  }

  return {
    tag, family, detail, confidence,
    stateLabel: state.label,
    structure,
    currentEvent,
    contextLabel: context.label,
    midSlopePct: slope,
    midAccelPct: accel,
    widthSlopePct: widthSlope
  };
}

function addOverlapBandWithPlaybook(data, x, upper, lower, rows, overlap, lineColor, fillColor, namePrefix, axis, visibleMask){
  const playbook = rows.map((r,i)=>overlapPlaybookProfile(rows, overlap, i));
  const custom = rows.map((r,i)=>[
    playbook[i]?.tag || 'Inside Expected Range',
    playbook[i]?.family || 'Baseline',
    playbook[i]?.confidence || 'Low',
    playbook[i]?.detail || 'No playbook context available.',
    playbook[i]?.stateLabel || 'Unavailable',
    playbook[i]?.structure || 'Unknown',
    playbook[i]?.contextLabel || 'n/a'
  ]);

  const hover = `%{x|%b %d, %Y}<br><b>${namePrefix}</b> · %{customdata[0]}<br>%{customdata[4]} · %{customdata[5]} · %{customdata[6]} · %{customdata[2]} confidence<br>%{customdata[3]}<br>Rim %{y:.2f}<extra></extra>`;

  data.push({
    type:'scatter', mode:'lines', x:x, y:lower, customdata:custom, name:namePrefix+' Lower',
    xaxis:axis==='y'?'x':axis==='y2'?'x2':axis==='y3'?'x3':'x4', yaxis:axis,
    line:{color:lineColor,width:1.0,dash:'solid',shape:'linear'}, connectgaps:true, showlegend:false,
    hoverinfo:'skip', opacity:0.9
  });
  data.push({
    type:'scatter', mode:'lines', x:x, y:upper, customdata:custom, name:namePrefix+' Upper',
    xaxis:axis==='y'?'x':axis==='y2'?'x2':axis==='y3'?'x3':'x4', yaxis:axis,
    line:{color:lineColor,width:1.0,dash:'solid',shape:'linear'}, connectgaps:true, showlegend:true,
    hovertemplate:hover, fill:'tonexty', fillcolor:fillColor, opacity:0.95
  });
}
function formatPct(v){
  return (v===null || !Number.isFinite(v)) ? 'n/a' : `${(v*100).toFixed(1)}%`;
}

function formatNum(v, digits=1){
  return (v===null || !Number.isFinite(v)) ? 'n/a' : Number(v).toFixed(digits);
}
function overlapWidthAt(overlap, idx){
  const ou=num(overlap.up[idx]), ol=num(overlap.low[idx]);
  if(ou===null || ol===null) return null;
  const w=ou-ol;
  return Number.isFinite(w) ? w : null;
}
function overlapStructureAt(rows, overlap, idx, window=60){
  const current=overlapWidthAt(overlap, idx);
  if(current===null) return 'Unknown';
  const widths=[];
  for(let j=Math.max(0, idx-window+1); j<=idx; j++){
    const w=overlapWidthAt(overlap, j);
    if(w!==null) widths.push(w);
  }
  if(widths.length<20){
    return overlapVolatilityState(rows[idx])==='High' ? 'Expansion' : 'Balanced';
  }
  const q25=finiteQuantile(widths, 0.25);
  const q75=finiteQuantile(widths, 0.75);
  if(q25!==null && current<=q25) return 'Compression';
  if(q75!==null && current>=q75) return 'Expansion';
  return 'Balanced';
}
function truthyFlag(row, col){
  const n=num(row?.[col]);
  if(n!==null) return n>0;
  const s=String(row?.[col] ?? '').trim().toLowerCase();
  return s==='true' || s==='yes' || s==='y';
}
function overlapStateAt(rows, overlap, idx){
  const confirmed=overlapConfirmedEventType(rows[idx], overlap, idx, rows, currentAssetTerm());
  if(confirmed==='bullish') return {label:'Confirmed Bullish Pressure', cls:'badge-bull', code:'confirmed_bullish'};
  if(confirmed==='bearish') return {label:'Confirmed Bearish Pressure', cls:'badge-bear', code:'confirmed_bearish'};
  const outside=overlapOutsideType(rows[idx], overlap, idx);
  if(outside==='bullish') return {label:'Bullish Pressure', cls:'badge-bull', code:'bullish_pressure'};
  if(outside==='bearish') return {label:'Bearish Pressure', cls:'badge-bear', code:'bearish_pressure'};
  return {label:'Inside Expected Range', cls:'badge-neutral', code:'inside_expected_range'};
}
function overlapCurrentEventType(rows, overlap, idx){
  const row=rows[idx] || {};
  if(overlap?.family==='canonical' && truthyFlag(row, 'boll_overlap_reentry_flag')){
    const prevType = idx>0 ? overlapOutsideType(rows[idx-1], overlap, idx-1) : null;
    if(prevType==='bullish') return 'Re-entry from Below';
    if(prevType==='bearish') return 'Re-entry from Above';
    return 'Re-entry';
  }
  if(overlap?.family==='canonical' && truthyFlag(row, 'boll_overlap_rejection_bullish_flag')) return 'Bullish Rejection';
  if(overlap?.family==='canonical' && truthyFlag(row, 'boll_overlap_rejection_bearish_flag')) return 'Bearish Rejection';
  const state=overlapStateAt(rows, overlap, idx);
  if(state.code==='confirmed_bullish' || state.code==='confirmed_bearish') return 'Confirmed Break';
  const structure=overlapStructureAt(rows, overlap, idx);
  if(state.code==='inside_expected_range' && structure==='Compression') return 'Compression';
  if(state.code==='inside_expected_range' && structure==='Expansion') return 'Expansion';
  return 'No Fresh Event';
}
function computeOverlapSignalInfo(rows, overlap, visibleMask){
  let latestIdx=-1;
  for(let i=rows.length-1;i>=0;i--){
    if(!visibleMask[i]) continue;
    const c=num(rows[i].close) ?? num(rows[i].close_fill);
    if(c!==null){ latestIdx=i; break; }
  }
  if(latestIdx<0){
    return {
      stateLabel:'Unavailable', stateCls:'badge-neutral', structure:'Unknown', structureCls:'badge-neutral',
      currentEvent:'No Fresh Event', eventCls:'badge-neutral', condition:'Stability', volume:'Normal Volume',
      context:'Stability · Normal Volume', contextCls:'badge-neutral', narrative:'No valid price bar is available in view.',
      annotation:'Combined overlap model: unavailable', latestConfirmed:'No confirmed alert in view.', modelLabel: overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap'
    };
  }
  const latestRow=rows[latestIdx];
  const state=overlapStateAt(rows, overlap, latestIdx);
  const structure=overlapStructureAt(rows, overlap, latestIdx);
  const currentEvent=overlapCurrentEventType(rows, overlap, latestIdx);
  const latestMeta=overlapConfirmationMeta(latestRow, overlap, latestIdx, rows, currentAssetTerm());
  const highVol=latestMeta.legacyVol==='High';
  const contextualHigh=latestMeta.contextualVol==='High';
  const highVolume=latestMeta.highVolume;
  const condition=highVol ? 'High Volatility' : (contextualHigh ? 'Contextual Volatility' : 'Stability');
  const volume=highVolume ? 'High Volume' : 'Normal Volume';
  const context=`${condition} · ${volume}`;
  const structureCls = structure==='Compression' ? 'badge-neutral' : (structure==='Expansion' ? 'badge-bear' : 'badge-neutral');
  const eventCls = /bullish/i.test(currentEvent) ? 'badge-bull' : (/bearish/i.test(currentEvent) ? 'badge-bear' : 'badge-neutral');
  let latestConfirmed='No confirmed alert in view.';
  for(let i=rows.length-1;i>=0;i--){
    if(!visibleMask[i]) continue;
    const t=overlapConfirmedEventType(rows[i], overlap, i, rows, currentAssetTerm());
    if(t){
      latestConfirmed=`${t==='bearish' ? 'Bearish Pressure' : 'Bullish Pressure'} • ${rows[i].date}`;
      break;
    }
  }
  let narrative='Combined overlap is inside its expected joint range.';
  if(state.code==='confirmed_bullish') narrative=`Price closed below the active overlap range with ${latestMeta.policy==='hybrid' && latestMeta.legacyVol!=='High' && latestMeta.contextualVol==='High' ? 'contextual volatility' : 'High volatility'} and High volume, confirming bullish pressure from the combined overlap model.`;
  else if(state.code==='confirmed_bearish') narrative=`Price closed above the active overlap range with ${latestMeta.policy==='hybrid' && latestMeta.legacyVol!=='High' && latestMeta.contextualVol==='High' ? 'contextual volatility' : 'High volatility'} and High volume, confirming bearish pressure from the combined overlap model.`;
  else if(state.code==='bullish_pressure') narrative='Price is below the advanced overlap range, signaling bullish pressure from the combined overlap model.';
  else if(state.code==='bearish_pressure') narrative='Price is above the advanced overlap range, signaling bearish pressure from the combined overlap model.';
  else if(currentEvent==='Compression') narrative='Combined overlap is compressed relative to its recent width distribution, suggesting a tighter joint expectation range.';
  else if(currentEvent==='Expansion') narrative='Combined overlap is expanded relative to its recent width distribution, suggesting a broader joint expectation range.';
  else if(currentEvent==='Re-entry from Below' || currentEvent==='Re-entry from Above') narrative=`${currentEvent} suggests price has moved back into the combined overlap range.`;
  else if(currentEvent==='Bullish Rejection' || currentEvent==='Bearish Rejection') narrative=`${currentEvent} suggests price tested the advanced overlap boundary and failed to hold outside it.`;
  const modelLabel = overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap';
  const latestConfirmedIdx = (()=>{
    for(let i=rows.length-1;i>=0;i--){
      if(!visibleMask[i]) continue;
      if(overlapConfirmedEventType(rows[i], overlap, i, rows, currentAssetTerm())) return i;
    }
    return -1;
  })();
  const annotation=`${modelLabel}: ${state.label} | ${structure} | ${context}`;
  return {
    stateLabel:state.label,
    stateCls:state.cls,
    structure,
    structureCls,
    currentEvent,
    eventCls,
    condition,
    volume,
    context,
    contextCls:(highVol || highVolume) ? 'badge-bear' : 'badge-neutral',
    narrative,
    annotation,
    latestConfirmed,
    modelLabel
  };
}
function attentionLevelState(row){
  const level=num(row?.attention_level_score) ?? num(row?.attention_regime_score);
  if(level===null) return {label:'Unknown', cls:'badge-neutral', code:'unknown'};
  if(level>=75) return {label:'Extreme', cls:'badge-bear', code:'extreme'};
  if(level>=60) return {label:'Elevated', cls:'badge-attn', code:'elevated'};
  if(level>=40) return {label:'Normal', cls:'badge-neutral', code:'normal'};
  return {label:'Quiet', cls:'badge-neutral', code:'quiet'};
}
function attentionConvictionState(row){
  const c=num(row?.attention_conviction_score_signed);
  if(c===null) return {label:'Mixed / Neutral', cls:'badge-neutral'};
  if(c>=25) return {label:'Bullish Conviction', cls:'badge-bull'};
  if(c<=-25) return {label:'Bearish Conviction', cls:'badge-bear'};
  return {label:'Mixed / Neutral', cls:'badge-neutral'};
}
function attentionRegimeState(row){
  const r=num(row?.attention_regime_score);
  const s=num(row?.attention_spike_score);
  if(r===null && s===null) return {label:'Normal Regime', cls:'badge-neutral'};
  if((s!==null && s>=65) || (r!==null && r>=70)) return {label:'Event Burst', cls:'badge-attn'};
  if(r!==null && r>=55) return {label:'Elevated Participation', cls:'badge-attn'};
  return {label:'Normal Regime', cls:'badge-neutral'};
}
function attentionSoftOverlayRows(rows, visibleMask){
  const out=[];
  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;
    const level=num(rows[i]?.attention_level_score) ?? num(rows[i]?.attention_regime_score);
    const conviction=Math.abs(num(rows[i]?.attention_conviction_score_signed) ?? 0);
    if((level!==null && level>=55) || conviction>=25) out.push(i);
  }
  return out;
}
function attentionStrongOverlayRows(rows, visibleMask){
  const out=[];
  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;
    const regime=num(rows[i]?.attention_regime_score);
    const spike=num(rows[i]?.attention_spike_score);
    if((regime!==null && regime>=55) || (spike!==null && spike>=60)) out.push(i);
  }
  return out;
}
function engagementOverlayShapes(rows, visibleMask, freq){
  const softIdxs=attentionSoftOverlayRows(rows, visibleMask);
  const strongSet=new Set(attentionStrongOverlayRows(rows, visibleMask));
  const shapes=[];
  const widthDays=freq==='W' ? 3 : 0.48;
  for(const i of softIdxs){
    const row=rows[i] || {};
    const d=row.dateObj; if(!(d instanceof Date)) continue;
    const conviction=num(row.attention_conviction_score_signed) ?? 0;
    const level=num(row.attention_level_score) ?? num(row.attention_regime_score) ?? 50;
    const regime=num(row.attention_regime_score) ?? 0;
    const strong=strongSet.has(i);
    const softOpacity=Math.max(0.035, Math.min(0.10, 0.03 + (Math.max(level, Math.abs(conviction))/100)*0.07));
    const fill=conviction>=25 ? `rgba(70,220,120,${softOpacity})` : (conviction<=-25 ? `rgba(255,110,110,${softOpacity})` : `rgba(92,164,255,${softOpacity})`);
    const stroke=conviction>=25 ? 'rgba(70,220,120,0.85)' : (conviction<=-25 ? 'rgba(255,110,110,0.85)' : 'rgba(92,164,255,0.85)');
    const x0=new Date(d); x0.setDate(x0.getDate()-widthDays);
    const x1=new Date(d); x1.setDate(x1.getDate()+widthDays);
    shapes.push({type:'rect',xref:'x',x0:x0,x1:x1,yref:'paper',y0:0.54,y1:0.98,line:{width:0},fillcolor:fill,layer:'below'});
    if(strong){
      const topOpacity=Math.max(0.18, Math.min(0.34, 0.16 + (Math.max(regime, level)/100)*0.18));
      const topFill=conviction>=25 ? `rgba(70,220,120,${topOpacity})` : (conviction<=-25 ? `rgba(255,110,110,${topOpacity})` : `rgba(92,164,255,${topOpacity})`);
      shapes.push({type:'rect',xref:'x',x0:x0,x1:x1,yref:'paper',y0:0.94,y1:0.985,line:{width:0},fillcolor:topFill,layer:'below'});
      shapes.push({type:'line',xref:'x',x0:d,x1:d,yref:'paper',y0:0.54,y1:0.985,line:{color:stroke,width:1.25},layer:'below'});
    }
  }
  return shapes;
}
function computeEngagementInfo(rows, visibleMask){
  let latestIdx=-1;
  for(let i=rows.length-1;i>=0;i--){ if(visibleMask[i]){ latestIdx=i; break; } }
  if(latestIdx<0) return {levelLabel:'Unknown', levelCls:'badge-neutral', convictionLabel:'Mixed / Neutral', convictionCls:'badge-neutral', regimeLabel:'Normal Regime', regimeCls:'badge-neutral', latestSpike:'No elevated attention in view.', latestEvent:'No strong event in view.'};
  const row=rows[latestIdx] || {};
  const level=attentionLevelState(row);
  const conviction=attentionConvictionState(row);
  const regime=attentionRegimeState(row);
  let latestSpike='No elevated attention in view.';
  let latestEvent='No strong event in view.';
  for(let i=rows.length-1;i>=0;i--){
    if(!visibleMask[i]) continue;
    const lvl=num(rows[i]?.attention_level_score) ?? num(rows[i]?.attention_regime_score);
    const cv=Math.abs(num(rows[i]?.attention_conviction_score_signed) ?? 0);
    const rr=num(rows[i]?.attention_regime_score);
    const sp=num(rows[i]?.attention_spike_score);
    if(latestSpike==='No elevated attention in view.' && ((lvl!==null && lvl>=55) || cv>=25)) latestSpike=`${attentionLevelState(rows[i]).label} • ${attentionConvictionState(rows[i]).label} • ${rows[i].date}`;
    if((rr!==null && rr>=55) || (sp!==null && sp>=60)){ latestEvent=`${attentionRegimeState(rows[i]).label} • ${rows[i].date}`; break; }
  }
  return {levelLabel:level.label, levelCls:level.cls, convictionLabel:conviction.label, convictionCls:conviction.cls, regimeLabel:regime.label, regimeCls:regime.cls, latestSpike, latestEvent};
}
function buildEngagementBadgesHTML(info){
  return [
    `<span class="badge ${info.levelCls || 'badge-neutral'}"><b>Attention</b> ${info.levelLabel}</span>`,
    `<span class="badge ${info.convictionCls || 'badge-neutral'}"><b>Conviction</b> ${info.convictionLabel}</span>`,
    `<span class="badge ${info.regimeCls || 'badge-neutral'}"><b>Engagement</b> ${info.regimeLabel}</span>`,
    `<span class="badge badge-neutral"><b>Latest Elevated</b> ${info.latestSpike}</span>`,
    `<span class="badge badge-neutral"><b>Latest Event</b> ${info.latestEvent}</span>`
  ].join('');
}

function buildOverlapBadgesHTML(info){
  return [
    `<span class="badge ${info.stateCls || 'badge-neutral'}"><b>Overlap State</b> ${info.stateLabel}</span>`,
    `<span class="badge ${info.structureCls || 'badge-neutral'}"><b>Structure</b> ${info.structure}</span>`,
    `<span class="badge ${info.eventCls || 'badge-neutral'}"><b>Event</b> ${info.currentEvent}</span>`,
    `<span class="badge ${info.contextCls || 'badge-neutral'}"><b>Context</b> ${info.context}</span>`,
    `<span class="badge badge-neutral"><b>Latest Confirmed</b> ${info.latestConfirmed}</span>`
  ].join('');
}
function overlapTableauMarkers(rows, overlap, visibleMask, markerPolicy='context'){
  const bearishX=[], bearishY=[], bearishText=[];
  const bullishX=[], bullishY=[], bullishText=[];
  const watchBearishX=[], watchBearishY=[], watchBearishText=[];
  const watchBullishX=[], watchBullishY=[], watchBullishText=[];
  const hiVals=rows.map(r=>num(r.high)).filter(v=>v!==null);
  const loVals=rows.map(r=>num(r.low)).filter(v=>v!==null);
  const span=(hiVals.length && loVals.length) ? Math.max(1e-9, Math.max(...hiVals)-Math.min(...loVals)) : 1;
  const offset=span*0.014;
  const modelLabel = overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap';
  const term=currentAssetTerm();

  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;

    const meta=overlapConfirmationMeta(rows[i], overlap, i, rows, term);
    let type=meta.type;
    const d=rows[i].dateObj;
    if(!(d instanceof Date)) continue;

    const hi=num(rows[i].high) ?? num(rows[i].close) ?? null;
    const lo=num(rows[i].low) ?? num(rows[i].close) ?? null;

    if(type){
      const policyLabel = meta.policy==='legacy'
        ? 'Legacy'
        : (meta.policy==='crypto_contextual' ? 'Crypto Contextual' : 'Hybrid');

      const gateLabel = meta.upstreamSignal
        ? 'upstream multi-window Bollinger signal'
        : (meta.usedContextual
            ? 'outside active overlap + contextual volatility + High volume'
            : 'outside active overlap + High volatility + High volume');

      const detail = `${modelLabel}<br>${type==='bearish' ? 'Confirmed Bearish Pressure' : 'Confirmed Bullish Pressure'}<br>Policy: ${policyLabel}<br>Gate: ${gateLabel}`;

      if(type==='bearish' && hi!==null){
        bearishX.push(d);
        bearishY.push(hi+offset);
        bearishText.push(detail);
      } else if(type==='bullish' && lo!==null){
        bullishX.push(d);
        bullishY.push(lo-offset);
        bullishText.push(detail);
      }

      continue;
    }

    // Candidate/watch markers are hidden from the default chart view.
    //   Context: confirmed diamonds only; watch candidates remain in the alert drawer.
    //   Overlay Marks: member-only, all watch candidate circles.
    const showWatchMarkersOnChart = currentMode()==='member' && markerPolicy==='overlay';
    if(!showWatchMarkersOnChart) continue;

    const watch=overlapWatchCandidateMeta(rows[i], overlap, i, rows, term);
    type=watch.type;
    if(!type) continue;

    const detail = `${modelLabel}<br>${type==='bearish' ? 'Bearish Watch Candidate' : 'Bullish Watch Candidate'}<br>${watch.detail}`;

    if(type==='bearish' && hi!==null){
      watchBearishX.push(d);
      watchBearishY.push(hi+offset*0.55);
      watchBearishText.push(detail);
    } else if(type==='bullish' && lo!==null){
      watchBullishX.push(d);
      watchBullishY.push(lo-offset*0.55);
      watchBullishText.push(detail);
    }
  }

  const traces=[];

  if(bearishX.length){
    traces.push({type:'scatter',mode:'markers',x:bearishX,y:bearishY,text:bearishText,xaxis:'x',yaxis:'y',name:'Bearish Confirmed Alert',showlegend:false,marker:{symbol:'diamond-open',size:8,color:'rgba(255,128,128,0.98)',line:{color:'rgba(255,128,128,0.98)',width:1.4}},hovertemplate:`%{x|%b %d, %Y}<br>%{text}<extra></extra>`});
  }

  if(bullishX.length){
    traces.push({type:'scatter',mode:'markers',x:bullishX,y:bullishY,text:bullishText,xaxis:'x',yaxis:'y',name:'Bullish Confirmed Alert',showlegend:false,marker:{symbol:'diamond-open',size:8,color:'rgba(112,232,148,0.98)',line:{color:'rgba(112,232,148,0.98)',width:1.4}},hovertemplate:`%{x|%b %d, %Y}<br>%{text}<extra></extra>`});
  }

  if(watchBearishX.length){
    traces.push({type:'scatter',mode:'markers',x:watchBearishX,y:watchBearishY,text:watchBearishText,xaxis:'x',yaxis:'y',name:'Bearish Watch Candidate',showlegend:false,marker:{symbol:'circle-open',size:6,color:'rgba(255,184,184,0.72)',line:{color:'rgba(255,184,184,0.72)',width:1.1}},hovertemplate:`%{x|%b %d, %Y}<br>%{text}<extra></extra>`});
  }

  if(watchBullishX.length){
    traces.push({type:'scatter',mode:'markers',x:watchBullishX,y:watchBullishY,text:watchBullishText,xaxis:'x',yaxis:'y',name:'Bullish Watch Candidate',showlegend:false,marker:{symbol:'circle-open',size:6,color:'rgba(157,240,181,0.72)',line:{color:'rgba(157,240,181,0.72)',width:1.1}},hovertemplate:`%{x|%b %d, %Y}<br>%{text}<extra></extra>`});
  }

  return traces;
}

function escapeHTML(v){
  return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
// phaseG_public_drawer_force_v2: public drawer forced on; phaseG_public_alert_drawer_v1: alert drawer is available in public and member views.
// Phase C3: right-side alert drawer collapses horizontally and lets chart expand.
function ensureAlertSidePanel(){
  const chart=document.getElementById('chart');
  if(!chart) return null;
  if(!document.getElementById('alertSidePanelStyle')){
    const style=document.createElement('style');
    style.id='alertSidePanelStyle';
    style.textContent=`
      .chartPanelGrid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:12px;align-items:stretch;margin-top:4px;width:100%;transition:grid-template-columns .18s ease;}
      .chartPanelGrid.drawerCollapsed{grid-template-columns:minmax(0,1fr) 46px;}
      .chartPanelGrid>#chart{min-width:0;width:100%;}
      .alertSidePanel{background:rgba(11,13,16,0.96);border:1px solid #283038;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.24);padding:0;height:100%;min-height:360px;max-height:none;overflow:hidden;color:#dce7ee;font-family:inherit;transition:width .18s ease, opacity .18s ease, border-color .18s ease;display:flex;flex-direction:column;}
      .alertSidePanel h3{margin:0;font-size:14px;letter-spacing:.02em;color:#f1f6fa;}
      .alertSidePanel .panelSub{font-size:11px;color:#99a8b3;line-height:1.35;margin:0 0 10px 0;}
      .alertPanelHeader{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08);cursor:pointer;user-select:none;background:rgba(255,255,255,.025);flex:0 0 auto;}
      .alertPanelHeaderMain{display:flex;flex-direction:column;gap:3px;min-width:0;}
      .alertPanelHeaderSummary{font-size:11px;color:#9fb0ba;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .alertPanelToggle{border:1px solid #3a4651;background:rgba(255,255,255,.045);color:#dce7ee;border-radius:8px;width:24px;height:24px;line-height:20px;font-weight:800;cursor:pointer;flex:0 0 auto;}
      .alertPanelBody{padding:10px 12px 12px 12px;overflow:auto;flex:1 1 auto;}
      .alertSidePanel.collapsed{min-width:46px;max-width:46px;border-color:rgba(95,113,128,.6);}
      .alertSidePanel.collapsed .alertPanelBody{display:none;}
      .alertSidePanel.collapsed .alertPanelHeader{height:100%;padding:12px 6px;border-bottom:none;flex-direction:column;justify-content:flex-start;align-items:center;gap:10px;}
      .alertSidePanel.collapsed .alertPanelHeaderMain{writing-mode:vertical-rl;transform:rotate(180deg);align-items:center;gap:8px;min-width:0;}
      .alertSidePanel.collapsed .alertPanelHeader h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;}
      .alertSidePanel.collapsed .alertPanelHeaderSummary{display:none;}
      .alertSidePanel.collapsed .alertPanelToggle{width:26px;height:26px;line-height:20px;}
      .alertPanelControls{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;}
      .alertPanelPill{border:1px solid #33404a;border-radius:999px;padding:4px 8px;font-size:11px;color:#c5d0d8;background:rgba(255,255,255,.035);}
      .alertEventCard{border:1px solid #25313a;border-radius:12px;padding:9px 9px;margin:8px 0;background:rgba(255,255,255,.025);}
      .alertEventCard.confirmed{border-color:rgba(255,224,120,.38);background:rgba(255,224,120,.045);}
      .alertEventCard.confirmed.bullish{border-color:rgba(112,232,148,.62);background:linear-gradient(135deg,rgba(112,232,148,.105),rgba(255,255,255,.025));box-shadow:0 0 0 1px rgba(112,232,148,.10) inset,0 0 18px rgba(112,232,148,.10);}
      .alertEventCard.confirmed.bearish{border-color:rgba(255,128,128,.62);background:linear-gradient(135deg,rgba(255,128,128,.105),rgba(255,255,255,.025));box-shadow:0 0 0 1px rgba(255,128,128,.10) inset,0 0 18px rgba(255,128,128,.10);}
      .alertEventCard.watch.bullish{border-color:rgba(112,232,148,.30);}
      .alertEventCard.watch.bearish{border-color:rgba(255,128,128,.30);}
      .alertEventCard.watch{border-color:rgba(140,170,210,.28);}
      .alertEventTop{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:4px;}
      .alertEventDate{font-size:11px;color:#9fb0ba;white-space:nowrap;}
      .alertEventTitle{font-weight:700;font-size:12px;color:#eef6fa;line-height:1.25;}
      .alertEventMeta{font-size:11px;color:#b8c5cd;line-height:1.35;margin-top:5px;}
      .alertEventSummary{font-size:11px;color:#dce7ee;line-height:1.35;margin-top:5px;}
      .miniBadge{display:inline-block;border-radius:999px;padding:2px 6px;font-size:10px;margin-right:4px;border:1px solid #35424d;background:rgba(255,255,255,.04);color:#c9d5dc;}
      .miniBull{border-color:rgba(112,232,148,.45);color:#9df0b5;}.miniBear{border-color:rgba(255,128,128,.45);color:#ffb8b8;}.miniWatch{border-color:rgba(140,170,210,.45);}.miniConfirmed{border-color:rgba(255,224,120,.55);color:#ffe078;}
      .alertPanelEmpty{font-size:12px;color:#9fb0ba;border:1px dashed #33404a;border-radius:12px;padding:12px;line-height:1.35;}
      @media (max-width:1100px){.chartPanelGrid{display:block}.alertSidePanel{max-height:none;margin-top:12px}}
    `;
    document.head.appendChild(style);
  }
  let grid=document.getElementById('chartPanelGrid');
  if(!grid){
    grid=document.createElement('div');
    grid.id='chartPanelGrid';
    grid.className='chartPanelGrid';
    chart.parentNode.insertBefore(grid, chart);
    grid.appendChild(chart);
    const panel=document.createElement('aside');
    panel.id='alertSidePanel';
    panel.className='alertSidePanel';
    grid.appendChild(panel);
  }
  return document.getElementById('alertSidePanel');
}
function resizeChartAfterDrawerToggle(){
  const chart=document.getElementById('chart');
  if(window.Plotly && chart){
    window.setTimeout(()=>{ try{ Plotly.Plots.resize(chart); }catch(e){} }, 80);
    window.setTimeout(()=>{ try{ Plotly.Plots.resize(chart); }catch(e){} }, 220);
  }
}
function alertQualityScore(row, meta){
  const candidates=[
    num(row?.boll_overlap_alert_quality_score),
    num(row?.seta_alert_quality_score),
    num(row?.boll_overlap_signal_strength_abs),
    num(row?.boll_overlap_signal_strength),
    num(meta?.quality)
  ].filter(v=>v!==null);
  if(!candidates.length) return null;
  return Math.max(...candidates.map(v=>Math.abs(v)));
}
function alertDirectionLabel(type){
  if(type==='bullish') return 'Bullish';
  if(type==='bearish') return 'Bearish';
  return 'Mixed';
}
function alertDirectionClass(type){
  if(type==='bullish') return 'miniBull';
  if(type==='bearish') return 'miniBear';
  return '';
}
function alertSummaryForRow(row, meta, tier){
  const dashboardSummary = row?.seta_dashboard_summary_label || row?.seta_alert_context_label || row?.boll_overlap_event_type || row?.boll_overlap_signal;
  if(dashboardSummary) return String(dashboardSummary);
  if(tier==='Confirmed') return meta?.detail || 'Confirmed overlap alert passed source/volatility, volume, and structure gates.';
  return meta?.detail || 'Watch candidate outside the active overlap corridor.';
}
function materialWatchForPanel(watch){
  const material = (watch.outsidePct!==null && watch.outsidePct>=0.006);
  const volOk = watch.legacyVol==='High' || watch.contextualVol==='High' || watch.sourceVol==='High' || watch.structuralVol==='High';
  return !!(watch.highVolume && (material || volOk));
}
function collectVisibleAlertEvents(term, rows, overlap, visibleMask, markerPolicy='context'){
  const out=[];
  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;
    const row=rows[i] || {};
    const d=row.dateObj;
    if(!(d instanceof Date)) continue;
    const confirmed=overlapConfirmationMeta(row, overlap, i, rows, term);
    if(confirmed.type){
      const quality=alertQualityScore(row, confirmed);
      out.push({idx:i,dateObj:d,date:row.date,term,tier:'Confirmed',type:confirmed.type,quality,meta:confirmed,row});
      continue;
    }
    if(markerPolicy==='off') continue;
    const watch=overlapWatchCandidateMeta(row, overlap, i, rows, term);
    if(!watch.type) continue;
    if(markerPolicy!=='overlay' && !materialWatchForPanel(watch)) continue;
    const quality=alertQualityScore(row, watch);
    out.push({idx:i,dateObj:d,date:row.date,term,tier:'Watch',type:watch.type,quality,meta:watch,row});
  }
  out.sort((a,b)=>{
    const td=b.dateObj-a.dateObj;
    if(td) return td;
    return (b.quality ?? -1) - (a.quality ?? -1);
  });
  return out;
}
function renderAlertSidePanel(term, rows, overlap, visibleMask, markerPolicy='context'){
  const panel=ensureAlertSidePanel();
  if(!panel) return;
  panel.style.display='';
  // Public and member views both show the alert drawer; mode-specific filtering happens upstream.
  panel.style.display='';
  const events=collectVisibleAlertEvents(term, rows, overlap, visibleMask, markerPolicy);
  const confirmedCount=events.filter(e=>e.tier==='Confirmed').length;
  const watchCount=events.filter(e=>e.tier==='Watch').length;
  const latest=events.slice(0,12);
  const latestDate = latest.length ? (latest[0].date || '') : 'none';
  const collapsedKey = 'setaAlertEventsPanelCollapsed';
  const savedCollapsed = window.localStorage ? window.localStorage.getItem(collapsedKey) : null;
  const shouldCollapse = savedCollapsed === null ? true : savedCollapsed === 'true';
  const cards=latest.map(e=>{
    const q=e.quality===null ? 'n/a' : Math.round(e.quality).toString();
    const row=e.row || {};
    const meta=e.meta || {};
    const tierCls=e.tier==='Confirmed'?'miniConfirmed':'miniWatch';
    const direction=alertDirectionLabel(e.type);
    const directionCls=alertDirectionClass(e.type);
    const directionCardCls=e.type==='bullish' ? 'bullish' : (e.type==='bearish' ? 'bearish' : 'mixed');
    const attention=row.attention_regime_label || row.seta_attention_context_label || row.attention_regime_score;
    const ribbon=row.sent_ribbon_attention_regime || row.sent_ribbon_regime_raw;
    const close=num(row.close);
    const sourceTier=row.boll_overlap_alert_tier || e.tier;
    return `<div class="alertEventCard ${e.tier.toLowerCase()} ${directionCardCls}">
      <div class="alertEventTop"><div class="alertEventTitle"><span class="miniBadge ${tierCls}">${escapeHTML(e.tier)}</span><span class="miniBadge ${directionCls}">${escapeHTML(direction)}</span></div><div class="alertEventDate">${escapeHTML(e.date || '')}</div></div>
      <div class="alertEventMeta">Quality ${escapeHTML(q)} · ${escapeHTML(sourceTier)}${close!==null ? ` · Close ${escapeHTML(close.toFixed(2))}` : ''}</div>
      <div class="alertEventSummary">${escapeHTML(alertSummaryForRow(row, meta, e.tier))}</div>
      <div class="alertEventMeta">${attention ? `Attention: ${escapeHTML(attention)} · ` : ''}${ribbon ? `Ribbon: ${escapeHTML(ribbon)}` : ''}</div>
    </div>`;
  }).join('');
  panel.innerHTML = `<div class="alertPanelHeader" id="alertPanelHeader" title="Click to expand/collapse alert events">
      <div class="alertPanelHeaderMain"><h3>Alert Events</h3><div class="alertPanelHeaderSummary">Confirmed ${confirmedCount} · Watch ${watchCount} · Latest ${escapeHTML(latestDate)}</div></div>
      <button class="alertPanelToggle" id="alertPanelToggle" type="button" aria-label="Toggle alert events panel">${shouldCollapse ? '+' : '−'}</button>
    </div>
    <div class="alertPanelBody">
      <div class="panelSub">Visible-window events for ${escapeHTML(term)}. Use Attention = Context for material watch candidates or Overlay Marks for all watch candidates.</div>
      <div class="alertPanelControls"><span class="alertPanelPill">Confirmed ${confirmedCount}</span><span class="alertPanelPill">Watch ${watchCount}</span><span class="alertPanelPill">Policy ${escapeHTML(markerPolicy)}</span></div>
      ${cards || '<div class="alertPanelEmpty">No confirmed or watch events in the current visible window. Try a longer display range or Attention = Overlay Marks.</div>'}
    </div>`;
  panel.classList.toggle('collapsed', shouldCollapse);
  const grid=document.getElementById('chartPanelGrid');
  if(grid) grid.classList.toggle('drawerCollapsed', shouldCollapse);
  const header = panel.querySelector('#alertPanelHeader');
  const toggle = panel.querySelector('#alertPanelToggle');
  const applyCollapsed = (collapsed) => {
    panel.classList.toggle('collapsed', collapsed);
    const grid=document.getElementById('chartPanelGrid');
    if(grid) grid.classList.toggle('drawerCollapsed', collapsed);
    if(toggle) toggle.textContent = collapsed ? '+' : '−';
    if(window.localStorage) window.localStorage.setItem(collapsedKey, String(collapsed));
    resizeChartAfterDrawerToggle();
  };
  if(header){
    header.onclick = (ev) => {
      ev.preventDefault();
      applyCollapsed(!panel.classList.contains('collapsed'));
    };
  }
}


// phaseG_market_tape_v1: enhanced screener + archetype + indicator Market Tape UI.
function mtTerm(row){ return String(row?.term || row?.asset || '').toUpperCase(); }
function mtScore(row, key, digits=1){ const v=num(row?.[key]); return v===null ? 'n/a' : v.toFixed(digits); }
function mtScoreNum(row, key, fallback=0){ const v=num(row?.[key]); return v===null ? fallback : v; }
function mtDirectionClass(label){ const s=String(label || '').toLowerCase(); if(s.includes('bull')) return 'bullish'; if(s.includes('bear')) return 'bearish'; if(s.includes('risk') || s.includes('conflict')) return 'risk'; return 'mixed'; }
function mtStoreRecords(){ if(!SCREENER_STORE) return []; if(Array.isArray(SCREENER_STORE.records)) return SCREENER_STORE.records; if(Array.isArray(SCREENER_STORE.top_priority)) return SCREENER_STORE.top_priority; return []; }
function mtByTerm(term){ const t=String(term || '').toUpperCase(); return SCREENER_STORE?.by_term?.[t] || null; }
function mtSectionRows(section){ if(!SCREENER_STORE) return []; const sections=SCREENER_STORE.sections || {}; if(Array.isArray(sections[section])) return sections[section]; if(Array.isArray(SCREENER_STORE[section])) return SCREENER_STORE[section]; return mtStoreRecords(); }
function mtAllowedRows(rows){ const allowed=screenerAllowedTerms ? screenerAllowedTerms() : new Set(); return (rows || []).filter(r=>!allowed.size || allowed.has(mtTerm(r))); }
function mtBestArchetype(row, detail){ return detail?.archetype || row || {}; }
function mtReason(row, archetype){ return row?.screener_reason_summary || archetype?.archetype_summary || row?.archetype_summary || row?.reason_summary || 'No summary available.'; }
function mtRisk(archetype, row){ return archetype?.archetype_risk_note || row?.archetype_risk_note || ''; }
function mtMissing(archetype, row){ return archetype?.missing_confirmations || row?.missing_confirmations || ''; }
function mtFamilyScoreClass(score, label){ const s=Number(score); const dir=mtDirectionClass(label); if(dir==='bullish') return 'bullish'; if(dir==='bearish') return 'bearish'; if(Number.isFinite(s) && s>=65) return 'bullish'; if(Number.isFinite(s) && s<=35) return 'bearish'; return 'mixed'; }
function mtEnsureStyle(){
  if(document.getElementById('phaseGMarketTapeStyle')) return;
  const style=document.createElement('style');
  style.id='phaseGMarketTapeStyle';
  style.textContent=`
    .screenerPanel.marketTape{margin:10px 0 12px 0;border:1px solid #202a33;border-radius:16px;background:linear-gradient(135deg,rgba(11,13,16,.92),rgba(11,13,16,.68));box-shadow:0 10px 28px rgba(0,0,0,.22);padding:10px 12px;color:#dce7ee;}
    .marketTapeHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:9px;}
    .marketTapeTitle h3{font-size:13px;line-height:1.2;margin:0;color:#f2f7fa;letter-spacing:.02em;}
    .marketTapeSub{font-size:11px;color:#99a8b3;line-height:1.35;margin-top:3px;}
    .marketTapeTabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
    .marketTapeTab{border:1px solid #33404a;border-radius:999px;background:rgba(255,255,255,.035);color:#cbd8df;font-size:11px;padding:5px 8px;cursor:pointer;}
    .marketTapeTab.active{border-color:rgba(112,232,148,.55);color:#9df0b5;background:rgba(112,232,148,.07);}
    .marketTapeCards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-bottom:10px;}
    .marketTapeCard{border:1px solid #26323b;border-radius:13px;padding:8px 9px;background:rgba(255,255,255,.025);cursor:pointer;min-height:92px;transition:border-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease;text-align:left;color:inherit;font-family:inherit;}
    .marketTapeCard:hover{border-color:#51606c;background:rgba(255,255,255,.045);transform:translateY(-1px);}
    .marketTapeCard.active{border-color:rgba(112,232,148,.62);box-shadow:0 0 0 1px rgba(112,232,148,.12) inset;}
    .marketTapeCard.bullish{border-color:rgba(112,232,148,.34);}
    .marketTapeCard.bearish{border-color:rgba(255,128,128,.34);}
    .marketTapeCard.risk{border-color:rgba(255,224,120,.38);}
    .marketTapeCardTop{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:5px;}
    .marketTapeTerm{font-size:13px;font-weight:850;color:#f2f7fa;letter-spacing:.02em;}
    .marketTapeScore{font-size:12px;font-weight:850;color:#ffe078;}
    .marketTapePill{display:inline-block;border:1px solid #35424d;border-radius:999px;padding:2px 6px;font-size:10px;margin:0 4px 4px 0;color:#c9d5dc;background:rgba(255,255,255,.04);}
    .marketTapePill.bullish{border-color:rgba(112,232,148,.45);color:#9df0b5;}
    .marketTapePill.bearish{border-color:rgba(255,128,128,.45);color:#ffb8b8;}
    .marketTapePill.risk{border-color:rgba(255,224,120,.45);color:#ffe078;}
    .marketTapeReason{font-size:11px;color:#c9d5dc;line-height:1.32;margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .marketTapeDetail{border:1px solid #26323b;border-radius:13px;padding:9px;background:rgba(255,255,255,.025);}
    .marketTapeDetailTop{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:10px;align-items:start;}
    .marketTapeDetailTitle{font-size:12px;font-weight:850;color:#f2f7fa;margin-bottom:4px;}
    .marketTapeDetailText{font-size:11px;color:#c9d5dc;line-height:1.38;}
    .marketTapeRisk{margin-top:5px;color:#ffe2a0;}
    .marketTapeMissing{margin-top:3px;color:#9fb0ba;}
    .marketTapeFamilyGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}
    .marketTapeFamily{border:1px solid #33404a;border-radius:11px;background:rgba(255,255,255,.028);padding:6px 7px;min-height:54px;cursor:default;}
    .marketTapeFamily.bullish{border-color:rgba(112,232,148,.34);}
    .marketTapeFamily.bearish{border-color:rgba(255,128,128,.34);}
    .marketTapeFamilyName{font-size:10px;color:#9fb0ba;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .marketTapeFamilyScore{font-size:14px;font-weight:850;color:#f2f7fa;margin-top:2px;}
    .marketTapeFamilyLabel{font-size:10px;color:#c9d5dc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .marketTapeEmpty{border:1px dashed #33404a;border-radius:12px;padding:10px;font-size:12px;color:#9fb0ba;}
    @media (max-width:1250px){.marketTapeCards{grid-template-columns:repeat(3,minmax(0,1fr));}.marketTapeDetailTop{grid-template-columns:1fr;}.marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr));}}
    @media (max-width:800px){.marketTapeHeader{display:block}.marketTapeTabs{justify-content:flex-start;margin-top:8px}.marketTapeCards{grid-template-columns:1fr}.marketTapeFamilyGrid{grid-template-columns:1fr;}}
  `;
  document.head.appendChild(style);
}
function mtSectionTabs(){ return [['top_priority','Top Priority'],['fresh_confirmed','Fresh Confirmed'],['watch_clusters','Watch Clusters'],['narrative_divergence','Narrative Divergence'],['sentiment_repair','Sentiment Repair'],['bullish_setups','Bullish Setups'],['bearish_setups','Bearish Setups'],['high_conflict','High Conflict'],['quiet_monitor','Quiet / Monitor']]; }
function mtIndicatorFamiliesForTerm(term){ const detail=mtByTerm(term); if(Array.isArray(detail?.indicator_families)) return detail.indicator_families; return []; }
function mtFallbackFamilies(row){ return [['Bollinger / Overlap','attention_adjusted_bollinger_score',row?.latest_event_direction || row?.latest_confirmed_event_direction || 'Neutral'],['MACD','macd_family_direction_score',row?.macd_family_label || row?.sent_price_macd_joint_slope_label || 'n/a'],['RSI','rsi_family_state_score',row?.rsi_family_label || 'n/a'],['Sentiment Ribbon','sent_ribbon_direction_score',row?.sent_ribbon_label || 'n/a'],['MA Trend','ma_trend_direction_score','Trend'],['Attention','attention_participation_score','Participation']].map(([fam,key,label])=>({indicator_family:fam,score_0_100:mtScoreNum(row,key,null),direction_label:label,strength_label:'',interpretation:''})); }
function mtRenderFamilyGrid(term, row){
  let families=mtIndicatorFamiliesForTerm(term);
  if(!families.length) families=mtFallbackFamilies(row);
  const keep=new Set(['Summary','Bollinger / Overlap','MACD','RSI','Sentiment Ribbon','MA Trend','Attention']);
  families=families.filter(f=>keep.has(f.indicator_family)).slice(0,7);
  return `<div class="marketTapeFamilyGrid">${families.map(f=>{
    const score=num(f.score_0_100);
    const scoreTxt=score===null ? 'n/a' : score.toFixed(0);
    const label=f.direction_label || f.strength_label || '';
    const cls=mtFamilyScoreClass(score, label);
    const title=[f.primary_indicator, f.interpretation].filter(Boolean).join(' — ');
    return `<div class="marketTapeFamily ${cls}" title="${escapeHTML(title)}"><div class="marketTapeFamilyName">${escapeHTML(f.indicator_family || 'Family')}</div><div class="marketTapeFamilyScore">${escapeHTML(scoreTxt)}</div><div class="marketTapeFamilyLabel">${escapeHTML(label)}</div></div>`;
  }).join('')}</div>`;
}
function renderScreenerPanel(activeTerm=null){
  const panel=ensureScreenerPanel();
  if(!panel) return;
  if(!SCREENER_STORE){ panel.innerHTML=''; panel.style.display='none'; return; }
  mtEnsureStyle();
  panel.style.display='';
  panel.className='screenerPanel marketTape';

  const tabs=mtSectionTabs();
  if(!tabs.some(([key])=>key===SCREENER_SECTION)) SCREENER_SECTION='top_priority';

  const rows=mtAllowedRows(mtSectionRows(SCREENER_SECTION)).slice(0,5);
  const currentTerm=String(activeTerm || document.getElementById('asset')?.value || mtTerm(rows[0]) || '').toUpperCase();
  const activeRow=(mtByTerm(currentTerm)?.screener) || rows.find(r=>mtTerm(r)===currentTerm) || rows[0] || {};
  const activeDetail=mtByTerm(currentTerm);
  const activeArch=mtBestArchetype(activeRow, activeDetail);
  const version=SCREENER_STORE.model_version || '';
  const generated=SCREENER_STORE.latest_data_date || SCREENER_STORE.generated_at_utc || '';

  const tabHtml=tabs.map(([key,label])=>`<button type="button" class="marketTapeTab ${key===SCREENER_SECTION?'active':''}" data-screener-section="${escapeHTML(key)}">${escapeHTML(label)}</button>`).join('');
  const cardHtml=rows.map((r,idx)=>{
    const term=mtTerm(r);
    const dir=r.archetype_direction || r.signal_consensus_direction_label || r.latest_event_direction || 'Mixed';
    const cls=mtDirectionClass(dir);
    const active=term===currentTerm;
    const score=mtScore(r,'screener_attention_priority_score');
    const bucket=r.screener_action_bucket || r.primary_archetype || 'Monitor';
    const arch=r.primary_archetype || 'Monitor';
    const reason=mtReason(r, r);
    const dispersion=mtScore(r,'signal_dispersion_score',0);
    return `<button type="button" class="marketTapeCard ${cls} ${active?'active':''}" data-screener-term="${escapeHTML(term)}"><div class="marketTapeCardTop"><span class="marketTapeTerm">#${escapeHTML(r.screener_attention_priority_rank || idx+1)} ${escapeHTML(term)}</span><span class="marketTapeScore">${escapeHTML(score)}</span></div><div><span class="marketTapePill ${cls}">${escapeHTML(dir)}</span><span class="marketTapePill">${escapeHTML(bucket)}</span><span class="marketTapePill">Disp ${escapeHTML(dispersion)}</span></div><div class="marketTapeReason"><b>${escapeHTML(arch)}</b> · ${escapeHTML(reason)}</div></button>`;
  }).join('');

  const detailDir=activeArch.archetype_direction || activeRow.signal_consensus_direction_label || activeRow.latest_event_direction || 'Mixed';
  const detailCls=mtDirectionClass(detailDir);
  const detailTitle=`${currentTerm} · ${activeArch.primary_archetype || activeRow.primary_archetype || 'Monitor'}`;
  const summary=activeArch.archetype_summary || activeRow.archetype_summary || mtReason(activeRow, activeArch);
  const risk=mtRisk(activeArch, activeRow);
  const missing=mtMissing(activeArch, activeRow);
  const matched=activeArch.matched_conditions || activeRow.matched_conditions || '';
  const familyGrid=mtRenderFamilyGrid(currentTerm, activeRow);

  panel.innerHTML=`<div class="marketTapeHeader"><div class="marketTapeTitle"><h3>SETA Market Tape</h3><div class="marketTapeSub">Ranked opportunities, setup archetypes, and indicator-family diagnostics. ${version ? `Model ${escapeHTML(version)}. ` : ''}${generated ? `As of ${escapeHTML(generated)}.` : ''}</div></div><div class="marketTapeTabs">${tabHtml}</div></div><div class="marketTapeCards">${cardHtml || '<div class="marketTapeEmpty">No Market Tape rows available for this mode/section.</div>'}</div><div class="marketTapeDetail"><div class="marketTapeDetailTop"><div><div class="marketTapeDetailTitle"><span class="marketTapePill ${detailCls}">${escapeHTML(detailDir)}</span>${escapeHTML(detailTitle)} · Priority ${escapeHTML(mtScore(activeRow,'screener_attention_priority_score'))}</div><div class="marketTapeDetailText">${escapeHTML(summary)}</div>${matched ? `<div class="marketTapeMissing"><b>Matched:</b> ${escapeHTML(matched)}</div>` : ''}${missing ? `<div class="marketTapeMissing"><b>Missing:</b> ${escapeHTML(missing)}</div>` : ''}${risk ? `<div class="marketTapeRisk"><b>Risk:</b> ${escapeHTML(risk)}</div>` : ''}</div><div>${familyGrid}</div></div></div>`;

  panel.querySelectorAll('[data-screener-section]').forEach(btn=>{ btn.onclick=()=>{ SCREENER_SECTION=btn.getAttribute('data-screener-section') || 'top_priority'; renderScreenerPanel(document.getElementById('asset')?.value || null); }; });
  panel.querySelectorAll('[data-screener-term]').forEach(card=>{ card.onclick=()=>setDashboardAssetFromScreener(card.getAttribute('data-screener-term')); });
}

function buildFigure(){
  const term=document.getElementById('asset').value, freq=document.getElementById('freq').value, rangePreset=document.getElementById('range').value, priceDisplay=document.getElementById('priceDisplay').value, scaleMode=document.getElementById('scaleMode').value, ribbon=document.getElementById('ribbon').value, sentRibbon=document.getElementById('sentRibbon').value, regimeLayer=document.getElementById('regimeLayer').value, engagement=document.getElementById('engagement').value, bollinger=document.getElementById('bollinger').value, osc=document.getElementById('osc').value;
  const rows=cloneRows(STORE[freq][term]||[]); if(!rows.length) return;
  const visRows=visibleRows(rows, rangePreset); if(!visRows.length) return;
  const calendar=detectCalendar(rows), xs=rows.map(r=>r.dateObj), visStart=visRows[0].dateObj, visEnd=visRows[visRows.length-1].dateObj, visEndPad=nextRangeEnd(visEnd,calendar,freq);
  const visibleMask=rows.map(r=>r.dateObj>=visStart&&r.dateObj<=visEnd);
  const fitRows=fitRowsForSentiment(rows, visRows, freq);
  const sentRibbonInfo=sentimentRibbonSeries(rows, fitRows, visRows, sentRibbon);
  const sentRibbonSpec=sentRibbonInfo.series;
  const showSentRibbon=(ribbon==='sentiment'||ribbon==='both');
  const regimeInfo=regimeInfoForRows(rows);
  const mappedBands=mappedSentimentBands(rows, fitRows, visRows);
  const priceBands=computePriceBands(rows);
  const data=[];
  document.getElementById('assetTitle').textContent=`${term} · ${freq==='D'?'Daily':'Weekly'}`;
  const helperParts=[`${calendar==='continuous'?'Continuous calendar':'Trading-session compression'} · sentiment transform fit includes hidden warmup`];
  if(priceBands.derived) helperParts.push('price bands derived in-view from close 20 SMA ± 2 std');
  if(bollinger==='contextual' || bollinger==='both') helperParts.push('combined overlap uses a trailing price-space sentiment envelope with percentile calibration for tighter long-range behavior');
  if(bollinger==='overlap') helperParts.push('canonical overlap remains the native joint expectation corridor');
  if(bollinger==='contextual' || bollinger==='overlap' || bollinger==='both') helperParts.push('confirmed diamonds require High volume plus legacy or contextual volatility; member mode also shows quieter watch candidates for outside-overlap events blocked by one gate');
  if(sentRibbonInfo.usedHybridOffsets) helperParts.push('full ribbon uses anchored MA 21 centerline plus smoothed family offsets');
  const currentRegimeInfo=regimeInfo[rows.length-1] || {regime:'Flat', confidence:0, basis:'derived'};
  const scaleModeLabel = scaleMode==='price_only' ? 'price only' : (scaleMode==='all_visible' ? 'all visible traces' : 'price + price overlays');
  helperParts.push(`scale mode: ${scaleModeLabel}`);
  helperParts.push(`regime basis: ${currentRegimeInfo.basis || 'derived'}`);
  if(engagement!=='off') helperParts.push(engagement==='overlay' ? 'attention overlay marks soft participation days, stronger event bursts, and all member watch candidates' : 'attention badges show level, conviction, regime, and material member watch candidates');
  document.getElementById('helperText').textContent = currentMode()==='member'
    ? helperParts.join(' · ')
    : `${calendar==='continuous'?'Continuous':'Trading-session'} ${freq==='D'?'daily':'weekly'} view · Combined Overlap primary · Engagement contextual · Timing panes optional.`;

  if(priceDisplay==='candles') data.push({type:'candlestick',x:xs,open:rows.map(r=>num(r.open)),high:rows.map(r=>num(r.high)),low:rows.map(r=>num(r.low)),close:rows.map(r=>num(r.close)),name:'Price',xaxis:'x',yaxis:'y',showlegend:true,increasing:{line:{color:COLORS.price},fillcolor:COLORS.price},decreasing:{line:{color:'#9f9f9f'},fillcolor:'#9f9f9f'},hovertemplate:'%{x|%b %d, %Y}<br>Open=%{open:.2f}<br>High=%{high:.2f}<br>Low=%{low:.2f}<br>Close=%{close:.2f}<extra></extra>'});
  else data.push(traceLine(xs,rows.map(r=>num(r.close)),'Price',COLORS.price,2.0,'solid','y',true,'%{x|%b %d, %Y}<br>Close=%{y:.2f}<extra></extra>'));

  if(ribbon==='price'||ribbon==='both') [['close_ma_7','Price MA 7',COLORS.ma7],['close_ma_21','Price MA 21',COLORS.ma21],['close_ma_50','Price MA 50',COLORS.ma50],['close_ma_100','Price MA 100',COLORS.ma100],['close_ma_200','Price MA 200',COLORS.ma200]].forEach(([c,n,col])=>data.push(traceLine(xs,rows.map(r=>num(r[c])),n,col,1.45,'solid','y',true,`%{x|%b %d, %Y}<br>${n}=%{y:.2f}<extra></extra>`,0.92)));

  if(showSentRibbon) sentRibbonSpec.forEach(s=>{ const hover=`%{x|%b %d, %Y}<br>${s.name}=%{y:.2f}<extra></extra>`; if(regimeLayer==='on') pushRegimeSegmentedBundle(data, xs, s.y, s.name, 'y', hover, s.width, s.period, regimeInfo); else sentimentBundle(xs, s.y, s.name, 'y', true, hover, s.width, s.palette).forEach(t=>data.push(t)); });

  if(bollinger==='price'||bollinger==='both') addFilledBand(data,xs,priceBands.up,priceBands.low,COLORS.priceBand,COLORS.priceFill,priceBands.derived?'Price Band (TV 20,2 Derived)':'Price Band','y');
  const activeOverlapModel=chooseOverlapModel(rows, priceBands, mappedBands, rangePreset, calendar, bollinger);
  const activeSentBands=activeOverlapModel.sentimentBands || mappedBands;
  if(bollinger==='sentiment'||bollinger==='both') addFilledBand(data,xs,activeSentBands.up,activeSentBands.low,COLORS.sentCore,COLORS.sentFill,activeOverlapModel.family==='contextual' ? 'Contextual Sentiment Envelope' : 'Sentiment Band','y');
  const ov=activeOverlapModel.overlap;
  const overlapInfo=computeOverlapSignalInfo(rows, ov, visibleMask);
  const engagementInfo=computeEngagementInfo(rows, visibleMask);

const mode=currentMode();
const cfg = manifestModeConfig() || {};
const summaryText = `${overlapInfo.stateLabel} · ${overlapInfo.context} · ${engagement==='off' ? 'Engagement Hidden' : `${engagementInfo.levelLabel} / ${engagementInfo.regimeLabel}`}`;
document.getElementById('summaryLead').innerHTML = `<span class="summaryCard"><b>Combined Summary</b> ${summaryText}</span><span class="summaryCard"><b>Model</b> ${overlapInfo.modelLabel}</span>`;
  const overlapMarkerTraces=overlapTableauMarkers(rows, ov, visibleMask, engagement);
  const alertDiagnostics=computeAlertDiagnosticInfo(rows, ov, visibleMask, term);
  renderAlertSidePanel(term, rows, ov, visibleMask, engagement);
  if(bollinger==='overlap' || bollinger==='contextual') addOverlapBandWithPlaybook(data,xs,ov.up,ov.low,rows,ov,COLORS.overlapBand,COLORS.overlapFill,overlapInfo.modelLabel,'y',visibleMask);
  if((bollinger==='overlap' || bollinger==='contextual' || bollinger==='both')) overlapMarkerTraces.forEach(t=>data.push(t));
  const visRegimeRows=rows.filter((r,i)=>visibleMask[i]);
  const visRegimeInfo=regimeInfo.filter((r,i)=>visibleMask[i]);
  const lastRegimeRow=visRegimeRows[visRegimeRows.length-1] || rows[rows.length-1];
  const lastRegimeInfo=visRegimeInfo[visRegimeInfo.length-1] || regimeInfo[regimeInfo.length-1] || {regime:'Flat', confidence:0, regimeScore:0, compression:false};
  const lastTransitionIdx=[...visRegimeInfo.keys()].reverse().find(i=>visRegimeInfo[i] && visRegimeInfo[i].transition);
  const lastTransitionRow=lastTransitionIdx!==undefined ? visRegimeRows[lastTransitionIdx] : null;
  const lastTransitionInfo=lastTransitionIdx!==undefined ? visRegimeInfo[lastTransitionIdx] : null;
  const showOverlapContext = (bollinger==='overlap' || bollinger==='contextual' || bollinger==='both' || cfg.alwaysShowOverlapBadges);
  const showEngagementContext = engagement!=='off';
  const showRibbonContext = regimeLayer==='on' || showSentRibbon;
  const badgeMap = {
    overlapState: showOverlapContext ? `<span class="badge ${overlapInfo.stateCls || 'badge-neutral'}"><b>Overlap State</b> ${overlapInfo.stateLabel}</span>` : null,
    overlapModel: showOverlapContext ? `<span class="badge badge-neutral"><b>Model</b> ${overlapInfo.modelLabel}</span>` : null,
    structure: showOverlapContext ? `<span class="badge ${overlapInfo.structureCls || 'badge-neutral'}"><b>Structure</b> ${overlapInfo.structure}</span>` : null,
    event: showOverlapContext ? `<span class="badge ${overlapInfo.eventCls || 'badge-neutral'}"><b>Event</b> ${overlapInfo.currentEvent}</span>` : null,
    context: showOverlapContext ? `<span class="badge ${overlapInfo.contextCls || 'badge-neutral'}"><b>Context</b> ${overlapInfo.context}</span>` : null,
    latestConfirmed: showOverlapContext ? `<span class="badge badge-neutral"><b>Latest Confirmed</b> ${overlapInfo.latestConfirmed}</span>` : null,
    alertDiagnostics: (showOverlapContext && currentMode()==='member') ? `<span class="badge badge-neutral"><b>Alert Funnel</b> Outside ${alertDiagnostics.outside} · Vol ${alertDiagnostics.volatility} · Volume ${alertDiagnostics.volume} · Confirmed ${alertDiagnostics.confirmed} · Watch ${alertDiagnostics.watch}</span>` : null,
    attention: showEngagementContext ? `<span class="badge ${engagementInfo.levelCls || 'badge-neutral'}"><b>Attention</b> ${engagementInfo.levelLabel}</span>` : null,
    conviction: showEngagementContext ? `<span class="badge ${engagementInfo.convictionCls || 'badge-neutral'}"><b>Conviction</b> ${engagementInfo.convictionLabel}</span>` : null,
    engagement: showEngagementContext ? `<span class="badge ${engagementInfo.regimeCls || 'badge-neutral'}"><b>Engagement</b> ${engagementInfo.regimeLabel}</span>` : null,
    latestElevated: showEngagementContext ? `<span class="badge badge-neutral"><b>Latest Elevated</b> ${engagementInfo.latestSpike}</span>` : null,
    latestEvent: showEngagementContext ? `<span class="badge badge-neutral"><b>Latest Event</b> ${engagementInfo.latestEvent}</span>` : null,
    sentimentRibbon: showRibbonContext ? `<span class="badge ${lastRegimeInfo.regime==='Bullish' ? 'badge-bull' : lastRegimeInfo.regime==='Bearish' ? 'badge-bear' : 'badge-flat'}"><b>Sentiment Ribbon</b> ${lastRegimeInfo.regime}</span>` : null,
    confidence: showRibbonContext ? `<span class="badge badge-neutral"><b>Confidence</b> ${(lastRegimeInfo.confidence ?? 0).toFixed(0)}</span>` : null,
    score: showRibbonContext ? `<span class="badge badge-neutral"><b>Score</b> ${(lastRegimeInfo.regimeScore ?? 0).toFixed(0)}</span>` : null,
    width: showRibbonContext ? `<span class="badge badge-neutral"><b>Width</b> ${lastRegimeInfo.compression ? 'Compressed' : ((lastRegimeInfo.widthZ ?? 0)>=0 ? 'Expanding' : 'Narrowing')}</span>` : null,
    lastTransition: showRibbonContext ? `<span class="badge badge-neutral"><b>Last transition</b> ${lastTransitionRow ? `${(lastTransitionInfo?.transitionType || 'state change')} on ${lastTransitionRow.date}` : 'none in view'}</span>` : null
  };
  const orderedKeys = (badgeOrder() || []).slice();
  if(showOverlapContext && currentMode()==='member' && !orderedKeys.includes('alertDiagnostics')){
    const idx = orderedKeys.indexOf('latestConfirmed');
    if(idx>=0) orderedKeys.splice(idx+1, 0, 'alertDiagnostics');
    else orderedKeys.push('alertDiagnostics');
  }
  if(showOverlapContext && !orderedKeys.includes('confirmedContext')){
    const idx = orderedKeys.indexOf('latestConfirmed');
    if(idx>=0) orderedKeys.splice(idx+1, 0, 'confirmedContext');
    else orderedKeys.push('confirmedContext');
  }
  const badgeParts=orderedKeys.map(key=>badgeMap[key]).filter(Boolean);
  document.getElementById('regimeBar').innerHTML = badgeParts.join('');

  if(bollinger==='both'){
    data.push({type:'scatter',mode:'lines',x:xs,y:ov.low,xaxis:'x',yaxis:'y',line:{color:'rgba(0,0,0,0)',width:0},showlegend:false,hoverinfo:'skip',connectgaps:true});
    data.push({type:'scatter',mode:'lines',x:xs,y:ov.up,xaxis:'x',yaxis:'y',line:{color:'rgba(0,0,0,0)',width:0},showlegend:false,hoverinfo:'skip',connectgaps:true,fill:'tonexty',fillcolor:COLORS.overlapFill});
  }

  if(regimeLayer==='on' && showSentRibbon) {
    const transX=[], transY=[], transText=[], transColor=[];
    rows.forEach((r,i)=>{
      const info=regimeInfo[i];
      if(!visibleMask[i] || !info || !info.transition) return;
      const y=num(r.close) ?? num(r.close_ma_21) ?? null;
      if(y===null) return;
      transX.push(r.dateObj);
      transY.push(y);
      transText.push(info.transitionType || info.regime);
      transColor.push(info.regime==='Bullish' ? COLORS.transitionBull : info.regime==='Bearish' ? COLORS.transitionBear : COLORS.transitionFlat);
    });
    if(transX.length) data.push({type:'scatter',mode:'markers',x:transX,y:transY,xaxis:'x',yaxis:'y',marker:{size:10,color:transColor,symbol:'diamond-wide'},name:'Ribbon transitions',hovertemplate:'%{x|%b %d, %Y}<br>%{text}<extra></extra>',text:transText});
  }

  const hist=rows.map(r=>num(r.macd_histogram));
  const histColors=hist.map((v,i)=>{if(v===null)return 'rgba(0,0,0,0)';const prev=i>0&&hist[i-1]!==null?hist[i-1]:v;const accel=v>=prev; if(v>=0) return accel?COLORS.histUp:COLORS.histUpSoft; return accel?COLORS.histDownSoft:COLORS.histDown;});
  data.push({type:'bar',x:xs,y:hist,name:'MACD Histogram',marker:{color:histColors},xaxis:'x2',yaxis:'y2',showlegend:false,hovertemplate:'%{x|%b %d, %Y}<br>Histogram=%{y:.2f}<extra></extra>'});
  data.push(traceLine(xs,rows.map(r=>num(r.macd)),'MACD',COLORS.ma7,2.0,'solid','y2',false,'%{x|%b %d, %Y}<br>MACD=%{y:.2f}<extra></extra>'));
  data.push(traceLine(xs,rows.map(r=>num(r.macd_signal)),'Signal',COLORS.ma50,1.5,'solid','y2',false,'%{x|%b %d, %Y}<br>Signal=%{y:.2f}<extra></extra>'));
  if(osc==='both'){
    sentimentBundle(xs,rows.map(r=>num(r.scaled_sentiment_macd)),'Scaled Sentiment MACD','y2',false,'%{x|%b %d, %Y}<br>Scaled Sentiment MACD=%{y:.2f}<extra></extra>',1.2).forEach(t=>data.push(t));
    sentimentBundle(xs,rows.map(r=>num(r.scaled_sentiment_macd_signal)),'Scaled Sentiment Signal','y2',false,'%{x|%b %d, %Y}<br>Scaled Sentiment Signal=%{y:.2f}<extra></extra>',1.0).forEach(t=>data.push(t));
  }

  const crossX=[],crossY=[],crossText=[],crossSize=[],crossColor=[];
  rows.forEach(r=>{const c=num(r.macd_signal_cross), y=num(r.macd); if(c===1||c===-1){crossX.push(r.dateObj); crossY.push(y); crossText.push(c===1?'Bull':'Bear'); crossSize.push(Math.min(18,10+Math.abs(num(r.macd_cross_significance)||0)*2)); crossColor.push(c===1?'rgba(40,220,90,0.85)':'rgba(255,110,110,0.85)');}});
  if(crossX.length) data.push({type:'scatter',mode:'markers+text',x:crossX,y:crossY,text:crossText,textposition:'top center',xaxis:'x2',yaxis:'y2',marker:{size:crossSize,color:crossColor,symbol:'triangle-up'},name:'Crosses',showlegend:false,hovertemplate:'%{x|%b %d, %Y}<br>%{text} Cross<extra></extra>'});

  data.push(traceLine(xs,rows.map(r=>num(r.rsi_d)||num(r.rsi)),'RSI',COLORS.rsi,2.0,'solid','y3',false,'%{x|%b %d, %Y}<br>RSI=%{y:.2f}<extra></extra>'));
  if(osc==='both') sentimentBundle(xs,rows.map(r=>num(r.sentiment_rsi_d)||num(r.sentiment_rsi)),'Sentiment RSI','y3',false,'%{x|%b %d, %Y}<br>Sentiment RSI=%{y:.2f}<extra></extra>',1.1).forEach(t=>data.push(t));
  data.push(traceLine(xs,rows.map(r=>num(r.stochastic_rsi)),'Stoch RSI %K',COLORS.stoch,1.8,'solid','y4',false,'%{x|%b %d, %Y}<br>Stoch RSI %K=%{y:.2f}<extra></extra>'));
  data.push(traceLine(xs,rows.map(r=>num(r.stochastic_rsi_d)),'Stoch RSI %D',COLORS.stochD,1.3,'solid','y4',false,'%{x|%b %d, %Y}<br>Stoch RSI %D=%{y:.2f}<extra></extra>'));
  if(osc==='both') sentimentBundle(xs,rows.map(r=>num(r.sentiment_stochastic_rsi_d)),'Sentiment Stoch RSI','y4',false,'%{x|%b %d, %Y}<br>Sentiment Stoch RSI=%{y:.2f}<extra></extra>',1.0).forEach(t=>data.push(t));

  const priceCandidates=[];
  rows.forEach((r,i)=>{ if(!visibleMask[i]) return;
    if(priceDisplay==='candles'){
      ['open','high','low','close'].forEach(c=>{const v=num(r[c]); if(v!==null) priceCandidates.push(v);});
    } else {
      const v=num(r.close); if(v!==null) priceCandidates.push(v);
    }
    if((scaleMode==='price_overlays' || scaleMode==='all_visible') && (ribbon==='price'||ribbon==='both')){
      ['close_ma_7','close_ma_21','close_ma_50','close_ma_100','close_ma_200'].forEach(c=>{const v=num(r[c]); if(v!==null) priceCandidates.push(v);});
    }
    if((scaleMode==='all_visible') && (ribbon==='sentiment'||ribbon==='both')){
      sentRibbonSpec.forEach(s=>{const v=num(s.y[i]); if(v!==null) priceCandidates.push(v);});
    }
    if((scaleMode==='price_overlays' || scaleMode==='all_visible') && (bollinger==='price'||bollinger==='both')){
      const up=num(priceBands.up[i]), lo=num(priceBands.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);
    }
    if((scaleMode==='all_visible') && (bollinger==='sentiment'||bollinger==='both'||bollinger==='overlap'||bollinger==='contextual')){
      const up=num(activeSentBands.up[i]), lo=num(activeSentBands.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);
    }
    if((scaleMode==='all_visible') && (bollinger==='overlap'||bollinger==='contextual'||bollinger==='both')){
      const up=num(ov.up[i]), lo=num(ov.low[i]); if(up!==null) priceCandidates.push(up); if(lo!==null) priceCandidates.push(lo);
    }
  });

  let yRange=null;
  if(priceCandidates.length){
    const lo=Math.min(...priceCandidates), hi=Math.max(...priceCandidates);
    const span=Math.max(hi-lo,Math.abs((hi+lo)/2)*0.02,1);
    const padPct = scaleMode==='price_only' ? 0.04 : (scaleMode==='price_overlays' ? 0.05 : 0.08);
    const pad=span*padPct;
    yRange=[lo-pad,hi+pad];
  }

  const last=visRows[visRows.length-1];
  const sentConf=(num(last.scaled_sentiment_macd)!==null&&num(last.macd)!==null)?(((num(last.scaled_sentiment_macd)>=num(last.scaled_sentiment_macd_signal))===(num(last.macd)>=num(last.macd_signal)))?'yes':'no'):'n/a';
  const lastCrossRow=[...visRows].reverse().find(r=>Math.abs(num(r.macd_signal_cross)||0)===1);
  const lastCrossText=lastCrossRow?`${num(lastCrossRow.macd_signal_cross)===1?'Bull':'Bear'} on ${lastCrossRow.date}`:'none in view';
  const histDir=visRows.length>=2&&num(visRows[visRows.length-1].macd_histogram)!==null&&num(visRows[visRows.length-2].macd_histogram)!==null?(num(visRows[visRows.length-1].macd_histogram)>=num(visRows[visRows.length-2].macd_histogram)?'rising':'falling'):'flat';
  const macdRegime=(num(last.macd)!==null&&num(last.macd_signal)!==null&&num(last.macd)>=num(last.macd_signal))?'Bullish':'Bearish';
  const lastRsiVal = num(last.rsi_d) ?? num(last.rsi);
  const lastSentRsiVal = num(last.sentiment_rsi_d) ?? num(last.sentiment_rsi);
  const rsiBias = lastRsiVal===null ? 'n/a' : (lastRsiVal>=70 ? 'Overbought' : (lastRsiVal<=30 ? 'Oversold' : (lastRsiVal>=55 ? 'Bullish Bias' : (lastRsiVal<=45 ? 'Bearish Bias' : 'Neutral'))));
  const rsiConfirm = (lastRsiVal!==null && lastSentRsiVal!==null) ? (((lastRsiVal>=50)===(lastSentRsiVal>=50)) ? 'confirming' : 'mixed') : 'n/a';
  const rsiPaneText = `RSI / Sent RSI · ${formatNum(lastRsiVal)} / ${formatNum(lastSentRsiVal)} · ${rsiBias} · ${rsiConfirm}`;
  const lastStochK = num(last.stochastic_rsi);
  const lastStochD = num(last.stochastic_rsi_d);
  const lastSentStoch = num(last.sentiment_stochastic_rsi_d);
  const stochBias = lastStochK===null || lastStochD===null ? 'n/a' : (lastStochK>=80 ? 'Overbought' : (lastStochK<=20 ? 'Oversold' : (lastStochK>=lastStochD ? 'Recovery Bias' : 'Softening Bias')));
  const stochConfirm = (lastSentStoch!==null && lastStochK!==null) ? (((lastStochK>=50)===(lastSentStoch>=50)) ? 'confirming' : 'mixed') : 'n/a';
  const stochPaneText = `%K / %D / Sent Stoch · ${formatNum(lastStochK)} / ${formatNum(lastStochD)} / ${formatNum(lastSentStoch)} · ${stochBias} · ${stochConfirm}`;
  const rb=(calendar==='trading_sessions' && freq==='D')?[{bounds:['sat','mon']}]:[];
  const regimeRects=(regimeLayer==='on' && showSentRibbon) ? regimeSegments(rows, regimeInfo, visStart, visEnd).map(seg=>({type:'rect',xref:'x',x0:seg.start,x1:nextRangeEnd(seg.end,calendar,freq),yref:'paper',y0:0.54,y1:0.98,line:{width:0},fillcolor:regimeFillColor(seg.regime),layer:'below'})) : [];
  const overlapTriggerShapes=[];
  const engagementShapes = engagement==='overlay' ? engagementOverlayShapes(rows, visibleMask, freq) : [];

  const lowerPanesVisible = showLowerPanes();
  const layout={
    paper_bgcolor:COLORS.bg, plot_bgcolor:COLORS.panel, font:{color:COLORS.text}, margin:{l:64,r:30,t:18,b:54}, barmode:'overlay',
    showlegend: showLegend(),
    legend:{orientation:'v', y:1.0, x:0.0, xanchor:'left', yanchor:'top', bgcolor:'rgba(0,0,0,0.24)', bordercolor:'#2a3138', borderwidth:1, font:{size:11}},
    xaxis:{domain:[0,1],anchor:'y',range:[visStart,visEndPad],showgrid:true,gridcolor:COLORS.grid,rangeslider:{visible:false},showticklabels:false,rangebreaks:rb},
    yaxis:{domain: lowerPanesVisible ? [0.54,0.98] : [0.08,0.98],title:'Price',showgrid:true,gridcolor:COLORS.grid,zeroline:false,range:yRange},
    ...(lowerPanesVisible ? {
      xaxis2:{domain:[0,1],anchor:'y2',matches:'x',showgrid:true,gridcolor:COLORS.grid,showticklabels:false,rangebreaks:rb},
      yaxis2:{domain:[0.31,0.50],title:'MACD',showgrid:true,gridcolor:COLORS.grid,zeroline:true,zerolinecolor:'rgba(255,255,255,0.3)'},
      xaxis3:{domain:[0,1],anchor:'y3',matches:'x',showgrid:true,gridcolor:COLORS.grid,showticklabels:false,rangebreaks:rb},
      yaxis3:{domain:[0.17,0.28],title:'RSI',showgrid:true,gridcolor:COLORS.grid,range:[0,100]},
      xaxis4:{domain:[0,1],anchor:'y4',matches:'x',showgrid:true,gridcolor:COLORS.grid,tickformat:freq==='W'?'%b %Y':'%b %d\n%Y',rangebreaks:rb},
      yaxis4:{domain:[0.03,0.14],title:'Stoch',showgrid:true,gridcolor:COLORS.grid,range:[0,100]}
    } : {}),
    shapes:[
      ...regimeRects,
      ...engagementShapes,
      ...overlapTriggerShapes,
      {type:'line',xref:'paper',x0:0,x1:1,yref:'y3',y0:70,y1:70,line:{color:'rgba(255,255,255,0.25)',width:1,dash:'dot'}},
      {type:'line',xref:'paper',x0:0,x1:1,yref:'y3',y0:30,y1:30,line:{color:'rgba(255,255,255,0.25)',width:1,dash:'dot'}},
      {type:'line',xref:'paper',x0:0,x1:1,yref:'y4',y0:80,y1:80,line:{color:'rgba(255,255,255,0.25)',width:1,dash:'dot'}},
      {type:'line',xref:'paper',x0:0,x1:1,yref:'y4',y0:20,y1:20,line:{color:'rgba(255,255,255,0.25)',width:1,dash:'dot'}}
    ],
    annotations:[
      {xref:'paper',yref:'paper',x:0.5,y:0.995,text:'Price',showarrow:false,font:{size:15,color:COLORS.text}},
      ...(lowerPanesVisible ? [
      {xref:'paper',yref:'paper',x:0.5,y:0.505,text:'MACD',showarrow:false,font:{size:15,color:COLORS.text}},
      {xref:'paper',yref:'paper',x:0.5,y:0.285,text:'RSI',showarrow:false,font:{size:15,color:COLORS.text}},
      {xref:'paper',yref:'paper',x:0.5,y:0.145,text:'Stoch RSI',showarrow:false,font:{size:15,color:COLORS.text}}
      ] : []),
      ...(cfg.showRibbonAnnotation !== false && regimeLayer==='on' && showSentRibbon ? [{xref:'paper',yref:'paper',x:0.99,y:0.985,xanchor:'right',text:`Sentiment Ribbon: ${lastRegimeInfo.regime} | Confidence: ${(lastRegimeInfo.confidence ?? 0).toFixed(0)} | ${(lastRegimeInfo.compression ? 'Compressed' : ((lastRegimeInfo.widthZ ?? 0)>=0 ? 'Expanding' : 'Narrowing'))}`,showarrow:false,align:'right',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...((bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') ? [{xref:'paper',yref:'paper',x:0.01,y: cfg.compactAnnotations ? 0.972 : 0.955,xanchor:'left',text: cfg.compactAnnotations ? `${overlapInfo.modelLabel}: ${overlapInfo.stateLabel} | ${overlapInfo.context}` : overlapInfo.annotation,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...(cfg.showMacdAnnotation !== false && lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.495,xanchor:'left',text:`MACD / Signal / Hist | ${macdRegime} | Last Cross: ${lastCrossText} | Histogram: ${histDir} | Sentiment confirmation: ${sentConf}`,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...(lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.275,xanchor:'left',text:rsiPaneText,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...(lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.135,xanchor:'left',text:stochPaneText,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : [])
    ],
    hovermode:'x unified'
  };
  Plotly.newPlot('chart', data, layout, {responsive:true, displaylogo:false});
}
const CONTROL_IDS=['asset','freq','range','priceDisplay','scaleMode','ribbon','sentRibbon','regimeLayer','engagement','bollinger','osc'];
function attachControlHandlers(){ CONTROL_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', buildFigure); }); }
async function initDashboard(){
  try{
    await loadManifest();
    applyModeUi();
    applyModeDefaults();
    await loadStore();
    populateAssetOptions();
    attachControlHandlers();
    buildFigure();
  }catch(err){
    console.error(err);
    document.getElementById('helperText').textContent = `Data load error: ${err.message}`;
    document.getElementById('regimeBar').innerHTML = '<span class="badge badge-bear"><b>Load Error</b> Unable to load dashboard data.</span>';
  }
}
initDashboard();

