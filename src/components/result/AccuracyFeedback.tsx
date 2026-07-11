import { Pressable, StyleSheet, View } from 'react-native';

import { CheckIcon } from '@/components/icons/CheckIcon';
import { XIcon } from '@/components/icons/XIcon';
import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { UserAccuracy } from '@/types/scan';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type AccuracyFeedbackProps = {
  value?: UserAccuracy;
  onChange: (value: UserAccuracy) => void;
};

const ICON_SIZE = 22;

export function AccuracyFeedback({ value, onChange }: AccuracyFeedbackProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  const correctColor = value === 'correct' ? colors.success : colors.textMuted;
  const incorrectColor = value === 'incorrect' ? colors.danger : colors.textMuted;

  return (
    <View style={styles.container}>
      <AppText style={styles.prompt}>Is this right?</AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Yes, this is correct"
          accessibilityState={{ selected: value === 'correct' }}
          onPress={() => onChange('correct')}
          style={[styles.choice, value === 'correct' && styles.choiceSelectedCorrect]}>
          <CheckIcon size={ICON_SIZE} color={correctColor} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="No, this is incorrect"
          accessibilityState={{ selected: value === 'incorrect' }}
          onPress={() => onChange('incorrect')}
          style={[styles.choice, value === 'incorrect' && styles.choiceSelectedIncorrect]}>
          <XIcon size={ICON_SIZE} color={incorrectColor} />
        </Pressable>
      </View>
      {value ? (
        <AppText style={styles.thanks}>
          {value === 'correct' ? 'Thanks — that helps us improve.' : "Got it — we'll learn from this."}
        </AppText>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    prompt: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    choice: {
      width: 56,
      height: 56,
      borderRadius: radii.pill,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
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
    choiceSelectedCorrect: {
      borderColor: colors.success,
      backgroundColor: 'rgba(36, 138, 61, 0.1)',
    },
    choiceSelectedIncorrect: {
      borderColor: colors.danger,
      backgroundColor: colors.dangerSoft,
    },
    thanks: {
      ...typography.caption,
      color: colors.textSecondary,
    },
  });
}
