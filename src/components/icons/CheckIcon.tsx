import { StyleSheet, View } from 'react-native';

type CheckIconProps = {
  size?: number;
  color?: string;
  stroke?: number;
};

export function CheckIcon({ size = 22, color = '#248A3D', stroke = 2.5 }: CheckIconProps) {
  const arm = size * 0.52;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View
        style={[
          styles.check,
          {
            width: arm,
            height: arm * 0.52,
            borderLeftWidth: stroke,
            borderBottomWidth: stroke,
            borderColor: color,
            borderBottomLeftRadius: stroke,
            transform: [
              { rotate: '-45deg' },
              { translateX: -size * 0.04 },
              { translateY: -size * 0.06 },
            ],
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
  check: {
    position: 'absolute',
  },
});
