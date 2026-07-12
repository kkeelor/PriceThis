import type { ScanApiResponse } from './types.js';

export type IdGateResult = 'pass' | 'ambiguous' | 'fail';
export type ValueGateResult = 'pass' | 'fail';

export type ResolvedConfidences = {
  identificationConfidence: number;
  valuationConfidence: number;
  /** Conservative headline score for UI: min(id, valuation). */
  confidence: number;
};

export type GateConfig = {
  /** Below this identification score, object identity is too weak to price. */
  idFailFloor: number;
  /** Search when valuation confidence is strictly below this threshold. */
  searchThreshold: number;
  /** High-stakes categories search when valuation is below this (higher bar). */
  categorySearchThreshold: number;
  ambiguityMargin: number;
  strictCategories: Set<string>;
};

const DEFAULT_STRICT_CATEGORIES = new Set([
  'watches',
  'art',
  'cars',
  'collectibles',
  'real_estate',
]);

function parseThreshold(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, parsed));
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

export function getGateConfig(): GateConfig {
  const strictList =
    process.env.SCAN_CATEGORY_STRICT_CATEGORIES?.trim() ||
    'watches,art,cars,collectibles,real_estate';

  return {
    idFailFloor: parseThreshold('SCAN_ID_FAIL_FLOOR', 50),
    searchThreshold: parseThreshold('SCAN_SEARCH_THRESHOLD', 70),
    categorySearchThreshold: parseThreshold(
      'SCAN_CATEGORY_SEARCH_THRESHOLD',
      75,
    ),
    ambiguityMargin: parseThreshold('SCAN_AMBIGUITY_MARGIN', 15),
    strictCategories: new Set(
      strictList
        .split(',')
        .map(value => value.trim().toLowerCase())
        .filter(Boolean),
    ),
  };
}

export function isPipelineEnabled(): boolean {
  const value = process.env.SCAN_PIPELINE?.trim().toLowerCase();
  return value !== 'false' && value !== '0';
}

export function resolveConfidences(
  response: ScanApiResponse,
): ResolvedConfidences {
  const legacy = clampConfidence(response.confidence);
  const identificationConfidence = clampConfidence(
    response.identificationConfidence ?? legacy,
  );
  const valuationConfidence = clampConfidence(
    response.valuationConfidence ?? legacy,
  );

  return {
    identificationConfidence,
    valuationConfidence,
    confidence: Math.min(identificationConfidence, valuationConfidence),
  };
}

function getTopAlternative(
  response: ScanApiResponse,
): { name: string; confidence: number } | undefined {
  const sorted = [...(response.alternativeMatches ?? [])].sort(
    (a, b) => b.confidence - a.confidence,
  );
  return sorted[0];
}

function getSearchThreshold(
  response: ScanApiResponse,
  config: GateConfig,
): number {
  const category = response.category?.trim().toLowerCase();
  if (category && config.strictCategories.has(category)) {
    return config.categorySearchThreshold;
  }
  return config.searchThreshold;
}

/**
 * ID gate: blocks pricing when identity is too weak or ambiguous.
 * Does NOT block search — low valuation triggers search on pass.
 */
export function evaluateIdGate(
  response: ScanApiResponse,
  config: GateConfig = getGateConfig(),
): IdGateResult {
  const { identificationConfidence } = resolveConfidences(response);
  const topAlt = getTopAlternative(response);

  if (
    topAlt &&
    identificationConfidence - topAlt.confidence <= config.ambiguityMargin
  ) {
    return 'ambiguous';
  }

  if (identificationConfidence < config.idFailFloor) {
    return 'fail';
  }

  return 'pass';
}

/**
 * Value gate: search when valuation confidence is LOW (below threshold).
 * High identification + low valuation is the primary search case.
 */
export function evaluateValueGate(
  response: ScanApiResponse,
  config: GateConfig = getGateConfig(),
): ValueGateResult {
  const { valuationConfidence } = resolveConfidences(response);
  const threshold = getSearchThreshold(response, config);

  if (valuationConfidence < threshold) {
    return 'fail';
  }

  return 'pass';
}

export function normalizeScanResponse(response: ScanApiResponse): ScanApiResponse {
  const scores = resolveConfidences(response);

  const alternativeMatches = [...(response.alternativeMatches ?? [])]
    .map(match => ({
      name: match.name,
      confidence: clampConfidence(match.confidence),
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return {
    ...response,
    identificationConfidence: scores.identificationConfidence,
    valuationConfidence: scores.valuationConfidence,
    confidence: scores.confidence,
    alternativeMatches,
    curiosityCards: (response.curiosityCards ?? []).slice(0, 5),
    explanation: {
      summary: response.explanation?.summary ?? '',
      features: response.explanation?.features ?? [],
    },
  };
}

export function shouldRunSearch(
  response: ScanApiResponse,
  config: GateConfig = getGateConfig(),
): boolean {
  const idGate = evaluateIdGate(response, config);
  if (idGate !== 'pass') {
    return false;
  }
  return evaluateValueGate(response, config) === 'fail';
}
