import { Image, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';
import type { ScanResult } from '@/types/scan';

type ShareResultCardProps = {
  result: ScanResult;
  formattedValue: string;
};

export function ShareResultCard({ result, formattedValue }: ShareResultCardProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.card}>
      {result.heroImageUri ? (
        <Image source={{ uri: result.heroImageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <AppText style={styles.placeholderEmoji}>✨</AppText>
        </View>
      )}

      <View style={styles.body}>
        <AppText style={styles.eyebrow}>Worth about</AppText>
        <AppText style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {formattedValue}
        </AppText>
        <AppText style={styles.name} numberOfLines={2}>
          {result.objectName}
        </AppText>
        <AppText style={styles.insight} numberOfLines={4}>
          {result.wowInsight}
        </AppText>

        <View style={styles.footer}>
          <Logo size="sm" />
          <AppText style={styles.brand}>PriceThis</AppText>
        </View>
      </View>
    </View>
  );
}

export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 480;

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      borderRadius: radii.xl,
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    image: {
      width: '100%',
      height: 200,
      backgroundColor: colors.surface,
    },
    imagePlaceholder: {
      width: '100%',
      height: 200,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderEmoji: {
      fontSize: 48,
    },
    body: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.xs,
      justifyContent: 'space-between',
    },
    eyebrow: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    value: {
      ...typography.hero,
      color: isDark ? colors.accentLight : colors.textPrimary,
      fontSize: 34,
      lineHeight: 38,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    insight: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    brand: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
  });
}
