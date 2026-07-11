import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { AppText, Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { useTheme } from '@/context/ThemeContext';
import { useScan } from '@/hooks/useScan';
import type { SearchScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function SearchScreen({ navigation, route }: SearchScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');

  const { isScanning, error, clearError, runTextScan } = useScan({
    onSuccess: result => {
      navigation.replace('Result', { result });
    },
    showErrorAlert: false,
  });

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }, []),
  );

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0 || isScanning) {
      return;
    }
    clearError();
    void runTextScan(trimmed);
  }, [clearError, isScanning, query, runTextScan]);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScanningOverlay visible={isScanning} message="Finding value…" />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
            <AppText style={styles.title}>Search</AppText>
          </View>

          <SearchBar
            inputRef={inputRef}
            value={query}
            placeholder="e.g. Rolex Daytona, iPhone 15 Pro"
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
          />

          {error ? (
            <GlassCard style={styles.errorCard}>
              <AppText style={styles.errorTitle}>Couldn't find a value</AppText>
              <AppText style={styles.errorBody}>{error}</AppText>
              <Button
                label="Try again"
                variant="secondary"
                onPress={handleSearch}
                disabled={isScanning || query.trim().length === 0}
              />
            </GlassCard>
          ) : null}

          <Button
            label={isScanning ? 'Searching…' : 'Find value'}
            fullWidth
            disabled={query.trim().length === 0 || isScanning}
            onPress={handleSearch}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    header: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    title: {
      ...typography.title,
      color: colors.textPrimary,
    },
    errorCard: {
      gap: spacing.sm,
      borderColor: colors.dangerSoft,
    },
    errorTitle: {
      ...typography.bodyStrong,
      color: colors.danger,
    },
    errorBody: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
}
