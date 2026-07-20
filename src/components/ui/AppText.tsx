import { StyleSheet, Text, TextProps } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { typography } from '@/theme';

export function AppText({ style, ...props }: TextProps) {
  const { colors } = useTheme();
  return <Text style={[styles.text, { color: colors.textPrimary }, style]} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    ...typography.body,
  },
});
