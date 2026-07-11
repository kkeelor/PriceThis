import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';

import { ScanningOverlay } from '@/components/ui/ScanningOverlay';
import { AppText, Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { useScan } from '@/hooks/useScan';
import type { CameraScreenProps } from '@/navigation/types';
import { colors, spacing, typography } from '@/theme';
import { arrayBufferToBase64 } from '@/utils/base64';

export function CameraScreen({ navigation }: CameraScreenProps) {
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.HD_16_9,
    quality: 0.7,
    qualityPrioritization: 'speed',
  });
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isReady, setIsReady] = useState(false);

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

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleScan = useCallback(async () => {
    if (!isReady || isScanning) {
      return;
    }

    try {
      const photo = await photoOutput.capturePhoto({}, {});
      const fileData = await photo.getFileDataAsync();
      const imageBase64 = arrayBufferToBase64(fileData);
      photo.dispose();
      await runImageScan(imageBase64);
    } catch (captureError) {
      const message =
        captureError instanceof Error ? captureError.message : 'Could not capture photo';
      Alert.alert('Capture failed', message);
    }
  }, [isReady, isScanning, photoOutput, runImageScan]);

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
          <ActivityIndicator color={colors.accent} />
          <AppText style={styles.message}>Starting camera…</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <ScanningOverlay visible={isScanning} message="Identifying object…" />

      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!isScanning}
        outputs={[photoOutput]}
        onPreviewStarted={() => setIsReady(true)}
      />

      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <Button label="Close" variant="ghost" onPress={handleClose} />
        </View>

        <View style={styles.bottomBar}>
          <AppText style={styles.hint}>
            {isReady
              ? 'Point at something valuable, then tap to scan.'
              : 'Opening camera…'}
          </AppText>
          <Button
            label={isScanning ? 'Scanning…' : 'Tap to Scan'}
            disabled={!isReady || isScanning}
            onPress={() => void handleScan()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textPrimary,
    textAlign: 'center',
    backgroundColor: colors.overlay,
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
