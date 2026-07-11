import type { ThemeColors, ThemeMode } from './types';

export const darkColors: ThemeColors = {
  background: '#121214',
  surface: '#1A1A1D',
  surfaceElevated: '#222226',
  border: 'rgba(255, 255, 255, 0.09)',
  borderGold: 'rgba(212, 175, 55, 0.2)',
  textPrimary: '#F7F3EA',
  textSecondary: 'rgba(247, 243, 234, 0.7)',
  textMuted: 'rgba(247, 243, 234, 0.45)',
  accent: '#D4AF37',
  accentLight: '#E8CF7A',
  accentDark: '#9A7B2F',
  accentSoft: 'rgba(212, 175, 55, 0.14)',
  textOnAccent: '#0A0A0B',
  success: '#4ADE80',
  warning: '#E8B84A',
  danger: '#E07A6A',
  glass: 'rgba(255, 255, 255, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.62)',
  dangerSoft: 'rgba(224, 122, 106, 0.14)',
  shadow: '#000000',
};

// Light palette: neutral 60%, restrained gold accent (~10%), WCAG-friendly contrast.
// Inspired by iOS/Material guidance — soft gray base, white surfaces, depth via shadow.
export const lightColors: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: 'rgba(60, 60, 67, 0.12)',
  borderGold: 'rgba(60, 60, 67, 0.12)',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#8E8E93',
  accent: '#8A6F1F',
  accentLight: '#1C1C1E',
  accentDark: '#6B5618',
  accentSoft: 'rgba(138, 111, 31, 0.07)',
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
