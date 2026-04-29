/*
  SETA Alert Events pane v2 presentation patch
  Presentation-only. Does not change alert logic, marker policy, payloads, or chart calculations.
*/
(function(){
  const CONTEXT_BASE_URL = "https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html";
  const STYLE_ID = "seta-alert-events-v2-style";

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .seta-alert-v2-panel{--alert-v2-border:rgba(159,183,255,.22);}
      .seta-alert-v2-actions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px;}
      .seta-alert-v2-actions a{border:1px solid var(--alert-v2-border);background:rgba(159,183,255,.09);color:#eef2ff;border-radius:999px;padding:5px 9px;text-decoration:none;font-size:11px;font-weight:800;cursor:pointer;pointer-events:auto;position:relative;z-index:5;}
      .seta-alert-v2-actions a:hover{background:rgba(159,183,255,.16);border-color:rgba(159,183,255,.42);}
      .seta-alert-v2-panel.seta-alert-v2-collapsed .seta-alert-v2-actions,
      body.seta-alert-v2-drawer-collapsed .seta-alert-v2-actions{display:none!important;}
    `;
    document.head.appendChild(style);
  }

  function getAsset(){
    const sel = document.getElementById("asset");
    const asset = sel && sel.value ? sel.value : new URLSearchParams(location.search).get("asset");
    return String(asset || "BTC").trim().toUpperCase();
  }

  function contextUrl(asset){
    const params = new URLSearchParams();
    params.set("asset", asset);
    params.set("compact", "1");
    try { params.set("dashboard", location.href); } catch(_err) {}
    return CONTEXT_BASE_URL + "?" + params.toString();
  }

  function findPanel(){
    const existing = document.querySelector(".seta-alert-v2-panel");
    if(existing) return existing;

    const candidates = Array.from(document.querySelectorAll("aside,section,div"))
      .filter(function(el){
        const t = (el.textContent || "").trim();
        const hasTitle = t.includes("Alert Events") || t.includes("SETA Event Timeline") || t.includes("SETA ALERT EVENTS");
        return hasTitle && t.includes("Confirmed") && t.includes("Watch") && t.length < 18000;
      })
      .sort(function(a,b){
        return (a.textContent || "").length - (b.textContent || "").length;
      });

    return candidates[0] || null;
  }

  function replaceText(root, from, to){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while((node = walker.nextNode())){
      if((node.nodeValue || "").includes(from)){
        node.nodeValue = node.nodeValue.replaceAll(from, to);
      }
    }
  }

  function formatAttentionScores(root){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while((node = walker.nextNode())){
      const value = node.nodeValue || "";
      const next = value.replace(/(Attention:\s*)(-?\d+\.\d{3,})/g, function(_match, label, numberText){
        const parsed = Number(numberText);
        if(!Number.isFinite(parsed)) return label + numberText;
        return label + parsed.toFixed(2);
      });
      if(next !== value) node.nodeValue = next;
    }
  }

  function ensureActions(panel, collapsed){
    let actions = panel.querySelector(".seta-alert-v2-actions");

    if(collapsed){
      if(actions) actions.style.display = "none";
      return;
    }

    if(!actions){
      actions = document.createElement("div");
      actions.className = "seta-alert-v2-actions";
      panel.insertBefore(actions, panel.children[1] || null);
    }

    const asset = getAsset();
    const href = contextUrl(asset);
    actions.style.display = "";
    actions.innerHTML = '<a class="seta-alert-v2-context-link" href="' + href + '" target="_blank" rel="noopener" data-href="' + href + '">Open ' + asset + ' market context</a>';
  }

  function polishPanel(){
    addStyle();

    const panel = findPanel();
    if(!panel) return;

    panel.classList.add("seta-alert-v2-panel");

    const rect = panel.getBoundingClientRect();
    const collapsed = rect.width > 0 && rect.width < 140;

    panel.classList.toggle("seta-alert-v2-collapsed", collapsed);
    document.body.classList.toggle("seta-alert-v2-drawer-collapsed", collapsed);

    if(!collapsed){
      replaceText(panel, "Alert Events", "SETA Event Timeline");
      replaceText(panel, "ALERT EVENTS", "EVENT TIMELINE");
    }

    replaceText(panel, "Quality n/a · Watch · Close", "Watch context · Close");
    replaceText(panel, "Quality n/a · Confirmed · Close", "Confirmed event · Close");
    replaceText(panel, "Quality n/a ·", "");
    replaceText(panel, "Quality n/a", "");
    formatAttentionScores(panel);

    Array.from(panel.querySelectorAll("button,a")).forEach(function(el){
      const t = (el.textContent || "").trim().toLowerCase();
      if(t.includes("back to chart")){
        el.remove();
      }
    });

    ensureActions(panel, collapsed);
  }

  document.addEventListener("click", function(evt){
    const link = evt.target && evt.target.closest ? evt.target.closest(".seta-alert-v2-context-link") : null;
    if(!link) return;

    const href = link.getAttribute("data-href") || link.href;
    if(!href) return;

    evt.preventDefault();
    evt.stopPropagation();

    const opened = window.open(href, "_blank", "noopener");
    if(!opened){
      window.location.href = href;
    }
  }, true);

  document.addEventListener("DOMContentLoaded", polishPanel);
  window.addEventListener("load", polishPanel);

  document.addEventListener("change", function(evt){
    if(evt.target && ["asset","range","freq","bollinger","engagement","regimeLayer"].includes(evt.target.id)){
      setTimeout(polishPanel, 200);
    }
  });

  const observer = new MutationObserver(function(){
    window.requestAnimationFrame(polishPanel);
  });

  observer.observe(document.documentElement, {childList:true, subtree:true});
  setInterval(polishPanel, 1500);
})();
