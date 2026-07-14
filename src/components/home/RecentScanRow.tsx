import { Image, Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppText } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import type { ScanResult } from '@/types/scan';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type RecentScanRowProps = {
  scan: ScanResult;
  onPress: () => void;
  onDelete: () => void;
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

const DELETE_ACTION_WIDTH = 72;
const THUMB_SIZE = 52;

export function RecentScanRow({ scan, onPress, onDelete }: RecentScanRowProps) {
  const { colors, isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const styles = createStyles(colors, isDark);
  const hasPhoto = Boolean(scan.heroImageUri);

  return (
    <Swipeable
      overshootRight={false}
      friction={2}
      rightThreshold={DELETE_ACTION_WIDTH / 2}
      renderRightActions={() => (
        <Pressable
          accessibilityLabel={`Delete ${scan.objectName}`}
          accessibilityRole="button"
          onPress={onDelete}
          style={styles.deleteAction}>
          <AppText style={styles.trashIcon}>🗑</AppText>
        </Pressable>
      )}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={[styles.thumb, !hasPhoto && styles.thumbFallback]}>
          {hasPhoto ? (
            <Image
              source={{ uri: scan.heroImageUri }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
          ) : (
            <AppText style={styles.emoji}>{categoryEmoji[scan.category]}</AppText>
          )}
        </View>
        <View style={styles.body}>
          <AppText style={styles.name} numberOfLines={1}>
            {scan.objectName}
          </AppText>
          <AppText style={styles.value} numberOfLines={1}>
            {convertAndFormat(scan.estimatedValue, scan.currencyCode)}
          </AppText>
        </View>
        <AppText style={styles.chevron}>›</AppText>
      </Pressable>
    </Swipeable>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }),
    },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: radii.sm,
      overflow: 'hidden',
      backgroundColor: colors.accentSoft,
    },
    thumbFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbImage: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
    },
    emoji: {
      fontSize: 22,
    },
    body: {
      flex: 1,
      minWidth: 0,
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
    deleteAction: {
      width: DELETE_ACTION_WIDTH,
      marginLeft: spacing.sm,
      borderRadius: radii.md,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trashIcon: {
      fontSize: 22,
    },
  });
}
