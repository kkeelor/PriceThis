import { Image, ImageStyle, StyleProp, StyleSheet, View } from 'react-native';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
type LogoShape = 'square' | 'circle';

const sources = {
  sm: require('../../../assets/images/logo-sm.png'),
  md: require('../../../assets/images/logo-md.png'),
  lg: require('../../../assets/images/logo-lg.png'),
  xl: require('../../../assets/images/logo-xl.png'),
} as const;

const sizes: Record<LogoSize, number> = {
  sm: 48,
  md: 72,
  lg: 112,
  xl: 180,
};

type LogoProps = {
  size?: LogoSize;
  shape?: LogoShape;
  style?: StyleProp<ImageStyle>;
};

export function Logo({ size = 'md', shape = 'square', style }: LogoProps) {
  const dimension = sizes[size];
  const isCircle = shape === 'circle';

  const image = (
    <Image
      source={sources[size]}
      style={[
        styles.image,
        {
          width: dimension,
          height: dimension,
        },
        style,
      ]}
      resizeMode={isCircle ? 'cover' : 'contain'}
      accessibilityLabel="PriceThis logo"
    />
  );

  if (!isCircle) {
    return image;
  }

  return (
    <View
      style={[
        styles.circleFrame,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
        style,
      ]}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
  circleFrame: {
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
