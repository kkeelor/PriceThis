import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppUpdateSection } from '@/components/settings/AppUpdateSection';
import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/theme/types';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

function SettingsIcon({ color }: { color: string }) {
  return (
    <View style={iconStyles.wrap}>
      <View style={[iconStyles.gear, { borderColor: color }]}>
        <View style={[iconStyles.hole, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ThemeModeIcon({ mode, color }: { mode: ThemeMode; color: string }) {
  if (mode === 'light') {
    return <AppText style={[iconStyles.glyph, { color }]}>☀</AppText>;
  }
  return <AppText style={[iconStyles.glyph, { color }]}>☾</AppText>;
}

export function SettingsMenu() {
  const { colors, mode, setMode, toggleMode, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const styles = createStyles(colors, isDark);

  return (
    <>
      <View style={styles.triggerWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={10}
          onPress={() => setOpen(true)}
          style={styles.trigger}>
          <SettingsIcon color={colors.textSecondary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          hitSlop={6}
          onPress={toggleMode}
          style={[styles.themeBadge, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <ThemeModeIcon mode={mode} color={colors.accent} />
        </Pressable>
      </View>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <AppText style={styles.title}>Settings</AppText>

            <View style={styles.section}>
              <AppText style={styles.sectionLabel}>Appearance</AppText>
              <View style={styles.themeRow}>
                {(['light', 'dark'] as ThemeMode[]).map(option => {
                  const selected = mode === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setMode(option)}
                      style={[styles.themeOption, selected && styles.themeOptionSelected]}>
                      <ThemeModeIcon mode={option} color={selected ? colors.accent : colors.textMuted} />
                      <AppText style={[styles.themeLabel, selected && styles.themeLabelSelected]}>
                        {option === 'light' ? 'Light' : 'Dark'}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <AppUpdateSection active={open} />

            <AppText style={styles.footerNote}>More settings coming soon.</AppText>
          </View>
        </View>
      </Modal>
    </>
  );
}

const iconStyles = StyleSheet.create({
  wrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hole: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  glyph: {
    fontSize: 11,
    lineHeight: 13,
  },
});

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    triggerWrap: {
      width: 40,
      height: 40,
    },
    trigger: {
      width: 40,
      height: 40,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
          }),
    },
    themeBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    section: {
      gap: spacing.sm,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    themeOptionSelected: {
      borderColor: isDark ? colors.borderGold : colors.accent,
      backgroundColor: colors.accentSoft,
    },
    themeLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    themeLabelSelected: {
      color: colors.accent,
    },
    footerNote: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
  });
}
