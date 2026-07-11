import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { formatCurrency } from '@/services/locale/currency';
import type { ScanResult } from '@/types/scan';
import { colors, radii, spacing, typography } from '@/theme';

type RecentScanRowProps = {
  scan: ScanResult;
  onPress: () => void;
};

const categoryEmoji: Record<ScanResult['category'], string> = {
  cars: '🚗',
  watches: '⌚',
  travel: '✈️',
  luxury: '💎',
  architecture: '🏛️',
  technology: '📱',
  collectibles: '🃏',
  art: '🎨',
  real_estate: '🏠',
  other: '✨',
};

export function RecentScanRow({ scan, onPress }: RecentScanRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.icon}>
        <AppText style={styles.emoji}>{categoryEmoji[scan.category]}</AppText>
      </View>
      <View style={styles.body}>
        <AppText style={styles.name} numberOfLines={1}>
          {scan.objectName}
        </AppText>
        <AppText style={styles.value}>
          {formatCurrency(scan.estimatedValue, scan.currencyCode)}
        </AppText>
      </View>
      <AppText style={styles.chevron}>›</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  value: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chevron: {
    ...typography.headline,
    color: colors.textMuted,
  },
});
