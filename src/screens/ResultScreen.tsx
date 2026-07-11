import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Share from 'react-native-share';

import { AccuracyFeedback } from '@/components/result/AccuracyFeedback';
import { AlternativeMatches } from '@/components/result/AlternativeMatches';
import { CuriosityCardItem } from '@/components/result/CuriosityCardItem';
import { ProductListings } from '@/components/result/ProductListings';
import { AppText, Button } from '@/components/ui/Button';
import {
  ConfidenceBadge,
} from '@/components/ui/ConfidenceBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import type { ResultScreenProps } from '@/navigation/types';
import { formatCurrency } from '@/services/locale/currency';
import { resolveListings } from '@/services/listings/buildListings';
import { updateScanAccuracy } from '@/services/storage/scanHistory';
import type { UserAccuracy } from '@/types/scan';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

export function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { result: initialResult } = route.params;
  const [userAccuracy, setUserAccuracy] = useState<UserAccuracy | undefined>(
    initialResult.userAccuracy,
  );

  const listings = resolveListings(initialResult.objectName, initialResult.listings);

  const handleShare = useCallback(async () => {
    const message = [
      initialResult.objectName,
      `Worth about ${formatCurrency(initialResult.estimatedValue, initialResult.currencyCode)}`,
      `${initialResult.confidence}% confidence`,
      '',
      initialResult.wowInsight,
    ].join('\n');

    try {
      await Share.open({
        message,
        title: initialResult.objectName,
      });
    } catch {
      // user dismissed share sheet
    }
  }, [initialResult]);

  const handleAlternativeSelect = useCallback(
    (name: string) => {
      navigation.replace('Search', { initialQuery: name });
    },
    [navigation],
  );

  const handleAccuracyChange = useCallback(
    (accuracy: UserAccuracy) => {
      setUserAccuracy(accuracy);
      updateScanAccuracy(initialResult.id, accuracy);
    },
    [initialResult.id],
  );

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
          <Button label="Share" variant="ghost" onPress={() => void handleShare()} />
        </View>

        {initialResult.heroImageUri ? (
          <Image source={{ uri: initialResult.heroImageUri }} style={styles.hero} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <AppText style={styles.heroPlaceholderText}>✨</AppText>
          </View>
        )}

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
                  {formatCurrency(initialResult.estimatedValue, initialResult.currencyCode)}
                </AppText>
              </View>
              <ConfidenceBadge confidence={initialResult.confidence} />
            </View>
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      marginBottom: spacing.sm,
    },
    hero: {
      width: '100%',
      height: 140,
      backgroundColor: colors.surface,
    },
    heroPlaceholder: {
      width: '100%',
      height: 120,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroPlaceholderText: {
      fontSize: 40,
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
  });
}
