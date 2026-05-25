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
            <span class="moduleEvidenceContextKicker">Historical Context</span>
            <h2>Evidence Context</h2>
          </div>
          <span class="moduleEvidenceContextPill">Attention validation</span>
        </div>
        <p class="moduleEvidenceContextIntro">
          Historical evidence context for interpreting attention and validation near the dashboard briefing. This is diagnostic context only, not a prediction or trade instruction.
        </p>
        <div
          id="module-evidence-card-root"
          data-seta-evidence-card
          data-payload-url="${PAYLOAD_URL}"
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
        margin-bottom: 10px;
      }
      .moduleEvidenceContextKicker {
        color: #7dd3fc;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .08em;
      }
      .moduleEvidenceContextHeader h2 {
        margin: 4px 0 0;
        color: #f0f6fc;
        font-size: 16px;
        line-height: 1.25;
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
        margin: 0 0 12px;
        color: #c9d1d9;
        font-size: 12px;
        line-height: 1.45;
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
    mountEvidenceContext,
  };
})();
