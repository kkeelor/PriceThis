import { Pressable, StyleSheet, View } from 'react-native';

import { SettingsDisclosure } from '@/components/settings/SettingsDisclosure';
import { AppText } from '@/components/ui/Button';
import { useModelPreset } from '@/context/ModelPresetContext';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';
import {
  MODEL_PRESET_LABELS,
  MODEL_PRESETS,
  type ModelPreset,
} from '@/types/model';

export function ModelSettingSection() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const { preset, setPreset } = useModelPreset();

  return (
    <SettingsDisclosure
      title="AI model"
      summary={MODEL_PRESET_LABELS[preset]}>
      <View style={styles.list}>
        {MODEL_PRESETS.map((option: ModelPreset) => {
          const selected = preset === option;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPreset(option)}
              style={[styles.option, selected && styles.optionSelected]}>
              <AppText
                style={[styles.optionLabel, selected && styles.optionLabelSelected]}
                numberOfLines={2}>
                {MODEL_PRESET_LABELS[option]}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SettingsDisclosure>
  );
}

function createStyles(colors: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    list: {
      gap: spacing.xs,
    },
    option: {
      minHeight: 44,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
    },
    optionSelected: {
      backgroundColor: colors.accentSoft,
    },
    optionLabel: {
      ...typography.body,
      color: colors.textPrimary,
    },
    optionLabelSelected: {
      color: colors.accent,
      fontWeight: '600',
    },
  });
}
