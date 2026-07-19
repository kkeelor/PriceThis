# PriceThis — AI Architecture

PriceThis uses Gemini as its only inference provider. The mobile app sends the
fixed `gemini` preset, and the server rejects any other requested model.

## Pipeline

1. Collect image or text input plus locale, country, and currency.
2. Run Gemini identification and initial valuation.
3. Apply deterministic identification, ambiguity, and valuation-confidence gates.
4. If valuation confidence is low, run one Gemini refinement pass.
5. Normalize the response and return model and pipeline metadata.

Gemini owns object recognition, confidence signals, valuation, and explanation.
Code owns validation, thresholds, stage order, persistence, and presentation.

## Configuration

- `GEMINI_API_KEY` — required server-side API key.
- `GEMINI_MODEL` — optional model ID; defaults to `gemini-3.1-flash-lite`.
- `SCAN_PIPELINE` and `SCAN_*` thresholds — deterministic pipeline controls.

No AI credentials are stored in the mobile app. Model selection is intentionally
not user-configurable; Settings displays the active Gemini model as read-only.

## Service boundaries

- `server/lib/gemini.ts` — Gemini requests and structured response parsing.
- `server/lib/scan-pipeline.ts` — gates, optional refinement, and telemetry.
- `server/lib/resolve-scan.ts` — fixed Gemini target and configuration checks.
- `server/lib/types.ts` — stable API contract.
- `src/services/scan/scanService.ts` — mobile request and response mapping.
