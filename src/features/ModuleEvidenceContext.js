/*
 * SETA Module Evidence Context v1
 *
 * Adds a compact historical evidence context surface to the module dashboard.
 * Uses the existing Evidence Handoff reader/UI and renders only the
 * attention_validation primary archetype through the shared safety guardrails.
 */
(function () {
  const SECTION_ID = "module-evidence-context";
  const PAYLOAD_URL = "seta_bundles/latest/evidence/dashboard_evidence_payload.json";
  const STATUS_URL = "seta_bundles/latest/evidence/evidence_refresh_status.json";

  function hasEvidenceContext() {
    return Boolean(document.getElementById(SECTION_ID));
  }

  function createEvidenceContextSection() {
    const section = document.createElement("section");
    section.id = SECTION_ID;
    section.className = "moduleEvidenceContextPanel evidence-stage";
    section.setAttribute("aria-label", "Historical SETA evidence context");
    section.setAttribute("data-seta-evidence-section", "");
    section.hidden = true;

    section.innerHTML = `
      <div class="moduleEvidenceContextCard">
        <div class="moduleEvidenceContextHeader">
          <div>
            <span class="moduleEvidenceContextKicker">Historical Evidence Context</span>
            <p class="moduleEvidenceContextIntro">
              Context for interpreting attention validation near the dashboard briefing. Diagnostic only; not a prediction, trade signal, recommendation, or price forecast.
            </p>
          </div>
          <span class="moduleEvidenceContextPill">Attention validation</span>
        </div>
        <div
          id="module-evidence-card-root"
          data-seta-evidence-card
          data-payload-url="${PAYLOAD_URL}"
          data-status-url="${STATUS_URL}"
        ></div>
      </div>
    `;

    return section;
  }

  function injectStyles() {
    if (document.getElementById("module-evidence-context-v1-styles")) return;

    const style = document.createElement("style");
    style.id = "module-evidence-context-v1-styles";
    style.textContent = `
      .moduleEvidenceContextPanel {
        margin: 12px 0 14px;
      }
      .moduleEvidenceContextCard {
        border: 1px solid rgba(125, 211, 252, .22);
        border-radius: 14px;
        background: rgba(13, 17, 23, .84);
        padding: 14px;
      }
      .moduleEvidenceContextHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 6px;
      }
      .moduleEvidenceContextKicker {
        color: #7dd3fc;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .moduleEvidenceContextPill {
        border: 1px solid rgba(126, 231, 135, .4);
        border-radius: 999px;
        padding: 4px 8px;
        color: #7ee787;
        font-size: 11px;
        white-space: nowrap;
      }
      .moduleEvidenceContextIntro {
        margin: 4px 0 0;
        color: #c9d1d9;
        font-size: 12px;
        line-height: 1.45;
        max-width: 840px;
      }
    `;
    document.head.appendChild(style);
  }

  function mountEvidenceContext() {
    if (hasEvidenceContext()) return;

    const anchor =
      document.getElementById("module-chart-guide") ||
      document.getElementById("chart");

    if (!anchor || !anchor.parentNode) return;

    injectStyles();

    const section = createEvidenceContextSection();
    anchor.parentNode.insertBefore(section, anchor);

    if (window.SETAEvidenceCardUI && typeof window.SETAEvidenceCardUI.mountEvidenceCard === "function") {
      window.SETAEvidenceCardUI.mountEvidenceCard(
        section.querySelector("[data-seta-evidence-card]"),
        { cache: "no-store" }
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountEvidenceContext, { once: true });
  } else {
    mountEvidenceContext();
  }

  window.SETAModuleEvidenceContext = {
    SECTION_ID,
    PAYLOAD_URL,
    STATUS_URL,
    mountEvidenceContext,
  };
})();
