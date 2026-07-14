import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { brandStops } from '@/theme';

type SpectrumFillProps = {
  width: number;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Full-bleed logo spectrum fill for CTAs and FAB. */
export function SpectrumFill({
  width,
  height,
  borderRadius = 0,
  style,
}: SpectrumFillProps) {
  const id = `spectrum-fill-${width}x${height}`;

  return (
    <View style={[styles.clip, { width, height, borderRadius }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={brandStops.gold} />
            <Stop offset="35%" stopColor={brandStops.magenta} />
            <Stop offset="70%" stopColor={brandStops.violet} />
            <Stop offset="100%" stopColor={brandStops.teal} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={borderRadius}
          ry={borderRadius}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
}

type SpectrumRingProps = {
  size: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** Circular spectrum stroke for scanning pulse. */
export function SpectrumRing({
  size,
  strokeWidth = 3,
  style,
}: SpectrumRingProps) {
  const id = `spectrum-ring-${size}`;
  const r = (size - strokeWidth) / 2;
  const c = size / 2;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={brandStops.gold} />
            <Stop offset="35%" stopColor={brandStops.magenta} />
            <Stop offset="70%" stopColor={brandStops.violet} />
            <Stop offset="100%" stopColor={brandStops.teal} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={strokeWidth}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
