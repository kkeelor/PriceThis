import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type SettingsDisclosureProps = {
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function SettingsDisclosure({
  title,
  summary,
  defaultOpen = false,
  children,
}: SettingsDisclosureProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const [open, setOpen] = useState(defaultOpen);

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
        <View style={styles.triggerText}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.summary} numberOfLines={1}>
            {summary}
          </AppText>
        </View>
        <AppText style={styles.chevron}>{open ? '▴' : '▾'}</AppText>
      </Pressable>

      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      borderRadius: radii.md,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
    triggerPressed: {
      opacity: 0.9,
    },
    triggerText: {
      flex: 1,
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
    chevron: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 2,
    },
    content: {
      borderRadius: radii.md,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.xs,
      overflow: 'hidden',
    },
  });
}
