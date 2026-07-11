import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/Button';
import { ModelPresetProvider } from '@/context/ModelPresetContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

function AppShell() {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const styles = createStyles(colors);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {isReady ? (
        <ModelPresetProvider>
          <RootNavigator />
        </ModelPresetProvider>
      ) : (
        <View style={styles.loading}>
          <Logo size="lg" />
          <AppText style={styles.loadingTitle}>PriceThis</AppText>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      )}
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      backgroundColor: colors.background,
    },
    loadingTitle: {
      ...typography.title,
      color: colors.accent,
    },
  });
}
