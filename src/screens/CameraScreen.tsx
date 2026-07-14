import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
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
import { CameraZoomControls } from '@/components/camera/CameraZoomControls';
import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useScan } from '@/hooks/useScan';
import { useVolumeShutter } from '@/hooks/useVolumeShutter';
import type { CameraScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';
import { arrayBufferToBase64 } from '@/utils/base64';
import { computeOneXZoom, resolveDefaultZoom } from '@/utils/cameraZoom';

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
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isReady, setIsReady] = useState(false);
  const [previewLayout, setPreviewLayout] = useState<PreviewLayout | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomLimits, setZoomLimits] = useState({ min: 1, max: 1 });
  const [oneXZoom, setOneXZoom] = useState(1);

  const { isScanning, runImageScan } = useScan({
    onSuccess: result => {
      navigation.replace('Result', { result });
    },
  });

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const applyDefaultZoom = useCallback(async () => {
    const controller = cameraRef.current?.controller;
    if (!controller) {
      return;
    }

    const reference = computeOneXZoom(controller);
    const targetZoom = resolveDefaultZoom(controller);
    await controller.setZoom(targetZoom);
    await waitForNextFrame();

    const settledReference = computeOneXZoom(controller);
    const oneX = settledReference > 0 ? settledReference : reference;

    setOneXZoom(oneX);
    setZoom(controller.zoom);
    setZoomLimits({
      min: oneX,
      max: controller.maxZoom,
    });
  }, []);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

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
      const fileData = await photo.getFileDataAsync();
      const imageBase64 = arrayBufferToBase64(fileData);
      const tempPath = await photo.saveToTemporaryFileAsync();
      photo.dispose();
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

  useVolumeShutter({
    enabled: isReady && !isScanning,
    onCapture: () => {
      void handleScan();
    },
  });

  const handlePreviewStarted = useCallback(() => {
    void applyDefaultZoom().finally(() => {
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

  const handleZoomChange = useCallback(
    (nextZoom: number) => {
      const clamped = Math.min(zoomLimits.max, Math.max(zoomLimits.min, nextZoom));
      setZoom(clamped);
      void cameraRef.current?.controller?.setZoom(clamped);
    },
    [zoomLimits.max, zoomLimits.min],
  );

  if (!hasPermission) {
    return (
      <Screen safeBottom>
        <View style={styles.centered}>
          <AppText style={styles.message}>
            Camera access is required to scan objects.
          </AppText>
          <Button label="Grant permission" onPress={() => void requestPermission()} />
          <Button label="Go back" variant="ghost" onPress={handleClose} />
        </View>
      </Screen>
    );
  }

  if (!device) {
    return (
      <Screen safeBottom>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText style={styles.message}>Starting camera…</AppText>
        </View>
      </Screen>
    );
  }

  const topPad = Math.max(insets.top, spacing.md);
  const bottomPad = Math.max(insets.bottom, spacing.md);
  const zoomBottom = bottomPad + (isShort ? 118 : 168);

  return (
    <View style={styles.container} onLayout={handlePreviewLayout}>
      <ScanningOverlay visible={isScanning} message="Identifying object…" />

      {previewLayout ? (
        <Camera
          ref={cameraRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: previewLayout.width,
            height: previewLayout.height,
          }}
          device={device}
          isActive={!isScanning}
          outputs={[photoOutput]}
          resizeMode="cover"
          implementationMode="compatible"
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

        <View style={[styles.zoomSlot, { bottom: zoomBottom }]} pointerEvents="box-none">
          <CameraZoomControls
            zoom={zoom}
            minZoom={zoomLimits.min}
            maxZoom={zoomLimits.max}
            oneXZoom={oneXZoom}
            disabled={!isReady || isScanning}
            onZoomChange={handleZoomChange}
          />
        </View>

        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          {!isShort ? (
            <AppText style={styles.hint} numberOfLines={2}>
              {isReady
                ? 'Slide to zoom · volume buttons also capture'
                : 'Opening camera…'}
            </AppText>
          ) : null}
          <Button
            label={isScanning ? 'Scanning…' : 'Tap to Scan'}
            disabled={!isReady || isScanning}
            fullWidth
            onPress={() => void handleScan()}
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
    overlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'space-between',
    },
    topBar: {
      alignItems: 'flex-start',
    },
    zoomSlot: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
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
