/*
 * SETA Evidence Handoff Reader v1
 *
 * Small browser-safe helper for loading and rendering the public-safe
 * SETA_engine Evidence Handoff v1 dashboard payload.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SETAEvidenceHandoff = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const DEFAULT_PAYLOAD_URL = "seta_bundles/latest/evidence/dashboard_evidence_payload.json";
  const REQUIRED_SAFETY_NOTE = "Historical diagnostic only; not a trade signal, recommendation, or price forecast.";

  function validateEvidenceHandoffPayload(payload, expectedPrimary = "attention_validation") {
    const errors = [];
    if (!payload || typeof payload !== "object") {
      return ["payload must be an object"];
    }
    if (payload.schema_version !== "seta_evidence_handoff_v1") {
      errors.push("schema_version must equal seta_evidence_handoff_v1");
    }
    if (payload.primary_archetype !== expectedPrimary) {
      errors.push(`primary_archetype must equal ${expectedPrimary}`);
    }
    if (!Array.isArray(payload.cards) || payload.cards.length === 0) {
      errors.push("cards must be a non-empty array");
    }
    if (!String(payload.safety_note || "").includes("not a trade signal")) {
      errors.push("safety_note must include trade-signal guardrail");
    }
    const primaryCard = findPrimaryEvidenceCard(payload, expectedPrimary);
    if (!primaryCard) {
      errors.push(`missing primary card: ${expectedPrimary}`);
    } else {
      if (!primaryCard.title) errors.push("primary card missing title");
      if (!primaryCard.status) errors.push("primary card missing status");
      if (!primaryCard.public_takeaway) errors.push("primary card missing public_takeaway");
      if (!primaryCard.metrics || typeof primaryCard.metrics !== "object") {
        errors.push("primary card missing metrics object");
      }
    }
    return errors;
  }

  function findPrimaryEvidenceCard(payload, expectedPrimary) {
    const archetype = expectedPrimary || (payload && payload.primary_archetype) || "attention_validation";
    if (!payload || !Array.isArray(payload.cards)) return null;
    return payload.cards.find((card) => card && card.archetype === archetype) || null;
  }

  async function loadEvidenceHandoffPayload(url = DEFAULT_PAYLOAD_URL, options = {}) {
    const fetchImpl = options.fetchImpl || fetch;
    const response = await fetchImpl(url, { cache: options.cache || "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load evidence handoff payload: ${response.status} ${response.statusText}`);
    }
    const payload = await response.json();
    const errors = validateEvidenceHandoffPayload(payload, options.primaryArchetype || "attention_validation");
    if (errors.length) {
      throw new Error(`Invalid evidence handoff payload: ${errors.join("; ")}`);
    }
    return payload;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function appendTextElement(documentRef, parent, tagName, className, text) {
    const node = documentRef.createElement(tagName);
    if (className) node.className = className;
    node.textContent = text;
    parent.appendChild(node);
    return node;
  }

  function renderEvidenceHandoffCard(payload, target, options = {}) {
    const documentRef = options.document || document;
    const element = typeof target === "string" ? documentRef.querySelector(target) : target;
    if (!element) {
      throw new Error("Evidence handoff target element not found");
    }

    const primaryCard = findPrimaryEvidenceCard(payload, options.primaryArchetype || payload.primary_archetype);
    if (!primaryCard) {
      throw new Error("Primary evidence handoff card not found");
    }

    const metrics = primaryCard.metrics || {};
    clearElement(element);
    element.classList.add("seta-evidence-card");

    appendTextElement(documentRef, element, "div", "seta-evidence-eyebrow", "Historical evidence context");
    appendTextElement(documentRef, element, "h3", "seta-evidence-title", primaryCard.title || "Evidence");
    appendTextElement(documentRef, element, "div", "seta-evidence-status", String(primaryCard.status || "unknown"));
    appendTextElement(documentRef, element, "p", "seta-evidence-takeaway", primaryCard.public_takeaway || "");

    const facts = documentRef.createElement("dl");
    facts.className = "seta-evidence-facts";
    const rows = [
      ["Events", metrics.events],
      ["Unique terms", metrics.unique_terms],
      ["Date range", metrics.date_range],
      ["7d mean edge", metrics.edge_7d_mean],
      ["7d win rate", metrics.forward_7d_win_rate],
      ["7d baseline", metrics.baseline_7d_win_rate],
    ];
    rows.forEach(([label, value]) => {
      if (value === undefined || value === null || value === "") return;
      appendTextElement(documentRef, facts, "dt", "", label);
      appendTextElement(documentRef, facts, "dd", "", String(value));
    });
    element.appendChild(facts);

    const safetyNote = payload.safety_note || REQUIRED_SAFETY_NOTE;
    appendTextElement(documentRef, element, "p", "seta-evidence-safety-note", safetyNote);
    return element;
  }

  async function loadAndRenderEvidenceHandoff(target, options = {}) {
    const payload = await loadEvidenceHandoffPayload(options.url || DEFAULT_PAYLOAD_URL, options);
    return renderEvidenceHandoffCard(payload, target, options);
  }

  return {
    DEFAULT_PAYLOAD_URL,
    REQUIRED_SAFETY_NOTE,
    validateEvidenceHandoffPayload,
    findPrimaryEvidenceCard,
    loadEvidenceHandoffPayload,
    renderEvidenceHandoffCard,
    loadAndRenderEvidenceHandoff,
  };
});
