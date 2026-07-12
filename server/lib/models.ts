const FALLBACK_MODEL = 'claude-haiku-4-5';

export const MODEL_PRESETS = {
  default: 'CLAUDE_MODEL',
  sonnet: 'CLAUDE_MODEL_SONNET',
  opus: 'CLAUDE_MODEL_OPUS',
  haiku: 'CLAUDE_MODEL_HAIKU',
  fast: 'CLAUDE_MODEL_FAST',
  quality: 'CLAUDE_MODEL_QUALITY',
} as const;

export type ModelPreset = keyof typeof MODEL_PRESETS;

export type ResolvedModel = {
  id: string;
  preset?: ModelPreset;
};

function readEnvModel(envVar: string): string | undefined {
  const value = process.env[envVar]?.trim();
  return value || undefined;
}

export function getDefaultModelId(): string {
  return readEnvModel(MODEL_PRESETS.default) ?? FALLBACK_MODEL;
}

export function resolveModel(requested?: string): ResolvedModel {
  if (!requested?.trim()) {
    return { id: getDefaultModelId(), preset: 'default' };
  }

  const normalized = requested.trim().toLowerCase();
  if (normalized in MODEL_PRESETS) {
    const preset = normalized as ModelPreset;
    const envVar = MODEL_PRESETS[preset];
    const modelId =
      preset === 'default'
        ? getDefaultModelId()
        : readEnvModel(envVar);

    if (!modelId) {
      throw new Error(
        `Model preset "${preset}" is not configured. Set ${envVar} in your environment.`,
      );
    }

    return { id: modelId, preset };
  }

  if (requested.startsWith('claude-')) {
    return { id: requested };
  }

  throw new Error(
    `Unknown model "${requested}". Use a preset (${Object.keys(MODEL_PRESETS).join(', ')}, gemini) or a claude-* model id.`,
  );
}

export function listConfiguredModels(): Array<{
  preset: ModelPreset;
  envVar: string;
  modelId: string | null;
  configured: boolean;
}> {
  return Object.entries(MODEL_PRESETS).map(([preset, envVar]) => {
    const modelId =
      preset === 'default' ? getDefaultModelId() : readEnvModel(envVar) ?? null;

    return {
      preset: preset as ModelPreset,
      envVar,
      modelId,
      configured: preset === 'default' ? Boolean(modelId) : Boolean(readEnvModel(envVar)),
    };
  });
}
