/*
  SETA Briefing Panel Card Jobs V2

  Presentation-only layer for reviewed briefing payloads.

  V2 keeps the reviewed JSON schema intact, but makes each card do a distinct
  reader job:
  - What SETA Sees: synthesized interpretation
  - Why It Matters: practical implication
  - Evidence: factual receipts
  - Participation Quality: participation + authorship breadth + read-through
*/
(function briefingPanelCardJobsV2(){
  if(window.__setaBriefingPanelCardJobsV2) return;
  window.__setaBriefingPanelCardJobsV2 = true;

  const OVERLAP_DEFINITION = 'Overlap is the shared zone where price bands and sentiment bands agree.';

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
      .briefingCardRole{display:inline-block;margin-bottom:5px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8fa4af;}
      .briefingTrustLead{font-weight:800;color:#edf7fb;}
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
    if(/\bInactive\b/i.test(combined) || /not currently outside/i.test(combined)){
      return 'Price is not currently outside the shared price/sentiment zone.';
    }
    if(/\b(Bullish|Bearish) Pressure Active\b/i.test(combined) || /price is outside the shared/i.test(combined)){
      return 'Price is outside the shared price/sentiment zone.';
    }
    if(/\bWatch\b/i.test(combined)){
      return 'SETA is watching whether price remains outside or returns toward the shared price/sentiment zone.';
    }
    return 'SETA compares price behavior against the shared price/sentiment zone.';
  }

  function fallbackWhatSetaSees(briefing, term){
    const primary = primaryReadFromBriefing(briefing, term);
    return `Primary read: ${primary}. ${outsideSharedZoneState(briefing)}`;
  }

  function fallbackWhyItMatters(briefing){
    const summary = text(briefing.summary);
    if(summary) return summary;
    return 'This read separates shared-zone state, structure, timing, and participation quality before assigning confidence.';
  }

  function evidenceItems(briefing){
    const raw = Array.isArray(briefing.evidence)
      ? briefing.evidence.map(v => text(v)).filter(Boolean)
      : [text(briefing.evidence)].filter(Boolean);

    return raw.slice(0,5).map(item => item
      .replace(/\bOverlap context is\b/gi, 'Shared zone:')
      .replace(/\bShared-zone state:\s*/gi, 'Shared zone: ')
    );
  }

  function trustCopy(briefing){
    const trust = text(briefing.trust_check);
    const cleanedTrust = trust
      .replace(/X and news inputs may be sample-limited; news breadth may reflect outlet repetition or syndication\.?/gi, '')
      .replace(/Source coverage, X sampling, news repetition, and stale upstream data can limit confidence\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if(cleanedTrust) return cleanedTrust;
    return 'Participation quality is unavailable for this reviewed payload.';
  }

  function splitLeadSentence(value){
    const copy = text(value);
    const match = copy.match(/^([^.!?]+[.!?])\s*(.*)$/);
    if(!match) return {lead: copy, rest: ''};
    return {lead: match[1], rest: match[2]};
  }

  function renderLayeredReviewedBriefingPanel(panel, briefing, term, freq, rangePreset){
    injectSemanticBriefingStyles();

    const whatCopy = text(briefing.what_seta_sees) || fallbackWhatSetaSees(briefing, term);
    const whyCopy = text(briefing.why_it_matters) || fallbackWhyItMatters(briefing);
    const trust = splitLeadSentence(trustCopy(briefing));
    const reviewDate = text(briefing.review_metadata?.reviewed_at_utc).slice(0,10);
    const meta = [freq === 'W' ? 'Weekly' : 'Daily', rangePreset, 'reviewed', 'educational context only'].filter(Boolean).map(htmlEscape).join(' &middot; ');
    const evidence = evidenceItems(briefing);
    const evidenceHtml = evidence.length
      ? `<ul class="briefingEvidenceList">${evidence.map(item => `<li>${htmlEscape(item)}</li>`).join('')}</ul>`
      : `<p>${htmlEscape('Reviewed evidence receipts are not available for this payload.')}</p>`;

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
          <span class="briefingCardRole">Interpretation</span>
          <p>${htmlEscape(whatCopy)}</p>
          <p class="briefingDefinition">${htmlEscape(OVERLAP_DEFINITION)}</p>
        </div>
        <div class="briefingCard briefingSemanticCard">
          <h3>Why It Matters</h3>
          <span class="briefingCardRole">Implication</span>
          <p>${htmlEscape(whyCopy)}</p>
        </div>
        <div class="briefingCard briefingSemanticCard">
          <h3>Evidence</h3>
          <span class="briefingCardRole">Receipts</span>
          ${evidenceHtml}
        </div>
        <div class="briefingCard briefingTrust briefingSemanticCard">
          <h3>Participation Quality</h3>
          <span class="briefingCardRole">Trust check</span>
          <p><span class="briefingTrustLead">${htmlEscape(trust.lead)}</span>${trust.rest ? ` ${htmlEscape(trust.rest)}` : ''}</p>
        </div>
      </div>`;
  }

  function install(){
    if(typeof window.renderReviewedBriefingPanel !== 'function') return false;
    const original = window.renderReviewedBriefingPanel;
    if(original.__cardJobsV2Wrapped) return true;
    window.renderReviewedBriefingPanel = function(panel, briefing, term, freq, rangePreset){
      try{
        return renderLayeredReviewedBriefingPanel(panel, briefing || {}, term, freq, rangePreset);
      }catch(err){
        console.warn('Briefing card jobs v2 patch fell back to original renderer:', err);
        return original.apply(this, arguments);
      }
    };
    window.renderReviewedBriefingPanel.__cardJobsV2Wrapped = true;
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
