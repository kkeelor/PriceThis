import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useModelPreset } from '@/context/ModelPresetContext';
import {
  MODEL_PRESET_LABELS,
  MODEL_PRESETS,
  type ModelPreset,
} from '@/types/model';
import { colors, radii, spacing, typography } from '@/theme';

export function ModelSwitcher() {
  const { preset, setPreset } = useModelPreset();

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>AI model for scans</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {MODEL_PRESETS.map((option: ModelPreset) => {
          const selected = preset === option;
          return (
            <Pressable
              key={option}
              onPress={() => setPreset(option)}
              style={[styles.chip, selected && styles.chipSelected]}>
              <AppText style={[styles.chipText, selected && styles.chipTextSelected]}>
                {MODEL_PRESET_LABELS[option]}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  row: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.accent,
  },
});
