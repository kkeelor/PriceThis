import { StyleSheet, View } from 'react-native';

import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import type { ResultScreenProps } from '@/navigation/types';
import { formatCurrency } from '@/services/locale/currency';
import { colors, spacing, typography } from '@/theme';

export function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { result } = route.params;

  return (
    <Screen>
      <View style={styles.header}>
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
      </View>

      <View style={styles.content}>
        <AppText style={styles.objectName}>{result.objectName}</AppText>
        <AppText style={styles.valueLabel}>Worth about</AppText>
        <AppText style={styles.value}>
          {formatCurrency(result.estimatedValue, result.currencyCode)}
        </AppText>
        <AppText style={styles.confidence}>{result.confidence}% confidence</AppText>
        <AppText style={styles.insight}>{result.wowInsight}</AppText>
        <Button label="Explore" fullWidth onPress={() => {}} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.md,
  },
  objectName: {
    ...typography.title,
    color: colors.textPrimary,
  },
  valueLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.hero,
    color: colors.textPrimary,
  },
  confidence: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
  },
  insight: {
    ...typography.headline,
    color: colors.textPrimary,
  },
});
