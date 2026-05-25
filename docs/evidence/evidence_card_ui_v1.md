# Evidence Card UI v1

This stage adds the first visible dashboard-side surface for SETA_engine Evidence Handoff v1.

The scope is intentionally narrow:

- render only the primary `attention_validation` evidence card
- load from `seta_bundles/latest/evidence/dashboard_evidence_payload.json`
- preserve the public safety note
- hide the evidence section gracefully when the generated payload is missing
- avoid presenting the evidence card as a prediction, recommendation, or trade signal

## Why this exists

SETA_engine now produces a public-safe Evidence Handoff v1 payload. The prior sentiment-dash integration added the validator, fixture, reader, and landing-zone documentation. Evidence Card UI v1 is the first small visual integration of that payload into the dashboard navigation page.

## Runtime behavior

The page includes a mount point:

```html
<section class="ops evidence-stage" data-seta-evidence-section hidden>
  <div class="panel evidence-panel">
    <div
      id="seta-evidence-card-root"
      data-seta-evidence-card
      data-payload-url="seta_bundles/latest/evidence/dashboard_evidence_payload.json"
    ></div>
  </div>
</section>
```

The browser loads:

```html
<script src="src/evidence_handoff_reader.js"></script>
<script src="src/evidence_card_ui.js"></script>
```

If the payload exists and validates, the card is rendered. If the payload is absent, invalid, or not yet published, the section remains hidden.

## Safety guardrail

The UI preserves the upstream evidence guardrail:

> Historical diagnostic only; not a trade signal, recommendation, or price forecast.

## Next stage

After the generated payload is copied into `seta_bundles/latest/evidence/`, the next iteration can decide whether this evidence card belongs on the homepage, the public dashboard, the member dashboard, or a dedicated evidence/explainer panel.
