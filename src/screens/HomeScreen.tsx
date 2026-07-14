import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { Logo } from '@/components/brand/Logo';
import { TryExampleChips } from '@/components/home/TryExampleChips';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { SettingsMenu } from '@/components/settings/SettingsMenu';
import { AppText, Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { Screen } from '@/components/ui/Screen';
import { SearchBar } from '@/components/ui/SearchBar';
import { useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useScan } from '@/hooks/useScan';
import type { HomeScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ScanMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const {
    width: screenWidth,
    height: screenHeight,
    insets,
    isCompact,
    isWide,
    contentFrameStyle,
    horizontalGutter,
  } = useResponsiveLayout();
  const cameraButtonSize = isWide ? 96 : isCompact ? 80 : 88;
  const scanMenuWidth = Math.min(screenWidth - horizontalGutter * 2, 280);
  const styles = createStyles(colors, isDark, cameraButtonSize);
  const cameraAnchorRef = useRef<View>(null);
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

  const menuPosition = useMemo(() => {
    if (!scanMenuAnchor) {
      return null;
    }

    // Approximate menu height (two buttons + gaps + card padding).
    const estimatedMenuHeight = 148;
    const margin = spacing.md;
    const maxTop =
      screenHeight - insets.bottom - estimatedMenuHeight - margin;
    const centeredLeft = Math.min(
      Math.max(scanMenuAnchor.x + scanMenuAnchor.width / 2 - scanMenuWidth / 2, margin),
      screenWidth - scanMenuWidth - margin,
    );
    const preferredTop =
      scanMenuAnchor.y + scanMenuAnchor.height / 2 - estimatedMenuHeight / 2;

    return {
      top: Math.max(insets.top + margin, Math.min(preferredTop, maxTop)),
      left: centeredLeft,
      width: scanMenuWidth,
    };
  }, [insets.bottom, insets.top, scanMenuAnchor, scanMenuWidth, screenHeight, screenWidth]);

  return (
    <Screen>
      <ScanningOverlay visible={isScanning} message="Analyzing your photo…" />

      <View style={[styles.topBar, contentFrameStyle]}>
        <SettingsMenu />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, contentFrameStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Logo size={isWide ? 'lg' : 'md'} shape="circle" style={styles.logoMark} />
          <AppText style={styles.wordmark} numberOfLines={1} adjustsFontSizeToFit>
            PriceThis
          </AppText>
          <AppText style={styles.tagline}>
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

        <TryExampleChips
          onSelect={query => navigation.navigate('Search', { initialQuery: query })}
        />

        <View style={styles.scanSection}>
          <View ref={cameraAnchorRef} collapsable={false} style={styles.cameraAnchor}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan or upload a photo"
              accessibilityState={{ expanded: scanMenuOpen }}
              onPress={toggleScanMenu}
              style={[styles.cameraButton, scanMenuOpen && styles.cameraButtonActive]}>
              <CameraIcon size={isCompact ? 32 : 36} color={colors.textOnAccent} />
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
            {menuPosition ? (
              <Pressable
                style={[styles.scanMenuAnchor, menuPosition]}
                onPress={() => {}}>
                <GlassCard style={styles.scanMenu}>
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
      </ScrollView>
    </Screen>
  );
}

function createStyles(colors: ThemeColors, isDark: boolean, cameraButtonSize: number) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.sm,
      marginBottom: -spacing.md,
      width: '100%',
    },
    scroll: {
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
      flexGrow: 1,
      width: '100%',
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
      textAlign: 'center',
    },
    helper: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 420,
      alignSelf: 'center',
      width: '100%',
    },
    scanSection: {
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
    },
    cameraAnchor: {
      width: cameraButtonSize,
      height: cameraButtonSize,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cameraButton: {
      width: cameraButtonSize,
      height: cameraButtonSize,
      borderRadius: cameraButtonSize / 2,
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
    },
    cameraHint: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    scanMenu: {
      gap: spacing.sm,
      width: '100%',
    },
  });
}
