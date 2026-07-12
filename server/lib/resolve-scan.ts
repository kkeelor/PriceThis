import { resolveModel } from './models.js';

export type ScanProvider = 'claude' | 'gemini';

export type ResolvedScanTarget = {
  provider: ScanProvider;
  modelId: string;
  preset?: string;
};

const GEMINI_PRESET = 'gemini';

function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';
}

export function isGeminiPreset(requested?: string): boolean {
  return requested?.trim().toLowerCase() === GEMINI_PRESET;
}

export function resolveScanTarget(requested?: string): ResolvedScanTarget {
  if (isGeminiPreset(requested)) {
    return {
      provider: 'gemini',
      modelId: getGeminiModelId(),
      preset: GEMINI_PRESET,
    };
  }

  const resolved = resolveModel(requested);
  return {
    provider: 'claude',
    modelId: resolved.id,
    preset: resolved.preset,
  };
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
