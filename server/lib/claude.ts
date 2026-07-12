import Anthropic from '@anthropic-ai/sdk';

import { resolveModel } from './models.js';
import { normalizeScanResponse } from './scan-gates.js';
import type { ScanApiResponse } from './types.js';
import { buildWebSearchTools } from './web-search.js';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  return new Anthropic({ apiKey });
}

const responseSchema = `{
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

function buildSystemPrompt(
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
${responseSchema}`;
}

function parseResponse(text: string): ScanApiResponse {
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('Claude response did not include JSON');
  }

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as ScanApiResponse;

  return normalizeScanResponse(parsed);
}

function extractFinalText(response: Anthropic.Message): string {
  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  const last = textBlocks[textBlocks.length - 1];
  if (!last?.text) {
    throw new Error('Claude returned an empty response');
  }

  return last.text;
}

export type ScanClaudeParams = {
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
  enableWebSearch?: boolean;
};

async function createScanResponse(
  params: ScanClaudeParams,
  userContent: Anthropic.MessageParam['content'],
): Promise<ScanApiResponse> {
  const client = getClient();
  const { id: modelId } = resolveModel(params.model);
  const enableWebSearch = params.enableWebSearch ?? false;
  const tools = enableWebSearch
    ? buildWebSearchTools(params.countryCode, params.locale)
    : undefined;

  const response = await client.messages.create({
    model: modelId,
    max_tokens: enableWebSearch ? 2200 : 1800,
    system: buildSystemPrompt(params.currencyCode, params.locale, enableWebSearch),
    messages: [{ role: 'user', content: userContent }],
    ...(tools ? { tools } : {}),
  });

  return parseResponse(extractFinalText(response));
}

export async function scanImageWithClaude(params: {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
  enableWebSearch?: boolean;
}): Promise<ScanApiResponse> {
  const userText = params.marketContext
    ? `Identify this object and estimate value. Market context:\n${params.marketContext}`
    : 'Identify this object and estimate its market value.';

  return createScanResponse(params, [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: params.imageBase64,
      },
    },
    { type: 'text', text: userText },
  ]);
}

export async function scanTextWithClaude(params: {
  query: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
  enableWebSearch?: boolean;
}): Promise<ScanApiResponse> {
  const userText = params.marketContext
    ? `Object query: ${params.query}\nMarket context:\n${params.marketContext}`
    : `Object query: ${params.query}`;

  return createScanResponse(params, userText);
}

export async function refineImageValuationWithClaude(params: {
  imageBase64: string;
  stage1: ScanApiResponse;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  model?: string;
}): Promise<ScanApiResponse> {
  const userText = `The object has been identified as "${params.stage1.objectName}" (category: ${params.stage1.category}).
Search for current resale and retail prices in the user's market, then return updated JSON with a refreshed estimatedValue and honest confidence.
Keep the same objectName unless search strongly suggests a correction.`;

  return createScanResponse(
    { ...params, enableWebSearch: true },
    [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: params.imageBase64,
        },
      },
      { type: 'text', text: userText },
    ],
  );
}

export async function refineTextValuationWithClaude(params: {
  query: string;
  stage1: ScanApiResponse;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
}): Promise<ScanApiResponse> {
  const userText = `The object has been identified as "${params.stage1.objectName}" (category: ${params.stage1.category}).
Search for current resale and retail prices in the user's market, then return updated JSON with a refreshed estimatedValue and honest confidence.
Keep the same objectName unless search strongly suggests a correction.`;

  return createScanResponse(
    { ...params, enableWebSearch: true },
    userText,
  );
}

/** Legacy single-shot path: search on if globally enabled. */
export async function scanImageLegacy(params: {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
}): Promise<ScanApiResponse> {
  const { isWebSearchEnabled } = await import('./web-search.js');
  return scanImageWithClaude({
    ...params,
    enableWebSearch: isWebSearchEnabled(),
  });
}

export async function scanTextLegacy(params: {
  query: string;
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
}): Promise<ScanApiResponse> {
  const { isWebSearchEnabled } = await import('./web-search.js');
  return scanTextWithClaude({
    ...params,
    enableWebSearch: isWebSearchEnabled(),
  });
}
