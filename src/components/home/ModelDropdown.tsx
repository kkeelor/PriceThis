import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useModelPreset } from '@/context/ModelPresetContext';
import { useTheme } from '@/context/ThemeContext';
import {
  MODEL_PRESET_LABELS,
  MODEL_PRESETS,
  type ModelPreset,
} from '@/types/model';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function ModelDropdown() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { preset, setPreset } = useModelPreset();
  const [open, setOpen] = useState(false);

  const select = (option: ModelPreset) => {
    setPreset(option);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose AI model"
        onPress={() => setOpen(true)}
        style={styles.trigger}>
        <AppText style={styles.triggerLabel}>Model</AppText>
        <AppText style={styles.triggerValue} numberOfLines={1}>
          {MODEL_PRESET_LABELS[preset]}
        </AppText>
        <AppText style={styles.chevron}>▾</AppText>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.menu}>
            {MODEL_PRESETS.map((option: ModelPreset) => {
              const selected = preset === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => select(option)}
                  style={[styles.option, selected && styles.optionSelected]}>
                  <AppText style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {MODEL_PRESET_LABELS[option]}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      alignSelf: 'flex-start',
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      maxWidth: '100%',
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
    triggerLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    triggerValue: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
      flexShrink: 1,
    },
    chevron: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      padding: spacing.xl,
    },
    menu: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    option: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionSelected: {
      backgroundColor: colors.accentSoft,
    },
    optionText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    optionTextSelected: {
      color: colors.accent,
      fontWeight: '600',
    },
  });
}
