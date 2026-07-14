import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { radii } from '@/theme';

const CORNER = 28;
const THICKNESS = 3;

export function CameraViewfinder() {
  const { colors } = useTheme();
  const { isShort, isCompact } = useResponsiveLayout();
  const pad = isShort || isCompact ? 28 : 48;
  const maxHeight = isShort ? '56%' : '70%';

  return (
    <View style={[styles.container, { padding: pad }]} pointerEvents="none">
      <View style={[styles.frame, { maxHeight }]}>
        <View style={[styles.corner, styles.topLeft, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.accent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '86%',
    aspectRatio: 3 / 4,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: THICKNESS,
    borderLeftWidth: THICKNESS,
    borderTopLeftRadius: radii.sm,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: THICKNESS,
    borderRightWidth: THICKNESS,
    borderTopRightRadius: radii.sm,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: THICKNESS,
    borderLeftWidth: THICKNESS,
    borderBottomLeftRadius: radii.sm,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: THICKNESS,
    borderRightWidth: THICKNESS,
    borderBottomRightRadius: radii.sm,
  },
});
