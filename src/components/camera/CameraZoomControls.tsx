import { useCallback, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/Button';
import { formatDisplayZoomLabel, toDisplayZoomFactor } from '@/utils/cameraZoom';
import { radii, spacing, typography } from '@/theme';

type CameraZoomControlsProps = {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  oneXZoom: number;
  disabled?: boolean;
  onZoomChange: (zoom: number) => void;
};

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;

function clampZoom(value: number, minZoom: number, maxZoom: number): number {
  return Math.min(maxZoom, Math.max(minZoom, value));
}

function zoomFromRatio(ratio: number, minZoom: number, maxZoom: number): number {
  const clamped = Math.max(0, Math.min(1, ratio));
  return minZoom + clamped * (maxZoom - minZoom);
}

function ratioFromZoom(zoom: number, minZoom: number, maxZoom: number): number {
  if (maxZoom <= minZoom) {
    return 0;
  }
  return (zoom - minZoom) / (maxZoom - minZoom);
}

export function CameraZoomControls({
  zoom,
  minZoom,
  maxZoom,
  oneXZoom,
  disabled = false,
  onZoomChange,
}: CameraZoomControlsProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const displayFactor = toDisplayZoomFactor(zoom, oneXZoom);
  const thumbOffset = ratioFromZoom(zoom, minZoom, maxZoom) * Math.max(trackWidth - THUMB_SIZE, 0);

  const applyZoomAtX = useCallback(
    (x: number) => {
      if (trackWidthRef.current <= 0) {
        return;
      }

      const ratio = x / trackWidthRef.current;
      onZoomChange(clampZoom(zoomFromRatio(ratio, minZoom, maxZoom), minZoom, maxZoom));
    },
    [maxZoom, minZoom, onZoomChange],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: event => {
          applyZoomAtX(event.nativeEvent.locationX);
        },
        onPanResponderMove: event => {
          applyZoomAtX(event.nativeEvent.locationX);
        },
      }),
    [applyZoomAtX, disabled, zoom],
  );

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  }, []);

  if (maxZoom <= minZoom) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AppText style={styles.label}>{formatDisplayZoomLabel(displayFactor)}</AppText>
      <View
        style={[styles.trackWrap, disabled && styles.disabled]}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: thumbOffset + THUMB_SIZE / 2,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              transform: [{ translateX: thumbOffset }],
            },
          ]}
        />
      </View>
      <AppText style={styles.edgeLabel}>{formatDisplayZoomLabel(toDisplayZoomFactor(maxZoom, oneXZoom))}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    minWidth: 220,
  },
  label: {
    ...typography.caption,
    color: '#F7F3EA',
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  edgeLabel: {
    ...typography.caption,
    color: 'rgba(247, 243, 234, 0.65)',
    minWidth: 24,
    textAlign: 'right',
  },
  trackWrap: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    overflow: 'hidden',
  },
  fill: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(247, 243, 234, 0.85)',
  },
  thumb: {
    position: 'absolute',
    top: (32 - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#F7F3EA',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.25)',
  },
});
