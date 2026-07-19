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

function getDisplayConfidence({
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
      <AppText
        style={[styles.label, styles[`${tone}Label` as const]]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}>
        {confidence}% confidence
      </AppText>
    </View>
  );
}
function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      maxWidth: '100%',
      flexShrink: 1,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      maxWidth: '100%',
    },
    high: {
      backgroundColor: colors.accentSoft,
      borderColor: isDark ? colors.borderAccent : colors.borderAccent,
    },
    highLabel: {
      color: colors.accent,
    },
    medium: {
      backgroundColor: isDark
        ? 'rgba(255, 176, 32, 0.14)'
        : 'rgba(199, 138, 0, 0.1)',
      borderColor: isDark
        ? 'rgba(255, 176, 32, 0.35)'
        : 'rgba(199, 138, 0, 0.3)',
    },
    mediumLabel: {
      color: colors.valueAccent,
    },
    low: {
      backgroundColor: colors.dangerSoft,
      borderColor: isDark
        ? 'rgba(224, 122, 106, 0.35)'
        : 'rgba(201, 52, 42, 0.25)',
    },
    lowLabel: {
      color: colors.danger,
    },
  });
}
