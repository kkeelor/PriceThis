import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
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
import { useScan } from '@/hooks/useScan';
import { useVolumeShutter } from '@/hooks/useVolumeShutter';
import type { CameraScreenProps } from '@/navigation/types';
import { spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';
import { arrayBufferToBase64 } from '@/utils/base64';
import { computeOneXZoom, resolveDefaultZoom } from '@/utils/cameraZoom';

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function CameraScreen({ navigation }: CameraScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const cameraRef = useRef<CameraRef>(null);
  const isCapturingRef = useRef(false);
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.HD_16_9,
    quality: 0.7,
    qualityPrioritization: 'speed',
  });
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isReady, setIsReady] = useState(false);
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
      <Screen>
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
      <Screen>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText style={styles.message}>Starting camera…</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <ScanningOverlay visible={isScanning} message="Identifying object…" />

      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isScanning}
        outputs={[photoOutput]}
        onPreviewStarted={handlePreviewStarted}
      />

      <CameraViewfinder />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Button label="Close" variant="ghost" onPress={handleClose} />
        </View>

        <CameraZoomControls
          zoom={zoom}
          minZoom={zoomLimits.min}
          maxZoom={zoomLimits.max}
          oneXZoom={oneXZoom}
          disabled={!isReady || isScanning}
          onZoomChange={handleZoomChange}
        />

        <View style={styles.bottomBar}>
          <AppText style={styles.hint}>
            {isReady
              ? 'Slide to zoom. Volume buttons also capture. Point at something valuable, then tap to scan.'
              : 'Opening camera…'}
          </AppText>
          <Button
            label={isScanning ? 'Scanning…' : 'Tap to Scan'}
            disabled={!isReady || isScanning}
            onPress={() => void handleScan()}
          />
          <Button
            label="Search instead"
            variant="ghost"
            onPress={() => navigation.navigate('Search')}
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
      padding: spacing.lg,
    },
    topBar: {
      alignItems: 'flex-start',
    },
    bottomBar: {
      gap: spacing.md,
      paddingBottom: spacing.xl,
    },
    hint: {
      ...typography.body,
      color: '#F7F3EA',
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      padding: spacing.md,
      borderRadius: 16,
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
