import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Moon, Sun } from 'lucide-react-native';

import { AppUpdateSection } from '@/components/settings/AppUpdateSection';
import { CurrencySettingSection } from '@/components/settings/CurrencySettingSection';
import { ModelSettingSection } from '@/components/settings/ModelSettingSection';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/theme/types';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

function ThemeModeIcon({ mode, color }: { mode: ThemeMode; color: string }) {
  if (mode === 'light') {
    return <Sun size={18} color={color} strokeWidth={2} />;
  }

  return <Moon size={18} color={color} strokeWidth={2} />;
}

export function SettingsMenu() {
  const { colors, mode, setMode, isDark } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const styles = createStyles(colors, isDark, windowHeight);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Settings"
        hitSlop={10}
        onPress={() => setOpen(true)}
        style={styles.trigger}>
        <SettingsIcon size={20} color={colors.textSecondary} />
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <AppText style={styles.title}>Settings</AppText>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}>
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
                        <ThemeModeIcon
                          mode={option}
                          color={selected ? colors.accent : colors.textMuted}
                        />
                        <AppText style={[styles.themeLabel, selected && styles.themeLabelSelected]}>
                          {option === 'light' ? 'Light' : 'Dark'}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <ModelSettingSection />
              <CurrencySettingSection />
              <AppUpdateSection active={open} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean, windowHeight: number) {
  const sheetMaxHeight = Math.min(windowHeight * 0.82, 720);

  return StyleSheet.create({
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
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: sheetMaxHeight,
      backgroundColor: colors.surfaceElevated,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sheetHeader: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    scrollContent: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
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
  });
}
