export const MODEL_PRESETS = [
  'default',
  'haiku',
  'fast',
  'sonnet',
  'quality',
  'opus',
] as const;

export type ModelPreset = (typeof MODEL_PRESETS)[number];

export const MODEL_PRESET_LABELS: Record<ModelPreset, string> = {
  default: 'Default',
  haiku: 'Haiku',
  fast: 'Fast',
  sonnet: 'Sonnet',
  quality: 'Quality',
  opus: 'Opus',
};

export const DEFAULT_MODEL_PRESET: ModelPreset = 'default';

export function isModelPreset(value: string): value is ModelPreset {
  return MODEL_PRESETS.includes(value as ModelPreset);
}
