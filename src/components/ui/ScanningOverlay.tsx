import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/Button';
import { colors, spacing, typography } from '@/theme';

type ScanningOverlayProps = {
  visible: boolean;
  message?: string;
};

export function ScanningOverlay({
  visible,
  message = 'Analyzing…',
}: ScanningOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator color={colors.accent} size="large" />
          <AppText style={styles.message}>{message}</AppText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 220,
  },
  message: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
