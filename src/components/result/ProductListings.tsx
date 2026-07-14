import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import type { ProductListing } from '@/types/scan';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ProductListingsProps = {
  listings: ProductListing[];
};

const retailerEmoji: Record<string, string> = {
  Amazon: '🛒',
  Flipkart: '🛍️',
  eBay: '🏷️',
  Google: '🔎',
};

export function ProductListings({ listings }: ProductListingsProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  if (listings.length === 0) {
    return null;
  }

  const openListing = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // device cannot open URL
    }
  };

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>Find it online</AppText>
      <View style={styles.list}>
        {listings.map(listing => (
          <Pressable
            key={listing.id}
            accessibilityRole="link"
            accessibilityLabel={listing.title}
            onPress={() => void openListing(listing.url)}
            style={styles.row}>
            <View style={styles.iconWrap}>
              <AppText style={styles.icon}>
                {retailerEmoji[listing.retailer] ?? '🔗'}
              </AppText>
            </View>
            <View style={styles.copy}>
              <AppText style={styles.retailer}>{listing.retailer}</AppText>
              <AppText style={styles.title} numberOfLines={1}>
                {listing.title}
              </AppText>
            </View>
            <AppText style={styles.external}>↗</AppText>
          </Pressable>
        ))}
      </View>
      <AppText style={styles.disclaimer}>
        Opens the seller's site. Referral partnerships coming soon.
      </AppText>
    </View>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    label: {
      ...typography.label,
      color: colors.textMuted,
    },
    list: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderWidth: isDark ? 1 : StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...(isDark
        ? {}
        : {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
          }),
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 18,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    retailer: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    title: {
      ...typography.body,
      color: colors.textPrimary,
    },
    external: {
      ...typography.bodyStrong,
      color: colors.accent,
    },
    disclaimer: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 18,
    },
  });
}
