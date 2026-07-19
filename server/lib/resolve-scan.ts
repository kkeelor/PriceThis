export type ScanProvider = 'gemini';

export type ResolvedScanTarget = {
  provider: ScanProvider;
  modelId: string;
  preset?: string;
};

function getGeminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';
}

export function resolveScanTarget(requested?: string): ResolvedScanTarget {
  const normalized = requested?.trim().toLowerCase();
  if (normalized && normalized !== 'gemini' && normalized !== 'default') {
    throw new Error('Only the Gemini model is supported.');
  }

  return {
    provider: 'gemini',
    modelId: getGeminiModelId(),
    preset: 'gemini',
  };
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}
