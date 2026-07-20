import { useState } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { SpectrumFill } from '@/components/brand/Spectrum';
import { useTheme } from '@/context/ThemeContext';
import { brandStops, spacing, typography } from '@/theme';
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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onLayout={
        isPrimary
          ? event => {
              const { width, height } = event.nativeEvent.layout;
              setSize(prev =>
                prev.width === width && prev.height === height
                  ? prev
                  : { width, height },
              );
            }
          : undefined
      }
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}>
      {isPrimary ? (
        size.width > 0 ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <SpectrumFill
              width={size.width}
              height={size.height}
              borderRadius={16}
            />
          </View>
        ) : (
          <View
            style={[StyleSheet.absoluteFill, styles.primaryFallback]}
            pointerEvents="none"
          />
        )
      ) : null}
      <Text
        style={[styles.label, styles[`${variant}Label` as const]]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

export { AppText } from '@/components/ui/AppText';

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      maxWidth: '100%',
      overflow: 'hidden',
    },
    fullWidth: {
      alignSelf: 'stretch',
    },
    primary: {
      backgroundColor: 'transparent',
      ...(isDark
        ? {
            shadowColor: brandStops.violet,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
          }
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.14,
            shadowRadius: 8,
            elevation: 3,
          }),
    },
    primaryFallback: {
      backgroundColor: colors.accent,
      borderRadius: 16,
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
      zIndex: 1,
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
  });
}
