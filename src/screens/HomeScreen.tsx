import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { Logo } from '@/components/brand/Logo';
import { ModelDropdown } from '@/components/home/ModelDropdown';
import { RecentScanRow } from '@/components/home/RecentScanRow';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { AppText, Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { useTheme } from '@/context/ThemeContext';
import { useRecentScans } from '@/hooks/useRecentScans';
import { useScan } from '@/hooks/useScan';
import type { HomeScreenProps } from '@/navigation/types';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

const CAMERA_BUTTON_SIZE = 88;

type ScanMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const scanMenuWidth = Math.min(screenWidth - spacing.lg * 2, 280);
  const styles = createStyles(colors, isDark);
  const cameraAnchorRef = useRef<View>(null);
  const { scans, refresh, deleteScan, clearAll } = useRecentScans();
  const [refreshing, setRefreshing] = useState(false);
  const [scanMenuOpen, setScanMenuOpen] = useState(false);
  const [scanMenuAnchor, setScanMenuAnchor] = useState<ScanMenuAnchor | null>(null);
  const { isScanning, runImageScan } = useScan({
    onSuccess: result => {
      navigation.navigate('Result', { result });
    },
  });

  const closeScanMenu = useCallback(() => {
    setScanMenuOpen(false);
    setScanMenuAnchor(null);
  }, []);

  const toggleScanMenu = useCallback(() => {
    if (scanMenuOpen) {
      closeScanMenu();
      return;
    }

    cameraAnchorRef.current?.measureInWindow((x, y, width, height) => {
      setScanMenuAnchor({ x, y, width, height });
      setScanMenuOpen(true);
    });
  }, [closeScanMenu, scanMenuOpen]);

  const handleGalleryUpload = useCallback(async () => {
    closeScanMenu();
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
  }, [closeScanMenu, runImageScan]);

  const handleOpenCamera = useCallback(() => {
    closeScanMenu();
    navigation.navigate('Camera');
  }, [closeScanMenu, navigation]);

  const handleClearAll = useCallback(() => {
    Alert.alert('Delete all?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: clearAll,
      },
    ]);
  }, [clearAll]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refresh();
    requestAnimationFrame(() => {
      setRefreshing(false);
    });
  }, [refresh]);

  return (
    <Screen>
      <ScanningOverlay visible={isScanning} message="Analyzing your photo…" />

      <View style={styles.topBar}>
        <SettingsMenu />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.surface}
          />
        }>
        <View style={styles.header}>
          <Logo size="md" style={styles.logoMark} />
          <AppText style={styles.wordmark} numberOfLines={1} adjustsFontSizeToFit>
            PriceThis
          </AppText>
          <AppText style={styles.tagline} numberOfLines={1}>
            The Shazam for prices.
          </AppText>
          <AppText style={styles.helper}>
            Point your camera or search by name to discover what things are worth.
          </AppText>
        </View>

        <SearchBar
          editable={false}
          placeholder="Search by name…"
          onPress={() => navigation.navigate('Search')}
        />

        <View style={styles.scanSection}>
          <View ref={cameraAnchorRef} collapsable={false} style={styles.cameraAnchor}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan or upload a photo"
              accessibilityState={{ expanded: scanMenuOpen }}
              onPress={toggleScanMenu}
              style={[styles.cameraButton, scanMenuOpen && styles.cameraButtonActive]}>
              <CameraIcon size={36} color={colors.textOnAccent} />
            </Pressable>
          </View>
          <AppText style={styles.cameraHint}>Tap to scan or upload</AppText>
        </View>

        <Modal
          transparent
          visible={scanMenuOpen}
          animationType="fade"
          onRequestClose={closeScanMenu}>
          <Pressable style={styles.scanMenuBackdrop} onPress={closeScanMenu}>
            {scanMenuAnchor ? (
              <Pressable
                style={[
                  styles.scanMenuAnchor,
                  {
                    top: scanMenuAnchor.y,
                    left: scanMenuAnchor.x,
                    width: scanMenuAnchor.width,
                    height: scanMenuAnchor.height,
                  },
                ]}
                onPress={() => {}}>
                <GlassCard style={[styles.scanMenu, { width: scanMenuWidth }]}>
                  <Button label="Open Camera" fullWidth onPress={handleOpenCamera} />
                  <Button
                    label="Upload from Gallery"
                    variant="secondary"
                    fullWidth
                    disabled={isScanning}
                    onPress={() => void handleGalleryUpload()}
                  />
                </GlassCard>
              </Pressable>
            ) : null}
          </Pressable>
        </Modal>

        <ModelDropdown />

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <AppText style={styles.sectionLabel}>Recent scans</AppText>
            {scans.length > 0 ? (
              <Pressable
                accessibilityLabel="Delete all recent scans"
                accessibilityRole="button"
                onPress={handleClearAll}
                hitSlop={8}
                style={styles.clearAllButton}>
                <AppText style={styles.trashHeaderIcon}>🗑</AppText>
              </Pressable>
            ) : null}
          </View>
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
                  onDelete={() => deleteScan(item.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.sm,
      marginBottom: -spacing.md,
    },
    scroll: {
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    header: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.sm,
      alignItems: 'center',
    },
    logoMark: {
      marginBottom: spacing.xs,
    },
    wordmark: {
      ...typography.title,
      color: isDark ? colors.accentLight : colors.textPrimary,
      letterSpacing: -0.4,
    },
    tagline: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    helper: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 320,
    },
    scanSection: {
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    cameraAnchor: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraButton: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      borderRadius: CAMERA_BUTTON_SIZE / 2,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.borderGold : 'transparent',
      shadowColor: isDark ? colors.accentDark : colors.shadow,
      shadowOpacity: isDark ? 0.45 : 0.16,
      shadowRadius: isDark ? 14 : 10,
      shadowOffset: { width: 0, height: isDark ? 6 : 4 },
      elevation: 8,
    },
    cameraButtonActive: {
      opacity: 0.92,
    },
    scanMenuBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    scanMenuAnchor: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraHint: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    scanMenu: {
      gap: spacing.sm,
    },
    recentSection: {
      gap: spacing.sm,
      flex: 1,
      marginTop: spacing.lg,
    },
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      ...typography.label,
      color: colors.textMuted,
    },
    clearAllButton: {
      width: 36,
      height: 36,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.dangerSoft,
    },
    trashHeaderIcon: {
      fontSize: 18,
    },
    emptyState: {
      ...typography.body,
      color: colors.textSecondary,
    },
    recentList: {
      gap: spacing.sm,
    },
  });
}
