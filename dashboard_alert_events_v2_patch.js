/*
  SETA Alert Events pane v2 presentation patch
  Presentation-only. Does not change alert logic, marker policy, payloads, or chart calculations.
*/
(function(){
  const PATCH_VERSION = "alert_events_v2_presentation_001";
  const CONTEXT_BASE_URL = "https://shaner1niner.github.io/sentiment-dash/seta_public_context_cards.html";
  const STYLE_ID = "seta-alert-events-v2-style";
  const ENHANCED_ATTR = "data-seta-alert-v2-enhanced";
  let pending = false;

  function addStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .seta-alert-v2-panel{--alert-v2-border:rgba(159,183,255,.22);--alert-v2-good:#9ee6c3;--alert-v2-watch:#ffe19a;--alert-v2-muted:#aab3d6;}
      .seta-alert-v2-kicker{margin:6px 0 10px;color:var(--alert-v2-muted);font-size:11px;line-height:1.42;}
      .seta-alert-v2-actions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 10px;}
      .seta-alert-v2-actions a,.seta-alert-v2-actions button{border:1px solid var(--alert-v2-border);background:rgba(159,183,255,.09);color:#eef2ff;border-radius:999px;padding:5px 8px;text-decoration:none;font-size:11px;font-weight:800;cursor:pointer;}
      .seta-alert-v2-actions a:hover,.seta-alert-v2-actions button:hover{background:rgba(159,183,255,.16);border-color:rgba(159,183,255,.42);}
      .seta-alert-v2-event{position:relative;}
      .seta-alert-v2-event.seta-alert-v2-confirmed{box-shadow:0 0 0 1px rgba(158,230,195,.12),0 0 22px rgba(54,201,126,.08);}
      .seta-alert-v2-event.seta-alert-v2-watch{box-shadow:0 0 0 1px rgba(255,225,154,.10),0 0 18px rgba(255,225,154,.05);}
      .seta-alert-v2-reason{margin:7px 0 5px;padding:7px 8px;border:1px solid rgba(159,183,255,.16);border-radius:10px;background:rgba(159,183,255,.06);color:#dbe5ff;font-size:11px;line-height:1.38;}
      .seta-alert-v2-reason b{color:#9fb7ff;letter-spacing:.04em;text-transform:uppercase;font-size:10px;display:block;margin-bottom:2px;}
      .seta-alert-v2-context-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;}
      .seta-alert-v2-context-chip{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:3px 6px;font-size:10px;font-weight:800;color:#cdd7ff;background:rgba(255,255,255,.045);}
      .seta-alert-v2-context-chip.good{color:var(--alert-v2-good);border-color:rgba(158,230,195,.24);background:rgba(158,230,195,.07);}
      .seta-alert-v2-context-chip.watch{color:var(--alert-v2-watch);border-color:rgba(255,225,154,.24);background:rgba(255,225,154,.07);}
      .seta-alert-v2-context-chip.risk{color:#ffb1b1;border-color:rgba(255,177,177,.22);background:rgba(255,177,177,.06);}
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

  function findAlertPanel(){
    const candidates = Array.from(document.querySelectorAll("aside,section,div"))
      .filter(function(el){
        const t = (el.textContent || "").trim();
        return t.includes("Alert Events") && t.includes("Confirmed") && t.includes("Watch") && t.length < 18000;
      })
      .sort(function(a,b){ return (a.textContent || "").length - (b.textContent || "").length; });
    return candidates[0] || null;
  }

  function replaceFirstText(root, from, to){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while((node = walker.nextNode())){
      if((node.nodeValue || "").includes(from)){
        node.nodeValue = node.nodeValue.replace(from, to);
        return true;
      }
    }
    return false;
  }

  function ensurePanelHeader(panel){
    if(panel.getAttribute(ENHANCED_ATTR) !== PATCH_VERSION){
      replaceFirstText(panel, "Alert Events", "SETA Event Timeline");
      panel.classList.add("seta-alert-v2-panel");
      panel.setAttribute(ENHANCED_ATTR, PATCH_VERSION);
    }

    if(!panel.querySelector(".seta-alert-v2-kicker")){
      const kicker = document.createElement("div");
      kicker.className = "seta-alert-v2-kicker";
      kicker.textContent = "Confirmed and watch-level context events for the selected asset and visible window. These events explain structure and participation; they are not trade signals.";
      panel.insertBefore(kicker, panel.children[1] || null);
    }

    let actions = panel.querySelector(".seta-alert-v2-actions");
    if(!actions){
      actions = document.createElement("div");
      actions.className = "seta-alert-v2-actions";
      panel.insertBefore(actions, panel.children[2] || null);
    }

    const asset = getAsset();
    actions.innerHTML =
      '<a href="' + contextUrl(asset) + '" target="_blank" rel="noopener">Open ' + asset + ' market context</a>' +
      '<button type="button" data-seta-alert-scroll>Back to chart</button>';

    const btn = actions.querySelector("[data-seta-alert-scroll]");
    if(btn && !btn.__setaBound){
      btn.__setaBound = true;
      btn.addEventListener("click", function(){
        const chart = document.getElementById("chart");
        if(chart) chart.scrollIntoView({behavior:"smooth", block:"center"});
      });
    }
  }

  function eventReason(text){
    const confirmed = /\bConfirmed\b/i.test(text) || /\bConfirmation:/i.test(text);
    const watch = /\bWatch\b/i.test(text) || /\bWatch candidate:/i.test(text);

    if(confirmed){
      if(/high volume/i.test(text)) return "Price moved outside the active overlap while structure and participation gates confirmed the event.";
      return "Structure moved outside the active overlap and met the confirmation policy for this pane.";
    }

    if(watch){
      if(/volume elevated/i.test(text)) return "Price moved outside the active overlap with elevated participation, but the event remains watch-level until full confirmation.";
      return "The move is visible in structure, but confirmation remains incomplete.";
    }

    return "This event surfaced because price, overlap, attention, or ribbon context changed inside the visible window.";
  }

  function eventChips(text){
    const chips = [];
    if(/\bConfirmed\b/i.test(text) || /\bConfirmation:/i.test(text)) chips.push(["Confirmed", "good"]);
    else if(/\bWatch\b/i.test(text) || /\bWatch candidate:/i.test(text)) chips.push(["Watch", "watch"]);
    if(/Bullish/i.test(text)) chips.push(["Bullish", "good"]);
    if(/Bearish/i.test(text)) chips.push(["Bearish", "risk"]);
    if(/outside active overlap|outside overlap/i.test(text)) chips.push(["Outside overlap", ""]);
    if(/volume elevated|High volume/i.test(text)) chips.push(["Participation elevated", ""]);
    if(/Ribbon:\s*([^\n]+)/i.test(text)) chips.push(["Ribbon context", ""]);
    return chips;
  }

  function likelyEventCards(panel){
    const nodes = Array.from(panel.querySelectorAll("div,li,article"));
    return nodes.filter(function(el){
      if(el.classList.contains("seta-alert-v2-reason") || el.classList.contains("seta-alert-v2-actions")) return false;

      const text = (el.textContent || "").trim();
      if(text.length < 80 || text.length > 1400) return false;

      const hasEventLanguage = /Quality\s+n\/a|Watch candidate:|Confirmation:|Source alert confirmation|material outside break/i.test(text);
      const hasDate = /20\d{2}-\d{2}-\d{2}/.test(text);

      const childIsEvent = Array.from(el.children || []).some(function(child){
        const childText = child.textContent || "";
        return childText.length >= 80 && childText.length < text.length && /Quality\s+n\/a|Watch candidate:|Confirmation:/i.test(childText);
      });

      return hasEventLanguage && hasDate && !childIsEvent;
    });
  }

  function enhanceEvents(panel){
    likelyEventCards(panel).forEach(function(card){
      const text = card.textContent || "";

      card.classList.add("seta-alert-v2-event");
      card.classList.toggle("seta-alert-v2-confirmed", /\bConfirmed\b/i.test(text) || /\bConfirmation:/i.test(text));
      card.classList.toggle("seta-alert-v2-watch", !(/\bConfirmed\b/i.test(text) || /\bConfirmation:/i.test(text)) && (/\bWatch\b/i.test(text) || /\bWatch candidate:/i.test(text)));

      if(!card.querySelector(".seta-alert-v2-reason")){
        const reason = document.createElement("div");
        reason.className = "seta-alert-v2-reason";
        reason.innerHTML = "<b>Why it surfaced</b>" + eventReason(text);
        card.insertBefore(reason, card.children[1] || null);
      }

      if(!card.querySelector(".seta-alert-v2-context-row")){
        const row = document.createElement("div");
        row.className = "seta-alert-v2-context-row";
        row.innerHTML = eventChips(text).map(function(pair){
          return '<span class="seta-alert-v2-context-chip ' + pair[1] + '">' + pair[0] + '</span>';
        }).join("");
        card.insertBefore(row, card.children[1] || null);
      }
    });
  }

  function apply(){
    addStyle();
    const panel = findAlertPanel();
    if(!panel) return;
    ensurePanelHeader(panel);
    enhanceEvents(panel);
  }

  function schedule(){
    if(pending) return;
    pending = true;
    window.requestAnimationFrame(function(){
      pending = false;
      try { apply(); } catch(err) { console.warn("SETA alert events v2 patch failed", err); }
    });
  }

  document.addEventListener("DOMContentLoaded", schedule);
  window.addEventListener("load", schedule);

  ["asset","range","freq","bollinger","engagement","regimeLayer"].forEach(function(id){
    document.addEventListener("change", function(evt){
      if(evt.target && evt.target.id === id) setTimeout(schedule, 200);
    });
  });

  const observer = new MutationObserver(function(){ schedule(); });
  observer.observe(document.documentElement, {childList:true, subtree:true});

  setInterval(schedule, 2500);
})();
