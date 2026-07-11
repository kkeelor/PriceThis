import { TextStyle } from 'react-native';

export const typography = {
  hero: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  headline: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyStrong: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;
