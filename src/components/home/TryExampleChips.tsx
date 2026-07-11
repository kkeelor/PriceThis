import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { TRY_EXAMPLES } from '@/constants/tryExamples';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type TryExampleChipsProps = {
  onSelect: (query: string) => void;
};

export function TryExampleChips({ onSelect }: TryExampleChipsProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>Try an example</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {TRY_EXAMPLES.map(example => (
          <Pressable
            key={example}
            accessibilityRole="button"
            onPress={() => onSelect(example)}
            style={styles.chip}>
            <AppText style={styles.chipText} numberOfLines={1}>
              {example}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    row: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxWidth: 220,
    },
    chipText: {
      ...typography.caption,
      color: colors.textPrimary,
    },
  });
}
