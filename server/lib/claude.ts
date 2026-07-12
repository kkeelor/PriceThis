import Anthropic from '@anthropic-ai/sdk';

import { resolveModel } from './models.js';
import { buildScanSystemPrompt, parseScanResponseText } from './scan-prompt.js';
import type { ScanApiResponse } from './types.js';
import { buildWebSearchTools } from './web-search.js';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  return new Anthropic({ apiKey });
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
    system: buildScanSystemPrompt(params.currencyCode, params.locale, enableWebSearch),
    messages: [{ role: 'user', content: userContent }],
    ...(tools ? { tools } : {}),
  });

  return parseScanResponseText(extractFinalText(response));
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
