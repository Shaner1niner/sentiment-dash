/*
 * SETA Evidence Card UI v1
 *
 * Small public-dashboard mount layer for the SETA_engine Evidence Handoff v1
 * payload. It renders only the primary attention_validation evidence card and
 * hides itself gracefully when the generated payload is not present yet.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SETAEvidenceCardUI = factory(root);
  }
})(typeof self !== "undefined" ? self : this, function (root) {
  const TARGET_SELECTOR = "[data-seta-evidence-card]";
  const SECTION_SELECTOR = "[data-seta-evidence-section]";
  const PRIMARY_ARCHETYPE = "attention_validation";
  const SAFETY_NOTE = "Historical diagnostic only; not a trade signal, recommendation, or price forecast.";
  const STYLE_ID = "seta-evidence-card-ui-v1-styles";

  const CARD_CSS = `
    [data-seta-evidence-section][hidden] { display: none !important; }
    .evidence-stage {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      border-top: 1px solid rgba(255,255,255,.14);
      padding-top: 24px;
      margin-top: 2px;
    }
    .evidence-stage .panel { min-height: 0; }
    .seta-evidence-card {
      display: grid;
      gap: 12px;
    }
    .seta-evidence-eyebrow {
      color: rgba(143, 179, 255, .94);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    .seta-evidence-title {
      margin: 0;
      font-size: clamp(1.22rem, 1.6vw, 1.55rem);
      letter-spacing: -.02em;
    }
    .seta-evidence-status {
      width: fit-content;
      border: 1px solid rgba(142, 232, 162, .34);
      border-radius: 999px;
      background: rgba(9, 22, 15, .46);
      color: #baf7cb;
      padding: 6px 10px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .seta-evidence-takeaway {
      margin: 0;
      color: rgba(226, 232, 236, .78);
      max-width: 900px;
    }
    .seta-evidence-facts {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px 18px;
      margin: 4px 0 0;
    }
    .seta-evidence-fact {
      display: grid;
      gap: 4px;
      align-content: start;
      min-width: 0;
    }
    .seta-evidence-facts dt {
      color: rgba(226, 232, 236, .54);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 11px;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    .seta-evidence-facts dd {
      margin: 0;
      color: rgba(244, 247, 249, .96);
      font-size: 1rem;
      font-weight: 800;
    }
    .seta-evidence-safety-note {
      margin: 2px 0 0;
      color: rgba(226, 232, 236, .62);
      font-size: .9rem;
      border-top: 1px solid rgba(255,255,255,.10);
      padding-top: 10px;
    }
    @media (max-width: 820px) {
      .seta-evidence-facts { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 520px) {
      .seta-evidence-facts { grid-template-columns: 1fr; }
    }
  `;

  function getDocument(options) {
    return (options && options.document) || (root && root.document) || (typeof document !== "undefined" ? document : null);
  }

  function injectEvidenceCardStyles(options = {}) {
    const documentRef = getDocument(options);
    if (!documentRef || documentRef.getElementById(STYLE_ID)) return null;
    const style = documentRef.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CARD_CSS;
    documentRef.head.appendChild(style);
    return style;
  }

  function resolveTarget(documentRef, target) {
    if (!documentRef) return null;
    if (typeof target === "string") return documentRef.querySelector(target);
    if (target) return target;
    return documentRef.querySelector(TARGET_SELECTOR);
  }

  function hideEvidenceSection(target) {
    if (!target || !target.closest) return;
    const section = target.closest(SECTION_SELECTOR);
    if (section) section.hidden = true;
  }

  function showEvidenceSection(target) {
    if (!target || !target.closest) return;
    const section = target.closest(SECTION_SELECTOR);
    if (section) section.hidden = false;
  }

  async function mountEvidenceCard(target, options = {}) {
    const documentRef = getDocument(options);
    const evidenceReader = options.reader || (root && root.SETAEvidenceHandoff);
    const element = resolveTarget(documentRef, target || options.target);

    if (!documentRef || !element || !evidenceReader || !evidenceReader.loadAndRenderEvidenceHandoff) {
      return null;
    }

    const payloadUrl = options.url || element.getAttribute("data-payload-url") || evidenceReader.DEFAULT_PAYLOAD_URL;

    try {
      injectEvidenceCardStyles({ document: documentRef });
      const rendered = await evidenceReader.loadAndRenderEvidenceHandoff(element, {
        url: payloadUrl,
        primaryArchetype: PRIMARY_ARCHETYPE,
        cache: options.cache || "no-store",
      });
      showEvidenceSection(element);
      return rendered;
    } catch (error) {
      element.textContent = "";
      hideEvidenceSection(element);
      if (options.debug && root && root.console && root.console.warn) {
        root.console.warn("SETA evidence card unavailable", error);
      }
      return null;
    }
  }

  function autoMountEvidenceCard(options = {}) {
    const documentRef = getDocument(options);
    if (!documentRef) return null;

    const run = () => mountEvidenceCard(null, options);
    if (documentRef.readyState === "loading") {
      documentRef.addEventListener("DOMContentLoaded", run, { once: true });
      return null;
    }
    return run();
  }

  return {
    TARGET_SELECTOR,
    SECTION_SELECTOR,
    PRIMARY_ARCHETYPE,
    SAFETY_NOTE,
    injectEvidenceCardStyles,
    mountEvidenceCard,
    autoMountEvidenceCard,
  };
});

if (typeof window !== "undefined" && window.SETAEvidenceCardUI) {
  window.SETAEvidenceCardUI.autoMountEvidenceCard();
}
