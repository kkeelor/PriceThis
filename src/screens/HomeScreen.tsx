import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { RecentScanRow } from '@/components/home/RecentScanRow';
import { ModelSwitcher } from '@/components/home/ModelSwitcher';
import { AppText, Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { Screen } from '@/components/ui/Screen';
import { useRecentScans } from '@/hooks/useRecentScans';
import { useScan } from '@/hooks/useScan';
import type { HomeScreenProps } from '@/navigation/types';
import { colors, radii, spacing, typography } from '@/theme';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { scans } = useRecentScans();
  const { isScanning, runImageScan } = useScan({
    onSuccess: result => {
      navigation.navigate('Result', { result });
    },
  });

  const handleGalleryUpload = useCallback(async () => {
    const picked = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.7,
      maxWidth: 1280,
      selectionLimit: 1,
    });

    if (picked.didCancel) {
      return;
    }

    const asset = picked.assets?.[0];
    if (!asset?.base64) {
      Alert.alert('Could not read image', 'Try another photo from your gallery.');
      return;
    }

    await runImageScan(asset.base64, {
      heroImageUri: asset.uri,
      source: 'gallery',
    });
  }, [runImageScan]);

  return (
    <Screen>
      <ScanningOverlay visible={isScanning} message="Analyzing your photo…" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText style={styles.logo}>PriceThis</AppText>
          <AppText style={styles.tagline}>The Shazam for expensive things.</AppText>
        </View>

        <Pressable onPress={() => navigation.navigate('Search')}>
          <TextInput
            editable={false}
            pointerEvents="none"
            placeholder="What do you want to know the price of?"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </Pressable>

        <ModelSwitcher />

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
            disabled={isScanning}
            onPress={() => void handleGalleryUpload()}
          />
        </View>

        <View style={styles.recentSection}>
          <AppText style={styles.sectionLabel}>Recent scans</AppText>
          {scans.length === 0 ? (
            <GlassCard>
              <AppText style={styles.emptyState}>
                Your discoveries will appear here after your first scan.
              </AppText>
            </GlassCard>
          ) : (
            <View style={styles.recentList}>
              {scans.map(item => (
                <RecentScanRow
                  key={item.id}
                  scan={item}
                  onPress={() => navigation.navigate('Result', { result: item })}
                />
              ))}
            </View>
          )}
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
    borderRadius: radii.md,
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
    flex: 1,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  emptyState: {
    ...typography.body,
    color: colors.textSecondary,
  },
  recentList: {
    gap: spacing.sm,
  },
});
