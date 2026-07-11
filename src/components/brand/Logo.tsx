import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

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
  style?: StyleProp<ImageStyle>;
};

export function Logo({ size = 'md', style }: LogoProps) {
  const dimension = sizes[size];

  return (
    <Image
      source={sources[size]}
      style={[styles.base, { width: dimension, height: dimension }, style]}
      resizeMode="contain"
      accessibilityLabel="PriceThis logo"
    />
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'center',
  },
});
