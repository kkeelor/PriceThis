import { normalizeScanResponse } from './scan-gates.js';
import type { ScanApiResponse } from './types.js';

export const SCAN_RESPONSE_SCHEMA = `{
  "objectName": "string",
  "estimatedValue": number,
  "currencyCode": "string",
  "identificationConfidence": number,
  "valuationConfidence": number,
  "confidence": number,
  "wowInsight": "string",
  "alternativeMatches": [{ "name": "string", "confidence": number }],
  "explanation": { "summary": "string", "features": ["string"] },
  "curiosityCards": [{
    "id": "string",
    "type": "value_history | ownership_cost | interesting_facts | alternatives | rarity | market_trends | famous_owners | historical_prices | authentication",
    "title": "string",
    "preview": "string",
    "content": "string"
  }],
  "category": "cars | watches | travel | luxury | architecture | technology | collectibles | art | real_estate | other"
}`;

export function buildScanSystemPrompt(
  currencyCode: string,
  locale: string,
  enableWebSearch: boolean,
): string {
  const searchRules = enableWebSearch
    ? `- Before estimating value, search for current resale and retail prices for this object in the user's market (${locale}).
- Prefer local listings and marketplaces relevant to the region. Use resale/used prices when condition is unclear.
- Return estimatedValue in ${currencyCode}. If sources use another currency, convert using current rates.
- If search results are sparse or conflicting, estimate conservatively and lower confidence.
- Do not mention search or citations in the JSON; fold findings into explanation.summary.`
    : `- Prefer real-world market knowledge. When unsure, estimate conservatively and lower confidence.`;

  return `You are PriceThis, an AI curiosity engine for valuable physical objects.

Rules:
- Never claim certainty. Use phrasing like "appears to be" internally but return a clean object name.
- Return estimated market value in ${currencyCode} for locale ${locale}.
- identificationConfidence (0-100): how sure you are about the object name and category.
- valuationConfidence (0-100): how sure you are about estimatedValue given market knowledge (not identification).
- confidence: set to min(identificationConfidence, valuationConfidence).
- Report scores honestly. Low valuationConfidence means you need market data — do not inflate.
- alternativeMatches: max 3, descending confidence (identification alternatives only).
- wowInsight: one surprising, respectful, factual sentence users would want to share.
- curiosityCards: 3-5 most relevant cards only, with concise preview and richer content.
- explanation.features: 3-5 visual or identifying features.
${searchRules}
- Respond with JSON only, matching this schema:
${SCAN_RESPONSE_SCHEMA}`;
}

export function parseScanResponseText(text: string): ScanApiResponse {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const objectStart = payload.indexOf('{');
  const arrayStart = payload.indexOf('[');

  let parsed: ScanApiResponse;
  if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
    const objectEnd = payload.lastIndexOf('}');
    if (objectEnd === -1) {
      throw new Error('Model response did not include JSON');
    }
    parsed = JSON.parse(payload.slice(objectStart, objectEnd + 1)) as ScanApiResponse;
  } else if (arrayStart !== -1) {
    const arrayEnd = payload.lastIndexOf(']');
    if (arrayEnd === -1) {
      throw new Error('Model response did not include JSON');
    }
    const array = JSON.parse(payload.slice(arrayStart, arrayEnd + 1)) as ScanApiResponse[];
    const first = array[0];
    if (!first) {
      throw new Error('Model response JSON array was empty');
    }
    parsed = first;
  } else {
    throw new Error('Model response did not include JSON');
  }

  return normalizeScanResponse(parsed);
}
