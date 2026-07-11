import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radii, spacing } from '@/theme';

type GlassCardProps = ViewProps & {
  elevated?: boolean;
};

export function GlassCard({
  children,
  style,
  elevated = false,
  ...props
}: GlassCardProps) {
  return (
    <View
      style={[styles.base, elevated && styles.elevated, style]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
});
