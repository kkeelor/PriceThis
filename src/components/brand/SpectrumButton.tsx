import { useState } from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { SpectrumFill } from '@/components/brand/Spectrum';
import { useTheme } from '@/context/ThemeContext';
import { spacing, typography } from '@/theme';

type SpectrumButtonProps = PressableProps & {
  label: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Primary CTA with logo spectrum fill. */
export function SpectrumButton({
  label,
  fullWidth = false,
  style,
  disabled,
  ...props
}: SpectrumButtonProps) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setSize(prev =>
          prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      }}
      {...props}>
      {size.width > 0 ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <SpectrumFill
            width={size.width}
            height={size.height}
            borderRadius={16}
          />
        </View>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.accent, borderRadius: 16 },
          ]}
          pointerEvents="none"
        />
      )}
      <Text
        style={[styles.label, { color: colors.textOnAccent }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
