import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CameraDevice, CameraRef } from 'react-native-vision-camera';

import { AppText } from '@/components/ui/Button';
import { radii, spacing, typography } from '@/theme';

type CameraZoomControlsProps = {
  device: CameraDevice;
  cameraRef: React.RefObject<CameraRef | null>;
  disabled?: boolean;
};

function buildZoomPresets(device: CameraDevice): number[] {
  const { minZoom, maxZoom, zoomLensSwitchFactors } = device;
  const candidates =
    zoomLensSwitchFactors.length > 0
      ? [minZoom, ...zoomLensSwitchFactors]
      : [minZoom, minZoom * 2, Math.min(minZoom * 4, maxZoom)];

  return [...new Set(candidates)]
    .filter(zoom => zoom >= minZoom && zoom <= maxZoom)
    .slice(0, 4);
}

function formatZoomLabel(zoom: number, minZoom: number): string {
  const factor = zoom / minZoom;
  if (factor < 1.1) {
    return '1×';
  }
  if (factor < 1.6) {
    return '1.5×';
  }
  if (factor < 2.5) {
    return '2×';
  }
  if (factor < 3.5) {
    return '3×';
  }
  if (factor < 5.5) {
    return '5×';
  }
  return `${Math.round(factor)}×`;
}

export function CameraZoomControls({
  device,
  cameraRef,
  disabled = false,
}: CameraZoomControlsProps) {
  const presets = useMemo(() => buildZoomPresets(device), [device]);

  const applyZoom = useCallback(
    (zoom: number) => {
      cameraRef.current?.startZoomAnimation(zoom, 3);
    },
    [cameraRef],
  );

  if (presets.length <= 1) {
    return null;
  }

  return (
    <View style={styles.row}>
      {presets.map(zoom => (
        <Pressable
          key={zoom}
          disabled={disabled}
          onPress={() => applyZoom(zoom)}
          style={({ pressed }) => [
            styles.chip,
            pressed && !disabled && styles.chipPressed,
            disabled && styles.chipDisabled,
          ]}>
          <AppText style={styles.label}>{formatZoomLabel(zoom, device.minZoom)}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  chip: {
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    alignItems: 'center',
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    ...typography.caption,
    color: '#F7F3EA',
    fontWeight: '600',
  },
});
