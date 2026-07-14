import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextProps,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}>
      <Text style={[styles.label, styles[`${variant}Label` as const]]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

export function AppText({ style, ...props }: TextProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  return <Text style={[styles.text, style]} {...props} />;
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      maxWidth: '100%',
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    primary: {
      backgroundColor: colors.accent,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 2,
          }),
    },
    secondary: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    pressed: {
      opacity: 0.88,
    },
    disabled: {
      opacity: 0.45,
    },
    label: {
      ...typography.bodyStrong,
      textAlign: 'center',
      maxWidth: '100%',
    },
    primaryLabel: {
      color: colors.textOnAccent,
    },
    secondaryLabel: {
      color: colors.textPrimary,
    },
    ghostLabel: {
      color: isDark ? colors.accent : colors.textPrimary,
    },
    text: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
}
