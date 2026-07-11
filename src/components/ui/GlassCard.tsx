import { StyleSheet, View, ViewProps } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { radii, spacing } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type GlassCardProps = ViewProps & {
  elevated?: boolean;
};

export function GlassCard({
  children,
  style,
  elevated = false,
  ...props
}: GlassCardProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View
      style={[styles.base, elevated && styles.elevated, style]}
      {...props}>
      {children}
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    base: {
      backgroundColor: isDark ? colors.glass : colors.surface,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.lg,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }),
    },
    elevated: {
      backgroundColor: colors.surfaceElevated,
    },
  });
}
