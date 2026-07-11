import Anthropic from '@anthropic-ai/sdk';

import type { ScanApiResponse } from './types.js';

const MODEL = process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6';

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

function buildSystemPrompt(currencyCode: string, locale: string): string {
  return `You are PriceThis, an AI curiosity engine for valuable physical objects.

Rules:
- Never claim certainty. Use phrasing like "appears to be" internally but return a clean object name.
- Return estimated market value in ${currencyCode} for locale ${locale}.
- confidence is 0-100. If below 70, still return best effort but keep confidence honest.
- alternativeMatches: max 3, descending confidence.
- wowInsight: one surprising, respectful, factual sentence users would want to share.
- curiosityCards: 3-5 most relevant cards only, with concise preview and richer content.
- explanation.features: 3-5 visual or identifying features.
- Prefer real-world market knowledge. When unsure, estimate conservatively and lower confidence.
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

  parsed.alternativeMatches = (parsed.alternativeMatches ?? []).slice(0, 3);
  parsed.curiosityCards = (parsed.curiosityCards ?? []).slice(0, 5);

  return parsed;
}

export async function scanImageWithClaude(params: {
  imageBase64: string;
  locale: string;
  currencyCode: string;
  marketContext?: string;
}): Promise<ScanApiResponse> {
  const client = getClient();
  const userText = params.marketContext
    ? `Identify this object and estimate value. Market context:\n${params.marketContext}`
    : 'Identify this object and estimate its market value.';

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: buildSystemPrompt(params.currencyCode, params.locale),
    messages: [
      {
        role: 'user',
        content: [
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
      },
    ],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned an empty response');
  }

  return parseResponse(textBlock.text);
}

export async function scanTextWithClaude(params: {
  query: string;
  locale: string;
  currencyCode: string;
  marketContext?: string;
}): Promise<ScanApiResponse> {
  const client = getClient();
  const userText = params.marketContext
    ? `Object query: ${params.query}\nMarket context:\n${params.marketContext}`
    : `Object query: ${params.query}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1800,
    system: buildSystemPrompt(params.currencyCode, params.locale),
    messages: [{ role: 'user', content: userText }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned an empty response');
  }

  return parseResponse(textBlock.text);
}
