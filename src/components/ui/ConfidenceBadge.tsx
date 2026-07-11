import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { colors, radii, spacing, typography } from '@/theme';

const LOW_CONFIDENCE = 70;

type ConfidenceBadgeProps = {
  confidence: number;
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const tone =
    confidence >= 85 ? 'high' : confidence >= LOW_CONFIDENCE ? 'medium' : 'low';

  return (
    <View style={[styles.badge, styles[tone]]}>
      <AppText style={[styles.label, styles[`${tone}Label` as const]]}>
        {confidence}% confidence
      </AppText>
    </View>
  );
}

export function isLowConfidence(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE;
}

const styles = StyleSheet.create({
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
    borderColor: 'rgba(124, 108, 255, 0.35)',
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
