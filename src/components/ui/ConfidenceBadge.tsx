import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

const LOW_CONFIDENCE = 70;
const HIGH_CONFIDENCE = 85;

type ConfidenceInput = {
  confidence: number;
  identificationConfidence?: number;
  valuationConfidence?: number;
};

export function getDisplayConfidence({
  confidence,
  identificationConfidence,
  valuationConfidence,
}: ConfidenceInput): number {
  if (
    identificationConfidence !== undefined &&
    valuationConfidence !== undefined
  ) {
    return Math.min(identificationConfidence, valuationConfidence);
  }
  return confidence;
}

type ConfidenceBadgeProps = ConfidenceInput;

export function ConfidenceBadge(props: ConfidenceBadgeProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const confidence = getDisplayConfidence(props);
  const tone =
    confidence >= HIGH_CONFIDENCE
      ? 'high'
      : confidence >= LOW_CONFIDENCE
        ? 'medium'
        : 'low';

  return (
    <View style={[styles.badge, styles[tone]]}>
      <AppText style={[styles.label, styles[`${tone}Label` as const]]}>
        {confidence}% confidence
      </AppText>
    </View>
  );
}

export function isLowConfidence(input: ConfidenceInput): boolean {
  return getDisplayConfidence(input) < LOW_CONFIDENCE;
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
    },
    high: {
      backgroundColor: 'rgba(74, 222, 128, 0.12)',
      borderColor: 'rgba(74, 222, 128, 0.35)',
    },
    highLabel: {
      color: colors.success,
    },
    medium: {
      backgroundColor: colors.accentSoft,
      borderColor: isDark ? colors.borderGold : colors.border,
    },
    mediumLabel: {
      color: colors.accent,
    },
    low: {
      backgroundColor: 'rgba(251, 191, 36, 0.12)',
      borderColor: 'rgba(251, 191, 36, 0.35)',
    },
    lowLabel: {
      color: colors.warning,
    },
  });
}
