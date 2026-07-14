import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { ThemeColors } from '@/theme/types';

type ScreenProps = ViewProps & {
  padded?: boolean;
  /**
   * Include the bottom safe-area edge.
   * Keep false on tab screens (tab bar owns the inset). Prefer true on stack screens.
   */
  safeBottom?: boolean;
};

export function Screen({
  children,
  style,
  padded = true,
  safeBottom = false,
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const { horizontalGutter } = useResponsiveLayout();
  const styles = createStyles(colors);

  const edges = safeBottom
    ? (['top', 'left', 'right', 'bottom'] as const)
    : (['top', 'left', 'right'] as const);

  return (
    <SafeAreaView style={styles.safeArea} edges={[...edges]}>
      <View
        style={[
          styles.container,
          padded && { paddingHorizontal: horizontalGutter },
          style,
        ]}
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
  });
}
