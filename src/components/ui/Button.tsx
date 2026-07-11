import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  TextProps,
  ViewStyle,
} from 'react-native';

import { colors, spacing, typography } from '@/theme';

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
      <Text style={[styles.label, styles[`${variant}Label` as const]]}>{label}</Text>
    </Pressable>
  );
}

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[styles.text, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...typography.bodyStrong,
  },
  primaryLabel: {
    color: colors.textPrimary,
  },
  secondaryLabel: {
    color: colors.textPrimary,
  },
  ghostLabel: {
    color: colors.accent,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
