import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
  type CameraRef,
} from 'react-native-vision-camera';

import { CameraViewfinder } from '@/components/camera/CameraViewfinder';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useScan } from '@/hooks/useScan';
import type { CameraScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';
import { arrayBufferToBase64 } from '@/utils/base64';
import { resolveDefaultZoom } from '@/utils/cameraZoom';

type PreviewLayout = {
  width: number;
  height: number;
};

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function CameraScreen({ navigation }: CameraScreenProps) {
  const { colors } = useTheme();
  const { insets, isShort, isCompact, horizontalGutter } = useResponsiveLayout();
  const styles = createStyles(colors);
  const cameraRef = useRef<CameraRef>(null);
  const isCapturingRef = useRef(false);
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.HD_4_3,
    quality: 0.7,
    qualityPrioritization: 'speed',
  });
  const { hasPermission, canRequestPermission, requestPermission } = useCameraPermission();
  const [isReady, setIsReady] = useState(false);
  const [cameraLookupTimedOut, setCameraLookupTimedOut] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<PreviewLayout | null>(null);
  const { isScanning, runImageScan } = useScan({
    onSuccess: result => {
      navigation.replace('Result', { result });
    },
  });

  useEffect(() => {
    if (!hasPermission && canRequestPermission) {
      requestPermission();
    }
  }, [canRequestPermission, hasPermission, requestPermission]);

  useEffect(() => {
    if (device || !hasPermission) {
      setCameraLookupTimedOut(false);
      return;
    }

    const timer = setTimeout(() => setCameraLookupTimedOut(true), 1500);
    return () => clearTimeout(timer);
  }, [device, hasPermission]);

  const applyDefaultZoom = useCallback(async () => {
    const controller = cameraRef.current?.controller;
    if (!controller) {
      return;
    }

    const targetZoom = resolveDefaultZoom(controller);
    await controller.setZoom(targetZoom);
    await waitForNextFrame();
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePermission = useCallback(() => {
    if (canRequestPermission) {
      requestPermission();
      return;
    }
    Linking.openSettings();
  }, [canRequestPermission, requestPermission]);

  const handleScan = useCallback(async () => {
    if (!isReady || isScanning || isCapturingRef.current) {
      return;
    }

    const controller = cameraRef.current?.controller;
    if (!controller?.isConnected) {
      return;
    }

    isCapturingRef.current = true;

    try {
      const photo = await photoOutput.capturePhoto({}, {});
      let imageBase64: string;
      let tempPath: string;
      try {
        const fileData = await photo.getFileDataAsync();
        imageBase64 = arrayBufferToBase64(fileData);
        tempPath = await photo.saveToTemporaryFileAsync();
      } finally {
        photo.dispose();
      }
      await runImageScan(imageBase64, {
        heroImageUri: `file://${tempPath}`,
        source: 'camera',
      });
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : 'Could not capture photo';
      Alert.alert('Capture failed', message);
    } finally {
      isCapturingRef.current = false;
    }
  }, [isReady, isScanning, photoOutput, runImageScan]);

  const handlePreviewStarted = useCallback(() => {
    applyDefaultZoom().finally(() => {
      setIsReady(true);
    });
  }, [applyDefaultZoom]);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) {
      return;
    }

    setPreviewLayout(current => {
      if (current && current.width === width && current.height === height) {
        return current;
      }
      return { width, height };
    });
  }, []);

  if (!hasPermission) {
    return (
      <Screen safeBottom>
        <View style={styles.centered}>
          <AppText style={styles.message}>
            {canRequestPermission
              ? 'Camera access is required to scan objects.'
              : 'Camera access is disabled. Enable it in system settings to scan objects.'}
          </AppText>
          <Button
            label={canRequestPermission ? 'Grant permission' : 'Open settings'}
            onPress={handlePermission}
          />
          <Button label="Search instead" onPress={() => navigation.navigate('Search')} />
          <Button label="Go back" variant="ghost" onPress={handleClose} />
        </View>
      </Screen>
    );
  }

  if (!device) {
    return (
      <Screen safeBottom>
        <View style={styles.centered}>
          {cameraLookupTimedOut ? (
            <>
              <AppText style={styles.message}>
                No compatible rear camera was found on this device.
              </AppText>
              <Button label="Search instead" onPress={() => navigation.navigate('Search')} />
              <Button label="Go back" variant="ghost" onPress={handleClose} />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.accent} size="large" />
              <AppText style={styles.message}>Starting camera…</AppText>
            </>
          )}
        </View>
      </Screen>
    );
  }

  const topPad = Math.max(insets.top, spacing.md);
  const bottomPad = Math.max(insets.bottom, spacing.md);
  return (
    <View style={styles.container} onLayout={handlePreviewLayout}>
      <ScanningOverlay visible={isScanning} message="Identifying object…" />

      {previewLayout ? (
        <Camera
          ref={cameraRef}
          style={[
            styles.preview,
            { width: previewLayout.width, height: previewLayout.height },
          ]}
          device={device}
          isActive={!isScanning}
          outputs={[photoOutput]}
          resizeMode="cover"
          implementationMode="compatible"
          enableNativeZoomGesture
          onPreviewStarted={handlePreviewStarted}
        />
      ) : null}

      <CameraViewfinder />

      <View
        style={[styles.overlay, { paddingHorizontal: horizontalGutter }]}
        pointerEvents="box-none">
        <View style={[styles.topBar, { paddingTop: topPad }]}>
          <Button
            label="Close"
            variant="ghost"
            onPress={handleClose}
            style={styles.chromeButton}
          />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          {!isShort ? (
            <AppText style={styles.hint} numberOfLines={2}>
              {isReady
                ? 'Good light · include the brand if you see it'
                : 'Opening camera…'}
            </AppText>
          ) : null}
          <Button
            label={isScanning ? 'Scanning…' : 'Tap to Scan'}
            disabled={!isReady || isScanning}
            fullWidth
            onPress={() => handleScan()}
          />
          <Button
            label="Search instead"
            variant="ghost"
            onPress={() => navigation.navigate('Search')}
            style={[styles.chromeButton, isCompact && styles.compactGhost]}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    preview: {
      position: 'absolute',
      top: 0,
      left: 0,
    },
    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'space-between',
    },
    topBar: {
      alignItems: 'flex-start',
    },
    bottomBar: {
      gap: spacing.sm,
      alignItems: 'stretch',
    },
    hint: {
      ...typography.caption,
      color: '#F4F6FB',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 14,
      alignSelf: 'center',
      maxWidth: '100%',
    },
    chromeButton: {
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    compactGhost: {
      minHeight: 40,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
