import { useCallback, useRef } from 'react';
import {
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Share from 'react-native-share';

import { AlternativeMatches } from '@/components/result/AlternativeMatches';
import { CuriosityCardItem } from '@/components/result/CuriosityCardItem';
import { AppText, Button } from '@/components/ui/Button';
import {
  ConfidenceBadge,
  isLowConfidence,
} from '@/components/ui/ConfidenceBadge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Screen } from '@/components/ui/Screen';
import type { ResultScreenProps } from '@/navigation/types';
import { formatCurrency } from '@/services/locale/currency';
import { colors, spacing, typography } from '@/theme';

export function ResultScreen({ navigation, route }: ResultScreenProps) {
  const { result } = route.params;
  const scrollRef = useRef<ScrollView>(null);
  const cardsOffset = useRef(0);

  const handleExplore = useCallback(() => {
    scrollRef.current?.scrollTo({ y: cardsOffset.current, animated: true });
  }, []);

  const handleShare = useCallback(async () => {
    const message = [
      result.objectName,
      `Worth about ${formatCurrency(result.estimatedValue, result.currencyCode)}`,
      `${result.confidence}% confidence`,
      '',
      result.wowInsight,
    ].join('\n');

    try {
      await Share.open({
        message,
        title: result.objectName,
      });
    } catch {
      // user dismissed share sheet
    }
  }, [result]);

  const handleAlternativeSelect = useCallback(
    (name: string) => {
      navigation.replace('Search', { initialQuery: name });
    },
    [navigation],
  );

  const onCardsLayout = useCallback((event: LayoutChangeEvent) => {
    cardsOffset.current = event.nativeEvent.layout.y;
  }, []);

  const lowConfidence = isLowConfidence(result.confidence);

  return (
    <Screen padded={false}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button label="Back" variant="ghost" onPress={() => navigation.goBack()} />
          <Button label="Share" variant="ghost" onPress={() => void handleShare()} />
        </View>

        {result.heroImageUri ? (
          <Image source={{ uri: result.heroImageUri }} style={styles.hero} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <AppText style={styles.heroPlaceholderText}>✨</AppText>
          </View>
        )}

        <View style={styles.body}>
          <AppText style={styles.appears}>This appears to be</AppText>
          <AppText style={styles.objectName}>{result.objectName}</AppText>

          {result.modelId ? (
            <AppText style={styles.modelMeta}>
              Model: {result.modelPreset ?? 'custom'} · {result.modelId}
            </AppText>
          ) : null}

          <GlassCard style={styles.valueCard}>
            <AppText style={styles.valueLabel}>Worth about</AppText>
            <AppText style={styles.value}>
              {formatCurrency(result.estimatedValue, result.currencyCode)}
            </AppText>
            <ConfidenceBadge confidence={result.confidence} />
          </GlassCard>

          {lowConfidence ? (
            <GlassCard style={styles.warningCard}>
              <AppText style={styles.warningTitle}>We're not fully sure</AppText>
              <AppText style={styles.warningBody}>
                Try a clearer photo, or tap an alternative match below to search
                again.
              </AppText>
              <Button
                label="Search manually"
                variant="secondary"
                onPress={() =>
                  navigation.navigate('Search', { initialQuery: result.objectName })
                }
              />
            </GlassCard>
          ) : null}

          <GlassCard>
            <AppText style={styles.insightLabel}>Did you know?</AppText>
            <AppText style={styles.insight}>{result.wowInsight}</AppText>
          </GlassCard>

          {result.explanation.summary ? (
            <GlassCard>
              <AppText style={styles.sectionLabel}>Why we think so</AppText>
              <AppText style={styles.summary}>{result.explanation.summary}</AppText>
              {result.explanation.features.map(feature => (
                <AppText key={feature} style={styles.feature}>
                  • {feature}
                </AppText>
              ))}
            </GlassCard>
          ) : null}

          <AlternativeMatches
            matches={result.alternativeMatches}
            onSelect={handleAlternativeSelect}
          />

          <View onLayout={onCardsLayout} style={styles.cardsSection}>
            <AppText style={styles.sectionLabel}>Explore deeper</AppText>
            {result.curiosityCards.map(card => (
              <CuriosityCardItem key={card.id} card={card} />
            ))}
          </View>

          <View style={styles.actions}>
            <Button label="Explore" fullWidth onPress={handleExplore} />
            <Button
              label="Scan something else"
              variant="secondary"
              fullWidth
              onPress={() => navigation.navigate('Camera')}
            />
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  hero: {
    width: '100%',
    height: 280,
    backgroundColor: colors.surface,
  },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlaceholderText: {
    fontSize: 56,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.lg,
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
    marginTop: -spacing.sm,
  },
  modelMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.sm,
  },
  valueCard: {
    gap: spacing.sm,
  },
  valueLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  value: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 36,
    lineHeight: 40,
  },
  warningCard: {
    gap: spacing.sm,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  warningTitle: {
    ...typography.bodyStrong,
    color: colors.warning,
  },
  warningBody: {
    ...typography.body,
    color: colors.textSecondary,
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
  summary: {
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
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
