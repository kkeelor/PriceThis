import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function ModelSettingSection() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.card}>
      <View style={styles.text}>
        <AppText style={styles.title}>AI model</AppText>
        <AppText style={styles.summary} numberOfLines={1}>
          Gemini Flash-Lite
        </AppText>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      minHeight: 56,
      borderRadius: radii.md,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
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
    text: {
      gap: 2,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    summary: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
}
