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
function currentHighVolumeState(row){
  const hv20=num(row?.high_volume_20);
  if(hv20!==null) return hv20>0;
  const hv7=num(row?.high_volume_7);
  if(hv7!==null) return hv7>0;
  const txt=String(row?.boll_overlap_volume_confirmation_flag || '').trim().toLowerCase();
  if(txt.includes('high')) return true;
  if(txt.includes('normal')) return false;
  const confirmed=num(row?.boll_overlap_break_confirmed_high_volume);
  if(confirmed!==null) return confirmed>0;
  const signalConfirmed=num(row?.signal_boll_overlap_break_confirmed_high_volume);
  if(signalConfirmed!==null) return signalConfirmed>0;
  return false;
}
function overlapMidAt(overlap, idx){
  const ou=num(overlap?.up?.[idx]), ol=num(overlap?.low?.[idx]);
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
function activeOverlapVolatilityState(rows, overlap, idx, window=40){
  if(overlap?.family!=='contextual') return overlapVolatilityState(rows[idx]);
  const widths=[];
  for(let j=Math.max(0, idx-window+1); j<=idx; j++){
    const w=overlapWidthAt(overlap, j);
    if(w!==null) widths.push(w);
  }
  if(widths.length < 20) return overlapVolatilityState(rows[idx]);
  const current = overlapWidthAt(overlap, idx);
  const m = mean(widths), s = stddev(widths);
  if(current===null || m===null || s===null) return overlapVolatilityState(rows[idx]);
  return current > (m + s) ? 'High' : 'Low';
}
function overlapTrendContext(rows, overlap, idx, lookback=5){
  const currentMid = overlapMidAt(overlap, idx);
  const currentWidth = overlapWidthAt(overlap, idx);
  if(currentMid===null) return {midSlopePct:null, midAccelPct:null, widthSlopePct:null, widthExpanding:false};
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
  const widthExpanding = widthSlopePct!==null && widthSlopePct >= 0.10;
  return {midSlopePct, midAccelPct, widthSlopePct, widthExpanding};
}
function overlapCountertrendType(rows, overlap, idx){
  const outside = overlapOutsideType(rows[idx], overlap, idx);
  if(!outside) return null;
  const ctx = overlapTrendContext(rows, overlap, idx);
  const slope = ctx.midSlopePct;
  const accel = ctx.midAccelPct;
  const widthExpanding = ctx.widthExpanding;
  const hardDown = slope!==null && slope <= -0.025;
  const hardUp = slope!==null && slope >= 0.025;
  const accelDown = accel!==null && accel <= -0.008;
  const accelUp = accel!==null && accel >= 0.008;
  if(outside==='bullish' && hardDown && (accelDown || widthExpanding)) return 'bullish';
  if(outside==='bearish' && hardUp && (accelUp || widthExpanding)) return 'bearish';
  return null;
}
function overlapEventProfile(rows, overlap, idx){
  const outside = overlapOutsideType(rows[idx], overlap, idx);
  const volatility = outside ? activeOverlapVolatilityState(rows, overlap, idx) : 'Low';
  const highVolume = outside ? currentHighVolumeState(rows[idx]) : false;
  const cautionType = outside ? overlapCountertrendType(rows, overlap, idx) : null;
  const confirmed = !!outside && volatility==='High' && highVolume;
  const alignedConfirmedType = confirmed && !cautionType ? outside : null;
  const countertrendConfirmedType = confirmed && cautionType ? outside : null;
  const trend = overlapTrendContext(rows, overlap, idx);
  return {outside, volatility, highVolume, cautionType, confirmed, alignedConfirmedType, countertrendConfirmedType, trend};
}
function overlapTooltipReason(profile){
  const reasons=[];
  if(profile?.volatility==='High') reasons.push('elevated volatility');
  if(profile?.highVolume) reasons.push('high volume');
  if(profile?.trend?.widthExpanding) reasons.push('width expanding');
  const slope=profile?.trend?.midSlopePct;
  const accel=profile?.trend?.midAccelPct;
  if(slope!==null && Number.isFinite(slope)) reasons.push(`midline slope ${(slope*100).toFixed(1)}%`);
  if(accel!==null && Number.isFinite(accel)) reasons.push(`slope accel ${(accel*100).toFixed(1)}%`);
  return reasons.join(' · ');
}
function overlapConfirmedEventType(row, overlap, idx, rowsRef=null){
  if(rowsRef){
    const profile=overlapEventProfile(rowsRef, overlap, idx);
    return profile.alignedConfirmedType;
  }
  const type=overlapOutsideType(row, overlap, idx);
  if(!type) return null;
  if(overlapVolatilityState(row)!=='High') return null;
  if(!currentHighVolumeState(row)) return null;
  return type;
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
  const profile=overlapEventProfile(rows, overlap, idx);
  if(profile.cautionType==='bullish') return {label:'Bullish Pressure — Countertrend', cls:'badge-attn', code:'caution_bullish'};
  if(profile.cautionType==='bearish') return {label:'Bearish Pressure — Countertrend', cls:'badge-attn', code:'caution_bearish'};
  if(profile.alignedConfirmedType==='bullish') return {label:'Confirmed Bullish Pressure', cls:'badge-bull', code:'confirmed_bullish'};
  if(profile.alignedConfirmedType==='bearish') return {label:'Confirmed Bearish Pressure', cls:'badge-bear', code:'confirmed_bearish'};
  const outside=profile.outside;
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
  if(state.code==='caution_bullish' || state.code==='caution_bearish') return 'Countertrend Break Watch';
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
      annotation:'Combined overlap model: unavailable', latestConfirmed:'No confirmed alert in view.', latestEvent:'No event in view.', modelLabel: overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap'
    };
  }
  const latestRow=rows[latestIdx];
  const latestProfile=overlapEventProfile(rows, overlap, latestIdx);
  const state=overlapStateAt(rows, overlap, latestIdx);
  const structure=overlapStructureAt(rows, overlap, latestIdx);
  const currentEvent=overlapCurrentEventType(rows, overlap, latestIdx);
  const highVol=latestProfile.volatility==='High';
  const highVolume=latestProfile.highVolume;
  const condition=highVol ? 'High Volatility' : 'Stability';
  const volume=highVolume ? 'High Volume' : 'Normal Volume';
  const context=`${condition} · ${volume}`;
  const structureCls = structure==='Compression' ? 'badge-neutral' : (structure==='Expansion' ? 'badge-bear' : 'badge-neutral');
  const eventCls = /countertrend/i.test(currentEvent) ? 'badge-attn' : (/bullish/i.test(currentEvent) ? 'badge-bull' : (/bearish/i.test(currentEvent) ? 'badge-bear' : 'badge-neutral'));
  let latestConfirmed='No confirmed alert in view.';
  let latestEvent='No event in view.';
  for(let i=rows.length-1;i>=0;i--){
    if(!visibleMask[i]) continue;
    const profile=overlapEventProfile(rows, overlap, i);
    if(latestConfirmed==='No confirmed alert in view.' && profile.alignedConfirmedType){ latestConfirmed=`${profile.alignedConfirmedType==='bearish' ? 'Bearish Pressure' : 'Bullish Pressure'} • ${rows[i].date}`; }
    if(latestEvent==='No event in view.' && profile.cautionType){ latestEvent=`${profile.cautionType==='bearish' ? 'Bearish' : 'Bullish'} Pressure — Countertrend • ${rows[i].date}`; }
    if(latestConfirmed!=='No confirmed alert in view.' && latestEvent!=='No event in view.') break;
  }
  let narrative='Combined overlap is inside its expected joint range.';
  if(state.code==='caution_bullish') narrative='Price closed below the active overlap range with a confirmed break, but the overlap corridor is still falling aggressively. Treat bullish pressure as countertrend.';
  else if(state.code==='caution_bearish') narrative='Price closed above the active overlap range with a confirmed break, but the overlap corridor is still rising aggressively. Treat bearish pressure as countertrend.';
  else if(state.code==='confirmed_bullish') narrative='Price closed below the active overlap range with elevated volatility and high volume, confirming bullish pressure from the combined overlap model.';
  else if(state.code==='confirmed_bearish') narrative='Price closed above the active overlap range with elevated volatility and high volume, confirming bearish pressure from the combined overlap model.';
  else if(state.code==='bullish_pressure') narrative='Price is below the active overlap range, signaling bullish pressure from the combined overlap model.';
  else if(state.code==='bearish_pressure') narrative='Price is above the active overlap range, signaling bearish pressure from the combined overlap model.';
  else if(currentEvent==='Compression') narrative='Combined overlap is compressed relative to its recent width distribution, suggesting a tighter joint expectation range.';
  else if(currentEvent==='Expansion') narrative='Combined overlap is expanded relative to its recent width distribution, suggesting a broader joint expectation range.';
  else if(currentEvent==='Re-entry from Below' || currentEvent==='Re-entry from Above') narrative=`${currentEvent} suggests price has moved back into the combined overlap range.`;
  else if(currentEvent==='Bullish Rejection' || currentEvent==='Bearish Rejection') narrative=`${currentEvent} suggests price tested the advanced overlap boundary and failed to hold outside it.`;
  const modelLabel = overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap';
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
    latestEvent,
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
    `<span class="badge badge-neutral"><b>Latest Confirmed</b> ${info.latestConfirmed}</span>`,
    `<span class="badge badge-neutral"><b>Latest Event</b> ${info.latestEvent}</span>`
  ].join('');
}
function overlapTableauMarkers(rows, overlap, visibleMask){
  const bearishConfirmedX=[], bearishConfirmedY=[], bearishConfirmedText=[];
  const bullishConfirmedX=[], bullishConfirmedY=[], bullishConfirmedText=[];
  const bearishCautionX=[], bearishCautionY=[], bearishCautionText=[];
  const bullishCautionX=[], bullishCautionY=[], bullishCautionText=[];
  const hiVals=rows.map(r=>num(r.high)).filter(v=>v!==null);
  const loVals=rows.map(r=>num(r.low)).filter(v=>v!==null);
  const span=(hiVals.length && loVals.length) ? Math.max(1e-9, Math.max(...hiVals)-Math.min(...loVals)) : 1;
  const offset=span*0.014;
  const modelLabel = overlap?.family==='contextual' ? 'Contextual Overlap' : 'Canonical Overlap';
  for(let i=0;i<rows.length;i++){
    if(!visibleMask[i]) continue;
    const profile = overlapEventProfile(rows, overlap, i);
    if(!profile.confirmed) continue;
    const d=rows[i].dateObj;
    if(!(d instanceof Date)) continue;
    const hi=num(rows[i].high) ?? num(rows[i].close) ?? null;
    const lo=num(rows[i].low) ?? num(rows[i].close) ?? null;
    const reason = overlapTooltipReason(profile);
    if(profile.cautionType==='bearish' && hi!==null){ bearishCautionX.push(d); bearishCautionY.push(hi+offset); bearishCautionText.push(reason); continue; }
    if(profile.cautionType==='bullish' && lo!==null){ bullishCautionX.push(d); bullishCautionY.push(lo-offset); bullishCautionText.push(reason); continue; }
    if(profile.alignedConfirmedType==='bearish' && hi!==null){ bearishConfirmedX.push(d); bearishConfirmedY.push(hi+offset); bearishConfirmedText.push(reason); continue; }
    if(profile.alignedConfirmedType==='bullish' && lo!==null){ bullishConfirmedX.push(d); bullishConfirmedY.push(lo-offset); bullishConfirmedText.push(reason); continue; }
  }
  const traces=[];
  if(bearishConfirmedX.length){
    traces.push({type:'scatter',mode:'markers',x:bearishConfirmedX,y:bearishConfirmedY,xaxis:'x',yaxis:'y',name:'Bearish Confirmed Alert',showlegend:false,
      marker:{symbol:'diamond-open',size:8,color:'rgba(255,128,128,0.98)',line:{color:'rgba(255,128,128,0.98)',width:1.4}},text:bearishConfirmedText,
      hovertemplate:`%{x|%b %d, %Y}<br>${modelLabel}<br>Confirmed Bearish Pressure<br>%{text}<extra></extra>`});
  }
  if(bullishConfirmedX.length){
    traces.push({type:'scatter',mode:'markers',x:bullishConfirmedX,y:bullishConfirmedY,xaxis:'x',yaxis:'y',name:'Bullish Confirmed Alert',showlegend:false,
      marker:{symbol:'diamond-open',size:8,color:'rgba(112,232,148,0.98)',line:{color:'rgba(112,232,148,0.98)',width:1.4}},text:bullishConfirmedText,
      hovertemplate:`%{x|%b %d, %Y}<br>${modelLabel}<br>Confirmed Bullish Pressure<br>%{text}<extra></extra>`});
  }
  if(bearishCautionX.length){
    traces.push({type:'scatter',mode:'markers',x:bearishCautionX,y:bearishCautionY,xaxis:'x',yaxis:'y',name:'Bearish Countertrend Caution',showlegend:false,
      marker:{symbol:'triangle-down',size:9,color:'rgba(242,201,76,0.98)',line:{color:'rgba(242,201,76,0.98)',width:1.2}},text:bearishCautionText,
      hovertemplate:`%{x|%b %d, %Y}<br>${modelLabel}<br>Bearish Pressure — Countertrend<br>%{text}<extra></extra>`});
  }
  if(bullishCautionX.length){
    traces.push({type:'scatter',mode:'markers',x:bullishCautionX,y:bullishCautionY,xaxis:'x',yaxis:'y',name:'Bullish Countertrend Caution',showlegend:false,
      marker:{symbol:'triangle-up',size:9,color:'rgba(242,201,76,0.98)',line:{color:'rgba(242,201,76,0.98)',width:1.2}},text:bullishCautionText,
      hovertemplate:`%{x|%b %d, %Y}<br>${modelLabel}<br>Bullish Pressure — Countertrend<br>%{text}<extra></extra>`});
  }
  return traces;
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
  if(bollinger==='contextual' || bollinger==='overlap' || bollinger==='both') helperParts.push('confirmed alerts still require outside overlap + High boll_volatility_flag + high volume');
  if(sentRibbonInfo.usedHybridOffsets) helperParts.push('full ribbon uses anchored MA 21 centerline plus smoothed family offsets');
  const currentRegimeInfo=regimeInfo[rows.length-1] || {regime:'Flat', confidence:0, basis:'derived'};
  const scaleModeLabel = scaleMode==='price_only' ? 'price only' : (scaleMode==='all_visible' ? 'all visible traces' : 'price + price overlays');
  helperParts.push(`scale mode: ${scaleModeLabel}`);
  helperParts.push(`regime basis: ${currentRegimeInfo.basis || 'derived'}`);
  if(engagement!=='off') helperParts.push(engagement==='overlay' ? 'attention overlay marks soft participation days and stronger event bursts' : 'attention badges show level, conviction, and regime');
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
  const overlapMarkerTraces=overlapTableauMarkers(rows, ov, visibleMask);
  if(bollinger==='overlap' || bollinger==='contextual') addFilledBand(data,xs,ov.up,ov.low,COLORS.overlapBand,COLORS.overlapFill,overlapInfo.modelLabel,'y');
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
    latestEvent: showOverlapContext ? `<span class="badge badge-neutral"><b>Latest Event</b> ${overlapInfo.latestEvent}</span>` : null,
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
  const badgeParts=(badgeOrder() || []).map(key=>badgeMap[key]).filter(Boolean);
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
  data.push({type:'bar',x:xs,y:hist,name:'MACD Histogram',marker:{color:histColors},xaxis:'x2',yaxis:'y2',hovertemplate:'%{x|%b %d, %Y}<br>Histogram=%{y:.2f}<extra></extra>'});
  data.push(traceLine(xs,rows.map(r=>num(r.macd)),'MACD',COLORS.ma7,2.0,'solid','y2',true,'%{x|%b %d, %Y}<br>MACD=%{y:.2f}<extra></extra>'));
  data.push(traceLine(xs,rows.map(r=>num(r.macd_signal)),'Signal',COLORS.ma50,1.5,'solid','y2',true,'%{x|%b %d, %Y}<br>Signal=%{y:.2f}<extra></extra>'));
  if(osc==='both'){
    sentimentBundle(xs,rows.map(r=>num(r.scaled_sentiment_macd)),'Scaled Sentiment MACD','y2',true,'%{x|%b %d, %Y}<br>Scaled Sentiment MACD=%{y:.2f}<extra></extra>',1.2).forEach(t=>data.push(t));
    sentimentBundle(xs,rows.map(r=>num(r.scaled_sentiment_macd_signal)),'Scaled Sentiment Signal','y2',true,'%{x|%b %d, %Y}<br>Scaled Sentiment Signal=%{y:.2f}<extra></extra>',1.0).forEach(t=>data.push(t));
  }

  const crossX=[],crossY=[],crossText=[],crossSize=[],crossColor=[];
  rows.forEach(r=>{const c=num(r.macd_signal_cross), y=num(r.macd); if(c===1||c===-1){crossX.push(r.dateObj); crossY.push(y); crossText.push(c===1?'Bull':'Bear'); crossSize.push(Math.min(18,10+Math.abs(num(r.macd_cross_significance)||0)*2)); crossColor.push(c===1?'rgba(40,220,90,0.85)':'rgba(255,110,110,0.85)');}});
  if(crossX.length) data.push({type:'scatter',mode:'markers+text',x:crossX,y:crossY,text:crossText,textposition:'top center',xaxis:'x2',yaxis:'y2',marker:{size:crossSize,color:crossColor,symbol:'triangle-up'},name:'Crosses',hovertemplate:'%{x|%b %d, %Y}<br>%{text} Cross<extra></extra>'});

  data.push(traceLine(xs,rows.map(r=>num(r.rsi_d)||num(r.rsi)),'RSI',COLORS.rsi,2.0,'solid','y3',true,'%{x|%b %d, %Y}<br>RSI=%{y:.2f}<extra></extra>'));
  if(osc==='both') sentimentBundle(xs,rows.map(r=>num(r.sentiment_rsi_d)||num(r.sentiment_rsi)),'Sentiment RSI','y3',true,'%{x|%b %d, %Y}<br>Sentiment RSI=%{y:.2f}<extra></extra>',1.1).forEach(t=>data.push(t));
  data.push(traceLine(xs,rows.map(r=>num(r.stochastic_rsi)),'Stoch RSI %K',COLORS.stoch,1.8,'solid','y4',true,'%{x|%b %d, %Y}<br>Stoch RSI %K=%{y:.2f}<extra></extra>'));
  data.push(traceLine(xs,rows.map(r=>num(r.stochastic_rsi_d)),'Stoch RSI %D',COLORS.stochD,1.3,'solid','y4',true,'%{x|%b %d, %Y}<br>Stoch RSI %D=%{y:.2f}<extra></extra>'));
  if(osc==='both') sentimentBundle(xs,rows.map(r=>num(r.sentiment_stochastic_rsi_d)),'Sentiment Stoch RSI','y4',true,'%{x|%b %d, %Y}<br>Sentiment Stoch RSI=%{y:.2f}<extra></extra>',1.0).forEach(t=>data.push(t));

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
      ...(cfg.showRibbonAnnotation !== false && regimeLayer==='on' && showSentRibbon ? [{xref:'paper',yref:'paper',x:0.01,y:0.985,xanchor:'left',text:`Sentiment Ribbon: ${lastRegimeInfo.regime} | Confidence: ${(lastRegimeInfo.confidence ?? 0).toFixed(0)} | ${(lastRegimeInfo.compression ? 'Compressed' : ((lastRegimeInfo.widthZ ?? 0)>=0 ? 'Expanding' : 'Narrowing'))}`,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...((bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') ? [{xref:'paper',yref:'paper',x:0.01,y: cfg.compactAnnotations ? 0.972 : 0.955,xanchor:'left',text: cfg.compactAnnotations ? `${overlapInfo.modelLabel}: ${overlapInfo.stateLabel} | ${overlapInfo.context}` : overlapInfo.annotation,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...(cfg.showAttentionAnnotation && engagement!=='off' ? [{xref:'paper',yref:'paper',x:0.99,y:0.955,xanchor:'right',text:`Attention: ${engagementInfo.levelLabel} | ${engagementInfo.convictionLabel} | ${engagementInfo.regimeLabel}`,showarrow:false,align:'right',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),
      ...(cfg.showMacdAnnotation !== false && lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.495,xanchor:'left',text:`MACD: ${macdRegime} | Last Cross: ${lastCrossText} | Histogram: ${histDir} | Sentiment confirmation: ${sentConf}`,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : [])
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

