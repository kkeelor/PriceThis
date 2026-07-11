import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useScan } from '@/hooks/useScan';
import type { SearchScreenProps } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

export function SearchScreen({ navigation, route }: SearchScreenProps) {
  const [query, setQuery] = useState(route.params?.initialQuery ?? '');

  const { isScanning, runTextScan } = useScan({
    onSuccess: result => {
      navigation.replace('Result', { result });
    },
  });

  const handleSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      return;
    }
    void runTextScan(trimmed);
  }, [query, runTextScan]);

  return (
    <Screen>
      <ScanningOverlay visible={isScanning} message="Finding value…" />

      <View style={styles.header}>
        <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
        <AppText style={styles.title}>Search</AppText>
      </View>

      <TextInput
        autoFocus
        editable={!isScanning}
        placeholder="Ferrari F40, Rolex Daytona, Hermès Birkin…"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />

      <Button
        label={isScanning ? 'Searching…' : 'Find value'}
        fullWidth
        disabled={query.trim().length === 0 || isScanning}
        onPress={handleSearch}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
});
