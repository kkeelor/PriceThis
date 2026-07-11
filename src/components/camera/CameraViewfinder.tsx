import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

export function CameraViewfinder() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.frame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
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
    borderColor: colors.accent,
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
