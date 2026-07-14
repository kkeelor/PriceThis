import type { ThemeMode } from './types';
import { brandStops } from './palettes';

const spectrum = [
  brandStops.gold,
  brandStops.magenta,
  brandStops.violet,
  brandStops.teal,
] as const;

export const gradientsByMode: Record<
  ThemeMode,
  {
    spectrum: readonly string[];
    spectrumSoft: readonly string[];
    cta: readonly string[];
    surface: readonly string[];
  }
> = {
  dark: {
    spectrum,
    cta: spectrum,
    spectrumSoft: [
      'rgba(255, 176, 32, 0.12)',
      'rgba(255, 61, 138, 0.1)',
      'rgba(107, 92, 255, 0.08)',
      'rgba(0, 212, 200, 0.1)',
    ],
    surface: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
  },
  light: {
    spectrum,
    cta: spectrum,
    spectrumSoft: [
      'rgba(255, 176, 32, 0.08)',
      'rgba(255, 61, 138, 0.06)',
      'rgba(107, 92, 255, 0.05)',
      'rgba(0, 212, 200, 0.07)',
    ],
    surface: ['rgba(255,255,255,1)', 'rgba(242,244,248,1)'],
  },
};

/** @deprecated Prefer gradientsByMode via useTheme — defaults to dark spectrum */
export const gradients = {
  accent: spectrum,
  spectrum,
  spectrumSoft: gradientsByMode.dark.spectrumSoft,
  cta: spectrum,
  surface: gradientsByMode.dark.surface,
  heroGlow: ['rgba(0,212,200,0.28)', 'rgba(0,212,200,0)'],
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

/** Viewfinder corner colors matching logo brackets */
export const viewfinderCorners = {
  topLeft: brandStops.gold,
  topRight: brandStops.magenta,
  bottomLeft: brandStops.teal,
  bottomRight: brandStops.violet,
} as const;
