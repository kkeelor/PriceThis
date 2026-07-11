import { Image, Pressable, StyleSheet, View } from 'react-native';
import { FolderOpen } from 'lucide-react-native';

import { AppText } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import type { ScanResult } from '@/types/scan';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type FavoriteScanRowProps = {
  scan: ScanResult;
  categoryName: string;
  onPress: () => void;
  onChangeCategory: () => void;
};

const THUMB_SIZE = 52;

export function FavoriteScanRow({
  scan,
  categoryName,
  onPress,
  onChangeCategory,
}: FavoriteScanRowProps) {
  const { colors, isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const styles = createStyles(colors, isDark);
  const hasPhoto = Boolean(scan.heroImageUri);

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.thumb, !hasPhoto && styles.thumbFallback]}>
        {hasPhoto ? (
          <Image source={{ uri: scan.heroImageUri }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <AppText style={styles.emoji}>✨</AppText>
        )}
      </View>
      <View style={styles.body}>
        <AppText style={styles.name} numberOfLines={1}>
          {scan.objectName}
        </AppText>
        <AppText style={styles.value}>
          {convertAndFormat(scan.estimatedValue, scan.currencyCode)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Change category from ${categoryName}`}
          onPress={event => {
            event.stopPropagation();
            onChangeCategory();
          }}
          style={styles.categoryChip}>
          <FolderOpen color={colors.textMuted} size={12} strokeWidth={2} />
          <AppText style={styles.categoryText} numberOfLines={1}>
            {categoryName}
          </AppText>
        </Pressable>
      </View>
      <AppText style={styles.chevron}>›</AppText>
    </Pressable>
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
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    categoryText: {
      ...typography.caption,
      color: colors.textMuted,
      flexShrink: 1,
    },
    chevron: {
      ...typography.headline,
      color: colors.textMuted,
    },
  });
}
