import type { ThemeColors, ThemeMode } from './types';

/** Saturated logo stops — used in spectrum CTAs on both themes */
export const brandStops = {
  gold: '#FFB020',
  magenta: '#FF3D8A',
  violet: '#6B5CFF',
  teal: '#00D4C8',
} as const;

export const darkColors: ThemeColors = {
  background: '#0A0E18',
  surface: '#121722',
  surfaceElevated: '#1A2233',
  border: 'rgba(244, 246, 251, 0.1)',
  borderAccent: 'rgba(0, 212, 200, 0.22)',
  borderGold: 'rgba(0, 212, 200, 0.22)',
  textPrimary: '#F4F6FB',
  textSecondary: 'rgba(244, 246, 251, 0.7)',
  textMuted: 'rgba(244, 246, 251, 0.45)',
  accent: '#00D4C8',
  accentLight: '#5EEAE2',
  accentDark: '#00A89E',
  accentSoft: 'rgba(0, 212, 200, 0.14)',
  accentMagenta: '#FF3D8A',
  valueAccent: '#FFB020',
  textOnAccent: '#0A0E18',
  success: '#4ADE80',
  warning: '#E8B84A',
  danger: '#E07A6A',
  glass: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  dangerSoft: 'rgba(224, 122, 106, 0.14)',
  shadow: '#000000',
};

export const lightColors: ThemeColors = {
  background: '#F2F4F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: 'rgba(60, 60, 67, 0.12)',
  borderAccent: 'rgba(10, 168, 158, 0.28)',
  borderGold: 'rgba(10, 168, 158, 0.28)',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#8E8E93',
  accent: '#0AA89E',
  accentLight: '#0D7F78',
  accentDark: '#087F77',
  accentSoft: 'rgba(10, 168, 158, 0.08)',
  accentMagenta: '#E11D70',
  valueAccent: '#C78A00',
  textOnAccent: '#FFFFFF',
  success: '#248A3D',
  warning: '#B8720A',
  danger: '#C9342A',
  glass: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.32)',
  dangerSoft: 'rgba(201, 52, 42, 0.08)',
  shadow: '#000000',
};

export const palettes: Record<ThemeMode, ThemeColors> = {
  light: lightColors,
  dark: darkColors,
};
