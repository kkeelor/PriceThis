import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { radii } from '@/theme';

export function CameraViewfinder() {
  const { colors } = useTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.frame}>
        <View style={[styles.corner, styles.topLeft, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.accent }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.accent }]} />
      </View>
    </View>
  );
}

const CORNER = 28;
const THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  frame: {
    width: '100%',
    aspectRatio: 0.78,
    maxHeight: '62%',
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
