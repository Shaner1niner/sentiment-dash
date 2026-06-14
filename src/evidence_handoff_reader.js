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
  const DEFAULT_STATUS_URL = "seta_bundles/latest/evidence/evidence_refresh_status.json";
  const REQUIRED_SAFETY_NOTE = "Historical diagnostic only; not a trade signal, recommendation, or price forecast.";
  const ARCHIVAL_DISCLOSURE = "Historical / archived validation sample";
  const CURRENT_TENSE_PHRASES = [
    "currently shows",
    "currently classifies",
    "current evidence report",
    "current historical evidence report",
    "current MVP evidence definition",
  ];

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
    if (!payload.generated_at_utc && !payload.generated_at && !payload.as_of && !payload.as_of_utc) {
      errors.push("payload must include generated_at_utc/as_of metadata");
    }
    if (payload.evidence_mode === "archival" && !String(payload.archive_notice || "").includes(ARCHIVAL_DISCLOSURE)) {
      errors.push("archival payload must include explicit archive_notice disclosure");
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
      } else if (!primaryCard.metrics.date_range) {
        errors.push("primary card missing sample window date_range");
      }
      const takeaway = String(primaryCard.public_takeaway || "");
      const loweredTakeaway = takeaway.toLowerCase();
      CURRENT_TENSE_PHRASES.forEach((phrase) => {
        if (loweredTakeaway.includes(phrase.toLowerCase())) {
          errors.push(`primary card public_takeaway uses current-tense stale-risk phrase: ${phrase}`);
        }
      });
      if (payload.evidence_mode === "archival" && !takeaway.includes(ARCHIVAL_DISCLOSURE)) {
        errors.push("archival primary card public_takeaway missing historical/archive disclosure");
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

  async function loadEvidenceRefreshStatus(url = DEFAULT_STATUS_URL, options = {}) {
    const fetchImpl = options.fetchImpl || fetch;
    const response = await fetchImpl(url, { cache: options.cache || "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load evidence refresh status: ${response.status} ${response.statusText}`);
    }
    return response.json();
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

  function appendMetricFact(documentRef, facts, label, value) {
    if (value === undefined || value === null || value === "") return null;

    const item = documentRef.createElement("div");
    item.className = "seta-evidence-fact";
    appendTextElement(documentRef, item, "dt", "", label);
    appendTextElement(documentRef, item, "dd", "", String(value));
    facts.appendChild(item);
    return item;
  }

  function evidenceTimestamp(payload, status) {
    return payload.generated_at_utc ||
      payload.generated_at ||
      payload.as_of_utc ||
      payload.as_of ||
      (status && status.payload && status.payload.generated_or_as_of_utc) ||
      (status && status.generated_at_utc) ||
      (status && status.payload && status.payload.last_modified_utc) ||
      "";
  }

  function evidenceAsOf(payload, status) {
    return payload.as_of ||
      payload.as_of_utc ||
      (status && status.payload && status.payload.sample_window) ||
      "";
  }

  function evidenceEyebrow(payload) {
    if (payload.evidence_mode === "archival" || String(payload.archive_notice || "").includes(ARCHIVAL_DISCLOSURE)) {
      return ARCHIVAL_DISCLOSURE;
    }
    return "Historical evidence context";
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
    const status = options.status || null;
    clearElement(element);
    element.classList.add("seta-evidence-card");

    appendTextElement(documentRef, element, "div", "seta-evidence-eyebrow", evidenceEyebrow(payload));
    appendTextElement(documentRef, element, "h3", "seta-evidence-title", primaryCard.title || "Evidence");
    appendTextElement(documentRef, element, "div", "seta-evidence-status", String(primaryCard.status || "unknown"));
    appendTextElement(documentRef, element, "p", "seta-evidence-takeaway", primaryCard.public_takeaway || "");

    const facts = documentRef.createElement("dl");
    facts.className = "seta-evidence-facts";
    const rows = [
      ["Events", metrics.events],
      ["Unique terms", metrics.unique_terms],
      ["Sample window", metrics.date_range],
      ["Generated", evidenceTimestamp(payload, status)],
      ["As of", evidenceAsOf(payload, status)],
      ["7d mean edge", metrics.edge_7d_mean],
      ["7d win rate", metrics.forward_7d_win_rate],
      ["7d baseline", metrics.baseline_7d_win_rate],
    ];
    rows.forEach(([label, value]) => appendMetricFact(documentRef, facts, label, value));
    element.appendChild(facts);

    const safetyNote = payload.safety_note || REQUIRED_SAFETY_NOTE;
    appendTextElement(documentRef, element, "p", "seta-evidence-safety-note", safetyNote);
    return element;
  }

  async function loadAndRenderEvidenceHandoff(target, options = {}) {
    const payload = await loadEvidenceHandoffPayload(options.url || DEFAULT_PAYLOAD_URL, options);
    let status = options.status || null;
    const statusUrl = options.statusUrl || options.statusURL;
    if (!status && statusUrl) {
      try {
        status = await loadEvidenceRefreshStatus(statusUrl, options);
      } catch (error) {
        if (options.debug && typeof console !== "undefined" && console.warn) {
          console.warn("SETA evidence refresh status unavailable", error);
        }
      }
    }
    return renderEvidenceHandoffCard(payload, target, { ...options, status });
  }

  return {
    DEFAULT_PAYLOAD_URL,
    DEFAULT_STATUS_URL,
    REQUIRED_SAFETY_NOTE,
    ARCHIVAL_DISCLOSURE,
    validateEvidenceHandoffPayload,
    findPrimaryEvidenceCard,
    loadEvidenceHandoffPayload,
    loadEvidenceRefreshStatus,
    appendMetricFact,
    renderEvidenceHandoffCard,
    loadAndRenderEvidenceHandoff,
  };
});
