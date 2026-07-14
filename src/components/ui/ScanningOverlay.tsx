import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { SpectrumFill, SpectrumRing } from '@/components/brand/Spectrum';
import { AppText } from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { radii, spacing, typography } from '@/theme';
import type { ThemeColors } from '@/theme/types';

type ScanningOverlayProps = {
  visible: boolean;
  message?: string;
};

const RING_SIZE = 72;
const CORE_SIZE = 16;

export function ScanningOverlay({
  visible,
  message = 'Analyzing…',
}: ScanningOverlayProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (!visible) {
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 900, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0.45, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [opacity, scale, visible]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.ringContainer}>
            <Animated.View style={[styles.ringWrap, ringStyle]}>
              <SpectrumRing size={RING_SIZE} strokeWidth={3} />
            </Animated.View>
            <View style={styles.core}>
              <SpectrumFill
                width={CORE_SIZE}
                height={CORE_SIZE}
                borderRadius={CORE_SIZE / 2}
              />
            </View>
          </View>
          <AppText style={styles.message}>{message}</AppText>
          <AppText style={styles.subtitle}>Finding value and surprises…</AppText>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.xl,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    ringContainer: {
      width: RING_SIZE,
      height: RING_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringWrap: {
      position: 'absolute',
      width: RING_SIZE,
      height: RING_SIZE,
    },
    core: {
      width: CORE_SIZE,
      height: CORE_SIZE,
      borderRadius: CORE_SIZE / 2,
      overflow: 'hidden',
    },
    message: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
