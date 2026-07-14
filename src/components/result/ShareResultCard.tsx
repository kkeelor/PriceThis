import { Image, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/brand/Logo';
import { AppText } from '@/components/ui/Button';
import { brandStops, radii, spacing, typography } from '@/theme';
import type { ScanResult } from '@/types/scan';

type ShareResultCardProps = {
  result: ScanResult;
  formattedValue: string;
};

export function ShareResultCard({ result, formattedValue }: ShareResultCardProps) {
  const styles = stylesFixed;

  return (
    <View style={styles.card}>
      {result.heroImageUri ? (
        <Image source={{ uri: result.heroImageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <AppText style={styles.placeholderEmoji}>✨</AppText>
        </View>
      )}

      <View style={styles.body}>
        <AppText style={styles.eyebrow}>Worth about</AppText>
        <AppText style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {formattedValue}
        </AppText>
        <AppText style={styles.name} numberOfLines={2}>
          {result.objectName}
        </AppText>
        <AppText style={styles.insight} numberOfLines={4}>
          {result.wowInsight}
        </AppText>

        <View style={styles.footer}>
          <Logo size="sm" />
          <AppText style={styles.brand}>PriceThis</AppText>
        </View>
      </View>
    </View>
  );
}

export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 480;

const stylesFixed = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: '#0A0E18',
    borderWidth: 1,
    borderColor: 'rgba(244, 246, 251, 0.1)',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#121722',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0, 212, 200, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...typography.caption,
    color: 'rgba(244, 246, 251, 0.45)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    ...typography.hero,
    color: brandStops.gold,
    fontSize: 34,
    lineHeight: 38,
  },
  name: {
    ...typography.bodyStrong,
    color: '#F4F6FB',
  },
  insight: {
    ...typography.body,
    color: 'rgba(244, 246, 251, 0.7)',
    marginTop: spacing.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  brand: {
    ...typography.caption,
    color: 'rgba(244, 246, 251, 0.45)',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
