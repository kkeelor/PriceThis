import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Heart, Settings2 } from 'lucide-react-native';

import { FavoriteScanRow } from '@/components/favorites/FavoriteScanRow';
import { CategoryPickerModal } from '@/components/favorites/CategoryPickerModal';
import { AppText, Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useCurrency } from '@/context/CurrencyContext';
import { useTheme } from '@/context/ThemeContext';
import { useFavorites } from '@/hooks/useFavorites';
import type { FavoritesScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { colors, isDark } = useTheme();
  const { convertAndFormat } = useCurrency();
  const styles = createStyles(colors, isDark);
  const {
    categories,
    groups,
    categoryTotals,
    portfolioTotal,
    favoriteCount,
    moveFavorite,
  } = useFavorites();

  const [categoryPickerScanId, setCategoryPickerScanId] = useState<string | null>(null);
  const selectedRecordCategoryId = categoryPickerScanId
    ? groups
        .flatMap(group => group.scans.map(scan => ({ scan, categoryId: group.category.id })))
        .find(item => item.scan.id === categoryPickerScanId)?.categoryId
    : undefined;

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (categoryPickerScanId) {
        moveFavorite(categoryPickerScanId, categoryId);
      }
      setCategoryPickerScanId(null);
    },
    [categoryPickerScanId, moveFavorite],
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <AppText style={styles.title}>Favorites</AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Manage categories"
              onPress={() => navigation.navigate('CategoryManager')}
              style={styles.manageButton}>
              <Settings2 color={colors.textMuted} size={20} strokeWidth={2} />
            </Pressable>
          </View>
          <AppText style={styles.subtitle}>
            {favoriteCount === 0
              ? 'Save finds with the heart on any result.'
              : `${favoriteCount} saved ${favoriteCount === 1 ? 'item' : 'items'}`}
          </AppText>
        </View>

        {favoriteCount === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Heart color={colors.accent} size={32} strokeWidth={1.75} />
            <AppText style={styles.emptyTitle}>No favorites yet</AppText>
            <AppText style={styles.emptyBody}>
              Tap the heart on a scan result to save it here. Organize saved items into categories
              and track your portfolio value.
            </AppText>
            <Button
              label="Find something to save"
              variant="secondary"
              fullWidth
              onPress={() => navigation.navigate('Home')}
            />
          </GlassCard>
        ) : (
          <>
            <GlassCard style={styles.portfolioCard}>
              <AppText style={styles.portfolioLabel}>Total portfolio value</AppText>
              <AppText style={styles.portfolioValue} numberOfLines={1} adjustsFontSizeToFit>
                {convertAndFormat(portfolioTotal)}
              </AppText>
              <AppText style={styles.portfolioHint}>
                Combined value of all favorites in your display currency
              </AppText>
            </GlassCard>

            {groups.map(group => {
              const subtotal = categoryTotals.find(
                item => item.category.id === group.category.id,
              );

              return (
                <View key={group.category.id} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <AppText style={styles.sectionTitle}>{group.category.name}</AppText>
                    <AppText style={styles.sectionTotal}>
                      {convertAndFormat(subtotal?.totalValue ?? 0)}
                    </AppText>
                  </View>
                  <View style={styles.list}>
                    {group.scans.map(scan => (
                      <FavoriteScanRow
                        key={scan.id}
                        scan={scan}
                        categoryName={group.category.name}
                        onPress={() => navigation.navigate('Result', { result: scan })}
                        onChangeCategory={() => setCategoryPickerScanId(scan.id)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <CategoryPickerModal
        visible={categoryPickerScanId != null}
        categories={categories}
        selectedCategoryId={selectedRecordCategoryId}
        title="Move to category"
        onSelect={handleCategorySelect}
        onClose={() => setCategoryPickerScanId(null)}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    scroll: {
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    header: {
      marginTop: spacing.md,
      gap: spacing.xs,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      ...typography.title,
      color: isDark ? colors.accentLight : colors.textPrimary,
    },
    manageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    emptyBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    portfolioCard: {
      gap: spacing.xs,
      borderColor: isDark ? colors.borderGold : colors.border,
    },
    portfolioLabel: {
      ...typography.label,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    portfolioValue: {
      ...typography.hero,
      color: isDark ? colors.accentLight : colors.textPrimary,
      fontSize: 34,
      lineHeight: 38,
    },
    portfolioHint: {
      ...typography.caption,
      color: colors.textMuted,
    },
    section: {
      gap: spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flex: 1,
    },
    sectionTotal: {
      ...typography.bodyStrong,
      color: colors.accent,
    },
    list: {
      gap: spacing.sm,
    },
  });
}
