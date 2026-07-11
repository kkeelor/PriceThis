import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import type { HomeScreenProps } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';

export function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText style={styles.logo}>PriceThis</AppText>
        <AppText style={styles.tagline}>The Shazam for expensive things.</AppText>
      </View>

      <TextInput
        placeholder="What do you want to know the price of?"
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        onFocus={() => navigation.navigate('Search')}
      />

      <View style={styles.actions}>
        <Button
          label="Open Camera"
          fullWidth
          onPress={() => navigation.navigate('Camera')}
        />
        <Button
          label="Upload from Gallery"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('Camera')}
        />
      </View>

      <View style={styles.recentSection}>
        <AppText style={styles.sectionLabel}>Recent scans</AppText>
        <AppText style={styles.emptyState}>
          Your discoveries will appear here after your first scan.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  logo: {
    ...typography.hero,
    color: colors.textPrimary,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  searchInput: {
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
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  recentSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  emptyState: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
