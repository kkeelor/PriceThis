import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  evaluateIdGate,
  evaluateValueGate,
  normalizeScanResponse,
  resolveConfidences,
  shouldRunSearch,
  type GateConfig,
} from './scan-gates.js';
import type { ScanApiResponse } from './types.js';

const TEST_CONFIG: GateConfig = {
  idFailFloor: 50,
  searchThreshold: 70,
  categorySearchThreshold: 75,
  ambiguityMargin: 15,
  strictCategories: new Set(['watches', 'art', 'cars']),
};

function makeResponse(
  overrides: Partial<ScanApiResponse> = {},
): ScanApiResponse {
  return normalizeScanResponse({
    objectName: 'Test Object',
    estimatedValue: 1000,
    currencyCode: 'USD',
    identificationConfidence: 80,
    valuationConfidence: 80,
    confidence: 80,
    wowInsight: 'Neat.',
    alternativeMatches: [],
    explanation: { summary: 'Summary', features: ['feature'] },
    curiosityCards: [],
    category: 'other',
    listings: [],
    ...overrides,
  });
}

describe('resolveConfidences', () => {
  it('derives legacy confidence as min of split scores', () => {
    const scores = resolveConfidences(
      makeResponse({
        identificationConfidence: 90,
        valuationConfidence: 55,
        confidence: 99,
      }),
    );
    assert.equal(scores.identificationConfidence, 90);
    assert.equal(scores.valuationConfidence, 55);
    assert.equal(scores.confidence, 55);
  });

  it('falls back to legacy confidence when split scores are missing', () => {
    const scores = resolveConfidences(
      makeResponse({
        identificationConfidence: undefined,
        valuationConfidence: undefined,
        confidence: 62,
      }),
    );
    assert.equal(scores.identificationConfidence, 62);
    assert.equal(scores.valuationConfidence, 62);
  });
});

describe('evaluateIdGate', () => {
  it('G-ID-01 passes when identification is adequate and alts are distant', () => {
    const result = evaluateIdGate(
      makeResponse({
        identificationConfidence: 80,
        alternativeMatches: [{ name: 'B', confidence: 60 }],
      }),
      TEST_CONFIG,
    );
    assert.equal(result, 'pass');
  });

  it('G-ID-02 passes moderate identification (above fail floor)', () => {
    const result = evaluateIdGate(
      makeResponse({
        identificationConfidence: 62,
        valuationConfidence: 62,
      }),
      TEST_CONFIG,
    );
    assert.equal(result, 'pass');
  });

  it('G-ID-02b fails when identification is below fail floor', () => {
    const result = evaluateIdGate(
      makeResponse({ identificationConfidence: 45 }),
      TEST_CONFIG,
    );
    assert.equal(result, 'fail');
  });

  it('G-ID-03 prefers ambiguous when top alt is within margin', () => {
    const result = evaluateIdGate(
      makeResponse({
        identificationConfidence: 88,
        alternativeMatches: [{ name: 'B', confidence: 80 }],
      }),
      TEST_CONFIG,
    );
    assert.equal(result, 'ambiguous');
  });

  it('G-ID-04 passes when top alt is far below identification', () => {
    const result = evaluateIdGate(
      makeResponse({
        identificationConfidence: 90,
        alternativeMatches: [{ name: 'B', confidence: 50 }],
      }),
      TEST_CONFIG,
    );
    assert.equal(result, 'pass');
  });
});

describe('evaluateValueGate', () => {
  it('G-VAL-01 skips search when valuation confidence is high', () => {
    const result = evaluateValueGate(
      makeResponse({ valuationConfidence: 90 }),
      TEST_CONFIG,
    );
    assert.equal(result, 'pass');
  });

  it('G-VAL-02 triggers search when valuation confidence is low', () => {
    const result = evaluateValueGate(
      makeResponse({ valuationConfidence: 65 }),
      TEST_CONFIG,
    );
    assert.equal(result, 'fail');
  });

  it('G-VAL-03 high ID + low valuation triggers search', () => {
    const response = makeResponse({
      identificationConfidence: 92,
      valuationConfidence: 58,
    });
    assert.equal(evaluateIdGate(response, TEST_CONFIG), 'pass');
    assert.equal(evaluateValueGate(response, TEST_CONFIG), 'fail');
    assert.equal(shouldRunSearch(response, TEST_CONFIG), true);
  });

  it('G-CAT-01 searches sooner for watches (stricter valuation threshold)', () => {
    const result = evaluateValueGate(
      makeResponse({
        category: 'watches',
        valuationConfidence: 72,
      }),
      TEST_CONFIG,
    );
    assert.equal(result, 'fail');
  });
});

describe('shouldRunSearch', () => {
  it('does not search when identification is ambiguous', () => {
    const response = makeResponse({
      identificationConfidence: 88,
      valuationConfidence: 40,
      alternativeMatches: [{ name: 'B', confidence: 80 }],
    });
    assert.equal(shouldRunSearch(response, TEST_CONFIG), false);
  });

  it('does not search when identification fails floor', () => {
    const response = makeResponse({
      identificationConfidence: 40,
      valuationConfidence: 40,
    });
    assert.equal(shouldRunSearch(response, TEST_CONFIG), false);
  });

  it('does not search when valuation is already confident', () => {
    const response = makeResponse({
      identificationConfidence: 75,
      valuationConfidence: 82,
    });
    assert.equal(shouldRunSearch(response, TEST_CONFIG), false);
  });
});

describe('normalizeScanResponse', () => {
  it('V-02 clamps confidence fields into range', () => {
    const normalized = normalizeScanResponse(
      makeResponse({
        identificationConfidence: 150,
        valuationConfidence: -5,
      }),
    );
    assert.equal(normalized.identificationConfidence, 100);
    assert.equal(normalized.valuationConfidence, 0);
    assert.equal(normalized.confidence, 0);
  });

  it('V-03 sorts and slices alternatives', () => {
    const normalized = normalizeScanResponse(
      makeResponse({
        alternativeMatches: [
          { name: 'low', confidence: 10 },
          { name: 'high', confidence: 90 },
          { name: 'mid', confidence: 50 },
          { name: 'extra', confidence: 40 },
        ],
      }),
    );
    assert.equal(normalized.alternativeMatches.length, 3);
    assert.equal(normalized.alternativeMatches[0]?.name, 'high');
  });
});
