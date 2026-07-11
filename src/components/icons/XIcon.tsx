import { StyleSheet, View } from 'react-native';

type XIconProps = {
  size?: number;
  color?: string;
  stroke?: number;
};

export function XIcon({ size = 22, color = '#C9342A', stroke = 2.5 }: XIconProps) {
  const bar = size * 0.58;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.bar,
          {
            width: bar,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.bar,
          {
            width: bar,
            height: stroke,
            backgroundColor: color,
            borderRadius: stroke,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
  },
});
