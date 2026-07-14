import { StyleSheet, View } from 'react-native';

type CameraIconProps = {
  size?: number;
  color?: string;
};

export function CameraIcon({ size = 28, color = '#F4F6FB' }: CameraIconProps) {
  const bodyW = size;
  const bodyH = size * 0.72;
  const lens = size * 0.34;

  return (
    <View style={[styles.wrap, { width: bodyW, height: size }]}>
      <View
        style={[
          styles.bump,
          {
            width: bodyW * 0.38,
            height: size * 0.14,
            borderColor: color,
            top: 0,
          },
        ]}
      />
      <View
        style={[
          styles.body,
          {
            width: bodyW,
            height: bodyH,
            borderColor: color,
            bottom: 0,
          },
        ]}>
        <View
          style={[
            styles.lens,
            {
              width: lens,
              height: lens,
              borderColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bump: {
    position: 'absolute',
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  body: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lens: {
    borderWidth: 2,
    borderRadius: 999,
  },
});
