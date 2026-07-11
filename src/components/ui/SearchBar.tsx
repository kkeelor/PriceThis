import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import type { RefObject } from 'react';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type SearchBarProps = {
  value?: string;
  placeholder?: string;
  editable?: boolean;
  onPress?: () => void;
  onChangeText?: TextInputProps['onChangeText'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  inputRef?: RefObject<TextInput | null>;
  returnKeyType?: TextInputProps['returnKeyType'];
  autoFocus?: boolean;
};

export function SearchBar({
  value = '',
  placeholder = 'Search by name…',
  editable = true,
  onPress,
  onChangeText,
  onSubmitEditing,
  inputRef,
  returnKeyType = 'search',
  autoFocus = false,
}: SearchBarProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  if (!editable && onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search by name"
        onPress={onPress}
        style={styles.shell}>
        <AppText style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={styles.shell}>
      <TextInput
        ref={inputRef}
        autoFocus={autoFocus}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        autoCorrect={false}
        autoCapitalize="words"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    shell: {
      minHeight: 52,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      justifyContent: 'center',
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }),
    },
    input: {
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: spacing.sm,
      width: '100%',
    },
    placeholder: {
      ...typography.body,
      color: colors.textMuted,
      paddingVertical: spacing.sm,
    },
  });
}
