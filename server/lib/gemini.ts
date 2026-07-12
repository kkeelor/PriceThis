import { buildScanSystemPrompt, parseScanResponseText } from './scan-prompt.js';
import type { ScanApiResponse } from './types.js';

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type ScanGeminiParams = {
  locale: string;
  currencyCode: string;
  countryCode?: string;
  marketContext?: string;
  model?: string;
};

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return apiKey;
}

function getModelId(model?: string): string {
  return model?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';
}

async function generateGeminiContent(params: {
  model: string;
  system: string;
  parts: GeminiPart[];
  maxOutputTokens?: number;
}): Promise<string> {
  const apiKey = getApiKey();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: params.system }],
      },
      contents: [{ role: 'user', parts: params.parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: params.maxOutputTokens ?? 1800,
        responseMimeType: 'application/json',
      },
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini request failed (${response.status})`);
  }

  const text = payload.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

export async function scanImageWithGemini(params: {
  imageBase64: string;
} & ScanGeminiParams): Promise<ScanApiResponse> {
  const userText = params.marketContext
    ? `Identify this object and estimate value. Market context:\n${params.marketContext}`
    : 'Identify this object and estimate its market value.';

  const text = await generateGeminiContent({
    model: getModelId(params.model),
    system: buildScanSystemPrompt(params.currencyCode, params.locale, false),
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: params.imageBase64 } },
      { text: userText },
    ],
  });

  return parseScanResponseText(text);
}

export async function scanTextWithGemini(params: {
  query: string;
} & ScanGeminiParams): Promise<ScanApiResponse> {
  const userText = params.marketContext
    ? `Object query: ${params.query}\nMarket context:\n${params.marketContext}`
    : `Object query: ${params.query}`;

  const text = await generateGeminiContent({
    model: getModelId(params.model),
    system: buildScanSystemPrompt(params.currencyCode, params.locale, false),
    parts: [{ text: userText }],
  });

  return parseScanResponseText(text);
}

export async function refineImageValuationWithGemini(params: {
  imageBase64: string;
  stage1: ScanApiResponse;
} & ScanGeminiParams): Promise<ScanApiResponse> {
  const userText = `The object has been identified as "${params.stage1.objectName}" (category: ${params.stage1.category}).
Re-estimate current resale and retail market value in the user's locale using your best knowledge, then return updated JSON with refreshed estimatedValue and honest valuationConfidence.
Keep the same objectName unless you strongly believe it is wrong.`;

  const text = await generateGeminiContent({
    model: getModelId(params.model),
    system: buildScanSystemPrompt(params.currencyCode, params.locale, false),
    parts: [
      { inline_data: { mime_type: 'image/jpeg', data: params.imageBase64 } },
      { text: userText },
    ],
    maxOutputTokens: 1200,
  });

  return parseScanResponseText(text);
}

export async function refineTextValuationWithGemini(params: {
  query: string;
  stage1: ScanApiResponse;
} & ScanGeminiParams): Promise<ScanApiResponse> {
  const userText = `Object query: ${params.query}
The object has been identified as "${params.stage1.objectName}" (category: ${params.stage1.category}).
Re-estimate current resale and retail market value in the user's locale using your best knowledge, then return updated JSON with refreshed estimatedValue and honest valuationConfidence.
Keep the same objectName unless you strongly believe it is wrong.`;

  const text = await generateGeminiContent({
    model: getModelId(params.model),
    system: buildScanSystemPrompt(params.currencyCode, params.locale, false),
    parts: [{ text: userText }],
    maxOutputTokens: 1200,
  });

  return parseScanResponseText(text);
}
