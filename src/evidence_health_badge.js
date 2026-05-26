(function () {
  const TARGET_SELECTOR = "[data-seta-evidence-health-badge]";
  const DEFAULT_STATUS_URL = "seta_bundles/latest/evidence/evidence_refresh_status.json";

  function titleCase(value) {
    if (!value) return "";
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function isHealthy(status) {
    return Boolean(
      status &&
      status.status === "pass" &&
      status.payload &&
      status.payload.valid === true &&
      status.mounts &&
      status.mounts.homepage &&
      status.mounts.homepage.present === true
    );
  }

  function renderBadge(target, status) {
    if (!isHealthy(status)) {
      target.hidden = true;
      target.replaceChildren();
      return;
    }

    const primaryTitle = status.payload.primary_title || "Evidence Handoff";
    const primaryStatus = titleCase(status.payload.primary_status || "healthy");

    target.classList.add("evidenceHealthBadge");
    target.hidden = false;
    target.setAttribute("aria-label", "Evidence Handoff health status");

    target.innerHTML = `
      <span class="evidenceHealthBadgeDot" aria-hidden="true"></span>
      <span class="evidenceHealthBadgeText">
        <strong>Evidence Handoff: Healthy</strong>
        <span>Latest: ${primaryTitle} · Status: ${primaryStatus}</span>
      </span>
    `;
  }

  async function mountEvidenceHealthBadge(target) {
    if (!target) return;

    const statusUrl = target.getAttribute("data-status-url") || DEFAULT_STATUS_URL;

    try {
      const response = await fetch(statusUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`status fetch failed: ${response.status}`);

      const status = await response.json();
      renderBadge(target, status);
    } catch (error) {
      target.hidden = true;
      target.replaceChildren();
    }
  }

  function mountAllEvidenceHealthBadges() {
    document.querySelectorAll(TARGET_SELECTOR).forEach(mountEvidenceHealthBadge);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAllEvidenceHealthBadges, { once: true });
  } else {
    mountAllEvidenceHealthBadges();
  }

  window.SETAEvidenceHealthBadge = {
    DEFAULT_STATUS_URL,
    isHealthy,
    renderBadge,
    mountEvidenceHealthBadge,
    mountAllEvidenceHealthBadges,
  };
})();
