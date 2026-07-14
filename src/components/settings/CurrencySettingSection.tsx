import { Pressable, StyleSheet, View } from 'react-native';

import { SettingsDisclosure } from '@/components/settings/SettingsDisclosure';
import { AppText } from '@/components/ui/Button';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import { getCurrencyName, SUPPORTED_CURRENCIES } from '@/types/currency';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

function formatRatesUpdatedAt(timestamp: number | null): string {
  if (!timestamp) {
    return 'Rates not loaded yet';
  }

  return `Rates updated ${new Date(timestamp).toLocaleDateString()}`;
}

export function CurrencySettingSection() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const {
    currencyCode,
    setCurrency,
    ratesUpdatedAt,
    isLoadingRates,
    ratesError,
  } = useCurrency();

  return (
    <SettingsDisclosure
      title="Currency"
      summary={`${getCurrencyName(currencyCode)} (${currencyCode})`}>
      <AppText style={styles.meta}>
        {isLoadingRates ? 'Refreshing rates…' : formatRatesUpdatedAt(ratesUpdatedAt)}
      </AppText>
      {ratesError ? <AppText style={styles.error}>{ratesError}</AppText> : null}

      <View style={styles.list}>
        {SUPPORTED_CURRENCIES.map(option => {
          const selected = currencyCode === option.code;
          return (
            <Pressable
              key={option.code}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCurrency(option.code)}
              style={[styles.option, selected && styles.optionSelected]}>
              <AppText style={[styles.code, selected && styles.codeSelected]}>
                {option.code}
              </AppText>
              <AppText
                style={[styles.name, selected && styles.nameSelected]}
                numberOfLines={1}>
                {option.name}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SettingsDisclosure>
  );
}

function createStyles(colors: ThemeColors, _isDark: boolean) {
  return StyleSheet.create({
    meta: {
      ...typography.caption,
      color: colors.textMuted,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.xs,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      paddingHorizontal: spacing.sm,
    },
    list: {
      gap: spacing.xs,
      paddingTop: spacing.xs,
    },
    option: {
      minHeight: 44,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    optionSelected: {
      backgroundColor: colors.accentSoft,
    },
    code: {
      ...typography.caption,
      color: colors.textMuted,
      width: 40,
      fontWeight: '700',
    },
    codeSelected: {
      color: colors.accent,
    },
    name: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
    },
    nameSelected: {
      color: colors.accent,
      fontWeight: '600',
    },
  });
}
