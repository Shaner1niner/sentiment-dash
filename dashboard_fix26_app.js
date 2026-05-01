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



// phaseG_market_tape_loader_foundation_v1



let SCREENER_STORE = null;



let SCREENER_SECTION = "top_priority";



const SCREENER_STORE_URL = new URLSearchParams(location.search).get("screener") || window.SETA_SCREENER_STORE_URL || "fix26_screener_store.json";







window.SETA_BUILD_INFO = {



  build: "rightdrawer_restore_001",



  branch: "phase-e-stability-build-info",



  dashboard: "fix26",



  mode: window.DASH_MODE || "unknown",



  alertPolicy: "stable-right-drawer",



  updated: "2026-04-25"



};



// BEGIN phase_seta_perf_diagnostics_v1



(function phase_seta_perf_diagnostics_v1(){



  if (window.__phase_seta_perf_diagnostics_v1) return;



  window.__phase_seta_perf_diagnostics_v1 = true;







  const state = {



    enabled: true,



    expanded: false,



    lastPlotFn: "n/a",



    lastRenderMs: null,



    lastFetchMs: null,



    lastFetchUrl: "",



    lastAt: null,



    lastError: "",



    traces: 0,



    points: 0,



    rows: 0,



    customRows: 0,



    customCells: 0



  };



  window.SETA_PERF_DIAG = state;







  function safeNum(n){ return Number.isFinite(Number(n)) ? Number(n) : null; }



  function fmtMs(ms){



    const n = safeNum(ms);



    if (n === null) return "n/a";



    return n >= 1000 ? (n/1000).toFixed(2) + "s" : Math.round(n) + "ms";



  }



  function fmtInt(n){



    const x = safeNum(n);



    if (x === null) return "0";



    return Math.round(x).toLocaleString();



  }



  function shortUrl(u){



    const s = String(u || "");



    return s.split("?")[0].split("/").pop() || s || "n/a";



  }



  function selectedValue(id){



    const el = document.getElementById(id);



    return el ? (el.value || el.textContent || "n/a") : "n/a";



  }



  function memoryLine(){



    try{



      if (!performance || !performance.memory) return "";



      const used = performance.memory.usedJSHeapSize / 1048576;



      const limit = performance.memory.jsHeapSizeLimit / 1048576;



      if (!Number.isFinite(used) || !Number.isFinite(limit)) return "";



      return "Heap " + used.toFixed(0) + " / " + limit.toFixed(0) + " MB";



    }catch(_){ return ""; }



  }



  function traceStats(data){



    const traces = Array.isArray(data) ? data : [];



    let points = 0;



    let rows = 0;



    let customRows = 0;



    let customCells = 0;







    traces.forEach(t => {



      const xLen = Array.isArray(t && t.x) ? t.x.length : 0;



      const yLen = Array.isArray(t && t.y) ? t.y.length : 0;



      const openLen = Array.isArray(t && t.open) ? t.open.length : 0;



      const closeLen = Array.isArray(t && t.close) ? t.close.length : 0;



      const len = Math.max(xLen, yLen, openLen, closeLen);



      points += len;



      rows = Math.max(rows, len);







      const cd = t && t.customdata;



      if (Array.isArray(cd)){



        customRows += cd.length;



        for (let i=0; i<cd.length; i++){



          const r = cd[i];



          customCells += Array.isArray(r) ? r.length : (r == null ? 0 : 1);



        }



      }



    });







    return {traces: traces.length, points, rows, customRows, customCells};



  }







  function panel(){



    let el = document.getElementById("setaPerfDiagnosticsPanel");



    if (el) return el;



    if (!document.body) return null;







    el = document.createElement("button");



    el.id = "setaPerfDiagnosticsPanel";



    el.type = "button";



    el.title = "SETA dashboard performance diagnostics. Click to expand/collapse.";



    el.setAttribute("aria-label", "SETA dashboard performance diagnostics");



    el.addEventListener("click", function(){



      state.expanded = !state.expanded;



      updatePanel();



    });



    document.body.appendChild(el);



    return el;



  }







  function injectStyle(){



    if (document.getElementById("phase_seta_perf_diagnostics_v1_style")) return;



    if (!document.head) return;



    const style = document.createElement("style");



    style.id = "phase_seta_perf_diagnostics_v1_style";



    style.textContent = `



      #setaPerfDiagnosticsPanel{



        position:fixed;



        left:10px;



        bottom:10px;



        z-index:2147483000;



        max-width:520px;



        border:1px solid rgba(92,140,160,.55);



        border-radius:10px;



        background:rgba(7,10,13,.84);



        color:#b8f7d0;



        font:11px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;



        padding:6px 9px;



        text-align:left;



        box-shadow:0 8px 24px rgba(0,0,0,.35);



        cursor:pointer;



        opacity:.82;



        backdrop-filter:blur(4px);



        white-space:nowrap;



      }



      #setaPerfDiagnosticsPanel:hover{opacity:1;border-color:rgba(122,190,220,.85);}



      #setaPerfDiagnosticsPanel .warn{color:#ffdf7a;}



      #setaPerfDiagnosticsPanel .bad{color:#ff8b8b;}



      #setaPerfDiagnosticsPanel .muted{color:#8ea4ad;}



      #setaPerfDiagnosticsPanel .line{display:block;white-space:normal;}



      @media print{#setaPerfDiagnosticsPanel{display:none!important;}}



    `;



    document.head.appendChild(style);



  }







  function severityClass(ms){



    const n = safeNum(ms);



    if (n === null) return "";



    if (n >= 3000) return "bad";



    if (n >= 1500) return "warn";



    return "";



  }







  function updatePanel(){



    injectStyle();



    const el = panel();



    if (!el) return;







    const renderCls = severityClass(state.lastRenderMs);



    const core =



      `Perf: ${fmtInt(state.rows)} rows · ${fmtInt(state.traces)} traces · ` +



      `${fmtInt(state.points)} pts · render ` +



      `<span class="${renderCls}">${fmtMs(state.lastRenderMs)}</span>` +



      (state.lastFetchMs != null ? ` · fetch ${fmtMs(state.lastFetchMs)}` : "");







    if (!state.expanded){



      el.innerHTML = core;



      return;



    }







    const mem = memoryLine();



    const when = state.lastAt ? state.lastAt.toLocaleTimeString() : "n/a";



    const mode = (typeof currentMode === "function") ? currentMode() : "n/a";







    el.innerHTML = [



      `<span class="line">${core}</span>`,



      `<span class="line muted">Mode ${mode} · ${selectedValue("asset")} · ${selectedValue("freq")} · ${selectedValue("range")}</span>`,



      `<span class="line muted">Bands ${selectedValue("bollinger")} · Timing ${selectedValue("osc")} · Attention ${selectedValue("engagement")}</span>`,



      `<span class="line muted">Customdata ${fmtInt(state.customRows)} rows / ${fmtInt(state.customCells)} cells · plot ${state.lastPlotFn} · ${when}</span>`,



      `<span class="line muted">Fetch ${shortUrl(state.lastFetchUrl)} · ${fmtMs(state.lastFetchMs)}${mem ? " · " + mem : ""}</span>`,



      state.lastError ? `<span class="line bad">Last error: ${String(state.lastError).slice(0,180)}</span>` : "",



      `<span class="line muted">Click to collapse.</span>`



    ].filter(Boolean).join("");



  }







  function recordPlot(fnName, data, startedAt){



    const stats = traceStats(data);



    state.lastPlotFn = fnName;



    state.lastRenderMs = performance.now() - startedAt;



    state.lastAt = new Date();



    state.traces = stats.traces;



    state.points = stats.points;



    state.rows = stats.rows;



    state.customRows = stats.customRows;



    state.customCells = stats.customCells;



    state.lastError = "";



    updatePanel();



  }







  function patchPlotly(){



    const P = window.Plotly;



    if (!P || P.__setaPerfDiagnosticsPatched) return false;







    ["newPlot","react"].forEach(fnName => {



      const original = P[fnName];



      if (typeof original !== "function" || original.__setaPerfDiagnosticsWrapped) return;







      function wrappedPlotlyCall(gd, data, layout, config){



        const startedAt = performance.now();



        try{



          const result = original.apply(this, arguments);



          if (result && typeof result.then === "function"){



            return result.then(



              value => { recordPlot(fnName, data, startedAt); return value; },



              err => {



                state.lastError = fnName + ": " + (err && err.message ? err.message : String(err));



                updatePanel();



                throw err;



              }



            );



          }



          recordPlot(fnName, data, startedAt);



          return result;



        }catch(err){



          state.lastError = fnName + ": " + (err && err.message ? err.message : String(err));



          updatePanel();



          throw err;



        }



      }



      wrappedPlotlyCall.__setaPerfDiagnosticsWrapped = true;



      P[fnName] = wrappedPlotlyCall;



    });







    P.__setaPerfDiagnosticsPatched = true;



    updatePanel();



    return true;



  }







  function patchFetch(){



    if (window.__setaPerfDiagnosticsFetchPatched || typeof window.fetch !== "function") return;



    const originalFetch = window.fetch.bind(window);



    window.fetch = function(){



      const startedAt = performance.now();



      const url = arguments[0] && arguments[0].url ? arguments[0].url : arguments[0];



      return originalFetch.apply(this, arguments).then(response => {



        const elapsed = performance.now() - startedAt;



        const u = String(url || "");



        if (/\.json(\?|$)|chart_store|screener|manifest/i.test(u)){



          state.lastFetchMs = elapsed;



          state.lastFetchUrl = u;



          updatePanel();



        }



        return response;



      });



    };



    window.__setaPerfDiagnosticsFetchPatched = true;



  }







  function boot(){



    injectStyle();



    patchFetch();



    updatePanel();



    if (!patchPlotly()){



      const timer = setInterval(() => {



        if (patchPlotly()) clearInterval(timer);



      }, 250);



      setTimeout(() => clearInterval(timer), 15000);



    }



  }







  if (document.readyState === "loading"){



    document.addEventListener("DOMContentLoaded", boot, {once:true});



  }else{



    boot();



  }



})();



// END phase_seta_perf_diagnostics_v1















// BEGIN phase_seta_custom_dropdowns_v1
(function phase_seta_custom_dropdowns_v1(){
  if (window.__phase_seta_custom_dropdowns_v1) return;
  window.__phase_seta_custom_dropdowns_v1 = true;

  let openWrap = null;

  function esc(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, ch => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    }[ch]));
  }

  function injectStyle(){
    if (document.getElementById("phase_seta_custom_dropdowns_v1_style")) return;
    if (!document.head) return;
    const style = document.createElement("style");
    style.id = "phase_seta_custom_dropdowns_v1_style";
    style.textContent = `
      .setaCustomSelectWrap{
        position:relative;
        display:inline-block;
        vertical-align:top;
        min-width:112px;
      }
      .setaCustomSelectWrap select.setaNativeSelectHidden{
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        opacity:0 !important;
        pointer-events:none !important;
        tab-index:-1;
      }
      .setaCustomSelectButton{
        width:100%;
        min-height:38px;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:9px 12px;
        border-radius:9px;
        border:1px solid rgba(92,140,160,.45);
        background:#0b0f14;
        color:#ffffff;
        font:600 13px/1.2 inherit;
        cursor:pointer;
        text-align:left;
        box-shadow:inset 0 1px 0 rgba(255,255,255,.03);
      }
      .setaCustomSelectButton:hover{
        border-color:rgba(122,190,220,.68);
        background:#10161c;
      }
      .setaCustomSelectButton:focus{
        outline:none;
        border-color:rgba(94,234,212,.78);
        box-shadow:0 0 0 2px rgba(94,234,212,.13);
      }
      .setaCustomSelectButton[aria-expanded="true"]{
        border-color:rgba(255,218,78,.82);
        box-shadow:0 0 0 2px rgba(255,218,78,.10);
      }
      .setaCustomSelectLabel{
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      .setaCustomSelectChevron{
        flex:0 0 auto;
        width:0;
        height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid #d9e9f0;
        opacity:.9;
      }
      .setaCustomSelectWrap.open .setaCustomSelectChevron{
        transform:rotate(180deg);
      }
      .setaCustomSelectMenu{
        position:absolute;
        left:0;
        top:calc(100% + 4px);
        z-index:2147482500;
        min-width:100%;
        max-width:min(360px, 92vw);
        max-height:280px;
        overflow:auto;
        display:none;
        padding:5px;
        border:1px solid rgba(92,140,160,.62);
        border-radius:10px;
        background:#080c10;
        box-shadow:0 18px 40px rgba(0,0,0,.58), 0 0 0 1px rgba(255,255,255,.03) inset;
      }
      .setaCustomSelectWrap.open .setaCustomSelectMenu{
        display:block;
      }
      .setaCustomSelectOption{
        width:100%;
        display:block;
        padding:8px 10px;
        border:0;
        border-radius:7px;
        background:transparent;
        color:#e7eef3;
        font:600 12px/1.2 inherit;
        text-align:left;
        cursor:pointer;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .setaCustomSelectOption:hover,
      .setaCustomSelectOption:focus{
        outline:none;
        background:#14202a;
        color:#ffffff;
      }
      .setaCustomSelectOption.selected{
        background:rgba(255,218,78,.16);
        color:#ffde4e;
      }
      .setaCustomSelectOption[disabled]{
        opacity:.45;
        cursor:not-allowed;
      }
      .setaCustomSelectOptgroup{
        padding:7px 9px 4px;
        color:#8ea4ad;
        font:700 10px/1.2 inherit;
        text-transform:uppercase;
        letter-spacing:.05em;
      }
      @media print{
        .setaCustomSelectMenu{display:none!important;}
      }
    `;
    document.head.appendChild(style);
  }

  function selectedOption(sel){
    return sel.options && sel.options.length ? sel.options[sel.selectedIndex >= 0 ? sel.selectedIndex : 0] : null;
  }

  function syncNativeSelect(sel, value){
    if (sel.value === value) return;
    sel.value = value;
    sel.dispatchEvent(new Event("input", {bubbles:true}));
    sel.dispatchEvent(new Event("change", {bubbles:true}));
  }

  function closeMenu(wrap){
    if (!wrap) return;
    wrap.classList.remove("open");
    const btn = wrap.querySelector(".setaCustomSelectButton");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (openWrap === wrap) openWrap = null;
  }

  function closeAll(){
    document.querySelectorAll(".setaCustomSelectWrap.open").forEach(closeMenu);
    openWrap = null;
  }

  function openMenu(wrap){
    if (!wrap) return;
    if (openWrap && openWrap !== wrap) closeMenu(openWrap);
    wrap.classList.add("open");
    openWrap = wrap;
    const btn = wrap.querySelector(".setaCustomSelectButton");
    if (btn) btn.setAttribute("aria-expanded", "true");
    const selected = wrap.querySelector(".setaCustomSelectOption.selected");
    if (selected) {
      try { selected.scrollIntoView({block:"nearest"}); } catch(_){}
    }
  }

  function optionButton(sel, opt){
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "setaCustomSelectOption";
    btn.setAttribute("role", "option");
    btn.dataset.value = opt.value;
    btn.innerHTML = esc(opt.textContent || opt.label || opt.value);
    if (opt.disabled) btn.disabled = true;
    if (opt.selected) {
      btn.classList.add("selected");
      btn.setAttribute("aria-selected", "true");
    } else {
      btn.setAttribute("aria-selected", "false");
    }
    btn.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      if (btn.disabled) return;
      syncNativeSelect(sel, opt.value);
      const wrap = sel.closest(".setaCustomSelectWrap");
      renderSelect(sel);
      closeMenu(wrap);
      const trigger = wrap && wrap.querySelector(".setaCustomSelectButton");
      if (trigger) trigger.focus();
    });
    return btn;
  }

  function renderMenuOptions(sel, menu){
    menu.innerHTML = "";
    Array.from(sel.children).forEach(child => {
      if (child.tagName === "OPTGROUP"){
        const label = document.createElement("div");
        label.className = "setaCustomSelectOptgroup";
        label.textContent = child.label || "";
        menu.appendChild(label);
        Array.from(child.children).forEach(opt => menu.appendChild(optionButton(sel, opt)));
      } else if (child.tagName === "OPTION") {
        menu.appendChild(optionButton(sel, child));
      }
    });
  }

  function renderSelect(sel){
    const wrap = sel.closest(".setaCustomSelectWrap");
    if (!wrap) return;
    const label = wrap.querySelector(".setaCustomSelectLabel");
    const menu = wrap.querySelector(".setaCustomSelectMenu");
    const opt = selectedOption(sel);
    if (label) label.textContent = opt ? (opt.textContent || opt.label || opt.value) : "";
    if (menu) renderMenuOptions(sel, menu);

    // Keep the custom control aligned to the original select/control dimensions.
    const parentControl = wrap.closest(".control");
    const sourceWidth = Number(sel.dataset.setaOriginalWidth || 0);
    const currentWidth = sourceWidth || Math.max(112, Math.round(wrap.getBoundingClientRect().width || 0));
    if (currentWidth) wrap.style.width = currentWidth + "px";
    if (parentControl) wrap.style.maxWidth = "100%";
  }

  function enhanceSelect(sel){
    if (!sel || sel.dataset.setaCustomDropdown === "1") return;
    if (sel.closest(".setaCustomSelectWrap")) return;

    const rect = sel.getBoundingClientRect();
    if (rect.width) sel.dataset.setaOriginalWidth = String(Math.max(112, Math.round(rect.width)));

    const wrap = document.createElement("div");
    wrap.className = "setaCustomSelectWrap";
    wrap.style.width = (sel.dataset.setaOriginalWidth || Math.max(112, Math.round(sel.offsetWidth || 112))) + "px";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "setaCustomSelectButton";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `<span class="setaCustomSelectLabel"></span><span class="setaCustomSelectChevron" aria-hidden="true"></span>`;

    const menu = document.createElement("div");
    menu.className = "setaCustomSelectMenu";
    menu.setAttribute("role", "listbox");

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    sel.dataset.setaCustomDropdown = "1";
    sel.classList.add("setaNativeSelectHidden");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");

    btn.addEventListener("click", ev => {
      ev.preventDefault();
      ev.stopPropagation();
      if (wrap.classList.contains("open")) closeMenu(wrap);
      else openMenu(wrap);
    });

    btn.addEventListener("keydown", ev => {
      const options = Array.from(wrap.querySelectorAll(".setaCustomSelectOption:not([disabled])"));
      if (ev.key === "Escape"){
        closeMenu(wrap);
      } else if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " "){
        ev.preventDefault();
        openMenu(wrap);
        const selected = wrap.querySelector(".setaCustomSelectOption.selected:not([disabled])") || options[0];
        if (selected) selected.focus();
      }
    });

    menu.addEventListener("keydown", ev => {
      const options = Array.from(wrap.querySelectorAll(".setaCustomSelectOption:not([disabled])"));
      const idx = options.indexOf(document.activeElement);
      if (ev.key === "Escape"){
        ev.preventDefault();
        closeMenu(wrap);
        btn.focus();
      } else if (ev.key === "ArrowDown"){
        ev.preventDefault();
        (options[Math.min(options.length - 1, idx + 1)] || options[0])?.focus();
      } else if (ev.key === "ArrowUp"){
        ev.preventDefault();
        (options[Math.max(0, idx - 1)] || options[options.length - 1])?.focus();
      }
    });

    sel.addEventListener("change", () => renderSelect(sel));

    const optObserver = new MutationObserver(() => renderSelect(sel));
    optObserver.observe(sel, {childList:true, subtree:true, attributes:true, attributeFilter:["selected","disabled","label","value"]});

    renderSelect(sel);
  }

  function enhanceAll(){
    document.querySelectorAll("select").forEach(enhanceSelect);
  }

  function boot(){
    injectStyle();
    enhanceAll();

    document.addEventListener("click", ev => {
      if (!ev.target || !ev.target.closest || !ev.target.closest(".setaCustomSelectWrap")) closeAll();
    }, true);

    document.addEventListener("keydown", ev => {
      if (ev.key === "Escape") closeAll();
    }, true);

    const obs = new MutationObserver(() => enhanceAll());
    if (document.body) obs.observe(document.body, {childList:true, subtree:true});

    window.addEventListener("resize", () => {
      document.querySelectorAll("select[data-seta-custom-dropdown='1']").forEach(renderSelect);
    });
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot, {once:true});
  }else{
    boot();
  }
})();
// END phase_seta_custom_dropdowns_v1
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







async function loadScreenerStore(){



  try{



    const res = await fetch(SCREENER_STORE_URL, {cache:"no-store"});



    if(!res.ok){



      console.warn(`Screener store not available from ${SCREENER_STORE_URL}: ${res.status}`);



      SCREENER_STORE = null;



      return;



    }



    SCREENER_STORE = await res.json();



    window.SCREENER_STORE = SCREENER_STORE;



  }catch(err){



    console.warn("Screener store load failed:", err);



    SCREENER_STORE = null;



    window.SCREENER_STORE = null;



  }



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



    `<span class="badge ${cls}"><b>Ribbon</b> ${current.regime}</span>`,



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



  const custom = rows.map((r,i)=>{



    const score=setaScoreFromRow(r);



    const attention=firstFiniteFromRow(r,[



      'attention_level_score',



      'attention_regime_score',



      'attention_spike_score',



      'attention_participation_score'



    ]);



    const ribbon=firstTextFromRow(r,[



      'sent_ribbon_label',



      'sentiment_ribbon_label',



      'sent_ribbon_regime_raw',



      'ribbon_label'



    ]) || 'n/a';



    const rsiGap=oscillatorGapInfo(



      num(r.rsi_d) ?? num(r.rsi),



      num(r.sentiment_rsi_d) ?? num(r.sentiment_rsi),



      'rsi'



    );



    const stochGap=oscillatorGapInfo(



      num(r.stochastic_rsi),



      num(r.sentiment_stochastic_rsi_d) ?? num(r.sentiment_stochastic_rsi),



      'stoch'



    );



    return [



      playbook[i]?.tag || 'Inside Expected Range',



      playbook[i]?.family || 'Baseline',



      playbook[i]?.confidence || 'Low',



      playbook[i]?.detail || 'No playbook context available.',



      playbook[i]?.stateLabel || 'Unavailable',



      playbook[i]?.structure || 'Unknown',



      playbook[i]?.contextLabel || 'n/a',



      setaScoreAttentionLine(score, attention),



      attention===null ? 'n/a' : attention.toFixed(1),



      ribbon,



      rsiGap.label,



      stochGap.label



    ];



  });







  // Compact envelope hover: keep contextual signal + SETA state, but avoid long narrative text.



  const hover = `%{x|%b %d, %Y}<br><b>${namePrefix}</b> · %{customdata[0]}<br>%{customdata[4]} · %{customdata[5]} · %{customdata[2]} confidence<br><b>SETA</b> %{customdata[7]}<br>Ribbon %{customdata[9]} · RSI %{customdata[10]}<br>Stoch %{customdata[11]}<extra></extra>`;







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



    hovertemplate:hover, hoveron:'fills', fill:'tonexty', fillcolor:fillColor, opacity:0.95



  });



}



function formatPct(v){



  return (v===null || !Number.isFinite(v)) ? 'n/a' : `${(v*100).toFixed(1)}%`;



}







function formatNum(v, digits=1){



  return (v===null || !Number.isFinite(v)) ? 'n/a' : Number(v).toFixed(digits);



}







function oscillatorGapInfo(priceVal, sentVal, kind='rsi'){



  const price=num(priceVal), sent=num(sentVal);



  if(price===null || sent===null) return {gap:null, tier:'n/a', direction:'n/a', label:'Gap n/a'};



  const gap=sent-price;



  const abs=Math.abs(gap);



  const tier = abs>=25 ? 'Extreme' : (abs>=15 ? 'Material' : (abs>=8 ? 'Notable' : 'Aligned'));



  let direction='Aligned';



  if(tier!=='Aligned'){



    if(gap>0) direction=(kind==='stoch' && price<=30) ? 'Sent Repair' : 'Sent Lead';



    else direction=(kind==='stoch' && price>=70) ? 'Sent Deterioration' : 'Price Lead';



  }



  const signed=(gap>=0?'+':'')+gap.toFixed(1);



  const label = direction==='Aligned' ? `Aligned ${signed}` : `${direction} ${signed} · ${tier}`;



  return {gap, tier, direction, label};



}







function firstFiniteFromRow(row, keys){



  for(const key of keys){



    const v=num(row?.[key]);



    if(v!==null && Number.isFinite(v)) return v;



  }



  return null;



}



function firstTextFromRow(row, keys){



  for(const key of keys){



    const v=row?.[key];



    if(v!==null && v!==undefined && String(v).trim()!=='') return String(v).trim();



  }



  return null;



}



function setaScoreFromRow(row){



  return firstFiniteFromRow(row,[



    'seta_dashboard_summary_score',



    'seta_summary_score',



    'summary_score_0_100',



    'summary_score',



    'dashboard_score',



    'screener_summary_score'



  ]);



}



function setaScoreAttentionLine(score, attention){



  const scorePart = score===null ? null : `Score ${Math.round(score)}`;



  const attnPart = attention===null ? null : `Attn ${attention.toFixed(1)}`;



  return [scorePart, attnPart].filter(Boolean).join(' · ') || 'Context unavailable';



}



function priceHoverContextCustomData(rows, regimeInfo, overlap){



  return rows.map((row,i)=>{



    const score=setaScoreFromRow(row);



    const attention=firstFiniteFromRow(row,[



      'attention_level_score',



      'attention_regime_score',



      'attention_spike_score',



      'attention_participation_score'



    ]);



    const ribbon=firstTextFromRow(row,[



      'sent_ribbon_label',



      'sentiment_ribbon_label',



      'sent_ribbon_regime_raw',



      'ribbon_label'



    ]) || regimeInfo?.[i]?.regime || 'n/a';



    const overlapProfile=overlap ? overlapPlaybookProfile(rows, overlap, i) : null;



    const overlapText=overlapProfile



      ? `${overlapProfile.tag || 'Inside Expected Range'} · ${overlapProfile.structure || 'Unknown'}`



      : 'n/a';



    const rsiGap=oscillatorGapInfo(



      num(row.rsi_d) ?? num(row.rsi),



      num(row.sentiment_rsi_d) ?? num(row.sentiment_rsi),



      'rsi'



    );



    const stochGap=oscillatorGapInfo(



      num(row.stochastic_rsi),



      num(row.sentiment_stochastic_rsi_d) ?? num(row.sentiment_stochastic_rsi),



      'stoch'



    );



    return [



      setaScoreAttentionLine(score, attention),



      attention===null ? 'n/a' : attention.toFixed(1),



      ribbon,



      overlapText,



      rsiGap.label,



      stochGap.label



    ];



  });



}



function priceHoverTemplate(kind='candles'){



  const priceBlock = kind==='candles'



    ? 'O=%{open:.2f} H=%{high:.2f} L=%{low:.2f} C=%{close:.2f}'



    : 'Close=%{y:.2f}';



  return `%{x|%b %d, %Y}<br><b>Price</b> · ${priceBlock}<br><b>SETA</b> %{customdata[0]}<br>Ribbon %{customdata[2]} · Overlap %{customdata[3]}<br>RSI %{customdata[4]}<br>Stoch %{customdata[5]}<extra></extra>`;



}



function hoverDateLabel(row){



  const d = row?.dateObj instanceof Date ? row.dateObj : new Date(String(row?.date || '') + 'T00:00:00');



  if(Number.isNaN(d.getTime())) return String(row?.date || '');



  return d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});



}



function priceHoverText(rows, regimeInfo, overlap, kind='candles'){



  const ctx = priceHoverContextCustomData(rows, regimeInfo, overlap);



  return rows.map((row,i)=>{



    const c = ctx[i] || ['n/a','n/a','n/a','n/a','n/a','n/a'];



    const priceBlock = kind==='candles'



      ? `O/H/L/C ${formatNum(num(row.open),2)} / ${formatNum(num(row.high),2)} / ${formatNum(num(row.low),2)} / ${formatNum(num(row.close),2)}`



      : `Close ${formatNum(num(row.close),2)}`;



    return `${hoverDateLabel(row)}<br><b>Price</b> · ${priceBlock}<br><b>SETA</b> ${c[0]}<br>Ribbon ${c[2]} · Overlap ${c[3]}<br>RSI ${c[4]}<br>Stoch ${c[5]}`;



  });



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



function syncAlertSidePanelHeight(){



  const chart=document.getElementById('chart');



  const panel=document.getElementById('alertSidePanel');



  if(!chart || !panel) return;



  if(panel.classList.contains('collapsed')){



    panel.style.height='';



    return;



  }



  const chartHeight=Math.round(chart.getBoundingClientRect().height || chart.offsetHeight || 0);



  if(chartHeight>0) panel.style.height=`${Math.max(chartHeight,360)}px`;



}







function ensureAlertSidePanel(){



  const chart=document.getElementById('chart');



  if(!chart) return null;



  if(!document.getElementById('alertSidePanelStyle')){



    const style=document.createElement('style');



    style.id='alertSidePanelStyle';



    style.textContent=`



      .chartPanelGrid{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:12px;align-items:start;margin-top:4px;width:100%;transition:grid-template-columns .18s ease;}



      .chartPanelGrid.drawerCollapsed{grid-template-columns:minmax(0,1fr) 46px;}



      .chartPanelGrid>#chart{min-width:0;width:100%;}



      .alertSidePanel{background:rgba(11,13,16,0.96);border:1px solid #283038;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,0.24);padding:0;height:auto;min-height:360px;max-height:none;overflow:hidden;color:#dce7ee;font-family:inherit;transition:width .18s ease, opacity .18s ease, border-color .18s ease, height .18s ease;display:flex;flex-direction:column;}



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



    window.setTimeout(()=>{ try{ Plotly.Plots.resize(chart); syncAlertSidePanelHeight(); }catch(e){} }, 80);



    window.setTimeout(()=>{ try{ Plotly.Plots.resize(chart); syncAlertSidePanelHeight(); }catch(e){} }, 220);



  }else{



    window.setTimeout(()=>syncAlertSidePanelHeight(), 80);



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



  const latest=events.slice(0,5);



  const latestDate = latest.length ? (latest[0].date || '') : 'none';



  const showingText = events.length ? `Showing ${latest.length} of ${events.length}` : 'No visible events';



  const collapsedKey = 'setaAlertEventsPanelCollapsed';



  const savedCollapsed = window.localStorage ? window.localStorage.getItem(collapsedKey) : null;



  const shouldCollapse = savedCollapsed === null ? true : savedCollapsed === 'true';



  const cards=latest.map(e=>{



    const row=e.row || {};



    const meta=e.meta || {};



    const tierCls=e.tier==='Confirmed'?'miniConfirmed':'miniWatch';



    const direction=alertDirectionLabel(e.type);



    const directionCls=alertDirectionClass(e.type);



    const directionCardCls=e.type==='bullish' ? 'bullish' : (e.type==='bearish' ? 'bearish' : 'mixed');







    const close=num(row.close);



    const closeText=close!==null



      ? `Close ${close.toLocaleString(undefined, {maximumFractionDigits:2})}`



      : '';







    const scoreThen=[



      num(row.seta_dashboard_summary_score),



      num(row.seta_summary_score),



      num(row.summary_score_0_100),



      num(row.summary_score),



      num(row.dashboard_score),



      num(row.screener_summary_score),



      num(row.screener_attention_priority_score)



    ].find(v=>v!==null);







    const scoreText=Number.isFinite(scoreThen)



      ? `SETA Then ${Math.round(scoreThen)}`



      : '';







    const attentionVal=



      num(row.attention_regime_score) ??



      num(row.attention_level_score) ??



      num(row.attention_spike_score);







    const attentionText=attentionVal!==null



      ? `Attention ${attentionVal.toFixed(1)}`



      : '';







    const ribbon=



      row.sent_ribbon_label ||



      row.sent_ribbon_attention_regime ||



      row.sent_ribbon_regime_raw ||



      '';







    const contextLine=[scoreText, closeText, attentionText].filter(Boolean).join(' &middot; ');







    let why=alertSummaryForRow(row, meta, e.tier);



    why=String(why || '')



      .replace(/^Confirmation:\s*/i, '')



      .replace(/^Watch candidate:\s*/i, '')



      .replace(/Source alert confirmation from enriched overlap-alert fields/i, 'Confirmed overlap alert from enriched context fields')



      .replace(/Upstream legacy signal confirmation from multi-window Bollinger counts/i, 'Multi-window Bollinger confirmation')



      .replace(/;\s*/g, ' + ')



      .trim();







    if(!why) why='Model context event detected.';







    let read='';



    if(e.tier==='Confirmed' && e.type==='bullish'){



      read='Bullish pressure was confirmed, with ribbon context providing the broader structure.';



    }else if(e.tier==='Confirmed' && e.type==='bearish'){



      read='Bearish pressure was confirmed, with ribbon context providing the broader structure.';



    }else if(e.tier==='Watch' && e.type==='bullish'){



      read='Bullish setup was visible, but confirmation was not complete.';



    }else if(e.tier==='Watch' && e.type==='bearish'){



      read='Bearish setup was visible, but confirmation was not complete.';



    }else{



      read='Context event detected; use the chart panes for structure and timing context.';



    }







    if(ribbon && /bear/i.test(ribbon) && e.type==='bullish'){



      read += ' Ribbon context remained bearish, so the event was mixed.';



    }else if(ribbon && /bull/i.test(ribbon) && e.type==='bearish'){



      read += ' Ribbon context remained bullish, so the event was mixed.';



    }else if(ribbon && /mixed|flat|transition/i.test(ribbon)){



      read += ' Ribbon context remained transitional.';



    }







    return `<div class="alertEventCard ${e.tier.toLowerCase()} ${directionCardCls}">



      <div class="alertEventTop"><div class="alertEventTitle"><span class="miniBadge ${tierCls}">${escapeHTML(e.tier)}</span><span class="miniBadge ${directionCls}">${escapeHTML(direction)}</span></div><div class="alertEventDate">${escapeHTML(e.date || '')}</div></div>



      ${contextLine ? `<div class="alertEventMeta">${contextLine}</div>` : ''}



      ${ribbon ? `<div class="alertEventMeta">Ribbon: ${escapeHTML(ribbon)}</div>` : ''}



      <div class="alertEventSummary"><b>Trigger:</b> ${escapeHTML(why)}</div>



      <div class="alertEventMeta"><b>Read:</b> ${escapeHTML(read)}</div>



    </div>`;



  }).join('');



  panel.innerHTML = `<div class="alertPanelHeader" id="alertPanelHeader" title="Click to expand/collapse alert events">



      <div class="alertPanelHeaderMain"><h3>Alert Events</h3><div class="alertPanelHeaderSummary">Confirmed ${confirmedCount} · Watch ${watchCount} · ${escapeHTML(showingText)} · Latest ${escapeHTML(latestDate)}</div></div>



      <button class="alertPanelToggle" id="alertPanelToggle" type="button" aria-label="Toggle alert events panel">${shouldCollapse ? '+' : '−'}</button>



    </div>



    <div class="alertPanelBody">



      <div class="panelSub">Visible-window events for ${escapeHTML(term)}. Use Attention = Context for material watch candidates or Overlay Marks for all watch candidates.</div>



      <div class="alertPanelControls"><span class="alertPanelPill">Confirmed ${confirmedCount}</span><span class="alertPanelPill">Watch ${watchCount}</span><span class="alertPanelPill">${escapeHTML(showingText)}</span><span class="alertPanelPill">Policy ${escapeHTML(markerPolicy)}</span></div>



      ${cards || '<div class="alertPanelEmpty">No confirmed or watch events in the current visible window. Try a longer display range or Attention = Overlay Marks.</div>'}



    </div>`;



  panel.classList.toggle('collapsed', shouldCollapse);



  window.requestAnimationFrame(()=>syncAlertSidePanelHeight());



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











// phaseG_market_tape_allowed_terms_v1



// phaseG_market_tape_v1: enhanced screener + archetype + indicator Market Tape UI.



function mtTerm(row){ return String(row?.term || row?.asset || '').toUpperCase(); }



function mtScore(row, key, digits=1){ const v=num(row?.[key]); return v===null ? 'n/a' : v.toFixed(digits); }



function mtScoreNum(row, key, fallback=0){ const v=num(row?.[key]); return v===null ? fallback : v; }



function mtDirectionClass(label){ const s=String(label || '').toLowerCase(); if(s.includes('bull')) return 'bullish'; if(s.includes('bear')) return 'bearish'; if(s.includes('risk') || s.includes('conflict')) return 'risk'; return 'mixed'; }



function mtStoreRecords(){ if(!SCREENER_STORE) return []; if(Array.isArray(SCREENER_STORE.records)) return SCREENER_STORE.records; if(Array.isArray(SCREENER_STORE.top_priority)) return SCREENER_STORE.top_priority; return []; }



function mtByTerm(term){ const t=String(term || '').toUpperCase(); return SCREENER_STORE?.by_term?.[t] || null; }



function mtSectionRows(section){ if(!SCREENER_STORE) return []; const sections=SCREENER_STORE.sections || {}; if(Array.isArray(sections[section])) return sections[section]; if(Array.isArray(SCREENER_STORE[section])) return SCREENER_STORE[section]; return mtStoreRecords(); }







// phaseG_market_tape_allowed_terms_force_v1: safe fallback for Market Tape term filtering.



function screenerAllowedTerms(){



  try{



    const fromAssets = (typeof assetUniverse === 'function') ? assetUniverse() : [];



    if(Array.isArray(fromAssets) && fromAssets.length){



      return new Set(fromAssets.map(a => String(a).toUpperCase()));



    }



  }catch(e){}



  try{



    const sel = document.getElementById('asset');



    if(sel && sel.options && sel.options.length){



      return new Set([...sel.options].map(o => String(o.value).toUpperCase()));



    }



  }catch(e){}



  try{



    if(window.SCREENER_STORE && window.SCREENER_STORE.by_term){



      return new Set(Object.keys(window.SCREENER_STORE.by_term).map(a => String(a).toUpperCase()));



    }



  }catch(e){}



  return new Set();



}







function mtAllowedRows(rows){ const allowed=(typeof screenerAllowedTerms === 'function') ? screenerAllowedTerms() : new Set(); return (rows || []).filter(r=>!allowed.size || allowed.has(mtTerm(r))); }



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



    .marketTapeHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;}



    .marketTapeTopline{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}



    .marketTapeToggle{border:1px solid #33404a;border-radius:8px;background:rgba(255,255,255,.04);color:#dce7ee;font-size:11px;font-weight:800;width:24px;height:24px;line-height:18px;cursor:pointer;}



    .screenerPanel.marketTape.collapsed .marketTapeCards,.screenerPanel.marketTape.collapsed .marketTapeDetail{display:none;}



    .screenerPanel.marketTape.collapsed{padding:8px 10px;margin-bottom:8px;}



    .screenerPanel.marketTape.collapsed .marketTapeHeader{margin-bottom:0;}



    .marketTapeTitle h3{font-size:13px;line-height:1.2;margin:0;color:#f2f7fa;letter-spacing:.02em;}



    .marketTapeSub{font-size:11px;color:#99a8b3;line-height:1.35;margin-top:3px;}



    .marketTapeTabs{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;}



    .marketTapeTab{border:1px solid #33404a;border-radius:999px;background:rgba(255,255,255,.035);color:#cbd8df;font-size:11px;padding:5px 8px;cursor:pointer;}



    .marketTapeTab.active{border-color:rgba(112,232,148,.55);color:#9df0b5;background:rgba(112,232,148,.07);}



    .marketTapeCards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-bottom:8px;}



    .marketTapeCard{border:1px solid #26323b;border-radius:13px;padding:7px 8px;background:rgba(255,255,255,.025);cursor:pointer;min-height:78px;transition:border-color .15s ease, background .15s ease, transform .15s ease, box-shadow .15s ease;text-align:left;color:inherit;font-family:inherit;}



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



    .marketTapeReason{font-size:10.5px;color:#c9d5dc;line-height:1.28;margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}



    .marketTapeDetail{border:1px solid #26323b;border-radius:13px;padding:8px 9px;background:rgba(255,255,255,.025);}



    .marketTapeDetailTop{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);gap:10px;align-items:start;}



    .marketTapeDetailTitle{font-size:12px;font-weight:850;color:#f2f7fa;margin-bottom:4px;}



    .marketTapeDetailText{font-size:11px;color:#c9d5dc;line-height:1.38;}



    .marketTapeRisk{margin-top:5px;color:#ffe2a0;}



    .marketTapeMissing{margin-top:3px;color:#9fb0ba;}



    .marketTapeFamilyGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;}



    .marketTapeFamily{border:1px solid #33404a;border-radius:11px;background:rgba(255,255,255,.028);padding:5px 7px;min-height:48px;cursor:default;}



    .marketTapeFamily.bullish{border-color:rgba(112,232,148,.34);}



    .marketTapeFamily.bearish{border-color:rgba(255,128,128,.34);}



    .marketTapeFamilyName{font-size:10px;color:#9fb0ba;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}



    .marketTapeFamilyScore{font-size:13px;font-weight:850;color:#f2f7fa;margin-top:1px;}



    .marketTapeFamilyLabel{font-size:10px;color:#c9d5dc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}



    .marketTapeEmpty{border:1px dashed #33404a;border-radius:12px;padding:10px;font-size:12px;color:#9fb0ba;}



    @media (max-width:1250px){.marketTapeCards{grid-template-columns:repeat(3,minmax(0,1fr));}.marketTapeDetailTop{grid-template-columns:1fr;}.marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr));}}



    @media (max-width:800px){.marketTapeHeader{display:block}.marketTapeTabs{justify-content:flex-start;margin-top:8px}.marketTapeCards{grid-template-columns:1fr}.marketTapeFamilyGrid{grid-template-columns:1fr;}}



  `;



  document.head.appendChild(style);



}



function mtSectionTabs(){ return [['top_priority','Top Priority'],['fresh_confirmed','Fresh Confirmed'],['watch_clusters','Watch Clusters'],['narrative_divergence','Narrative Divergence'],['sentiment_repair','Sentiment Repair'],['bullish_setups','Bullish Setups'],['bearish_setups','Bearish Setups'],['high_conflict','High Conflict'],['quiet_monitor','Quiet / Monitor']]; }



function mtIndicatorFamiliesForTerm(term){ const detail=mtByTerm(term); if(Array.isArray(detail?.indicator_families)) return detail.indicator_families; return []; }



function mtFallbackFamilies(row){ return [['Bollinger','attention_adjusted_bollinger_score',row?.latest_event_direction || row?.latest_confirmed_event_direction || 'Neutral'],['MACD','macd_family_direction_score',row?.macd_family_label || row?.sent_price_macd_joint_slope_label || 'n/a'],['RSI','rsi_family_state_score',row?.rsi_family_label || 'n/a'],['Ribbon','sent_ribbon_direction_score',row?.sent_ribbon_label || 'n/a'],['Trend','ma_trend_direction_score','Trend'],['Attention','attention_participation_score','Participation']].map(([fam,key,label])=>({indicator_family:fam,score_0_100:mtScoreNum(row,key,null),direction_label:label,strength_label:'',interpretation:''})); }



function mtRenderFamilyGrid(term, row){



  let families=mtIndicatorFamiliesForTerm(term);



  if(!families.length) families=mtFallbackFamilies(row);



  const keep=new Set(['Summary','Bollinger','MACD','RSI','Ribbon','Trend','Attention']);



  families=families.filter(f=>keep.has(f.indicator_family)).slice(0,7);



  return `<div class="marketTapeFamilyGrid">${families.map(f=>{



    const score=num(f.score_0_100);



    const scoreTxt=score===null ? 'n/a' : score.toFixed(0);



    const label=f.direction_label || f.strength_label || '';



    const cls=mtFamilyScoreClass(score, label);



    const title=[f.primary_indicator, f.interpretation].filter(Boolean).join(' — ');



    const familyName = (f.indicator_family === 'Summary') ? 'SETA Score' : (f.indicator_family || 'Family');



    return `<div class="marketTapeFamily ${cls}" title="${escapeHTML(title)}"><div class="marketTapeFamilyName">${escapeHTML(familyName)}</div><div class="marketTapeFamilyScore">${escapeHTML(scoreTxt)}</div><div class="marketTapeFamilyLabel">${escapeHTML(label)}</div></div>`;



  }).join('')}</div>`;



}







// phaseG_market_tape_ensure_panel_v1: create the Market Tape host panel if the earlier screener helper is absent.



function ensureScreenerPanel(){



  let panel = document.getElementById('screenerPanel');



  if(panel) return panel;







  const anchor =



    document.getElementById('assetTitle') ||



    document.getElementById('regimeBar') ||



    document.getElementById('summaryLead') ||



    document.getElementById('chart');







  if(!anchor || !anchor.parentNode) return null;







  panel = document.createElement('section');



  panel.id = 'screenerPanel';



  panel.className = 'screenerPanel marketTape';







  // Preferred placement: immediately after the asset title, before the chart grid/drawer.



  // phaseG_market_tape_polish_v1: place Market Tape as a full-width selection layer above chart context.



  const preferredAfter =



    document.querySelector('.controls') ||



    document.querySelector('.controlGrid') ||



    document.getElementById('summaryLead') ||



    document.getElementById('assetTitle') ||



    anchor;







  if(preferredAfter && preferredAfter.parentNode){



    preferredAfter.parentNode.insertBefore(panel, preferredAfter.nextSibling);



  } else {



    anchor.parentNode.insertBefore(panel, anchor.nextSibling);



  }



  return panel;



}











// phaseG_market_tape_polish_v2: clickable top cards + cleaner Market Tape UI.



function setDashboardAssetFromScreener(term){



  const t = String(term || '').trim().toUpperCase();



  if(!t) return;







  const sel = document.getElementById('asset');



  if(!sel){



    console.warn('Asset selector not found for Market Tape click.');



    return;



  }







  const available = [...sel.options].map(o => String(o.value).toUpperCase());



  if(!available.includes(t)){



    console.warn(`Market Tape term ${t} is not available in this dashboard mode.`);



    return;



  }







  sel.value = t;







  try{



    sel.dispatchEvent(new Event('change', {bubbles:true}));



  }catch(e){}







  try{



    if(typeof buildFigure === 'function'){



      buildFigure();



    }else if(typeof renderDashboard === 'function'){



      renderDashboard();



    }else if(typeof initDashboard === 'function'){



      initDashboard();



    }



  }catch(err){



    console.error('Market Tape asset switch failed:', err);



  }







  try{



    renderScreenerPanel(t);



  }catch(err){



    console.warn('Market Tape panel refresh after click failed:', err);



  }



}











(function(){



  if(document.getElementById('phaseG_market_tape_polish_v2_style')) return;



  const st=document.createElement('style');



  st.id='phaseG_market_tape_polish_v2_style';



  st.textContent='\n/* phaseG_market_tape_polish_v2 */\n.screenerPanel.marketTape{font-size:12px;line-height:1.35;}\n.marketTapeTitle h3{font-size:14px!important;letter-spacing:.01em;}\n.marketTapeSub{font-size:11.5px!important;line-height:1.35;color:#9fb4bf!important;max-width:760px;}\n.marketTapeTabs{gap:6px!important;justify-content:flex-end;}\n.marketTapeTab{font-size:10.5px!important;padding:4px 8px!important;opacity:.82;}\n.marketTapeTab.active{opacity:1;border-color:#4ade80!important;box-shadow:0 0 0 1px rgba(74,222,128,.18),0 0 10px rgba(74,222,128,.12);}\n.marketTapeCards{grid-template-columns:repeat(5,minmax(145px,1fr))!important;gap:8px!important;}\n.marketTapeCard{min-height:86px!important;padding:8px 9px!important;transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease;}\n.marketTapeCard:hover{transform:translateY(-1px);border-color:#60a5fa!important;box-shadow:0 0 0 1px rgba(96,165,250,.18),0 8px 20px rgba(0,0,0,.22);background:rgba(96,165,250,.045)!important;}\n.marketTapeCard.active{border-color:#facc15!important;box-shadow:0 0 0 1px rgba(250,204,21,.20),0 0 18px rgba(250,204,21,.12);}\n.marketTapeCardTop{font-size:13px!important;}\n.marketTapeTerm{font-size:14px!important;}\n.marketTapeScore{font-size:13px!important;}\n.marketTapePill{font-size:10.5px!important;padding:2px 6px!important;}\n.marketTapeReason{font-size:11.25px!important;line-height:1.32!important;}\n.marketTapeDetail{display:grid!important;grid-template-columns:minmax(0,1.45fr) minmax(320px,.95fr)!important;gap:12px!important;align-items:start;min-height:118px;}\n.marketTapeDetailTitle{font-size:13px!important;margin-bottom:6px!important;}\n.marketTapeDetailText,.marketTapeMatched,.marketTapeMissing,.marketTapeRisk{font-size:12.25px!important;line-height:1.42!important;}\n.marketTapeFamilyGrid{grid-template-columns:repeat(3,minmax(92px,1fr))!important;gap:7px!important;}\n.marketTapeFamily{min-height:52px!important;padding:7px 8px!important;}\n.marketTapeFamilyName{font-size:10.75px!important;}\n.marketTapeFamilyScore{font-size:15px!important;}\n.marketTapeFamilyLabel{font-size:10.75px!important;}\n@media (max-width:980px){.marketTapeCards{grid-template-columns:repeat(2,minmax(0,1fr))!important}.marketTapeDetail{grid-template-columns:1fr!important}.marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}\n';



  document.head.appendChild(st);



})();











(function(){



  const old=document.getElementById('phaseG_market_tape_layout_v3_style');



  if(old) old.remove();



  const st=document.createElement('style');



  st.id='phaseG_market_tape_layout_v3_style';



  st.textContent='\n/* phaseG_market_tape_layout_v3 */\n.screenerPanel.marketTape{\n  --mt-bg: rgba(8,13,18,.78);\n  --mt-panel: rgba(255,255,255,.026);\n  --mt-panel-2: rgba(255,255,255,.038);\n  --mt-border: #263641;\n  --mt-border-soft: #1d2a33;\n  --mt-text: #e5f1f7;\n  --mt-muted: #91a5b0;\n  --mt-green: #4ade80;\n  --mt-yellow: #facc15;\n  --mt-blue: #60a5fa;\n  --mt-red: #fb7185;\n  padding:10px 12px!important;\n  margin:10px 0 16px!important;\n  border-radius:14px!important;\n  background:linear-gradient(180deg, rgba(10,16,22,.92), rgba(7,12,17,.82))!important;\n  border:1px solid var(--mt-border)!important;\n  box-shadow:0 10px 30px rgba(0,0,0,.20)!important;\n  font-size:12px!important;\n  line-height:1.32!important;\n}\n.marketTapeHeader{\n  display:grid!important;\n  grid-template-columns:minmax(360px,1fr) auto!important;\n  gap:10px!important;\n  align-items:start!important;\n  margin-bottom:8px!important;\n}\n.marketTapeTitle h3{\n  font-size:14px!important;\n  line-height:1.15!important;\n  margin:0!important;\n  letter-spacing:.01em!important;\n}\n.marketTapeSub{\n  font-size:11px!important;\n  line-height:1.3!important;\n  color:var(--mt-muted)!important;\n  max-width:780px!important;\n  margin-top:3px!important;\n}\n.marketTapeToggle{\n  width:22px!important;\n  height:22px!important;\n  font-size:12px!important;\n  border-radius:7px!important;\n}\n.marketTapeTabs{\n  display:flex!important;\n  flex-wrap:wrap!important;\n  justify-content:flex-end!important;\n  gap:5px!important;\n  max-width:620px!important;\n}\n.marketTapeTab{\n  font-size:10px!important;\n  line-height:1!important;\n  padding:4px 7px!important;\n  border-radius:999px!important;\n  opacity:.78!important;\n  border-color:#2b3943!important;\n  background:rgba(255,255,255,.025)!important;\n}\n.marketTapeTab.active{\n  opacity:1!important;\n  color:#d9ffe8!important;\n  border-color:var(--mt-green)!important;\n  background:rgba(74,222,128,.08)!important;\n  box-shadow:0 0 0 1px rgba(74,222,128,.14),0 0 12px rgba(74,222,128,.10)!important;\n}\n.marketTapeCards{\n  display:grid!important;\n  grid-template-columns:repeat(6,minmax(0,1fr))!important;\n  gap:7px!important;\n  margin:7px 0 8px!important;\n}\n.marketTapeCard{\n  min-height:74px!important;\n  padding:7px 8px!important;\n  border-radius:12px!important;\n  border:1px solid var(--mt-border)!important;\n  background:var(--mt-panel)!important;\n  cursor:pointer!important;\n  transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease!important;\n  overflow:hidden!important;\n}\n.marketTapeCard:hover{\n  transform:translateY(-1px)!important;\n  border-color:var(--mt-blue)!important;\n  background:rgba(96,165,250,.055)!important;\n  box-shadow:0 0 0 1px rgba(96,165,250,.17),0 8px 20px rgba(0,0,0,.18)!important;\n}\n.marketTapeCard.active{\n  border-color:var(--mt-yellow)!important;\n  background:rgba(250,204,21,.06)!important;\n  box-shadow:0 0 0 1px rgba(250,204,21,.20),0 0 18px rgba(250,204,21,.10)!important;\n}\n.marketTapeCardTop{\n  display:flex!important;\n  justify-content:space-between!important;\n  align-items:center!important;\n  gap:6px!important;\n  font-size:12.5px!important;\n  line-height:1.1!important;\n  margin-bottom:5px!important;\n}\n.marketTapeTerm{\n  font-size:13px!important;\n  font-weight:900!important;\n}\n.marketTapeScore{\n  font-size:12.5px!important;\n  font-weight:900!important;\n  color:var(--mt-yellow)!important;\n}\n.marketTapePill{\n  font-size:9.5px!important;\n  line-height:1!important;\n  padding:2px 5px!important;\n  border-radius:999px!important;\n}\n.marketTapeReason{\n  font-size:10.5px!important;\n  line-height:1.26!important;\n  margin-top:4px!important;\n  display:-webkit-box!important;\n  -webkit-line-clamp:2!important;\n  -webkit-box-orient:vertical!important;\n  overflow:hidden!important;\n}\n.marketTapeDetail{\n  display:grid!important;\n  grid-template-columns:minmax(0,1.1fr) minmax(390px,.9fr)!important;\n  gap:10px!important;\n  align-items:stretch!important;\n  min-height:0!important;\n  padding:8px!important;\n  border-radius:13px!important;\n  border:1px solid var(--mt-border)!important;\n  background:rgba(255,255,255,.018)!important;\n}\n.marketTapeDetail > div:first-child{\n  min-width:0!important;\n  padding:2px 2px 0!important;\n}\n.marketTapeDetailTitle{\n  display:flex!important;\n  align-items:center!important;\n  flex-wrap:wrap!important;\n  gap:5px!important;\n  font-size:12.5px!important;\n  line-height:1.2!important;\n  margin-bottom:5px!important;\n}\n.marketTapeDetailText{\n  font-size:11.5px!important;\n  line-height:1.38!important;\n  color:#d8e7ee!important;\n  max-width:100%!important;\n  margin-bottom:4px!important;\n}\n.marketTapeMatched,.marketTapeMissing,.marketTapeRisk{\n  font-size:11.5px!important;\n  line-height:1.35!important;\n  margin-top:3px!important;\n}\n.marketTapeRisk{\n  color:#ffd95a!important;\n}\n.marketTapeFamilyGrid{\n  display:grid!important;\n  grid-template-columns:repeat(5,minmax(0,1fr))!important;\n  gap:6px!important;\n  align-content:start!important;\n}\n.marketTapeFamily{\n  min-height:48px!important;\n  padding:6px 7px!important;\n  border-radius:10px!important;\n  background:var(--mt-panel-2)!important;\n  border:1px solid #31414d!important;\n}\n.marketTapeFamilyName{\n  font-size:9.75px!important;\n  line-height:1.05!important;\n  color:#aebec6!important;\n  white-space:nowrap!important;\n  overflow:hidden!important;\n  text-overflow:ellipsis!important;\n}\n.marketTapeFamilyScore{\n  font-size:14px!important;\n  line-height:1.05!important;\n  margin:2px 0 1px!important;\n  font-weight:900!important;\n}\n.marketTapeFamilyLabel{\n  font-size:9.75px!important;\n  line-height:1.05!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child{\n  grid-column:span 2!important;\n  background:linear-gradient(180deg,rgba(250,204,21,.08),rgba(255,255,255,.03))!important;\n  border-color:rgba(250,204,21,.35)!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child .marketTapeFamilyScore{\n  font-size:18px!important;\n  color:var(--mt-yellow)!important;\n}\n.screenerPanel.marketTape.collapsed .marketTapeCards,\n.screenerPanel.marketTape.collapsed .marketTapeDetail{\n  display:none!important;\n}\n.screenerPanel.marketTape.collapsed{\n  padding:8px 10px!important;\n  margin-bottom:8px!important;\n}\n@media (max-width:1220px){\n  .marketTapeCards{grid-template-columns:repeat(3,minmax(0,1fr))!important;}\n  .marketTapeDetail{grid-template-columns:1fr!important;}\n  .marketTapeFamilyGrid{grid-template-columns:repeat(5,minmax(0,1fr))!important;}\n}\n@media (max-width:760px){\n  .marketTapeHeader{grid-template-columns:1fr!important;}\n  .marketTapeTabs{justify-content:flex-start!important;max-width:none!important;}\n  .marketTapeCards{grid-template-columns:repeat(2,minmax(0,1fr))!important;}\n  .marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}\n}\n';



  document.head.appendChild(st);



})();











(function(){



  const old=document.getElementById('phaseG_market_tape_layout_v4_style');



  if(old) old.remove();



  const st=document.createElement('style');



  st.id='phaseG_market_tape_layout_v4_style';



  st.textContent='\n/* phaseG_market_tape_layout_v4 */\n.screenerPanel.marketTape{\n  --mt-bg: rgba(8,13,18,.80);\n  --mt-panel: rgba(255,255,255,.028);\n  --mt-panel-2: rgba(255,255,255,.042);\n  --mt-border: #263641;\n  --mt-border-soft: #1c2a33;\n  --mt-text: #e5f1f7;\n  --mt-muted: #94a8b3;\n  --mt-green: #4ade80;\n  --mt-yellow: #facc15;\n  --mt-blue: #60a5fa;\n  --mt-red: #fb7185;\n  --mt-pill-h: 30px;\n  padding:10px 12px!important;\n  margin:10px 0 16px!important;\n  border-radius:14px!important;\n  background:linear-gradient(180deg, rgba(10,16,22,.94), rgba(7,12,17,.86))!important;\n  border:1px solid var(--mt-border)!important;\n  box-shadow:0 10px 30px rgba(0,0,0,.20)!important;\n  font-size:12px!important;\n  line-height:1.32!important;\n}\n.marketTapeHeader{\n  display:grid!important;\n  grid-template-columns:minmax(360px,1fr) auto!important;\n  gap:10px!important;\n  align-items:start!important;\n  margin-bottom:8px!important;\n}\n.marketTapeTitle h3{\n  font-size:14px!important;\n  line-height:1.15!important;\n  margin:0!important;\n  letter-spacing:.01em!important;\n}\n.marketTapeSub{\n  font-size:10.75px!important;\n  line-height:1.28!important;\n  color:var(--mt-muted)!important;\n  max-width:820px!important;\n  margin-top:3px!important;\n}\n.marketTapeToggle{\n  width:22px!important;\n  height:22px!important;\n  font-size:12px!important;\n  border-radius:7px!important;\n}\n.marketTapeTabs{\n  display:flex!important;\n  flex-wrap:wrap!important;\n  justify-content:flex-end!important;\n  gap:5px!important;\n  max-width:620px!important;\n}\n.marketTapeTab{\n  font-size:9.75px!important;\n  line-height:1!important;\n  padding:4px 7px!important;\n  border-radius:999px!important;\n  opacity:.76!important;\n  border-color:#2a3842!important;\n  background:rgba(255,255,255,.025)!important;\n}\n.marketTapeTab.active{\n  opacity:1!important;\n  color:#d9ffe8!important;\n  border-color:var(--mt-green)!important;\n  background:rgba(74,222,128,.08)!important;\n  box-shadow:0 0 0 1px rgba(74,222,128,.14),0 0 12px rgba(74,222,128,.10)!important;\n}\n\n/* Six-card discovery tape */\n.marketTapeCards{\n  display:grid!important;\n  grid-template-columns:repeat(6,minmax(0,1fr))!important;\n  gap:7px!important;\n  margin:7px 0 8px!important;\n}\n.marketTapeCard{\n  min-height:72px!important;\n  padding:7px 8px!important;\n  border-radius:12px!important;\n  border:1px solid var(--mt-border)!important;\n  background:var(--mt-panel)!important;\n  cursor:pointer!important;\n  overflow:hidden!important;\n  transition:transform .12s ease,border-color .12s ease,box-shadow .12s ease,background .12s ease!important;\n}\n.marketTapeCard:hover{\n  transform:translateY(-1px)!important;\n  border-color:var(--mt-blue)!important;\n  background:rgba(96,165,250,.055)!important;\n  box-shadow:0 0 0 1px rgba(96,165,250,.17),0 8px 20px rgba(0,0,0,.18)!important;\n}\n.marketTapeCard.active{\n  border-color:var(--mt-yellow)!important;\n  background:rgba(250,204,21,.055)!important;\n  box-shadow:0 0 0 1px rgba(250,204,21,.20),0 0 18px rgba(250,204,21,.10)!important;\n}\n.marketTapeCardTop{\n  display:flex!important;\n  justify-content:space-between!important;\n  align-items:center!important;\n  gap:6px!important;\n  font-size:12.25px!important;\n  line-height:1.1!important;\n  margin-bottom:5px!important;\n}\n.marketTapeTerm{\n  font-size:13px!important;\n  font-weight:900!important;\n}\n.marketTapeScore{\n  font-size:12.5px!important;\n  font-weight:900!important;\n  color:var(--mt-yellow)!important;\n}\n.marketTapePill{\n  font-size:9.5px!important;\n  line-height:1!important;\n  padding:2px 5px!important;\n  border-radius:999px!important;\n}\n.marketTapeReason{\n  font-size:10.4px!important;\n  line-height:1.25!important;\n  margin-top:4px!important;\n  display:-webkit-box!important;\n  -webkit-line-clamp:2!important;\n  -webkit-box-orient:vertical!important;\n  overflow:hidden!important;\n}\n\n/* Selected setup composition: no unused right-side void. */\n.marketTapeDetail{\n  display:grid!important;\n  grid-template-columns:minmax(300px,5fr) minmax(420px,7fr)!important;\n  gap:10px!important;\n  align-items:stretch!important;\n  min-height:0!important;\n  padding:8px!important;\n  border-radius:13px!important;\n  border:1px solid var(--mt-border)!important;\n  background:rgba(255,255,255,.018)!important;\n}\n.marketTapeDetail > div:first-child{\n  min-width:0!important;\n  padding:8px 9px!important;\n  border:1px solid rgba(255,255,255,.055)!important;\n  border-radius:12px!important;\n  background:rgba(255,255,255,.022)!important;\n}\n.marketTapeDetailTitle{\n  display:flex!important;\n  align-items:center!important;\n  flex-wrap:wrap!important;\n  gap:5px!important;\n  font-size:12.5px!important;\n  line-height:1.18!important;\n  margin-bottom:6px!important;\n}\n.marketTapeDetailText{\n  font-size:11.5px!important;\n  line-height:1.38!important;\n  color:#d8e7ee!important;\n  max-width:100%!important;\n  margin-bottom:5px!important;\n}\n.marketTapeMatched,.marketTapeMissing,.marketTapeRisk{\n  font-size:11.5px!important;\n  line-height:1.36!important;\n  margin-top:3px!important;\n}\n.marketTapeRisk{color:#ffd95a!important;}\n\n/* Metric deck: restore pill-box feel with better balance. */\n.marketTapeFamilyGrid{\n  display:grid!important;\n  grid-template-columns:repeat(5,minmax(0,1fr))!important;\n  grid-auto-rows:minmax(50px,auto)!important;\n  gap:6px!important;\n  align-content:stretch!important;\n  height:100%!important;\n}\n.marketTapeFamily{\n  min-height:50px!important;\n  padding:7px 8px!important;\n  border-radius:11px!important;\n  background:var(--mt-panel-2)!important;\n  border:1px solid #31414d!important;\n  display:flex!important;\n  flex-direction:column!important;\n  justify-content:center!important;\n}\n.marketTapeFamilyName{\n  font-size:9.8px!important;\n  line-height:1.05!important;\n  color:#aebec6!important;\n  white-space:nowrap!important;\n  overflow:hidden!important;\n  text-overflow:ellipsis!important;\n}\n.marketTapeFamilyScore{\n  font-size:14px!important;\n  line-height:1.05!important;\n  margin:2px 0 1px!important;\n  font-weight:900!important;\n}\n.marketTapeFamilyLabel{\n  font-size:9.8px!important;\n  line-height:1.05!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child{\n  grid-column:span 2!important;\n  grid-row:span 2!important;\n  justify-content:center!important;\n  background:linear-gradient(180deg,rgba(250,204,21,.09),rgba(255,255,255,.035))!important;\n  border-color:rgba(250,204,21,.38)!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child .marketTapeFamilyName{\n  font-size:10.5px!important;\n  color:#d9e7ef!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child .marketTapeFamilyScore{\n  font-size:22px!important;\n  line-height:1!important;\n  color:var(--mt-yellow)!important;\n}\n.marketTapeDetail .marketTapeFamily:first-child .marketTapeFamilyLabel{\n  font-size:11px!important;\n}\n\n/* Balanced diagnostic/state ribbon. */\n.marketTapeStateRibbon{\n  display:grid!important;\n  grid-template-columns:repeat(6,minmax(0,1fr))!important;\n  gap:6px!important;\n  margin-top:8px!important;\n}\n.marketTapeStatePill{\n  min-height:var(--mt-pill-h)!important;\n  border:1px solid #2d3b45!important;\n  border-radius:10px!important;\n  background:rgba(255,255,255,.028)!important;\n  padding:5px 7px!important;\n  display:flex!important;\n  align-items:center!important;\n  gap:6px!important;\n  min-width:0!important;\n}\n.marketTapeStateLabel{\n  font-size:9.6px!important;\n  color:#92a6b0!important;\n  white-space:nowrap!important;\n}\n.marketTapeStateValue{\n  font-size:10.4px!important;\n  color:#e5f1f7!important;\n  font-weight:800!important;\n  overflow:hidden!important;\n  text-overflow:ellipsis!important;\n  white-space:nowrap!important;\n}\n.marketTapeStatePill.bullish{border-color:rgba(74,222,128,.42)!important;background:rgba(74,222,128,.045)!important;}\n.marketTapeStatePill.bearish{border-color:rgba(251,113,133,.42)!important;background:rgba(251,113,133,.045)!important;}\n.marketTapeStatePill.neutral{border-color:#2d3b45!important;background:rgba(255,255,255,.026)!important;}\n\n.screenerPanel.marketTape.collapsed .marketTapeCards,\n.screenerPanel.marketTape.collapsed .marketTapeDetail,\n.screenerPanel.marketTape.collapsed .marketTapeStateRibbon{\n  display:none!important;\n}\n.screenerPanel.marketTape.collapsed{\n  padding:8px 10px!important;\n  margin-bottom:8px!important;\n}\n\n@media (max-width:1220px){\n  .marketTapeCards{grid-template-columns:repeat(3,minmax(0,1fr))!important;}\n  .marketTapeDetail{grid-template-columns:1fr!important;}\n  .marketTapeFamilyGrid{grid-template-columns:repeat(5,minmax(0,1fr))!important;}\n  .marketTapeStateRibbon{grid-template-columns:repeat(3,minmax(0,1fr))!important;}\n}\n@media (max-width:760px){\n  .marketTapeHeader{grid-template-columns:1fr!important;}\n  .marketTapeTabs{justify-content:flex-start!important;max-width:none!important;}\n  .marketTapeCards{grid-template-columns:repeat(2,minmax(0,1fr))!important;}\n  .marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}\n  .marketTapeDetail .marketTapeFamily:first-child{grid-column:span 2!important;grid-row:span 1!important;}\n  .marketTapeStateRibbon{grid-template-columns:1fr!important;}\n}\n';



  document.head.appendChild(st);



})();











// phaseG_market_tape_state_ribbon_v4: compact balanced diagnostics under selected setup.



function mtStateClass(v){



  const s=String(v||'').toLowerCase();



  if(s.includes('bull') || s.includes('strong') || s.includes('positive') || s.includes('confirmed')) return 'bullish';



  if(s.includes('bear') || s.includes('weak') || s.includes('negative') || s.includes('risk')) return 'bearish';



  return 'neutral';



}



function mtFirstPresent(row, keys, fallback=''){



  for(const k of keys){



    const v=row && row[k];



    if(v!==undefined && v!==null && String(v).trim()!=='' && String(v).toLowerCase()!=='nan'){



      return v;



    }



  }



  return fallback;



}



function mtStateRibbon(row){



  if(!row) return '';



  const items=[



    ['Setup', mtFirstPresent(row,['primary_archetype','archetype_summary','screener_action_bucket'])],



    ['Secondary', mtFirstPresent(row,['secondary_archetype','archetype_risk_note','latest_event_tier'])],



    ['Direction', mtFirstPresent(row,['archetype_direction','latest_event_direction','latest_confirmed_event_direction'])],



    ['Consensus', mtFirstPresent(row,['signal_consensus_direction_label','signal_consensus_direction_score'])],



    ['Dispersion', mtFirstPresent(row,['signal_dispersion_score','signal_consensus_confidence_score'])],



    ['Event', mtFirstPresent(row,['latest_event_dashboard_summary_label','latest_confirmed_dashboard_summary_label'])],



    ['Confirmed', mtFirstPresent(row,['latest_confirmed_event_date','days_since_latest_confirmed','recent_confirmed_count_7d'])],



    ['Watch', mtFirstPresent(row,['recent_watch_count_7d','latest_event_quality_score'])],



    ['Bollinger', mtFirstPresent(row,['attention_adjusted_bollinger_score','bollinger_direction_score'])],



    ['MACD', mtFirstPresent(row,['macd_family_label','sent_price_macd_joint_slope_label','macd_family_direction_score'])],



    ['RSI', mtFirstPresent(row,['rsi_family_label','rsi_family_state_score'])],



    ['Ribbon', mtFirstPresent(row,['sent_ribbon_label','sent_ribbon_direction_score'])],



  ].filter(([label,value]) => value!==undefined && value!==null && String(value).trim()!=='');







  if(!items.length) return '';







  return `<div class="marketTapeStateRibbon">${items.map(([label,value])=>{



    const cls=mtStateClass(value);



    return `<div class="marketTapeStatePill ${cls}"><span class="marketTapeStateLabel">${escapeHTML(label)}</span><span class="marketTapeStateValue">${escapeHTML(value)}</span></div>`;



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



    return `<button type="button" class="marketTapeCard ${cls} ${active?'active':''}" data-screener-term="${escapeHTML(term)}" title="Load ${escapeHTML(term)} chart" title="Load ${escapeHTML(term)} chart" title="Load ${escapeHTML(term)} chart"><div class="marketTapeCardTop"><span class="marketTapeTerm">#${escapeHTML(r.screener_attention_priority_rank || idx+1)} ${escapeHTML(term)}</span><span class="marketTapeScore">${escapeHTML(score)}</span></div><div><span class="marketTapePill ${cls}">${escapeHTML(dir)}</span><span class="marketTapePill">${escapeHTML(bucket)}</span><span class="marketTapePill">Conflict ${escapeHTML(dispersion)}</span></div><div class="marketTapeReason"><b>${escapeHTML(arch)}</b> · ${escapeHTML(reason)}</div></button>`;



  }).join('');







  const detailDir=activeArch.archetype_direction || activeRow.signal_consensus_direction_label || activeRow.latest_event_direction || 'Mixed';



  const detailCls=mtDirectionClass(detailDir);



  const detailTitle=`${currentTerm} · ${activeArch.primary_archetype || activeRow.primary_archetype || 'Monitor'}`;



  const summary=activeArch.archetype_summary || activeRow.archetype_summary || mtReason(activeRow, activeArch);



  const risk=mtRisk(activeArch, activeRow);



  const missing=mtMissing(activeArch, activeRow);



  const matched=activeArch.matched_conditions || activeRow.matched_conditions || '';



  const familyGrid=mtRenderFamilyGrid(currentTerm, activeRow);







  panel.innerHTML=`<div class="marketTapeHeader"><div class="marketTapeTitle"><div class="marketTapeTopline"><button type="button" class="marketTapeToggle" id="marketTapeToggle" title="Collapse / expand Market Tape">−</button><h3>SETA Market Tape · Active ${escapeHTML(currentTerm || 'n/a')}</h3></div><div class="marketTapeSub">Click a ranked card to load its chart. Selected setup, balanced signal deck, and full diagnostics ribbon. ${version ? `Model ${escapeHTML(version)}. ` : ''}${generated ? `As of ${escapeHTML(generated)}.` : ''}</div></div><div class="marketTapeTabs">${tabHtml}</div></div><div class="marketTapeCards">${cardHtml || '<div class="marketTapeEmpty">No Market Tape rows available for this mode/section.</div>'}</div><div class="marketTapeDetail"><div class="marketTapeDetailTop"><div><div class="marketTapeDetailTitle"><span class="marketTapePill ${detailCls}">${escapeHTML(detailDir)}</span>${escapeHTML(detailTitle)} · Priority ${escapeHTML(mtScore(activeRow,'screener_attention_priority_score'))}</div><div class="marketTapeDetailText">${escapeHTML(summary)}</div>${matched ? `<div class="marketTapeMissing"><b>Setup evidence:</b> ${escapeHTML(matched)}</div>` : ''}${missing ? `<div class="marketTapeMissing"><b>Watch item:</b> ${escapeHTML(missing)}</div>` : ''}${risk ? `<div class="marketTapeRisk"><b>Risk:</b> ${escapeHTML(risk)}</div>` : ''}</div><div>${familyGrid}</div></div></div>`;







  panel.querySelectorAll('[data-screener-section]').forEach(btn=>{ btn.onclick=()=>{ SCREENER_SECTION=btn.getAttribute('data-screener-section') || 'top_priority'; renderScreenerPanel(document.getElementById('asset')?.value || null); }; });



  panel.querySelectorAll('[data-screener-term]').forEach(card=>{ card.onclick=()=>{ if(typeof setDashboardAssetFromScreener === 'function') setDashboardAssetFromScreener(card.getAttribute('data-screener-term')); }; });



  const collapsedKey='setaMarketTapeCollapsed';



  const savedCollapsed = window.localStorage ? window.localStorage.getItem(collapsedKey) : null;



  const shouldCollapse = savedCollapsed === 'true';



  const toggle = panel.querySelector('#marketTapeToggle');



  const applyMarketTapeCollapsed = (collapsed) => {



    panel.classList.toggle('collapsed', collapsed);



    if(toggle) toggle.textContent = collapsed ? '+' : '−';



    if(window.localStorage) window.localStorage.setItem(collapsedKey, String(collapsed));



  };



  applyMarketTapeCollapsed(shouldCollapse);



  if(toggle){



    toggle.onclick = (ev) => {



      ev.preventDefault();



      ev.stopPropagation();



      applyMarketTapeCollapsed(!panel.classList.contains('collapsed'));



    };



  }



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



  renderScreenerPanel(term);



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



  const priceHoverCustomData=priceHoverContextCustomData(rows, regimeInfo, ov);



  if(data[0]){



    data[0].customdata=priceHoverCustomData;



    if(priceDisplay==='candles'){



      // Candlestick traces can fall back to their native OHLC hover in some Plotly builds.



      // hovertext + hoverinfo keeps candle/wick hover consistent with the compact SETA context block.



      data[0].hovertext=priceHoverText(rows, regimeInfo, ov, 'candles');



      data[0].hoverinfo='text';



      data[0].hovertemplate=null;



    } else {



      data[0].hovertemplate=priceHoverTemplate('line');



    }



  }



  const overlapInfo=computeOverlapSignalInfo(rows, ov, visibleMask);



  const engagementInfo=computeEngagementInfo(rows, visibleMask);







const mode=currentMode();



const cfg = manifestModeConfig() || {};



const summaryText = `${overlapInfo.stateLabel} · ${overlapInfo.context} · ${engagement==='off' ? 'Engagement Hidden' : `${engagementInfo.levelLabel} / ${engagementInfo.regimeLabel}`}`;



document.getElementById('summaryLead').innerHTML = `<span class="summaryCard"><b>Combined Summary</b> ${summaryText}</span><span class="summaryCard"><b>Model</b> ${overlapInfo.modelLabel}</span>`;



  const overlapMarkerTraces=overlapTableauMarkers(rows, ov, visibleMask, engagement);



  const alertDiagnostics=computeAlertDiagnosticInfo(rows, ov, visibleMask, term);



  renderAlertSidePanel(term, rows, ov, visibleMask, engagement);



  if(bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') addOverlapBandWithPlaybook(data,xs,ov.up,ov.low,rows,ov,COLORS.overlapBand,COLORS.overlapFill,overlapInfo.modelLabel,'y',visibleMask);



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



    sentimentRibbon: showRibbonContext ? `<span class="badge ${lastRegimeInfo.regime==='Bullish' ? 'badge-bull' : lastRegimeInfo.regime==='Bearish' ? 'badge-bear' : 'badge-flat'}"><b>Ribbon</b> ${lastRegimeInfo.regime}</span>` : null,



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



  data.push({type:'bar',x:xs,y:hist,name:'Price MACD Histogram',marker:{color:histColors},xaxis:'x2',yaxis:'y2',showlegend:false,hovertemplate:'%{x|%b %d, %Y}<br>Price MACD Histogram=%{y:.2f}<extra></extra>'});







  // SETA MACD visual polish v3:



  // Keep price MACD as the primary structure, then add sentiment momentum as a subtle overlay.



  // The volatile scaled sentiment MACD fast line remains available in hover/customdata but is not drawn by default.



  const sentHist=rows.map(r=>num(r.sentiment_macd_histogram ?? r.scaled_sentiment_macd_histogram ?? r.sentiment_macd_signal_difference ?? r.sentiment_macd_signal_diff));



  const sentHistHasData=sentHist.some(v=>v!==null&&Number.isFinite(v));



  if(sentHistHasData){



    const sentHistColors=sentHist.map(v=>v==null?'rgba(180,180,180,0)':v>=0?'rgba(75,230,180,0.20)':'rgba(255,185,120,0.18)');



    data.push({type:'bar',x:xs,y:sentHist,name:'Sentiment MACD Histogram Overlay',marker:{color:sentHistColors,line:{width:0}},opacity:0.72,xaxis:'x2',yaxis:'y2',showlegend:false,hovertemplate:'%{x|%b %d, %Y}<br>Sentiment MACD Histogram=%{y:.2f}<extra></extra>'});



  }



  data.push(traceLine(xs,rows.map(r=>num(r.macd)),'MACD',COLORS.ma7,2.0,'solid','y2',false,'%{x|%b %d, %Y}<br>MACD=%{y:.2f}<extra></extra>'));



  data.push(traceLine(xs,rows.map(r=>num(r.macd_signal)),'Signal',COLORS.ma50,1.5,'solid','y2',false,'%{x|%b %d, %Y}<br>Signal=%{y:.2f}<extra></extra>'));



  if(osc==='both'){



    // Match Sent RSI / Sent Stoch visual language: solid green sentiment line with a subtle narrow glow.



    // The volatile scaled sentiment MACD fast line remains available in hover/customdata but is not drawn by default.



    const sentMacdBundle = sentimentBundle(



      xs,



      rows.map(r=>num(r.scaled_sentiment_macd_signal)),



      'Sentiment MACD Signal',



      'y2',



      false,



      '%{x|%b %d, %Y}<br>Sentiment MACD Signal=%{y:.2f}<br>Hidden fast line=%{customdata:.2f}<extra></extra>',



      1.15



    );







    sentMacdBundle[0].line = {



      ...(sentMacdBundle[0].line || {}),



      width: 3.8,



      dash: 'solid',



      color: 'rgba(0,255,0,0.10)'



    };



    sentMacdBundle[1].line = {



      ...(sentMacdBundle[1].line || {}),



      width: 2.2,



      dash: 'solid',



      color: 'rgba(0,255,0,0.22)'



    };



    sentMacdBundle[2].line = {



      ...(sentMacdBundle[2].line || {}),



      width: 1.25,



      dash: 'solid',



      color: COLORS.sentCore



    };







    sentMacdBundle.forEach(t=>{



      t.customdata=rows.map(r=>num(r.scaled_sentiment_macd));



      data.push(t);



    });



  }







  const crossX=[],crossY=[],crossText=[],crossSize=[],crossColor=[];



  rows.forEach(r=>{const c=num(r.macd_signal_cross), y=num(r.scaled_sentiment_macd_signal) ?? num(r.macd); if(c===1||c===-1){crossX.push(r.dateObj); crossY.push(y); crossText.push(c===1?'Sentiment bull':'Sentiment bear'); crossSize.push(Math.min(15,8+Math.abs(num(r.macd_cross_significance)||0)*1.6)); crossColor.push(c===1?'rgba(83,235,175,0.92)':'rgba(255,174,118,0.90)');}});



  if(crossX.length) data.push({type:'scatter',mode:'markers+text',x:crossX,y:crossY,text:crossText,textposition:'top center',xaxis:'x2',yaxis:'y2',marker:{size:crossSize,color:crossColor,symbol:'triangle-up'},name:'Sentiment crosses',showlegend:false,hovertemplate:'%{x|%b %d, %Y}<br>%{text} cross<extra></extra>'});







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



  const sentConfLabel=sentConf==='yes' ? 'Confirmed' : (sentConf==='no' ? 'Mixed' : 'n/a');



  const lastCrossRow=[...visRows].reverse().find(r=>Math.abs(num(r.macd_signal_cross)||0)===1);



  const lastCrossText=lastCrossRow?`${num(lastCrossRow.macd_signal_cross)===1?'Bull':'Bear'} ${lastCrossRow.date}`:'none';



  const histDir=visRows.length>=2&&num(visRows[visRows.length-1].macd_histogram)!==null&&num(visRows[visRows.length-2].macd_histogram)!==null?(num(visRows[visRows.length-1].macd_histogram)>=num(visRows[visRows.length-2].macd_histogram)?'rising':'falling'):'flat';



  const histDirLabel=histDir.charAt(0).toUpperCase()+histDir.slice(1);



  const macdRegime=(num(last.macd)!==null&&num(last.macd_signal)!==null&&num(last.macd)>=num(last.macd_signal))?'Bullish':'Bearish';



  const lastRsiVal = num(last.rsi_d) ?? num(last.rsi);



  const lastSentRsiVal = num(last.sentiment_rsi_d) ?? num(last.sentiment_rsi);



  const rsiBias = lastRsiVal===null ? 'n/a' : (lastRsiVal>=70 ? 'Overbought' : (lastRsiVal<=30 ? 'Oversold' : (lastRsiVal>=55 ? 'Bullish Bias' : (lastRsiVal<=45 ? 'Bearish Bias' : 'Neutral'))));



  const rsiGap=oscillatorGapInfo(lastRsiVal, lastSentRsiVal, 'rsi');



  const rsiPaneText = `RSI / Sent RSI · ${formatNum(lastRsiVal)} / ${formatNum(lastSentRsiVal)} · ${rsiBias} · ${rsiGap.label}`;



  const lastStochK = num(last.stochastic_rsi);



  const lastStochD = num(last.stochastic_rsi_d);



  const lastSentStoch = num(last.sentiment_stochastic_rsi_d);



  const stochBias = lastStochK===null || lastStochD===null ? 'n/a' : (lastStochK>=80 ? 'Overbought' : (lastStochK<=20 ? 'Oversold' : (lastStochK>=lastStochD ? 'Recovery Bias' : 'Softening Bias')));



  const stochGap=oscillatorGapInfo(lastStochK, lastSentStoch, 'stoch');



  const stochPaneText = `%K / %D / Sent Stoch · ${formatNum(lastStochK)} / ${formatNum(lastStochD)} / ${formatNum(lastSentStoch)} · ${stochBias} · ${stochGap.label}`;



  const rb=(calendar==='trading_sessions' && freq==='D')?[{bounds:['sat','mon']}]:[];



  const regimeRects=(regimeLayer==='on' && showSentRibbon) ? regimeSegments(rows, regimeInfo, visStart, visEnd).map(seg=>({type:'rect',xref:'x',x0:seg.start,x1:nextRangeEnd(seg.end,calendar,freq),yref:'paper',y0:0.54,y1:0.98,line:{width:0},fillcolor:regimeFillColor(seg.regime),layer:'below'})) : [];



  const overlapTriggerShapes=[];



  const engagementShapes = engagement==='overlay' ? engagementOverlayShapes(rows, visibleMask, freq) : [];







  const lowerPanesVisible = showLowerPanes();



  const layout={



    paper_bgcolor:COLORS.bg, plot_bgcolor:COLORS.panel, font:{color:COLORS.text}, margin:{l:64,r:30,t:18,b:54}, barmode:'overlay',



    showlegend: showLegend(),



    legend:{orientation:'v', y:0.945, x:0.0, xanchor:'left', yanchor:'top', bgcolor:'rgba(0,0,0,0.24)', bordercolor:'#2a3138', borderwidth:1, font:{size:11}},



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



      ...(cfg.showRibbonAnnotation !== false && regimeLayer==='on' && showSentRibbon ? [{xref:'paper',yref:'paper',x:0.99,y:0.985,xanchor:'right',text:`Ribbon: ${lastRegimeInfo.regime} | Confidence: ${(lastRegimeInfo.confidence ?? 0).toFixed(0)} | ${(lastRegimeInfo.compression ? 'Compressed' : ((lastRegimeInfo.widthZ ?? 0)>=0 ? 'Expanding' : 'Narrowing'))}`,showarrow:false,align:'right',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),



      ...((bollinger==='overlap' || bollinger==='contextual' || bollinger==='both') ? [{xref:'paper',yref:'paper',x:0.01,y: cfg.compactAnnotations ? 0.988 : 0.972,xanchor:'left',text: cfg.compactAnnotations ? `${overlapInfo.modelLabel}: ${overlapInfo.stateLabel} | ${overlapInfo.context}` : overlapInfo.annotation,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),



      ...(cfg.showMacdAnnotation !== false && lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.495,xanchor:'left',text:`MACD ${macdRegime} · Sent Cross ${lastCrossText} · Hist ${histDirLabel} · Sent ${sentConfLabel}`,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),



      ...(lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.275,xanchor:'left',text:rsiPaneText,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : []),



      ...(lowerPanesVisible ? [{xref:'paper',yref:'paper',x:0.01,y:0.135,xanchor:'left',text:stochPaneText,showarrow:false,align:'left',font:{size:11,color:'#d7e0e6'},bgcolor:'rgba(0,0,0,0.25)',bordercolor:'#283038',borderwidth:1}] : [])



    ],



    hovermode:'closest',



    spikedistance:-1,



    hoverdistance:18,



    hoverlabel:{



      bgcolor:'rgba(5,7,10,0.96)',



      bordercolor:'rgba(159,183,255,0.20)',



      font:{color:COLORS.text,size:12},



      align:'left'



    }



  };



  Plotly.newPlot('chart', data, layout, {responsive:true, displaylogo:false}).then(()=>{



    window.requestAnimationFrame(()=>syncAlertSidePanelHeight());



  });



}



const CONTROL_IDS=['asset','freq','range','priceDisplay','scaleMode','ribbon','sentRibbon','regimeLayer','engagement','bollinger','osc'];



function attachControlHandlers(){ CONTROL_IDS.forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', buildFigure); }); }



async function initDashboard(){



  try{



    await loadManifest();



    applyModeUi();



    applyModeDefaults();



    await Promise.all([loadStore(), loadScreenerStore()]);



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











// BEGIN phaseG_market_tape_metric_deck_v6



(function phaseG_market_tape_metric_deck_v6(){



  if(window.__phaseG_market_tape_metric_deck_v6) return;



  window.__phaseG_market_tape_metric_deck_v6 = true;







  const css = `



/* phaseG_market_tape_metric_deck_v6_style */



.marketTapeDetail{grid-template-columns:minmax(360px,1.05fr) minmax(520px,1.45fr)!important;gap:10px!important;}



.marketTapeFamilyGrid{display:grid!important;grid-template-columns:1.1fr repeat(3,minmax(92px,1fr))!important;grid-template-rows:repeat(2,minmax(58px,auto))!important;gap:7px!important;align-content:start!important;min-height:126px!important;}



.marketTapeFamily{min-height:58px!important;padding:8px 9px!important;border-radius:11px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;overflow:hidden!important;}



.marketTapeFamily:first-child{grid-column:1!important;grid-row:1 / span 2!important;min-height:123px!important;border-color:rgba(250,204,21,.55)!important;background:linear-gradient(180deg,rgba(250,204,21,.09),rgba(255,255,255,.035))!important;box-shadow:0 0 0 1px rgba(250,204,21,.09)!important;}



.marketTapeFamily:first-child .marketTapeFamilyName{font-size:11px!important;}



.marketTapeFamily:first-child .marketTapeFamilyScore{font-size:22px!important;color:#facc15!important;}



.marketTapeFamily:first-child .marketTapeFamilyLabel{font-size:11px!important;white-space:normal!important;}



.marketTapeFamilyName{font-size:10.4px!important;line-height:1.08!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#afc0c8!important;}



.marketTapeFamilyScore{font-size:17px!important;line-height:1!important;font-weight:900!important;margin:3px 0 2px!important;}



.marketTapeFamilyLabel{font-size:10.4px!important;line-height:1.08!important;white-space:normal!important;overflow:hidden!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;}



@media (max-width:1220px){.marketTapeDetail{grid-template-columns:1fr!important}.marketTapeFamilyGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-template-rows:auto!important}.marketTapeFamily:first-child{grid-column:span 1!important;grid-row:auto!important;min-height:58px!important}}



@media (max-width:760px){.marketTapeFamilyGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}



`;







  function installStyle(){



    let style = document.getElementById('phaseG_market_tape_metric_deck_v6_style');



    if(!style){



      style = document.createElement('style');



      style.id = 'phaseG_market_tape_metric_deck_v6_style';



      document.head.appendChild(style);



    }



    style.textContent = css;



  }







  function norm(v){ return String(v == null ? '' : v).trim(); }



  function asScore(v){



    if(v == null || v === '') return '';



    const n = Number(v);



    if(Number.isFinite(n)) return String(Math.round(n));



    return String(v);



  }



  function escapeMini(s){



    return String(s == null ? '' : s).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));



  }



  function activeTerm(){



    const sel = document.getElementById('asset');



    if(sel && sel.value) return String(sel.value).toUpperCase();



    const h = document.querySelector('.marketTapeTitle h3');



    const m = h && h.textContent.match(/Active\s+([A-Z0-9.\-]+)/i);



    return m ? m[1].toUpperCase() : '';



  }



  function activeRecord(){



    const t = activeTerm();



    const store = window.SCREENER_STORE || {};



    const byTerm = store.by_term || {};



    return byTerm[t] || byTerm[t.toUpperCase()] || byTerm[t.toLowerCase()] || null;



  }



  function collectObjects(obj, out=[], depth=0){



    if(!obj || depth > 5) return out;



    if(Array.isArray(obj)){



      obj.forEach(x => collectObjects(x, out, depth + 1));



    }else if(typeof obj === 'object'){



      out.push(obj);



      Object.keys(obj).forEach(k => collectObjects(obj[k], out, depth + 1));



    }



    return out;



  }



  function firstValue(obj, keys){



    if(!obj) return '';



    for(const k of keys){



      if(obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') return obj[k];



    }



    return '';



  }



  function deepFirst(obj, keys){



    const objects = collectObjects(obj, [], 0);



    for(const o of objects){



      const v = firstValue(o, keys);



      if(v !== '') return v;



    }



    return '';



  }



  function findFamilyMetric(rec, def){



    const objs = collectObjects(rec, [], 0);



    let best = null;



    for(const o of objs){



      const hay = [o.family, o.family_name, o.indicator_family, o.name, o.label, o.metric, o.key, o.title].map(norm).join(' ').toLowerCase();



      if(def.tokens.some(tok => hay.includes(tok))){ best = o; break; }



    }



    const score = best ? firstValue(best, ['score','family_score','direction_score','state_score','value','metric_score']) : '';



    const label = best ? firstValue(best, ['state_label','family_label','direction_label','label','classification','bias','regime']) : '';



    return {



      name: def.name,



      score: asScore(score || deepFirst(rec, def.scoreKeys)),



      label: norm(label || deepFirst(rec, def.labelKeys) || def.fallbackLabel)



    };



  }



  function metricHtml(m){



    if(!m.score && !m.label) return '';



    return `<div class="marketTapeFamily marketTapeFamilyV6" data-mt-v6="${escapeMini(m.name)}"><div class="marketTapeFamilyName">${escapeMini(m.name)}</div><div class="marketTapeFamilyScore">${escapeMini(m.score || 'n/a')}</div><div class="marketTapeFamilyLabel">${escapeMini(m.label || '')}</div></div>`;



  }



  function ensureMetricDeck(){



    installStyle();



    const grid = document.querySelector('.marketTapeDetail .marketTapeFamilyGrid');



    if(!grid) return;



    const rec = activeRecord();



    if(!rec) return;







    const existingText = Array.from(grid.querySelectorAll('.marketTapeFamilyName')).map(el => el.textContent.trim().toLowerCase()).join(' | ');



    const defs = [



      {name:'Bollinger', tokens:['bollinger','overlap'], scoreKeys:['attention_adjusted_bollinger_score','bollinger_direction_score','bollinger_score','overlap_score'], labelKeys:['bollinger_direction_label','overlap_state','overlap_state_label','bollinger_label'], fallbackLabel:'Overlap'},



      {name:'Ribbon', tokens:['ribbon'], scoreKeys:['sent_ribbon_direction_score','sent_ribbon_score','sentiment_ribbon_score'], labelKeys:['sent_ribbon_label','sentiment_ribbon_label','ribbon_label'], fallbackLabel:'Sentiment'},



      {name:'Trend', tokens:['trend','ma trend','moving average','ma family'], scoreKeys:['ma_family_direction_score','ma_trend_score','trend_score','ma_score'], labelKeys:['ma_family_label','ma_trend_label','trend_label'], fallbackLabel:'MA Trend'},



    ];



    defs.forEach(def => {



      const key = def.name.toLowerCase();



      if(existingText.includes(key)) return;



      const m = findFamilyMetric(rec, def);



      const html = metricHtml(m);



      if(html) grid.insertAdjacentHTML('beforeend', html);



    });



  }







  const observer = new MutationObserver(() => ensureMetricDeck());



  function start(){



    installStyle();



    ensureMetricDeck();



    if(document.body) observer.observe(document.body, {childList:true, subtree:true});



  }



  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);



  else start();



})();



// END phaseG_market_tape_metric_deck_v6











// BEGIN phaseG_market_tape_layout_v5



(function phaseG_market_tape_layout_v5() {



  if (typeof document === "undefined") return;



  if (window.__phaseG_market_tape_layout_v5) return;



  window.__phaseG_market_tape_layout_v5 = true;







  const css = `



/* phaseG_market_tape_layout_v5_style */



:root {



  --mt-v5-card-min-h: 116px;



  --mt-v5-score-min-h: 78px;



}







/* Restore the hero/top row to a true top five. */



.market-tape-top-row,



.marketTapeTopRow,



.market-tape-leaders,



.marketTapeLeaders,



.market-tape-movers-top,



.marketTapeMoversTop,



.market-tape-grid-top,



.marketTapeGridTop,



[data-market-tape-top-row="true"],



[data-market-tape-section="top-row"],



[data-market-tape-section="leaders"] {



  display: grid !important;



  grid-template-columns: repeat(5,minmax(0,1fr)) !important;



  gap: 12px !important;



  align-items: stretch !important;



}







/* Let cards breathe without letting one name/price line blow out the row. */



.market-tape-top-row > *,



.marketTapeTopRow > *,



.market-tape-leaders > *,



.marketTapeLeaders > *,



.market-tape-movers-top > *,



.marketTapeMoversTop > *,



.market-tape-grid-top > *,



.marketTapeGridTop > *,



[data-market-tape-top-row="true"] > *,



[data-market-tape-section="top-row"] > *,



[data-market-tape-section="leaders"] > * {



  min-width: 0 !important;



  min-height: var(--mt-v5-card-min-h) !important;



}







.market-tape-top-row .ticker,



.market-tape-top-row .symbol,



.marketTapeTopRow .ticker,



.marketTapeTopRow .symbol,



.market-tape-leaders .ticker,



.market-tape-leaders .symbol,



.marketTapeLeaders .ticker,



.marketTapeLeaders .symbol {



  overflow: hidden !important;



  text-overflow: ellipsis !important;



  white-space: nowrap !important;



}







/* Bring back a fuller score-box set and keep labels readable. */



.market-tape-score-grid,



.marketTapeScoreGrid,



.market-tape-score-row,



.marketTapeScoreRow,



.market-tape-score-boxes,



.marketTapeScoreBoxes,



[data-market-tape-section="scores"],



[data-market-tape-score-grid="true"] {



  display: grid !important;



  grid-template-columns: repeat(auto-fit,minmax(148px,1fr)) !important;



  gap: 10px !important;



  align-items: stretch !important;



}







.market-tape-score-grid > *,



.marketTapeScoreGrid > *,



.market-tape-score-row > *,



.marketTapeScoreRow > *,



.market-tape-score-boxes > *,



.marketTapeScoreBoxes > *,



[data-market-tape-section="scores"] > *,



[data-market-tape-score-grid="true"] > * {



  min-width: 0 !important;



  min-height: var(--mt-v5-score-min-h) !important;



  padding: 10px 12px !important;



}







.market-tape-score-grid .label,



.marketTapeScoreGrid .label,



.market-tape-score-row .label,



.marketTapeScoreRow .label,



.market-tape-score-boxes .label,



.marketTapeScoreBoxes .label,



[data-market-tape-section="scores"] .label {



  display: block !important;



  white-space: normal !important;



  overflow-wrap: anywhere !important;



  line-height: 1.15 !important;



}







/* Rebalance selected-detail layout to reduce awkward empty space. */



.market-tape-selected-detail,



.marketTapeSelectedDetail,



.market-tape-detail-panel,



.marketTapeDetailPanel,



[data-market-tape-section="selected-detail"],



[data-market-tape-section="detail"] {



  display: grid !important;



  grid-template-columns: minmax(260px,0.95fr) minmax(320px,1.35fr) !important;



  gap: 14px !important;



  align-items: stretch !important;



}







.market-tape-selected-detail > *,



.marketTapeSelectedDetail > *,



.market-tape-detail-panel > *,



.marketTapeDetailPanel > *,



[data-market-tape-section="selected-detail"] > *,



[data-market-tape-section="detail"] > * {



  min-width: 0 !important;



}







@media (max-width: 1200px) {



  .market-tape-top-row,



  .marketTapeTopRow,



  .market-tape-leaders,



  .marketTapeLeaders,



  .market-tape-movers-top,



  .marketTapeMoversTop,



  .market-tape-grid-top,



  .marketTapeGridTop,



  [data-market-tape-top-row="true"],



  [data-market-tape-section="top-row"],



  [data-market-tape-section="leaders"] {



    grid-template-columns: repeat(3,minmax(0,1fr)) !important;



  }



}







@media (max-width: 760px) {



  .market-tape-top-row,



  .marketTapeTopRow,



  .market-tape-leaders,



  .marketTapeLeaders,



  .market-tape-movers-top,



  .marketTapeMoversTop,



  .market-tape-grid-top,



  .marketTapeGridTop,



  [data-market-tape-top-row="true"],



  [data-market-tape-section="top-row"],



  [data-market-tape-section="leaders"],



  .market-tape-selected-detail,



  .marketTapeSelectedDetail,



  .market-tape-detail-panel,



  .marketTapeDetailPanel,



  [data-market-tape-section="selected-detail"],



  [data-market-tape-section="detail"] {



    grid-template-columns: 1fr !important;



  }



}



`;







  const style = document.createElement("style");



  style.id = "phaseG_market_tape_layout_v5_style";



  style.textContent = css;



  document.head.appendChild(style);



})();



// END phaseG_market_tape_layout_v5



// phaseG_market_tape_cache_013



window.__MARKET_TAPE_CACHE_BUST__ = 'market_tape_cache_013';















// BEGIN phaseG_market_tape_metric_deck_v7



(function phaseG_market_tape_metric_deck_v7(){



  if (window.__phaseG_market_tape_metric_deck_v7) return;



  window.__phaseG_market_tape_metric_deck_v7 = true;







  const css = `



/* phaseG_market_tape_metric_deck_v7_style */



/* Normalize Market Tape metric deck: SETA Score + strict 3x2 mini grid. */



.screenerPanel.marketTape .marketTapeFamilyGrid{



  display:grid!important;



  grid-template-columns:124px repeat(3,minmax(74px,1fr))!important;



  grid-template-rows:repeat(2,58px)!important;



  grid-auto-flow:column!important;



  grid-auto-columns:minmax(74px,1fr)!important;



  gap:7px!important;



  align-items:stretch!important;



  align-content:start!important;



  justify-content:start!important;



  min-height:123px!important;



  max-width:520px!important;



}







.screenerPanel.marketTape .marketTapeFamily{



  min-width:0!important;



  min-height:58px!important;



  height:58px!important;



  padding:7px 8px!important;



  border-radius:10px!important;



  box-sizing:border-box!important;



  display:flex!important;



  flex-direction:column!important;



  justify-content:center!important;



  overflow:hidden!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child{



  grid-column:1!important;



  grid-row:1 / span 2!important;



  width:124px!important;



  min-height:123px!important;



  height:123px!important;



  padding:10px 11px!important;



  justify-content:center!important;



  border-color:rgba(250,204,21,.55)!important;



  background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(255,255,255,.035))!important;



  box-shadow:0 0 0 1px rgba(250,204,21,.10)!important;



}







.screenerPanel.marketTape .marketTapeFamily:not(:first-child){



  width:auto!important;



}







.screenerPanel.marketTape .marketTapeFamilyName{



  font-size:10px!important;



  line-height:1.05!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:ellipsis!important;



  color:#b8c8d0!important;



}







.screenerPanel.marketTape .marketTapeFamilyScore{



  font-size:17px!important;



  line-height:1!important;



  margin:3px 0 2px!important;



  font-weight:900!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:clip!important;



}







.screenerPanel.marketTape .marketTapeFamilyLabel{



  font-size:10px!important;



  line-height:1.08!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:ellipsis!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyScore{



  font-size:24px!important;



  line-height:1!important;



  color:#facc15!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyName{



  font-size:11px!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyLabel{



  font-size:11px!important;



  white-space:normal!important;



  overflow:visible!important;



}







.screenerPanel.marketTape .marketTapeDetail{



  grid-template-columns:minmax(300px,1fr) minmax(520px,1fr)!important;



  align-items:stretch!important;



}







/* Keep the selected thesis from wasting vertical space. */



.screenerPanel.marketTape .marketTapeDetail > div:first-child{



  min-height:123px!important;



}







@media (max-width:1220px){



  .screenerPanel.marketTape .marketTapeDetail{



    grid-template-columns:1fr!important;



  }



  .screenerPanel.marketTape .marketTapeFamilyGrid{



    max-width:none!important;



    grid-template-columns:124px repeat(3,minmax(86px,1fr))!important;



  }



}







@media (max-width:760px){



  .screenerPanel.marketTape .marketTapeFamilyGrid{



    grid-template-columns:repeat(2,minmax(0,1fr))!important;



    grid-template-rows:auto!important;



    grid-auto-flow:row!important;



  }



  .screenerPanel.marketTape .marketTapeFamily:first-child{



    grid-column:1 / span 2!important;



    grid-row:auto!important;



    width:auto!important;



    height:auto!important;



    min-height:70px!important;



  }



}



`;







  function injectMetricDeckStyle(){



    const old = document.getElementById("phaseG_market_tape_metric_deck_v7_style");



    if (old) old.remove();



    const style = document.createElement("style");



    style.id = "phaseG_market_tape_metric_deck_v7_style";



    style.textContent = css;



    document.head.appendChild(style);



  }







  function normalizeMetricText(){



    const cards = Array.from(document.querySelectorAll(".marketTapeFamily"));



    for (const card of cards){



      const nameEl = card.querySelector(".marketTapeFamilyName");



      const scoreEl = card.querySelector(".marketTapeFamilyScore");



      const labelEl = card.querySelector(".marketTapeFamilyLabel");



      const name = (nameEl?.textContent || "").trim().toLowerCase();







      // Trend currently has a direction label but no numeric field in the store.



      // Display "--" instead of "n/a" so the tile does not look broken.



      if (name === "summary" && nameEl){



        nameEl.textContent = "SETA Score";



      }







      if (name === "trend" && scoreEl){



        const s = (scoreEl.textContent || "").trim().toLowerCase();



        if (!s || s === "n/a" || s === "na" || s === "nan" || s === "null"){



          scoreEl.textContent = "--";



        }



      }







      // Keep all small metric cards visually equal even when labels are longer.



      if (labelEl){



        labelEl.title = labelEl.textContent.trim();



      }



    }



  }







  function applyMarketTapeMetricDeckV7(){



    injectMetricDeckStyle();



    normalizeMetricText();



  }







  const oldRender = window.renderScreenerPanel;



  if (typeof oldRender === "function" && !oldRender.__metricDeckV7Wrapped){



    const wrapped = function(){



      const out = oldRender.apply(this, arguments);



      setTimeout(applyMarketTapeMetricDeckV7, 0);



      setTimeout(applyMarketTapeMetricDeckV7, 80);



      return out;



    };



    wrapped.__metricDeckV7Wrapped = true;



    window.renderScreenerPanel = wrapped;



  }







  const obs = new MutationObserver(() => {



    if (document.querySelector(".marketTapeFamilyGrid")){



      applyMarketTapeMetricDeckV7();



    }



  });







  function startObserver(){



    if (document.body){



      obs.observe(document.body, {childList:true, subtree:true});



      applyMarketTapeMetricDeckV7();



    } else {



      setTimeout(startObserver, 50);



    }



  }







  startObserver();



})();



// END phaseG_market_tape_metric_deck_v7



















// BEGIN phaseG_market_tape_metric_deck_v8



(function phaseG_market_tape_metric_deck_v8(){



  if (window.__phaseG_market_tape_metric_deck_v8) return;



  window.__phaseG_market_tape_metric_deck_v8 = true;







  const css = `



/* phaseG_market_tape_metric_deck_v8_style */



/* Market Tape metric deck: SETA Score left, six metric cards in a stable 3x2 grid. */



.screenerPanel.marketTape .marketTapeFamilyGrid,



.marketTape .marketTapeFamilyGrid{



  display:grid!important;



  grid-template-columns:124px repeat(3,74px)!important;



  grid-template-rows:58px 58px!important;



  grid-auto-flow:row!important;



  grid-auto-columns:74px!important;



  gap:7px!important;



  align-items:stretch!important;



  justify-content:start!important;



  align-content:start!important;



  width:max-content!important;



  max-width:100%!important;



  min-height:123px!important;



  overflow:visible!important;



}







.screenerPanel.marketTape .marketTapeFamily,



.marketTape .marketTapeFamily{



  min-width:0!important;



  width:74px!important;



  min-height:58px!important;



  height:58px!important;



  padding:7px 8px!important;



  border-radius:10px!important;



  box-sizing:border-box!important;



  display:flex!important;



  flex-direction:column!important;



  justify-content:center!important;



  overflow:hidden!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child,



.marketTape .marketTapeFamily:first-child{



  grid-column:1!important;



  grid-row:1 / span 2!important;



  width:124px!important;



  min-width:124px!important;



  height:123px!important;



  min-height:123px!important;



  padding:10px 11px!important;



  justify-content:center!important;



  border-color:rgba(250,204,21,.55)!important;



  background:linear-gradient(180deg,rgba(250,204,21,.10),rgba(255,255,255,.035))!important;



  box-shadow:0 0 0 1px rgba(250,204,21,.10)!important;



}







/* Explicit placement prevents a 7th card from wrapping into a skinny orphan column. */



.screenerPanel.marketTape .marketTapeFamily:nth-child(2),



.marketTape .marketTapeFamily:nth-child(2){ grid-column:2!important; grid-row:1!important; }



.screenerPanel.marketTape .marketTapeFamily:nth-child(3),



.marketTape .marketTapeFamily:nth-child(3){ grid-column:3!important; grid-row:1!important; }



.screenerPanel.marketTape .marketTapeFamily:nth-child(4),



.marketTape .marketTapeFamily:nth-child(4){ grid-column:4!important; grid-row:1!important; }



.screenerPanel.marketTape .marketTapeFamily:nth-child(5),



.marketTape .marketTapeFamily:nth-child(5){ grid-column:2!important; grid-row:2!important; }



.screenerPanel.marketTape .marketTapeFamily:nth-child(6),



.marketTape .marketTapeFamily:nth-child(6){ grid-column:3!important; grid-row:2!important; }



.screenerPanel.marketTape .marketTapeFamily:nth-child(7),



.marketTape .marketTapeFamily:nth-child(7){ grid-column:4!important; grid-row:2!important; }







.screenerPanel.marketTape .marketTapeFamilyName,



.marketTape .marketTapeFamilyName{



  font-size:10px!important;



  line-height:1.05!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:ellipsis!important;



  color:#b8c8d0!important;



}







.screenerPanel.marketTape .marketTapeFamilyScore,



.marketTape .marketTapeFamilyScore{



  font-size:17px!important;



  line-height:1!important;



  margin:3px 0 2px!important;



  font-weight:900!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:clip!important;



}







.screenerPanel.marketTape .marketTapeFamilyLabel,



.marketTape .marketTapeFamilyLabel{



  font-size:10px!important;



  line-height:1.08!important;



  white-space:nowrap!important;



  overflow:hidden!important;



  text-overflow:ellipsis!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyScore,



.marketTape .marketTapeFamily:first-child .marketTapeFamilyScore{



  font-size:24px!important;



  line-height:1!important;



  color:#facc15!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyName,



.marketTape .marketTapeFamily:first-child .marketTapeFamilyName{



  font-size:11px!important;



}







.screenerPanel.marketTape .marketTapeFamily:first-child .marketTapeFamilyLabel,



.marketTape .marketTapeFamily:first-child .marketTapeFamilyLabel{



  font-size:11px!important;



  white-space:normal!important;



  overflow:visible!important;



}







.screenerPanel.marketTape .marketTapeDetail,



.marketTape .marketTapeDetail{



  grid-template-columns:minmax(300px,1fr) minmax(360px,auto)!important;



  align-items:stretch!important;



}







@media (max-width:1220px){



  .screenerPanel.marketTape .marketTapeDetail,



  .marketTape .marketTapeDetail{



    grid-template-columns:1fr!important;



  }



}







@media (max-width:760px){



  .screenerPanel.marketTape .marketTapeFamilyGrid,



  .marketTape .marketTapeFamilyGrid{



    grid-template-columns:repeat(2,minmax(0,1fr))!important;



    grid-template-rows:auto!important;



    width:100%!important;



  }



  .screenerPanel.marketTape .marketTapeFamily,



  .marketTape .marketTapeFamily{



    width:auto!important;



  }



  .screenerPanel.marketTape .marketTapeFamily:first-child,



  .marketTape .marketTapeFamily:first-child{



    grid-column:1 / span 2!important;



    grid-row:auto!important;



    width:auto!important;



    height:auto!important;



    min-height:70px!important;



  }



  .screenerPanel.marketTape .marketTapeFamily:nth-child(n+2),



  .marketTape .marketTapeFamily:nth-child(n+2){



    grid-column:auto!important;



    grid-row:auto!important;



  }



}



`;







  function injectMetricDeckStyle(){



    [



      "phaseG_market_tape_metric_deck_v6_style",



      "phaseG_market_tape_metric_deck_v7_style",



      "phaseG_market_tape_metric_deck_v8_style"



    ].forEach(id => {



      const old = document.getElementById(id);



      if (old) old.remove();



    });



    const style = document.createElement("style");



    style.id = "phaseG_market_tape_metric_deck_v8_style";



    style.textContent = css;



    document.head.appendChild(style);



  }







  function normalizeMetricText(){



    const cards = Array.from(document.querySelectorAll(".marketTapeFamily"));



    for (const card of cards){



      const nameEl = card.querySelector(".marketTapeFamilyName");



      const scoreEl = card.querySelector(".marketTapeFamilyScore");



      const labelEl = card.querySelector(".marketTapeFamilyLabel");



      const name = (nameEl?.textContent || "").trim().toLowerCase();







      if (name === "summary" && nameEl){



        nameEl.textContent = "SETA Score";



      }







      if (name === "trend" && scoreEl){



        const s = (scoreEl.textContent || "").trim().toLowerCase();



        if (!s || s === "n/a" || s === "na" || s === "nan" || s === "null"){



          scoreEl.textContent = "--";



        }



      }



      if (labelEl) labelEl.title = labelEl.textContent.trim();



    }



  }







  function applyMarketTapeMetricDeckV8(){



    injectMetricDeckStyle();



    normalizeMetricText();



  }







  const oldRender = window.renderScreenerPanel;



  if (typeof oldRender === "function" && !oldRender.__metricDeckV8Wrapped){



    const wrapped = function(){



      const out = oldRender.apply(this, arguments);



      setTimeout(applyMarketTapeMetricDeckV8, 0);



      setTimeout(applyMarketTapeMetricDeckV8, 80);



      setTimeout(applyMarketTapeMetricDeckV8, 250);



      return out;



    };



    wrapped.__metricDeckV8Wrapped = true;



    window.renderScreenerPanel = wrapped;



  }







  const obs = new MutationObserver(() => {



    if (document.querySelector(".marketTapeFamilyGrid")) applyMarketTapeMetricDeckV8();



  });







  function startObserver(){



    if (document.body){



      obs.observe(document.body, {childList:true, subtree:true});



      applyMarketTapeMetricDeckV8();



    } else {



      setTimeout(startObserver, 50);



    }



  }







  startObserver();



})();



// END phaseG_market_tape_metric_deck_v8







// BEGIN phase_daily_seta_tooltip_layer_v1



(function phase_daily_seta_tooltip_layer_v1(){



  if (window.__phase_daily_seta_tooltip_layer_v1) return;



  window.__phase_daily_seta_tooltip_layer_v1 = true;







  const TRACE_NAME = 'Daily SETA Tooltip';







  function toNumber(value){



    if (value === null || value === undefined || value === '') return null;



    const n = Number(value);



    return Number.isFinite(n) ? n : null;



  }







  function fmt(value, digits=2){



    const n = toNumber(value);



    if (n === null) return 'n/a';



    return n.toFixed(digits);



  }







  function fmtScore(value){



    const n = toNumber(value);



    if (n === null) return null;



    return Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);



  }







  function esc(value){



    return String(value ?? '')



      .replace(/&/g, '&amp;')



      .replace(/</g, '&lt;')



      .replace(/>/g, '&gt;')



      .replace(/"/g, '&quot;')



      .replace(/'/g, '&#39;');



  }







  function normDate(value){



    if (value === null || value === undefined) return null;



    if (typeof value === 'string'){



      const m = value.match(/\d{4}-\d{2}-\d{2}/);



      if (m) return m[0];



    }



    const d = value instanceof Date ? value : new Date(value);



    if (!Number.isFinite(d.getTime())) return null;



    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;



  }







  function activeRows(){



    let store = null;



    try { store = STORE; } catch (_err) { store = window.STORE || null; }



    if (!store) return [];



    const asset = document.getElementById('asset')?.value;



    const freq = document.getElementById('freq')?.value || 'D';



    if (!asset || !store[freq] || !Array.isArray(store[freq][asset])) return [];



    return store[freq][asset];



  }







  function rowYValues(row){



    const high = toNumber(row.high);



    const low = toNumber(row.low);



    const close = toNumber(row.close);



    const open = toNumber(row.open);



    const mid = (high !== null && low !== null) ? (high + low) / 2 : (close ?? open ?? null);



    const out = [];



    if (high !== null) out.push(high);



    if (mid !== null) out.push(mid);



    if (low !== null) out.push(low);



    if (!out.length && close !== null) out.push(close);



    return out;



  }







  function scoreLine(row){



    const score = fmtScore(row?.seta_dashboard_summary_score);



    const label = String(row?.seta_dashboard_summary_label || '').trim();



    if (score === null) return '';



    return label ? `SETA Score ${score} · ${esc(label)}` : `SETA Score ${score}`;



  }







  function ribbonLine(row){



    const transition = String(row?.sent_ribbon_transition_type || '').trim();



    const regime = String(row?.sent_ribbon_regime_raw || '').trim();



    if (transition) return `Ribbon ${esc(transition)}`;



    if (regime) return `Ribbon ${esc(regime)}`;



    return '';



  }







  function gapLabel(prefix, sent, price, leadThreshold=8, materialThreshold=20, extremeThreshold=35){



    const s = toNumber(sent);



    const p = toNumber(price);



    if (s === null || p === null) return '';



    const gap = s - p;



    const abs = Math.abs(gap);



    let state = 'Aligned';



    if (gap >= leadThreshold) state = 'Sent Lead';



    else if (gap <= -leadThreshold) state = 'Sent Deterioration';



    let sev = '';



    if (abs >= extremeThreshold) sev = ' · Extreme';



    else if (abs >= materialThreshold) sev = ' · Material';



    return `${prefix} ${state} ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}${sev}`;



  }







  function dailyHoverText(row){



    const lines = [];



    lines.push(`Price · O/H/L/C: ${fmt(row.open)} / ${fmt(row.high)} / ${fmt(row.low)} / ${fmt(row.close)}`);







    const score = scoreLine(row);



    const attn = fmtScore(row.attention_level_score);



    if (score && attn !== null) lines.push(`${score} · Attn ${attn}`);



    else if (score) lines.push(score);



    else if (attn !== null) lines.push(`Attn ${attn}`);







    const ribbon = ribbonLine(row);



    if (ribbon) lines.push(ribbon);







    const rsi = gapLabel('RSI', row.sentiment_rsi_d ?? row.sentiment_rsi, row.rsi_d ?? row.rsi, 8, 18, 30);



    if (rsi) lines.push(rsi);







    const stoch = gapLabel('Stoch', row.sentiment_stochastic_rsi_d, row.stochastic_rsi_d ?? row.stochastic_rsi, 12, 25, 45);



    if (stoch) lines.push(stoch);







    return lines.filter(Boolean).join('<br>');



  }







  function isVisualBandTrace(trace){



    if (!trace || trace.yaxis && trace.yaxis !== 'y') return false;



    const name = String(trace.name || '').toLowerCase();



    const isBandName = /(band|envelope|overlap|contextual)/i.test(name);



    if (!isBandName) return false;



    if (trace.fill === 'tonexty') return true;



    if (trace.type === 'scatter' && String(trace.mode || '').includes('lines')) return true;



    return false;



  }







  function silenceVisualBandHovers(data){



    if (!Array.isArray(data)) return;



    data.forEach(trace => {



      if (!isVisualBandTrace(trace)) return;



      trace.hoverinfo = 'skip';



      trace.hovertemplate = null;



      if (trace.fill === 'tonexty') trace.hoveron = 'points';



    });



  }







  function dailyHoverTrace(){



    const rows = activeRows();



    if (!rows.length) return null;







    const x = [];



    const y = [];



    const text = [];



    rows.forEach(row => {



      const d = row?.date;



      const hover = dailyHoverText(row);



      if (!d || !hover) return;



      rowYValues(row).forEach(yVal => {



        x.push(d);



        y.push(yVal);



        text.push(hover);



      });



    });







    if (!x.length) return null;



    return {



      type:'scatter',



      mode:'markers',



      x,



      y,



      text,



      name:TRACE_NAME,



      xaxis:'x',



      yaxis:'y',



      showlegend:false,



      hoverinfo:'text',



      hovertemplate:'<b>%{x|%b %d, %Y}</b><br>%{text}<extra></extra>',



      marker:{



        size:24,



        color:'rgba(255,255,255,0.01)',



        line:{width:0,color:'rgba(255,255,255,0)'}



      },



      opacity:0.01,



      cliponaxis:false,



      __dailySetaTooltipLayer:true



    };



  }







  function priceTraceIndex(data){



    if (!Array.isArray(data)) return -1;



    let idx = data.findIndex(t => t && t.type === 'candlestick' && (t.yaxis || 'y') === 'y');



    if (idx >= 0) return idx;



    idx = data.findIndex(t => t && String(t.name || '').toLowerCase() === 'price' && (t.yaxis || 'y') === 'y');



    if (idx >= 0) return idx;



    return data.findIndex(t => t && (t.yaxis || 'y') === 'y');



  }







  function installDailyHoverLayer(data, layout){



    if (!Array.isArray(data)) return;



    for (let i=data.length-1; i>=0; i--){



      if (data[i]?.__dailySetaTooltipLayer || data[i]?.name === TRACE_NAME) data.splice(i,1);



    }







    silenceVisualBandHovers(data);







    const trace = dailyHoverTrace();



    if (!trace) return;



    const idx = priceTraceIndex(data);



    if (idx >= 0) data.splice(idx + 1, 0, trace);



    else data.push(trace);







    if (layout && typeof layout === 'object'){



      layout.hovermode = 'closest';



      layout.hoverdistance = Math.max(40, Number(layout.hoverdistance || 0));



      layout.spikedistance = -1;



    }



  }







  function wrapPlotlyMethod(methodName){



    if (!window.Plotly || typeof window.Plotly[methodName] !== 'function') return false;



    const original = window.Plotly[methodName];



    if (original.__dailySetaTooltipWrapped) return true;



    const wrapped = function(gd, data, layout, config){



      try { installDailyHoverLayer(data, layout); }



      catch (err) { console.warn('Daily SETA tooltip layer skipped:', err); }



      return original.apply(this, arguments);



    };



    wrapped.__dailySetaTooltipWrapped = true;



    window.Plotly[methodName] = wrapped;



    return true;



  }







  function install(){



    const ok1 = wrapPlotlyMethod('newPlot');



    const ok2 = wrapPlotlyMethod('react');



    if (!ok1 && !ok2) setTimeout(install, 50);



  }







  install();



})();



// END phase_daily_seta_tooltip_layer_v1







// BEGIN phase_seta_glossary_help_v1



(function phase_seta_glossary_help_v1(){



  if (window.__phase_seta_glossary_help_v1) return;



  window.__phase_seta_glossary_help_v1 = true;







  const definitions = [



    {term:"SETA Score", aliases:["Summary Score"], definition:"Composite SETA read for the selected asset/date. It blends sentiment structure, attention, ribbon, and timing context into a 0-100 dashboard score."},



    {term:"Sentiment Repair", aliases:["Sent Repair"], definition:"Sentiment momentum is improving before price momentum has fully confirmed."},



    {term:"Sentiment Deterioration", aliases:["Sent Deterioration"], definition:"Sentiment momentum is weakening before price momentum has fully confirmed."},



    {term:"High-Quality Watch", aliases:["High Quality Watch"], definition:"A strong candidate setup is forming, but one or more confirmation gates are still incomplete."},



    {term:"Fresh Confirmed Event", aliases:["Fresh Confirmed"], definition:"A newly confirmed setup where the overlap, volume/context, and direction gates recently aligned."},



    {term:"Ribbon Expansion", aliases:["Bullish Expansion","Bearish Expansion"], definition:"The sentiment ribbon is widening or strengthening, suggesting clearer participation structure."},



    {term:"Compression / Transition", aliases:["Compression","Transition"], definition:"The sentiment ribbon is compressed or changing state, so direction may be less settled."},



    {term:"Attention Quiet", aliases:["Quiet Attention"], definition:"Engagement context is muted. The setup may need more validation from participation."},



    {term:"Attention Normal", aliases:["Normal Attention"], definition:"Engagement context is in a normal range."},



    {term:"Attention Elevated", aliases:["Elevated Attention"], definition:"Engagement context is stronger than usual and may help validate the setup."},



    {term:"Overlap State", aliases:["Overlap"], definition:"Where price sits relative to the combined price/sentiment expectation envelope."},



    {term:"Inside Expected Range", aliases:["Inside Range"], definition:"Price remains inside the current shared expectation corridor."},



    {term:"Bullish Pressure", aliases:[], definition:"Price/sentiment context is pressing toward bullish confirmation."},



    {term:"Bearish Pressure", aliases:[], definition:"Price/sentiment context is pressing toward bearish confirmation."},



    {term:"Context Stability", aliases:["Stability"], definition:"How stable the current overlap/ribbon context appears."},



    {term:"Model Contextual Overlap", aliases:["Contextual Overlap"], definition:"Uses the contextual overlap model as the primary envelope."},



    {term:"RSI Sent Lead", aliases:["RSI Aligned","RSI gap"], definition:"Compares sentiment RSI against price RSI to flag lead/lag behavior."},



    {term:"Stoch Sent Repair", aliases:["Stoch Sent Deterioration","Stoch gap"], definition:"Compares sentiment stochastic RSI against price stochastic timing to flag early repair or deterioration."},



    {term:"Alert Events", aliases:["SETA Event Timeline"], definition:"Visible-window confirmed/watch events. Use them as context, not standalone trade calls."},



    {term:"Watch", aliases:["Watch candidate"], definition:"A candidate setup is visible, but one or more confirmation gates are still incomplete."},



    {term:"Confirmed", aliases:["Confirmed event"], definition:"Required gates aligned for the setup context shown."},



    {term:"High Conflict", aliases:["Conflict"], definition:"Signals disagree across families, so confidence is lower."},



    {term:"Quiet / Monitor", aliases:["Quiet"], definition:"No strong actionable setup is visible; continue monitoring context."}



  ];







  window.SETA_GLOSSARY_HELP = definitions;







  const css = `



    .setaHelpTerm{



      cursor:help!important;



      text-decoration:underline dotted rgba(126,231,135,.42);



      text-underline-offset:3px;



    }



    .setaGlossaryBtn{



      display:inline-flex;



      align-items:center;



      gap:4px;



      margin-left:8px;



      padding:2px 8px;



      border:1px solid rgba(126,231,135,.42);



      border-radius:999px;



      background:rgba(126,231,135,.06);



      color:#c9fbd1;



      font-size:11px;



      font-weight:700;



      line-height:1.35;



      cursor:pointer;



      vertical-align:middle;



    }



    .setaGlossaryBtn:hover{background:rgba(126,231,135,.12);}



    .setaGlossaryPanel{



      display:none;



      margin:8px 0 10px;



      padding:10px 12px;



      border:1px solid rgba(126,231,135,.22);



      border-radius:12px;



      background:rgba(7,10,13,.92);



      box-shadow:0 10px 28px rgba(0,0,0,.28);



      color:#dfeaf0;



      font-size:12px;



      line-height:1.35;



    }



    .setaGlossaryPanel.open{



      display:grid;



      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));



      gap:8px 14px;



    }



    .setaGlossaryItem b{color:#c9fbd1;}



    .setaGlossaryItem span{color:#aebcc4;}



  `;







  function injectStyle(){



    if (document.getElementById("phase_seta_glossary_help_v1_style")) return;



    const style = document.createElement("style");



    style.id = "phase_seta_glossary_help_v1_style";



    style.textContent = css;



    document.head.appendChild(style);



  }







  function norm(s){ return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); }







  const sortedDefs = definitions.slice().sort((a,b) => b.term.length - a.term.length);







  function matchesForText(text){



    const t = norm(text);



    if (!t || t.length > 420) return [];



    const hits = [];



    for (const item of sortedDefs){



      const tokens = [item.term].concat(item.aliases || []);



      if (tokens.some(tok => t.includes(norm(tok)))){



        hits.push(item);



      }



      if (hits.length >= 3) break;



    }



    return hits;



  }







  function applyHelpToElement(el){



    if (!el || el.nodeType !== 1) return;



    if (el.closest && el.closest(".plotly, .modebar, .setaGlossaryPanel")) return;



    const text = (el.textContent || "").replace(/\s+/g, " ").trim();



    const hits = matchesForText(text);



    if (!hits.length) return;



    const tip = hits.map(h => `${h.term}: ${h.definition}`).join("\n");



    if (el.getAttribute("title") !== tip) el.setAttribute("title", tip);



    el.setAttribute("aria-label", tip);



    el.classList.add("setaHelpTerm");



    el.dataset.setaHelp = "1";



  }







  function applyHelpTerms(){



    injectStyle();



    const selector = [



      ".badge",



      ".modeBadge",



      ".marketTapeCard",



      ".marketTapeFamily",



      ".marketTapeDetailTitle",



      ".marketTapeDetailText",



      ".marketTapeMatched",



      ".marketTapeMissing",



      ".marketTapeRisk",



      ".alertEventPill",



      ".alertPanePill",



      ".alertEventBadge",



      ".alertEventSummary",



      ".alertEventMeta",



      "[class*='Pill']",



      "[class*='Badge']",



      "[class*='Tag']"



    ].join(",");



    document.querySelectorAll(selector).forEach(applyHelpToElement);



  }







  function glossaryItems(){



    const priority = [



      "SETA Score",



      "Sentiment Repair",



      "High-Quality Watch",



      "Fresh Confirmed Event",



      "Ribbon Expansion",



      "Compression / Transition",



      "Attention Quiet",



      "Overlap State",



      "High Conflict"



    ];



    return priority.map(term => definitions.find(d => d.term === term)).filter(Boolean);



  }







  function findMarketTapeContainer(){



    return document.querySelector(".marketTape, .screenerPanel") ||



      Array.from(document.querySelectorAll("div")).find(el => {



        const txt = (el.textContent || "").replace(/\s+/g, " ").trim();



        return txt.includes("SETA Market Tape") && txt.length < 900;



      });



  }







  function findMarketTapeTitle(root){



    if (!root) return null;



    return Array.from(root.querySelectorAll("h2,h3,h4,div,span")).find(el => {



      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();



      return txt.startsWith("SETA Market Tape") && txt.length < 120;



    });



  }







  function installGlossaryGuide(){



    injectStyle();



    const root = findMarketTapeContainer();



    if (!root || root.dataset.setaGlossaryGuideInstalled === "1") return;







    const panel = document.createElement("div");



    panel.className = "setaGlossaryPanel";



    panel.setAttribute("role", "region");



    panel.setAttribute("aria-label", "SETA glossary guide");



    panel.innerHTML = glossaryItems().map(item =>



      `<div class="setaGlossaryItem"><b>${escapeHtml(item.term)}</b><br><span>${escapeHtml(item.definition)}</span></div>`



    ).join("");







    const btn = document.createElement("button");



    btn.type = "button";



    btn.className = "setaGlossaryBtn";



    btn.textContent = "Guide ?";



    btn.title = "Open a compact glossary for SETA dashboard terms.";



    btn.addEventListener("click", (ev) => {



      ev.preventDefault();



      ev.stopPropagation();



      panel.classList.toggle("open");



    });







    const title = findMarketTapeTitle(root);



    if (title){



      title.appendChild(btn);



      if (title.parentNode) title.parentNode.insertBefore(panel, title.nextSibling);



      else root.insertBefore(panel, root.firstChild);



    } else {



      root.insertBefore(panel, root.firstChild);



      root.insertBefore(btn, panel);



    }







    root.dataset.setaGlossaryGuideInstalled = "1";



  }







  function escapeHtml(value){



    return String(value ?? "")



      .replace(/&/g, "&amp;")



      .replace(/</g, "&lt;")



      .replace(/>/g, "&gt;")



      .replace(/"/g, "&quot;")



      .replace(/'/g, "&#39;");



  }







  function run(){



    applyHelpTerms();



    installGlossaryGuide();



  }







  let pending = false;



  function scheduleRun(){



    if (pending) return;



    pending = true;



    window.setTimeout(() => {



      pending = false;



      run();



    }, 80);



  }







  if (document.readyState === "loading"){



    document.addEventListener("DOMContentLoaded", run);



  } else {



    run();



  }







  const observer = new MutationObserver(scheduleRun);



  function startObserver(){



    if (!document.body) return window.setTimeout(startObserver, 50);



    observer.observe(document.body, {childList:true, subtree:true});



    run();



    window.setTimeout(run, 250);



    window.setTimeout(run, 1000);



  }



  startObserver();



})();



// END phase_seta_glossary_help_v1







// BEGIN phase_market_tape_explanation_layout_v21



(function phase_market_tape_explanation_layout_v21(){



  if (window.__phase_market_tape_explanation_layout_v21) return;



  window.__phase_market_tape_explanation_layout_v21 = true;







  function cleanText(value){



    return String(value ?? '').replace(/\s+/g, ' ').trim();



  }







  function safeHTML(value){



    if (typeof escapeHTML === 'function') return escapeHTML(value);



    return String(value ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));



  }







  function firstText(obj, keys){



    for (const key of keys){



      const value = obj && obj[key];



      const text = cleanText(value);



      if (text && text.toLowerCase() !== 'nan' && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'none') return text;



    }



    return '';



  }







  function numberText(value, decimals=0){



    const n = Number(value);



    if (!Number.isFinite(n)) return '';



    return n.toFixed(decimals);



  }







  function directionOf(row){



    const raw = firstText(row, ['archetype_direction','signal_consensus_direction_label','latest_event_direction','latest_confirmed_event_direction']);



    const low = raw.toLowerCase();



    if (low.includes('bull') && !low.includes('bear')) return 'bullish';



    if (low.includes('bear')) return 'bearish';



    return 'mixed';



  }







  function selectedTerm(){



    const active = document.querySelector('.marketTapeCard.active .marketTapeTerm');



    if (active){



      const t = cleanText(active.textContent).split(/\s+/).pop();



      if (t) return t.toUpperCase();



    }



    const select = document.getElementById('asset');



    if (select && select.value) return String(select.value).trim().toUpperCase();



    const title = document.querySelector('.marketTapeTitle h3');



    const m = cleanText(title?.textContent).match(/Active\s+([A-Z0-9.\-]+)/i);



    return m ? m[1].toUpperCase() : '';



  }







  function storePack(term){



    const store = window.SCREENER_STORE;



    if (!store || !term) return null;



    if (store.by_term && store.by_term[term]) return store.by_term[term];



    const row = Array.isArray(store.records) ? store.records.find(r => cleanText(r.term || r.asset).toUpperCase() === term) : null;



    return row ? {screener: row, archetype: null, indicator_families: [], indicators: []} : null;



  }







  function familyMap(pack){



    const out = {};



    const fams = Array.isArray(pack?.indicator_families) ? pack.indicator_families : [];



    fams.forEach(f => {



      const name = cleanText(f.indicator_family).toLowerCase();



      if (name) out[name] = f;



    });



    return out;



  }







  function familyByIncludes(map, needles){



    for (const [name, fam] of Object.entries(map)){



      if (needles.some(n => name.includes(n))) return fam;



    }



    return null;



  }







  function indicatorByIncludes(pack, needles){



    const rows = Array.isArray(pack?.indicators) ? pack.indicators : [];



    return rows.find(r => {



      const hay = `${cleanText(r.indicator_name)} ${cleanText(r.indicator_family)} ${cleanText(r.direction_label)} ${cleanText(r.strength_label)} ${cleanText(r.interpretation)}`.toLowerCase();



      return needles.every(n => hay.includes(n));



    }) || null;



  }







  function labelFromFamily(fam){



    if (!fam) return '';



    const dir = firstText(fam, ['direction_label','strength_label','confidence_label']);



    const score = numberText(fam.score_0_100, 0);



    return score && dir ? `${dir} ${score}` : (dir || score);



  }







  function setupRead(term, row){



    const arch = firstText(row, ['primary_archetype','secondary_archetype','screener_action_bucket']);



    const direction = directionOf(row);



    const low = `${arch} ${firstText(row, ['screener_reason_summary','archetype_summary'])}`.toLowerCase();



    if (low.includes('sentiment repair')) return `${term} shows sentiment repair before price momentum has fully confirmed.`;



    if (low.includes('deterioration') || low.includes('negative divergence')) return `${term} shows sentiment deterioration leading price risk.`;



    if (low.includes('fresh') && direction === 'bullish') return `${term} shows fresh bullish pressure with follow-through still being tested.`;



    if (low.includes('fresh') && direction === 'bearish') return `${term} shows fresh bearish pressure with follow-through still being tested.`;



    if (low.includes('watch cluster')) return `${term} has clustered watch activity before full confirmation.`;



    if (low.includes('high-attention conflict') || low.includes('conflict')) return `${term} has active participation, but the signal deck remains conflicted.`;



    if (direction === 'bullish') return `${term} shows bullish pressure with confirmation context still developing.`;



    if (direction === 'bearish') return `${term} shows bearish pressure with confirmation context still developing.`;



    return `${term} shows a mixed SETA setup where confirmation quality matters more than direction alone.`;



  }







  function macdContext(row, pack, map){



    const fam = familyByIncludes(map, ['macd']);



    const label = firstText(row, ['macd_family_label','sent_price_macd_joint_slope_label']) || labelFromFamily(fam);



    const reason = firstText(row, ['reason_macd_improving']);



    if (label) return label;



    if (reason && reason !== '0') return 'Improving';



    return '';



  }







  function rsiContext(row, pack, map){



    const rsiFam = familyByIncludes(map, ['rsi']);



    const rsiRel = indicatorByIncludes(pack, ['rsi']) || null;



    return firstText(row, ['rsi_family_label']) || labelFromFamily(rsiFam) || firstText(rsiRel, ['direction_label','strength_label']);



  }







  function stochContext(row, pack){



    const stoch = indicatorByIncludes(pack, ['stoch']) || null;



    return firstText(stoch, ['direction_label','strength_label','interpretation']);



  }







  function ribbonContext(row, pack, map){



    const fam = familyByIncludes(map, ['sentiment ribbon','ribbon']);



    return firstText(row, ['sent_ribbon_label','latest_event_dashboard_summary_label','latest_confirmed_dashboard_summary_label']) || labelFromFamily(fam);



  }







  function attentionContext(row, pack, map){



    const fam = familyByIncludes(map, ['attention']);



    const score = numberText(row.attention_participation_score ?? row.attention_level_score ?? fam?.score_0_100, 0);



    const label = firstText(fam, ['direction_label','strength_label']);



    if (score && label) return `${score} · ${label}`;



    if (score) return score;



    return '';



  }







  function compactMatched(row, direction){



    const matchedBase = firstText(row, ['matched_conditions']);



    const low = `${firstText(row, ['primary_archetype','secondary_archetype','screener_action_bucket'])} ${matchedBase} ${firstText(row, ['screener_reason_summary','archetype_summary'])}`.toLowerCase();



    if (low.includes('sentiment repair')) return 'Sentiment repair is active while price confirmation is still developing.';



    if (low.includes('deterioration') || low.includes('negative divergence')) return 'Sentiment deterioration is leading while price confirmation is still developing.';



    if (low.includes('fresh') && direction === 'bullish') return 'Fresh bullish pressure is active; follow-through remains the confirmation test.';



    if (low.includes('fresh') && direction === 'bearish') return 'Fresh bearish pressure is active; follow-through remains the confirmation test.';



    if (low.includes('watch cluster')) return 'Clustered watch activity is active before full confirmation.';



    if (low.includes('conflict')) return 'Participation is active, but the signal deck remains conflicted.';



    return matchedBase || 'The setup has enough supporting context to remain on the active tape.';



  }







  function marketTapeNarrative(term, pack){



    const row = pack?.screener || pack?.archetype || {};



    const map = familyMap(pack);



    const direction = directionOf(row);



    const context = [];



    const macd = macdContext(row, pack, map);



    const rsi = rsiContext(row, pack, map);



    const stoch = stochContext(row, pack);



    const ribbon = ribbonContext(row, pack, map);



    const attention = attentionContext(row, pack, map);



    if (macd) context.push(['MACD', macd]);



    if (rsi) context.push(['RSI', rsi]);



    if (stoch) context.push(['Stoch', stoch]);



    if (ribbon) context.push(['Ribbon', ribbon]);



    if (attention) context.push(['Attention', attention]);







    let missing = firstText(row, ['missing_confirmations']);



    if (!missing){



      if (direction === 'bullish') missing = 'price confirmation and follow-through still need to validate the sentiment setup.';



      else if (direction === 'bearish') missing = 'price breakdown confirmation still needs to validate the sentiment setup.';



      else missing = 'directional confirmation is still mixed, so watch for cleaner alignment.';



    }







    let risk = firstText(row, ['archetype_risk_note']);



    if (!risk){



      if (direction === 'bullish') risk = 'Early repair pressure can fade unless price momentum follows.';



      else if (direction === 'bearish') risk = 'Early deterioration can fade unless price timing confirms.';



      else risk = 'Mixed signal decks are useful watch candidates, but less reliable until confirmation improves.';



    }







    return {



      summary: setupRead(term, row),



      matched: compactMatched(row, direction),



      context,



      missing,



      risk



    };



  }







  function getDetailBody(){



    const detail = document.querySelector('.screenerPanel.marketTape .marketTapeDetail');



    return detail ? detail.querySelector('.marketTapeDetailTop > div:first-child') || detail.querySelector('div') : null;



  }







  function findLine(body, label){



    const target = String(label || '').toLowerCase();



    return Array.from(body.children).find(el => cleanText(el.querySelector('b')?.textContent).toLowerCase().replace(':','') === target) || null;



  }







  function setLine(body, label, className, text){



    if (!text) return;



    let line = findLine(body, label);



    if (!line){



      line = document.createElement('div');



      const risk = findLine(body, 'Risk');



      if (label === 'Risk' || !risk) body.appendChild(line);



      else body.insertBefore(line, risk);



    }



    line.className = className;



    line.innerHTML = `<b>${safeHTML(label)}:</b> ${safeHTML(text)}`;



  }







  function setContextBlock(body, items){



    Array.from(body.querySelectorAll('.marketTapeContextV21')).forEach(el => el.remove());



    if (!items || !items.length) return;



    const block = document.createElement('div');



    block.className = 'marketTapeContextV21';



    const chips = items.map(([label, value]) => `<span><b>${safeHTML(label)}</b> ${safeHTML(value)}</span>`).join('');



    block.innerHTML = `<b>Context:</b><div class="marketTapeContextGridV21">${chips}</div>`;



    const missing = findLine(body, 'Missing');



    if (missing) body.insertBefore(block, missing);



    else body.appendChild(block);



  }







  function applyExplanationLayoutV21(){



    const panel = document.querySelector('.screenerPanel.marketTape');



    if (!panel || panel.classList.contains('collapsed')) return;



    const term = selectedTerm();



    const pack = storePack(term);



    if (!pack) return;



    const body = getDetailBody();



    if (!body) return;







    const narrative = marketTapeNarrative(term, pack);



    const summaryEl = body.querySelector('.marketTapeDetailText');



    if (summaryEl && narrative.summary) summaryEl.textContent = narrative.summary;



    setLine(body, 'Matched', 'marketTapeMissing marketTapeMatchedV21', narrative.matched);



    setContextBlock(body, narrative.context);



    setLine(body, 'Missing', 'marketTapeMissing', narrative.missing);



    setLine(body, 'Risk', 'marketTapeRisk', narrative.risk);



    panel.dataset.explanationLayoutV21 = '1';



  }







  function installStyle(){



    if (document.getElementById('phase_market_tape_explanation_layout_v21_style')) return;



    const style = document.createElement('style');



    style.id = 'phase_market_tape_explanation_layout_v21_style';



    style.textContent = `



/* phase_market_tape_explanation_layout_v21 */



.marketTapeMatchedV21{color:#cfe8da!important;}



.marketTapeContextV21{margin-top:4px;color:#bcd0dc!important;line-height:1.35;}



.marketTapeContextV21>b{color:#9dd6ff;}



.marketTapeContextGridV21{display:flex;flex-wrap:wrap;gap:3px 10px;margin-top:2px;}



.marketTapeContextGridV21 span{white-space:normal;}



.marketTapeContextGridV21 span b{color:#e7eef3;}



.screenerPanel.marketTape[data-explanation-layout-v21="1"] .marketTapeDetailText{color:#d8e6ed!important;}



`;



    document.head.appendChild(style);



  }







  installStyle();







  const oldRender = window.renderScreenerPanel;



  if (typeof oldRender === 'function' && !oldRender.__marketTapeExplanationLayoutV21Wrapped){



    const wrapped = function(){



      const out = oldRender.apply(this, arguments);



      setTimeout(applyExplanationLayoutV21, 0);



      setTimeout(applyExplanationLayoutV21, 80);



      setTimeout(applyExplanationLayoutV21, 220);



      return out;



    };



    wrapped.__marketTapeExplanationLayoutV21Wrapped = true;



    window.renderScreenerPanel = wrapped;



  }







  document.addEventListener('click', function(ev){



    if (ev.target && ev.target.closest && ev.target.closest('.marketTapeCard,.marketTapeTab')){



      setTimeout(applyExplanationLayoutV21, 60);



      setTimeout(applyExplanationLayoutV21, 180);



    }



  }, true);







  const obs = new MutationObserver(() => {



    if (document.querySelector('.screenerPanel.marketTape .marketTapeDetail')) setTimeout(applyExplanationLayoutV21, 0);



  });







  function start(){



    if (!document.body){ setTimeout(start, 50); return; }



    obs.observe(document.body, {childList:true, subtree:true});



    applyExplanationLayoutV21();



  }



  start();



})();



// END phase_market_tape_explanation_layout_v21







// BEGIN phase_market_tape_card_layout_polish_v1



(function phase_market_tape_card_layout_polish_v1(){



  if (window.__phase_market_tape_card_layout_polish_v1) return;



  window.__phase_market_tape_card_layout_polish_v1 = true;







  function injectMarketTapeCardLayoutPolish(){



    if (document.getElementById("phase_market_tape_card_layout_polish_v1_style")) return;



    const style = document.createElement("style");



    style.id = "phase_market_tape_card_layout_polish_v1_style";



    style.textContent = `



      /* Market Tape card layout polish v1: visual alignment only. */



      .marketTapeCards{



        align-items:stretch;



        gap:10px;



      }



      .marketTapeCards > *{



        min-width:0;



        box-sizing:border-box;



      }



      .marketTapeCards .marketTapeCard,



      .marketTapeCards [class*="marketTapeCard"]{



        min-width:0;



        overflow:hidden;



      }



      .marketTapeCards .marketTapeCardTop,



      .marketTapeCards .marketTapeCardHeader,



      .marketTapeCards .marketTapeRankRow,



      .marketTapeCards [class*="Top"],



      .marketTapeCards [class*="Header"]{



        min-width:0;



      }



      .marketTapeCards .marketTapeCardScore,



      .marketTapeCards .marketTapeScore,



      .marketTapeCards .priorityScore,



      .marketTapeCards [class*="Score"]{



        flex:0 0 auto;



        margin-left:auto;



        text-align:right;



        min-width:38px;



        white-space:nowrap;



      }



      .marketTapeCards .marketTapePill,



      .marketTapeCards .marketTapeTag,



      .marketTapeCards .marketTapeBadge,



      .marketTapeCards .pill,



      .marketTapeCards .badge,



      .marketTapeCards [class*="Pill"],



      .marketTapeCards [class*="Tag"],



      .marketTapeCards [class*="Badge"]{



        display:inline-flex;



        align-items:center;



        max-width:128px;



        min-height:16px;



        line-height:1.12;



        white-space:nowrap;



        overflow:hidden;



        text-overflow:ellipsis;



        vertical-align:middle;



        box-sizing:border-box;



      }



      .marketTapeCards .marketTapePillRow,



      .marketTapeCards .marketTapeTags,



      .marketTapeCards .marketTapeCardPills,



      .marketTapeCards .marketTapeCardMeta,



      .marketTapeCards [class*="PillRow"],



      .marketTapeCards [class*="Tags"],



      .marketTapeCards [class*="Meta"]{



        display:flex;



        flex-wrap:wrap;



        align-items:center;



        gap:3px 4px;



        min-height:18px;



        max-height:38px;



        overflow:hidden;



      }



      .marketTapeCards .marketTapeCardTitle,



      .marketTapeCards [class*="Title"]{



        min-width:0;



        overflow:hidden;



        display:-webkit-box;



        -webkit-line-clamp:2;



        -webkit-box-orient:vertical;



      }



      .marketTapeCards .marketTapeReason,



      .marketTapeCards .marketTapeCardReason,



      .marketTapeCards .marketTapeCardText,



      .marketTapeCards [class*="Reason"],



      .marketTapeCards [class*="Summary"]{



        min-width:0;



        overflow:hidden;



        display:-webkit-box;



        -webkit-line-clamp:2;



        -webkit-box-orient:vertical;



      }



      @media (max-width: 900px){



        .marketTapeCards .marketTapePill,



        .marketTapeCards .marketTapeTag,



        .marketTapeCards .marketTapeBadge,



        .marketTapeCards .pill,



        .marketTapeCards .badge,



        .marketTapeCards [class*="Pill"],



        .marketTapeCards [class*="Tag"],



        .marketTapeCards [class*="Badge"]{



          max-width:108px;



        }



      }



    `;



    document.head.appendChild(style);



  }







  if (document.readyState === "loading") {



    document.addEventListener("DOMContentLoaded", injectMarketTapeCardLayoutPolish, {once:true});



  } else {



    injectMarketTapeCardLayoutPolish();



  }



})();



// END phase_market_tape_card_layout_polish_v1







// BEGIN phase_market_tape_card_soft_alignment_v1



(function phase_market_tape_card_soft_alignment_v1(){



  if (window.__phase_market_tape_card_soft_alignment_v1) return;



  window.__phase_market_tape_card_soft_alignment_v1 = true;







  function installSoftCardAlignment(){



    if (document.getElementById("phase_market_tape_card_soft_alignment_v1_style")) return;



    const style = document.createElement("style");



    style.id = "phase_market_tape_card_soft_alignment_v1_style";



    style.textContent = `



      /* Market Tape ranked card soft alignment v1



         Goal: preserve readability while making cards share the same visual rhythm.



         This intentionally avoids the hard/small skeleton that compressed titles and reasons. */







      .marketTapeCards{



        align-items:stretch !important;



      }







      .marketTapeCard{



        position:relative !important;



        display:flex !important;



        flex-direction:column !important;



        justify-content:flex-start !important;



        gap:5px !important;



        min-height:104px !important;



        height:auto !important;



        max-height:none !important;



        overflow:hidden !important;



      }







      .marketTapeCard *,



      .marketTapeDetail *{



        min-width:0;



      }







      /* Row 1: rank/asset left, score right. */



      .marketTapeCardTop,



      .marketTapeCardHeader,



      .marketTapeRankRow,



      .marketTapeCard .marketTapeTopRow{



        display:flex !important;



        align-items:flex-start !important;



        justify-content:space-between !important;



        gap:8px !important;



        min-height:20px !important;



        line-height:1.1 !important;



      }







      .marketTapeCardScore,



      .marketTapeScore,



      .marketTapePriority,



      .marketTapeCard .score,



      .marketTapeCard [class*="Score"]{



        margin-left:auto !important;



        flex:0 0 auto !important;



        text-align:right !important;



        white-space:nowrap !important;



      }







      /* Row 2: badge/pill area. Keep a predictable home for unused space here. */



      .marketTapeCardPills,



      .marketTapePills,



      .marketTapeCardMeta,



      .marketTapeMeta,



      .marketTapeCard .pillRow,



      .marketTapeCard .metaRow{



        display:flex !important;



        flex-wrap:wrap !important;



        align-content:flex-start !important;



        align-items:center !important;



        gap:3px 4px !important;



        min-height:24px !important;



        max-height:36px !important;



        overflow:hidden !important;



      }







      .marketTapeCard .marketTapePill,



      .marketTapeCard .alertEventPill,



      .marketTapeCard .badge,



      .marketTapeCard [class*="Pill"],



      .marketTapeCard [class*="pill"]{



        max-width:132px !important;



        white-space:nowrap !important;



        overflow:hidden !important;



        text-overflow:ellipsis !important;



        flex:0 1 auto !important;



      }







      /* Story block: keep readable, do not force a tiny tile. */



      .marketTapeCardTitle,



      .marketTapeSetupTitle,



      .marketTapeCardName,



      .marketTapeCard .setupTitle{



        margin-top:1px !important;



        line-height:1.25 !important;



        max-height:2.55em !important;



        overflow:hidden !important;



      }







      .marketTapeCardReason,



      .marketTapeReason,



      .marketTapeCardSub,



      .marketTapeCardText,



      .marketTapeCard .reason,



      .marketTapeCard .summary{



        line-height:1.25 !important;



        max-height:2.65em !important;



        overflow:hidden !important;



      }







      /* Do not let selected-card styling inherit compact ranked-card behavior. */



      .marketTapeDetail,



      .marketTapeDetailTop{



        max-height:none !important;



      }







      @media (max-width: 900px){



        .marketTapeCard{



          min-height:112px !important;



        }



        .marketTapeCard .marketTapePill,



        .marketTapeCard .alertEventPill,



        .marketTapeCard .badge,



        .marketTapeCard [class*="Pill"],



        .marketTapeCard [class*="pill"]{



          max-width:118px !important;



        }



      }



    `;



    document.head.appendChild(style);



  }







  if (document.readyState === "loading") {



    document.addEventListener("DOMContentLoaded", installSoftCardAlignment, { once:true });



  } else {



    installSoftCardAlignment();



  }



})();



// END phase_market_tape_card_soft_alignment_v1







// phase_market_tape_direct_labels_v1: Market Tape selected-detail labels clarified at render time.







// BEGIN phase_market_tape_detail_final_cleanup_v1



(function phase_market_tape_detail_final_cleanup_v1(){



  if (window.__phase_market_tape_detail_final_cleanup_v1) return;



  window.__phase_market_tape_detail_final_cleanup_v1 = true;







  function detailBlocks(){



    return Array.from(document.querySelectorAll('.marketTapeDetail'));



  }







  function rowText(el){



    return String(el && el.textContent || '').replace(/\s+/g,' ').trim();



  }







  function startsWithLabel(el, label){



    return rowText(el).toLowerCase().startsWith(label.toLowerCase());



  }







  function relabelRow(el, oldLabel, newLabel){



    if (!el) return;



    const html = el.innerHTML || '';



    const rx = new RegExp('^\\s*(<b>)?'+oldLabel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(</b>)?\\s*', 'i');



    if (rx.test(html)) {



      el.innerHTML = html.replace(rx, '<b>'+newLabel+'</b> ');



      return;



    }



    const txt = rowText(el);



    if (txt.toLowerCase().startsWith(oldLabel.toLowerCase())) {



      const rest = txt.slice(oldLabel.length).trim();



      el.innerHTML = '<b>'+newLabel+'</b> ' + rest;



    }



  }







  function removeRedundantLead(detail){



    const evidenceRows = Array.from(detail.querySelectorAll('div')).filter(el =>



      startsWithLabel(el, 'Setup evidence:') || startsWithLabel(el, 'Matched:')



    );



    if (!evidenceRows.length) return;



    Array.from(detail.querySelectorAll('.marketTapeDetailText')).forEach(el => el.remove());



  }







  function cleanupDetail(detail){



    if (!detail || detail.dataset.setaFinalCleanupActive === '1') return;



    detail.dataset.setaFinalCleanupActive = '1';



    try{



      removeRedundantLead(detail);







      let rows = Array.from(detail.querySelectorAll('div'));



      const legacyMatched = rows.find(el => startsWithLabel(el, 'Matched:'));



      const legacyMissing = rows.find(el => startsWithLabel(el, 'Missing:'));







      // Prefer the richer legacy v2.1 rows when present. Remove earlier direct-label rows



      // that only repeated older matched/missing text.



      if (legacyMatched) {



        Array.from(detail.querySelectorAll('div')).forEach(el => {



          if (el !== legacyMatched && startsWithLabel(el, 'Setup evidence:')) el.remove();



        });



        relabelRow(legacyMatched, 'Matched:', 'Setup evidence:');



      }



      if (legacyMissing) {



        Array.from(detail.querySelectorAll('div')).forEach(el => {



          if (el !== legacyMissing && startsWithLabel(el, 'Watch item:')) el.remove();



        });



        relabelRow(legacyMissing, 'Missing:', 'Watch item:');



      }







      // If multiple identical evidence/watch/risk rows survive for any reason, keep the first.



      const seen = new Set();



      Array.from(detail.querySelectorAll('div')).forEach(el => {



        const txt = rowText(el);



        if (!txt) return;



        const isManaged = /^(Setup evidence:|Watch item:|Risk:)/i.test(txt);



        if (!isManaged) return;



        const key = txt.toLowerCase();



        if (seen.has(key)) el.remove();



        else seen.add(key);



      });







      // Inline stranded Context: label with the first context row when the label is alone.



      rows = Array.from(detail.querySelectorAll('div'));



      rows.forEach((el, idx) => {



        const txt = rowText(el);



        if (!/^Context:\s*$/i.test(txt)) return;



        const next = rows[idx+1];



        if (!next) return;



        const nextTxt = rowText(next);



        if (!nextTxt || /^(Setup evidence:|Watch item:|Risk:|Matched:|Missing:)/i.test(nextTxt)) return;



        el.classList.add('marketTapeContextLineInline');



        el.innerHTML = '<b>Context:</b> ' + next.innerHTML;



        next.remove();



      });







      // Normalize context label if already inline but plain text.



      Array.from(detail.querySelectorAll('div')).forEach(el => {



        const txt = rowText(el);



        if (/^Context:\s+/.test(txt) && !(el.innerHTML || '').match(/<b>\s*Context:\s*<\/b>/i)) {



          const rest = txt.replace(/^Context:\s*/i, '');



          el.classList.add('marketTapeContextLineInline');



          el.innerHTML = '<b>Context:</b> ' + rest;



        }



      });







    } finally {



      detail.dataset.setaFinalCleanupActive = '0';



    }



  }







  function runCleanup(){



    detailBlocks().forEach(cleanupDetail);



  }







  function installStyle(){



    if (document.getElementById('phase_market_tape_detail_final_cleanup_v1_style')) return;



    const style = document.createElement('style');



    style.id = 'phase_market_tape_detail_final_cleanup_v1_style';



    style.textContent = `



      .marketTapeDetail .marketTapeContextLineInline{



        color:#d7f7ff;



        line-height:1.35;



      }



      .marketTapeDetail .marketTapeContextLineInline b{



        color:#7bdcff;



      }



    `;



    document.head.appendChild(style);



  }







  installStyle();



  setTimeout(runCleanup, 0);



  setTimeout(runCleanup, 150);



  setTimeout(runCleanup, 600);







  const observer = new MutationObserver(() => {



    if (window.__setaFinalCleanupPending) return;



    window.__setaFinalCleanupPending = true;



    requestAnimationFrame(() => {



      window.__setaFinalCleanupPending = false;



      runCleanup();



    });



  });



  observer.observe(document.body, {childList:true, subtree:true});



})();



// END phase_market_tape_detail_final_cleanup_v1







// BEGIN phase_seta_score_history_tooltip_v1



(function phase_seta_score_history_tooltip_v1(){



  if (window.__phase_seta_score_history_tooltip_v1) return;



  window.__phase_seta_score_history_tooltip_v1 = true;







  function toNum(v){



    const n = Number(v);



    return Number.isFinite(n) ? n : null;



  }







  function fmtDelta(label, v){



    if(v === null || !Number.isFinite(v)) return label + " n/a";



    const sign = v > 0 ? "+" : "";



    return label + " " + sign + v.toFixed(1);



  }







  function fmtPctl(v){



    if(v === null || !Number.isFinite(v)) return "90d Pctl n/a";



    return "90d Pctl " + Math.round(v);



  }







  function percentileRank(values, current){



    const xs = values.filter(v => v !== null && Number.isFinite(v));



    if(!xs.length || current === null || !Number.isFinite(current)) return null;



    let less = 0;



    let equal = 0;



    xs.forEach(v => {



      if(v < current) less += 1;



      else if(v === current) equal += 1;



    });



    return ((less + 0.5 * equal) / xs.length) * 100;



  }







  function detectScoreIndex(trace){



    const tmpl = String(trace && trace.hovertemplate || "");



    let m = tmpl.match(/SETA\s*Score[^%]*%\{customdata\[(\d+)\]/i);



    if(m) return Number(m[1]);



    m = tmpl.match(/Summary\s*Score[^%]*%\{customdata\[(\d+)\]/i);



    if(m) return Number(m[1]);



    return 4;



  }







  function alreadyHasHistory(trace){



    const tmpl = String(trace && trace.hovertemplate || "");



    return tmpl.includes("SETA history:") || tmpl.includes("Score history:") || trace.__setaScoreHistoryTooltipPatched;



  }







  function patchDailyTooltipTrace(trace){



    if(!trace || !Array.isArray(trace.customdata)) return;



    const name = String(trace.name || "");



    const tmpl = String(trace.hovertemplate || "");



    const isDailyTooltip = /Daily\s+SETA\s+Tooltip/i.test(name) || /SETA\s+Score/i.test(tmpl);



    if(!isDailyTooltip) return;



    if(alreadyHasHistory(trace)) return;







    const scoreIdx = detectScoreIndex(trace);



    const baseLen = Math.max(0, ...trace.customdata.map(row => Array.isArray(row) ? row.length : 1));



    const scores = trace.customdata.map(row => Array.isArray(row) ? toNum(row[scoreIdx]) : null);







    trace.customdata = trace.customdata.map((row, i) => {



      const out = Array.isArray(row) ? row.slice() : [row];



      while(out.length < baseLen) out.push(null);



      const cur = scores[i];



      const d5 = (cur !== null && i >= 5 && scores[i-5] !== null) ? cur - scores[i-5] : null;



      const d20 = (cur !== null && i >= 20 && scores[i-20] !== null) ? cur - scores[i-20] : null;



      const lookback = scores.slice(Math.max(0, i-89), i+1);



      const pctl = percentileRank(lookback, cur);



      out.push(fmtDelta("5d", d5));



      out.push(fmtDelta("20d", d20));



      out.push(fmtPctl(pctl));



      return out;



    });







    const historyLine = `SETA history: %{customdata[${baseLen}]} · %{customdata[${baseLen+1}]} · %{customdata[${baseLen+2}]}<br>`;



    let nextTemplate = tmpl;







    if(/SETA\s*Score/i.test(nextTemplate)){



      nextTemplate = nextTemplate.replace(/(SETA\s*Score[^<]*(?:<br>|$))/i, `$1${historyLine}`);



    } else if(nextTemplate.includes("<extra></extra>")){



      nextTemplate = nextTemplate.replace("<extra></extra>", historyLine + "<extra></extra>");



    } else {



      nextTemplate = nextTemplate + "<br>" + historyLine + "<extra></extra>";



    }







    trace.hovertemplate = nextTemplate;



    trace.__setaScoreHistoryTooltipPatched = true;



  }







  function patchData(data){



    if(!Array.isArray(data)) return;



    data.forEach(patchDailyTooltipTrace);



  }







  function wrapPlotlyMethod(methodName){



    if(!window.Plotly || typeof window.Plotly[methodName] !== "function") return false;



    const original = window.Plotly[methodName];



    if(original.__setaScoreHistoryWrapped) return true;



    const wrapped = function(){



      try{ patchData(arguments[1]); }catch(err){ console.warn("SETA score history tooltip patch skipped:", err); }



      return original.apply(this, arguments);



    };



    wrapped.__setaScoreHistoryWrapped = true;



    window.Plotly[methodName] = wrapped;



    return true;



  }







  function install(){



    const ok1 = wrapPlotlyMethod("newPlot");



    const ok2 = wrapPlotlyMethod("react");



    return ok1 || ok2;



  }







  if(!install()){



    let tries = 0;



    const timer = setInterval(() => {



      tries += 1;



      if(install() || tries > 80) clearInterval(timer);



    }, 50);



  }



})();



// END phase_seta_score_history_tooltip_v1







// BEGIN phase_seta_score_history_tooltip_v11



(function phase_seta_score_history_tooltip_v11(){



  if (window.__phase_seta_score_history_tooltip_v11) return;



  window.__phase_seta_score_history_tooltip_v11 = true;







  function toNumber(v){



    const n = Number(v);



    return Number.isFinite(n) ? n : null;



  }







  function fmtSigned(v){



    if (v === null || v === undefined || !Number.isFinite(Number(v))) return "n/a";



    const n = Number(v);



    const sign = n > 0 ? "+" : "";



    return sign + n.toFixed(1);



  }







  function fmtPctl(v){



    if (v === null || v === undefined || !Number.isFinite(Number(v))) return "n/a";



    return Math.round(Number(v)).toString();



  }







  function percentileWindow(scores, i, windowSize){



    const cur = scores[i];



    if (cur === null || cur === undefined || !Number.isFinite(cur)) return null;



    const start = Math.max(0, i - windowSize + 1);



    const vals = [];



    for (let j = start; j <= i; j++){



      const v = scores[j];



      if (v !== null && v !== undefined && Number.isFinite(v)) vals.push(v);



    }



    if (vals.length < Math.min(20, windowSize)) return null;



    let le = 0;



    vals.forEach(v => { if (v <= cur) le += 1; });



    return (le / vals.length) * 100;



  }







  function inferScoreIndex(trace){



    const ht = String(trace && trace.hovertemplate || "");



    const scoreRef = ht.match(/SETA\s+Score[^%]*%\{customdata\[(\d+)\]/i);



    if (scoreRef) return Number(scoreRef[1]);







    const rows = Array.isArray(trace && trace.customdata) ? trace.customdata : [];



    if (!rows.length || !Array.isArray(rows[0])) return null;







    let bestIdx = null;



    let bestCount = -1;



    const width = Math.min(rows[0].length, 20);



    for (let idx = 0; idx < width; idx++){



      let count = 0;



      let plausible = 0;



      for (let i = 0; i < rows.length; i++){



        const n = toNumber(rows[i] && rows[i][idx]);



        if (n === null) continue;



        count += 1;



        if (n >= 0 && n <= 100) plausible += 1;



      }



      if (count >= 10 && plausible / count > 0.75 && plausible > bestCount){



        bestCount = plausible;



        bestIdx = idx;



      }



    }



    return bestIdx;



  }







  function patchDailySetaTrace(trace){



    if (!trace || !Array.isArray(trace.customdata) || !trace.customdata.length) return false;







    const ht = String(trace.hovertemplate || "");



    const name = String(trace.name || "");



    const looksLikeDailySeta =



      /Daily\s+SETA\s+Tooltip/i.test(name) ||



      (/SETA\s+Score/i.test(ht) && /Price\s*[·\/-]\s*O\/H\/L\/C/i.test(ht));







    if (!looksLikeDailySeta) return false;



    if (/SETA\s+history/i.test(ht)) return false;







    const rows = trace.customdata;



    if (!Array.isArray(rows[0])) return false;







    const scoreIdx = inferScoreIndex(trace);



    if (scoreIdx === null || scoreIdx === undefined || !Number.isFinite(scoreIdx)) return false;







    const scores = rows.map(row => toNumber(row && row[scoreIdx]));



    const historyIdx = rows[0].length;







    for (let i = 0; i < rows.length; i++){



      const s = scores[i];



      const d5 = (s !== null && i >= 5 && scores[i-5] !== null) ? s - scores[i-5] : null;



      const d20 = (s !== null && i >= 20 && scores[i-20] !== null) ? s - scores[i-20] : null;



      const p90 = percentileWindow(scores, i, 90);



      const line = "5d " + fmtSigned(d5) + " · 20d " + fmtSigned(d20) + " · 90d Pctl " + fmtPctl(p90);



      rows[i].push(line);



    }







    let newTemplate = ht;







    if (/SETA\s+Score[\s\S]*?<br>/i.test(newTemplate)){



      newTemplate = newTemplate.replace(



        /(SETA\s+Score[\s\S]*?<br>)/i,



        "$1SETA history: %{customdata[" + historyIdx + "]}<br>"



      );



    } else if (/<br>\s*Ribbon/i.test(newTemplate)){



      newTemplate = newTemplate.replace(



        /(<br>\s*Ribbon)/i,



        "<br>SETA history: %{customdata[" + historyIdx + "]}$1"



      );



    } else if (/<extra><\/extra>/i.test(newTemplate)){



      newTemplate = newTemplate.replace(



        /<extra><\/extra>/i,



        "SETA history: %{customdata[" + historyIdx + "]}<br><extra></extra>"



      );



    } else {



      newTemplate += "<br>SETA history: %{customdata[" + historyIdx + "]}<extra></extra>";



    }







    trace.customdata = rows;



    trace.hovertemplate = newTemplate;



    return true;



  }







  function patchData(data){



    if (!Array.isArray(data)) return false;



    let changed = false;



    data.forEach(trace => {



      try {



        if (patchDailySetaTrace(trace)) changed = true;



      } catch (err) {



        console.warn("SETA history tooltip trace patch failed:", err);



      }



    });



    return changed;



  }







  function patchExistingPlots(){



    if (!window.Plotly) return;



    document.querySelectorAll(".js-plotly-plot").forEach(gd => {



      if (!gd || !Array.isArray(gd.data)) return;



      const changed = patchData(gd.data);



      if (changed){



        try {



          if (window.Plotly.redraw) window.Plotly.redraw(gd);



        } catch (err) {



          console.warn("SETA history tooltip redraw failed:", err);



        }



      }



    });



  }







  function wrapPlotly(){



    if (!window.Plotly || window.Plotly.__setaScoreHistoryTooltipV11Wrapped) return;



    window.Plotly.__setaScoreHistoryTooltipV11Wrapped = true;







    ["newPlot", "react"].forEach(fnName => {



      const original = window.Plotly[fnName];



      if (typeof original !== "function") return;



      window.Plotly[fnName] = function(gd, data, layout, config){



        try { patchData(data); } catch (err) { console.warn("SETA history tooltip pre-render patch failed:", err); }



        const result = original.apply(this, arguments);



        try { setTimeout(patchExistingPlots, 0); } catch (err) {}



        return result;



      };



    });



  }







  function install(){



    wrapPlotly();



    patchExistingPlots();



  }







  install();



  document.addEventListener("DOMContentLoaded", install);



  window.addEventListener("load", install);







  let attempts = 0;



  const timer = setInterval(() => {



    attempts += 1;



    install();



    if (attempts >= 20) clearInterval(timer);



  }, 250);



})();



// END phase_seta_score_history_tooltip_v11



