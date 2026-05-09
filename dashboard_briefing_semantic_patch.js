/*
  SETA Briefing Semantic Clarity Patch v1

  Presentation-only layer for reviewed briefing payloads. This patch keeps the
  reviewed JSON schema intact while making the public panel more explicit about
  SETA interpretation layers: primary read, shared-zone/overlap context,
  structure, timing, evidence, and trust.
*/
(function briefingSemanticClarityPatch(){
  if(window.__setaBriefingSemanticClarityPatchV1) return;
  window.__setaBriefingSemanticClarityPatchV1 = true;

  const OVERLAP_DEFINITION = 'Overlap is the shared zone where price bands and sentiment bands agree.';
  const TIMING_DEFINITION = 'Timing context means whether indicators confirm, weaken, or conflict with the setup.';

  function injectSemanticBriefingStyles(){
    if(document.getElementById('seta_briefing_semantic_patch_style')) return;
    if(!document.head) return;
    const style = document.createElement('style');
    style.id = 'seta_briefing_semantic_patch_style';
    style.textContent = `
      .briefingSemanticCard p + p{margin-top:7px;}
      .briefingLayerLabel{color:#b8c7cf;font-weight:800;}
      .briefingDefinition{font-size:11px!important;line-height:1.35!important;color:#9fb0ba!important;}
      .briefingEvidenceList{margin:0;padding-left:16px;color:#e1ebf1;font-size:12px;line-height:1.38;}
      .briefingEvidenceList li{margin:0 0 4px 0;}
      .briefingEvidenceList li:last-child{margin-bottom:0;}
    `;
    document.head.appendChild(style);
  }

  function htmlEscape(value){
    if(typeof window.escapeHTML === 'function') return window.escapeHTML(value);
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function text(value, fallback=''){
    return String(value ?? fallback ?? '').trim();
  }

  function sentence(value, fallback=''){
    const s = text(value, fallback);
    if(!s) return '';
    return /[.!?]$/.test(s) ? s : `${s}.`;
  }

  function titleCaseLabel(value){
    return text(value)
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, ch => ch.toUpperCase());
  }

  function primaryReadFromBriefing(briefing, term){
    const explicit = text(briefing.primary_read || briefing.primary_setup || briefing.primary_archetype);
    if(explicit) return explicit;
    const headline = text(briefing.headline);
    const match = headline.match(/briefing:\s*(.+)$/i);
    if(match && match[1]) return match[1].trim();
    const summary = text(briefing.summary);
    const setup = summary.match(/shows the\s+(.+?)\s+setup\b/i);
    if(setup && setup[1]) return titleCaseLabel(setup[1]);
    return term ? `${term} context` : 'SETA context';
  }

  function outsideSharedZoneState(briefing){
    const combined = [briefing.what_seta_sees, briefing.summary, ...(Array.isArray(briefing.evidence) ? briefing.evidence : [])].map(text).join(' ');
    if(/\bInactive\b/i.test(combined)){
      return 'Price is not currently outside the shared price/sentiment zone.';
    }
    if(/\b(Bullish|Bearish) Pressure Active\b/i.test(combined)){
      return 'Price is outside the shared price/sentiment zone, so SETA is treating the move as an outside-shared-zone condition.';
    }
    if(/\bWatch\b/i.test(combined)){
      return 'SETA is watching whether price remains outside or returns toward the shared price/sentiment zone.';
    }
    return 'SETA compares price behavior against the shared price/sentiment zone.';
  }

  function extractStructure(briefing){
    const haystack = [briefing.what_seta_sees, briefing.summary, ...(Array.isArray(briefing.evidence) ? briefing.evidence : [])].map(text).join(' ');
    const patterns = [
      /structure\s+(?:reads|is)\s+([^.;]+)/i,
      /with\s+([^.;]+?)\s+structure/i,
      /alongside\s+([^.;]+?)\s+sentiment/i
    ];
    for(const pattern of patterns){
      const m = haystack.match(pattern);
      if(m && m[1]) return sentence(titleCaseLabel(m[1].replace(/\s+sentiment$/i,'')));
    }
    return '';
  }

  function extractTiming(briefing){
    const haystack = [briefing.what_seta_sees, ...(Array.isArray(briefing.evidence) ? briefing.evidence : [])].map(text).join(' ');
    const patterns = [
      /timing context:\s*([^.;]+(?:;\s*[^.;]+)?)/i,
      /and\s+([^.;]+?)\s+timing context/i
    ];
    for(const pattern of patterns){
      const m = haystack.match(pattern);
      if(m && m[1]) return sentence(titleCaseLabel(m[1]));
    }
    return '';
  }

  function structureTimingSentence(briefing){
    const structure = extractStructure(briefing).replace(/[.]$/,'');
    const timing = extractTiming(briefing).replace(/[.]$/,'');
    if(structure && timing){
      return `Structure reads ${structure}, while timing context reads ${timing}.`;
    }
    if(structure) return `Structure reads ${structure}.`;
    if(timing) return `Timing context reads ${timing}.`;
    return '';
  }

  function evidenceItems(briefing){
    const raw = Array.isArray(briefing.evidence) ? briefing.evidence.map(v=>text(v)).filter(Boolean) : [text(briefing.evidence)].filter(Boolean);
    return raw.slice(0,5).map(item => item.replace(/\bOverlap context is\b/gi, 'Shared-zone state:'));
  }

  function trustCopy(briefing){
    const trust = text(briefing.trust_check);
    const limitations = text(briefing.limitations);
    const disclaimer = text(briefing.public_safe_disclaimer);
    const cleanedTrust = trust
      .replace(/X and news inputs may be sample-limited; news breadth may reflect outlet repetition or syndication\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    const parts = [cleanedTrust || 'Source breadth remains a trust layer, not proof of organic demand.'];
    if(limitations) parts.push(limitations.replace(/^This draft uses only structured SETA payload fields\.\s*/i, ''));
    if(disclaimer) parts.push(disclaimer);
    return parts.filter(Boolean).join(' ');
  }

  function renderLayeredReviewedBriefingPanel(panel, briefing, term, freq, rangePreset){
    injectSemanticBriefingStyles();
    const primary = primaryReadFromBriefing(briefing, term);
    const sharedZone = outsideSharedZoneState(briefing);
    const structureTiming = structureTimingSentence(briefing);
    const reviewDate = text(briefing.review_metadata?.reviewed_at_utc).slice(0,10);
    const meta = [freq === 'W' ? 'Weekly' : 'Daily', rangePreset, 'reviewed', 'educational context only'].filter(Boolean).map(htmlEscape).join(' &middot; ');
    const evidence = evidenceItems(briefing);
    const evidenceHtml = evidence.length
      ? `<ul class="briefingEvidenceList">${evidence.map(item => `<li>${htmlEscape(item)}</li>`).join('')}</ul>`
      : `<p>${htmlEscape(briefing.summary || 'Reviewed evidence summary is available.')}</p>`;

    panel.hidden = false;
    panel.innerHTML = `
      <div class="briefingHeader briefingSemanticHeader">
        <div>
          <div class="briefingTitle">${htmlEscape(briefing.headline || `SETA Briefing - ${term}`)}</div>
          <div class="briefingMeta">${meta}</div>
        </div>
        <div class="briefingMeta">Reviewed payload${reviewDate ? ` &middot; ${htmlEscape(reviewDate)}` : ''}</div>
      </div>
      <div class="briefingGrid briefingSemanticGrid">
        <div class="briefingCard briefingSemanticCard">
          <h3>What SETA Sees</h3>
          <p><span class="briefingLayerLabel">Primary read:</span> <strong>${htmlEscape(primary)}</strong>. ${htmlEscape(sharedZone)}</p>
          <p class="briefingDefinition">${htmlEscape(OVERLAP_DEFINITION)}</p>
        </div>
        <div class="briefingCard briefingSemanticCard">
          <h3>Why It Matters</h3>
          <p>${htmlEscape(structureTiming || briefing.why_it_matters || briefing.summary || 'Context is educational and should be read with the chart evidence.')}</p>
          <p class="briefingDefinition">${htmlEscape(TIMING_DEFINITION)}</p>
        </div>
        <div class="briefingCard briefingSemanticCard">
          <h3>Evidence</h3>
          ${evidenceHtml}
        </div>
        <div class="briefingCard briefingTrust briefingSemanticCard">
          <h3>Trust Check</h3>
          <p>${htmlEscape(trustCopy(briefing))}</p>
        </div>
      </div>`;
  }

  function install(){
    if(typeof window.renderReviewedBriefingPanel !== 'function') return false;
    const original = window.renderReviewedBriefingPanel;
    if(original.__semanticClarityWrapped) return true;
    window.renderReviewedBriefingPanel = function(panel, briefing, term, freq, rangePreset){
      try{
        return renderLayeredReviewedBriefingPanel(panel, briefing || {}, term, freq, rangePreset);
      }catch(err){
        console.warn('Briefing semantic clarity patch fell back to original renderer:', err);
        return original.apply(this, arguments);
      }
    };
    window.renderReviewedBriefingPanel.__semanticClarityWrapped = true;
    return true;
  }

  if(!install()){
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if(install() || attempts > 120) clearInterval(timer);
    }, 50);
  }
})();
