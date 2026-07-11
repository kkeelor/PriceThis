import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { RecognitionMatch } from '@/types/scan';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type AlternativeMatchesProps = {
  matches: RecognitionMatch[];
  onSelect: (name: string) => void;
};

export function AlternativeMatches({ matches, onSelect }: AlternativeMatchesProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (matches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>Could also be</AppText>
      <View style={styles.row}>
        {matches.map(match => (
          <Pressable
            key={match.name}
            style={styles.chip}
            onPress={() => onSelect(match.name)}>
            <AppText style={styles.chipText}>{match.name}</AppText>
            <AppText style={styles.chipMeta}>{match.confidence}%</AppText>
          </Pressable>
        ))}
      </View>
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
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    chipText: {
      ...typography.caption,
      color: colors.textPrimary,
    },
    chipMeta: {
      ...typography.caption,
      color: colors.textMuted,
    },
  });
}
