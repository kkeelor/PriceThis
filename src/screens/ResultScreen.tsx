import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Heart } from 'lucide-react-native';

import { ResultHeroImage } from '@/components/result/ResultHeroImage';
import { AlternativeMatches } from '@/components/result/AlternativeMatches';
import { CuriosityCardItem } from '@/components/result/CuriosityCardItem';
import { ProductListings } from '@/components/result/ProductListings';
import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  ShareResultCard,
} from '@/components/result/ShareResultCard';
import { CategoryPickerModal } from '@/components/favorites/CategoryPickerModal';
import { AppText, Button } from '@/components/ui/Button';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useFavorites } from '@/hooks/useFavorites';
import { useScan } from '@/hooks/useScan';
import type { ResultScreenProps } from '@/navigation/types';
import { resolveListings } from '@/services/listings/buildListings';
import { captureAndShareResultCard } from '@/services/share/shareResultCard';
import { updateScanAccuracy } from '@/services/storage/scanHistory';
import type { UserAccuracy } from '@/types/scan';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { colors } = useTheme();
  const { convertAndFormat } = useCurrency();
  const styles = createStyles(colors);
  const { result: initialResult } = route.params;
  const shareCardRef = useRef<View>(null);
  const {
    categories,
    isFavorite,
    getFavoriteRecord,
    toggleFavorite,
    moveFavorite,
    refresh: refreshFavorites,
  } = useFavorites();

  const [userAccuracy, setUserAccuracy] = useState<UserAccuracy | undefined>(
    initialResult.userAccuracy,
  );
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const { isScanning, runTextScanWithHero } = useScan({
    onSuccess: result => {
      navigation.replace('Result', { result });
    },
  });

  const saved = isFavorite(initialResult.id);
  const favoriteRecord = getFavoriteRecord(initialResult.id);
  const formattedValue = convertAndFormat(
    initialResult.estimatedValue,
    initialResult.currencyCode,
  );
  const listings = resolveListings(initialResult.objectName, initialResult.listings);

  const handleShare = useCallback(async () => {
    try {
      await captureAndShareResultCard(shareCardRef.current, initialResult, formattedValue);
    } catch {
      // user dismissed share sheet
    }
  }, [formattedValue, initialResult]);

  const handleAlternativeSelect = useCallback(
    (name: string) => {
      void runTextScanWithHero(name, initialResult.heroImageUri);
    },
    [initialResult.heroImageUri, runTextScanWithHero],
  );

  const handleAccuracyChange = useCallback(
    (accuracy: UserAccuracy) => {
      setUserAccuracy(accuracy);
      updateScanAccuracy(initialResult.id, accuracy);
    },
    [initialResult.id],
  );

  const handleHeartPress = useCallback(() => {
    if (saved) {
      toggleFavorite(initialResult.id);
      return;
    }

    toggleFavorite(initialResult.id);
    refreshFavorites();
  }, [initialResult.id, refreshFavorites, saved, toggleFavorite]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      if (saved) {
        moveFavorite(initialResult.id, categoryId);
      } else {
        toggleFavorite(initialResult.id, categoryId);
      }
      setCategoryPickerOpen(false);
    },
    [initialResult.id, moveFavorite, saved, toggleFavorite],
  );

  return (
    <Screen padded={false}>
      <ScanningOverlay visible={isScanning} message="Re-estimating value…" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Remove from favorites' : 'Add to favorites'}
              onPress={handleHeartPress}
              onLongPress={() => setCategoryPickerOpen(true)}
              style={styles.heartButton}>
              <Heart
                color={saved ? colors.danger : colors.textMuted}
                fill={saved ? colors.danger : 'transparent'}
                size={22}
                strokeWidth={2}
              />
            </Pressable>
            <Button label="Share" variant="ghost" onPress={() => void handleShare()} />
          </View>
        </View>

        <ResultHeroImage imageUri={initialResult.heroImageUri} objectName={initialResult.objectName} />

        <View style={styles.body}>
          <View style={styles.summary}>
            <AppText style={styles.appears}>This appears to be</AppText>
            <AppText style={styles.objectName} numberOfLines={3}>
              {initialResult.objectName}
            </AppText>

            <View style={styles.valueRow}>
              <View style={styles.valueBlock}>
                <AppText style={styles.valueLabel}>Worth about</AppText>
                <AppText style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {formattedValue}
                </AppText>
              </View>
              <ConfidenceBadge confidence={initialResult.confidence} />
            </View>

            {saved && favoriteRecord ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setCategoryPickerOpen(true)}
                style={styles.savedCategory}>
                <AppText style={styles.savedCategoryText}>
                  Saved in{' '}
                  {categories.find(category => category.id === favoriteRecord.categoryId)?.name ??
                    'General'}
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <AccuracyFeedback value={userAccuracy} onChange={handleAccuracyChange} />

          <ProductListings listings={listings} />

          <View style={styles.divider} />

          <GlassCard>
            <AppText style={styles.insightLabel}>Did you know?</AppText>
            <AppText style={styles.insight}>{initialResult.wowInsight}</AppText>
          </GlassCard>

          {initialResult.explanation.summary ? (
            <GlassCard>
              <AppText style={styles.sectionLabel}>Why we think so</AppText>
              <AppText style={styles.explanationSummary}>{initialResult.explanation.summary}</AppText>
              {initialResult.explanation.features.map(feature => (
                <AppText key={feature} style={styles.feature}>
                  • {feature}
                </AppText>
              ))}
            </GlassCard>
          ) : null}

          <AlternativeMatches
            matches={initialResult.alternativeMatches}
            onSelect={handleAlternativeSelect}
          />

          <View style={styles.cardsSection}>
            <AppText style={styles.sectionLabel}>Explore deeper</AppText>
            {initialResult.curiosityCards.map(card => (
              <CuriosityCardItem key={card.id} card={card} />
            ))}
          </View>

          <Button
            label="Scan something else"
            variant="secondary"
            fullWidth
            onPress={() => navigation.navigate('Camera')}
          />
        </View>
      </ScrollView>

      <View pointerEvents="none" style={styles.offscreenCard}>
        <View ref={shareCardRef} collapsable={false}>
          <ShareResultCard result={initialResult} formattedValue={formattedValue} />
        </View>
      </View>

      <CategoryPickerModal
        visible={categoryPickerOpen}
        categories={categories}
        selectedCategoryId={favoriteRecord?.categoryId}
        title={saved ? 'Move to category' : 'Save to category'}
        onSelect={handleCategorySelect}
        onClose={() => setCategoryPickerOpen(false)}
      />
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: {
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      marginBottom: spacing.sm,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    heartButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.lg,
    },
    summary: {
      gap: spacing.xs,
    },
    appears: {
      ...typography.caption,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    objectName: {
      ...typography.title,
      color: colors.textPrimary,
      flexShrink: 1,
    },
    valueRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginTop: spacing.sm,
      flexWrap: 'wrap',
    },
    valueBlock: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    valueLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    value: {
      ...typography.hero,
      color: colors.textPrimary,
      fontSize: 34,
      lineHeight: 38,
    },
    savedCategory: {
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    savedCategoryText: {
      ...typography.caption,
      color: colors.accent,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    insightLabel: {
      ...typography.label,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    insight: {
      ...typography.headline,
      color: colors.textPrimary,
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    explanationSummary: {
      ...typography.body,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    feature: {
      ...typography.body,
      color: colors.textSecondary,
    },
    cardsSection: {
      gap: spacing.md,
    },
    offscreenCard: {
      position: 'absolute',
      left: -SHARE_CARD_WIDTH - 100,
      top: 0,
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      opacity: 0,
    },
  });
}
