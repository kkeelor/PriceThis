# PriceThis — AI-Native Architecture

This document defines how PriceThis balances **user trust**, **speed**, and **unit economics**. It combines two principles:

1. **Progressive inference** — start cheap, escalate only when measurable gain justifies cost.
2. **Deterministic orchestration, AI reasoning** — code runs the workflow; models do the thinking.

> **Status:** Phase A + **Phase B** implemented locally. Split `identificationConfidence` / `valuationConfidence`; search fires when **valuation** is low, not in a middle band.

---

## Core heuristic

When designing any feature, ask:

> **Is this code solving an orchestration problem or a reasoning problem?**

| Problem type | Owner | Examples |
|--------------|-------|----------|
| **Orchestration** | Deterministic code | Stage order, gates, caching, retries, timeouts, JSON validation, UX formatting, when to search, when to escalate |
| **Reasoning** | AI | What object is this, how confident am I, what is it worth, why, what alternatives exist, how to explain to this user |

**Do not** hardcode category-specific decision trees or business rules where a model can reason more effectively (e.g. “if watch then Chrono24”).

**Do** define clear interfaces between services so models, prompts, retrieval, and inference strategies can evolve without rewriting the app.

**Gray zone (be explicit):** Some decisions look like orchestration but need AI input — e.g. “is this query too vague to price?” or “are search results conflicting?” Either add structured fields to the AI response for the orchestrator to read, or accept that a cheap AI pass is part of the gate. Do not hide reasoning inside opaque heuristics (word-count rules, regex lists) when the model handles it better.

---

## Goals

- **Maximize user trust** — correct identification, honest confidence, no fabricated precision.
- **Sustainable unit economics** — minimum API calls per successful scan.
- **Model-forward product** — intelligence improves as foundation models improve; orchestration stays stable.

Treat inference as an **optimization problem**, not a one-shot request. Every pipeline stage must justify its cost with measurable improvement in recognition quality or valuation confidence.

---

## Deterministic workflow (orchestration)

Every scan follows the same ordered pipeline. Code owns the sequence; AI owns the content of each step.

```
identify → validate → value → explain → personalize
```

| Stage | Orchestration (code) | Reasoning (AI) |
|-------|----------------------|----------------|
| **Identify** | Choose input modality (image/text), model tier, pass locale/country | Name object, features, alternatives, identification confidence |
| **Validate** | Apply gates: thresholds, ambiguity checks, schema validation | Report uncertainty signals (structured fields, not prose) |
| **Value** | Decide whether to invoke retrieval (web search); cap `max_uses` | Estimate market value, valuation confidence, currency |
| **Explain** | Enforce response schema, truncate cards, format for UI | Summary, wow insight, curiosity cards |
| **Personalize** | Select display mode from confidence bands; convert currency | Tone and relevance within guardrails (future: user context) |

Stages may **skip** or **repeat** based on gates (e.g. re-identify after user picks an alternative). The workflow graph is deterministic; the reasoning inside each node is not.

### Important: monolithic vs split calls

Today each scan is **one** Claude call returning the full schema (identify + value + explain in a single JSON blob). The table above describes **logical** stages, not necessarily separate API calls.

| Approach | Pros | Cons |
|----------|------|------|
| **Monolithic Stage 1** (current shape) | One round-trip; cheapest when no escalation | Wastes tokens on curiosity cards if we escalate; couples ID and value confidence |
| **Split calls** (identify first, value later) | Pay for explain only when ID passes; clearer gates | Two+ round-trips on common path — may cost *more* unless escalation rate is high |

**Recommendation:** Phase A keeps a monolithic Haiku pass for the happy path; defer curiosity cards to a second call only when Stage 1 passes all gates, or strip cards from Stage 1 schema until gates pass. Do not assume splitting is automatically cheaper — measure.

---

## Progressive inference (cost optimization)

Default path: **cheapest reliable model first**, escalate only when gates fail.

```
                    ┌──────────────────────────────────────┐
                    │  Stage 0 — free context (parallel)   │
                    │  locale · currency · countryCode   │
                    │  listings URLs · hero image (text) │
                    └──────────────────┬───────────────────┘
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  Stage 1 — Haiku, no search          │
                    │  identify + value (+ minimal explain)│
                    └──────────────────┬───────────────────┘
                                       ▼
                              ┌────────────────┐
                         fail │   ID gate      │ pass
                    ┌─────────┤  confidence    ├─────────┐
                    │         │  ambiguity     │         │
                    ▼         └────────────────┘         ▼
         ┌──────────────────┐                 ┌────────────────┐
         │ 4a — Sonnet      │                 │  Value gate    │
         │ re-identify      │                 │  (valuation    │
         │ (vision/text)    │                 │   confidence)  │
         └────────┬─────────┘                 └───────┬────────┘
                  │                            fail   │   pass
                  │                    ┌──────────────┼──────────────┐
                  │                    ▼              │              ▼
                  │         ┌──────────────────┐    │    ┌─────────────────┐
                  │         │ 3 — Haiku +      │    │    │ 5 — explain +   │
                  │         │ web search (≤1)  │    │    │ personalize     │
                  │         └────────┬─────────┘    │    │ (full cards, UX)│
                  │                  │ still low    │    └─────────────────┘
                  │                  ▼              │
                  │         ┌──────────────────┐    │
                  └────────►│ 4b — Sonnet      │◄───┘
                            │ re-value         │
                            └────────┬─────────┘
                                     ▼
                            ┌─────────────────┐
                            │ 5 — explain +   │
                            │ personalize     │
                            └─────────────────┘

         Anytime: ambiguous alts → show UI disambiguation → cheap text re-query (Stage 1b)
                   before 4a/4b when user taps an alternative
```

**Hypothesis (not measured yet):** ~70–80% exit after Stage 1 · ~15–20% add search · ~5% model escalation · disambiguation before expensive models. Replace with real metrics once pipeline exists.

---

## Trust signals (honest, measurable)

Two explicit scores in the API schema (Phase B):

| Signal | Meaning | Orchestration use |
|--------|---------|-------------------|
| **identificationConfidence** | Correct object named? | ID gate (fail floor), ambiguity vs alts |
| **valuationConfidence** | Price grounded in market? | **Search gate** — search when LOW |
| **confidence** | `min(identification, valuation)` | Conservative headline for UI badge |
| **Ambiguity** | Top alt within Δ of identification | Disambiguation UI, no search |
| **retrievalQuality** | Search thin or conflicting? | Future: do not inflate after search |

**Never fabricate** scores. `confidence` is derived, not independent.

### Confidence zones (implemented defaults)

| Zone | Identification | Valuation | Pipeline action |
|------|----------------|-----------|-----------------|
| **Too weak** | &lt; 50 (`SCAN_ID_FAIL_FLOOR`) | any | Return Stage 1, **no search** (pricing wrong object is worse than guessing) |
| **Ambiguous** | top alt within 15 pts | any | Return Stage 1, **no search** (user picks alt) |
| **Low valuation** | ≥ 50 | &lt; 70 (`SCAN_SEARCH_THRESHOLD`) | **Run web search** |
| **High-stakes low val** | ≥ 50 | &lt; 75 on watches/art/cars | **Run web search** (stricter bar) |
| **Confident** | adequate | ≥ threshold | Return Stage 1, **no search** |

**Why the old 75–84 band was wrong:** ID gate at 75 blocked search for scores below 75, while search only ran above 75. Low-confidence scans — the ones that need market data — never got search. Search must key off **valuationConfidence**, not a middle band on a single score.

**Optimal starting thresholds (tune with logs):**

- `SCAN_ID_FAIL_FLOOR=50` — only block when identity is genuinely too weak
- `SCAN_SEARCH_THRESHOLD=70` — search when model admits price uncertainty
- `SCAN_CATEGORY_SEARCH_THRESHOLD=75` — retrieve more aggressively for high-stakes categories
- UI badge bands: low &lt; 70, medium 70–84, high ≥ 85 (aligned with search threshold)

### UX bands (orchestration, not reasoning)

| Band | Presentation | Status |
|------|----------------|--------|
| High | Single estimate + concise explanation | OK |
| Medium | Value range + “based on similar listings” | Needs `valueLow` / `valueHigh` (future) |
| Low | “Could be X or Y” + alternatives | OK |

---

## Escalation gates (deterministic)

Escalate to the next stage when **any** gate fires. Thresholds are env-configurable and tuned from logs.

**ID gate (fail → return without search; ambiguous → disambiguation UI):**

- `identificationConfidence` below `SCAN_ID_FAIL_FLOOR` (default 50)
- Top alternative within `SCAN_AMBIGUITY_MARGIN` of identification score

**Value gate (fail → Stage 3 search):**

- `valuationConfidence` below `SCAN_SEARCH_THRESHOLD` (default 70)
- Stricter bar for high-stakes categories: `SCAN_CATEGORY_SEARCH_THRESHOLD` (default 75)
- Classic case: high identification (90) + low valuation (55) → search

**Do not escalate when:**

- Stage 1 passes both gates and alternatives are distant
- User can disambiguate via `alternativeMatches` — prefer UI tap → Stage 1b text re-query

**Category-aware policy (tension to manage):** High-stakes categories (watches, art, cars) may use **stricter thresholds** via a config map keyed by category. The category label still comes from AI; code only applies numeric policy. This is not a pricing rules engine — it adjusts *when* to spend more inference, not *what* the price is.

---

## Web search (retrieval, not reasoning)

Search is orchestration-triggered retrieval. AI interprets results; code decides **if** and **when** to search.

| Use search | Skip search |
|------------|-------------|
| Value gate failed | Both ID and valuation confidence above threshold |
| Live listings likely to help (commoditized goods) | Search already ran this scan |
| Region-specific pricing (`countryCode` / `user_location`) | User just picked an alt — run Stage 1b first, then at most one search |

Cap: `WEB_SEARCH_MAX_USES` per scan. Haiku uses `web_search_20250305` with `allowed_callers: ['direct']`.

**Serverless budget:** Vercel functions `maxDuration` is 60s (`server/vercel.json`). Sequential Haiku → search → Sonnet must fit inside this including cold start. Orchestrator should track elapsed time and skip 4b rather than timeout.

---

## Service boundaries

```
┌──────────────────────────────────────────────────────────┐
│  scan pipeline (orchestrator)                            │
│  gates · caching · stage routing · response assembly     │
└────────────┬─────────────────────────────────────────────┘
             │
     ┌───────┼───────┬──────────────┬─────────────┐
     ▼       ▼       ▼              ▼             ▼
 identify  retrieve  explain    validate      personalize
 service   service   service    (schema)      (display policy)
     │       │           │
     └───────┴───────────┘
             │
      Claude / future models
```

| Module | Responsibility |
|--------|----------------|
| `server/lib/scan-pipeline.ts` (planned) | Run stages, gates, escalation, assemble `ScanApiResponse` |
| `server/lib/claude.ts` | Model calls: prompts + structured output per stage |
| `server/lib/web-search.ts` | Retrieval tool config, `user_location`, caps |
| `server/lib/market-data.ts` | Optional non-search enrichment (stub today) — must not duplicate web search blindly |
| `server/lib/models.ts` | Model ladder: haiku → sonnet → opus |
| `server/lib/types.ts` | Stable API contract for client |
| Client `scanService.ts` | Send context; render by confidence band |

**Client model presets:** `ModelPresetContext` currently sends `model` on every scan (`useScan.ts`). For production orchestration, server should own the ladder; client preset should be **dev/QA override only**, or ignored when pipeline mode is on.

---

## What code must not do

- Encode “if Rolex then …” pricing rules
- Fake confidence to smooth UX
- Call search + Sonnet + Opus on every scan by default
- Couple UI screens to specific model IDs or prompt strings
- Use word-count or regex “vagueness” rules when a structured AI uncertainty field is available

## What code must do

- Enforce workflow order and exit conditions
- Validate and normalize API responses (schema, bounds, required fields)
- Cache with explicit TTL and invalidation (prices go stale)
- Log stage, model, searches, tokens, gates, user actions (alt pick, `AccuracyFeedback`)
- Format honest UX from confidence bands
- Respect serverless timeout budget

---

## Optimization loop

Log per scan:

- Stages executed, models used, search count, token usage, wall time
- Gates fired, final confidence bands
- User outcome: disambiguation, favorite, accuracy feedback, bounce

Tune gates to minimize **expected cost per trusted scan** (user did not disambiguate or abandon), not average latency or raw model confidence.

**Existing signal not yet wired:** `AccuracyFeedback` on `ResultScreen` persists `userAccuracy` locally (`scanHistory.ts`) but is **not** sent to the server or used to tune prompts/gates. Phase E should close this loop or drop the claim that feedback informs tuning.

---

## Implementation phases

| Phase | Scope | Reasoning vs orchestration |
|-------|-------|----------------------------|
| **A** | Pipeline orchestrator; Stage 1 without search → gates → conditional search | Code: gates. AI: same prompts, optional slimmer Stage 1 schema. |
| **B** | Split `identificationConfidence` / `valuationConfidence`; search on low valuation | **Done** |
| **C** | Alt-picker → Stage 1b text re-query **without search** unless value gate fails | Code: routing. AI: narrow query. |
| **D** | Sonnet escalation on ID gate only; measure $/scan | Code: ladder. AI: stronger vision. |
| **E** | Cache, metrics, optional accuracy feedback upload | Code only. |

---

## Current state vs target

| Area | Current (Phase A+B) | Target |
|------|---------------------|--------|
| API calls per scan | 1–2 (search when valuation &lt; 70) | 1+ only when gates fail |
| Confidence | Split ID + valuation; `confidence` = min | Split ID / valuation |
| Gates | ID fail floor + valuation search threshold | ID + value + ambiguity |
| Alt re-scan | `scanByText` full pipeline incl. search | Stage 1b cheap path |
| Hero image (text) | After Claude, from `objectName` | Stage 0 parallel (OK either way) |
| Value range UI | Single `estimatedValue` | Range for medium band |
| market-data | Stub always returns `undefined` | Complement search, not parallel guess |
| Orchestrator | `server/lib/scan-pipeline.ts` | Handlers call `runImageScanPipeline` / `runTextScanPipeline` |

---

## Critical review

Structured pass over this document and the codebase. Items marked **FIX** should be resolved in the doc or implementation; **OPEN** are real tradeoffs.

### Logic / diagram holes (FIX)

1. **Original flowchart was wrong** — ID gate “pass” path skipped the value gate and jumped to “return.” Corrected above.
2. **Stage numbering was duplicated** — “Stage 4” meant both identify-escalate and value-escalate. Now **4a** (identify) and **4b** (value).
3. **“Stage 5” only on happy path** — explain/personalize should run once after final value is accepted, not before escalation completes.

### Architecture tensions (OPEN)

| # | Issue | Why it matters |
|---|--------|----------------|
| T1 | Monolithic JSON vs split stages | Splitting can *increase* cost on happy path; need token accounting before committing |
| T2 | “No category rules” vs category threshold map | Policy map is still category-dependent — keep it to thresholds only, never prices |
| T3 | “Skip search for stable-reference items” | Stability is a reasoning judgment unless AI exports `priceStability: high\|low` |
| T4 | Vague query detection | Must be AI-structured or a dedicated cheap classify call — not regex |
| T5 | Alt pick from **image** scan → text-only re-query | Loses vision; similar-looking watches may mis-price. Consider image re-scan with `objectName` hint |
| T6 | Escalation resends full image | 2× vision token cost; acceptable only at low escalation rate |
| T7 | Generating curiosity cards before gates pass | Wasted output tokens on thrown-away responses |
| T8 | Client `model` preset bypasses ladder | Undermines cost control in production |
| T9 | `MARKET_DATA_ENABLED` stub | Future double path with web search — orchestrator must pick one retrieval strategy |
| T10 | Target % mix (70–80 / 15–20 / 5) | Aspirational — no production metrics yet |

### Trust / calibration holes (OPEN)

| # | Issue | Detail |
|---|--------|--------|
| C1 | Model self-reported confidence | Known to be miscalibrated; gates on raw scores may fire too often or too rarely until calibrated against `AccuracyFeedback` |
| C2 | `retrievalQuality` | Not in API; Anthropic returns `usage.server_tool_use.web_search_requests` but not quality — need AI field or post-search mini-eval |
| C3 | Single badge vs split scores | UI can show high ID confidence while price is wild — misleading until split |
| C4 | Search hidden from user | Prompt says “don’t mention search in JSON” — good for UX, but user can’t verify sources unless we add optional citations later |

### Operational holes (OPEN)

| # | Issue | Detail |
|---|--------|--------|
| O1 | 60s Vercel ceiling | Worst case 4a + 3 + 4b + 5 can exceed budget — need time-aware degradation |
| O2 | Cache key for images | No object name until after Stage 1 — image caches need perceptual hash or skip |
| O3 | Cold start + search latency | P95 UX may spike; track separately from model choice |
| O4 | Web search org limits | Anthropic rate limits per org — batch/publish spikes need monitoring |

### Doc vs code anomalies (verified in repo)

| Doc claim | Reality |
|-----------|---------|
| “Personalize” stage | `PersonalizationProfile` type exists; not wired to scans |
| “validate” as separate stage | Only `parseResponse` JSON slice — no semantic validation |
| “Server owns ladder in production” | `getRequestedModel` always honors client `model` / `X-Claude-Model` |
| “Disambiguation before expensive models” | Alt tap runs full `scanByText` including search (v0.0.22) |
| “Minimum API calls” | Current default is max calls (always search) — opposite of target |
| Hero image in Stage 0 | Text: `fetchItemImageUrl` runs **after** Claude in `text.ts` handler |

---

## Acceptance tests

Tests below are **specifications** for the pipeline orchestrator and gates. None exist in CI yet. Format: **Given / When / Then**.

### Gate unit tests (pure functions, no API)

```
G-ID-01  Given identificationConfidence=80, alts=[{name:B, confidence=60}]
         When evaluateIdGate(threshold=75, margin=15)
         Then pass (no escalation, no forced disambiguation)

G-ID-02  Given identificationConfidence=72, alts=[]
         When evaluateIdGate(threshold=75, margin=15)
         Then fail → escalate 4a

G-ID-03  Given identificationConfidence=88, alts=[{name:B, confidence=80}]
         When evaluateIdGate(threshold=75, margin=15)
         Then ambiguous → prefer disambiguation UI (do not auto-escalate 4a)

G-ID-04  Given identificationConfidence=90, alts=[{name:B, confidence=50}]
         When evaluateIdGate(threshold=75, margin=15)
         Then pass (alt too far to matter)

G-VAL-01 Given valuationConfidence=70, idConfidence=90
         When evaluateValueGate(threshold=65)
         Then pass → skip search

G-VAL-02 Given valuationConfidence=50, idConfidence=90
         When evaluateValueGate(threshold=65)
         Then fail → run search (stage 3)

G-VAL-03 Given valuationConfidence=40 after search, retrievalQuality="poor"
         When evaluateValueGate post-search
         Then fail → escalate 4b OR return range UX (policy flag)

G-CAT-01 Given category="watches", policy strict threshold id=80
         When identificationConfidence=78
         Then fail ID gate (stricter than default 75)

G-TIME-01 Given elapsed=45s, remaining budget=60s, next stage=4b estimated 20s
          When orchestrator chooses next stage
          Then skip 4b, return best-so-far + honest medium/low UX
```

### Orchestration integration tests (mocked Claude)

```
O-01  Happy path image scan
      Given Haiku Stage 1 returns id=90, val=85
      When runPipeline(image)
      Then exactly 1 Claude call, 0 searches, includes curiosity cards

O-02  Value-only escalation
      Given Haiku returns id=90, val=50
      When runPipeline(image)
      Then 2 Claude calls: Stage 1 + Stage 3 with search tools
      And 0 Sonnet calls

O-03  ID escalation
      Given Haiku returns id=60
      When runPipeline(image)
      Then Sonnet 4a called once with same image
      And Stage 1 curiosity cards not sent to client (or marked provisional)

O-04  Alt pick cheap path
      Given user selects alt "Omega Seamaster" from image result
      When runPipeline(text, source=disambiguation)
      Then Stage 1b text only, search disabled unless value gate fails

O-05  Client model override ignored in production
      Given PIPELINE_MODE=production, client sends model=opus
      When runPipeline(image)
      Then uses ladder default (Haiku first) unless quality mode flag set server-side

O-06  Timeout degradation
      Given Stage 1 + search consume 52s
      When value gate still failing
      Then do not call 4b; return partial with valuationConfidence honest
```

### Schema / validation tests

```
V-01  Given Claude returns JSON without estimatedValue
      When validateScanResponse
      Then 500 or safe fallback, never NaN in client

V-02  Given confidence=150 or confidence=-5
      When normalize
      Then clamp to [0,100] and log anomaly

V-03  Given alternativeMatches not sorted
      When normalize
      Then sort descending, slice to 3

V-04  Given currencyCode mismatch request vs response
      When normalize
      Then prefer response but log for FX audit
```

### Client UX tests (component / e2e)

```
U-01  Given valuationConfidence low, identificationConfidence high
      When ResultScreen renders
      Then show range or hedged copy, not bold single price

U-02  Given ambiguous alts (G-ID-03)
      When ResultScreen renders
      Then alternatives visible above fold; confidence badge not "high"

U-03  Given user taps alt
      When re-scan completes
      Then objectName updates; hero image preserved from prior scan (image flow)

U-04  Given AccuracyFeedback "too_high"
      When stored locally
      Then (Phase E) available for export; today: no server effect (documented)
```

### Cost accounting tests (telemetry)

```
$ -01  Given 1000 scans with gate mix per hypothesis
       When aggregate pipeline logs
       Then compute mean Claude calls, mean searches, P95 latency — compare to single-shot baseline

$ -02  Given cache hit on text query "Rolex Submariner" + IN + same day
       When runPipeline(text)
       Then 0 Claude calls, return cached valuation with cachedAt metadata
```

### Manual smoke (pre-publish, from existing skill)

1. Home → recent scan → Result (legacy MMKV fields optional)
2. Search → Result (hero image from Wikipedia)
3. Camera → Result
4. Result → tap alt → re-estimate (verify search not always fired post-Phase C)
5. Settings → model preset ≠ server ladder (document expected behavior)

---

## Summary

PriceThis is an **AI-native** product: deterministic workflows, AI reasoning inside each step. Orchestration maximizes trust per dollar; models do the work they are good at. As foundation models improve, swap implementations behind stable interfaces—the pipeline and user experience stay the same.

**Next concrete step:** Phase C — alt-picker cheap re-query; tune thresholds from `meta.pipeline` logs after Vercel deploy.
