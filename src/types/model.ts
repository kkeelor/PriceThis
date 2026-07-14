export const MODEL_PRESETS = [
  'default',
  'haiku',
  'fast',
  'gemini',
  'sonnet',
  'quality',
  'opus',
] as const;

export type ModelPreset = (typeof MODEL_PRESETS)[number];

export const MODEL_PRESET_LABELS: Record<ModelPreset, string> = {
  default: 'Default (Gemini Flash-Lite)',
  haiku: 'Claude Haiku',
  fast: 'Claude Fast',
  gemini: 'Gemini Flash-Lite',
  sonnet: 'Claude Sonnet',
  quality: 'Claude Quality',
  opus: 'Claude Opus',
};

export const DEFAULT_MODEL_PRESET: ModelPreset = 'gemini';

export function isModelPreset(value: string): value is ModelPreset {
  return MODEL_PRESETS.includes(value as ModelPreset);
}
