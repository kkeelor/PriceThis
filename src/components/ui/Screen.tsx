import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { spacing } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ScreenProps = ViewProps & {
  padded?: boolean;
};

export function Screen({ children, style, padded = true, ...props }: ScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        style={[styles.container, padded && styles.padded, style]}
        {...props}>
        {children}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    padded: {
      paddingHorizontal: spacing.lg,
    },
  });
}
